import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { BillingCycle, Plan } from '@/types/database';

interface Subscription {
  id: string;
  plan: Plan;
  billing_cycle: BillingCycle;
  status: 'trial' | 'active' | 'cancelled' | 'past_due' | 'expired';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
}

export function useCurrentSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });
}

interface PlanInput {
  plan: Plan;
  billingCycle: BillingCycle;
}

/** Cria a assinatura via cartão na AbacatePay e devolve a URL de checkout hospedada por eles. */
export function useCreateCardSubscription() {
  return useMutation({
    mutationFn: async ({ plan, billingCycle }: PlanInput) => {
      const { data, error } = await supabase.functions.invoke<{ url: string; error?: string }>('create-subscription', {
        body: { plan, billingCycle, origin: window.location.origin },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error ?? 'Não foi possível iniciar a assinatura');
      return data;
    },
  });
}

interface PixCharge {
  id: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
  error?: string;
}

/** Gera uma cobrança PIX avulsa (mensal ou o valor cheio anual) para o plano escolhido. */
export function useCreatePixCharge() {
  return useMutation({
    mutationFn: async ({ plan, billingCycle }: PlanInput) => {
      const { data, error } = await supabase.functions.invoke<PixCharge>('create-pix-charge', {
        body: { plan, billingCycle },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error ?? 'Não foi possível gerar o PIX');
      return data;
    },
  });
}

/** Ativa o trial de 7 dias sem cartão nem PIX — só pode ser usado uma vez por conta. */
export function useStartFreeTrial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ trialEndsAt: string; error?: string }>('start-free-trial');
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error ?? 'Não foi possível iniciar o teste grátis');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions', user?.id] });
    },
  });
}

export function useCancelSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('cancel-subscription');
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error ?? 'Não foi possível cancelar');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', user?.id] });
    },
  });
}
