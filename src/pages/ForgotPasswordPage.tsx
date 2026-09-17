import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o link de recuperação.');
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
          <h1 className="text-lg font-semibold">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground">Enviaremos um link de recuperação para seu e-mail</p>
        </div>

        <div className="mt-6 space-y-4">
          {sent ? (
            <p className="text-center text-sm text-muted-foreground">
              Se existir uma conta com o e-mail <strong>{email}</strong>, você receberá um link de recuperação em
              instantes. O link expira em 1 hora.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full bg-[var(--color-accent)] text-[#0A0A0A] hover:bg-[#76B0FF]" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Lembrou a senha?{' '}
            <Link to="/login" className="font-medium text-[#05132a] hover:underline">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
