import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const { signIn, signInWithGoogle, isAuthenticated, loading } = useAuth();
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

  async function handleGoogleSignIn() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar com o Google.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#e0e0e0' }}>
      <div className="glass-card w-full max-w-md p-10">
        <div className="space-y-1 text-center">
          <Link to="/" className="mb-2 inline-block font-heading text-2xl font-semibold">
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
              <Link to="/forgot-password" className="text-xs text-[#1e2a0e] hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="icon-input-wrapper">
              <Lock />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="icon-input focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full bg-[var(--color-accent)] text-[#0A0A0A] hover:bg-[#D9FF33]" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6">
          <p className="text-center text-xs uppercase text-muted-foreground">ou continue com</p>
        </div>

        <button type="button" className="google-btn mt-4 w-full" onClick={handleGoogleSignIn}>
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Entrar com Google
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-[#1e2a0e] hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
