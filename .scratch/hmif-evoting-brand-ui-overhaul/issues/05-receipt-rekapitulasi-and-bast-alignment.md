# 05: Penyelarasan Tanda Terima Pemilihan, Rekapitulasi Suara, dan Verifikasi BAST

**What to build:** Pemilih dan publik yang mengakses Tanda Terima Pemilihan, Rekapitulasi Suara, serta Verifikasi BAST melihat antarmuka yang seragam dengan sistem desain baru pada mode terang dan gelap. Kode Tanda Terima Pemilihan, hash SHA-256, persentase Partisipasi Pemilih per angkatan, dan rincian perolehan suara akhir tampil tajam dalam tipografi tabular, serta halaman cetak tetap bersih di kertas putih.

**Blocked by:** 01: Fondasi Design System, Tipografi Baru, dan Tema Ganda (Light/Dark)

**Status:** ready-for-agent

- [ ] Halaman Tanda Terima Pemilihan menggunakan istilah resmi "Tanda Terima Pemilihan", menampilkan kode token dalam `IBM Plex Mono` (`tabular-nums`) dengan tombol salin berumpan balik jelas, serta tampilan cetak (`@media print`) yang bersih di atas latar putih.
- [ ] Halaman Rekapitulasi Suara (baik saat pemilihan berlangsung maupun setelah ditutup) menampilkan grafik Partisipasi Pemilih, sebaran angkatan, dan hasil perolehan suara Chairman & Vice Chairman HMIF serta Kotak Kosong dengan kontras WCAG AA pada mode terang dan gelap.
- [ ] Halaman Verifikasi BAST selaras dengan sistem desain, tipografi tabular, dan header/footer bersama sehingga mudah diakses langsung dari beranda.
- [ ] Status loading, kosong, dan galat pada ketiga halaman menjelaskan penyebab dan langkah lanjut yang konkret.
- [ ] Suite Playwright `rekapitulasi`, `export-and-bast-verify`, dan validasi tipe TypeScript (`pnpm tsc --noEmit`) lulus.
