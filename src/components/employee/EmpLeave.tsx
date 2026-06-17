'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { Calendar, Send, Clock, CheckCircle, XCircle, ChevronRight, Tag } from 'lucide-react';

interface EmpLeaveProps {
  employee: Employee;
}

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', ...style }}>{children}</div>
);

export default function EmpLeave({ employee }: EmpLeaveProps) {
  const { leaves, applyLeave, toast } = useApp();

  const [type, setType] = useState<'PL' | 'SL' | 'CL' | 'WFH'>('PL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Filter leaves for this employee
  const myLeaves = useMemo(() => {
    return leaves
      .filter((l) => l.employeeId === employee.id)
      .sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
  }, [leaves, employee.id]);

  // Leave balances: PL: 20, SL: 10, CL: 9
  const balances = useMemo(() => {
    const totalPL = 20;
    const totalSL = 10;
    const totalCL = 9;

    let usedPL = 0;
    let usedSL = 0;
    let usedCL = 0;

    myLeaves.forEach((l) => {
      if (l.status === 'approved') {
        const days = 1; // Simplify days count
        if (l.type === 'PL') usedPL += days;
        if (l.type === 'SL') usedSL += days;
        if (l.type === 'CL') usedCL += days;
      }
    });

    return {
      PL: { remaining: totalPL - usedPL, total: totalPL, used: usedPL },
      SL: { remaining: totalSL - usedSL, total: totalSL, used: usedSL },
      CL: { remaining: totalCL - usedCL, total: totalCL, used: usedCL },
    };
  }, [myLeaves]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !reason.trim()) {
      toast('error', 'Missing Information', 'Please fill in all fields.');
      return;
    }

    if (new Date(from) > new Date(to)) {
      toast('error', 'Invalid Date Range', 'Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      applyLeave({
        employeeId: employee.id,
        type,
        from,
        to,
        reason: reason.trim(),
      });
      
      setFrom('');
      setTo('');
      setReason('');
      setSubmitting(false);
    }, 600);
  };

  const statusColors = {
    pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pending', icon: Clock },
    approved: { bg: '#E0F2FE', text: '#0284C7', label: 'Approved', icon: CheckCircle },
    rejected: { bg: '#FEE2E2', text: '#DC2626', label: 'Rejected', icon: XCircle },
  };

  const inputStyle: React.CSSProperties = {
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Leave Requests
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Manage your time-off balances and submit new requests.
        </p>
      </div>

      {/* Leave Balances stacked list or grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { label: 'PAID LEAVE (PL)', val: balances.PL, color: '#D97706' },
          { label: 'SICK LEAVE (SL)', val: balances.SL, color: '#EF4444' },
          { label: 'CASUAL LEAVE (CL)', val: balances.CL, color: '#0F172A' },
        ].map((item, i) => {
          const pct = Math.min(100, Math.max(0, (item.val.used / item.val.total) * 100));
          return (
            <div key={i} className="glass-card" style={{
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>{item.label}</span>
                <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 700, letterSpacing: '0.5px' }}>ANNUAL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  {item.val.remaining < 10 ? `0${item.val.remaining}` : item.val.remaining}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/ {item.val.total} days</span>
              </div>
              
              {/* Progress bar representing used days */}
              <div style={{ width: '100%', height: '5px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Used: {item.val.used} of {item.val.total} days
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
        
        {/* Form Box */}
        <Card style={{ background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Send size={14} color="#D97706" /> Apply for Leave
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>LEAVE TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="input-glass"
                style={inputStyle}
              >
                <option value="PL">Annual Leave (PL)</option>
                <option value="SL">Sick Leave (SL)</option>
                <option value="CL">Casual Leave (CL)</option>
                <option value="WFH">Work From Home (WFH)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>FROM DATE</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="input-glass"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TO DATE</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="input-glass"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>REASON FOR LEAVE</label>
              <textarea
                placeholder="Briefly explain the reason for your request..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-glass"
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            <div style={{ 
              fontSize: '11.5px', 
              color: '#D97706', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(217,119,6,0.05)', 
              padding: '10px 12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(217,119,6,0.12)' 
            }}>
              <Clock size={12} color="#D97706" style={{ flexShrink: 0 }} />
              <span>Your balance will be updated upon approval.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: '#0F172A',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
                transition: 'all 0.2s',
                opacity: submitting ? 0.75 : 1,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'} <ChevronRight size={14} />
            </button>
          </form>
        </Card>

        {/* History Box */}
        <Card style={{ background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Calendar size={14} color="#D97706" /> Request History
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', cursor: 'pointer' }}>View All</span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '12.5px' }}>
                No leave requests logged.
              </div>
            ) : (
              myLeaves.map((leave, idx) => {
                const normalizedStatus = (leave.status || 'pending').toLowerCase();
                const badge = statusColors[normalizedStatus as 'pending' | 'approved' | 'rejected'] || statusColors.pending;
                const StatusIcon = badge.icon;
                
                // Format dates nicer
                const fDate = new Date(leave.from).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                const tDate = new Date(leave.to).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                
                return (
                  <div key={idx} style={{
                    padding: '12px 14px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(15, 23, 42, 0.05)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {/* Circle Leave Type Block */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(79, 142, 247, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 800, color: 'var(--brand)',
                      flexShrink: 0
                    }}>
                      {leave.type}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {fDate} - {tDate}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {leave.reason}
                      </div>
                    </div>

                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '100px',
                      background: badge.bg,
                      color: badge.text,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      flexShrink: 0
                    }}>
                      <StatusIcon size={10} /> {badge.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Planning Ahead Black Banner Card */}
        <div style={{
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(15,23,42,0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%', zIndex: 2 }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Planning Ahead?</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
              Book your winter vacations early to ensure smooth team operations.
            </span>
          </div>
          <Tag size={40} color="rgba(255,255,255,0.05)" style={{ zIndex: 1, position: 'absolute', right: '16px' }} />
        </div>
      </div>
    </div>
  );
}
