-- ============================================================================
-- inspect.finance — Migration 001: schema inicial
-- Fonte: /docs/database.md (schema completo)
--
-- Notas de implementação (glue necessária que o doc não detalha em SQL):
--   1. Tabelas foram reordenadas por dependência de FK (recurring_transactions
--      é criada antes de transactions, que a referencia).
--   2. Trigger `handle_new_user` cria a linha em `profiles` automaticamente
--      após o INSERT em `auth.users` — necessário para o fluxo descrito em
--      CLAUDE.md/product.md ("perfil criado automaticamente no primeiro
--      login", onboarding escolhe plano no cadastro). Lê `plan`/`full_name`
--      de `raw_user_meta_data` (enviados pelo signUp do frontend).
--   3. Trigger de audit log genérico aplicado às tabelas financeiras,
--      conforme exigido em CLAUDE.md → "Audit log obrigatório para INSERT,
--      UPDATE, DELETE em tabelas financeiras" e security.md.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               TEXT NOT NULL,
  avatar_url              TEXT,
  base_currency           CHAR(3) NOT NULL DEFAULT 'BRL',
  plan                    TEXT NOT NULL DEFAULT 'basic'
                            CHECK (plan IN ('basic', 'pro', 'duo')),
  plan_status             TEXT NOT NULL DEFAULT 'trial'
                            CHECK (plan_status IN ('trial', 'active', 'cancelled', 'past_due')),
  trial_ends_at           TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  ai_queries_today        INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: próprio usuário" ON profiles
  FOR ALL USING (id = auth.uid());

-- ----------------------------------------------------------------------------
-- duo_links
-- ----------------------------------------------------------------------------
CREATE TABLE duo_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES profiles(id),
  partner_user_id UUID REFERENCES profiles(id),
  invite_email    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'rejected', 'cancelled')),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE duo_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duo_links: participantes" ON duo_links
  FOR ALL USING (
    primary_user_id = auth.uid() OR partner_user_id = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- accounts
-- ----------------------------------------------------------------------------
CREATE TABLE accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  name              TEXT NOT NULL,
  type              TEXT NOT NULL
                      CHECK (type IN ('checking', 'savings', 'credit_card', 'investment', 'cash', 'digital_wallet')),
  institution       TEXT,
  currency          CHAR(3) NOT NULL DEFAULT 'BRL',
  balance           NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit_limit      NUMERIC(15,2),
  color             CHAR(7) DEFAULT '#6366F1',
  icon              TEXT DEFAULT 'building-2',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  pluggy_account_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id) WHERE deleted_at IS NULL;

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts: próprio usuário" ON accounts
  FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL
                CHECK (type IN ('income', 'expense', 'transfer')),
  icon        TEXT NOT NULL DEFAULT 'tag',
  color       CHAR(7) NOT NULL DEFAULT '#64748B',
  parent_id   UUID REFERENCES categories(id),
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_categories_user_id ON categories(user_id) WHERE deleted_at IS NULL;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories: próprias + sistema" ON categories
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "categories: inserir próprias" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories: atualizar próprias" ON categories
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "categories: deletar próprias" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- recurring_transactions (criada antes de `transactions`, que a referencia)
-- ----------------------------------------------------------------------------
CREATE TABLE recurring_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id),
  account_id          UUID NOT NULL REFERENCES accounts(id),
  category_id         UUID REFERENCES categories(id),
  type                TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description         TEXT NOT NULL,
  amount              NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency            CHAR(3) NOT NULL DEFAULT 'BRL',
  frequency           TEXT NOT NULL
                        CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  day_of_month        SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
  start_date          DATE NOT NULL,
  end_date            DATE,
  last_generated_date DATE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurring_transactions: próprio usuário" ON recurring_transactions
  FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- transactions
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES profiles(id),
  account_id               UUID NOT NULL REFERENCES accounts(id),
  category_id              UUID REFERENCES categories(id),
  parent_transaction_id    UUID REFERENCES transactions(id),
  type                     TEXT NOT NULL
                             CHECK (type IN ('income', 'expense', 'transfer')),
  description              TEXT NOT NULL,
  amount                   NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency                 CHAR(3) NOT NULL DEFAULT 'BRL',
  amount_in_base_currency  NUMERIC(15,2) NOT NULL,
  exchange_rate            NUMERIC(10,6) NOT NULL DEFAULT 1.0,
  date                     DATE NOT NULL,
  is_paid                  BOOLEAN NOT NULL DEFAULT TRUE,
  is_recurring             BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id),
  installment_number       SMALLINT,
  total_installments       SMALLINT,
  transfer_to_account_id   UUID REFERENCES accounts(id),
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ,

  CONSTRAINT chk_installments CHECK (
    (installment_number IS NULL AND total_installments IS NULL) OR
    (installment_number IS NOT NULL AND total_installments IS NOT NULL AND
     installment_number BETWEEN 1 AND total_installments)
  )
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account ON transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_parent ON transactions(parent_transaction_id) WHERE parent_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_recurring ON transactions(recurring_transaction_id) WHERE recurring_transaction_id IS NOT NULL;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions: próprio usuário" ON transactions
  FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- goals
