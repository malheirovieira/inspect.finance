-- ============================================================================
-- Migration 009: campos reais de cartão de crédito (bandeira, fechamento,
-- vencimento) — pedido explícito pra tela de Bancos reorganizada (cartão
-- vinculado a um banco, com dados de fatura). Todos nullable/aditivos, não
-- quebram contas já cadastradas.
-- ============================================================================

ALTER TABLE accounts ADD COLUMN card_brand TEXT;
ALTER TABLE accounts ADD COLUMN billing_closing_day SMALLINT CHECK (billing_closing_day BETWEEN 1 AND 31);
ALTER TABLE accounts ADD COLUMN billing_due_day SMALLINT CHECK (billing_due_day BETWEEN 1 AND 31);

-- accounts_with_balance (migration 008) precisa expor os novos campos — Postgres não permite
-- inserir colunas no meio de uma view existente via CREATE OR REPLACE, então recria do zero.
DROP VIEW accounts_with_balance;

CREATE VIEW accounts_with_balance AS
SELECT
  a.id,
  a.user_id,
  a.name,
  a.type,
  a.institution,
  a.currency,
  a.initial_balance
    + COALESCE((
        SELECT SUM(
          CASE
            WHEN t.type = 'income' AND t.account_id = a.id THEN t.amount
            WHEN t.type = 'expense' AND t.account_id = a.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
            WHEN t.type = 'transfer' AND t.transfer_to_account_id = a.id THEN t.amount
            ELSE 0
          END
        )
        FROM transactions t
        WHERE t.deleted_at IS NULL
          AND t.is_paid = TRUE
          AND t.date <= CURRENT_DATE
          AND (t.account_id = a.id OR t.transfer_to_account_id = a.id)
      ), 0) AS balance,
  a.credit_limit,
  a.card_brand,
  a.billing_closing_day,
  a.billing_due_day,
  a.color,
  a.icon,
  a.is_active,
  a.pluggy_account_id,
  a.created_at,
  a.updated_at,
  a.deleted_at
FROM accounts a;

GRANT SELECT ON accounts_with_balance TO authenticated, anon;
