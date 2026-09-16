import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ABACATEPAY_BASE_URL = 'https://api.abacatepay.com/v2';

async function abacatepay<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
  if (!apiKey) throw new Error('ABACATEPAY_API_KEY não configurada');
  const response = await fetch(`${ABACATEPAY_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await response.json();
  if (!response.ok || json.error) throw new Error(`AbacatePay ${path} falhou: ${json.error ?? response.statusText}`);
  return json.data as T;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AbacatePaySubscription {
  id: string;
  url: string;
}

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

    const { plan, billingCycle, origin } = await req.json();
    if (!['basic', 'pro', 'duo'].includes(plan) || !['monthly', 'annual'].includes(billingCycle)) {
      return new Response(JSON.stringify({ error: 'plano ou ciclo inválido' }), { status: 400, headers: CORS_HEADERS });
    }

    const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: product, error: productError } = await serviceClient
      .from('billing_products')
      .select('abacatepay_product_id')
      .eq('plan', plan)
      .eq('billing_cycle', billingCycle)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: 'Produto de cobrança não configurado ainda' }), { status: 500, headers: CORS_HEADERS });
    }

    const subscription = await abacatepay<AbacatePaySubscription>('/subscriptions/create', {
      method: 'POST',
      body: {
        items: [{ id: product.abacatepay_product_id, quantity: 1 }],
        externalId: user.id,
        methods: ['CARD'],
        completionUrl: `${origin}/app/dashboard?checkout=success`,
        returnUrl: `${origin}/app/assinatura`,
        metadata: { user_id: user.id, plan, billing_cycle: billingCycle },
      },
    });

    return new Response(JSON.stringify({ url: subscription.url }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
