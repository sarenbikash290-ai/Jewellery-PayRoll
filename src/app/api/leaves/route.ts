import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeJsonAtomic } from '@/utils/db';
import { cookies } from 'next/headers';

interface LeaveApp {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  from: string;
  to: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LEAVES_FILE = path.join(DATA_DIR, 'leaves.json');

function loadLeaves(): LeaveApp[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LEAVES_FILE)) {
      const data = fs.readFileSync(LEAVES_FILE, 'utf-8');
      return JSON.parse(data);
    } else {
      const initial: LeaveApp[] = [
        { id: 'LV001', employeeId: 'EMP001', employeeName: 'Arjun Soni', type: 'PL', from: '2026-06-18', to: '2026-06-20', reason: 'Family function at hometown', status: 'pending', appliedOn: '2026-06-15' },
        { id: 'LV002', employeeId: 'EMP002', employeeName: 'Priya Mehta', type: 'SL', from: '2026-06-10', to: '2026-06-10', reason: 'Medical checkup', status: 'approved', appliedOn: '2026-06-09' },
        { id: 'LV003', employeeId: 'EMP005', employeeName: 'Suresh Jain', type: 'CL', from: '2026-06-25', to: '2026-06-25', reason: 'Personal work', status: 'pending', appliedOn: '2026-06-14' },
      ];
      writeJsonAtomic(LEAVES_FILE, initial);
      return initial;
    }
  } catch (e) {
    console.error('Error loading leaves file:', e);
    return [];
  }
}

function saveLeaves(leaves: LeaveApp[]) {
  try {
    writeJsonAtomic(LEAVES_FILE, leaves);
  } catch (e) {
    console.error('Error saving leaves file:', e);
  }
}

export async function GET() {
  const leaves = loadLeaves();
  return NextResponse.json({ ok: true, leaves });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, employeeName, type, from, to, reason } = body;

    if (!employeeId || !type || !from || !to || !reason) {
      return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
    }

    const leaves = loadLeaves();
    const newLeave: LeaveApp = {
      id: `LV${String(leaves.length + 1).padStart(3, '0')}`,
      employeeId,
      employeeName: employeeName || 'Unknown Employee',
      type,
      from,
      to,
      reason,
      status: 'pending',
      appliedOn: (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })()
    };

    leaves.push(newLeave);
    saveLeaves(leaves);
    return NextResponse.json({ ok: true, leave: newLeave });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('hrpulse_admin_session');
    if (!session || session.value !== 'granted') {
      return NextResponse.json({ ok: false, error: 'Unauthorized administrative action' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const leaves = loadLeaves();
    const index = leaves.findIndex(l => l.id === id);
    if (index === -1) {
      return NextResponse.json({ ok: false, error: 'Leave request not found' }, { status: 404 });
    }

    leaves[index].status = status;
    saveLeaves(leaves);
    return NextResponse.json({ ok: true, leave: leaves[index] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
