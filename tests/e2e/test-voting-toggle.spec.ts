import { test, expect } from '@playwright/test';

test.describe('Superadmin Voting & Maintenance Toggle Modal and Persistence', () => {
  test('both voting and maintenance toggles open confirmation modals and persist across page navigation', async ({ page }) => {
    // 1. Login sebagai Superadmin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Superadmin' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Buka tab "Pengaturan Pemilihan"
    await page.locator('button', { hasText: 'Pengaturan Pemilihan' }).click();
    await expect(page.locator('h1')).toContainText('Pengaturan Pemilihan');

    const votingSwitch = page.locator('button[role="switch"][aria-label="Buka Pemungutan Suara"]');
    const maintenanceSwitch = page.locator('button[role="switch"][aria-label="Mode Pemeliharaan Darurat"]');

    // Pastikan sakelar terlihat
    await expect(votingSwitch).toBeVisible();
    await expect(maintenanceSwitch).toBeVisible();

    // --- TEST 1: Toggle Sakelar Buka Pemungutan Suara ---
    const initialVotingChecked = await votingSwitch.getAttribute('aria-checked');
    await votingSwitch.click();

    const modalTitle = page.locator('#toggle-modal-title');
    await expect(modalTitle).toBeVisible();
    await page.locator('button', { hasText: 'Konfirmasi & Simpan' }).click();
    await expect(modalTitle).not.toBeVisible();
    await expect(page.locator('body')).toContainText('Pengaturan jadwal dan bilik suara berhasil diperbarui.');

    const newVotingChecked = initialVotingChecked === 'true' ? 'false' : 'true';
    await expect(votingSwitch).toHaveAttribute('aria-checked', newVotingChecked);

    // Navigasi ke tab lain dan kembali untuk membuktikan persistensi
    await page.locator('button', { hasText: 'Overview & Partisipasi' }).click();
    await expect(page.locator('h1')).toContainText('Bilik Suara Digital Pemira HMIF');
    await page.locator('button', { hasText: 'Pengaturan Pemilihan' }).click();
    await expect(votingSwitch).toHaveAttribute('aria-checked', newVotingChecked);

    // Kembalikan status voting switch ke semula
    await votingSwitch.click();
    await expect(modalTitle).toBeVisible();
    await page.locator('button', { hasText: 'Konfirmasi & Simpan' }).click();
    await expect(modalTitle).not.toBeVisible();
    await expect(votingSwitch).toHaveAttribute('aria-checked', initialVotingChecked ?? 'true');

    // --- TEST 2: Toggle Sakelar Mode Pemeliharaan Darurat ---
    const initialMaintChecked = await maintenanceSwitch.getAttribute('aria-checked');
    await maintenanceSwitch.click();
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toContainText('Mode Pemeliharaan Darurat');
    await page.locator('button', { hasText: 'Konfirmasi & Simpan' }).click();
    await expect(modalTitle).not.toBeVisible();

    const newMaintChecked = initialMaintChecked === 'true' ? 'false' : 'true';
    await expect(maintenanceSwitch).toHaveAttribute('aria-checked', newMaintChecked);

    // Navigasi dan kembali
    await page.locator('button', { hasText: 'Overview & Partisipasi' }).click();
    await page.locator('button', { hasText: 'Pengaturan Pemilihan' }).click();
    await expect(maintenanceSwitch).toHaveAttribute('aria-checked', newMaintChecked);

    // Kembalikan maintenance switch ke semula
    await maintenanceSwitch.click();
    await expect(modalTitle).toBeVisible();
    await page.locator('button', { hasText: 'Konfirmasi & Simpan' }).click();
    await expect(modalTitle).not.toBeVisible();
    await expect(maintenanceSwitch).toHaveAttribute('aria-checked', initialMaintChecked ?? 'false');
  });
});
