import { test, expect } from '@playwright/test';

test.describe('Fase 3: Export Tally, Audit Trail, and BAST Public Verification Portal', () => {
  test('1. Admin Dashboard renders Tally Export and Audit Log Export buttons with BAST QR Code', async ({ page }) => {
    // 1. Login as Superadmin
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Marzhendo Galang (Superadmin)' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 2. Masuk ke Tab Rekapitulasi Suara
    const tallyTab = page.locator('button', { hasText: 'Rekapitulasi Suara' });
    await expect(tallyTab).toBeVisible();
    await tallyTab.click();

    await expect(page.locator('h1', { hasText: 'Rekapitulasi Suara' })).toBeVisible();

    // Verifikasi tombol Unduh CSV
    const tallyCsvBtn = page.locator('a', { hasText: 'Unduh CSV' });
    await expect(tallyCsvBtn).toBeVisible();
    await expect(tallyCsvBtn).toHaveAttribute('href', '/api/admin/tally/export');

    // Buka Modal Cetak Berita Acara (BAST)
    const bastBtn = page.locator('button', { hasText: 'Cetak Berita Acara' });
    await expect(bastBtn).toBeVisible();
    await bastBtn.click();

    await expect(page.locator('body')).toContainText('BERITA ACARA REKAPITULASI DAN PENETAPAN HASIL');
    await expect(page.locator('body')).toContainText('Integritas Terverifikasi Kriptografis');
    await expect(page.locator('body')).toContainText('SHA-256 Digital Signature:');

    // Tutup modal BAST via tombol Tutup
    const closeBastBtn = page.locator('button', { hasText: 'Tutup' }).first();
    await expect(closeBastBtn).toBeVisible();
    await closeBastBtn.click();

    // Pastikan modal tertutup
    await expect(page.locator('text=Pratinjau Berita Acara Rekapitulasi Suara (BAST)')).toBeHidden();

    // 3. Masuk ke Tab Audit Log
    const auditTab = page.locator('button', { hasText: 'Audit Log' });
    await expect(auditTab).toBeVisible();
    await auditTab.click();

    await expect(page.locator('body')).toContainText('Audit Trail & Rekam Jejak Sistem');

    // Verifikasi tombol Ekspor Log (CSV)
    const auditCsvBtn = page.locator('a', { hasText: 'Ekspor Log (CSV)' });
    await expect(auditCsvBtn).toBeVisible();
    const href = await auditCsvBtn.getAttribute('href');
    expect(href).toContain('/api/admin/audit-logs/export');
  });

  test('2. Tally CSV and Audit Log CSV endpoints return compliant files', async ({ page }) => {
    // Login as Superadmin first to establish session in page context
    await page.goto('/login?dev=true');
    await page.locator('button', { hasText: 'Mode Uji Coba Cepat (Dev)' }).click();
    await page.locator('button', { hasText: 'Marzhendo Galang (Superadmin)' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Unduh Tally CSV
    const tallyRes = await page.request.get('/api/admin/tally/export');
    expect(tallyRes.status()).toBe(200);
    expect(tallyRes.headers()['content-type']).toContain('text/csv');
    expect(tallyRes.headers()['content-disposition']).toContain('Rekapitulasi-Suara-Pemira-HMIF');

    const tallyBody = await tallyRes.text();
    expect(tallyBody).toContain('LAPORAN RESMI REKAPITULASI SUARA');
    expect(tallyBody).toContain('Total Daftar Pemilih Tetap (DPT)');
    expect(tallyBody).toContain('Total Surat Suara Masuk');
    // Ballot Secrecy Invariant: Tidak membocorkan NIM, token, atau IP pemilih
    expect(tallyBody.toLowerCase()).not.toContain('receipt_token');
    expect(tallyBody.toLowerCase()).not.toContain('voter_id');

    // Unduh Audit Log CSV
    const auditRes = await page.request.get('/api/admin/audit-logs/export');
    expect(auditRes.status()).toBe(200);
    expect(auditRes.headers()['content-type']).toContain('text/csv');
    expect(auditRes.headers()['content-disposition']).toContain('Audit-Trail-Pemira-HMIF');

    const auditBody = await auditRes.text();
    expect(auditBody).toContain('Waktu (Lokal WIB)');
    expect(auditBody).toContain('Email Akun');
    expect(auditBody).toContain('Kategori Aksi');
  });

  test('3. Public BAST Verification Portal (/bast/verify) operates without authentication', async ({ page, request }) => {
    // 1. Kunjungi portal verifikasi tanpa login dan tanpa parameter hash
    await page.goto('/bast/verify');
    await expect(page.locator('text=Verifikasi Keabsahan Berita Acara (BAST)')).toBeVisible();
    await expect(page.locator('text=Dokumen Tidak Terverifikasi')).toBeVisible();

    // 2. Dapatkan current system hash dari API BAST verify
    const dummyHash = 'A'.repeat(64);
    const verifyApi = await request.get(`/api/bast/verify?hash=${dummyHash}`);
    expect(verifyApi.status()).toBe(200);
    const apiData = await verifyApi.json();

    expect(apiData.currentSystemHash).toBeDefined();
    const systemHash = apiData.currentSystemHash;

    // 3. Kunjungi portal dengan hash resmi yang valid
    await page.goto(`/bast/verify?hash=${systemHash}`);

    await expect(page.locator('text=Status Dokumen Sah & Asli')).toBeVisible();
    await expect(page.locator('text=Berita Acara Rekapitulasi Suara Terverifikasi')).toBeVisible();
    await expect(page.locator('body')).toContainText('Ballot Secrecy');
    await expect(page.locator('text=Total DPT')).toBeVisible();
    await expect(page.locator('text=Suara Masuk')).toBeVisible();
  });
});
