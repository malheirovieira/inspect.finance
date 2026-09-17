-- ============================================================================
-- Migration 008: saldo da conta passa a ser calculado a partir das transações.
--
-- Bug relatado: `accounts.balance` era só um número fixo, digitado uma vez na
-- criação da conta — nada recalculava ao lançar receitas/despesas, então uma
-- receita lançada hoje nunca aparecia no saldo da conta corrente. Regra
-- desejada: transações com data <= hoje (Brasília) entram no saldo; datas
-- futuras não alteram o saldo ainda (ficam como previsão/agendado).
--
-- Solução: `balance` deixa de ser um valor gravado e passa a ser calculado
-- (initial_balance + soma de transações já realizadas até hoje). A tabela
-- real vira `initial_balance` (saldo de abertura, mesmo valor que o usuário
-- já tinha informado); o app passa a ler de uma view `accounts_with_balance`
-- que devolve as mesmas colunas de `accounts` só com `balance` calculado.
-- ============================================================================

ALTER TABLE accounts RENAME COLUMN balance TO initial_balance;

CREATE OR REPLACE VIEW accounts_with_balance AS
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
  a.color,
  a.icon,
  a.is_active,
  a.pluggy_account_id,
  a.created_at,
  a.updated_at,
  a.deleted_at
FROM accounts a;

-- A view herda RLS das tabelas base (accounts/transactions) automaticamente
-- por rodar com o privilégio de quem consulta — sem SECURITY DEFINER aqui.
GRANT SELECT ON accounts_with_balance TO authenticated, anon;
