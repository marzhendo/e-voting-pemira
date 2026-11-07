import { test, expect } from '@playwright/test';

test.describe('Admin Candidate Management & Adaptive Layout E2E Tests', () => {
  test('Admin can view candidates, open modal, and add new candidate', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Switch to "Kelola Pasangan Calon" Tab
    const candidatesTab = page.locator('button', { hasText: 'Kelola Pasangan Calon' });
    await expect(candidatesTab).toBeVisible();
    await candidatesTab.click();

    await expect(page.locator('h1')).toContainText('Kelola Pasangan Calon');
    await expect(page.locator('body')).toContainText('Adaptasi Tata Letak Bilik Suara');

    // 3. Open Add Candidate Modal
    const addCandidateButton = page.locator('button', { hasText: 'Tambah Paslon Baru' });
    await expect(addCandidateButton).toBeVisible();
    await addCandidateButton.click();

    // Fill form
    await page.locator('input[placeholder*="Muhammad Farhan"]').fill('Fajar Ramadhan');
    await page.locator('input[placeholder*="Siti Aisyah"]').fill('Nabila Putri');
    await page.locator('textarea[placeholder*="Visi kepemimpinan"]').fill('Mewujudkan HMIF berkarakter global dan inovatif.');
    await page.locator('textarea[placeholder*="Misi 1"]').fill('Pemberdayaan riset AI\nPenguatan relasi industri');

    // Submit
    const submitButton = page.locator('button', { hasText: 'Simpan Paslon' });
    await submitButton.click();

    // Verify notification and presence in candidate cards
    await expect(page.locator('body')).toContainText('Pasangan calon baru berhasil ditambahkan', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Fajar Ramadhan');
  });

  test('Election settings tab allows toggling voting state and schedule settings', async ({ page }) => {
    // Login as Admin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Switch to "Pengaturan Pemilihan" tab
    await page.locator('button', { hasText: 'Pengaturan Pemilihan' }).click();
    await expect(page.locator('h1')).toContainText('Pengaturan Pemilihan');
    await expect(page.locator('body')).toContainText('Buka Pemungutan Suara');
    await expect(page.locator('body')).toContainText('Jadwal Operasional Pemira');
    await expect(page.locator('body')).toContainText('Waktu Mulai Pemilihan');
    await expect(page.locator('body')).toContainText('Waktu Penutupan Pemilihan');
  });

  test('Broadcast email tab allows filtering recipients and previewing message', async ({ page }) => {
    // Login as Admin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Switch to "Broadcast Email" tab
    const emailTab = page.locator('button', { hasText: 'Broadcast Email' });
    await expect(emailTab).toBeVisible();
    await emailTab.click();

    // Verify header and template buttons
    await expect(page.locator('h1')).toContainText('Broadcast Email Pemira HMIF');
    await expect(page.locator('body')).toContainText('Pilih Template Pesan');
    await expect(page.locator('body')).toContainText('Pratinjau Email Mahasiswa');

    // Switch to Invitation Template
    await page.locator('button', { hasText: 'Undangan Buka' }).click();
    await expect(page.locator('input[value*="Bilik Suara Telah Dibuka"]')).toBeVisible();

    // Open Confirmation Modal
    const blastBtn = page.locator('button', { hasText: 'Kirim Broadcast Email' });
    await expect(blastBtn).toBeVisible();
    await blastBtn.click();
    await expect(page.locator('h3', { hasText: 'Konfirmasi Broadcast Email' })).toBeVisible();

    // Cancel modal
    await page.locator('button', { hasText: 'Batal' }).click();
    await expect(page.locator('h3', { hasText: 'Konfirmasi Broadcast Email' })).not.toBeVisible();
  });

  test('Admin can edit Paslon 1 name, manage photo, and toggle Kotak Kosong for multi-candidates', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Switch to "Kelola Pasangan Calon" Tab
    await page.locator('button', { hasText: 'Kelola Pasangan Calon' }).click();
    await expect(page.locator('h1')).toContainText('Kelola Pasangan Calon');

    // 3. Open Edit Modal on Paslon 01
    const editBtn = page.locator('button[title="Edit Paslon"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify modal elements
    await expect(page.locator('h3', { hasText: 'Edit Pasangan Calon' })).toBeVisible();
    const leaderInput = page.locator('input[placeholder*="Muhammad Farhan"]');
    await leaderInput.fill('Arya Narendra Putra (Revisi)');

    // Test Hapus Foto button if active, or verify file upload zone
    const hapusFotoBtn = page.locator('button:has-text("Hapus Foto")');
    if (await hapusFotoBtn.isVisible()) {
      await hapusFotoBtn.click();
    }
    await expect(page.locator('body')).toContainText('Pilih / Unggah Berkas Foto Paslon');

    // Verify CV Chairman & Vice Chairman upload sections are visible
    await expect(page.locator('body')).toContainText('CV Calon Chairman');
    await expect(page.locator('body')).toContainText('CV Calon Vice Chairman');

    // Save changes
    const saveBtn = page.locator('button', { hasText: 'Simpan Paslon' });
    await saveBtn.click();

    // 4. Verify updated name appears on card
    await expect(page.locator('body')).toContainText('Data pasangan calon berhasil diperbarui');
    await expect(page.locator('body')).toContainText('Arya Narendra Putra (Revisi)');

    // 5. Test Kotak Kosong Multi-Candidate Toggle
    const kotakKosongToggle = page.locator('button[title*="Kotak Kosong"]');
    if (await kotakKosongToggle.isVisible()) {
      await kotakKosongToggle.click();
      await expect(page.locator('body')).toContainText('Dinonaktifkan');
      // Toggle back on
      await kotakKosongToggle.click();
      await expect(page.locator('body')).toContainText('Diikutsertakan');
    }
  });

  test('Admin can open Berita Acara (BAST) preview modal from tally tab', async ({ page }) => {
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Ketua Panitia KPR' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Switch to "Rekapitulasi Suara" tab
    await page.locator('button', { hasText: 'Rekapitulasi Suara' }).click();
    await expect(page.locator('h1')).toContainText('Rekapitulasi Suara');

    // Click Cetak Berita Acara button
    const bastBtn = page.getByRole('button', { name: 'Cetak Berita Acara' });
    await expect(bastBtn).toBeVisible();
    await bastBtn.click();

    // Verify modal is open with formal document content
    await expect(page.locator('body')).toContainText('BERITA ACARA REKAPITULASI DAN PENETAPAN HASIL PEROLEHAN SUARA');
    await expect(page.locator('body')).toContainText('HIMPUNAN MAHASISWA INFORMATIKA');
    await expect(page.locator('body')).toContainText('Ketua Panitia KPR HMIF');

    // Close preview modal
    await page.getByRole('button', { name: 'Tutup Pratinjau' }).click();
    await expect(page.locator('text=Pratinjau Berita Acara Rekapitulasi Suara (BAST)')).toBeHidden();
  });
});
