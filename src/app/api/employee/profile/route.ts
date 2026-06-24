import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { cookies } from 'next/headers';

async function getEmployeeSessionId() {
  const cookieStore = await cookies();
  const session = cookieStore.get('hrpulse_emp_session');
  return session ? session.value : null;
}

export async function PATCH(request: Request) {
  const empId = await getEmployeeSessionId();
  if (!empId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { bank_name, bank_account_no, ifsc_code, pan_no, pf_no } = body;

    // Update bank details in Supabase for this employee
    const { data, error } = await supabase
      .from('employees')
      .update({
        bank_name,
        bank_account_no,
        ifsc_code,
        pan_no,
        pf_no
      })
      .eq('id', empId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, employee: data });
  } catch (err: any) {
    console.error('Error updating employee bank details:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
