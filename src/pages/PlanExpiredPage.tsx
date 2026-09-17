import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const MESSAGES: Record<string, { title: string; body: string }> = {
  trial: {
    title: 'Seu período gratuito acabou',
    body: 'Os 7 dias grátis do plano Basic já foram usados nesta conta. Para continuar usando o inspect.finance, assine um plano.',
  },
  default: {
    title: 'Sua assinatura não está ativa',
    body: 'Não encontramos um plano ativo nesta conta. Para voltar a acessar o inspect.finance, assine um plano.',
  },
};

/**
 * Conta autenticada, mas sem acesso (trial vencido, assinatura cancelada/vencida sem período
 * restante). Só o ProtectedRoute decide mandar pra cá — página fora do /app, sem sidebar, e sem
 * nenhum redirect automático de volta, pra nunca formar um vai-e-volta com /login ou /app.
 */
export function PlanExpiredPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const message = MESSAGES[profile?.plan_status === 'trial' ? 'trial' : 'default'];

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#e0e0e0' }}>
      <div className="glass-card w-full max-w-md p-10 text-center">
        <Link to="/" className="mb-2 inline-block font-heading text-2xl font-semibold">
          inspect.finance
        </Link>
        <h1 className="text-lg font-semibold">{message.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message.body}</p>
        {user?.email && <p className="mt-2 text-xs text-muted-foreground">Conta: {user.email}</p>}
        <button
          type="button"
          onClick={() => navigate('/completar-pagamento')}
          className="mt-6 inline-block w-full rounded-md bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-[#0A0A0A] hover:bg-[#76B0FF]"
        >
          Ver planos
        </button>
        <button type="button" onClick={handleSignOut} className="mt-4 block w-full text-sm font-medium text-[#05132a] hover:underline">
          Entrar com outra conta
        </button>
      </div>
    </div>
  );
}
