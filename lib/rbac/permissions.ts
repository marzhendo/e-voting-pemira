import type { AdminRole } from '@/lib/supabase/types';
import type { SessionUser } from '@/lib/auth/session';

export type Permission =
  | 'view_turnout'
  | 'view_live_tally'
  | 'view_final_tally'
  | 'manage_dpt'
  | 'manage_candidates'
  | 'manage_election_settings'
  | 'toggle_maintenance'
  | 'export_reports'
  | 'view_audit_logs'
  | 'manage_admins';

/**
 * Matriks hak akses resmi (RBAC) berdasarkan dokumen AUTHENTICATION.md (Bagian 7.1).
 */
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  kpr_admin: [
    'view_turnout',
    'view_live_tally',
    'view_final_tally',
    'manage_dpt',
    'manage_candidates',
    'manage_election_settings',
    'export_reports',
    'view_audit_logs',
  ],
  auditor: [
    'view_turnout',
    'view_final_tally',
    'export_reports',
    'view_audit_logs',
  ],
  super_admin: [
    'view_turnout',
    'view_final_tally',
    'manage_dpt',
    'manage_candidates',
    'manage_election_settings',
    'toggle_maintenance',
    'export_reports',
    'view_audit_logs',
    'manage_admins',
  ],
};

/**
 * Memeriksa apakah pengguna memiliki hak akses tertentu.
 * Khusus 'auditor', hanya dapat melihat tally setelah pemungutan suara resmi ditutup (isElectionClosed = true).
 */
export function hasPermission(
  role: AdminRole | 'voter' | undefined,
  permission: Permission,
  isElectionClosed = false
): boolean {
  if (!role || role === 'voter') {
    return false;
  }

  // Auditor hanya boleh melihat hasil penghitungan suara setelah pemilihan resmi ditutup
  if (role === 'auditor' && permission === 'view_live_tally') {
    return false;
  }

  if (role === 'auditor' && permission === 'view_final_tally' && !isElectionClosed) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Helper untuk memvalidasi otorisasi admin pada Server Actions atau Route Handlers.
 */
export function verifyAdminAccess(
  user: SessionUser | null,
  requiredPermission?: Permission,
  isElectionClosed = false
): { authorized: boolean; error?: string; status: number } {
  if (!user) {
    return {
      authorized: false,
      error: 'Autentikasi diperlukan. Silakan masuk terlebih dahulu.',
      status: 401,
    };
  }

  if (!user.role || user.role === 'voter') {
    return {
      authorized: false,
      error: 'Akses Ditolak: Anda tidak memiliki wewenang administratif Panitia Pemira HMIF.',
      status: 403,
    };
  }

  if (requiredPermission && !hasPermission(user.role as AdminRole, requiredPermission, isElectionClosed)) {
    return {
      authorized: false,
      error: `Akses Ditolak: Peran '${user.role}' tidak memiliki izin '${requiredPermission}'.`,
      status: 403,
    };
  }

  return { authorized: true, status: 200 };
}
