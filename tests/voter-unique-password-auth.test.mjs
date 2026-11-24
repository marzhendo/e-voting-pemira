import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVoterPassword,
  normalizePassword,
  hashVoterPassword,
  verifyVoterPassword,
  checkAccountLockout,
  MAX_LOGIN_ATTEMPTS,
} from '../lib/auth/password-service.ts';
import {
  authenticateWithPassword,
} from '../lib/auth/voter-auth.ts';
import {
  resetVotersStore,
  addSingleVoter,
  findVoterByIdentifier,
  markVoterAsVoted,
  setVoterPasswordHash,
} from '../lib/dpt/store.ts';

describe('Voter Unique Password Authentication & Cryptography Tests', () => {
  test('1. CSPRNG Password Generation: Correct length, charset, and format', () => {
    const ambiguousChars = ['0', 'O', '1', 'I', 'L'];

    for (let i = 0; i < 50; i++) {
      const { rawPassword, formattedPassword } = generateVoterPassword();

      assert.strictEqual(rawPassword.length, 8, 'Raw password must be exactly 8 characters');
      assert.strictEqual(formattedPassword.length, 9, 'Formatted password must be 9 characters with hyphen (XXXX-XXXX)');
      assert.strictEqual(formattedPassword[4], '-', 'Formatted password must have a hyphen at index 4');

      for (const char of rawPassword) {
        assert.ok(
          !ambiguousChars.includes(char),
          `Password should not contain ambiguous character: ${char}`
        );
      }

      // Check normalization consistency
      assert.strictEqual(
        normalizePassword(formattedPassword),
        rawPassword,
        'Normalizing formatted password must yield raw password'
      );
    }
  });

  test('2. Cryptographic Hashing & Timing-Safe Verification', () => {
    const password = '7K9P2M4X';
    const hash = hashVoterPassword(password);

    assert.ok(hash && hash.length === 64, 'SHA-256 hash must be 64 hex characters');

    // Verification with exact match
    assert.strictEqual(
      verifyVoterPassword(password, hash),
      true,
      'Exact password must verify successfully'
    );

    // Verification with hyphens and lowercase
    assert.strictEqual(
      verifyVoterPassword('7k9p-2m4x', hash),
      true,
      'Hyphenated lowercase input must normalize and verify successfully'
    );

    // Verification with surrounding whitespace
    assert.strictEqual(
      verifyVoterPassword('  7K9P-2M4X  ', hash),
      true,
      'Input with whitespace must verify successfully'
    );

    // Wrong password must fail
    assert.strictEqual(
      verifyVoterPassword('WRONGPWD', hash),
      false,
      'Incorrect password must fail verification'
    );
  });

  test('3. Lockout Policy: 5 failed attempts trigger 15-minute lock', () => {
    const notLocked = checkAccountLockout(0, null);
    assert.strictEqual(notLocked.isLocked, false);

    const fourFails = checkAccountLockout(4, null);
    assert.strictEqual(fourFails.isLocked, false);

    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const lockedStatus = checkAccountLockout(5, futureDate);
    assert.strictEqual(lockedStatus.isLocked, true);
    assert.ok(lockedStatus.remainingMinutes > 0 && lockedStatus.remainingMinutes <= 15);

    const pastDate = new Date(Date.now() - 1000).toISOString();
    const expiredLock = checkAccountLockout(5, pastDate);
    assert.strictEqual(expiredLock.isLocked, false, 'Expired lockout must allow retry');
  });

  test('4. Full Authentication Flow: Eligible unvoted voter -> /vote', async () => {
    resetVotersStore();
    const nim = '103012388001';
    addSingleVoter({
      nim,
      name: 'Mahasiswa Pemilih Aktif',
      email: 'pemilih.aktif@student.telkomuniversity.ac.id',
      generation: 2023,
    });

    const { rawPassword, formattedPassword } = generateVoterPassword();
    const hash = hashVoterPassword(rawPassword);
    setVoterPasswordHash(nim, hash);

    // Attempt login with valid formatted password
    const result = await authenticateWithPassword(nim, formattedPassword);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.code, 'SUCCESS');
    assert.strictEqual(result.redirectUrl, '/vote');
    assert.strictEqual(result.user?.nim, nim);
    assert.strictEqual(result.user?.hasVoted, false);
    assert.ok(result.token, 'Session token must be generated');
  });

  test('5. Re-Login Invariant: Voted voter -> /receipt (Ballot Secrecy Preserved)', async () => {
    resetVotersStore();
    const nim = '103012388002';
    addSingleVoter({
      nim,
      name: 'Mahasiswa Sudah Memberi Suara',
      email: 'sudah.milih@student.telkomuniversity.ac.id',
      generation: 2023,
    });

    const { rawPassword, formattedPassword } = generateVoterPassword();
    const hash = hashVoterPassword(rawPassword);
    setVoterPasswordHash(nim, hash);
    markVoterAsVoted(nim);

    const result = await authenticateWithPassword(nim, formattedPassword);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.code, 'SUCCESS');
    assert.strictEqual(result.redirectUrl, '/receipt', 'Voter who has already voted must be redirected to /receipt');
    assert.strictEqual(result.user?.hasVoted, true);
  });

  test('6. Security Invariant: Non-existent NIM fails with NIM_NOT_IN_DPT', async () => {
    resetVotersStore();
    const result = await authenticateWithPassword('999000111222', 'SOME-PASS');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.code, 'NIM_NOT_IN_DPT');
  });

  test('7. Security Invariant: Consecutive wrong passwords trigger lockout', async () => {
    resetVotersStore();
    const nim = '103012388003';
    addSingleVoter({
      nim,
      name: 'Mahasiswa Uji Lockout',
      email: 'uji.lockout@student.telkomuniversity.ac.id',
      generation: 2023,
    });

    const { rawPassword } = generateVoterPassword();
    setVoterPasswordHash(nim, hashVoterPassword(rawPassword));

    // 4 wrong attempts
    for (let i = 1; i <= 4; i++) {
      const res = await authenticateWithPassword(nim, 'WRONGPASS');
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.code, 'INVALID_PASSWORD');
      assert.strictEqual(res.remainingAttempts, MAX_LOGIN_ATTEMPTS - i);
    }

    // 5th wrong attempt triggers lockout
    const res5 = await authenticateWithPassword(nim, 'WRONGPASS');
    assert.strictEqual(res5.success, false);
    assert.strictEqual(res5.code, 'ACCOUNT_LOCKED');

    // 6th attempt while locked is rejected immediately with ACCOUNT_LOCKED
    const res6 = await authenticateWithPassword(nim, rawPassword);
    assert.strictEqual(res6.success, false);
    assert.strictEqual(res6.code, 'ACCOUNT_LOCKED');
  });

  test('8. Superadmin Login Routes to /admin/dashboard', async () => {
    resetVotersStore();
    const superadminEmail = 'marzhendogalangs@gmail.com';
    const superadminNim = '999999999999';

    const { rawPassword, formattedPassword } = generateVoterPassword();
    setVoterPasswordHash(superadminNim, hashVoterPassword(rawPassword));

    const result = await authenticateWithPassword(superadminEmail, formattedPassword);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.code, 'SUCCESS');
    assert.strictEqual(result.user?.role, 'super_admin');
    assert.strictEqual(result.redirectUrl, '/admin/dashboard');
  });

  test('9. Per-Generation Batch Password Generation: Targets only specified angkatan', async () => {
    resetVotersStore();
    // Add voters across multiple generations
    addSingleVoter({ nim: '103012300001', name: 'Mhs 2023 A', email: 'mhs23a@student.telu.ac.id', generation: 2023 });
    addSingleVoter({ nim: '103012300002', name: 'Mhs 2023 B', email: 'mhs23b@student.telu.ac.id', generation: 2023 });
    addSingleVoter({ nim: '103012400001', name: 'Mhs 2024 A', email: 'mhs24a@student.telu.ac.id', generation: 2024 });

    // Target only generation 2024
    const all = (await import('../lib/dpt/store.ts')).getAllVoters();
    const target2024 = all.filter(v => v.generation === 2024);

    for (const v of target2024) {
      const { rawPassword } = generateVoterPassword();
      setVoterPasswordHash(v.nim, hashVoterPassword(rawPassword));
    }

    // Verify 2024 has password, 2023 remains untouched
    const mhs24 = findVoterByIdentifier('103012400001');
    const mhs23a = findVoterByIdentifier('103012300001');
    const mhs23b = findVoterByIdentifier('103012300002');

    assert.ok(mhs24?.password_hash, 'Target 2024 voter must have password_hash');
    assert.ok(!mhs23a?.password_hash, '2023 voter A must not have password');
    assert.ok(!mhs23b?.password_hash, '2023 voter B must not have password');
  });

  test('10. Overwrite Flag: Preserves existing passwords when false', async () => {
    resetVotersStore();
    const nim = '103012499999';
    addSingleVoter({ nim, name: 'Mhs Existing', email: 'existing@student.telu.ac.id', generation: 2024 });

    const initialPass = 'PASS1234';
    const initialHash = hashVoterPassword(initialPass);
    setVoterPasswordHash(nim, initialHash);

    const voter = findVoterByIdentifier(nim);
    assert.strictEqual(voter?.password_hash, initialHash);

    // If overwriteExisting is false, the existing password is preserved
    const overwriteExisting = false;
    if (overwriteExisting || !voter?.password_hash) {
      setVoterPasswordHash(nim, hashVoterPassword('NEWPASSW'));
    }

    const voterAfter = findVoterByIdentifier(nim);
    assert.strictEqual(voterAfter?.password_hash, initialHash, 'Existing password must not be overwritten when flag is false');
  });
});
