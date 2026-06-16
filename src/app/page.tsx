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
import LoginScreen, { isAuthenticated, setAuthenticated } from '@/components/LoginScreen';
import { useState, useEffect } from 'react';

function AppShell({ onLogout }: { onLogout: () => void }) {
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
    setAuthed(isAuthenticated());
  }, []);

  const handleLogin = () => setAuthed(true);

  const handleLogout = () => {
    setAuthenticated(false);
    setAuthed(false);
  };

  // Still checking localStorage — show nothing to prevent flash
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
