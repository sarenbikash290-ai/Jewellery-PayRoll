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
import AdvancePaymentPage from '@/components/AdvancePayment';
import GlobalModals from '@/components/GlobalModals';
import PayrollLocks from '@/components/PayrollLocks';
import LoginScreen, { checkAdminSession, logoutAdmin } from '@/components/LoginScreen';
import { useState, useEffect } from 'react';

function AppShell({ onLogout }: { onLogout: () => void }) {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen } = useApp();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':       return <Dashboard />;
      case 'employees':       return <Employees />;
      case 'attendance':      return <Attendance />;
      case 'payroll':         return <Payroll />;
      case 'incentives':      return <Incentives />;
      case 'advance-payment': return <AdvancePaymentPage />;
      case 'reports':         return <Reports />;
      case 'payroll-locks':   return <PayrollLocks />;
      default:                return <Dashboard />;
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
          onLogout={onLogout}
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
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    checkAdminSession().then(setAuthed);
  }, []);

  const handleLogin = () => setAuthed(true);

  const handleLogout = async () => {
    await logoutAdmin();
    setAuthed(false);
  };

  // Still checking session — show nothing to prevent flash
  if (authed === null) return null;

  if (!authed) {
    return <LoginScreen onSuccess={handleLogin} />;
  }

  return (
    <AppProvider>
      <AppShell onLogout={handleLogout} />
    </AppProvider>
  );
}
