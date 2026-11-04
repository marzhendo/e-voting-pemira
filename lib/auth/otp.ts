import crypto from 'crypto';
import { isSupabaseConfigured, createAdminClient } from '@/lib/supabase/admin';
import { smtpMailService } from '@/lib/mail/smtp-service';
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
  otpHash: string | null;
  otpExpiresAt: number | null;
  otpAttempts: number;
  otpLastSentAt: number | null;
}

// Dev mock in-memory store saat Supabase belum dikonfigurasi
const devMockStore = new Map<string, InMemoOtpState>([
  [
    '103012300001',
    {
      nim: '103012300001',
      name: 'Ahmad Rizky Pratama',
      email: 'voter1@student.telkomuniversity.ac.id',
      generation: 2023,
      hasVoted: false,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      otpLastSentAt: null,
    },
  ],
  [
    '103012300002',
    {
      nim: '103012300002',
      name: 'Budi Santoso',
      email: 'voter2@student.telkomuniversity.ac.id',
      generation: 2023,
      hasVoted: true,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      otpLastSentAt: null,
    },
  ],
  [
    '103012400003',
    {
      nim: '103012400003',
      name: 'Citra Dewi Lestari',
      email: 'voter3@student.telkomuniversity.ac.id',
      generation: 2024,
      hasVoted: false,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      otpLastSentAt: null,
    },
  ],
]);

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

  // 1. Cek Mode Live Supabase atau Dev In-Memory Fallback
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createAdminClient();
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
          error: 'NIM atau email Anda belum terdaftar dalam Daftar Pemilih Tetap (DPT) Pemira HMIF.',
        };
      }

      if (voter.has_voted) {
        return {
          success: false,
          code: 'ALREADY_VOTED',
          error: 'Hak suara Anda telah digunakan pada pemilihan ini.',
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

      // Generate & Simpan Hash PIN Baru
      const pin = generate6DigitPin();
      const pinHash = hashPin(pin);
      const expiresAt = new Date(now + OTP_EXPIRATION_MS).toISOString();

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

  // Fallback Dev Mode (In-Memory)
  let voterState: InMemoOtpState | undefined;
  for (const v of devMockStore.values()) {
    if (isEmail ? v.email.toLowerCase() === cleanId : v.nim === cleanId) {
      voterState = v;
      break;
    }
  }

  if (!voterState) {
    return {
      success: false,
      code: 'NIM_NOT_IN_DPT',
      error: 'NIM atau email Anda belum terdaftar dalam Daftar Pemilih Tetap (DPT) Pemira HMIF.',
    };
  }

  if (voterState.hasVoted) {
    return {
      success: false,
      code: 'ALREADY_VOTED',
      error: 'Hak suara Anda telah digunakan pada pemilihan ini.',
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
      const adminClient = createAdminClient();
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
          error: 'Hak suara Anda telah digunakan sebelumnya.',
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
        await adminClient
          .from('voters_whitelist')
          .update({
            otp_attempts: nextAttempts,
          })
          .eq('id', voter.id);

        const remaining = MAX_FAILED_ATTEMPTS - nextAttempts;
        return {
          success: false,
          code: 'INVALID_PIN',
          remainingAttempts: Math.max(0, remaining),
          error: remaining > 0
            ? `Kode PIN salah. Sisa kesempatan: ${remaining} kali.`
            : 'Kode PIN salah. Batas percobaan habis, silakan minta kode baru.',
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

      return {
        success: true,
        voter: {
          id: voter.id,
          email: voter.email,
          name: voter.name,
          nim: voter.nim,
          role: 'voter',
          isDptVerified: true,
          hasVoted: voter.has_voted,
          generation: voter.generation,
        },
      };
    } catch (err) {
      console.error('[OtpService] Exception saat verify OTP:', err);
    }
  }

  // Fallback Dev Mode (In-Memory)
  let voterState: InMemoOtpState | undefined;
  for (const v of devMockStore.values()) {
    if (isEmail ? v.email.toLowerCase() === cleanId : v.nim === cleanId) {
      voterState = v;
      break;
    }
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
      error: 'Hak suara Anda telah digunakan sebelumnya.',
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
    const remaining = MAX_FAILED_ATTEMPTS - voterState.otpAttempts;
    return {
      success: false,
      code: 'INVALID_PIN',
      remainingAttempts: Math.max(0, remaining),
      error: remaining > 0
        ? `Kode PIN salah. Sisa kesempatan: ${remaining} kali.`
        : 'Kode PIN salah. Batas percobaan habis, silakan minta kode baru.',
    };
  }

  // Sukses dev mode
  voterState.otpHash = null;
  voterState.otpExpiresAt = null;
  voterState.otpAttempts = 0;

  return {
    success: true,
    voter: {
      id: `dev-${voterState.nim}`,
      email: voterState.email,
      name: voterState.name,
      nim: voterState.nim,
      role: 'voter',
      isDptVerified: true,
      hasVoted: false,
      generation: voterState.generation,
    },
  };
}
