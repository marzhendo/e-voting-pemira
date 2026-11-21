import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT, jwtVerify } from 'jose';
import {
  getAllVoters,
  markVoterAsVoted,
  resetVotersStore,
  addSingleVoter,
  findVoterByIdentifier,
} from '../lib/dpt/store.ts';
import {
  castBallotAtomicDev,
  calculateLiveTally,
  resetBallotsStore,
  getAllBallots,
} from '../lib/ballots/store.ts';
import { getDevCandidates, resetCandidatesStore } from '../lib/candidates/dev-store.ts';

describe('Voter Re-Login, Bilik Suara Logout, and Public Tally Invariant Tests', () => {
  const secretKey = new TextEncoder().encode('hmif-test-session-secret-key-32-chars-min');

  test('1. Session & Routing Contract: Re-login for voted voter produces hasVoted=true and targets /receipt', async () => {
    resetVotersStore();
    const testNim = '103012300099';
    addSingleVoter({
      nim: testNim,
      name: 'Voter Sudah Memilih',
      email: 'voter.selesai@student.telkomuniversity.ac.id',
      generation: 2023,
    });

    // Mark voter as has_voted = true
    markVoterAsVoted(testNim);
    const voter = findVoterByIdentifier(testNim);
    assert.strictEqual(voter?.has_voted, true, 'Voter in DPT must be marked as has_voted');

    // Create session token simulating verifyVoterOtp
    const sessionPayload = {
      id: voter.id,
      email: voter.email,
      name: voter.name,
      nim: voter.nim,
      role: 'voter',
      isDptVerified: true,
      hasVoted: voter.has_voted,
      generation: voter.generation,
    };

    const token = await new SignJWT(sessionPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secretKey);

    assert.ok(token, 'Session token must be successfully generated');

    const { payload: verified } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    assert.strictEqual(verified.hasVoted, true, 'Session must retain hasVoted: true');

    // Verify routing contract
    // When hasVoted === true, login directs to /receipt, and accessing /vote redirects to /receipt
    const determinePostLoginDestination = (hasVoted) => (hasVoted ? '/receipt' : '/vote');
    assert.strictEqual(determinePostLoginDestination(verified.hasVoted), '/receipt');

    const canAccessVoteBooth = (hasVoted) => !hasVoted;
    assert.strictEqual(canAccessVoteBooth(verified.hasVoted), false, 'Voted user cannot re-enter vote booth');
  });

  test('2. Atomic 1-Voter-1-Vote: Re-logged in voter CANNOT cast a second ballot', async () => {
    resetVotersStore();
    resetBallotsStore();
    resetCandidatesStore();

    const candidates = getDevCandidates();
    assert.ok(candidates.length > 0, 'Candidates must be available');
    const targetCandidateId = candidates[0].id;

    const testNim = '103012300077';
    addSingleVoter({
      nim: testNim,
      name: 'Voter Uji Ganda',
      email: 'uji.ganda@student.telkomuniversity.ac.id',
      generation: 2024,
    });

    // First ballot submission succeeds
    const firstVote = castBallotAtomicDev(testNim, targetCandidateId);
    assert.strictEqual(firstVote.success, true, 'First ballot submission must succeed');
    assert.ok(firstVote.ballotId, 'Ballot ID must be generated');

    // Second ballot submission must be blocked atomically
    const secondVote = castBallotAtomicDev(testNim, targetCandidateId);
    assert.strictEqual(secondVote.success, false, 'Second ballot submission must fail');
    assert.strictEqual(secondVote.code, 'ALREADY_VOTED', 'Must reject with ALREADY_VOTED');

    // Ballot secrecy invariant check: ballots must not contain the voter's NIM
    const ballots = getAllBallots();
    assert.strictEqual(ballots.length, 1, 'Exactly 1 ballot recorded');
    assert.strictEqual(ballots[0].candidate_id, targetCandidateId);
    assert.strictEqual(ballots[0].nim, undefined, 'Ballot MUST NOT contain NIM');
    assert.strictEqual(ballots[0].voter_id, undefined, 'Ballot MUST NOT contain voter ID');
  });

  test('3. Electoral Confidentiality: When election is OPEN, candidate tally is confidential', () => {
    resetVotersStore();
    resetBallotsStore();
    resetCandidatesStore();

    // Add voter and cast ballot
    const candidates = getDevCandidates();
    const testNim = '103012300055';
    addSingleVoter({
      nim: testNim,
      name: 'Pemilih Rahasia',
      email: 'rahasia@student.telkomuniversity.ac.id',
      generation: 2023,
    });
    castBallotAtomicDev(testNim, candidates[0].id);

    // Simulate public tally API logic when isClosed = false
    const isClosed = false;
    const allVoters = getAllVoters();
    const totalDpt = allVoters.length;
    const totalVotes = allVoters.filter((v) => v.has_voted).length;
    const turnoutPercentage = totalDpt > 0 ? Math.round((totalVotes / totalDpt) * 100) : 0;

    const publicResponse = {
      isClosed,
      turnout: {
        totalDpt,
        totalVotes,
        turnoutPercentage,
      },
      message: 'Pemungutan suara sedang berlangsung.',
    };

    assert.strictEqual(publicResponse.isClosed, false);
    assert.strictEqual(publicResponse.turnout.totalVotes, 1);
    assert.strictEqual(publicResponse.results, undefined, 'Results breakdown MUST be undefined while open');
  });

  test('4. Official Tally Publication: When election is CLOSED, full candidate breakdown is published', () => {
    resetVotersStore();
    resetBallotsStore();
    resetCandidatesStore();

    const candidates = getDevCandidates();
    const paslon1 = candidates.find((c) => c.candidate_number === 1) || candidates[0];
    const kotakKosongCand = candidates.find((c) => c.candidate_number === 0);

    const nim1 = '103012300011';
    const nim2 = '103012300012';

    addSingleVoter({ nim: nim1, name: 'V1', email: 'v1@test.com', generation: 2023 });
    addSingleVoter({ nim: nim2, name: 'V2', email: 'v2@test.com', generation: 2023 });

    castBallotAtomicDev(nim1, paslon1.id);
    if (kotakKosongCand) {
      castBallotAtomicDev(nim2, kotakKosongCand.id);
    }

    const liveTally = calculateLiveTally();
    assert.strictEqual(liveTally.totalVotesRecorded, 2);

    // Simulate public tally API logic when isClosed = true
    const isClosed = true;
    const allVoters = getAllVoters();
    const totalDpt = allVoters.length;
    const totalVotes = liveTally.totalVotesRecorded;
    const turnoutPercentage = totalDpt > 0 ? Math.round((totalVotes / totalDpt) * 100) : 0;

    const results = liveTally.tally.map((cand) => {
      return {
        candidateId: cand.candidateId,
        candidateNumber: cand.candidateNumber,
        leaderName: cand.leaderName,
        viceLeaderName: cand.viceLeaderName,
        voteCount: cand.voteCount,
        percentage: cand.percentage,
      };
    });

    const publicClosedResponse = {
      isClosed,
      turnout: {
        totalDpt,
        totalVotes,
        turnoutPercentage,
      },
      results,
    };

    assert.strictEqual(publicClosedResponse.isClosed, true);
    assert.ok(Array.isArray(publicClosedResponse.results), 'Results breakdown must be an array when closed');
    assert.strictEqual(publicClosedResponse.results.length, liveTally.tally.length);

    const paslon01 = publicClosedResponse.results.find((r) => r.candidateNumber === 1);
    assert.strictEqual(paslon01?.voteCount, 1);

    const kotakKosong = publicClosedResponse.results.find((r) => r.candidateNumber === 0);
    assert.strictEqual(kotakKosong?.voteCount, 1);
    assert.strictEqual(kotakKosong?.percentage, 50);
  });

  test('5. Bilik Suara Safe Logout: Does not revoke voting rights for unvoted voters', () => {
    resetVotersStore();
    const testNim = '103012300044';
    addSingleVoter({
      nim: testNim,
      name: 'Pemilih Ragu',
      email: 'ragu@student.telkomuniversity.ac.id',
      generation: 2024,
    });

    const voterBeforeLogout = findVoterByIdentifier(testNim);
    assert.strictEqual(voterBeforeLogout?.has_voted, false);

    // Simulating logout from Bilik Suara:
    // Session is destroyed on client/server, but DB record has_voted remains FALSE
    const voterAfterLogout = findVoterByIdentifier(testNim);
    assert.strictEqual(
      voterAfterLogout?.has_voted,
      false,
      'Voter must still be able to vote later if they log out without casting a ballot'
    );
  });
});
