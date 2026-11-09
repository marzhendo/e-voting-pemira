import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllVoters,
  addSingleVoter,
  deleteSingleVoter,
  deleteVotersBatch,
  resetAllVoters,
  resetVotersStore,
  markVoterAsVoted,
} from '../lib/dpt/store.ts';
import {
  getAllBallots,
  castBallotAtomicDev,
  resetBallotsStore,
} from '../lib/ballots/store.ts';

test.describe('Superadmin DPT Management & Ballot Secrecy Invariants', () => {
  test.beforeEach(() => {
    resetVotersStore();
    resetBallotsStore();
  });

  test.after(() => {
    resetVotersStore();
    resetBallotsStore();
  });

  test('1. deleteSingleVoter deletes target voter and rejects deleting primary superadmin', () => {
    // 1a. Add a test voter
    const testNim = '103012999001';
    const addRes = addSingleVoter({
      nim: testNim,
      name: 'Mahasiswa Uji Hapus',
      email: 'uji.hapus@student.telkomuniversity.ac.id',
      generation: 2024,
    });
    assert.strictEqual(addRes.success, true);
    assert.ok(addRes.voter && addRes.voter.id);

    // 1b. Delete the newly created voter
    const delRes = deleteSingleVoter(addRes.voter.id);
    assert.strictEqual(delRes.success, true);
    assert.strictEqual(delRes.voter && delRes.voter.nim, testNim);

    // Ensure they no longer exist in DPT
    const votersAfter = getAllVoters();
    const found = votersAfter.find((v) => v.nim === testNim);
    assert.strictEqual(found, undefined, 'Deleted voter should not exist in DPT store');

    // 1c. Attempt to delete non-existent voter
    const notFoundRes = deleteSingleVoter('non-existent-id-999');
    assert.strictEqual(notFoundRes.success, false);
    assert.match(notFoundRes.error || '', /tidak ditemukan/i);

    // 1d. Protection: Primary Superadmin must never be deletable
    const superAdmin = votersAfter.find(
      (v) => v.email && v.email.toLowerCase() === 'marzhendogalangs@gmail.com'
    );
    if (superAdmin) {
      const saDelRes = deleteSingleVoter(superAdmin.id);
      assert.strictEqual(saDelRes.success, false);
      assert.match(saDelRes.error || '', /Superadmin utama tidak dapat dihapus/i);

      // Verify superadmin still exists
      const votersCheck = getAllVoters();
      const saCheck = votersCheck.find(
        (v) => v.email && v.email.toLowerCase() === 'marzhendogalangs@gmail.com'
      );
      assert.ok(saCheck, 'Primary superadmin must remain present in DPT');
    }
  });

  test('2. deleteVotersBatch deletes multiple selective voters while protecting superadmin', () => {
    const voter1 = addSingleVoter({
      nim: '103012999011',
      name: 'Batch User 1',
      email: 'batch1@student.telkomuniversity.ac.id',
      generation: 2023,
    });
    const voter2 = addSingleVoter({
      nim: '103012999012',
      name: 'Batch User 2',
      email: 'batch2@student.telkomuniversity.ac.id',
      generation: 2023,
    });
    const voter3 = addSingleVoter({
      nim: '103012999013',
      name: 'Batch User 3',
      email: 'batch3@student.telkomuniversity.ac.id',
      generation: 2023,
    });

    assert.ok(voter1.voter && voter2.voter && voter3.voter);

    // Get superadmin ID if present
    const all = getAllVoters();
    const sa = all.find((v) => v.email && v.email.toLowerCase() === 'marzhendogalangs@gmail.com');

    // Batch delete voter 1, voter 2, and superadmin (if present)
    const targets = [voter1.voter.id, voter2.voter.id];
    if (sa) targets.push(sa.id);

    const batchRes = deleteVotersBatch(targets);
    assert.strictEqual(batchRes.success, true);
    // Deleted count should be 2 (superadmin is protected and skipped)
    assert.strictEqual(batchRes.deletedCount, 2);

    const remaining = getAllVoters();
    assert.strictEqual(remaining.some((v) => v.id === voter1.voter.id), false);
    assert.strictEqual(remaining.some((v) => v.id === voter2.voter.id), false);
    assert.strictEqual(remaining.some((v) => v.id === voter3.voter.id), true, 'Voter 3 should remain');
    if (sa) {
      assert.strictEqual(remaining.some((v) => v.email === 'marzhendogalangs@gmail.com'), true);
    }
  });

  test('3. resetAllVoters handles reset_to_default, clear_all, and reset_vote_status properly', () => {
    // 3a. Mode: reset_vote_status
    // Mark a voter as voted
    const firstVoter = getAllVoters()[0];
    assert.ok(firstVoter);
    markVoterAsVoted(firstVoter.nim, 'mock_receipt_hash_123');

    const votersBeforeReset = getAllVoters();
    const votedCountBefore = votersBeforeReset.filter((v) => v.has_voted).length;
    assert.ok(votedCountBefore >= 1);

    const resetStatusRes = resetAllVoters('reset_vote_status');
    assert.strictEqual(resetStatusRes.success, true);

    const votersAfterStatusReset = getAllVoters();
    const votedCountAfter = votersAfterStatusReset.filter((v) => v.has_voted).length;
    assert.strictEqual(votedCountAfter, 0, 'All voters must have has_voted = false');
    assert.strictEqual(
      votersAfterStatusReset.every((v) => !v.receipt_hash && !v.voted_at),
      true,
      'Receipt hashes and voted_at timestamps must be cleared'
    );

    // 3b. Mode: clear_all
    const clearRes = resetAllVoters('clear_all');
    assert.strictEqual(clearRes.success, true);
    const votersAfterClear = getAllVoters();
    // Only superadmin should remain
    assert.ok(votersAfterClear.length <= 1);
    if (votersAfterClear.length === 1) {
      assert.strictEqual(votersAfterClear[0].email, 'marzhendogalangs@gmail.com');
    }

    // 3c. Mode: reset_to_default
    const defaultRes = resetAllVoters('reset_to_default');
    assert.strictEqual(defaultRes.success, true);
    assert.ok(defaultRes.count > 1);
    const votersAfterDefault = getAllVoters();
    assert.ok(votersAfterDefault.length > 1, 'Default voters should be restored');
  });

  test('4. BALLOT SECRECY INVARIANT: Deleting DPT records never modifies or cascades to anonymous ballots', () => {
    // 4a. Cast an anonymous ballot
    const testNim = '103012999099';
    addSingleVoter({
      nim: testNim,
      name: 'Pemilih Rahasia',
      email: 'rahasia@student.telkomuniversity.ac.id',
      generation: 2024,
    });

    const voteRes = castBallotAtomicDev(
      testNim,
      '11111111-1111-1111-1111-111111111111',
      'mock_receipt_hash'
    );
    assert.strictEqual(voteRes.success, true);

    const ballotsBefore = getAllBallots();
    assert.strictEqual(ballotsBefore.length, 1);
    const castBallot = ballotsBefore[0];

    // Verify Ballot Secrecy on stored ballot
    assert.strictEqual('nim' in castBallot, false, 'Ballot must never contain NIM');
    assert.strictEqual('email' in castBallot, false, 'Ballot must never contain email');
    assert.strictEqual('voter_id' in castBallot, false, 'Ballot must never contain voter_id');

    // 4b. Perform DPT deletions & reset
    deleteSingleVoter(testNim);
    resetAllVoters('reset_vote_status');

    // 4c. Verify ballots store is completely isolated and unaffected
    const ballotsAfter = getAllBallots();
    assert.strictEqual(ballotsAfter.length, 1, 'Anonymous ballot count must remain 1');
    assert.strictEqual(ballotsAfter[0].candidate_id, '11111111-1111-1111-1111-111111111111');
  });
});
