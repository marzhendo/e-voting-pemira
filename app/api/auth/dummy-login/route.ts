import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateDummyUser, isDummyAuthAllowed, DUMMY_ACCOUNTS } from '@/lib/auth/dummy';
import { createSessionToken, setSessionCookie, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session';

const dummyLoginSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
});

export async function GET() {
  if (!isDummyAuthAllowed()) {
    return NextResponse.json(
      { error: 'Dummy authentication is strictly disabled in production.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    enabled: true,
    accounts: DUMMY_ACCOUNTS,
  });
}

export async function POST(request: NextRequest) {
  if (!isDummyAuthAllowed()) {
    return NextResponse.json(
      { error: 'Akses ditolak: Autentikasi dummy dilarang keras aktif pada lingkungan produksi.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = dummyLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { accountId } = parsed.data;
    const authResult = await authenticateDummyUser(accountId);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.message, code: authResult.code },
        { status: 403 }
      );
    }

    // Buat token JWT sesi
    const sessionToken = await createSessionToken(authResult.user);
    setSessionCookie(sessionToken);

    const isProductionHttps =
      process.env.APP_ENV === 'production' &&
      !process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://localhost');

    const response = NextResponse.json({
      success: true,
      code: authResult.code,
      message: authResult.message,
      user: authResult.user,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isProductionHttps,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[DummyLoginRoute] Error processing dummy login:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses login dummy.' },
      { status: 500 }
    );
  }
}
