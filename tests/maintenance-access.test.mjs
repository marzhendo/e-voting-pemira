import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMaintenanceStatus,
  isDesignatedAdminIdentifier,
} from '../lib/election/maintenance-status.ts';
import {
  getDevElectionSettings,
  updateDevElectionSettings,
} from '../lib/election/dev-settings-store.ts';

test('Maintenance Mode Access Control & Identification Suite', async (t) => {
  // Simpan state awal dev settings
  const originalSettings = { ...getDevElectionSettings() };

  t.after(() => {
    // Kembalikan settings ke kondisi awal setelah seluruh test selesai
    updateDevElectionSettings(originalSettings);
  });

  await t.test('1. getMaintenanceStatus accurately reflects election settings maintenance_mode', async () => {
    updateDevElectionSettings({ maintenance_mode: false });
    assert.strictEqual(await getMaintenanceStatus(), false);

    updateDevElectionSettings({ maintenance_mode: true });
    assert.strictEqual(await getMaintenanceStatus(), true);

    updateDevElectionSettings({ maintenance_mode: false });
    assert.strictEqual(await getMaintenanceStatus(), false);
  });

  await t.test('2. isDesignatedAdminIdentifier grants maintenance bypass to Superadmin and active Panitia KPR', async () => {
    // Akun Superadmin utama
    assert.strictEqual(await isDesignatedAdminIdentifier('marzhendogalangs@gmail.com'), true);
    assert.strictEqual(await isDesignatedAdminIdentifier('MARZHENDOGALANGS@GMAIL.COM'), true);

    // Akun Panitia KPR terdaftar (Email dan NIM)
    assert.strictEqual(
      await isDesignatedAdminIdentifier('kpradmin@student.telkomuniversity.ac.id'),
      true
    );
    assert.strictEqual(await isDesignatedAdminIdentifier('103012300091'), true);
    assert.strictEqual(await isDesignatedAdminIdentifier('103012300088'), true);
  });

  await t.test('3. isDesignatedAdminIdentifier rejects regular voters from bypassing maintenance', async () => {
    // Mahasiswa biasa / voter reguler
    assert.strictEqual(await isDesignatedAdminIdentifier('103012300001'), false);
    assert.strictEqual(await isDesignatedAdminIdentifier('103012300002'), false);
    assert.strictEqual(
      await isDesignatedAdminIdentifier('mahasiswa1@student.telkomuniversity.ac.id'),
      false
    );
    assert.strictEqual(await isDesignatedAdminIdentifier('unknown@gmail.com'), false);
  });

  await t.test('4. Decision matrix: voter is blocked during maintenance while admin proceeds', async () => {
    updateDevElectionSettings({ maintenance_mode: true });

    const voterId = '103012300001';
    const adminId = 'kpradmin@student.telkomuniversity.ac.id';

    const isMaintenance = await getMaintenanceStatus();
    assert.strictEqual(isMaintenance, true);

    // Voter check: should be blocked
    const voterIsAdmin = await isDesignatedAdminIdentifier(voterId);
    assert.strictEqual(voterIsAdmin, false);

    const voterAllowed = !isMaintenance || voterIsAdmin;
    assert.strictEqual(voterAllowed, false, 'Regular voter must be blocked during maintenance mode');

    // Admin check: should be allowed
    const adminIsAdmin = await isDesignatedAdminIdentifier(adminId);
    assert.strictEqual(adminIsAdmin, true);

    const adminAllowed = !isMaintenance || adminIsAdmin;
    assert.strictEqual(adminAllowed, true, 'Admin must be allowed to log in and access dashboard during maintenance');
  });
});
