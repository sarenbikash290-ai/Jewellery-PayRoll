'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from './AppContext';
import { parseTimeToMinutes } from '@/utils/time';
import { Clock, UserCheck, UserX, AlertCircle, Calendar, ChevronLeft, ChevronRight, Fingerprint, MapPin, Monitor, Eye, X, BarChart2, TrendingUp, Bell, Lock, Edit3, ShieldAlert, CheckCircle, ClipboardList, ChevronDown, AlertTriangle } from 'lucide-react';
import type { AttendanceAuditLog } from './AppContext';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Present' },
  late: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Late' },
  absent: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Absent' },
  wfh: { bg: 'rgba(99,179,237,0.12)', text: '#06B6D4', label: 'WFH' },
};
const leaveColors: Record<string, string> = {
  PL: '#4F8EF7', SL: '#EF4444', CL: '#F59E0B', WFH: '#06B6D4'
};
const avatarColors = ['#4F8EF7', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444', '#8B5CF6', '#10B981'];

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>
);

// ─── Calendar Helpers ──────────────────────────────────────────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// Deterministic mock attendance status for any date
function getMockDayStatus(day: number, month: number, year: number): 'present' | 'late' | 'absent' | 'wfh' | 'weekend' | 'future' {
  const date = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) return 'future';
  const dow = date.getDay();
  if (dow === 0) return 'weekend'; // Sunday off

  // Deterministic mock based on date
  const seed = (day * 7 + month * 31 + year) % 20;
  if (seed < 12) return 'present';
  if (seed < 16) return 'late';
  if (seed < 18) return 'absent';
  return 'wfh';
}

const dayStatusDotColor: Record<string, string> = {
  present: '#10B981',
  late: '#F59E0B',
  absent: '#EF4444',
  wfh: '#06B6D4',
  weekend: '#64748B',
  future: 'transparent',
};

