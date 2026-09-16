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
import { usePlans } from '@/hooks/usePlans';
import { hasFeature } from '@/lib/features';
import { planDisplayLabel } from '@/lib/planAccess';
import type { FeatureKey, Plan, PlanRow } from '@/types/database';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  requiresFeature?: FeatureKey;
  badge?: string;
}

const MENU_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Receitas', to: '/app/receitas', icon: WalletCards },
  { label: 'Despesas', to: '/app/despesas', icon: FileText },
  { label: 'Conta corrente', to: '/app/conta-corrente', icon: WalletCards },
  { label: 'Bancos', to: '/app/bancos', icon: Landmark },
  { label: 'Metas', to: '/app/metas', icon: Target },
  { label: 'Relatórios', to: '/app/relatorios', icon: BarChart3 },
  { label: 'Finance IA', to: '/app/finance-ia', icon: Sparkles, requiresFeature: 'ai_insights', badge: 'PRO' },
  { label: 'Colaboradores', to: '/app/colaboradores', icon: UserRound, requiresFeature: 'duo_view', badge: 'DUO' },
];

const OTHER_ITEMS: NavItem[] = [
  { label: 'Parametrizações', to: '/app/parametrizacoes', icon: Settings },
  { label: 'Assinatura', to: '/app/assinatura', icon: CreditCard },
  { label: 'Ajuda', to: '/app/ajuda', icon: CircleHelp },
];

function renderItems(items: NavItem[], plan: Plan | undefined, plans: PlanRow[] | undefined) {
  return items.map(({ label, to, icon: Icon, requiresFeature, badge }) => {
    const locked = Boolean(requiresFeature) && !hasFeature(plans, plan, requiresFeature!);
    return (
      <NavLink key={label} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${locked ? 'locked' : ''}`}>
        <Icon />
        <span>{label}</span>
        {requiresFeature && (locked ? <Lock className="lock-tag" size={13} /> : <em className="pro-tag">{badge}</em>)}
      </NavLink>
    );
  });
}

export function Sidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: plans } = usePlans();

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
  const planLabel = planDisplayLabel(profile);

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
        <div className="nav-list">{renderItems(MENU_ITEMS, profile?.plan, plans)}</div>
        <p className="nav-label nav-label-other">OUTROS</p>
        <div className="nav-list">
          {renderItems(OTHER_ITEMS, profile?.plan, plans)}
          <button type="button" className="nav-item" onClick={handleSignOut}>
            <LogOut />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
