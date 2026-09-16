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

interface AbacatePayProduct {
  id: string;
}

async function findOrCreateProduct(externalId: string, body: Record<string, unknown>): Promise<AbacatePayProduct> {
  const existing = await abacatepay<AbacatePayProduct[]>(`/products/list?externalId=${encodeURIComponent(externalId)}`);
  if (existing.length > 0) return existing[0];
  return abacatepay<AbacatePayProduct>('/products/create', { method: 'POST', body: { externalId, ...body } });
}

// Preços em centavos — espelha docs/billing.md.
const PRODUCTS: {
  plan: 'basic' | 'pro' | 'duo';
  billingCycle: 'monthly' | 'annual';
  name: string;
  priceCents: number;
  cycle: 'MONTHLY' | 'ANNUALLY';
  trialDays?: number;
}[] = [
  { plan: 'basic', billingCycle: 'monthly', name: 'inspect.finance Basic (mensal)', priceCents: 1990, cycle: 'MONTHLY', trialDays: 7 },
  { plan: 'basic', billingCycle: 'annual', name: 'inspect.finance Basic (anual)', priceCents: 19080, cycle: 'ANNUALLY', trialDays: 7 },
  { plan: 'pro', billingCycle: 'monthly', name: 'inspect.finance Pro (mensal)', priceCents: 2990, cycle: 'MONTHLY' },
  { plan: 'pro', billingCycle: 'annual', name: 'inspect.finance Pro (anual)', priceCents: 28704, cycle: 'ANNUALLY' },
  { plan: 'duo', billingCycle: 'monthly', name: 'inspect.finance Casal (mensal)', priceCents: 3990, cycle: 'MONTHLY' },
  { plan: 'duo', billingCycle: 'annual', name: 'inspect.finance Casal (anual)', priceCents: 38304, cycle: 'ANNUALLY' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  const url = new URL(req.url);
  if (url.searchParams.get('setupKey') !== Deno.env.get('SETUP_SECRET')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: CORS_HEADERS });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const created: string[] = [];
  const skipped: string[] = [];

  for (const product of PRODUCTS) {
    const { data: existing } = await supabase
      .from('billing_products')
      .select('id')
      .eq('plan', product.plan)
      .eq('billing_cycle', product.billingCycle)
      .maybeSingle();

    if (existing) {
      skipped.push(`${product.plan}-${product.billingCycle}`);
      continue;
    }

    const result = await findOrCreateProduct(`${product.plan}-${product.billingCycle}`, {
      name: product.name,
      price: product.priceCents,
      currency: 'BRL',
      cycle: product.cycle,
      ...(product.trialDays ? { trialDays: product.trialDays } : {}),
    });

    const { error } = await supabase.from('billing_products').insert({
      plan: product.plan,
      billing_cycle: product.billingCycle,
      abacatepay_product_id: result.id,
      price_cents: product.priceCents,
    });
    if (error) throw error;

    created.push(`${product.plan}-${product.billingCycle}`);
  }

  return new Response(JSON.stringify({ created, skipped }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
