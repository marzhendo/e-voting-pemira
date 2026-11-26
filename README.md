# E-Voting Pemira HMIF Telkom University Purwokerto

Aplikasi web pemilihan raya (Pemira) untuk memilih **Chairman & Vice Chairman** Himpunan Mahasiswa Informatika (HMIF) Telkom University Purwokerto.

- **Situs produksi:** [https://pemirahmif.com](https://pemirahmif.com)

Aplikasi ini dibuat agar mahasiswa aktif Informatika dapat memilih dari mana saja secara aman, sementara pilihan suara tetap rahasia dan hasil akhirnya bisa diperiksa bersama oleh panitia maupun publik.

---

## Fitur Utama

### Untuk Pemilih (Mahasiswa Informatika)
- Masuk ke Bilik Suara Digital menggunakan NIM yang tercatat di Daftar Pemilih Tetap (DPT) dan Kata Sandi Pemilih.
- Melihat profil pasangan calon Chairman & Vice Chairman HMIF, visi dan misi lengkap, serta mengunduh berkas CV masing-masing kandidat.
- Memilih salah satu pasangan calon atau opsi sah Kotak Kosong, lalu meninjau ulang pilihan pada layar konfirmasi sebelum suara dikunci.
- Menerima Tanda Terima Pemilihan berkode unik setelah suara masuk, lengkap dengan tombol salin dan cetak.
- Melihat pantauan Partisipasi Pemilih selama pemilihan berlangsung dan Rekapitulasi Suara setelah pemilihan resmi ditutup.
- Beralih antara mode terang (default) dan mode gelap sesuai kenyamanan layar.

### Untuk Publik
- Halaman beranda otomatis menyesuaikan status pemilihan (sebelum dibuka, sedang berlangsung, pemeliharaan, atau sudah selesai).
- Memeriksa keabsahan dokumen cetak Berita Acara Rekapitulasi Suara (BAST) melalui halaman `/bast/verify` dengan memindai QR Code atau menempelkan kode verifikasi SHA-256.

### Untuk Panitia KPR & Superadmin
- Mengelola Daftar Pemilih Tetap (DPT): impor data dari CSV/Excel, tambah cepat, filter status pemilihan, dan pembuatan Kata Sandi Pemilih secara massal.
- Mengirimkan Kata Sandi Pemilih ke email kampus mahasiswa dengan pantauan status pengiriman dan kirim ulang bila diperlukan.
- Mengelola data pasangan calon, foto resmi, visi-misi, dan dokumen CV.
- Mengatur jadwal buka dan tutup pemilihan, mengaktifkan mode pemeliharaan, serta memantau partisipasi per angkatan.
- Mencetak Berita Acara Rekapitulasi Suara (BAST) ber-QR Code dan mengekspor hasil suara serta catatan aktivitas (audit log) ke format CSV.

---

## Tampilan Aplikasi

### 1. Halaman Beranda (Mode Terang & Mode Gelap)
Halaman utama menampilkan status pemilihan aktual, jumlah DPT, tingkat partisipasi, dan tombol aksi yang otomatis menyesuaikan fase pemilihan.

![Beranda Mode Terang](docs/screenshots/01-landing-page.png)

![Beranda Mode Gelap](docs/screenshots/01b-landing-page-dark.png)

### 2. Halaman Masuk
Pemilih memasukkan NIM dan Kata Sandi Pemilih yang dibagikan ke email kampus.

![Halaman Masuk](docs/screenshots/02-login-page.png)

### 3. Bilik Suara Digital, Detail Kandidat, dan Konfirmasi Pilihan
Pemilih dapat membandingkan pasangan calon, membuka detail visi-misi beserta berkas CV, lalu mengonfirmasi pilihan sebelum suara dikirim.

![Bilik Suara Digital](docs/screenshots/03-voting-chamber.png)

![Modal Detail Visi Misi dan CV Paslon](docs/screenshots/13-candidate-detail-modal.png)

![Modal Konfirmasi Pilihan](docs/screenshots/04-voting-confirmation-modal.png)

### 4. Tanda Terima Pemilihan
Setelah suara tercatat, pemilih mendapat kode Tanda Terima Pemilihan yang dapat disalin atau dicetak tanpa mencantumkan nama kandidat yang dipilih.

![Tanda Terima Pemilihan](docs/screenshots/05-digital-receipt.png)

### 5. Rekapitulasi Suara & Verifikasi Berita Acara (BAST)
Setelah pemungutan suara ditutup resmi, hasil perolehan suara dan partisipasi per angkatan dapat dilihat di halaman Rekapitulasi Suara. Dokumen cetak BAST dari panitia juga bisa diperiksa keasliannya di halaman Verifikasi BAST.

![Rekapitulasi Suara](docs/screenshots/15-rekapitulasi.png)

![Verifikasi Berita Acara BAST](docs/screenshots/14-bast-verify.png)

### 6. Dashboard Panitia KPR (Admin)
Panel internal bagi panitia untuk memantau partisipasi, mengelola pasangan calon, mengatur DPT, mengirim email kredensial, mengatur jadwal, dan menerbitkan BAST.

![Dashboard Admin Ringkasan](docs/screenshots/06-admin-dashboard-overview.png)

![Dashboard Admin Pasangan Calon](docs/screenshots/07-admin-dashboard-candidates.png)

![Dashboard Admin Manajemen DPT](docs/screenshots/08-admin-dashboard-dpt.png)

![Dashboard Admin Rekapitulasi](docs/screenshots/09-admin-dashboard-tally.png)

![Dashboard Admin Pengaturan](docs/screenshots/10-admin-dashboard-settings.png)

![Dashboard Admin Broadcast Email](docs/screenshots/12-admin-dashboard-broadcast-email.png)

---

## Prinsip Keamanan yang Dijaga

1. **Pilihan suara dipisahkan dari identitas pemilih.** Data surat suara yang masuk tidak menyimpan NIM, nama, user ID, maupun alamat IP pemilih.
2. **Satu mahasiswa, satu suara.** Penandaan bahwa pemilih sudah memilih dan penyimpanan surat suara dijalankan bersamaan dalam satu transaksi agar pemilih tidak bisa mengirim suara lebih dari sekali.
3. **Hasil suara terkunci selama pemilihan berjalan.** Selama Bilik Suara Digital masih aktif, perolehan suara tiap pasangan calon tidak ditampilkan ke pemilih maupun publik. Hanya angka partisipasi yang dapat dipantau.
4. **Akses panitia terpisah dan tercatat.** Halaman admin hanya bisa dibuka oleh akun panitia yang terdaftar, dan setiap tindakan penting panitia tercatat di log aktivitas.

---

## Cara Menjalankan Secara Lokal

### Kebutuhan Awal
- Node.js (disarankan versi 20 atau lebih baru)
- `pnpm`
- Basis data Supabase (PostgreSQL)

### Langkah Menjalankan

1. Salin repositori dan masuk ke folder proyek:
   ```bash
   git clone <URL_REPOSITORY>
   cd e-voting
   ```

2. Pasang paket yang dibutuhkan:
   ```bash
   pnpm install
   ```

3. Salin berkas contoh variabel lingkungan dan isi nilainya:
   ```bash
   cp .env.example .env.local
   ```
   Jangan pernah mengunggah `.env.local` ke Git.

4. Jalankan server lokal:
   ```bash
   pnpm dev
   ```
   Buka `http://localhost:3000` di peramban.

---

## Pengujian dan Pemeriksaan

Perintah berikut tersedia di `package.json`:

- Memeriksa tipe TypeScript:
  ```bash
  pnpm tsc --noEmit
  ```
- Menjalankan pengujian antarmuka (Playwright):
  ```bash
  pnpm test:e2e
  ```
- Menjalankan pemeriksaan linter:
  ```bash
  pnpm lint
  ```
- Menjalankan pengujian unit (contoh untuk logika voting, rekapitulasi, dan BAST):
  ```bash
  node --test tests/voting.test.mjs tests/rekapitulasi.test.mjs tests/export-and-bast.test.mjs
  ```

Catatan: saat server lokal (`pnpm dev`) sedang aktif, gunakan `pnpm tsc --noEmit` untuk mengecek perubahan kode dan hindari menjalankan `pnpm build` bersamaan agar cache server lokal tidak rusak.

---

## Arsitektur Produksi dan Teknologi

Di lingkungan produksi ([pemirahmif.com](https://pemirahmif.com)), aplikasi berjalan di **VPS Ubuntu 22.04 LTS** dengan Nginx di depan klaster Node.js (PM2) dan Supabase PostgreSQL sebagai basis data.

### 1. Arsitektur Sistem Lengkap

```mermaid
flowchart LR
  subgraph Users["Pengguna"]
    V["Mahasiswa Pemilih<br/>(/vote, /receipt, /rekapitulasi)"]
    A["Panitia & Pengawas<br/>(/admin/dashboard)"]
    P["Publik & Saksi<br/>(/bast/verify, /rekapitulasi)"]
  end

  subgraph Edge["VPS Ubuntu 22.04 LTS & Layanan Luar"]
    NX["Nginx<br/>Reverse Proxy, Load Balancer, SSL, Rate Limit"]
    SSO["Microsoft Entra ID<br/>SSO Telkom University"]
    SMTP["SMTP Mailer<br/>Kirim Kata Sandi Pemilih (Batch 20)"]
  end

  subgraph Runtime["Next.js 14 Runtime (PM2 Cluster)"]
    MW["Middleware<br/>Penjaga Rute & IP Asli"]
    UI["App Router<br/>Antarmuka Pemilih & Admin"]
    API["Server Actions & API Routes<br/>Autentikasi, Voting, Rekap, BAST"]
  end

  subgraph DB["Supabase PostgreSQL"]
    RPC["Atomic RPC & Trigger<br/>Transaksi Atomik & Append-Only"]
    DPT[("voters_whitelist<br/>DPT, Sandi Hash, Status Pilih")]
    BAL[("ballots<br/>Surat Suara Anonim")]
    CAN[("candidates<br/>Profil & Visi Misi Paslon")]
    GOV[("election_settings, admin_users, audit_logs<br/>Jadwal, Panitia, Log Aktivitas")]
  end

  V -->|"HTTPS"| NX
  A -->|"HTTPS"| NX
  P -->|"HTTPS"| NX
  NX -->|"X-Forwarded-For"| MW
  SSO -->|"OIDC Callback"| UI
  MW --> UI
  UI --> API
  API -->|"Broadcast Email"| SMTP
  API -->|"Service Role RPC"| RPC
  RPC -->|"Kunci Baris & Set has_voted"| DPT
  RPC -->|"Simpan Terpisah"| BAL
  RPC --> CAN
  RPC --> GOV
```

### 2. Alur Keamanan dan Pemilihan Atomik

Diagram berikut menjelaskan perjalanan pemilih dari halaman masuk sampai menerima Tanda Terima Pemilihan, sekaligus menjaga agar satu mahasiswa hanya bisa memilih satu kali tanpa meninggalkan jejak pilihan di data pemilih.

```mermaid
sequenceDiagram
  actor M as Mahasiswa Pemilih
  participant MW as Next.js Middleware
  participant SRV as Auth & Ballot Service
  participant RPC as PostgreSQL RPC
  participant DPT as voters_whitelist
  participant BAL as ballots (Append-Only)

  Note over M,BAL: 1. Verifikasi Identitas Pemilih
  M->>SRV: Kirim NIM dan Kata Sandi Pemilih (atau OTP)
  SRV->>RPC: Periksa kecocokan sandi hash dan batas percobaan
  RPC->>DPT: Kunci baris pemilih dan cek status has_voted
  RPC-->>SRV: Identitas sah, terbitkan cookie sesi JWT

  Note over M,BAL: 2. Masuk Bilik Suara Digital dan Kirim Suara
  M->>MW: Buka /vote dengan cookie sesi
  MW-->>M: Izinkan akses halaman Bilik Suara Digital
  M->>SRV: Kirim pilihan kandidat (candidateId)
  SRV->>RPC: Jalankan cast_ballot_secure(nim, candidateId, receiptHash)
  RPC->>DPT: SELECT FOR UPDATE dan ubah has_voted = true
  RPC->>BAL: INSERT surat suara anonim (tanpa NIM dan tanpa user ID)
  RPC-->>SRV: Transaksi atomik berhasil
  SRV-->>M: Tampilkan kode Tanda Terima Pemilihan (SHA-256)

  Note over M,BAL: 3. Akses Pasca-Pemilihan
  M->>MW: Buka /receipt atau /rekapitulasi (/vote otomatis terkunci)
```

### 3. Skema Basis Data (ERD)

Tabel `voters_whitelist` dan `ballots` dibuat terpisah tanpa relasi (tanpa foreign key) agar pilihan suara tidak bisa ditelusuri kembali ke pemilik NIM. Tabel `ballots` dan `audit_logs` juga dipasangi trigger `prevent_append_only_modification()` yang menolak perintah `UPDATE` maupun `DELETE` langsung di tingkat basis data.

```mermaid
erDiagram
  voters_whitelist {
    uuid id PK
    varchar nim UK
    varchar email UK
    varchar name
    int generation
    boolean has_voted
    timestamptz voted_at
    varchar receipt_hash
    text password_hash
    int login_attempts
    timestamptz locked_until
    text otp_hash
    timestamptz otp_expires_at
    timestamptz last_email_sent_at
    text last_email_status
  }

  candidates {
    uuid id PK
    int candidate_number UK
    varchar leader_name
    varchar vice_leader_name
    text vision
    text_array mission
    text photo_url
    boolean is_active
  }

  ballots {
    uuid id PK
    uuid candidate_id FK
    date voting_session_date
  }

  election_settings {
    int id PK
    boolean is_voting_open
    timestamptz start_time
    timestamptz end_time
    boolean maintenance_mode
    boolean allow_kotak_kosong_multi
  }

  admin_users {
    uuid id PK
    varchar email UK
    varchar role
    uuid entra_tenant_id
    uuid entra_object_id
    boolean is_active
  }

  audit_logs {
    uuid id PK
    varchar actor_email
    varchar action
    jsonb details
    varchar ip_address
    timestamptz created_at
  }

  candidates ||--o{ ballots : "pilihan suara"
```

### Infrastruktur Produksi
- **Server:** VPS dengan sistem operasi Ubuntu 22.04 LTS, dilengkapi firewall `ufw` dan proteksi `fail2ban` (konfigurasi di `setup.sh` dan `deploy.sh`).
- **Nginx:** bertindak sebagai reverse proxy dan load balancer di depan aplikasi, menangani sertifikat HTTPS (Certbot), kompresi Gzip, pembatasan permintaan untuk mencegah spam, serta melayani berkas statis secara langsung (`nginx.conf.example`).
- **PM2 Cluster:** menjalankan hasil build Next.js standalone di beberapa proses sesuai jumlah core CPU agar aplikasi tetap stabil saat banyak mahasiswa masuk bersamaan, dan otomatis memulai ulang proses jika terjadi gangguan (`ecosystem.config.cjs`).
- **Basis data:** Supabase (PostgreSQL) dengan transaksi atomik `SELECT ... FOR UPDATE`, penyimpanan append-only pada `ballots` dan `audit_logs`, serta proteksi akun Superadmin utama (`protect_superadmin_immutability()`).
- **Email:** server SMTP melalui `nodemailer` untuk mengirimkan Kata Sandi Pemilih secara bertahap (batch 20 email) dengan catatan status pengiriman per pemilih.

### Teknologi Aplikasi
- **Framework web:** Next.js (App Router) dengan TypeScript
- **Tampilan:** Tailwind CSS, Framer Motion, Plus Jakarta Sans, dan IBM Plex Mono
- **Validasi data:** Zod
- **Pembuatan dokumen & QR:** `qrcode` dan `xlsx` (impor DPT CSV/Excel serta QR verifikasi BAST)
- **Pengujian:** Playwright dan Node Test Runner

---

## Struktur Folder Utama

```text
app/
  page.tsx                 Halaman beranda (mengikuti siklus pemilihan)
  (auth)/login/            Halaman masuk pemilih dan panitia
  (voter)/vote/            Bilik Suara Digital
  (voter)/receipt/         Tanda Terima Pemilihan
  (voter)/rekapitulasi/    Pantauan Partisipasi Pemilih dan Rekapitulasi Suara
  (admin)/admin/dashboard/ Dashboard Panitia KPR
  bast/verify/             Verifikasi dokumen Berita Acara (BAST)
  api/                     Endpoint server untuk autentikasi, voting, dan admin
components/                Komponen antarmuka (beranda, bilik suara, rekapitulasi, admin)
lib/                       Logika utama (sesi, DPT, surat suara, rekapitulasi, email)
docs/                      Dokumentasi proyek dan tangkapan layar
tests/                     Pengujian unit dan pengujian antarmuka Playwright
```

---

## Dokumentasi Tambahan

Dokumen pelengkap lainnya tersimpan di folder `docs/`:

- [Panduan Pemilih](docs/USER_GUIDE.md)
- [Panduan Admin & Panitia KPR](docs/ADMIN_GUIDE.md)
- [Kebutuhan Produk (PRD)](docs/PRD.md)
- [Arsitektur Sistem](docs/ARCHITECTURE.md)
- [Skema Basis Data](docs/DATABASE.md)
- [Keamanan Sistem](docs/SECURITY.md)
- [Panduan Deployment](docs/DEPLOYMENT.md)
- [Panduan Deployment VPS Ubuntu 22.04](DEPLOYMENT_UBUNTU22.md)
- [Kamus Istilah Domain](GLOSSARY.md)
