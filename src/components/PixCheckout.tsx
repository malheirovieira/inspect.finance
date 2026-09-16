import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Copy, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { hasBillingAccess } from '@/lib/planAccess';

interface PixCheckoutProps {
  pix: { brCode: string; brCodeBase64: string; expiresAt: string };
  onClose: () => void;
  onConfirmed: () => void;
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'expirado';
  const totalSeconds = Math.floor(msRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function PixCheckout({ pix, onClose, onConfirmed }: PixCheckoutProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [msRemaining, setMsRemaining] = useState(() => new Date(pix.expiresAt).getTime() - Date.now());
  const confirmed = hasBillingAccess(profile);

  useEffect(() => {
    if (confirmed) {
      onConfirmed();
      return;
    }
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setMsRemaining(new Date(pix.expiresAt).getTime() - Date.now());
    }, 3000);
    return () => clearInterval(interval);
  }, [confirmed, onConfirmed, pix.expiresAt, queryClient, user?.id]);

  async function copyCode() {
    await navigator.clipboard.writeText(pix.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card relative w-full max-w-sm p-8 text-center" style={{ background: '#fff' }}>
        <button onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold">Pague com PIX</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escaneie o QR Code ou copie o código abaixo</p>

        <img src={pix.brCodeBase64} alt="QR Code PIX" className="mx-auto mt-4 h-56 w-56 rounded-md border" />

        <button
          type="button"
          onClick={copyCode}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-xs text-muted-foreground hover:bg-black/5"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Código copiado!' : 'Copiar código PIX'}
        </button>

        <p className="mt-4 text-xs text-muted-foreground">Expira em {formatCountdown(msRemaining)}</p>
        <p className="mt-3 text-xs text-muted-foreground">Assim que o pagamento for confirmado, esta tela avança automaticamente.</p>
      </div>
    </div>
  );
}
