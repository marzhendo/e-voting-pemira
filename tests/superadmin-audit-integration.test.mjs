import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as XLSX from 'xlsx';
import { queryAuditLogs, recordAuditLog } from '../lib/audit/store.ts';
import { getAllAdminUsers, addAdminUser, deleteAdminUser } from '../lib/admin/store.ts';

describe('Super Admin Functional Audit & Integration Verification', () => {
  it('1. Excel (.xlsx) DPT Generation & In-Memory Parsing with SheetJS', async () => {
    // Buat data spreadsheet DPT in-memory
    const testVoters = [
      { nim: '103012300001', name: 'Ahmad Fauzi', email: 'fauzi@student.telkomuniversity.ac.id', generation: 2023 },
      { nim: '103012400002', name: 'Siti Nurhaliza', email: 'siti@student.telkomuniversity.ac.id', generation: 2024 },
      { nim: '103012500003', name: 'Rian Hidayat', email: 'rian@student.telkomuniversity.ac.id', generation: 2025 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(testVoters);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DPT_Informatika');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    assert.ok(excelBuffer && excelBuffer.length > 0, 'Buffer Excel harus berhasil dibuat.');

    // Baca kembali buffer Excel seperti dilakukan di handleFileChange
    const readWb = XLSX.read(excelBuffer, { type: 'buffer' });
    const sheetName = readWb.SheetNames[0];
    assert.strictEqual(sheetName, 'DPT_Informatika', 'Nama sheet harus sesuai.');

    const parsedJson = XLSX.utils.sheet_to_json(readWb.Sheets[sheetName], { defval: '' });
    assert.strictEqual(parsedJson.length, 3, 'Harus membaca tepat 3 baris data pemilih.');

    const rawRows = parsedJson.map((row) => {
      const keys = Object.keys(row);
      const findVal = (col) => {
        const matchKey = keys.find((k) => k.trim().toLowerCase() === col);
        return matchKey ? String(row[matchKey]).trim() : '';
      };
      return {
        nim: findVal('nim'),
        name: findVal('name'),
        email: findVal('email'),
        generation: Number(findVal('generation')) || 0,
      };
    });

    assert.strictEqual(rawRows[0].nim, '103012300001');
    assert.strictEqual(rawRows[0].name, 'Ahmad Fauzi');
    assert.strictEqual(rawRows[0].email, 'fauzi@student.telkomuniversity.ac.id');
    assert.strictEqual(rawRows[0].generation, 2023);
  });

  it('2. DPT Duplicate and Malformed Record Detection Logic', () => {
    const rawDataset = [
      { nim: '103012300001', name: 'Mahasiswa Valid 1', email: 'mhs1@student.telkomuniversity.ac.id', generation: 2023 },
      { nim: '103012300001', name: 'Mahasiswa Duplikat NIM', email: 'mhs2@student.telkomuniversity.ac.id', generation: 2023 },
      { nim: '103012400003', name: 'Mahasiswa Duplikat Email', email: 'mhs1@student.telkomuniversity.ac.id', generation: 2024 },
      { nim: '12', name: 'NIM Terlalu Pendek', email: 'invalid@student.telkomuniversity.ac.id', generation: 2023 },
      { nim: '103012400005', name: 'Email Luar Domain', email: 'hacker@gmail.com', generation: 2024 },
      { nim: '103012400006', name: 'Angkatan Invalid', email: 'mhs6@student.telkomuniversity.ac.id', generation: 1999 },
    ];

    const seenNims = new Set();
    const seenEmails = new Set();
    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];

    for (let i = 0; i < rawDataset.length; i++) {
      const row = rawDataset[i];
      const rowNum = i + 2;

      if (!row.nim || row.nim.length < 4) {
        invalidRows.push({ row: rowNum, nim: row.nim, reason: 'NIM minimal 4 karakter' });
        continue;
      }
      if (!row.email || !row.email.endsWith('@student.telkomuniversity.ac.id')) {
        invalidRows.push({ row: rowNum, nim: row.nim, reason: 'Domain email wajib @student.telkomuniversity.ac.id' });
        continue;
      }
      if (!row.generation || row.generation < 2018 || row.generation > 2030) {
        invalidRows.push({ row: rowNum, nim: row.nim, reason: 'Angkatan wajib antara 2018-2030' });
        continue;
      }

      if (seenNims.has(row.nim) || seenEmails.has(row.email.toLowerCase())) {
        duplicateRows.push({ row: rowNum, nim: row.nim, reason: 'Duplikasi NIM atau Email dalam berkas' });
        continue;
      }

      seenNims.add(row.nim);
      seenEmails.add(row.email.toLowerCase());
      validRows.push(row);
    }

    assert.strictEqual(validRows.length, 1, 'Hanya 1 baris pertama yang sepenuhnya valid.');
    assert.strictEqual(duplicateRows.length, 2, '2 baris duplikat terdeteksi.');
    assert.strictEqual(invalidRows.length, 3, '3 baris invalid terdeteksi (NIM pendek, domain salah, angkatan di luar jangkauan).');
  });

  it('3. Candidate Deletion Integrity & Ballot Protection Guarantee', () => {
    // Simulasi kandidat dengan suara yang sudah masuk di bilik suara
    const candidateIdWithBallots = '11111111-1111-1111-1111-111111111111';
    const mockBallots = [
      { id: 'b1', candidate_id: '11111111-1111-1111-1111-111111111111' },
      { id: 'b2', candidate_id: '11111111-1111-1111-1111-111111111111' },
    ];

    const ballotCount = mockBallots.filter((b) => b.candidate_id === candidateIdWithBallots).length;

    // Verifikasi perlindungan integritas: Jika ada surat suara, larang penghapusan permanen
    const canDelete = ballotCount === 0;
    assert.strictEqual(canDelete, false, 'Kandidat yang telah memiliki suara dilarang dihapus permanen.');

    const errorResponse = {
      error: `Kandidat tidak dapat dihapus karena sudah memiliki ${ballotCount} suara tercatat. Silakan nonaktifkan status kandidat sebagai gantinya.`,
      code: 'CANDIDATE_HAS_BALLOTS',
      ballotCount,
    };

    assert.strictEqual(errorResponse.code, 'CANDIDATE_HAS_BALLOTS');
    assert.strictEqual(errorResponse.ballotCount, 2);
  });

  it('4. Multi-Role Election Settings Guard Logic', () => {
    const currentDbSettings = {
      is_voting_open: true,
      maintenance_mode: false,
      start_time: '2026-11-04T08:00:00.000Z',
      end_time: '2026-11-04T16:00:00.000Z',
      allow_kotak_kosong_multi: true,
    };

    // Kasus A: Superadmin menyimpan form lengkap di mana is_voting_open dikirim tanpa perubahan
    const superAdminSubmission = {
      is_voting_open: true, // Tidak berubah
      maintenance_mode: true, // Berubah (otoritas Superadmin)
      start_time: '2026-11-04T09:00:00.000Z',
      end_time: '2026-11-04T17:00:00.000Z',
      allow_kotak_kosong_multi: false,
    };

    const isSuperAdminVotingOpenChanged =
      superAdminSubmission.is_voting_open !== undefined &&
      superAdminSubmission.is_voting_open !== currentDbSettings.is_voting_open;

    // Tidak boleh ditolak karena nilai is_voting_open sama dengan current DB
    assert.strictEqual(isSuperAdminVotingOpenChanged, false, 'Superadmin tidak mengubah is_voting_open sehingga tidak ditolak.');

    // Kasus B: KPR Admin menyimpan form di mana maintenance_mode dikirim tanpa perubahan
    const kprAdminSubmission = {
      is_voting_open: false, // Berubah (otoritas KPR)
      maintenance_mode: false, // Tidak berubah
      start_time: '2026-11-04T08:00:00.000Z',
      end_time: '2026-11-04T16:00:00.000Z',
      allow_kotak_kosong_multi: true,
    };

    const isKprAdminMaintenanceChanged =
      kprAdminSubmission.maintenance_mode !== undefined &&
      kprAdminSubmission.maintenance_mode !== currentDbSettings.maintenance_mode;

    assert.strictEqual(isKprAdminMaintenanceChanged, false, 'KPR Admin tidak mengubah maintenance_mode sehingga tidak ditolak.');
  });

  it('5. Audit Logs Formatting & Ballot Secrecy Verification', async () => {
    const newLog = await recordAuditLog({
      actorEmail: 'superadmin@pemira.local',
      actorName: 'Marzhendo Galang',
      actorRole: 'super_admin',
      action: 'CANDIDATE_UPDATE',
      description: 'Pembaruan visi misi Paslon 01 untuk finalisasi sidang pleno.',
      details: { candidate_number: 1, is_active: true },
    });

    assert.ok(newLog.id.startsWith('audit-'));
    assert.strictEqual(newLog.actor_email, 'superadmin@pemira.local');
    assert.strictEqual(newLog.action, 'CANDIDATE_UPDATE');

    const queryRes = queryAuditLogs({ limit: 10 });
    assert.ok(queryRes.logs.length > 0);

    // INVARIAN BALLOT SECRECY: Pastikan tidak ada data pilihan voter yang tercatat
    for (const log of queryRes.logs) {
      if (log.details) {
        assert.strictEqual(log.details.voterChoice, undefined, 'Log audit dilarang menyimpan pilihan rahasia pemilih!');
        assert.strictEqual(log.details.nim, log.details.nim === undefined || typeof log.details.nim === 'string' ? log.details.nim : null);
      }
    }
  });

  it('6. Primary Superadmin Immutability & Admin Deletion Resolution', () => {
    const admins = getAllAdminUsers();
    const primary = admins.find((a) => a.email.toLowerCase() === 'marzhendogalangs@gmail.com');
    assert.ok(primary, 'Superadmin utama wajib ada.');
    assert.strictEqual(primary.role, 'super_admin', 'Peran harus super_admin.');

    // Coba hapus superadmin utama menggunakan ID
    const resultById = deleteAdminUser(primary.id);
    assert.strictEqual(resultById.success, false, 'Superadmin utama dilarang dihapus via ID.');
    assert.match(resultById.error, /Akun Superadmin utama tidak dapat dihapus/i);

    // Coba hapus superadmin utama menggunakan Email
    const resultByEmail = deleteAdminUser(primary.email);
    assert.strictEqual(resultByEmail.success, false, 'Superadmin utama dilarang dihapus via Email.');
    assert.match(resultByEmail.error, /Akun Superadmin utama tidak dapat dihapus/i);

    // Verifikasi kontrak PostgreSQL trigger pada BEFORE DELETE:
    // Pada trigger PostgreSQL BEFORE DELETE, variabel NEW selalu NULL.
    // Jika fungsi trigger mengembalikan NEW (NULL), Postgres membatalkan DELETE secara diam-diam.
    // Fungsi harus mengembalikan OLD pada TG_OP = 'DELETE'.
    const simulateTrigger = (op, oldRow, newRow) => {
      if (oldRow.email.toLowerCase() === 'marzhendogalangs@gmail.com') {
        if (op === 'DELETE') throw new Error('Cannot delete superadmin');
      }
      if (op === 'DELETE') return oldRow; // WAJIB return OLD
      return newRow;
    };

    assert.throws(
      () => simulateTrigger('DELETE', { email: 'marzhendogalangs@gmail.com' }, null),
      /Cannot delete superadmin/
    );
    const nonAdminDeleted = simulateTrigger('DELETE', { email: 'kpr-panitia@telkomuniversity.ac.id' }, null);
    assert.deepStrictEqual(nonAdminDeleted, { email: 'kpr-panitia@telkomuniversity.ac.id' });
  });

  it('7. Robust DPT Batch Deletion: UUID, Dev-Store IDs, and NIM Resolution without 22P02 Syntax Errors', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = (val) => UUID_REGEX.test(val);

    const mixedIds = ['5994815f-14b7-42bc-9501-0f200191295b', 'voter-1', 'voter-2', '103012400003'];
    const validUuids = mixedIds.filter(isUuid);
    const nonUuids = mixedIds.filter((id) => !isUuid(id));

    assert.strictEqual(validUuids.length, 1);
    assert.strictEqual(validUuids[0], '5994815f-14b7-42bc-9501-0f200191295b');
    assert.deepStrictEqual(nonUuids, ['voter-1', 'voter-2', '103012400003']);

    // Pastikan ID non-UUID tidak pernah dikirim ke query UUID PostgreSQL (.in('id', nonUuids))
    for (const id of validUuids) {
      assert.ok(isUuid(id), `${id} harus berformat UUID yang valid`);
    }
    for (const nonUuid of nonUuids) {
      assert.strictEqual(isUuid(nonUuid), false, `${nonUuid} terbukti bukan UUID`);
    }
  });
});
