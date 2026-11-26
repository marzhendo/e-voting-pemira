# 05: Penyelarasan Tanda Terima Pemilihan, Rekapitulasi Suara, dan Verifikasi BAST

**What to build:** Menyelaraskan halaman Tanda Terima Pemilihan, halaman Rekapitulasi Suara (termasuk tampilan Partisipasi Pemilih per angkatan saat pemilihan aktif dan hasil final saat ditutup), serta halaman Verifikasi BAST dengan sistem desain baru di mode terang dan gelap. Memastikan seluruh angka perolehan suara, persentase, dan token verifikasi memakai `IBM Plex Mono` (`tabular-nums`), istilah "Tanda Terima Pemilihan" konsisten di seluruh antarmuka, dan tampilan cetak (`@media print`) tetap bersih di atas kertas putih.

**Blocked by:** 01: Fondasi Design System, Tipografi Baru, dan Tema Ganda (Light/Dark)

**Status:** done

- [x] Halaman Tanda Terima Pemilihan menggunakan istilah resmi "Tanda Terima Pemilihan" (menggantikan "Bukti Pemilihan"), menampilkan kode verifikasi dalam `tabular-nums` yang mudah disalin, dan memiliki aksi cetak rapi untuk kertas putih.
- [x] Halaman Rekapitulasi Suara menampilkan hasil final (dengan sebutan Chairman dan Vice Chairman HMIF) serta Partisipasi Pemilih per angkatan dengan kontras grafik/bar minimal 3:1 dan angka `tabular-nums` di kedua tema.
- [x] Halaman Verifikasi BAST tampil konsisten dengan header/footer baru dan dapat diakses langsung dari navigasi beranda.
- [x] Seluruh state (loading, empty, error) menjelaskan penyebab dan langkah lanjut dengan jelas tanpa teks placeholder kosong.
- [x] Lulus pengujian unit `rekapitulasi` & `export-and-bast`, E2E `bast-and-recap-overhaul`, serta validasi tipe `pnpm tsc --noEmit`.
