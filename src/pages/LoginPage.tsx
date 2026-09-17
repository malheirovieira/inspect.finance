import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';

export function LoginPage() {
  const { signIn, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quem decide se a conta tem acesso (trial válido, assinatura ativa, nunca ativou, vencida...)
  // é só o ProtectedRoute, uma vez, ao entrar em /app — nada aqui reavalia isso, pra não ter duas
  // fontes de verdade brigando e ficando num vai-e-volta entre /login e /app.
  if (!loading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-10">
        <div className="space-y-1 text-center">
          <Link to="/" style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="mb-2 inline-block text-2xl font-semibold">
            inspect.finance
          </Link>
          <h1 className="text-lg font-semibold">Entrar na sua conta</h1>
          <p className="text-sm text-muted-foreground">Acesse seu painel financeiro</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="icon-input-wrapper">
              <Mail />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="icon-input focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link to="/forgot-password" className="text-xs text-[#05132a] hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full bg-[var(--color-accent)] text-[#0A0A0A] hover:bg-[#76B0FF]" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-[#05132a] hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
