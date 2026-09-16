import { useState } from 'react';
import { useCreateCardSubscription, useCreatePixCharge, useStartFreeTrial } from '@/hooks/useSubscription';
import type { BillingCycle, Plan } from '@/types/database';

interface PixState {
  plan: Plan;
  data: { brCode: string; brCodeBase64: string; expiresAt: string };
}

/** Lógica compartilhada de escolha de plano + forma de pagamento (cartão redireciona, PIX abre o QR Code, trial libera na hora). */
export function usePlanCheckout() {
  const createCard = useCreateCardSubscription();
  const createPix = useCreatePixCharge();
  const startFreeTrial = useStartFreeTrial();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [pixState, setPixState] = useState<PixState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freeTrialStarted, setFreeTrialStarted] = useState(false);

  async function payWithCard(plan: Plan) {
    setError(null);
    setPendingPlan(plan);
    try {
      const result = await createCard.mutateAsync({ plan, billingCycle });
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.');
      setPendingPlan(null);
    }
  }

  async function payWithPix(plan: Plan) {
    setError(null);
    setPendingPlan(plan);
    try {
      const pix = await createPix.mutateAsync({ plan, billingCycle });
      setPixState({ plan, data: pix });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o PIX.');
    } finally {
      setPendingPlan(null);
    }
  }

  async function startTrial() {
    setError(null);
    setPendingPlan('basic');
    try {
      await startFreeTrial.mutateAsync();
      setFreeTrialStarted(true);
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
    pixState,
    setPixState,
    error,
    payWithCard,
    payWithPix,
    startTrial,
    freeTrialStarted,
    isCardPending: createCard.isPending,
    isPixPending: createPix.isPending,
    isTrialPending: startFreeTrial.isPending,
  };
}
