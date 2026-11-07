import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession, createSessionToken, setSessionCookie, type SessionUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateReceipt } from '@/lib/receipt/generator';
import { castBallotAtomicDev } from '@/lib/ballots/store';

const castBallotSchema = z.object({
  candidateId: z.string().uuid('ID kandidat harus berformat UUID yang valid.'),
});

/**
 * Endpoint Pengiriman Suara (Cast Ballot)
 * 
 * STRICT SECURITY INVARIANTS:
 * 1. ONE-MAN-ONE-VOTE: Diserialisasi secara atomik dengan database row lock (FOR UPDATE).
 * 2. SERVER-DERIVED IDENTITY: NIM diekstraksi dari sesi server yang telah terverifikasi DPT,
 *    browser DILARANG KERAS mengirimkan parameter NIM.
 * 3. BALLOT SECRECY: Tabel ballots TIDAK PERNAH menyimpan NIM, voter_id, session_id, atau IP.
 * 4. CRYPTOGRAPHIC RECEIPT: Token tanda terima dibuat di server; hanya hash SHA-256 yang disimpan
 *    di voters_whitelist dalam transaksi atomik yang sama.
 */
export async function POST(request: NextRequest) {
  // 1. Verifikasi Sesi Pemilih
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        error: 'Sesi Anda telah berakhir atau belum masuk. Silakan login kembali.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  if (!session.isDptVerified || !session.nim) {
    return NextResponse.json(
      {
        error: 'Akses Ditolak: Akun Anda tidak terdaftar dalam Daftar Pemilih Tetap (DPT).',
        code: 'NOT_REGISTERED',
      },
      { status: 403 }
    );
  }

  if (session.hasVoted) {
    return NextResponse.json(
      {
        error: 'Hak suara Anda telah digunakan sebelumnya. Anda tidak dapat memilih kembali.',
        code: 'ALREADY_VOTED',
      },
      { status: 409 }
    );
  }

  try {
    // 2. Validasi Input Browser
    const body = await request.json();
    const parsed = castBallotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Format data pemilihan tidak valid.',
          details: parsed.error.format(),
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    const { candidateId } = parsed.data;

    // 3. Hasilkan Digital Receipt Kriptografis di Server
    const receipt = generateReceipt();

    // 4. Eksekusi Transaksi Atomik Database via Stored Procedure
    const adminSupabase = createAdminClient();
    const { data: rpcResult, error: rpcError } = await adminSupabase.rpc('cast_ballot_secure', {
      p_nim: session.nim,
      p_candidate_id: candidateId,
      p_receipt_hash: receipt.receiptHash,
    });

    if (rpcError) {
      console.warn('[CastBallotRoute] Database RPC error:', rpcError);

      if (process.env.APP_ENV !== 'production') {
        castBallotAtomicDev(session.nim, candidateId, receipt.receiptHash);
        const updatedUser: SessionUser = { ...session, hasVoted: true };
        const updatedToken = await createSessionToken(updatedUser);
        setSessionCookie(updatedToken);

        return NextResponse.json({
          success: true,
          code: 'SUCCESS',
          message: 'Suara Anda berhasil dicatat secara sah (Mode Pengujian Lokal).',
          receipt: {
            token: receipt.rawToken,
            date: receipt.sessionDate,
          },
        });
      }

      return NextResponse.json(
        {
          error: 'Terjadi kegagalan transaksi pada database bilik suara.',
          code: 'TRANSACTION_FAILED',
        },
        { status: 500 }
      );
    }

    // 5. Tangani Respon Bisnis dari Stored Procedure
    if (!rpcResult || !rpcResult.success) {
      const code = rpcResult?.code || 'UNKNOWN_ERROR';
      const message = rpcResult?.message || 'Gagal merekam suara ke bilik suara.';

      const statusCodeMap: Record<string, number> = {
        ALREADY_VOTED: 409,
        VOTING_CLOSED: 409,
        MAINTENANCE_MODE: 503,
        NOT_REGISTERED: 403,
        INVALID_CANDIDATE: 422,
      };

      const httpStatus = statusCodeMap[code] || 400;

      // Jika di DB sudah tercatat pernah memilih, perbarui cookie sesi pemilih
      if (code === 'ALREADY_VOTED') {
        const updatedUser: SessionUser = { ...session, hasVoted: true };
        const updatedToken = await createSessionToken(updatedUser);
        setSessionCookie(updatedToken);
      }

      return NextResponse.json({ error: message, code }, { status: httpStatus });
    }

    // 6. Transaksi Berhasil: Mutasi Cookie Sesi Menjadi hasVoted = TRUE
    const updatedUser: SessionUser = {
      ...session,
      hasVoted: true,
    };
    const updatedToken = await createSessionToken(updatedUser);
    setSessionCookie(updatedToken);

    // 7. Kembalikan Tanda Terima Mentah Sekali Pakai ke Pemilih
    return NextResponse.json({
      success: true,
      code: 'SUCCESS',
      message: 'Suara Anda berhasil dicatat secara sah ke dalam bilik suara elektronik.',
      receipt: {
        token: receipt.rawToken,
        date: receipt.sessionDate,
      },
    });
  } catch (err) {
    console.error('[CastBallotRoute] Unexpected exception:', err);
    return NextResponse.json(
      {
        error: 'Terjadi kegagalan server yang tidak terduga saat mencatat suara.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
