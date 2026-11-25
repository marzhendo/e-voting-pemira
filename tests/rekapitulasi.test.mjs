import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeRecapAccess,
  formatRecapPayload,
} from '../lib/ballots/recap-contract.ts';
import {
  resolveSafeInternalRedirect,
  resolvePostLoginDestination,
} from '../lib/auth/redirect.ts';
import {
  calculateLiveTally,
  castBallotAtomicDev,
  resetBallotsStore,
} from '../lib/ballots/store.ts';
import { addSingleVoter, resetVotersStore } from '../lib/dpt/store.ts';
import { getDevCandidates, resetCandidatesStore } from '../lib/candidates/dev-store.ts';

describe('Rekapitulasi Suara & Partisipasi Pemilih Contract Suite', () => {
  test('1. Auth Guard: Rejects anonymous requests with 401 and permits valid voter/admin sessions', () => {
    const anon = authorizeRecapAccess(null);
    assert.strictEqual(anon.authorized, false);
    assert.strictEqual(anon.status, 401);

    const unvotedVoter = authorizeRecapAccess({
      id: 'v-1',
      email: '103112400001@student.telkomuniversity.ac.id',
      name: 'Pemilih Belum Memilih',
      nim: '103112400001',
      role: 'voter',
      isDptVerified: true,
      hasVoted: false,
      generation: 2024,
    });
    assert.strictEqual(unvotedVoter.authorized, true);

    const votedVoter = authorizeRecapAccess({
      id: 'v-2',
      email: '103112400002@student.telkomuniversity.ac.id',
      name: 'Pemilih Sudah Memilih',
      nim: '103112400002',
      role: 'voter',
      isDptVerified: true,
      hasVoted: true,
      generation: 2024,
    });
    assert.strictEqual(votedVoter.authorized, true);

    const adminUser = authorizeRecapAccess({
      id: 'a-1',
      email: 'kpr@student.telkomuniversity.ac.id',
      name: 'Panitia KPR',
      role: 'kpr_admin',
      isDptVerified: true,
      hasVoted: false,
    });
    assert.strictEqual(adminUser.authorized, true);
  });

  test('2. Restricted Visibility: When election is open (isClosed=false), candidate results are strictly omitted while cohort turnout is returned', () => {
    const mockSnapshot = {
      timestamp: '2026-11-25T09:00:00.000Z',
      electionSettings: {
        isVotingOpen: true,
        isClosed: false,
        maintenanceMode: false,
        startTime: '2026-11-25T01:00:00.000Z',
        endTime: '2026-11-25T09:30:00.000Z',
      },
      turnout: {
        totalDpt: 1232,
        totalVotesRecorded: 410,
        totalVotersParticipated: 410,
        turnoutPercentage: 33.28,
        byGeneration: [
          { generation: 2025, totalVoters: 252, votedCount: 110, turnoutPercentage: 43.65 },
          { generation: 2024, totalVoters: 269, votedCount: 150, turnoutPercentage: 55.76 },
        ],
      },
      tally: [
        {
          candidateId: 'cand-1',
          candidateNumber: 1,
          leaderName: 'Nehemia Pandu I.',
          viceLeaderName: 'Barret Fairuz A.',
          photoUrl: '/assets/candidates/paslon-1.webp',
          voteCount: 350,
          percentage: 85.37,
        },
        {
          candidateId: 'cand-0',
          candidateNumber: 0,
          leaderName: 'Kotak Kosong',
          viceLeaderName: '',
          photoUrl: null,
          voteCount: 60,
          percentage: 14.63,
        },
      ],
    };

    const payload = formatRecapPayload(mockSnapshot);

    assert.strictEqual(payload.success, true);
    assert.strictEqual(payload.isClosed, false);
    assert.strictEqual('results' in payload, false, 'results key MUST NOT exist while open');
    assert.strictEqual(payload.results, undefined);
    assert.strictEqual(payload.turnout.totalDpt, 1232);
    assert.strictEqual(payload.turnout.totalVotes, 410);
    assert.deepStrictEqual(
      payload.turnout.byGeneration.map((g) => g.generation),
      [2024, 2025],
      'Cohorts must be sorted chronologically ascending'
    );
    assert.strictEqual(payload.electionWindow.endTime, '2026-11-25T09:30:00.000Z');
  });

  test('3. Official Disclosure: When election is closed (isClosed=true), results are ranked by votes with candidate photos and Kotak Kosong null photo', () => {
    const mockSnapshot = {
      timestamp: '2026-11-25T09:35:00.000Z',
      electionSettings: {
        isVotingOpen: false,
        isClosed: true,
        maintenanceMode: false,
        startTime: '2026-11-25T01:00:00.000Z',
        endTime: '2026-11-25T09:30:00.000Z',
      },
      turnout: {
        totalDpt: 100,
        totalVotesRecorded: 90,
        totalVotersParticipated: 90,
        turnoutPercentage: 90,
        byGeneration: [
          { generation: 2024, totalVoters: 100, votedCount: 90, turnoutPercentage: 90 },
        ],
      },
      tally: [
        {
          candidateId: 'cand-0',
          candidateNumber: 0,
          leaderName: 'Kotak Kosong',
          viceLeaderName: '',
          photoUrl: '/should-be-nulled.webp',
          voteCount: 30,
          percentage: 33.33,
        },
        {
          candidateId: 'cand-1',
          candidateNumber: 1,
          leaderName: 'Nehemia Pandu I.',
          viceLeaderName: 'Barret Fairuz A.',
          photoUrl: '/assets/candidates/paslon-1.webp',
          voteCount: 60,
          percentage: 66.67,
        },
      ],
    };

    const payload = formatRecapPayload(mockSnapshot);

    assert.strictEqual(payload.isClosed, true);
    assert.ok(Array.isArray(payload.results));
    assert.strictEqual(payload.results.length, 2);
    assert.strictEqual(payload.results[0].candidateNumber, 1);
    assert.strictEqual(payload.results[0].photoUrl, '/assets/candidates/paslon-1.webp');
    assert.strictEqual(payload.results[1].candidateNumber, 0);
    assert.strictEqual(payload.results[1].photoUrl, null);
  });

  test('4. Dev Store Live Tally Aggregation preserves candidate photoUrl for recap display', () => {
    resetVotersStore();
    resetBallotsStore();
    resetCandidatesStore();

    const candidates = getDevCandidates();
    const paslon1 = candidates.find((c) => c.candidate_number === 1);
    assert.ok(paslon1, 'Default Paslon 1 exists');

    addSingleVoter({
      nim: '103112400888',
      name: 'Pemilih Uji Rekap',
      email: 'uji.rekap@student.telkomuniversity.ac.id',
      generation: 2024,
    });
    castBallotAtomicDev('103112400888', paslon1.id);

    const live = calculateLiveTally();
    const item1 = live.tally.find((t) => t.candidateNumber === 1);
    assert.ok(item1);
    assert.strictEqual(item1.voteCount, 1);
    assert.strictEqual('photoUrl' in item1, true);
  });

  test('5. Open-Redirect Defense & Post-Login Routing Resolution', () => {
    // Rejects malicious external redirects
    assert.strictEqual(resolveSafeInternalRedirect('https://evil.com/rekapitulasi'), null);
    assert.strictEqual(resolveSafeInternalRedirect('//evil.com'), null);
    assert.strictEqual(resolveSafeInternalRedirect('/\\evil.com'), null);
    assert.strictEqual(resolveSafeInternalRedirect('/unknown-path'), null);
    assert.strictEqual(resolveSafeInternalRedirect('/rekapitulasi'), '/rekapitulasi');

    // Honoring /rekapitulasi redirect for both voted and unvoted voters
    assert.strictEqual(
      resolvePostLoginDestination({
        role: 'voter',
        hasVoted: true,
        isElectionClosed: false,
        requestedRedirect: '/rekapitulasi',
      }),
      '/rekapitulasi'
    );
    assert.strictEqual(
      resolvePostLoginDestination({
        role: 'voter',
        hasVoted: false,
        isElectionClosed: false,
        requestedRedirect: '/rekapitulasi',
      }),
      '/rekapitulasi'
    );

    // Without redirect: voted voters go to /receipt cleanly
    assert.strictEqual(
      resolvePostLoginDestination({
        role: 'voter',
        hasVoted: true,
        isElectionClosed: true,
      }),
      '/receipt'
    );

    // Without redirect: unvoted voters go to /vote when open, /rekapitulasi when closed
    assert.strictEqual(
      resolvePostLoginDestination({
        role: 'voter',
        hasVoted: false,
        isElectionClosed: false,
      }),
      '/vote'
    );
    assert.strictEqual(
      resolvePostLoginDestination({
        role: 'voter',
        hasVoted: false,
        isElectionClosed: true,
      }),
      '/rekapitulasi'
    );

    // Non-staff user cannot escalate into /admin via redirect param
    assert.strictEqual(
      resolvePostLoginDestination({
        role: 'voter',
        hasVoted: false,
        isElectionClosed: false,
        requestedRedirect: '/admin/dashboard',
      }),
      '/vote'
    );
  });
});
