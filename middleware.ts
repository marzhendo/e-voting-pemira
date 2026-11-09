import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getClientIp } from '@/lib/auth/client-ip';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  const clientIp = getClientIp(request.headers);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-client-ip', clientIp);

  // 1. PROTEKSI API ADMINISTRATOR (/api/admin/*)
  // Aturan non-negotiable: Mahasiswa biasa / akun tanpa role admin WAJIB menerima HTTP 403
  if (pathname.startsWith('/api/admin')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan untuk mengakses endpoint ini.' },
        { status: 401 }
      );
    }

    if (!session.role || session.role === 'voter') {
      return NextResponse.json(
        {
          error: 'Akses Ditolak: Anda tidak memiliki wewenang administratif Panitia Pemira.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. PROTEKSI HALAMAN DASHBOARD ADMINISTRATOR (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'ADMIN_AUTH_REQUIRED');
      return NextResponse.redirect(loginUrl);
    }

    if (!session.role || session.role === 'voter') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'ADMIN_FORBIDDEN');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. PROTEKSI BILIK SUARA (/vote)
  if (pathname === '/vote') {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'VOTE_SESSION_REQUIRED');
      return NextResponse.redirect(loginUrl);
    }

    // Jika bukan pemilih yang tervalidasi di DPT (misal panitia murni yang bukan pemilih)
    if (!session.isDptVerified) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'NOT_REGISTERED');
      return NextResponse.redirect(loginUrl);
    }

    // Jika sudah pernah memilih, langsung alihkan ke halaman tanda terima
    if (session.hasVoted) {
      return NextResponse.redirect(new URL('/receipt', request.url));
    }
  }

  // 4. PROTEKSI HALAMAN TANDA TERIMA (/receipt)
  if (pathname === '/receipt') {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/vote',
    '/receipt',
  ],
};
