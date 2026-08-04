import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('hrpulse_admin_session');
  return session && session.value === 'granted';
}

// 1. GET: Fetch saved payslips (optional query filters: employeeId, month, slipId)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const month = searchParams.get('month');
  const slipId = searchParams.get('slipId');

  try {
    let query = supabase.from('payslips').select('*');

    if (slipId) {
      query = query.eq('slip_id', slipId);
    } else {
      if (employeeId) query = query.eq('employee_id', employeeId);
      if (month) query = query.eq('month', month);
    }

    const { data, error } = await query.order('month', { ascending: false });

    if (error) {
      console.error('Error fetching payslips from Supabase:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payslips: data });
  } catch (err: any) {
    console.error('Payslips GET Error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

// 2. POST: Bulk create / upsert payslips when locking payroll
export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { payslips } = body; // Array of payslip records or single record

    if (!payslips || !Array.isArray(payslips)) {
      return NextResponse.json({ ok: false, error: 'Invalid payslip data. Expected an array.' }, { status: 400 });
    }

    const formattedRecords = payslips.map((p: any) => ({
      slip_id: p.slip_id || `PSL-${p.month || '2026-06'}-${p.employee_id || '00'}`,
      employee_id: p.employee_id,
      employee_name: p.employee_name,
      department: p.department || 'Sales',
      role: p.role || 'Staff',
      month: p.month,
      month_label: p.month_label || p.month,
      basic_salary: p.basic_salary || 0,
      hra: p.hra || 0,
      allowances: p.allowances || 0,
      gross_salary: p.gross_salary || 0,
      incentives: p.incentives || 0,
      pf_deduction: p.pf_deduction || 0,
      esi_deduction: p.esi_deduction || 0,
      tds_deduction: p.tds_deduction || 0,
      pt_deduction: p.pt_deduction || 200,
      lop_deduction: p.lop_deduction || 0,
      advance_deduction: p.advance_deduction || 0,
      total_deductions: p.total_deductions || 0,
      net_pay: p.net_pay || 0,
      status: p.status || 'processed'
    }));

    const { data, error } = await supabase
      .from('payslips')
      .upsert(formattedRecords, { onConflict: 'slip_id' })
      .select();

    if (error) {
      console.error('Error saving payslips in Supabase:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: data?.length || 0, payslips: data });
  } catch (err: any) {
    console.error('Payslips POST Error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
