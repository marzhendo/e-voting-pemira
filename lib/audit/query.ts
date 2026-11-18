import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';
import { isRootSuperadminEmail } from '@/lib/auth/constants';
import { isDevFallbackAllowed } from '@/lib/security/env';
import {
  getAllAuditLogs,
  queryAuditLogs,
  type AuditLogEntry,
  type AuditActionType,
} from './store';

export interface AuditLogStats {
  total: number;
  settingsCount: number;
  candidatesCount: number;
  dptCount: number;
  broadcastCount: number;
  adminCount: number;
}

export interface FetchAuditLogsParams {
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface FetchAuditLogsResult {
  logs: AuditLogEntry[];
  total: number;
  stats: AuditLogStats;
}

/**
 * Formats an audit log action & payload into a human-readable Indonesian description.
 */
export function getLogDescription(action: string, details: Record<string, unknown>): string {
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
      return 'Mengubah status opsi kotak kosong multi-kandidat.';
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

export function computeAuditStats(logs: AuditLogEntry[]): AuditLogStats {
  return {
    total: logs.length,
    settingsCount: logs.filter(
      (l) =>
        l.action.startsWith('ELECTION_') ||
        l.action.startsWith('MAINTENANCE_') ||
        l.action.startsWith('UPDATE_ELECTION')
    ).length,
    candidatesCount: logs.filter(
      (l) => l.action.startsWith('CANDIDATE_') || l.action.startsWith('KOTAK_')
    ).length,
    dptCount: logs.filter((l) => l.action.startsWith('DPT_')).length,
    broadcastCount: logs.filter((l) => l.action.startsWith('BROADCAST_')).length,
    adminCount: logs.filter((l) => l.action.startsWith('ADMIN_')).length,
  };
}

/**
 * Fetches, enriches, filters, and paginates audit logs from Supabase (or offline dev store).
 */
export async function fetchAuditLogsSnapshot({
  action = 'all',
  search = '',
  limit = 50,
  offset = 0,
}: FetchAuditLogsParams): Promise<FetchAuditLogsResult> {
  if (isSupabaseConfigured()) {
    const adminSupabase = createAdminClient();

    const [{ data: adminRows }, { data: voterRows }, { data: allDbLogs, error: dbErr }] =
      await Promise.all([
        adminSupabase.from('admin_users').select('email, role'),
        adminSupabase.from('voters_whitelist').select('email, name'),
        adminSupabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
      ]);

    if (dbErr || !allDbLogs) {
      throw new Error(dbErr?.message || 'Gagal mengambil audit log dari Supabase.');
    }

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

    const mappedLogs: AuditLogEntry[] = allDbLogs.map((row) => {
      const details = (
        row.details && typeof row.details === 'object' ? row.details : {}
      ) as Record<string, unknown>;
      const actorEmail = (row.actor_email || '').toLowerCase();
      const lookup = userMap.get(actorEmail) || {};

      let actorName =
        (details.actor_name as string) || (details.admin_name as string) || lookup.name || '';
      if (!actorName) {
        if (isRootSuperadminEmail(actorEmail)) {
          actorName = 'Superadmin Utama';
        } else if (actorEmail.includes('kpr')) {
          actorName = 'Panitia KPR HMIF';
        } else if (actorEmail) {
          actorName = actorEmail.split('@')[0];
        } else {
          actorName = 'System';
        }
      }

      let actorRole =
        (details.actor_role as string) || (details.role as string) || lookup.role || '';
      if (!actorRole) {
        if (isRootSuperadminEmail(actorEmail)) {
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

    const stats = computeAuditStats(mappedLogs);
    let filtered = mappedLogs;

    if (action && action !== 'all') {
      if (action === 'ELECTION_SETTINGS_UPDATE') {
        filtered = filtered.filter(
          (l) => l.action === 'ELECTION_SETTINGS_UPDATE' || l.action === 'UPDATE_ELECTION_SETTINGS'
        );
      } else {
        filtered = filtered.filter((l) => l.action === action);
      }
    }

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

    return {
      logs: filtered.slice(offset, offset + limit),
      total: filtered.length,
      stats,
    };
  }

  if (!isDevFallbackAllowed(false)) {
    throw new Error('Basis data audit log tidak tersedia pada mode produksi.');
  }

  const result = queryAuditLogs({
    action: action === 'all' ? null : action,
    search: search.trim() || null,
    limit,
    offset,
  });

  return {
    logs: result.logs,
    total: result.total,
    stats: computeAuditStats(getAllAuditLogs()),
  };
}
