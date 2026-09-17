import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { CompletePaymentPage } from '@/pages/CompletePaymentPage';
import { PlanExpiredPage } from '@/pages/PlanExpiredPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppLayout } from '@/components/AppLayout';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { ReceitasPage } from '@/pages/app/ReceitasPage';
import { DespesasPage } from '@/pages/app/DespesasPage';
import { ContaCorrentePage } from '@/pages/app/ContaCorrentePage';
import { BancosPage } from '@/pages/app/BancosPage';
import { MetasPage } from '@/pages/app/MetasPage';
import { RelatoriosPage } from '@/pages/app/RelatoriosPage';
import { FinanceIAPage } from '@/pages/app/FinanceIAPage';
import { ColaboradoresPage } from '@/pages/app/ColaboradoresPage';
import { AssinaturaPage } from '@/pages/app/AssinaturaPage';
import { ParametrizacoesPage } from '@/pages/app/ParametrizacoesPage';
import { EmptyPage } from '@/components/dashboard/EmptyPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { trackPageview } from '@/lib/analytics';

const queryClient = new QueryClient();

/** Envia um evento de pageview ao PostHog a cada troca de rota (SPA, sem full reload). */
function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export function App() {
  useSmoothScroll();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PageviewTracker />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/completar-pagamento" element={<CompletePaymentPage />} />
            <Route path="/plano-expirado" element={<PlanExpiredPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="receitas" element={<ReceitasPage />} />
              <Route path="despesas" element={<DespesasPage />} />
              <Route path="conta-corrente" element={<ContaCorrentePage />} />
              <Route path="bancos" element={<BancosPage />} />
              <Route path="metas" element={<MetasPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="finance-ia" element={<FinanceIAPage />} />
              <Route path="colaboradores" element={<ColaboradoresPage />} />
              <Route path="parametrizacoes" element={<ParametrizacoesPage />} />
              <Route path="assinatura" element={<AssinaturaPage />} />
              <Route path="ajuda" element={<EmptyPage title="Ajuda" />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
