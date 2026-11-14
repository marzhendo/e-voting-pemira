import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { queryAuditLogs, getAllAuditLogs, type AuditLogEntry, type AuditActionType } from '@/lib/audit/store';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat log audit.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const search = searchParams.get('q') || '';
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);
    const offset = Number(searchParams.get('offset') || '0');

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();

      // Ambil referensi nama dan peran admin untuk rendering akurat
      const [{ data: adminRows }, { data: voterRows }] = await Promise.all([
        adminSupabase.from('admin_users').select('email, role'),
        adminSupabase.from('voters_whitelist').select('email, name'),
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

      // Ambil seluruh audit logs untuk kalkulasi statistik akurat
      const { data: allDbLogs, error: dbErr } = await adminSupabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!dbErr && allDbLogs) {
        // Map database records ke struktur AuditLogEntry
        const mappedLogs: AuditLogEntry[] = allDbLogs.map((row) => {
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

        // Hitung statistik kategori
        const stats = {
          total: mappedLogs.length,
          settingsCount: mappedLogs.filter((l) => l.action.startsWith('ELECTION_') || l.action.startsWith('MAINTENANCE_') || l.action.startsWith('UPDATE_ELECTION')).length,
          candidatesCount: mappedLogs.filter((l) => l.action.startsWith('CANDIDATE_') || l.action.startsWith('KOTAK_')).length,
          dptCount: mappedLogs.filter((l) => l.action.startsWith('DPT_')).length,
          broadcastCount: mappedLogs.filter((l) => l.action.startsWith('BROADCAST_')).length,
          adminCount: mappedLogs.filter((l) => l.action.startsWith('ADMIN_')).length,
        };

        // Filter aksi
        let filtered = mappedLogs;
        if (action && action !== 'all') {
          if (action === 'ELECTION_SETTINGS_UPDATE') {
            filtered = filtered.filter((l) => l.action === 'ELECTION_SETTINGS_UPDATE' || l.action === 'UPDATE_ELECTION_SETTINGS');
          } else {
            filtered = filtered.filter((l) => l.action === action);
          }
        }

        // Filter kata kunci pencarian
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          filtered = filtered.filter(
            (l) =>
              l.description.toLowerCase().includes(q) ||
              l.actor_name.toLowerCase().includes(q) ||
              l.actor_email.toLowerCase().includes(q) ||
              l.action.toLowerCase().includes(q)
          );
        }

        const totalFiltered = filtered.length;
        const pagedLogs = filtered.slice(offset, offset + limit);

        return NextResponse.json({
          success: true,
          logs: pagedLogs,
          total: totalFiltered,
          stats,
          limit,
          offset,
        });
      }
    }

    // Fallback offline / dev store
    const result = queryAuditLogs({
      action: action === 'all' ? null : action,
      search: search.trim() || null,
      limit,
      offset,
    });

    const allLogs = getAllAuditLogs();
    const stats = {
      total: allLogs.length,
      settingsCount: allLogs.filter((l) => l.action.startsWith('ELECTION_') || l.action.startsWith('MAINTENANCE_') || l.action.startsWith('UPDATE_ELECTION')).length,
      candidatesCount: allLogs.filter((l) => l.action.startsWith('CANDIDATE_') || l.action.startsWith('KOTAK_')).length,
      dptCount: allLogs.filter((l) => l.action.startsWith('DPT_')).length,
      broadcastCount: allLogs.filter((l) => l.action.startsWith('BROADCAST_')).length,
      adminCount: allLogs.filter((l) => l.action.startsWith('ADMIN_')).length,
    };

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      stats,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[AuditLogsRoute] GET error:', err);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memuat data audit log.' },
      { status: 500 }
    );
  }
}
