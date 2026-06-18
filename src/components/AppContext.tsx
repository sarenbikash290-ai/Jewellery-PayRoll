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
}

export interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'late' | 'absent' | 'wfh';
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
  const cfg = {
    success: { icon: CheckCircle, bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.25)' },
    error:   { icon: XCircle,     bg: 'rgba(239,68,68,0.15)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)' },
    warning: { icon: AlertCircle, bg: 'rgba(245,158,11,0.15)',  color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
    info:    { icon: Info,        bg: 'rgba(79,142,247,0.15)',   color: '#4F8EF7', border: 'rgba(79,142,247,0.25)' },
  }[item.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="toast" style={{ borderLeftColor: cfg.color, borderLeftWidth: 3, borderLeftStyle: 'solid', background: '#fff', padding: '8px', margin: '4px', display: 'flex', alignItems: 'center' }}>
      <div className="toast-icon" style={{ background: cfg.bg, borderRadius: '50%', padding: '4px', marginRight: '8px' }}>
        <Icon size={16} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{item.title}</div>
        {item.message && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.message}</div>}
      </div>
      <button onClick={onDismiss} style={{ color: 'var(--text-secondary)', flexShrink: 0, padding: '2px', background: 'transparent', border: 'none' }}>
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
  setActiveModule: (m: string) => void;
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
  markAttendance: (employeeId: string, type: 'checkIn' | 'checkOut') => void;
  changePin: (employeeId: string, oldPin: string, newPin: string) => Promise<boolean>;
  authorizedWifiIp: string;
  clientIp: string;
  updateAuthorizedWifiIp: (ip: string) => Promise<void>;
  logManualAttendance: (employeeId: string, date: string, checkIn: string | null, checkOut: string | null, status: 'present' | 'late' | 'absent' | 'wfh') => Promise<void>;
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
  const [activeModule, setActiveModule] = useState('dashboard');
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


  const [authorizedWifiIp, setAuthorizedWifiIp] = useState('127.0.0.1');
  const [clientIp, setClientIp] = useState('127.0.0.1');

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

  useEffect(() => {
    fetchLeaves();
    fetchAttendance();
    fetchEmployees();
    fetchIncentives();
    fetchCommissions();
    fetchSales();

    const interval = setInterval(() => {
      fetchLeaves();
      fetchAttendance();
      fetchEmployees();
      fetchIncentives();
      fetchCommissions();
      fetchSales();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchLeaves, fetchAttendance, fetchEmployees, fetchIncentives, fetchCommissions, fetchSales]);

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

  return (
    <Ctx.Provider
      value={{
        toast,
        modal,
        openModal,
        closeModal,
        activeModule,
        setActiveModule,
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
        logManualAttendance,
      }}
    >
      {children}
      {/* Toast Container */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <Toast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}
