import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-charcoal/10">
          <CardHeader className="space-y-1 text-center">
            <Link to="/" className="mb-2 inline-block font-heading text-2xl font-semibold text-charcoal">
              inspect.finance
            </Link>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>Enviaremos um link de recuperação para seu e-mail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <p className="text-center text-sm text-muted-foreground">
                Se existir uma conta com o e-mail <strong>{email}</strong>, você receberá um link de recuperação em
                instantes. O link expira em 1 hora.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Lembrou a senha?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
