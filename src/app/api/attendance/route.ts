import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeJsonAtomic } from '@/utils/db';
import { cookies } from 'next/headers';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

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
    writeJsonAtomic(CONFIG_PATH, { authorizedWifiIp: ip });
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

async function getSession() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('hrpulse_admin_session');
  if (adminSession && adminSession.value === 'granted') {
    return { role: 'admin' };
  }
  const empSession = cookieStore.get('hrpulse_emp_session');
  if (empSession && empSession.value) {
    return { role: 'employee', employeeId: empSession.value.toUpperCase() };
  }
  return null;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase.from('attendance').select('*');
  if (session.role === 'employee') {
    query = query.eq('employee_id', session.employeeId);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) {
    console.error('Error fetching attendance from Supabase:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const attendanceRecords = (data || []).map(r => ({
    employeeId: r.employee_id,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
    status: r.status
  }));

  const forwarded = request.headers.get('x-forwarded-for');
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  let clientIp = '127.0.0.1';
  const rawIp = vercelIp || forwarded || realIp;
  if (rawIp) {
    const parts = rawIp.split(',');
    const ip = parts.map(p => p.trim()).find(p => p !== '127.0.0.1' && p !== '::1' && p !== '');
    clientIp = ip || parts[0].trim();
  }

  const authorizedWifiIp = getAuthorizedWifiIp();

  return NextResponse.json({ 
    ok: true, 
    attendanceRecords, 
    clientIp, 
    authorizedWifiIp 
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if it is a configuration update action
    if (body.action === 'updateConfig') {
      if (session.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
      }

      const newIp = body.authorizedWifiIp || '127.0.0.1';
      setAuthorizedWifiIp(newIp);
      return NextResponse.json({ ok: true, authorizedWifiIp: newIp });
    }

    // Check if it is a database reset action
    if (body.action === 'resetData') {
      if (session.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
      }

      const { error } = await supabase.from('attendance').delete().neq('employee_id', '');
      if (error) {
        console.error('Error resetting attendance:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Check if it is a manual attendance logging action
    if (body.action === 'manualAttendance') {
      if (session.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
      }

      const { employeeId, date, checkIn, checkOut, status } = body;
      if (!employeeId || !date || !status) {
        return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
      }

      const upperEmpId = employeeId.toUpperCase();

      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          employee_id: upperEmpId,
          date: date,
          check_in: checkIn || null,
          check_out: checkOut || null,
          status: status
        }, { onConflict: 'employee_id,date' })
        .select()
        .single();

      if (error) {
        console.error('Error saving manual attendance:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      const record = {
        employeeId: data.employee_id,
        date: data.date,
        checkIn: data.check_in,
        checkOut: data.check_out,
        status: data.status
      };

      return NextResponse.json({ ok: true, record });
    }

    const { employeeId, type } = body;

    if (!employeeId || !type || !['checkIn', 'checkOut'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const upperEmpId = employeeId.toUpperCase();

    // Enforce employee session constraint
    if (session.role === 'employee' && session.employeeId !== upperEmpId) {
      return NextResponse.json({ ok: false, error: 'Cannot clock in/out for another employee' }, { status: 403 });
    }

    // Extract client public IP
    const forwarded = request.headers.get('x-forwarded-for');
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    let clientIp = '127.0.0.1';
    const rawIp = vercelIp || forwarded || realIp;
    if (rawIp) {
      const parts = rawIp.split(',');
      const ip = parts.map(p => p.trim()).find(p => p !== '127.0.0.1' && p !== '::1' && p !== '');
      clientIp = ip || parts[0].trim();
    }

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

    // Fetch existing attendance record for today
    const { data: existing, error: fetchErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', upperEmpId)
      .eq('date', todayStr)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching today attendance:', fetchErr);
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
    }

    let recordData: any;

    if (existing) {
      const updates: any = {};
      if (type === 'checkIn') {
        updates.check_in = timeStr;
      } else {
        updates.check_out = timeStr;
      }

      const { data: updated, error: updateErr } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Error updating attendance:', updateErr);
        return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
      }
      recordData = updated;
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

      const { data: inserted, error: insertErr } = await supabase
        .from('attendance')
        .insert({
          employee_id: upperEmpId,
          date: todayStr,
          check_in: checkInTime,
          check_out: checkOutTime,
          status
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Error inserting attendance:', insertErr);
        return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
      }
      recordData = inserted;
    }

    const record = {
      employeeId: recordData.employee_id,
      date: recordData.date,
      checkIn: recordData.check_in,
      checkOut: recordData.check_out,
      status: recordData.status
    };

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
