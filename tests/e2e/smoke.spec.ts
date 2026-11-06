import { test, expect } from '@playwright/test';

test.describe('E-Voting Basic Smoke Tests', () => {
  test('Landing page renders properly with branding and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Satu Suara');
    await expect(page.locator('h1')).toContainText('Bawa Perubahan untuk Informatika');
    await expect(page.getByRole('link', { name: /Masuk ke Bilik Suara/i })).toBeVisible();
  });

  test('Login page renders PIN request form, updated copy, and campus email notice', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Masuk ke Bilik Suara' })).toBeVisible();
    await expect(page.locator('h1')).toContainText('Waktunya memilih');
    await expect(page.locator('body')).toContainText('Pemilihan Chairman & Vice Chairman HMIF');
    await expect(page.locator('button', { hasText: 'Kirim Kode PIN' })).toBeVisible();
    await expect(page.locator('body')).toContainText('terdaftar di DPT');
    await expect(page.locator('body')).not.toContainText('Daftar Pemilih Tetap (DPT) resmi.');
    await expect(page.locator('body')).toContainText('Telkom University');
  });
});
