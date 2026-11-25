import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth/session';
import { getClientIp } from '@/lib/auth/client-ip';
import { publicVerifyRateLimiter } from '@/lib/security/rate-limit';
import { getElectionTallySnapshot } from '@/lib/ballots/tally-service';

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
          error: 'Format kode verifikasi tidak valid. Pastikan berisi 64 karakter huruf dan angka.',
        },
        { status: 400 }
      );
    }

    const session = await getSession();
    const isCommitteeAdmin = session?.role === 'super_admin' || session?.role === 'kpr_admin';

    const snapshot = await getElectionTallySnapshot();

    if (!snapshot.electionSettings.isClosed && !isCommitteeAdmin) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Verifikasi publik Berita Acara (BAST) hanya tersedia setelah pemungutan suara resmi ditutup oleh KPR.',
          code: 'VOTING_STILL_OPEN',
        },
        { status: 403 }
      );
    }

    const totalDpt = snapshot.turnout.totalDpt;
    const totalVotes = snapshot.turnout.totalVotesRecorded;
    const turnoutPercentage = snapshot.turnout.turnoutPercentage;
    const tallyData = snapshot.tally.map((t) => ({
      candidateNumber: t.candidateNumber,
      leaderName: t.leaderName,
      viceLeaderName: t.viceLeaderName,
      voteCount: t.voteCount,
      percentage: t.percentage,
    }));

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
          error: 'Kode verifikasi dokumen tidak cocok dengan catatan resmi sistem saat ini.',
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
      secrecyNotice: 'Hasil dihitung dari Surat Suara Anonim yang tersimpan terpisah tanpa identitas pemilih.',
    });
  } catch (err) {
    console.error('[BastVerifyApi] Exception:', err);
    return NextResponse.json({ valid: false, error: 'Terjadi kegagalan server saat memverifikasi dokumen.' }, { status: 500 });
  }
}
