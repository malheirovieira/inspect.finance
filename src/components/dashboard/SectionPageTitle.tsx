import { Bell, Plus } from 'lucide-react';

interface SectionPageTitleProps {
  title: string;
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
  iconOnly?: boolean;
}

/**
 * Cabeçalho padrão de todas as páginas do app: eyebrow + título grande à
 * esquerda, sino de notificações + botão de ação (opcional, ex.: "+")
 * alinhados horizontalmente à direita, na mesma linha do título.
 */
export function SectionPageTitle({ title, eyebrow = 'FINANCE', action, onAction, iconOnly = true }: SectionPageTitleProps) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="page-heading-actions-group">
        {action && (
          <button className={iconOnly ? 'icon-action-button' : 'primary-button'} onClick={onAction} aria-label={action} title={action}>
            <Plus />
            {!iconOnly && action}
          </button>
        )}
        <button className="notification" aria-label="Notificações">
          <Bell />
          <i />
        </button>
      </div>
    </div>
  );
}
