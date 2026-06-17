'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import {
  Users, TrendingUp, TrendingDown, DollarSign, Clock,
  AlertCircle, CheckCircle, ArrowUpRight, MoreHorizontal,
  UserCheck, UserX, Calendar, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const payrollTrend = [
  { month: 'Jan', amount: 42.3 }, { month: 'Feb', amount: 44.1 },
  { month: 'Mar', amount: 43.8 }, { month: 'Apr', amount: 46.2 },
  { month: 'May', amount: 48.7 }, { month: 'Jun', amount: 51.2 },
];

const attendanceTrend = [
  { day: 'Mon', present: 218, absent: 12, late: 17 },
  { day: 'Tue', present: 224, absent: 8,  late: 15 },
  { day: 'Wed', present: 215, absent: 15, late: 17 },
  { day: 'Thu', present: 228, absent: 5,  late: 14 },
  { day: 'Fri', present: 211, absent: 19, late: 17 },
];

const deptData = [
  { name: 'Engineering', value: 82, color: '#4F8EF7' },
  { name: 'Sales',       value: 64, color: '#10B981' },
  { name: 'HR',          value: 28, color: '#8B5CF6' },
  { name: 'Finance',     value: 35, color: '#F59E0B' },
  { name: 'Operations',  value: 38, color: '#06B6D4' },
];

const topPerformers = [
  { name: 'Arjun Soni',    dept: 'Sales',         incentive: '₹ 8,500', badge: 'Top Closer' },
  { name: 'Anita Tiwari', dept: 'Sales',         incentive: '₹ 7,800', badge: '3x Target' },
  { name: 'Ramesh Sonar', dept: 'Gold Crafting', incentive: '₹ 3,000', badge: 'Zero Absent' },
  { name: 'Priya Mehta',  dept: 'Sales',         incentive: '₹ 5,200', badge: 'Rising Star' },
];

const recentActivity = [
  { icon: UserCheck,  color: '#10B981', text: 'Arjun Soni marked Present',              time: '2 min ago' },
  { icon: DollarSign, color: '#4F8EF7', text: 'Jun payroll approved by Accounts',       time: '15 min ago' },
  { icon: Clock,      color: '#F59E0B', text: 'Priya Mehta requested 2-day CL leave',  time: '32 min ago' },
  { icon: UserX,      color: '#EF4444', text: 'Sanjay Agarwal marked Absent today',     time: '1 hr ago' },
  { icon: TrendingUp, color: '#8B5CF6', text: 'Jun Incentive payouts processed',        time: '2 hr ago' },
];

const statCards = [
  {
    id: 'headcount',
    title: 'Total Employees',
    value: '247',
    change: '+12 this month',
    changeType: 'up',
    icon: Users,
    color: '#4F8EF7',
    bg: 'rgba(79,142,247,0.1)',
  },
  {
    id: 'payroll',
    title: 'Monthly Payroll',
    value: '₹ 51.2L',
    change: '+5.3% vs last month',
    changeType: 'up',
    icon: DollarSign,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
  },
  {
    id: 'attendance',
    title: "Today's Attendance",
    value: '91.4%',
    change: '226/247 present',
    changeType: 'neutral',
    icon: Clock,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    id: 'pending',
    title: 'Pending Approvals',
    value: '18',
    change: '3 urgent, 15 normal',
    changeType: 'down',
    icon: AlertCircle,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.1)',
  },
];

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    ...style,
  }}>{children}</div>
);

const CardHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</div>}
    </div>
    {action}
  </div>
);

