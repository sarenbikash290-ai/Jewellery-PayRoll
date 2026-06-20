import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

// ── Supabase-backed WiFi config (persists across Vercel serverless instances) ──
async function getAuthorizedWifiIps(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'authorized_wifi_ips')
      .maybeSingle();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    console.error('Error reading WiFi config from Supabase:', e);
  }
  return ['127.0.0.1'];
}

async function setAuthorizedWifiIps(ips: string[]): Promise<void> {
  try {
    await supabase
      .from('app_config')
      .upsert(
        { key: 'authorized_wifi_ips', value: JSON.stringify(ips), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
  } catch (e) {
    console.error('Error saving WiFi config to Supabase:', e);
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

function extractClientIp(request: Request): string {
  const vercelIp  = request.headers.get('x-vercel-forwarded-for');
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp    = request.headers.get('x-real-ip');
  const rawIp = vercelIp || forwarded || realIp;
  if (rawIp) {
    const parts = rawIp.split(',');
    const ip = parts.map(p => p.trim()).find(p => p !== '127.0.0.1' && p !== '::1' && p !== '');
    return ip || parts[0].trim();
  }
  return '127.0.0.1';
}

function ipMatchesAny(clientIp: string, authorizedIps: string[]): boolean {
  const normalizedClient = normalizeIp(clientIp);
  for (const authIp of authorizedIps) {
    const normalizedAuth = normalizeIp(authIp);
    if (normalizedClient === normalizedAuth) return true;
    // IPv6 /64 prefix match (handles same-network devices with different suffix)
    if (normalizedClient.includes(':') && normalizedAuth.includes(':')) {
      const cp = getIpv6Prefix(normalizedClient);
      const ap = getIpv6Prefix(normalizedAuth);
      if (cp && ap && cp === ap) return true;
    }
  }
  return false;
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

  const clientIp = extractClientIp(request);
  const authorizedIps = await getAuthorizedWifiIps();
  // Return the first non-bypass IP for UI display (or 127.0.0.1 as fallback)
  const authorizedWifiIp = authorizedIps.find(ip => normalizeIp(ip) !== '127.0.0.1') || '127.0.0.1';

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

      // Also capture the IP of this save request itself (may be IPv6 when typed value is IPv4)
      // This ensures both IPv4 and IPv6 versions of the same connection are authorized.
      const requestIp = extractClientIp(request);
      const normalizedNew     = normalizeIp(newIp);
      const normalizedRequest = normalizeIp(requestIp);

      const ipsToSave = [normalizedNew];
      if (
        normalizedRequest &&
        normalizedRequest !== '127.0.0.1' &&
        normalizedRequest !== normalizedNew
      ) {
        ipsToSave.push(normalizedRequest);
      }

      await setAuthorizedWifiIps(ipsToSave);
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

    // Check if it is a manual attendance logging action (legacy)
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

    // ── Secure Attendance Edit with Audit Trail ───────────────────────────────
    if (body.action === 'editAttendance') {
      // 1. Admin-only
      if (session.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
      }

      const { employeeId, employeeName, date, checkIn, checkOut, status, reason } = body;
      if (!employeeId || !date || !status) {
        return NextResponse.json({ ok: false, error: 'Missing required fields: employeeId, date, status' }, { status: 400 });
      }

      const upperEmpId = employeeId.toUpperCase();

      // 2. Validate the date format
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json({ ok: false, error: 'Invalid date format' }, { status: 400 });
      }

      // 3. Check 7-day edit window
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      targetDate.setHours(0, 0, 0, 0);

      if (targetDate < sevenDaysAgo) {
        return NextResponse.json({
          ok: false,
          lockReason: 'editWindowExpired',
          error: 'The 7-day edit window for this attendance record has expired. Records older than 7 days cannot be modified.'
        }, { status: 403 });
      }

      // 4. Check payroll month lock
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1; // 1-based

      const { data: lockRecord } = await supabase
        .from('payroll_month_locks')
        .select('id, locked_by, locked_at')
        .eq('year', targetYear)
        .eq('month', targetMonth)
        .maybeSingle();

      if (lockRecord) {
        return NextResponse.json({
          ok: false,
          lockReason: 'payrollLocked',
          error: 'This payroll month has been finalized and attendance can no longer be modified.'
        }, { status: 403 });
      }

      // 5. Fetch existing record for audit trail
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', upperEmpId)
        .eq('date', date)
        .maybeSingle();

      const previousStatus = existingRecord?.status || null;
      const checkInBefore = existingRecord?.check_in || null;
      const checkOutBefore = existingRecord?.check_out || null;

      // 6. Upsert the attendance record
      const { data: updatedRecord, error: upsertError } = await supabase
        .from('attendance')
        .upsert({
          employee_id: upperEmpId,
          date,
          check_in: checkIn || null,
          check_out: checkOut || null,
          status,
        }, { onConflict: 'employee_id,date' })
        .select()
        .single();

      if (upsertError) {
        console.error('Error editing attendance:', upsertError);
        return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
      }

      // 7. Write immutable audit log entry
      const { error: auditError } = await supabase
        .from('attendance_audit_logs')
        .insert({
          employee_id: upperEmpId,
          employee_name: employeeName || upperEmpId,
          attendance_date: date,
          previous_status: previousStatus,
          new_status: status,
          check_in_before: checkInBefore,
          check_out_before: checkOutBefore,
          check_in_after: checkIn || null,
          check_out_after: checkOut || null,
          edited_by: 'Admin',
          reason: reason || null,
        });

      if (auditError) {
        // Log the error but do NOT fail the request — the attendance edit succeeded
        console.error('Warning: Audit log write failed:', auditError);
      }

      const record = {
        employeeId: updatedRecord.employee_id,
        date: updatedRecord.date,
        checkIn: updatedRecord.check_in,
        checkOut: updatedRecord.check_out,
        status: updatedRecord.status,
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
    const clientIp = extractClientIp(request);
    const normalizedClient = normalizeIp(clientIp);

    // Load all authorized IPs from Supabase (persists across Vercel instances)
    const authorizedIps = await getAuthorizedWifiIps();
    const authorizedWifiIp = authorizedIps.find(ip => normalizeIp(ip) !== '127.0.0.1') || '127.0.0.1';

    const isLocal = normalizedClient === '127.0.0.1';
    const isAuthBypassed = authorizedIps.every(ip => normalizeIp(ip) === '127.0.0.1' || normalizeIp(ip) === '');

    // Check client IP against ALL saved authorized IPs (handles IPv4 + IPv6 of same connection)
    const ipMatches = ipMatchesAny(clientIp, authorizedIps);

    // Perform Geofencing Check
    if (!isAuthBypassed && !isLocal && !ipMatches) {
      console.log(`[Geofencing Blocked] Client: ${clientIp} (${normalizedClient}), Authorized IPs: ${authorizedIps.join(', ')}`);
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
