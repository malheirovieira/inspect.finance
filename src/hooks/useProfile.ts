import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/database';

/**
 * Busca a linha de `profiles` do usuário logado (plano, status, etc).
 * Único ponto de acesso a essa tabela — componentes usam este hook, nunca
 * chamam o Supabase direto (ver CLAUDE.md → Convenções Supabase).
 */
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
    retry: 2,
  });
}
