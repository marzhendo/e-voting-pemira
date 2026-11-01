import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getEntraAuthorizationUrl } from '@/lib/auth/oidc';

export async function GET() {
  const state = crypto.randomUUID();
  const cookieStore = cookies();

  // Simpan state di cookie untuk proteksi anti-CSRF pada alur OAuth/OIDC
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 menit
    path: '/',
  });

  const authUrl = getEntraAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
