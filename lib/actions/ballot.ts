'use server';

import { z } from 'zod';
import { getSession, createSessionToken, setSessionCookie, type SessionUser } from '@/lib/auth/session';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { generateReceipt } from '@/lib/receipt/generator';
import { castBallotAtomicDev } from '@/lib/ballots/store';

const candidateIdSchema = z.string().uuid('ID kandidat harus berformat UUID yang valid.');

export interface CastBallotActionResult {
  success: boolean;
  code: string;
  message: string;
  receipt?: {
    token: string;
    date: string;
  };
}

/**
 * Server Action untuk pengiriman suara dari bilik suara digital.
 * 
 * STRICT INVARIANT:
 * Browser hanya menyuplai candidateId. NIM pemilih diekstraksi dari sesi server.
 */
export async function castBallotAction(candidateId: string): Promise<CastBallotActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.',
    };
  }

  if (!session.isDptVerified || !session.nim) {
    return {
      success: false,
      code: 'NOT_REGISTERED',
      message: 'Akses Ditolak: Anda tidak terdaftar dalam Daftar Pemilih Tetap (DPT).',
    };
  }

  if (session.hasVoted) {
    return {
      success: false,
      code: 'ALREADY_VOTED',
      message: 'Hak suara Anda telah digunakan sebelumnya.',
    };
  }

  const parsed = candidateIdSchema.safeParse(candidateId);
  if (!parsed.success) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      message: 'Pilihan kandidat tidak berformat UUID yang valid.',
    };
  }

  try {
    const receipt = generateReceipt();

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();

      // Panggil Stored Procedure Atomik
      const { data: rpcResult, error: rpcError } = await adminSupabase.rpc('cast_ballot_secure', {
        p_nim: session.nim,
        p_candidate_id: candidateId,
        p_receipt_hash: receipt.receiptHash,
      });

      if (rpcError) {
        console.warn('[CastBallotAction] Database RPC error:', rpcError);
        return {
          success: false,
          code: 'TRANSACTION_FAILED',
          message: 'Terjadi kegagalan transaksi pada basis data.',
        };
      }

      if (!rpcResult || !rpcResult.success) {
        const code = rpcResult?.code || 'UNKNOWN_ERROR';
        const message = rpcResult?.message || 'Gagal merekam suara ke bilik suara.';

        if (code === 'ALREADY_VOTED') {
          const updatedUser: SessionUser = { ...session, hasVoted: true };
          const updatedToken = await createSessionToken(updatedUser);
          setSessionCookie(updatedToken);
        }

        return {
          success: false,
          code,
          message,
        };
      }
    }

    // Dev fallback jika database Supabase belum terhubung saat pengujian lokal
    if (!isSupabaseConfigured()) {
      const devResult = castBallotAtomicDev(session.nim, candidateId, receipt.receiptHash);

      if (!devResult.success) {
        if (devResult.code === 'ALREADY_VOTED') {
          const updatedUser: SessionUser = { ...session, hasVoted: true };
          const updatedToken = await createSessionToken(updatedUser);
          setSessionCookie(updatedToken);
        }
        return {
          success: false,
          code: devResult.code,
          message: devResult.message,
        };
      }
    }

    const updatedUser: SessionUser = { ...session, hasVoted: true };
    const updatedToken = await createSessionToken(updatedUser);
    setSessionCookie(updatedToken);

    return {
      success: true,
      code: 'SUCCESS',
      message: 'Suara Anda berhasil dicatat secara sah.',
      receipt: {
        token: receipt.rawToken,
        date: receipt.sessionDate,
      },
    };
  } catch (error) {
    console.error('[CastBallotAction] Unexpected exception:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      message: 'Terjadi kegagalan server saat mengirim suara.',
    };
  }
}
