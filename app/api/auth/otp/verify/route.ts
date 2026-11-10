import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyVoterOtp } from '@/lib/auth/otp';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  isSecureCookieEnvironment,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const VerifyOtpSchema = z.object({
  identifier: z.string().min(4, 'NIM atau email wajib diisi.'),
  pin: z.string().regex(/^\d{6}$/, 'Kode PIN harus berupa 6 digit angka.'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Input PIN tidak valid.',
        },
        { status: 400 }
      );
    }

    const result = await verifyVoterOtp(parsed.data.identifier, parsed.data.pin);

    if (!result.success || !result.voter) {
      const status =
        result.code === 'NIM_NOT_IN_DPT'
          ? 404
          : result.code === 'ALREADY_VOTED'
          ? 403
          : result.code === 'OTP_EXPIRED' || result.code === 'MAX_ATTEMPTS_EXCEEDED'
          ? 410
          : result.code === 'INVALID_PIN'
          ? 401
          : 400;

      return NextResponse.json(
        {
          success: false,
          code: result.code,
          error: result.error,
          remainingAttempts: result.remainingAttempts,
        },
        { status }
      );
    }

    // 1. Buat JWT Session Token
    const sessionToken = await createSessionToken(result.voter);

    // 2. Siapkan response dan set Cookie (HTTPOnly, Secure, SameSite=Strict)
    const isSecure = isSecureCookieEnvironment();

    const isStaff = result.voter.role && result.voter.role !== 'voter';
    const destination = isStaff
      ? '/admin/dashboard'
      : result.voter.hasVoted
      ? '/receipt'
      : '/vote';

    const response = NextResponse.json({
      success: true,
      message: isStaff
        ? 'Verifikasi berhasil. Mengarahkan ke dashboard administrator...'
        : 'Verifikasi berhasil. Mengarahkan ke bilik suara...',
      redirectTo: destination,
      user: {
        name: result.voter.name,
        nim: result.voter.nim,
        role: result.voter.role,
        hasVoted: result.voter.hasVoted,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[ApiVerifyOtp] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kegagalan server saat memverifikasi kode PIN.',
      },
      { status: 500 }
    );
  }
}
