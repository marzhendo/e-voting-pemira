# E-Voting Pemira HMIF

> Sistem pemungutan suara elektronik untuk Pemilihan Raya (Pemira) Himpunan Mahasiswa Informatika (HMIF).

**Status proyek:** Documentation and implementation status must be verified  
**Dokumentasi:** Draft — Requires project team review  
**Versi aplikasi:** Belum ditetapkan  
**Pemilik proyek:** HMIF / Panitia Pemira (detail organisasi dan penanggung jawab: TBD)

---

## 1. Tentang Proyek

E-Voting Pemira HMIF dirancang untuk mendukung proses pemilihan Ketua dan Wakil Ketua HMIF secara elektronik.

Sistem dirancang dengan prinsip:

- **One-Man-One-Vote:** satu pemilih yang memenuhi syarat hanya dapat menggunakan hak pilih satu kali.
- **DPT validation:** kelayakan pemilih diperiksa terhadap Daftar Pemilih Tetap.
- **Ballot secrecy:** identitas pemilih dipisahkan dari record pilihan suara.
- **Controlled election period:** pemungutan suara mengikuti jadwal dan status yang ditetapkan.
- **Private tally during voting:** perolehan suara tidak ditampilkan kepada pemilih umum selama pemungutan suara berlangsung.
- **Auditability:** tindakan administratif dan kejadian penting perlu dapat ditelusuri.

Pernyataan di atas menggambarkan persyaratan desain dari dokumentasi proyek, bukan sertifikasi bahwa seluruh kontrol telah selesai diimplementasikan.

## 2. Ruang Lingkup Utama

Fitur yang ditetapkan dalam PRD meliputi:

- Login menggunakan Microsoft Entra ID.
- Pencocokan identitas mahasiswa dengan DPT.
- Halaman kandidat dan opsi Kotak Kosong.
- Konfirmasi sebelum pengiriman suara.
- Pencatatan suara melalui proses server/database yang aman.
- Receipt setelah proses voting.
- Dashboard KPR/Admin.
- Impor DPT melalui CSV/Excel.
- Pengaturan periode pemungutan suara dan mode pemeliharaan.
- Monitoring partisipasi dan tally privat.
- Ekspor laporan PDF/Excel.
- Audit trail.

Fitur yang tidak termasuk dalam ruang lingkup PRD saat ini antara lain live debate/Q&A di dalam aplikasi dan pendaftaran pemilih secara mandiri.

## 3. Teknologi

Stack yang tercantum dalam spesifikasi/konteks proyek:

| Area | Teknologi |
|---|---|
| Web framework | Next.js App Router |
| Language | TypeScript |
| Database | Supabase / PostgreSQL |
| Authentication | Microsoft Entra ID dengan MSAL/provider yang disepakati |
| Input validation | Zod |
| E2E testing | Playwright |
| Package manager | pnpm |

Versi runtime, versi dependency, provider hosting, dan konfigurasi CI/CD harus diverifikasi dari repository dan environment aktual.

## 4. Dokumentasi

Dokumentasi proyek dipisahkan berdasarkan topik agar mudah dipelihara.

| Dokumen | Deskripsi |
|---|---|
| `PRD.md` | Kebutuhan produk, tujuan, ruang lingkup, dan alur utama. |
| `UI.md` | Spesifikasi antarmuka dan pengalaman pengguna. |
| `ARCHITECTURE.md` | Arsitektur sistem, komponen, alur, dan keputusan teknis. |
| `DATABASE.md` | Desain database, schema, RPC, dan integritas transaksi. |
| `DATA_DICTIONARY.md` | Definisi tabel, kolom, constraint, dan sensitivitas data. |
| `API.md` | Kontrak dan perilaku API. |
| `AUTHENTICATION.md` | Login, session, identity mapping, dan authorization. |
| `SECURITY.md` | Threat model, security controls, dan incident response. |
| `TESTING.md` | Strategi, skenario, dan kriteria pengujian. |
| `DEPLOYMENT.md` | Deployment, release, rollback, dan konfigurasi operasional. |
| `ENVIRONMENT.md` | Environment variables dan pemisahan lingkungan. |
| `OPERATIONS.md` | Prosedur operasional pemilihan. |
| `USER_GUIDE.md` | Panduan mahasiswa pemilih dan penggunaan umum. |
| `ADMIN_GUIDE.md` | Panduan administrator dan panitia. |
| `CONTRIBUTING.md` | Aturan kontribusi developer dan pull request. |
| `CHANGELOG.md` | Catatan perubahan dan release. |

Dokumen di atas harus disimpan pada lokasi yang sesuai dalam repository. Daftar file aktual dan lokasi folder perlu diverifikasi sebelum publikasi.

