import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  // 1. Verifikasi Otorisasi Sesi Pengguna
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      {
        error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat rekapitulasi suara privat.',
        code: 'FORBIDDEN',
      },
      { status: authCheck.status }
    );
  }

  try {
    const adminSupabase = createAdminClient();

    // 2. Baca Pengaturan Pemilihan
    const { data: settings, error: settingsError } = await adminSupabase
      .from('election_settings')
      .select('is_voting_open, start_time, end_time, maintenance_mode')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Gagal membaca status pengaturan pemilihan.' },
        { status: 500 }
      );
    }

    const isClosed = !settings.is_voting_open || new Date() > new Date(settings.end_time);

    // Auditor hanya berhak melihat perolehan suara paslon jika pemungutan suara telah ditutup resmi
    if (session?.role === 'auditor' && !isClosed) {
      return NextResponse.json(
        {
          error: 'Akses Ditolak: Peran Auditor hanya diperbolehkan melihat tally suara setelah pemungutan suara resmi ditutup oleh KPR.',
          code: 'AUDITOR_TALLY_LOCKED',
        },
        { status: 403 }
      );
    }

    // 3. Baca Data Kandidat Aktif
    const { data: candidates, error: candError } = await adminSupabase
      .from('candidates')
      .select('id, candidate_number, leader_name, vice_leader_name, is_active')
      .order('candidate_number', { ascending: true });

    if (candError || !candidates) {
      return NextResponse.json(
        { error: 'Gagal mengambil data kandidat pemilihan.' },
        { status: 500 }
      );
    }

    // 4. Hitung Agregasi Suara dari Tabel Ballots
    // INVARIAN: Kueri ini murni menjumlahkan surat suara per kandidat tanpa melibatkan identitas pemilih
    const { data: ballots, error: ballotError } = await adminSupabase
      .from('ballots')
      .select('candidate_id');

    if (ballotError) {
      return NextResponse.json(
        { error: 'Gagal menghitung agregasi surat suara.' },
        { status: 500 }
      );
    }

    const totalVotes = ballots.length;
    const voteCounts: Record<string, number> = {};
    for (const b of ballots) {
      voteCounts[b.candidate_id] = (voteCounts[b.candidate_id] || 0) + 1;
    }

    const tally = candidates.map((cand) => {
      const count = voteCounts[cand.id] || 0;
      const percentage = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(2)) : 0;
      return {
        candidateId: cand.id,
        candidateNumber: cand.candidate_number,
        leaderName: cand.leader_name,
        viceLeaderName: cand.vice_leader_name,
        voteCount: count,
        percentage,
      };
    });

    // 5. Hitung Metrik Partisipasi DPT & Per Angkatan
    const { data: voters, error: voterError } = await adminSupabase
      .from('voters_whitelist')
      .select('generation, has_voted');

    if (voterError || !voters) {
      return NextResponse.json(
        { error: 'Gagal mengambil data partisipasi DPT.' },
        { status: 500 }
      );
    }

    const totalDpt = voters.length;
    const totalVotedDpt = voters.filter((v) => v.has_voted).length;
    const overallTurnoutPercentage = totalDpt > 0 ? Number(((totalVotedDpt / totalDpt) * 100).toFixed(2)) : 0;

    // Agregasi per angkatan (Cohorts)
    const cohortMap: Record<number, { total: number; voted: number }> = {};
    for (const v of voters) {
      if (!cohortMap[v.generation]) {
        cohortMap[v.generation] = { total: 0, voted: 0 };
      }
      cohortMap[v.generation].total += 1;
      if (v.has_voted) {
        cohortMap[v.generation].voted += 1;
      }
    }

    const byGeneration = Object.entries(cohortMap)
      .map(([genStr, counts]) => {
        const generation = Number(genStr);
        const percentage = counts.total > 0 ? Number(((counts.voted / counts.total) * 100).toFixed(2)) : 0;
        return {
          generation,
          totalVoters: counts.total,
          votedCount: counts.voted,
          turnoutPercentage: percentage,
        };
      })
      .sort((a, b) => a.generation - b.generation);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      electionSettings: {
        isVotingOpen: settings.is_voting_open,
        isClosed,
        maintenanceMode: settings.maintenance_mode,
        startTime: settings.start_time,
        endTime: settings.end_time,
      },
      turnout: {
        totalDpt,
        totalVotesRecorded: totalVotes,
        totalVotersParticipated: totalVotedDpt,
        turnoutPercentage: overallTurnoutPercentage,
        byGeneration,
      },
      tally,
    });
  } catch (error) {
    console.warn('[AdminTallyRoute] Database offline, checking dev fallback:', error);

    if (process.env.NODE_ENV !== 'production' && process.env.APP_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        electionSettings: {
          isVotingOpen: true,
          isClosed: false,
          maintenanceMode: false,
          startTime: '2026-11-01T08:00:00+07:00',
          endTime: '2026-11-01T16:00:00+07:00',
        },
        turnout: {
          totalDpt: 1240,
          totalVotesRecorded: 892,
          totalVotersParticipated: 892,
          turnoutPercentage: 71.94,
          byGeneration: [
            { generation: 2023, totalVoters: 360, votedCount: 308, turnoutPercentage: 85.56 },
            { generation: 2024, totalVoters: 350, votedCount: 269, turnoutPercentage: 76.86 },
            { generation: 2025, totalVoters: 330, votedCount: 230, turnoutPercentage: 69.7 },
            { generation: 2026, totalVoters: 200, votedCount: 85, turnoutPercentage: 42.5 },
          ],
        },
        tally: [
          {
            candidateId: '00000000-0000-0000-0000-000000000000',
            candidateNumber: 0,
            leaderName: 'Kotak Kosong',
            viceLeaderName: 'Tidak Memilih Calon',
            voteCount: 32,
            percentage: 3.59,
          },
          {
            candidateId: '11111111-1111-1111-1111-111111111111',
            candidateNumber: 1,
            leaderName: 'Arya Narendra Putra',
            viceLeaderName: 'Rayhan Al-Fayeed',
            voteCount: 492,
            percentage: 55.16,
          },
          {
            candidateId: '22222222-2222-2222-2222-222222222222',
            candidateNumber: 2,
            leaderName: 'Dimas Satria Wicaksana',
            viceLeaderName: 'Cynthia Maharani',
            voteCount: 368,
            percentage: 41.26,
          },
        ],
      });
    }

    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses rekapitulasi suara.' },
      { status: 500 }
    );
  }
}
