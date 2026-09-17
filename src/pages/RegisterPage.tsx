import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Check, Mail, User, X } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/database';

const PASSWORD_RULES = [
  { label: 'Mínimo de 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: '1 letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: '1 letra minúscula', test: (v: string) => /[a-z]/.test(v) },
  { label: '1 número', test: (v: string) => /[0-9]/.test(v) },
  { label: '1 caractere especial (ex: ! @ # $)', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Precisa de ao menos 1 letra maiúscula')
      .regex(/[a-z]/, 'Precisa de ao menos 1 letra minúscula')
      .regex(/[0-9]/, 'Precisa de ao menos 1 número')
      .regex(/[^A-Za-z0-9]/, 'Precisa de ao menos 1 caractere especial'),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
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
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [plan, setPlan] = useState<Plan>(() => getInitialPlan(location.state));
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(() => getInitialBillingCycle(location.state));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = registerSchema.safeParse({ fullName, email, password, confirmPassword, acceptedTerms });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }

    setSubmitting(true);
    try {
      const { hasSession } = await signUp({ email, password, fullName, plan });
      trackEvent('signup_completed', { plan, billing_cycle: billingCycle, needs_email_confirmation: !hasSession });
      if (hasSession) {
        // Ativação (trial grátis ou pagamento com cartão/PIX) acontece toda em /completar-pagamento
        // — a confirmação de e-mail é só um lembrete não-bloqueante (EmailVerificationBanner),
        // nunca uma condição pra liberar o acesso.
        navigate('/completar-pagamento', { state: { plan, billingCycle }, replace: true });
      } else {
        // Projeto com "Confirm email" ligado no Supabase: não existe sessão até clicar no link do
        // e-mail, então não dá pra ir pro checkout ainda — assim que confirmar e entrar, o
        // ProtectedRoute já manda pra /completar-pagamento sozinho.
        setNeedsEmailConfirmation(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar sua conta.');
    } finally {
      setSubmitting(false);
    }
  }

  if (needsEmailConfirmation) {
    return (
      <div className="auth-page-bg flex min-h-screen items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-10 text-center">
          <h1 className="text-lg font-semibold">Confirme seu e-mail</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, é só entrar — a escolha de plano e
            pagamento continua de onde parou.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-medium text-[#1e2a0e] hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md p-10">
        <div className="space-y-1 text-center">
          <Link to="/" style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="mb-2 inline-block text-2xl font-semibold">
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
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={setPassword}
              placeholder="Crie uma senha"
            />
            {password.length > 0 && (
              <ul className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={cn('flex items-center gap-1.5 text-xs', met ? 'text-[#1e2a0e]' : 'text-muted-foreground')}
                    >
                      {met ? <Check size={12} className="shrink-0" /> : <X size={12} className="shrink-0 opacity-50" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repita a senha"
            />
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

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              Li e aceito os{' '}
              <Link to="/termos" target="_blank" className="font-medium text-[#1e2a0e] hover:underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link to="/privacidade" target="_blank" className="font-medium text-[#1e2a0e] hover:underline">
                Política de Privacidade
              </Link>
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={submitting || !acceptedTerms}
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
