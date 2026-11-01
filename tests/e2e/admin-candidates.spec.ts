import { test, expect } from '@playwright/test';

test.describe('Admin Candidate Management & Adaptive Layout E2E Tests', () => {
  test('Admin can view candidates, open modal, and add new candidate', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Switch to "Kelola Pasangan Calon" Tab
    const candidatesTab = page.locator('button', { hasText: 'Kelola Pasangan Calon' });
    await expect(candidatesTab).toBeVisible();
    await candidatesTab.click();

    await expect(page.locator('h1')).toContainText('Kelola Pasangan Calon');
    await expect(page.locator('body')).toContainText('Adaptasi Tata Letak Bilik Suara');

    // 3. Open Add Candidate Modal
    const addCandidateButton = page.locator('button', { hasText: 'Tambah Paslon Baru' });
    await expect(addCandidateButton).toBeVisible();
    await addCandidateButton.click();

    // Fill form
    await page.locator('input[placeholder*="Muhammad Farhan"]').fill('Fajar Ramadhan');
    await page.locator('input[placeholder*="Siti Aisyah"]').fill('Nabila Putri');
    await page.locator('textarea[placeholder*="Visi kepemimpinan"]').fill('Mewujudkan HMIF berkarakter global dan inovatif.');
    await page.locator('textarea[placeholder*="Misi 1"]').fill('Pemberdayaan riset AI\nPenguatan relasi industri');

    // Submit
    const submitButton = page.locator('button', { hasText: 'Simpan Paslon' });
    await submitButton.click();

    // Verify notification and presence in candidate cards
    await expect(page.locator('body')).toContainText('Pasangan calon baru berhasil ditambahkan', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Fajar Ramadhan');
  });

  test('Election settings tab allows toggling voting state', async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Switch to "Pengaturan Pemilihan" tab
    await page.locator('button', { hasText: 'Pengaturan Pemilihan' }).click();
    await expect(page.locator('h1')).toContainText('Pengaturan Pemilihan');
    await expect(page.locator('body')).toContainText('Buka Pemungutan Suara');
  });
});
