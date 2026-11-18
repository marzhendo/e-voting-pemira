import { z } from 'zod';
import {
  createSessionToken,
  setSessionCookie,
  type SessionUser,
} from '@/lib/auth/session';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { generateReceipt } from '@/lib/receipt/generator';
import { isProductionEnvironment, isDevFallbackAllowed } from '@/lib/security/env';
import { castBallotAtomicDev } from './store';

const candidateIdSchema = z.string().uuid('ID kandidat harus berformat UUID yang valid.');

export interface CastVoteResult {
  success: boolean;
  code: string;
  message: string;
  httpStatus: number;
  receipt?: {
    token: string;
    date: string;
  };
  details?: unknown;
}

const RPC_STATUS_CODE_MAP: Record<string, number> = {
  ALREADY_VOTED: 409,
  VOTING_CLOSED: 409,
  MAINTENANCE_MODE: 503,
  NOT_REGISTERED: 403,
  INVALID_CANDIDATE: 422,
};

async function markSessionVoted(session: SessionUser): Promise<void> {
  const updatedUser: SessionUser = { ...session, hasVoted: true };
  const updatedToken = await createSessionToken(updatedUser);
  setSessionCookie(updatedToken);
}

/**
 * Core Deep Module for Atomic Vote Casting.
 *
 * Enforces all strict security invariants (One-Man-One-Vote via DB row lock,
 * server-derived NIM, Ballot Secrecy isolation, and fail-closed DB guarantees)
 * for both Route Handlers (`/api/ballots`) and Server Actions (`castBallotAction`).
 */
export async function castVoteForSession(
  session: SessionUser | null,
  candidateId: string
): Promise<CastVoteResult> {
  if (!session) {
    return {
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Sesi kamu telah berakhir atau belum masuk. Silakan login kembali.',
      httpStatus: 401,
    };
  }

  if (!session.isDptVerified || !session.nim) {
    return {
      success: false,
      code: 'NOT_REGISTERED',
      message: 'Akses Ditolak: Akun kamu tidak terdaftar dalam Daftar Pemilih Tetap (DPT).',
      httpStatus: 403,
    };
  }

  if (session.hasVoted) {
    return {
      success: false,
      code: 'ALREADY_VOTED',
      message: 'Hak suara kamu telah digunakan sebelumnya. Kamu tidak dapat memilih kembali.',
      httpStatus: 409,
    };
  }

  const parsed = candidateIdSchema.safeParse(candidateId);
  if (!parsed.success) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      message: 'Format data pemilihan tidak valid.',
      httpStatus: 400,
      details: parsed.error.format(),
    };
  }

  const receipt = generateReceipt();

  // Offline / Local Dev Testing Mode (only when Supabase is unconfigured & non-production)
  if (!isSupabaseConfigured()) {
    if (!isDevFallbackAllowed(false)) {
      return {
        success: false,
        code: 'SERVER_ERROR',
        message: 'Konfigurasi basis data tidak tersedia.',
        httpStatus: 500,
      };
    }

    const devResult = castBallotAtomicDev(session.nim, candidateId, receipt.receiptHash);
    if (!devResult.success) {
      if (devResult.code === 'ALREADY_VOTED') {
        await markSessionVoted(session);
      }
      return {
        success: false,
        code: devResult.code,
        message: devResult.message,
        httpStatus: RPC_STATUS_CODE_MAP[devResult.code] || 400,
      };
    }

    await markSessionVoted(session);
    return {
      success: true,
      code: 'SUCCESS',
      message: 'Suara kamu berhasil dicatat secara sah (Mode Pengujian Lokal).',
      httpStatus: 200,
      receipt: {
        token: receipt.rawToken,
        date: receipt.sessionDate,
      },
    };
  }

  // Live Supabase Atomic Transaction (Fail-Closed)
  const adminSupabase = createAdminClient();
  const { data: rpcResult, error: rpcError } = await adminSupabase.rpc('cast_ballot_secure', {
    p_nim: session.nim,
    p_candidate_id: candidateId,
    p_receipt_hash: receipt.receiptHash,
  });

  if (rpcError) {
    console.error('[CastVoteCore] Database RPC error (fail-closed):', rpcError);
    return {
      success: false,
      code: 'TRANSACTION_FAILED',
      message:
        'Terjadi kegagalan transaksi pada database bilik suara. Suara tidak tercatat — silakan coba kembali.',
      httpStatus: 500,
    };
  }

  if (!rpcResult || !rpcResult.success) {
    // Allow synthetic mock accounts to exercise dev atomic store only when not in production
    if (
      !isProductionEnvironment() &&
      rpcResult?.code === 'NOT_REGISTERED' &&
      (session.id?.startsWith('mock-') || session.id?.startsWith('dev-'))
    ) {
      const devResult = castBallotAtomicDev(session.nim, candidateId, receipt.receiptHash);
      if (devResult.success) {
        await markSessionVoted(session);
        return {
          success: true,
          code: 'SUCCESS',
          message: 'Suara kamu berhasil dicatat secara sah (Mode Pengujian Lokal).',
          httpStatus: 200,
          receipt: {
            token: receipt.rawToken,
            date: receipt.sessionDate,
          },
        };
      }
    }

    const code = rpcResult?.code || 'UNKNOWN_ERROR';
    const message = rpcResult?.message || 'Gagal merekam suara ke bilik suara.';

    if (code === 'ALREADY_VOTED') {
      await markSessionVoted(session);
    }

    return {
      success: false,
      code,
      message,
      httpStatus: RPC_STATUS_CODE_MAP[code] || 400,
    };
  }

  await markSessionVoted(session);
  return {
    success: true,
    code: 'SUCCESS',
    message: 'Suara kamu berhasil dicatat secara sah ke dalam bilik suara elektronik.',
    httpStatus: 200,
    receipt: {
      token: receipt.rawToken,
      date: receipt.sessionDate,
    },
  };
}
