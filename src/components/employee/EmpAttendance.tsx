'use client';
import { useState, useMemo, useEffect } from 'react';
import { useApp, Employee } from '../AppContext';
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
  const todayStr = new Date().toISOString().split('T')[0];
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
      const parseTime = (t: string) => {
        const [timePart, modifier] = t.split(' ');
        let [hoursStr, minutesStr] = timePart.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      const diff = parseTime(outTime) - parseTime(inTime);
      if (diff <= 0) return '—';
      const hrs = (diff / 60).toFixed(1);
      return `${hrs} Hours`;
    } catch {
      return '—';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      
      {/* Header Titles */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Mark Attendance
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Verify your identity to log your shift checks securely.
        </p>
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
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <CalendarIcon size={16} color="#D97706" /> History (This Month)
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', cursor: 'pointer' }}>View Full Report</span>
          </div>
          
          <div style={{ overflowY: 'auto', maxHeight: '240px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myRecords.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '12.5px' }}>
                No attendance logs found.
              </div>
            ) : (
              myRecords.map((r, idx) => {
                const isLate = r.status === 'late';
                const formattedDate = new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
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
                        {isLate ? 'Late Shift Entry' : 'Full Day Shift'}
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
