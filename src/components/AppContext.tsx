'use client';
import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

/* ── Toast ── */
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface ToastItem { id: string; type: ToastType; title: string; message?: string; }

/* ── Modal Registry ── */
export type ModalId =
  | 'addEmployee' | 'editEmployee' | 'viewEmployee'
  | 'addLeave' | 'runPayroll' | 'addIncentive' | 'editIncentive'
  | 'addCommission' | 'editCommission'
  | 'viewPayslip' | 'customReport' | 'exportData'
  | 'confirm' | 'settings';

export interface ModalState {
  open: ModalId | null;
  data?: Record<string, unknown>;
}

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

interface AppCtx {
  toast: (type: ToastType, title: string, message?: string) => void;
  modal: ModalState;
  openModal: (id: ModalId, data?: Record<string, unknown>) => void;
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
  addIncentive: (incentive: Omit<Incentive, 'id'>) => void;
  updateIncentive: (incentive: Incentive) => void;
  deleteIncentive: (id: string) => void;
  commissions: Commission[];
  addCommission: (commission: Omit<Commission, 'id'>) => void;
  updateCommission: (commission: Commission) => void;
  deleteCommission: (id: string) => void;
}

const Ctx = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(Ctx);

const initialEmployees: Employee[] = [
  { id: 'EMP001', name: 'Ananya Sharma',   dept: 'Sales',       role: 'Senior Sales Executive', email: 'ananya@company.com', phone: '+91 98765 11001', location: 'Delhi', status: 'active',  joined: '12 Mar 2021', salary: '₹ 72,000', type: 'Full-time' },
  { id: 'EMP002', name: 'Rohan Mehta',     dept: 'Engineering', role: 'Senior Engineer',          email: 'rohan@company.com',  phone: '+91 98765 11002', location: 'Bangalore', status: 'active',  joined: '05 Jul 2019', salary: '₹ 1,15,000', type: 'Full-time' },
  { id: 'EMP003', name: 'Priya Nair',      dept: 'Sales',       role: 'Sales Executive',           email: 'priya@company.com',  phone: '+91 98765 11003', location: 'Mumbai',    status: 'active',  joined: '22 Nov 2022', salary: '₹ 55,000', type: 'Full-time' },
  { id: 'EMP004', name: 'Dev Patel',       dept: 'Operations',  role: 'Operations Manager',        email: 'dev@company.com',    phone: '+91 98765 11004', location: 'Ahmedabad', status: 'active',  joined: '10 Feb 2020', salary: '₹ 88,000', type: 'Full-time' },
  { id: 'EMP005', name: 'Sneha Reddy',     dept: 'HR',          role: 'HR Manager',                email: 'sneha@company.com',  phone: '+91 98765 11005', location: 'Hyderabad', status: 'active',  joined: '18 Apr 2018', salary: '₹ 95,000', type: 'Full-time' },
  { id: 'EMP006', name: 'Amit Verma',      dept: 'Finance',     role: 'Financial Analyst',         email: 'amit@company.com',   phone: '+91 98765 11006', location: 'Delhi',     status: 'inactive', joined: '30 Aug 2020', salary: '₹ 82,000', type: 'Full-time' },
  { id: 'EMP007', name: 'Kavya Singh',     dept: 'Engineering', role: 'Frontend Developer',        email: 'kavya@company.com',  phone: '+91 98765 11007', location: 'Pune',      status: 'active',  joined: '14 Jan 2023', salary: '₹ 78,000', type: 'Full-time' },
  { id: 'EMP008', name: 'Arjun Kumar',     dept: 'Sales',       role: 'Sales Manager',             email: 'arjun@company.com',  phone: '+91 98765 11008', location: 'Chennai',   status: 'active',  joined: '03 May 2017', salary: '₹ 1,02,000', type: 'Full-time' },
];

/* ── Toast Component ── */
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
    <div className="toast" style={{ borderLeftColor: cfg.color, borderLeftWidth: 3 }}>
      <div className="toast-icon" style={{ background: cfg.bg }}>
        <Icon size={16} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{item.title}</div>
        {item.message && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.message}</div>}
      </div>
      <button onClick={onDismiss} style={{ color: 'var(--text-secondary)', flexShrink: 0, padding: '2px' }}>
        <X size={14} />
      </button>
    </div>
  );
}

