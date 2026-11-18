import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { castVoteForSession } from '@/lib/ballots/cast-core';

/**
 * Endpoint Pengiriman Suara (Cast Ballot)
 * Thin HTTP adapter delegating all security & transactional invariants to castVoteForSession.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const candidateId = typeof body?.candidateId === 'string' ? body.candidateId : '';

    const result = await castVoteForSession(session, candidateId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message,
          code: result.code,
          ...(result.details ? { details: result.details } : {}),
        },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json({
      success: true,
      code: result.code,
      message: result.message,
      receipt: result.receipt,
    });
  } catch (err) {
    console.error('[CastBallotRoute] Unexpected error:', err);
    return NextResponse.json(
      {
        error: 'Terjadi kegagalan tak terduga saat memproses pengiriman suara.',
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
