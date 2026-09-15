# Database — inspect.finance

## Visão Geral

PostgreSQL via Supabase com Row Level Security (RLS) em todas as tabelas.
Todas as tabelas de dados de usuário têm: `created_at`, `updated_at`, `deleted_at` (soft delete).
Timestamps sempre em UTC. Conversão para fuso do usuário feita no frontend.

---

## Schema Completo

### `profiles`
Extensão do `auth.users` do Supabase.

```sql
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

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: próprio usuário" ON profiles
  FOR ALL USING (id = auth.uid());
```

---

### `duo_links`
Vínculo entre dois usuários no plano Duo.

```sql
CREATE TABLE duo_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES profiles(id),
  partner_user_id UUID REFERENCES profiles(id),    -- null até aceitar convite
  invite_email    TEXT,                             -- email do parceiro convidado
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'rejected', 'cancelled')),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE duo_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duo_links: participantes" ON duo_links
  FOR ALL USING (
    primary_user_id = auth.uid() OR partner_user_id = auth.uid()
  );
```

---

### `accounts`
Contas bancárias, carteiras, cartões de crédito, investimentos.

```sql
CREATE TABLE accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  name              TEXT NOT NULL,
  type              TEXT NOT NULL
                      CHECK (type IN ('checking', 'savings', 'credit_card', 'investment', 'cash', 'digital_wallet')),
  institution       TEXT,                    -- nome do banco ou instituição
  currency          CHAR(3) NOT NULL DEFAULT 'BRL',
  balance           NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit_limit      NUMERIC(15,2),           -- apenas para credit_card
  color             CHAR(7) DEFAULT '#6366F1',  -- hex color para UI
  icon              TEXT DEFAULT 'building-2',   -- Lucide icon name
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  pluggy_account_id TEXT,                    -- ID externo (integração bancária Pro — V1)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ              -- soft delete
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts: próprio usuário" ON accounts
  FOR ALL USING (user_id = auth.uid());
```

---

### `categories`
Categorias padrão (sistema) e personalizadas (usuário).

```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),  -- NULL = categoria do sistema
  name        TEXT NOT NULL,
  type        TEXT NOT NULL
                CHECK (type IN ('income', 'expense', 'transfer')),
  icon        TEXT NOT NULL DEFAULT 'tag',
  color       CHAR(7) NOT NULL DEFAULT '#64748B',
  parent_id   UUID REFERENCES categories(id), -- subcategorias
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_categories_user_id ON categories(user_id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- Usuário vê suas categorias + categorias do sistema
CREATE POLICY "categories: próprias + sistema" ON categories
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "categories: inserir próprias" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories: atualizar próprias" ON categories
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "categories: deletar próprias" ON categories
  FOR DELETE USING (user_id = auth.uid());
```

---

### `transactions`
Núcleo do sistema. Receitas, despesas, transferências e parcelas.

```sql
CREATE TABLE transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES profiles(id),
  account_id               UUID NOT NULL REFERENCES accounts(id),
  category_id              UUID REFERENCES categories(id),
  parent_transaction_id    UUID REFERENCES transactions(id),  -- para parcelas: aponta para transação-mãe
  type                     TEXT NOT NULL
                             CHECK (type IN ('income', 'expense', 'transfer')),
  description              TEXT NOT NULL,
  amount                   NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency                 CHAR(3) NOT NULL DEFAULT 'BRL',
  amount_in_base_currency  NUMERIC(15,2) NOT NULL,  -- convertido para moeda base do usuário
  exchange_rate            NUMERIC(10,6) NOT NULL DEFAULT 1.0,
  date                     DATE NOT NULL,
  is_paid                  BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = lançamento futuro/pendente
  is_recurring             BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id),
  installment_number       SMALLINT,        -- 1, 2, 3... (null = não parcelado)
  total_installments       SMALLINT,        -- total de parcelas (null = não parcelado)
  transfer_to_account_id   UUID REFERENCES accounts(id),  -- destino em transferências
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ      -- soft delete: nunca deletar fisicamente dado financeiro

  CONSTRAINT chk_installments CHECK (
    (installment_number IS NULL AND total_installments IS NULL) OR
    (installment_number IS NOT NULL AND total_installments IS NOT NULL AND
     installment_number BETWEEN 1 AND total_installments)
  )
);

-- Índices críticos para performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account ON transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_parent ON transactions(parent_transaction_id) WHERE parent_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_recurring ON transactions(recurring_transaction_id) WHERE recurring_transaction_id IS NOT NULL;

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions: próprio usuário" ON transactions
  FOR ALL USING (user_id = auth.uid());
```