## 5. Prasyarat Pengembangan

Secara umum, lingkungan pengembangan memerlukan:

- Git.
- Node.js dengan versi yang ditetapkan proyek.
- pnpm.
- Akses ke repository.
- Environment variables untuk layanan development.
- Akses ke Microsoft Entra dan Supabase development jika diperlukan.

Versi Node.js/pnpm dan langkah setup final: **TBD**.

## 6. Menjalankan Proyek Secara Lokal

> Bagian ini merupakan template alur umum. Perintah final harus disesuaikan dengan script yang benar-benar tersedia di `package.json`.

### 6.1 Clone repository

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_DIRECTORY>
```

### 6.2 Install dependencies

```bash
pnpm install
```

### 6.3 Siapkan environment

Buat konfigurasi lokal berdasarkan template resmi, jika tersedia:

```bash
cp .env.example .env.local
```

Isi nilai development yang diperlukan melalui kanal secret/configuration yang disetujui.

Jangan gunakan secret production untuk pengembangan lokal. Jangan commit `.env.local`.

### 6.4 Jalankan aplikasi

Jika script `dev` tersedia di `package.json`:

```bash
pnpm dev
```

URL lokal default dan script aktual perlu diverifikasi dari konfigurasi repository.

## 7. Pemeriksaan Kualitas

Typecheck yang ditetapkan dalam proyek:

```bash
pnpm tsc --noEmit
```

Script lint, unit test, integration test, dan Playwright mengikuti konfigurasi repository aktual. Jangan mengasumsikan nama script sebelum memeriksa `package.json`.

Skenario penting yang perlu dijaga:

- pemilih yang tidak terdaftar di DPT ditolak;
- pemilih yang sudah memilih tidak dapat memilih kembali;
- voting yang tertutup menolak pengiriman suara;
- kandidat tidak valid/tidak aktif ditolak;
- lima request konkuren untuk pemilih yang sama menghasilkan tepat satu `SUCCESS` dan empat `ALREADY_VOTED`;
- hanya satu ballot tersimpan untuk skenario concurrent tersebut;
- pemilih biasa tidak dapat mengakses tally privat.

Jangan menjalankan pengujian destruktif atau menggunakan data pemilih produksi.

## 8. Keamanan dan Privasi

Beberapa aturan mendasar:

- Jangan menerima NIM dari browser sebagai bukti identitas pemilih.
- Validasi identitas dan otorisasi pada server.
- Jangan mengekspos service-role key atau secret ke browser.
- Jangan menyimpan identitas pemilih pada record ballot.
- Jangan menambahkan IP/session ID/precise timestamp ke ballot tanpa review arsitektur dan privasi.
- Jangan menampilkan tally privat kepada pemilih umum selama voting berlangsung.
- Jangan memasukkan DPT, token, credential, atau data ballot ke Git.
- Perubahan pada autentikasi, DPT, voting RPC, tally, dan RBAC wajib melalui review keamanan.

Lihat `SECURITY.md`, `AUTHENTICATION.md`, dan `DATABASE.md` untuk rincian.

## 9. Kontribusi

Sebelum mengirim perubahan:

1. Baca PRD dan dokumen teknis yang terkait.
2. Buat branch kerja.
3. Jaga perubahan tetap fokus.
4. Tambahkan atau perbarui pengujian.
5. Jalankan typecheck dan pemeriksaan lain yang tersedia.
6. Perbarui dokumentasi bila perilaku atau kontrak berubah.
7. Buat pull request dengan ringkasan, test evidence, serta analisis risiko.

Lihat `CONTRIBUTING.md` untuk pedoman lebih lengkap.

Branch model, protected branch, jumlah reviewer minimum, dan CI checks wajib: **TBD**.

## 10. Environment dan Deployment

Lingkungan development, staging, dan production harus dipisahkan, termasuk:

- URL aplikasi;
- Microsoft Entra configuration;
- Supabase project;
- credential dan secret;
- data;
- logging dan monitoring.

Platform hosting, URL resmi, pipeline CI/CD, serta mekanisme secret manager: **TBD**.

Ikuti `ENVIRONMENT.md` dan `DEPLOYMENT.md`. Jangan melakukan deployment production sebelum checklist release dan persetujuan operasional terpenuhi.

## 11. Status dan Batasan Dokumentasi

Dokumentasi ini disusun dari PRD/UI dan dokumen teknis yang tersedia. Beberapa detail masih menunggu verifikasi terhadap source code dan konfigurasi aktual, termasuk:

- struktur direktori repository;
- versi Node.js dan dependency;
- nama script pada `package.json`;
- nama environment variables yang benar-benar digunakan;
- provider hosting dan domain;
- claim Microsoft Entra yang menjadi identifier kanonis;
- matriks role dan permission final;
- migration/schema SQL aktual;
- status implementasi dan hasil pengujian.

**Jangan menganggap sebuah fitur telah selesai hanya karena sudah dijelaskan dalam dokumentasi.** Status implementasi harus didukung oleh source code, pengujian, dan bukti deployment yang relevan.

## 12. Informasi Proyek yang Perlu Dilengkapi

| Item | Status |
|---|---|
| URL repository | TBD |
| URL aplikasi development | TBD |
| URL aplikasi staging | TBD |
| URL aplikasi production | TBD |
| Maintainer/technical owner | TBD |
| Kontak panitia/helpdesk | TBD |
| Versi Node.js | TBD |
| Versi pnpm | TBD |
| Branch utama | TBD |
| CI/CD provider | TBD |
| Hosting provider | TBD |
| Release version | TBD |

## 13. Dokumen Sumber dan Tata Kelola

Dokumen sumber kebutuhan produk yang menjadi acuan:

- `PRD.md` — Product Requirements Document.
- `UI.md` — UI specification.

Jika ada konflik antardokumen, jangan menyelesaikannya dengan asumsi pribadi. Catat konflik, identifikasi pemilik keputusan, dan perbarui dokumen terkait setelah keputusan disetujui.

---

**Maintainer note:** README ini adalah entry point dokumentasi. Perbarui tautan dan instruksi setup setelah struktur repository serta konfigurasi aktual diverifikasi.


## Confirmed identity and deployment decisions (2026-10-31)

- Entra tenant and app registration are created and personally managed by the project owner.
- App registration is multitenant, but server-side validation restricts access to the verified Telkom University tenant ID.
- Voter eligibility is determined by matching the validated institutional identity against the KEMA DPT for cohorts 2023–2026 (`nim`, `email`, `name`, `generation`).
- Initial DPT matching uses institutional email; proposed stable binding uses verified `tid` + `oid`.
- Admin dashboard route: `/admin/dashboard`.
- Hosting direction: Google Cloud Run + Supabase.


## Current decisions (2026-10-31)

- Hosting direction: Cloud Run (application) + Supabase (PostgreSQL).
- Entra: personally managed project tenant; multitenant App Registration restricted server-side to the verified Telkom University tenant ID.
- Initial testing: synthetic dummy accounts with isolated mock authentication; dummy auth is prohibited in production. Real Entra integration testing follows after the official Telkom tenant ID is obtained.
- DPT source: KEMA, cohorts 2023–2026; required fields `nim`, `email`, `name`, `generation`.
- Admin authorization: database-backed `admin_users` whitelist with `kpr_admin`, `auditor`, and `super_admin`; see `AUTHENTICATION.md` for the permission matrix.

## Operational policy status (31 October 2026)
- KPR Admin controls opening and closing voting.
- Superadmin controls emergency maintenance and technical recovery.
- KPR Admin decides whether voting resumes after technical readiness is confirmed.
- Schedule extensions require KPR and the authorized Pemira authority; the exact authority remains TBD pending official rules.
- Database state is authoritative for uncertain vote transactions.
- All incidents must be recorded.
See `OPERATIONS.md`, `ADMIN_GUIDE.md`, `PRD.md`, and `SECURITY.md`.

## Publication policy status (31 October 2026)
Official results are announced by KPR Admin on a KPR-scheduled date/time after Auditor review and KPR approval. Publication channels are the public results dashboard and official PDF. Only aggregate candidate totals, turnout, and generation-level participation may be published. Post-publication corrections require KPR approval, Auditor review, and retained version history. See `OPERATIONS.md`, `ADMIN_GUIDE.md`, `PRD.md`, and `SECURITY.md`.

## Data retention status (31 October 2026)
DPT and Entra identity mapping are retained for 1 year after result approval; anonymous ballots and minimized audit logs are archived permanently; receipt verification hashes are retained for 1 year. Relevant deletion is suspended during disputes or official examinations. See `OPERATIONS.md`, `SECURITY.md`, `PRD.md`, and `ADMIN_GUIDE.md`.

## Ownership and handover status (31 October 2026)
HMIF is the organizational owner and long-term operator. Handover requires at least two technical administrators, organizational access to code/infrastructure/backup/domain, MFA, secure secrets, recovery documentation, and restore testing. Personal Entra tenant ownership remains a continuity risk to resolve before production. See `OPERATIONS.md`, `ADMIN_GUIDE.md`, `PRD.md`, and `SECURITY.md`.
