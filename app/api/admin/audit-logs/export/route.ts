import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { getAllAuditLogs, queryAuditLogs, recordAuditLog, type AuditLogEntry, type AuditActionType } from '@/lib/audit/store';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function getLogDescription(action: string, details: any): string {
  if (details?.description) return String(details.description);
  if (details?.reason) return String(details.reason);

  switch (action) {
    case 'ELECTION_SETTINGS_UPDATE':
    case 'UPDATE_ELECTION_SETTINGS':
      if (details?.is_voting_open !== undefined) {
        return `Memperbarui status bilik suara: ${details.is_voting_open ? 'Buka' : 'Tutup'}.`;
      }
      return 'Memperbarui konfigurasi parameter dan jadwal pemilihan.';
    case 'MAINTENANCE_TOGGLE':
      return 'Mengubah status pemeliharaan darurat teknis sistem.';
    case 'CANDIDATE_CREATE':
      return `Mendaftarkan kandidat paslon baru: No. ${details?.candidate_number || '-'} (${details?.leader_name || ''} & ${details?.vice_leader_name || ''}).`;
    case 'CANDIDATE_UPDATE':
      return `Memperbarui data profil paslon No. ${details?.candidate_number || ''} (${details?.leader_name || ''}).`;
    case 'CANDIDATE_DELETE':
      return `Menghapus data pendaftaran paslon (ID: ${details?.id || '-'}).`;
    case 'KOTAK_KOSONG_TOGGLE':
      return `Mengubah status opsi kotak kosong multi-kandidat.`;
    case 'DPT_QUICK_ADD':
      return `Menambahkan pemilih tunggal baru: NIM ${details?.nim || '-'} (${details?.name || ''}).`;
    case 'DPT_BATCH_IMPORT':
      return `Mengimpor berkas data DPT massal (${details?.totalImported || details?.validCount || details?.count || ''} pemilih).`;
    case 'DPT_DELETE':
      return `Menghapus data pemilih dari DPT (NIM: ${details?.nim || '-'}).`;
    case 'DPT_BATCH_DELETE':
      return `Menghapus data pemilih DPT secara batch (${details?.count || details?.totalDeleted || ''} pemilih).`;
    case 'DPT_RESET':
      return `Mereset data DPT pemilih (Mode: ${details?.mode || '-'}).`;
    case 'BROADCAST_EMAIL_SENT':
      return `Mengirim email siaran pemberitahuan kepada ${details?.recipientCount || details?.count || ''} pemilih.`;
    case 'BALLOTS_RESET':
      return 'Mereset rekam data surat suara dan bilik suara.';
    case 'ADMIN_CREATE':
      return `Menambahkan administrator baru: ${details?.admin_name || details?.name || details?.email || ''} (${details?.admin_role || details?.role || ''}).`;
    case 'ADMIN_UPDATE_ROLE':
      return `Memperbarui peran/status administrator: ${details?.admin_name || details?.email || ''}.`;
    case 'ADMIN_REVOKE':
      return `Mencabut akses administrator: ${details?.admin_email || details?.email || ''}.`;
    case 'ADMIN_LOGIN':
      return 'Administrator berhasil masuk ke dashboard.';
    default:
      return `Aktivitas sistem: ${action}.`;
  }
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

    let logs: AuditLogEntry[] = [];

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();

      const [{ data: adminRows }, { data: voterRows }, { data: allDbLogs }] = await Promise.all([
        adminSupabase.from('admin_users').select('email, role'),
        adminSupabase.from('voters_whitelist').select('email, name'),
        adminSupabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
      ]);

      const userMap = new Map<string, { name?: string; role?: string }>();
      voterRows?.forEach((v) => {
        if (v.email) userMap.set(v.email.toLowerCase(), { name: v.name });
      });
      adminRows?.forEach((a) => {
        if (a.email) {
          const existing = userMap.get(a.email.toLowerCase()) || {};
          userMap.set(a.email.toLowerCase(), { ...existing, role: a.role });
        }
      });

      if (allDbLogs) {
        let mapped: AuditLogEntry[] = allDbLogs.map((row) => {
          const details = (row.details && typeof row.details === 'object' ? row.details : {}) as Record<string, unknown>;
          const actorEmail = (row.actor_email || '').toLowerCase();
          const lookup = userMap.get(actorEmail) || {};

          let actorName = (details.actor_name as string) || (details.admin_name as string) || lookup.name || '';
          if (!actorName) {
            if (actorEmail === 'marzhendogalangs@gmail.com') {
              actorName = 'Marzhendo Galang (Superadmin)';
            } else if (actorEmail.includes('kpr')) {
              actorName = 'Panitia KPR HMIF';
            } else if (actorEmail) {
              actorName = actorEmail.split('@')[0];
            } else {
              actorName = 'System';
            }
          }

          let actorRole = (details.actor_role as string) || (details.role as string) || lookup.role || '';
          if (!actorRole) {
            if (actorEmail === 'marzhendogalangs@gmail.com') {
              actorRole = 'super_admin';
            } else if (actorEmail.includes('kpr')) {
              actorRole = 'kpr_admin';
            } else {
              actorRole = 'admin';
            }
          }

          return {
            id: row.id,
            timestamp: row.created_at,
            actor_email: row.actor_email,
            actor_name: actorName,
            actor_role: actorRole,
            action: row.action as AuditActionType,
            description: getLogDescription(row.action, details),
            ip_address: row.ip_address || '127.0.0.1',
            details,
          };
        });

        if (action && action !== 'all') {
          if (action === 'ELECTION_SETTINGS_UPDATE') {
            mapped = mapped.filter((l) => l.action === 'ELECTION_SETTINGS_UPDATE' || l.action === 'UPDATE_ELECTION_SETTINGS');
          } else {
            mapped = mapped.filter((l) => l.action === action);
          }
        }

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          mapped = mapped.filter(
            (l) =>
              l.description.toLowerCase().includes(q) ||
              l.actor_name.toLowerCase().includes(q) ||
              l.actor_email.toLowerCase().includes(q) ||
              l.action.toLowerCase().includes(q)
          );
        }

        logs = mapped.slice(0, 1000);
      }
    } else {
      const queryResult = queryAuditLogs({
        action: action === 'all' ? null : action,
        search: search.trim() || null,
        limit: 1000,
      });
      logs = queryResult.logs;
    }

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
