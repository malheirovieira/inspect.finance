import { useState } from 'react';
import { FileText, Pencil, Trash2, X } from 'lucide-react';
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

type ExpenseKind = 'recorrente' | 'eventual';
type ExpenseTab = 'overview' | ExpenseKind;

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function DespesasPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: recurringExpenses = [] } = useRecurringTransactions('expense');
  const { data: allExpenses = [] } = useTransactions('expense');
  // Lançamentos gerados automaticamente a partir de uma recorrência já aparecem via
  // `recurringExpenses` (o modelo) — sem este filtro, apareceriam duas vezes na lista.
  const eventualExpenses = allExpenses.filter((expense) => !expense.recurring_transaction_id);
  const createRecurring = useCreateRecurringTransaction();
  const createTransaction = useCreateTransaction();
  const updateRecurring = useUpdateRecurringTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsRecurring, setEditingIsRecurring] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('Boleto');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [expenseKind, setExpenseKind] = useState<ExpenseKind>('recorrente');
  const [expenseTab, setExpenseTab] = useState<ExpenseTab>('overview');

  const activeAccountId = accountId || accounts[0]?.id || '';
  const isSaving = createRecurring.isPending || createTransaction.isPending || updateRecurring.isPending || updateTransaction.isPending;

  function resetForm() {
    setName('');
    setValue('');
    setDueDate('');
    setAccountId('');
    setExpenseKind('recorrente');
    setEditingId(null);
    setEditingIsRecurring(false);
    setShowForm(false);
  }

  function toggleForm() {
    if (showForm) resetForm();
    else setShowForm(true);
  }

  function startEdit(itemId: string, isRecurring: boolean) {
    if (isRecurring) {
      const source = recurringExpenses.find((expense) => expense.id === itemId);
      if (!source) return;
      setName(source.description);
      setValue(source.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setDueDate(source.start_date);
      setAccountId(source.account_id);
      setExpenseKind('recorrente');
    } else {
      const source = eventualExpenses.find((expense) => expense.id === itemId);
      if (!source) return;
      setName(source.description);
      setValue(source.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setDueDate(source.date);
      setAccountId(source.account_id);
      setNotes(source.notes || 'Boleto');
      setExpenseKind('eventual');
    }
    setEditingId(itemId);
    setEditingIsRecurring(isRecurring);
    setShowForm(true);
  }

  async function addExpense() {
    if (!name.trim() || !value.trim() || !activeAccountId) return;
    const amount = parseCurrencyInput(value);
    const date = dueDate || todayISODate();

    if (editingId) {
      if (editingIsRecurring) {
        await updateRecurring.mutateAsync({
          id: editingId,
          account_id: activeAccountId,
          description: name,
          amount,
          day_of_month: dayOfMonthFromISODate(date),
          start_date: date,
        });
      } else {
        await updateTransaction.mutateAsync({ id: editingId, account_id: activeAccountId, description: name, amount, date, notes });
      }
    } else if (expenseKind === 'recorrente') {
      await createRecurring.mutateAsync({
        account_id: activeAccountId,
        type: 'expense',
        description: name,
        amount,
        day_of_month: dayOfMonthFromISODate(date),
        start_date: date,
      });
    } else {
      await createTransaction.mutateAsync({ account_id: activeAccountId, type: 'expense', description: name, amount, date, notes });
    }
    resetForm();
  }

  const items = [
    ...recurringExpenses.map((expense) => ({
      id: expense.id,
      isRecurring: true as const,
      name: expense.description,
      type: 'Recorrente',
      category: 'Despesa recorrente',
      date: `Todo dia ${expense.day_of_month}`,
      value: expense.amount,
      automatic: true,
    })),
    ...eventualExpenses.map((expense) => ({
      id: expense.id,
      isRecurring: false as const,
      name: expense.description,
      type: expense.notes || 'Eventual',
      category: 'Despesa eventual',
      date: formatDate(expense.date, { day: '2-digit', month: 'short' }),
      value: expense.amount,
      automatic: false,
    })),
  ];

  const visibleItems = items.filter((item) => expenseTab === 'overview' || (expenseTab === 'recorrente' ? item.automatic : !item.automatic));

  function removeItem(id: string, isRecurring: boolean) {
    if (isRecurring) deleteRecurring.mutate(id);
    else deleteTransaction.mutate(id);
  }

  return (
    <div className="page-view">
      <SectionPageTitle title="Despesas" action="Cadastrar despesa" onAction={toggleForm} />

      {showForm && (
        <div className="form-card">
          <button className="form-close" type="button" onClick={resetForm} aria-label="Fechar formulário">
            <X />
          </button>
          <div className="field">
            <label>Nome da despesa</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Internet residencial" />
          </div>
          {(!editingId || !editingIsRecurring) && (
            <div className="field">
              <label>Tipo da despesa</label>
              <select value={notes} onChange={(e) => setNotes(e.target.value)}>
                <option>Boleto</option>
                <option>Conta de consumo</option>
                <option>Financiamento</option>
                <option>Assinatura</option>
                <option>Aluguel</option>
                <option>Outra</option>
              </select>
            </div>
          )}
          <div className="field">
            <label>Valor</label>
            <CurrencyInput value={value} onChange={setValue} />
          </div>
          <div className="field">
            <label>Data de vencimento</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Conta de pagamento</label>
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
            <p className="edit-kind-label">Editando despesa {editingIsRecurring ? 'recorrente' : 'eventual'}</p>
          ) : (
            <div className="expense-kind-options">
              <label className={`check-field ${expenseKind === 'recorrente' ? 'selected' : ''}`}>
                <input type="checkbox" checked={expenseKind === 'recorrente'} onChange={() => setExpenseKind('recorrente')} /> Despesa
                recorrente <small>Renovação automática</small>
              </label>
              <label className={`check-field ${expenseKind === 'eventual' ? 'selected' : ''}`}>
                <input type="checkbox" checked={expenseKind === 'eventual'} onChange={() => setExpenseKind('eventual')} /> Despesa
                eventual <small>Lançamento único</small>
              </label>
            </div>
          )}
          <button className="primary-button" onClick={addExpense} disabled={!activeAccountId || isSaving}>
            {isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar despesa'}
          </button>
        </div>
      )}

      <div className="expense-tabs">
        <button className={expenseTab === 'overview' ? 'active' : ''} onClick={() => setExpenseTab('overview')}>
          Visão geral
        </button>
        <button className={expenseTab === 'recorrente' ? 'active' : ''} onClick={() => setExpenseTab('recorrente')}>
          Despesas recorrentes
        </button>
        <button className={expenseTab === 'eventual' ? 'active' : ''} onClick={() => setExpenseTab('eventual')}>
          Despesas eventuais
        </button>
      </div>

      <div className="list-card">
        <div className="list-card-title">
          <div>
            <h3>{expenseTab === 'overview' ? 'Despesas cadastradas' : expenseTab === 'recorrente' ? 'Despesas recorrentes' : 'Despesas eventuais'}</h3>
            <p>{expenseTab === 'eventual' ? 'Lançamentos únicos sem renovação automática' : 'Despesas organizadas por vencimento e renovação'}</p>
          </div>
          <span>{visibleItems.length} despesas</span>
        </div>
        {visibleItems.length === 0 && <p className="empty-state">Nenhuma despesa cadastrada ainda.</p>}
        {visibleItems.map((item) => (
          <div className="account-row" key={item.id}>
            <div className="account-icon">
              <FileText />
            </div>
            <div className="account-main">
              <strong>{item.name}</strong>
              <small>
                {item.type} · {item.category} · Vencimento {item.date}
              </small>
            </div>
            <b>{formatCurrency(item.value)}</b>
            <span className={`renewal ${item.automatic ? 'on' : ''}`}>{item.automatic ? 'Automática' : 'Manual'}</span>
            <button className="edit-button" aria-label={`Editar ${item.name}`} onClick={() => startEdit(item.id, item.isRecurring)}>
              <Pencil />
            </button>
            <button aria-label={`Excluir ${item.name}`} onClick={() => removeItem(item.id, item.isRecurring)}>
              <Trash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
