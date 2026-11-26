# Spec: Perombakan Brand, UI/UX, Tipografi, Palet, Layout, dan Copywriting Platform E-Voting Pemira HMIF

## Problem Statement

Masa pemungutan suara Pemira HMIF Telkom University Purwokerto periode 2026/2027 telah selesai dan pemenangnya telah ditentukan, namun antarmuka web saat ini masih memiliki beberapa kekurangan struktural yang mengurangi wibawa dan keterpakaian platform untuk arsip publik maupun siklus Pemira berikutnya:

1. Tampilan terkunci pada mode gelap tunggal dengan dekorasi generik (latar dot-matrix dan glow radial), sehingga identitas resmi HMIF tidak tampil kuat, modern, dan bersih.
2. Tipografi `Bebas Neue` (all-caps condensed) dan `Montserrat` memberi kesan poster acara alih-alih sistem pemilihan institusional yang modern dan mudah dipindai, serta beberapa angka dinamis belum menggunakan `tabular-nums`.
3. Halaman beranda terlalu kosong dan tidak beradaptasi terhadap siklus pemilihan (Pra-Pemira, Pemungutan Suara Aktif, Pasca-Pemira / Rekapitulasi & Verifikasi BAST).
4. Copywriting masih menggunakan slogan generik, belum sepenuhnya selaras dengan kamus domain resmi, dan memasang ikon panah dekoratif di hampir setiap tombol CTA. Sebutan jabatan **Chairman & Vice Chairman** merupakan istilah resmi AD/ART HMIF yang harus tetap dipertahankan.
5. Detail interaksi, proporsi radius bersarang, navigasi mobile, serta konsistensi antara halaman Beranda, Masuk, Bilik Suara Digital, Tanda Terima Pemilihan, dan Rekapitulasi Suara masih memerlukan standardisasi dalam satu sistem desain yang utuh.

## Solution

Merombak lapisan presentasi, sistem desain, dan arsitektur informasi Platform E-Voting Pemira HMIF menjadi sistem antarmuka berkarakter *Civic Engineering Authority* yang kuat, modern, dan bersih:

1. **Sistem Desain & Tema Ganda Berbasis Palet Resmi HMIF:** Menerapkan mode terang sebagai default (`#FAFAF7` canvas, `#FFFFFF` surface, `#F8FAE0` highlight, `#1E1E1E` ink, `#EBBD1C` aksen utama, `#29388B` aksen institusional) beserta pengalih tema gelap yang berfungsi penuh dan lulus kontras WCAG 2.2 AA pada kedua mode.
2. **Pembaruan Tipografi:** Mengganti `Bebas Neue` dan `Montserrat` dengan `Plus Jakarta Sans` (display dan body) serta `IBM Plex Mono` dengan `tabular-nums` khusus untuk data faktual (NIM, timer sesi, kode Tanda Terima Pemilihan, angka Partisipasi Pemilih, dan Rekapitulasi Suara).
3. **Beranda Sadar Siklus Pemilihan (Lifecycle-Aware):** Menampilkan status pemilihan aktual langsung dari data sistem, jalur langsung ke Rekapitulasi Suara dan Verifikasi BAST saat pemilihan selesai, serta jalur masuk Bilik Suara Digital saat pemilihan aktif, dilengkapi blok 3 Jaminan Pemira tanpa klaim atau angka fiktif.
4. **Pembaruan Alur Inti Pemilih & Publik:** Menyelaraskan halaman Masuk, Bilik Suara Digital, Tanda Terima Pemilihan, Rekapitulasi Suara, dan Verifikasi BAST dengan sistem desain baru, tata letak responsif 3 tahap (ponsel, tablet, desktop), serta detail mikro-interaksi yang rapi tanpa mengubah satu pun invarian keamanan (kerahasiaan Surat Suara Anonim, transaksi atomik, idempotensi, dan pembatasan akses admin).
5. **Standardisasi Copywriting:** Menyelaraskan seluruh teks antarmuka ke Bahasa Indonesia yang jernih, spesifik, bebas buzzword, bebas karakter em dash, konsisten dengan kamus domain resmi, serta tetap mempertahankan sebutan jabatan resmi AD/ART **Chairman & Vice Chairman HMIF**.

## User Stories

