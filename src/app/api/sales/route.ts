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

function mapSaleToClient(s: any) {
  return {
    id: s.id,
    employeeId: s.employee_id,
    date: s.date,
    product: s.product,
    amount: Number(s.amount)
  };
}

// 1. GET: Fetch all sales transactions
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase.from('sales').select('*');
  if (session.role === 'employee') {
    query = query.eq('employee_id', session.employeeId);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const sales = (data || []).map(mapSaleToClient);
  return NextResponse.json({ ok: true, sales });
}

// 2. POST: Create sales transaction or reset
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const body = await request.json();

    // Reset Data action
    if (body.action === 'resetData') {
      const { error } = await supabase.from('sales').delete().neq('id', '');
      if (error) {
        console.error('Error resetting sales in Supabase:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const { employeeId, date, product, amount } = body;

    if (!employeeId || !date || !product || amount === undefined) {
      return NextResponse.json({ ok: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Determine the next Sale ID SALExxx
    const { data: allSales, error: fetchErr } = await supabase
      .from('sales')
      .select('id');
    
    if (fetchErr) throw fetchErr;

    const maxNum = (allSales || []).reduce((max, s) => {
      const num = parseInt(s.id.replace('SALE', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextId = `SALE${String(maxNum + 1).padStart(3, '0')}`;

    const { data: newSale, error: insertErr } = await supabase
      .from('sales')
      .insert({
        id: nextId,
        employee_id: employeeId.toUpperCase(),
        date,
        product,
        amount
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting sale:', insertErr);
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sale: mapSaleToClient(newSale) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}

// 3. DELETE: Remove sales record
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing sales record ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sales record:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}
