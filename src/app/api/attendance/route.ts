import { NextResponse } from 'next/server';

interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'late' | 'absent' | 'wfh';
}

let attendanceStore: AttendanceRecord[] = [
  { employeeId: 'EMP001', date: '2026-06-15', checkIn: '09:02 AM', checkOut: '06:30 PM', status: 'present' },
  { employeeId: 'EMP001', date: '2026-06-16', checkIn: '09:12 AM', checkOut: '06:45 PM', status: 'present' },
  { employeeId: 'EMP002', date: '2026-06-15', checkIn: '09:45 AM', checkOut: '06:00 PM', status: 'late' },
  { employeeId: 'EMP002', date: '2026-06-16', checkIn: '09:40 AM', checkOut: '06:10 PM', status: 'late' }
];

export async function GET() {
  return NextResponse.json({ ok: true, attendanceRecords: attendanceStore });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, type } = body;

    if (!employeeId || !type || !['checkIn', 'checkOut'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const existingIdx = attendanceStore.findIndex(r => r.employeeId === employeeId && r.date === todayStr);

    if (existingIdx > -1) {
      const record = { ...attendanceStore[existingIdx] };
      if (type === 'checkIn') {
        record.checkIn = timeStr;
      } else {
        record.checkOut = timeStr;
      }
      attendanceStore[existingIdx] = record;
      return NextResponse.json({ ok: true, record });
    } else {
      const checkInTime = type === 'checkIn' ? timeStr : null;
      const checkOutTime = type === 'checkOut' ? timeStr : null;

      let status: 'present' | 'late' = 'present';
      if (checkInTime) {
        const [timePart, period] = checkInTime.split(' ');
        const [hour, minute] = timePart.split(':').map(Number);
        if (period === 'PM' || hour > 9 || (hour === 9 && minute > 15)) {
          status = 'late';
        }
      }

      const newRecord: AttendanceRecord = {
        employeeId,
        date: todayStr,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status
      };

      attendanceStore.push(newRecord);
      return NextResponse.json({ ok: true, record: newRecord });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
