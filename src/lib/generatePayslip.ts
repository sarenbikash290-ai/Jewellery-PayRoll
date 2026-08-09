import { jsPDF } from 'jspdf';
import { Employee } from '../components/AppContext';
import { calculateMonthlySalaryBreakdown } from '@/utils/payrollCalc';

export function generatePayslip(employee: Employee, monthLabel: string, monthCode?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate month code if not provided
  let code = monthCode;
  if (!code) {
    const parts = monthLabel.trim().split(/\s+/);
    if (parts.length === 2) {
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const mIdx = months.indexOf(parts[0].toLowerCase());
      if (mIdx !== -1) {
        code = `${parts[1]}-${String(mIdx + 1).padStart(2, '0')}`;
      }
    }
    if (!code) code = '2026-03';
  }

  const breakdown = calculateMonthlySalaryBreakdown(
    employee,
    code,
    [],
    [],
    [],
    [],
    [],
    150,
    []
  );

  const basic = breakdown.basic;
  const incentives = breakdown.incentives;
  const overtimeAmount = breakdown.overtimeAmount;
  const gross = breakdown.gross;
  const lop = breakdown.lopDeduction;
  const advance = breakdown.advanceDeduction;
  const totalDeductions = breakdown.totalDeductions;
  const net = breakdown.netPay;

  const fmt = (n: number) => `INR ${n.toLocaleString('en-IN')}`;

  // Color Palette
  const primaryColor = [79, 142, 247]; // #4F8EF7
  const darkTextColor = [30, 41, 59]; // #1E293B
  const lightTextColor = [100, 116, 139]; // #64748B
  const lineStrokeColor = [226, 232, 240]; // #E2E8F0

  // Header Branded Background (Top bar)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 15, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SHRI SAI JEWELLERS', 15, 10);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(20);
  doc.text('PAYSLIP', 15, 30);

  doc.setFontSize(10);
  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Salary Slip for the month of: ${monthLabel}`, 15, 36);

  // Divider Line
  doc.setDrawColor(lineStrokeColor[0], lineStrokeColor[1], lineStrokeColor[2]);
  doc.line(15, 42, 195, 42);

  // Employee Details Block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('EMPLOYEE DETAILS', 15, 50);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);

  doc.text('Employee ID:', 15, 58);
  doc.text('Name:', 15, 64);
  doc.text('Department:', 15, 70);
  doc.text('Role:', 15, 76);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.text(employee.id, 45, 58);
  doc.text(employee.name, 45, 64);
  doc.text(employee.dept, 45, 70);
  doc.text(employee.role, 45, 76);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.text('Bank Account No:', 110, 58);
  doc.text('IFSC Code:', 110, 64);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('Helvetica', 'bold');

  const bankAcc = employee.bank_account_no ? `${employee.bank_account_no}${employee.bank_name ? ` (${employee.bank_name})` : ''}` : `XXXX XXXX ${employee.id ? employee.id.replace('EMP', '89') : '8901'}`;
  const ifsc = employee.ifsc_code ? employee.ifsc_code : 'UTIB0000129';

  doc.text(bankAcc, 142, 58);
  doc.text(ifsc, 142, 64);



  // Salary Table Headers
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('EARNINGS', 15, 98);
  doc.text('AMOUNT', 80, 98);

  doc.text('DEDUCTIONS', 110, 98);
  doc.text('AMOUNT', 175, 98);

  doc.line(15, 101, 195, 101);

  // Salary Table Content
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  doc.text('Basic Salary', 15, 108);
  doc.text(fmt(basic), 80, 108);
  doc.text('Loss of Pay (LOP)', 110, 108);
  doc.text(fmt(lop), 175, 108);

  doc.text('Monthly Incentive', 15, 115);
  doc.text(fmt(incentives), 80, 115);
  doc.text('Salary Advance', 110, 115);
  doc.text(fmt(advance), 175, 115);

  if (overtimeAmount > 0) {
    doc.text(`Overtime Payment (${breakdown.overtimeHours} hrs)`, 15, 122);
    doc.text(fmt(overtimeAmount), 80, 122);
  }

  doc.line(15, 128, 195, 128);

  // Totals Row
  doc.setFont('Helvetica', 'bold');
  doc.text('Gross Earnings', 15, 135);
  doc.text(fmt(gross), 80, 135);
  doc.text('Total Deductions', 110, 135);
  doc.text(fmt(totalDeductions), 175, 135);

  doc.line(15, 140, 195, 140);

  if (breakdown.overtimeRemarks) {
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(109, 40, 217);
    doc.text(`Remark: ${breakdown.overtimeRemarks}`, 15, 145);
  }

  // Net Pay Callout Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 148, 180, 25, 'F');
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(15, 148, 180, 25, 'S');

  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('NET TAKE-HOME SALARY', 20, 156);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(fmt(net), 20, 166);

  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text('Note: This is a system-generated payslip and does not require a signature.', 15, 190);

  // Footer Branding
  doc.setDrawColor(lineStrokeColor[0], lineStrokeColor[1], lineStrokeColor[2]);
  doc.line(15, 275, 195, 275);
  doc.setFontSize(8);
  doc.text('SHRI SAI JEWELLERS · Confidential Payslip', 15, 282);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 155, 282);

  doc.save(`payslip_${employee.id}_${monthLabel.replace(/\s+/g, '_')}.pdf`);
}
