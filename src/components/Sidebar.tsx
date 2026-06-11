'use client';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Clock, DollarSign, TrendingUp,
  BarChart3, Settings, ChevronRight, Zap, Bell, LogOut,
  Shield, Menu
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard',    badge: null },
  { id: 'employees',  icon: Users,           label: 'Employees',    badge: '247' },
  { id: 'attendance', icon: Clock,           label: 'Attendance',   badge: null },
  { id: 'payroll',    icon: DollarSign,      label: 'Payroll',      badge: null },
  { id: 'incentives', icon: TrendingUp,      label: 'Incentives',   badge: 'New' },
  { id: 'reports',    icon: BarChart3,       label: 'Reports',      badge: null },
  { id: 'settings',   icon: Settings,        label: 'Settings',     badge: null },
];

interface SidebarProps {
  active: string;
  onNavigate: (module: string) => void;
  open: boolean;
}

import { useApp } from './AppContext';

export default function Sidebar({ active, onNavigate, open }: SidebarProps) {
  const { employees, openModal } = useApp();

  return (
    <aside style={{
      width: open ? '260px' : '72px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
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
      }}>
        <div style={{
          width: '38px', height: '38px',
          background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 14px rgba(79,142,247,0.4)',
        }}>
          <Zap size={18} color="#fff" />
        </div>
        {open && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>HRPulse</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Enterprise Suite</div>
          </div>
        )}
      </div>

      {/* User profile mini */}
      {open && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #4F8EF7 0%, #8B5CF6 100%)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>AD</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Admin User</div>
            <div style={{ fontSize: '11px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={10} /> Super Admin
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {open && (
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 10px 4px' }}>
            Main Menu
          </div>
        )}
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
                padding: open ? '10px 12px' : '10px',
                justifyContent: open ? 'flex-start' : 'center',
                borderRadius: '8px',
                background: isActive ? 'rgba(79,142,247,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'var(--transition)',
                textAlign: 'left',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {open && (
                <>
                  <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
                  {displayBadge && (
                    <span style={{
                      background: displayBadge === 'New' ? 'var(--success)' : 'var(--brand-dark)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '100px',
                    }}>{displayBadge}</span>
                  )}
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
                </>
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
          fontSize: '13.5px', transition: 'var(--transition)',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <LogOut size={17} />
          {open && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
