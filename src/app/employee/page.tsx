'use client';
import { useState, useEffect } from 'react';
import { AppProvider } from '@/components/AppContext';
import EmployeeLoginScreen from '@/components/employee/EmployeeLoginScreen';
import EmployeePortal from '@/components/employee/EmployeePortal';

interface EmployeeSession {
  empId: string;
  name: string;
}

const SESSION_KEY = 'hrpulse_emp_session';

function EmployeeAppShell() {
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const handleLoginSuccess = (empSession: EmployeeSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(empSession));
    setSession(empSession);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (err) {
      console.error('Failed to log out employee from server:', err);
    }
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  if (!mounted) return null;

  if (!session) {
    return (
      <div className="dark-mode" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <EmployeeLoginScreen onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="dark-mode" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <EmployeePortal empSession={session} onLogout={handleLogout} />
    </div>
  );
}

export default function EmployeeRoute() {
  return (
    <AppProvider>
      <EmployeeAppShell />
    </AppProvider>
  );
}
