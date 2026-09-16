import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  id: string;
  event: string;
  data: {
    id?: string;
    status?: string;
    amount?: number;
    trialEndsAt?: string;
    metadata?: { user_id?: string; plan?: string; billing_cycle?: string };
    externalId?: string;
  };
}

function periodEnd(billingCycle: string | undefined): string {
  const days = billingCycle === 'annual' ? 365 : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

Deno.serve(async (req) => {
  // A AbacatePay remove query strings do endpoint cadastrado, então o secret vai no path:
  // .../process-webhook-abacatepay/<ABACATEPAY_WEBHOOK_SECRET>
  const url = new URL(req.url);
  const providedSecret = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '');
  if (providedSecret !== Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const payload: WebhookPayload = await req.json();
  const { event, data } = payload;

  const userId = data.metadata?.user_id ?? data.externalId;
  if (!userId) {
    // Nada a identificar — responde 200 para a AbacatePay não ficar reenviando.
    return new Response(JSON.stringify({ ignored: true }), { status: 200 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const plan = data.metadata?.plan;
  const billingCycle = data.metadata?.billing_cycle;

  switch (event) {
    case 'subscription.trial_started': {
      await supabase
        .from('profiles')
        .update({ plan_status: 'trial', trial_ends_at: data.trialEndsAt ?? periodEnd('monthly'), plan: plan ?? undefined })
        .eq('id', userId);
      await supabase.from('subscriptions').insert({
        user_id: userId,
        plan: plan ?? 'basic',
        billing_cycle: billingCycle ?? 'monthly',
        status: 'trial',
        payment_provider: 'abacatepay',
        external_id: data.id,
        amount_cents: data.amount ?? 0,
      });
      break;
    }

    case 'subscription.completed':
    case 'transparent.completed': {
      await supabase
        .from('profiles')
        .update({ plan_status: 'active', plan: plan ?? undefined })
        .eq('id', userId);
      await supabase.from('subscriptions').insert({
        user_id: userId,
        plan: plan ?? 'basic',
        billing_cycle: billingCycle ?? 'monthly',
        status: 'active',
        payment_provider: 'abacatepay',
        external_id: data.id,
        amount_cents: data.amount ?? 0,
        current_period_start: new Date().toISOString().slice(0, 10),
        current_period_end: periodEnd(billingCycle).slice(0, 10),
      });
      break;
    }

    case 'subscription.renewed': {
      await supabase.from('profiles').update({ plan_status: 'active' }).eq('id', userId);
      await supabase
        .from('subscriptions')
        .update({ status: 'active', current_period_end: periodEnd(billingCycle).slice(0, 10) })
        .eq('user_id', userId)
        .in('status', ['trial', 'active']);
      break;
    }

    case 'subscription.cancelled': {
      await supabase.from('profiles').update({ plan_status: 'cancelled' }).eq('id', userId);
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('status', ['trial', 'active']);
      break;
    }

    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
