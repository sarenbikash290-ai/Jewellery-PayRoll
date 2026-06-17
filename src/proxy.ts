import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect API routes: only allow requests from logged-in admin or employees
  if (pathname.startsWith('/api/attendance') || pathname.startsWith('/api/leaves')) {
    const adminSession = request.cookies.get('hrpulse_admin_session');
    const empSession = request.cookies.get('hrpulse_emp_session');

    const isAdmin = adminSession && adminSession.value === 'granted';
    const isEmp = empSession && empSession.value;

    if (!isAdmin && !isEmp) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/attendance/:path*', '/api/leaves/:path*'],
};
