import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getDevElectionSettings } from '@/lib/election/dev-settings-store';
import { calculateLiveTally } from '@/lib/ballots/store';
import { recordAuditLog } from '@/lib/audit/store';

export const dynamic = 'force-dynamic';

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET() {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'export_reports');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki hak untuk mengekspor laporan.' },
      { status: authCheck.status }
    );
  }

  try {
    let tallyData: Array<{
      candidateId: string;
      candidateNumber: number;
      leaderName: string;
      viceLeaderName: string;
      voteCount: number;
      percentage: number;
    }> = [];

    let generationData: Array<{
      generation: number;
      totalVoters: number;
      votedCount: number;
      turnoutPercentage: number;
    }> = [];

    let totalDpt = 0;
    let totalVotes = 0;
    let turnoutPercentage = 0;
    let isClosed = false;

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();

      // Coba panggil RPC agregasi server-side
      const { data: rpcSummary } = await adminSupabase.rpc('get_election_tally_summary');

      if (rpcSummary && rpcSummary.success) {
        isClosed = rpcSummary.electionSettings.isClosed;

        // Auditor dilarang mengekspor tally paslon jika pemungutan suara masih berjalan
        if (session?.role === 'auditor' && !isClosed) {
          return NextResponse.json(
            { error: 'Akses Ditolak: Peran Auditor hanya dapat mengekspor rekapitulasi setelah pemilihan resmi ditutup.' },
            { status: 403 }
          );
        }

        tallyData = rpcSummary.tally || [];
        generationData = rpcSummary.turnout.byGeneration || [];
        totalDpt = rpcSummary.turnout.totalDpt;
        totalVotes = rpcSummary.turnout.totalVotesRecorded;
        turnoutPercentage = rpcSummary.turnout.turnoutPercentage;
      } else {
        const { data: settings } = await adminSupabase
          .from('election_settings')
          .select('is_voting_open, end_time')
          .eq('id', 1)
          .single();

        isClosed = !settings?.is_voting_open || new Date() > new Date(settings?.end_time || '');

        // Auditor dilarang mengekspor tally paslon jika pemungutan suara masih berjalan
        if (session?.role === 'auditor' && !isClosed) {
          return NextResponse.json(
            { error: 'Akses Ditolak: Peran Auditor hanya dapat mengekspor rekapitulasi setelah pemilihan resmi ditutup.' },
            { status: 403 }
          );
        }

        const { data: candidates } = await adminSupabase
          .from('candidates')
          .select('id, candidate_number, leader_name, vice_leader_name')
          .order('candidate_number', { ascending: true });

        const { data: ballots } = await adminSupabase.from('ballots').select('candidate_id');
        const { data: voters } = await adminSupabase.from('voters_whitelist').select('generation, has_voted');

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
            candidateId: cand.id,
            candidateNumber: cand.candidate_number,
            leaderName: cand.leader_name,
            viceLeaderName: cand.vice_leader_name,
            voteCount: count,
            percentage: pct,
          };
        });

        // Grouping by generation
        const genMap: Record<number, { total: number; voted: number }> = {};
        for (const v of voters || []) {
          if (!genMap[v.generation]) genMap[v.generation] = { total: 0, voted: 0 };
          genMap[v.generation].total++;
          if (v.has_voted) genMap[v.generation].voted++;
        }

        generationData = Object.entries(genMap)
          .map(([genStr, stat]) => ({
            generation: Number(genStr),
            totalVoters: stat.total,
            votedCount: stat.voted,
            turnoutPercentage: stat.total > 0 ? Number(((stat.voted / stat.total) * 100).toFixed(2)) : 0,
          }))
          .sort((a, b) => a.generation - b.generation);
      }
    } else {
      // Dev mode store
      const devSettings = getDevElectionSettings();
      isClosed = !devSettings.is_voting_open || new Date() > new Date(devSettings.end_time);

      if (session?.role === 'auditor' && !isClosed) {
        return NextResponse.json(
          { error: 'Akses Ditolak: Peran Auditor hanya dapat mengekspor rekapitulasi setelah pemilihan resmi ditutup.' },
          { status: 403 }
        );
      }

      const live = calculateLiveTally();
      totalDpt = live.totalDpt;
      totalVotes = live.totalVotesRecorded;
      turnoutPercentage = live.turnoutPercentage;
      tallyData = live.tally;
      generationData = live.byGeneration;
    }

    // Bangun Hash Integritas BAST
    const integrityPayload = JSON.stringify({
      totalDpt,
      totalVotes,
      tally: tallyData.map((t) => ({ no: t.candidateNumber, votes: t.voteCount })),
    });
    const integrityHash = crypto.createHash('sha256').update(integrityPayload).digest('hex').toUpperCase();

    // Catat ke Audit Log
    await recordAuditLog({
      actorEmail: session?.email || 'admin@pemira.local',
      actorName: session?.name || 'Administrator',
      actorRole: session?.role || 'kpr_admin',
      action: 'ELECTION_SETTINGS_UPDATE',
      description: `Mengekspor arsip resmi rekapitulasi suara Pemira format CSV (Hash: ${integrityHash.substring(0, 16)}...).`,
      details: { totalDpt, totalVotes, integrityHash },
    });

    // Susun Konten CSV Terstruktur
    const csvLines: string[] = [];
    csvLines.push('LAPORAN RESMI REKAPITULASI SUARA DAN TINGKAT PARTISIPASI PEMIRA HMIF 2026/2027');
    csvLines.push('Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto');
    csvLines.push(`Waktu Penerbitan: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}`);
    csvLines.push(`Status Pemilihan: ${isClosed ? 'Resmi Ditutup' : 'Sedang Berlangsung'}`);
    csvLines.push(`Hash Integritas SHA-256: ${integrityHash}`);
    csvLines.push('');

    // Tabel 1: Hasil Suara Paslon
    csvLines.push('=== 1. PEROLEHAN SUARA PASANGAN CALON & KOTAK KOSONG ===');
    csvLines.push('Nomor Urut,Nama Pasangan Calon / Opsi,Perolehan Suara,Persentase (%)');
    for (const t of tallyData) {
      const label = t.candidateNumber === 0
        ? 'Kotak Kosong (Opsi Konstitusional)'
        : `${t.leaderName} & ${t.viceLeaderName}`;
      csvLines.push([
        escapeCsvCell(t.candidateNumber === 0 ? '-' : t.candidateNumber),
        escapeCsvCell(label),
        escapeCsvCell(t.voteCount),
        escapeCsvCell(`${t.percentage}%`),
      ].join(','));
    }
    csvLines.push('');

    // Tabel 2: Partisipasi Per Angkatan
    csvLines.push('=== 2. TINGKAT PARTISIPASI PEMILIH PER ANGKATAN ===');
    csvLines.push('Angkatan Mahasiswa,Jumlah DPT,Suara Digunakan,Persentase Partisipasi (%)');
    for (const g of generationData) {
      csvLines.push([
        escapeCsvCell(`Informatika ${g.generation}`),
        escapeCsvCell(g.totalVoters),
        escapeCsvCell(g.votedCount),
        escapeCsvCell(`${g.turnoutPercentage}%`),
      ].join(','));
    }
    csvLines.push('');

    // Tabel 3: Ringkasan Total
    csvLines.push('=== 3. RINGKASAN REKAPITULASI AKHIR ===');
    csvLines.push('Metrik,Nilai');
    csvLines.push(`Total Daftar Pemilih Tetap (DPT),${escapeCsvCell(totalDpt)}`);
    csvLines.push(`Total Surat Suara Masuk,${escapeCsvCell(totalVotes)}`);
    csvLines.push(`Tingkat Partisipasi Total,${escapeCsvCell(`${turnoutPercentage}%`)}`);
    csvLines.push(`Prinsip Kerahasiaan (Ballot Secrecy),${escapeCsvCell('Terjamin Penuh (Anonim LUBER JURDIL)')}`);
    csvLines.push('');
    csvLines.push('Dokumen arsip resmi Komisi Pemilihan Raya (KPR) & Pengawas Independen (DPM) HMIF.');

    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Rekapitulasi-Suara-Pemira-HMIF-2026-2027.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[TallyExportRoute] Exception:', err);
    return NextResponse.json({ error: 'Gagal mengekspor laporan rekapitulasi suara.' }, { status: 500 });
  }
}
