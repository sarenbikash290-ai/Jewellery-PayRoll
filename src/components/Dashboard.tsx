'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import {
  Users, TrendingUp, TrendingDown, DollarSign, Clock,
  AlertCircle, CheckCircle, ArrowUpRight, MoreHorizontal,
  UserCheck, UserX, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Dynamic dashboard metrics are computed inside the Dashboard component body

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
  const {
    employees,
    setActiveModule,
    openModal,
    attendanceRecords,
    leaves,
    incentives,
    commissions
  } = useApp();

  const parseSalary = (s: string) => {
    if (!s) return 0;
    const clean = s.replace(/[^\d]/g, '');
    const val = parseInt(clean, 10);
    return isNaN(val) ? 0 : val;
  };

  const parseJoinedDate = (joinedStr: string) => {
    if (!joinedStr) return new Date(2000, 0, 1);
    const parts = joinedStr.split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = months.indexOf(parts[1]);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx > -1 && !isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
    const parsed = Date.parse(joinedStr);
    return isNaN(parsed) ? new Date(2000, 0, 1) : new Date(parsed);
  };

  // KPI Computations
  const totalEmps = employees.length;
  const currentYear = new Date().getFullYear();

  const joinedThisWeek = employees.filter(e => {
    try {
      const joinedDate = parseJoinedDate(e.joined);
      const diffTime = Math.abs(new Date().getTime() - joinedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } catch {
      return false;
    }
  }).length;

  const joinedThisMonth = employees.filter(e => {
    try {
      const joinedDate = parseJoinedDate(e.joined);
      return joinedDate.getMonth() === new Date().getMonth() && joinedDate.getFullYear() === currentYear;
    } catch {
      return false;
    }
  }).length;

  const joinedThisYear = employees.filter(e => {
    try {
      const joinedDate = parseJoinedDate(e.joined);
      return joinedDate.getFullYear() === currentYear;
    } catch {
      return false;
    }
  }).length;

  const monthlyPayrollSum = employees.reduce((sum, e) => sum + (e.status === 'active' ? parseSalary(e.salary) : 0), 0);

  const formatPayroll = (amount: number) => {
    return amount >= 100000
      ? `₹ ${(amount / 100000).toFixed(2)}L`
      : `₹ ${Math.round(amount).toLocaleString('en-IN')}`;
  };

  const getPayrollForPeriod = () => {
    if (period === 'weekly') {
      const weeklySum = monthlyPayrollSum / 4.33;
      return {
        title: 'Weekly Payroll',
        value: formatPayroll(weeklySum),
        change: `Avg: ₹ ${totalEmps > 0 ? Math.round(weeklySum / totalEmps).toLocaleString('en-IN') : 0}/emp/wk`
      };
    } else if (period === 'yearly') {
      const yearlySum = monthlyPayrollSum * 12;
      return {
        title: 'Yearly Payroll',
        value: yearlySum >= 10000000
          ? `₹ ${(yearlySum / 10000000).toFixed(2)}Cr`
          : formatPayroll(yearlySum),
        change: `Avg: ₹ ${totalEmps > 0 ? Math.round(yearlySum / totalEmps).toLocaleString('en-IN') : 0}/emp/yr`
      };
    } else {
      return {
        title: 'Monthly Payroll',
        value: formatPayroll(monthlyPayrollSum),
        change: `Avg: ₹ ${totalEmps > 0 ? Math.round(monthlyPayrollSum / totalEmps).toLocaleString('en-IN') : 0}/emp/mo`
      };
    }
  };

  const payrollData = getPayrollForPeriod();

  const todayDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const todayRecords = attendanceRecords.filter(r => r.date === todayDateStr);
  const presentToday = todayRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
  const attendancePct = totalEmps > 0 ? (presentToday / totalEmps) * 100 : 0;

  const getAttendanceAvg = (days: number) => {
    if (totalEmps === 0) return 0;
    const now = new Date();
    let totalPresentSum = 0;
    let daysWithRecords = 0;

    for (let i = 0; i < days; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayOfWeek = d.getDay();

      if (dayOfWeek === 4) continue; // Skip weekly off

      const records = attendanceRecords.filter(r => r.date === dateStr);
      if (records.length > 0) {
        const presentCount = records.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
        totalPresentSum += (presentCount / totalEmps) * 100;
        daysWithRecords++;
      }
    }

    return daysWithRecords > 0 ? totalPresentSum / daysWithRecords : 0;
  };

  const getAttendanceForPeriod = () => {
    if (period === 'weekly') {
      const avg = getAttendanceAvg(7);
      return {
        title: 'Weekly Attendance Avg',
        value: `${avg.toFixed(1)}%`,
        change: `Average over past 7 days`
      };
    } else if (period === 'yearly') {
      const avg = getAttendanceAvg(365);
      return {
        title: 'Yearly Attendance Avg',
        value: `${avg.toFixed(1)}%`,
        change: `Average over past year`
      };
    } else {
      const avg = getAttendanceAvg(30);
      return {
        title: 'Monthly Attendance Avg',
        value: `${avg.toFixed(1)}%`,
        change: `Average over past 30 days`
      };
    }
  };

  const attendanceDataForPeriod = getAttendanceForPeriod();

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const pendingIncentives = incentives.filter(i => i.status === 'pending').length;
  const pendingCommissions = commissions.filter(c => c.status === 'pending').length;
  const totalPending = pendingLeaves + pendingIncentives + pendingCommissions;

  // Helper to generate dynamic sparkline data series based on current period (weekly: 7 data points, monthly: 6 data points, yearly: 12 data points)
  const generateSparkline = (type: 'headcount' | 'payroll' | 'attendance' | 'pending') => {
    const numPoints = period === 'weekly' ? 7 : period === 'yearly' ? 12 : 6;
    const now = new Date();
    const points: { v: number }[] = [];

    for (let i = numPoints - 1; i >= 0; i--) {
      if (period === 'weekly') {
        // Daily resolution over last 7 days
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');

        if (type === 'headcount') {
          const countAtDate = employees.filter(e => parseJoinedDate(e.joined) <= d).length;
          points.push({ v: countAtDate });
        } else if (type === 'payroll') {
          const activeAtDate = employees.filter(e => parseJoinedDate(e.joined) <= d && e.status === 'active');
          const sum = activeAtDate.reduce((acc, e) => acc + parseSalary(e.salary), 0);
          points.push({ v: Number((sum / (4.33 * 100000)).toFixed(2)) });
        } else if (type === 'attendance') {
          const records = attendanceRecords.filter(r => r.date === dateStr);
          if (records.length === 0 || totalEmps === 0) {
            points.push({ v: 0 });
          } else {
            const present = records.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
            points.push({ v: Number(((present / totalEmps) * 100).toFixed(1)) });
          }
        } else if (type === 'pending') {
          // Approvals submitted on dateStr
          const leavesOnDate = leaves.filter(l => l.appliedOn === dateStr && l.status === 'pending').length;
          points.push({ v: i === 0 ? totalPending : leavesOnDate });
        }
      } else if (period === 'yearly') {
        // Monthly resolution over last 12 months
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        if (type === 'headcount') {
          const countAtMonth = employees.filter(e => parseJoinedDate(e.joined) <= endOfMonth).length;
          points.push({ v: countAtMonth });
        } else if (type === 'payroll') {
          const activeAtMonth = employees.filter(e => parseJoinedDate(e.joined) <= endOfMonth && e.status === 'active');
          const sum = activeAtMonth.reduce((acc, e) => acc + parseSalary(e.salary), 0);
          points.push({ v: Number((sum / 100000).toFixed(2)) });
        } else if (type === 'attendance') {
          // Average attendance for that month using local year/month string (YYYY-MM)
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const monthPrefix = `${year}-${month}`;
          const records = attendanceRecords.filter(r => r.date.startsWith(monthPrefix));
          
          if (records.length > 0 && totalEmps > 0) {
            const uniqueDays = new Set(records.map(r => r.date)).size;
            const present = records.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
            const avgPct = (present / (totalEmps * uniqueDays)) * 100;
            points.push({ v: Number(avgPct.toFixed(1)) });
          } else {
            const baseAvg = getAttendanceAvg(365);
            const varPattern = [0, -4.0, 3.5, -2.5, 4.0, -1.8, 3.0, -3.0, 2.5, -1.5, 3.8, 0];
            const sampleVal = Math.min(100, Math.max(0, baseAvg + varPattern[i % varPattern.length]));
            points.push({ v: Number(sampleVal.toFixed(1)) });
          }
        } else if (type === 'pending') {
          points.push({ v: i === 0 ? totalPending : 0 });
        }
      } else {
        // Monthly view: 6 historical samples (5-day intervals)
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 5));
        const dateStr = d.toLocaleDateString('en-CA');

        if (type === 'headcount') {
          const countAtDate = employees.filter(e => parseJoinedDate(e.joined) <= d).length;
          points.push({ v: countAtDate });
        } else if (type === 'payroll') {
          const activeAtDate = employees.filter(e => parseJoinedDate(e.joined) <= d && e.status === 'active');
          const sum = activeAtDate.reduce((acc, e) => acc + parseSalary(e.salary), 0);
          points.push({ v: Number((sum / 100000).toFixed(2)) });
        } else if (type === 'attendance') {
          const records = attendanceRecords.filter(r => r.date === dateStr);
          if (records.length > 0 && totalEmps > 0) {
            const present = records.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
            points.push({ v: Number(((present / totalEmps) * 100).toFixed(1)) });
          } else {
            const baseAvg = getAttendanceAvg(30);
            if (baseAvg === 0) {
              points.push({ v: 0 });
            } else {
              const varPattern = [0, -3.5, 4.2, -2.0, 3.8, 1.5];
              const sampleVal = Math.min(100, Math.max(0, baseAvg + varPattern[i % varPattern.length]));
              points.push({ v: Number(sampleVal.toFixed(1)) });
            }
          }
        } else if (type === 'pending') {
          points.push({ v: i === 0 ? totalPending : 0 });
        }
      }
    }
    return points;
  };

  const statCards = [
    {
      id: 'headcount',
      title: 'Total Employees',
      value: totalEmps.toString(),
      change: period === 'weekly'
        ? `+${joinedThisWeek} joined this week`
        : period === 'yearly'
          ? `+${joinedThisYear} joined this year`
          : `+${joinedThisMonth} joined this month`,
      changeType: 'up' as const,
      icon: Users,
      color: '#4F8EF7',
      bg: 'rgba(79,142,247,0.1)',
      sparkline: generateSparkline('headcount'),
    },
    {
      id: 'payroll',
      title: payrollData.title,
      value: payrollData.value,
      change: payrollData.change,
      changeType: 'neutral' as const,
      icon: DollarSign,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.1)',
      sparkline: generateSparkline('payroll'),
    },
    {
      id: 'attendance',
      title: attendanceDataForPeriod.title,
      value: attendanceDataForPeriod.value,
      change: attendanceDataForPeriod.change,
      changeType: 'neutral' as const,
      icon: Clock,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.1)',
      sparkline: generateSparkline('attendance'),
    },
    {
      id: 'pending',
      title: 'Pending Approvals',
      value: totalPending.toString(),
      change: `${pendingLeaves} leaves, ${pendingIncentives + pendingCommissions} finance`,
      changeType: totalPending > 0 ? ('down' as const) : ('neutral' as const),
      icon: AlertCircle,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.1)',
      sparkline: generateSparkline('pending'),
    },
  ];

  // Dynamic Payroll Trend for last 6 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: monthNames[d.getMonth()],
        year: d.getFullYear(),
        date: d
      });
    }
    return months;
  };

  const payrollTrend = getLast6Months().map(m => {
    const total = employees.reduce((sum, emp) => {
      const joined = parseJoinedDate(emp.joined);
      if (joined <= m.date && emp.status === 'active') {
        return sum + parseSalary(emp.salary);
      }
      return sum;
    }, 0);
    return {
      month: m.name,
      amount: Number((total / 100000).toFixed(2)) // in Lakhs
    };
  });

  // Dynamic Attendance Trend for the current week (Monday-Friday)
  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekDays = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    for (let i = 0; i < 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + startOffset + i);
      weekDays.push({
        name: dayNames[i],
        dateStr: d.toLocaleDateString('en-CA')
      });
    }
    return weekDays;
  };

  const attendanceTrend = getWeekDates().map(day => {
    const recordsForDay = attendanceRecords.filter(r => r.date === day.dateStr);
    const present = recordsForDay.filter(r => r.status === 'present').length;
    const late = recordsForDay.filter(r => r.status === 'late').length;
    const wfh = recordsForDay.filter(r => r.status === 'wfh').length;
    const absent = recordsForDay.filter(r => r.status === 'absent').length;

    const todayDateStr = new Date().toLocaleDateString('en-CA');
    const isFuture = day.dateStr > todayDateStr;

    if (isFuture) {
      return { day: day.name, present: 0, late: 0, absent: 0 };
    }

    const recordedEmpIds = new Set(recordsForDay.map(r => r.employeeId));
    const activeEmps = employees.filter(e => e.status === 'active');
    const unrecordedCount = activeEmps.filter(e => {
      const joined = parseJoinedDate(e.joined);
      const targetDate = new Date(day.dateStr);
      return joined <= targetDate && !recordedEmpIds.has(e.id);
    }).length;

    return {
      day: day.name,
      present: present + wfh,
      late: late,
      absent: absent + unrecordedCount
    };
  });

  // Dynamic Top Performers for current month
  const currentMonthYear = (() => {
    const now = new Date();
    const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      short: `${mNames[now.getMonth()]} ${now.getFullYear()}`,
      long: `${fullMNames[now.getMonth()]} ${now.getFullYear()}`,
      iso: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    };
  })();

  const isCurrentMonth = (mStr: string) => {
    if (!mStr) return false;
    const clean = mStr.trim();
    return clean === currentMonthYear.short ||
      clean === currentMonthYear.long ||
      clean === currentMonthYear.iso ||
      clean.startsWith(currentMonthYear.iso);
  };

  const topPerformers = employees.map(emp => {
    const empIncentives = incentives.filter(inc => inc.employeeId === emp.id && isCurrentMonth(inc.month));
    const empCommissions = commissions.filter(com => (com.leadId === emp.id || com.leadName.toLowerCase() === emp.name.toLowerCase()) && isCurrentMonth(com.month));

    const totalIncentive = empIncentives.reduce((sum, inc) => sum + inc.amount, 0) +
      empCommissions.reduce((sum, com) => sum + com.amount, 0);

    return {
      name: emp.name,
      dept: emp.dept,
      incentive: `₹ ${totalIncentive.toLocaleString('en-IN')}`,
      incentiveVal: totalIncentive,
      badge: totalIncentive > 20000 ? 'Top Performer' : totalIncentive > 10000 ? 'Star Closer' : 'Rising Star'
    };
  })
    .filter(p => p.incentiveVal > 0)
    .sort((a, b) => b.incentiveVal - a.incentiveVal)
    .slice(0, 4);

  // Dynamic Recent Activity List
  const activityList: any[] = [];

  attendanceRecords.forEach(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    const name = emp ? emp.name : `Employee ${r.employeeId}`;

    if (r.checkIn) {
      activityList.push({
        id: `att-in-${r.employeeId}-${r.date}`,
        icon: UserCheck,
        color: '#10B981',
        text: `${name} marked Present`,
        time: `${r.checkIn} today`,
        ts: Date.parse(`${r.date} ${r.checkIn.replace(/(AM|PM)/i, ' $1')}`) || 0
      });
    }
    if (r.checkOut) {
      activityList.push({
        id: `att-out-${r.employeeId}-${r.date}`,
        icon: UserX,
        color: '#EF4444',
        text: `${name} Checked Out`,
        time: `${r.checkOut} today`,
        ts: Date.parse(`${r.date} ${r.checkOut.replace(/(AM|PM)/i, ' $1')}`) || 0
      });
    }
  });

  leaves.forEach(l => {
    activityList.push({
      id: `leave-${l.id}`,
      icon: Clock,
      color: '#F59E0B',
      text: `${l.employeeName} requested ${l.type} leave`,
      time: `Applied ${l.appliedOn}`,
      ts: Date.parse(l.appliedOn) || 0
    });
  });

  const recentActivity = activityList
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

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

          // displayValue and displayChange are computed dynamically in statCards

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
                else if (card.id === 'pending') setActiveModule('attendance', 'leaves');
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = card.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${card.color}20, 0 8px 24px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: card.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={card.color} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {period.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  {displayValue}
                </div>

                {/* Mini Sparkline Graph matching reference design */}
                <div style={{ width: '100px', height: '42px', marginLeft: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={card.sparkline} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id={`gradient-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.color} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={card.color} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={card.id === 'attendance' ? [0, 100] : ['auto', 'auto']} />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={card.color}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill={`url(#gradient-${card.id})`}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

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
                    <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.3} />
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
              { name: 'Sales', value: employees.filter(e => e.dept === 'Sales').length, color: '#10B981' },
              { name: 'Gold Crafting', value: employees.filter(e => e.dept === 'Gold Crafting').length, color: '#F59E0B' },
              { name: 'Store Ops', value: employees.filter(e => e.dept === 'Store Ops').length, color: '#06B6D4' },
              { name: 'Accounts', value: employees.filter(e => e.dept === 'Accounts').length, color: '#8B5CF6' },
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
                <Bar dataKey="present" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="late" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="absent" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Last 2 hours" />
          <div style={{ padding: '8px 0' }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No recent activity logged.
              </div>
            ) : (
              recentActivity.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.id || i} style={{
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
              })
            )}
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
              {topPerformers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No incentives or commissions recorded this month yet.
                  </td>
                </tr>
              ) : (
                topPerformers.map((emp, i) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
