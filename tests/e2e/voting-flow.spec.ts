import { test, expect } from '@playwright/test';

test.describe('Voting Chamber & Digital Receipt Journey E2E Tests', () => {
  test('Full voter journey: select candidate, confirm vote, and receive digital receipt', async ({ page }) => {
    // 1. Login as active eligible voter: Ahmad Rizky Pratama
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);

    // 2. Select Paslon 01
    const selectPaslon1Btn = page.getByRole('button', { name: 'Pilih Paslon 01' });
    await expect(selectPaslon1Btn).toBeVisible({ timeout: 10000 });
    await selectPaslon1Btn.click();

    // Bottom action bar should reflect the selection
    const continueButton = page.getByRole('button', { name: 'Konfirmasi Pilihan' });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // 3. Confirmation Modal Review
    const modalHeading = page.getByRole('heading', { name: 'Konfirmasi Pilihan' });
    await expect(modalHeading).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Pasangan Calon 01' })).toBeVisible();

    // 4. Confirm Submission
    const confirmSubmitButton = page.getByRole('button', { name: 'Kunci Suara' });
    await expect(confirmSubmitButton).toBeVisible();
    await confirmSubmitButton.click();

    // 5. Digital Receipt Page
    await expect(page).toHaveURL(/\/receipt/);
    await expect(page.getByRole('heading', { name: 'Suara Tercatat' })).toBeVisible();
    await expect(page.locator('body')).toContainText('Token Bukti Pemilihan');
    await expect(page.locator('body')).toContainText('Rahasia (Asas Luber)');

    // 6. Test Receipt Verification button
    const verifyReceiptBtn = page.getByRole('button', { name: /Cek Keabsahan Bukti Pemilihan/i });
    await expect(verifyReceiptBtn).toBeVisible();
    await verifyReceiptBtn.click();
    await expect(page.locator('body')).toContainText('Tanda terima sah dan terverifikasi');
  });

  test('Voter who has already voted cannot re-enter /vote and is routed to /receipt', async ({ page }) => {
    // Login as Budi Santoso (mock user who has already voted)
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Budi Santoso' }).click();

    // Should immediately be sent to /receipt
    await expect(page).toHaveURL(/\/receipt/);
    await expect(page.getByRole('heading', { name: 'Suara Tercatat' })).toBeVisible();

    // Attempting to manually navigate to /vote must redirect back to /receipt
    await page.goto('/vote');
    await expect(page).toHaveURL(/\/receipt/);
  });

  test('Session expiration popup modal triggers when timer expires and redirects to /login', async ({ page }) => {
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);

    // Navigate to /vote with a 2-second timeout to test the live interval countdown trigger
    await page.goto('/vote?timeout=2');
    await page.waitForLoadState('networkidle');

    // Wait for timer to naturally count down (2 seconds) and trigger the popup modal
    const modalHeading = page.getByRole('heading', { name: 'Sesi Bilik Suara Kedaluwarsa' });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Hak Suara Anda Tetap Aman')).toBeVisible();

    // Verify clicking "Masuk Kembali ke Bilik Suara" redirects voter to /login
    const redirectBtn = page.getByRole('button', { name: /Masuk Kembali ke Bilik Suara/i });
    await expect(redirectBtn).toBeVisible();
    await redirectBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Voter can open candidate detail modal to inspect vision & mission and access separate Chairman & Vice Chairman CV download buttons', async ({ page }) => {
    // 1. Login as Ahmad Rizky Pratama
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ahmad Rizky Pratama' }).click();
    await expect(page).toHaveURL(/\/vote/);

    // 2. Click "Detail Visi Misi & CV Paslon" on Paslon 01
    const openDetailBtn = page.locator('button', { hasText: 'Detail Visi Misi & CV Paslon' }).first();
    await expect(openDetailBtn).toBeVisible({ timeout: 10000 });
    await openDetailBtn.click();

    // 3. Detail Modal should appear with candidate profile
    const detailTitle = page.locator('#candidate-detail-title');
    await expect(detailTitle).toBeVisible();
    await expect(detailTitle).toContainText('Arya Narendra Putra');
    await expect(detailTitle).toContainText('Rayhan Al-Fayeed');

    // 4. Verify separate CV download buttons for Chairman and Vice Chairman
    const downloadChairmanBtn = page.getByRole('link', { name: /Unduh CV Chairman/i });
    const downloadViceChairmanBtn = page.getByRole('link', { name: /Unduh CV Vice Chairman/i });

    await expect(downloadChairmanBtn).toBeVisible();
    await expect(downloadViceChairmanBtn).toBeVisible();

    // Verify both buttons point to distinct, separated CV files
    const chairmanHref = await downloadChairmanBtn.getAttribute('href');
    const viceHref = await downloadViceChairmanBtn.getAttribute('href');
    expect(chairmanHref).toBeTruthy();
    expect(viceHref).toBeTruthy();
    expect(chairmanHref).not.toEqual(viceHref);

    // 5. Verify Visi & Misi sections
    await expect(page.locator('text=Visi Kepengurusan 2026/2027')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Misi', { exact: true })).toBeVisible();

    // 6. Select candidate directly from the detail modal
    const selectFromModalBtn = page.getByRole('dialog').getByRole('button', { name: /Pilih Paslon 01/i });
    await expect(selectFromModalBtn).toBeVisible();
    await selectFromModalBtn.click();

    // 7. Modal closes, and Paslon 01 is selected in the main chamber
    await expect(page.locator('#candidate-detail-title')).not.toBeVisible();
    const confirmVoteBtn = page.getByRole('button', { name: 'Konfirmasi Pilihan' });
    await expect(confirmVoteBtn).toBeEnabled();
  });
});
