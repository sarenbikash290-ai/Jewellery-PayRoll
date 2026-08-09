'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import { IndianRupee, Download, Play, CheckCircle, Clock, Users, FileText, AlertCircle } from 'lucide-react';
import { calculateMonthlySalaryBreakdown, calculateMonthlySalaryProgress } from '@/utils/payrollCalc';

const avatarColors = ['#4F8EF7', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444'];

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>
);

export default function Payroll() {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const { employees, openModal, toast, leaves, attendanceRecords, incentives, commissions, advancePayments, lockPayrollMonth, savePayslips, overtimeRate, holidays } = useApp();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthCode = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const payrollEmployees = employees.map(emp => {
    const breakdown = calculateMonthlySalaryBreakdown(
      emp,
      currentMonthCode,
      attendanceRecords,
      leaves,
      incentives,
      commissions,
      advancePayments,
      overtimeRate,
      holidays
    );

    const progress = calculateMonthlySalaryProgress(
      emp,
      now,
      attendanceRecords,
      holidays,
      overtimeRate
    );

    return {
      id: emp.id,
      name: emp.name,
      dept: emp.dept,
      role: emp.role,
      basic: breakdown.basic,
      gross: breakdown.gross,
      incentives: breakdown.incentives,
      lopDeduction: breakdown.lopDeduction,
      advanceDeduction: breakdown.advanceDeduction,
      net: breakdown.netPay,
      overtimeHours: breakdown.overtimeHours,
      overtimeAmount: breakdown.overtimeAmount,
      overtimeRemarks: breakdown.overtimeRemarks,
      payableWorkingDays: breakdown.payableWorkingDays,
      dailyRate: Math.round(breakdown.dailyRate),
      paidFullDays: breakdown.paidFullDays,
      paidHalfDays: breakdown.paidHalfDays,
      absentDays: breakdown.absentDays,
      thursdaysOff: breakdown.thursdaysOff,
      holidaysOff: breakdown.holidaysOff,
      progress
    };
  });

  const totalGross = payrollEmployees.reduce((s, e) => s + e.gross, 0);
  const totalIncentives = payrollEmployees.reduce((s, e) => s + e.incentives, 0);
  const totalLOP = payrollEmployees.reduce((s, e) => s + e.lopDeduction, 0);
  const totalAdvance = payrollEmployees.reduce((s, e) => s + e.advanceDeduction, 0);
  const totalNet = payrollEmployees.reduce((s, e) => s + e.net, 0);

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN')}`;

  const runPayroll = async () => {
    setProcessing(true);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const monthCode = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const result = await lockPayrollMonth(currentYear, currentMonthNum, `${monthLabel} payroll run finalized`);

    if (result.ok) {
      const payslipRecords = payrollEmployees.map(pe => ({
        slip_id: `PSL-${monthCode}-${pe.id}`,
        employee_id: pe.id,
        employee_name: pe.name,
        department: pe.dept,
        role: pe.role || (pe.dept === 'Sales' ? 'Gold-01' : pe.dept === 'Housekeeping' ? 'Housekeeping Staff' : 'Helper Staff'),
        month: monthCode,
        month_label: monthLabel,
        basic_salary: pe.basic,
        gross_salary: pe.gross,
        incentives: pe.incentives,
        overtime_amount: pe.overtimeAmount,
        overtime_remarks: pe.overtimeRemarks,
        lop_deduction: pe.lopDeduction,
        advance_deduction: pe.advanceDeduction,
        total_deductions: pe.lopDeduction + pe.advanceDeduction,
        net_pay: pe.net,
        status: 'processed'
      }));

      await savePayslips(payslipRecords);
      setProcessing(false);
      setProcessed(true);
      setStep(3);
    } else {
      setProcessing(false);
      toast('error', 'Payroll Run Failed', result.error || 'Could not finalize payroll month.');
    }
  };

  const downloadPayrollCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Department',
      'Basic Salary (INR)',
      'Gross Earnings (INR)',
      'Incentives & Commissions (INR)',
      'Overtime Payment (INR)',
      'LOP Deduction (INR)',
      'Salary Advance Deduction (INR)',
      'Net Payable (INR)',
      'Bank Name',
      'Bank Account Number',
      'IFSC Code'
    ];

    const rows = payrollEmployees.map(pe => {
      const empDetails = employees.find(e => e.id === pe.id);
      return [
        pe.id,
        pe.name,
        pe.dept,
        pe.basic,
        pe.gross,
        pe.incentives,
        pe.overtimeAmount,
        pe.lopDeduction,
        pe.advanceDeduction,
        pe.net,
        empDetails?.bank_name || 'N/A',
        empDetails?.bank_account_no ? `"${empDetails.bank_account_no}"` : 'N/A',
        empDetails?.ifsc_code || 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = String(val).replace(/"/g, '""');
        return strVal.includes(',') ? `"${strVal}"` : strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HRPulse_Payroll_Summary_${currentMonthLabel.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Payroll Processing
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage monthly salary calculation, attendance deductions & payslips for {currentMonthLabel}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={downloadPayrollCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)' }}
          >
            <Download size={14} /> Export Payroll CSV
          </button>
        </div>
      </div>

      {/* Process Wizard Header */}
      <Card>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Monthly Payroll Run — {currentMonthLabel}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>3-step process: Review → Approve → Process</div>
        </div>

        {/* Step Indicator */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '0' }}>
          {[1, 2, 3].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: step > s ? '#10B981' : step === s ? 'var(--brand)' : 'var(--bg-elevated)',
                  border: '2px solid', borderColor: step >= s ? (step > s ? '#10B981' : 'var(--brand)') : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: step >= s ? '#fff' : 'var(--text-muted)', fontSize: '13px', fontWeight: 700,
                  transition: 'var(--transition)',
                }}>
                  {step > s ? '✓' : s}
                </div>
                <span style={{ fontSize: '11px', color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === s ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {['Review Payslips', 'Approve Run', 'Processed'][s-1]}
                </span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: '2px', background: step > s ? '#10B981' : 'var(--border)', margin: '0 12px', marginBottom: '22px', transition: 'background 0.5s ease' }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {step === 1 && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Review the computed payslips for all {employees.length} employees. Scroll to review all.</p>
              <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--brand)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-brand)' }}>
                Approve & Proceed <Play size={14} />
              </button>
            </div>
          )}
          {step === 2 && (
            <div>
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertCircle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F59E0B' }}>Final Approval Required</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>You're about to process <strong style={{ color: 'var(--text-primary)' }}>₹ {totalNet.toLocaleString('en-IN')}</strong> in net payroll for {employees.length} employees. This action will lock the payroll records for this month.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ padding: '10px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button onClick={runPayroll} disabled={processing} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 28px', background: processing ? 'rgba(16,185,129,0.5)' : '#10B981', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', transition: 'var(--transition)' }}>
                  {processing ? <><Clock size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><CheckCircle size={14} /> Confirm & Run Payroll</>}
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(16,185,129,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} color="#10B981" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Payroll Processed! 🎉</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{currentMonthLabel} payroll of <strong style={{ color: '#10B981' }}>₹ {totalNet.toLocaleString('en-IN')}</strong> has been processed. Payslips are now available for employees to view and download.</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={downloadPayrollCSV}
                  style={{ padding: '10px 20px', background: 'var(--brand)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={14} /> Download Bank Transfer Sheet (CSV)
                </button>
                <button onClick={() => { setStep(1); setProcessed(false); }} style={{ padding: '10px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Reset</button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Payroll Table */}
      <Card>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Salary Breakup — {currentMonthLabel}</span>
          <button
            onClick={async () => {
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonthNum = now.getMonth() + 1;
              const monthCode = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

              const payslipRecords = payrollEmployees.map(pe => ({
                slip_id: `PSL-${monthCode}-${pe.id}`,
                employee_id: pe.id,
                employee_name: pe.name,
                department: pe.dept,
                role: pe.dept === 'Sales' ? 'Senior Sales Executive' : pe.dept === 'Housekeeping' ? 'Housekeeping Staff' : 'Helper Staff',
                month: monthCode,
                month_label: currentMonthLabel,
                basic_salary: pe.basic,
                gross_salary: pe.gross,
                incentives: pe.incentives,
                lop_deduction: pe.lopDeduction,
                advance_deduction: pe.advanceDeduction,
                total_deductions: pe.lopDeduction + pe.advanceDeduction,
                net_pay: pe.net,
                status: 'processed'
              }));

              await savePayslips(payslipRecords);
              await lockPayrollMonth(currentYear, currentMonthNum, `${currentMonthLabel} payslips generated & published`);
              toast('success', 'Payslips Published', `Compiled and published ${currentMonthLabel} payslips to all employee portals.`);
            }}
            style={{ fontSize: '12px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            <FileText size={13} /> Generate All Payslips
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Employee', 'Salary Progress', 'Basic Salary', 'Gross Earnings', 'Overtime', 'Incentives', 'LOP Deduction', 'Advance Deduction', 'Net Payable', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: h === '' ? 'center' : 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrollEmployees.map((emp, i) => (
                <tr key={emp.id}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', background: avatarColors[i % avatarColors.length], borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{emp.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.dept}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: '150px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                      <span>Day {emp.progress.elapsedWorkingDays}/{emp.progress.payableWorkingDays}</span>
                      <span style={{ color: 'var(--brand)' }}>₹{emp.progress.earnedSalarySoFar.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${emp.progress.progressPercent}%`, background: 'linear-gradient(90deg, #4F8EF7, #10B981)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{emp.basic.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{emp.gross.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#8B5CF6', whiteSpace: 'nowrap' }}>
                    {emp.overtimeAmount > 0 ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>+{emp.overtimeAmount.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.overtimeHours} hrs</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#10B981', whiteSpace: 'nowrap' }}>+{emp.incentives.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#EF4444', whiteSpace: 'nowrap' }}>-{emp.lopDeduction.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#EF4444', whiteSpace: 'nowrap' }}>-{emp.advanceDeduction.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>{emp.net.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => openModal('viewPayslip', {
                        id: emp.id,
                        name: emp.name,
                        dept: emp.dept,
                        role: emp.dept === 'Sales' ? 'Senior Sales Executive' : emp.dept === 'Housekeeping' ? 'Housekeeping Staff' : 'Helper Staff'
                      })}
                      style={{ fontSize: '11px', color: 'var(--brand)', background: 'rgba(79,142,247,0.1)', padding: '5px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: 'none' }}
                    >
                      Payslip ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(79,142,247,0.05)', borderTop: '2px solid var(--border)' }}>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>TOTAL</td>
                <td colSpan={1}></td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{payrollEmployees.reduce((s, e) => s + e.basic, 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--brand)', whiteSpace: 'nowrap' }}>{totalGross.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#8B5CF6', whiteSpace: 'nowrap' }}>{payrollEmployees.reduce((s, e) => s + e.overtimeAmount, 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>{totalIncentives.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>{totalLOP.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>{totalAdvance.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 800, color: '#10B981', whiteSpace: 'nowrap' }}>{totalNet.toLocaleString('en-IN')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
