'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import { Download, FileText, Filter, BarChart2, TrendingUp, Users, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const monthlyPayroll = [
  { month: 'Jan', cost: 42.3, employees: 234 },
  { month: 'Feb', cost: 44.1, employees: 236 },
  { month: 'Mar', cost: 43.8, employees: 238 },
  { month: 'Apr', cost: 46.2, employees: 242 },
  { month: 'May', cost: 48.7, employees: 245 },
  { month: 'Jun', cost: 51.2, employees: 247 },
];

const deptCosts = [
  { dept: 'Engineering', cost: 18.4, headcount: 82 },
  { dept: 'Sales',       cost: 11.2, headcount: 64 },
  { dept: 'Operations',  cost: 8.6,  headcount: 38 },
  { dept: 'Finance',     cost: 7.2,  headcount: 35 },
  { dept: 'HR',          cost: 5.8,  headcount: 28 },
];

const attendanceTrend = [
  { week: 'Wk 1', rate: 88 }, { week: 'Wk 2', rate: 91 },
  { week: 'Wk 3', rate: 86 }, { week: 'Wk 4', rate: 93 },
  { week: 'Wk 5', rate: 91 },
];

const tooltipStyle = { contentStyle: { background: '#1E2A42', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }, labelStyle: { color: '#8B9AB5' } };

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>
);

const CardHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</div>}
    </div>
    {action}
  </div>
);

const reportTemplates = [
  { icon: DollarSign, color: '#10B981', title: 'Payroll Cost Report',        desc: 'Monthly payroll by dept & employee', format: 'Excel + PDF' },
  { icon: Users,      color: '#4F8EF7', title: 'Headcount Report',           desc: 'Workforce by dept, type, location',  format: 'Excel' },
  { icon: BarChart2,  color: '#8B5CF6', title: 'Attendance Summary',         desc: 'Attendance rate, late, absences',    format: 'Excel + PDF' },
  { icon: TrendingUp, color: '#F59E0B', title: 'Incentive Payout Report',    desc: 'Commission payouts vs targets',      format: 'Excel' },
  { icon: FileText,   color: '#06B6D4', title: 'Tax & Compliance Report',    desc: 'TDS, PF, ESI deductions summary',    format: 'PDF' },
  { icon: Users,      color: '#EF4444', title: 'Attrition & Hiring Report',  desc: 'Joiners, leavers, attrition rate',   format: 'Excel' },
];

export default function Reports() {
  const { openModal, toast } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Reports & Analytics</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>June 2025 · Data-driven insights across all HR functions</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => openModal('customReport')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <Filter size={15} /> Custom Report
          </button>
          <button 
            onClick={() => openModal('exportData')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', background: 'var(--brand)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={15} /> Export All
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Payroll YTD',        value: '₹ 2.76 Cr', change: '+12.4%', color: '#10B981' },
          { label: 'Avg Attendance Rate', value: '91.4%',      change: '+2.1%',  color: '#4F8EF7' },
          { label: 'Attrition Rate (YTD)',value: '4.2%',       change: '-0.8%',  color: '#8B5CF6' },
          { label: 'Incentives Paid YTD', value: '₹ 18.4L',   change: '+22%',   color: '#F59E0B' },
        ].map((kpi, i) => (
          <Card key={i} style={{ padding: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: kpi.change.startsWith('+') ? '#10B981' : '#EF4444' }}>{kpi.change} vs last year</div>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
        <Card>
          <CardHeader title="Payroll Cost Trend — 2025" subtitle="Monthly cost in Lakhs (₹)" action={
            <button 
              onClick={() => openModal('customReport')}
              style={{ fontSize: '12px', color: 'var(--brand)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Export →
            </button>
          } />
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyPayroll}>
                <defs>
                  <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`₹${v}L`, 'Payroll Cost']} />
                <Area type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={2.5} fill="url(#rptGrad)" dot={{ fill: '#10B981', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payroll by Department" subtitle="June 2025 in Lakhs (₹)" />
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptCosts} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8B9AB5', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}L`} />
                <YAxis type="category" dataKey="dept" tick={{ fill: '#8B9AB5', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`₹${v}L`, 'Cost']} />
                <Bar dataKey="cost" radius={[0,4,4,0]}>
                  {deptCosts.map((_, i) => (
                    <Cell key={i} fill={['#4F8EF7','#10B981','#8B5CF6','#F59E0B','#06B6D4'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Attendance Trend */}
      <Card>
        <CardHeader title="Attendance Rate — Weekly Trend" subtitle="Overall attendance percentage across all departments" action={
          <select style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', color: 'var(--text-secondary)', fontSize: '12px', outline: 'none' }}>
            <option>Last 5 Weeks</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
        } />
        <div style={{ padding: '24px' }}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, 'Attendance Rate']} />
              <Line type="monotone" dataKey="rate" stroke="#4F8EF7" strokeWidth={2.5} dot={{ fill: '#4F8EF7', r: 5, strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader title="Quick Report Templates" subtitle="One-click export for standard reports" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
          {reportTemplates.map((rpt, i) => {
            const Icon = rpt.icon;
            const row = Math.floor(i / 3);
            const col = i % 3;
            return (
              <div key={i} style={{
                padding: '20px 24px',
                borderRight: col < 2 ? '1px solid var(--border)' : 'none',
                borderBottom: row < 1 ? '1px solid var(--border)' : 'none',
                transition: 'var(--transition)', cursor: 'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', background: `${rpt.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={rpt.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{rpt.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{rpt.desc}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rpt.format}</span>
                      <button 
                        onClick={() => toast('success', 'Report Exported', `${rpt.title} successfully exported as ${rpt.format}.`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: rpt.color, background: `${rpt.color}12`, padding: '4px 10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
                      >
                        <Download size={12} /> Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
