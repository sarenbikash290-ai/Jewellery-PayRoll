'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { FileText, Download, CheckCircle, AlertCircle, Banknote, Clock, Calendar, Sparkles } from 'lucide-react';
import { generatePayslip } from '../../lib/generatePayslip';
import { calculateMonthlySalaryBreakdown, calculateMonthlySalaryProgress } from '@/utils/payrollCalc';

interface EmpPayslipsProps {
  employee: Employee;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EmpPayslips({ employee }: EmpPayslipsProps) {
  const {
    toast,
    payrollLocks,
    payslips,
    attendanceRecords,
    leaves,
    incentives,
    commissions,
    advancePayments,
    overtimeRate,
    holidays
  } = useApp();

  const [downloading, setDownloading] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const parseJoinedDate = (joinedStr: string) => {
    if (!joinedStr) return new Date(2000, 0, 1);
    // Check ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(joinedStr.trim())) {
      const [y, m, d] = joinedStr.trim().split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    }
    const parsed = Date.parse(joinedStr);
    if (!isNaN(parsed)) return new Date(parsed);

    const parts = joinedStr.trim().split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthsLong = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const mStr = parts[1].toLowerCase();
      let monthIdx = monthsShort.indexOf(mStr);
      if (monthIdx === -1) {
        monthIdx = monthsLong.indexOf(mStr);
      }
      if (monthIdx === -1 && mStr.length >= 3) {
        monthIdx = monthsShort.indexOf(mStr.substring(0, 3));
      }
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx > -1 && !isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
    return new Date(2000, 0, 1);
  };

  const payslipCards = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const currentDay = now.getDate();

    const joinedDate = parseJoinedDate(employee.joined);
    const startYear = joinedDate.getFullYear();
    const startMonth = joinedDate.getMonth() + 1;

    // Collect all month codes from employee's joining date up to the current month
    const monthCodeSet = new Set<string>();

