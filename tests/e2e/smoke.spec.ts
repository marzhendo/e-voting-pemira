import { test, expect } from '@playwright/test';

test.describe('E-Voting Basic Smoke Tests', () => {
  test('Landing page renders properly with branding and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Suaramu');
    await expect(page.locator('h1')).toContainText('Masa Depan HMIF');
    await expect(page.getByRole('link', { name: /Masuk dengan Akun Kampus/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bilik Suara/i })).toBeVisible();
  });

  test('Login page renders SSO prompt and campus domain notice', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Masuk ke Bilik Suara' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Masuk dengan Email Kampus' })).toBeVisible();
    await expect(page.locator('body')).toContainText('@student.telkomuniversity.ac.id');
  });
});
