-- ============================================================================
-- Migration 005: tabela de apoio para reconciliar webhooks da Asaas.
--
-- Descoberta em teste real: o `externalReference` enviado ao criar um checkout
-- (POST /v3/checkouts) não é copiado para o pagamento nem para a assinatura
-- gerados a partir dele — o campo chega `null` nos eventos de webhook. A
-- Asaas só devolve o vínculo via `payment.checkoutSession` (o id do próprio
-- checkout), então guardamos aqui, no momento da criação, qual usuário/plano/
-- ciclo corresponde a cada checkout — e o webhook resolve por esse id.
-- ============================================================================

CREATE TABLE checkout_sessions (
  id            TEXT PRIMARY KEY, -- id do checkout na Asaas
  user_id       UUID NOT NULL REFERENCES profiles(id),
  plan          TEXT NOT NULL CHECK (plan IN ('basic', 'pro', 'duo')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
-- Sem policy pública: só service_role (Edge Functions de checkout/webhook) acessa.
