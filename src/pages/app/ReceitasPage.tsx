import { useState } from 'react';
import { Search, Settings, WalletCards, X } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreateTransaction, useTransactions } from '@/hooks/useTransactions';
import { useCreateRecurringTransaction, useRecurringTransactions, useUpdateRecurringTransaction } from '@/hooks/useRecurringTransactions';
import { dayOfMonthFromISODate, formatDate, todayISODate } from '@/lib/datetime';

type IncomeKind = 'recorrente' | 'eventual';

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function ReceitasPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: recurringIncomes = [] } = useRecurringTransactions('income');
  const { data: eventualIncomes = [] } = useTransactions('income');
  const createRecurring = useCreateRecurringTransaction();
  const updateRecurring = useUpdateRecurringTransaction();
  const createTransaction = useCreateTransaction();

  const [showForm, setShowForm] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [salaryName, setSalaryName] = useState('');
  const [salaryValue, setSalaryValue] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [incomeKind, setIncomeKind] = useState<IncomeKind>('recorrente');

  const activeAccountId = accountId || accounts[0]?.id || '';

  async function addSalary() {
    if (!salaryName.trim() || !salaryValue.trim() || !activeAccountId) return;
    const amount = Number(salaryValue.replace(',', '.')) || 0;
    const date = receiptDate || todayISODate();

    if (incomeKind === 'recorrente') {
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
    setSalaryName('');
    setSalaryValue('');
    setReceiptDate('');
    setShowForm(false);
  }

  function startSalaryEdit(id: string, description: string, amount: number) {
    setEditingId(id);
    setSalaryName(description);
    setSalaryValue(String(amount));
  }

  async function saveSalaryEdit() {
    if (!editingId || !salaryName.trim() || !salaryValue.trim()) return;
    await updateRecurring.mutateAsync({ id: editingId, description: salaryName, amount: Number(salaryValue.replace(',', '.')) || 0 });
    setEditingId(null);
    setSalaryName('');
    setSalaryValue('');
  }

  const monthlyTotal = recurringIncomes.reduce((total, income) => total + income.amount, 0);
  const totalRegistros = recurringIncomes.length + eventualIncomes.length;

  return (
    <div className={`page-view ${recurringOpen ? 'recurring-view' : ''} ${historyOpen ? 'history-view' : ''}`}>
      <SectionPageTitle title="Receitas" action="Adicionar receita" onAction={() => setShowForm(!showForm)} />

      {showForm && (
        <div className="form-card salary-form">
          <button className="form-close" type="button" onClick={() => setShowForm(false)} aria-label="Cancelar cadastro de receita">
            <X />
          </button>
          <div className="field">
            <label>Nome da receita</label>
            <input value={salaryName} onChange={(e) => setSalaryName(e.target.value)} placeholder="Ex.: Salário mensal" />
          </div>
          <div className="field">
            <label>Valor líquido</label>
            <input value={salaryValue} onChange={(e) => setSalaryValue(e.target.value)} placeholder="0,00" inputMode="decimal" />
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
          <button className="primary-button" onClick={addSalary} disabled={!activeAccountId || createRecurring.isPending || createTransaction.isPending}>
            {createRecurring.isPending || createTransaction.isPending ? 'Salvando...' : 'Salvar receita'}
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
                <button className="edit-button" onClick={() => startSalaryEdit(income.id, income.description, income.amount)} aria-label={`Editar ${income.description}`}>
                  <Settings />
                </button>
              </div>
            );
          })}
          {editingId && (
            <div className="inline-edit">
              <div className="field">
                <label>Nome da renda</label>
                <input value={salaryName} onChange={(e) => setSalaryName(e.target.value)} />
              </div>
              <div className="field">
                <label>Valor</label>
                <input value={salaryValue} onChange={(e) => setSalaryValue(e.target.value)} />
              </div>
              <button className="primary-button" onClick={saveSalaryEdit}>
                Salvar edição
              </button>
              <button className="form-close" type="button" onClick={() => setEditingId(null)} aria-label="Cancelar edição">
                <X />
              </button>
            </div>
          )}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
