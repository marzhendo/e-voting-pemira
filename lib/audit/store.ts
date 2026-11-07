import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type AuditActionType =
  | 'ELECTION_SETTINGS_UPDATE'
  | 'MAINTENANCE_TOGGLE'
  | 'CANDIDATE_CREATE'
  | 'CANDIDATE_UPDATE'
  | 'CANDIDATE_DELETE'
  | 'KOTAK_KOSONG_TOGGLE'
  | 'DPT_QUICK_ADD'
  | 'DPT_BATCH_IMPORT'
  | 'BROADCAST_EMAIL_SENT'
  | 'BALLOTS_RESET'
  | 'ADMIN_CREATE'
  | 'ADMIN_UPDATE_ROLE'
  | 'ADMIN_REVOKE'
  | 'ADMIN_LOGIN';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_name: string;
  actor_role: string;
  action: AuditActionType;
  description: string;
  ip_address: string;
  details?: Record<string, unknown> | null;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'dev-audit-logs.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[AuditStore] Failed to create data directory:', err);
  }
}

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-init-01',
    timestamp: '2026-11-04T07:30:00.000Z',
    actor_email: 'marzhendogalangs@gmail.com',
    actor_name: 'Marzhendo Galang (Superadmin)',
    actor_role: 'super_admin',
    action: 'ELECTION_SETTINGS_UPDATE',
    description: 'Inisialisasi konfigurasi jadwal resmi dan bilik suara digital Pemira HMIF 2026/2027.',
    ip_address: '127.0.0.1',
    details: {
      is_voting_open: true,
      start_time: '2026-11-04T08:00:00.000Z',
      end_time: '2026-11-04T16:00:00.000Z',
    },
  },
  {
    id: 'audit-init-02',
    timestamp: '2026-11-04T07:45:00.000Z',
    actor_email: 'kpradmin@student.telkomuniversity.ac.id',
    actor_name: 'Ketua Panitia KPR',
    actor_role: 'kpr_admin',
    action: 'CANDIDATE_CREATE',
    description: 'Pendaftaran dan validasi berkas Paslon 01 (Arya Narendra Putra & Rayhan Al-Fayeed).',
    ip_address: '127.0.0.1',
    details: {
      candidate_number: 1,
      leader_name: 'Arya Narendra Putra',
      vice_leader_name: 'Rayhan Al-Fayeed',
    },
  },
  {
    id: 'audit-init-03',
    timestamp: '2026-11-06T08:15:00.000Z',
    actor_email: 'kpradmin@student.telkomuniversity.ac.id',
    actor_name: 'Ketua Panitia KPR',
    actor_role: 'kpr_admin',
    action: 'DPT_BATCH_IMPORT',
    description: 'Verifikasi dan pemutakhiran data pemilih tetap mahasiswa Informatika terdaftar.',
    ip_address: '127.0.0.1',
    details: {
      cohorts: [2023, 2024, 2025, 2026],
      status: 'VERIFIED',
    },
  },
];

let inMemoryAuditLogs: AuditLogEntry[] | null = null;

export function getAllAuditLogs(): AuditLogEntry[] {
  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      inMemoryAuditLogs = JSON.parse(content) as AuditLogEntry[];
      return inMemoryAuditLogs;
    }
  } catch (err) {
    console.warn('[AuditStore] Failed to read store file, using defaults:', err);
  }

  if (inMemoryAuditLogs !== null) {
    return inMemoryAuditLogs;
  }

  inMemoryAuditLogs = [...DEFAULT_AUDIT_LOGS];
  saveAuditLogsStore(inMemoryAuditLogs);
  return inMemoryAuditLogs;
}

export function saveAuditLogsStore(logs: AuditLogEntry[]): void {
  inMemoryAuditLogs = logs;
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AuditStore] Failed to persist audit logs to disk:', err);
  }
}

/**
 * Merekam entri riwayat aktivitas panitia / audit log secara fail-safe.
 */
export async function recordAuditLog(params: {
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: AuditActionType;
  description: string;
  ipAddress?: string;
  details?: Record<string, unknown> | null;
}): Promise<AuditLogEntry> {
  const newEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    actor_email: params.actorEmail.trim().toLowerCase(),
    actor_name: params.actorName.trim(),
    actor_role: params.actorRole,
    action: params.action,
    description: params.description.trim(),
    ip_address: params.ipAddress || '127.0.0.1',
    details: params.details || null,
  };

  // Simpan ke local dev store
  const currentLogs = getAllAuditLogs();
  const updatedLogs = [newEntry, ...currentLogs];
  saveAuditLogsStore(updatedLogs);

  // Jika Supabase terhubung nyata, simpan juga ke tabel audit_logs
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { isSupabaseConfigured, createAdminClient } = await import('@/lib/supabase/admin');
      if (isSupabaseConfigured()) {
        const adminSupabase = createAdminClient();
        await adminSupabase.from('audit_logs').insert({
          actor_email: newEntry.actor_email,
          action: newEntry.action,
          details: (newEntry.details || { description: newEntry.description }) as any,
          ip_address: newEntry.ip_address,
          created_at: newEntry.timestamp,
        });
      }
    } catch (dbErr) {
      console.warn('[AuditStore] Failed to persist to Supabase audit_logs table:', dbErr);
    }
  }

  return newEntry;
}

export function queryAuditLogs(params?: {
  action?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}): { logs: AuditLogEntry[]; total: number } {
  const all = getAllAuditLogs();
  let filtered = [...all];

  if (params?.action && params.action !== 'all') {
    filtered = filtered.filter((l) => l.action === params.action);
  }

  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.description.toLowerCase().includes(q) ||
        l.actor_name.toLowerCase().includes(q) ||
        l.actor_email.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }

  // Urutkan terbaru di atas
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filtered.length;
  const offset = params?.offset || 0;
  const limit = params?.limit || 50;
  const paged = filtered.slice(offset, offset + limit);

  return { logs: paged, total };
}
