import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { CompletePaymentPage } from '@/pages/CompletePaymentPage';
import { PlanExpiredPage } from '@/pages/PlanExpiredPage';
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
import { OnboardingPage } from '@/pages/app/OnboardingPage';
import { ParametrizacoesPage } from '@/pages/app/ParametrizacoesPage';
import { EmptyPage } from '@/components/dashboard/EmptyPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

const queryClient = new QueryClient();

export function App() {
  useSmoothScroll();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/completar-pagamento" element={<CompletePaymentPage />} />
          <Route path="/plano-expirado" element={<PlanExpiredPage />} />
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
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="ajuda" element={<EmptyPage title="Ajuda" />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
