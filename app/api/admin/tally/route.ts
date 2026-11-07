import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { getDevElectionSettings } from '@/lib/election/dev-settings-store';
import { calculateLiveTally, resetBallotsStore } from '@/lib/ballots/store';

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

  if (isSupabaseConfigured()) {
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
    }
  }

  if (process.env.APP_ENV !== 'production') {
    const devSettings = getDevElectionSettings();
    const isClosed = !devSettings.is_voting_open || new Date() > new Date(devSettings.end_time);

    // Auditor hanya berhak melihat perolehan suara jika pemilihan sudah ditutup
    if (session?.role === 'auditor' && !isClosed) {
      return NextResponse.json(
        {
          error: 'Akses Ditolak: Peran Auditor hanya diperbolehkan melihat tally suara setelah pemungutan suara resmi ditutup oleh KPR.',
          code: 'AUDITOR_TALLY_LOCKED',
        },
        { status: 403 }
      );
    }

    const liveData = calculateLiveTally();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      electionSettings: {
        isVotingOpen: devSettings.is_voting_open,
        isClosed,
        maintenanceMode: devSettings.maintenance_mode,
        startTime: devSettings.start_time,
        endTime: devSettings.end_time,
        allowKotakKosongMulti: devSettings.allow_kotak_kosong_multi,
      },
      turnout: {
        totalDpt: liveData.totalDpt,
        totalVotesRecorded: liveData.totalVotesRecorded,
        totalVotersParticipated: liveData.totalVotersParticipated,
        turnoutPercentage: liveData.turnoutPercentage,
        byGeneration: liveData.byGeneration,
      },
      tally: liveData.tally,
    });
  }

  return NextResponse.json(
    { error: 'Terjadi kegagalan server saat memproses rekapitulasi suara.' },
    { status: 500 }
  );
}

/**
 * DELETE: Mereset surat suara pengujian lokal (Khusus mode pengembangan / Non-Production)
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  if (process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'Reset surat suara dinonaktifkan di lingkungan produksi.' }, { status: 403 });
  }

  resetBallotsStore();

  const clientIp = getClientIp(request);
  await recordAuditLog({
    actorEmail: session?.email || 'admin@pemira.local',
    actorName: session?.name || 'Panitia KPR',
    actorRole: session?.role || 'kpr_admin',
    action: 'BALLOTS_RESET',
    description: 'Mereset surat suara simulasi pengujian lokal dev.',
    ipAddress: clientIp,
  });

  return NextResponse.json({ success: true, message: 'Surat suara simulasi berhasil direset.' });
}
