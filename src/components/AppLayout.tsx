import { Outlet } from 'react-router-dom';
import '@/styles/dashboard.css';
import { Sidebar } from './Sidebar';
import { EmailVerificationBanner } from './EmailVerificationBanner';

export function AppLayout() {
  return (
    <main className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-content">
        <EmailVerificationBanner />
        <Outlet />
      </div>
    </main>
  );
}
