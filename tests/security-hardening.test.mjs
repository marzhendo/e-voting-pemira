import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { isProductionEnvironment, isDevFallbackAllowed } from '../lib/security/env.ts';
import { SlidingWindowRateLimiter } from '../lib/security/rate-limit.ts';
import { validateFileMagicBytes } from '../lib/security/upload-validation.ts';
import { escapeCsvCell } from '../lib/utils/csv.ts';
import { verifyAdminAccess } from '../lib/rbac/permissions.ts';

test('Security Hardening Verification Suite', async (t) => {
  await t.test('1. Environment resolver detects production via either NODE_ENV or APP_ENV', () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origAppEnv = process.env.APP_ENV;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.APP_ENV;
      assert.strictEqual(isProductionEnvironment(), true);
      assert.strictEqual(isDevFallbackAllowed(false), false);

      process.env.NODE_ENV = 'development';
      process.env.APP_ENV = 'production';
      assert.strictEqual(isProductionEnvironment(), true);
      assert.strictEqual(isDevFallbackAllowed(false), false);

      process.env.NODE_ENV = 'development';
      process.env.APP_ENV = 'development';
      assert.strictEqual(isProductionEnvironment(), false);
      assert.strictEqual(isDevFallbackAllowed(false), true);
      assert.strictEqual(isDevFallbackAllowed(true), false, 'Dev fallback must stay disabled when Supabase is configured');
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      if (origAppEnv === undefined) delete process.env.APP_ENV;
      else process.env.APP_ENV = origAppEnv;
    }
  });

  await t.test('2. SlidingWindowRateLimiter blocks requests exceeding IP quota and resets after window', () => {
    const limiter = new SlidingWindowRateLimiter(3, 10_000);
    const t0 = 1_000_000;

    assert.strictEqual(limiter.consume('ip:1.2.3.4', t0).allowed, true);
    assert.strictEqual(limiter.consume('ip:1.2.3.4', t0 + 100).allowed, true);
    assert.strictEqual(limiter.consume('ip:1.2.3.4', t0 + 200).allowed, true);

    const blocked = limiter.consume('ip:1.2.3.4', t0 + 300);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSeconds >= 1);

    // Different IP stays unaffected
    assert.strictEqual(limiter.consume('ip:5.6.7.8', t0 + 300).allowed, true);

    // After sliding window passes, quota recovers
    assert.strictEqual(limiter.consume('ip:1.2.3.4', t0 + 10_001).allowed, true);
  });

  await t.test('3. File Upload Magic Bytes validation blocks MIME-spoofed payloads', () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validWebp = Buffer.from('RIFF\x24\x00\x00\x00WEBPVP8 ', 'latin1');
    const validPdf = Buffer.from('%PDF-1.7\n1 0 obj\n', 'utf8');
    const fakePngSvg = Buffer.from('<svg onload=alert(1)></svg>', 'utf8');
    const fakePdfHtml = Buffer.from('<html><script>alert(1)</script></html>', 'utf8');

    assert.deepStrictEqual(validateFileMagicBytes(validPng, 'image/png'), { valid: true, extension: '.png' });
    assert.deepStrictEqual(validateFileMagicBytes(validJpeg, 'image/jpeg'), { valid: true, extension: '.jpg' });
    assert.deepStrictEqual(validateFileMagicBytes(validWebp, 'image/webp'), { valid: true, extension: '.webp' });
    assert.deepStrictEqual(validateFileMagicBytes(validPdf, 'application/pdf'), { valid: true, extension: '.pdf' });

    assert.strictEqual(validateFileMagicBytes(fakePngSvg, 'image/png').valid, false);
    assert.strictEqual(validateFileMagicBytes(fakePdfHtml, 'application/pdf').valid, false);
    assert.strictEqual(validateFileMagicBytes(validPng, 'image/jpeg').valid, false);
  });

  await t.test('4. CSV Formula Injection sanitization prefixes trigger characters', () => {
    assert.strictEqual(escapeCsvCell('=CMD("calc")'), `"'=CMD(""calc"")"`);
    assert.strictEqual(escapeCsvCell('+1+1'), `"'+1+1"`);
    assert.strictEqual(escapeCsvCell('-2+3'), `"'-2+3"`);
    assert.strictEqual(escapeCsvCell('@SUM(A1:A2)'), `"'@SUM(A1:A2)"`);
    assert.strictEqual(escapeCsvCell('Normal Candidate "Name"'), '"Normal Candidate ""Name"""');
    assert.strictEqual(escapeCsvCell(null), '""');
    assert.strictEqual(escapeCsvCell(1250), '"1250"');
  });

  await t.test('5. RBAC denies manage_candidates permission to read-only auditor role', () => {
    const auditorUser = {
      id: 'auditor-1',
      email: 'auditor@student.telkomuniversity.ac.id',
      name: 'Auditor Independen',
      role: 'auditor',
      isDptVerified: false,
      hasVoted: false,
    };

    const kprUser = {
      ...auditorUser,
      id: 'kpr-1',
      role: 'kpr_admin',
    };

    const auditorCheck = verifyAdminAccess(auditorUser, 'manage_candidates');
    assert.strictEqual(auditorCheck.authorized, false);
    assert.strictEqual(auditorCheck.status, 403);

    const kprCheck = verifyAdminAccess(kprUser, 'manage_candidates');
    assert.strictEqual(kprCheck.authorized, true);
  });

  await t.test('6. Constant-time SHA-256 hash comparison rejects arbitrary 64-hex hashes', () => {
    const validHash = crypto.createHash('sha256').update('real-payload').digest('hex').toUpperCase();
    const fakeHexHash = '0'.repeat(64);

    const isExactValid = crypto.timingSafeEqual(Buffer.from(validHash, 'utf8'), Buffer.from(validHash, 'utf8'));
    const isExactFake = crypto.timingSafeEqual(Buffer.from(fakeHexHash, 'utf8'), Buffer.from(validHash, 'utf8'));

    assert.strictEqual(isExactValid, true);
    assert.strictEqual(isExactFake, false);
  });
});
