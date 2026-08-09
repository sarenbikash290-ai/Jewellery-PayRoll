import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('hrpulse_admin_session');
  return session && session.value === 'granted';
}

// GET — fetch all advance payments
export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('advance_payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const advances = (data || []).map(r => ({
    id: r.id,
    employeeId: r.employee_id,
    amount: r.amount,
    monthlyDeduction: r.monthly_deduction !== undefined && r.monthly_deduction !== null ? r.monthly_deduction : r.amount,
    customSchedule: r.custom_schedule || undefined,
    givenOn: r.given_on,
    deductMonth: r.deduct_month,
    reason: r.reason || '',
    status: r.status,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ ok: true, advances });
}

// POST — add new advance payment
export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.action === 'resetData') {
      const { error } = await supabase.from('advance_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const { employeeId, amount, monthlyDeduction, customSchedule, givenOn, deductMonth, reason } = body;

    if (!employeeId || !amount || !givenOn || !deductMonth) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const monthlyDeductVal = monthlyDeduction ? Number(monthlyDeduction) : Number(amount);

    let data: any = null;
    const { data: insertData, error } = await supabase
      .from('advance_payments')
      .insert({
        employee_id: employeeId,
        amount: Number(amount),
        monthly_deduction: monthlyDeductVal,
        custom_schedule: customSchedule || null,
        given_on: givenOn,
        deduct_month: deductMonth,
        reason: reason || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('advance_payments')
        .insert({
          employee_id: employeeId,
          amount: Number(amount),
          given_on: givenOn,
          deduct_month: deductMonth,
          reason: reason || null,
          status: 'pending',
        })
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      data = fallbackData;
    } else {
      data = insertData;
    }

    return NextResponse.json({
      ok: true,
      advance: {
        id: data.id,
        employeeId: data.employee_id,
        amount: data.amount,
        monthlyDeduction: data.monthly_deduction || monthlyDeductVal,
        customSchedule: data.custom_schedule || customSchedule,
        givenOn: data.given_on,
        deductMonth: data.deduct_month,
        reason: data.reason || '',
        status: data.status,
        createdAt: data.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

// PATCH — update status (mark as deducted / pending)
export async function PATCH(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('advance_payments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      advance: {
        id: data.id,
        employeeId: data.employee_id,
        amount: data.amount,
        givenOn: data.given_on,
        deductMonth: data.deduct_month,
        reason: data.reason || '',
        status: data.status,
        createdAt: data.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE — remove an advance payment
export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabase.from('advance_payments').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
