import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requestVoterOtp } from '@/lib/auth/otp';

export const dynamic = 'force-dynamic';

const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.telkomuniversity\.ac\.id$/i;
const NIM_REGEX = /^[0-9]{8,15}$/;

const RequestOtpSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(4, 'NIM wajib diisi.')
    .refine(
      (val) => {
        const clean = val.toLowerCase();
        // Whitelist khusus akun Superadmin utama
        if (clean === 'marzhendogalangs@gmail.com') return true;
        // Wajib NIM resmi (8-15 digit) atau email institusi mahasiswa
        return NIM_REGEX.test(clean) || STUDENT_EMAIL_REGEX.test(clean);
      },
      {
        message:
          'Format NIM tidak valid. Pastikan Anda memasukkan NIM resmi yang terdaftar.',
      }
    ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Input tidak valid.',
        },
        { status: 400 }
      );
    }

    const result = await requestVoterOtp(parsed.data.identifier);

    if (!result.success) {
      const status =
        result.code === 'NIM_NOT_IN_DPT'
          ? 404
          : result.code === 'ALREADY_VOTED'
          ? 403
          : result.code === 'RATE_LIMITED'
          ? 429
          : 500;

      return NextResponse.json(
        {
          success: false,
          code: result.code,
          error: result.error,
          cooldownSeconds: result.cooldownSeconds,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      maskedEmail: result.maskedEmail,
      cooldownSeconds: result.cooldownSeconds || 60,
    });
  } catch (err) {
    console.error('[ApiRequestOtp] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kegagalan server saat memproses permintaan kode PIN.',
      },
      { status: 500 }
    );
  }
}
