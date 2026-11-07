import { createHash } from 'node:crypto';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getAllVoters } from '@/lib/dpt/store';

export interface GeneratedReceipt {
  rawToken: string;
  receiptHash: string;
  sessionDate: string;
}

export interface ReceiptVerificationResult {
  valid: boolean;
  message: string;
  details?: {
    receiptHash: string;
    voterCohort?: number;
    votedAt?: string | null;
  };
}

/**
 * Computes a deterministic SHA-256 hash of a raw receipt token.
 */
export function hashReceiptToken(rawToken: string): string {
  const normalized = rawToken.trim().toUpperCase();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generates a high-entropy digital voting receipt.
 * The raw token is delivered once to the voter; only the SHA-256 hash
 * is persisted in the database.
 */
export function generateReceipt(): GeneratedReceipt {
  const randomSegment = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
  const rawToken = `HMIF-PEMIRA-${randomSegment.slice(0, 4)}-${randomSegment.slice(4, 8)}-${randomSegment.slice(8, 12)}-${randomSegment.slice(12, 16)}`;
  const receiptHash = hashReceiptToken(rawToken);

  const sessionDate = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return {
    rawToken,
    receiptHash,
    sessionDate,
  };
}

/**
 * Verifies the authenticity of a receipt token against the database.
 * 
 * STRICT BALLOT SECRECY INVARIANT:
 * This verification checks ONLY the presence of receipt_hash in voters_whitelist.
 * It NEVER links to or reveals the candidate chosen in the ballots table.
 */
export async function verifyReceiptToken(rawToken: string): Promise<ReceiptVerificationResult> {
  try {
    if (!rawToken || rawToken.trim().length < 10) {
      return {
        valid: false,
        message: 'Format kode tanda terima tidak valid.',
      };
    }

    const receiptHash = hashReceiptToken(rawToken);

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data: voterRecord, error } = await adminSupabase
          .from('voters_whitelist')
          .select('generation, voted_at')
          .eq('receipt_hash', receiptHash)
          .maybeSingle();

        if (!error && voterRecord) {
          return {
            valid: true,
            message: 'Kode tanda terima sah dan terverifikasi secara resmi di basis data KPR HMIF.',
            details: {
              receiptHash,
              voterCohort: voterRecord.generation,
              votedAt: voterRecord.voted_at,
            },
          };
        }
      } catch (dbErr) {
        console.warn('[ReceiptVerification] Database query error, trying dev store:', dbErr);
      }
    }

    // Dev store fallback saat Supabase belum tersambung
    const allVoters = getAllVoters();
    const matchedVoter = allVoters.find(
      (v) => v.receipt_hash === receiptHash && v.has_voted
    );

    if (matchedVoter) {
      return {
        valid: true,
        message: 'Kode tanda terima sah dan terverifikasi di basis data resmi Pemira HMIF.',
        details: {
          receiptHash,
          voterCohort: matchedVoter.generation,
          votedAt: matchedVoter.voted_at || matchedVoter.updated_at,
        },
      };
    }

    return {
      valid: false,
      message: 'Kode tanda terima tidak ditemukan dalam basis data resmi Pemira HMIF.',
    };
  } catch (err) {
    console.error('[ReceiptVerification] Unexpected error:', err);
    return {
      valid: false,
      message: 'Gagal memproses verifikasi tanda terima.',
    };
  }
}