1. Sebagai mahasiswa Informatika yang mengunjungi beranda setelah Pemira berakhir, saya ingin langsung melihat status bahwa Pemira telah ditutup beserta tombol menuju Rekapitulasi Suara dan Verifikasi BAST, sehingga saya tidak diarahkan ke jalan buntu login bilik suara.
2. Sebagai mahasiswa Informatika yang mengunjungi beranda saat Pemira aktif, saya ingin melihat jadwal resmi, ringkasan mekanisme kerahasiaan Surat Suara Anonim, dan tombol masuk ke Bilik Suara Digital yang jelas, sehingga saya merasa yakin dan langsung tahu langkah berikutnya.
3. Sebagai pengguna dengan preferensi baca tertentu, saya ingin beralih antara mode terang (default) dan mode gelap melalui tombol tema di header dengan preferensi tersimpan, sehingga antarmuka nyaman dibaca di berbagai kondisi pencahayaan tanpa ada teks atau komponen yang rusak kontrasnya.
4. Sebagai pemilih yang mengakses halaman masuk dari ponsel, saya ingin formulir verifikasi NIM dan Kata Sandi Pemilih tampil bersih dengan bidang input besar (target sentuh minimal 44px) dan pesan validasi yang jelas, sehingga saya dapat masuk tanpa kesulitan mengetik atau salah tekan.
5. Sebagai pemilih di dalam Bilik Suara Digital, saya ingin melihat foto pasangan calon, nomor urut editorial, dan ringkasan visi dalam kartu berhierarki rapi tanpa distraksi visual, sehingga saya dapat membandingkan pilihan secara objektif.
6. Sebagai pemilih di dalam Bilik Suara Digital, saya ingin melihat sisa waktu sesi dalam format angka tabular yang tidak bergeser setiap detik, sehingga saya mengetahui batas waktu tanpa terganggu pergerakan teks.
7. Sebagai pemilih yang memilih pasangan calon atau kotak kosong di ponsel, saya ingin bilah aksi konfirmasi di bagian bawah tetap ringkas, menghormati area aman layar (safe-area), dan tidak menutupi kartu pilihan terakhir, sehingga saya selalu bisa membaca semua opsi sebelum mengirim suara.
8. Sebagai pemilih yang telah mengirimkan Surat Suara Anonim, saya ingin melihat halaman Tanda Terima Pemilihan dengan kode verifikasi yang mudah disalin, tombol cetak yang rapi untuk kertas putih, dan tautan langsung ke Rekapitulasi Suara atau pantauan Partisipasi Pemilih.
9. Sebagai mahasiswa atau publik yang membuka Rekapitulasi Suara, saya ingin melihat perolehan suara akhir dan Partisipasi Pemilih per angkatan dalam tipografi angka tabular yang kontras tinggi, sehingga hasil pemilihan mudah dibaca dan diverifikasi.
10. Sebagai pihak yang ingin memeriksa keabsahan Berita Acara (BAST), saya ingin mengakses halaman Verifikasi BAST langsung dari navigasi utama atau footer beranda, sehingga transparansi hasil Pemira mudah dijangkau.
11. Sebagai pengguna keyboard atau pembaca layar, saya ingin seluruh tautan, tombol, modal, dan pengalih tema memiliki indikator fokus yang jelas, dapat dioperasikan penuh dengan keyboard (Tab, Enter, Space, Escape), dan bebas dari elemen interaktif mati.
12. Sebagai panitia KPR HMIF, saya ingin perombakan tampilan ini tidak merusak atau mengubah alur keamanan backend, pemisahan Daftar Pemilih Tetap (DPT) dengan Surat Suara Anonim, maupun mekanisme transaksi atomik saat voting.

## Implementation Decisions

