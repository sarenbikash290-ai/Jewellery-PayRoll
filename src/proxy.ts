import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication (login/auth endpoints)
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/auth/employee',
  '/api/otp',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname === route);
}

// Centralized auth gate for ALL API routes
// Blocks unauthenticated requests before they reach any route handler
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public auth endpoints through (login, OTP)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Block direct browser navigation to API URLs
  // When someone types an API URL into the address bar, the browser sends
  // Sec-Fetch-Dest: document. Legitimate fetch() calls from the app send
  // Sec-Fetch-Dest: empty. This prevents data exposure even for logged-in users.
  const fetchDest = request.headers.get('sec-fetch-dest');
  if (fetchDest === 'document') {
    return Response.json(
      { ok: false, error: 'Direct API access is not allowed. Please use the application.' },
      { status: 403 }
    );
  }

  // Check for either admin or employee session cookie
  const adminSession = request.cookies.get('hrpulse_admin_session');
  const empSession = request.cookies.get('hrpulse_emp_session');

  const isAuthenticated =
    (adminSession && adminSession.value === 'granted') ||
    (empSession && empSession.value);

  if (!isAuthenticated) {
    return Response.json(
      { ok: false, error: 'Unauthorized — no valid session' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Run proxy on all API routes
export const config = {
  matcher: '/api/:path*',
};
