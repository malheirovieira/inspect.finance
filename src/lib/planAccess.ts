import type { Plan, Profile } from '@/types/database';

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

/** Pro e Casal têm os benefícios do plano Pro (IA financeira, relatórios avançados, integração bancária). */
export function hasProAccess(plan: Plan | undefined | null): boolean {
  return plan === 'pro' || plan === 'duo';
}

/** Apenas o plano Casal tem acesso a finanças compartilhadas (aba Colaboradores). */
export function hasDuoAccess(plan: Plan | undefined | null): boolean {
  return plan === 'duo';
}

/**
 * Acesso ao app liberado só depois do pagamento confirmado pela AbacatePay (via webhook):
 * `plan_status === 'active'`, ou `'trial'` com `trial_ends_at` real e ainda no futuro.
 * Um cadastro novo sem pagamento confirmado ainda fica com `trial_ends_at` nulo.
 */
export function hasBillingAccess(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.plan_status === 'active') return true;
  if (profile.plan_status === 'trial' && profile.trial_ends_at) {
    return new Date(profile.trial_ends_at).getTime() > Date.now();
  }
  return false;
}
