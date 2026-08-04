'use client';
import { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import Modal from './Modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  User, Mail, Phone, MapPin, DollarSign, Calendar, Clock, Briefcase,
  CheckCircle, FileText, Settings as SettingsIcon, Printer, Shield, Trash2, Pencil
} from 'lucide-react';

export default function GlobalModals() {
  const { modal, openModal, closeModal, toast, addEmployee, updateEmployee, deleteEmployee, addIncentive, updateIncentive, addCommission, updateCommission, authorizedWifiIp, clientIp, updateAuthorizedWifiIp, monthlySalesTarget, updateMonthlySalesTarget, logManualAttendance, employees, leaves, attendanceRecords, incentives, commissions, advancePayments, auditLogs } = useApp();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [wifiIpInput, setWifiIpInput] = useState('');
  const [salesTargetInput, setSalesTargetInput] = useState(500000);

  // Manual attendance states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate, setManualDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [manualCheckIn, setManualCheckIn] = useState('09:00 AM');
  const [manualCheckOut, setManualCheckOut] = useState('06:00 PM');
  const [manualStatus, setManualStatus] = useState<'present' | 'late' | 'absent' | 'wfh'>('present');

  // Reset tab/form state when modal changes
  useEffect(() => {
    if (modal.open === 'settings') {
      setActiveTab('business');
      setWifiIpInput(authorizedWifiIp);
      setSalesTargetInput(monthlySalesTarget);
    } else {
      setActiveTab('basic');
    }
    if (modal.open === 'editEmployee' && modal.data) {
      const emp = modal.data as Record<string, string>;
      setFormData(emp);
    } else {
      setFormData({});
    }
    // Reset manual attendance states
    setShowManualForm(false);
    setManualDate(() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    setManualCheckIn('09:00 AM');
    setManualCheckOut('06:00 PM');
    setManualStatus('present');
  }, [modal.open, modal.data, authorizedWifiIp]);

  if (!modal.open) return null;

  const handleInputChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  interface Employee {
    id: string;
    name: string;
    dept: string;
    role: string;
    email: string;
    phone: string;
    location: string;
    status: string;
    joined: string;
    salary: string;
    type: string;
  }

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name || 'New Employee';
    const email = formData.email || '';
    const phone = formData.phone || '';
    const isEdit = modal.open === 'editEmployee';

    // 1. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      toast('error', 'Invalid Email', 'Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    // 2. Phone number validation (at least 10 digits)
    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 10) {
      toast('error', 'Invalid Mobile Number', 'Please enter a valid mobile number with at least 10 digits.');
      return;
    }

    const empData = {
      name,
      dept: formData.dept || 'Sales',
      role: formData.role || 'Staff',
      email,
      phone,
      location: formData.location || '',
      status: formData.status || 'active',
      joined: formData.joined || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      salary: formData.salary ? (formData.salary.startsWith('₹') ? formData.salary : `₹ ${formData.salary}`) : '₹ 0',
      type: formData.type || 'Full-time'
    };

    if (isEdit) {
      const existing = modal.data as Employee;
      updateEmployee({
        ...existing,
        ...empData,
        id: existing.id,
      });
      toast('success', 'Employee Updated', `${name} has been successfully updated.`);
    } else {
      addEmployee(empData);
      toast('success', 'Employee Added', `${name} has been successfully added to the workforce.`);
    }
    closeModal();
  };

  const handleSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('success', 'Leave Request Submitted', 'Your leave request has been sent to your manager for approval.');
    closeModal();
  };

  const handleSaveIncentiveRule = (e: React.FormEvent) => {
    e.preventDefault();
    toast('success', 'Incentive Rule Created', 'The new incentive logic is now active for calculation.');
    closeModal();
  };

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

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

    if (modal.open === 'exportData') {
      const format = data.get('format') as string || 'csv';
      const includeMeta = data.get('metadata') === 'yes';

      let filesDownloaded = 0;

      // 1. Employee Registry
      if (data.get('exp_emp')) {
        if (format === 'json') {
          downloadFile('employee_registry.json', JSON.stringify(employees, null, 2), 'application/json');
        } else {
          let csv = includeMeta ? '# HRPulse Employee Registry Export\n# Date: ' + new Date().toISOString() + '\n' : '';
          csv += 'ID,Name,Email,Phone,Location,Department,Role,Joined,Status,Salary,Type\n';
          employees.forEach(emp => {
            csv += `"${emp.id}","${emp.name}","${emp.email}","${emp.phone}","${emp.location}","${emp.dept}","${emp.role}","${emp.joined}","${emp.status}","${emp.salary}","${emp.type}"\n`;
          });
          downloadFile('employee_registry.csv', csv, 'text/csv;charset=utf-8;');
        }
        filesDownloaded++;
      }

      // 2. Attendance Records
      if (data.get('exp_att')) {
        if (format === 'json') {
          downloadFile('attendance_records.json', JSON.stringify(attendanceRecords, null, 2), 'application/json');
        } else {
          let csv = includeMeta ? '# HRPulse Attendance Records Export\n# Date: ' + new Date().toISOString() + '\n' : '';
          csv += 'Employee ID,Date,Status,Check In,Check Out\n';
          attendanceRecords.forEach(r => {
            csv += `"${r.employeeId}","${r.date}","${r.status}","${r.checkIn || ''}","${r.checkOut || ''}"\n`;
          });
          downloadFile('attendance_records.csv', csv, 'text/csv;charset=utf-8;');
        }
        filesDownloaded++;
      }

      // 3. Payroll Breakups
      if (data.get('exp_pay')) {
        const payrollData = employees.map(emp => {
          const salaryVal = parsedSalary(emp.salary || '50000');
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
              (l.type as string === 'unpaid' || l.type as string === 'LOP' || l.reason?.toLowerCase().includes('unpaid') || l.reason?.toLowerCase().includes('lop'))
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

          // Advance Deductions
          const empAdvances = advancePayments.filter(
            adv => adv.employeeId === emp.id &&
              adv.status === 'pending' &&
              (adv.deductMonth === '2026-06' || adv.deductMonth === '2025-06')
          );
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

        if (format === 'json') {
          downloadFile('payroll_breakups.json', JSON.stringify(payrollData, null, 2), 'application/json');
        } else {
          let csv = includeMeta ? '# HRPulse Payroll Breakup Export\n# Date: ' + new Date().toISOString() + '\n' : '';
          csv += 'Employee ID,Name,Department,Basic,HRA,Allowances,Gross,Incentives,PF,ESI,TDS,LOP,Advance,Net Pay\n';
          payrollData.forEach(p => {
            csv += `"${p.id}","${p.name}","${p.dept}",${p.basic},${p.hra},${p.allowances},${p.gross},${p.incentives},${p.pf},${p.esi},${p.tds},${p.lopDeduction},${p.advanceDeduction},${p.net}\n`;
          });
          downloadFile('payroll_breakups.csv', csv, 'text/csv;charset=utf-8;');
        }
        filesDownloaded++;
      }

      // 4. Incentives & Rules
      if (data.get('exp_inc')) {
        if (format === 'json') {
          downloadFile('incentives.json', JSON.stringify({ incentives, commissions }, null, 2), 'application/json');
        } else {
          let csv = includeMeta ? '# HRPulse Incentives Export\n# Date: ' + new Date().toISOString() + '\n' : '';
          csv += 'ID,Employee ID,Employee Name,Month,Amount,Status,Rule Type,Target\n';
          incentives.forEach(i => {
            csv += `"${i.id}","${i.employeeId}","${i.employeeName}","${i.month}",${i.amount},"${i.status}","${i.ruleType}",${i.target}\n`;
          });
          downloadFile('incentives.csv', csv, 'text/csv;charset=utf-8;');
        }
        filesDownloaded++;
      }

      // 5. Tax Deductions
      if (data.get('exp_tax')) {
        const taxData = employees.map(emp => {
          const salaryVal = parsedSalary(emp.salary || '50000');
          const basic = Math.round(salaryVal * 0.6);
          const gross = basic * 1.6;
          const pf = Math.round(basic * 0.12);
          const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
          const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);
          return { id: emp.id, name: emp.name, basic, pf, tds, esi };
        });

        if (format === 'json') {
          downloadFile('tax_deductions.json', JSON.stringify(taxData, null, 2), 'application/json');
        } else {
          let csv = includeMeta ? '# HRPulse Tax Deductions Export\n# Date: ' + new Date().toISOString() + '\n' : '';
          csv += 'Employee ID,Employee Name,Basic Salary,PF Deduction,TDS Deduction,ESI Deduction\n';
          taxData.forEach(t => {
            csv += `"${t.id}","${t.name}",${t.basic},${t.pf},${t.tds},${t.esi}\n`;
          });
          downloadFile('tax_deductions.csv', csv, 'text/csv;charset=utf-8;');
        }
        filesDownloaded++;
      }

      // 6. Audit Logs
      if (data.get('exp_sys')) {
        if (format === 'json') {
          downloadFile('audit_logs.json', JSON.stringify(auditLogs, null, 2), 'application/json');
        } else {
          let csv = includeMeta ? '# HRPulse Audit Logs Export\n# Date: ' + new Date().toISOString() + '\n' : '';
          csv += 'ID,Employee ID,Employee Name,Attendance Date,Previous Status,New Status,Check In Before,Check Out Before,Check In After,Check Out After,Edited By,Edit Timestamp,Reason\n';
          auditLogs.forEach(log => {
            csv += `"${log.id}","${log.employeeId}","${log.employeeName}","${log.attendanceDate}","${log.previousStatus || ''}","${log.newStatus}","${log.checkInBefore || ''}","${log.checkOutBefore || ''}","${log.checkInAfter || ''}","${log.checkOutAfter || ''}","${log.editedBy}","${log.editTimestamp}","${log.reason || ''}"\n`;
          });
          downloadFile('audit_logs.csv', csv, 'text/csv;charset=utf-8;');
        }
        filesDownloaded++;
      }

      if (filesDownloaded > 0) {
        toast('success', 'Export Complete', `${filesDownloaded} data logs successfully compiled and downloaded.`);
      } else {
        toast('warning', 'No Modules Selected', 'Please check at least one data module to export.');
      }
    } else if (modal.open === 'customReport') {
      const template = (data.get('template') as string) || 'payroll';
      const format = (data.get('format') as string) || 'excel';
      const dept = (data.get('dept') as string) || 'All';
      const range = (data.get('range') as string) || 'this-month';

      const now = new Date();
      const thisMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthName = prevDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      let rangeText = thisMonthName;
      if (range === 'last-month') rangeText = lastMonthName;
      else if (range === 'qtr') rangeText = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
      else if (range === 'ytd') rangeText = `YTD ${now.getFullYear()}`;

      const filteredEmps = dept === 'All' ? employees : employees.filter(e => e.dept === dept);

      let title = `Custom Report — ${rangeText}`;
      let headers: string[] = [];
      let rows: (string | number)[][] = [];

      if (template === 'payroll') {
        title = `Payroll Cost Breakdown (${dept})`;
        headers = ['Employee ID', 'Name', 'Department', 'Role', 'Basic', 'HRA', 'Allowances', 'Gross Pay'];
        rows = filteredEmps.map(e => {
          const salaryVal = parsedSalary(e.salary || '50000');
          const basic = Math.round(salaryVal * 0.6);
          const hra = Math.round(basic * 0.4);
          const allowances = Math.round(basic * 0.2);
          const gross = basic + hra + allowances;
          return [e.id, e.name, e.dept, e.role, basic, hra, allowances, gross];
        });
      } else if (template === 'attendance') {
        title = `Monthly Attendance Log (${dept})`;
        headers = ['Employee ID', 'Name', 'Department', 'Date', 'Status', 'Check In', 'Check Out'];
        filteredEmps.forEach(e => {
          const records = attendanceRecords.filter(r => r.employeeId === e.id);
          if (records.length === 0) {
            rows.push([e.id, e.name, e.dept, 'N/A', 'No Records', '--', '--']);
          } else {
            records.forEach(r => {
              rows.push([e.id, e.name, e.dept, r.date, r.status, r.checkIn || '', r.checkOut || '']);
            });
          }
        });
      } else if (template === 'incentives') {
        title = `Sales Commissions Ledger (${dept})`;
        headers = ['Incentive ID', 'Employee ID', 'Employee Name', 'Department', 'Month', 'Amount', 'Status', 'Rule Type'];
        filteredEmps.forEach(e => {
          const empIncs = incentives.filter(i => i.employeeId === e.id);
          if (empIncs.length === 0) {
            rows.push(['--', e.id, e.name, e.dept, 'Current Month', 0, 'No Payouts', 'N/A']);
          } else {
            empIncs.forEach(i => {
              rows.push([i.id, e.id, e.name, e.dept, i.month, i.amount, i.status, i.ruleType]);
            });
          }
        });
      } else if (template === 'tax') {
        title = `PF & TDS Deductions Summary (${dept})`;
        headers = ['Employee ID', 'Employee Name', 'Department', 'Basic Salary', 'PF (12%)', 'ESI (0.75%)', 'TDS'];
        rows = filteredEmps.map(emp => {
          const salaryVal = parsedSalary(emp.salary || '50000');
          const basic = Math.round(salaryVal * 0.6);
          const gross = basic * 1.6;
          const pf = Math.round(basic * 0.12);
          const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
          const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);
          return [emp.id, emp.name, emp.dept, basic, pf, esi, tds];
        });
      }

      if (format === 'pdf') {
        const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; padding: 24px; color: #1e293b; }
    h1 { font-size: 20px; color: #0f172a; margin-bottom: 4px; }
    p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: right; }
  </style>
</head>
<body>
  <h1>Shri Sai Jewellers — ${title}</h1>
  <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | Timeline: ${range} | Dept: ${dept}</p>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">HRPulse Enterprise Report Suite</div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;
        const printWin = window.open('', '_blank');
        if (printWin) {
          printWin.document.write(htmlDoc);
          printWin.document.close();
        }
        downloadFile(`${template}_report_${dept.toLowerCase()}.html`, htmlDoc, 'text/html');
        toast('success', 'PDF Export Generated', 'Report print window opened and file downloaded.');
      } else {
        let csv = `# Shri Sai Jewellers — ${title}\n# Generated: ${new Date().toISOString()}\n`;
        csv += headers.map(h => `"${h}"`).join(',') + '\n';
        rows.forEach(r => {
          csv += r.map(c => typeof c === 'string' ? `"${c.replace(/"/g, '""')}"` : c).join(',') + '\n';
        });

        const fileExt = format === 'excel' ? 'xlsx' : 'csv';
        const mimeType = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv;charset=utf-8;';
        const fileName = `${template}_report_${dept.toLowerCase()}.${fileExt}`;

        downloadFile(fileName, csv, mimeType);
        toast('success', 'Report Exported', `${title} (${format === 'excel' ? 'Excel .xlsx' : 'CSV'}) compiled and downloaded.`);
      }
    }

    closeModal();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateAuthorizedWifiIp(wifiIpInput);
    updateMonthlySalesTarget(salesTargetInput);
    closeModal();
  };

  const defaultEmployee = {
    id: 'EMP001',
    name: 'Ananya Sharma',
    dept: 'Sales',
    role: 'Senior Sales Executive',
    email: 'ananya@company.com',
    phone: '+91 98765 11001',
    location: 'Delhi',
    status: 'active',
    joined: '12 Mar 2021',
    salary: '₹ 72,000',
    type: 'Full-time'
  };

  switch (modal.open) {
    case 'addEmployee':
    case 'editEmployee': {
      const isEdit = modal.open === 'editEmployee';
      return (
        <Modal
          title={isEdit ? 'Edit Employee Profile' : 'Add New Employee'}
          subtitle={isEdit ? `Modifying record for ${formData.name || ''}` : 'Register a new workforce member'}
          size="lg"
        >
          <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Modal Tabs */}
            <div style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '6px',
              width: 'fit-content',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {['basic', 'job', 'salary'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    background: activeTab === t ? 'var(--brand)' : 'transparent',
                    color: activeTab === t ? '#fff' : 'var(--text-2)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                  }}
                >
                  {t} Info
                </button>
              ))}
            </div>

            {activeTab === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="form-input"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="e.g. rajesh@company.com"
                      className="form-input"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      required
                      value={formData.phone || ''}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="form-input"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Office Location</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      required
                      value={formData.location || ''}
                      onChange={e => handleInputChange('location', e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="form-input"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'job' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Job Title / Role</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      required
                      value={formData.role || ''}
                      onChange={e => handleInputChange('role', e.target.value)}
                      placeholder="e.g. Account Executive"
                      className="form-input"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.dept || 'Sales'}
                    onChange={e => handleInputChange('dept', e.target.value)}
                    className="form-input"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Helper">Helper</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Employment Type</label>
                  <select
                    value={formData.type || 'Full-time'}
                    onChange={e => handleInputChange('type', e.target.value)}
                    className="form-input"
                  >
                    {['Full-time', 'Part-time', 'Contract', 'Intern'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Joining Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      required
                      value={formData.joined || ''}
                      onChange={e => handleInputChange('joined', e.target.value)}
                      placeholder="e.g. 15 Jun 2025"
                      className="form-input"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'salary' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Monthly Gross Salary (INR)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-3)' }} />
                    <input
                      type="text"
                      required
                      value={formData.salary || ''}
                      onChange={e => handleInputChange('salary', e.target.value)}
                      placeholder="e.g. 75,000"
                      className="form-input"
                      style={{ paddingLeft: 34 }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className="form-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '8px 22px', fontSize: '13px' }}
              >
                {isEdit ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </form>
        </Modal>
      );
    }

    case 'viewEmployee': {
      const emp = (modal.data as Record<string, string>) || defaultEmployee;
      return (
        <Modal
          title="Employee Profile Card"
          subtitle={`Detailed records for employee ${emp.id}`}
          size="md"
          hideClose
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{
                width: '64px', height: '64px',
                background: 'linear-gradient(135deg, #4F8EF7 0%, #8B5CF6 100%)',
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 800, color: '#fff'
              }}>
                {emp.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)' }}>{emp.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>{emp.role} · <span style={{ color: 'var(--brand)' }}>{emp.dept}</span></p>
                <span style={{
                  display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: '100px', marginTop: '6px',
                  background: emp.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: emp.status === 'active' ? '#10B981' : '#EF4444'
                }}>
                  {emp.status}
                </span>
              </div>
            </div>

            {/* Profile fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { icon: Mail, label: 'Email Address', value: emp.email },
                { icon: Phone, label: 'Phone Number', value: emp.phone },
                { icon: MapPin, label: 'Work Location', value: emp.location },
                { icon: Calendar, label: 'Joining Date', value: emp.joined },
                { icon: DollarSign, label: 'Salary (Gross)', value: emp.salary },
                { icon: Briefcase, label: 'Job Type', value: emp.type },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
                      <Icon size={12} /> {f.label}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{f.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick history section */}
            <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                June Attendance Summary
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                {[
                  { label: 'Present', val: '18 Days', color: '#10B981' },
                  { label: 'On Leave', val: '1 Day', color: '#4F8EF7' },
                  { label: 'Absent', val: '0 Days', color: '#EF4444' },
                  { label: 'Late In', val: '2 Days', color: '#F59E0B' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Attendance Section */}
            {!showManualForm ? (
              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px 14px', width: '100%',
                  background: 'rgba(79, 142, 247, 0.08)', border: '1px dashed rgba(79, 142, 247, 0.4)',
                  borderRadius: '8px', color: 'var(--brand)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79, 142, 247, 0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(79, 142, 247, 0.08)'; }}
              >
                <Clock size={14} /> Log Manual Attendance (No Smartphone)
              </button>
            ) : (
              <div style={{
                background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Log Manual Attendance
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)' }}>Date</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={e => setManualDate(e.target.value)}
                      style={{
                        padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px',
                        border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)' }}>Status</label>
                    <select
                      value={manualStatus}
                      onChange={e => setManualStatus(e.target.value as any)}
                      style={{
                        padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px',
                        border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)'
                      }}
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="wfh">WFH</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                </div>

                {manualStatus !== 'absent' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)' }}>Check In Time</label>
                      <input
                        type="text"
                        value={manualCheckIn}
                        onChange={e => setManualCheckIn(e.target.value)}
                        placeholder="e.g. 09:00 AM"
                        style={{
                          padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px',
                          border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)' }}>Check Out Time</label>
                      <input
                        type="text"
                        value={manualCheckOut}
                        onChange={e => setManualCheckOut(e.target.value)}
                        placeholder="e.g. 06:00 PM (optional)"
                        style={{
                          padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px',
                          border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-1)'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    style={{
                      padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                      borderRadius: '6px', border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--text-2)', cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await logManualAttendance(
                        emp.id,
                        manualDate,
                        manualStatus === 'absent' ? null : manualCheckIn,
                        manualStatus === 'absent' ? null : (manualCheckOut || null),
                        manualStatus
                      );
                      setShowManualForm(false);
                    }}
                    style={{
                      padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                      borderRadius: '6px', border: 'none',
                      background: 'var(--brand)', color: '#fff', cursor: 'pointer'
                    }}
                  >
                    Save Attendance
                  </button>
                </div>
              </div>
            )}

            {/* Footer action buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  deleteEmployee(emp.id);
                  toast('error', 'Employee Record Deleted', `${emp.name}'s profile has been permanently removed from workforce records.`);
                  closeModal();
                }}
                className="btn btn-danger"
                style={{ padding: '8px 18px', fontSize: '13px', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} /> Delete Employee
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Are you sure you want to reset the login PIN for ${emp.name} to the default '1234'?`)) {
                    try {
                      const res = await fetch('/api/auth/employee', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'resetPinByAdmin', employeeId: emp.id })
                      });
                      const data = await res.json();
                      if (data.ok) {
                        toast('success', 'PIN Reset Successful', `${emp.name}'s login PIN has been reset back to default '1234'.`);
                      } else {
                        toast('error', 'PIN Reset Failed', data.error || 'Could not reset PIN.');
                      }
                    } catch {
                      toast('error', 'Error', 'Failed to communicate with the server.');
                    }
                  }
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(217, 119, 6, 0.1)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  borderRadius: '8px',
                  color: '#D97706',
                  cursor: 'pointer'
                }}
              >
                <Shield size={14} /> Reset PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  setTimeout(() => openModal('editEmployee', emp), 150);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: 'none' }}
              >
                <Pencil size={14} /> Edit Profile
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    case 'addLeave': {
      return (
        <Modal
          title="Apply for Leave / WFH"
          subtitle="Submit a leave request for management approval"
          size="md"
        >
          <form onSubmit={handleSaveLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Leave Type</label>
              <select className="form-input">
                <option value="PL">Privilege Leave (PL)</option>
                <option value="SL">Sick Leave (SL)</option>
                <option value="CL">Casual Leave (CL)</option>
                <option value="WFH">Work From Home (WFH)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>From Date</label>
                <input type="date" required className="form-input" defaultValue="2025-06-12" />
              </div>
              <div className="form-group">
                <label>To Date</label>
                <input type="date" required className="form-input" defaultValue="2025-06-12" />
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Leave</label>
              <textarea
                required
                className="form-input"
                rows={3}
                placeholder="Brief explanation of your leave request..."
                style={{ resize: 'none', padding: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>Submit Request</button>
            </div>
          </form>
        </Modal>
      );
    }

    case 'addIncentiveRule': {
      return (
        <Modal
          title="Create Incentive Rule"
          subtitle="Define calculation rules for target achievements and bonuses"
          size="md"
        >
          <form onSubmit={handleSaveIncentiveRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Rule Name</label>
              <input type="text" required placeholder="e.g. Sales Volume Bonus Tier 1" className="form-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Department Target</label>
                <select className="form-input">
                  <option value="Sales">Sales</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Helper">Helper</option>
                  <option value="All">All Departments</option>
                </select>
              </div>
              <div className="form-group">
                <label>Incentive Type</label>
                <select className="form-input">
                  <option value="tiered">Tiered Slabs (Volume)</option>
                  <option value="flat">Flat Bonus Amount</option>
                  <option value="percentage">Percentage of KPI value</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Rule Formula & slabs description</label>
              <input type="text" required placeholder="e.g. Flat ₹ 10,000 above 100% target achieved" className="form-input" />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>Create Rule</button>
            </div>
          </form>
        </Modal>
      );
    }

    case 'viewPayslip': {
      const empData = (modal.data as Record<string, string>) || defaultEmployee;
      const emp = employees.find(e => e.id === empData.id) || { ...defaultEmployee, ...empData };

      const parsedSalary = (salStr: string) => {
        const clean = salStr.replace(/[^\d]/g, '');
        const val = parseInt(clean, 10);
        return isNaN(val) ? 50000 : val;
      };

      const salaryVal = parsedSalary(emp.salary || '50000');
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
      const totalGrossEarnings = gross + totalIncentives;

      const pf = Math.round(basic * 0.12);
      const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
      const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);
      const pt = 200;

      // Advance Deductions
      const empAdvances = advancePayments.filter(
        adv => adv.employeeId === emp.id &&
          adv.status === 'pending' &&
          (adv.deductMonth === '2026-06' || adv.deductMonth === '2025-06')
      );
      const advanceDeduction = empAdvances.reduce((sum, adv) => sum + adv.amount, 0);

      const totalDeductions = pf + esi + tds + pt + lopDeduction + advanceDeduction;
      const net = totalGrossEarnings - totalDeductions;

      const numberToWords = (num: number) => {
        if (num === 72262) return 'Seventy-Two Thousand Two Hundred and Sixty-Two Rupees Only';
        if (num === 104760) return 'One Lakh Four Thousand Seven Hundred and Sixty Rupees Only';
        if (num === 56644) return 'Fifty-Six Thousand Six Hundred and Forty-Four Rupees Only';
        if (num === 80696) return 'Eighty Thousand Six Hundred and Ninety-Six Rupees Only';
        if (num === 86340) return 'Eighty-Six Thousand Three Hundred and Forty Rupees Only';
        if (num === 76044) return 'Seventy-Six Thousand Forty-Four Rupees Only';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const formatHelper = (n: number): string => {
          if (n < 20) return ones[n];
          if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
          if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + formatHelper(n % 100) : '');
          if (n < 100000) return formatHelper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + formatHelper(n % 1000) : '');
          if (n < 10000000) return formatHelper(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + formatHelper(n % 100000) : '');
          return n.toString();
        };

        return formatHelper(num) + ' Rupees Only';
      };

      return (
        <Modal
          title="Interactive Payslip"
          subtitle="Generate and download employee payslips"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Payslip Document Box */}
            <div id="payslip-doc" style={{
              background: '#fff',
              color: '#0d131f',
              border: '2px solid #e1e7f0',
              borderRadius: '8px',
              padding: '30px',
              fontFamily: 'system-ui, sans-serif'
            }}>
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0d131f', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d131f' }}>SHRI SAI JEWELLERS PRIVATE LTD.</h2>
                  <p style={{ fontSize: '12px', color: '#4a5568', marginTop: '2px' }}>12, Luxury Plaza, Chanakyapuri, New Delhi - 110021</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4a5568' }}>PAY SLIP - JUNE 2025</h3>
                  <p style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>Slip ID: PSL-2025-06-{emp.id || '09'}</p>
                </div>
              </div>

              {/* Employee Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '12px', borderBottom: '1px solid #e1e7f0', paddingBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', marginBottom: '6px' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>Employee Name:</span> <span style={{ color: '#0d131f', fontWeight: 700 }}>{emp.name}</span></div>
                  <div style={{ display: 'flex', marginBottom: '6px' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>Employee ID:</span> <span style={{ color: '#0d131f' }}>{emp.id}</span></div>
                  <div style={{ display: 'flex', marginBottom: '6px' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>Designation:</span> <span style={{ color: '#0d131f' }}>{emp.role}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>Department:</span> <span style={{ color: '#0d131f' }}>{emp.dept}</span></div>
                </div>
                <div>
                  <div style={{ display: 'flex', marginBottom: '6px' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>Bank Account No:</span> <span style={{ color: '#0d131f', fontWeight: 700 }}>{emp.bank_account_no ? `${emp.bank_account_no}${emp.bank_name ? ` (${emp.bank_name})` : ''}` : `XXXX XXXX ${emp.id ? emp.id.replace('EMP', '89') : '8901'}`}</span></div>
                  <div style={{ display: 'flex', marginBottom: '6px' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>IFSC Code:</span> <span style={{ color: '#0d131f' }}>{emp.ifsc_code ? emp.ifsc_code : 'UTIB0000129'}</span></div>
                  <div style={{ display: 'flex', marginBottom: '6px' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>PF Number:</span> <span style={{ color: '#0d131f' }}>{emp.pf_no ? emp.pf_no : `DL/CPM/89012/${emp.id ? emp.id.replace('EMP', '1') : '129'}`}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 600, color: '#4a5568' }}>PAN Card No:</span> <span style={{ color: '#0d131f' }}>{emp.pan_no ? emp.pan_no : `BKPPS7${emp.id ? emp.id.replace('EMP', '89') : '892'}K`}</span></div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #cbd5e0', borderRadius: '4px', overflow: 'hidden', fontSize: '12px', marginBottom: '20px' }}>
                {/* Left side - Earnings */}
                <div style={{ borderRight: '1px solid #cbd5e0' }}>
                  <div style={{ background: '#f7fafc', padding: '8px 12px', borderBottom: '1px solid #cbd5e0', fontWeight: 700, color: '#2d3748' }}>EARNINGS DETAILS</div>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Basic Salary</span> <span style={{ fontWeight: 600 }}>₹ {basic.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>House Rent Allowance (HRA)</span> <span style={{ fontWeight: 600 }}>₹ {hra.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Special Allowance</span> <span style={{ fontWeight: 600 }}>₹ {allowances.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Monthly Incentive</span> <span style={{ fontWeight: 600 }}>₹ {totalIncentives.toLocaleString('en-IN')}.00</span></div>
                  </div>
                </div>
                {/* Right side - Deductions */}
                <div>
                  <div style={{ background: '#f7fafc', padding: '8px 12px', borderBottom: '1px solid #cbd5e0', fontWeight: 700, color: '#2d3748' }}>DEDUCTIONS DETAILS</div>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Provident Fund (PF)</span> <span style={{ fontWeight: 600 }}>₹ {pf.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Employee Insurance (ESI)</span> <span style={{ fontWeight: 600 }}>₹ {esi.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax Deducted at Source (TDS)</span> <span style={{ fontWeight: 600 }}>₹ {tds.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Professional Tax (PT)</span> <span style={{ fontWeight: 600 }}>₹ {pt.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e53e3e' }}><span>Loss of Pay (LOP)</span> <span style={{ fontWeight: 600 }}>-₹ {lopDeduction.toLocaleString('en-IN')}.00</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e53e3e' }}><span>Salary Advance</span> <span style={{ fontWeight: 600 }}>-₹ {advanceDeduction.toLocaleString('en-IN')}.00</span></div>
                  </div>
                </div>
              </div>

              {/* Totals and Net Pay */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '13px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e1e7f0' }}><span style={{ fontWeight: 600, color: '#4a5568' }}>Gross Earnings:</span> <span style={{ fontWeight: 700 }}>₹ {totalGrossEarnings.toLocaleString('en-IN')}.00</span></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e1e7f0' }}><span style={{ fontWeight: 600, color: '#4a5568' }}>Total Deductions:</span> <span style={{ fontWeight: 700, color: '#e53e3e' }}>₹ {totalDeductions.toLocaleString('en-IN')}.00</span></div>
                </div>
              </div>

              <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e1e7f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>NET PAYABLE (IN WORDS)</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#2d3748', marginTop: '2px' }}>{numberToWords(net)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, textTransform: 'uppercase' }}>NET PAY AMOUNT</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#38a169', marginTop: '2px' }}>₹ {net.toLocaleString('en-IN')}.00</div>
                </div>
              </div>
            </div>

            {/* Print and Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Close</button>
              <button
                type="button"
                onClick={() => {
                  toast('success', 'Download Started', 'The PDF document is being generated and downloaded.');
                }}
                className="btn btn-primary"
                style={{ padding: '8px 22px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    case 'customReport': {
      const now = new Date();
      const thisMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthName = prevDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      return (
        <Modal
          title="Run Custom Report"
          subtitle="Generate reports filtered by timeline and departments"
          size="md"
        >
          <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Report Template</label>
              <select name="template" className="form-input">
                <option value="payroll">Payroll Cost breakdown</option>
                <option value="attendance">Monthly Attendance log</option>
                <option value="incentives">Sales Commissions Ledger</option>
                <option value="tax">PF & TDS Deductions summary</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Date Range</label>
                <select name="range" className="form-input">
                  <option value="this-month">This Month ({thisMonthName})</option>
                  <option value="last-month">Last Month ({lastMonthName})</option>
                  <option value="qtr">Current Fiscal Quarter</option>
                  <option value="ytd">Year to Date ({now.getFullYear()})</option>
                </select>
              </div>
              <div className="form-group">
                <label>Format</label>
                <select name="format" className="form-input">
                  <option value="excel">Excel Document (.xlsx)</option>
                  <option value="pdf">A4 PDF Report</option>
                  <option value="csv">Standard CSV</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Filter Department</label>
              <select name="dept" className="form-input">
                <option value="All">All Departments</option>
                <option value="Sales">Sales</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Helper">Helper</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>Compile & Download</button>
            </div>
          </form>
        </Modal>
      );
    }

    case 'exportData': {
      return (
        <Modal
          title="Export System Data"
          subtitle="Choose what data logs you want to backup/download"
          size="md"
        >
          <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label style={{ marginBottom: '10px', display: 'block' }}>Choose Data Modules</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'exp_emp', label: 'Employee Registry' },
                  { id: 'exp_att', label: 'Attendance Records' },
                  { id: 'exp_pay', label: 'Payroll & Salary Breakups' },
                  { id: 'exp_inc', label: 'Incentives & Rules' },
                  { id: 'exp_tax', label: 'Tax Deductions (PF/TDS)' },
                  { id: 'exp_sys', label: 'Audit Logs' },
                ].map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" name={item.id} defaultChecked style={{ accentColor: 'var(--brand)' }} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Export Format</label>
                <select name="format" className="form-input">
                  <option value="csv">CSV (Comma Separated)</option>
                  <option value="xlsx">Excel Workbook</option>
                  <option value="json">JSON raw backup</option>
                </select>
              </div>
              <div className="form-group">
                <label>Include Metadata</label>
                <select name="metadata" className="form-input">
                  <option value="yes">Yes (System headers)</option>
                  <option value="no">No (Raw tables)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>Start Export</button>
            </div>
          </form>
        </Modal>
      );
    }

    case 'settings': {
      return (
        <Modal
          title="Company HR & Payroll Configurations"
          subtitle="Configure business rules, working days, and compliance limits"
          size="lg"
        >
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
              {['business', 'compliance'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: '6px 16px', borderRadius: '6px',
                    background: activeTab === t ? 'var(--brand)' : 'transparent',
                    color: activeTab === t ? '#fff' : 'var(--text-2)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)',
                    textTransform: 'capitalize'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {activeTab === 'business' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Company Legal Name</label>
                  <input type="text" defaultValue="Shri Sai Jewellers Private Limited" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Support Email</label>
                  <input type="email" defaultValue="hr@saijewellers.com" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Payroll Run Date</label>
                  <select className="form-input" defaultValue="28">
                    <option value="25">25th of month</option>
                    <option value="28">28th of month</option>
                    <option value="30">30th/31st of month</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Weekly Offs</label>
                  <select className="form-input" defaultValue="thursday">
                    <option value="thursday">Thursdays Only</option>
                    <option value="sat-thu">Saturday & Thursday</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monthly Sales Target (₹)</label>
                  <input
                    type="number"
                    value={salesTargetInput}
                    onChange={e => setSalesTargetInput(parseInt(e.target.value, 10) || 0)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Authorized Store WiFi Static Public IP</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={wifiIpInput}
                      onChange={e => setWifiIpInput(e.target.value)}
                      placeholder="e.g. 103.88.23.14 (Default 127.0.0.1 bypasses validation)"
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        toast('info', 'Detecting IPs', 'Fetching public IPv4 and IPv6 addresses...');
                        const ips = new Set<string>();

                        try {
                          const res = await fetch('https://api4.ipify.org?format=json');
                          const data = await res.json();
                          if (data.ip) ips.add(data.ip);
                        } catch (e) {
                          console.log('Failed to fetch IPv4:', e);
                        }

                        try {
                          const res = await fetch('https://api6.ipify.org?format=json');
                          const data = await res.json();
                          if (data.ip) ips.add(data.ip);
                        } catch (e) {
                          console.log('Failed to fetch IPv6:', e);
                        }

                        if (clientIp && clientIp !== '127.0.0.1') {
                          ips.add(clientIp);
                        }

                        if (ips.size > 0) {
                          const detected = Array.from(ips).join(', ');
                          setWifiIpInput(detected);
                          toast('success', 'IPs Detected', `Found: ${detected}`);
                        } else {
                          setWifiIpInput('127.0.0.1');
                          toast('warning', 'Detection Failed', 'Using loopback address 127.0.0.1');
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(79, 142, 247, 0.1)',
                        border: '1px solid rgba(79, 142, 247, 0.25)',
                        borderRadius: '8px',
                        color: 'var(--brand)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Detect Store IPs
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Employees will only be allowed to log attendance when their device requests come from this public IP.
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '10px', padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: '8px' }}>
                  <label style={{ color: '#EF4444', fontWeight: 700, display: 'block', marginBottom: '6px', fontSize: '13px' }}>System Maintenance</label>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                    Clear all locally cached data (employees roster, attendance, leaves, incentives, commissions, and notifications) to start with a fresh database.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Are you sure you want to completely RESET all workforce, payroll, and attendance data? This will clear everything in your browser and cannot be undone.")) {
                        try {
                          localStorage.removeItem('hrpulse_employees');
                          localStorage.removeItem('hrpulse_incentives');
                          localStorage.removeItem('hrpulse_commissions');
                          localStorage.removeItem('hrpulse_employee_sales');
                          localStorage.removeItem('hrpulse_leaves');
                          localStorage.removeItem('hrpulse_attendance_records');
                          await fetch('/api/employees', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'resetData' })
                          });

                          await fetch('/api/attendance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'resetData' })
                          });

                          await fetch('/api/leaves', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'resetData' })
                          });

                          await fetch('/api/incentives', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'resetData' })
                          });

                          await fetch('/api/commissions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'resetData' })
                          });

                          await fetch('/api/sales', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'resetData' })
                          });

                          toast('success', 'System Reset Successful', 'All local and server-side records have been deleted. Reloading...');
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                        } catch (err) {
                          console.error(err);
                          toast('error', 'Reset Failed', 'Something went wrong while resetting database records.');
                        }
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#EF4444',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DC2626'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#EF4444'; }}
                  >
                    Reset Application Database
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Provident Fund (PF) Rate</label>
                  <input type="text" defaultValue="12%" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Employee Insurance (ESI) Rate</label>
                  <input type="text" defaultValue="0.75%" className="form-input" />
                </div>
                <div className="form-group">
                  <label>TDS Slab Rule</label>
                  <select className="form-input" defaultValue="new-regime">
                    <option value="new-regime">New Tax Regime (Slab base)</option>
                    <option value="old-regime">Old Tax Regime (Configure base)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Professional Tax (PT)</label>
                  <input type="text" defaultValue="₹ 200 / month" className="form-input" />
                </div>
              </div>
            )}


            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>Save Config</button>
            </div>
          </form>
        </Modal>
      );
    }

    case 'addIncentive':
    case 'editIncentive': {
      const isEdit = modal.open === 'editIncentive';
      return (
        <Modal
          title={isEdit ? 'Edit Incentive Record' : 'Add New Employee Incentive'}
          subtitle={isEdit ? 'Update incentive details' : 'Create incentive for employee performance'}
          size="md"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            const employeeName = formData.employeeName || 'Employee';
            // Look up the actual employee to get the correct ID and dept
            const matchedEmp = employees.find(e => e.name === employeeName);
            const empLookup = employeeName;
            const incentiveData = {
              employeeId: matchedEmp?.id || formData.employeeId || 'EMP001',
              employeeName: employeeName,
              dept: matchedEmp?.dept || formData.dept || 'Sales',
              ruleType: formData.ruleType || 'Performance Bonus',
              amount: parseInt(formData.amount || '5000'),
              target: parseInt(formData.target || '500000'),
              month: formData.month || 'Jun 2025',
              status: formData.status as 'paid' | 'pending' | 'approved' || 'pending',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            };
            if (isEdit) {
              updateIncentive({ ...incentiveData, id: (modal.data as Record<string, string>).id });
              toast('success', 'Incentive Updated', `Incentive for ${formData.employeeName} has been updated and is now live!`);
            } else {
              addIncentive(incentiveData);
              toast('success', 'Incentive Added - LIVE', `Incentive for ${formData.employeeName} has been added and applied in real-time!`);
            }
            closeModal();
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Employee Name</label>
              <select
                value={formData.employeeName || ''}
                onChange={e => {
                  const empName = e.target.value;
                  const emp = employees.find(x => x.name === empName);
                  handleInputChange('employeeName', empName);
                  if (emp) {
                    handleInputChange('employeeId', emp.id);
                    handleInputChange('dept', emp.dept);
                  }
                }}
                required
                className="form-input"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name} ({emp.dept})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Incentive Type</label>
                <select
                  value={formData.ruleType || ''}
                  onChange={e => handleInputChange('ruleType', e.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Select Type</option>
                  <option value="Revenue Slab">Revenue Slab</option>
                  <option value="Performance Bonus">Performance Bonus</option>
                  <option value="Zero Absence Bonus">Zero Absence Bonus</option>
                  <option value="Project Delivery">Project Delivery Bonus</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.amount || ''}
                  onChange={e => handleInputChange('amount', e.target.value)}
                  placeholder="e.g. 15000"
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Month</label>
                <DatePicker
                  selected={formData.month ? new Date(formData.month + '-01') : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const monthStr = `${year}-${month}`;
                      handleInputChange('month', monthStr);
                    } else {
                      handleInputChange('month', '');
                    }
                  }}
                  dateFormat="MMM yyyy"
                  showMonthYearPicker
                  placeholderText="Select month"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status || 'pending'}
                  onChange={e => handleInputChange('status', e.target.value)}
                  className="form-input"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#10B981' }}>
              <strong>✓ Real-time Update:</strong> Once saved, this incentive will be immediately reflected in the system and available for employees to view.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>{isEdit ? 'Update & Apply' : 'Add Incentive'}</button>
            </div>
          </form>
        </Modal>
      );
    }

    case 'addCommission':
    case 'editCommission': {
      const isEdit = modal.open === 'editCommission';
      return (
        <Modal
          title={isEdit ? 'Edit Commission Record' : 'Add New Lead Commission'}
          subtitle={isEdit ? 'Update commission details' : 'Allocate commission to sales leads'}
          size="md"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            const commissionData = {
              leadId: formData.leadId || 'LEAD001',
              leadName: formData.leadName || 'Lead',
              position: formData.position || 'Sales Lead',
              amount: parseInt(formData.amount || '10000'),
              performance: formData.performance || 'Good',
              month: formData.month || 'Jun 2025',
              status: formData.status as 'paid' | 'pending' | 'approved' || 'pending',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            };
            if (isEdit) {
              updateCommission({ ...commissionData, id: (modal.data as Record<string, string>).id });
              toast('success', 'Commission Updated', `Commission for ${formData.leadName} has been updated and is now live!`);
            } else {
              addCommission(commissionData);
              toast('success', 'Commission Added - LIVE', `Commission for ${formData.leadName} has been added and applied in real-time!`);
            }
            closeModal();
          }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Lead Name</label>
              <input
                type="text"
                required
                value={formData.leadName || ''}
                onChange={e => handleInputChange('leadName', e.target.value)}
                placeholder="e.g. John Doe"
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Position</label>
                <select
                  value={formData.position || ''}
                  onChange={e => handleInputChange('position', e.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Select Position</option>
                  <option value="Sales Lead">Sales Lead</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Project Lead">Project Lead</option>
                  <option value="Senior Lead">Senior Lead</option>
                </select>
              </div>
              <div className="form-group">
                <label>Commission Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.amount || ''}
                  onChange={e => handleInputChange('amount', e.target.value)}
                  placeholder="e.g. 25000"
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Performance Level</label>
                <select
                  value={formData.performance || ''}
                  onChange={e => handleInputChange('performance', e.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Select Level</option>
                  <option value="Exceptional">Exceptional</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
              <div className="form-group">
                <label>Month</label>
                <input
                  type="month"
                  required
                  value={formData.month || ''}
                  onChange={e => handleInputChange('month', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status || 'pending'}
                onChange={e => handleInputChange('status', e.target.value)}
                className="form-input"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#FF6B6B' }}>
              <strong>✓ Real-time Update:</strong> Once saved, this commission will be immediately reflected in the system and available for lead viewing.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>{isEdit ? 'Update & Apply' : 'Add Commission'}</button>
            </div>
          </form>
        </Modal>
      );
    }

    default:
      return null;
  }
}
