import type { AdminRole } from '@/lib/supabase/types';
import type { SessionUser } from '@/lib/auth/session';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { isRootSuperadminEmail } from '@/lib/auth/constants';
import { isDevFallbackAllowed } from '@/lib/security/env';
import { getAllAdminUsers } from '@/lib/admin/store';
import { verifyAdminAccess, type Permission } from './permissions';

export interface ActiveAdminCheckResult {
  authorized: boolean;
  error?: string;
  status: number;
  effectiveRole?: AdminRole;
}

/**
 * Verifies admin authentication, live active status (`admin_users.is_active`),
 * and up-to-date RBAC role/permissions on every admin API request.
 *
 * Ensures that deactivating or revoking an admin takes effect immediately
 * rather than waiting for stateless 15-minute JWT expiration.
 */
export async function verifyActiveAdminAccess(
  user: SessionUser | null,
  requiredPermission?: Permission,
  isElectionClosed = false
): Promise<ActiveAdminCheckResult> {
  // 1. Baseline session & non-voter check
  const baseCheck = verifyAdminAccess(user);
  if (!baseCheck.authorized || !user) {
    return baseCheck;
  }

  // 2. Root superadmin is immutable and always active
  if (isRootSuperadminEmail(user.email)) {
    const rootPermCheck = verifyAdminAccess(
      { ...user, role: 'super_admin' },
      requiredPermission,
      isElectionClosed
    );
    return {
      ...rootPermCheck,
      effectiveRole: 'super_admin',
    };
  }

  // 3. Live database check when Supabase is configured (fail-closed)
  if (isSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();
      const { data: adminRecord, error } = await adminSupabase
        .from('admin_users')
        .select('role, is_active')
        .ilike('email', user.email.trim())
        .maybeSingle();

      if (error) {
        console.error('[ActiveAdminCheck] Failed to verify live admin status:', error.message);
        return {
          authorized: false,
          error: 'Gagal memverifikasi status aktif akun administrator dari basis data.',
          status: 500,
        };
      }

      if (!adminRecord || adminRecord.is_active === false) {
        return {
          authorized: false,
          error: 'Akses Dicabut: Akun administrator Anda telah dinonaktifkan atau tidak lagi terdaftar.',
          status: 403,
        };
      }

      const liveRole = adminRecord.role as AdminRole;
      const permCheck = verifyAdminAccess(
        { ...user, role: liveRole },
        requiredPermission,
        isElectionClosed
      );

      return {
        ...permCheck,
        effectiveRole: liveRole,
      };
    } catch (err) {
      console.error('[ActiveAdminCheck] Exception during live admin verification:', err);
      return {
        authorized: false,
        error: 'Terjadi kegagalan server saat memverifikasi otorisasi administrator.',
        status: 500,
      };
    }
  }

  // 4. Offline non-production dev store fallback
  if (!isDevFallbackAllowed(false)) {
    return {
      authorized: false,
      error: 'Basis data otorisasi administrator tidak tersedia pada mode produksi.',
      status: 500,
    };
  }

  const devAdmins = getAllAdminUsers();
  const matched = devAdmins.find(
    (a) => a.email.toLowerCase() === user.email.trim().toLowerCase()
  );

  if (!matched || !matched.is_active) {
    return {
      authorized: false,
      error: 'Akses Dicabut: Akun administrator Anda telah dinonaktifkan atau tidak lagi terdaftar.',
      status: 403,
    };
  }

  const permCheck = verifyAdminAccess(
    { ...user, role: matched.role },
    requiredPermission,
    isElectionClosed
  );

  return {
    ...permCheck,
    effectiveRole: matched.role,
  };
}
