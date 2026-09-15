import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

/**
 * Placeholder do interior do app autenticado — o dashboard completo
 * (widgets, transações, metas etc.) entra na Fase 4 do roadmap.
 */
export function AppPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="text-muted-foreground">Sessão ativa como</p>
      <p className="font-heading text-2xl font-semibold text-foreground">{user?.email}</p>
      <Button variant="outline" onClick={() => signOut()}>
        Sair
      </Button>
    </div>
  );
}