- **Design Token & Theme Architecture:** Memperbarui sistem token warna berbasis CSS custom properties (`:root` untuk mode terang default dan `.dark` untuk mode gelap) yang terhubung ke konfigurasi Tailwind, menggunakan palet resmi HMIF secara disiplin (maksimal 2-3 warna inti dan 1 aksen emas `#EBBD1C` per permukaan). Menambahkan komponen Theme Provider dan tombol pengalih tema ringan tanpa menyebabkan kedipan tema (FOUC) saat halaman dimuat.
- **Typography System:** Mengganti pemuatan font global dari `Bebas Neue` dan `Montserrat` ke `Plus Jakarta Sans` dan `IBM Plex Mono` melalui loader font Next.js. Menerapkan skala tipografi fluid untuk heading, `text-wrap: balance` pada judul, `text-wrap: pretty` pada paragraf, serta utilitas `tabular-nums` pada seluruh angka dinamis.
- **Public Election Lifecycle Summary Contract:** Menyediakan data ringkasan siklus pemilihan publik yang aman (status jadwal, apakah pemungutan suara aktif/selesai, total DPT dan persentase Partisipasi Pemilih yang sah untuk publik tanpa membocorkan rincian suara paslon saat pemungutan suara masih berjalan) agar halaman beranda dapat merender status faktual secara akurat.
- **Page & Component Overhaul Scope:**
  - Modul Layout Global & Header/Footer bersama dengan navigasi yang seluruh tujuannya nyata dan responsif (menu mobile berlabel jelas).
  - Modul Beranda Lifecycle-Aware (Hero 2-kolom, Kartu Status Pemilihan faktual, blok 3 Jaminan Pemira, tanpa dot-grid/glow orb).
  - Modul Halaman Masuk dengan tata letak bersih, kontras mode terang/gelap terverifikasi, dan copywriting selaras kamus domain.
  - Modul Bilik Suara Digital (Kartu Paslon, Kartu Kotak Kosong, Modal Detail & Konfirmasi, Sticky Action Bar dengan safe-area dan concentric border radius).
  - Modul Tanda Terima Pemilihan, Rekapitulasi Suara, dan Verifikasi BAST dengan penyelarasan tema ganda, tipografi tabular, dan dukungan cetak (`@media print`).
- **Interaction & Craft Standards:** Menyeragamkan efek tekan tombol ke `scale(0.96)`, mengganti transisi umum menjadi properti transisi spesifik, menggunakan border 1px untuk struktur dan shadow halus hanya untuk elemen melayang, serta memberi outline 1px netral murni pada foto kandidat.
- **Security Invariant Preservation:** Tidak ada perubahan pada skema basis data pemisahan DPT dan Surat Suara Anonim, RPC transaksi atomik voting, middleware proteksi endpoint admin, maupun mekanisme idempotensi.

## Testing Decisions

- **Prinsip Pengujian:** Pengujian berfokus pada perilaku eksternal yang diamati pengguna (rendering visual, alur navigasi, perpindahan tema, responsivitas lintas ukuran layar, aksesibilitas keyboard, dan integritas alur voting end-to-end), bukan detail implementasi internal CSS.
- **Seam Pengujian Utama (Prior Art):** Memanfaatkan seam pengujian yang sudah ada di proyek:
  1. Validasi tipe statis TypeScript (`pnpm tsc --noEmit`) untuk memastikan kontrak komponen dan API tetap utuh tanpa mengganggu cache dev server.
  2. Playwright E2E suite yang sudah tersedia untuk alur autentikasi, Bilik Suara Digital, Rekapitulasi Suara, dan responsivitas mobile (`320px`, `390px`, `768px`, `1440px`), diperluas untuk memverifikasi:
     - Tidak ada horizontal overflow pada seluruh halaman di lebar 320px dan 390px.
     - Perpindahan mode terang dan mode gelap berfungsi konsisten serta persist lintas navigasi.
     - Beranda menampilkan CTA dan status yang sesuai dengan kondisi siklus pemilihan.
     - Seluruh elemen interaktif memiliki aksi nyata, target sentuh minimal 44px di mobile, dan fokus keyboard yang terlihat.
- **Verifikasi Manual/Visual:** Memeriksa kontras teks WCAG AA pada mode terang dan gelap serta memastikan tidak ada regresi pada fungsi cetak Tanda Terima Pemilihan dan BAST.

## Out of Scope

- Perombakan total tata letak panel internal Admin Dashboard (cukup memastikan token warna dasar tidak rusak pada mode terang/gelap; redesign mendalam dashboard admin dipisah ke inisiatif tersendiri).
- Perubahan skema database Supabase, alur autentikasi backend, atau kontrak API admin yang sudah berjalan di produksi.
- Pembuatan aset fotografi baru atau ilustrasi 3D khusus kandidat (tetap menggunakan logo HMIF resmi dan foto kandidat yang sudah tersedia).

## Further Notes

- Seluruh keputusan visual mengacu pada dokumen riset 6 referensi website dan arah brand yang telah disusun (`research-and-brand-direction.md`).
- Jika di kemudian hari panitia ingin membuka fitur "Simulasi Surat Suara" bagi mahasiswa baru sebelum hari-H, fitur tersebut dapat ditambahkan sebagai ekstensi terpisah di atas komponen Kartu Paslon yang sudah distandardisasi.
