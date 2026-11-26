# 03: Perombakan Halaman Masuk (Login) dan Copywriting Domain

**What to build:** Menyelaraskan halaman Masuk pemilih (dan mode admin) dengan sistem desain baru di mode terang maupun gelap, dengan kartu terfokus yang bersih, border struktural 1px, bidang input NIM dan Kata Sandi Pemilih berdimensi nyaman untuk ponsel (minimal 44px), status validasi/loading/error yang jelas, serta copywriting yang konsisten dengan kamus domain resmi dan sebutan jabatan Chairman dan Vice Chairman HMIF.

**Blocked by:** 01: Fondasi Design System, Tipografi Baru, dan Tema Ganda (Light/Dark)

**Status:** done

- [x] Halaman Masuk tampil tajam dan lulus kontras WCAG AA pada mode terang (default) dan mode gelap, termasuk pesan error, status pemeliharaan, dan indikator fokus keyboard.
- [x] Seluruh label, placeholder, dan pesan bantuan menggunakan istilah resmi Daftar Pemilih Tetap (DPT), Kata Sandi Pemilih, dan Bilik Suara Digital, bebas em dash dan bebas data fiktif pada placeholder.
- [x] Bidang input dan tombol aksi memiliki tinggi minimal 44px, efek tekan `scale(0.96)`, serta transisi spesifik (bukan `transition: all`).
- [x] Seluruh alur autentikasi pemilih dan redirect aman tetap berjalan normal dan lulus suite pengujian E2E `auth-flow` serta `pnpm tsc --noEmit`.
