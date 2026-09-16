import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TRIAL_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const anonClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: CORS_HEADERS });
    }

    const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Trial grátis (sem cartão) é único por cliente — se já existe qualquer assinatura anterior
    // (trial anterior, cartão ou PIX), não libera de novo.
    const { data: existing } = await serviceClient.from('subscriptions').select('id').eq('user_id', user.id).limit(1).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: 'Você já usou seu período gratuito nesta conta.' }), { status: 409, headers: CORS_HEADERS });
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({ plan: 'basic', plan_status: 'trial', trial_ends_at: trialEndsAt })
      .eq('id', user.id);
    if (profileError) throw profileError;

    const { error: subscriptionError } = await serviceClient.from('subscriptions').insert({
      user_id: user.id,
      plan: 'basic',
      billing_cycle: 'monthly',
      status: 'trial',
      payment_provider: 'none',
      amount_cents: 0,
    });
    if (subscriptionError) throw subscriptionError;

    return new Response(JSON.stringify({ trialEndsAt }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
