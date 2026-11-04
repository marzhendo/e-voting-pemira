import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Pongo\\.gemini\\antigravity\\brain\\2ca3a9cb-a348-4d90-8017-41c0f169af70\\screenshots';
const DOCS_DIR = path.join(process.cwd(), 'docs', 'screenshots');

async function saveScreenshot(page: Page, filename: string, fullPage: boolean = true) {
  const file1 = path.join(DOCS_DIR, filename);
  const file2 = path.join(ARTIFACT_DIR, filename);

  await page.screenshot({ path: file1, fullPage });
  fs.copyFileSync(file1, file2);
  console.log(`Saved screenshot: ${filename}`);
}

test.describe('Documentation Screenshot Captures', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Capture all user and admin journey pages', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Masa Depan HMIF');
    await saveScreenshot(page, '01-landing-page.png', true);

    // 2. Login Page (Official Clean View with HMIF Logo)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("Kirim Kode PIN")')).toBeVisible();
    await saveScreenshot(page, '02-login-page.png', true);

    // 3. Voting Chamber (Bilik Suara)
    // Log in as active eligible voter: Ahmad Rizky Pratama
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Surat Suara Pemilihan');
    await page.waitForTimeout(500); // Wait for candidate layout to settle
    await saveScreenshot(page, '03-voting-chamber.png', true);

    // 4. Voting Selection & Confirmation Modal
    const selectBtn = page.getByRole('button', { name: 'Pilih Paslon 01' });
    await selectBtn.click();
    const confirmBtn = page.getByRole('button', { name: 'Konfirmasi Pilihan' });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await expect(page.getByRole('heading', { name: 'Konfirmasi Pilihan' })).toBeVisible();
    await page.waitForTimeout(300);
    // Viewport screenshot so modal with backdrop blur is centered
    await saveScreenshot(page, '04-voting-confirmation-modal.png', false);

    // 5. Submit Vote and capture Digital Receipt Page
    const submitVoteBtn = page.getByRole('button', { name: 'Kunci Suara' });
    await submitVoteBtn.click();
    await expect(page).toHaveURL(/\/receipt/);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Suara Tercatat' })).toBeVisible();
    await page.waitForTimeout(500);
    await saveScreenshot(page, '05-digital-receipt.png', true);

    // 6. Admin Dashboard - Overview Tab
    await page.goto('/login');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Bilik Suara Digital Pemira HMIF');
    await page.waitForTimeout(600);
    await saveScreenshot(page, '06-admin-dashboard-overview.png', true);

    // 7. Admin Dashboard - Kelola Pasangan Calon Tab
    await page.getByRole('button', { name: 'Kelola Pasangan Calon' }).click();
    await expect(page.locator('h1')).toContainText('Kelola Pasangan Calon');
    await page.waitForTimeout(500);
    await saveScreenshot(page, '07-admin-dashboard-candidates.png', true);

    // 8. Admin Dashboard - Manajemen DPT Tab
    await page.getByRole('button', { name: 'Manajemen DPT' }).click();
    await expect(page.locator('h1')).toContainText('Manajemen Daftar Pemilih Tetap');
    await page.waitForTimeout(500);
    await saveScreenshot(page, '08-admin-dashboard-dpt.png', true);

    // 9. Admin Dashboard - Rekapitulasi Suara (Tally) Tab
    await page.getByRole('button', { name: 'Rekapitulasi Suara' }).click();
    await expect(page.locator('h1')).toContainText('Rekapitulasi Suara');
    await page.waitForTimeout(500);
    await saveScreenshot(page, '09-admin-dashboard-tally.png', true);

    // 10. Admin Dashboard - Pengaturan Pemilihan Tab
    await page.getByRole('button', { name: 'Pengaturan Pemilihan' }).click();
    await expect(page.locator('h1')).toContainText('Pengaturan Pemilihan');
    await page.waitForTimeout(500);
    await saveScreenshot(page, '10-admin-dashboard-settings.png', true);

    // 12. Admin Dashboard - Broadcast Email Tab
    await page.getByRole('button', { name: 'Broadcast Email' }).click();
    await expect(page.locator('h1')).toContainText('Broadcast Email Pemira HMIF');
    await page.waitForTimeout(600);
    await saveScreenshot(page, '12-admin-dashboard-broadcast-email.png', true);
  });

  test('Capture session expired modal', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);
    await page.goto('/vote?expired=true');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Sesi Bilik Suara Kedaluwarsa' })).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300);
    await saveScreenshot(page, '11-session-expired-modal.png', false);
  });

  test('Capture candidate detail and CV modal', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);

    const openDetailBtn = page.locator('button', { hasText: 'Detail Visi Misi & CV Paslon' }).first();
    await expect(openDetailBtn).toBeVisible({ timeout: 10000 });
    await openDetailBtn.click();
    await expect(page.locator('#candidate-detail-title')).toBeVisible();
    await page.waitForTimeout(400);
    await saveScreenshot(page, '13-candidate-detail-modal.png', false);
  });
});
