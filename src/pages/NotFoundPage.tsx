import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SERIF = "'Playfair Display', Georgia, serif";

export function NotFoundPage() {
  return (
    <div className="auth-page-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-10 text-center">
        <span style={{ fontFamily: SERIF }} className="text-lg text-[var(--color-text-primary)]">
          inspect.finance
        </span>
        <p style={{ fontFamily: SERIF, fontWeight: 400 }} className="mt-4 text-6xl text-[var(--color-text-primary)]">
          404
        </p>
        <h1 className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link
          to="/"
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#76B0FF]"
        >
          Voltar para o início
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
