'use client';
import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

// ---- Data Types ----
export interface Employee {
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
  bank_name?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  pan_no?: string;
  pf_no?: string;
}

export interface Incentive {
  id: string;
  employeeId: string;
  employeeName: string;
  dept: string;
  ruleType: string;
  amount: number;
  target: number; // target for incentive calculations
  month: string;
  status: 'paid' | 'pending' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  id: string;
  leadId: string;
  leadName: string;
  position: string;
  amount: number;
  performance: string;
  month: string;
  status: 'paid' | 'pending' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  employeeId: string;
  date: string; // ISO date string
  product: string;
  amount: number;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'PL' | 'SL' | 'CL' | 'WFH';
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string; // YYYY-MM-DD
  createdAt?: string; // ISO timestamp
}

export interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'late' | 'absent' | 'wfh';
}

export interface AttendanceAuditLog {
  id: string;
  employeeId: string;
  employeeName: string;
  attendanceDate: string;  // YYYY-MM-DD
  previousStatus: string | null;
  newStatus: string;
  checkInBefore: string | null;
  checkOutBefore: string | null;
  checkInAfter: string | null;
  checkOutAfter: string | null;
  editedBy: string;
  editTimestamp: string;   // ISO timestamp
  reason: string | null;
}

export interface PayrollMonthLock {
  id: string;
  year: number;
  month: number;  // 1-based
  lockedBy: string;
  lockedAt: string;  // ISO timestamp
  notes: string | null;
}

export interface AdvancePayment {
  id: string;
  employeeId: string;
  amount: number;
  givenOn: string;      // YYYY-MM-DD
  deductMonth: string;  // YYYY-MM e.g. "2026-06"
  reason: string;
  status: 'pending' | 'deducted' | 'partial';
  createdAt: string;
}

// ---- UI Helper Types ----
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}
export type ModalId = string;
export interface ModalState {
  open: ModalId | null;
  data?: Record<string, any>;
}

