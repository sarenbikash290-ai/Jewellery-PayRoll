'use client';
import { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import { Lock, Unlock, Calendar, ShieldAlert, PlusCircle, AlertTriangle, CheckCircle, ChevronDown, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CardProps { children: React.ReactNode; style?: React.CSSProperties }
const Card = ({ children, style = {} }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>
    {children}
  </div>
);

// Confirmation dialog component
function ConfirmDialog({
  open, title, message, confirmLabel, confirmColor, onConfirm, onCancel
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.2s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <AlertTriangle size={22} color="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: confirmColor, border: 'none',
              color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 4px 14px ${confirmColor}40`
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollLocks() {
  const { payrollLocks, lockPayrollMonth, unlockPayrollMonth, toast } = useApp();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [notes, setNotes] = useState('');
  const [locking, setLocking] = useState(false);

  const [confirmLock, setConfirmLock] = useState<{ year: number; month: number } | null>(null);
  const [confirmUnlock, setConfirmUnlock] = useState<{ year: number; month: number } | null>(null);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(y);
    return years;
  }, [currentYear]);

  const isAlreadyLocked = payrollLocks.some(l => l.year === selectedYear && l.month === selectedMonth);

  const handleLock = async () => {
    setLocking(true);
    const result = await lockPayrollMonth(selectedYear, selectedMonth, notes.trim() || undefined);
    setLocking(false);
    setConfirmLock(null);
    if (!result.ok) {
      toast('error', 'Lock Failed', result.error || 'Could not lock payroll month.');
    } else {
      setNotes('');
    }
  };

  const handleUnlock = async (year: number, month: number) => {
    const result = await unlockPayrollMonth(year, month);
    setConfirmUnlock(null);
    if (!result.ok) {
      toast('error', 'Unlock Failed', result.error || 'Could not remove lock.');
    }
  };

  const sortedLocks = [...payrollLocks].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={22} color="var(--brand)" /> Payroll Month Locking
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Finalize payroll months to prevent any further attendance modifications.
        </p>
      </div>

      {/* Info Banner */}
      <Card style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <ShieldAlert size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: '#F59E0B' }}>Important:</strong> Locking a payroll month is an administrative action that prevents any attendance corrections
            for that month — even if they fall within the normal 7-day edit window. Use this only after salaries are finalized.
            You can unlock a month if needed, but all unlock actions are reversible.
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left: Locked Months Table */}
        <Card>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Locked Payroll Months</span>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 10px',
              borderRadius: '100px', background: 'rgba(239,68,68,0.12)', color: '#EF4444',
              border: '1px solid rgba(239,68,68,0.2)'
            }}>
              {payrollLocks.length} locked
            </span>
          </div>

          {sortedLocks.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Lock size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No locked months</div>
              <div style={{ fontSize: '12px' }}>Lock a payroll month after salaries are finalized.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Month', 'Year', 'Locked By', 'Locked At', 'Notes', 'Action'].map(h => (
                      <th key={h} style={{
                        padding: '11px 20px', textAlign: 'left', fontSize: '11px',
                        fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px',
                        textTransform: 'uppercase', borderBottom: '1px solid var(--border)',
                        whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLocks.map((lock) => (
                    <tr key={lock.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: '#EF4444', display: 'inline-block', flexShrink: 0
                          }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {MONTH_NAMES[lock.month - 1]}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{lock.year}</td>
                      <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 10px', borderRadius: '100px',
                          background: 'rgba(79,142,247,0.1)', color: 'var(--brand)',
                          fontSize: '11px', fontWeight: 600
                        }}>
                          {lock.lockedBy}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(lock.lockedAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lock.notes || '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => setConfirmUnlock({ year: lock.year, month: lock.month })}
                          title="Unlock this month"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            background: 'rgba(16,185,129,0.1)', color: '#10B981',
                            border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.18)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)'; }}
                        >
                          <Unlock size={12} /> Unlock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right: Lock a New Month */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#EF4444,#DC2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
            }}>
              <Lock size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Lock a Payroll Month</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prevents all attendance edits for the selected month</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Year Picker */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                YEAR
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '10px 36px 10px 14px', borderRadius: '8px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
                    appearance: 'none', cursor: 'pointer', outline: 'none'
                  }}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Month Picker */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                MONTH
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {MONTH_NAMES.map((name, idx) => {
                  const mNum = idx + 1;
                  const isLocked = payrollLocks.some(l => l.year === selectedYear && l.month === mNum);
                  const isSelected = selectedMonth === mNum;
                  return (
                    <button
                      key={name}
                      disabled={isLocked}
                      onClick={() => setSelectedMonth(mNum)}
                      style={{
                        padding: '7px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        background: isLocked
                          ? 'rgba(239,68,68,0.08)'
                          : isSelected
                            ? 'var(--brand)'
                            : 'var(--bg-elevated)',
                        color: isLocked
                          ? '#EF4444'
                          : isSelected
                            ? '#fff'
                            : 'var(--text-secondary)',
                        border: isLocked
                          ? '1px solid rgba(239,68,68,0.2)'
                          : isSelected
                            ? '1px solid var(--brand)'
                            : '1px solid var(--border)',
                        opacity: isLocked ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px'
                      }}
                    >
                      {isLocked && <Lock size={9} />}
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                NOTES <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. June 2026 payroll finalized and disbursed"
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '12px', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-brand)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* Selected Preview */}
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              background: isAlreadyLocked ? 'rgba(239,68,68,0.08)' : 'rgba(79,142,247,0.08)',
              border: `1px solid ${isAlreadyLocked ? 'rgba(239,68,68,0.2)' : 'rgba(79,142,247,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              {isAlreadyLocked ? <Lock size={14} color="#EF4444" /> : <Calendar size={14} color="var(--brand)" />}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: isAlreadyLocked ? '#EF4444' : 'var(--brand)' }}>
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {isAlreadyLocked ? 'Already locked — choose a different month' : 'Will be locked after confirmation'}
                </div>
              </div>
            </div>

            {/* Lock Button */}
            <button
              disabled={isAlreadyLocked || locking}
              onClick={() => setConfirmLock({ year: selectedYear, month: selectedMonth })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                cursor: (isAlreadyLocked || locking) ? 'not-allowed' : 'pointer',
                background: (isAlreadyLocked || locking) ? 'var(--bg-elevated)' : 'linear-gradient(135deg,#EF4444,#DC2626)',
                color: (isAlreadyLocked || locking) ? 'var(--text-muted)' : '#fff',
                border: 'none',
                boxShadow: (isAlreadyLocked || locking) ? 'none' : '0 4px 16px rgba(239,68,68,0.35)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!isAlreadyLocked && !locking) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              <Lock size={15} />
              {locking ? 'Locking…' : isAlreadyLocked ? 'Already Locked' : `Lock ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
            </button>
          </div>
        </Card>
      </div>

      {/* Confirm Lock Dialog */}
      <ConfirmDialog
        open={!!confirmLock}
        title="Lock Payroll Month"
        message={`Are you sure you want to lock ${confirmLock ? MONTH_NAMES[confirmLock.month - 1] : ''} ${confirmLock?.year}? This will prevent all attendance modifications for this month. You can unlock it later if needed.`}
        confirmLabel="Yes, Lock Month"
        confirmColor="#EF4444"
        onConfirm={handleLock}
        onCancel={() => setConfirmLock(null)}
      />

      {/* Confirm Unlock Dialog */}
      <ConfirmDialog
        open={!!confirmUnlock}
        title="Unlock Payroll Month"
        message={`Are you sure you want to unlock ${confirmUnlock ? MONTH_NAMES[confirmUnlock.month - 1] : ''} ${confirmUnlock?.year}? Attendance records for this month will become editable again (subject to the 7-day edit window).`}
        confirmLabel="Yes, Unlock Month"
        confirmColor="#10B981"
        onConfirm={() => confirmUnlock && handleUnlock(confirmUnlock.year, confirmUnlock.month)}
        onCancel={() => setConfirmUnlock(null)}
      />

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
