import { Outlet } from 'react-router-dom';
import '@/styles/dashboard.css';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <main className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-content">
        <Outlet />
      </div>
    </main>
  );
}
