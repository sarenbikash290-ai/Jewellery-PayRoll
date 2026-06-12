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
}

const Ctx = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(Ctx);

// ---- Sample Data ----
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
    { id: 'INC001', employeeId: 'EMP001', employeeName: 'Ananya Sharma', dept: 'Sales', ruleType: 'Revenue Slab', amount: 24500, target: 200000, month: 'Jun 2025', status: 'paid', createdAt: '2025-06-01', updatedAt: '2025-06-10' },
    { id: 'INC002', employeeId: 'EMP003', employeeName: 'Priya Nair', dept: 'Sales', ruleType: 'Revenue Slab', amount: 16800, target: 150000, month: 'Jun 2025', status: 'pending', createdAt: '2025-06-02', updatedAt: '2025-06-08' },
    { id: 'INC003', employeeId: 'EMP004', employeeName: 'Dev Patel', dept: 'Operations', ruleType: 'Zero Absence Bonus', amount: 5000, target: 0, month: 'Jun 2025', status: 'paid', createdAt: '2025-06-01', updatedAt: '2025-06-10' },
  ]);
  const [commissions, setCommissions] = useState<Commission[]>([
    { id: 'COM001', leadId: 'LEAD001', leadName: 'Ananya Sharma', position: 'Sales Lead', amount: 35000, performance: 'Exceptional', month: 'Jun 2025', status: 'paid', createdAt: '2025-06-01', updatedAt: '2025-06-10' },
    { id: 'COM002', leadId: 'LEAD002', leadName: 'Arjun Kumar', position: 'Team Lead', amount: 28000, performance: 'Excellent', month: 'Jun 2025', status: 'approved', createdAt: '2025-06-03', updatedAt: '2025-06-09' },
    { id: 'COM003', leadId: 'LEAD003', leadName: 'Kavya Singh', position: 'Project Lead', amount: 15000, performance: 'Good', month: 'Jun 2025', status: 'pending', createdAt: '2025-06-05', updatedAt: '2025-06-06' },
  ]);
  const [employeeSales, setEmployeeSales] = useState<Sale[]>([
    // Ananya Sharma (EMP001) — Sales
    { id: 'SALE001', employeeId: 'EMP001', date: '2025-06-03', product: 'Gold Ring', amount: 45000 },
    { id: 'SALE002', employeeId: 'EMP001', date: '2025-06-07', product: 'Diamond Necklace', amount: 92000 },
    { id: 'SALE003', employeeId: 'EMP001', date: '2025-06-11', product: 'Gold Bangle', amount: 38000 },
    { id: 'SALE004', employeeId: 'EMP001', date: '2025-05-05', product: 'Platinum Ring', amount: 65000 },
    { id: 'SALE005', employeeId: 'EMP001', date: '2025-05-18', product: 'Diamond Bracelet', amount: 88000 },
    { id: 'SALE006', employeeId: 'EMP001', date: '2025-04-12', product: 'Ruby Pendant', amount: 55000 },
    // Priya Nair (EMP003) — Sales
    { id: 'SALE007', employeeId: 'EMP003', date: '2025-06-04', product: 'Silver Earring', amount: 18000 },
    { id: 'SALE008', employeeId: 'EMP003', date: '2025-06-09', product: 'Gold Chain', amount: 42000 },
    { id: 'SALE009', employeeId: 'EMP003', date: '2025-05-20', product: 'Sapphire Ring', amount: 72000 },
    { id: 'SALE010', employeeId: 'EMP003', date: '2025-05-28', product: 'Emerald Set', amount: 95000 },
    // Arjun Kumar (EMP008) — Sales
    { id: 'SALE011', employeeId: 'EMP008', date: '2025-06-02', product: 'Diamond Necklace', amount: 120000 },
    { id: 'SALE012', employeeId: 'EMP008', date: '2025-06-08', product: 'Platinum Ring', amount: 85000 },
    { id: 'SALE013', employeeId: 'EMP008', date: '2025-06-14', product: 'Gold Bangle', amount: 48000 },
    { id: 'SALE014', employeeId: 'EMP008', date: '2025-05-10', product: 'Ruby Pendant', amount: 60000 },
    { id: 'SALE015', employeeId: 'EMP008', date: '2025-04-22', product: 'Diamond Bracelet', amount: 95000 },
  ]);

  // CRUD helpers
  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    setEmployees(prev => {
      const nextId = `EMP${String(prev.length + 1).padStart(3, '0')}`;
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
      }}
    >
      {children}
      {/* Toast Container */}
      <div className="toast-container" style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}>
        {toasts.map(t => (
          <Toast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}
