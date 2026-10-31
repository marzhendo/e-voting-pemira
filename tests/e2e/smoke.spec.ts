import { test, expect } from '@playwright/test';

test.describe('E-Voting Basic Smoke Test', () => {
  test('Landing page renders properly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('E-Voting Pemira HMIF');
  });

  test('Login page renders SSO prompt', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button')).toContainText('Masuk dengan Akun Kampus');
  });
});
