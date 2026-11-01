import { test, expect } from '@playwright/test';

test.describe('Authentication & Route Protection (RBAC) E2E Tests', () => {
  test('Unauthenticated user is redirected to /login when accessing protected routes', async ({ page }) => {
    // 1. Try accessing /vote without session
    await page.goto('/vote');
    await expect(page).toHaveURL(/\/login/);

    // 2. Try accessing /admin/dashboard without session
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Voter can log in via dev mock and is routed to /vote', async ({ page }) => {
    await page.goto('/login');

    // Expand dev mock drawer
    const devDrawerButton = page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' });
    await expect(devDrawerButton).toBeVisible();
    await devDrawerButton.click();

    // Select voter account: Ahmad Rizky Pratama
    const voterButton = page.locator('button', { hasText: 'Ahmad Rizky Pratama' });
    await expect(voterButton).toBeVisible();
    await voterButton.click();

    // Should redirect to /vote
    await expect(page).toHaveURL(/\/vote/);
    await expect(page.locator('h1')).toContainText('Surat Suara Pemilihan');
  });

  test('Voter cannot access admin dashboard and is restricted', async ({ page }) => {
    await page.goto('/login');

    // Log in as voter
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);

    // Try navigating to /admin/dashboard
    await page.goto('/admin/dashboard');

    // Voter must not have access to admin dashboard (redirected to /login or /vote)
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });

  test('KPR Admin can log in and access /admin/dashboard', async ({ page }) => {
    await page.goto('/login');

    // Expand dev mock drawer
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();

    // Select admin account: Ketua Panitia KPR
    const adminButton = page.locator('button', { hasText: 'Ketua Panitia KPR' });
    await expect(adminButton).toBeVisible();
    await adminButton.click();

    // Should redirect to /admin/dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('aside')).toContainText('PEMIRA HMIF');
    await expect(page.locator('body')).toContainText('Overview & Partisipasi');
  });
});
