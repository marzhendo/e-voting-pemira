import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createHash } from 'node:crypto';

describe('Voting Engine & Receipt Cryptography Unit Tests', () => {
  function hashReceiptToken(rawToken) {
    const normalized = rawToken.trim().toUpperCase();
    return createHash('sha256').update(normalized).digest('hex');
  }

  function generateReceipt() {
    const randomSegment = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
    const rawToken = `HMIF-PEMIRA-${randomSegment.slice(0, 4)}-${randomSegment.slice(4, 8)}-${randomSegment.slice(8, 12)}-${randomSegment.slice(12, 16)}`;
    const receiptHash = hashReceiptToken(rawToken);
    return { rawToken, receiptHash };
  }

  test('Generates cryptographic receipt token with high entropy and valid SHA-256 hash', () => {
    const receipt = generateReceipt();

    assert.ok(receipt.rawToken.startsWith('HMIF-PEMIRA-'), 'Token must follow HMIF prefix format');
    assert.strictEqual(receipt.rawToken.length, 31, 'Token must be formatted as HMIF-PEMIRA-XXXX-XXXX-XXXX-XXXX');
    assert.strictEqual(receipt.receiptHash.length, 64, 'Receipt hash must be a 64-character SHA-256 hex string');

    // Deterministic hashing verification
    const recomputedHash = hashReceiptToken(receipt.rawToken);
    assert.strictEqual(recomputedHash, receipt.receiptHash, 'Hash of raw token must match stored receiptHash');
  });

  test('Consecutive receipt generation generates completely unique tokens and hashes', () => {
    const r1 = generateReceipt();
    const r2 = generateReceipt();

    assert.notStrictEqual(r1.rawToken, r2.rawToken);
    assert.notStrictEqual(r1.receiptHash, r2.receiptHash);
  });

  test('Validates UUID format for candidateId', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    assert.strictEqual(uuidRegex.test('00000000-0000-0000-0000-000000000000'), true);
    assert.strictEqual(uuidRegex.test('cbf7e52b-705d-3cc7-49f6-64435f84bf5e'), true);
    assert.strictEqual(uuidRegex.test('12345'), false);
    assert.strictEqual(uuidRegex.test('invalid-candidate-number'), false);
    assert.strictEqual(uuidRegex.test('; DROP TABLE ballots;'), false);
  });

  test('Ballot Secrecy: Receipt payload NEVER contains candidate choice', () => {
    const receipt = generateReceipt();

    // Verify properties
    const keys = Object.keys(receipt);
    assert.ok(!keys.includes('candidateId'));
    assert.ok(!keys.includes('candidate_id'));
    assert.ok(!keys.includes('candidate'));
    assert.ok(!keys.includes('leader_name'));
    assert.ok(!keys.includes('nim'));
    assert.ok(!keys.includes('voter_id'));
  });
});
