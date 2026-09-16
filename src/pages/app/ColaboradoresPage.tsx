import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, X } from 'lucide-react';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { useDuoLinks, useInviteDuoPartner } from '@/hooks/useDuoLinks';
import { useProfile } from '@/hooks/useProfile';
import { usePlans } from '@/hooks/usePlans';
import { hasFeature } from '@/lib/features';
import { formatDate } from '@/lib/datetime';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Convite pendente',
  active: 'Ativo',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
};

function initialsFromEmail(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function ColaboradoresPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: links = [], isLoading } = useDuoLinks();
  const inviteDuoPartner = useInviteDuoPartner();

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');

  // Enquanto perfil/planos ainda carregam, não mostra o conteúdo real nem o aviso de bloqueio —
  // evita o "flash" de conteúdo liberado antes da checagem de plano terminar.
  if (profileLoading || plansLoading) {
    return (
      <div className="page-view">
        <SectionPageTitle title="Colaboradores" />
        <p className="empty-state">Carregando...</p>
      </div>
    );
  }

  if (!hasFeature(plans, profile?.plan, 'duo_view')) {
    return (
      <div className="page-view">
        <SectionPageTitle title="Colaboradores" />
        <div className="couple-plan-note">
          <strong>Recurso exclusivo do Plano Casal</strong>
          <span>Faça upgrade para o Plano Casal para convidar seu parceiro ou parceira e compartilhar suas finanças.</span>
        </div>
        <button className="primary-button" onClick={() => navigate('/app/assinatura')}>
          Ver planos
        </button>
      </div>
    );
  }

  async function addCollaborator() {
    if (!email.trim()) return;
    await inviteDuoPartner.mutateAsync(email.trim());
    setEmail('');
    setShowForm(false);
  }

  const activeCount = links.filter((link) => link.status === 'active').length;

  return (
    <div className="page-view">
      <SectionPageTitle title="Colaboradores" action="Adicionar pessoa" onAction={() => setShowForm(!showForm)} />

      <div className="couple-plan-note">
        <strong>Recurso do Plano Casal</strong>
        <span>Compartilhe relatórios e acompanhe suas finanças em conjunto.</span>
      </div>

      {showForm && (
        <div className="form-card collaborator-form">
          <button className="form-close" type="button" onClick={() => setShowForm(false)} aria-label="Cancelar cadastro de colaborador">
            <X />
          </button>
          <div className="field">
            <label>E-mail da pessoa</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@email.com" />
          </div>
          <button className="primary-button" onClick={addCollaborator} disabled={inviteDuoPartner.isPending}>
            {inviteDuoPartner.isPending ? 'Enviando...' : 'Enviar convite'}
          </button>
        </div>
      )}

      <div className="collaborator-intro">
        <div>
          <span className="eyebrow">PLANO CASAL</span>
          <h3>Finanças compartilhadas</h3>
          <p>Convide seu parceiro ou sua parceira para compartilhar relatórios e cuidar das finanças juntos.</p>
        </div>
        <span>{links.length} pessoa(s) convidada(s)</span>
      </div>

      <div className="list-card collaborator-list">
        <div className="list-card-title">
          <div>
            <h3>Pessoas conectadas</h3>
            <p>Veja quem compartilha seus dados financeiros e relatórios</p>
          </div>
          <span>{activeCount} conectados</span>
        </div>
        {isLoading && <p className="empty-state">Carregando...</p>}
        {!isLoading && links.length === 0 && <p className="empty-state">Nenhum convite enviado ainda.</p>}
        {links.map((link) => (
          <div className="collaborator-row" key={link.id}>
            <div className="collaborator-avatar">{initialsFromEmail(link.invite_email ?? '??')}</div>
            <div className="account-main">
              <strong>{link.invite_email ?? 'Parceiro(a)'}</strong>
              <small>Convidado em {formatDate(link.invited_at)}</small>
            </div>
            <span className="collaborator-role">Parceiro(a)</span>
            <span className={`collaborator-status ${link.status === 'active' ? 'active' : ''}`}>{STATUS_LABELS[link.status]}</span>
            <button className="collaborator-menu" aria-label={`Opções de ${link.invite_email}`}>
              <MoreHorizontal />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
