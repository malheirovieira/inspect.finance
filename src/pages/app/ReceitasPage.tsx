import { useState } from 'react';
import { Pencil, Search, Trash2, WalletCards, X } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { CurrencyInput, parseCurrencyInput } from '@/components/CurrencyInput';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateTransaction, useDeleteTransaction, useTransactions, useUpdateTransaction } from '@/hooks/useTransactions';
import {
  useCreateRecurringTransaction,
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useUpdateRecurringTransaction,
} from '@/hooks/useRecurringTransactions';
import { dayOfMonthFromISODate, formatDate, todayISODate } from '@/lib/datetime';

type IncomeKind = 'recorrente' | 'eventual';

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function ReceitasPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: recurringIncomes = [] } = useRecurringTransactions('income');
  const { data: allIncomes = [] } = useTransactions('income');
  // Lançamentos gerados automaticamente a partir de uma recorrência já aparecem via
  // `recurringIncomes` (o modelo) — sem este filtro, apareceriam duas vezes na lista.
  const eventualIncomes = allIncomes.filter((income) => !income.recurring_transaction_id);
  const createRecurring = useCreateRecurringTransaction();
  const updateRecurring = useUpdateRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [showForm, setShowForm] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsRecurring, setEditingIsRecurring] = useState(false);
  const [salaryName, setSalaryName] = useState('');
  const [salaryValue, setSalaryValue] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [incomeKind, setIncomeKind] = useState<IncomeKind>('recorrente');

  const activeAccountId = accountId || accounts[0]?.id || '';
  const isSaving = createRecurring.isPending || createTransaction.isPending || updateRecurring.isPending || updateTransaction.isPending;

  function resetForm() {
    setSalaryName('');
    setSalaryValue('');
    setReceiptDate('');
    setAccountId('');
    setIncomeKind('recorrente');
    setEditingId(null);
    setEditingIsRecurring(false);
    setShowForm(false);
  }

  function toggleForm() {
    if (showForm) resetForm();
    else setShowForm(true);
  }

  function startEdit(id: string, isRecurring: boolean) {
    if (isRecurring) {
      const source = recurringIncomes.find((income) => income.id === id);
      if (!source) return;
      setSalaryName(source.description);
      setSalaryValue(source.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setReceiptDate(source.start_date);
      setAccountId(source.account_id);
      setIncomeKind('recorrente');
    } else {
      const source = eventualIncomes.find((income) => income.id === id);
      if (!source) return;
      setSalaryName(source.description);
      setSalaryValue(source.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setReceiptDate(source.date);
      setAccountId(source.account_id);
      setIncomeKind('eventual');
    }
    setEditingId(id);
    setEditingIsRecurring(isRecurring);
    setShowForm(true);
  }

  function removeIncome(id: string, isRecurring: boolean) {
    if (isRecurring) deleteRecurring.mutate(id);
    else deleteTransaction.mutate(id);
  }

  async function addSalary() {
    if (!salaryName.trim() || !salaryValue.trim() || !activeAccountId) return;
    const amount = parseCurrencyInput(salaryValue);
    const date = receiptDate || todayISODate();

    if (editingId) {
      if (editingIsRecurring) {
        await updateRecurring.mutateAsync({
          id: editingId,
          account_id: activeAccountId,
          description: salaryName,
          amount,
          day_of_month: dayOfMonthFromISODate(date),
          start_date: date,
        });
      } else {
        await updateTransaction.mutateAsync({ id: editingId, account_id: activeAccountId, description: salaryName, amount, date });
      }
    } else if (incomeKind === 'recorrente') {
      await createRecurring.mutateAsync({
        account_id: activeAccountId,
        type: 'income',
        description: salaryName,
        amount,
        day_of_month: dayOfMonthFromISODate(date),
        start_date: date,
      });
    } else {
      await createTransaction.mutateAsync({
        account_id: activeAccountId,
        type: 'income',
        description: salaryName,
        amount,
        date,
      });
    }
    resetForm();
  }

  const monthlyTotal = recurringIncomes.reduce((total, income) => total + income.amount, 0);
  const totalRegistros = recurringIncomes.length + eventualIncomes.length;

  return (
    <div className={`page-view ${recurringOpen ? 'recurring-view' : ''} ${historyOpen ? 'history-view' : ''}`}>
      <SectionPageTitle title="Receitas" action="Adicionar receita" onAction={toggleForm} />

      {showForm && (
        <div className="form-card salary-form">
          <button className="form-close" type="button" onClick={resetForm} aria-label="Fechar formulário">
            <X />
          </button>
          <div className="field">
            <label>Nome da receita</label>
            <input value={salaryName} onChange={(e) => setSalaryName(e.target.value)} placeholder="Ex.: Salário mensal" />
          </div>
          <div className="field">
            <label>Valor líquido</label>
            <CurrencyInput value={salaryValue} onChange={setSalaryValue} />
          </div>
          <div className="field">
            <label>Data de recebimento</label>
            <input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Conta de destino</label>
            <select value={activeAccountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.length === 0 && <option value="">Cadastre uma conta em "Conta corrente"</option>}
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.institution} — {account.name}
                </option>
              ))}
            </select>
          </div>
          {editingId ? (
            <p className="edit-kind-label">Editando receita {editingIsRecurring ? 'recorrente' : 'eventual'}</p>
          ) : (
            <div className="expense-kind-options">
              <label className={`check-field ${incomeKind === 'recorrente' ? 'selected' : ''}`}>
                <input type="checkbox" checked={incomeKind === 'recorrente'} onChange={() => setIncomeKind('recorrente')} /> Receita
                recorrente <small>Renovação automática</small>
              </label>
              <label className={`check-field ${incomeKind === 'eventual' ? 'selected' : ''}`}>
                <input type="checkbox" checked={incomeKind === 'eventual'} onChange={() => setIncomeKind('eventual')} /> Receita eventual{' '}
                <small>Recebimento único</small>
              </label>
            </div>
          )}
          <button className="primary-button" onClick={addSalary} disabled={!activeAccountId || isSaving}>
            {isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar receita'}
          </button>
        </div>
      )}

      <div className="salary-tabs">
        <button
          className={!recurringOpen && !historyOpen ? 'active' : ''}
          onClick={() => {
            setRecurringOpen(false);
            setHistoryOpen(false);
          }}
        >
          Visão geral
        </button>
        <button
          className={recurringOpen ? 'active' : ''}
          onClick={() => {
            setRecurringOpen(true);
            setHistoryOpen(false);
          }}
        >
          Receitas recorrentes <span>{recurringIncomes.length}</span>
        </button>
        <button
          className={historyOpen ? 'active' : ''}
          onClick={() => {
            setHistoryOpen(true);
            setRecurringOpen(false);
          }}
        >
          Receitas eventuais
        </button>
      </div>

      {recurringOpen && (
        <div className="list-card recurring-card">
          <div className="list-card-title">
            <div>
              <h3>Receitas recorrentes</h3>
              <p>Fontes de entrada com renovação automática</p>
            </div>
            <span>{recurringIncomes.length} ativas</span>
          </div>
          {recurringIncomes.length === 0 && <p className="empty-state">Nenhuma receita recorrente cadastrada ainda.</p>}
          {recurringIncomes.map((income) => {
            const account = accounts.find((a) => a.id === income.account_id);
            return (
              <div className="recurring-row" key={income.id}>
                <div className="salary-icon">
                  <WalletCards />
                </div>
                <div className="account-main">
                  <strong>{income.description}</strong>
                  <small>Recebimento todo dia {income.day_of_month}</small>
                </div>
                <b>{formatCurrency(income.amount)}</b>
                <span>{account?.institution ?? '—'}</span>
                <button className="edit-button" onClick={() => startEdit(income.id, true)} aria-label={`Editar ${income.description}`}>
                  <Pencil />
                </button>
                <button aria-label={`Excluir ${income.description}`} onClick={() => removeIncome(income.id, true)}>
                  <Trash2 />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!recurringOpen && (
        <div className="salary-summary">
          <div>
            <span>Renda mensal prevista</span>
            <strong>{formatCurrency(monthlyTotal)}</strong>
            <small>{recurringIncomes.length} fontes recorrentes</small>
          </div>
          <div>
            <span>Receitas eventuais</span>
            <strong>{eventualIncomes.length}</strong>
            <small>Lançamentos únicos</small>
          </div>
          <div>
            <span>Fontes cadastradas</span>
            <strong>{totalRegistros}</strong>
            <small>{recurringIncomes.length} recorrentes · {eventualIncomes.length} eventuais</small>
          </div>
        </div>
      )}

      <div className="list-card salary-list">
        <div className="list-card-title">
          <div>
            <h3>Receitas cadastradas</h3>
            <p>Controle suas entradas, datas e bancos de destino</p>
          </div>
          <span>{totalRegistros} registros</span>
        </div>
        <div className="salary-filters">
          <div className="filter-search">
            <Search />
            <input placeholder="Buscar recebimento" />
          </div>
          <select aria-label="Filtrar por período">
            <option>Todos os períodos</option>
            <option>Este mês</option>
            <option>Últimos 3 meses</option>
          </select>
          <select aria-label="Filtrar por banco">
            <option>Todos os bancos</option>
            {accounts.map((account) => (
              <option key={account.id}>{account.institution}</option>
            ))}
          </select>
        </div>
        {recurringIncomes.map((income) => {
          const account = accounts.find((a) => a.id === income.account_id);
          return (
            <div className="salary-row" key={income.id}>
              <div className="salary-icon">
                <WalletCards />
              </div>
              <div className="account-main">
                <strong>{income.description}</strong>
                <small>Receita recorrente · Todo dia {income.day_of_month}</small>
              </div>
              <span>{account?.institution ?? '—'}</span>
              <b>{formatCurrency(income.amount)}</b>
              <em>Programado</em>
              <button className="edit-button" onClick={() => startEdit(income.id, true)} aria-label={`Editar ${income.description}`}>
                <Pencil />
              </button>
              <button aria-label={`Excluir ${income.description}`} onClick={() => removeIncome(income.id, true)}>
                <Trash2 />
              </button>
            </div>
          );
        })}
        {eventualIncomes.map((income) => {
          const account = accounts.find((a) => a.id === income.account_id);
          return (
            <div className="salary-row" key={income.id}>
              <div className="salary-icon">
                <WalletCards />
              </div>
              <div className="account-main">
                <strong>{income.description}</strong>
                <small>Receita eventual · {formatDate(income.date)}</small>
              </div>
              <span>{account?.institution ?? '—'}</span>
              <b>{formatCurrency(income.amount)}</b>
              <em>Recebido</em>
              <button className="edit-button" onClick={() => startEdit(income.id, false)} aria-label={`Editar ${income.description}`}>
                <Pencil />
              </button>
              <button aria-label={`Excluir ${income.description}`} onClick={() => removeIncome(income.id, false)}>
                <Trash2 />
              </button>
            </div>
          );
        })}
      </div>

      <button className="history-toggle" onClick={() => setHistoryOpen(!historyOpen)}>
        {historyOpen ? (
          <>
            <X /> Fechar histórico
          </>
        ) : (
          'Ver histórico de receitas'
        )}
      </button>

      {historyOpen && (
        <div className="salary-history">
          <div className="list-card-title">
            <div>
              <h3>Receitas eventuais</h3>
              <p>Entradas confirmadas com data, horário e banco</p>
            </div>
            <span>{eventualIncomes.length}</span>
          </div>
          {eventualIncomes.length === 0 && <p className="empty-state">Nenhuma receita eventual registrada ainda.</p>}
          {eventualIncomes.map((income) => {
            const account = accounts.find((a) => a.id === income.account_id);
            return (
              <div className="history-entry" key={income.id}>
                <div>
                  <strong>{income.description}</strong>
                  <small>{formatDate(income.date)}</small>
                </div>
                <b>+ {formatCurrency(income.amount)}</b>
                <span>{account?.institution ?? '—'}</span>
                <button className="edit-button" onClick={() => startEdit(income.id, false)} aria-label={`Editar ${income.description}`}>
                  <Pencil />
                </button>
                <button aria-label={`Excluir ${income.description}`} onClick={() => removeIncome(income.id, false)}>
                  <Trash2 />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
