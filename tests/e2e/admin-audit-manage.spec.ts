import { test, expect } from '@playwright/test';

test.describe('Audit Trail & Admin Management E2E Tests', () => {
  test('Admin can view Audit Trail log entries and filter by category', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Switch to "Audit Log" Tab
    const auditTab = page.locator('button', { hasText: 'Audit Log' });
    await expect(auditTab).toBeVisible();
    await auditTab.click();

    await expect(page.locator('body')).toContainText('Audit Trail & Rekam Jejak Sistem');
    await expect(page.locator('body')).toContainText('Total Log');

    // 3. Verify audit log table is populated inside main
    const auditTable = page.locator('main table');
    await expect(auditTable).toBeVisible();
    await expect(auditTable).toContainText('Waktu');
    await expect(auditTable).toContainText('Pelaksana / Admin');
    await expect(auditTable).toContainText('Kategori Aksi');

    // 4. Test searching in audit log
    const searchInput = page.locator('input[placeholder*="Cari pelaksana"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Marzhendo');
    await page.waitForTimeout(600);

    // Verify search results filter
    await expect(page.locator('main table')).toContainText('Marzhendo');
  });

  test('Superadmin can view Kelola Admin tab and add a new administrator', async ({ page }) => {
    // 1. Login as Superadmin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Marzhendo Galang (Superadmin)' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Switch to "Kelola Admin" Tab
    const adminsTab = page.locator('button', { hasText: 'Kelola Admin' });
    await expect(adminsTab).toBeVisible();
    await adminsTab.click();

    await expect(page.locator('body')).toContainText('Manajemen Administrator & Panitia');
    await expect(page.locator('main table')).toContainText('marzhendogalangs@gmail.com');

    // 3. Open Tambah Admin Baru Modal
    const addAdminBtn = page.locator('button', { hasText: 'Tambah Admin Baru' });
    await expect(addAdminBtn).toBeVisible();
    await addAdminBtn.click();

    await expect(page.locator('h3', { hasText: 'Tambah Administrator Baru' })).toBeVisible();

    // 4. Fill form
    const uniqueEmail = `admin-test-${Date.now()}@student.telkomuniversity.ac.id`;
    await page.locator('input[placeholder*="Dimas Wahyu Pratama"]').fill('Dimas Wahyu Pratama');
    await page.locator('input[placeholder*="dimas@student.telkomuniversity.ac.id"]').fill(uniqueEmail);
    await page.locator('input[placeholder*="103012300088"]').fill('103012300088');

    // Submit
    const submitBtn = page.locator('button', { hasText: 'Simpan Administrator' });
    await submitBtn.click();

    // 5. Verify success and appearance in table
    await expect(page.locator('body')).toContainText('berhasil ditambahkan', { timeout: 10000 });
    await expect(page.locator('main table')).toContainText(uniqueEmail);
  });
});
