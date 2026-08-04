'use client';
import {
  LayoutDashboard, Users, Clock, IndianRupee, TrendingUp,
  BarChart3, Settings, ChevronRight, Zap, LogOut,
  Shield, Lock, CreditCard
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { id: 'employees', icon: Users, label: 'Employees', badge: '247' },
  { id: 'attendance', icon: Clock, label: 'Attendance', badge: null },
  { id: 'payroll', icon: IndianRupee, label: 'Payroll', badge: null },
  { id: 'incentives', icon: TrendingUp, label: 'Incentives', badge: null },
  { id: 'advance-payment', icon: CreditCard, label: 'Advance Payment', badge: null },
  { id: 'reports', icon: BarChart3, label: 'Reports', badge: null },
  { id: 'payroll-locks', icon: Lock, label: 'Payroll Locks', badge: null },
  { id: 'settings', icon: Settings, label: 'Settings', badge: null },
];

interface SidebarProps {
  active: string;
  onNavigate: (module: string) => void;
  open: boolean;
  onLogout?: () => void;
}

import { useApp } from './AppContext';

// Fade style helper — GPU-accelerated opacity + transform only (no layout)
const fadeStyle = (visible: boolean): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateX(0)' : 'translateX(-8px)',
  transition: 'opacity 0.15s ease, transform 0.15s ease',
  pointerEvents: visible ? 'auto' : 'none',
  overflow: 'hidden',
  whiteSpace: 'nowrap' as const,
});

export default function Sidebar({ active, onNavigate, open, onLogout }: SidebarProps) {
  const { employees, openModal } = useApp();

  return (
    <aside style={{
      width: open ? '260px' : '72px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: open ? '24px 20px' : '24px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minHeight: '72px',
        transition: 'padding 0.15s ease',
      }}>
        <div style={{
          width: '40px', height: '40px',
          background: '#ffffff',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          padding: '2px',
        }}>
          <img src="/logo.png" alt="Shri Sai Jewellers" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={fadeStyle(open)}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>HRPulse</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Enterprise Suite</div>
        </div>
      </div>



      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        <div style={{
          ...fadeStyle(open),
          fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
          color: 'var(--text-muted)', padding: '8px 10px 4px',
          height: open ? '28px' : '0px',
          marginBottom: open ? '0' : '-2px',
        }}>
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const displayBadge = item.id === 'employees' ? employees.length.toString() : item.badge;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                if (item.id === 'settings') {
                  openModal('settings');
                } else {
                  onNavigate(item.id);
                }
              }}
              title={!open ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: open ? '10px 16px' : '10px',
                justifyContent: open ? 'flex-start' : 'center',
                borderRadius: '12px',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                border: 'none',
                color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--hover-bg)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {open && (<span style={{ ...fadeStyle(open), flex: 1 }}>{item.label}</span>)}
              {open && displayBadge && (
                <span style={{
                  background: displayBadge === 'New' ? 'var(--success)' : 'var(--brand)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginLeft: 'auto',
                }}>{displayBadge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: open ? '10px 12px' : '10px',
          justifyContent: open ? 'flex-start' : 'center',
          borderRadius: '8px', color: 'var(--text-muted)',
          fontSize: '13.5px', transition: 'background 0.18s ease, color 0.18s ease, padding 0.15s ease',
        }}
          onClick={onLogout}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <LogOut size={17} />
          <span style={fadeStyle(open)}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
