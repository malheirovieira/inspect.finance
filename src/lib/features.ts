import type { FeatureKey, Plan, PlanRow } from '@/types/database';

/**
 * Checa se um plano tem uma feature, a partir da lista carregada de `plans` (banco) — em vez de
 * checar `plan === 'pro'` espalhado pelo código. Ver `usePlans()` / `useHasFeature()`.
 */
export function hasFeature(plans: PlanRow[] | undefined, plan: Plan | undefined | null, key: FeatureKey): boolean {
  if (!plans || !plan) return false;
  const row = plans.find((p) => p.name === plan);
  return row?.features.includes(key) ?? false;
}
