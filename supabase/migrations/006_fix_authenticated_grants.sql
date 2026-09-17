-- ============================================================================
-- Migration 006: corrige grants de tabela para anon/authenticated.
--
-- Descoberta em teste real: nenhuma tabela do schema public tinha SELECT/
-- INSERT/UPDATE/DELETE concedido a anon/authenticated (só REFERENCES/TRIGGER/
-- TRUNCATE) — o Postgres bloqueia a query antes mesmo de avaliar RLS, então
-- toda leitura de `profiles`/`subscriptions`/etc. pelo navegador do cliente
-- falhava com "permission denied", mesmo com as policies de RLS corretas.
-- Provavelmente um efeito colateral da migration 003 (grant_service_role,
-- aplicada só via SQL direto, nunca salva como arquivo). RLS continua sendo
-- a camada real de proteção linha-a-linha — este grant é só o portão de
-- entrada padrão que todo projeto Supabase tem por padrão.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
