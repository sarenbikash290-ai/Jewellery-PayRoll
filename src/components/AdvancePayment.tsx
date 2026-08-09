'use client';
import { useState, useMemo } from 'react';
import { useApp, AdvancePayment } from './AppContext';
import {
  CreditCard, Plus, Trash2, X, CheckCircle, Clock, AlertCircle,
  User, Calendar, IndianRupee, FileText, ChevronDown, Search
} from 'lucide-react';

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

function CardBox({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>
      {children}
    </div>
  );
}

const avatarColors = ['#F59E0B', '#4F8EF7', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#92400E', '#4A5568'];

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  deducted: { label: 'Deducted', color: '#10B981', bg: 'rgba(16,185,129,0.12)',  icon: CheckCircle },
  partial:  { label: 'Partial',  color: '#4F8EF7', bg: 'rgba(79,142,247,0.12)',  icon: AlertCircle },
};

// ─── Add Advance Modal ────────────────────────────────────────────────────────
function AddAdvanceModal({ onClose }: { onClose: () => void }) {
  const { employees, addAdvancePayment } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  const [form, setForm] = useState({
    employeeId: '',
    amount: '',
    monthlyDeduction: '',
    givenOn: today,
    deductMonth: currentMonth,
    reason: '',
  });
  const [deductionType, setDeductionType] = useState<'fixed' | 'custom'>('fixed');
  const [customRows, setCustomRows] = useState<{ month: string; amount: string }[]>([
    { month: currentMonth, amount: '1000' }
  ]);
  const [loading, setLoading] = useState(false);

  const activeEmployees = employees.filter(e => e.status === 'active');

  // Auto-generate initial custom schedule rows when amount or start month changes
  const handleAmountOrMonthChange = (newAmt: string, newStartMonth: string) => {
    const amt = parseFloat(newAmt) || 0;
    if (amt <= 0) return;

    // Helper to add months to a YYYY-MM string
    const addMonths = (ym: string, count: number) => {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1 + count, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const startM = newStartMonth || currentMonth;
    // Default suggestion: ₹1,000 for month 1, ₹2,000 for month 2, remaining for month 3
    if (amt === 5000) {
      setCustomRows([
        { month: startM, amount: '1000' },
        { month: addMonths(startM, 1), amount: '2000' },
        { month: addMonths(startM, 2), amount: '2000' },
      ]);
    } else {
      const row1 = Math.min(1000, amt);
      const rem = amt - row1;
      const rows = [{ month: startM, amount: String(row1) }];
      if (rem > 0) {
        rows.push({ month: addMonths(startM, 1), amount: String(rem) });
      }
      setCustomRows(rows);
    }
  };

  const totalCustomScheduled = customRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.amount || Number(form.amount) <= 0) return;

    const totalAmt = Number(form.amount);
    const monthlyAmt = form.monthlyDeduction ? Number(form.monthlyDeduction) : 1000;

    let scheduleMap: Record<string, number> | undefined = undefined;
    if (deductionType === 'custom') {
      scheduleMap = {};
      customRows.forEach(r => {
        if (r.month && r.amount) {
          scheduleMap![r.month] = Number(r.amount);
        }
      });
    }

    setLoading(true);
    await addAdvancePayment({
      employeeId: form.employeeId,
      amount: totalAmt,
      monthlyDeduction: monthlyAmt,
      customSchedule: scheduleMap,
      givenOn: form.givenOn,
      deductMonth: form.deductMonth,
      reason: form.reason,
      status: 'pending',
    });
    setLoading(false);
    onClose();
  };

  const selectedEmp = employees.find(e => e.id === form.employeeId);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '560px', maxHeight: '90vh',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>Record Advance Payment</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              Customizable monthly deduction options per employee
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Employee Select */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Employee *
            </label>
            <div style={{ position: 'relative' }}>
              <select
                required
                value={form.employeeId}
                onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '13px', appearance: 'none' }}
              >
                <option value="">Select employee...</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
                ))}
              </select>
              <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
            {selectedEmp && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                {selectedEmp.dept} · {selectedEmp.role} · Salary: {selectedEmp.salary}
              </div>
            )}
          </div>

          {/* Date Given + Deduct Month */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Date Given *
              </label>
              <input
                type="date"
                required
                value={form.givenOn}
                onChange={e => setForm(p => ({ ...p, givenOn: e.target.value }))}
                className="form-input"
                style={{ fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Starting Deduct Month *
              </label>
              <input
                type="month"
                required
                value={form.deductMonth}
                onChange={e => {
                  const m = e.target.value;
                  setForm(p => ({ ...p, deductMonth: m }));
                  handleAmountOrMonthChange(form.amount, m);
                }}
                className="form-input"
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Total Advance Amount */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Total Advance Amount (₹) *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>₹</span>
              <input
                type="number"
                required
                min={1}
                value={form.amount}
                onChange={e => {
                  const amt = e.target.value;
                  setForm(p => ({
                    ...p,
                    amount: amt,
                    monthlyDeduction: p.monthlyDeduction || (parseFloat(amt) >= 1000 ? '1000' : amt)
                  }));
                  handleAmountOrMonthChange(amt, form.deductMonth);
                }}
                placeholder="e.g. 5000"
                className="form-input"
                style={{ paddingLeft: '28px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Deduction Mode Toggle */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Deduction Plan Options *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setDeductionType('fixed')}
                style={{
                  padding: '8px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: deductionType === 'fixed' ? 'var(--brand)' : 'transparent',
                  color: deductionType === 'fixed' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Fixed Monthly Cut
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeductionType('custom');
                  if (form.amount) handleAmountOrMonthChange(form.amount, form.deductMonth);
                }}
                style={{
                  padding: '8px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: deductionType === 'custom' ? '#8B5CF6' : 'transparent',
                  color: deductionType === 'custom' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Custom Per-Month Schedule ✨
              </button>
            </div>
          </div>

          {/* Fixed Mode Input */}
          {deductionType === 'fixed' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Equal Monthly Cut (₹/Month) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  required={deductionType === 'fixed'}
                  min={1}
                  value={form.monthlyDeduction}
                  onChange={e => setForm(p => ({ ...p, monthlyDeduction: e.target.value }))}
                  placeholder="e.g. 1000"
                  className="form-input"
                  style={{ paddingLeft: '28px', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {/* Custom Mode Grid */}
          {deductionType === 'custom' && (
            <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#8B5CF6' }}>
                  🗓️ Custom Month-by-Month Deduction Schedule
                </div>
                <div style={{
                  fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '100px',
                  background: totalCustomScheduled === Number(form.amount) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: totalCustomScheduled === Number(form.amount) ? '#10B981' : '#EF4444',
                }}>
                  {totalCustomScheduled === Number(form.amount) ? '✓ 100% Allocated' : `Allocated: ₹${fmt(totalCustomScheduled)} / ₹${fmt(Number(form.amount))}`}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {customRows.map((row, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 32px', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="month"
                      value={row.month}
                      onChange={e => {
                        const val = e.target.value;
                        setCustomRows(prev => prev.map((r, i) => i === idx ? { ...r, month: val } : r));
                      }}
                      className="form-input"
                      style={{ fontSize: '12.5px', padding: '6px 10px' }}
                    />
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        min={0}
                        value={row.amount}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomRows(prev => prev.map((r, i) => i === idx ? { ...r, amount: val } : r));
                        }}
                        placeholder="Cut amount"
                        className="form-input"
                        style={{ paddingLeft: '24px', fontSize: '12.5px', paddingRight: '8px' }}
                      />
                    </div>
                    {customRows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setCustomRows(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', color: '#EF4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const lastMonth = customRows[customRows.length - 1]?.month || currentMonth;
                  const [y, m] = lastMonth.split('-').map(Number);
                  const nextD = new Date(y, m, 1);
                  const nextM = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}`;
                  const rem = Math.max(0, Number(form.amount) - totalCustomScheduled);
                  setCustomRows(prev => [...prev, { month: nextM, amount: rem > 0 ? String(rem) : '1000' }]);
                }}
                style={{
                  width: '100%', padding: '7px', background: 'rgba(139,92,246,0.12)', border: '1px dashed rgba(139,92,246,0.4)',
                  borderRadius: '6px', color: '#8B5CF6', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Plus size={14} /> Add Month Deduction Row
              </button>
            </div>
          )}

          {/* Reason */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Reason / Notes
            </label>
            <textarea
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Medical emergency, festival advance..."
              rows={2}
              className="form-input"
              style={{ fontSize: '13px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Live Preview */}
          {form.employeeId && form.amount && Number(form.amount) > 0 && (
            <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: 700, color: '#4F8EF7' }}>💳 Payslip Deduction Plan Preview</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Advance Taken</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{fmt(Number(form.amount))}</span>
              </div>
              {deductionType === 'custom' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', borderTop: '1px solid rgba(79,142,247,0.2)', paddingTop: '6px' }}>
                  <div style={{ fontWeight: 700, color: '#8B5CF6', fontSize: '11.5px' }}>Custom Monthly Schedule:</div>
                  {customRows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {r.month ? new Date(r.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                      </span>
                      <span style={{ fontWeight: 700, color: '#EF4444' }}>−₹{fmt(Number(r.amount || 0))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monthly Payslip Deduction</span>
                    <span style={{ fontWeight: 700, color: '#EF4444' }}>−₹{fmt(Number(form.monthlyDeduction || form.amount))}/month</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Recovery Period</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>
                      {Math.ceil(Number(form.amount) / Math.max(1, Number(form.monthlyDeduction || form.amount)))} Month(s)
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '11px', background: 'var(--brand)', border: 'none',
              borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1, boxShadow: 'var(--shadow-brand)',
            }}>
              <CreditCard size={15} /> {loading ? 'Recording...' : 'Record Advance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdvancePaymentPage() {
  const { employees, advancePayments, updateAdvancePaymentStatus, deleteAdvancePayment } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'deducted' | 'partial'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().substring(0, 7);

  const enriched = useMemo(() => {
    return advancePayments.map(adv => {
      const emp = employees.find(e => e.id === adv.employeeId);
      return { ...adv, empName: emp?.name || adv.employeeId, empRole: emp?.role || '', empDept: emp?.dept || '' };
    });
  }, [advancePayments, employees]);

  const filtered = useMemo(() => {
    return enriched.filter(a => {
      const matchSearch = a.empName.toLowerCase().includes(search.toLowerCase()) || a.reason?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [enriched, search, filterStatus]);

  // Summary stats
  const totalGiven      = advancePayments.reduce((s, a) => s + a.amount, 0);
  const pendingAmount   = advancePayments.filter(a => a.status === 'pending').reduce((s, a) => s + a.amount, 0);
  const deductedAmount  = advancePayments.filter(a => a.status === 'deducted').reduce((s, a) => s + a.amount, 0);
  const thisMonthAdv    = advancePayments.filter(a => a.deductMonth === currentMonth && a.status === 'pending');
  const thisMonthAmount = thisMonthAdv.reduce((s, a) => s + a.amount, 0);
  const empWithAdvance  = new Set(advancePayments.filter(a => a.status === 'pending').map(a => a.employeeId)).size;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteAdvancePayment(id);
    setDeletingId(null);
  };

  const getMonthLabel = (ym: string) => {
    try { return new Date(ym + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); }
    catch { return ym; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showAddModal && <AddAdvanceModal onClose={() => setShowAddModal(false)} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Advance Payments</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Salary Advances · Automatically deducted in payslip
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: 'var(--brand)', border: 'none',
            borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', boxShadow: 'var(--shadow-brand)',
          }}
        >
          <Plus size={15} /> Add Advance
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Advances Given',  value: `₹${fmt(totalGiven)}`,    sub: `${advancePayments.length} records`,   color: '#4F8EF7', icon: CreditCard },
          { label: 'Pending Recovery',      value: `₹${fmt(pendingAmount)}`,  sub: `${empWithAdvance} employee(s)`,        color: '#F59E0B', icon: Clock },
          { label: 'Deducted Amount',       value: `₹${fmt(deductedAmount)}`, sub: 'Recovered so far',                    color: '#10B981', icon: CheckCircle },
          { label: 'This Month Deduction',  value: `₹${fmt(thisMonthAmount)}`,sub: `${thisMonthAdv.length} pending`,       color: '#8B5CF6', icon: Calendar },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <CardBox key={i} style={{ padding: '20px' }}>
              <div style={{ width: '38px', height: '38px', background: `${s.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Icon size={17} color={s.color} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
            </CardBox>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search employee or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', fontSize: '13px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
          {(['all', 'pending', 'deducted', 'partial'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
              background: filterStatus === s ? 'var(--brand)' : 'transparent',
              color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
            }}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <CardBox>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Advance Records</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{filtered.length} records</div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <CreditCard size={40} style={{ opacity: 0.2, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>No advance payments found</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Click "Add Advance" to record a new payment</div>
          </div>
        ) : (
          <div>
            {filtered.map((adv, idx) => {
              const cfg = STATUS_CONFIG[adv.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const empIdx = employees.findIndex(e => e.id === adv.employeeId);

              return (
                <div
                  key={adv.id}
                  style={{
                    padding: '16px 24px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', gap: '16px', alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: avatarColors[empIdx % 8] || '#4F8EF7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 800, color: '#fff',
                  }}>
                    {adv.empName.charAt(0)}
                  </div>

                  {/* Employee Info */}
                  <div style={{ flex: '2', minWidth: '140px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{adv.empName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{adv.empRole} · {adv.empDept}</div>
                  </div>

                  {/* Amount & Monthly Cut */}
                  <div style={{ flex: '1', minWidth: '120px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#EF4444' }}>₹{fmt(adv.amount)}</div>
                    <div style={{ fontSize: '10px', color: '#10B981', marginTop: '2px', fontWeight: 700 }}>
                      ₹{fmt(adv.monthlyDeduction || adv.amount)}/mo cut
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ flex: '1', minWidth: '110px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {new Date(adv.givenOn + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Given on</div>
                  </div>

                  {/* Deduct Month */}
                  <div style={{ flex: '1', minWidth: '100px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: adv.deductMonth === currentMonth ? '#4F8EF7' : 'var(--text-primary)' }}>
                      {getMonthLabel(adv.deductMonth)}
                      {adv.deductMonth === currentMonth && <span style={{ fontSize: '9px', background: 'rgba(79,142,247,0.15)', color: '#4F8EF7', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>THIS MONTH</span>}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Deduct month</div>
                  </div>

                  {/* Reason */}
                  {adv.reason && (
                    <div style={{ flex: '1.5', minWidth: '120px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {adv.reason}
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: cfg.bg, borderRadius: '100px', flexShrink: 0 }}>
                    <StatusIcon size={12} color={cfg.color} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {adv.status === 'pending' && (
                      <button
                        onClick={() => updateAdvancePaymentStatus(adv.id, 'deducted')}
                        title="Mark as Deducted"
                        style={{
                          padding: '5px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                          borderRadius: '6px', color: '#10B981', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)'; }}
                      >
                        <CheckCircle size={11} /> Deducted
                      </button>
                    )}
                    {adv.status === 'deducted' && (
                      <button
                        onClick={() => updateAdvancePaymentStatus(adv.id, 'pending')}
                        title="Revert to Pending"
                        style={{
                          padding: '5px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                          borderRadius: '6px', color: '#F59E0B', fontSize: '11px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        Revert
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(adv.id)}
                      disabled={deletingId === adv.id}
                      style={{
                        padding: '5px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        opacity: deletingId === adv.id ? 0.5 : 1, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBox>

      {/* Info Box */}
      <div style={{
        padding: '16px 20px', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <FileText size={16} color="#4F8EF7" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--text-primary)' }}>How it works:</strong> When you record an advance, it automatically appears as a deduction in the employee's payslip for the selected month.
          Mark it as <strong>"Deducted"</strong> once the amount has been recovered. Pending advances will show in payslips until they are marked deducted.
        </div>
      </div>
    </div>
  );
}
