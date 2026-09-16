import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CircleHelp,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  Sparkles,
  Target,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { hasDuoAccess, hasProAccess, PLAN_LABELS } from '@/lib/planAccess';
import type { Plan } from '@/types/database';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  requiresPlan?: 'pro' | 'duo';
}

const MENU_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Receitas', to: '/app/receitas', icon: WalletCards },
  { label: 'Despesas', to: '/app/despesas', icon: FileText },
  { label: 'Conta corrente', to: '/app/conta-corrente', icon: WalletCards },
  { label: 'Bancos', to: '/app/bancos', icon: Landmark },
  { label: 'Metas', to: '/app/metas', icon: Target },
  { label: 'Relatórios', to: '/app/relatorios', icon: BarChart3 },
  { label: 'Finance IA', to: '/app/finance-ia', icon: Sparkles, requiresPlan: 'pro' },
  { label: 'Colaboradores', to: '/app/colaboradores', icon: UserRound, requiresPlan: 'duo' },
];

const OTHER_ITEMS: NavItem[] = [
  { label: 'Parametrizações', to: '/app/parametrizacoes', icon: Settings },
  { label: 'Assinatura', to: '/app/assinatura', icon: CreditCard },
  { label: 'Ajuda', to: '/app/ajuda', icon: CircleHelp },
];

function renderItems(items: NavItem[], plan: Plan | undefined) {
  return items.map(({ label, to, icon: Icon, requiresPlan }) => {
    const locked = (requiresPlan === 'pro' && !hasProAccess(plan)) || (requiresPlan === 'duo' && !hasDuoAccess(plan));
    return (
      <NavLink key={label} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}>
        <Icon />
        <span>{label}</span>
        {requiresPlan && (locked ? <Lock className="lock-tag" size={13} /> : <em className="pro-tag">{requiresPlan.toUpperCase()}</em>)}
      </NavLink>
    );
  });
}

export function Sidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? 'Usuário';
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const planLabel = profile ? PLAN_LABELS[profile.plan] : 'Carregando plano...';

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <div className="profile-avatar">
          <span>{initials}</span>
        </div>
        <div className="sidebar-profile-info">
          <strong>{fullName}</strong>
          <small>{planLabel}</small>
        </div>
      </div>
      <nav aria-label="Navegação principal">
        <p className="nav-label">MENU</p>
        <div className="nav-list">{renderItems(MENU_ITEMS, profile?.plan)}</div>
        <p className="nav-label nav-label-other">OUTROS</p>
        <div className="nav-list">
          {renderItems(OTHER_ITEMS, profile?.plan)}
          <button type="button" className="nav-item" onClick={handleSignOut}>
            <LogOut />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