/* ── Provider ── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts]   = useState<ToastItem[]>([]);
  const [modal, setModal]     = useState<ModalState>({ open: null });
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [employees, setEmployees]       = useState<Employee[]>(initialEmployees);
  const [incentives, setIncentives]     = useState<Incentive[]>([
    { id: 'INC001', employeeId: 'EMP001', employeeName: 'Ananya Sharma', dept: 'Sales', ruleType: 'Revenue Slab', amount: 24500, month: 'Jun 2025', status: 'paid', createdAt: '2025-06-01', updatedAt: '2025-06-10' },
    { id: 'INC002', employeeId: 'EMP003', employeeName: 'Priya Nair', dept: 'Sales', ruleType: 'Revenue Slab', amount: 16800, month: 'Jun 2025', status: 'pending', createdAt: '2025-06-02', updatedAt: '2025-06-08' },
    { id: 'INC003', employeeId: 'EMP004', employeeName: 'Dev Patel', dept: 'Operations', ruleType: 'Zero Absence Bonus', amount: 5000, month: 'Jun 2025', status: 'paid', createdAt: '2025-06-01', updatedAt: '2025-06-10' },
  ]);
  const [commissions, setCommissions] = useState<Commission[]>([
    { id: 'COM001', leadId: 'LEAD001', leadName: 'Ananya Sharma', position: 'Sales Lead', amount: 35000, performance: 'Exceptional', month: 'Jun 2025', status: 'paid', createdAt: '2025-06-01', updatedAt: '2025-06-10' },
    { id: 'COM002', leadId: 'LEAD002', leadName: 'Arjun Kumar', position: 'Team Lead', amount: 28000, performance: 'Excellent', month: 'Jun 2025', status: 'approved', createdAt: '2025-06-03', updatedAt: '2025-06-09' },
    { id: 'COM003', leadId: 'LEAD003', leadName: 'Kavya Singh', position: 'Project Lead', amount: 15000, performance: 'Good', month: 'Jun 2025', status: 'pending', createdAt: '2025-06-05', updatedAt: '2025-06-06' },
  ]);
  const counter = useRef(0);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${++counter.current}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const openModal  = useCallback((id: ModalId, data?: Record<string, unknown>) => setModal({ open: id, data }), []);
  const closeModal = useCallback(() => setModal({ open: null }), []);

  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    setEmployees(prev => {
      const nextId = `EMP0${prev.length + 1}`.padEnd(6, '0');
      return [...prev, { ...emp, id: nextId }];
    });
  }, []);

  const updateEmployee = useCallback((emp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  }, []);

  const addIncentive = useCallback((incentive: Omit<Incentive, 'id'>) => {
    setIncentives(prev => {
      const newId = `INC${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...incentive, id: newId }];
    });
  }, []);

  const updateIncentive = useCallback((incentive: Incentive) => {
    setIncentives(prev => prev.map(i => i.id === incentive.id ? incentive : i));
  }, []);

  const deleteIncentive = useCallback((id: string) => {
    setIncentives(prev => prev.filter(i => i.id !== id));
  }, []);

  const addCommission = useCallback((commission: Omit<Commission, 'id'>) => {
    setCommissions(prev => {
      const newId = `COM${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...commission, id: newId }];
    });
  }, []);

  const updateCommission = useCallback((commission: Commission) => {
    setCommissions(prev => prev.map(c => c.id === commission.id ? commission : c));
  }, []);

  const deleteCommission = useCallback((id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ 
      toast, modal, openModal, closeModal, activeModule, setActiveModule, 
      sidebarOpen, setSidebarOpen, employees, addEmployee, updateEmployee, deleteEmployee,
      incentives, addIncentive, updateIncentive, deleteIncentive,
      commissions, addCommission, updateCommission, deleteCommission
    }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />)}
      </div>
    </Ctx.Provider>
  );
}
