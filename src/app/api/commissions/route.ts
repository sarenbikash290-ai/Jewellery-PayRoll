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

function mapCommissionToClient(c: any) {
  return {
    id: c.id,
    leadId: c.lead_id,
    leadName: c.lead_name,
    position: c.position,
    amount: Number(c.amount),
    performance: c.performance,
    month: c.month,
    status: c.status,
    createdAt: c.created_at
  };
}

// 1. GET: Fetch commissions
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase.from('commissions').select('*');
  if (session.role === 'employee') {
    query = query.eq('lead_id', session.employeeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const commissions = (data || []).map(mapCommissionToClient);
  return NextResponse.json({ ok: true, commissions });
}

// 2. POST: Create commission or reset
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const body = await request.json();

    // Reset Data action
    if (body.action === 'resetData') {
      const { error } = await supabase.from('commissions').delete().neq('id', '');
      if (error) {
        console.error('Error resetting commissions in Supabase:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const { leadId, leadName, position, amount, performance, month, status } = body;

    if (!leadId || !leadName || !position || amount === undefined || !performance || !month) {
      return NextResponse.json({ ok: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Determine the next Commission ID COMxxx
    const { data: allComs, error: fetchErr } = await supabase
      .from('commissions')
      .select('id');
    
    if (fetchErr) throw fetchErr;

    const maxNum = (allComs || []).reduce((max, c) => {
      const num = parseInt(c.id.replace('COM', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextId = `COM${String(maxNum + 1).padStart(3, '0')}`;

    const { data: newCom, error: insertErr } = await supabase
      .from('commissions')
      .insert({
        id: nextId,
        lead_id: leadId,
        lead_name: leadName,
        position,
        amount,
        performance,
        month,
        status: status || 'pending'
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting commission:', insertErr);
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, commission: mapCommissionToClient(newCom) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}

// 3. PATCH: Update commission status/details
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const body = await request.json();
    const { id, leadId, leadName, position, amount, performance, month, status } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing commission ID' }, { status: 400 });
    }

    const updates: any = {};
    if (leadId) updates.lead_id = leadId;
    if (leadName) updates.lead_name = leadName;
    if (position) updates.position = position;
    if (amount !== undefined) updates.amount = amount;
    if (performance) updates.performance = performance;
    if (month) updates.month = month;
    if (status) updates.status = status;

    const { data: updatedCom, error } = await supabase
      .from('commissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating commission:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, commission: mapCommissionToClient(updatedCom) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}

// 4. DELETE: Remove commission record
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing commission ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting commission:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}
