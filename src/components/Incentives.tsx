'use client';
import { useState, useMemo } from 'react';
import { useApp } from './AppContext';
import {
  TrendingUp, Target, Award, Plus, Clock, AlertCircle, Gift, Crown,
  Zap, ArrowUp, DollarSign, Trash2, X, ChevronRight, BarChart2,
  ShoppingBag, Calendar, User, Mail, Phone, MapPin, Briefcase,
  ArrowLeft, Package
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EmpRow {
  empId: string;
  name: string;
  dept: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  joined: string;
  salary: number;
  monthlySales: number;
  target: number;
  incentive: number;
  performance: string;
  incStatus: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const avatarColors = ['#F59E0B', '#8B9AB5', '#92400E', '#4A5568', '#4F8EF7', '#10B981', '#EF4444', '#06B6D4'];
type TabType = 'incentives' | 'commissions' | 'rules' | 'disputes';
type DetailTab = 'overview' | 'addSale' | 'monthly' | 'allSales';

const PRODUCTS = [
  'Gold Ring', 'Diamond Necklace', 'Gold Bangle', 'Silver Earring',
  'Platinum Ring', 'Gold Chain', 'Diamond Bracelet', 'Ruby Pendant',
  'Emerald Set', 'Sapphire Ring'
];

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

// ─── Employee Detail Panel ────────────────────────────────────────────────────
function EmployeeDetailPanel({
  emp,
  onClose,
}: {
  emp: EmpRow;
  onClose: () => void;
}) {
  const { employeeSales, addSale, toast, incentives } = useApp();
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [saleForm, setSaleForm] = useState({ product: PRODUCTS[0], amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  // All sales for this employee
  const mySales = useMemo(
    () => employeeSales.filter(s => s.employeeId === emp.empId).sort((a, b) => b.date.localeCompare(a.date)),
    [employeeSales, emp.empId]
  );

  // Group by month
  const monthlySummary = useMemo(() => {
    const map: Record<string, { month: string; total: number; products: Record<string, number>; count: number }> = {};
    mySales.forEach(s => {
      const d = new Date(s.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!map[key]) map[key] = { month: label, total: 0, products: {}, count: 0 };
      map[key].total += s.amount;
      map[key].products[s.product] = (map[key].products[s.product] || 0) + s.amount;
      map[key].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([, v]) => v);
  }, [mySales]);

  // Current month sales — detect the latest month from actual data so it works regardless of year
  const latestSaleDate = mySales.length > 0 ? mySales[0].date : new Date().toISOString().split('T')[0];
  const currentMonthKey = latestSaleDate.substring(0, 7); // e.g. '2025-06'
  const currentMonthSales = mySales.filter(s => s.date.startsWith(currentMonthKey));
  const currentMonthTotal = currentMonthSales.reduce((sum, s) => sum + s.amount, 0);

  // Product-wise for current month
  const productBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthSales.forEach(s => {
      map[s.product] = (map[s.product] || 0) + s.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [currentMonthSales]);

  const achievement = emp.target > 0 ? Math.min((currentMonthTotal / emp.target) * 100, 200) : 0;
  const incentiveInfo = incentives.find(i => i.employeeId === emp.empId);

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(saleForm.amount);
    if (!amt || amt <= 0) { toast('error', 'Invalid Amount', 'Please enter a valid sale amount'); return; }
    addSale({ employeeId: emp.empId, date: saleForm.date, product: saleForm.product, amount: amt });
    toast('success', 'Sale Added', `₹${fmt(amt)} sale of ${saleForm.product} added for ${emp.name}`);
    setSaleForm({ product: PRODUCTS[0], amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  const detailTabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'addSale', label: 'Add Sale', icon: Plus },
    { id: 'monthly', label: 'Monthly History', icon: Calendar },
    { id: 'allSales', label: 'All Sales', icon: BarChart2 },
  ];

  const perfColor = emp.performance === 'Exceeding' ? '#10B981' : '#F59E0B';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
        cursor: 'default'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '860px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #1a1f2e 0%, #252b3d 100%)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{
                width: '48px', height: '48px',
                background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[4]})`,
                borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: '#fff'
              }}>
                {emp.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>{emp.name}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{emp.role} · {emp.dept}</div>
                <span style={{
                  display: 'inline-block', fontSize: '10px', fontWeight: 700,
                  padding: '2px 8px', borderRadius: '100px', marginTop: '6px',
                  background: emp.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  color: emp.status === 'active' ? '#10B981' : '#EF4444'
                }}>
                  {emp.status.toUpperCase()}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex'
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
            {[
              { label: 'Salary', value: `₹${(emp.salary / 1000).toFixed(0)}K`, color: '#4F8EF7' },
              { label: 'This Month Sales', value: `₹${(currentMonthTotal / 1000).toFixed(0)}K`, color: '#10B981' },
              { label: 'Incentive', value: `₹${fmt(emp.incentive)}`, color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Target progress */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              <span>Target Progress</span>
              <span style={{ color: perfColor, fontWeight: 700 }}>{achievement.toFixed(0)}% of ₹{(emp.target / 100000).toFixed(1)}L</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(achievement, 100)}%`,
                background: achievement >= 100 ? '#10B981' : achievement >= 60 ? '#4F8EF7' : '#F59E0B',
                borderRadius: '3px', transition: 'width 0.8s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0, overflowX: 'auto' }}>
          {detailTabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setDetailTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 14px', borderRadius: '6px', whiteSpace: 'nowrap',
                background: detailTab === t.id ? 'var(--brand)' : 'transparent',
                color: detailTab === t.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s'
              }}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── Overview Tab ── */}
          {detailTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Employee Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { icon: Mail, label: 'Email', value: emp.email },
                  { icon: Phone, label: 'Phone', value: emp.phone },
                  { icon: MapPin, label: 'Location', value: emp.location },
                  { icon: Calendar, label: 'Joined', value: emp.joined },
                  { icon: Briefcase, label: 'Role', value: emp.role },
                  { icon: DollarSign, label: 'Gross Salary', value: `₹${fmt(emp.salary)}` },
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                        <Icon size={12} /> {f.label}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Incentive Info */}
              {incentiveInfo && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', marginBottom: '10px' }}>🎯 Incentive Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Type: </span><span style={{ fontWeight: 600 }}>{incentiveInfo.ruleType}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Month: </span><span style={{ fontWeight: 600 }}>{incentiveInfo.month}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Amount: </span><span style={{ fontWeight: 700, color: '#10B981' }}>₹{fmt(incentiveInfo.amount)}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Status: </span>
                      <span style={{ fontWeight: 700, color: incentiveInfo.status === 'paid' ? '#10B981' : '#F59E0B' }}>
                        {incentiveInfo.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Product breakdown this month */}
              {productBreakdown.length > 0 ? (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    This Month — Product Sales
                  </div>
                  {productBreakdown.map(([prod, amt], i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{prod}</span>
                        <span style={{ fontWeight: 700, color: '#4F8EF7' }}>₹{fmt(amt)}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(amt / (currentMonthTotal || 1)) * 100}%`,
                          background: `hsl(${200 + i * 20}, 80%, 60%)`,
                          borderRadius: '2px', transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                  <Package size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div>No sales recorded this month</div>
                  <button onClick={() => setDetailTab('addSale')} style={{
                    marginTop: '10px', padding: '6px 16px', background: 'var(--brand)', border: 'none',
                    borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                  }}>Add First Sale</button>
                </div>
              )}
            </div>
          )}

          {/* ── Add Sale Tab ── */}
          {detailTab === 'addSale' && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Record a Sale</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Adding for {emp.name}</div>

              <form onSubmit={handleAddSale} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Product / Item</label>
                  <select
                    value={saleForm.product}
                    onChange={e => setSaleForm(p => ({ ...p, product: e.target.value }))}
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  >
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Sale Amount (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={saleForm.amount}
                      onChange={e => setSaleForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="e.g. 45000"
                      className="form-input"
                      style={{ paddingLeft: '28px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Sale Date</label>
                  <input
                    type="date"
                    value={saleForm.date}
                    onChange={e => setSaleForm(p => ({ ...p, date: e.target.value }))}
                    className="form-input"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                {/* Live preview */}
                {saleForm.amount && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '6px' }}>📊 Live Preview After Adding</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>New Monthly Total</span>
                      <span style={{ fontWeight: 700 }}>₹{fmt(currentMonthTotal + parseFloat(saleForm.amount || '0'))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Target Achievement</span>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>
                        {emp.target > 0 ? (((currentMonthTotal + parseFloat(saleForm.amount || '0')) / emp.target) * 100).toFixed(1) : 'N/A'}%
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" style={{
                  padding: '11px', background: 'var(--brand)', border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: 'var(--shadow-brand)'
                }}>
                  <Plus size={16} /> Add Sale Record
                </button>
              </form>

              {/* Recent sales quick view */}
              {mySales.slice(0, 3).length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Recent Sales</div>
                  {mySales.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '6px', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.product}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>₹{fmt(s.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Monthly History Tab ── */}
          {detailTab === 'monthly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Sales History</div>
              {monthlySummary.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                  <BarChart2 size={32} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                  No sales history yet
                </div>
              ) : monthlySummary.map((m, i) => (
                <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Month header */}
                  <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(79,142,247,0.06)' : 'transparent' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.month}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{m.count} sale{m.count !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#4F8EF7' }}>₹{fmt(m.total)}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {emp.target > 0 ? `${((m.total / emp.target) * 100).toFixed(0)}% of target` : 'No target'}
                      </div>
                    </div>
                  </div>
                  {/* Product breakdown */}
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(m.products).sort((a, b) => b[1] - a[1]).map(([prod, amt], j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: `hsl(${200 + j * 25}, 75%, 60%)`, flexShrink: 0 }} />
                          {prod}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{fmt(amt)}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  {emp.target > 0 && (
                    <div style={{ padding: '0 14px 10px' }}>
                      <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((m.total / emp.target) * 100, 100)}%`,
                          background: m.total >= emp.target ? '#10B981' : '#4F8EF7',
                          borderRadius: '2px'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── All Sales Tab ── */}
          {detailTab === 'allSales' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>All Sale Transactions</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{mySales.length} total</div>
              </div>
              {mySales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                  <ShoppingBag size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  No sales recorded yet
                </div>
              ) : (
                <div>
                  {mySales.map((s, i) => {
                    const d = new Date(s.date + 'T00:00:00');
                    return (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: `hsl(${(i * 37) % 360}, 60%, 55%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <ShoppingBag size={14} color="#fff" />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.product}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>₹{fmt(s.amount)}</div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Grand Total</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#4F8EF7' }}>₹{fmt(mySales.reduce((s, x) => s + x.amount, 0))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Incentives() {
  const [tab, setTab] = useState<TabType>('incentives');
  const [sortBy, setSortBy] = useState<'sales' | 'incentive' | 'salary'>('sales');
  const [selectedEmp, setSelectedEmp] = useState<EmpRow | null>(null);
  const { openModal, incentives, commissions, deleteCommission, employees, employeeSales } = useApp();

  const employeeData: EmpRow[] = employees.map(emp => {
    const monthlySales = employeeSales.filter(s => s.employeeId === emp.id).reduce((sum, s) => sum + s.amount, 0);
    const incentiveObj = incentives.find(i => i.employeeId === emp.id);
    const incentive = incentiveObj ? incentiveObj.amount : 0;
    const salaryStr = typeof emp.salary === 'string' ? emp.salary : (typeof emp.salary === 'number' ? String(emp.salary) : '0');
    const salary = Number(salaryStr.replace(/[₹,\s]/g, '')) || 0;
    const target = incentiveObj?.target || 0;
    const performance = target > 0 && monthlySales >= target ? 'Exceeding' : 'On-track';
    const incStatus = incentiveObj ? incentiveObj.status : 'pending';
    return {
      empId: emp.id,
      name: emp.name,
      dept: emp.dept,
      role: emp.role,
      email: emp.email,
      phone: emp.phone,
      location: emp.location,
      status: emp.status,
      joined: emp.joined,
      salary,
      monthlySales,
      target,
      incentive,
      performance,
      incStatus,
    };
  });

  const sortedData = [...employeeData].sort((a, b) => {
    if (sortBy === 'sales') return b.monthlySales - a.monthlySales;
    if (sortBy === 'incentive') return b.incentive - a.incentive;
    return b.salary - a.salary;
  });

  const totalIncentives = employeeData.reduce((sum, e) => sum + e.incentive, 0);
  const totalSales = employeeData.reduce((sum, e) => sum + e.monthlySales, 0);
  const totalSalary = employeeData.reduce((sum, e) => sum + e.salary, 0);
  const onTrackCount = employeeData.filter(e => e.performance === 'On-track' || e.performance === 'Exceeding').length;
  const atRiskCount = employeeData.filter(e => e.performance === 'At-risk').length;
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  // When employee detail updates (via context), keep selectedEmp in sync
  const selectedEmpLive = selectedEmp ? employeeData.find(e => e.empId === selectedEmp.empId) || null : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Incentives & Commissions</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Employee Benefits & Lead Rewards
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {tab === 'incentives' && (
            <button onClick={() => openModal('addIncentive')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', background: 'var(--brand)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-brand)' }}>
              <Plus size={15} /> Add Incentive
            </button>
          )}
          {tab === 'commissions' && (
            <button onClick={() => openModal('addCommission')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', background: 'var(--brand)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-brand)' }}>
              <Plus size={15} /> Add Commission
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {tab === 'incentives' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total Incentives', value: `₹${(totalIncentives / 100000).toFixed(2)}L`, sub: `${employeeData.length} employees`, color: '#10B981', icon: Gift },
            { label: 'Total Sales', value: `₹${(totalSales / 100000).toFixed(2)}L`, sub: 'All employees', color: '#4F8EF7', icon: TrendingUp },
            { label: 'On-Track', value: `${onTrackCount}/${employeeData.length}`, sub: 'Good performers', color: '#8B5CF6', icon: Award },
            { label: 'At-Risk', value: String(atRiskCount), sub: 'Need support', color: '#F59E0B', icon: AlertCircle },
            { label: 'Monthly Payroll', value: `₹${(totalSalary / 100000).toFixed(2)}L`, sub: 'All salaries', color: '#06B6D4', icon: DollarSign },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <CardBox key={i} style={{ padding: '18px' }}>
                <div style={{ width: '36px', height: '36px', background: `${s.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon size={16} color={s.color} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>{s.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
              </CardBox>
            );
          })}
        </div>
      )}

      {tab === 'commissions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total Commissions', value: `₹${(totalCommissions / 1000).toFixed(1)}K`, sub: `${commissions.length} leads`, color: '#FF6B6B', icon: Crown },
            { label: 'Paid Out', value: `₹${(paidCommissions / 1000).toFixed(1)}K`, sub: `${commissions.filter(c => c.status === 'paid').length} processed`, color: '#4ECDC4', icon: Award },
            { label: 'Pending', value: `₹${(pendingCommissions / 1000).toFixed(1)}K`, sub: `${commissions.filter(c => c.status === 'pending').length} waiting`, color: '#F59E0B', icon: Clock },
            { label: 'Avg per Lead', value: `₹${commissions.length > 0 ? fmt(Math.round(totalCommissions / commissions.length)) : 0}`, sub: 'Monthly average', color: '#4F8EF7', icon: TrendingUp },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <CardBox key={i} style={{ padding: '20px' }}>
                <div style={{ width: '38px', height: '38px', background: `${s.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Icon size={17} color={s.color} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
              </CardBox>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { id: 'incentives', label: ' Incentives' },
          { id: 'commissions', label: ' Commissions' },
          { id: 'rules', label: ' Rules' },
          { id: 'disputes', label: ' Disputes' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as TabType)} style={{ padding: '8px 20px', borderRadius: '8px', background: tab === t.id ? 'var(--brand)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap', border: 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Incentives Tab */}
      {tab === 'incentives' && (
        <>
          <CardBox>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Employee Incentives & Sales Performance
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>Click any row to view details</span>
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'sales' | 'incentive' | 'salary')} style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <option value="sales">Sort by Sales ↓</option>
                <option value="incentive">Sort by Incentive ↓</option>
                <option value="salary">Sort by Salary ↓</option>
              </select>
            </div>

            <div>
              {sortedData.map((emp, idx) => {
                const achievement = emp.target > 0 ? (emp.monthlySales / emp.target) * 100 : 0;
                const perfColor = emp.performance === 'Exceeding' ? '#10B981' : '#F59E0B';
                const isSelected = selectedEmp?.empId === emp.empId;

                return (
                  <div
                    key={emp.empId}
                    onClick={() => setSelectedEmp(isSelected ? null : emp)}
                    style={{
                      padding: '16px 24px', display: 'flex', gap: '20px', alignItems: 'center',
                      borderBottom: idx < sortedData.length - 1 ? '1px solid var(--border)' : 'none',
                      background: isSelected ? 'rgba(79,142,247,0.06)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.15s',
                      borderLeft: isSelected ? '3px solid var(--brand)' : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ minWidth: '24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{idx + 1}</div>

                    <div style={{ flex: '2', minWidth: '200px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '38px', height: '38px', background: avatarColors[idx % 8], borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{emp.dept} · {emp.role}</div>
                      </div>
                    </div>

                    <div style={{ flex: '1', minWidth: '120px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>₹{(emp.monthlySales / 100000).toFixed(2)}L</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Monthly Sales</div>
                    </div>

                    <div style={{ flex: '1', minWidth: '120px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: perfColor }}>
                        {achievement >= 100 ? `↑ ${achievement.toFixed(0)}%` : `↓ ${achievement.toFixed(0)}%`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Target: ₹{(emp.target / 100000).toFixed(1)}L</div>
                    </div>

                    <div style={{ flex: '1', minWidth: '100px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>₹{(emp.salary / 1000).toFixed(0)}K</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Salary</div>
                    </div>

                    <div style={{ flex: '1', minWidth: '100px', textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>₹{fmt(emp.incentive)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Incentive</div>
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', minWidth: '80px', textAlign: 'center', background: emp.incStatus === 'paid' ? 'rgba(16,185,129,0.12)' : emp.incStatus === 'approved' ? 'rgba(79,142,247,0.12)' : 'rgba(245,158,11,0.12)', color: emp.incStatus === 'paid' ? '#10B981' : emp.incStatus === 'approved' ? '#4F8EF7' : '#F59E0B' }}>
                      {emp.incStatus === 'paid' ? '✓ Paid' : emp.incStatus === 'approved' ? '✓ Approved' : '⏳ Pending'}
                    </span>

                    <ChevronRight size={16} color="var(--text-muted)" style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          </CardBox>

          {/* Insight Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <CardBox style={{ padding: '16px', borderLeft: '4px solid #4F8EF7' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                <Zap size={16} color="#4F8EF7" style={{ marginTop: '2px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>💡 Boost Performance</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Consider tiered incentives for {atRiskCount} at-risk employees to meet targets.</div>
            </CardBox>
            <CardBox style={{ padding: '16px', borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                <ArrowUp size={16} color="#10B981" style={{ marginTop: '2px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>📈 Top Performers</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Retention bonuses for {onTrackCount} on-track performers to maintain productivity.</div>
            </CardBox>
            <CardBox style={{ padding: '16px', borderLeft: '4px solid #8B5CF6' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                <Target size={16} color="#8B5CF6" style={{ marginTop: '2px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>🎯 Target Strategy</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Review quarterly targets based on market conditions and capabilities.</div>
            </CardBox>
          </div>
        </>
      )}

      {/* Commissions Tab */}
      {tab === 'commissions' && (
        <CardBox>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Lead Commissions — LIVE</div>
          </div>
          <div>
            {commissions.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No commissions added yet</p>
              </div>
            ) : commissions.map((com, i) => (
              <div key={com.id} style={{ padding: '18px 24px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < commissions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#FF6B6B,#FF8E72)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>👑</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{com.leadName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{com.position} · {com.performance}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF6B6B' }}>₹{fmt(com.amount)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{com.month}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap', background: com.status === 'paid' ? 'rgba(16,185,129,0.12)' : com.status === 'approved' ? 'rgba(79,142,247,0.12)' : 'rgba(245,158,11,0.12)', color: com.status === 'paid' ? '#10B981' : com.status === 'approved' ? '#4F8EF7' : '#F59E0B' }}>
                    {com.status === 'paid' ? '✓ Paid' : com.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                  </span>
                  <button onClick={() => deleteCommission(com.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardBox>
      )}

      {tab === 'rules' && (
        <CardBox style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Incentive & Commission Rules</div>
          <p>Configure payroll rules and commission policies here</p>
        </CardBox>
      )}

      {tab === 'disputes' && (
        <CardBox style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Disputes & Appeals</div>
          <p>No active disputes. All incentives and commissions in good standing</p>
        </CardBox>
      )}

      {/* Employee Detail Side Panel */}
      {selectedEmpLive && (
        <>
          <EmployeeDetailPanel emp={selectedEmpLive} onClose={() => setSelectedEmp(null)} />
        </>
      )}
    </div>
  );
}