// ---- Toast Component ----
function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const startDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onDismissRef.current();
    }, 300); // 300ms smooth exit transition
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startDismiss();
    }, 3500); // 3.5 seconds auto-erase
    return () => clearTimeout(timer);
  }, [startDismiss]);

  const cfg = {
    success: { icon: CheckCircle, bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.25)' },
    error:   { icon: XCircle,     bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)' },
    warning: { icon: AlertCircle, bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
    info:    { icon: Info,        bg: 'rgba(79,142,247,0.15)',   color: '#4F8EF7', border: 'rgba(79,142,247,0.25)' },
  }[item.type];
  const Icon = cfg.icon;

  return (
    <div
      className={`toast-item ${exiting ? 'exiting' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: '10px',
        padding: '12px 14px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '360px',
        cursor: 'default',
      }}
    >
      <div className="toast-icon" style={{ background: cfg.bg, borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.title}</div>
        {item.message && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>{item.message}</div>}
      </div>
      <button onClick={startDismiss} style={{ color: 'var(--text-muted)', flexShrink: 0, padding: '4px', borderRadius: '6px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center' }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ---- Context Interface ----
interface AppCtx {
  toast: (type: ToastType, title: string, message?: string) => void;
  modal: ModalState;
  openModal: (id: ModalId, data?: Record<string, any>) => void;
  closeModal: () => void;
  activeModule: string;
  setActiveModule: (m: string, subTab?: string) => void;
  pendingSubTab: string | null;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  incentives: Incentive[];
  addIncentive: (inc: Omit<Incentive, 'id'>) => void;
  updateIncentive: (inc: Incentive) => void;
  deleteIncentive: (id: string) => void;
  commissions: Commission[];
  addCommission: (com: Omit<Commission, 'id'>) => void;
  updateCommission: (com: Commission) => void;
  deleteCommission: (id: string) => void;
  employeeSales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => void;
  leaves: LeaveApplication[];
  applyLeave: (leave: Omit<LeaveApplication, 'id' | 'employeeName' | 'status' | 'appliedOn'>) => void;
  updateLeave: (id: string, status: 'approved' | 'rejected') => void;
  attendanceRecords: AttendanceRecord[];
  markAttendance: (employeeId: string, type: 'checkIn' | 'checkOut') => Promise<void>;
  changePin: (employeeId: string, oldPin: string, newPin: string) => Promise<boolean>;
  authorizedWifiIp: string;
  clientIp: string;
  updateAuthorizedWifiIp: (ip: string) => Promise<void>;
  monthlySalesTarget: number;
  updateMonthlySalesTarget: (target: number) => Promise<void>;
  logManualAttendance: (employeeId: string, date: string, checkIn: string | null, checkOut: string | null, status: 'present' | 'late' | 'absent' | 'wfh') => Promise<void>;
  // Attendance correction with audit trail
  editAttendance: (employeeId: string, employeeName: string, date: string, checkIn: string | null, checkOut: string | null, status: 'present' | 'late' | 'absent' | 'wfh', reason?: string) => Promise<{ ok: boolean; error?: string; lockReason?: string }>;
  auditLogs: AttendanceAuditLog[];
  fetchAuditLogs: () => Promise<void>;
  // Payroll month locking
  payrollLocks: PayrollMonthLock[];
  lockPayrollMonth: (year: number, month: number, notes?: string) => Promise<{ ok: boolean; error?: string }>;
  unlockPayrollMonth: (year: number, month: number) => Promise<{ ok: boolean; error?: string }>;
  isMonthLocked: (year: number, month: number) => boolean;
  isDateEditable: (dateStr: string) => { editable: boolean; reason?: string; lockType?: 'editWindow' | 'payrollLocked' };
  // Advance Payments
  advancePayments: AdvancePayment[];
  addAdvancePayment: (adv: Omit<AdvancePayment, 'id' | 'createdAt'>) => Promise<void>;
  updateAdvancePaymentStatus: (id: string, status: 'pending' | 'deducted' | 'partial') => Promise<void>;
  deleteAdvancePayment: (id: string) => Promise<void>;
  // Employee Profile update
  updateEmployeeProfile: (profile: { bank_name?: string; bank_account_no?: string; ifsc_code?: string; pan_no?: string; pf_no?: string }) => Promise<void>;
}

const Ctx = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(Ctx);

// ---- Sample Data (Cleared for Production) ----
const initialEmployees: Employee[] = [];

// ---- Provider ----
export function AppProvider({ children }: { children: ReactNode }) {
  // Toast management
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${++counter.current}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Modal state (placeholder)
  const [modal, setModal] = useState<ModalState>({ open: null });
  const openModal = useCallback((id: ModalId, data?: Record<string, any>) => setModal({ open: id, data }), []);
  const closeModal = useCallback(() => setModal({ open: null }), []);

  // UI state
  const [activeModule, _setActiveModule] = useState('dashboard');
  const [pendingSubTab, setPendingSubTab] = useState<string | null>(null);
  const setActiveModule = useCallback((m: string, subTab?: string) => {
    _setActiveModule(m);
    setPendingSubTab(subTab ?? null);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Core data stores (dynamic LocalStorage synced)
  // Core data stores
  const [employees, setEmployees] = useState<Employee[]>([]);
  const employeesRef = useRef(employees);
  useEffect(() => {
    employeesRef.current = employees;
  }, [employees]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [employeeSales, setEmployeeSales] = useState<Sale[]>([]);
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);

  // CRUD helpers
  const addEmployee = useCallback(async (emp: Omit<Employee, 'id'>) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      const data = await res.json();
      if (data.ok && data.employee) {
        setEmployees(prev => [...prev, data.employee]);
        toast('success', 'Employee Created', `${emp.name} has been added to the roster.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Add Employee Failed', err.message || 'Could not save employee.');
    }
  }, [toast]);

  const updateEmployee = useCallback(async (emp: Employee) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      const data = await res.json();
      if (data.ok && data.employee) {
        setEmployees(prev => prev.map(e => (e.id === emp.id ? data.employee : e)));
        toast('success', 'Employee Updated', `${emp.name} has been modified.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Update Employee Failed', err.message || 'Could not update employee.');
    }
  }, [toast]);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        setEmployees(prev => prev.filter(e => e.id !== id));
        toast('warning', 'Employee Removed', `Employee ID ${id} was deleted from database.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Delete Employee Failed', err.message || 'Could not delete employee.');
    }
  }, [toast]);

  const addIncentive = useCallback(async (inc: Omit<Incentive, 'id'>) => {
    try {
      const res = await fetch('/api/incentives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inc)
      });
      const data = await res.json();
      if (data.ok && data.incentive) {
        setIncentives(prev => [...prev, data.incentive]);
        toast('success', 'Incentive Logged', `Incentive of ₹${inc.amount} logged for ${inc.employeeName}.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Add Incentive Failed', err.message || 'Could not log incentive.');
    }
  }, [toast]);

  const updateIncentive = useCallback(async (inc: Incentive) => {
    try {
      const res = await fetch('/api/incentives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inc)
      });
      const data = await res.json();
      if (data.ok && data.incentive) {
        setIncentives(prev => prev.map(i => (i.id === inc.id ? data.incentive : i)));
        toast('success', 'Incentive Updated', 'Performance incentive modified successfully.');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Update Incentive Failed', err.message || 'Could not update incentive.');
    }
  }, [toast]);

  const deleteIncentive = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/incentives?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        setIncentives(prev => prev.filter(i => i.id !== id));
        toast('warning', 'Incentive Deleted', 'Performance incentive record removed.');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Delete Incentive Failed', err.message || 'Could not delete incentive.');
    }
  }, [toast]);

  const addCommission = useCallback(async (com: Omit<Commission, 'id'>) => {
    try {
      const res = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(com)
      });
      const data = await res.json();
      if (data.ok && data.commission) {
        setCommissions(prev => [...prev, data.commission]);
        toast('success', 'Commission Logged', `Commission of ₹${com.amount} logged for lead ${com.leadName}.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Add Commission Failed', err.message || 'Could not log commission.');
    }
  }, [toast]);

  const updateCommission = useCallback(async (com: Commission) => {
    try {
      const res = await fetch('/api/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(com)
      });
      const data = await res.json();
      if (data.ok && data.commission) {
        setCommissions(prev => prev.map(c => (c.id === com.id ? data.commission : c)));
        toast('success', 'Commission Updated', 'Commission record modified successfully.');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Update Commission Failed', err.message || 'Could not update commission.');
    }
  }, [toast]);

  const deleteCommission = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/commissions?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.ok) {
        setCommissions(prev => prev.filter(c => c.id !== id));
        toast('warning', 'Commission Deleted', 'Commission record removed.');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Delete Commission Failed', err.message || 'Could not delete commission.');
    }
  }, [toast]);

  const addSale = useCallback(async (sale: Omit<Sale, 'id'>) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      const data = await res.json();
      if (data.ok && data.sale) {
        setEmployeeSales(prev => [...prev, data.sale]);
        toast('success', 'Sale Logged', `Logged transaction of ₹${sale.amount} for ${sale.product}.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Failed to Log Sale', err.message || 'Could not save sales transaction.');
    }
  }, [toast]);

  // Load and save from localStorage
  const [leaves, setLeaves] = useState<LeaveApplication[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hrpulse_leaves');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hrpulse_attendance_records');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AttendanceAuditLog[]>([]);
  const [payrollLocks, setPayrollLocks] = useState<PayrollMonthLock[]>([]);


  const [authorizedWifiIp, setAuthorizedWifiIp] = useState('127.0.0.1');
  const [clientIp, setClientIp] = useState('127.0.0.1');
  const [monthlySalesTarget, setMonthlySalesTarget] = useState(500000);

  const knownLeaveIds = useRef<Set<string>>(new Set());
  const isInitialLeavesLoad = useRef(true);
  const knownAttendanceKeys = useRef<Set<string>>(new Set());
  const isInitialAttendanceLoad = useRef(true);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch('/api/leaves');
      const data = await res.json();
      if (data.ok && data.leaves) {
        const serverLeaves = data.leaves as LeaveApplication[];
        
        if (!isInitialLeavesLoad.current) {
          serverLeaves.forEach(leave => {
            if (!knownLeaveIds.current.has(leave.id)) {
              knownLeaveIds.current.add(leave.id);
              if (typeof window !== 'undefined' && window.location.pathname === '/') {
                toast('info', 'New Leave Request', `${leave.employeeName} applied for ${leave.type} leave: "${leave.reason}"`);
              }
            }
          });
        } else {
          serverLeaves.forEach(leave => knownLeaveIds.current.add(leave.id));
          isInitialLeavesLoad.current = false;
        }

        setLeaves(serverLeaves);
        localStorage.setItem('hrpulse_leaves', JSON.stringify(serverLeaves));
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    }
  }, [toast]);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      if (data.ok && data.attendanceRecords) {
        const serverRecords = data.attendanceRecords as AttendanceRecord[];

        if (!isInitialAttendanceLoad.current) {
          serverRecords.forEach(record => {
            const checkInKey = `${record.employeeId}-${record.date}-in-${record.checkIn}`;
            const checkOutKey = `${record.employeeId}-${record.date}-out-${record.checkOut}`;

            const emp = employeesRef.current.find(e => e.id === record.employeeId);
            const name = emp ? emp.name : record.employeeId;

            if (record.checkIn && !knownAttendanceKeys.current.has(checkInKey)) {
              knownAttendanceKeys.current.add(checkInKey);
              if (typeof window !== 'undefined' && window.location.pathname === '/') {
                toast('success', 'Employee Checked In', `${name} checked in at ${record.checkIn}`);
              }
            }

            if (record.checkOut && !knownAttendanceKeys.current.has(checkOutKey)) {
              knownAttendanceKeys.current.add(checkOutKey);
              if (typeof window !== 'undefined' && window.location.pathname === '/') {
                toast('warning', 'Employee Checked Out', `${name} checked out at ${record.checkOut}`);
              }
            }
          });
        } else {
          serverRecords.forEach(record => {
            if (record.checkIn) knownAttendanceKeys.current.add(`${record.employeeId}-${record.date}-in-${record.checkIn}`);
            if (record.checkOut) knownAttendanceKeys.current.add(`${record.employeeId}-${record.date}-out-${record.checkOut}`);
          });
          isInitialAttendanceLoad.current = false;
        }

        if (data.authorizedWifiIp) setAuthorizedWifiIp(data.authorizedWifiIp);
        if (data.clientIp) setClientIp(data.clientIp);
        if (data.monthlySalesTarget) setMonthlySalesTarget(data.monthlySalesTarget);

        setAttendanceRecords(serverRecords);
        localStorage.setItem('hrpulse_attendance_records', JSON.stringify(serverRecords));
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  }, [toast]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.ok && data.employees) {
        setEmployees(data.employees);
        localStorage.setItem('hrpulse_employees', JSON.stringify(data.employees));
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  }, []);

  const fetchIncentives = useCallback(async () => {
    try {
      const res = await fetch('/api/incentives');
      const data = await res.json();
      if (data.ok && data.incentives) {
        setIncentives(data.incentives);
        localStorage.setItem('hrpulse_incentives', JSON.stringify(data.incentives));
      }
    } catch (err) {
      console.error('Failed to fetch incentives:', err);
    }
  }, []);

  const fetchCommissions = useCallback(async () => {
    try {
      const res = await fetch('/api/commissions');
      const data = await res.json();
      if (data.ok && data.commissions) {
        setCommissions(data.commissions);
        localStorage.setItem('hrpulse_commissions', JSON.stringify(data.commissions));
      }
    } catch (err) {
      console.error('Failed to fetch commissions:', err);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (data.ok && data.sales) {
        setEmployeeSales(data.sales);
        localStorage.setItem('hrpulse_employee_sales', JSON.stringify(data.sales));
      }
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    }
  }, []);

  // ── Audit Log Fetching ────────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/audit');
      const data = await res.json();
      if (data.ok && data.logs) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, []);

  // ── Payroll Month Lock Fetch ──────────────────────────────────────────────
  const fetchPayrollLocks = useCallback(async () => {
    try {
      const res = await fetch('/api/payroll-locks');
      const data = await res.json();
      if (data.ok && data.locks) {
        setPayrollLocks(data.locks);
      }
    } catch (err) {
      console.error('Failed to fetch payroll locks:', err);
    }
  }, []);

  // ── Advance Payments Fetch ────────────────────────────────────────────────
  const fetchAdvancePayments = useCallback(async () => {
    try {
      const res = await fetch('/api/advance-payments');
      const data = await res.json();
      if (data.ok && data.advances) {
        setAdvancePayments(data.advances);
      }
    } catch (err) {
      console.error('Failed to fetch advance payments:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
    fetchAttendance();
    fetchEmployees();
    fetchIncentives();
    fetchCommissions();
    fetchSales();
    fetchAuditLogs();
    fetchPayrollLocks();
    fetchAdvancePayments();

    const interval = setInterval(() => {
      fetchLeaves();
      fetchAttendance();
      fetchEmployees();
      fetchIncentives();
      fetchCommissions();
      fetchSales();
      fetchAdvancePayments();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchLeaves, fetchAttendance, fetchEmployees, fetchIncentives, fetchCommissions, fetchSales, fetchAuditLogs, fetchPayrollLocks, fetchAdvancePayments]);

  const applyLeave = useCallback(async (newLeave: Omit<LeaveApplication, 'id' | 'employeeName' | 'status' | 'appliedOn'>) => {
    const emp = employees.find(e => e.id === newLeave.employeeId);
    const employeeName = emp ? emp.name : 'Unknown Employee';

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLeave,
          employeeName
        })
      });
      const data = await res.json();
      if (data.ok && data.leave) {
        setLeaves(prev => {
          const updated = [...prev, data.leave];
          localStorage.setItem('hrpulse_leaves', JSON.stringify(updated));
          return updated;
        });
        toast('success', 'Leave Applied', 'Your leave application has been submitted successfully.');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error(err);
      toast('error', 'Submission Failed', 'Could not sync leave request with the server.');
    }
  }, [employees, toast]);

  const updateLeave = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.ok && data.leave) {
        setLeaves(prev => {
          const updated = prev.map(l => l.id === id ? { ...l, status } : l);
          localStorage.setItem('hrpulse_leaves', JSON.stringify(updated));
          return updated;
        });
        toast('success', `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`, `Leave application has been marked as ${status}.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error(err);
      toast('error', 'Status Update Failed', 'Could not sync leave status change with the server.');
    }
  }, [toast]);

  const markAttendance = useCallback(async (employeeId: string, type: 'checkIn' | 'checkOut') => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, type })
      });
      const data = await res.json();
      if (data.ok && data.record) {
        setAttendanceRecords(prev => {
          let updated: AttendanceRecord[];
          const todayStr = data.record.date;
          const existingIdx = prev.findIndex(r => r.employeeId === employeeId && r.date === todayStr);

          if (existingIdx > -1) {
            updated = [...prev];
            updated[existingIdx] = data.record;
          } else {
            updated = [...prev, data.record];
          }
          localStorage.setItem('hrpulse_attendance_records', JSON.stringify(updated));
          return updated;
        });
        const timeStr = data.record[type];
        toast('success', `Checked ${type === 'checkIn' ? 'In' : 'Out'}`, `Successfully checked ${type === 'checkIn' ? 'in' : 'out'} at ${timeStr}.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      console.error(err);
      toast('error', 'Attendance Failed', err.message || 'Could not sync check-in/out with the server.');
    }
  }, [toast]);

  const updateAuthorizedWifiIp = useCallback(async (ip: string) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateConfig', authorizedWifiIp: ip })
      });
      const data = await res.json();
      if (data.ok) {
        setAuthorizedWifiIp(data.authorizedWifiIp);
        toast('success', 'WiFi Config Updated', `Authorized store WiFi IP is now set to ${data.authorizedWifiIp}.`);
      }
    } catch (err) {
      console.error(err);
      toast('error', 'Update Failed', 'Could not update WiFi configuration on the server.');
    }
  }, [toast]);

  const updateMonthlySalesTarget = useCallback(async (target: number) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateSalesTarget', monthlySalesTarget: target })
      });
      const data = await res.json();
      if (data.ok) {
        setMonthlySalesTarget(data.monthlySalesTarget);
        toast('success', 'Sales Target Updated', `Monthly sales target is now set to ₹${data.monthlySalesTarget.toLocaleString('en-IN')}.`);
      }
    } catch (err) {
      console.error(err);
      toast('error', 'Update Failed', 'Could not update monthly sales target on the server.');
    }
  }, [toast]);

  const logManualAttendance = useCallback(async (
    employeeId: string, 
    date: string, 
    checkIn: string | null, 
    checkOut: string | null, 
    status: 'present' | 'late' | 'absent' | 'wfh'
  ) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manualAttendance',
          employeeId,
          date,
          checkIn,
          checkOut,
          status
        })
      });
      const data = await res.json();
      if (data.ok && data.record) {
        setAttendanceRecords(prev => {
          let updated: AttendanceRecord[];
          const existingIdx = prev.findIndex(r => r.employeeId === employeeId && r.date === date);
          if (existingIdx > -1) {
            updated = [...prev];
            updated[existingIdx] = data.record;
          } else {
            updated = [...prev, data.record];
          }
          localStorage.setItem('hrpulse_attendance_records', JSON.stringify(updated));
          return updated;
        });
        // Refresh audit logs
        fetchAuditLogs();
        toast('success', 'Attendance Logged Manually', `Successfully updated attendance for ${date}.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      console.error(err);
      toast('error', 'Failed to Log Attendance', err.message || 'Could not save manual attendance record.');
    }
  }, [toast]);

  const changePin = useCallback(async (employeeId: string, oldPin: string, newPin: string) => {
    try {
      const res = await fetch('/api/auth/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'changePin', employeeId, oldPin, newPin })
      });
      const data = await res.json();
      return !!data.ok;
    } catch {
      return false;
    }
  }, []);

  // ── Attendance Correction with Audit Trail ────────────────────────────────
  const editAttendance = useCallback(async (
    employeeId: string,
    employeeName: string,
    date: string,
    checkIn: string | null,
    checkOut: string | null,
    status: 'present' | 'late' | 'absent' | 'wfh',
    reason?: string
  ): Promise<{ ok: boolean; error?: string; lockReason?: string }> => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editAttendance',
          employeeId,
          employeeName,
          date,
          checkIn,
          checkOut,
          status,
          reason,
        })
      });
      const data = await res.json();
      if (data.ok && data.record) {
        setAttendanceRecords(prev => {
          const existingIdx = prev.findIndex(r => r.employeeId === employeeId && r.date === date);
          let updated: AttendanceRecord[];
          if (existingIdx > -1) {
            updated = [...prev];
            updated[existingIdx] = data.record;
          } else {
            updated = [...prev, data.record];
          }
          localStorage.setItem('hrpulse_attendance_records', JSON.stringify(updated));
          return updated;
        });
        toast('success', 'Attendance Updated', `Attendance for ${date} has been corrected and logged.`);
        // Refresh audit logs to reflect the new entry
        fetchAuditLogs();
        return { ok: true };
      } else {
        return { ok: false, error: data.error, lockReason: data.lockReason };
      }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }, [toast]);


  // ── Payroll Month Lock Operations ─────────────────────────────────────────
  const lockPayrollMonth = useCallback(async (year: number, month: number, notes?: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/payroll-locks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, notes })
      });
      const data = await res.json();
      if (data.ok) {
        setPayrollLocks(prev => [...prev, data.lock]);
        toast('success', 'Payroll Month Locked', `${year}/${String(month).padStart(2, '0')} has been finalized and locked.`);
        return { ok: true };
      }
      return { ok: false, error: data.error };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }, [toast]);

  const unlockPayrollMonth = useCallback(async (year: number, month: number): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/payroll-locks?year=${year}&month=${month}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setPayrollLocks(prev => prev.filter(l => !(l.year === year && l.month === month)));
        toast('warning', 'Payroll Month Unlocked', `${year}/${String(month).padStart(2, '0')} lock has been removed.`);
        return { ok: true };
      }
      return { ok: false, error: data.error };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }, [toast]);

  // ── Helper: Check if a month is locked ───────────────────────────────────
  const isMonthLocked = useCallback((year: number, month: number): boolean => {
    return payrollLocks.some(l => l.year === year && l.month === month);
  }, [payrollLocks]);

  // ── Helper: Check if a date is editable (client-side pre-check) ──────────
  // Server performs the authoritative check; this is for UI state only.
  const isDateEditable = useCallback((dateStr: string): { editable: boolean; reason?: string; lockType?: 'editWindow' | 'payrollLocked' } => {
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) return { editable: false, reason: 'Invalid date' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    targetDate.setHours(0, 0, 0, 0);

    // Future dates are not editable
    if (targetDate > today) return { editable: false, reason: 'Future dates cannot be edited' };

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    if (isMonthLocked(year, month)) {
      return {
        editable: false,
        lockType: 'payrollLocked',
        reason: 'This payroll month has been finalized and attendance can no longer be modified.',
      };
    }

    if (targetDate < sevenDaysAgo) {
      return {
        editable: false,
        lockType: 'editWindow',
        reason: 'The 7-day edit window for this attendance record has expired.',
      };
    }

    return { editable: true };
  }, [isMonthLocked]);

  // ── Advance Payment CRUD ──────────────────────────────────────────────────
  const addAdvancePayment = useCallback(async (adv: Omit<AdvancePayment, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/advance-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adv),
      });
      const data = await res.json();
      if (data.ok && data.advance) {
        setAdvancePayments(prev => [...prev, data.advance]);
        toast('success', 'Advance Recorded', `₹${adv.amount.toLocaleString('en-IN')} advance recorded for employee.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Add Advance Failed', err.message || 'Could not record advance payment.');
    }
  }, [toast]);

  const updateAdvancePaymentStatus = useCallback(async (id: string, status: 'pending' | 'deducted' | 'partial') => {
    try {
      const res = await fetch('/api/advance-payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.ok && data.advance) {
        setAdvancePayments(prev => prev.map(a => a.id === id ? data.advance : a));
        toast('success', 'Status Updated', `Advance payment marked as ${status}.`);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Update Failed', err.message || 'Could not update advance status.');
    }
  }, [toast]);

  const deleteAdvancePayment = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/advance-payments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setAdvancePayments(prev => prev.filter(a => a.id !== id));
        toast('warning', 'Advance Deleted', 'Advance payment record removed.');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Delete Failed', err.message || 'Could not delete advance payment.');
    }
  }, [toast]);

  const updateEmployeeProfile = useCallback(async (profile: { bank_name?: string; bank_account_no?: string; ifsc_code?: string; pan_no?: string; pf_no?: string }) => {
    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.ok && data.employee) {
        setEmployees(prev => prev.map(e => e.id === data.employee.id ? data.employee : e));
        toast('success', 'Profile Updated', 'Your bank and tax details have been updated successfully.');
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      toast('error', 'Update Failed', err.message || 'Could not update profile.');
    }
  }, [toast]);

  return (
    <Ctx.Provider
      value={{
        toast,
        modal,
        openModal,
        closeModal,
        activeModule,
        setActiveModule,
        pendingSubTab,
        sidebarOpen,
        setSidebarOpen,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        incentives,
        addIncentive,
        updateIncentive,
        deleteIncentive,
        commissions,
        addCommission,
        updateCommission,
        deleteCommission,
        employeeSales,
        addSale,
        leaves,
        applyLeave,
        updateLeave,
        attendanceRecords,
        markAttendance,
        changePin,
         authorizedWifiIp,
        clientIp,
        updateAuthorizedWifiIp,
        monthlySalesTarget,
        updateMonthlySalesTarget,
        logManualAttendance,
        editAttendance,
        auditLogs,
        fetchAuditLogs,
        payrollLocks,
        lockPayrollMonth,
        unlockPayrollMonth,
        isMonthLocked,
        isDateEditable,
        // Advance Payments
        advancePayments,
        addAdvancePayment,
        updateAdvancePaymentStatus,
        deleteAdvancePayment,
        updateEmployeeProfile,
      }}
    >
      {children}
      {/* Toast Container */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <Toast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}
