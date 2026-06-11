'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import { TrendingUp, Target, Award, Plus, Clock, AlertCircle, Gift, Crown, Zap, ArrowUp, DollarSign } from 'lucide-react';

const employeeSalesData = [
  { empId: 'EMP001', name: 'Ananya Sharma',   dept: 'Sales',       salary: 72000, monthlySales: 624000, target: 500000, incentive: 24500, status: 'paid',    performance: 'Exceeding' },
  { empId: 'EMP002', name: 'Rohan Mehta',     dept: 'Engineering', salary: 115000, monthlySales: 45000, target: 100000, incentive: 5000, status: 'pending', performance: 'At-risk' },
  { empId: 'EMP003', name: 'Priya Nair',      dept: 'Sales',       salary: 55000, monthlySales: 398000, target: 350000, incentive: 16800, status: 'pending', performance: 'On-track' },
  { empId: 'EMP004', name: 'Dev Patel',       dept: 'Operations',  salary: 88000, monthlySales: 25000, target: 75000, incentive: 5000, status: 'paid', performance: 'At-risk' },
  { empId: 'EMP005', name: 'Sneha Reddy',     dept: 'HR',          salary: 95000, monthlySales: 12000, target: 50000, incentive: 0, status: 'pending', performance: 'At-risk' },
  { empId: 'EMP006', name: 'Amit Verma',      dept: 'Finance',     salary: 82000, monthlySales: 8000, target: 40000, incentive: 0, status: 'pending', performance: 'At-risk' },
  { empId: 'EMP007', name: 'Kavya Singh',     dept: 'Engineering', salary: 78000, monthlySales: 35000, target: 80000, incentive: 2000, status: 'pending', performance: 'At-risk' },
  { empId: 'EMP008', name: 'Arjun Kumar',     dept: 'Sales',       salary: 102000, monthlySales: 560000, target: 480000, incentive: 18200, status: 'paid', performance: 'On-track' },
];

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>
);

const avatarColors = ['#F59E0B', '#8B9AB5', '#92400E', '#4A5568', '#4F8EF7', '#10B981', '#EF4444', '#06B6D4'];

type TabType = 'incentives' | 'commissions' | 'rules' | 'disputes';

