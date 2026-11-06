import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDevCandidates,
  addCandidateToStore,
  updateCandidateInStore,
  deleteCandidateFromStore,
  resetCandidatesStore,
} from '../lib/candidates/dev-store.ts';
import {
  getAllVoters,
  queryVoters,
  findVoterByIdentifier,
  addSingleVoter,
  importVotersBatch,
  resetVotersStore,
} from '../lib/dpt/store.ts';
import {
  getAllBallots,
  castBallotAtomicDev,
  calculateLiveTally,
  resetBallotsStore,
} from '../lib/ballots/store.ts';

test.describe('Realtime Tally, DPT Management, and Anonymous Ballot Casting Tests', () => {
  test('1. Candidate Store CRUD: Add, update, and delete candidates properly', () => {
    resetCandidatesStore();
    const initialList = getDevCandidates();
    const initialCount = initialList.length;

    // Add candidate 3
    const newCand = addCandidateToStore({
      candidate_number: 3,
      leader_name: 'Calon Tiga A',
      vice_leader_name: 'Calon Tiga B',
      vision: 'Visi paslon tiga',
      mission: ['Misi paslon tiga'],
      photo_url: null,
      chairman_cv_url: null,
      vice_chairman_cv_url: null,
      is_active: true,
    });
    assert.ok(newCand.id, 'Candidate ID should be generated');

    const afterAdd = getDevCandidates();
    assert.equal(afterAdd.length, initialCount + 1, 'Candidate count should increment by 1');

    // Update candidate
    const updated = updateCandidateInStore(newCand.id, {
      leader_name: 'Calon Tiga Diperbarui',
    });
    assert.equal(updated?.leader_name, 'Calon Tiga Diperbarui');

    // Delete candidate
    const deleted = deleteCandidateFromStore(newCand.id);
    assert.equal(deleted, true);
    assert.equal(getDevCandidates().length, initialCount, 'Candidate count should revert');

    resetCandidatesStore();
  });

  test('2. DPT Store: Quick-add custom voter with test email for SMTP delivery', () => {
    resetVotersStore();
    const testNim = '103012399999';
    const testEmail = 'penguji.real@gmail.com';

    const result = addSingleVoter({
      nim: testNim,
      name: 'Penguji Real Email',
      email: testEmail,
      generation: 2024,
    });
    assert.equal(result.success, true);
    assert.ok(result.voter);
    assert.equal(result.voter?.email, testEmail);

    // Verify lookup by NIM and Email
    const byNim = findVoterByIdentifier(testNim);
    assert.ok(byNim);
    assert.equal(byNim?.name, 'Penguji Real Email');

    const byEmail = findVoterByIdentifier(testEmail);
    assert.ok(byEmail);
    assert.equal(byEmail?.nim, testNim);

    // Filter query
    const query = queryVoters({ search: 'Penguji Real', generation: '2024' });
    assert.ok(query.voters.length >= 1);
  });

  test('3. Atomic Ballot Casting: Enforces Ballot Secrecy and 1-voter-1-vote', () => {
    resetBallotsStore();
    const initialBallots = getAllBallots();
    assert.equal(initialBallots.length, 0);

    const testNim = '103012399999';
    const paslon1 = getDevCandidates().find((c) => c.candidate_number === 1);
    assert.ok(paslon1, 'Paslon 1 should exist');

    // Vote 1
    const voteResult = castBallotAtomicDev(testNim, paslon1.id);
    assert.equal(voteResult.success, true);
    assert.equal(voteResult.code, 'SUCCESS');

    // BALLOT SECRECY INVARIANT: Ballots store must NOT contain voter NIM or identification
    const ballotsAfter = getAllBallots();
    assert.equal(ballotsAfter.length, 1);
    const recordedBallot = ballotsAfter[0];
    assert.equal(recordedBallot.candidate_id, paslon1.id);
    assert.equal(recordedBallot.nim, undefined, 'Ballot must NEVER contain NIM');
    assert.equal(recordedBallot.voter_id, undefined, 'Ballot must NEVER contain voter_id');
    assert.equal(recordedBallot.email, undefined, 'Ballot must NEVER contain email');

    // Idempotency: Attempting to vote second time must be rejected
    const secondVote = castBallotAtomicDev(testNim, paslon1.id);
    assert.equal(secondVote.success, false);
    assert.equal(secondVote.code, 'ALREADY_VOTED');
    assert.equal(getAllBallots().length, 1, 'Ballots must NOT increment on duplicate vote');
  });

  test('4. Real-time Tally Aggregation: Accurately computes turnout and candidate vote counts', () => {
    const tallyResult = calculateLiveTally();
    assert.equal(typeof tallyResult.totalDpt, 'number');
    assert.equal(tallyResult.totalVotesRecorded, 1);
    assert.ok(tallyResult.tally.length >= 2);

    const p1Tally = tallyResult.tally.find((t) => t.candidateNumber === 1);
    assert.ok(p1Tally);
    assert.equal(p1Tally?.voteCount, 1);
    assert.equal(p1Tally?.percentage, 100);

    // Generation turnout
    const cohort2024 = tallyResult.byGeneration.find((g) => g.generation === 2024);
    assert.ok(cohort2024);
    assert.ok(cohort2024.votedCount >= 1);

    // Teardown
    resetVotersStore();
    resetBallotsStore();
    resetCandidatesStore();
  });
});
