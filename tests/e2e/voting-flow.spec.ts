import { test, expect } from '@playwright/test';

test.describe('Voting Chamber & Digital Receipt Journey E2E Tests', () => {
  test('Full voter journey: select candidate, confirm vote, and receive digital receipt', async ({ page }) => {
    // 1. Login as active eligible voter: Ahmad Rizky Pratama
    await page.goto('/login');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);

    // 2. Select Paslon 01
    const selectPaslon1Btn = page.getByRole('button', { name: 'Pilih Paslon 01' });
    await expect(selectPaslon1Btn).toBeVisible({ timeout: 10000 });
    await selectPaslon1Btn.click();

    // Bottom action bar should reflect the selection
    const continueButton = page.getByRole('button', { name: 'Konfirmasi Pilihan' });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // 3. Confirmation Modal Review
    const modalHeading = page.getByRole('heading', { name: 'Konfirmasi Pilihan' });
    await expect(modalHeading).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Pasangan Calon 01' })).toBeVisible();

    // 4. Confirm Submission
    const confirmSubmitButton = page.getByRole('button', { name: 'Ya, Kirim Suara' });
    await expect(confirmSubmitButton).toBeVisible();
    await confirmSubmitButton.click();

    // 5. Digital Receipt Page
    await expect(page).toHaveURL(/\/receipt/);
    await expect(page.getByRole('heading', { name: 'Suara Berhasil Dikirim' })).toBeVisible();
    await expect(page.locator('body')).toContainText('Token Bukti Pemilihan');
    await expect(page.locator('body')).toContainText('Dirahasiakan (LUBER)');
  });

  test('Voter who has already voted cannot re-enter /vote and is routed to /receipt', async ({ page }) => {
    // Login as Budi Santoso (mock user who has already voted)
    await page.goto('/login');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Budi Santoso' }).click();

    // Should immediately be sent to /receipt
    await expect(page).toHaveURL(/\/receipt/);
    await expect(page.getByRole('heading', { name: 'Suara Berhasil Dikirim' })).toBeVisible();

    // Attempting to manually navigate to /vote must redirect back to /receipt
    await page.goto('/vote');
    await expect(page).toHaveURL(/\/receipt/);
  });
});
