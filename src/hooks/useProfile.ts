import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      if (error) {
        // PGRST116 = nenhuma linha encontrada: a sessão no navegador é de um usuário que não
        // existe mais (conta apagada, por exemplo). Sem isso, a pessoa fica presa vendo "sem
        // assinatura ativa" sem entender por quê — desloga e deixa ela cair limpa na tela de login.
        if (error.code === 'PGRST116') {
          await supabase.auth.signOut();
        }
        throw error;
      }
      return data;
    },
    enabled: Boolean(user),
    retry: 2,
  });
}

/** Salva as respostas do onboarding e marca como concluído (usado tanto ao terminar quanto ao pular). */
export function useCompleteOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answers: Record<string, string>) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true, onboarding_answers: answers })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}
