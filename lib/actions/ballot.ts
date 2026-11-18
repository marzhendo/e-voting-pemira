'use server';

import { getSession } from '@/lib/auth/session';
import { castVoteForSession } from '@/lib/ballots/cast-core';

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
 * Thin adapter over castVoteForSession deep module.
 */
export async function castBallotAction(candidateId: string): Promise<CastBallotActionResult> {
  try {
    const session = await getSession();
    const result = await castVoteForSession(session, candidateId);

    return {
      success: result.success,
      code: result.code,
      message: result.message,
      receipt: result.receipt,
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