    let y = startYear;
    let m = startMonth;
    let safetyCounter = 0;
    while ((y < currentYear || (y === currentYear && m <= currentMonthNum)) && safetyCounter < 60) {
      monthCodeSet.add(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
      safetyCounter++;
    }

    // Also include any months where a lock exists or saved payslips exist
    payrollLocks.forEach(lock => {
      monthCodeSet.add(`${lock.year}-${String(lock.month).padStart(2, '0')}`);
    });

    payslips.filter(p => p.employee_id === employee.id).forEach(p => {
      if (p.month && /^\d{4}-\d{2}$/.test(p.month)) {
        monthCodeSet.add(p.month);
      }
    });

    // Sort descending (latest month first)
    const sortedCodes = Array.from(monthCodeSet).sort((a, b) => b.localeCompare(a));

    return sortedCodes.map(code => {
      const [yPart, mPart] = code.split('-');
      const year = parseInt(yPart, 10);
      const monthNum = parseInt(mPart, 10);
      const monthLabel = `${MONTH_NAMES[monthNum - 1]} ${year}`;
      const isPastMonth = year < currentYear || (year === currentYear && monthNum < currentMonthNum);
      const isCurrentMonth = year === currentYear && monthNum === currentMonthNum;
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const isCurrentMonthEnded = isCurrentMonth && currentDay >= daysInMonth;
      const isLocked = payrollLocks.some(l => l.year === year && l.month === monthNum);

      // Check if a saved payslip exists in Supabase
      const saved = payslips.find(
        p => p.employee_id === employee.id && (p.month === code || p.slip_id === `PSL-${code}-${employee.id}`)
      );

      // Compute salary breakdown using standard engine
      const breakdown = calculateMonthlySalaryBreakdown(
        employee,
        code,
        attendanceRecords,
        leaves,
        incentives,
        commissions,
        advancePayments,
        overtimeRate,
        holidays
      );

      // Available automatically right at month ending, or if saved, or if locked
      const isAvailable = Boolean(saved || isLocked || isPastMonth || isCurrentMonthEnded);

      const gross = saved ? (Number(saved.gross_salary) + Number(saved.incentives || 0)) : breakdown.gross;
      const deductions = saved ? Number(saved.total_deductions) : breakdown.totalDeductions;
      const net = saved ? Number(saved.net_pay) : breakdown.netPay;

      const progress = isCurrentMonth ? calculateMonthlySalaryProgress(
        employee,
        now,
        attendanceRecords,
        holidays,
        overtimeRate
      ) : null;

      const effectiveBreakdown = saved ? {
        basic: Number(saved.basic_salary),
        gross: Number(saved.gross_salary),
        incentives: Number(saved.incentives || 0),
        overtimeAmount: Number(saved.overtime_amount || 0),
        overtimeHours: Number(saved.overtime_hours || 0),
        lopDeduction: Number(saved.lop_deduction),
        advanceDeduction: Number(saved.advance_deduction),
        totalDeductions: Number(saved.total_deductions),
        netPay: Number(saved.net_pay),
        overtimeRemarks: saved.overtime_remarks || ''
      } : breakdown;

      return {
        monthCode: code,
        monthLabel,
        year,
        monthNum,
        isPastMonth,
        isCurrentMonth,
        isAvailable,
        isLocked,
        hasSaved: Boolean(saved),
        gross,
        deductions,
        net,
        breakdown: effectiveBreakdown,
        progress,
        daysInMonth
      };
    });
  }, [
    employee,
    payrollLocks,
    payslips,
    attendanceRecords,
    leaves,
    incentives,
    commissions,
    advancePayments,
    overtimeRate,
    holidays
  ]);

  const handleDownload = (monthLabel: string, monthCode: string, breakdownData?: any) => {
    setDownloading(monthCode);
    setTimeout(() => {
      try {
        generatePayslip(employee, monthLabel, monthCode, breakdownData);
        toast('success', 'Payslip Downloaded', `Generated PDF payslip for ${monthLabel}.`);
      } catch (err) {
        console.error(err);
        toast('error', 'Download Failed', 'Failed to generate PDF. Try again.');
      }
      setDownloading(null);
    }, 600);
  };

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          My Payslips
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Monthly salary slips are automatically compiled and delivered right at month ending.
        </p>
      </div>


      {/* Payslips Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
        {payslipCards.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(15,23,42,0.06)' }}>
            No payslips available. Payslips are generated at the end of each working month starting from your joined month ({employee.joined}).
          </div>
        ) : (
          payslipCards.map((slip) => (
            <div
              key={slip.monthCode}
              className="glass-card"
              style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '16px',
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                background: '#FFFFFF',
                border: slip.isCurrentMonth && !slip.isAvailable ? '1px dashed rgba(79,142,247,0.4)' : '1px solid rgba(15,23,42,0.06)',
                position: 'relative'
              }}
            >
              {/* Header Block */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: slip.isAvailable ? '#EFF6FF' : 'rgba(245,158,11,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {slip.isAvailable ? (
                      <Banknote size={19} color="#2563EB" />
                    ) : (
                      <Clock size={19} color="#D97706" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {slip.monthLabel}
                    </div>
                    {slip.isAvailable ? (
                      <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2.5px', fontWeight: 600 }}>
                        <CheckCircle size={12} /> {slip.hasSaved ? 'Salary Published & Transferred' : 'Auto-Finalized at Month End'}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2.5px', fontWeight: 600 }}>
                        <Clock size={12} /> Current Working Month · In Progress
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Pill */}
                {slip.isAvailable ? (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(16,185,129,0.1)',
                    color: '#059669',
                    border: '1px solid rgba(16,185,129,0.2)'
                  }}>
                    Ready to Download
                  </span>
                ) : (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(245,158,11,0.1)',
                    color: '#D97706',
                    border: '1px solid rgba(245,158,11,0.2)'
                  }}>
                    Available {slip.daysInMonth} {slip.monthLabel.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Ongoing Month Progress Bar */}
              {!slip.isAvailable && slip.progress && (
                <div style={{ background: 'rgba(79,142,247,0.04)', border: '1px solid rgba(79,142,247,0.12)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    <span>Working Days: {slip.progress.elapsedWorkingDays}/{slip.progress.payableWorkingDays} elapsed</span>
                    <span style={{ color: 'var(--brand)' }}>Accumulated: ₹{slip.progress.earnedSalarySoFar.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'rgba(15,23,42,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${slip.progress.progressPercent}%`, background: 'linear-gradient(90deg, #4F8EF7, #10B981)', borderRadius: '3px' }} />
                  </div>
                </div>
              )}

              {/* Figures Block */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                borderTop: '1px solid rgba(15,23,42,0.05)',
                paddingTop: '16px',
              }}>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Gross</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {fmt(slip.gross)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Deductions</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#EF4444', marginTop: '4px' }}>
                    {fmt(slip.deductions)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Net Take-Home</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#854D0E', marginTop: '4px' }}>
                    {fmt(slip.net)}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {slip.isAvailable ? (
                <button
                  onClick={() => handleDownload(slip.monthLabel, slip.monthCode, slip.breakdown)}
                  disabled={downloading === slip.monthCode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    background: downloading === slip.monthCode ? '#E2E8F0' : '#854D0E',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: downloading === slip.monthCode ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    boxShadow: downloading === slip.monthCode ? 'none' : '0 4px 12px rgba(133,77,14,0.18)',
                  }}
                >
                  <Download size={14} />
                  {downloading === slip.monthCode ? 'Generating PDF...' : 'Download PDF'}
                </button>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#D97706',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  <Clock size={13} /> Official slip releases on {slip.daysInMonth} {slip.monthLabel.split(' ')[0]} at 23:59
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Support Info */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.12)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '11px', alignItems: 'center' }}>
        <AlertCircle size={14} color="#D97706" style={{ flexShrink: 0 }} />
        <span>For discrepancies or questions regarding your payslips, contact support@shrisaijewels.com or visit the HR desk.</span>
      </div>
    </div>
  );
}
