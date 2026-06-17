import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/utils/supabase';

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

function mapLeaveToClient(l: any) {
  return {
    id: l.id,
    employeeId: l.employee_id,
    employeeName: l.employee_name,
    type: l.type,
    from: l.from_date,
    to: l.to_date,
    reason: l.reason,
    status: l.status,
    appliedOn: l.applied_on
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase.from('leaves').select('*');
  if (session.role === 'employee') {
    query = query.eq('employee_id', session.employeeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching leaves from Supabase:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const leaves = (data || []).map(mapLeaveToClient);
  return NextResponse.json({ ok: true, leaves });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if it is a database reset action
    if (body.action === 'resetData') {
      if (session.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
      }

      const { error } = await supabase.from('leaves').delete().neq('id', '');
      if (error) {
        console.error('Error resetting leaves in Supabase:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const { employeeId, employeeName, type, from, to, reason } = body;

    if (!employeeId || !type || !from || !to || !reason) {
      return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
    }

    const upperEmpId = employeeId.toUpperCase();

    // Enforce employee session constraint
    if (session.role === 'employee' && session.employeeId !== upperEmpId) {
      return NextResponse.json({ ok: false, error: 'Cannot apply leave for another employee' }, { status: 403 });
    }

    // Determine the next Leave ID LVxxx
    const { data: allLeaves, error: fetchErr } = await supabase
      .from('leaves')
      .select('id');
    
    if (fetchErr) throw fetchErr;

    const maxNum = (allLeaves || []).reduce((max, l) => {
      const num = parseInt(l.id.replace('LV', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextId = `LV${String(maxNum + 1).padStart(3, '0')}`;

    const appliedOnStr = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    const { data: newLeave, error: insertErr } = await supabase
      .from('leaves')
      .insert({
        id: nextId,
        employee_id: upperEmpId,
        employee_name: employeeName || 'Unknown Employee',
        type,
        from_date: from,
        to_date: to,
        reason,
        status: 'pending',
        applied_on: appliedOnStr
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error creating leave in Supabase:', insertErr);
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, leave: mapLeaveToClient(newLeave) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const { data: updatedLeave, error } = await supabase
      .from('leaves')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating leave status:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, leave: mapLeaveToClient(updatedLeave) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}
