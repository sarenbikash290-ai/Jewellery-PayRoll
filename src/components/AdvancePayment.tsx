'use client';
import { useState, useMemo } from 'react';
import { useApp, AdvancePayment } from './AppContext';
import {
  CreditCard, Plus, Trash2, X, CheckCircle, Clock, AlertCircle,
  User, Calendar, DollarSign, FileText, ChevronDown, Search
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
    givenOn: today,
    deductMonth: currentMonth,
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const activeEmployees = employees.filter(e => e.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.amount || Number(form.amount) <= 0) return;

    setLoading(true);
    await addAdvancePayment({
      employeeId: form.employeeId,
      amount: Number(form.amount),
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
          width: '100%', maxWidth: '520px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>Record Advance Payment</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              Advance will be auto-deducted in payslip for selected month
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          {/* Amount */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Advance Amount (₹) *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>₹</span>
              <input
                type="number"
                required
                min={1}
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 5000"
                className="form-input"
                style={{ paddingLeft: '28px', fontSize: '13px' }}
              />
            </div>
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
                Deduct From Month *
              </label>
              <input
                type="month"
                required
                value={form.deductMonth}
                onChange={e => setForm(p => ({ ...p, deductMonth: e.target.value }))}
                className="form-input"
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>

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
            <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px' }}>
              <div style={{ fontWeight: 700, color: '#4F8EF7', marginBottom: '8px' }}>💳 Payslip Preview</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Advance deduction in payslip</span>
                <span style={{ fontWeight: 700, color: '#EF4444' }}>−₹{fmt(Number(form.amount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Will appear in</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {form.deductMonth ? new Date(form.deductMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
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

                  {/* Amount */}
                  <div style={{ flex: '1', minWidth: '100px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#EF4444' }}>₹{fmt(adv.amount)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Advance</div>
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
