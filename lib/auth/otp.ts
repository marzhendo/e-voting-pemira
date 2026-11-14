import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';
import { smtpMailService } from '@/lib/mail/smtp-service';
import { findVoterByIdentifier } from '@/lib/dpt/store';
import { findAdminByEmail } from '@/lib/admin/store';
import { isRootSuperadminEmail } from './constants';
import type { AdminRole } from '@/lib/supabase/types';
import type { SessionUser } from './session';

export interface OtpRequestResult {
  success: boolean;
  maskedEmail?: string;
  cooldownSeconds?: number;
  code?: 'NIM_NOT_IN_DPT' | 'ALREADY_VOTED' | 'RATE_LIMITED' | 'MAIL_ERROR' | 'SERVER_ERROR';
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  voter?: SessionUser;
  code?: 'NIM_NOT_IN_DPT' | 'ALREADY_VOTED' | 'NO_OTP_ACTIVE' | 'OTP_EXPIRED' | 'MAX_ATTEMPTS_EXCEEDED' | 'INVALID_PIN' | 'SERVER_ERROR';
  remainingAttempts?: number;
  error?: string;
}

interface InMemoOtpState {
  nim: string;
  name: string;
  email: string;
  generation: number;
  hasVoted: boolean;
  role?: AdminRole | 'voter';
  otpHash: string | null;
  otpExpiresAt: number | null;
  otpAttempts: number;
  otpLastSentAt: number | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __devMockOtpStore: Map<string, InMemoOtpState> | undefined;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const OTP_STORE_PATH = path.join(DATA_DIR, 'dev-otps.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[OtpService] Failed to create data dir:', err);
  }
}

function getDevMockStore(): Map<string, InMemoOtpState> {
  if (!globalThis.__devMockOtpStore) {
    globalThis.__devMockOtpStore = new Map<string, InMemoOtpState>();
  }

  // Sinkronisasi data dari disk agar konsisten lintas route handler (/api/auth/otp/request dan /api/auth/otp/verify)
  try {
    if (fs.existsSync(OTP_STORE_PATH)) {
      const raw = fs.readFileSync(OTP_STORE_PATH, 'utf-8');
      const list: InMemoOtpState[] = JSON.parse(raw);
      for (const item of list) {
        globalThis.__devMockOtpStore.set(item.nim, item);
      }
    }
  } catch (err) {
    console.warn('[OtpService] Failed to sync OTP store from disk:', err);
  }

  return globalThis.__devMockOtpStore;
}

