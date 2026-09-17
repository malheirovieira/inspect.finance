import { Component, type ErrorInfo, type ReactNode } from 'react';

const SERIF = "'Playfair Display', Georgia, serif";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Boundary de último recurso: se qualquer erro de render escapar de todo o
 * resto do app, mostra uma tela de recuperação em vez de uma página branca
 * em silêncio. Não substitui tratamento de erro local em cada tela.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-page-bg flex min-h-screen items-center justify-center px-4">
          <div className="glass-card w-full max-w-md p-10 text-center">
            <span style={{ fontFamily: SERIF }} className="text-lg text-[var(--color-text-primary)]">
              inspect.finance
            </span>
            <h1 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Algo deu errado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Encontramos um erro inesperado. Tente recarregar a página — se o problema continuar, entre em contato
              com o suporte.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#D9FF33]"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
