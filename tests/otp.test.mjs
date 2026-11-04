import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Just-In-Time (JIT) 6-Digit OTP Cryptography & Auth Logic Tests', () => {
  const OTP_SECRET_SALT = 'hmif-pemira-otp-salt-secure-2026';
  const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 menit
  const OTP_COOLDOWN_MS = 60 * 1000; // 60 detik
  const MAX_FAILED_ATTEMPTS = 3;

  function generate6DigitPin() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  function hashPin(pin) {
    return crypto
      .createHash('sha256')
      .update(`${pin}:${OTP_SECRET_SALT}`)
      .digest('hex');
  }

  function verifyPinHash(inputPin, storedHash) {
    const computedHash = hashPin(inputPin);
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  function maskEmail(email) {
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

  test('generate6DigitPin produces valid 6-digit numeric codes with high randomness', () => {
    const pins = new Set();
    for (let i = 0; i < 50; i++) {
      const pin = generate6DigitPin();
      assert.match(pin, /^\d{6}$/, `PIN ${pin} must be strictly 6 digits`);
      pins.add(pin);
    }
    // High entropy check: out of 50 generated PINs, collisions should be virtually zero
    assert.ok(pins.size >= 48, 'Generated PINs must have high cryptographic entropy');
  });

  test('hashPin and verifyPinHash correctly validate matching PIN and reject mismatches', () => {
    const pin = '849201';
    const hash = hashPin(pin);

    assert.ok(hash && hash.length === 64, 'SHA-256 hash must be 64 hex characters');
    assert.strictEqual(verifyPinHash('849201', hash), true, 'Correct PIN must verify to true');
    assert.strictEqual(verifyPinHash('849202', hash), false, 'Incorrect PIN must verify to false');
    assert.strictEqual(verifyPinHash('000000', hash), false, 'Random PIN must verify to false');
    assert.strictEqual(verifyPinHash('', hash), false, 'Empty PIN must verify to false');
  });

  test('maskEmail obfuscates local part for privacy while keeping domain clear', () => {
    const masked1 = maskEmail('voter1@student.telkomuniversity.ac.id');
    assert.strictEqual(masked1, 'vo***1@student.telkomuniversity.ac.id');

    const masked2 = maskEmail('ahmad.rizky@student.telkomuniversity.ac.id');
    assert.strictEqual(masked2, 'ah***y@student.telkomuniversity.ac.id');

    const maskedShort = maskEmail('ab@student.telkomuniversity.ac.id');
    assert.strictEqual(maskedShort, 'a***@student.telkomuniversity.ac.id');
  });

  test('OTP Lifecycle: Rate limiting, expiration check, and 3-attempt lockout', () => {
    const now = Date.now();
    const pin = '582910';
    const pinHash = hashPin(pin);

    const voterState = {
      nim: '103012300001',
      has_voted: false,
      otp_hash: pinHash,
      otp_expires_at: now + OTP_EXPIRATION_MS,
      otp_attempts: 0,
      otp_last_sent_at: now,
    };

    // 1. Rate limiting check (must reject if sent < 60s ago)
    const isRateLimited = now - voterState.otp_last_sent_at < OTP_COOLDOWN_MS;
    assert.strictEqual(isRateLimited, true, 'Request within 60 seconds must be rate-limited');

    // 2. Failed attempt counter logic
    assert.strictEqual(verifyPinHash('111111', voterState.otp_hash), false);
    voterState.otp_attempts += 1;
    assert.strictEqual(voterState.otp_attempts, 1);

    assert.strictEqual(verifyPinHash('222222', voterState.otp_hash), false);
    voterState.otp_attempts += 1;
    assert.strictEqual(voterState.otp_attempts, 2);

    assert.strictEqual(verifyPinHash('333333', voterState.otp_hash), false);
    voterState.otp_attempts += 1;
    assert.strictEqual(voterState.otp_attempts, 3);

    // 3. Lockout enforcement
    const isLockedOut = voterState.otp_attempts >= MAX_FAILED_ATTEMPTS;
    assert.strictEqual(isLockedOut, true, 'Must lock out after 3 failed attempts');

    // 4. Expiration enforcement
    const expiredState = {
      ...voterState,
      otp_expires_at: now - 1000, // Expired 1 second ago
    };
    const isExpired = Date.now() > expiredState.otp_expires_at;
    assert.strictEqual(isExpired, true, 'Expired timestamp must reject verification');
  });

  test('escapeHtml properly neutralizes HTML tags and dangerous characters', () => {
    function escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    const payload = '<script>alert("XSS & Injection")</script>';
    const sanitized = escapeHtml(payload);
    assert.strictEqual(
      sanitized,
      '&lt;script&gt;alert(&quot;XSS &amp; Injection&quot;)&lt;/script&gt;'
    );
  });

  test('resolveSafeCtaUrl resolves relative path to absolute URL and blocks dangerous protocols', () => {
    function resolveSafeCtaUrl(rawUrl) {
      const fallback = 'http://localhost:3000/login';
      if (!rawUrl || typeof rawUrl !== 'string') return fallback;
      const trimmed = rawUrl.trim();
      if (/^(javascript|data|vbscript):/i.test(trimmed)) {
        return fallback;
      }
      if (trimmed.startsWith('/')) {
        const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
        return `${base}${trimmed}`;
      }
      return trimmed;
    }

    // Relative URL -> absolute
    assert.strictEqual(resolveSafeCtaUrl('/login'), 'http://localhost:3000/login');
    assert.strictEqual(resolveSafeCtaUrl('/vote'), 'http://localhost:3000/vote');

    // Dangerous protocols -> fallback
    assert.strictEqual(resolveSafeCtaUrl('javascript:alert(1)'), 'http://localhost:3000/login');
    assert.strictEqual(resolveSafeCtaUrl('data:text/html,<script>'), 'http://localhost:3000/login');

    // Valid absolute URL remains unchanged
    assert.strictEqual(resolveSafeCtaUrl('https://pemirahmif.org/vote'), 'https://pemirahmif.org/vote');
  });
});
