import crypto from 'crypto';
import { isProductionEnvironment } from '../security/env.ts';

// 32 karakter alfanumerik tanpa karakter ambigu (tanpa 0, O, 1, I, L)
// Memberikan 5 bit entropi per karakter: 32^8 = ~1,1 triliun kombinasi acak.
const PASSWORD_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const PASSWORD_LENGTH = 8;

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit penguncian jika 5x gagal berturut-turut

/**
 * Mengambil salt rahasia aplikasi untuk memperkuat hashing kata sandi pemilih.
 */
export function getAuthSecretSalt(): string {
  if (process.env.OTP_SECRET_SALT) {
    return process.env.OTP_SECRET_SALT;
  }
  if (isProductionEnvironment()) {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 32) {
      throw new Error(
        'FATAL SECURITY ERROR: OTP_SECRET_SALT or valid SESSION_SECRET (32+ chars) is required in production.'
      );
    }
    return `voter-pwd-salt:${sessionSecret}`;
  }
  return 'hmif-pemira-voter-password-salt-2026';
}

/**
 * Membersihkan format input kata sandi (hapus spasi, tanda strip, dan ubah ke huruf kapital).
 */
export function normalizePassword(rawInput: string): string {
  return rawInput
    .trim()
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

/**
 * Menghasilkan Kata Sandi Pemilih Unik 8-karakter berformat "XXXX-XXXX"
 * menggunakan Cryptographically Secure Pseudorandom Number Generator (CSPRNG).
 */
export function generateVoterPassword(): { rawPassword: string; formattedPassword: string } {
  let raw = '';
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, PASSWORD_CHARSET.length);
    raw += PASSWORD_CHARSET[randomIndex];
  }

  // Format dengan pemisah strip di tengah untuk kenyamanan membaca di ponsel: K97M-2P4Q
  const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return {
    rawPassword: raw,
    formattedPassword: formatted,
  };
}

/**
 * Menghasilkan hash SHA-256 tersalt satu arah untuk kata sandi pemilih.
 */
export function hashVoterPassword(password: string): string {
  const normalized = normalizePassword(password);
  const salt = getAuthSecretSalt();
  return crypto
    .createHash('sha256')
    .update(`${normalized}:${salt}`)
    .digest('hex');
}

/**
 * Memverifikasi kata sandi input dengan hash yang tersimpan secara timing-safe.
 */
export function verifyVoterPassword(inputPassword: string, storedHash: string): boolean {
  if (!inputPassword || !storedHash) return false;

  const computedHash = hashVoterPassword(inputPassword);
  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Memeriksa apakah akun sedang dalam status terkunci akibat melebihi batas percobaan gagal.
 */
export function checkAccountLockout(
  attempts: number,
  lockedUntil: Date | string | null
): { isLocked: boolean; remainingMinutes: number } {
  if (!lockedUntil) {
    return { isLocked: false, remainingMinutes: 0 };
  }

  const lockTime = new Date(lockedUntil).getTime();
  const now = Date.now();

  if (now < lockTime) {
    const remainingMs = lockTime - now;
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
    return { isLocked: true, remainingMinutes };
  }

  return { isLocked: false, remainingMinutes: 0 };
}
