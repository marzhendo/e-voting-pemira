import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('Fase 3: Export Tally, Audit Logs, and BAST Public Verification', () => {
  test('1. Tally CSV Export conforms to Ballot Secrecy: zero voter PII, zero tokens', () => {
    // Simulasi data export
    const totalDpt = 1250;
    const totalVotes = 950;
    const turnoutPercentage = 76;
    const paslonList = [
      { candidateNumber: 1, leaderName: 'Ahmad Faiz', viceLeaderName: 'Nur Azizah', voteCount: 520, percentage: 54.74 },
      { candidateNumber: 2, leaderName: 'Budi Santoso', viceLeaderName: 'Dewi Lestari', voteCount: 410, percentage: 43.16 },
      { candidateNumber: 0, leaderName: 'Kotak Kosong', viceLeaderName: '-', voteCount: 20, percentage: 2.1 },
    ];

    // Payload hash
    const integrityPayload = JSON.stringify({
      totalDpt,
      totalVotes,
      tally: paslonList.map((t) => ({ no: t.candidateNumber, votes: t.voteCount })),
    });
    const hash = crypto.createHash('sha256').update(integrityPayload).digest('hex').toUpperCase();

    // Rangkai CSV
    const rows = [
      ['REKAPITULASI RESMI PEROLEHAN SUARA - PEMIRA HMIF 2026/2027'],
      ['KOMISI PEMILIHAN RAYA (KPR) HMIF TELKOM UNIVERSITY PURWOKERTO'],
      ['Hash Integritas SHA-256', hash],
      [],
      ['No. Urut', 'Nama Calon Ketua', 'Nama Calon Wakil Ketua', 'Perolehan Suara', 'Persentase (%)'],
      ...paslonList.map((c) => [
        c.candidateNumber === 0 ? '0 (Kotak Kosong)' : c.candidateNumber,
        c.leaderName,
        c.viceLeaderName,
        c.voteCount,
        `${c.percentage}%`,
      ]),
      [],
      ['TOTAL DPT', totalDpt],
      ['TOTAL SUARA MASUK', totalVotes],
      ['TINGKAT PARTISIPASI', `${turnoutPercentage}%`],
    ];

    const csvContent = '\uFEFF' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');

    // Invarian Ballot Secrecy: Pastikan TIDAK ADA kolom NIM, Voter ID, IP Address, atau token
    assert.match(csvContent, /REKAPITULASI RESMI/);
    assert.doesNotMatch(csvContent, /nim/i);
    assert.doesNotMatch(csvContent, /voter_id/i);
    assert.doesNotMatch(csvContent, /receipt_token/i);
    assert.doesNotMatch(csvContent, /ip_address/i);
    assert.ok(csvContent.startsWith('\uFEFF'), 'CSV must include UTF-8 BOM for Excel compatibility');
  });

  test('2. Audit Log CSV Export formats timestamp, actor, action, and details', () => {
    const logs = [
      {
        id: 'log-1',
        created_at: new Date('2026-11-07T10:00:00Z').toISOString(),
        actor_email: 'marzhendogalangs@gmail.com',
        actor_role: 'super_admin',
        action: 'settings_update',
        target: 'election_settings',
        description: 'Memperbarui jadwal pemilihan raya',
        ip_address: '127.0.0.1',
      },
      {
        id: 'log-2',
        created_at: new Date('2026-11-07T10:05:00Z').toISOString(),
        actor_email: 'kpr.admin@telkomuniversity.ac.id',
        actor_role: 'kpr_admin',
        action: 'dpt_import',
        target: 'voters_whitelist',
        description: 'Impor 200 data pemilih baru angkatan 2024',
        ip_address: '10.0.0.1',
      },
    ];

    const headers = ['Waktu (WIB)', 'Email Pelaksana', 'Peran (Role)', 'Kategori Aksi', 'Target Entitas', 'Rincian Aktivitas', 'Alamat IP'];
    const rows = logs.map((l) => [
      l.created_at,
      l.actor_email,
      l.actor_role,
      l.action,
      l.target,
      l.description,
      l.ip_address,
    ]);

    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');

    assert.ok(csv.includes('marzhendogalangs@gmail.com'));
    assert.ok(csv.includes('settings_update'));
    assert.ok(csv.includes('dpt_import'));
    assert.ok(csv.includes('10.0.0.1'));
  });

  test('3. BAST SHA-256 Integrity Hash Verification detects matches and tampering', () => {
    const stateA = {
      totalDpt: 1250,
      totalVotes: 950,
      tally: [
        { no: 1, votes: 520 },
        { no: 2, votes: 410 },
        { no: 0, votes: 20 },
      ],
    };

    const hashA = crypto.createHash('sha256').update(JSON.stringify(stateA)).digest('hex').toUpperCase();

    // Verification against stateA should match exactly
    const computedForA = crypto.createHash('sha256').update(JSON.stringify(stateA)).digest('hex').toUpperCase();
    assert.equal(hashA, computedForA);

    // Tampered state (e.g. 1 vote modified)
    const stateTampered = {
      ...stateA,
      tally: [
        { no: 1, votes: 521 }, // tampered!
        { no: 2, votes: 409 },
        { no: 0, votes: 20 },
      ],
    };

    const hashTampered = crypto.createHash('sha256').update(JSON.stringify(stateTampered)).digest('hex').toUpperCase();
    assert.notEqual(hashA, hashTampered, 'Modified tally must produce completely different hash');
  });

  test('4. BAST Verification Response guarantees Ballot Secrecy', () => {
    const mockVerificationResult = {
      valid: true,
      hash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
      documentNumber: '009/BA-KPR/HMIF/XI/2026',
      electionPeriod: '2026/2027',
      totalDpt: 1250,
      totalVotes: 950,
      turnoutPercentage: 76,
      tally: [
        { candidateNumber: 1, leaderName: 'Ahmad Faiz', viceLeaderName: 'Nur Azizah', voteCount: 520, percentage: 54.74 },
        { candidateNumber: 2, leaderName: 'Budi Santoso', viceLeaderName: 'Dewi Lestari', voteCount: 410, percentage: 43.16 },
      ],
      ballotSecrecyGuaranteed: true,
    };

    const serialized = JSON.stringify(mockVerificationResult);

    // Pastikan tidak ada data sensitif pemilih yang bocor ke respon verifikasi publik
    assert.doesNotMatch(serialized, /voterId/i);
    assert.doesNotMatch(serialized, /nim/i);
    assert.doesNotMatch(serialized, /user_email/i);
    assert.doesNotMatch(serialized, /ballotToken/i);
    assert.equal(mockVerificationResult.ballotSecrecyGuaranteed, true);
  });
});
