import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requestVoterOtp } from '@/lib/auth/otp';

export const dynamic = 'force-dynamic';

const RequestOtpSchema = z.object({
  identifier: z.string().min(4, 'NIM atau email wajib diisi.'),
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
