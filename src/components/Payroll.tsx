'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import { DollarSign, Download, Play, CheckCircle, Clock, Users, FileText, AlertCircle } from 'lucide-react';

// payrollEmployees will be constructed dynamically inside the component using useApp()
const avatarColors = ['#4F8EF7', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444'];

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>
);

export default function Payroll() {
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const { employees, openModal, toast } = useApp();

  const parsedSalary = (salStr: string) => {
    const clean = salStr.replace(/[^\d]/g, '');
    const val = parseInt(clean, 10);
    return isNaN(val) ? 50000 : val;
  };

  const payrollEmployees = employees.map(emp => {
    const salaryVal = parsedSalary(emp.salary);
    const basic = Math.round(salaryVal * 0.6);
    const hra = Math.round(basic * 0.4);
    const allowances = Math.round(basic * 0.2);
    const gross = basic + hra + allowances;
    const pf = Math.round(basic * 0.12);
    const esi = gross < 75000 ? Math.round(gross * 0.0075) : 0;
    const tds = gross > 75000 ? Math.round(gross * 0.1) : Math.round(gross * 0.05);
    const net = gross - pf - esi - tds;

    return {
      id: emp.id,
      name: emp.name,
      dept: emp.dept,
      basic,
      hra,
      allowances,
      gross,
      pf,
      esi,
      tds,
      net
    };
  });

  const totalGross = payrollEmployees.reduce((s, e) => s + e.gross, 0);
  const totalNet   = payrollEmployees.reduce((s, e) => s + e.net, 0);
  const totalPF    = payrollEmployees.reduce((s, e) => s + e.pf, 0);
  const totalTDS   = payrollEmployees.reduce((s, e) => s + e.tds, 0);

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN')}`;

  const runPayroll = () => {
    setProcessing(true);
    setTimeout(() => { 
      setProcessing(false); 
      setProcessed(true); 
      setStep(3); 
      toast('success', 'Payroll Run Complete', 'June 2025 payroll run has been executed successfully.');
    }, 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Payroll Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>June 2025 · Processing cycle</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => openModal('exportData')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Gross Payroll',   value: fmt(totalGross), sub: `${employees.length} employees`, color: '#4F8EF7', icon: DollarSign },
          { label: 'Net Payable',     value: fmt(totalNet),   sub: 'After deductions', color: '#10B981', icon: CheckCircle },
          { label: 'PF Deduction',    value: fmt(totalPF),    sub: 'Employer + Employee', color: '#F59E0B', icon: Users },
          { label: 'TDS Deduction',   value: fmt(totalTDS),   sub: 'Income tax withheld', color: '#8B5CF6', icon: FileText },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', background: `${s.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={s.color} />
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
            </Card>
          );
        })}
      </div>

      {/* Run Payroll Wizard */}
      <Card>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Run Payroll — June 2025</div>
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
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>You're about to process <strong style={{ color: 'var(--text-primary)' }}>₹ {totalNet.toLocaleString('en-IN')}</strong> in net payroll for {employees.length} employees. This action will initiate bank transfers.</div>
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
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>June 2025 payroll of <strong style={{ color: '#10B981' }}>₹ {totalNet.toLocaleString('en-IN')}</strong> has been processed. Payslips are being emailed to all employees.</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={() => toast('success', 'Bank File Exported', 'NEFT/ACH batch transfer file for June 2025 has been generated.')}
                  style={{ padding: '10px 20px', background: 'var(--brand)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={14} /> Download Bank File
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
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Salary Breakup — June 2025</span>
          <button 
            onClick={() => toast('success', 'Payslips Generated', 'PDF payslips have been compiled and sent to all employees.')}
            style={{ fontSize: '12px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            <FileText size={13} /> Generate All Payslips
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Employee', 'Basic', 'HRA', 'Allowances', 'Gross', 'PF', 'ESI', 'TDS', 'Net Pay', ''].map(h => (
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
                  {[emp.basic, emp.hra, emp.allowances].map((val, j) => (
                    <td key={j} style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{val.toLocaleString('en-IN')}</td>
                  ))}
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{emp.gross.toLocaleString('en-IN')}</td>
                  {[emp.pf, emp.esi, emp.tds].map((val, j) => (
                    <td key={j} style={{ padding: '14px 16px', fontSize: '12px', color: '#EF4444', whiteSpace: 'nowrap' }}>-{val.toLocaleString('en-IN')}</td>
                  ))}
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>{emp.net.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => openModal('viewPayslip', { 
                        id: emp.id, 
                        name: emp.name, 
                        dept: emp.dept, 
                        role: emp.dept === 'Sales' ? 'Senior Sales Executive' : 'Senior Engineer' 
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
                <td colSpan={3}></td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--brand)', whiteSpace: 'nowrap' }}>{totalGross.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>{totalPF.toLocaleString('en-IN')}</td>
                <td></td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>{totalTDS.toLocaleString('en-IN')}</td>
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