function saveDevMockStore(): void {
  if (!globalThis.__devMockOtpStore) return;
  ensureDataDir();
  try {
    const list = Array.from(globalThis.__devMockOtpStore.values());
    fs.writeFileSync(OTP_STORE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[OtpService] Failed to persist OTP store to disk:', err);
  }
}

export function resetDevOtpStore(): void {
  if (globalThis.__devMockOtpStore) {
    globalThis.__devMockOtpStore.clear();
  }
  try {
    if (fs.existsSync(OTP_STORE_PATH)) {
      fs.unlinkSync(OTP_STORE_PATH);
    }
  } catch {}
}

const OTP_SECRET_SALT = process.env.OTP_SECRET_SALT || 'hmif-pemira-otp-salt-secure-2026';
if (process.env.APP_ENV === 'production' && !process.env.OTP_SECRET_SALT) {
  console.warn(
    '[SECURITY WARNING] Variabel OTP_SECRET_SALT belum dikonfigurasi di server produksi! Menggunakan salt default (tidak disarankan untuk peluncuran resmi).'
  );
}
const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 menit
const OTP_COOLDOWN_MS = 60 * 1000; // 60 detik cooldown kirim ulang
const MAX_FAILED_ATTEMPTS = 3;

/**
 * Menghasilkan PIN numerik 6-digit ber-entropi kriptografis tinggi.
 */
export function generate6DigitPin(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Menghasilkan hash SHA-256 untuk PIN dengan salt rahasia aplikasi.
 */
export function hashPin(pin: string): string {
  return crypto
    .createHash('sha256')
    .update(`${pin}:${OTP_SECRET_SALT}`)
    .digest('hex');
}

/**
 * Memverifikasi PIN input dengan hash yang tersimpan secara timing-safe.
 */
export function verifyPinHash(inputPin: string, storedHash: string): boolean {
  const computedHash = hashPin(inputPin);
  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Menyembunyikan sebagian karakter email untuk privasi (e.g., ahm***y@student.telkomuniversity.ac.id)
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;

  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }

  const firstChar = local.slice(0, 2);
  const lastChar = local.slice(-1);
  return `${firstChar}***${lastChar}@${domain}`;
}

/**
 * Meminta pengiriman PIN 6-digit ke email Outlook mahasiswa berdasarkan NIM.
 */
export async function requestVoterOtp(rawIdentifier: string): Promise<OtpRequestResult> {
  const cleanId = rawIdentifier.trim().toLowerCase();
  const isEmail = cleanId.includes('@');
  const now = Date.now();

  // 1. Validasi Domain Email Institusi (Kecuali Superadmin Utama)
  if (isEmail && !isRootSuperadminEmail(cleanId) && !cleanId.endsWith('@student.telkomuniversity.ac.id')) {
    return {
      success: false,
      code: 'NIM_NOT_IN_DPT',
      error: 'Format email tidak valid. Mahasiswa wajib menggunakan email resmi berakhiran @student.telkomuniversity.ac.id.',
    };
  }

  // 2. Cek Mode Live Supabase atau Dev In-Memory Fallback
  if (isSupabaseConfigured()) {
    try {
      const pin = generate6DigitPin();
      const pinHash = hashPin(pin);
      const expiresAt = new Date(now + OTP_EXPIRATION_MS).toISOString();

      const adminClient = createAdminClient();
      const { data: rpcResult, error: rpcError } = await adminClient.rpc('request_voter_otp_secure', {
        p_identifier: cleanId,
        p_pin_hash: pinHash,
        p_expires_at: expiresAt,
        p_cooldown_seconds: 60,
      });

      if (!rpcError && rpcResult) {
        if (!rpcResult.success) {
          return {
            success: false,
            code: (rpcResult.code as OtpRequestResult['code']) || 'SERVER_ERROR',
            error: rpcResult.message || 'Terjadi kesalahan saat memproses permintaan PIN.',
            cooldownSeconds: rpcResult.cooldownSeconds,
          };
        }

        const voter = rpcResult.voter!;
        // Kirim via SMTP Service
        const sendResult = await smtpMailService.sendLoginPin({
          to: voter.email,
          voterName: voter.name,
          nim: voter.nim,
          pin,
        });

        if (!sendResult.success) {
          return {
            success: false,
            code: 'MAIL_ERROR',
            error: sendResult.error || 'Gagal mengirim email PIN ke server kampus.',
          };
        }

        return {
          success: true,
          maskedEmail: maskEmail(voter.email),
          cooldownSeconds: 60,
        };
      }

      // Fallback jika stored procedure belum dimigrasi di remote DB
      console.warn('[OtpService] RPC request_voter_otp_secure tidak tersedia, menggunakan direct query fallback:', rpcError?.message);
      let query = adminClient
        .from('voters_whitelist')
        .select('id, nim, name, email, generation, has_voted, otp_last_sent_at');

      if (isEmail) {
        query = query.eq('email', cleanId);
      } else {
        query = query.eq('nim', cleanId);
      }

      const { data: voter, error } = await query.maybeSingle();

      if (error || !voter) {
        return {
          success: false,
          code: 'NIM_NOT_IN_DPT',
          error: 'NIM atau email kamu belum terdaftar dalam Daftar Pemilih Tetap (DPT) Pemira HMIF.',
        };
      }

      if (voter.has_voted) {
        return {
          success: false,
          code: 'ALREADY_VOTED',
          error: 'Hak suara kamu telah digunakan pada pemilihan ini.',
        };
      }

      // Periksa Cooldown Rate Limit 60 Detik
      if (voter.otp_last_sent_at) {
        const lastSent = new Date(voter.otp_last_sent_at).getTime();
        const diff = now - lastSent;
        if (diff < OTP_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - diff) / 1000);
          return {
            success: false,
            code: 'RATE_LIMITED',
            cooldownSeconds: remainingSeconds,
            error: `Mohon tunggu ${remainingSeconds} detik sebelum meminta kode PIN baru.`,
          };
        }
      }

      const { error: updateError } = await adminClient
        .from('voters_whitelist')
        .update({
          otp_hash: pinHash,
          otp_expires_at: expiresAt,
          otp_attempts: 0,
          otp_last_sent_at: new Date(now).toISOString(),
        })
        .eq('id', voter.id);

      if (updateError) {
        console.error('[OtpService] Gagal memperbarui OTP di DB:', updateError);
        return {
          success: false,
          code: 'SERVER_ERROR',
          error: 'Terjadi kegagalan server saat menyiapkan kode PIN.',
        };
      }

      // Kirim via SMTP Service
      const sendResult = await smtpMailService.sendLoginPin({
        to: voter.email,
        voterName: voter.name,
        nim: voter.nim,
        pin,
      });

      if (!sendResult.success) {
        return {
          success: false,
          code: 'MAIL_ERROR',
          error: sendResult.error || 'Gagal mengirim email PIN ke server kampus.',
        };
      }

      return {
        success: true,
        maskedEmail: maskEmail(voter.email),
        cooldownSeconds: 60,
      };
    } catch (err) {
      console.error('[OtpService] Exception saat request OTP:', err);
      // Fallback ke dev mode jika exception
    }
  }

  // Fallback Dev Mode (In-Memory + Disk Sync)
  const devMockStore = getDevMockStore();
  let voterState: InMemoOtpState | undefined;
  const dptVoter = findVoterByIdentifier(cleanId);
  if (dptVoter) {
    if (!devMockStore.has(dptVoter.nim)) {
      devMockStore.set(dptVoter.nim, {
        nim: dptVoter.nim,
        name: dptVoter.name,
        email: dptVoter.email,
        generation: dptVoter.generation,
        hasVoted: dptVoter.has_voted,
        role: dptVoter.role || (isRootSuperadminEmail(dptVoter.email) ? 'super_admin' : 'voter'),
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpLastSentAt: null,
      });
    }
    voterState = devMockStore.get(dptVoter.nim);
    if (voterState) {
      voterState.hasVoted = dptVoter.has_voted;
      voterState.name = dptVoter.name;
      voterState.email = dptVoter.email;
      voterState.generation = dptVoter.generation;
      if (dptVoter.role) voterState.role = dptVoter.role;
      if (isRootSuperadminEmail(dptVoter.email)) voterState.role = 'super_admin';
    }
  } else {
    for (const v of devMockStore.values()) {
      if (isEmail ? v.email.toLowerCase() === cleanId : v.nim === cleanId) {
        voterState = v;
        break;
      }
    }
  }

  // Cek apakah pengakses merupakan administrator terdaftar
  const dynamicAdmin = findAdminByEmail(cleanId) || (dptVoter ? findAdminByEmail(dptVoter.email) : null);
  if (voterState && dynamicAdmin) {
    voterState.role = dynamicAdmin.role;
  } else if (!voterState && dynamicAdmin) {
    const adminNim = dynamicAdmin.nim || '999999999999';
    if (!devMockStore.has(adminNim)) {
      devMockStore.set(adminNim, {
        nim: adminNim,
        name: dynamicAdmin.name,
        email: dynamicAdmin.email,
        generation: 2026,
        hasVoted: false,
        role: dynamicAdmin.role,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpLastSentAt: null,
      });
    }
    voterState = devMockStore.get(adminNim);
  }

  if (!voterState) {
    return {
      success: false,
      code: 'NIM_NOT_IN_DPT',
      error: 'NIM atau email kamu belum terdaftar dalam Daftar Pemilih Tetap (DPT) Pemira HMIF.',
    };
  }

  if (voterState.hasVoted) {
    return {
      success: false,
      code: 'ALREADY_VOTED',
      error: 'Hak suara kamu telah digunakan pada pemilihan ini.',
    };
  }

  // Cek Cooldown
  if (voterState.otpLastSentAt) {
    const diff = now - voterState.otpLastSentAt;
    if (diff < OTP_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - diff) / 1000);
      return {
        success: false,
        code: 'RATE_LIMITED',
        cooldownSeconds: remainingSeconds,
        error: `Mohon tunggu ${remainingSeconds} detik sebelum meminta kode PIN baru.`,
      };
    }
  }

  // Generate PIN
  const pin = generate6DigitPin();
  voterState.otpHash = hashPin(pin);
  voterState.otpExpiresAt = now + OTP_EXPIRATION_MS;
  voterState.otpAttempts = 0;
  voterState.otpLastSentAt = now;
  saveDevMockStore();

  // Kirim via SMTP Service (akan mencetak di console jika SMTP offline)
  await smtpMailService.sendLoginPin({
    to: voterState.email,
    voterName: voterState.name,
    nim: voterState.nim,
    pin,
  });

  return {
    success: true,
    maskedEmail: maskEmail(voterState.email),
    cooldownSeconds: 60,
  };
}

