-- ============================================================================
-- Migration 007: gera transações reais a partir de recorrências ativas.
--
-- Bug relatado: despesas/receitas cadastradas como "recorrente" (opção
-- padrão em DespesasPage/ReceitasPage) ficam só na tabela recurring_transactions
-- (um template) e nunca aparecem no dashboard/relatórios, que só leem
-- `transactions` — não existia nenhum job que materializasse a recorrência
-- num lançamento de verdade. Esta migration:
-- 1. Cria generate_recurring_transactions_for_period(), que gera (uma vez por
--    mês, idempotente via last_generated_date) uma linha em `transactions`
--    pra cada recorrência ativa cujo período ainda não foi gerado.
-- 2. Roda essa função imediatamente para o mês atual — corrige as recorrências
--    já cadastradas que o usuário esperava ver no relatório agora.
-- 3. Cria um trigger em recurring_transactions: ao cadastrar uma nova
--    recorrência, ela já aparece no relatório do mês corrente na hora.
-- 4. Agenda a função via pg_cron pra rodar todo dia (idempotente — só gera o
--    que ainda não foi gerado no mês), cobrindo a virada de mês.
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_recurring_transactions_for_period(target_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  target_day INT;
  period_start DATE;
  period_end DATE;
BEGIN
  period_start := date_trunc('month', target_date)::date;
  period_end := (period_start + interval '1 month - 1 day')::date;

  FOR rec IN
    SELECT * FROM recurring_transactions
    WHERE is_active = TRUE
      AND frequency = 'monthly'
      AND start_date <= target_date
      AND (end_date IS NULL OR end_date >= target_date)
      AND (last_generated_date IS NULL OR last_generated_date < period_start)
  LOOP
    target_day := LEAST(COALESCE(rec.day_of_month, 1), EXTRACT(DAY FROM period_end)::int);

    INSERT INTO transactions (
      user_id, account_id, category_id, type, description, amount, currency,
      amount_in_base_currency, exchange_rate, date, is_paid, is_recurring, recurring_transaction_id
    ) VALUES (
      rec.user_id, rec.account_id, rec.category_id, rec.type, rec.description, rec.amount, rec.currency,
      rec.amount, 1.0,
      make_date(EXTRACT(YEAR FROM period_start)::int, EXTRACT(MONTH FROM period_start)::int, target_day),
      TRUE, TRUE, rec.id
    );

    UPDATE recurring_transactions SET last_generated_date = target_date WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Backfill imediato: gera já o mês corrente pras recorrências existentes.
SELECT generate_recurring_transactions_for_period(CURRENT_DATE);

-- Nova recorrência cadastrada: gera na hora o lançamento do mês corrente,
-- sem esperar o cron do dia seguinte.
CREATE OR REPLACE FUNCTION trigger_generate_recurring_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM generate_recurring_transactions_for_period(CURRENT_DATE);
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_recurring_on_insert
  AFTER INSERT ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION trigger_generate_recurring_on_insert();

-- Cron diário (03:00 UTC ~ meia-noite em Brasília) — cobre a virada de mês
-- pras recorrências que já existiam antes.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'generate-recurring-transactions-daily',
  '0 3 * * *',
  $$SELECT generate_recurring_transactions_for_period(CURRENT_DATE);$$
);
