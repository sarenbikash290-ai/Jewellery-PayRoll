'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { Calendar, Send, Clock, CheckCircle, XCircle, ChevronRight, Tag, FileText, X } from 'lucide-react';

interface EmpLeaveProps {
  employee: Employee;
}

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', ...style }}>{children}</div>
);

export default function EmpLeave({ employee }: EmpLeaveProps) {
  const { leaves, applyLeave, toast } = useApp();

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



  const [viewReasonModal, setViewReasonModal] = useState<{ open: boolean; reason: string; dates: string } | null>(null);

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
          Submit and manage your leave requests.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>

        {/* Form Box */}
        <Card style={{ background: '#FFFFFF' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Send size={14} color="#D97706" /> Apply for Leave
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

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
                    {/* Icon Block */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(79, 142, 247, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--brand)',
                      flexShrink: 0
                    }}>
                      <Calendar size={15} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {fDate} - {tDate}
                      </div>
                      <div
                        onClick={() => setViewReasonModal({ open: true, reason: leave.reason, dates: `${fDate} - ${tDate}` })}
                        style={{ fontSize: '11.5px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px', cursor: 'pointer' }}
                        title="Click to view full reason"
                      >
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

      {/* ─── Leave Reason Popup Modal ─── */}
      {viewReasonModal && viewReasonModal.open && (
        <div
          onClick={() => setViewReasonModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9, 14, 26, 0.65)', backdropFilter: 'blur(4px)', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}
          >
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#D97706" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Leave Explanation</h3>
              </div>
              <button onClick={() => setViewReasonModal(null)} style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(15,23,42,0.08)', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Dates: {viewReasonModal.dates}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Full Reason Submitted</div>
                <div style={{ background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.06)', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#0F172A', lineHeight: 1.6, maxHeight: '240px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {viewReasonModal.reason}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewReasonModal(null)} style={{ padding: '9px 20px', borderRadius: '8px', background: '#0F172A', border: 'none', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
