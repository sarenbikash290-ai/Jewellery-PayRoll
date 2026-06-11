'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import { Clock, UserCheck, UserX, AlertCircle, Calendar, ChevronLeft, ChevronRight, Fingerprint, MapPin, Monitor, Eye } from 'lucide-react';

// Dynamic attendanceData will be constructed inside the component using useApp()
const calendarData = [
  ['', 1,2,3,4,5,6],
  [7,8,9,10,'✓11','12','13'],
  ['14','15','16','17','18','19','20'],
  ['21','22','23','24','25','26','27'],
  ['28','29','30','','','',''],
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Present' },
  late:    { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Late' },
  absent:  { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Absent' },
  wfh:     { bg: 'rgba(99,179,237,0.12)', text: '#06B6D4', label: 'WFH' },
};
const leaveColors: Record<string, string> = {
  PL: '#4F8EF7', SL: '#EF4444', CL: '#F59E0B', WFH: '#06B6D4'
};

const avatarColors = ['#4F8EF7', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444', '#8B5CF6', '#10B981'];

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {} }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }}>{children}</div>
);

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'today' | 'calendar'>('today');
  const { employees, toast } = useApp();

  const attendanceData = employees.map((emp, index) => {
    const staticMocks = [
      { checkIn: '09:02', checkOut: '18:30', status: 'present', hours: 9.5, leave: null, source: 'Biometric Gate 1', icon: Fingerprint, color: '#10B981' },
      { checkIn: '09:45', checkOut: '18:00', status: 'late',    hours: 8.2, leave: null, source: 'Mobile GPS App', icon: MapPin, color: '#F59E0B' },
      { checkIn: null,    checkOut: null,    status: 'absent',  hours: 0,   leave: 'PL',  source: '—',               icon: null,   color: 'transparent' },
      { checkIn: '08:55', checkOut: '18:30', status: 'present', hours: 9.6, leave: null, source: 'Face ID Terminal', icon: Eye,    color: '#8B5CF6' },
      { checkIn: null,    checkOut: null,    status: 'wfh',     hours: 8.0, leave: 'WFH', source: 'Web Portal',      icon: Monitor, color: '#06B6D4' },
      { checkIn: '10:15', checkOut: '19:00', status: 'late',    hours: 8.7, leave: null, source: 'Biometric Gate 2', icon: Fingerprint, color: '#10B981' },
      { checkIn: '09:01', checkOut: null,    status: 'present', hours: null, leave: null, source: 'Face ID Terminal', icon: Eye,    color: '#8B5CF6' },
      { checkIn: '08:50', checkOut: '17:45', status: 'present', hours: 8.9, leave: null, source: 'Mobile GPS App', icon: MapPin, color: '#F59E0B' },
    ];

    const mock = staticMocks[index % staticMocks.length] || staticMocks[0];

    return {
      id: emp.id,
      name: emp.name,
      dept: emp.dept,
      checkIn: mock.checkIn,
      checkOut: mock.checkOut,
      status: mock.status,
      hours: mock.hours,
      leave: mock.leave,
      source: mock.source,
      icon: mock.icon,
      color: mock.color
    };
  });

  const presentCount = attendanceData.filter(e => e.status === 'present').length;
  const lateCount    = attendanceData.filter(e => e.status === 'late').length;
  const absentCount  = attendanceData.filter(e => e.status === 'absent').length;
  const wfhCount     = attendanceData.filter(e => e.status === 'wfh').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Attendance & Time Tracking</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Wednesday, 11 June 2025 · Live Tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          { icon: UserCheck,    label: 'Present',   value: presentCount, total: employees.length, color: '#10B981' },
          { icon: AlertCircle,  label: 'Late',       value: lateCount,    total: employees.length, color: '#F59E0B' },
          { icon: UserX,        label: 'Absent',     value: absentCount,  total: employees.length, color: '#EF4444' },
          { icon: Clock,        label: 'WFH',        value: wfhCount,     total: employees.length, color: '#06B6D4' },
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
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{ padding: '8px 20px', borderRadius: '8px', background: activeTab === tab.id ? 'var(--brand)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today's Log */}
      {activeTab === 'today' && (
        <Card>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Live Attendance — 11 June 2025</span>
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
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)', cursor: 'default' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', background: avatarColors[i], borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{emp.name.charAt(0)}</div>
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

      {/* Calendar */}
      {activeTab === 'calendar' && (
        <Card style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>June 2025</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ width: '32px', height: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={16} /></button>
              <button style={{ width: '32px', height: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 0' }}>{d}</div>
            ))}
            {calendarData.flat().map((day, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '10px', borderRadius: '8px', fontSize: '13px',
                background: day === '✓11' ? 'var(--brand)' : day === '' ? 'transparent' : 'var(--bg-elevated)',
                color: day === '✓11' ? '#fff' : day === '' ? 'transparent' : 'var(--text-secondary)',
                fontWeight: day === '✓11' ? 700 : 400,
                cursor: day ? 'pointer' : 'default',
                border: '1px solid', borderColor: day === '✓11' ? 'var(--brand)' : 'transparent',
                transition: 'var(--transition)',
              }}>
                {typeof day === 'number' ? day : day === '✓11' ? 11 : day.replace('✓','').trim()}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[{ color: '#10B981', label: 'Present' }, { color: '#F59E0B', label: 'Late' }, { color: '#EF4444', label: 'Absent' }, { color: '#06B6D4', label: 'WFH/Leave' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '10px', height: '10px', background: l.color, borderRadius: '2px' }} />{l.label}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
