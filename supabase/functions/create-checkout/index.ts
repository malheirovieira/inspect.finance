import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function asaasBaseUrl(): string {
  const env = Deno.env.get('ASAAS_ENVIRONMENT') ?? 'sandbox';
  return env === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
}

async function asaas<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada');
  const response = await fetch(`${asaasBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: { access_token: apiKey, 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(`Asaas ${path} falhou: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json as T;
}

// Preços em reais (não centavos — a Asaas usa valor decimal) — espelha docs/billing.md.
const PRICES: Record<string, Record<string, number>> = {
  basic: { monthly: 19.9, annual: 190.8 },
  pro: { monthly: 29.9, annual: 287.04 },
  duo: { monthly: 39.9, annual: 383.04 },
};

const PLAN_NAMES: Record<string, string> = { basic: 'Basic', pro: 'Pro', duo: 'Casal' };

interface AsaasCheckout {
  id: string;
  link: string;
  status: string;
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

    const { plan, billingCycle, method } = await req.json();
    const value = PRICES[plan]?.[billingCycle];
    if (!value || !['CREDIT_CARD', 'PIX'].includes(method)) {
      return new Response(JSON.stringify({ error: 'plano, ciclo ou método inválido' }), { status: 400, headers: CORS_HEADERS });
    }

    // A Asaas exige URLs https reais em callback.successUrl/cancelUrl/expiredUrl — em dev local
    // o origin vem como http://localhost:..., que ela rejeita como inválido. Nesse caso caímos
    // no domínio de produção só para as URLs de retorno (não afeta o teste do pagamento em si).
    const rawOrigin = req.headers.get('origin') ?? '';
    const origin = rawOrigin.startsWith('https://') ? rawOrigin : 'https://inspect.finance';
    const externalReference = `${user.id}:${plan}:${billingCycle}`;
    const today = new Date().toISOString().slice(0, 10);

    const body: Record<string, unknown> = {
      billingTypes: [method],
      minutesToExpire: 60,
      externalReference,
      callback: {
        successUrl: `${origin}/app/dashboard?checkout=success`,
        cancelUrl: `${origin}/completar-pagamento`,
        expiredUrl: `${origin}/completar-pagamento`,
      },
      items: [
        {
          name: `inspect.finance ${PLAN_NAMES[plan]}`,
          description: billingCycle === 'annual' ? 'Assinatura anual' : 'Mensalidade',
          quantity: 1,
          value,
        },
      ],
    };

    if (method === 'CREDIT_CARD') {
      // Cartão sempre recorrente (renovação automática) — o valor cheio anual também vira um
      // ciclo YEARLY cobrado uma vez por ano, não uma parcela mensal.
      body.chargeTypes = ['RECURRENT'];
      body.subscription = { cycle: billingCycle === 'annual' ? 'YEARLY' : 'MONTHLY', nextDueDate: today };
    } else {
      // PIX é sempre cobrança avulsa: mensal precisa pagar de novo todo mês, anual é o valor
      // cheio pago uma vez.
      body.chargeTypes = ['DETACHED'];
    }

    const checkout = await asaas<AsaasCheckout>('/checkouts', { method: 'POST', body });

    // A Asaas não copia o externalReference pro pagamento/assinatura gerados a partir do
    // checkout (confirmado em teste real: chega `null` no webhook) — guardamos aqui o vínculo
    // usuário/plano/ciclo pelo id do checkout, que o webhook resolve via `payment.checkoutSession`.
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: sessionError } = await serviceClient
      .from('checkout_sessions')
      .insert({ id: checkout.id, user_id: user.id, plan, billing_cycle: billingCycle });
    if (sessionError) throw sessionError;

    return new Response(JSON.stringify({ link: checkout.link }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('create-checkout falhou:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
