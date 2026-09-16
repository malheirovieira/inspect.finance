import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteAccount, useExportUserData } from '@/hooks/useAccountData';

export function ParametrizacoesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const exportData = useExportUserData();
  const deleteAccount = useDeleteAccount();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a conta.');
    }
  }

  return (
    <div className="page-view">
      <SectionPageTitle title="Parametrizações" />

      <div className="list-card">
        <div className="list-card-title">
          <div>
            <h3>Seus dados</h3>
            <p>De acordo com a LGPD, você pode baixar uma cópia dos seus dados a qualquer momento.</p>
          </div>
        </div>
        <div style={{ padding: '20px 0' }}>
          <button className="primary-button" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
            {exportData.isPending ? 'Gerando arquivo...' : 'Baixar meus dados (JSON)'}
          </button>
          {exportData.isError && <p className="text-sm text-destructive" style={{ marginTop: 10 }}>Não foi possível exportar seus dados.</p>}
        </div>
      </div>

      <div className="list-card" style={{ marginTop: 20 }}>
        <div className="list-card-title">
          <div>
            <h3>Excluir conta</h3>
            <p>Remove sua conta e todos os seus dados financeiros permanentemente. Essa ação não pode ser desfeita.</p>
          </div>
        </div>
        <div style={{ padding: '20px 0' }}>
          {!showDeleteConfirm ? (
            <button className="history-toggle" onClick={() => setShowDeleteConfirm(true)}>
              Excluir minha conta
            </button>
          ) : (
            <div className="form-card" style={{ margin: 0 }}>
              <div className="field" style={{ flex: '1 1 100%' }}>
                <label>Digite seu e-mail ({user?.email}) para confirmar</label>
                <input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={user?.email ?? ''} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                className="primary-button"
                style={{ background: '#c25b5b' }}
                disabled={confirmEmail !== user?.email || deleteAccount.isPending}
                onClick={handleDelete}
              >
                {deleteAccount.isPending ? 'Excluindo...' : 'Confirmar exclusão definitiva'}
              </button>
              <button className="history-button" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
