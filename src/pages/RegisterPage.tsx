import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/database';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Informe seu nome completo'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de ao menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Precisa de ao menos 1 número'),
});

const PLANS: { id: Plan; name: string; priceMonthly: string; priceAnnual: string }[] = [
  { id: 'basic', name: 'Basic', priceMonthly: 'R$19,90/mês', priceAnnual: 'R$15,90/mês' },
  { id: 'pro', name: 'Pro', priceMonthly: 'R$29,90/mês', priceAnnual: 'R$23,92/mês' },
  { id: 'duo', name: 'Duo', priceMonthly: 'R$39,90/mês', priceAnnual: 'R$31,92/mês' },
];

type BillingCycle = 'monthly' | 'annual';

const VALID_PLANS: Plan[] = ['basic', 'pro', 'duo'];

function getInitialPlan(state: unknown): Plan {
  const requested = (state as { plan?: string } | null)?.plan;
  return VALID_PLANS.includes(requested as Plan) ? (requested as Plan) : 'basic';
}

function getInitialBillingCycle(state: unknown): BillingCycle {
  const requested = (state as { billingCycle?: string } | null)?.billingCycle;
  return requested === 'annual' ? 'annual' : 'monthly';
}

export function RegisterPage() {
  const { signUp, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<Plan>(() => getInitialPlan(location.state));
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(() => getInitialBillingCycle(location.state));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = registerSchema.safeParse({ fullName, email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ email, password, fullName, plan });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar sua conta.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#e0e0e0' }}>
        <div className="glass-card w-full max-w-md p-10 text-center">
          <h1 className="text-lg font-semibold">Confirme seu e-mail</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>.{' '}
            {plan === 'basic'
              ? 'Confirme para ativar seu trial de 7 dias.'
              : 'Confirme para ativar sua assinatura.'}
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-medium text-[#1e2a0e] hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: '#e0e0e0' }}>
      <div className="glass-card w-full max-w-md p-10">
        <div className="space-y-1 text-center">
          <Link to="/" className="mb-2 inline-block font-heading text-2xl font-semibold">
            inspect.finance
          </Link>
          <h1 className="text-lg font-semibold">Crie sua conta</h1>
          <p className="text-sm text-muted-foreground">
            {plan === 'basic' ? '7 dias grátis para testar' : 'Comece agora mesmo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <div className="icon-input-wrapper">
              <User />
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                className="icon-input focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
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
            <Label htmlFor="password">Senha</Label>
            <div className="icon-input-wrapper">
              <Lock />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                className="icon-input focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Escolha seu plano</Label>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  Mensal
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={billingCycle === 'annual'}
                    onChange={(e) => setBillingCycle(e.target.checked ? 'annual' : 'monthly')}
                  />
                  <span className="slider" />
                </label>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    billingCycle === 'annual' ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  Anual
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={cn(
                    'rounded-md border px-2 py-3 text-center text-sm transition-colors',
                    plan === p.id
                      ? 'border-[#1e2a0e] bg-[#1e2a0e] text-white'
                      : 'border-muted-foreground/20 text-muted-foreground hover:bg-black/5',
                  )}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className={cn('text-xs', plan === p.id ? 'text-white/70' : 'text-muted-foreground')}>
                    {billingCycle === 'monthly' ? p.priceMonthly : p.priceAnnual}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--color-accent)] text-[#0A0A0A] hover:bg-[#D9FF33]"
          >
            {submitting ? 'Criando conta...' : plan === 'basic' ? 'Começar trial de 7 dias' : 'Assinar agora'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-[#1e2a0e] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
