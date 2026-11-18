import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { isDevFallbackAllowed } from '@/lib/security/env';
import { resetBallotsStore } from '@/lib/ballots/store';
import { getElectionTallySnapshot } from '@/lib/ballots/tally-service';

export async function GET() {
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
    const snapshot = await getElectionTallySnapshot();

    // Auditor hanya berhak melihat perolehan suara paslon jika pemungutan suara telah ditutup resmi
    if (session?.role === 'auditor' && !snapshot.electionSettings.isClosed) {
      return NextResponse.json(
        {
          error: 'Akses Ditolak: Peran Auditor hanya diperbolehkan melihat tally suara setelah pemungutan suara resmi ditutup oleh KPR.',
          code: 'AUDITOR_TALLY_LOCKED',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: snapshot.timestamp,
      electionSettings: snapshot.electionSettings,
      turnout: snapshot.turnout,
      tally: snapshot.tally,
    });
  } catch (error) {
    console.error('[AdminTallyRoute] GET error:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses rekapitulasi suara.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Mereset surat suara pengujian / simulasi (Khusus Superadmin)
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  if (session?.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Fitur reset surat suara hanya dapat dieksekusi oleh Superadmin.' },
      { status: 403 }
    );
  }

  const clientIp = getClientIp(request);

  if (isSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();
      const { data: rpcResult, error: rpcError } = await adminSupabase.rpc('reset_election_simulation_ballots');

      if (!rpcError && rpcResult?.success) {
        resetBallotsStore();

        await recordAuditLog({
          actorEmail: session?.email || 'admin@pemira.local',
          actorName: session?.name || 'Superadmin',
          actorRole: session?.role || 'super_admin',
          action: 'BALLOTS_RESET',
          description: `Mereset ${rpcResult.deletedBallotsCount || 0} surat suara simulasi pengujian dan memulihkan status DPT di database Supabase.`,
          ipAddress: clientIp,
          details: { deletedBallotsCount: rpcResult.deletedBallotsCount || 0 },
        });

        return NextResponse.json({
          success: true,
          message: rpcResult.message || 'Seluruh surat suara simulasi berhasil dikosongkan.',
          deletedBallotsCount: rpcResult.deletedBallotsCount || 0,
        });
      }

      if (rpcError) {
        console.error('[AdminTallyRoute] Supabase reset_election_simulation_ballots error:', rpcError);
        return NextResponse.json(
          {
            error: `Gagal mereset surat suara di database: ${rpcError.message || 'Fungsi migrasi belum terpasang atau mengalami kendala.'}`,
            details: rpcError.message,
          },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error('[AdminTallyRoute] Database error during ballots reset:', err);
      return NextResponse.json(
        { error: 'Terjadi kegagalan server saat menghubungi database untuk mereset suara.' },
        { status: 500 }
      );
    }
  }

  if (!isDevFallbackAllowed(isSupabaseConfigured())) {
    return NextResponse.json({ error: 'Basis data pemilihan tidak tersedia.' }, { status: 500 });
  }

  resetBallotsStore();

  await recordAuditLog({
    actorEmail: session?.email || 'admin@pemira.local',
    actorName: session?.name || 'Superadmin',
    actorRole: session?.role || 'super_admin',
    action: 'BALLOTS_RESET',
    description: 'Mereset surat suara simulasi pengujian lokal dev.',
    ipAddress: clientIp,
  });

  return NextResponse.json({
    success: true,
    message: 'Surat suara simulasi (Mode Dev) berhasil direset.',
  });
}
