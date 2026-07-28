'use client';
import { useMemo, useState, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { 
  User, Calendar, Clock, CheckCircle, AlertCircle, FileText, 
  ChevronRight, Megaphone, Bell, Banknote, MapPin, Fingerprint,
  TrendingUp, AlertTriangle, DollarSign, Activity, Award, ShoppingBag
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
  const { leaves, attendanceRecords, payrollLocks, employeeSales, commissions, monthlySalesTarget } = useApp();
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Update clock ticker
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 15000); // every 15s
    return () => clearInterval(id);
  }, []);

  // Timezone-safe date matching
  const currentMonthStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(currentTime).substring(0, 7); // "YYYY-MM"
  }, [currentTime]);

  const currentMonthName = useMemo(() => {
    return currentTime.toLocaleString('en-US', { month: 'long' });
  }, [currentTime]);

  // Filter leaves and attendance for this specific employee
  const myLeaves = useMemo(() => {
    return leaves.filter((l) => l.employeeId === employee.id);
  }, [leaves, employee.id]);

  const myAttendance = useMemo(() => {
    return attendanceRecords.filter((r) => r.employeeId === employee.id);
  }, [attendanceRecords, employee.id]);

  // Parse salary safely
  const salaryVal = useMemo(() => {
    const salStr = employee.salary;
    if (!salStr || typeof salStr !== 'string') {
      if (typeof salStr === 'number') return salStr;
      return 50000;
    }
    const clean = salStr.replace(/[^\d]/g, '');
    const val = parseInt(clean, 10);
    return isNaN(val) ? 50000 : val;
  }, [employee.salary]);

  // Attendance stats for current month
  const attendanceStats = useMemo(() => {
    const currentMonthRecords = myAttendance.filter(r => r.date.startsWith(currentMonthStr));
    const presentCount = currentMonthRecords.filter((r) => r.status === 'present').length;
    const lateCount = currentMonthRecords.filter((r) => r.status === 'late').length;
    const wfhCount = currentMonthRecords.filter((r) => r.status === 'wfh').length;
    const absentCount = currentMonthRecords.filter((r) => r.status === 'absent').length;
    const totalDays = currentMonthRecords.length;

    const rate = totalDays > 0 ? Math.round(((presentCount + wfhCount) / totalDays) * 100) : 0;

    return {
      rate,
      present: presentCount,
      late: lateCount,
      wfh: wfhCount,
      absent: absentCount,
      total: totalDays,
    };
  }, [myAttendance, currentMonthStr]);

  // Monthly sales & target calculations
  const SALES_TARGET = monthlySalesTarget || 500000;

  const salesStats = useMemo(() => {
    const myMonthSales = employeeSales.filter(
      s => s.employeeId === employee.id && s.date.startsWith(currentMonthStr)
    );
    const totalSales = myMonthSales.reduce((sum, s) => sum + s.amount, 0);
    const achievementPct = Math.min(100, Math.round((totalSales / SALES_TARGET) * 100));
    
    // Earned commission this month
    const myMonthCommission = commissions
      .filter(c => (c.leadId === employee.id || c.leadName.toLowerCase() === employee.name.toLowerCase()) && c.month.includes(currentMonthName.slice(0, 3)))
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      sales: totalSales,
      target: SALES_TARGET,
      pct: achievementPct,
      salesCount: myMonthSales.length,
      commission: myMonthCommission,
      recent: myMonthSales.slice(0, 5)
    };
  }, [employeeSales, commissions, employee.id, employee.name, currentMonthStr, currentMonthName, SALES_TARGET]);

  // Salary deduction calculations
  const salaryDeductions = useMemo(() => {
    const absentDays = attendanceStats.absent;
    const lopLeavesCount = myLeaves.filter(
      l => l.status === 'approved' &&
           l.from.startsWith(currentMonthStr) &&
           ((l.type as string) === 'unpaid' || (l.type as string) === 'LOP' || l.reason.toLowerCase().includes('unpaid') || l.reason.toLowerCase().includes('lop'))
    ).length;

    const totalAbsentOrLop = absentDays + lopLeavesCount;
    const lopDeduction = Math.round((salaryVal / 30) * totalAbsentOrLop);

    return {
      absentDays,
      lopLeavesCount,
      totalDeductionDays: totalAbsentOrLop,
      lopDeduction
    };
  }, [attendanceStats, myLeaves, salaryVal, currentMonthStr]);

  // Lunch break alerts (12:30 PM - 01:30 PM Asia/Kolkata)
  const lunchBreakStatus = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(currentTime);
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const totalMinutes = hour * 60 + minute;

      // 12:30 PM is 750 mins, 01:30 PM is 810 mins
      const start = 750;
      const end = 810;

      const isActive = totalMinutes >= start && totalMinutes <= end;
      const isApproaching = totalMinutes >= start - 30 && totalMinutes < start;
      const minutesToStart = start - totalMinutes;

      return {
        isActive,
        isApproaching,
        minutesToStart
      };
    } catch {
      return { isActive: false, isApproaching: false, minutesToStart: 0 };
    }
  }, [currentTime]);

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

    // 3. Dynamic Lunch Break status
    if (lunchBreakStatus.isActive) {
      list.push({
        id: 'lunch-active-notif',
        type: 'policy',
        title: 'Lunch Break Active: Enjoy your break! Please return and clock in by 01:30 PM.',
        time: 'Now',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        icon: Clock
      });
    } else if (lunchBreakStatus.isApproaching) {
      list.push({
        id: 'lunch-approaching-notif',
        type: 'policy',
        title: `Lunch break starts in ${lunchBreakStatus.minutesToStart} minutes (12:30 PM).`,
        time: 'Soon',
        color: '#D97706',
        bg: '#FEF3C7',
        icon: Clock
      });
    } else {
      list.push({
        id: 'lunch-schedule-notif',
        type: 'policy',
        title: 'Daily Lunch Break Schedule: 12:30 PM to 01:30 PM.',
        time: 'Scheduled',
        color: '#4F8EF7',
        bg: '#E0F2FE',
        icon: Clock
      });
    }

    // 4. Dynamic Loss of Pay alert
    if (salaryDeductions.lopDeduction > 0) {
      list.push({
        id: 'deduction-alert-notif',
        type: 'leave',
        title: `Loss of Pay Warning: Estimated ₹${salaryDeductions.lopDeduction.toLocaleString('en-IN')} deduction due to ${salaryDeductions.totalDeductionDays} absent/unpaid days.`,
        time: 'Alert',
        color: '#EF4444',
        bg: '#FEE2E2',
        icon: AlertCircle
      });
    }

    // 5. General store policy
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
  }, [payrollLocks, myLeaves, employee.joined, lunchBreakStatus, salaryDeductions]);

  // Overall performance tier rating
  const performanceTier = useMemo(() => {
    if (salesStats.pct >= 90 && attendanceStats.rate >= 95) return { label: 'Elite Performer', color: '#10B981', desc: 'Outstanding sales and exemplary attendance!' };
    if (salesStats.pct >= 70 && attendanceStats.rate >= 85) return { label: 'On Track', color: '#4F8EF7', desc: 'Performing solid and hitting targets.' };
    return { label: 'Needs Improvement', color: '#EF4444', desc: 'Failing to meet sales target or attendance guidelines.' };
  }, [salesStats.pct, attendanceStats.rate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      
      {/* Lunch break banner */}
      {lunchBreakStatus.isActive && (
        <div style={{
          background: 'linear-gradient(135deg, #4F8EF7 0%, #8B5CF6 100%)',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(79, 142, 247, 0.25)',
          animation: 'pulse 2s infinite'
        }}>
          <span style={{ fontSize: '20px' }}>🍽️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700 }}>Lunch Break Is Active!</div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
              Your lunch schedule is 12:30 PM to 01:30 PM. Please enjoy your break and log back in on time.
            </div>
          </div>
        </div>
      )}

      {/* Lunch break approaching alert */}
      {lunchBreakStatus.isApproaching && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#D97706',
          padding: '12px 18px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Clock size={16} color="#D97706" />
          <div style={{ fontSize: '12px', fontWeight: 600 }}>
            Lunch break starts in {lunchBreakStatus.minutesToStart} minutes (12:30 PM - 01:30 PM).
          </div>
        </div>
      )}

      {/* Title Greeting Block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 800, letterSpacing: '1px' }}>DASHBOARD OVERVIEW</span>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Welcome, {employee.name.split(' ')[0]}!
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          {performanceTier.desc}
        </p>
      </div>

      {/* Warning Cards for Deductions / Performance Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Red Alert: Salary Deduction Active */}
        {salaryDeductions.lopDeduction > 0 && (
          <div className="glass-card" style={{
            borderColor: 'rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.04)',
            padding: '16px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#EF4444' }}>Salary Deduction Warning</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                You have accrued **{salaryDeductions.totalDeductionDays} absent/LOP days** this month. 
                This will lead to an estimated loss of pay (LOP) deduction of <strong style={{ color: '#EF4444' }}>₹{salaryDeductions.lopDeduction.toLocaleString('en-IN')}</strong> in your upcoming payslip.
              </p>
              <span style={{ display: 'inline-block', fontSize: '10.5px', color: '#EF4444', fontWeight: 700, marginTop: '8px', textTransform: 'uppercase' }}>
                Rule: Net Salary = Gross - LOP (Basic / 30 * absent days)
              </span>
            </div>
          </div>
        )}

        {/* Orange Alert: Punctuality Warning */}
        {attendanceStats.rate < 85 && (
          <div className="glass-card" style={{
            borderColor: 'rgba(245, 158, 11, 0.25)',
            background: 'rgba(245, 158, 11, 0.04)',
            padding: '16px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <AlertTriangle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#D97706' }}>Punctuality Warning</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                Your on-time attendance rate is currently at <strong style={{ color: '#D97706' }}>{attendanceStats.rate}%</strong>. 
                Regular tardiness affects floor operations. Please check in by 09:15 AM to avoid being marked late.
              </p>
            </div>
          </div>
        )}

        {/* Amber Alert: Sales performance warning */}
        {salesStats.pct < 50 && (
          <div className="glass-card" style={{
            borderColor: 'rgba(139, 92, 246, 0.25)',
            background: 'rgba(139, 92, 246, 0.04)',
            padding: '16px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <TrendingUp size={20} color="#8B5CF6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#8B5CF6' }}>Sales Target Alert</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                Your sales total for {currentMonthName} is **₹{salesStats.sales.toLocaleString('en-IN')}**, which is only <strong style={{ color: '#8B5CF6' }}>{salesStats.pct}%</strong> of your monthly target (₹{salesStats.target.toLocaleString('en-IN')}). 
                Boost sales to unlock commissions and performance bonuses.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Badges Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
        <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Store Location</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <MapPin size={13} color="#D97706" /> {employee.location || 'Flagship Boutique'}
          </span>
        </div>
        <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performance Rating</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: performanceTier.color, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Award size={13} color={performanceTier.color} /> {performanceTier.label}
          </span>
        </div>
        <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>On-Time Rate</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: attendanceStats.rate >= 85 ? '#10B981' : '#D97706', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Activity size={13} color={attendanceStats.rate >= 85 ? '#10B981' : '#D97706'} /> {attendanceStats.rate}%
          </span>
        </div>
        <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Month Loss of Pay</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: salaryDeductions.lopDeduction > 0 ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <DollarSign size={13} color={salaryDeductions.lopDeduction > 0 ? '#EF4444' : '#10B981'} /> ₹{salaryDeductions.lopDeduction.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Lunch break schedule & dark next shift card */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        {/* Next Shift */}
        <div style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 4px 15px rgba(15,23,42,0.15)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Next Shift</span>
            <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Clock size={14} color="#FCD34D" /> Today, 10:00 AM - 07:00 PM
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate && onNavigate('attendance')}
            style={{
              width: '100%',
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
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
          >
            <Fingerprint size={14} /> GO TO ATTENDANCE
          </button>
        </div>

        {/* Lunch break card */}
        <div className="glass-card" style={{
          padding: '20px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          background: '#FFFFFF',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Lunch break schedule</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              🍔 12:30 PM - 01:30 PM
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            You will be automatically notified in this portal when lunch break starts. Keep this tab open during shift hours.
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: isMobile ? '16px' : '20px' }}>
        
        {/* Sales & Commissions */}
        <Card style={{ background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <ShoppingBag size={16} color="#D97706" /> Sales & Performance Tracker
            </h3>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', background: 'rgba(79,142,247,0.12)', color: 'var(--brand)' }}>
              {currentMonthName}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '6px 0' }}>
            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Sales Total</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                ₹{salesStats.sales.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Earned Commission</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                ₹{salesStats.commission.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Sales progress bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Target Progress</span>
              <span style={{ color: 'var(--text-primary)' }}>{salesStats.pct}% Achieved (₹{salesStats.sales.toLocaleString('en-IN')} / ₹{salesStats.target.toLocaleString('en-IN')})</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${salesStats.pct}%`, height: '100%', background: 'linear-gradient(90deg, #4F8EF7, #8B5CF6)', borderRadius: '4px', transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Recent sales list */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Recent Sales Entries</div>
            {salesStats.recent.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                No sales recorded for this month.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {salesStats.recent.map((sale) => (
                  <div key={sale.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', fontSize: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sale.product}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{sale.date}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{sale.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Notifications and recent activities */}
        <Card style={{ background: '#FFFFFF' }}>
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
                    background: '#F8FAFC'
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
        </Card>
      </div>
    </div>
  );
}
