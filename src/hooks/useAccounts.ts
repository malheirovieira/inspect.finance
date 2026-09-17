import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Account, AccountType } from '@/types/database';

export function useAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async (): Promise<Account[]> => {
      if (!user) return [];
      // Lê da view `accounts_with_balance`: saldo é calculado (saldo inicial + transações já
      // realizadas até hoje), nunca um valor fixo desatualizado — ver migration 008.
      const { data, error } = await supabase
        .from('accounts_with_balance')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });
}

interface CreateAccountInput {
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
  credit_limit?: number;
  color?: string;
}

export function useCreateAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ balance, ...input }: CreateAccountInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      // `balance` aqui é o saldo de abertura informado pelo usuário — gravado como
      // `initial_balance`; o saldo exibido depois é sempre calculado (ver useAccounts).
      const { data, error } = await supabase
        .from('accounts')
        .insert({ user_id: user.id, initial_balance: balance, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
    },
  });
}

export function useDeleteAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
    },
  });
}
