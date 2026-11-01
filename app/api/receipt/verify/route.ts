import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyReceiptToken } from '@/lib/receipt/generator';

const verifyReceiptSchema = z.object({
  token: z.string().min(5, 'Kode tanda terima wajib diisi.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyReceiptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, message: 'Format kode tanda terima tidak valid.' },
        { status: 400 }
      );
    }

    const result = await verifyReceiptToken(parsed.data.token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: result.message,
      details: result.details,
    });
  } catch (error) {
    console.error('[VerifyReceiptRoute] Error verifying receipt:', error);
    return NextResponse.json(
      { valid: false, message: 'Terjadi kegagalan server saat memverifikasi tanda terima.' },
      { status: 500 }
    );
  }
}
