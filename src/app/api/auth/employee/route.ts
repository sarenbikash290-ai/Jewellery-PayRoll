import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeJsonAtomic } from '@/utils/db';

const DATA_DIR = path.join(process.cwd(), 'data');
const PINS_FILE = path.join(DATA_DIR, 'employee_pins.json');

const defaultPins: Record<string, string> = {
  'EMP001': '1234', 'EMP002': '1234', 'EMP003': '1234', 'EMP004': '1234',
  'EMP005': '1234', 'EMP006': '1234', 'EMP007': '1234', 'EMP008': '1234',
  'EMP009': '1234', 'EMP010': '1234', 'EMP011': '1234', 'EMP012': '1234',
};

function loadPins(): Record<string, string> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(PINS_FILE)) {
      const data = fs.readFileSync(PINS_FILE, 'utf-8');
      return JSON.parse(data);
    } else {
      writeJsonAtomic(PINS_FILE, defaultPins);
      return defaultPins;
    }
  } catch (e) {
    console.error('Error loading employee PINs:', e);
    return defaultPins;
  }
}

function savePins(pins: Record<string, string>) {
  try {
    writeJsonAtomic(PINS_FILE, pins);
  } catch (e) {
    console.error('Error saving employee PINs:', e);
  }
}

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

    const pins = loadPins();

    if (action === 'login') {
      const { pin } = body;
      let storedPin = pins[employeeId.toUpperCase()];

      // If no PIN is registered for this employee, default to '1234'
      if (!storedPin) {
        storedPin = '1234';
      }

      if (pin === storedPin) {
        if (!pins[employeeId.toUpperCase()]) {
          pins[employeeId.toUpperCase()] = '1234';
          savePins(pins);
        }
        cookieStore.set('hrpulse_emp_session', employeeId.toUpperCase(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        });
        return NextResponse.json({ ok: true });
      } else {
        return NextResponse.json({ ok: false, error: 'Incorrect PIN' }, { status: 401 });
      }
    }

    if (action === 'changePin') {
      const { oldPin, newPin } = body;
      const storedPin = pins[employeeId.toUpperCase()] || '1234';

      if (oldPin !== storedPin) {
        return NextResponse.json({ ok: false, error: 'Current PIN is incorrect' }, { status: 401 });
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return NextResponse.json({ ok: false, error: 'New PIN must be exactly 4 digits' }, { status: 400 });
      }

      pins[employeeId.toUpperCase()] = newPin;
      savePins(pins);

      cookieStore.set('hrpulse_emp_session', employeeId.toUpperCase(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
