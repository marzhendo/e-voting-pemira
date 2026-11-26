# 02: Beranda Sadar Siklus Pemilihan (Lifecycle-Aware) dan Kontrak Status Publik

**What to build:** Merombak halaman Beranda agar bebas dari pola dekorasi dot-matrix dan radial glow, menggunakan tata letak hero 2-kolom yang beradaptasi otomatis terhadap status siklus Pemira (Pra-Pemira, Pemungutan Suara Aktif, atau Pasca-Pemira) berdasarkan data nyata dari server. Saat masa pemilihan sudah berakhir, beranda langsung mengarahkan mahasiswa ke Rekapitulasi Suara dan Verifikasi BAST. Menyertakan Kartu Status Pemilihan faktual (jadwal resmi, total Daftar Pemilih Tetap (DPT), dan Partisipasi Pemilih tanpa membocorkan suara paslon saat pemilihan aktif) serta blok 3 Jaminan Pemira (Surat Suara Anonim, Satu Mahasiswa Satu Suara via DPT, Integritas Rekapitulasi & BAST).

**Blocked by:** 01: Fondasi Design System, Tipografi Baru, dan Tema Ganda (Light/Dark)

**Status:** done

- [x] Halaman beranda bersih dari dot-matrix background, blur glow orb, dan angka atau testimoni fiktif.
- [x] Saat status pemilihan selesai/ditutup, CTA utama mengarah ke Rekapitulasi Suara dan CTA sekunder mengarah ke Verifikasi BAST; saat pemilihan aktif, CTA utama mengarah ke halaman masuk Bilik Suara Digital.
- [x] Kartu Status Pemilihan menampilkan data faktual langsung dari sistem dengan angka `tabular-nums`, dan tidak pernah menampilkan rincian suara paslon ketika pemilihan masih berlangsung.
- [x] Copywriting beranda konsisten dengan kamus domain resmi, mempertahankan sebutan jabatan resmi AD/ART **Chairman dan Vice Chairman** HMIF, bebas buzzword AI, bebas karakter em dash, dan tidak memasang panah dekoratif di semua tombol.
- [x] Beranda tampil rapi tanpa horizontal overflow pada layar 320px, 390px, 768px, dan 1440px di mode terang maupun gelap, serta lulus uji Playwright dan `pnpm tsc --noEmit`.
