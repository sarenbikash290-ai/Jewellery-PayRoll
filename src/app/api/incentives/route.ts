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

function mapIncentiveToClient(i: any) {
  return {
    id: i.id,
    employeeId: i.employee_id,
    employeeName: i.employee_name,
    dept: i.dept,
    ruleType: i.rule_type,
    amount: Number(i.amount),
    target: Number(i.target),
    month: i.month,
    status: i.status,
    createdAt: i.created_at
  };
}

// 1. GET: Fetch incentives
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase.from('incentives').select('*');
  if (session.role === 'employee') {
    query = query.eq('employee_id', session.employeeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching incentives:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const incentives = (data || []).map(mapIncentiveToClient);
  return NextResponse.json({ ok: true, incentives });
}

// 2. POST: Create incentive or reset
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const body = await request.json();

    // Reset Data action
    if (body.action === 'resetData') {
      const { error } = await supabase.from('incentives').delete().neq('id', '');
      if (error) {
        console.error('Error resetting incentives in Supabase:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const { employeeId, employeeName, dept, ruleType, amount, target, month, status } = body;

    if (!employeeId || !employeeName || !dept || !ruleType || amount === undefined || target === undefined || !month) {
      return NextResponse.json({ ok: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Determine and insert with retry on primary key collision
    let newInc = null;
    let insertErr: any = null;
    let attempts = 0;

    while (attempts < 10) {
      attempts++;
      const { data: allIncs, error: fetchErr } = await supabase
        .from('incentives')
        .select('id');
      
      if (fetchErr) throw fetchErr;

      const maxNum = (allIncs || []).reduce((max, i) => {
        const num = parseInt(String(i.id).replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);

      const candidateId = `INC${String(maxNum + 1).padStart(3, '0')}`;

      const res = await supabase
        .from('incentives')
        .insert({
          id: candidateId,
          employee_id: employeeId.toUpperCase(),
          employee_name: employeeName,
          dept,
          rule_type: ruleType,
          amount,
          target,
          month,
          status: status || 'pending'
        })
        .select()
        .single();

      if (!res.error) {
        newInc = res.data;
        insertErr = null;
        break;
      }

      insertErr = res.error;
      const isDuplicate = 
        res.error.code === '23505' || 
        res.error.message?.includes('duplicate key') || 
        res.error.message?.includes('unique constraint');

      if (!isDuplicate) {
        break;
      }

      // Small jitter delay before re-calculating next ID to prevent retry thundering herd
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 50) + 10));
    }

    if (insertErr || !newInc) {
      console.error('Error inserting incentive:', insertErr);
      return NextResponse.json({ ok: false, error: insertErr?.message || 'Failed to insert incentive' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, incentive: mapIncentiveToClient(newInc) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}

// 3. PATCH: Update incentive status/details
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const body = await request.json();
    const { id, employeeId, employeeName, dept, ruleType, amount, target, month, status } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing incentive ID' }, { status: 400 });
    }

    const updates: any = {};
    if (employeeId) updates.employee_id = employeeId.toUpperCase();
    if (employeeName) updates.employee_name = employeeName;
    if (dept) updates.dept = dept;
    if (ruleType) updates.rule_type = ruleType;
    if (amount !== undefined) updates.amount = amount;
    if (target !== undefined) updates.target = target;
    if (month) updates.month = month;
    if (status) updates.status = status;

    const { data: updatedInc, error } = await supabase
      .from('incentives')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating incentive:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, incentive: mapIncentiveToClient(updatedInc) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}

// 4. DELETE: Remove incentive record
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing incentive ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('incentives')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting incentive:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}
