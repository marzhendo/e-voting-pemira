import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatDateTimeLocal,
  getElectionSystemStatus,
} from '../components/admin/election-status-helper.ts';
import {
  getDevElectionSettings,
  updateDevElectionSettings,
} from '../lib/election/dev-settings-store.ts';

test('Operational Schedule Helper & Persistence Regression Suite', async (t) => {
  await t.test('1. formatDateTimeLocal never falls back to a hardcoded fake date on empty or invalid input', () => {
    assert.strictEqual(formatDateTimeLocal(''), '');
    assert.strictEqual(formatDateTimeLocal('invalid-date'), '');

    const formatted = formatDateTimeLocal('2026-11-18T12:30:00.000Z');
    assert.match(formatted, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  await t.test('2. getElectionSystemStatus handles uninitialized empty schedule without reporting false active/ended state', () => {
    const status = getElectionSystemStatus({
      maintenanceMode: false,
      isVotingOpen: true,
      startTime: '',
      endTime: '',
    });

    assert.strictEqual(status.isOperational, false);
    assert.strictEqual(status.scheduleCardText, 'Memuat Jadwal...');
  });

  await t.test('3. getElectionSystemStatus reflects scheduled, active, ended, closed, and maintenance states accurately', () => {
    const now = Date.now();
    const past2h = new Date(now - 2 * 3600_000).toISOString();
    const past1h = new Date(now - 1 * 3600_000).toISOString();
    const future1h = new Date(now + 1 * 3600_000).toISOString();
    const future2h = new Date(now + 2 * 3600_000).toISOString();

    assert.strictEqual(
      getElectionSystemStatus({
        maintenanceMode: true,
        isVotingOpen: true,
        startTime: past1h,
        endTime: future1h,
      }).shortLabel,
      'Pemeliharaan'
    );

    assert.strictEqual(
      getElectionSystemStatus({
        maintenanceMode: false,
        isVotingOpen: false,
        startTime: past1h,
        endTime: future1h,
      }).shortLabel,
      'Ditutup Panitia'
    );

    assert.strictEqual(
      getElectionSystemStatus({
        maintenanceMode: false,
        isVotingOpen: true,
        startTime: future1h,
        endTime: future2h,
      }).shortLabel,
      'Belum Dimulai'
    );

    assert.strictEqual(
      getElectionSystemStatus({
        maintenanceMode: false,
        isVotingOpen: true,
        startTime: past2h,
        endTime: past1h,
      }).shortLabel,
      'Telah Berakhir'
    );

    const active = getElectionSystemStatus({
      maintenanceMode: false,
      isVotingOpen: true,
      startTime: past1h,
      endTime: future1h,
    });
    assert.strictEqual(active.isOperational, true);
    assert.strictEqual(active.shortLabel, 'Sedang Berlangsung');
  });

  await t.test('4. Dev election settings store persists start_time and end_time updates cleanly', () => {
    const orig = { ...getDevElectionSettings() };
    try {
      const nextStart = '2026-11-20T01:00:00.000Z';
      const nextEnd = '2026-11-20T09:00:00.000Z';
      const updated = updateDevElectionSettings({
        start_time: nextStart,
        end_time: nextEnd,
      });
      assert.strictEqual(updated.start_time, nextStart);
      assert.strictEqual(updated.end_time, nextEnd);
      assert.strictEqual(getDevElectionSettings().start_time, nextStart);
      assert.strictEqual(getDevElectionSettings().end_time, nextEnd);
    } finally {
      updateDevElectionSettings(orig);
    }
  });
});
