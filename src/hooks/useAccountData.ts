import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/** LGPD: baixa um JSON com todos os dados do usuário logado. */
export function useExportUserData() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<Record<string, unknown>>('export-user-data');
      if (error) throw error;
      if (!data) throw new Error('Não foi possível exportar seus dados');

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'meus-dados.json';
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}

/** LGPD: exclui a conta e todos os dados associados (irreversível). */
export function useDeleteAccount() {
  const { signOut } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('delete-account');
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error ?? 'Não foi possível excluir a conta');
    },
    onSuccess: async () => {
      await signOut();
    },
  });
}
