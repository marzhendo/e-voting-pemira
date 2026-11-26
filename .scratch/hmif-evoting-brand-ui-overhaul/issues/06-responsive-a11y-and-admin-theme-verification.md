# 06: Audit Responsivitas Mobile (320px-1440px), Aksesibilitas Keyboard, dan Kompatibilitas Tema Admin

**What to build:** Seluruh permukaan publik, alur pemilih, dan kompatibilitas dasar panel Admin Dashboard diverifikasi menyeluruh pada mode terang dan gelap di rentang layar 320px, 390px, 768px, 1024px, dan 1440px, memastikan nol horizontal overflow, navigasi keyboard utuh, serta seluruh suite pengujian otomatis proyek lulus hijau.

**Blocked by:** 02: Beranda Sadar Siklus Pemilihan (Lifecycle-Aware) & Kontrak Status Publik, 03: Perombakan Halaman Masuk (Login) & Copywriting Domain, 04: Perombakan Bilik Suara Digital, Kartu Paslon, dan Sticky Action Bar, 05: Penyelarasan Tanda Terima Pemilihan, Rekapitulasi Suara, dan Verifikasi BAST

**Status:** ready-for-agent

- [ ] Pengujian Playwright responsif diperluas dan lulus tanpa horizontal overflow maupun elemen tumpang tindih pada lebar 320px, 390px, 768px, dan 1440px di kedua tema (terang dan gelap).
- [ ] Seluruh kontrol interaktif memiliki target sentuh minimal 44x44px di mobile, indikator fokus keyboard jelas, dan menghormati `prefers-reduced-motion: reduce`.
- [ ] Halaman Admin Dashboard tetap terbaca jelas dan fungsional (tidak ada teks menyatu dengan latar atau komponen rusak) setelah pembaruan token warna dan tema default terang.
- [ ] Seluruh copywriting terverifikasi bebas em dash, bebas buzzword AI, selaras dengan kamus domain resmi, dan mempertahankan sebutan **Chairman & Vice Chairman HMIF**.
- [ ] Validasi tipe TypeScript (`pnpm tsc --noEmit`) dan seluruh suite Playwright E2E yang relevan lulus tanpa regresi.
