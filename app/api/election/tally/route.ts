import { NextResponse } from 'next/server';
import { getElectionTallySnapshot } from '@/lib/ballots/tally-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * Public Endpoint Rekapitulasi Suara & Partisipasi Pemilihan.
 *
 * RESTRICTED VISIBILITY INVARIANT:
 * - Saat bilik suara AKTIF (isClosed === false): Mengembalikan metrik partisipasi DPT saja.
 *   Rincian suara per calon TIDAK PERNAH disertakan untuk mencegah efek bandwagon.
 * - Saat bilik suara DITUTUP RESMI (isClosed === true): Mengembalikan rekapitulasi suara
 *   lengkap antar paslon dan kotak kosong untuk transparansi hasil pemilu.
 */
export async function GET() {
  try {
    const snapshot = await getElectionTallySnapshot();
    const isClosed = Boolean(snapshot.electionSettings.isClosed);

    const baseTurnout = {
      totalDpt: snapshot.turnout.totalDpt,
      totalVotes: snapshot.turnout.totalVotesRecorded,
      turnoutPercentage: snapshot.turnout.turnoutPercentage,
    };

    if (!isClosed) {
      return NextResponse.json(
        {
          success: true,
          isClosed: false,
          turnout: baseTurnout,
          message:
            'Pemungutan suara sedang berlangsung. Rekapitulasi perolehan suara akan dipublikasikan secara otomatis setelah bilik suara resmi ditutup oleh Panitia KPR.',
        },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        isClosed: true,
        timestamp: snapshot.timestamp,
        turnout: baseTurnout,
        results: snapshot.tally.map((item) => ({
          candidateId: item.candidateId,
          candidateNumber: item.candidateNumber,
          leaderName: item.leaderName,
          viceLeaderName: item.viceLeaderName,
          voteCount: item.voteCount,
          percentage: item.percentage,
        })),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[PublicElectionTally] Error retrieving public tally:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Layanan rekapitulasi pemilihan sedang tidak dapat diakses.',
      },
      { status: 500 }
    );
  }
}
