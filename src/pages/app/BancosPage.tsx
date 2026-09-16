import { useState } from 'react';
import { Landmark, Trash2, X } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { useAccounts, useCreateAccount, useDeleteAccount } from '@/hooks/useAccounts';
import { ACCOUNT_TYPE_OPTIONS, accountTypeLabel } from '@/lib/accountTypes';
import type { AccountType } from '@/types/database';

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function BancosPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const isCard = type === 'credit_card';

  async function addBank() {
    if (!name.trim() || !institution.trim()) return;
    await createAccount.mutateAsync({
      name,
      institution,
      type,
      balance: isCard ? 0 : Number(balance.replace(',', '.')) || 0,
      credit_limit: isCard ? Number(creditLimit.replace(',', '.')) || 0 : undefined,
    });
    setName('');
    setInstitution('');
    setBalance('');
    setCreditLimit('');
    setType('checking');
    setShowForm(false);
  }

  const banks = accounts.filter((account) => account.type !== 'credit_card');
  const cards = accounts.filter((account) => account.type === 'credit_card');

  return (
    <div className="page-view">
      <SectionPageTitle title="Bancos" action="Cadastrar banco ou cartão" onAction={() => setShowForm((current) => !current)} />

      <p className="empty-state">Cadastre seus bancos, contas e cartões aqui. As demais telas do sistema (Receitas, Despesas, Conta corrente, Metas) usam esta lista para você apenas selecionar, sem precisar digitar os dados de novo.</p>

      {showForm && (
        <div className="form-card bank-account-form">
          <button className="form-close" type="button" onClick={() => setShowForm(false)} aria-label="Cancelar cadastro">
            <X />
          </button>
          <div className="field">
            <label>Instituição</label>
            <input value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="Ex.: Nubank" />
          </div>
          <div className="field">
            <label>Nome da conta ou cartão</label>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Conta principal" />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select value={type} onChange={(event) => setType(event.target.value as AccountType)}>
              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {isCard ? (
            <div className="field">
              <label>Limite do cartão</label>
              <input value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
          ) : (
            <div className="field">
              <label>Saldo inicial</label>
              <input value={balance} onChange={(event) => setBalance(event.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
          )}
          <button className="primary-button" onClick={addBank} disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {isLoading && <p className="empty-state">Carregando...</p>}

      <div className="list-card">
        <div className="list-card-title">
          <div>
            <h3>Bancos e contas</h3>
            <p>Contas correntes, poupanças, carteiras e investimentos</p>
          </div>
          <span>{banks.length} cadastrados</span>
        </div>
        {banks.length === 0 && <p className="empty-state">Nenhum banco cadastrado ainda.</p>}
        {banks.map((account) => (
          <div className="account-row" key={account.id}>
            <div className="account-icon">
              <Landmark />
            </div>
            <div className="account-main">
              <strong>{account.institution}</strong>
              <small>
                {account.name} · {accountTypeLabel(account.type)}
              </small>
            </div>
            <b>{formatCurrency(account.balance)}</b>
            <button aria-label={`Excluir ${account.institution}`} onClick={() => deleteAccount.mutate(account.id)}>
              <Trash2 />
            </button>
          </div>
        ))}
      </div>

      <div className="list-card">
        <div className="list-card-title">
          <div>
            <h3>Cartões</h3>
            <p>Cartões de crédito cadastrados</p>
          </div>
          <span>{cards.length} cadastrados</span>
        </div>
        {cards.length === 0 && <p className="empty-state">Nenhum cartão cadastrado ainda.</p>}
        {cards.map((account) => (
          <div className="account-row" key={account.id}>
            <div className="account-icon">
              <Landmark />
            </div>
            <div className="account-main">
              <strong>{account.institution}</strong>
              <small>{account.name}</small>
            </div>
            <b>Limite {formatCurrency(account.credit_limit ?? 0)}</b>
            <button aria-label={`Excluir ${account.institution}`} onClick={() => deleteAccount.mutate(account.id)}>
              <Trash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
