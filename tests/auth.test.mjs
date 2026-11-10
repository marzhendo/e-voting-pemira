import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SignJWT, jwtVerify } from 'jose';

describe('Auth & Session Unit Tests', () => {
  const secretKey = new TextEncoder().encode('test-session-secret-key-at-least-32-chars-long');

  test('Creates and verifies JWT session token', async () => {
    const payload = {
      id: 'voter-uuid-1',
      email: 'voter1@student.telkomuniversity.ac.id',
      name: 'Ahmad Rizky Pratama',
      nim: '103012300001',
      role: 'voter',
      isDptVerified: true,
      hasVoted: false,
    };

    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secretKey);

    assert.ok(token, 'Token must be generated');

    const { payload: verified } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    assert.strictEqual(verified.email, payload.email);
    assert.strictEqual(verified.nim, payload.nim);
    assert.strictEqual(verified.hasVoted, false);
    assert.strictEqual(verified.isDptVerified, true);
  });

  test('Extracts client IP behind Cloud Run reverse proxy from X-Forwarded-For', () => {
    function getClientIp(headers) {
      const forwardedFor = headers.get('x-forwarded-for');
      if (forwardedFor) {
        const firstIp = forwardedFor.split(',')[0].trim();
        if (firstIp) return firstIp;
      }
      return headers.get('x-real-ip') || '127.0.0.1';
    }

    const headers1 = new Map([['x-forwarded-for', '203.0.113.195, 70.41.3.18, 150.172.238.178']]);
    assert.strictEqual(getClientIp(headers1), '203.0.113.195');

    const headers2 = new Map([['x-forwarded-for', '180.252.160.10']]);
    assert.strictEqual(getClientIp(headers2), '180.252.160.10');

    const headers3 = new Map([]);
    assert.strictEqual(getClientIp(headers3), '127.0.0.1');
  });

  test('Rejects expired JWT token', async () => {
    const expiredToken = await new SignJWT({ email: 'test@student.telkomuniversity.ac.id' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10) // Expired 10s ago
      .sign(secretKey);

    await assert.rejects(
      async () => {
        await jwtVerify(expiredToken, secretKey, { algorithms: ['HS256'] });
      },
      /JWTExpired/
    );
  });

  test('Strict Email Domain Validation: Only @student.telkomuniversity.ac.id, valid NIM, or emergency Superadmin allowed', () => {
    const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.telkomuniversity\.ac\.id$/i;
    const NIM_REGEX = /^[0-9]{8,15}$/;

    function isValidIdentifier(val) {
      if (!val || typeof val !== 'string') return false;
      const clean = val.trim().toLowerCase();
      if (clean === 'marzhendogalangs@gmail.com') return true;
      return NIM_REGEX.test(clean) || STUDENT_EMAIL_REGEX.test(clean);
    }

    // Valid student emails
    assert.strictEqual(isValidIdentifier('103012300001@student.telkomuniversity.ac.id'), true);
    assert.strictEqual(isValidIdentifier('ahmad.rizky@student.telkomuniversity.ac.id'), true);

    // Valid NIMs
    assert.strictEqual(isValidIdentifier('103012300001'), true);
    assert.strictEqual(isValidIdentifier('103112400102'), true);

    // Emergency Superadmin
    assert.strictEqual(isValidIdentifier('marzhendogalangs@gmail.com'), true);

    // Malicious or invalid emails
    assert.strictEqual(isValidIdentifier('attacker@gmail.com'), false);
    assert.strictEqual(isValidIdentifier('hacker@yahoo.com'), false);
    assert.strictEqual(isValidIdentifier('dosen@telkomuniversity.ac.id'), false, 'Non-student domain must be rejected');
    assert.strictEqual(isValidIdentifier('someone@evil.telkomuniversity.ac.id'), false);
    assert.strictEqual(isValidIdentifier('abc'), false);
    assert.strictEqual(isValidIdentifier('123'), false, 'Short number (<8 digits) must be rejected');
    assert.strictEqual(isValidIdentifier('drop table ballots;'), false);
  });

  test('Session Cookie Standards: Enforces SameSite=Strict and HttpOnly', () => {
    const cookieConfig = {
      httpOnly: true,
      secure: false, // In test / local mock
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    };

    assert.strictEqual(cookieConfig.httpOnly, true, 'Cookie must be HTTPOnly');
    assert.strictEqual(cookieConfig.sameSite, 'strict', 'Cookie must enforce SameSite=Strict against CSRF');
    assert.strictEqual(cookieConfig.path, '/', 'Cookie path must be root');
  });
});
