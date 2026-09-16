import type { Plan, Profile, Subscription } from '@/types/database';

export const PLAN_LABELS: Record<Plan, string> = {
  basic: 'Plano Basic',
  pro: 'Plano Pro',
  duo: 'Plano Casal',
};

export const PLAN_PRICES: Record<Plan, string> = {
  basic: 'R$ 19,90/mês',
  pro: 'R$ 29,90/mês',
  duo: 'R$ 39,90/mês',
};

/** Nome do plano pra exibir na UI — mostra "Teste gratuito" durante o trial em vez de "Plano Basic". */
export function planDisplayLabel(profile: Profile | null | undefined): string {
  if (!profile) return 'Carregando plano...';
  if (profile.plan_status === 'trial' && profile.trial_ends_at) {
    return 'Teste gratuito (7 dias)';
  }
  return PLAN_LABELS[profile.plan];
}

/**
 * Acesso ao app liberado só depois do pagamento confirmado pela Asaas (via webhook):
 * - `plan_status === 'active'`
 * - `'trial'` com `trial_ends_at` real e ainda no futuro (cadastro sem pagamento ainda fica com
 *   `trial_ends_at` nulo, que não libera nada)
 * - `'cancelled'` mas a assinatura mais recente ainda não passou do `current_period_end` — quem
 *   cancela mantém acesso até o fim do período já pago
 * - `'past_due'` com `grace_period_end` (assinatura) ainda no futuro
 *
 * `subscription` é opcional pra não quebrar quem só tem o profile à mão — sem ela, os dois
 * últimos casos ficam bloqueados (comportamento conservador).
 */
export function hasBillingAccess(profile: Profile | null | undefined, subscription?: Subscription | null): boolean {
  if (!profile) return false;
  if (profile.plan_status === 'active') return true;
  if (profile.plan_status === 'trial' && profile.trial_ends_at) {
    return new Date(profile.trial_ends_at).getTime() > Date.now();
  }
  if (profile.plan_status === 'cancelled' && subscription?.current_period_end) {
    return new Date(subscription.current_period_end).getTime() > Date.now();
  }
  if (profile.plan_status === 'past_due' && subscription?.grace_period_end) {
    return new Date(subscription.grace_period_end).getTime() > Date.now();
  }
  return false;
}
