import { useState } from 'react';
import { useCreateCheckout, useStartFreeTrial } from '@/hooks/useSubscription';
import type { BillingCycle, Plan } from '@/types/database';

/** Lógica compartilhada de escolha de plano + forma de pagamento (cartão e PIX redirecionam pro checkout hospedado da Asaas, trial libera na hora). */
export function usePlanCheckout(onTrialStarted?: () => void, initialBillingCycle: BillingCycle = 'monthly') {
  const createCheckout = useCreateCheckout();
  const startFreeTrial = useStartFreeTrial();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [pendingMethod, setPendingMethod] = useState<'CREDIT_CARD' | 'PIX' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freeTrialStarted, setFreeTrialStarted] = useState(false);

  async function payWithCard(plan: Plan) {
    setError(null);
    setPendingPlan(plan);
    setPendingMethod('CREDIT_CARD');
    try {
      const result = await createCheckout.mutateAsync({ plan, billingCycle, method: 'CREDIT_CARD' });
      window.location.href = result.link;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.');
      setPendingPlan(null);
      setPendingMethod(null);
    }
  }

  async function payWithPix(plan: Plan) {
    setError(null);
    setPendingPlan(plan);
    setPendingMethod('PIX');
    try {
      const result = await createCheckout.mutateAsync({ plan, billingCycle, method: 'PIX' });
      window.location.href = result.link;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o PIX.');
      setPendingPlan(null);
      setPendingMethod(null);
    }
  }

  async function startTrial() {
    setError(null);
    setPendingPlan('basic');
    try {
      await startFreeTrial.mutateAsync();
      setFreeTrialStarted(true);
      onTrialStarted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o teste grátis.');
    } finally {
      setPendingPlan(null);
    }
  }

  return {
    billingCycle,
    setBillingCycle,
    pendingPlan,
    error,
    payWithCard,
    payWithPix,
    startTrial,
    freeTrialStarted,
    isCardPending: createCheckout.isPending && pendingMethod === 'CREDIT_CARD',
    isPixPending: createCheckout.isPending && pendingMethod === 'PIX',
    isTrialPending: startFreeTrial.isPending,
  };
}
