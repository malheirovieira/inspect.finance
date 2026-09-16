import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCurrentSubscription } from '@/hooks/useSubscription';
import { usePlanCheckout } from '@/hooks/usePlanCheckout';
import { PixCheckout } from '@/components/PixCheckout';
import { hasBillingAccess, PLAN_LABELS, PLAN_PRICES } from '@/lib/planAccess';
import { formatDate } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/database';

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

/**
 * Tela de ativação de pagamento — fora do shell do app (sem sidebar). É aqui que quem acabou de
 * se cadastrar (ou abandonou o checkout antes) completa o pagamento antes de ganhar acesso ao SaaS.
 * Troca de plano de quem já é cliente ativo acontece dentro do app, em /app/assinatura.
 */
export function CompletePaymentPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription } = useCurrentSubscription();
  const {
    billingCycle,
    setBillingCycle,
    pendingPlan,
    pixState,
    setPixState,
    error,
    payWithCard,
    payWithPix,
    startTrial,
    isCardPending,
    isPixPending,
    isTrialPending,
  } = usePlanCheckout();

  const canStartFreeTrial = !subscription;

  useEffect(() => {
    if (hasBillingAccess(profile)) navigate('/app/dashboard', { replace: true });
  }, [profile, navigate]);

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? '';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: '#e0e0e0' }}>
      <div className="glass-card w-full max-w-3xl p-10">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-2xl font-semibold">inspect.finance</h1>
          <h2 className="text-lg font-semibold">{fullName ? `Falta pouco, ${fullName}!` : 'Falta pouco!'}</h2>
          <p className="text-sm text-muted-foreground">
            Escolha o plano e a forma de pagamento para liberar o acesso ao painel.
          </p>
        </div>

        {(loading || profileLoading) && <p className="mt-6 text-center text-sm text-muted-foreground">Carregando...</p>}

        {subscription?.status === 'cancelled' && (
          <p className="mt-4 rounded-md bg-black/5 p-3 text-center text-xs text-muted-foreground">
            Sua assinatura anterior foi cancelada{subscription.current_period_end ? ` (acesso válido até ${formatDate(subscription.current_period_end)})` : ''}. Escolha um plano para reativar.
          </p>
        )}

        {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className={cn('text-xs font-medium', billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>Mensal</span>
          <label className="switch">
            <input type="checkbox" checked={billingCycle === 'annual'} onChange={(e) => setBillingCycle(e.target.checked ? 'annual' : 'monthly')} />
            <span className="slider" />
          </label>
          <span className={cn('text-xs font-medium', billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground')}>
            Anual (~20% off)
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(Object.keys(PLAN_LABELS) as Plan[]).map((plan) => {
            const isPending = pendingPlan === plan && (isCardPending || isPixPending || isTrialPending);
            const showFreeTrial = plan === 'basic' && canStartFreeTrial;
            return (
              <div key={plan} className="flex flex-col rounded-md border border-muted-foreground/20 p-4">
                <span className="text-xs font-medium text-muted-foreground">{billingCycle === 'monthly' ? PLAN_PRICES[plan] : ANNUAL_PRICES[plan]}</span>
                <h3 className="mt-1 text-base font-semibold">{PLAN_LABELS[plan]}</h3>
                <ul className="mt-3 flex-1 space-y-2">
                  {PLAN_FEATURES[plan].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#1e2a0e]" /> {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2">
                  {showFreeTrial && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={startTrial}
                      className="w-full rounded-md bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-[#0A0A0A] hover:bg-[#D9FF33] disabled:opacity-50"
                    >
                      {isPending && isTrialPending ? 'Ativando...' : 'Começar grátis por 7 dias'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => payWithCard(plan)}
                    className="w-full rounded-md bg-[#1e2a0e] px-3 py-2 text-xs font-medium text-white hover:bg-[#2a3b14] disabled:opacity-50"
                  >
                    {isPending && isCardPending ? 'Redirecionando...' : showFreeTrial ? 'Assinar já com cartão' : 'Pagar com cartão'}
                  </button>
                  {plan !== 'basic' && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => payWithPix(plan)}
                      className="w-full rounded-md border border-muted-foreground/20 px-3 py-2 text-xs font-medium text-foreground hover:bg-black/5 disabled:opacity-50"
                    >
                      {isPending && isPixPending ? 'Gerando PIX...' : 'Pagar com PIX'}
                    </button>
                  )}
                </div>
                {plan === 'basic' && !showFreeTrial && (
                  <p className="mt-2 text-[11px] text-muted-foreground">Seu período gratuito já foi usado nesta conta.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {pixState && (
        <PixCheckout
          pix={pixState.data}
          onClose={() => setPixState(null)}
          onConfirmed={() => {
            setPixState(null);
            navigate('/app/dashboard', { replace: true });
          }}
        />
      )}
    </div>
  );
}
