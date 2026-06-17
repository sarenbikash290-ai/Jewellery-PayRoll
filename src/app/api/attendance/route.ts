import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

const CONFIG_PATH = path.join(process.cwd(), 'src/app/api/attendance/config.json');

function getAuthorizedWifiIp(): string {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data).authorizedWifiIp || '127.0.0.1';
    }
  } catch (e) {
    console.error('Error reading WiFi config:', e);
  }
  return '127.0.0.1';
}

function setAuthorizedWifiIp(ip: string) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ authorizedWifiIp: ip }, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing WiFi config:', e);
  }
}

function normalizeIp(ip: string): string {
  let clean = ip.trim().toLowerCase();
  if (clean.startsWith('::ffff:')) {
    clean = clean.substring(7);
  }
  if (clean === '::1') {
    clean = '127.0.0.1';
  }
  return clean;
}

function getIpv6Prefix(ip: string): string | null {
  const parts = ip.split(':');
  if (parts.length < 4) return null;
  return parts.slice(0, 4).join(':');
}

export async function GET(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const authorizedWifiIp = getAuthorizedWifiIp();
  return NextResponse.json({ 
    ok: true, 
    attendanceRecords: attendanceStore, 
    clientIp, 
    authorizedWifiIp 
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if it is a configuration update action
    if (body.action === 'updateConfig') {
      const newIp = body.authorizedWifiIp || '127.0.0.1';
      setAuthorizedWifiIp(newIp);
      return NextResponse.json({ ok: true, authorizedWifiIp: newIp });
    }

    // Check if it is a manual attendance logging action
    if (body.action === 'manualAttendance') {
      const { employeeId, date, checkIn, checkOut, status } = body;
      if (!employeeId || !date || !status) {
        return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
      }

      const existingIdx = attendanceStore.findIndex(r => r.employeeId === employeeId && r.date === date);

      const record: AttendanceRecord = {
        employeeId,
        date,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: status as 'present' | 'late' | 'absent' | 'wfh'
      };

      if (existingIdx > -1) {
        attendanceStore[existingIdx] = record;
      } else {
        attendanceStore.push(record);
      }

      return NextResponse.json({ ok: true, record });
    }

    const { employeeId, type } = body;

    if (!employeeId || !type || !['checkIn', 'checkOut'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
    }

    // Extract client public IP
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const authorizedWifiIp = getAuthorizedWifiIp();
    const normalizedClient = normalizeIp(clientIp);
    const normalizedAuth = normalizeIp(authorizedWifiIp);

    const isLocal = normalizedClient === '127.0.0.1';
    const isAuthBypassed = normalizedAuth === '127.0.0.1' || normalizedAuth === '';

    let ipMatches = normalizedClient === normalizedAuth;

    // If both are IPv6 addresses, compare the /64 prefix (first 4 segments)
    if (!ipMatches && normalizedClient.includes(':') && normalizedAuth.includes(':')) {
      const clientPrefix = getIpv6Prefix(normalizedClient);
      const authPrefix = getIpv6Prefix(normalizedAuth);
      if (clientPrefix && authPrefix && clientPrefix === authPrefix) {
        ipMatches = true;
      }
    }

    // Perform Geofencing Check
    if (!isAuthBypassed && !isLocal && !ipMatches) {
      console.log(`[Geofencing Blocked] Client: ${clientIp} (${normalizedClient}), Auth IP: ${authorizedWifiIp} (${normalizedAuth})`);
      return NextResponse.json({ 
        ok: false, 
        error: `Outside authorized WiFi network. Device IP: ${clientIp}, Store WiFi: ${authorizedWifiIp}`, 
        clientIp, 
        authorizedWifiIp 
      }, { status: 403 });
    }

    const todayStr = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
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
