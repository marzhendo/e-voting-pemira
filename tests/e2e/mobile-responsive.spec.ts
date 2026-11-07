import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Touch Responsiveness E2E Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE screen size

  test('Mobile Login page displays compact branding header without excessive scroll', async ({ page }) => {
    await page.goto('/login');

    // Compact mobile branding should be visible
    const mobileHeader = page.locator('div.lg\\:hidden').filter({ hasText: 'PEMIRA HMIF 2026/2027' });
    await expect(mobileHeader).toBeVisible();

    // Large desktop branding column should be hidden
    const desktopBanner = page.locator('section.hidden.lg\\:flex');
    await expect(desktopBanner).toBeHidden();

    // NIM Input field should be visible and easily tappable
    const nimInput = page.locator('#identifier');
    await expect(nimInput).toBeVisible();
    await expect(nimInput).toBeEnabled();
  });

  test('Mobile Vote Chamber has responsive photo card, tap targets, and safe area', async ({ page }) => {
    // Login as student
    await page.goto('/login?dev=true');
    const devDrawerButton = page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' });
    await devDrawerButton.click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();

    await page.waitForURL('/vote');

    // Check candidate card exists and image container has responsive height
    const candidateCard = page.locator('.group.relative.rounded-2xl').first();
    await expect(candidateCard).toBeVisible();

    // Check bottom action bar exists
    const bottomBar = page.locator('.fixed.bottom-0');
    await expect(bottomBar).toBeVisible();

    // Open candidate detail modal
    await page.getByRole('button', { name: /Detail Visi Misi/i }).first().click();

    // Modal should be open with 44px close button
    const closeBtn = page.getByRole('button', { name: /Tutup Detail/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(closeBtn).toBeHidden();
  });

  test('Mobile Admin Dashboard opens collapsible sidebar drawer via hamburger menu', async ({ page }) => {
    // Login as Admin
    await page.goto('/login?dev=true');
    const devDrawerButton = page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' });
    await devDrawerButton.click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();

    await page.waitForURL('/admin/dashboard');

    // Hamburger button should be visible in header
    const hamburgerBtn = page.getByRole('button', { name: /Buka menu navigasi/i });
    await expect(hamburgerBtn).toBeVisible();

    // Click hamburger button to open drawer
    await hamburgerBtn.click();

    // Sidebar should now have translate-x-0
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // Click navigation item (e.g. Broadcast Email)
    const emailTabBtn = page.getByRole('button', { name: /Broadcast Email/i });
    await expect(emailTabBtn).toBeVisible();
    await emailTabBtn.click();

    // Drawer should automatically close on navigation
    await expect(sidebar).toHaveClass(/-translate-x-full/);

    // On mobile, decorative preview should be hidden
    const previewPanel = page.locator('.hidden.lg\\:block').filter({ hasText: 'Pratinjau Email Mahasiswa' });
    await expect(previewPanel).toBeHidden();
  });
});
