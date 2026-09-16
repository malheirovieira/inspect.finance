import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { hasFeature } from '@/lib/features';
import type { FeatureKey, PlanRow } from '@/types/database';

/** Planos e suas features — dado estático (cadastrado em `plans`), cacheado por bastante tempo. */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async (): Promise<PlanRow[]> => {
      const { data, error } = await supabase.from('plans').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

/** Atalho: `hasFeature` já resolvido pro plano do usuário logado. */
export function useHasFeature(key: FeatureKey): boolean {
  const { data: profile } = useProfile();
  const { data: plans } = usePlans();
  return hasFeature(plans, profile?.plan, key);
}
