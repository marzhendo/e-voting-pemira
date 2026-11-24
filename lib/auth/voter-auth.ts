import { z } from 'zod';
import { createAdminClient, isSupabaseConfigured } from '../supabase/admin.ts';
import { isProductionEnvironment, isDevFallbackAllowed } from '../security/env.ts';
import { isRootSuperadminEmail } from './constants.ts';
import { getMaintenanceStatus, isDesignatedAdminIdentifier } from '../election/maintenance-status.ts';
import type { AdminRole } from '../supabase/types.ts';
import {
  verifyVoterPassword,
  checkAccountLockout,
  normalizePassword,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from './password-service.ts';
import {
  findVoterByIdentifier,
  updateVoterLoginAttempts,
  resetVoterLoginAttempts,
} from '../dpt/store.ts';
import { createSessionToken, setSessionCookie, type SessionUser } from './session.ts';

export const loginCredentialsSchema = z.object({
  nim: z.string().min(4, 'NIM atau nomor identitas wajib diisi.').max(50),
  password: z.string().min(4, 'Kata sandi minimal 4 karakter.'),
});

export interface VoterLoginResult {
  success: boolean;
  code:
    | 'SUCCESS'
    | 'NIM_NOT_IN_DPT'
    | 'ACCOUNT_LOCKED'
    | 'INVALID_PASSWORD'
    | 'PASSWORD_NOT_SET'
    | 'MAINTENANCE_MODE'
    | 'SERVER_ERROR';
  message: string;
  user?: SessionUser;
  redirectUrl?: string;
  remainingAttempts?: number;
  lockoutMinutes?: number;
  token?: string;
}

/**
 * Autentikasi Pemilih & Administrator berbasis NIM/Email dan Kata Sandi.
 * Mendukung basis data PostgreSQL Supabase dengan fallback dev-store lokal.
 */
export async function authenticateWithPassword(
  rawNim: string,
  rawPassword: string
): Promise<VoterLoginResult> {
  const cleanId = rawNim.trim().toLowerCase();
  const cleanPassword = normalizePassword(rawPassword);

  // 1. Periksa Mode Pemeliharaan (Maintenance Mode)
  // Superadmin dan Panitia KPR memiliki hak akses darurat untuk tetap masuk
  const inMaintenance = await getMaintenanceStatus();
  if (inMaintenance) {
    const isAdmin = await isDesignatedAdminIdentifier(cleanId);
    if (!isAdmin) {
      return {
        success: false,
        code: 'MAINTENANCE_MODE',
        message: 'Bilik suara sedang ditutup sementara untuk pemeriksaan teknis oleh Panitia KPR.',
      };
    }
  }

  // 2. Ambil data pemilih dari Supabase / Dev Store
  if (isSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();
      let voterRecord: {
        id: string;
        nim: string;
        name: string;
        email: string;
        generation: number;
        has_voted: boolean;
        password_hash: string | null;
        login_attempts: number;
        locked_until: string | null;
      } | null = null;
      let isUsingLegacyOtpCols = false;

      // Coba query dengan kolom password baru
      const { data: voter, error } = await adminSupabase
        .from('voters_whitelist')
        .select('id, nim, name, email, generation, has_voted, password_hash, login_attempts, locked_until')
        .or(`nim.ilike.${cleanId},email.ilike.${cleanId}`)
        .maybeSingle();

      if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
        // Fallback jika migrasi 00013 belum dieksekusi di Supabase remote
        isUsingLegacyOtpCols = true;
        const { data: legacyVoter, error: legacyErr } = await adminSupabase
          .from('voters_whitelist')
          .select('id, nim, name, email, generation, has_voted, otp_hash, otp_attempts, otp_expires_at')
          .or(`nim.ilike.${cleanId},email.ilike.${cleanId}`)
          .maybeSingle();

        if (legacyErr) {
          console.error('[VoterAuth] Supabase legacy query error:', legacyErr);
          return {
            success: false,
            code: 'SERVER_ERROR',
            message: 'Terjadi kegagalan koneksi ke basis data pemilihan. Silakan coba kembali.',
          };
        }

        if (legacyVoter) {
          voterRecord = {
            id: legacyVoter.id,
            nim: legacyVoter.nim,
            name: legacyVoter.name,
            email: legacyVoter.email,
            generation: legacyVoter.generation,
            has_voted: legacyVoter.has_voted,
            password_hash: legacyVoter.otp_hash,
            login_attempts: legacyVoter.otp_attempts || 0,
            locked_until: legacyVoter.otp_expires_at,
          };
        }
      } else if (error) {
        console.error('[VoterAuth] Supabase query error:', error);
        return {
          success: false,
          code: 'SERVER_ERROR',
          message: 'Terjadi kegagalan koneksi ke basis data pemilihan. Silakan coba kembali.',
        };
      } else if (voter) {
        voterRecord = voter;
      }

      // Jika tidak ditemukan di voters_whitelist, periksa tabel admin_users
      if (!voterRecord) {
        const { data: adminUser } = await adminSupabase
          .from('admin_users')
          .select('id, email, role, is_active')
          .eq('email', cleanId)
          .eq('is_active', true)
          .maybeSingle();

        if (adminUser) {
          voterRecord = {
            id: adminUser.id,
            nim: '999999999999',
            name: 'Administrator KPR',
            email: adminUser.email,
            generation: 2024,
            has_voted: false,
            password_hash: null,
            login_attempts: 0,
            locked_until: null,
          };
        } else {
          return {
            success: false,
            code: 'NIM_NOT_IN_DPT',
            message: 'NIM atau kredensial kamu tidak terdaftar dalam Daftar Pemilih Tetap (DPT) resmi.',
          };
        }
      }

      // 3. Periksa Status Penguncian Akun (Lockout)
      const currentAttempts = voterRecord.login_attempts || 0;
      const lockoutStatus = checkAccountLockout(currentAttempts, voterRecord.locked_until);

      if (lockoutStatus.isLocked) {
        return {
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: `Akun sementara terkunci akibat melebihi batas 5 kali salah kata sandi. Silakan tunggu ${lockoutStatus.remainingMinutes} menit atau hubungi Panitia KPR.`,
          lockoutMinutes: lockoutStatus.remainingMinutes,
        };
      }

      // 4. Verifikasi Kata Sandi
      const isSuperadminAccount = isRootSuperadminEmail(voterRecord.email) || isRootSuperadminEmail(cleanId);
      const configuredAdminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

      let isPasswordValid = false;

      // Cek dengan hash tersimpan jika ada
      if (voterRecord.password_hash) {
        isPasswordValid = verifyVoterPassword(cleanPassword, voterRecord.password_hash);
      }

      // Khusus akun Superadmin utama, selalu izinkan sandi master terkonfigurasi atau default darurat
      if (!isPasswordValid && isSuperadminAccount) {
        if (configuredAdminPassword) {
          isPasswordValid = cleanPassword === normalizePassword(configuredAdminPassword);
        } else {
          // Sandi default awal superadmin (dapat diubah di .env.local via SUPER_ADMIN_PASSWORD)
          isPasswordValid =
            cleanPassword === 'HMIF2026!' ||
            cleanPassword === 'HMIF2026' ||
            cleanPassword === 'SUPERADMIN2026';
        }
      }

      if (!isPasswordValid && !voterRecord.password_hash && !isSuperadminAccount) {
        return {
          success: false,
          code: 'PASSWORD_NOT_SET',
          message: 'Kata sandi pemilih belum diterbitkan untuk akun ini. Silakan hubungi Panitia KPR.',
        };
      }

      if (!isPasswordValid) {
        const nextAttempts = currentAttempts + 1;
        const isNowLocked = nextAttempts >= MAX_LOGIN_ATTEMPTS;
        const lockedUntil = isNowLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

        if (isUsingLegacyOtpCols) {
          await adminSupabase
            .from('voters_whitelist')
            .update({
              otp_attempts: nextAttempts,
              otp_expires_at: lockedUntil,
            })
            .eq('id', voterRecord.id);
        } else {
          await adminSupabase
            .from('voters_whitelist')
            .update({
              login_attempts: nextAttempts,
              locked_until: lockedUntil,
            })
            .eq('id', voterRecord.id);
        }

        if (isNowLocked) {
          return {
            success: false,
            code: 'ACCOUNT_LOCKED',
            message: 'Kata sandi salah. Batas percobaan (5 kali) terlampaui. Akun terkunci sementara selama 15 menit demi keamanan.',
            lockoutMinutes: 15,
          };
        }

        const remaining = MAX_LOGIN_ATTEMPTS - nextAttempts;
        return {
          success: false,
          code: 'INVALID_PASSWORD',
          message: `Kata sandi pemilih salah. Sisa kesempatan login: ${remaining} kali.`,
          remainingAttempts: remaining,
        };
      }

      // 5. Sukses: Reset penghitung percobaan gagal ke 0
      if (isUsingLegacyOtpCols) {
        await adminSupabase
          .from('voters_whitelist')
          .update({
            otp_attempts: 0,
            otp_expires_at: null,
          })
          .eq('id', voterRecord.id);
      } else {
        await adminSupabase
          .from('voters_whitelist')
          .update({
            login_attempts: 0,
            locked_until: null,
          })
          .eq('id', voterRecord.id);
      }

      // Tentukan role pengguna
      let effectiveRole: AdminRole | 'voter' = 'voter';
      if (isRootSuperadminEmail(voterRecord.email) || isRootSuperadminEmail(cleanId)) {
        effectiveRole = 'super_admin';
      } else {
        const { data: adminUser } = await adminSupabase
          .from('admin_users')
          .select('role')
          .eq('email', voterRecord.email.toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (adminUser?.role) {
          effectiveRole = adminUser.role;
        }
      }

      const hasVoted = Boolean(voterRecord.has_voted);

      const sessionUser: SessionUser = {
        id: voterRecord.id,
        email: voterRecord.email,
        name: voterRecord.name,
        nim: voterRecord.nim,
        role: effectiveRole,
        isDptVerified: true,
        hasVoted,
        generation: voterRecord.generation,
        entraTenantId: 'voter-password-auth',
        entraObjectId: `voter-${voterRecord.nim}`,
      };

      const token = await createSessionToken(sessionUser);
      setSessionCookie(token);

      const redirectUrl =
        effectiveRole !== 'voter'
          ? '/admin/dashboard'
          : hasVoted
          ? '/receipt'
          : '/vote';

      return {
        success: true,
        code: 'SUCCESS',
        message: 'Autentikasi berhasil.',
        user: sessionUser,
        redirectUrl,
        token,
      };
    } catch (err) {
      console.error('[VoterAuth] Exception saat autentikasi Supabase:', err);
      return {
        success: false,
        code: 'SERVER_ERROR',
        message: 'Terjadi kegagalan server saat memproses login.',
      };
    }
  }

  // Fallback Dev Store (Pengujian Lokal / Offline)
  if (!isDevFallbackAllowed(false)) {
    return {
      success: false,
      code: 'SERVER_ERROR',
      message: 'Basis data DPT tidak tersedia pada mode produksi.',
    };
  }

  const devVoter = findVoterByIdentifier(cleanId);
  if (!devVoter) {
    return {
      success: false,
      code: 'NIM_NOT_IN_DPT',
      message: 'NIM atau kredensial kamu tidak terdaftar dalam Daftar Pemilih Tetap (DPT) resmi.',
    };
  }

  const currentAttempts = devVoter.login_attempts || 0;
  const lockoutStatus = checkAccountLockout(currentAttempts, devVoter.locked_until || null);

  if (lockoutStatus.isLocked) {
    return {
      success: false,
      code: 'ACCOUNT_LOCKED',
      message: `Akun sementara terkunci akibat melebihi batas 5 kali salah kata sandi. Silakan tunggu ${lockoutStatus.remainingMinutes} menit atau hubungi Panitia KPR.`,
      lockoutMinutes: lockoutStatus.remainingMinutes,
    };
  }

  const isSuperadminDev = isRootSuperadminEmail(devVoter.email) || isRootSuperadminEmail(cleanId);
  const configuredAdminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  // Di dev mode lokal, izinkan default "HMIF2026!" / "HMIF2026" atau hash yang tersimpan
  const hasCustomPassword = Boolean(devVoter.password_hash);
  let isValidDev = false;

  if (hasCustomPassword) {
    isValidDev = verifyVoterPassword(cleanPassword, devVoter.password_hash!);
  }

  if (!isValidDev) {
    if (isSuperadminDev) {
      if (configuredAdminPassword) {
        isValidDev = cleanPassword === normalizePassword(configuredAdminPassword);
      } else {
        isValidDev =
          cleanPassword === 'HMIF2026!' ||
          cleanPassword === 'HMIF2026' ||
          cleanPassword === 'SUPERADMIN2026';
      }
    } else if (!hasCustomPassword) {
      isValidDev = cleanPassword === 'HMIF2026' || cleanPassword === cleanId.toUpperCase();
    }
  }

  if (!isValidDev) {
    const nextAttempts = currentAttempts + 1;
    const isNowLocked = nextAttempts >= MAX_LOGIN_ATTEMPTS;
    const lockedUntil = isNowLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

    updateVoterLoginAttempts(devVoter.nim, nextAttempts, lockedUntil);

    if (isNowLocked) {
      return {
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: 'Kata sandi salah. Batas percobaan (5 kali) terlampaui. Akun terkunci sementara selama 15 menit demi keamanan.',
        lockoutMinutes: 15,
      };
    }

    const remaining = MAX_LOGIN_ATTEMPTS - nextAttempts;
    return {
      success: false,
      code: 'INVALID_PASSWORD',
      message: `Kata sandi pemilih salah. Sisa kesempatan login: ${remaining} kali.`,
      remainingAttempts: remaining,
    };
  }

  // Sukses dev store
  resetVoterLoginAttempts(devVoter.nim);

  const effectiveRole = devVoter.role || (isRootSuperadminEmail(devVoter.email) ? 'super_admin' : 'voter');
  const hasVoted = Boolean(devVoter.has_voted);

  const sessionUser: SessionUser = {
    id: devVoter.id,
    email: devVoter.email,
    name: devVoter.name,
    nim: devVoter.nim,
    role: effectiveRole,
    isDptVerified: true,
    hasVoted,
    generation: devVoter.generation,
    entraTenantId: 'dev-password-auth',
    entraObjectId: `voter-${devVoter.nim}`,
  };

  const token = await createSessionToken(sessionUser);
  setSessionCookie(token);

  const redirectUrl =
    effectiveRole !== 'voter'
      ? '/admin/dashboard'
      : hasVoted
      ? '/receipt'
      : '/vote';

  return {
    success: true,
    code: 'SUCCESS',
    message: 'Login berhasil (Mode Pengujian Lokal).',
    user: sessionUser,
    redirectUrl,
    token,
  };
}