export default function Incentives() {
  const [tab, setTab] = useState<TabType>('incentives');
  const [sortBy, setSortBy] = useState<'sales' | 'incentive' | 'salary'>('sales');
  const { openModal, incentives, commissions } = useApp();

  const sortedData = [...employeeSalesData].sort((a, b) => {
    if (sortBy === 'sales') return b.monthlySales - a.monthlySales;
    if (sortBy === 'incentive') return b.incentive - a.incentive;
    return b.salary - a.salary;
  });

  const totalIncentives = employeeSalesData.reduce((sum, e) => sum + e.incentive, 0);
  const totalSales = employeeSalesData.reduce((sum, e) => sum + e.monthlySales, 0);
  const totalSalary = employeeSalesData.reduce((sum, e) => sum + e.salary, 0);
  const onTrackCount = employeeSalesData.filter(e => e.performance === 'On-track' || e.performance === 'Exceeding').length;
  const atRiskCount = employeeSalesData.filter(e => e.performance === 'At-risk').length;
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Incentives & Commissions</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>June 2025 · Employee Benefits & Lead Rewards</p>
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

      {/* Summary Stats - Incentives */}
      {tab === 'incentives' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total Incentives (Jun)', value: `₹ ${(totalIncentives/100000).toFixed(2)}L`, sub: `${employeeSalesData.length} employees`, color: '#10B981', icon: Gift },
            { label: 'Total Sales', value: `₹ ${(totalSales/100000).toFixed(2)}L`, sub: 'All employees', color: '#4F8EF7', icon: TrendingUp },
            { label: 'On-Track', value: `${onTrackCount}/${employeeSalesData.length}`, sub: 'Good performers', color: '#8B5CF6', icon: Award },
            { label: 'At-Risk', value: atRiskCount.toString(), sub: 'Need support', color: '#F59E0B', icon: AlertCircle },
            { label: 'Total Monthly Payroll', value: `₹ ${(totalSalary/100000).toFixed(2)}L`, sub: 'All salaries', color: '#06B6D4', icon: DollarSign },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} style={{ padding: '18px' }}>
                <div style={{ width: '36px', height: '36px', background: `${s.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon size={16} color={s.color} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>{s.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Stats - Commissions */}
      {tab === 'commissions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total Commissions (Jun)', value: `₹ ${(totalCommissions/1000).toFixed(1)}K`, sub: `${commissions.length} leads`, color: '#FF6B6B', icon: Crown },
            { label: 'Paid Out', value: `₹ ${(paidCommissions/1000).toFixed(1)}K`, sub: `${commissions.filter(c => c.status === 'paid').length} processed`, color: '#4ECDC4', icon: Award },
            { label: 'Pending Approval', value: `₹ ${(pendingCommissions/1000).toFixed(1)}K`, sub: `${commissions.filter(c => c.status === 'pending').length} waiting`, color: '#F59E0B', icon: Clock },
            { label: 'Avg per Lead', value: `₹ ${commissions.length > 0 ? (totalCommissions/commissions.length).toLocaleString('en-IN', {maximumFractionDigits: 0}) : 0}`, sub: 'Monthly average', color: '#4F8EF7', icon: TrendingUp },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} style={{ padding: '20px' }}>
                <div style={{ width: '38px', height: '38px', background: `${s.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Icon size={17} color={s.color} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { id: 'incentives', label: '🎁 Incentives (Employees)' },
          { id: 'commissions', label: '👑 Commissions (Leads)' },
          { id: 'rules', label: '⚙️ Rules' },
          { id: 'disputes', label: '⚠️ Disputes' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as TabType)} style={{ padding: '8px 20px', borderRadius: '8px', background: tab === t.id ? 'var(--brand)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Incentives Tab */}
      {tab === 'incentives' && (
        <Card>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Employee Incentives & Sales Performance (LIVE)</div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>🟢 Real-time</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'sales' | 'incentive' | 'salary')} style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <option value="sales">Sort by Sales ↓</option>
              <option value="incentive">Sort by Incentive ↓</option>
              <option value="salary">Sort by Salary ↓</option>
            </select>
          </div>
          
          {/* Employee Rows */}
          <div>
            {sortedData.map((emp, idx) => {
              const achievement = emp.target > 0 ? (emp.monthlySales / emp.target) * 100 : 0;
              const perfColor = emp.performance === 'Exceeding' ? '#10B981' : emp.performance === 'On-track' ? '#4F8EF7' : '#F59E0B';
              
              return (
                <div key={emp.empId} style={{ padding: '14px 24px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: idx < sortedData.length - 1 ? '1px solid var(--border)' : 'none', background: emp.performance === 'At-risk' ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                  <div style={{ minWidth: '20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{idx + 1}</div>
                  
                  <div style={{ minWidth: '180px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', background: avatarColors[idx % 8], borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.dept}</div>
                    </div>
                  </div>
                  
                  <div style={{ minWidth: '110px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>₹ {(emp.monthlySales/100000).toFixed(2)}L</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{(emp.monthlySales/1000).toFixed(0)}K</div>
                  </div>
                  
                  <div style={{ minWidth: '100px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: perfColor }}>
                      {achievement >= 100 ? `↑ ${achievement.toFixed(0)}%` : `↓ ${achievement.toFixed(0)}%`}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Target: ₹{(emp.target/100000).toFixed(1)}L</div>
                  </div>
                  
                  <div style={{ minWidth: '100px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>₹ {(emp.salary/1000).toFixed(0)}K</div>
                  </div>
                  
                  <div style={{ minWidth: '90px', textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>₹ {emp.incentive.toLocaleString('en-IN')}</div>
                  </div>
                  
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', minWidth: '70px', textAlign: 'center', background: emp.status === 'paid' ? 'rgba(16,185,129,0.12)' : emp.status === 'approved' ? 'rgba(79,142,247,0.12)' : 'rgba(245,158,11,0.12)', color: emp.status === 'paid' ? '#10B981' : emp.status === 'approved' ? '#4F8EF7' : '#F59E0B' }}>
                    {emp.status === 'paid' ? '✓ Paid' : emp.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Insights */}
      {tab === 'incentives' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Card style={{ padding: '16px', borderLeft: '4px solid #4F8EF7' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
              <Zap size={16} color="#4F8EF7" style={{ marginTop: '2px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>💡 Boost Performance</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Consider tiered incentives for {atRiskCount} at-risk employees to meet targets.</div>
          </Card>
          
          <Card style={{ padding: '16px', borderLeft: '4px solid #10B981' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
              <ArrowUp size={16} color="#10B981" style={{ marginTop: '2px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>📈 Top Performers</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Retention bonuses for {onTrackCount} on-track performers to maintain productivity.</div>
          </Card>
          
          <Card style={{ padding: '16px', borderLeft: '4px solid #8B5CF6' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
              <Target size={16} color="#8B5CF6" style={{ marginTop: '2px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>🎯 Target Strategy</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Review quarterly targets based on market conditions and capabilities.</div>
          </Card>
        </div>
      )}

      {/* Commissions Tab */}
      {tab === 'commissions' && (
        <Card>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Lead Commissions — June 2025 (LIVE)</div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: 'rgba(255,107,107,0.12)', color: '#FF6B6B' }}>🟢 Real-time</span>
          </div>
          <div>
            {commissions.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No commissions added yet</p>
              </div>
            ) : (
              commissions.map((com, i) => (
                <div key={com.id} style={{ padding: '18px 24px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < commissions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#FF6B6B,#FF8E72)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>👑</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{com.leadName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{com.position} • {com.performance}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF6B6B' }}>₹ {com.amount.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{com.month}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', whiteSpace: 'nowrap', background: com.status === 'paid' ? 'rgba(16,185,129,0.12)' : com.status === 'approved' ? 'rgba(79,142,247,0.12)' : 'rgba(245,158,11,0.12)', color: com.status === 'paid' ? '#10B981' : com.status === 'approved' ? '#4F8EF7' : '#F59E0B' }}>
                      {com.status === 'paid' ? '✓ Paid' : com.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Rules Tab */}
      {tab === 'rules' && (
        <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Incentive & Commission Rules</div>
          <p>Configure payroll rules and commission policies here</p>
        </Card>
      )}

      {/* Disputes Tab */}
      {tab === 'disputes' && (
        <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Disputes & Appeals</div>
          <p>No active disputes. All incentives and commissions in good standing</p>
        </Card>
      )}
    </div>
  );
}
