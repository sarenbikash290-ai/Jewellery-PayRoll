import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const cookieStore = await cookies();

    if (action === 'logout') {
      cookieStore.delete('hrpulse_emp_session');
      return NextResponse.json({ ok: true });
    }

    const { employeeId } = body;
    if (!employeeId) {
      return NextResponse.json({ ok: false, error: 'Employee ID is required' }, { status: 400 });
    }

    const upperEmpId = employeeId.toUpperCase();

    if (action === 'login') {
      const { pin } = body;
      if (!pin) {
        return NextResponse.json({ ok: false, error: 'PIN is required' }, { status: 400 });
      }

      // Check if pin exists in employee_pins
      let { data: pinData, error: pinErr } = await supabase
        .from('employee_pins')
        .select('pin')
        .eq('employee_id', upperEmpId)
        .maybeSingle();

      if (pinErr) {
        console.error('Error fetching employee pin:', pinErr);
        return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
      }

      let storedPin = pinData?.pin;

      // If no PIN entry exists, verify employee exists in employees table
      if (!storedPin) {
        const { data: empData, error: empErr } = await supabase
          .from('employees')
          .select('name')
          .eq('id', upperEmpId)
          .maybeSingle();

        if (empErr) {
          console.error('Error verifying employee existence:', empErr);
          return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
        }

        if (!empData) {
          return NextResponse.json({ ok: false, error: 'Invalid Employee ID. Please check and try again.' }, { status: 401 });
        }

        // Initialize default pin
        const { error: insertErr } = await supabase
          .from('employee_pins')
          .insert({ employee_id: upperEmpId, pin: '1234' });

        if (insertErr) {
          console.error('Error initializing pin entry:', insertErr);
        }
        storedPin = '1234';
      }

      if (pin === storedPin) {
        // Fetch employee details to return
        const { data: empDetails } = await supabase
          .from('employees')
          .select('name')
          .eq('id', upperEmpId)
          .single();

        cookieStore.set('hrpulse_emp_session', upperEmpId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        });

        return NextResponse.json({
          ok: true,
          employee: {
            id: upperEmpId,
            name: empDetails?.name || 'Employee'
          }
        });
      } else {
        return NextResponse.json({ ok: false, error: 'Incorrect PIN. Please try again.' }, { status: 401 });
      }
    }

    if (action === 'changePin') {
      const { oldPin, newPin } = body;
      if (!oldPin || !newPin) {
        return NextResponse.json({ ok: false, error: 'Current and new PIN are required' }, { status: 400 });
      }

      // Fetch stored pin
      const { data: pinData, error: pinErr } = await supabase
        .from('employee_pins')
        .select('pin')
        .eq('employee_id', upperEmpId)
        .maybeSingle();

      if (pinErr) {
        console.error('Error fetching PIN during changePin:', pinErr);
        return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
      }

      const storedPin = pinData?.pin || '1234';

      if (oldPin !== storedPin) {
        return NextResponse.json({ ok: false, error: 'Current PIN is incorrect' }, { status: 401 });
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return NextResponse.json({ ok: false, error: 'New PIN must be exactly 4 digits' }, { status: 400 });
      }

      // Update PIN in DB
      const { error: updateErr } = await supabase
        .from('employee_pins')
        .upsert({ employee_id: upperEmpId, pin: newPin });

      if (updateErr) {
        console.error('Error updating employee PIN:', updateErr);
        return NextResponse.json({ ok: false, error: 'Failed to update PIN in database' }, { status: 500 });
      }

      cookieStore.set('hrpulse_emp_session', upperEmpId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'Invalid payload' }, { status: 400 });
  }
}

