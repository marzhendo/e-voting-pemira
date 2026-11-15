import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { AdminRole } from '@/lib/supabase/types';

export const SESSION_COOKIE_NAME = 'hmif_voting_session';
export const SESSION_MAX_AGE_SECONDS = 15 * 60; // 15 menit sesuai batas PRD bilik suara

export interface SessionUser {
  id: string; // Internal DPT uuid or admin uuid
  email: string;
  name: string;
  nim?: string; // Authoritative NIM derived server-side from DPT
  role?: AdminRole | 'voter';
  isDptVerified: boolean;
  hasVoted: boolean;
  generation?: number;
  entraTenantId?: string | null;
  entraObjectId?: string | null;
}

interface SessionJwtPayload extends SessionUser {
  iat: number;
  exp: number;
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'dev-session-secret-must-be-changed-in-production-at-least-32-chars';
  if (process.env.APP_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
    throw new Error('FATAL SECURITY ERROR: SESSION_SECRET must be at least 32 characters in production.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Creates an encrypted/signed JWT session token.
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const secret = getSessionSecret();
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

/**
 * Verifies and decodes a session JWT token.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const sessionPayload = payload as unknown as SessionJwtPayload;
    return {
      id: sessionPayload.id,
      email: sessionPayload.email,
      name: sessionPayload.name,
      nim: sessionPayload.nim,
      role: sessionPayload.role,
      isDptVerified: sessionPayload.isDptVerified,
      hasVoted: sessionPayload.hasVoted,
      generation: sessionPayload.generation,
      entraTenantId: sessionPayload.entraTenantId,
      entraObjectId: sessionPayload.entraObjectId,
    };
  } catch {
    return null;
  }
}

/**
 * Evaluates whether secure cookies must be enforced based on environment and protocol.
 * Flag `Secure` HANYA diaktifkan jika aplikasi benar-benar diakses lewat HTTPS.
 * Jika diakses lewat HTTP (misal: http://103.155.224.62 saat testing di VPS),
 * browser akan menolak menyimpan cookie yang ber-flag Secure.
 */
export function isSecureCookieEnvironment(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || '';
  return appUrl.startsWith('https://');
}

/**
 * Sets the session cookie on the current HTTP response.
 * Enforces security standard: HTTPOnly, Secure (saat HTTPS), SameSite=Lax.
 */
export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  const isSecure = isSecureCookieEnvironment();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
}

/**
 * Reads and verifies the current session from incoming cookies.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return null;
  }
  return verifySessionToken(cookie.value);
}

/**
 * Clears the session cookie on logout.
 */
export function clearSessionCookie() {
  const cookieStore = cookies();
  const isSecure = isSecureCookieEnvironment();

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
