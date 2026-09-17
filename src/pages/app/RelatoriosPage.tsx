import { useMemo } from 'react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { useTransactions } from '@/hooks/useTransactions';
import { useCountUp } from '@/hooks/useCountUp';
import { useRevealOnVisible } from '@/hooks/useRevealOnVisible';
import { currentYearMonthBrasilia, MONTH_NAMES_PT } from '@/lib/datetime';

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const zeroBased = month - 1 + delta;
  const newYear = year + Math.floor(zeroBased / 12);
  const newMonth = ((zeroBased % 12) + 12) % 12;
  return { year: newYear, month: newMonth + 1 };
}

export function RelatoriosPage() {
  const { data: transactions = [] } = useTransactions();
  const { year: nowYear, month: nowMonth } = currentYearMonthBrasilia();

  const last6Months = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(nowYear, nowMonth, i - 5));
    return months.map(({ year, month }) => {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const total = transactions.filter((tx) => tx.type === 'expense' && tx.date.startsWith(prefix)).reduce((sum, tx) => sum + tx.amount, 0);
      return { label: MONTH_NAMES_PT[month - 1].slice(0, 3), total };
    });
  }, [transactions, nowYear, nowMonth]);

  const maxTotal = Math.max(1, ...last6Months.map((m) => m.total));
  const hasAnyData = last6Months.some((m) => m.total > 0);

  const currentMonthPrefix = `${nowYear}-${String(nowMonth).padStart(2, '0')}`;
  const monthExpenses = transactions
    .filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentMonthPrefix))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthIncome = transactions
    .filter((tx) => tx.type === 'income' && tx.date.startsWith(currentMonthPrefix))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const [barsRef, barsVisible] = useRevealOnVisible<HTMLDivElement>();
  const animatedExpenses = useCountUp(monthExpenses);
  const animatedIncome = useCountUp(monthIncome);

  return (
    <div className="page-view">
      <SectionPageTitle title="Relatórios" />
      <div className="report-grid">
        <div className="report-panel">
          <span className="eyebrow">VISÃO MENSAL</span>
          <h3>Resumo financeiro</h3>
          {hasAnyData ? (
            <>
              <div className="report-bars" ref={barsRef}>
                {last6Months.map((item, i) => (
                  <i key={i} style={{ height: barsVisible ? `${(item.total / maxTotal) * 100}%` : 0 }} />
                ))}
              </div>
              <div className="report-labels">
                {last6Months.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-state">Não há gastos para serem analisados.</p>
          )}
        </div>
        <div className="report-panel report-numbers">
          <span className="eyebrow">INDICADORES</span>
          <h3>Este mês</h3>
          <strong>{formatCurrency(animatedExpenses)}</strong>
          <p>Despesas totais</p>
          <strong>{formatCurrency(animatedIncome)}</strong>
          <p>Renda recebida</p>
        </div>
      </div>
    </div>
  );
}
