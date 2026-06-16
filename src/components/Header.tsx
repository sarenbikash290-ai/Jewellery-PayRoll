'use client';
import { Menu, Bell, Sun, Moon, ChevronDown, Check, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';

const moduleNames: Record<string, string> = {
  dashboard:  'Dashboard',
  employees:  'Workforce Management',
  attendance: 'Attendance & Time Tracking',
  payroll:    'Payroll Management',
  incentives: 'Incentives & Commission',
  reports:    'Reports & Analytics',
  settings:   'Settings',
};

const breadcrumbs: Record<string, string[]> = {
  dashboard:  ['Home', 'Dashboard'],
  employees:  ['Home', 'Workforce', 'Employees'],
  attendance: ['Home', 'Workforce', 'Attendance'],
  payroll:    ['Home', 'Finance', 'Payroll'],
  incentives: ['Home', 'Finance', 'Incentives'],
  reports:    ['Home', 'Analytics', 'Reports'],
  settings:   ['Home', 'Settings'],
};

interface HeaderProps {
  activeModule: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

// ── Notification helpers ──────────────────────────────────────────────────────

interface StoredNotif {
  id: number;
  type: 'warning' | 'info' | 'success' | 'danger';
  text: string;
  ts: number;   // Unix ms timestamp
  read: boolean;
}

const STORAGE_KEY = 'hrpulse_notifications';

/** Seed data: offsets in minutes from now */
const SEED: Omit<StoredNotif, 'ts' | 'read'>[] = [
  { id: 1, type: 'warning', text: '3 employees have pending leave requests' },
  { id: 2, type: 'info',    text: 'May payroll processing complete' },
  { id: 3, type: 'success', text: 'Rajesh Kumar approved overtime' },
  { id: 4, type: 'danger',  text: 'TDS filing due in 3 days' },
];
const SEED_OFFSETS_MIN = [5, 60, 120, 180]; // minutes ago at first load

function loadOrSeedNotifs(): StoredNotif[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredNotif[];
  } catch { /* ignore */ }
  // First visit — seed with real timestamps
  const now = Date.now();
  return SEED.map((s, i) => ({
    ...s,
    ts: now - SEED_OFFSETS_MIN[i] * 60 * 1000,
    read: false,
  }));
}

function saveNotifs(notifs: StoredNotif[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs)); } catch { /* ignore */ }
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Header({ activeModule, onToggleSidebar, onLogout }: HeaderProps) {
  const { openModal, toast, modal } = useApp();
  const [darkMode, setDarkMode] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<StoredNotif[]>([]);
  const [, setTick] = useState(0); // force re-render every minute for live timestamps

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadOrSeedNotifs();
    setNotifications(loaded);
    saveNotifs(loaded);
  }, []);

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    if (notifications.length > 0) saveNotifs(notifications);
  }, [notifications]);

  // Tick every 60 seconds to refresh "X ago" labels
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const notifColors: Record<string, string> = {
    warning: '#F59E0B', info: '#4F8EF7', success: '#10B981', danger: '#EF4444'
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toast('info', 'Notification Read', 'Marked notification alert as read.');
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast('success', 'All Read', 'All notifications marked as read.');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  // Close notification dropdown when any modal opens
  useEffect(() => {
    if (modal.open) {
      setNotifOpen(false);
    }
  }, [modal.open]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }, [darkMode]);

  return (
    <header style={{
      height: '72px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      gap: '20px',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        style={{ color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', transition: 'var(--transition)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        <Menu size={20} />
      </button>

      {/* Title + Breadcrumb */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {moduleNames[activeModule] || 'Dashboard'}
        </div>
        <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {(breadcrumbs[activeModule] || ['Home']).map((crumb, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: i === arr.length - 1 ? 'var(--brand)' : 'var(--text-muted)' }}>{crumb}</span>
              {i < arr.length - 1 && <span style={{ opacity: 0.4 }}>/</span>}
            </span>
          ))}
        </div>
      </div>

{/* Search removed */}
      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          id="notif-btn"
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: '38px', height: '38px',
            background: notifOpen ? 'rgba(79,142,247,0.12)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: notifOpen ? 'var(--brand)' : 'var(--text-secondary)',
            position: 'relative',
            transition: 'var(--transition)',
          }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '16px', height: '16px',
              background: 'var(--danger)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '9px', fontWeight: 800,
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{
            position: 'absolute', top: '48px', right: 0,
            width: '320px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 9999,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead} 
                  style={{ fontSize: '11px', color: 'var(--brand)', cursor: 'pointer', background: 'transparent', border: 'none', fontWeight: 600 }}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {notifications.map(n => {
                const isUnread = !n.read;
                return (
                  <div key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      cursor: 'pointer', transition: 'var(--transition)',
                      background: isUnread ? 'rgba(79, 142, 247, 0.04)' : 'transparent',
                      borderLeft: isUnread ? `3px solid ${notifColors[n.type]}` : '3px solid transparent',
                      opacity: isUnread ? 1 : 0.6,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isUnread ? 'rgba(79, 142, 247, 0.04)' : 'transparent'; }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: notifColors[n.type], flexShrink: 0, marginTop: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: isUnread ? 600 : 400, lineHeight: 1.4 }}>{n.text}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{timeAgo(n.ts)}</div>
                    </div>
                    {isUnread && (
                      <span title="Mark as read" style={{ color: 'var(--brand)', padding: '2px', alignSelf: 'center' }}>
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dark/Light Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          width: '38px', height: '38px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          transition: 'var(--transition)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--warning)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* User Avatar */}
      <div 
        onClick={() => openModal('settings')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border)' }}
      >
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#fff',
        }}>AD</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>Admin</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Super Admin</div>
        </div>
        <ChevronDown size={14} color="var(--text-muted)" />
      </div>

      {/* Sign Out */}
      <button
        id="sign-out-btn"
        onClick={onLogout}
        title="Sign out"
        style={{
          width: '38px', height: '38px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'var(--transition)',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.color = '#EF4444';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
        }}
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