---

### `recurring_transactions`
Templates para contas e receitas recorrentes.

```sql
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
  end_date            DATE,                 -- null = sem data de término
  last_generated_date DATE,                 -- controle de geração automática
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurring_transactions: próprio usuário" ON recurring_transactions
  FOR ALL USING (user_id = auth.uid());
```

---

### `goals`
Metas de poupança — individuais ou compartilhadas (Duo).

```sql
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  duo_link_id     UUID REFERENCES duo_links(id),  -- null = meta individual
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

-- RLS
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
```

---

### `goal_contributions`
Aportes realizados em uma meta.

```sql
CREATE TABLE goal_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id        UUID NOT NULL REFERENCES goals(id),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  transaction_id UUID REFERENCES transactions(id),
  amount         NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal_contributions: participantes da meta" ON goal_contributions
  FOR ALL USING (user_id = auth.uid());
```

---

### `achievements`
Catálogo de conquistas definido pelo sistema.

```sql
CREATE TABLE achievements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT UNIQUE NOT NULL,   -- ex: 'SENIOR_ECONOMIST'
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  icon              TEXT NOT NULL,
  badge_color       CHAR(7) NOT NULL,
  category          TEXT NOT NULL
                      CHECK (category IN ('savings', 'consistency', 'goals', 'milestones', 'social')),
  points            INTEGER NOT NULL DEFAULT 0,
  trigger_condition JSONB,                  -- regras de desbloqueio automático
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leitura pública — sem RLS (dados não sensíveis)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements: leitura pública" ON achievements FOR SELECT USING (TRUE);
```

---

### `user_achievements`
Conquistas desbloqueadas por usuário.

```sql
CREATE TABLE user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress       JSONB,   -- progresso para conquistas incrementais

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements: próprio usuário" ON user_achievements
  FOR ALL USING (user_id = auth.uid());
```

---

### `ai_conversations` e `ai_messages`

```sql
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

-- RLS em ambas — filtro por user_id via join
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conversations: próprio" ON ai_conversations
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_messages: via conversa própria" ON ai_messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );
```

---

### `subscriptions`

```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id),
  plan                  TEXT NOT NULL CHECK (plan IN ('basic', 'pro', 'duo')),
  billing_cycle         TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status                TEXT NOT NULL DEFAULT 'trial'
                          CHECK (status IN ('trial', 'active', 'cancelled', 'past_due', 'expired')),
  payment_provider      TEXT NOT NULL DEFAULT 'abacatepay',
  external_id           TEXT,              -- ID no AbacatePay
  amount_cents          INTEGER NOT NULL,  -- valor em centavos
  current_period_start  DATE,
  current_period_end    DATE,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions: própria" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());
-- INSERT/UPDATE somente via Edge Functions com service_role
```

---

### `audit_log`
Trilha de auditoria — nunca deleta, só insere.

```sql
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

-- RLS — usuário vê apenas seu próprio log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log: próprio usuário" ON audit_log
  FOR SELECT USING (user_id = auth.uid());
-- INSERT somente via trigger/Edge Function com service_role
```

---

## Triggers Automáticos

```sql
-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas com updated_at:
-- accounts, categories, transactions, recurring_transactions,
-- goals, profiles, subscriptions, ai_conversations, duo_links
```

---

## Moedas Suportadas (seed)

```sql
-- Inserir na tabela de referência ou usar enum
-- BRL, USD, EUR, GBP, ARS
-- Adicionadas conforme demanda
```

---

## Categorias Padrão do Sistema (seed)

**Despesas:** Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Vestuário, Assinaturas, Serviços, Outros

**Receitas:** Salário, Freelance, Investimentos, Presente, Outros

**Transferências:** Transferência (tipo único)

---

## Estratégia de Evolução

1. Migrations numeradas sequencialmente: `001_initial_schema.sql`, `002_add_achievements.sql`, etc.
2. Nunca alterar migrations existentes — sempre criar nova migration
3. Dados de seed em arquivo separado: `supabase/seed.sql`
4. Testar migrations em branch Supabase antes de aplicar em produção
5. Backup automático do Supabase Cloud (PITR — Point in Time Recovery)
