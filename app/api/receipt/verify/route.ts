import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyReceiptToken } from '@/lib/receipt/generator';

export const dynamic = 'force-dynamic';

const verifyReceiptSchema = z.object({
  token: z.string().min(5, 'Kode tanda terima wajib diisi.'),
});

function formatVotingDate(isoDate?: string | null): string {
  if (!isoDate) {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' WIB';
  } catch {
    return isoDate;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get('token');

    if (!rawToken || rawToken.trim().length < 5) {
      return NextResponse.json(
        {
          valid: false,
          verified: false,
          message: 'Parameter token tanda terima tidak valid atau kosong.',
        },
        { status: 400 }
      );
    }

    const result = await verifyReceiptToken(rawToken);

    return NextResponse.json(
      {
        valid: result.valid,
        verified: result.valid,
        message: result.message,
        votingSessionDate: formatVotingDate(result.details?.votedAt),
        details: result.details,
      },
      { status: result.valid ? 200 : 404 }
    );
  } catch (error) {
    console.error('[VerifyReceiptRoute] GET error:', error);
    return NextResponse.json(
      {
        valid: false,
        verified: false,
        message: 'Terjadi kegagalan server saat memverifikasi tanda terima.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyReceiptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          valid: false,
          verified: false,
          message: 'Format kode tanda terima tidak valid.',
        },
        { status: 400 }
      );
    }

    const result = await verifyReceiptToken(parsed.data.token);

    return NextResponse.json(
      {
        valid: result.valid,
        verified: result.valid,
        message: result.message,
        votingSessionDate: formatVotingDate(result.details?.votedAt),
        details: result.details,
      },
      { status: result.valid ? 200 : 404 }
    );
  } catch (error) {
    console.error('[VerifyReceiptRoute] POST error:', error);
    return NextResponse.json(
      {
        valid: false,
        verified: false,
        message: 'Terjadi kegagalan server saat memverifikasi tanda terima.',
      },
      { status: 500 }
    );
  }
}
