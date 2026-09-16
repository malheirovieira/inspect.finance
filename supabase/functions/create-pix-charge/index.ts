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

interface AbacatePayPix {
  id: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

// Preços em centavos — espelha docs/billing.md. Anual já é o valor cheio do ano com desconto.
const PRICES: Record<string, Record<string, number>> = {
  basic: { monthly: 1990, annual: 19080 },
  pro: { monthly: 2990, annual: 28704 },
  duo: { monthly: 3990, annual: 38304 },
};

const PLAN_NAMES: Record<string, string> = { basic: 'Basic', pro: 'Pro', duo: 'Casal' };

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

    const { plan, billingCycle } = await req.json();
    const amount = PRICES[plan]?.[billingCycle];
    if (!amount) {
      return new Response(JSON.stringify({ error: 'plano ou ciclo inválido' }), { status: 400, headers: CORS_HEADERS });
    }

    const description =
      billingCycle === 'annual'
        ? `inspect.finance ${PLAN_NAMES[plan]} — assinatura anual`
        : `inspect.finance ${PLAN_NAMES[plan]} — mensalidade`;

    const pix = await abacatepay<AbacatePayPix>('/transparents/create', {
      method: 'POST',
      body: {
        method: 'PIX',
        data: {
          amount,
          description,
          expiresIn: 3600,
          metadata: { user_id: user.id, plan, billing_cycle: billingCycle },
        },
      },
    });

    return new Response(JSON.stringify(pix), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
