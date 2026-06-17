import { NextResponse } from 'next/server';

// Temporary in-memory store for leaves (demonstration only)
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

let leavesStore: LeaveApp[] = [
  { id: 'LV001', employeeId: 'EMP001', employeeName: 'Arjun Soni', type: 'PL', from: '2026-06-18', to: '2026-06-20', reason: 'Family function at hometown', status: 'pending', appliedOn: '2026-06-15' },
  { id: 'LV002', employeeId: 'EMP002', employeeName: 'Priya Mehta', type: 'SL', from: '2026-06-10', to: '2026-06-10', reason: 'Medical checkup', status: 'approved', appliedOn: '2026-06-09' },
  { id: 'LV003', employeeId: 'EMP005', employeeName: 'Suresh Jain', type: 'CL', from: '2026-06-25', to: '2026-06-25', reason: 'Personal work', status: 'pending', appliedOn: '2026-06-14' },
];

export async function GET() {
  return NextResponse.json({ ok: true, leaves: leavesStore });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, employeeName, type, from, to, reason } = body;

    if (!employeeId || !type || !from || !to || !reason) {
      return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
    }

    const newLeave: LeaveApp = {
      id: `LV${String(leavesStore.length + 1).padStart(3, '0')}`,
      employeeId,
      employeeName: employeeName || 'Unknown Employee',
      type,
      from,
      to,
      reason,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    leavesStore.push(newLeave);
    return NextResponse.json({ ok: true, leave: newLeave });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const index = leavesStore.findIndex(l => l.id === id);
    if (index === -1) {
      return NextResponse.json({ ok: false, error: 'Leave request not found' }, { status: 404 });
    }

    leavesStore[index].status = status;
    return NextResponse.json({ ok: true, leave: leavesStore[index] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
