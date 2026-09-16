import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCurrentSubscription } from '@/hooks/useSubscription';
import { hasBillingAccess } from '@/lib/planAccess';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ONBOARDING_PATH = '/app/onboarding';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription, isLoading: subscriptionLoading } = useCurrentSubscription();
  const location = useLocation();

  if (loading || (isAuthenticated && (profileLoading || subscriptionLoading))) {
    // Cobre a sessão inicial E a checagem de plano/assinatura — o app (sidebar, dashboard, etc.)
    // só renderiza depois que já sabemos se a pessoa tem acesso pago. `useProfile`/
    // `useCurrentSubscription` têm retry limitado, então isso sempre se resolve (nunca trava
    // pra sempre num spinner).
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasBillingAccess(profile, subscription)) {
    // Cadastro nunca ativado (nem trial, nem pagamento): manda pra tela de ativação, fora do shell.
    if (profile?.plan_status === 'trial' && !profile.trial_ends_at) {
      return <Navigate to="/completar-pagamento" replace />;
    }
    // Trial vencido ou assinatura cancelada/vencida sem período restante: tela dedicada, fora do
    // shell, sem nenhum redirect automático de volta (evita ping-pong com /login ou /app).
    return <Navigate to="/plano-expirado" replace />;
  }

  // Primeiro acesso com pagamento confirmado: passa pelo onboarding antes do resto do app.
  if (profile && !profile.onboarding_completed && location.pathname !== ONBOARDING_PATH) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  return <>{children}</>;
}
