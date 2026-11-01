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
});