// ─── Live Clock Component (isolated re-renders) ───────────────────────────────
function LiveClock({ size = 14, weight = 700, showIcon = false }: { size?: number; weight?: number; showIcon?: boolean }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formatted = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontVariantNumeric: 'tabular-nums' }}>
      {showIcon && <Clock size={14} color="var(--brand)" />}
      <span style={{ fontSize: `${size}px`, fontWeight: weight, color: 'var(--brand)', letterSpacing: '0.5px' }}>{formatted}</span>
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'leaves' | 'audit'>('today');
  const { employees, toast, leaves, updateLeave, openModal, attendanceRecords, editAttendance, isDateEditable, isMonthLocked, auditLogs, fetchAuditLogs } = useApp();
  const currentDate = useMemo(() => new Date(), []);

  // ── Edit Attendance Modal State ─────────────────────────────────────────────
  const [editModal, setEditModal] = useState<{
    open: boolean;
    employeeId: string;
    employeeName: string;
    date: string;
    currentStatus: string;
    currentCheckIn: string | null;
    currentCheckOut: string | null;
    step: 'form' | 'confirm';
  } | null>(null);

  const [editStatus, setEditStatus] = useState<'present' | 'late' | 'absent' | 'wfh'>('present');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const openEditModal = useCallback((employeeId: string, employeeName: string, date: string, currentStatus: string, currentCheckIn: string | null, currentCheckOut: string | null) => {
    setEditStatus((currentStatus as 'present' | 'late' | 'absent' | 'wfh') || 'present');
    setEditCheckIn(currentCheckIn || '');
    setEditCheckOut(currentCheckOut || '');
    setEditReason('');
    setEditError('');
    setEditModal({
      open: true, employeeId, employeeName, date, currentStatus, currentCheckIn, currentCheckOut, step: 'form'
    });
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editModal) return;
    setEditSubmitting(true);
    setEditError('');
    const result = await editAttendance(
      editModal.employeeId,
      editModal.employeeName,
      editModal.date,
      editCheckIn || null,
      editCheckOut || null,
      editStatus,
      editReason.trim() || undefined
    );
    setEditSubmitting(false);
    if (result.ok) {
      setEditModal(null);
    } else {
      setEditError(result.error || 'Failed to update attendance.');
      setEditModal(prev => prev ? { ...prev, step: 'form' } : null);
    }
  }, [editModal, editStatus, editCheckIn, editCheckOut, editReason, editAttendance]);

  // Stable "today" — only recalculates when calendar date changes
  const todayDate = useMemo(() => {
    return { day: currentDate.getDate(), month: currentDate.getMonth(), year: currentDate.getFullYear(), dow: currentDate.getDay() };
  }, [currentDate]);

  const [calYear, setCalYear] = useState(todayDate.year);
  const [calMonth, setCalMonth] = useState(todayDate.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Navigate months
  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }, [calMonth]);

  const goToToday = useCallback(() => {
    const d = new Date();
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setSelectedDay(null);
  }, []);

  // Build calendar grid (only recalculates when month/year changes or records update)
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const cells: { day: number; status: string }[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: 0, status: '' });
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecords = attendanceRecords.filter(r => r.date === dateStr);

      let status: string;
      if (dayRecords.length > 0) {
        const late = dayRecords.filter(r => r.status === 'late').length;
        const present = dayRecords.filter(r => r.status === 'present').length;
        const wfh = dayRecords.filter(r => r.status === 'wfh').length;
        if (late > 0) status = 'late';
        else if (present > 0) status = 'present';
        else if (wfh > 0) status = 'wfh';
        else status = 'absent';
      } else {
        status = getMockDayStatus(d, calMonth, calYear);
      }

      cells.push({ day: d, status });
    }
    // Trailing empty cells to fill last row
    while (cells.length % 7 !== 0) {
      cells.push({ day: 0, status: '' });
    }
    return cells;
  }, [calYear, calMonth, attendanceRecords]);

  // Day summary for selected day (only recalculates when selection changes or records update)
  const selectedDaySummary = useMemo(() => {
    if (selectedDay === null) return null;
    const selDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const statuses = employees.map((emp, idx) => {
      // 1. Check for real attendance record
      const realRecord = attendanceRecords.find(r => r.employeeId === emp.id && r.date === selDateStr);
      if (realRecord) {
        return { id: emp.id, name: emp.name, dept: emp.dept, status: realRecord.status };
      }

      // 2. Check for approved leave
      const leave = leaves.find(l =>
        l.employeeId === emp.id &&
        l.status === 'approved' &&
        selDateStr >= l.from &&
        selDateStr <= l.to
      );
      if (leave) {
        return { id: emp.id, name: emp.name, dept: emp.dept, status: (leave.type === 'WFH' ? 'wfh' : 'absent') as 'wfh' | 'absent' };
      }

      // If it is the current local day, and there's no real record, they are absent/not checked in yet
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      if (selDateStr === todayStr) {
        return { id: emp.id, name: emp.name, dept: emp.dept, status: 'absent' as const };
      }

      // Otherwise, fallback to deterministic mock
      const seed = (selectedDay * 7 + calMonth * 31 + calYear + idx * 3) % 20;
      const dow = new Date(calYear, calMonth, selectedDay).getDay();
      if (dow === 0) return { id: emp.id, name: emp.name, dept: emp.dept, status: 'weekend' as const };
      let status: 'present' | 'late' | 'absent' | 'wfh';
      if (seed < 12) status = 'present';
      else if (seed < 16) status = 'late';
      else if (seed < 18) status = 'absent';
      else status = 'wfh';
      return { id: emp.id, name: emp.name, dept: emp.dept, status };
    });
    const presentCount = statuses.filter(s => s.status === 'present').length;
    const lateCount = statuses.filter(s => s.status === 'late').length;
    const absentCount = statuses.filter(s => s.status === 'absent').length;
    const wfhCount = statuses.filter(s => s.status === 'wfh').length;
    const isWeekend = statuses.every(s => s.status === 'weekend');
    return { statuses, presentCount, lateCount, absentCount, wfhCount, isWeekend };
  }, [selectedDay, calMonth, calYear, employees, attendanceRecords, leaves, currentDate]);

  // Is current calendar on the current month?
  const isCurrentMonth = calYear === todayDate.year && calMonth === todayDate.month;

  // Memoized attendance data (prioritizes real server records, falls back to absent)
  const attendanceData = useMemo(() => employees.map((emp, index) => {
    // 1. Get today's local date string
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Check for real today's attendance record
    const realRecord = attendanceRecords.find(r => r.employeeId === emp.id && r.date === todayStr);

    // 2. Check for today's approved leave
    const todayLeave = leaves.find(l =>
      l.employeeId === emp.id &&
      l.status === 'approved' &&
      todayStr >= l.from &&
      todayStr <= l.to
    );

    // If there is a real server record for today, use it!
    if (realRecord) {
      // Calculate hours if both checkIn and checkOut exist
      let hours: number | null = null;
      if (realRecord.checkIn && realRecord.checkOut) {
        try {
          const diff = parseTimeToMinutes(realRecord.checkOut) - parseTimeToMinutes(realRecord.checkIn);
          if (diff > 0) {
            hours = parseFloat((diff / 60).toFixed(1));
          }
        } catch { }
      }

      return {
        id: emp.id,
        name: emp.name,
        dept: emp.dept,
        checkIn: realRecord.checkIn ? realRecord.checkIn.replace(' AM', '').replace(' PM', '') : null,
        checkOut: realRecord.checkOut ? realRecord.checkOut.replace(' AM', '').replace(' PM', '') : null,
        status: realRecord.status,
        hours,
        leave: todayLeave ? todayLeave.type : null,
        source: 'Mobile App',
        icon: MapPin,
        color: '#4F8EF7'
      };
    }

    // If there's an approved leave, override status to absent or wfh and show leave type
    if (todayLeave) {
      const isWFH = todayLeave.type === 'WFH';
      return {
        id: emp.id, name: emp.name, dept: emp.dept,
        checkIn: null, checkOut: null,
        status: isWFH ? 'wfh' : 'absent',
        hours: 0,
        leave: todayLeave.type,
        source: '—',
        icon: null,
        color: 'transparent'
      };
    }

    // Otherwise, they start fresh (refreshed every day) as absent/not checked in
    return {
      id: emp.id, name: emp.name, dept: emp.dept,
      checkIn: null, checkOut: null,
      status: 'absent', hours: null, leave: null,
      source: '—', icon: null, color: 'transparent'
    };
  }), [employees, attendanceRecords, leaves, currentDate]);

  const presentCount = attendanceData.filter(e => e.status === 'present').length;
  const lateCount = attendanceData.filter(e => e.status === 'late').length;
  const absentCount = attendanceData.filter(e => e.status === 'absent').length;
  const wfhCount = attendanceData.filter(e => e.status === 'wfh').length;

  // ── Late arrivals: employees not yet checked in after 10:00 AM ──────────────
  const lateAlerts = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    // After 10:00 AM — flag all absent/pending as late alerts
    if (currentHour < 10) return [];
    return attendanceData.filter(e => !e.checkIn && e.status !== 'wfh');
  }, [attendanceData]);

  // ── Analytics: last 30 days dept-wise & per-employee stats ─────────────────
  const analyticsData = useMemo(() => {
    const depts = [...new Set(employees.map(e => e.dept))];
    return depts.map(dept => {
      const deptEmps = employees.filter(e => e.dept === dept);
      // deterministic 30-day present count per employee
      let totalPresent = 0, totalDays = 0;
      deptEmps.forEach((_, ei) => {
        for (let ago = 0; ago < 26; ago++) {
          const d = new Date(); d.setDate(d.getDate() - ago);
          if (d.getDay() === 0) continue;
          totalDays++;
          const seed = (ei * 7 + ago * 13) % 10;
          if (seed < 8) totalPresent++;
        }
      });
      const pct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
      return { dept, pct, count: deptEmps.length };
    });
  }, [employees]);

  // ── Monthly report: per-employee stats for current month ───────────────────
  const monthlyReport = useMemo(() => {
    const daysInMonth = getDaysInMonth(todayDate.year, todayDate.month);
    const workingDaysSoFar = Array.from({ length: Math.min(todayDate.day, daysInMonth) }, (_, i) => i + 1)
      .filter(d => new Date(todayDate.year, todayDate.month, d).getDay() !== 0).length;

    return employees.map((emp, ei) => {
      let present = 0, late = 0, absent = 0, wfh = 0;
      for (let d = 1; d <= Math.min(todayDate.day, daysInMonth); d++) {
        const dow = new Date(todayDate.year, todayDate.month, d).getDay();
        if (dow === 0) continue;
        const seed = (ei * 7 + (todayDate.day - d) * 13) % 10;
        if (seed < 6) present++;
        else if (seed < 8) late++;
        else if (seed === 8) { absent++; }
        else wfh++;
      }
      const attendancePct = workingDaysSoFar > 0
        ? Math.round(((present + late + wfh) / workingDaysSoFar) * 100) : 0;
      return { id: emp.id, name: emp.name, dept: emp.dept, present, late, absent, wfh, attendancePct };
    });
  }, [employees, todayDate]);

  // Header date string (stable, doesn't tick)
  const headerDate = `${DAY_NAMES_FULL[todayDate.dow]}, ${todayDate.day} ${MONTH_NAMES[todayDate.month]} ${todayDate.year}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Attendance & Time Tracking</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{headerDate} · <LiveClock size={13} weight={600} /></p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px',
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
          }}>
            <LiveClock size={14} weight={700} showIcon />
          </div>
          <button
            onClick={() => toast('info', 'Live Biometric Sync', 'Biometric & GPS sync is active. Attendance updates in real-time.')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10B981', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            Live Sync
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { icon: UserCheck, label: 'Present', value: presentCount, total: employees.length, color: '#10B981' },
          { icon: AlertCircle, label: 'Late', value: lateCount, total: employees.length, color: '#F59E0B' },
          { icon: UserX, label: 'Absent', value: absentCount, total: employees.length, color: '#EF4444' },
          { icon: Clock, label: 'WFH', value: wfhCount, total: employees.length, color: '#06B6D4' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          const pct = Math.round((stat.value / stat.total) * 100);
          return (
            <Card key={i} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: `${stat.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={stat.color} />
                </div>
                <span style={{ fontSize: '12px', color: stat.color, fontWeight: 700 }}>{pct}%</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{stat.label} today</div>
              <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: stat.color, borderRadius: '2px', transition: 'width 1s ease' }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { id: 'today', label: "Today's Log" },
          { id: 'calendar', label: 'Calendar' },
          { id: 'leaves', label: 'Leave Requests' },
          { id: 'audit', label: 'Audit Log' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as typeof activeTab); if (tab.id === 'audit') fetchAuditLogs(); }}
            style={{ padding: '8px 20px', borderRadius: '8px', background: activeTab === tab.id ? 'var(--brand)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap', border: 'none' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today's Log */}
      {activeTab === 'today' && (
        <Card>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Live Attendance — {headerDate}</span>
            <LiveClock size={12} weight={600} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Employee', 'Dept', 'Check In', 'Check Out', 'Hours', 'Marking Source', 'Leave Type', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((emp, i) => {
                  const SrcIcon = emp.icon;
                  return (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      onClick={() => {
                        const fullEmp = employees.find(e => e.id === emp.id);
                        if (fullEmp) openModal('viewEmployee', fullEmp);
                      }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', background: avatarColors[i % avatarColors.length], borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{emp.dept}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: emp.checkIn ? 500 : 400, color: emp.checkIn ? '#10B981' : 'var(--text-muted)' }}>{emp.checkIn || '—'}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: emp.checkOut ? 'var(--text-primary)' : 'var(--text-muted)' }}>{emp.checkOut || (emp.status === 'present' || emp.status === 'late' ? '...' : '—')}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: emp.hours ? 'var(--text-primary)' : 'var(--text-muted)' }}>{emp.hours ? `${emp.hours}h` : '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        {emp.source !== '—' && SrcIcon ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600,
                            padding: '4px 10px', borderRadius: '100px',
                            background: `${emp.color}18`, color: emp.color,
                            border: `1px solid ${emp.color}25`
                          }}>
                            <SrcIcon size={12} />
                            {emp.source}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {emp.leave ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: `${leaveColors[emp.leave]}18`, color: leaveColors[emp.leave] }}>{emp.leave}</span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: statusColors[emp.status].bg, color: statusColors[emp.status].text }}>
                          {statusColors[emp.status].label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── Dynamic Calendar ─── */}
      {activeTab === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedDay !== null ? '1fr 340px' : '1fr', gap: '20px', transition: 'all 0.3s ease' }}>
          <Card style={{ padding: '28px' }}>
            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{MONTH_NAMES[calMonth]} {calYear}</h3>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={prevMonth}
                  style={{
                    width: '34px', height: '34px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)', transition: 'var(--transition)'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-brand)'; (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={goToToday}
                  style={{
                    padding: '0 14px', height: '34px', borderRadius: '8px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    transition: 'var(--transition)',
                    background: isCurrentMonth ? 'var(--bg-elevated)' : 'rgba(79,142,247,0.1)',
                    color: isCurrentMonth ? 'var(--text-muted)' : 'var(--brand)',
                    border: isCurrentMonth ? '1px solid var(--border)' : '1px solid rgba(79,142,247,0.25)',
                    opacity: isCurrentMonth ? 0.5 : 1,
                    pointerEvents: isCurrentMonth ? 'none' : 'auto',
                  }}
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  style={{
                    width: '34px', height: '34px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)', transition: 'var(--transition)'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-brand)'; (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {DAY_NAMES_SHORT.map(d => (
                <div key={d} style={{
                  textAlign: 'center', fontSize: '11px', fontWeight: 700,
                  color: d === 'Sun' ? 'var(--danger)' : 'var(--text-muted)',
                  letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 0'
                }}>{d}</div>
              ))}

              {/* Day Cells */}
              {calendarGrid.map((cell, i) => {
                const isEmpty = cell.day === 0;
                const isTodayCell = isCurrentMonth && cell.day === todayDate.day;
                const isSelected = cell.day === selectedDay && !isEmpty;
                const isFuture = cell.status === 'future';
                const isWeekend = cell.status === 'weekend';
                const dotColor = dayStatusDotColor[cell.status] || 'transparent';
                const dayOfWeek = isEmpty ? -1 : new Date(calYear, calMonth, cell.day).getDay();
                const isSunday = dayOfWeek === 0;

                // Lock indicators for calendar cells
                const cellDateStr = !isEmpty ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}` : '';
                const cellEditInfo = !isEmpty && !isFuture ? isDateEditable(cellDateStr) : null;
                const cellPayrollLocked = !isEmpty && !isFuture && isMonthLocked(calYear, calMonth + 1);

                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!isEmpty && !isFuture) {
                        setSelectedDay(isSelected ? null : cell.day);
                      }
                    }}
                    style={{
                      textAlign: 'center',
                      padding: '10px 4px 8px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: isTodayCell ? 700 : isSelected ? 600 : 400,
                      background: isTodayCell
                        ? 'var(--brand)'
                        : isSelected
                          ? 'rgba(79,142,247,0.12)'
                          : isEmpty
                            ? 'transparent'
                            : 'var(--bg-elevated)',
                      color: isTodayCell
                        ? '#fff'
                        : isEmpty
                          ? 'transparent'
                          : isFuture
                            ? 'var(--text-muted)'
                            : isSunday
                              ? 'var(--danger)'
                              : 'var(--text-secondary)',
                      cursor: !isEmpty && !isFuture ? 'pointer' : 'default',
                      border: isSelected && !isTodayCell
                        ? '1px solid var(--border-brand)'
                        : isTodayCell
                          ? '1px solid var(--brand)'
                          : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      opacity: isFuture ? 0.4 : 1,
                      position: 'relative',
                      minHeight: '48px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={e => {
                      if (!isEmpty && !isFuture && !isTodayCell) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(79,142,247,0.08)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-brand)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isEmpty && !isFuture && !isTodayCell) {
                        (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(79,142,247,0.12)' : 'var(--bg-elevated)';
                        (e.currentTarget as HTMLElement).style.borderColor = isSelected ? 'var(--border-brand)' : 'transparent';
                      }
                    }}
                  >
                    {!isEmpty && <span>{cell.day}</span>}
                    {!isEmpty && !isFuture && !isWeekend && (
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: isTodayCell ? 'rgba(255,255,255,0.7)' : dotColor,
                        flexShrink: 0
                      }} />
                    )}
                    {isWeekend && !isEmpty && (
                      <div style={{ fontSize: '8px', color: isTodayCell ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', lineHeight: 1 }}>OFF</div>
                    )}
                    {/* Lock badge on day cell */}
                    {!isEmpty && !isFuture && !isWeekend && cellPayrollLocked && (
                      <div title="Payroll Locked" style={{ fontSize: '7px', color: isTodayCell ? 'rgba(255,255,255,0.7)' : '#EF4444', lineHeight: 1 }}>🔒</div>
                    )}
                    {!isEmpty && !isFuture && !isWeekend && !cellPayrollLocked && cellEditInfo && !cellEditInfo.editable && cellEditInfo.lockType === 'editWindow' && (
                      <div title="Edit window expired" style={{ fontSize: '7px', color: isTodayCell ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', lineHeight: 1 }}>🔐</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {[
                { color: '#10B981', label: 'Present' },
                { color: '#F59E0B', label: 'Late' },
                { color: '#EF4444', label: 'Absent' },
                { color: '#06B6D4', label: 'WFH / Leave' },
                { color: '#64748B', label: 'Weekend / Off' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '8px', height: '8px', background: l.color, borderRadius: '50%' }} />{l.label}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>🔒</span> Payroll Locked
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>🔐</span> Edit Window Expired
              </div>
            </div>
          </Card>

          {/* ─── Day Detail Panel ─── */}
          {selectedDay !== null && selectedDaySummary && (
            <Card style={{ padding: '0', overflow: 'hidden', alignSelf: 'flex-start', position: 'sticky', top: '24px' }}>
              {/* Panel Header */}
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(79,142,247,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedDay} {MONTH_NAMES[calMonth].slice(0, 3)} {calYear}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {DAY_NAMES_FULL[new Date(calYear, calMonth, selectedDay).getDay()]}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: 'var(--bg-hover)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {selectedDaySummary.isWeekend ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Sunday — Weekly Off</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>No attendance recorded</div>
                </div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    {[
                      { label: 'Present', value: selectedDaySummary.presentCount, color: '#10B981' },
                      { label: 'Late', value: selectedDaySummary.lateCount, color: '#F59E0B' },
                      { label: 'Absent', value: selectedDaySummary.absentCount, color: '#EF4444' },
                      { label: 'WFH', value: selectedDaySummary.wfhCount, color: '#06B6D4' },
                    ].map(s => (
                      <div key={s.label} style={{
                        padding: '8px 10px', borderRadius: '8px',
                        background: `${s.color}12`, border: `1px solid ${s.color}25`,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Employee List */}
                  <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px 0' }}>
                    {selectedDaySummary.statuses.map((emp, idx) => {
                      const sc = statusColors[emp.status];
                      const fullEmp = employees.find(e => e.id === emp.id);
                      return (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 16px', transition: 'background 0.1s', cursor: 'pointer'
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          onClick={() => fullEmp && openModal('viewEmployee', fullEmp)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '6px',
                              background: avatarColors[idx % avatarColors.length],
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0
                            }}>{emp.name.charAt(0)}</div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.dept}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {sc && (
                              <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                                borderRadius: '100px', background: sc.bg, color: sc.text
                              }}>{sc.label}</span>
                            )}
                            {/* Edit Button for this employee+day */}
                            {(() => {
                              const selDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                              const editInfo = isDateEditable(selDateStr);
                              const realRecord = attendanceRecords.find(r => r.employeeId === emp.id && r.date === selDateStr);
                              if (editInfo.editable) {
                                return (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      openEditModal(
                                        emp.id, emp.name, selDateStr,
                                        emp.status, realRecord?.checkIn || null, realRecord?.checkOut || null
                                      );
                                    }}
                                    title="Edit attendance"
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '4px',
                                      padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 600,
                                      background: 'rgba(79,142,247,0.12)', color: 'var(--brand)',
                                      border: '1px solid rgba(79,142,247,0.25)', cursor: 'pointer'
                                    }}
                                  >
                                    <Edit3 size={10} /> Edit
                                  </button>
                                );
                              } else {
                                return (
                                  <span
                                    title={editInfo.reason}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '3px',
                                      padding: '3px 7px', borderRadius: '5px', fontSize: '9px', fontWeight: 600,
                                      background: editInfo.lockType === 'payrollLocked' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                                      color: editInfo.lockType === 'payrollLocked' ? '#EF4444' : 'var(--text-muted)',
                                      border: '1px solid transparent', cursor: 'default'
                                    }}
                                  >
                                    <Lock size={8} />
                                    {editInfo.lockType === 'payrollLocked' ? 'Finalized' : 'Read-only'}
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === 'leaves' && (
        <Card>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Employee Leave Requests</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Employee', 'Leave Type', 'From Date', 'To Date', 'Reason', 'Applied On', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No leave applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  [...leaves].reverse().map((leave, i) => {
                    const statusBadgeColors = {
                      pending: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
                      approved: { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
                      rejected: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
                    }[leave.status];

                    return (
                      <tr key={leave.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td
                          style={{ padding: '14px 20px', cursor: 'pointer', transition: 'background 0.2s' }}
                          onClick={() => {
                            const fullEmp = employees.find(e => e.id === leave.employeeId);
                            if (fullEmp) openModal('viewEmployee', fullEmp);
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: avatarColors[i % avatarColors.length], borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{leave.employeeName.charAt(0)}</div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{leave.employeeName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{leave.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: 'rgba(79,142,247,0.12)', color: 'var(--brand)' }}>
                            {leave.type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-primary)' }}>{leave.from}</td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-primary)' }}>{leave.to}</td>
                        <td style={{ padding: '14px 20px', fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{leave.appliedOn}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: statusBadgeColors.bg, color: statusBadgeColors.text }}>
                            {leave.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {leave.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => updateLeave(leave.id, 'approved')}
                                style={{
                                  padding: '6px 12px', borderRadius: '6px', background: 'rgba(16,185,129,0.12)', border: 'none', color: '#10B981', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateLeave(leave.id, 'rejected')}
                                style={{
                                  padding: '6px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.12)', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── Audit Log Tab ─── */}
      {activeTab === 'audit' && (
        <Card>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} color="var(--brand)" /> Attendance Audit Log
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{auditLogs.length} entries</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {auditLogs.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ClipboardList size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No audit entries yet</div>
                <div style={{ fontSize: '12px' }}>Attendance corrections made by admins will appear here.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Employee', 'Date', 'Previous Status', 'New Status', 'Check-In', 'Check-Out', 'Edited By', 'Timestamp', 'Reason'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => {
                    const prevColor = log.previousStatus ? (statusColors[log.previousStatus] || { bg: 'rgba(100,116,139,0.12)', text: '#64748B' }) : null;
                    const newColor = statusColors[log.newStatus] || { bg: 'rgba(100,116,139,0.12)', text: '#64748B' };
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', background: avatarColors[i % avatarColors.length], borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{log.employeeName.charAt(0)}</div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{log.employeeName}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{log.attendanceDate}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {prevColor ? (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '100px', background: prevColor.bg, color: prevColor.text }}>
                              {log.previousStatus}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>New Record</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '100px', background: newColor.bg, color: newColor.text }}>
                            {log.newStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {log.checkInBefore && <span style={{ color: 'var(--text-secondary)' }}>{log.checkInBefore}</span>}
                          {log.checkInBefore && log.checkInAfter && log.checkInBefore !== log.checkInAfter && (
                            <> → <span style={{ color: '#10B981', fontWeight: 600 }}>{log.checkInAfter}</span></>
                          )}
                          {!log.checkInBefore && log.checkInAfter && <span style={{ color: '#10B981', fontWeight: 600 }}>{log.checkInAfter}</span>}
                          {!log.checkInBefore && !log.checkInAfter && '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {log.checkOutBefore && <span style={{ color: 'var(--text-secondary)' }}>{log.checkOutBefore}</span>}
                          {log.checkOutBefore && log.checkOutAfter && log.checkOutBefore !== log.checkOutAfter && (
                            <> → <span style={{ color: '#10B981', fontWeight: 600 }}>{log.checkOutAfter}</span></>
                          )}
                          {!log.checkOutBefore && log.checkOutAfter && <span style={{ color: '#10B981', fontWeight: 600 }}>{log.checkOutAfter}</span>}
                          {!log.checkOutBefore && !log.checkOutAfter && '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px', background: 'rgba(79,142,247,0.1)', color: 'var(--brand)' }}>
                            {log.editedBy}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.editTimestamp).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          })}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.reason || ''}>
                          {log.reason || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* ─── Edit Attendance Modal ─── */}
      {editModal?.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', width: '480px', maxWidth: '95vw',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            animation: 'slideInModal 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(139,92,246,0.05) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={16} color="var(--brand)" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Attendance</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{editModal.employeeName} · {editModal.date}</div>
                </div>
              </div>
              <button onClick={() => setEditModal(null)} style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {editModal.step === 'form' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {editError && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <AlertTriangle size={15} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span style={{ fontSize: '12px', color: '#EF4444', lineHeight: 1.5 }}>{editError}</span>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>ATTENDANCE STATUS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {(['present', 'late', 'absent', 'wfh'] as const).map(s => (
                        <button key={s} onClick={() => setEditStatus(s)} style={{
                          padding: '10px 4px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: editStatus === s ? (statusColors[s]?.bg || 'rgba(79,142,247,0.12)') : 'var(--bg-elevated)',
                          color: editStatus === s ? (statusColors[s]?.text || 'var(--brand)') : 'var(--text-secondary)',
                          border: editStatus === s ? `1px solid ${statusColors[s]?.text || 'var(--brand)'}40` : '1px solid var(--border)'
                        }}>
                          {statusColors[s]?.label || s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Times */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>CHECK-IN TIME</label>
                      <input
                        type="time"
                        value={editCheckIn}
                        onChange={e => setEditCheckIn(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = 'var(--border-brand)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>CHECK-OUT TIME</label>
                      <input
                        type="time"
                        value={editCheckOut}
                        onChange={e => setEditCheckOut(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = 'var(--border-brand)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>REASON FOR CHANGE <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(recommended)</span></label>
                    <textarea
                      value={editReason}
                      onChange={e => setEditReason(e.target.value)}
                      placeholder="e.g. Biometric failure, manual correction requested by employee"
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--border-brand)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                  </div>

                  {/* Audit Trail Notice */}
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <ShieldAlert size={13} color="var(--brand)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>This change will be permanently logged in the audit trail and cannot be deleted.</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditModal(null)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => setEditModal(prev => prev ? { ...prev, step: 'confirm' } : null)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,142,247,0.35)' }}>
                      Review & Confirm
                    </button>
                  </div>
                </div>
              ) : (
                /* Confirmation Step */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <AlertTriangle size={16} color="#F59E0B" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>Confirm Attendance Change</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Employee</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{editModal.employeeName}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Date</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{editModal.date}</div>
                      <div style={{ color: 'var(--text-muted)' }}>Status Change</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {editModal.currentStatus && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: statusColors[editModal.currentStatus]?.bg, color: statusColors[editModal.currentStatus]?.text }}>{statusColors[editModal.currentStatus]?.label}</span>}
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: statusColors[editStatus]?.bg, color: statusColors[editStatus]?.text }}>{statusColors[editStatus]?.label}</span>
                      </div>
                      {(editCheckIn || editCheckOut) && <>
                        <div style={{ color: 'var(--text-muted)' }}>Times</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '11px' }}>{editCheckIn || '—'} → {editCheckOut || '—'}</div>
                      </>}
                      {editReason && <>
                        <div style={{ color: 'var(--text-muted)' }}>Reason</div>
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '11px' }}>{editReason}</div>
                      </>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditModal(prev => prev ? { ...prev, step: 'form' } : null)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                    <button
                      disabled={editSubmitting}
                      onClick={handleEditSubmit}
                      style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 24px', borderRadius: '8px', background: editSubmitting ? 'rgba(79,142,247,0.5)' : '#10B981', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: editSubmitting ? 'not-allowed' : 'pointer', boxShadow: editSubmitting ? 'none' : '0 4px 14px rgba(16,185,129,0.35)' }}
                    >
                      {editSubmitting ? <><div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving…</> : <><CheckCircle size={14} />Confirm & Save</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInModal { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