const tooltipStyle = {
  contentStyle: { background: '#1E2A42', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#8B9AB5' },
};

export default function Dashboard() {
  const [period, setPeriod] = useState('monthly');
  const { employees, setActiveModule, openModal } = useApp();

  // Dynamic date — always shows the real current date
  const todayStr = (() => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {greeting}, Admin 👋
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {todayStr} · Here's what's happening today
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['weekly', 'monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '7px 16px', borderRadius: '8px',
              background: period === p ? 'var(--brand)' : 'var(--bg-card)',
              border: '1px solid', borderColor: period === p ? 'var(--brand)' : 'var(--border)',
              color: period === p ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
              cursor: 'pointer', transition: 'var(--transition)',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {statCards.map(card => {
          const Icon = card.icon;
          let displayValue = card.value;
          let displayChange = card.change;

          if (card.id === 'headcount') {
            displayValue = employees.length.toString();
          } else if (card.id === 'attendance') {
            const presentCount = Math.round(employees.length * 0.915);
            displayChange = `${presentCount}/${employees.length} present`;
          }

          return (
            <div key={card.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              transition: 'var(--transition)',
              cursor: 'pointer',
            }}
              onClick={() => {
                if (card.id === 'headcount') setActiveModule('employees');
                else if (card.id === 'payroll') setActiveModule('payroll');
                else if (card.id === 'attendance') setActiveModule('attendance');
                else if (card.id === 'pending') setActiveModule('payroll');
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = card.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${card.color}20, 0 8px 24px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: card.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={card.color} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {period.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px' }}>{displayValue}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{card.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: card.changeType === 'up' ? 'var(--success)' : card.changeType === 'down' ? 'var(--danger)' : 'var(--text-muted)' }}>
                {card.changeType === 'up' ? <TrendingUp size={12} /> : card.changeType === 'down' ? <TrendingDown size={12} /> : null}
                {displayChange}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>

        {/* Payroll Trend Chart */}
        <Card>
          <CardHeader title="Payroll Cost Trend" subtitle="Monthly payroll in Lakhs (₹)" action={
            <button 
              onClick={() => setActiveModule('payroll')}
              style={{ fontSize: '12px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'transparent', border: 'none' }}
            >
              View All <ArrowUpRight size={12} />
            </button>
          } />
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={payrollTrend}>
                <defs>
                  <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4F8EF7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`₹${v}L`, 'Payroll']} />
                <Area type="monotone" dataKey="amount" stroke="#4F8EF7" strokeWidth={2.5} fill="url(#payrollGrad)" dot={{ fill: '#4F8EF7', strokeWidth: 2, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Headcount */}
        <Card>
          <CardHeader title="Headcount by Dept" subtitle={`Total: ${employees.length} employees`} />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { name: 'Sales',          value: employees.filter(e => e.dept === 'Sales').length, color: '#10B981' },
              { name: 'Gold Crafting',  value: employees.filter(e => e.dept === 'Gold Crafting').length, color: '#F59E0B' },
              { name: 'Store Ops',      value: employees.filter(e => e.dept === 'Store Ops').length, color: '#06B6D4' },
              { name: 'Accounts',       value: employees.filter(e => e.dept === 'Accounts').length, color: '#8B5CF6' },
            ].map(dept => (
              <div key={dept.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{dept.name}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dept.value}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(dept.value / (employees.length || 1)) * 100}%`, background: dept.color, borderRadius: '3px', transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Attendance & Activity Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>

        {/* Attendance Chart */}
        <Card>
          <CardHeader title="Weekly Attendance" subtitle="This week breakdown" action={
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '2px', display: 'inline-block' }} />Present</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: '#F59E0B', borderRadius: '2px', display: 'inline-block' }} />Late</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '2px', display: 'inline-block' }} />Absent</span>
            </div>
          } />
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B9AB5', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="present" fill="#10B981" radius={[4,4,0,0]} maxBarSize={32} />
                <Bar dataKey="late"    fill="#F59E0B" radius={[4,4,0,0]} maxBarSize={32} />
                <Bar dataKey="absent"  fill="#EF4444" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Last 2 hours" />
          <div style={{ padding: '8px 0' }}>
            {recentActivity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} style={{
                  padding: '14px 24px',
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'var(--transition)',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ width: '32px', height: '32px', background: `${item.color}18`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.text}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader title="🏆 Top Performers This Month" subtitle="By incentive earned" action={
          <button 
            onClick={() => setActiveModule('incentives')}
            style={{ fontSize: '12px', color: 'var(--brand)', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            View All →
          </button>
        } />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Rank', 'Employee', 'Department', 'Incentive Earned', 'Badge', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((emp, i) => (
                <tr key={i}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : i === 1 ? 'linear-gradient(135deg,#8B9AB5,#4A5568)' : 'linear-gradient(135deg,#B45309,#92400E)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: `hsl(${i * 60 + 200}, 70%, 50%)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {emp.name.charAt(0)}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.dept}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>{emp.incentive}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)', color: 'var(--brand)', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px' }}>{emp.badge}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button 
                      onClick={() => {
                        const matchedEmp = employees.find(e => e.name === emp.name);
                        if (matchedEmp) {
                          openModal('viewEmployee', matchedEmp);
                        } else {
                          openModal('viewEmployee', { 
                            id: `EMP0${10 + i}`, 
                            name: emp.name, 
                            dept: emp.dept, 
                            role: emp.dept === 'Sales' ? 'Senior Sales Executive' : emp.dept === 'Engineering' ? 'Senior Engineer' : 'Operations Coordinator',
                            email: emp.name.toLowerCase().replace(' ', '') + '@company.com', 
                            phone: '+91 98765 1100' + i, 
                            location: 'Delhi', 
                            status: 'active', 
                            joined: '12 Mar 2021', 
                            salary: '₹ 72,000', 
                            type: 'Full-time' 
                          });
                        }
                      }}
                      style={{ fontSize: '12px', color: 'var(--brand)', background: 'rgba(79,142,247,0.1)', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, transition: 'var(--transition)', border: 'none', cursor: 'pointer' }}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { icon: Zap, label: 'Run Payroll', desc: 'Process June salary', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { icon: UserCheck, label: 'Live Log Sync', desc: 'Sync biometric devices', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { icon: DollarSign, label: 'View Payslips', desc: 'Download June slips', color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)' },
          { icon: Calendar, label: 'Schedule Shift', desc: 'Plan next week', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
        ].map((action, i) => {
          const Icon = action.icon;
          const handleClick = () => {
            if (i === 0) setActiveModule('payroll');
            else if (i === 1) setActiveModule('attendance');
            else if (i === 2) openModal('viewPayslip');
            else if (i === 3) setActiveModule('attendance');
          };
          return (
            <button key={i} 
              onClick={handleClick}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex', gap: '14px', alignItems: 'center',
                cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = action.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              <div style={{ width: '40px', height: '40px', background: action.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={action.color} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{action.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
