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
    const { data: subscription } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return new Response(JSON.stringify({ error: 'Nenhuma assinatura encontrada' }), { status: 404, headers: CORS_HEADERS });
    }

    // Assinatura via cartão: cancela também do lado da AbacatePay (evita cobrança automática futura).
    if (subscription.external_id?.startsWith('subs_')) {
      await abacatepay('/subscriptions/cancel', { method: 'POST', body: { id: subscription.external_id } });
    }
    // Assinatura via PIX não tem cobrança recorrente na AbacatePay — cancelar aqui só marca a intenção de não renovar.

    const { error } = await serviceClient
      .from('subscriptions')
      .update({ cancel_at_period_end: true, cancelled_at: new Date().toISOString() })
      .eq('id', subscription.id);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
