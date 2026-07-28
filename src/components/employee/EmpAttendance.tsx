'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
import { parseTimeToMinutes } from '@/utils/time';
import { Clock, CheckCircle, Fingerprint, Calendar as CalendarIcon, UserCheck, AlertCircle } from 'lucide-react';

interface EmpAttendanceProps {
  employee: Employee;
}

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', ...style }}>{children}</div>
);

export default function EmpAttendance({ employee }: EmpAttendanceProps) {
  const { attendanceRecords, markAttendance, toast } = useApp();
  const [time, setTime] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  // Get today's record
  const todayStr = useMemo(() => {
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [time.getDate(), time.getMonth(), time.getFullYear()]);

  const todayRecord = useMemo(() => {
    return attendanceRecords.find(r => r.employeeId === employee.id && r.date === todayStr);
  }, [attendanceRecords, employee.id, todayStr]);

  // All employee records
  const myRecords = useMemo(() => {
    return attendanceRecords
      .filter(r => r.employeeId === employee.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, employee.id]);

  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  const handleScanAction = () => {
    if (isCheckedOut) return;
    
    setScanning(true);
    const actionType = isCheckedIn ? 'checkOut' : 'checkIn';

    setTimeout(() => {
      markAttendance(employee.id, actionType);
      setScanning(false);
    }, 1500);
  };

  const getDuration = (inTime?: string | null, outTime?: string | null) => {
    if (!inTime || !outTime) return '—';
    try {
      const diff = parseTimeToMinutes(outTime) - parseTimeToMinutes(inTime);
      if (diff <= 0) return '—';
      const hrs = (diff / 60).toFixed(1);
      return `${hrs} Hours`;
    } catch {
      return '—';
    }
  };

  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Filtered employee attendance records based on selected period
  const filteredRecords = useMemo(() => {
    const now = new Date();
    return myRecords.filter(r => {
      const recDate = new Date(r.date);
      if (period === 'weekly') {
        const diffDays = Math.ceil(Math.abs(now.getTime() - recDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      } else if (period === 'yearly') {
        return recDate.getFullYear() === now.getFullYear();
      } else {
        // monthly
        return recDate.getMonth() === now.getMonth() && recDate.getFullYear() === now.getFullYear();
      }
    });
  }, [myRecords, period]);

  // Summary Metrics for selected period
  const periodStats = useMemo(() => {
    const totalPresent = filteredRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'wfh').length;
    const totalLate = filteredRecords.filter(r => r.status === 'late').length;
    let totalMinutes = 0;
    filteredRecords.forEach(r => {
      if (r.checkIn && r.checkOut) {
        try {
          const diff = parseTimeToMinutes(r.checkOut) - parseTimeToMinutes(r.checkIn);
          if (diff > 0) totalMinutes += diff;
        } catch {}
      }
    });
    const totalHours = (totalMinutes / 60).toFixed(1);
    const onTimeRate = totalPresent > 0 ? Math.round(((totalPresent - totalLate) / totalPresent) * 100) : 0;

    return { totalPresent, totalLate, totalHours, onTimeRate };
  }, [filteredRecords]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      
      {/* Header Titles & Period Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            My Attendance Portal
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Track your weekly, monthly, and yearly attendance logs and shift hours.
          </p>
        </div>

        {/* Period Selector Toggle */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          {(['weekly', 'monthly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: period === p ? '#FFFFFF' : 'transparent',
                color: period === p ? '#0F172A' : '#64748B',
                fontSize: '12px',
                fontWeight: period === p ? 700 : 500,
                boxShadow: period === p ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Summary Cards for Selected Period */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.06)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present Days ({period})</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{periodStats.totalPresent} Days</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.06)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79,142,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#4F8EF7" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hours Logged ({period})</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{periodStats.totalHours} hrs</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.06)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={20} color="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Punctuality Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{periodStats.onTimeRate}%</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
        
        {/* Verification Card */}
        <Card style={{ alignItems: 'center', justifyContent: 'center', padding: '28px 20px', background: '#FFFFFF' }}>
          
          {/* Status Badge at the Top */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            background: isCheckedOut ? '#D1FAE5' : scanning ? '#FEF3C7' : isCheckedIn ? '#FEF3C7' : '#EFF6FF',
            border: `1px solid ${isCheckedOut ? '#A7F3D0' : scanning ? '#FDE68A' : isCheckedIn ? '#FDE68A' : '#BFDBFE'}`,
            borderRadius: '100px',
            color: isCheckedOut ? '#059669' : scanning ? '#D97706' : isCheckedIn ? '#D97706' : '#2563EB',
            fontSize: '12.5px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            <CheckCircle size={14} />
            <span>
              {scanning ? 'System Scanning...' : isCheckedOut ? "Completed Today's Log" : isCheckedIn ? 'Logged In' : 'Ready to Check In'}
            </span>
          </div>

          {/* Scanner Area with Crop Marks */}
          <div style={{
            width: '260px',
            height: '220px',
            background: 'rgba(79, 142, 247, 0.03)',
            borderRadius: '24px',
            border: '1px solid rgba(15, 23, 42, 0.04)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            {/* L Brackets at corners */}
            {/* Top-Left */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', width: '24px', height: '24px', borderTop: '3px solid #D97706', borderLeft: '3px solid #D97706', borderTopLeftRadius: '6px' }} />
            {/* Top-Right */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', width: '24px', height: '24px', borderTop: '3px solid #D97706', borderRight: '3px solid #D97706', borderTopRightRadius: '6px' }} />
            {/* Bottom-Left */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '24px', height: '24px', borderBottom: '3px solid #D97706', borderLeft: '3px solid #D97706', borderBottomLeftRadius: '6px' }} />
            {/* Bottom-Right */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '24px', height: '24px', borderBottom: '3px solid #D97706', borderRight: '3px solid #D97706', borderBottomRightRadius: '6px' }} />

            {/* Inner White Button Icon */}
            <button
              onClick={handleScanAction}
              disabled={isCheckedOut || scanning}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: 'none',
                boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isCheckedOut || scanning) ? 'default' : 'pointer',
                transition: 'transform 0.2s',
                zIndex: 2
              }}
              onMouseDown={e => { if (!isCheckedOut && !scanning) e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={e => { if (!isCheckedOut && !scanning) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {scanning ? (
                <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <UserCheck size={36} color={isCheckedOut ? '#10B981' : '#0F172A'} />
              )}
            </button>

            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: '14px', textTransform: 'uppercase', zIndex: 2 }}>
              {scanning ? 'SCANNING...' : isCheckedOut ? 'ID VERIFIED' : 'TAP TO LOG SHIFT'}
            </span>

            {/* Scan animation bar */}
            {scanning && (
              <div style={{
                position: 'absolute',
                left: '20px',
                right: '20px',
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #D97706, transparent)',
                animation: 'scanActive 1.2s infinite ease-in-out',
                zIndex: 1
              }} />
            )}
          </div>

          {/* Time & Date Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dateStr}</span>
          </div>

          {/* Check In / Check Out Side by Side Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
            <div style={{
              background: '#F8FAFC',
              border: '1px solid rgba(15,23,42,0.05)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check In</span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: isCheckedIn ? '#10B981' : 'var(--text-secondary)', marginTop: '4px' }}>
                {todayRecord?.checkIn || '— : —'}
              </div>
            </div>
            <div style={{
              background: '#F8FAFC',
              border: '1px solid rgba(15,23,42,0.05)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check Out</span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: isCheckedOut ? '#EF4444' : 'var(--text-secondary)', marginTop: '4px' }}>
                {todayRecord?.checkOut || '— : —'}
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Log History */}
        <Card style={{ background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              <CalendarIcon size={16} color="#D97706" /> Attendance History ({period})
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', cursor: 'pointer' }}>{filteredRecords.length} Records</span>
          </div>
          
          <div style={{ overflowY: 'auto', maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredRecords.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '12.5px' }}>
                No attendance logs found for this {period} period.
              </div>
            ) : (
              filteredRecords.map((r, idx) => {
                const isLate = r.status === 'late';
                const recordDate = new Date(r.date);
                const isThursday = recordDate.getDay() === 4;
                const formattedDate = recordDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
                const [datePart, dayPart] = formattedDate.split(', ');
                const uppercaseDate = `${dayPart.toUpperCase()}, ${datePart.toUpperCase()}`;
                
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(15, 23, 42, 0.05)',
                    borderRadius: '12px',
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {uppercaseDate}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {isThursday ? 'Overtime Shift' : isLate ? 'Late Shift Entry' : 'Full Day Shift'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {r.checkIn || '—'} - {r.checkOut || '—'}
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '100px',
                        background: '#FEF3C7',
                        color: '#D97706',
                      }}>
                        {getDuration(r.checkIn, r.checkOut)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanActive {
          0% { top: 20px; opacity: 0.5; }
          50% { top: 190px; opacity: 1; }
          100% { top: 20px; opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
}
