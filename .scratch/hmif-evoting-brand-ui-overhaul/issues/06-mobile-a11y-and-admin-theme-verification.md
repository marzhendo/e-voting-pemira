# 06: Audit Responsivitas Mobile (320px-1440px), Aksesibilitas Keyboard, dan Kompatibilitas Tema Admin

**What to build:** Melakukan verifikasi menyeluruh lintas seluruh halaman pemilih dan publik pada lebar layar 320px, 390px, 768px, 1024px, dan 1440px pada mode terang dan mode gelap, memastikan halaman Admin Dashboard tetap terbaca dan berfungsi penuh dengan sistem token tema baru (tanpa melakukan perombakan layout admin yang berada di luar cakupan), serta menjalankan pengujian otomatis E2E Playwright dan validasi tipe TypeScript sebagai gerbang akhir.

**Blocked by:**
- 02: Beranda Sadar Siklus Pemilihan (Lifecycle-Aware) dan Kontrak Status Publik
- 03: Perombakan Halaman Masuk (Login) dan Copywriting Domain
- 04: Perombakan Bilik Suara Digital, Kartu Paslon, dan Sticky Action Bar
- 05: Penyelarasan Tanda Terima Pemilihan, Rekapitulasi Suara, dan Verifikasi BAST

**Status:** done

- [x] Nol horizontal overflow dan nol elemen terpotong pada seluruh halaman pemilih/publik di lebar 320px, 390px, 768px, 1024px, dan 1440px pada mode terang maupun gelap.
- [x] Seluruh kontrol interaktif (tautan, tombol, modal, pengalih tema, menu mobile, skip-link) dapat dioperasikan penuh via keyboard dengan fokus indikator terlihat jelas dan bebas elemen mati.
- [x] Halaman Admin Dashboard dan tab-tab utamanya tetap memiliki kontras layak dan berfungsi normal pada token tema yang diperbarui melalui isolasi tema gelap pada layout admin.
- [x] Seluruh copywriting lintas halaman bebas em dash, bebas buzzword AI, selaras dengan kamus domain resmi, dan mempertahankan sebutan jabatan resmi AD/ART **Chairman dan Vice Chairman** HMIF.
- [x] Validasi tipe (`pnpm tsc --noEmit`) dan suite Playwright E2E (9/9 pengujian responsif, aksesibilitas, dan tema) lulus seluruhnya tanpa error konsol.
