import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { getAllAuditLogs, queryAuditLogs, recordAuditLog } from '@/lib/audit/store';

export const dynamic = 'force-dynamic';

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'view_audit_logs');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengekspor audit log.' },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const search = searchParams.get('q') || '';

    const queryResult = queryAuditLogs({
      action: action === 'all' ? null : action,
      search: search.trim() || null,
      limit: 1000,
    });

    const logs = queryResult.logs;

    // Catat aktivitas ekspor ke dalam audit log
    await recordAuditLog({
      actorEmail: session?.email || 'admin@pemira.local',
      actorName: session?.name || 'Administrator',
      actorRole: session?.role || 'kpr_admin',
      action: 'ELECTION_SETTINGS_UPDATE',
      description: `Mengekspor berkas rekam jejak Audit Trail (${logs.length} entri) format CSV untuk pengarsipan sidang pleno.`,
      details: { totalExported: logs.length, actionFilter: action, searchQuery: search },
    });

    const csvLines: string[] = [];
    csvLines.push('DOKUMEN AUDIT TRAIL & REKAM JEJAK SISTEM PEMIRA HMIF 2026/2027');
    csvLines.push('Komisi Pemilihan Raya (KPR) & Pengawas Independen (DPM) Telkom University Purwokerto');
    csvLines.push(`Waktu Ekspor: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}`);
    csvLines.push(`Total Entri Log: ${logs.length}`);
    csvLines.push('');
    csvLines.push('ID Log,Waktu (ISO 8601),Waktu (Lokal WIB),Nama Pelaksana,Email Akun,Peran,Kategori Aksi,Deskripsi Aktivitas,Alamat IP');

    for (const l of logs) {
      const dateObj = new Date(l.timestamp);
      const localTime = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : l.timestamp;

      csvLines.push([
        escapeCsvCell(l.id),
        escapeCsvCell(l.timestamp),
        escapeCsvCell(localTime),
        escapeCsvCell(l.actor_name),
        escapeCsvCell(l.actor_email),
        escapeCsvCell(l.actor_role),
        escapeCsvCell(l.action),
        escapeCsvCell(l.description),
        escapeCsvCell(l.ip_address),
      ].join(','));
    }

    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Audit-Trail-Pemira-HMIF.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[AuditLogsExportRoute] Exception:', err);
    return NextResponse.json({ error: 'Gagal mengekspor berkas audit log.' }, { status: 500 });
  }
}
