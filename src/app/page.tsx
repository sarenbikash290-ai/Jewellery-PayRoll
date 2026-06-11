'use client';
import { AppProvider, useApp } from '@/components/AppContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import Employees from '@/components/Employees';
import Attendance from '@/components/Attendance';
import Payroll from '@/components/Payroll';
import Incentives from '@/components/Incentives';
import Reports from '@/components/Reports';
import GlobalModals from '@/components/GlobalModals';

function AppShell() {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen } = useApp();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':   return <Dashboard />;
      case 'employees':   return <Employees />;
      case 'attendance':  return <Attendance />;
      case 'payroll':     return <Payroll />;
      case 'incentives':  return <Incentives />;
      case 'reports':     return <Reports />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <Sidebar
        active={activeModule}
        onNavigate={(m) => setActiveModule(m)}
        open={sidebarOpen}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header
          activeModule={activeModule}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {renderModule()}
        </main>
      </div>
      <GlobalModals />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
