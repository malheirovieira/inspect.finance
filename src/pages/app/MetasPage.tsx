import { useState, type CSSProperties } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { CurrencyInput, parseCurrencyInput } from '@/components/CurrencyInput';
import { useAddGoalContribution, useCreateGoal, useGoalContributions, useGoals, useUpdateGoal } from '@/hooks/useGoals';
import { useRevealOnVisible } from '@/hooks/useRevealOnVisible';
import { formatDateTime } from '@/lib/datetime';

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function GoalHistory({ goalId }: { goalId: string }) {
  const { data: contributions = [], isLoading } = useGoalContributions(goalId);
  return (
    <div className="deposit-history">
      <div className="history-title">
        <strong>Histórico de depósitos</strong>
        <span>{contributions.length} lançamentos</span>
      </div>
      {isLoading && <p>Carregando...</p>}
      {!isLoading && contributions.length === 0 && <p>Nenhum depósito registrado ainda.</p>}
      {contributions.map((contribution) => (
        <div className="history-row" key={contribution.id}>
          <span>{formatDateTime(contribution.created_at, { dateStyle: 'short', timeStyle: 'short' })}</span>
          <b>{formatCurrency(contribution.amount)}</b>
          <small>{contribution.notes || 'Depósito'}</small>
        </div>
      ))}
    </div>
  );
}

export function MetasPage() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const addContribution = useAddGoalContribution();
  const [goalsGridRef, goalsGridVisible] = useRevealOnVisible<HTMLDivElement>();

  const [showForm, setShowForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [depositGoal, setDepositGoal] = useState<string | null>(null);
  const [historyGoal, setHistoryGoal] = useState<string | null>(null);
  const [deposit, setDeposit] = useState('');

  function resetForm() {
    setTitle('');
    setTargetAmount('');
    setEditingGoalId(null);
    setShowForm(false);
  }

  function startEdit(goalId: string, name: string, target: number) {
    setTitle(name);
    setTargetAmount(target.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setEditingGoalId(goalId);
    setShowForm(true);
  }

  async function addGoal() {
    if (!title.trim()) return;
    if (editingGoalId) {
      await updateGoal.mutateAsync({ id: editingGoalId, name: title, target_amount: parseCurrencyInput(targetAmount) || 5000 });
    } else {
      await createGoal.mutateAsync({ name: title, target_amount: parseCurrencyInput(targetAmount) || 5000 });
    }
    resetForm();
  }

  async function addDeposit(goalId: string, currentAmount: number, targetAmountValue: number) {
    const value = parseCurrencyInput(deposit);
    if (!value || value <= 0) return;
    await addContribution.mutateAsync({ goalId, amount: value, currentAmount, targetAmount: targetAmountValue });
    setDeposit('');
    setDepositGoal(null);
  }

  return (
    <div className="page-view">
      <SectionPageTitle title="Metas" action={showForm ? undefined : 'Criar nova meta'} onAction={() => setShowForm(true)} />

      {showForm && (
        <div className="form-card goal-form">
          <button className="form-close" type="button" onClick={resetForm} aria-label={editingGoalId ? 'Cancelar edição da meta' : 'Cancelar criação da meta'}>
            <X />
          </button>
          <div className="field">
            <label>Título da meta</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Comprar um carro" />
          </div>
          <div className="field">
            <label>Valor desejado</label>
            <CurrencyInput value={targetAmount} onChange={setTargetAmount} />
          </div>
          <button className="primary-button" onClick={addGoal} disabled={createGoal.isPending || updateGoal.isPending}>
            {createGoal.isPending || updateGoal.isPending ? 'Salvando...' : editingGoalId ? 'Salvar alterações' : 'Criar meta'}
          </button>
        </div>
      )}

      {isLoading && <p className="empty-state">Carregando metas...</p>}
      {!isLoading && goals.length === 0 && !showForm && <p className="empty-state">Nenhuma meta cadastrada ainda. Crie a primeira!</p>}

      <div className="goals-grid" ref={goalsGridRef}>
        {goals.map((goal, goalIndex) => {
          const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
          const remaining = goal.target_amount - goal.current_amount;

          return (
            <article
              className={`goal-card stagger-fade-item ${historyGoal === goal.id ? 'history-open' : ''}`}
              style={{ animationDelay: `${goalIndex * 100}ms` }}
              key={goal.id}
            >
              <div className="goal-top">
                <div>
                  <span className="goal-type">Economia</span>
                  <h3>{goal.name}</h3>
                </div>
                <div
                  className="donut"
                  style={{ '--progress': `${(goalsGridVisible ? progress : 0) * 3.6}deg` } as CSSProperties}
                >
                  <span>{progress}%</span>
                </div>
              </div>
              <div className="goal-values">
                <span>
                  Guardado
                  <strong>{formatCurrency(goal.current_amount)}</strong>
                </span>
                <span>
                  Objetivo
                  <strong>{formatCurrency(goal.target_amount)}</strong>
                </span>
              </div>
              <div className="progress-line">
                <i style={{ width: goalsGridVisible ? `${progress}%` : 0 }} />
              </div>
              <p>{remaining > 0 ? `Faltam ${formatCurrency(remaining)} para concluir esta meta.` : 'Meta concluída.'}</p>
              <div className="goal-actions">
                <button className="deposit-button" onClick={() => setDepositGoal(goal.id)}>
                  <Plus /> Alimentar meta
                </button>
                <button className="edit-button" aria-label={`Editar ${goal.name}`} onClick={() => startEdit(goal.id, goal.name, goal.target_amount)}>
                  <Pencil />
                </button>
                <button className="history-button" onClick={() => setHistoryGoal(historyGoal === goal.id ? null : goal.id)}>
                  {historyGoal === goal.id ? (
                    <>
                      <X /> Fechar histórico
                    </>
                  ) : (
                    'Histórico de depósitos'
                  )}
                </button>
              </div>
              {historyGoal === goal.id && <GoalHistory goalId={goal.id} />}
              {depositGoal === goal.id && (
                <div className="deposit-form">
                  <CurrencyInput autoFocus value={deposit} onChange={setDeposit} placeholder="Valor do depósito" />
                  <button onClick={() => addDeposit(goal.id, goal.current_amount, goal.target_amount)} disabled={addContribution.isPending}>
                    {addContribution.isPending ? 'Salvando...' : 'Depositar'}
                  </button>
                  <button className="deposit-cancel" onClick={() => setDepositGoal(null)} aria-label="Cancelar depósito">
                    <X />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
