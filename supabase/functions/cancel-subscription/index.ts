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

async function asaas<T>(path: string, options: { method?: string } = {}): Promise<T> {
  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada');
  const response = await fetch(`${asaasBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: { access_token: apiKey, 'Content-Type': 'application/json' },
  });
  const json = await response.json();
  if (!response.ok || json.errors) throw new Error(`Asaas ${path} falhou: ${JSON.stringify(json.errors ?? json)}`);
  return json as T;
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

    // Assinatura via cartão (recorrente na Asaas): cancela também do lado deles, evitando
    // cobrança automática futura. Assinatura via PIX é sempre avulsa — não há nada recorrente
    // do lado da Asaas pra cancelar.
    if (subscription.external_id?.startsWith('sub_')) {
      await asaas(`/subscriptions/${subscription.external_id}`, { method: 'DELETE' });
    }

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
