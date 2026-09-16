-- ============================================================================
-- Migration 004: idempotência de webhook, plans data-driven, grace period,
-- onboarding.
-- ============================================================================

CREATE TABLE webhook_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT NOT NULL DEFAULT 'abacatepay',
  event_id     TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider, event_id)
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Sem policy pública: só service_role (Edge Function do webhook) acessa.

CREATE TABLE plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE CHECK (name IN ('basic', 'pro', 'duo')),
  display_name TEXT NOT NULL,
  features     JSONB NOT NULL DEFAULT '[]',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans: leitura pública" ON plans FOR SELECT USING (TRUE);

INSERT INTO plans (name, display_name, features) VALUES
  ('basic', 'Basic', '["dashboard_basic","transactions","financial_agenda","goals_basic","economy_tracking","reports_basic"]'),
  ('pro', 'Pro', '["dashboard_basic","dashboard_advanced","transactions","financial_agenda","goals_basic","goals_advanced","economy_tracking","ai_insights","bank_integration","reports_basic","reports_advanced"]'),
  ('duo', 'Casal', '["dashboard_basic","dashboard_advanced","transactions","financial_agenda","goals_basic","goals_advanced","economy_tracking","ai_insights","bank_integration","reports_basic","reports_advanced","duo_view"]');

ALTER TABLE subscriptions ADD COLUMN grace_period_end TIMESTAMPTZ;

ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN onboarding_answers JSONB;
