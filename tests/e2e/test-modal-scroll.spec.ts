import { test, expect } from '@playwright/test';

test.describe('Modal Scroll & Body Lock Verification', () => {
  test('Vote confirmation modal locks body & html scroll and stays fixed', async ({ page }) => {
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await page.waitForURL('/vote');

    // Initially body is scrollable
    const initialOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(initialOverflow).toBe('');

    // Scroll page first before selecting candidate
    await page.evaluate(() => window.scrollTo(0, 400));

    // Select candidate
    await page.getByRole('button', { name: /Pilih Paslon 01/i }).click();

    // Click confirm button
    await page.getByRole('button', { name: /Konfirmasi Pilihan/i }).click();

    // Check modal is visible
    const modal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Konfirmasi Pilihan' });
    await expect(modal).toBeVisible();

    // Check bounding box: must be centered in viewport (top space approx equal to bottom space)
    const modalBox = await modal.locator('> div > div').boundingBox();
    expect(modalBox).not.toBeNull();
    if (modalBox) {
      expect(modalBox.y).toBeGreaterThan(0);
      const vp = page.viewportSize();
      if (vp) {
        const topSpace = modalBox.y;
        const bottomSpace = vp.height - (modalBox.y + modalBox.height);
        // Centered within reasonable rounding
        expect(Math.abs(topSpace - bottomSpace)).toBeLessThanOrEqual(20);
      }
    }

    // Scroll wheel on page while modal is open
    await page.mouse.wheel(0, 500);
    const boxAfterScroll = await modal.locator('> div > div').boundingBox();
    if (modalBox && boxAfterScroll) {
      expect(Math.abs(boxAfterScroll.y - modalBox.y)).toBeLessThanOrEqual(5);
    }

    // Check body & html overflow style are both strictly 'hidden'
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    const htmlOverflow = await page.evaluate(() => document.documentElement.style.overflow);
    expect(bodyOverflow).toBe('hidden');
    expect(htmlOverflow).toBe('hidden');

    // Close modal via "Ubah Pilihan"
    await page.getByRole('button', { name: /Ubah Pilihan/i }).click();
    await expect(modal).toBeHidden();

    // Verify scroll lock is released
    const releasedBodyOverflow = await page.evaluate(() => document.body.style.overflow);
    const releasedHtmlOverflow = await page.evaluate(() => document.documentElement.style.overflow);
    expect(releasedBodyOverflow).toBe('');
    expect(releasedHtmlOverflow).toBe('');
  });

  test('Admin broadcast email confirmation modal locks body & html scroll', async ({ page }) => {
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await page.waitForURL('/admin/dashboard');

    // Go to broadcast email tab
    await page.getByRole('button', { name: /Broadcast Email/i }).click();

    // Scroll to and click send broadcast button
    const broadcastBtn = page.getByRole('button', { name: /Kirim Broadcast Email/i });
    await broadcastBtn.scrollIntoViewIfNeeded();
    await broadcastBtn.click();

    // Check modal is visible
    const modal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Konfirmasi Broadcast Email' });
    await expect(modal).toBeVisible();

    // Verify modal is centered in viewport
    const modalBox = await modal.locator('> div > div').boundingBox();
    expect(modalBox).not.toBeNull();
    if (modalBox) {
      expect(modalBox.y).toBeGreaterThan(0);
      const vp = page.viewportSize();
      if (vp) {
        const topSpace = modalBox.y;
        const bottomSpace = vp.height - (modalBox.y + modalBox.height);
        expect(Math.abs(topSpace - bottomSpace)).toBeLessThanOrEqual(5);
      }
    }

    // Scroll wheel should not displace the modal
    await page.mouse.wheel(0, 500);
    const boxAfterScroll = await modal.locator('> div > div').boundingBox();
    if (modalBox && boxAfterScroll) {
      expect(Math.abs(boxAfterScroll.y - modalBox.y)).toBeLessThanOrEqual(5);
    }

    // Check body & html overflow style are both 'hidden'
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    const htmlOverflow = await page.evaluate(() => document.documentElement.style.overflow);
    expect(bodyOverflow).toBe('hidden');
    expect(htmlOverflow).toBe('hidden');

    // Dismiss modal via "Batal"
    await modal.getByRole('button', { name: /Batal/i }).click();
    await expect(modal).toBeHidden();

    // Verify scroll lock is released
    const releasedBodyOverflow = await page.evaluate(() => document.body.style.overflow);
    const releasedHtmlOverflow = await page.evaluate(() => document.documentElement.style.overflow);
    expect(releasedBodyOverflow).toBe('');
    expect(releasedHtmlOverflow).toBe('');
  });

  test('Candidate detail modal is vertically centered, does not cut off header, and locks scroll', async ({ page }) => {
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await page.waitForURL('/vote');

    // Scroll down the page first before opening modal
    await page.evaluate(() => window.scrollTo(0, 300));

    // Open Candidate Detail Modal
    await page.locator('button', { hasText: 'Detail Visi Misi & CV Paslon' }).first().click();

    // Verify modal dialog is visible
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verify header "Kembali ke Bilik Suara" is visible and not cut off
    const backBtn = dialog.locator('button', { hasText: 'Kembali ke Bilik Suara' });
    await expect(backBtn).toBeVisible();

    // Get bounding box of dialog inner container
    const dialogInner = dialog.locator('> div > div').first();
    const box = await dialogInner.boundingBox();

    // Verify top is >= 0 (not cut off at the top!) and vertically balanced
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeGreaterThanOrEqual(0);
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        const bottomSpace = viewportSize.height - (box.y + box.height);
        expect(Math.abs(box.y - bottomSpace)).toBeLessThanOrEqual(20);
      }
    }

    // Scroll wheel over the modal or overlay
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(100);

    // Dialog position must remain fixed and centered, not moved up
    const boxAfterScroll = await dialogInner.boundingBox();
    if (box && boxAfterScroll) {
      expect(Math.abs(boxAfterScroll.y - box.y)).toBeLessThanOrEqual(8);
    }
  });
});

