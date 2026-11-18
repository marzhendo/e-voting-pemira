import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth/session';
import { getClientIp } from '@/lib/auth/client-ip';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';
import { getDevElectionSettings } from '@/lib/election/dev-settings-store';
import { isDevFallbackAllowed } from '@/lib/security/env';
import { publicVerifyRateLimiter } from '@/lib/security/rate-limit';
import { calculateLiveTally } from '@/lib/ballots/store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);
    const rateCheck = publicVerifyRateLimiter.consume(`bast-verify:${clientIp}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          valid: false,
          error: `Terlalu banyak permintaan verifikasi. Silakan coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash')?.trim().toUpperCase();

    if (!hash || !/^[A-F0-9]{64}$/.test(hash)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Hash integritas dokumen Berita Acara tidak valid atau tidak disertakan.',
        },
        { status: 400 }
      );
    }

    const session = await getSession();
    const isCommitteeAdmin = session?.role === 'super_admin' || session?.role === 'kpr_admin';

    let isClosed = false;
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

      const { data: settings, error: settingsError } = await adminSupabase
        .from('election_settings')
        .select('is_voting_open, end_time')
        .eq('id', 1)
        .single();

      if (settingsError || !settings) {
        return NextResponse.json(
          { valid: false, error: 'Gagal memverifikasi status jadwal pemilihan.' },
          { status: 500 }
        );
      }

      isClosed = !settings.is_voting_open || new Date() > new Date(settings.end_time);

      if (!isClosed && !isCommitteeAdmin) {
        return NextResponse.json(
          {
            valid: false,
            error: 'Verifikasi publik Berita Acara (BAST) hanya tersedia setelah pemungutan suara resmi ditutup oleh KPR.',
            code: 'VOTING_STILL_OPEN',
          },
          { status: 403 }
        );
      }

      const { data: candidates } = await adminSupabase
        .from('candidates')
        .select('id, candidate_number, leader_name, vice_leader_name')
        .eq('is_active', true)
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
    } else if (isDevFallbackAllowed(false)) {
      const devSettings = getDevElectionSettings();
      isClosed = !devSettings.is_voting_open || new Date() > new Date(devSettings.end_time);

      if (!isClosed && !isCommitteeAdmin) {
        return NextResponse.json(
          {
            valid: false,
            error: 'Verifikasi publik Berita Acara (BAST) hanya tersedia setelah pemungutan suara resmi ditutup oleh KPR.',
            code: 'VOTING_STILL_OPEN',
          },
          { status: 403 }
        );
      }

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
    } else {
      return NextResponse.json(
        { valid: false, error: 'Konfigurasi basis data tidak tersedia.' },
        { status: 500 }
      );
    }

    // Hitung hash integritas sistem saat ini
    const integrityPayload = JSON.stringify({
      totalDpt,
      totalVotes,
      tally: tallyData.map((t) => ({ no: t.candidateNumber, votes: t.voteCount })),
    });
    const currentHash = crypto.createHash('sha256').update(integrityPayload).digest('hex').toUpperCase();

    // Wajib Exact Match secara timing-safe; jangan pernah bocorkan currentHash atau tally jika tidak cocok
    const hashBuf = Buffer.from(hash, 'utf8');
    const currentHashBuf = Buffer.from(currentHash, 'utf8');
    const isExactMatch =
      hashBuf.length === currentHashBuf.length && crypto.timingSafeEqual(hashBuf, currentHashBuf);

    if (!isExactMatch) {
      return NextResponse.json(
        {
          valid: false,
          isExactMatch: false,
          error: 'Tanda tangan digital SHA-256 tidak cocok dengan rekapitulasi resmi sistem saat ini.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      isExactMatch: true,
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
    return NextResponse.json({ valid: false, error: 'Terjadi kegagalan server saat memverifikasi dokumen.' }, { status: 500 });
  }
}
