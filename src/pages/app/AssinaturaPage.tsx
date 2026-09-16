import { Check } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { useProfile } from '@/hooks/useProfile';
import { useCancelSubscription, useCurrentSubscription } from '@/hooks/useSubscription';
import { usePlanCheckout } from '@/hooks/usePlanCheckout';
import { hasBillingAccess, PLAN_LABELS, PLAN_PRICES } from '@/lib/planAccess';
import { formatDate } from '@/lib/datetime';
import type { Plan } from '@/types/database';

const PLAN_STATUS_LABELS: Record<string, string> = {
  trial: 'Em período de teste',
  active: 'Ativo',
  cancelled: 'Cancelado',
  past_due: 'Pagamento pendente',
};

const PLAN_FEATURES: Record<Plan, string[]> = {
  basic: ['Dashboard configurável', 'Gamificação e metas', 'Importação OFX/CSV', 'Lançamentos manuais', '7 dias de teste grátis'],
  pro: ['Tudo do Basic', 'IA financeira (15 consultas/dia)', 'Integração bancária automática', 'Relatórios avançados'],
  duo: ['Tudo do Pro', 'Visão consolidada do casal', 'Aba Colaboradores para convidar seu par', 'Metas compartilhadas'],
};

const ANNUAL_PRICES: Record<Plan, string> = {
  basic: 'R$ 190,80/ano',
  pro: 'R$ 287,04/ano',
  duo: 'R$ 383,04/ano',
};

export function AssinaturaPage() {
  const { data: profile, isLoading } = useProfile();
  const { data: subscription } = useCurrentSubscription();
  const cancelSubscription = useCancelSubscription();
  const { billingCycle, setBillingCycle, pendingPlan, error, payWithCard, payWithPix, isCardPending, isPixPending } = usePlanCheckout();

  const canCancel = subscription && subscription.status !== 'cancelled' && !subscription.cancel_at_period_end;

  return (
    <div className="page-view">
      <SectionPageTitle title="Assinatura" />

      {isLoading && <p className="empty-state">Carregando...</p>}

      {profile && (
        <div className="couple-plan-note">
          <strong>
            Plano atual: {PLAN_LABELS[profile.plan]} ·{' '}
            {hasBillingAccess(profile, subscription) ? (PLAN_STATUS_LABELS[profile.plan_status] ?? profile.plan_status) : 'Pagamento pendente'}
          </strong>
          <span>
            {profile.plan_status === 'cancelled' && subscription?.current_period_end
              ? `Assinatura cancelada — acesso até ${formatDate(subscription.current_period_end)}`
              : profile.plan_status === 'trial' && profile.trial_ends_at
                ? `Teste grátis termina em ${formatDate(profile.trial_ends_at)}`
                : subscription?.current_period_end
                  ? `Renova em ${formatDate(subscription.current_period_end)}`
                  : PLAN_PRICES[profile.plan]}
          </span>
        </div>
      )}

      {canCancel && (
        <button className="history-toggle" onClick={() => cancelSubscription.mutate()} disabled={cancelSubscription.isPending}>
          {cancelSubscription.isPending ? 'Cancelando...' : 'Cancelar assinatura'}
        </button>
      )}

      <p className="empty-state">Quer mudar de plano? Escolha abaixo e finalize com cartão ou PIX — a troca vale a partir da confirmação do pagamento.</p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="salary-tabs">
        <button className={billingCycle === 'monthly' ? 'active' : ''} onClick={() => setBillingCycle('monthly')}>
          Mensal
        </button>
        <button className={billingCycle === 'annual' ? 'active' : ''} onClick={() => setBillingCycle('annual')}>
          Anual (~20% off)
        </button>
      </div>

      <div className="goals-grid">
        {(Object.keys(PLAN_LABELS) as Plan[]).map((plan) => {
          const isCurrent = profile?.plan === plan && hasBillingAccess(profile, subscription);
          const isPending = pendingPlan === plan && (isCardPending || isPixPending);
          return (
            <article className="goal-card" key={plan}>
              <div className="goal-top">
                <div>
                  <span className="goal-type">{billingCycle === 'monthly' ? PLAN_PRICES[plan] : ANNUAL_PRICES[plan]}</span>
                  <h3>{PLAN_LABELS[plan]}</h3>
                </div>
              </div>
              <ul className="plan-feature-list">
                {PLAN_FEATURES[plan].map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> {feature}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="goal-actions">
                  <button className="deposit-button" disabled>
                    Plano atual
                  </button>
                </div>
              ) : (
                <div className="goal-actions">
                  <button className="deposit-button" disabled={isPending} onClick={() => payWithCard(plan)}>
                    {isPending && isCardPending ? 'Redirecionando...' : 'Pagar com cartão'}
                  </button>
                  {plan !== 'basic' && (
                    <button className="history-button" disabled={isPending} onClick={() => payWithPix(plan)}>
                      {isPending && isPixPending ? 'Gerando PIX...' : 'Pagar com PIX'}
                    </button>
                  )}
                </div>
              )}
              {plan === 'basic' && !isCurrent && <p className="empty-state">Trial de 7 dias exige cartão (sem cobrança até o fim do teste).</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
