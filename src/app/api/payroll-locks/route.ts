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

// GET /api/payroll-locks — List all locked payroll months
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('payroll_month_locks')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching payroll locks:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const locks = (data || []).map((row) => ({
    id: row.id,
    year: row.year,
    month: row.month,
    lockedBy: row.locked_by,
    lockedAt: row.locked_at,
    notes: row.notes,
  }));

  return NextResponse.json({ ok: true, locks });
}

// POST /api/payroll-locks — Lock a payroll month
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { year?: number; month?: number; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { year, month, notes } = body;
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, error: 'Valid year and month (1-12) are required' }, { status: 400 });
  }

  // Check if already locked
  const { data: existing } = await supabase
    .from('payroll_month_locks')
    .select('id')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: false, error: 'This payroll month is already locked' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('payroll_month_locks')
    .insert({
      year,
      month,
      locked_by: 'Admin',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error locking payroll month:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    lock: {
      id: data.id,
      year: data.year,
      month: data.month,
      lockedBy: data.locked_by,
      lockedAt: data.locked_at,
      notes: data.notes,
    },
  });
}

// DELETE /api/payroll-locks?year=2026&month=6 — Unlock a payroll month
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || '0', 10);
  const month = parseInt(searchParams.get('month') || '0', 10);

  if (!year || !month) {
    return NextResponse.json({ ok: false, error: 'year and month query params are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('payroll_month_locks')
    .delete()
    .eq('year', year)
    .eq('month', month);

  if (error) {
    console.error('Error unlocking payroll month:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
