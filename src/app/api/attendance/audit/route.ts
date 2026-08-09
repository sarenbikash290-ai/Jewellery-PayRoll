import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

async function getSession() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('hrpulse_admin_session');
  if (adminSession && adminSession.value === 'granted') {
    return { role: 'admin' };
  }
  return null;
}

// GET /api/attendance/audit — Admin: list all audit log entries
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('attendance_audit_logs')
    .select('*')
    .order('edit_timestamp', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const logs = (data || []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    attendanceDate: row.attendance_date,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    checkInBefore: row.check_in_before,
    checkOutBefore: row.check_out_before,
    checkInAfter: row.check_in_after,
    checkOutAfter: row.check_out_after,
    editedBy: row.edited_by,
    editTimestamp: row.edit_timestamp,
    reason: row.reason,
  }));

  return NextResponse.json({ ok: true, logs });
}

// DELETE /api/attendance/audit — Admin: clear all audit logs
export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('attendance_audit_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('Error deleting audit logs:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Audit logs cleared successfully' });
}
