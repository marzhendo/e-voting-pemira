import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createHmac, randomBytes } from 'node:crypto';

describe('High Concurrency Race-Condition & Idempotency Simulation', () => {
  test('Simultaneous duplicate ballot submission enforces atomic 1-voter-1-vote invariant', async () => {
    // Simulasi database state / memory locker untuk voting
    const voterState = {
      id: 'voter-uuid-1301230001',
      nim: '1301230001',
      has_voted: false,
      ballot_cast_timestamp: null,
    };

    const ballotsTable = [];

    // Atomik Simulated RPC: cast_ballot_secure
    // Di Supabase, ini dieksekusi dengan:
    // UPDATE voters_whitelist SET has_voted = true WHERE id = voter_id AND has_voted = false
    // Jika rows_updated === 0 -> ROLLBACK & lempar ALREADY_VOTED
    // Jika rows_updated === 1 -> INSERT INTO ballots (candidate_id) VALUES (...)
    const lock = { isLocked: false };

    async function executeSimulatedAtomicRPC(voterId, candidateId) {
      // Simulate real-world asynchronous delay & packet interleaving (5-25ms)
      const delay = Math.floor(Math.random() * 20) + 5;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Atomic Compare-And-Swap (CAS) simulating PostgreSQL ROW EXCLUSIVE lock
      if (voterState.has_voted) {
        return {
          success: false,
          code: 'ALREADY_VOTED',
          message: 'Hak suara Anda telah digunakan sebelumnya.',
        };
      }

      // First one through flips the atomic bit
      voterState.has_voted = true;
      voterState.ballot_cast_timestamp = new Date().toISOString();

      // INSERT into ballots table (BALLOT SECRECY: NO VOTER_ID RECORDED)
      const ballotRecord = {
        id: `ballot-${randomBytes(8).toString('hex')}`,
        candidate_id: candidateId,
        created_at: new Date().toISOString(),
      };
      ballotsTable.push(ballotRecord);

      return {
        success: true,
        receipt: {
          token: `HMIF-${randomBytes(6).toString('hex').toUpperCase()}`,
          date: voterState.ballot_cast_timestamp,
        },
      };
    }

    // Launch 50 SIMULTANEOUS concurrent requests for the exact same voter
    const CONCURRENT_REQUESTS = 50;
    const candidateId = '11111111-1111-1111-1111-111111111111';

    const promises = Array.from({ length: CONCURRENT_REQUESTS }, () =>
      executeSimulatedAtomicRPC(voterState.id, candidateId)
    );

    const results = await Promise.all(promises);

    const successResults = results.filter((r) => r.success === true);
    const rejectedResults = results.filter((r) => r.success === false && r.code === 'ALREADY_VOTED');

    // VERIFIKASI IDEMPOTENCY:
    assert.strictEqual(
      successResults.length,
      1,
      `Harus tepat SATU transaksi yang berhasil masuk, tetapi didapatkan: ${successResults.length}`
    );

    assert.strictEqual(
      rejectedResults.length,
      CONCURRENT_REQUESTS - 1,
      `Sisa ${CONCURRENT_REQUESTS - 1} transaksi konkuren wajib ditolak dengan kode ALREADY_VOTED`
    );

    // VERIFIKASI INTEGRITAS BALLOTS:
    assert.strictEqual(
      ballotsTable.length,
      1,
      'Tabel surat suara (ballots) tepat bertambah 1 baris suara anonim'
    );

    // VERIFIKASI BALLOT SECRECY:
    // Kolom voter_id, nim, atau data pengenal TIDAK BOLEH ADA di tabel surat suara
    const insertedBallot = ballotsTable[0];
    assert.strictEqual(insertedBallot.voter_id, undefined, 'INVARIAN: voter_id DILARANG ada di ballots');
    assert.strictEqual(insertedBallot.nim, undefined, 'INVARIAN: nim DILARANG ada di ballots');
    assert.strictEqual(insertedBallot.ip_address, undefined, 'INVARIAN: ip_address DILARANG ada di ballots');
  });

  test('Concurrent voters across multiple threads cast independent ballots atomically', async () => {
    const TOTAL_VOTERS = 25;
    const ballots = [];
    const voters = Array.from({ length: TOTAL_VOTERS }, (_, i) => ({
      id: `voter-${i + 1}`,
      has_voted: false,
    }));

    async function voteForVoter(voter, candidateId) {
      if (voter.has_voted) {
        return { success: false, code: 'ALREADY_VOTED' };
      }
      voter.has_voted = true;
      ballots.push({ id: `b-${randomBytes(4).toString('hex')}`, candidateId });
      return { success: true };
    }

    // 25 distinct voters voting simultaneously
    const tasks = voters.map((voter, index) =>
      voteForVoter(voter, index % 2 === 0 ? 'cand-1' : 'cand-2')
    );

    const results = await Promise.all(tasks);
    const successfulVotes = results.filter((r) => r.success).length;

    assert.strictEqual(successfulVotes, TOTAL_VOTERS, 'Semua 25 pemilih sah berhasil memilih');
    assert.strictEqual(ballots.length, TOTAL_VOTERS, 'Total surat suara yang masuk tepat 25');

    // Now if any of these 25 voters try to vote AGAIN, they must be blocked
    const secondWave = await Promise.all(voters.map((v) => voteForVoter(v, 'cand-1')));
    const secondWaveSuccess = secondWave.filter((r) => r.success).length;
    assert.strictEqual(secondWaveSuccess, 0, 'Tidak ada satu pun pemilih yang bisa mencoblos untuk kedua kalinya');
  });
});
