import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const cookieStore = await cookies();

    if (action === 'login') {
      const { password } = body;
      const expectedPassword = process.env.ADMIN_PASSWORD || 'Bikash@123';

      if (password === expectedPassword) {
        cookieStore.set('hrpulse_admin_session', 'granted', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/',
        });
        return NextResponse.json({ ok: true });
      } else {
        return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
      }
    }

    if (action === 'check') {
      const session = cookieStore.get('hrpulse_admin_session');
      if (session && session.value === 'granted') {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    if (action === 'logout') {
      cookieStore.delete('hrpulse_admin_session');
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
