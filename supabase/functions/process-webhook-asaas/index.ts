import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AsaasPayment {
  id: string;
  status?: string;
  subscription?: string; // id da assinatura Asaas, quando o pagamento pertence a uma recorrência
  checkoutSession?: string; // id do checkout que originou o pagamento (só na 1ª cobrança)
}

interface AsaasSubscription {
  id: string;
  status?: string;
}

interface WebhookPayload {
  id: string;
  event: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
}

function periodEnd(billingCycle: string | undefined): string {
  const days = billingCycle === 'annual' ? 365 : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function gracePeriodEnd(): string {
  return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * A Asaas não copia o `externalReference` do checkout pro pagamento/assinatura gerados a partir
 * dele (confirmado em teste real: chega `null`). Resolve o usuário de duas formas:
 * 1. 1º pagamento de um checkout: por `payment.checkoutSession`, contra a tabela
 *    `checkout_sessions` (gravada em create-checkout no momento da criação do checkout).
 * 2. Pagamentos/eventos seguintes (renovação, cancelamento): por `payment.subscription` ou
 *    `subscription.id`, contra `subscriptions.external_id` (gravado na 1ª ativação).
 */
async function resolveRef(
  supabase: ReturnType<typeof createClient>,
  payment: AsaasPayment | undefined,
  subscriptionObj: AsaasSubscription | undefined,
): Promise<{ userId: string; plan: string; billingCycle: string } | null> {
  const checkoutId = payment?.checkoutSession;
  if (checkoutId) {
    const { data } = await supabase
      .from('checkout_sessions')
      .select('user_id, plan, billing_cycle')
      .eq('id', checkoutId)
      .maybeSingle();
    if (data) return { userId: data.user_id, plan: data.plan, billingCycle: data.billing_cycle };
  }

  const externalId = payment?.subscription ?? subscriptionObj?.id ?? null;
  if (externalId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id, plan, billing_cycle')
      .eq('external_id', externalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return { userId: data.user_id, plan: data.plan, billingCycle: data.billing_cycle };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.headers.get('asaas-access-token') !== Deno.env.get('ASAAS_WEBHOOK_TOKEN')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const payload: WebhookPayload = await req.json();
  const { event, payment, subscription } = payload;

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Idempotência: a Asaas pode reentregar o mesmo evento.
  const { error: dedupeError } = await supabase
    .from('webhook_events')
    .insert({ provider: 'asaas', event_id: payload.id, event_type: event, payload });
  if (dedupeError) {
    if (dedupeError.code === '23505') {
      return new Response(JSON.stringify({ duplicate: true }), { status: 200 });
    }
    throw dedupeError;
  }

  const ref = await resolveRef(supabase, payment, subscription);
  if (!ref) {
    return new Response(JSON.stringify({ ignored: true }), { status: 200 });
  }
  const { userId, plan, billingCycle } = ref;

  const { data: latest } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      // `externalId` é o id da assinatura Asaas (recorrência de cartão) ou, pra PIX avulso, o id
      // do próprio pagamento. Cartão: mesma assinatura em todo ciclo → renovação estende o
      // período em vez de duplicar a linha. PIX: cada ciclo é um pagamento novo → linha nova,
      // como já documentado em docs/billing.md.
      const externalId = payment?.subscription ?? payment?.id ?? null;
      await supabase.from('profiles').update({ plan_status: 'active', plan }).eq('id', userId);

      const { data: existingByExternalId } = externalId
        ? await supabase.from('subscriptions').select('id').eq('external_id', externalId).maybeSingle()
        : { data: null };

      if (existingByExternalId) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString().slice(0, 10),
            current_period_end: periodEnd(billingCycle),
          })
          .eq('id', existingByExternalId.id);
      } else {
        await supabase.from('subscriptions').insert({
          user_id: userId,
          plan,
          billing_cycle: billingCycle,
          status: 'active',
          payment_provider: 'asaas',
          external_id: externalId,
          amount_cents: 0,
          current_period_start: new Date().toISOString().slice(0, 10),
          current_period_end: periodEnd(billingCycle),
        });
      }
      break;
    }

    case 'PAYMENT_OVERDUE': {
      // Fora de ordem: vencimento sem assinatura trial/active pra marcar — ignora.
      if (!latest || !['trial', 'active'].includes(latest.status)) {
        console.warn(`overdue ignorado: sem assinatura ativa para user ${userId}`);
        break;
      }
      const grace = gracePeriodEnd();
      await supabase.from('profiles').update({ plan_status: 'past_due' }).eq('id', userId);
      await supabase.from('subscriptions').update({ status: 'past_due', grace_period_end: grace }).eq('id', latest.id);
      break;
    }

    case 'SUBSCRIPTION_DELETED':
    case 'SUBSCRIPTION_INACTIVATED': {
      if (!latest || !['trial', 'active', 'past_due'].includes(latest.status)) {
        console.warn(`cancelamento ignorado: sem assinatura ativa para user ${userId}`);
        break;
      }
      await supabase.from('profiles').update({ plan_status: 'cancelled' }).eq('id', userId);
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', latest.id);
      break;
    }

    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
