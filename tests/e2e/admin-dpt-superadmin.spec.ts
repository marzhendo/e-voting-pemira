import { test, expect } from '@playwright/test';

test.describe('Superadmin DPT Management E2E Tests', () => {
  test('Superadmin can see delete actions, batch selection bar, and Reset DPT modal', async ({ page }) => {
    // 1. Login as Superadmin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Marzhendo Galang (Superadmin)' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Switch to "Manajemen DPT" Tab
    const dptTab = page.getByRole('button', { name: 'Manajemen DPT' });
    await expect(dptTab).toBeVisible();
    await dptTab.click();

    // 3. Verify Superadmin controls are visible
    // "Reset DPT" button in toolbar
    const resetDptBtn = page.locator('button', { hasText: 'Reset DPT' });
    await expect(resetDptBtn).toBeVisible();

    // DPT Table header should include checkbox and "Aksi" column
    const dptTable = page.locator('main table').first();
    await expect(dptTable).toBeVisible();
    await expect(dptTable).toContainText('Aksi');

    // 4. Test Reset DPT Modal
    await resetDptBtn.click();
    const modalHeading = page.locator('h3', { hasText: 'Reset & Kosongkan DPT' });
    await expect(modalHeading).toBeVisible();

    // Confirm button should be disabled initially
    const confirmResetBtn = page.locator('button', { hasText: 'Eksekusi Reset DPT' });
    await expect(confirmResetBtn).toBeDisabled();

    // Type incorrect phrase
    const confirmInput = page.locator('input[placeholder="RESET DPT"]');
    await confirmInput.fill('SALAH');
    await expect(confirmResetBtn).toBeDisabled();

    // Type correct phrase
    await confirmInput.fill('RESET DPT');
    await expect(confirmResetBtn).toBeEnabled();

    // Cancel modal
    const cancelModalBtn = page.locator('div[role="dialog"]').locator('button', { hasText: 'Batal' });
    await cancelModalBtn.click();
    await expect(modalHeading).not.toBeVisible();

    // 5. Test Selective Batch Selection
    // Find row checkboxes in table body
    const voterCheckboxes = page.locator('main table tbody input[type="checkbox"]');
    const count = await voterCheckboxes.count();
    expect(count).toBeGreaterThan(0);

    // Click the first available checkbox
    await voterCheckboxes.first().click();

    // Floating batch bar should appear
    const batchBar = page.locator('text=pemilih dipilih');
    await expect(batchBar).toBeVisible();
    await expect(page.locator('button', { hasText: 'Hapus Terpilih' })).toBeVisible();

    // Click "Batal" on batch bar
    const cancelSelectBtn = page.locator('div', { hasText: 'pemilih dipilih' }).locator('button', { hasText: 'Batal' });
    await cancelSelectBtn.click();
    await expect(batchBar).not.toBeVisible();
  });

  test('Regular admin (Ketua Panitia KPR) cannot see delete actions or Reset DPT button', async ({ page }) => {
    // 1. Login as Ketua Panitia KPR (Admin biasa)
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Switch to "Manajemen DPT" Tab
    const dptTab = page.getByRole('button', { name: 'Manajemen DPT' });
    await expect(dptTab).toBeVisible();
    await dptTab.click();

    // 3. Ensure "Reset DPT" is NOT visible
    await expect(page.locator('button', { hasText: 'Reset DPT' })).not.toBeVisible();

    // 4. Ensure "Aksi" column header is NOT visible
    const dptTable = page.locator('main table').first();
    await expect(dptTable).toBeVisible();
    await expect(dptTable.locator('th', { hasText: 'Aksi' })).not.toBeVisible();

    // 5. Ensure row checkboxes are NOT present in table body
    await expect(page.locator('main table tbody input[type="checkbox"]')).toHaveCount(0);
  });
});
