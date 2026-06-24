'use client';
import { useMemo, useState, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { 
  User, Calendar, Clock, CheckCircle, AlertCircle, FileText, 
  ChevronRight, Megaphone, Bell, Banknote, MapPin, Fingerprint
} from 'lucide-react';

interface EmpDashboardProps {
  employee: Employee;
  onNavigate?: (module: any) => void;
}

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', ...style }}>{children}</div>
);

export default function EmpDashboard({ employee, onNavigate }: EmpDashboardProps) {
  const { leaves, attendanceRecords, payrollLocks } = useApp();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Filter leaves and attendance for this specific employee
  const myLeaves = useMemo(() => {
    return leaves.filter((l) => l.employeeId === employee.id);
  }, [leaves, employee.id]);

  const myAttendance = useMemo(() => {
    return attendanceRecords.filter((r) => r.employeeId === employee.id);
  }, [attendanceRecords, employee.id]);

  // Leave Balance Calculations
  const leaveStats = useMemo(() => {
    const totalPL = 12;
    const totalSL = 7;
    const totalCL = 5;

    let usedPL = 0;
    let usedSL = 0;
    let usedCL = 0;

    myLeaves.forEach((l) => {
      if (l.status === 'approved') {
        const days = 1;
        if (l.type === 'PL') usedPL += days;
        if (l.type === 'SL') usedSL += days;
        if (l.type === 'CL') usedCL += days;
      }
    });

    return [
      { name: 'Personal Leave', remaining: totalPL - usedPL, total: totalPL, color: '#4F8EF7' },
      { name: 'Sick Leave', remaining: totalSL - usedSL, total: totalSL, color: '#EF4444' },
      { name: 'Casual Leave', remaining: totalCL - usedCL, total: totalCL, color: '#F59E0B' },
    ];
  }, [myLeaves]);

  // Attendance stats
  const attendanceStats = useMemo(() => {
    const currentMonthRecords = myAttendance;
    const presentCount = currentMonthRecords.filter((r) => r.status === 'present').length;
    const lateCount = currentMonthRecords.filter((r) => r.status === 'late').length;
    const wfhCount = currentMonthRecords.filter((r) => r.status === 'wfh').length;
    const totalDays = currentMonthRecords.length;

    const rate = totalDays > 0 ? Math.round(((presentCount + wfhCount) / totalDays) * 100) : 100;

    return {
      rate,
      present: presentCount,
      late: lateCount,
      wfh: wfhCount,
      total: totalDays,
    };
  }, [myAttendance]);

  const notificationsList = useMemo(() => {
    const list: Array<{ id: string; type: 'payslip' | 'policy' | 'leave'; title: string; time: string; color: string; bg: string; icon: any }> = [];

    // 1. Live Payslip Notification
    if (payrollLocks && payrollLocks.length > 0) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const sortedLocks = [...payrollLocks].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
      const latestLock = sortedLocks[0];
      
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
          if (monthIdx === -1) monthIdx = monthsLong.indexOf(mStr);
          if (monthIdx === -1 && mStr.length >= 3) monthIdx = monthsShort.indexOf(mStr.substring(0, 3));
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && monthIdx > -1 && !isNaN(year)) return new Date(year, monthIdx, day);
        }
        return new Date(2000, 0, 1);
      };
      
      const joinedDate = parseJoinedDate(employee.joined);
      const lockDate = new Date(latestLock.year, latestLock.month - 1, 1);
      
      if (
        lockDate.getFullYear() > joinedDate.getFullYear() ||
        (lockDate.getFullYear() === joinedDate.getFullYear() && lockDate.getMonth() >= joinedDate.getMonth())
      ) {
        list.push({
          id: `payslip-${latestLock.year}-${latestLock.month}`,
          type: 'payslip',
          title: `Payslip for ${months[latestLock.month - 1]} ${latestLock.year} is now available for download.`,
          time: 'Released',
          color: '#D97706',
          bg: '#FEF3C7',
          icon: Banknote
        });
      }
    }

    // 2. Dynamic Leave notifications (approved or rejected)
    const sortedLeaves = [...myLeaves].sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
    sortedLeaves.slice(0, 2).forEach(leave => {
      const isApproved = leave.status === 'approved';
      list.push({
        id: `leave-${leave.id}`,
        type: 'leave',
        title: `Your leave request for ${leave.from} has been ${leave.status} by the Store Manager.`,
        time: `Applied: ${leave.appliedOn}`,
        color: isApproved ? '#059669' : '#DC2626',
        bg: isApproved ? '#D1FAE5' : '#FEE2E2',
        icon: Calendar
      });
    });

    // 3. General store policy
    list.push({
      id: 'policy-store',
      type: 'policy',
      title: 'New Store Policy: Updated guidelines for handling luxury watch inventory.',
      time: '1 day ago',
      color: '#0284C7',
      bg: '#E0F2FE',
      icon: Megaphone
    });

    return list;
  }, [payrollLocks, myLeaves, employee.joined]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      
      {/* Title Greeting Block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 800, letterSpacing: '1px' }}>DASHBOARD OVERVIEW</span>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Welcome, {employee.name.split(' ')[0]}!
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          Your sales floor performance remains at an elite level. Here is your operational status for today.
        </p>
      </div>

      {/* Info Badges Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined Date</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{employee.joined}</span>
        </div>
        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Store Location</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} color="#D97706" /> {employee.location || 'Flagship Boutique'}
          </span>
        </div>
      </div>

      {/* Dark Navy Next Shift Card */}
      <div style={{
        background: '#0F172A',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 4px 15px rgba(15,23,42,0.15)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Next Shift</span>
          <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Clock size={14} color="#FCD34D" /> Today, 10:00 AM - 07:00 PM
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button 
            onClick={() => onNavigate && onNavigate('attendance')}
            style={{
              flex: 1,
              background: '#FCD34D',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: '12.5px',
              padding: '10px 14px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s'
            }}
          >
            <Fingerprint size={14} /> CLOCK IN NOW
          </button>
        </div>
      </div>

      {/* Grid of details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
        
        {/* Attendance Summary */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Clock size={16} color="#D97706" /> Attendance Summary
            </h3>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
              {attendanceStats.rate}% ON-TIME
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {/* Present */}
            <div style={{
              padding: '12px 6px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{attendanceStats.present}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Present</div>
            </div>
            {/* Late */}
            <div style={{
              padding: '12px 6px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{attendanceStats.late}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Late</div>
            </div>
            {/* WFH */}
            <div style={{
              padding: '12px 6px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{attendanceStats.wfh}</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 700 }}>WFH</div>
            </div>
          </div>
          
          <div style={{ 
            fontSize: '11.5px', 
            color: '#059669', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(16,185,129,0.06)', 
            padding: '10px 12px', 
            borderRadius: '8px', 
            border: '1px solid rgba(16,185,129,0.12)' 
          }}>
            <CheckCircle size={14} color="#10B981" />
            <span>Biometric locks synced correctly.</span>
          </div>
        </Card>

        {/* Leave Balances */}
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Calendar size={16} color="#D97706" /> Leave Balances
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaveStats.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                border: '1px solid rgba(15, 23, 42, 0.05)',
                borderRadius: '12px',
                background: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    border: `2px solid ${item.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}>
                    {item.remaining}
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>of {item.total} days available</div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications and recent activities */}
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Bell size={16} color="#D97706" /> Recent Notifications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notificationsList.length === 0 ? (
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                No notifications yet.
              </div>
            ) : (
              notificationsList.map(notif => {
                const Icon = notif.icon;
                return (
                  <div key={notif.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(15, 23, 42, 0.05)',
                    background: '#FFFFFF'
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: notif.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Icon size={14} color={notif.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.4' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {notif.time}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#D97706',
            marginTop: '6px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}>
            VIEW ALL NOTIFICATIONS
          </button>
        </Card>
      </div>
    </div>
  );
}
