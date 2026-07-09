'use client';
import { Menu, Bell, Sun, Moon, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';

const moduleNames: Record<string, string> = {
  dashboard:        'Dashboard',
  employees:        'Workforce Management',
  attendance:       'Attendance & Time Tracking',
  payroll:          'Payroll Management',
  incentives:       'Incentives & Commission',
  'advance-payment':'Advance Payments',
  reports:          'Reports & Analytics',
  'payroll-locks':  'Payroll Locks',
  settings:         'Settings',
};

const breadcrumbs: Record<string, string[]> = {
  dashboard:        ['Home', 'Dashboard'],
  employees:        ['Home', 'Workforce', 'Employees'],
  attendance:       ['Home', 'Workforce', 'Attendance'],
  payroll:          ['Home', 'Finance', 'Payroll'],
  incentives:       ['Home', 'Finance', 'Incentives'],
  'advance-payment':['Home', 'Finance', 'Advance Payments'],
  reports:          ['Home', 'Analytics', 'Reports'],
  'payroll-locks':  ['Home', 'Admin', 'Payroll Locks'],
  settings:         ['Home', 'Settings'],
};

interface HeaderProps {
  activeModule: string;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface LiveNotif {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  text: string;
  ts: number;
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Parse "09:30 AM" + "2026-07-01" → Unix ms */
function timeStrToTs(timeStr: string, dateStr: string): number {
  try {
    const [h, rest] = timeStr.split(':');
    const [m, period] = rest.trim().split(' ');
    let hour = parseInt(h, 10);
    const min = parseInt(m, 10);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    return new Date(yr, mo - 1, dy, hour, min).getTime();
  } catch {
    return Date.now();
  }
}

const DISMISSED_KEY = 'hrpulse_dismissed_notifs';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Header({ activeModule, onToggleSidebar, onLogout }: HeaderProps) {
  const {
    openModal, toast, modal,
    attendanceRecords, employees,
    leaves, advancePayments,
    incentives, commissions,
  } = useApp();

  const [darkMode, setDarkMode]     = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set());
  const [, setTick]                 = useState(0); // 1-min ticker for "X ago"
  const notifRef                    = useRef<HTMLDivElement>(null);

  // On mount: restore dark mode pref + dismissed set
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('hrpulse_dark_mode');
    if (stored) setDarkMode(stored === 'true');
    setDismissed(loadDismissed());
  }, []);

  // Tick every 60 s to refresh relative timestamps
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Apply dark mode to <html>
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('hrpulse_dark_mode', String(darkMode));
    if (darkMode) document.documentElement.classList.add('dark-mode');
    else          document.documentElement.classList.remove('dark-mode');
  }, [darkMode, mounted]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handle = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [notifOpen]);

  // Close dropdown when a modal opens
  useEffect(() => {
    if (modal.open) setNotifOpen(false);
  }, [modal.open]);

  // ── Build live notifications ──────────────────────────────────────────────
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const all: LiveNotif[] = [];

  // 1. Today's check-ins / check-outs / late arrivals
  attendanceRecords
    .filter(r => r.date === todayStr)
    .forEach(r => {
      const emp  = employees.find(e => e.id === r.employeeId);
      const name = emp?.name ?? r.employeeId;

      if (r.checkIn) {
        all.push({
          id:    `checkin-${r.employeeId}-${r.date}-${r.checkIn}`,
          type:  'success',
          title: 'Employee Checked In',
          text:  `${name} checked in at ${r.checkIn}`,
          ts:    timeStrToTs(r.checkIn, r.date),
        });
      }
      if (r.checkOut) {
        all.push({
          id:    `checkout-${r.employeeId}-${r.date}-${r.checkOut}`,
          type:  'info',
          title: 'Employee Checked Out',
          text:  `${name} checked out at ${r.checkOut}`,
          ts:    timeStrToTs(r.checkOut, r.date),
        });
      }
      if (r.status === 'late' && r.checkIn) {
        all.push({
          id:    `late-${r.employeeId}-${r.date}`,
          type:  'warning',
          title: 'Late Arrival',
          text:  `${name} arrived late at ${r.checkIn}`,
          ts:    timeStrToTs(r.checkIn, r.date),
        });
      }
    });

  // 2. Pending leave requests
  leaves
    .filter(l => l.status === 'pending')
    .forEach(l => {
      const ts = (() => { try { return new Date(l.appliedOn).getTime(); } catch { return Date.now(); } })();
      all.push({
        id:    `leave-${l.id}`,
        type:  'warning',
        title: 'Leave Request Pending',
        text:  `${l.employeeName} applied for ${l.type} leave (${l.from} → ${l.to}): "${l.reason}"`,
        ts,
      });
    });

  // 3. Pending advance payments
  advancePayments
    .filter(a => a.status === 'pending')
    .forEach(a => {
      const emp  = employees.find(e => e.id === a.employeeId);
      const name = emp?.name ?? a.employeeId;
      const ts   = (() => { try { return new Date(a.createdAt).getTime(); } catch { return Date.now(); } })();
      all.push({
        id:    `advance-${a.id}`,
        type:  'danger',
        title: 'Advance Payment Pending',
        text:  `₹${Number(a.amount).toLocaleString('en-IN')} advance for ${name} — deduct: ${a.deductMonth}`,
        ts,
      });
    });

  // 4. Pending incentives
  incentives
    .filter(i => i.status === 'pending')
    .forEach(inc => {
      const ts = (() => { try { return new Date(inc.createdAt).getTime(); } catch { return Date.now(); } })();
      all.push({
        id:    `incentive-${inc.id}`,
        type:  'info',
        title: 'Incentive Awaiting Approval',
        text:  `₹${Number(inc.amount).toLocaleString('en-IN')} incentive for ${inc.employeeName} (${inc.month})`,
        ts,
      });
    });

  // 5. Pending commissions
  commissions
    .filter(c => c.status === 'pending')
    .forEach(com => {
      const ts = (() => { try { return new Date(com.createdAt).getTime(); } catch { return Date.now(); } })();
      all.push({
        id:    `commission-${com.id}`,
        type:  'info',
        title: 'Commission Pending Approval',
        text:  `₹${Number(com.amount).toLocaleString('en-IN')} commission for ${com.leadName} (${com.month})`,
        ts,
      });
    });

  // Filter dismissed, sort newest first
  const visible = all
    .filter(n => !dismissed.has(n.id))
    .sort((a, b) => b.ts - a.ts);

  const unreadCount = visible.length;

  // Colour + emoji map
  const COLORS: Record<string, string> = {
    success: '#10B981', info: '#4F8EF7', warning: '#F59E0B', danger: '#EF4444',
  };
  const ICONS: Record<string, string> = {
    success: '✅', info: 'ℹ️', warning: '⚠️', danger: '🔴',
  };

  const dismissOne = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])); } catch { /**/ }
  };

  const dismissAll = () => {
    const next = new Set([...dismissed, ...visible.map(n => n.id)]);
    setDismissed(next);
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])); } catch { /**/ }
    toast('success', 'Cleared', 'All notifications dismissed.');
  };

  // ─────────────────────────────────────────────────────────────────────────
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

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        style={{ color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', transition: 'var(--transition)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        <Menu size={20} />
      </button>

      {/* Title + breadcrumb */}
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

      {/* ── Notifications bell ── */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          id="notif-btn"
          onClick={() => setNotifOpen(v => !v)}
          style={{
            width: '38px', height: '38px',
            background: notifOpen ? 'rgba(79,142,247,0.12)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: notifOpen ? 'var(--brand)' : 'var(--text-secondary)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px',
              minWidth: '18px', height: '18px', padding: '0 4px',
              background: '#EF4444', borderRadius: '100px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '9px', fontWeight: 800,
              boxShadow: '0 2px 6px rgba(239,68,68,0.45)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {notifOpen && (
          <div style={{
            position: 'absolute', top: '48px', right: 0,
            width: '360px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
            zIndex: 9999,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 7px', borderRadius: '100px',
                    background: 'rgba(239,68,68,0.12)', color: '#EF4444',
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {visible.length > 0 && (
                <button
                  onClick={dismissAll}
                  style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', background: 'transparent', border: 'none', fontWeight: 600 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {visible.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '30px', marginBottom: '10px' }}>🔔</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>All caught up!</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Check-ins, leaves, advances & approvals appear here
                  </div>
                </div>
              ) : visible.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 18px 12px 0',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', gap: '0', alignItems: 'flex-start',
                    borderLeft: `3px solid ${COLORS[n.type]}`,
                    background: 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* Icon */}
                  <div style={{ width: '42px', flexShrink: 0, textAlign: 'center', paddingTop: '2px', fontSize: '16px' }}>
                    {ICONS[n.type]}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS[n.type], marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {n.text}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {timeAgo(n.ts)}
                    </div>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => dismissOne(n.id)}
                    title="Dismiss"
                    style={{
                      flexShrink: 0, background: 'transparent', border: 'none',
                      cursor: 'pointer', color: 'var(--text-muted)',
                      fontSize: '16px', lineHeight: 1, padding: '2px 6px',
                      alignSelf: 'flex-start', marginTop: '1px',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dark / light toggle */}
      <button
        onClick={() => setDarkMode(v => !v)}
        style={{
          width: '38px', height: '38px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'var(--transition)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F59E0B'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        {!mounted ? <Moon size={17} /> : darkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* User avatar / settings shortcut */}
      <div
        onClick={() => openModal('settings')}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', padding: '6px 10px',
          borderRadius: '10px', border: '1px solid var(--border)',
        }}
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

      {/* Sign out */}
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
          flexShrink: 0,
          transition: 'var(--transition)',
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
