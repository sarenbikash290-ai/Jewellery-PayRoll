import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { cookies } from 'next/headers';

// Authentication helper
async function getSession() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('hrpulse_admin_session');
  if (adminSession && adminSession.value === 'granted') return { role: 'admin' };
  
  const empSession = cookieStore.get('hrpulse_emp_session');
  if (empSession && empSession.value) return { role: 'employee', employeeId: empSession.value };
  
  return null;
}

async function isAdmin() {
  const session = await getSession();
  return session?.role === 'admin';
}

// 1. GET: Fetch all employees
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching employees from Supabase:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, employees: data });
}

// 2. POST: Create employee + initialize default pin '1234'
export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.action === 'resetData') {
      const { error } = await supabase.from('employees').delete().neq('id', '');
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const { name, dept, role, email, phone, location, status, joined, salary, type, bank_name, bank_account_no, ifsc_code, pan_no, pf_no } = body;

    if (!name || !dept || !role || !email || !phone || !location || !joined || !salary || !type) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Determine the next Employee ID EMPxxx
    const { data: allEmps, error: fetchErr } = await supabase
      .from('employees')
      .select('id');
    
    if (fetchErr) throw fetchErr;

    const maxNum = (allEmps || []).reduce((max, e) => {
      const num = parseInt(e.id.replace('EMP', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextId = `EMP${String(maxNum + 1).padStart(3, '0')}`;

    // Insert employee
    const { data: newEmp, error: insertErr } = await supabase
      .from('employees')
      .insert({
        id: nextId, name, dept, role, email, phone, location, 
        status: status || 'active', joined, salary, type,
        bank_name, bank_account_no, ifsc_code, pan_no, pf_no
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Initialize default PIN 1234
    const { error: pinErr } = await supabase
      .from('employee_pins')
      .insert({ employee_id: nextId, pin: '1234' });

    if (pinErr) {
      console.error(`Failed to initialize PIN for ${nextId}:`, pinErr);
    }

    return NextResponse.json({ ok: true, employee: newEmp });
  } catch (err: any) {
    console.error('Error creating employee:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

// 3. PATCH: Update employee profile
export async function PATCH(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, dept, role, email, phone, location, status, joined, salary, type, bank_name, bank_account_no, ifsc_code, pan_no, pf_no } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing employee ID' }, { status: 400 });
    }

    const { data: updatedEmp, error } = await supabase
      .from('employees')
      .update({ name, dept, role, email, phone, location, status, joined, salary, type, bank_name, bank_account_no, ifsc_code, pan_no, pf_no })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, employee: updatedEmp });
  } catch (err: any) {
    console.error('Error updating employee:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

// 4. DELETE: Delete employee record
export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing employee ID' }, { status: 400 });
    }

    // employee_pins table will cascade delete due to foreign key configuration
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting employee:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
