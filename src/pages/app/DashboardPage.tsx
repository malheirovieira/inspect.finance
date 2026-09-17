import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useCountUp } from '@/hooks/useCountUp';
import { useRevealOnVisible } from '@/hooks/useRevealOnVisible';
import type { Goal, Transaction } from '@/types/database';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import {
  currentDayOfMonthBrasilia,
  currentYearMonthBrasilia,
  daysInMonth,
  formatDate,
  MONTH_NAMES_PT,
  weekdayOfFirstDay,
} from '@/lib/datetime';

const HIDE_BALANCE_KEY = 'dashboard:hideBalance';

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function readHideBalance(): boolean {
  try {
    return localStorage.getItem(HIDE_BALANCE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeHideBalance(hidden: boolean) {
  try {
    localStorage.setItem(HIDE_BALANCE_KEY, hidden ? '1' : '0');
  } catch {
    // localStorage indisponível (modo privado etc.) — estado só dura a sessão em memória.
  }
}

/** Valor monetário com efeito de contagem (0 → valor real) — usado nos números de destaque. */
function CountUpCurrency({ value, hidden }: { value: number; hidden?: boolean }) {
  const animated = useCountUp(value);
  return <span className="balance-value">{hidden ? 'R$ ••••••' : formatCurrency(animated)}</span>;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function shiftMonth(year: number, month: number, delta: number) {
  const zeroBased = month - 1 + delta;
  const newYear = year + Math.floor(zeroBased / 12);
  const newMonth = ((zeroBased % 12) + 12) % 12;
  return { year: newYear, month: newMonth + 1 };
}

function dailyTotals(transactions: Transaction[], year: number, month: number) {
  const total = daysInMonth(year, month);
  const buckets = Array.from({ length: total }, () => 0);
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  for (const tx of transactions) {
    if (!tx.date.startsWith(prefix)) continue;
    const day = Number(tx.date.slice(8, 10));
    buckets[day - 1] += tx.amount;
  }
  return buckets;
}

function GoalsSummaryCard({ goals, onNavigate, onRemove }: { goals: Goal[]; onNavigate: () => void; onRemove: () => void }) {
  const [listRef, listVisible] = useRevealOnVisible<HTMLDivElement>();
  return (
    <section className="dashboard-goals-card">
      <div className="dashboard-goals-heading">
        <div>
          <span className="eyebrow">ACOMPANHAMENTO</span>
          <button className="dashboard-card-title" onClick={onNavigate}>
            Metas
          </button>
        </div>
      </div>
      <div ref={listRef}>
      {goals.length === 0 && <p className="empty-state">Nenhuma meta cadastrada ainda.</p>}
      {goals.slice(0, 2).map((goal, index) => {
        const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
        const remaining = goal.target_amount - goal.current_amount;
        return (
          <div className="dashboard-goal-row" key={goal.id}>
            <div
              className={`dashboard-goal-donut ${index === 1 ? 'travel' : ''}`}
              style={{ '--progress': `${(listVisible ? progress : 0) * 3.6}deg` } as CSSProperties}
            >
              <span>{progress}%</span>
            </div>
            <div>
              <strong>{goal.name}</strong>
              <small>
                {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
              </small>
              <div className="dashboard-goal-progress">
                <i style={{ width: listVisible ? `${progress}%` : 0 }} />
              </div>
            </div>
            <b>
              {formatCurrency(remaining)}
              <br />
              <small>restantes</small>
            </b>
          </div>
        );
      })}
      </div>
      <button className="dashboard-goals-link" onClick={onNavigate}>
        Ver todas as metas <ChevronRight />
      </button>
      <button className="widget-remove" onClick={onRemove} aria-label="Remover widget de metas" title="Remover widget">
        <X />
      </button>
    </section>
  );
}

function ExpenseChart({ expenses, onViewReport }: { expenses: Transaction[]; onViewReport: () => void }) {
  const { year: nowYear, month: nowMonth } = currentYearMonthBrasilia();
  const previous = shiftMonth(nowYear, nowMonth, -1);
  const [chartRef, chartVisible] = useRevealOnVisible<HTMLDivElement>();

  const currentTotals = useMemo(() => dailyTotals(expenses, nowYear, nowMonth), [expenses, nowYear, nowMonth]);
  const previousTotals = useMemo(() => dailyTotals(expenses, previous.year, previous.month), [expenses, previous.year, previous.month]);

  const dayCount = Math.max(currentTotals.length, previousTotals.length);
  const daysWithData = Array.from({ length: dayCount }, (_, i) => i).filter((i) => (currentTotals[i] ?? 0) > 0 || (previousTotals[i] ?? 0) > 0);
  const maxValue = Math.max(1, ...currentTotals, ...previousTotals);
  const monthTotal = currentTotals.reduce((sum, value) => sum + value, 0);

  return (
    <div className="expense-panel">
      <div className="expense-header">
        <div>
          <span className="eyebrow">SALDO E COMPARAÇÃO DE DESPESAS</span>
          <p>
            Resumo de despesas de {MONTH_NAMES_PT[nowMonth - 1]}, {nowYear}
          </p>
        </div>
        <div className="expense-total">
          <strong>
            <CountUpCurrency value={monthTotal} />
          </strong>
        </div>
      </div>
      {daysWithData.length === 0 ? (
        <p className="empty-state">Não há gastos para serem analisados.</p>
      ) : (
        <div className="chart" ref={chartRef}>
          <div className="chart-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="bars">
            {daysWithData.map((i) => (
              <div className="bar-group" key={i}>
                <i style={{ height: chartVisible ? `${((currentTotals[i] ?? 0) / maxValue) * 100}%` : 0 }} />
                <b style={{ height: chartVisible ? `${((previousTotals[i] ?? 0) / maxValue) * 100}%` : 0 }} />
              </div>
            ))}
          </div>
          <div className="chart-labels">
            {daysWithData.map((i) => (
              <span key={i}>{String(i + 1).padStart(2, '0')}</span>
            ))}
          </div>
        </div>
      )}
      <div className="expense-footer">
        <div className="legend">
          <span>
            <i className="dot coral" />
            {MONTH_NAMES_PT[nowMonth - 1]} (atual)
          </span>
          <span>
            <i className="dot dark" />
            {MONTH_NAMES_PT[previous.month - 1]} (anterior)
          </span>
        </div>
        <button className="report-button" onClick={onViewReport}>
          Ver relatório
        </button>
      </div>
    </div>
  );
}

function FinancialCalendar({ expenses, recurring }: { expenses: Transaction[]; recurring: { day_of_month: number | null }[] }) {
  const { year: nowYear, month: nowMonth } = currentYearMonthBrasilia();
  const today = currentDayOfMonthBrasilia();
  const [view, setView] = useState({ year: nowYear, month: nowMonth });

  const total = daysInMonth(view.year, view.month);
  const offset = weekdayOfFirstDay(view.year, view.month);
  const days = Array.from({ length: total }, (_, i) => i + 1);
  const isCurrentMonth = view.year === nowYear && view.month === nowMonth;

  const billDays = useMemo(() => {
    const set = new Set<number>();
    for (const item of recurring) {
      if (item.day_of_month) set.add(item.day_of_month);
    }
    const prefix = `${view.year}-${String(view.month).padStart(2, '0')}`;
    for (const tx of expenses) {
      if (tx.date.startsWith(prefix)) set.add(Number(tx.date.slice(8, 10)));
    }
    return set;
  }, [recurring, expenses, view]);

  return (
    <div className="expense-panel">
      <div className="financial-calendar">
        <div className="calendar-header">
          <div>
            <span>CALENDÁRIO FINANCEIRO</span>
            <h2>
              {MONTH_NAMES_PT[view.month - 1]} {view.year}
            </h2>
          </div>
          <div className="calendar-actions">
            <button aria-label="Mês anterior" onClick={() => setView((current) => shiftMonth(current.year, current.month, -1))}>
              <ChevronLeft />
            </button>
            <button aria-label="Próximo mês" onClick={() => setView((current) => shiftMonth(current.year, current.month, 1))}>
              <ChevronRight />
            </button>
          </div>
        </div>
        <div className="weekdays">
          {WEEKDAYS.map((day, i) => (
            <span key={i}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: offset }, (_, i) => (
            <div className="calendar-day empty" key={`offset-${i}`} />
          ))}
          {days.map((day) => (
            <div className={`calendar-day ${billDays.has(day) ? 'has-bill' : ''} ${isCurrentMonth && day === today ? 'today' : ''}`} key={day}>
              <span>{day}</span>
            </div>
          ))}
        </div>
        <div className="calendar-legend">
          <span>
            <i /> Conta lançada
          </span>
          <span>
            <b /> Hoje
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? 'Usuário';
  const [expensePanel, setExpensePanel] = useState(0);
  const [widgets, setWidgets] = useState<string[]>(['overview', 'goals', 'expenses']);
  const [hideBalance, setHideBalance] = useState(readHideBalance);

  useEffect(() => writeHideBalance(hideBalance), [hideBalance]);

  const { data: accounts = [] } = useAccounts();
  const { data: goals = [] } = useGoals();
  const { data: transactions = [] } = useTransactions();
  const { data: recurringExpenses = [] } = useRecurringTransactions('expense');
  const { data: recurringIncomes = [] } = useRecurringTransactions('income');
  const recentTransactions = transactions.slice(0, 3);
  const expenseTransactions = useMemo(() => transactions.filter((tx) => tx.type === 'expense'), [transactions]);
  const cardAccounts = accounts.filter((account) => account.type === 'credit_card');

  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);

  function sortByUpcomingDay<T extends { day_of_month: number | null }>(items: T[]): T[] {
    const today = currentDayOfMonthBrasilia();
    return [...items]
      .sort((a, b) => {
        const diffA = ((a.day_of_month ?? 1) - today + 31) % 31;
        const diffB = ((b.day_of_month ?? 1) - today + 31) % 31;
        return diffA - diffB;
      })
      .slice(0, 3);
  }

  const upcomingPayments = useMemo(() => sortByUpcomingDay(recurringExpenses), [recurringExpenses]);
  const upcomingReceivables = useMemo(() => sortByUpcomingDay(recurringIncomes), [recurringIncomes]);

  return (
    <div className="dashboard-home">
      <SectionPageTitle title="Dashboard" />

      <div className="dashboard-space-title">
        <span className="eyebrow">SEU ESPAÇO</span>
        <strong>Dashboard personalizado</strong>
      </div>

      <section className="dashboard-account-widget">
        <div className="dashboard-account-heading">
          <div>
            <span className="eyebrow">CONTA CORRENTE</span>
            <button className="dashboard-card-title" onClick={() => navigate('/app/conta-corrente')}>
              Saldos das contas
            </button>
          </div>
          <button className="dashboard-account-link" onClick={() => navigate('/app/conta-corrente')}>
            Ver contas
          </button>
        </div>
        <div className="dashboard-account-body">
          <div className="dashboard-total-balance">
            <span className="balance-label">Saldo disponível</span>
            <strong className="balance-highlight">
              <CountUpCurrency value={totalBalance} hidden={hideBalance} />
              <button
                type="button"
                className="balance-toggle-btn"
                onClick={() => setHideBalance((current) => !current)}
                title="Mostrar/ocultar saldo"
                aria-label="Mostrar/ocultar saldo"
              >
                {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </strong>
            <small>{accounts.length} contas cadastradas</small>
          </div>
          <div className="dashboard-account-cards">
            {accounts.length === 0 && <p className="empty-state">Nenhuma conta cadastrada ainda.</p>}
            {accounts.map((account, index) => (
              <button
                key={account.id}
                className="stagger-fade-item"
                style={{ animationDelay: `${index * 80}ms` }}
                onClick={() => navigate('/app/conta-corrente')}
              >
                <span>{account.institution}</span>
                <strong>{account.name}</strong>
                <b>{hideBalance ? 'R$ ••••••' : formatCurrency(account.balance)}</b>
              </button>
            ))}
          </div>
        </div>
      </section>

      {widgets.includes('goals') && (
        <div className="dashboard-widget goals-widget stagger-fade-item" style={{ animationDelay: '80ms' }}>
          <GoalsSummaryCard
            goals={goals}
            onNavigate={() => navigate('/app/metas')}
            onRemove={() => setWidgets((current) => current.filter((widget) => widget !== 'goals'))}
          />
        </div>
      )}

      <div className="dashboard-widget overview-widget stagger-fade-item" style={{ animationDelay: '160ms' }}>
        <div className="widget-label">
          <button className="dashboard-card-title" onClick={() => navigate('/app/despesas')}>
            Visão financeira
          </button>
        </div>
        <div className="dashboard-grid">
          <div className="main-column">
            <section className="expense-card">
              <div className="expense-panels">
                {expensePanel === 0 ? (
                  <ExpenseChart expenses={expenseTransactions} onViewReport={() => navigate('/app/relatorios')} />
                ) : (
                  <FinancialCalendar expenses={expenseTransactions} recurring={recurringExpenses} />
                )}
              </div>
              <div className="panel-dots">
                <button className={expensePanel === 0 ? 'active' : ''} onClick={() => setExpensePanel(0)} aria-label="Ver despesas" />
                <button className={expensePanel === 1 ? 'active' : ''} onClick={() => setExpensePanel(1)} aria-label="Ver calendário" />
              </div>
            </section>

            <section className="dashboard-transactions-card">
              <div className="section-heading">
                <button className="dashboard-card-title" onClick={() => navigate('/app/conta-corrente')}>
                  Conta corrente
                </button>
                <button onClick={() => navigate('/app/conta-corrente')}>Ver todas</button>
              </div>
              <div className="dashboard-transaction-cards">
                {recentTransactions.length === 0 && <p className="empty-state">Nenhuma transação registrada ainda.</p>}
                {recentTransactions.map((tx, index) => (
                  <article key={tx.id} className="stagger-fade-item" style={{ animationDelay: `${index * 80}ms` }}>
                    <span className={`transaction-card-icon ${tx.type === 'income' ? 'income' : 'expense'}`}>
                      {tx.type === 'income' ? '+' : '−'}
                    </span>
                    <div>
                      <strong>{tx.description}</strong>
                      <small>{formatDate(tx.date, { day: '2-digit', month: 'short' })}</small>
                    </div>
                    <b className={tx.type === 'income' ? 'income' : ''}>
                      {tx.type === 'income' ? '+ ' : '− '}
                      {formatCurrency(tx.amount)}
                    </b>
                  </article>
                ))}
              </div>
            </section>

            <div className="lower-grid">
              <section className="scheduled">
                <div className="section-heading">
                  <h2>Pagamentos agendados</h2>
                  <button onClick={() => navigate('/app/despesas')}>Ver todos</button>
                </div>
                {upcomingPayments.length === 0 && <p className="empty-state">Nenhuma despesa recorrente cadastrada ainda.</p>}
                {upcomingPayments.map((payment, index) => (
                  <div className="payment stagger-fade-item" style={{ animationDelay: `${index * 80}ms` }} key={payment.id}>
                    <span className="payment-avatar">{payment.description.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <strong>{payment.description}</strong>
                      <small>Todo dia {payment.day_of_month}</small>
                    </div>
                    <b>{formatCurrency(payment.amount)}</b>
                  </div>
                ))}
              </section>
              <section className="premium-card wallet-card">
                <span className="eyebrow">CARTEIRA</span>
                <h2>Meus cartões</h2>
                {cardAccounts.length === 0 ? (
                  <p className="empty-state">Nenhum cartão cadastrado ainda.</p>
                ) : (
                  <div className="wallet-credit-card">
                    <div className="card-top">
                      <strong>{fullName}</strong>
                      <span>{cardAccounts[0].institution}</span>
                    </div>
                    <div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; ••••</div>
                    <div className="card-bottom">
                      <span>{cardAccounts[0].name}</span>
                      <b>{formatCurrency(cardAccounts[0].credit_limit ?? 0)}</b>
                    </div>
                  </div>
                )}
                <div className="wallet-footer">
                  <span>{cardAccounts.length} cartões cadastrados</span>
                  <button onClick={() => navigate('/app/bancos')}>Ver carteira</button>
                </div>
              </section>
            </div>

            <section className="scheduled" style={{ marginTop: 28 }}>
              <div className="section-heading">
                <h2>Previsão de recebimentos</h2>
                <button onClick={() => navigate('/app/receitas')}>Ver todos</button>
              </div>
              {upcomingReceivables.length === 0 && <p className="empty-state">Nenhuma receita recorrente cadastrada ainda.</p>}
              {upcomingReceivables.map((receivable, index) => (
                <div className="payment stagger-fade-item" style={{ animationDelay: `${index * 80}ms` }} key={receivable.id}>
                  <span className="payment-avatar">{receivable.description.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{receivable.description}</strong>
                    <small>Todo dia {receivable.day_of_month}</small>
                  </div>
                  <b>{formatCurrency(receivable.amount)}</b>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>

      <section className="reimbursements">
        <div className="section-heading">
          <h2>Transações</h2>
          <button onClick={() => navigate('/app/conta-corrente')}>Ver todos</button>
        </div>
        {recentTransactions.length === 0 && <p className="empty-state">Nenhuma transação registrada ainda.</p>}
        {recentTransactions.map((tx, index) => (
          <article className="reimbursement stagger-fade-item" style={{ animationDelay: `${index * 80}ms` }} key={tx.id}>
            <div className="reimbursement-row">
              <div className="mini-avatar">{tx.description.slice(0, 2).toUpperCase()}</div>
              <div className="reimbursement-name">
                <strong>{tx.description}</strong>
                <small className={tx.type === 'income' ? 'income' : ''}>
                  {tx.type === 'income' ? '+ ' : '− '}
                  {formatCurrency(tx.amount)}
                </small>
              </div>
              <button className="status">Concluída</button>
              <ChevronDown />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
