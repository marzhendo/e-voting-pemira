import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getEntraAuthorizationUrl } from '@/lib/auth/oidc';
import { authenticateWithPassword, loginCredentialsSchema } from '@/lib/auth/voter-auth';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, isSecureCookieEnvironment } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginCredentialsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format input tidak valid. Pastikan NIM dan Kata Sandi Pemilih terisi.',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { nim, password, redirect } = parsed.data;
    const result = await authenticateWithPassword(nim, password, redirect);

    if (!result.success || !result.token) {
      const statusMap: Record<string, number> = {
        NIM_NOT_IN_DPT: 404,
        ACCOUNT_LOCKED: 423,
        INVALID_PASSWORD: 401,
        PASSWORD_NOT_SET: 400,
        MAINTENANCE_MODE: 503,
        SERVER_ERROR: 500,
      };

      return NextResponse.json(
        {
          success: false,
          code: result.code,
          error: result.message,
          remainingAttempts: result.remainingAttempts,
          lockoutMinutes: result.lockoutMinutes,
        },
        { status: statusMap[result.code] || 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
      redirectUrl: result.redirectUrl,
      user: {
        name: result.user?.name,
        nim: result.user?.nim,
        role: result.user?.role,
        hasVoted: result.user?.hasVoted,
      },
    });

    const isSecure = isSecureCookieEnvironment();
    response.cookies.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[ApiLogin] Error processing voter login:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kegagalan server saat memproses login.' },
      { status: 500 }
    );
  }
}
