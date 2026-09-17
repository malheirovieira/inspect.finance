import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Filter, Pencil, Search, Trash2 } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { CurrencyInput, parseCurrencyInput } from '@/components/CurrencyInput';
import { Modal } from '@/components/Modal';
import { useAccounts } from '@/hooks/useAccounts';
import { useDeleteTransaction, useTransactions, useUpdateTransaction } from '@/hooks/useTransactions';
import { accountTypeLabel } from '@/lib/accountTypes';
import { formatDate } from '@/lib/datetime';
import type { Account, Transaction } from '@/types/database';

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function ContaCorrentePage() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAccountId, setEditAccountId] = useState('');

  const activeAccount: Account | undefined = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];
  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
  const accountTransactions = activeAccount ? transactions.filter((tx) => tx.account_id === activeAccount.id) : transactions;

  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setEditDescription(tx.description);
    setEditAmount(tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setEditDate(tx.date);
    setEditAccountId(tx.account_id);
  }

  function closeEdit() {
    setEditingTx(null);
  }

  async function saveEdit() {
    if (!editingTx || !editDescription.trim() || !editAmount.trim() || !editAccountId) return;
    await updateTransaction.mutateAsync({
      id: editingTx.id,
      account_id: editAccountId,
      description: editDescription,
      amount: parseCurrencyInput(editAmount),
      date: editDate,
      notes: editingTx.notes ?? undefined,
    });
    closeEdit();
  }

  return (
    <div className="page-view">
      <SectionPageTitle title="Conta corrente" action="Cadastrar conta bancária" onAction={() => navigate('/app/bancos')} />

      {isLoading && <p className="empty-state">Carregando contas...</p>}

      {!isLoading && accounts.length === 0 && (
        <p className="empty-state">
          Você ainda não cadastrou nenhuma conta bancária. Vá em "Bancos" no menu para cadastrar a primeira.
        </p>
      )}

      {activeAccount && (
        <div className="account-selector-row">
          <div>
            <label>Conta selecionada</label>
            <select value={activeAccount.id} onChange={(event) => setSelectedAccountId(event.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.institution} — {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="current-balance">
            <span>Saldo disponível</span>
            <strong>{formatCurrency(activeAccount.balance)}</strong>
            <small>
              {activeAccount.institution} · {accountTypeLabel(activeAccount.type)}
            </small>
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="account-balances">
          <div className="total-balance-card">
            <span>Saldo total</span>
            <strong>{formatCurrency(totalBalance)}</strong>
            <small>{accounts.length} contas cadastradas</small>
          </div>
          <div className="account-balance-list">
            {accounts.map((account) => (
              <button
                className={`account-balance-card ${account.id === activeAccount?.id ? 'selected' : ''}`}
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
              >
                <span>{account.institution}</span>
                <strong>{account.name}</strong>
                <small>{accountTypeLabel(account.type)}</small>
                <b>{formatCurrency(account.balance)}</b>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-search">
          <Search />
          <input placeholder="Buscar transação" />
        </div>
        <label>
          <CalendarDays /> Data
          <select>
            <option>Todo o período</option>
            <option>Este mês</option>
          </select>
        </label>
        <label>
          <Filter /> Banco
          <select key={activeAccount?.institution ?? 'none'} defaultValue={activeAccount?.institution ?? 'Todos'}>
            <option>{activeAccount?.institution ?? 'Todos'}</option>
          </select>
        </label>
        <label>
          Forma de pagamento
          <select>
            <option>Todas</option>
            <option>Pix</option>
            <option>Cartão de crédito</option>
          </select>
        </label>
      </div>

      <div className="list-card transaction-card">
        <div className="transaction-head">
          <span>Descrição</span>
          <span>Data e horário</span>
          <span>Banco</span>
          <span>Forma de pagamento</span>
          <span>Valor</span>
        </div>
        {accountTransactions.length === 0 && <p className="empty-state">Nenhuma transação registrada ainda.</p>}
        {accountTransactions.map((tx) => {
          const account = accounts.find((a) => a.id === tx.account_id);
          return (
            <div className="transaction-row" key={tx.id}>
              <div>
                <strong>{tx.description}</strong>
                <small>{formatDate(tx.date)}</small>
              </div>
              <span>{formatDate(tx.date)}</span>
              <span>{account?.institution ?? '—'}</span>
              <span>{tx.type === 'transfer' ? 'Transferência' : tx.notes || '—'}</span>
              <b className={tx.type === 'income' ? 'income' : ''}>
                {tx.type === 'income' ? '+ ' : '- '}
                {formatCurrency(tx.amount)}
              </b>
              <div className="transaction-actions">
                <button className="edit-button" aria-label={`Editar ${tx.description}`} onClick={() => openEdit(tx)}>
                  <Pencil />
                </button>
                <button aria-label={`Excluir ${tx.description}`} onClick={() => deleteTransaction.mutate(tx.id)}>
                  <Trash2 />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={editingTx !== null} onClose={closeEdit} title="Editar transação">
        <div className="bank-account-form">
          <div className="field">
            <label>Descrição</label>
            <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </div>
          <div className="field">
            <label>Valor</label>
            <CurrencyInput value={editAmount} onChange={setEditAmount} />
          </div>
          <div className="field">
            <label>Data</label>
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Conta</label>
            <select value={editAccountId} onChange={(e) => setEditAccountId(e.target.value)}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.institution} — {account.name}
                </option>
              ))}
            </select>
          </div>
          <button className="primary-button" onClick={saveEdit} disabled={updateTransaction.isPending}>
            {updateTransaction.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
