import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Goal, GoalContribution } from '@/types/database';

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async (): Promise<Goal[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });
}

interface CreateGoalInput {
  name: string;
  target_amount: number;
  target_date?: string;
}

export function useCreateGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('goals')
        .insert({ user_id: user.id, current_amount: 0, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });
}

export function useGoalContributions(goalId: string | null) {
  return useQuery({
    queryKey: ['goal_contributions', goalId],
    queryFn: async (): Promise<GoalContribution[]> => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(goalId),
  });
}

interface AddContributionInput {
  goalId: string;
  amount: number;
  currentAmount: number;
  targetAmount: number;
  notes?: string;
}

export function useAddGoalContribution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, amount, currentAmount, targetAmount, notes }: AddContributionInput) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error: contributionError } = await supabase
        .from('goal_contributions')
        .insert({ goal_id: goalId, user_id: user.id, amount, notes });
      if (contributionError) throw contributionError;

      const newAmount = Math.min(currentAmount + amount, targetAmount);
      const { error: goalError } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', goalId);
      if (goalError) throw goalError;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['goal_contributions', variables.goalId] });
    },
  });
}
