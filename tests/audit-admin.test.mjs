import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  getAllAdminUsers,
  addAdminUser,
  updateAdminRole,
  toggleAdminActive,
  deleteAdminUser,
  findAdminByEmail,
} from '../lib/admin/store.ts';
import {
  getAllAuditLogs,
  recordAuditLog,
  queryAuditLogs,
} from '../lib/audit/store.ts';

describe('Audit Trail & Admin Management Tests', () => {
  const DATA_DIR = path.join(process.cwd(), 'data');
  const AUDIT_STORE_PATH = path.join(DATA_DIR, 'dev-audit-logs.json');
  const ADMIN_STORE_PATH = path.join(DATA_DIR, 'dev-admins.json');

  before(() => {
    // Memastikan inisialisasi default store
    getAllAdminUsers();
    getAllAuditLogs();
  });

  test('Primary Superadmin is registered and protected in admin store', () => {
    const admins = getAllAdminUsers();
    const superAdmin = admins.find((a) => a.email === 'marzhendogalangs@gmail.com');
    assert.ok(superAdmin, 'Superadmin marzhendogalangs@gmail.com must exist');
    assert.strictEqual(superAdmin.role, 'super_admin');
    assert.strictEqual(superAdmin.is_active, true);

    // Primary Superadmin deletion must be blocked
    const delRes = deleteAdminUser(superAdmin.id);
    assert.strictEqual(delRes.success, false);
    assert.match(delRes.error || '', /Superadmin utama tidak dapat dihapus/i);
  });

  test('Admin User Store: CRUD & Email Duplication prevention', () => {
    const testEmail = `test-admin-${Date.now()}@student.telkomuniversity.ac.id`;
    
    // 1. Add new Admin
    const addRes = addAdminUser({
      name: 'Penguji Panitia KPR',
      email: testEmail,
      nim: '103012399999',
      role: 'kpr_admin',
    });
    assert.strictEqual(addRes.success, true);
    assert.ok(addRes.admin);
    assert.strictEqual(addRes.admin.role, 'kpr_admin');
    assert.strictEqual(addRes.admin.is_active, true);

    // 2. Duplicate email should be rejected
    const dupRes = addAdminUser({
      name: 'Penguji Duplikat',
      email: testEmail,
      role: 'auditor',
    });
    assert.strictEqual(dupRes.success, false);
    assert.match(dupRes.error || '', /sudah terdaftar/i);

    // 3. Update role
    const updateRes = updateAdminRole(addRes.admin.id, 'auditor');
    assert.strictEqual(updateRes.success, true);
    assert.strictEqual(updateRes.admin?.role, 'auditor');

    // 4. Toggle active status
    const toggleRes = toggleAdminActive(addRes.admin.id, false);
    assert.strictEqual(toggleRes.success, true);
    assert.strictEqual(toggleRes.admin?.is_active, false);

    // Inactive admin cannot be found by active email lookup
    const lookupInactive = findAdminByEmail(testEmail);
    assert.strictEqual(lookupInactive, null);

    // Toggle back to active
    toggleAdminActive(addRes.admin.id, true);
    const lookupActive = findAdminByEmail(testEmail);
    assert.ok(lookupActive);
    assert.strictEqual(lookupActive.email, testEmail);

    // 5. Delete admin
    const delRes = deleteAdminUser(addRes.admin.id);
    assert.strictEqual(delRes.success, true);
  });

  test('RBAC Invariant: Only super_admin has manage_admins permission', () => {
    const ROLE_PERMISSIONS = {
      kpr_admin: ['view_turnout', 'manage_dpt', 'manage_candidates', 'view_audit_logs'],
      auditor: ['view_turnout', 'view_audit_logs'],
      super_admin: ['view_turnout', 'manage_dpt', 'manage_candidates', 'view_audit_logs', 'manage_admins'],
    };

    assert.strictEqual(ROLE_PERMISSIONS.kpr_admin.includes('manage_admins'), false);
    assert.strictEqual(ROLE_PERMISSIONS.auditor.includes('manage_admins'), false);
    assert.strictEqual(ROLE_PERMISSIONS.super_admin.includes('manage_admins'), true);
  });

  test('Audit Log Store records, retrieves, and filters administrative actions', async () => {
    const testDesc = `Pengujian audit trail otomatis ${Date.now()}`;
    const newLog = await recordAuditLog({
      actorEmail: 'superadmin@system',
      actorName: 'Marzhendo Galang',
      actorRole: 'super_admin',
      action: 'ELECTION_SETTINGS_UPDATE',
      description: testDesc,
      ipAddress: '192.168.1.100',
      details: { test: true },
    });

    assert.ok(newLog.id);
    assert.strictEqual(newLog.action, 'ELECTION_SETTINGS_UPDATE');
    assert.strictEqual(newLog.description, testDesc);

    // Query with filter
    const queryRes = queryAuditLogs({
      action: 'ELECTION_SETTINGS_UPDATE',
      search: testDesc,
    });
    assert.ok(queryRes.logs.length >= 1);
    assert.strictEqual(queryRes.logs[0].id, newLog.id);
  });

  test('BALLOT SECRECY INVARIANT: Audit logs must never leak secret voter choices', () => {
    const logs = getAllAuditLogs();

    for (const log of logs) {
      if (log.details) {
        assert.strictEqual(
          'selected_candidate' in log.details,
          false,
          `Log ${log.id} violates ballot secrecy by containing selected_candidate`
        );
        assert.strictEqual(
          'voter_choice' in log.details,
          false,
          `Log ${log.id} violates ballot secrecy by containing voter_choice`
        );
      }
    }
  });
});
