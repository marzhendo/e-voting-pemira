import { isSupabaseConfigured, createAdminClient } from '../supabase/admin.ts';
import { getDevElectionSettings } from './dev-settings-store.ts';
import { isRootSuperadminEmail } from '../auth/constants.ts';
import { findAdminByIdentifier } from '../admin/store.ts';

/**
 * Memeriksa status mode pemeliharaan darurat (emergency maintenance).
 * Mendukung live Supabase query dengan fallback ke in-memory dev settings.
 */
export async function getMaintenanceStatus(): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from('election_settings')
        .select('maintenance_mode')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        return Boolean(data.maintenance_mode);
      }
    } catch (err) {
      console.warn('[MaintenanceStatus] Gagal membaca status dari Supabase, beralih ke dev-store:', err);
    }
  }

  return Boolean(getDevElectionSettings().maintenance_mode);
}

/**
 * Menentukan apakah suatu pengidentifikasi (NIM atau Email) dimiliki oleh Panitia/Administrator
 * yang aktif dan memiliki otoritas untuk tetap masuk saat pemeliharaan sistem.
 */
export async function isDesignatedAdminIdentifier(identifier: string): Promise<boolean> {
  const cleanId = identifier.trim().toLowerCase();

  // 1. Superadmin utama selalu memiliki akses bypass pemeliharaan
  if (isRootSuperadminEmail(cleanId)) {
    return true;
  }

  // 2. Pemeriksaan live Supabase admin_users
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createAdminClient();
      let targetEmail = cleanId;

      // Jika input berupa NIM, cari email terkait di voters_whitelist
      if (!cleanId.includes('@')) {
        const { data: voter } = await adminClient
          .from('voters_whitelist')
          .select('email')
          .eq('nim', cleanId)
          .maybeSingle();

        if (voter?.email) {
          targetEmail = voter.email.toLowerCase();
          if (isRootSuperadminEmail(targetEmail)) {
            return true;
          }
        }
      }

      const { data, error } = await adminClient
        .from('admin_users')
        .select('id, email, role, is_active')
        .eq('email', targetEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch (err) {
      console.warn('[MaintenanceStatus] Gagal memeriksa status admin di Supabase:', err);
    }
  }

  // 3. Fallback dev store
  const localAdmin = findAdminByIdentifier(cleanId);
  return Boolean(localAdmin && localAdmin.is_active);
}

/**
 * Checks whether the voting period is officially closed (closed by KPR or past end_time).
 */
export async function getElectionClosedStatus(): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from('election_settings')
        .select('is_voting_open, end_time')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        return !data.is_voting_open || new Date() > new Date(data.end_time);
      }
    } catch (err) {
      console.warn('[ElectionStatus] Gagal memeriksa status penutupan dari Supabase:', err);
    }
  }

  const devSettings = getDevElectionSettings();
  return !devSettings.is_voting_open || new Date() > new Date(devSettings.end_time);
}
