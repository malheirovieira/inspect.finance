import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Transaction, TransactionType } from '@/types/database';

export function useTransactions(type?: TransactionType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', user?.id, type ?? 'all'],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return [];
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });
}

interface CreateTransactionInput {
  account_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('transactions')
        .insert({ user_id: user.id, amount_in_base_currency: input.amount, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
    },
  });
}

export function useDeleteTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });
}
