import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { escapeCsvCell } from '@/lib/utils/csv';
import { getElectionTallySnapshot } from '@/lib/ballots/tally-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session, 'export_reports');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki hak untuk mengekspor laporan.' },
      { status: authCheck.status }
    );
  }

  try {
    const snapshot = await getElectionTallySnapshot();
    const isClosed = snapshot.electionSettings.isClosed;

    // Auditor dilarang mengekspor tally paslon jika pemungutan suara masih berjalan
    if (authCheck.effectiveRole === 'auditor' && !isClosed) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Peran Auditor hanya dapat mengekspor rekapitulasi setelah pemilihan resmi ditutup.' },
        { status: 403 }
      );
    }

    const totalDpt = snapshot.turnout.totalDpt;
    const totalVotes = snapshot.turnout.totalVotesRecorded;
    const turnoutPercentage = snapshot.turnout.turnoutPercentage;
    const tallyData = snapshot.tally;
    const generationData = snapshot.turnout.byGeneration;

    // Bangun Hash Integritas BAST
    const integrityPayload = JSON.stringify({
      totalDpt,
      totalVotes,
      tally: tallyData.map((t) => ({ no: t.candidateNumber, votes: t.voteCount })),
    });
    const integrityHash = crypto.createHash('sha256').update(integrityPayload).digest('hex').toUpperCase();

    await recordAuditLog({
      actorEmail: session?.email || 'admin@pemira.local',
      actorName: session?.name || 'Administrator',
      actorRole: session?.role || 'kpr_admin',
      action: 'ELECTION_SETTINGS_UPDATE',
      description: `Mengekspor arsip resmi rekapitulasi suara Pemira format CSV (Hash: ${integrityHash.substring(0, 16)}...).`,
      ipAddress: getClientIp(request.headers),
      details: { totalDpt, totalVotes, integrityHash },
    });

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
      const label =
        t.candidateNumber === 0
          ? 'Kotak Kosong (Opsi Konstitusional)'
          : `${t.leaderName} & ${t.viceLeaderName}`;
      csvLines.push(
        [
          escapeCsvCell(t.candidateNumber === 0 ? '-' : t.candidateNumber),
          escapeCsvCell(label),
          escapeCsvCell(t.voteCount),
          escapeCsvCell(`${t.percentage}%`),
        ].join(',')
      );
    }
    csvLines.push('');

    // Tabel 2: Partisipasi Per Angkatan
    csvLines.push('=== 2. TINGKAT PARTISIPASI PEMILIH PER ANGKATAN ===');
    csvLines.push('Angkatan Mahasiswa,Jumlah DPT,Suara Digunakan,Persentase Partisipasi (%)');
    for (const g of generationData) {
      csvLines.push(
        [
          escapeCsvCell(`Informatika ${g.generation}`),
          escapeCsvCell(g.totalVoters),
          escapeCsvCell(g.votedCount),
          escapeCsvCell(`${g.turnoutPercentage}%`),
        ].join(',')
      );
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
