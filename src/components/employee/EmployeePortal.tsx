'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { LayoutDashboard, Clock, Calendar, FileText, LogOut, Zap, User, Fingerprint, Banknote, Mail, Phone, MapPin, DollarSign, Briefcase, X } from 'lucide-react';
import EmpDashboard from './EmpDashboard';
import EmpAttendance from './EmpAttendance';
import EmpLeave from './EmpLeave';
import EmpPayslips from './EmpPayslips';

interface EmployeePortalProps {
  empSession: { empId: string; name: string };
  onLogout: () => void;
}

type ModuleType = 'dashboard' | 'attendance' | 'leave' | 'payslips';

export default function EmployeePortal({ empSession, onLogout }: EmployeePortalProps) {
  const { employees, updateEmployeeProfile } = useApp();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'bank'>('info');

  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_account_no: '',
    ifsc_code: '',
    pan_no: '',
    pf_no: ''
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Find full employee details
  const employee = useMemo(() => {
    return employees.find(e => e.id === empSession.empId) || {
      id: empSession.empId,
      name: empSession.name,
      dept: 'Sales',
      role: 'Sales Associate',
      email: `${empSession.name.toLowerCase().replace(' ', '')}@saijewellers.com`,
      phone: '+91 98765 00000',
      location: 'Main Store',
      status: 'active',
      joined: '01 Jan 2024',
      salary: '₹ 25,000',
      type: 'Full-time'
    };
  }, [employees, empSession]);

  useEffect(() => {
    if (showProfileModal) {
      setProfileTab('info');
      setBankForm({
        bank_name: employee.bank_name || '',
        bank_account_no: employee.bank_account_no || '',
        ifsc_code: employee.ifsc_code || '',
        pan_no: employee.pan_no || '',
        pf_no: employee.pf_no || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfileModal]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    await updateEmployeeProfile(bankForm);
    setIsSavingBank(false);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'attendance', icon: Fingerprint, label: 'Attendance' },
    { id: 'leave', icon: Calendar, label: 'Leave' },
    { id: 'payslips', icon: Banknote, label: 'Payslips' },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <EmpDashboard employee={employee} onNavigate={setActiveModule} />;
      case 'attendance':
        return <EmpAttendance employee={employee} />;
      case 'leave':
        return <EmpLeave employee={employee} />;
      case 'payslips':
        return <EmpPayslips employee={employee} />;
      default:
        return <EmpDashboard employee={employee} onNavigate={setActiveModule} />;
    }
  };

  const fadeStyle = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateX(0)' : 'translateX(-8px)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    pointerEvents: visible ? 'auto' : 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      ...({
        '--brand': '#D97706',
        '--bg-active': 'rgba(217, 119, 6, 0.08)',
        '--hover-bg': 'rgba(217, 119, 6, 0.04)',
      } as any)
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
          background: #FFFFFF !important;
          border: 1px solid rgba(15, 23, 42, 0.06) !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
          transition: all 0.2s ease !important;
        }
        .glass-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
        }
        .input-glass {
          background: #FFFFFF !important;
          border: 1px solid rgba(15, 23, 42, 0.12) !important;
          color: #0F172A !important;
          transition: all 0.2s ease-in-out !important;
        }
        .input-glass:focus {
          border-color: var(--brand) !important;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15) !important;
          outline: none !important;
          background: #FFFFFF !important;
        }
        .ios-notification {
          background: rgba(255, 255, 255, 0.8) !important;
          border: 1px solid rgba(15, 23, 42, 0.05) !important;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02) !important;
          transition: all 0.25s ease !important;
        }
        .ios-notification:hover {
          background: #FFFFFF !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
          transform: translateX(4px);
          box-shadow: 0 4px 15px rgba(15, 23, 42, 0.04) !important;
        }
      ` }} />
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
          {/* Mobile Top Header */}
          <header style={{
            height: '56px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px',
                background: '#ffffff',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                padding: '2px'
              }}>
                <img src="/logo.png" alt="Shri Sai Jewellers" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>HRPulse</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                onClick={() => setShowProfileModal(true)}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {employee.name.charAt(0)}
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          {/* Mobile Main Content */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            paddingBottom: '80px', // Space for bottom navigation
            boxSizing: 'border-box'
          }}>
            {renderModule()}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '64px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 100,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
            paddingBottom: 'safe-area-inset-bottom'
          }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id as ModuleType)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s',
                    flex: 1
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
          {/* Sidebar */}
          <aside style={{
            width: sidebarOpen ? '260px' : '72px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 0.2s ease',
          }}>
            {/* Logo */}
            <div style={{
              padding: sidebarOpen ? '24px 20px' : '24px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minHeight: '72px',
              transition: 'padding 0.15s ease',
            }}>
              <div style={{
                width: '36px', height: '36px',
                background: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                padding: '2px',
              }}>
                <img src="/logo.png" alt="Shri Sai Jewellers" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={fadeStyle(sidebarOpen)}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>HRPulse</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Employee Portal</div>
              </div>
            </div>

            {/* User Mini Profile */}
            <div 
              onClick={() => setShowProfileModal(true)}
              style={{
                padding: sidebarOpen ? '16px 20px' : '0 20px',
                borderBottom: sidebarOpen ? '1px solid var(--border)' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                maxHeight: sidebarOpen ? '80px' : '0px',
                opacity: sidebarOpen ? 1 : 0,
                transition: 'max-height 0.15s ease, opacity 0.12s ease, padding 0.15s ease',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                color: '#D97706',
                flexShrink: 0,
              }}>{employee.name.charAt(0)}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{employee.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ID: {employee.id}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
              <div style={{
                ...fadeStyle(sidebarOpen),
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '8px 10px 4px',
                height: sidebarOpen ? '28px' : '0px',
                marginBottom: sidebarOpen ? '0' : '-2px',
              }}>
                Menu
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id as ModuleType)}
                    title={!sidebarOpen ? item.label : undefined}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: sidebarOpen ? '10px 16px' : '10px',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
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
                    {sidebarOpen && (<span style={{ ...fadeStyle(sidebarOpen), flex: 1 }}>{item.label}</span>)}
                  </button>
                );
              })}
            </nav>

            {/* Sign Out */}
            <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarOpen ? '10px 12px' : '10px',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '13.5px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background 0.18s ease, color 0.18s ease, padding 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <LogOut size={17} />
                <span style={fadeStyle(sidebarOpen)}>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Top Navbar */}
            <header style={{
              height: '72px',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 32px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)', transition: 'var(--transition)'
                  }}
                >
                  <Zap size={15} />
                </button>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {activeModule === 'dashboard' ? 'Overview' : activeModule}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%', background: '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #FDE68A',
                    color: '#D97706',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {employee.name.charAt(0)}
                </div>
              </div>
            </header>

            {/* Module Content */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              {renderModule()}
            </main>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '480px',
            background: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
            overflow: 'hidden',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px 18px',
              borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>My Profile</h3>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Your employment details and records</p>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#475569',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '0 28px', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
              {[
                { id: 'info', label: 'Employment Info' },
                { id: 'bank', label: 'Bank & Tax Settings' },
              ].map(tab => {
                const active = profileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProfileTab(tab.id as 'info' | 'bank')}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
                      color: active ? 'var(--brand)' : '#64748B',
                      fontSize: '13px',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Profile Card Header */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '56px', height: '56px', 
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', 
                  borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 800, color: '#D97706',
                  border: '1px solid #FCD34D'
                }}>
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{employee.name}</h4>
                  <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '1px' }}>{employee.role} · <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{employee.dept}</span></p>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', 
                    padding: '2px 8px', borderRadius: '100px', marginTop: '6px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} /> Active Employee
                  </span>
                </div>
              </div>

              {profileTab === 'info' ? (
                /* Info Grid */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { icon: User, label: 'Employee ID', value: employee.id },
                    { icon: Briefcase, label: 'Job Type', value: employee.type },
                    { icon: Mail, label: 'Email Address', value: employee.email },
                    { icon: Phone, label: 'Phone Number', value: employee.phone },
                    { icon: MapPin, label: 'Store Location', value: employee.location || 'Flagship Store' },
                    { icon: Calendar, label: 'Date Joined', value: employee.joined },
                    { icon: DollarSign, label: 'Base Salary', value: employee.salary },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} style={{ 
                        padding: '10px 14px', 
                        background: '#F8FAFC', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(15, 23, 42, 0.04)',
                        gridColumn: f.label === 'Email Address' ? 'span 2' : 'span 1'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#64748B', marginBottom: '4px', fontWeight: 600 }}>
                          <Icon size={11} color="var(--brand)" /> {f.label}
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', wordBreak: 'break-all' }}>{f.value}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Bank & Tax Details Form */
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Bank Name</label>
                      <input
                        type="text"
                        value={bankForm.bank_name}
                        onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))}
                        placeholder="e.g. State Bank of India"
                        className="input-glass"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '10px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Bank Account Number</label>
                      <input
                        type="text"
                        value={bankForm.bank_account_no}
                        onChange={e => setBankForm(p => ({ ...p, bank_account_no: e.target.value }))}
                        placeholder="e.g. 30291089201"
                        className="input-glass"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '10px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>IFSC Code</label>
                      <input
                        type="text"
                        value={bankForm.ifsc_code}
                        onChange={e => setBankForm(p => ({ ...p, ifsc_code: e.target.value }))}
                        placeholder="e.g. SBIN0001239"
                        className="input-glass"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '10px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>PAN Number</label>
                      <input
                        type="text"
                        value={bankForm.pan_no}
                        onChange={e => setBankForm(p => ({ ...p, pan_no: e.target.value }))}
                        placeholder="e.g. ABCDE1234F"
                        className="input-glass"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '10px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>PF Number</label>
                      <input
                        type="text"
                        value={bankForm.pf_no}
                        onChange={e => setBankForm(p => ({ ...p, pf_no: e.target.value }))}
                        placeholder="e.g. DL/CPM/89012/123"
                        className="input-glass"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '10px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingBank}
                    style={{
                      marginTop: '10px',
                      padding: '11px',
                      background: 'var(--brand)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: isSavingBank ? 'default' : 'pointer',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSavingBank ? 'Saving Details...' : 'Save Bank Details'}
                  </button>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '16px 28px 20px', 
              borderTop: '1px solid rgba(15, 23, 42, 0.06)', 
              display: 'flex', 
              justifyContent: 'flex-end',
              background: '#F8FAFC'
            }}>
              <button 
                onClick={() => setShowProfileModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'var(--brand)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#B45309'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
