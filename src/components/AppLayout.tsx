import { Outlet, useLocation } from 'react-router-dom';
import '@/styles/dashboard.css';
import { Sidebar } from './Sidebar';
import { EmailVerificationBanner } from './EmailVerificationBanner';

export function AppLayout() {
  const location = useLocation();
  return (
    <main className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-content">
        <EmailVerificationBanner />
        {/* key pelo pathname: remonta o container a cada navegação, reiniciando o fade/translateY
            do .page-transition (ver dashboard.css) — transição sutil, sem slide lateral. */}
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
