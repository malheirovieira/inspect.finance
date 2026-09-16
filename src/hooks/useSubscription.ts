import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { BillingCycle, Plan, Subscription } from '@/types/database';

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
    retry: 2,
  });
}

interface CheckoutInput {
  plan: Plan;
  billingCycle: BillingCycle;
  method: 'CREDIT_CARD' | 'PIX';
}

/** Cria o checkout (cartão recorrente ou PIX avulso) na Asaas e devolve a URL da página hospedada. */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async ({ plan, billingCycle, method }: CheckoutInput) => {
      const { data, error } = await supabase.functions.invoke<{ link: string; error?: string }>('create-checkout', {
        body: { plan, billingCycle, method },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error ?? 'Não foi possível iniciar o pagamento');
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
