'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import { Download, FileText, Filter, BarChart2, TrendingUp, Users, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

// Dynamic weekly attendance trend is calculated inside the Reports component body

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
  const { openModal, toast, employees, incentives, commissions, attendanceRecords, leaves, advancePayments } = useApp();

  const parsedSalary = (salStr: any) => {
    if (!salStr || typeof salStr !== 'string') {
      if (typeof salStr === 'number') return salStr;
      return 50000;
    }
    const clean = salStr.replace(/[^\d]/g, '');
    const val = parseInt(clean, 10);
    return isNaN(val) ? 50000 : val;
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickExport = (title: string) => {
    if (title === 'Payroll Cost Report') {
      const payrollData = employees.map(emp => {
        const salaryVal = parsedSalary(emp.salary || '50000');
        const basic = Math.round(salaryVal * 0.6);
        const hra = Math.round(basic * 0.4);
        const allowances = Math.round(basic * 0.2);
        const gross = basic + hra + allowances;

        const absentDays = attendanceRecords.filter(
          r => r.employeeId === emp.id && r.status === 'absent' && (r.date.includes('-06-') || r.date.startsWith('2026-06') || r.date.startsWith('2025-06'))
        ).length;

        const unpaidLeavesCount = leaves.filter(
          l => l.employeeId === emp.id && 
               l.status === 'approved' && 
               (l.from.includes('-06-') || l.from.startsWith('2026-06') || l.from.startsWith('2025-06')) &&
               (l.type as string === 'unpaid' || l.type as string === 'LOP' || l.reason?.toLowerCase().includes('unpaid') || l.reason?.toLowerCase().includes('lop'))
        ).length;

        const totalAbsentOrLopDays = absentDays + unpaidLeavesCount;
        const lopDeduction = Math.round((salaryVal / 30) * totalAbsentOrLopDays);

        const empIncentives = incentives.filter(
          inc => inc.employeeId === emp.id && 
                 (inc.status === 'approved' || inc.status === 'paid') && 
                 (inc.month.includes('Jun') || inc.month.includes('June'))
        );
        
        const empCommissions = commissions.filter(
          com => (com.leadName.toLowerCase() === emp.name.toLowerCase() || com.leadId === emp.id || com.leadId.replace('LEAD', 'EMP') === emp.id) && 
                 (com.status === 'approved' || com.status === 'paid') && 
                 (com.month.includes('Jun') || com.month.includes('June'))
        );

        const totalIncentives = empIncentives.reduce((sum, inc) => sum + inc.amount, 0) + empCommissions.reduce((sum, com) => sum + com.amount, 0);

        const pf = Math.round(basic * 0.12);
        const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
        const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);

        const empAdvances = advancePayments ? advancePayments.filter(
          adv => adv.employeeId === emp.id && 
                 adv.status === 'pending' &&
                 (adv.deductMonth === '2026-06' || adv.deductMonth === '2025-06')
        ) : [];
        const advanceDeduction = empAdvances.reduce((sum, adv) => sum + adv.amount, 0);

        const net = gross - pf - esi - tds - lopDeduction - advanceDeduction + totalIncentives;

        return {
          id: emp.id,
          name: emp.name,
          dept: emp.dept,
          basic,
          hra,
          allowances,
          gross,
          incentives: totalIncentives,
          pf,
          esi,
          tds,
          lopDeduction,
          advanceDeduction,
          net
        };
      });

      let csv = 'Employee ID,Name,Department,Basic,HRA,Allowances,Gross,Incentives,PF,ESI,TDS,LOP Deduction,Advance Deduction,Net Pay\n';
      payrollData.forEach(p => {
        csv += `"${p.id}","${p.name}","${p.dept}",${p.basic},${p.hra},${p.allowances},${p.gross},${p.incentives},${p.pf},${p.esi},${p.tds},${p.lopDeduction},${p.advanceDeduction},${p.net}\n`;
      });
      downloadFile('payroll_cost_report.csv', csv, 'text/csv;charset=utf-8;');
      toast('success', 'Payroll Cost Report Downloaded', 'The Payroll Cost Report CSV file has been generated and downloaded.');
    } else if (title === 'Headcount Report') {
      let csv = 'ID,Name,Email,Phone,Location,Department,Role,Joined,Status,Salary,Type\n';
      employees.forEach(emp => {
        csv += `"${emp.id}","${emp.name}","${emp.email}","${emp.phone}","${emp.location}","${emp.dept}","${emp.role}","${emp.joined}","${emp.status}","${emp.salary}","${emp.type}"\n`;
      });
      downloadFile('headcount_report.csv', csv, 'text/csv;charset=utf-8;');
      toast('success', 'Headcount Report Downloaded', 'The Headcount Report CSV file has been generated and downloaded.');
    } else if (title === 'Attendance Summary') {
      let csv = 'Employee ID,Employee Name,Total Present/WFH,Total Late,Total Absent,Total Unpaid Leaves\n';
      employees.forEach(emp => {
        const present = attendanceRecords.filter(r => r.employeeId === emp.id && (r.status === 'present' || r.status === 'wfh')).length;
        const late = attendanceRecords.filter(r => r.employeeId === emp.id && r.status === 'late').length;
        const absent = attendanceRecords.filter(r => r.employeeId === emp.id && r.status === 'absent').length;
        const unpaidLeaves = leaves.filter(l => l.employeeId === emp.id && l.status === 'approved' && (l.type as string === 'unpaid' || l.type as string === 'LOP' || l.reason?.toLowerCase().includes('unpaid') || l.reason?.toLowerCase().includes('lop'))).length;
        csv += `"${emp.id}","${emp.name}",${present},${late},${absent},${unpaidLeaves}\n`;
      });
      downloadFile('attendance_summary.csv', csv, 'text/csv;charset=utf-8;');
      toast('success', 'Attendance Summary Downloaded', 'The Attendance Summary CSV file has been generated and downloaded.');
    } else if (title === 'Incentive Payout Report') {
      let csv = 'Incentive ID,Employee ID,Employee Name,Month,Amount,Status,Rule Type,Target\n';
      incentives.forEach(i => {
        csv += `"${i.id}","${i.employeeId}","${i.employeeName}","${i.month}",${i.amount},"${i.status}","${i.ruleType}",${i.target}\n`;
      });
      downloadFile('incentive_payout_report.csv', csv, 'text/csv;charset=utf-8;');
      toast('success', 'Incentive Payout Report Downloaded', 'The Incentive Payout Report CSV file has been generated and downloaded.');
    } else if (title === 'Tax & Compliance Report') {
      let csv = 'Employee ID,Employee Name,Basic Salary,PF Deduction,TDS Deduction,ESI Deduction\n';
      employees.forEach(emp => {
        const salaryVal = parsedSalary(emp.salary || '50000');
        const basic = Math.round(salaryVal * 0.6);
        const gross = basic * 1.6;
        const pf = Math.round(basic * 0.12);
        const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
        const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);
        csv += `"${emp.id}","${emp.name}",${basic},${pf},${tds},${esi}\n`;
      });
      downloadFile('tax_and_compliance_report.csv', csv, 'text/csv;charset=utf-8;');
      toast('success', 'Tax & Compliance Report Downloaded', 'The Tax & Compliance Report CSV file has been generated and downloaded.');
    } else if (title === 'Attrition & Hiring Report') {
      let csv = 'Department,Active Employees,Inactive/Terminated,Total Hired\n';
      const depts = Array.from(new Set(employees.map(e => e.dept)));
      depts.forEach(dept => {
        const active = employees.filter(e => e.dept === dept && e.status === 'active').length;
        const inactive = employees.filter(e => e.dept === dept && e.status === 'inactive').length;
        csv += `"${dept}",${active},${inactive},${active + inactive}\n`;
      });
      downloadFile('attrition_and_hiring_report.csv', csv, 'text/csv;charset=utf-8;');
      toast('success', 'Attrition & Hiring Report Downloaded', 'The Attrition & Hiring Report CSV file has been generated and downloaded.');
    }
  };

  // Group by active departments: "Sales", "Gold Crafting", "Store Ops", "Accounts"
  const targetDepts = ["Sales", "Gold Crafting", "Store Ops", "Accounts"];

  const deptCosts = targetDepts.map(dept => {
    const deptEmployees = employees.filter(e => e.dept === dept && e.status === 'active');
    let totalCost = 0;

    deptEmployees.forEach(emp => {
      const salaryVal = parsedSalary(emp.salary);
      const basic = Math.round(salaryVal * 0.6);
      const hra = Math.round(basic * 0.4);
      const allowances = Math.round(basic * 0.2);
      const gross = basic + hra + allowances;

      // LOP Days & Deduction
      const absentDays = attendanceRecords.filter(
        r => r.employeeId === emp.id && r.status === 'absent' && (r.date.includes('-06-') || r.date.startsWith('2026-06'))
      ).length;

      const unpaidLeavesCount = leaves.filter(
        l => l.employeeId === emp.id && 
             l.status === 'approved' && 
             (l.from.includes('-06-') || l.from.startsWith('2026-06')) &&
             (l.type as string === 'unpaid' || l.type as string === 'LOP' || l.reason.toLowerCase().includes('unpaid') || l.reason.toLowerCase().includes('lop'))
      ).length;

      const totalAbsentOrLopDays = absentDays + unpaidLeavesCount;
      const lopDeduction = Math.round((salaryVal / 30) * totalAbsentOrLopDays);

      // Incentives & Commissions
      const empIncentives = incentives.filter(
        inc => inc.employeeId === emp.id && 
               (inc.status === 'approved' || inc.status === 'paid') && 
               (inc.month.includes('Jun') || inc.month.includes('June'))
      );
      
      const empCommissions = commissions.filter(
        com => (com.leadName.toLowerCase() === emp.name.toLowerCase() || com.leadId === emp.id || com.leadId.replace('LEAD', 'EMP') === emp.id) && 
               (com.status === 'approved' || com.status === 'paid') && 
               (com.month.includes('Jun') || com.month.includes('June'))
      );

      const totalIncentives = empIncentives.reduce((sum, inc) => sum + inc.amount, 0) + empCommissions.reduce((sum, com) => sum + com.amount, 0);

      const pf = Math.round(basic * 0.12);
      const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
      const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);

      const netPay = gross - pf - esi - tds - lopDeduction + totalIncentives;
      totalCost += netPay;
    });

    // Convert totalCost to Lakhs (1 Lakh = 100,000)
    const costInLakhs = parseFloat((totalCost / 100000).toFixed(2));

    return {
      dept,
      cost: costInLakhs,
      headcount: deptEmployees.length
    };
  });

  const totalNetPayroll = deptCosts.reduce((sum, d) => sum + d.cost, 0);
  const monthlyPayroll = [
    { month: 'Jan', cost: parseFloat((totalNetPayroll * 0.90).toFixed(2)), employees: employees.length },
    { month: 'Feb', cost: parseFloat((totalNetPayroll * 0.92).toFixed(2)), employees: employees.length },
    { month: 'Mar', cost: parseFloat((totalNetPayroll * 0.91).toFixed(2)), employees: employees.length },
    { month: 'Apr', cost: parseFloat((totalNetPayroll * 0.95).toFixed(2)), employees: employees.length },
    { month: 'May', cost: parseFloat((totalNetPayroll * 0.98).toFixed(2)), employees: employees.length },
    { month: 'Jun', cost: parseFloat(totalNetPayroll.toFixed(2)), employees: employees.length },
  ];

  // Dynamic Reports Page KPI Calculations
  const payrollYtdSum = monthlyPayroll.reduce((sum, m) => sum + m.cost, 0);
  const payrollYtdDisplay = payrollYtdSum >= 100 
    ? `₹ ${(payrollYtdSum / 100).toFixed(2)} Cr` 
    : `₹ ${payrollYtdSum.toFixed(2)} Lakhs`;

  const totalAttRecords = attendanceRecords.length;
  const presentAttRecords = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
  const avgAttendanceDisplay = totalAttRecords > 0 
    ? `${((presentAttRecords / totalAttRecords) * 100).toFixed(1)}%` 
    : (employees.length > 0 ? '100.0%' : '0.0%');

  const inactiveCount = employees.filter(e => e.status === 'inactive').length;
  const attritionRateDisplay = employees.length > 0 
    ? `${((inactiveCount / employees.length) * 100).toFixed(1)}%` 
    : '0.0%';

  const totalIncentivesPaid = incentives.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) +
                              commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const incentivesDisplay = totalIncentivesPaid >= 100000 
    ? `₹ ${(totalIncentivesPaid / 100000).toFixed(2)}L` 
    : `₹ ${totalIncentivesPaid.toLocaleString('en-IN')}`;

  // Dynamic weekly attendance rate trend for the last 5 weeks
  const getWeeklyAttendanceTrend = () => {
    const trend = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() || 7) - i * 7 + 1);
      const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
      
      const recordsInWeek = attendanceRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      const total = recordsInWeek.length;
      const present = recordsInWeek.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
      
      trend.push({
        week: `Wk ${5 - i}`,
        rate: employees.length === 0 ? 0 : rate
      });
    }
    return trend;
  };
  const dynamicAttendanceTrend = getWeeklyAttendanceTrend();

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
          { label: 'Payroll YTD',        value: payrollYtdDisplay, change: '+0.0%', color: '#10B981' },
          { label: 'Avg Attendance Rate', value: avgAttendanceDisplay, change: '+0.0%',  color: '#4F8EF7' },
          { label: 'Attrition Rate (YTD)',value: attritionRateDisplay, change: '-0.0%',  color: '#8B5CF6' },
          { label: 'Incentives Paid YTD', value: incentivesDisplay, change: '+0%',   color: '#F59E0B' },
        ].map((kpi, i) => (
          <Card key={i} style={{ padding: '20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px' }}>{kpi.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#8B9AB5' }}>Estimated from current month</div>
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
            <LineChart data={dynamicAttendanceTrend}>
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
                        onClick={() => handleQuickExport(rpt.title)}
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
