import { useMemo, useState } from 'react';
import { ChevronDown, CreditCard, Landmark, Plus, Trash2 } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { CurrencyInput, parseCurrencyInput } from '@/components/CurrencyInput';
import { CardPreview } from '@/components/CardPreview';
import { Modal } from '@/components/Modal';
import { useAccounts, useCreateAccount, useDeleteAccount } from '@/hooks/useAccounts';
import { ACCOUNT_TYPE_OPTIONS, accountTypeLabel } from '@/lib/accountTypes';
import type { Account, AccountType } from '@/types/database';

const BANK_TYPE_OPTIONS = ACCOUNT_TYPE_OPTIONS.filter((option) => option.value !== 'credit_card');
const CARD_BRAND_OPTIONS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Outra'];

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function StatusChip({ active }: { active: boolean }) {
  return <span className={`status-chip ${active ? 'active' : 'inactive'}`}>{active ? 'Ativo' : 'Inativo'}</span>;
}

export function BancosPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [cardModalInstitution, setCardModalInstitution] = useState<string | null>(null);
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());

  // Formulário de conta bancária (não-cartão).
  const [bankName, setBankName] = useState('');
  const [bankInstitution, setBankInstitution] = useState('');
  const [bankType, setBankType] = useState<AccountType>('checking');
  const [bankBalance, setBankBalance] = useState('');

  // Formulário de cartão — institution vem pré-preenchida (e travada) quando aberto a partir de
  // um banco específico; fica livre quando é "cartão avulso".
  const [cardInstitutionInput, setCardInstitutionInput] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState(CARD_BRAND_OPTIONS[0]);
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState('');
  const [cardDueDay, setCardDueDay] = useState('');

  const cardModalOpen = cardModalInstitution !== null;
  const cardInstitutionLocked = cardModalInstitution !== null && cardModalInstitution !== '';

  function openCardModal(institution: string) {
    setCardInstitutionInput(institution);
    setCardModalInstitution(institution);
  }

  function closeCardModal() {
    setCardModalInstitution(null);
    setCardName('');
    setCardBrand(CARD_BRAND_OPTIONS[0]);
    setCardLimit('');
    setCardClosingDay('');
    setCardDueDay('');
  }

  async function addBankAccount() {
    if (!bankName.trim() || !bankInstitution.trim()) return;
    await createAccount.mutateAsync({
      name: bankName,
      institution: bankInstitution,
      type: bankType,
      balance: parseCurrencyInput(bankBalance),
    });
    setBankName('');
    setBankInstitution('');
    setBankType('checking');
    setBankBalance('');
    setBankModalOpen(false);
  }

  async function addCard() {
    if (!cardName.trim() || !cardInstitutionInput.trim()) return;
    await createAccount.mutateAsync({
      name: cardName,
      institution: cardInstitutionInput,
      type: 'credit_card',
      balance: 0,
      credit_limit: parseCurrencyInput(cardLimit),
      card_brand: cardBrand,
      billing_closing_day: cardClosingDay ? Number(cardClosingDay) : undefined,
      billing_due_day: cardDueDay ? Number(cardDueDay) : undefined,
    });
    closeCardModal();
  }

  function toggleBankExpanded(institution: string) {
    setExpandedBanks((current) => {
      const next = new Set(current);
      if (next.has(institution)) next.delete(institution);
      else next.add(institution);
      return next;
    });
  }

  const bankAccounts = accounts.filter((account) => account.type !== 'credit_card');
  const allCards = accounts.filter((account) => account.type === 'credit_card');

  const cardsByInstitution = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const card of allCards) {
      const key = card.institution ?? '';
      map.set(key, [...(map.get(key) ?? []), card]);
    }
    return map;
  }, [allCards]);

  const bankInstitutionSet = useMemo(() => new Set(bankAccounts.map((b) => b.institution ?? '')), [bankAccounts]);
  const independentCards = allCards.filter((card) => !bankInstitutionSet.has(card.institution ?? ''));

  return (
    <div className="page-view">
      <SectionPageTitle title="Bancos" action="Adicionar conta bancária" onAction={() => setBankModalOpen(true)} />

      <p className="empty-state">Cadastre seus bancos e cartões aqui. As demais telas do sistema (Receitas, Despesas, Conta corrente, Metas) usam esta lista para você apenas selecionar, sem precisar digitar os dados de novo.</p>

      {isLoading && <p className="empty-state">Carregando...</p>}

      <div className="bank-section-divider">Contas bancárias</div>

      {bankAccounts.length === 0 && !isLoading && <p className="empty-state">Nenhuma conta bancária cadastrada ainda.</p>}

      {bankAccounts.map((account, index) => {
        const linkedCards = cardsByInstitution.get(account.institution ?? '') ?? [];
        const expanded = expandedBanks.has(account.institution ?? '');
        return (
          <article className="bank-group-card stagger-fade-item" style={{ animationDelay: `${index * 100}ms` }} key={account.id}>
            <div className="bank-group-header" onClick={() => toggleBankExpanded(account.institution ?? '')}>
              <div className="account-icon">
                <Landmark />
              </div>
              <div className="bank-group-main">
                <strong>{account.institution}</strong>
                <small>
                  {account.name} · {accountTypeLabel(account.type)}
                </small>
              </div>
              <StatusChip active={account.is_active} />
              <div className="bank-group-balance">
                <b>{formatCurrency(account.balance)}</b>
              </div>
              <button
                aria-label={`Excluir ${account.institution}`}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteAccount.mutate(account.id);
                }}
              >
                <Trash2 />
              </button>
              <ChevronDown className={`bank-group-chevron ${expanded ? 'open' : ''}`} />
            </div>

            {expanded && (
              <div className="bank-group-body">
                <p className="bank-group-body-title">Cartões vinculados</p>
                {linkedCards.length === 0 && <p className="empty-state">Nenhum cartão vinculado ainda.</p>}
                {linkedCards.map((card) => (
                  <div className="linked-card-row" key={card.id}>
                    <div className="account-icon">
                      <CreditCard />
                    </div>
                    <div className="account-main">
                      <strong>{card.name}</strong>
                      <small>{card.card_brand ?? 'Bandeira não informada'}</small>
                    </div>
                    <b>Limite {formatCurrency(card.credit_limit ?? 0)}</b>
                    <button aria-label={`Excluir ${card.name}`} onClick={() => deleteAccount.mutate(card.id)}>
                      <Trash2 />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-card-inline-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openCardModal(account.institution ?? '');
                  }}
                >
                  <Plus /> Adicionar cartão deste banco
                </button>
              </div>
            )}
          </article>
        );
      })}

      <div className="bank-section-divider">Cartões independentes</div>

      {independentCards.length === 0 ? (
        <p className="empty-state">Nenhum cartão avulso cadastrado ainda.</p>
      ) : (
        <div className="independent-cards-grid">
          {independentCards.map((card, index) => (
            <div className="account-row stagger-fade-item" style={{ animationDelay: `${index * 100}ms` }} key={card.id}>
              <div className="account-icon">
                <CreditCard />
              </div>
              <div className="account-main">
                <strong>{card.name}</strong>
                <small>{card.institution || card.card_brand || 'Cartão avulso'}</small>
              </div>
              <b>Limite {formatCurrency(card.credit_limit ?? 0)}</b>
              <button aria-label={`Excluir ${card.name}`} onClick={() => deleteAccount.mutate(card.id)}>
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="add-card-inline-button" style={{ marginTop: 14 }} onClick={() => openCardModal('')}>
        <Plus /> Adicionar cartão avulso
      </button>

      <Modal open={bankModalOpen} onClose={() => setBankModalOpen(false)} title="Adicionar conta bancária">
        <div className="bank-account-form">
          <div className="field">
            <label>Instituição</label>
            <input value={bankInstitution} onChange={(event) => setBankInstitution(event.target.value)} placeholder="Ex.: Nubank" />
          </div>
          <div className="field">
            <label>Nome da conta</label>
            <input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Ex.: Conta principal" />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select value={bankType} onChange={(event) => setBankType(event.target.value as AccountType)}>
              {BANK_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Saldo inicial</label>
            <CurrencyInput value={bankBalance} onChange={setBankBalance} />
          </div>
          <button className="primary-button" onClick={addBankAccount} disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>

      <Modal open={cardModalOpen} onClose={closeCardModal} title="Adicionar cartão">
        <div className="bank-account-form">
          <CardPreview
            holderName={cardName}
            brand={cardBrand}
            closingDay={cardClosingDay ? Number(cardClosingDay) : null}
            dueDay={cardDueDay ? Number(cardDueDay) : null}
          />
          <div className="field">
            <label>Instituição</label>
            <input
              value={cardInstitutionInput}
              onChange={(event) => setCardInstitutionInput(event.target.value)}
              disabled={cardInstitutionLocked}
              placeholder="Ex.: Nubank"
            />
          </div>
          <div className="field">
            <label>Nome do cartão</label>
            <input value={cardName} onChange={(event) => setCardName(event.target.value)} placeholder="Ex.: Cartão Roxinho" />
          </div>
          <div className="field">
            <label>Bandeira</label>
            <select value={cardBrand} onChange={(event) => setCardBrand(event.target.value)}>
              {CARD_BRAND_OPTIONS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Limite</label>
            <CurrencyInput value={cardLimit} onChange={setCardLimit} />
          </div>
          <div className="field">
            <label>Dia de fechamento</label>
            <input inputMode="numeric" value={cardClosingDay} onChange={(event) => setCardClosingDay(event.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="Ex.: 20" />
          </div>
          <div className="field">
            <label>Dia de vencimento</label>
            <input inputMode="numeric" value={cardDueDay} onChange={(event) => setCardDueDay(event.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="Ex.: 27" />
          </div>
          <button className="primary-button" onClick={addCard} disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
