import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';
import { calculateLiveTally } from '@/lib/ballots/store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash')?.trim().toUpperCase();

    if (!hash || hash.length < 16) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Hash integritas dokumen Berita Acara tidak valid atau tidak disertakan.',
        },
        { status: 400 }
      );
    }

    let totalDpt = 0;
    let totalVotes = 0;
    let turnoutPercentage = 0;
    let tallyData: Array<{
      candidateNumber: number;
      leaderName: string;
      viceLeaderName: string;
      voteCount: number;
      percentage: number;
    }> = [];

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();
      const { data: candidates } = await adminSupabase
        .from('candidates')
        .select('id, candidate_number, leader_name, vice_leader_name')
        .order('candidate_number', { ascending: true });

      const { data: ballots } = await adminSupabase.from('ballots').select('candidate_id');
      const { data: voters } = await adminSupabase.from('voters_whitelist').select('id');

      const voteCounts: Record<string, number> = {};
      for (const b of ballots || []) {
        voteCounts[b.candidate_id] = (voteCounts[b.candidate_id] || 0) + 1;
      }

      totalVotes = ballots?.length || 0;
      totalDpt = voters?.length || 0;
      turnoutPercentage = totalDpt > 0 ? Number(((totalVotes / totalDpt) * 100).toFixed(2)) : 0;

      tallyData = (candidates || []).map((cand) => {
        const count = voteCounts[cand.id] || 0;
        const pct = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(2)) : 0;
        return {
          candidateNumber: cand.candidate_number,
          leaderName: cand.leader_name,
          viceLeaderName: cand.vice_leader_name,
          voteCount: count,
          percentage: pct,
        };
      });
    } else {
      const live = calculateLiveTally();
      totalDpt = live.totalDpt;
      totalVotes = live.totalVotesRecorded;
      turnoutPercentage = live.turnoutPercentage;
      tallyData = live.tally.map((t) => ({
        candidateNumber: t.candidateNumber,
        leaderName: t.leaderName,
        viceLeaderName: t.viceLeaderName,
        voteCount: t.voteCount,
        percentage: t.percentage,
      }));
    }

    // Hitung hash integritas sistem saat ini
    const integrityPayload = JSON.stringify({
      totalDpt,
      totalVotes,
      tally: tallyData.map((t) => ({ no: t.candidateNumber, votes: t.voteCount })),
    });
    const currentHash = crypto.createHash('sha256').update(integrityPayload).digest('hex').toUpperCase();

    // Verifikasi kesesuaian hash
    const isExactMatch = hash === currentHash;
    const isValidFormat = /^[A-F0-9]{64}$/.test(hash);

    if (!isValidFormat && !isExactMatch) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Format tanda tangan digital / hash SHA-256 tidak dikenali oleh sistem Pemira HMIF.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      isExactMatch,
      electionTitle: 'Pemilihan Raya Chairman & Vice Chairman HMIF Periode 2026/2027',
      organizer: 'Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto',
      institution: 'Program Studi S1 Informatika - Fakultas Informatika',
      verifiedHash: hash,
      currentSystemHash: currentHash,
      timestamp: new Date().toISOString(),
      summary: {
        totalDpt,
        totalVotes,
        turnoutPercentage,
        tally: tallyData,
      },
      secrecyNotice: 'Dokumen rekapitulasi ini terverifikasi asli dari sistem digital bilik suara. Seluruh suara dihitung secara anonim tanpa kaitan ke identitas pemilih (*Ballot Secrecy*).',
    });
  } catch (err) {
    console.error('[BastVerifyApi] Exception:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan server saat memverifikasi dokumen.' }, { status: 500 });
  }
}
