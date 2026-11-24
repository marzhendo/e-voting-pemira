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
 * Autentikasi Pemilih berbasis NIM dan Kata Sandi Pemilih Unik.
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
      const { data: voter, error } = await adminSupabase
        .from('voters_whitelist')
        .select('id, nim, name, email, generation, has_voted, password_hash, login_attempts, locked_until')
        .or(`nim.ilike.${cleanId},email.ilike.${cleanId}`)
        .maybeSingle();

      if (error) {
        console.error('[VoterAuth] Supabase query error:', error);
        return {
          success: false,
          code: 'SERVER_ERROR',
          message: 'Terjadi kegagalan koneksi ke basis data pemilihan. Silakan coba kembali.',
        };
      }

      if (!voter) {
        return {
          success: false,
          code: 'NIM_NOT_IN_DPT',
          message: 'NIM atau kredensial kamu tidak terdaftar dalam Daftar Pemilih Tetap (DPT) resmi.',
        };
      }

      // 3. Periksa Status Penguncian Akun (Lockout)
      const currentAttempts = voter.login_attempts || 0;
      const lockoutStatus = checkAccountLockout(currentAttempts, voter.locked_until);

      if (lockoutStatus.isLocked) {
        return {
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: `Akun sementara terkunci akibat melebihi batas 5 kali salah kata sandi. Silakan tunggu ${lockoutStatus.remainingMinutes} menit atau hubungi Panitia KPR.`,
          lockoutMinutes: lockoutStatus.remainingMinutes,
        };
      }

      // 4. Periksa apakah kata sandi sudah digenerate
      if (!voter.password_hash) {
        return {
          success: false,
          code: 'PASSWORD_NOT_SET',
          message: 'Kata sandi pemilih belum diterbitkan untuk akun ini. Silakan hubungi Panitia KPR.',
        };
      }

      // 5. Verifikasi Kata Sandi (Timing-Safe)
      const isPasswordValid = verifyVoterPassword(cleanPassword, voter.password_hash);

      if (!isPasswordValid) {
        const nextAttempts = currentAttempts + 1;
        const isNowLocked = nextAttempts >= MAX_LOGIN_ATTEMPTS;
        const lockedUntil = isNowLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

        await adminSupabase
          .from('voters_whitelist')
          .update({
            login_attempts: nextAttempts,
            locked_until: lockedUntil,
          })
          .eq('id', voter.id);

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

      // 6. Sukses: Reset penghitung percobaan gagal ke 0
      await adminSupabase
        .from('voters_whitelist')
        .update({
          login_attempts: 0,
          locked_until: null,
        })
        .eq('id', voter.id);

      // Tentukan role pengguna
      let effectiveRole: AdminRole | 'voter' = 'voter';
      if (isRootSuperadminEmail(voter.email)) {
        effectiveRole = 'super_admin';
      } else {
        const { data: adminUser } = await adminSupabase
          .from('admin_users')
          .select('role')
          .eq('email', voter.email.toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (adminUser?.role) {
          effectiveRole = adminUser.role;
        }
      }

      const hasVoted = Boolean(voter.has_voted);

      const sessionUser: SessionUser = {
        id: voter.id,
        email: voter.email,
        name: voter.name,
        nim: voter.nim,
        role: effectiveRole,
        isDptVerified: true,
        hasVoted,
        generation: voter.generation,
        entraTenantId: 'voter-password-auth',
        entraObjectId: `voter-${voter.nim}`,
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
        message: 'Autentikasi pemilih berhasil.',
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

  // Di dev mode lokal, jika kata sandi belum disetel, izinkan default "HMIF2026" atau hash yang tersimpan
  const hasCustomPassword = Boolean(devVoter.password_hash);
  const isValidDev = hasCustomPassword
    ? verifyVoterPassword(cleanPassword, devVoter.password_hash!)
    : cleanPassword === 'HMIF2026' || cleanPassword === cleanId.toUpperCase();

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
    message: 'Login pemilih berhasil (Mode Pengujian Lokal).',
    user: sessionUser,
    redirectUrl,
    token,
  };
}
