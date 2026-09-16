import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TABLES = ['profiles', 'accounts', 'transactions', 'recurring_transactions', 'goals', 'goal_contributions', 'subscriptions'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    // Cliente autenticado como o próprio usuário — RLS já garante que só vem dado dele, sem
    // precisar de service_role (LGPD: exportação dos próprios dados, ver CLAUDE.md → Segurança).
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: CORS_HEADERS });
    }

    const result: Record<string, unknown> = { exported_at: new Date().toISOString(), user_id: user.id, email: user.email };
    for (const table of TABLES) {
      const column = table === 'profiles' ? 'id' : 'user_id';
      const { data, error } = await client.from(table).select('*').eq(column, user.id);
      if (error) throw error;
      result[table] = data;
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="meus-dados.json"' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
