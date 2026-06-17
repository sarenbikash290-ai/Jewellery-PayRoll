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
  employeePins: Record<string, string>;
  changePin: (employeeId: string, oldPin: string, newPin: string) => boolean;
  authorizedWifiIp: string;
  clientIp: string;
  updateAuthorizedWifiIp: (ip: string) => Promise<void>;
}

const Ctx = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(Ctx);

// ---- Sample Data ----
const initialEmployees: Employee[] = [
  { id: 'EMP001', name: 'Arjun Soni',       dept: 'Sales',          role: 'Senior Sales Executive',  email: 'arjun@saijewellers.com',   phone: '+91 98765 11001', location: 'Main Store',   status: 'active',   joined: '12 Mar 2021', salary: '₹ 38,000', type: 'Full-time' },
  { id: 'EMP002', name: 'Priya Mehta',      dept: 'Sales',          role: 'Sales Executive',          email: 'priya@saijewellers.com',   phone: '+91 98765 11002', location: 'Main Store',   status: 'active',   joined: '05 Jul 2022', salary: '₹ 28,000', type: 'Full-time' },
  { id: 'EMP003', name: 'Ramesh Sonar',     dept: 'Gold Crafting',  role: 'Head Goldsmith',           email: 'ramesh@saijewellers.com',  phone: '+91 98765 11003', location: 'Workshop',     status: 'active',   joined: '22 Jan 2018', salary: '₹ 52,000', type: 'Full-time' },
  { id: 'EMP004', name: 'Geeta Pawar',      dept: 'Gold Crafting',  role: 'Goldsmith',                email: 'geeta@saijewellers.com',   phone: '+91 98765 11004', location: 'Workshop',     status: 'active',   joined: '10 Feb 2020', salary: '₹ 35,000', type: 'Full-time' },
  { id: 'EMP005', name: 'Suresh Jain',      dept: 'Store Ops',      role: 'Store Manager',            email: 'suresh@saijewellers.com',  phone: '+91 98765 11005', location: 'Main Store',   status: 'active',   joined: '18 Apr 2017', salary: '₹ 65,000', type: 'Full-time' },
  { id: 'EMP006', name: 'Kavita Shah',      dept: 'Accounts',       role: 'Accountant',               email: 'kavita@saijewellers.com',  phone: '+91 98765 11006', location: 'Back Office',  status: 'active',   joined: '30 Aug 2019', salary: '₹ 42,000', type: 'Full-time' },
  { id: 'EMP007', name: 'Deepak Yadav',     dept: 'Sales',          role: 'Sales Executive',          email: 'deepak@saijewellers.com',  phone: '+91 98765 11007', location: 'Main Store',   status: 'active',   joined: '14 Jun 2023', salary: '₹ 26,000', type: 'Full-time' },
  { id: 'EMP008', name: 'Meena Gupta',      dept: 'Gold Crafting',  role: 'Stone Setter',             email: 'meena@saijewellers.com',   phone: '+91 98765 11008', location: 'Workshop',     status: 'active',   joined: '03 May 2021', salary: '₹ 30,000', type: 'Full-time' },
  { id: 'EMP009', name: 'Vikram Desai',     dept: 'Store Ops',      role: 'Cashier',                  email: 'vikram@saijewellers.com',  phone: '+91 98765 11009', location: 'Main Store',   status: 'active',   joined: '11 Sep 2022', salary: '₹ 22,000', type: 'Full-time' },
  { id: 'EMP010', name: 'Anita Tiwari',     dept: 'Sales',          role: 'Senior Sales Executive',  email: 'anita@saijewellers.com',   phone: '+91 98765 11010', location: 'Main Store',   status: 'active',   joined: '07 Jan 2020', salary: '₹ 35,000', type: 'Full-time' },
  { id: 'EMP011', name: 'Sanjay Agarwal',   dept: 'Gold Crafting',  role: 'Goldsmith',                email: 'sanjay@saijewellers.com',  phone: '+91 98765 11011', location: 'Workshop',     status: 'inactive', joined: '25 Mar 2019', salary: '₹ 33,000', type: 'Full-time' },
  { id: 'EMP012', name: 'Ritu Sharma',      dept: 'Store Ops',      role: 'Security Guard',           email: 'ritu@saijewellers.com',    phone: '+91 98765 11012', location: 'Main Store',   status: 'active',   joined: '01 Aug 2021', salary: '₹ 18,000', type: 'Full-time' },
];

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

  // Core data stores
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [incentives, setIncentives] = useState<Incentive[]>([
    { id: 'INC001', employeeId: 'EMP001', employeeName: 'Arjun Soni',   dept: 'Sales',         ruleType: 'Revenue Slab', amount: 8500,  target: 150000, month: 'Jun 2025', status: 'paid',    createdAt: '2025-06-01', updatedAt: '2025-06-10' },
    { id: 'INC002', employeeId: 'EMP002', employeeName: 'Priya Mehta',  dept: 'Sales',         ruleType: 'Revenue Slab', amount: 5200,  target: 100000, month: 'Jun 2025', status: 'pending', createdAt: '2025-06-02', updatedAt: '2025-06-08' },
    { id: 'INC003', employeeId: 'EMP010', employeeName: 'Anita Tiwari', dept: 'Sales',         ruleType: 'Revenue Slab', amount: 7800,  target: 120000, month: 'Jun 2025', status: 'approved', createdAt: '2025-06-01', updatedAt: '2025-06-09' },
    { id: 'INC004', employeeId: 'EMP003', employeeName: 'Ramesh Sonar', dept: 'Gold Crafting', ruleType: 'Zero Absence Bonus', amount: 3000, target: 0, month: 'Jun 2025', status: 'paid', createdAt: '2025-06-01', updatedAt: '2025-06-10' },
  ]);
  const [commissions, setCommissions] = useState<Commission[]>([
    { id: 'COM001', leadId: 'LEAD001', leadName: 'Arjun Soni',   position: 'Sales Lead',  amount: 12000, performance: 'Exceptional', month: 'Jun 2025', status: 'paid',     createdAt: '2025-06-01', updatedAt: '2025-06-10' },
    { id: 'COM002', leadId: 'LEAD002', leadName: 'Anita Tiwari', position: 'Senior Lead', amount: 9500,  performance: 'Excellent',   month: 'Jun 2025', status: 'approved', createdAt: '2025-06-03', updatedAt: '2025-06-09' },
    { id: 'COM003', leadId: 'LEAD003', leadName: 'Suresh Jain',  position: 'Store Head',  amount: 15000, performance: 'Good',        month: 'Jun 2025', status: 'pending',  createdAt: '2025-06-05', updatedAt: '2025-06-06' },
  ]);
  const [employeeSales, setEmployeeSales] = useState<Sale[]>([
    // Arjun Soni (EMP001) — Senior Sales Executive
    { id: 'SALE001', employeeId: 'EMP001', date: '2025-06-03', product: 'Gold Ring',          amount: 45000 },
    { id: 'SALE002', employeeId: 'EMP001', date: '2025-06-07', product: 'Diamond Necklace',   amount: 92000 },
    { id: 'SALE003', employeeId: 'EMP001', date: '2025-06-11', product: 'Gold Bangle',        amount: 38000 },
    { id: 'SALE004', employeeId: 'EMP001', date: '2025-05-05', product: 'Platinum Ring',      amount: 65000 },
    { id: 'SALE005', employeeId: 'EMP001', date: '2025-05-18', product: 'Diamond Bracelet',   amount: 88000 },
    { id: 'SALE006', employeeId: 'EMP001', date: '2025-04-12', product: 'Ruby Pendant',       amount: 55000 },
    // Priya Mehta (EMP002) — Sales Executive
    { id: 'SALE007', employeeId: 'EMP002', date: '2025-06-04', product: 'Silver Earrings',    amount: 18000 },
    { id: 'SALE008', employeeId: 'EMP002', date: '2025-06-09', product: 'Gold Chain',         amount: 42000 },
    { id: 'SALE009', employeeId: 'EMP002', date: '2025-05-20', product: 'Sapphire Ring',      amount: 72000 },
    { id: 'SALE010', employeeId: 'EMP002', date: '2025-05-28', product: 'Emerald Set',        amount: 95000 },
    // Anita Tiwari (EMP010) — Senior Sales Executive
    { id: 'SALE011', employeeId: 'EMP010', date: '2025-06-02', product: 'Diamond Necklace',   amount: 120000 },
    { id: 'SALE012', employeeId: 'EMP010', date: '2025-06-08', product: 'Platinum Ring',      amount: 85000 },
    { id: 'SALE013', employeeId: 'EMP010', date: '2025-06-14', product: 'Gold Bangle Set',    amount: 48000 },
    { id: 'SALE014', employeeId: 'EMP010', date: '2025-05-10', product: 'Ruby Pendant',       amount: 60000 },
    { id: 'SALE015', employeeId: 'EMP010', date: '2025-04-22', product: 'Diamond Bracelet',   amount: 95000 },
  ]);

  // CRUD helpers
  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    setEmployees(prev => {
      const maxNum = prev.reduce((max, e) => {
        const num = parseInt(e.id.replace('EMP', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const nextId = `EMP${String(maxNum + 1).padStart(3, '0')}`;
      return [...prev, { ...emp, id: nextId }];
    });
  }, []);
  const updateEmployee = useCallback((emp: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === emp.id ? emp : e)));
  }, []);
  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  }, []);

  const addIncentive = useCallback((inc: Omit<Incentive, 'id'>) => {
    setIncentives(prev => {
      const newId = `INC${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...inc, id: newId }];
    });
  }, []);
  const updateIncentive = useCallback((inc: Incentive) => {
    setIncentives(prev => prev.map(i => (i.id === inc.id ? inc : i)));
  }, []);
  const deleteIncentive = useCallback((id: string) => {
    setIncentives(prev => prev.filter(i => i.id !== id));
  }, []);

  const addCommission = useCallback((com: Omit<Commission, 'id'>) => {
    setCommissions(prev => {
      const newId = `COM${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...com, id: newId }];
    });
  }, []);
  const updateCommission = useCallback((com: Commission) => {
    setCommissions(prev => prev.map(c => (c.id === com.id ? com : c)));
  }, []);
  const deleteCommission = useCallback((id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
  }, []);

  const addSale = useCallback((sale: Omit<Sale, 'id'>) => {
    setEmployeeSales(prev => {
      const newId = `SALE${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...sale, id: newId }];
    });
  }, []);

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

  const [employeePins, setEmployeePins] = useState<Record<string, string>>({});
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

            const emp = employees.find(e => e.id === record.employeeId);
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
  }, [employees, toast]);

  useEffect(() => {
    fetchLeaves();
    fetchAttendance();

    if (typeof window !== 'undefined') {
      const storedPins = localStorage.getItem('hrpulse_employee_pins');
      if (storedPins) {
        setEmployeePins(JSON.parse(storedPins));
      } else {
        const defaultPins = {
          'EMP001': '1234', 'EMP002': '1234', 'EMP003': '1234', 'EMP004': '1234',
          'EMP005': '1234', 'EMP006': '1234', 'EMP007': '1234', 'EMP008': '1234',
          'EMP009': '1234', 'EMP010': '1234', 'EMP011': '1234', 'EMP012': '1234',
        };
        setEmployeePins(defaultPins);
        localStorage.setItem('hrpulse_employee_pins', JSON.stringify(defaultPins));
      }
    }

    const interval = setInterval(() => {
      fetchLeaves();
      fetchAttendance();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchLeaves, fetchAttendance]);

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

  const changePin = useCallback((employeeId: string, oldPin: string, newPin: string) => {
    let success = false;
    setEmployeePins(prev => {
      const currentPin = prev[employeeId] || '1234';
      if (currentPin !== oldPin) {
        return prev;
      }
      const updated = { ...prev, [employeeId]: newPin };
      localStorage.setItem('hrpulse_employee_pins', JSON.stringify(updated));
      success = true;
      return updated;
    });
    return success;
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
        employeePins,
        changePin,
        authorizedWifiIp,
        clientIp,
        updateAuthorizedWifiIp,
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