-- ----------------------------------------------------------------------------
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  duo_link_id     UUID REFERENCES duo_links(id),
  name            TEXT NOT NULL,
  description     TEXT,
  target_amount   NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency        CHAR(3) NOT NULL DEFAULT 'BRL',
  target_date     DATE,
  color           CHAR(7) DEFAULT '#10B981',
  icon            TEXT DEFAULT 'target',
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_status ON goals(user_id, status);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals: próprias + duo" ON goals
  FOR SELECT USING (
    user_id = auth.uid() OR
    duo_link_id IN (
      SELECT id FROM duo_links
      WHERE primary_user_id = auth.uid() OR partner_user_id = auth.uid()
    )
  );
CREATE POLICY "goals: inserir" ON goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "goals: atualizar" ON goals FOR UPDATE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- goal_contributions
-- ----------------------------------------------------------------------------
CREATE TABLE goal_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id        UUID NOT NULL REFERENCES goals(id),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  transaction_id UUID REFERENCES transactions(id),
  amount         NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal_contributions: participantes da meta" ON goal_contributions
  FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- achievements
-- ----------------------------------------------------------------------------
CREATE TABLE achievements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  icon              TEXT NOT NULL,
  badge_color       CHAR(7) NOT NULL,
  category          TEXT NOT NULL
                      CHECK (category IN ('savings', 'consistency', 'goals', 'milestones', 'social')),
  points            INTEGER NOT NULL DEFAULT 0,
  trigger_condition JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements: leitura pública" ON achievements FOR SELECT USING (TRUE);

-- ----------------------------------------------------------------------------
-- user_achievements
-- ----------------------------------------------------------------------------
CREATE TABLE user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress       JSONB,

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements: próprio usuário" ON user_achievements
  FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- ai_conversations / ai_messages
-- ----------------------------------------------------------------------------
CREATE TABLE ai_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id),
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  tokens_used     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conversations: próprio" ON ai_conversations
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_messages: via conversa própria" ON ai_messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id),
  plan                  TEXT NOT NULL CHECK (plan IN ('basic', 'pro', 'duo')),
  billing_cycle         TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status                TEXT NOT NULL DEFAULT 'trial'
                          CHECK (status IN ('trial', 'active', 'cancelled', 'past_due', 'expired')),
  payment_provider      TEXT NOT NULL DEFAULT 'abacatepay',
  external_id           TEXT,
  amount_cents          INTEGER NOT NULL,
  current_period_start  DATE,
  current_period_end    DATE,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions: própria" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());
-- INSERT/UPDATE somente via Edge Functions com service_role (sem policy — bloqueado por padrão)

-- ----------------------------------------------------------------------------
-- audit_log
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id),
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log: próprio usuário" ON audit_log
  FOR SELECT USING (user_id = auth.uid());
-- INSERT somente via trigger/Edge Function com service_role (sem policy de INSERT — bloqueado por padrão)

-- ============================================================================
-- Triggers automáticos
-- ============================================================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON duo_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Cria o profile automaticamente após o cadastro em auth.users
-- (email/senha ou Google OAuth — ambos passam por aqui).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan, plan_status, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'basic'),
    'trial',
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Audit log — obrigatório para tabelas financeiras (CLAUDE.md → Regras de Segurança)
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_record_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_record_id := COALESCE(NEW.id, OLD.id);

  INSERT INTO audit_log (user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    v_user_id,
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_accounts AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_recurring_transactions AFTER INSERT OR UPDATE OR DELETE ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_goals AFTER INSERT OR UPDATE OR DELETE ON goals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_goal_contributions AFTER INSERT OR UPDATE OR DELETE ON goal_contributions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
