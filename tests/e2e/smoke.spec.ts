import { test, expect } from '@playwright/test';

test.describe('E-Voting Basic Smoke Tests', () => {
  test('Landing page renders properly with branding and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Suaramu');
    await expect(page.locator('h1')).toContainText('Masa Depan HMIF');
    await expect(page.getByRole('link', { name: /Masuk ke Bilik Suara/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Buka Bilik Suara/i })).toBeVisible();
  });

  test('Login page renders PIN request form, updated copy, and campus email notice', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Masuk ke Bilik Suara' })).toBeVisible();
    await expect(page.locator('h1')).toContainText('Gunakan Hak Suaramu');
    await expect(page.locator('h1')).toContainText('Pemira HMIF 2026/2027');
    await expect(page.locator('button', { hasText: 'Kirim Kode PIN' })).toBeVisible();
    await expect(page.locator('body')).toContainText('Hak pilih divalidasi dengan Daftar Pemilih Tetap resmi.');
    await expect(page.locator('body')).not.toContainText('Daftar Pemilih Tetap (DPT) resmi.');
    await expect(page.locator('body')).toContainText('Telkom University');
  });
});
