import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/** Faixa persistente pedindo confirmação de e-mail — não bloqueia o acesso, só lembra. */
export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.email_confirmed_at) return null;

  async function handleResend() {
    if (!user?.email) return;
    setSending(true);
    try {
      await resendVerificationEmail(user.email);
      setSent(true);
    } catch {
      // silencioso — se falhar, o usuário ainda pode tentar de novo
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="email-verification-banner">
      <Mail size={16} />
      <span>Confirme seu e-mail ({user.email}) para garantir acesso contínuo à sua conta.</span>
      <button type="button" onClick={handleResend} disabled={sending || sent}>
        {sent ? 'E-mail reenviado' : sending ? 'Enviando...' : 'Reenviar e-mail'}
      </button>
    </div>
  );
}
