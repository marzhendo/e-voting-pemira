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

  test('Voter can request 6-digit PIN via NIM input and receives Step 2 verification form', async ({ page }) => {
    await page.goto('/login');

    // Input NIM of active unvoted student (Budi Santoso)
    const nimInput = page.locator('input#identifier');
    await expect(nimInput).toBeVisible();
    await nimInput.fill('103012300002');

    // Submit PIN request
    const requestBtn = page.locator('button', { hasText: 'Kirim Kode PIN' });
    await requestBtn.click();

    // Expect Step 2 PIN input to appear
    const pinInput = page.locator('input#pin');
    await expect(pinInput).toBeVisible({ timeout: 5000 });
    await expect(page.locator('body')).toContainText('Kode PIN 6-digit dikirim');
    await expect(page.locator('button', { hasText: 'Masuk ke Bilik Suara' })).toBeVisible();
  });
});
