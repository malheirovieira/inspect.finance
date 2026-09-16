import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { hasBillingAccess } from '@/lib/planAccess';

interface ProtectedRouteProps {
  children: ReactNode;
}

const BILLING_PATH = '/app/assinatura';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Sem pagamento confirmado ainda: só a tela de Assinatura fica acessível, pra completar o checkout.
  // Só redireciona depois que o perfil terminou de carregar — nunca trava a tela esperando essa busca
  // (se ela falhar ou demorar, o app continua acessível em vez de travar num spinner infinito).
  if (!profileLoading && !hasBillingAccess(profile) && location.pathname !== BILLING_PATH) {
    return <Navigate to={BILLING_PATH} replace />;
  }

  return <>{children}</>;
}
