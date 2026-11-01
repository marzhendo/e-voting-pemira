import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeEntraCodeForTokens, verifyEntraIdToken } from '@/lib/auth/oidc';
import { resolveUserIdentity } from '@/lib/auth/voter';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

  // 1. Tangani error dari Microsoft Entra jika otorisasi dibatalkan
  if (error) {
    console.error('[AuthCallback] Entra OAuth error:', error, errorDescription);
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', 'AUTH_CANCELLED');
    redirectUrl.searchParams.set('message', errorDescription || 'Otorisasi login dibatalkan oleh pengguna.');
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Validasi CSRF State Token
  const cookieStore = cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  cookieStore.set('oauth_state', '', { maxAge: 0, path: '/' }); // Bersihkan state

  if (!state || !savedState || state !== savedState) {
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', 'CSRF_MISMATCH');
    redirectUrl.searchParams.set('message', 'Validasi sesi OAuth gagal (kemungkinan serangan CSRF).');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', 'MISSING_CODE');
    redirectUrl.searchParams.set('message', 'Kode otorisasi dari Microsoft tidak ditemukan.');
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Tukarkan authorization code dengan id_token
  const tokenResult = await exchangeEntraCodeForTokens(code);
  if (!tokenResult.id_token || tokenResult.error) {
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', 'TOKEN_EXCHANGE_FAILED');
    redirectUrl.searchParams.set('message', tokenResult.error || 'Gagal menukarkan token autentikasi.');
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Verifikasi kriptografis token OIDC dan pembatasan tenant Telkom University
  const verifyResult = await verifyEntraIdToken(tokenResult.id_token);
  if (!verifyResult.valid || !verifyResult.claims) {
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', verifyResult.error || 'INVALID_TOKEN');
    redirectUrl.searchParams.set('message', verifyResult.message || 'Token Microsoft tidak sah.');
    return NextResponse.redirect(redirectUrl);
  }

  const { email, name, tid, oid } = verifyResult.claims;

  // 5. Resolusi identitas pemilih terhadap DPT dan whitelist Admin di database
  const identityResult = await resolveUserIdentity({
    email,
    name,
    entraTenantId: tid,
    entraObjectId: oid,
  });

  if (!identityResult.success || !identityResult.user) {
    const redirectUrl = new URL('/login', baseUrl);
    redirectUrl.searchParams.set('error', identityResult.code);
    redirectUrl.searchParams.set('message', identityResult.message);
    return NextResponse.redirect(redirectUrl);
  }

  // 6. Buat sesi pengguna terproteksi (HTTP-Only, Secure, SameSite)
  const sessionToken = await createSessionToken(identityResult.user);
  setSessionCookie(sessionToken);

  // 7. Pengalihan rute berdasarkan role dan status voting
  if (identityResult.user.role && identityResult.user.role !== 'voter') {
    return NextResponse.redirect(new URL('/admin/dashboard', baseUrl));
  }

  if (identityResult.user.hasVoted) {
    return NextResponse.redirect(new URL('/receipt', baseUrl));
  }

  return NextResponse.redirect(new URL('/vote', baseUrl));
}
