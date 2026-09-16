import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { RecurringTransaction } from '@/types/database';

export function useRecurringTransactions(type?: 'income' | 'expense') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recurring_transactions', user?.id, type ?? 'all'],
    queryFn: async (): Promise<RecurringTransaction[]> => {
      if (!user) return [];
      let query = supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });
}

interface CreateRecurringTransactionInput {
  account_id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  day_of_month: number;
  start_date: string;
}

export function useCreateRecurringTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRecurringTransactionInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({ user_id: user.id, frequency: 'monthly', ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', user?.id] });
    },
  });
}

interface UpdateRecurringTransactionInput {
  id: string;
  description: string;
  amount: number;
}

export function useUpdateRecurringTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, description, amount }: UpdateRecurringTransactionInput) => {
      const { error } = await supabase.from('recurring_transactions').update({ description, amount }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', user?.id] });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_transactions').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions', user?.id] });
    },
  });
}
