'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { FileText, Download, CheckCircle, AlertCircle, Banknote } from 'lucide-react';
import { generatePayslip } from '../../lib/generatePayslip';

interface EmpPayslipsProps {
  employee: Employee;
}

export default function EmpPayslips({ employee }: EmpPayslipsProps) {
  const { toast, payrollLocks, payslips } = useApp();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const parsedSalary = (salStr: string) => {
    const clean = salStr.replace(/[^\d]/g, '');
    const val = parseInt(clean, 10);
    return isNaN(val) ? 50000 : val;
  };

  const salaryComponents = useMemo(() => {
    const salaryVal = parsedSalary(employee.salary);
    return { gross: salaryVal, deductions: 0, net: salaryVal };
  }, [employee]);

  const parseJoinedDate = (joinedStr: string) => {
    if (!joinedStr) return new Date(2000, 0, 1);
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

  const parsePayslipMonth = (monthStr: string) => {
    const parts = monthStr.trim().split(/\s+/);
    if (parts.length === 2) {
      const monthsLong = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mStr = parts[0].toLowerCase();
      let monthIdx = monthsLong.indexOf(mStr);
      if (monthIdx === -1) {
        monthIdx = monthsShort.indexOf(mStr);
      }
      if (monthIdx === -1 && mStr.length >= 3) {
        monthIdx = monthsShort.indexOf(mStr.substring(0, 3));
      }
      const year = parseInt(parts[1], 10);
      if (monthIdx > -1 && !isNaN(year)) {
        return new Date(year, monthIdx, 1);
      }
    }
    return new Date(2000, 0, 1);
  };

  const filteredPayslips = useMemo(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Convert locks to payslip format
    const map = new Map<string, any>();
    payrollLocks.forEach(lock => {
      const label = `${months[lock.month - 1]} ${lock.year}`;
      map.set(label, { month: label, monthCode: `${lock.year}-${String(lock.month).padStart(2, '0')}` });
    });

    // Add saved payslips from Supabase for this employee
    payslips.filter(p => p.employee_id === employee.id).forEach(p => {
      const label = p.month_label || p.month;
      map.set(label, {
        month: label,
        monthCode: p.month,
        gross: Number(p.gross_salary) + Number(p.incentives || 0),
        deductions: Number(p.total_deductions),
        net: Number(p.net_pay)
      });
    });

    const list = Array.from(map.values());

    // Filter by join date eligibility
    const eligible = list.filter(slip => {
      const payslipDate = parsePayslipMonth(slip.month);
      const joinedDate = parseJoinedDate(employee.joined);
      return (
        payslipDate.getFullYear() > joinedDate.getFullYear() ||
        (payslipDate.getFullYear() === joinedDate.getFullYear() &&
          payslipDate.getMonth() >= joinedDate.getMonth())
      );
    });

    // Sort by date descending
    return eligible.sort((a, b) => {
      return parsePayslipMonth(b.month).getTime() - parsePayslipMonth(a.month).getTime();
    });
  }, [payrollLocks, payslips, employee.id, employee.joined]);

  const handleDownload = (month: string) => {
    setDownloading(month);
    setTimeout(() => {
      try {
        generatePayslip(employee, month);
        toast('success', 'Payslip Downloaded', `Generated PDF payslip for ${month}.`);
      } catch (err) {
        console.error(err);
        toast('error', 'Download Failed', 'Failed to generate PDF. Try again.');
      }
      setDownloading(null);
    }, 800);
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
          Download printable monthly salary slips with full breakdown.
        </p>
      </div>

      {/* Payslips Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
        {filteredPayslips.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(15,23,42,0.06)' }}>
            No payslips available. Payslips are generated at the end of each working month starting from your joined month ({employee.joined}).
          </div>
        ) : (
          filteredPayslips.map((slip, i) => (
            <div key={i} className="glass-card" style={{
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '16px',
              padding: '20px',
              borderRadius: '16px',
              display: 'flex',
              background: '#FFFFFF'
            }}
            >
              {/* Header Block */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Banknote size={18} color="#2563EB" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{slip.month}</div>
                  <div style={{ fontSize: '10.5px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2.5px', fontWeight: 600 }}>
                    <CheckCircle size={11} /> Salary Transferred
                  </div>
                </div>
              </div>

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
                    {fmt(slip.gross ?? salaryComponents.gross)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Deductions</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#EF4444', marginTop: '4px' }}>
                    {fmt(slip.deductions ?? salaryComponents.deductions)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Net Take-Home</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#854D0E', marginTop: '4px' }}>
                    {fmt(slip.net ?? salaryComponents.net)}
                  </div>
                </div>
              </div>

              {/* Download Action */}
              <button
                onClick={() => handleDownload(slip.month)}
                disabled={downloading === slip.month}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  background: downloading === slip.month ? '#E2E8F0' : '#854D0E',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: downloading === slip.month ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  boxShadow: downloading === slip.month ? 'none' : '0 4px 12px rgba(133,77,14,0.18)',
                }}
              >
                <Download size={14} />
                {downloading === slip.month ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          )))}
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.12)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '11px', alignItems: 'center' }}>
        <AlertCircle size={14} color="#D97706" style={{ flexShrink: 0 }} />
        <span>For help with payslips, contact support@shrisaijewels.com.</span>
      </div>
    </div>
  );
}
