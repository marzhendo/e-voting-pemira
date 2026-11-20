# Laporan perbaikan audit-003 (temuan 44–48)

Tanggal: 2026-11-20  
Mode antislop: AFTER (pilihan eksplisit pengguna untuk sesi ini).  
Persetujuan: arah A (Editorial HMIF, dark–cream–gold) dan semua nomor 44–48.  
Batas: copywriting, perilaku aplikasi, alur autentikasi, dan transaksi voting tidak diubah. Tidak ada aset baru yang dibuat. Pemilik aset desain adalah departemen Kominfo, dan HMIF hanya memiliki logo.

## Status per temuan

| No  | Status                                               | Perubahan                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 44  | Diperbaiki, belum diukur di browser                  | `error` menjadi `#FF6B72` untuk teks/ikon/border di atas gelap. Merah resmi `#B71B25` dipindah ke token `error-solid` untuk bidang solid berteks putih. `hmif-red` yang dipakai sebagai teks di admin dialihkan ke `error`.                                        |
| 45  | Diperbaiki, belum dibandingkan render                | Aura emas blur 140px dan vignette radial dihapus. Header/footer landing tidak lagi memakai backdrop blur. Kanvas landing menjadi `#1E1E1E`. Halftone tetap satu-satunya lapisan dekoratif.                                                                         |
| 46  | Diperbaiki                                           | Gold tinggal untuk CTA dan state terpilih. Judul landing menjadi cream seluruhnya. Timer, ikon bantuan, ikon tombol detail, dan "Berlaku 10 mnt" tidak lagi gold. Angka PIN yang terisi memakai putih. Nama Vice Chairman di modal detail tidak lagi gold sendiri. |
| 47  | Diperbaiki                                           | Susunan identitas diseragamkan di landing, login, dan bilik suara. Baris pertama putih `text-sm`, baris kedua `text-xs`. `docs/UI.md` ditulis ulang agar sesuai source.                                                                                            |
| 48  | Diperbaiki, belum diuji pada 320/390px dan zoom 200% | Teks instruksi/informasi naik ke 14px (`text-sm`), 11px menjadi 12px, tombol kirim ulang PIN menjadi 44px.                                                                                                                                                         |

Cream diterapkan pada kotak "Visi Utama" di kartu paslon, "HAK SUARA SAH" di kartu kotak kosong, dan blok Visi/Misi di modal detail. Perlakuannya identik untuk semua opsi.

## File yang diubah

`tailwind.config.ts`, `app/page.tsx`, `app/(auth)/login/page.tsx`, `components/auth/login-form.tsx`, `app/(voter)/vote/page.tsx`, `components/ballot/candidate-card.tsx`, `components/ballot/kotak-kosong-card.tsx`, `components/candidates/candidate-detail-modal.tsx`, `components/admin/modals/dpt-action-modals.tsx`, `components/admin/modals/settings-and-broadcast-modals.tsx`, `components/admin/tabs/broadcast-tab.tsx`, `components/admin/tabs/dpt-tab.tsx`, `components/admin/tabs/settings-tab.tsx`, `docs/UI.md`.

## Kontras

Hasil hitung manual, bukan pengukuran browser:

- `#FF6B72` di atas `#1E1E1E` sekitar 6,0:1, dan di atas `#1E1E1E` yang dicampur `#93000A` 20% sekitar 5,9:1.
- Teks `#1E1E1E` di atas cream sekitar 15:1, dan `#5E5E5E` di atas cream sekitar 6,1:1.

## Gate

- `diagnostics` editor: tidak ada error pada file yang diubah. Peringatan "Props must be serializable" sudah ada sebelumnya.
- **Belum dijalankan:** `pnpm tsc --noEmit`, Playwright, screenshot, uji keyboard, reduced motion. Terminal sandbox gagal sebelum command berjalan karena `libasound.so.2` tidak ada di WSL.
- Tidak ada klaim lulus untuk gate yang belum dijalankan.

## Risiko yang perlu dicek mata

1. Landing: dengan aura dan vignette dihapus, pastikan teks dan CTA tetap terbaca di atas halftone pada 320/390/768/1440px.
2. Hasil cream: periksa apakah terasa terlalu pucat di bilik suara. Jika ya, batasi hanya ke modal detail.
3. `error` kini lebih terang di semua layar admin yang memakai `text-error`/`border-error`/`bg-error/10`. Periksa sekilas tab admin dan modal hapus.
4. Cetak BAST: memakai kelas gray dan tidak terpengaruh perubahan token. Tetap cek pratinjau cetak sekali.