/**
 * Memverifikasi PIN 6-digit yang dimasukkan mahasiswa.
 */
export async function verifyVoterOtp(rawIdentifier: string, inputPin: string): Promise<OtpVerifyResult> {
  const cleanId = rawIdentifier.trim().toLowerCase();
  const cleanPin = inputPin.trim();
  const isEmail = cleanId.includes('@');
  const now = Date.now();

  if (!/^\d{6}$/.test(cleanPin)) {
    return {
      success: false,
      code: 'INVALID_PIN',
      error: 'Format kode PIN harus tepat 6 digit angka.',
    };
  }

  // 1. Cek Mode Live Supabase
  if (isSupabaseConfigured()) {
    try {
      const pinHash = hashPin(cleanPin);
      const adminClient = createAdminClient();

      // Panggil Stored Procedure Atomik verify_voter_otp_secure (FOR UPDATE Row Lock)
      const { data: rpcResult, error: rpcError } = await adminClient.rpc('verify_voter_otp_secure', {
        p_identifier: cleanId,
        p_pin_hash: pinHash,
      });

      if (!rpcError && rpcResult) {
        if (!rpcResult.success) {
          return {
            success: false,
            code: (rpcResult.code as OtpVerifyResult['code']) || 'SERVER_ERROR',
            error: rpcResult.message || 'Gagal memverifikasi kode PIN.',
            remainingAttempts: rpcResult.remainingAttempts,
          };
        }

        const voter = rpcResult.voter!;
        let assignedRole: AdminRole | 'voter' = 'voter';

        // 1. Cek dari tabel admin_users Supabase secara dinamis
        const { data: dbAdmin } = await adminClient
          .from('admin_users')
          .select('role')
          .eq('email', voter.email.toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (dbAdmin?.role) {
          assignedRole = dbAdmin.role as AdminRole;
        } else {
          const adminMatch = findAdminByEmail(voter.email);
          if (adminMatch?.role) {
            assignedRole = adminMatch.role;
          }
        }

        return {
          success: true,
          voter: {
            id: voter.id,
            email: voter.email,
            name: voter.name,
            nim: voter.nim,
            role: assignedRole,
            isDptVerified: true,
            hasVoted: voter.has_voted,
            generation: voter.generation,
          },
        };
      }

      // Fallback jika stored procedure belum dimigrasi di remote DB
      console.warn('[OtpService] RPC verify_voter_otp_secure tidak tersedia, menggunakan direct query fallback:', rpcError?.message);
      let query = adminClient
        .from('voters_whitelist')
        .select('id, nim, name, email, generation, has_voted, otp_hash, otp_expires_at, otp_attempts');

      if (isEmail) {
        query = query.eq('email', cleanId);
      } else {
        query = query.eq('nim', cleanId);
      }

      const { data: voter, error } = await query.maybeSingle();

      if (error || !voter) {
        return {
          success: false,
          code: 'NIM_NOT_IN_DPT',
          error: 'Data mahasiswa tidak ditemukan di DPT.',
        };
      }

      if (voter.has_voted) {
        return {
          success: false,
          code: 'ALREADY_VOTED',
          error: 'Hak suara kamu telah digunakan sebelumnya.',
        };
      }

      // Cek apakah ada PIN aktif
      const otpHash = voter.otp_hash;
      const otpExpiresAt = voter.otp_expires_at;
      const currentAttempts = voter.otp_attempts || 0;

      if (!otpHash || !otpExpiresAt) {
        return {
          success: false,
          code: 'NO_OTP_ACTIVE',
          error: 'Tidak ada kode PIN aktif. Silakan minta kode baru.',
        };
      }

      // Cek Kedaluwarsa
      if (now > new Date(otpExpiresAt).getTime()) {
        return {
          success: false,
          code: 'OTP_EXPIRED',
          error: 'Kode PIN telah kedaluwarsa (10 menit). Silakan minta kode baru.',
        };
      }

      // Cek Batas Percobaan
      if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
        return {
          success: false,
          code: 'MAX_ATTEMPTS_EXCEEDED',
          error: 'Batas percobaan salah terlampaui. Silakan minta kode PIN baru.',
        };
      }

      // Verifikasi Hash
      const isValid = verifyPinHash(cleanPin, otpHash);

      if (!isValid) {
        const nextAttempts = currentAttempts + 1;
        const isLockedOut = nextAttempts >= MAX_FAILED_ATTEMPTS;

        // Jika mencapai 3x gagal, segera hancurkan hash PIN dan waktu kadaluarsa
        await adminClient
          .from('voters_whitelist')
          .update({
            otp_attempts: nextAttempts,
            otp_hash: isLockedOut ? null : otpHash,
            otp_expires_at: isLockedOut ? null : otpExpiresAt,
          })
          .eq('id', voter.id);

        const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - nextAttempts);
        return {
          success: false,
          code: isLockedOut ? 'MAX_ATTEMPTS_EXCEEDED' : 'INVALID_PIN',
          remainingAttempts: remaining,
          error: remaining > 0
            ? `Kode PIN salah. Sisa kesempatan: ${remaining} kali.`
            : 'Kode PIN salah. Batas percobaan (3x) telah habis. Kode PIN telah dibatalkan demi keamanan. Silakan minta kode baru.',
        };
      }

      // Sukses: Bersihkan OTP state
      await adminClient
        .from('voters_whitelist')
        .update({
          otp_hash: null,
          otp_expires_at: null,
          otp_attempts: 0,
        })
        .eq('id', voter.id);

      const adminMatch = findAdminByEmail(voter.email);
      return {
        success: true,
        voter: {
          id: voter.id,
          email: voter.email,
          name: voter.name,
          nim: voter.nim,
          role: adminMatch ? adminMatch.role : 'voter',
          isDptVerified: true,
          hasVoted: voter.has_voted,
          generation: voter.generation,
        },
      };
    } catch (err) {
      console.error('[OtpService] Exception saat verify OTP:', err);
    }
  }

  // Fallback Dev Mode (In-Memory + Disk Sync)
  const devMockStore = getDevMockStore();
  let voterState: InMemoOtpState | undefined;
  const dptVoter = findVoterByIdentifier(cleanId);
  if (dptVoter) {
    if (!devMockStore.has(dptVoter.nim)) {
      devMockStore.set(dptVoter.nim, {
        nim: dptVoter.nim,
        name: dptVoter.name,
        email: dptVoter.email,
        generation: dptVoter.generation,
        hasVoted: dptVoter.has_voted,
        role: dptVoter.role || (isRootSuperadminEmail(dptVoter.email) ? 'super_admin' : 'voter'),
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpLastSentAt: null,
      });
    }
    voterState = devMockStore.get(dptVoter.nim);
    if (voterState) {
      voterState.hasVoted = dptVoter.has_voted;
      voterState.name = dptVoter.name;
      voterState.email = dptVoter.email;
      voterState.generation = dptVoter.generation;
      if (dptVoter.role) voterState.role = dptVoter.role;
      if (isRootSuperadminEmail(dptVoter.email)) voterState.role = 'super_admin';
    }
  } else {
    for (const v of devMockStore.values()) {
      if (isEmail ? v.email.toLowerCase() === cleanId : v.nim === cleanId) {
        voterState = v;
        break;
      }
    }
  }

  // Cek apakah pengakses merupakan administrator terdaftar
  const dynamicAdmin = findAdminByEmail(cleanId) || (dptVoter ? findAdminByEmail(dptVoter.email) : null);
  if (voterState && dynamicAdmin) {
    voterState.role = dynamicAdmin.role;
  } else if (!voterState && dynamicAdmin) {
    const adminNim = dynamicAdmin.nim || '999999999999';
    if (!devMockStore.has(adminNim)) {
      devMockStore.set(adminNim, {
        nim: adminNim,
        name: dynamicAdmin.name,
        email: dynamicAdmin.email,
        generation: 2026,
        hasVoted: false,
        role: dynamicAdmin.role,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpLastSentAt: null,
      });
    }
    voterState = devMockStore.get(adminNim);
  }

  if (!voterState) {
    return {
      success: false,
      code: 'NIM_NOT_IN_DPT',
      error: 'Data mahasiswa tidak ditemukan di DPT.',
    };
  }

  if (voterState.hasVoted) {
    return {
      success: false,
      code: 'ALREADY_VOTED',
      error: 'Hak suara kamu telah digunakan sebelumnya.',
    };
  }

  if (!voterState.otpHash || !voterState.otpExpiresAt) {
    return {
      success: false,
      code: 'NO_OTP_ACTIVE',
      error: 'Tidak ada kode PIN aktif. Silakan minta kode baru.',
    };
  }

  if (now > voterState.otpExpiresAt) {
    return {
      success: false,
      code: 'OTP_EXPIRED',
      error: 'Kode PIN telah kedaluwarsa (10 menit). Silakan minta kode baru.',
    };
  }

  if (voterState.otpAttempts >= MAX_FAILED_ATTEMPTS) {
    return {
      success: false,
      code: 'MAX_ATTEMPTS_EXCEEDED',
      error: 'Batas percobaan salah terlampaui. Silakan minta kode PIN baru.',
    };
  }

  const isValid = verifyPinHash(cleanPin, voterState.otpHash);

  if (!isValid) {
    voterState.otpAttempts += 1;
    const isLockedOut = voterState.otpAttempts >= MAX_FAILED_ATTEMPTS;
    if (isLockedOut) {
      voterState.otpHash = null;
      voterState.otpExpiresAt = null;
    }
    saveDevMockStore();
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - voterState.otpAttempts);
    return {
      success: false,
      code: isLockedOut ? 'MAX_ATTEMPTS_EXCEEDED' : 'INVALID_PIN',
      remainingAttempts: remaining,
      error: remaining > 0
        ? `Kode PIN salah. Sisa kesempatan: ${remaining} kali.`
        : 'Kode PIN salah. Batas percobaan (3x) telah habis. Kode PIN telah dibatalkan demi keamanan. Silakan minta kode baru.',
    };
  }

  // Sukses dev mode
  voterState.otpHash = null;
  voterState.otpExpiresAt = null;
  voterState.otpAttempts = 0;
  saveDevMockStore();

  return {
    success: true,
    voter: {
      id: `dev-${voterState.nim}`,
      email: voterState.email,
      name: voterState.name,
      nim: voterState.nim,
      role: voterState.role || (isRootSuperadminEmail(voterState.email) ? 'super_admin' : 'voter'),
      isDptVerified: true,
      hasVoted: voterState.hasVoted,
      generation: voterState.generation,
    },
  };
}
