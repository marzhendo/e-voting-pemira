import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getElectionTallySnapshot } from '@/lib/ballots/tally-service';
import { authorizeRecapAccess, formatRecapPayload } from '@/lib/ballots/recap-contract';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * Authenticated Endpoint for Partisipasi Pemilih & Rekapitulasi Suara.
 *
 * Requires a valid session cookie and omits candidate vote breakdowns
 * whenever the election has not been officially closed.
 */
export async function GET() {
  const session = await getSession();
  const authDecision = authorizeRecapAccess(session);

  if (!authDecision.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: authDecision.error,
      },
      {
        status: authDecision.status,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  try {
    const snapshot = await getElectionTallySnapshot();
    const payload = formatRecapPayload(snapshot);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[PublicElectionTally] Error retrieving recap tally:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Layanan rekapitulasi pemilihan sedang tidak dapat diakses.',
      },
      { status: 500 }
    );
  }
}
