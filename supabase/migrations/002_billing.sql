-- ============================================================================
-- inspect.finance — Migration 002: cobrança real via AbacatePay
--
-- 1. billing_products: mapeia plano+ciclo para o ID do produto criado na
--    AbacatePay (usado só pela Edge Function create-subscription, via
--    service_role — sem policy pública).
-- 2. handle_new_user(): removido o trial automático de 14 dias para todos os
--    planos (divergia do CLAUDE.md/docs/billing.md). Agora trial_ends_at
--    fica NULL até a Edge Function de webhook confirmar o pagamento/trial
--    real junto com a AbacatePay.
-- ============================================================================

CREATE TABLE billing_products (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan                   TEXT NOT NULL CHECK (plan IN ('basic', 'pro', 'duo')),
  billing_cycle          TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  abacatepay_product_id  TEXT NOT NULL,
  price_cents            INTEGER NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (plan, billing_cycle)
);

ALTER TABLE billing_products ENABLE ROW LEVEL SECURITY;
-- Sem policy: só acessível via service_role (Edge Functions).

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan, plan_status, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'basic'),
    'trial',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
