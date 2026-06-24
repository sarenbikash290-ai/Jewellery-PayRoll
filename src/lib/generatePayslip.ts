import { jsPDF } from 'jspdf';
import { Employee } from '../components/AppContext';

export function generatePayslip(employee: Employee, month: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const parsedSalary = (salStr: string) => {
    const clean = salStr.replace(/[^\d]/g, '');
    const val = parseInt(clean, 10);
    return isNaN(val) ? 50000 : val;
  };

  const salaryVal = parsedSalary(employee.salary);
  const basic = Math.round(salaryVal * 0.6);
  const hra = Math.round(basic * 0.4);
  const allowances = Math.round(basic * 0.2);
  const gross = basic + hra + allowances;
  const pf = Math.round(basic * 0.12);
  const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
  const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);
  const net = gross - pf - esi - tds;

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
  doc.text('SAI JEWELLERS', 15, 10);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(20);
  doc.text('PAYSLIP', 15, 30);

  doc.setFontSize(10);
  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Salary Slip for the month of: ${month}`, 15, 36);

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
  doc.text('PF Number:', 110, 70);
  doc.text('PAN Card No:', 110, 76);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('Helvetica', 'bold');

  const bankAcc = employee.bank_account_no ? `${employee.bank_account_no}${employee.bank_name ? ` (${employee.bank_name})` : ''}` : `XXXX XXXX ${employee.id ? employee.id.replace('EMP', '89') : '8901'}`;
  const ifsc = employee.ifsc_code ? employee.ifsc_code : 'UTIB0000129';
  const pfNoStr = employee.pf_no ? employee.pf_no : `DL/CPM/89012/${employee.id ? employee.id.replace('EMP', '1') : '129'}`;
  const pan = employee.pan_no ? employee.pan_no : `BKPPS7${employee.id ? employee.id.replace('EMP', '89') : '892'}K`;

  doc.text(bankAcc, 142, 58);
  doc.text(ifsc, 142, 64);
  doc.text(pfNoStr, 142, 70);
  doc.text(pan, 142, 76);

  // Divider Line
  doc.line(15, 84, 195, 84);

  // Salary Table Headers
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('EARNINGS', 15, 92);
  doc.text('AMOUNT', 80, 92);

  doc.text('DEDUCTIONS', 110, 92);
  doc.text('AMOUNT', 175, 92);

  doc.line(15, 95, 195, 95);

  // Salary Table Content
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  // Row 1
  doc.text('Basic Salary', 15, 103);
  doc.text(fmt(basic), 80, 103);
  doc.text('Provident Fund (PF)', 110, 103);
  doc.text(fmt(pf), 175, 103);

  // Row 2
  doc.text('HRA (House Rent Allow.)', 15, 110);
  doc.text(fmt(hra), 80, 110);
  doc.text('Employees State Ins. (ESI)', 110, 110);
  doc.text(fmt(esi), 175, 110);

  // Row 3
  doc.text('Special Allowance', 15, 117);
  doc.text(fmt(allowances), 80, 117);
  doc.text('Tax Deducted at Source (TDS)', 110, 117);
  doc.text(fmt(tds), 175, 117);

  doc.line(15, 123, 195, 123);

  // Totals Row
  doc.setFont('Helvetica', 'bold');
  doc.text('Gross Earnings', 15, 130);
  doc.text(fmt(gross), 80, 130);
  doc.text('Total Deductions', 110, 130);
  doc.text(fmt(pf + esi + tds), 175, 130);

  doc.line(15, 135, 195, 135);

  // Net Pay Callout Box
  doc.setFillColor(248, 250, 252); // Very light grey bg
  doc.rect(15, 142, 180, 25, 'F');
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(15, 142, 180, 25, 'S');

  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('NET TAKE-HOME SALARY', 20, 150);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(fmt(net), 20, 160);

  // Net Salary in Words
  // Simple custom text helper or static
  doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text('Note: This is a system-generated payslip and does not require a signature.', 15, 185);

  // Footer Branding
  doc.setDrawColor(lineStrokeColor[0], lineStrokeColor[1], lineStrokeColor[2]);
  doc.line(15, 275, 195, 275);
  doc.setFontSize(8);
  doc.text('SAI JEWELLERS · Confidential Payslip', 15, 282);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 155, 282);

  doc.save(`payslip_${employee.id}_${month.replace(' ', '_')}.pdf`);
}
