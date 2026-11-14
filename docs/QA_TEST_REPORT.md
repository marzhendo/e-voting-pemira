# Laporan Pengujian Mutu (QA Test Report) & Verifikasi Sistem
## Pemira HMIF E-Voting Platform — Telkom University Purwokerto

**Tanggal Pengujian:** 13 November 2026  
**Status QA:** ✅ **100% PASSED (Production Ready)**  
**Target Environment:** Next.js 14 (App Router), TypeScript, TailwindCSS, Supabase (PostgreSQL)  
**Total Pengujian Berhasil:** **51 Unit/Integration Tests + 31 Playwright E2E Tests + 0 TypeScript Errors**

---

## 1. Ringkasan Eksekutif (Executive Summary)

Pengujian jaminan mutu (Quality Assurance) menyeluruh telah dieksekusi pada seluruh lapisan arsitektur platform E-Voting Pemira HMIF. Pengujian mencakup:
1. **Pembersihan dan Transformasi Data Mahasiswa (DPT):** Memproses dataset mentah `Mahasiswa IF_ 03112026.xlsx` menjadi file bersih `dpt_mahasiswa_hmif_clean.csv` siap impor dengan 1.231 mahasiswa aktif tanpa anomali.
2. **Validasi Kompilasi & Tipe Data:** Pemeriksaan statis TypeScript tanpa error (`pnpm tsc --noEmit`) dan build produksi Next.js 14 (`pnpm build`) 100% sukses.
3. **Pengujian Unit & Integrasi Sistem:** 11 berkas pengujian (`node --test tests/*.test.mjs`) yang memvalidasi 51 skenario kritis.
4. **Pengujian End-to-End (E2E) Browser:** 9 berkas pengujian Playwright (`npx playwright test`) yang memvalidasi 31 skenario browser nyata, mencakup alur login voter & admin, bilik suara atomik, audit log, manajemen paslon, ekspor BAST, hingga responsivitas layar ponsel dan penguncian scroll modal.

---

## 2. Pembersihan & Normalisasi Data DPT Mahasiswa

Dataset mentah diperoleh dari berkas Excel di root repositori: `Mahasiswa IF_ 03112026.xlsx`.

### 2.1 Metrik Dataset

| Parameter | Data Mentah (`.xlsx`) | Data Bersih (`dpt_mahasiswa_hmif_clean.csv`) |
| :--- | :--- | :--- |
| **Jumlah Baris** | 1.232 baris (1 header + 1.231 baris data) | 1.232 baris (1 header + 1.231 baris data) |
| **Kolom Awal** | `NIM`, `Nama`, `Kelas`, `Kode Dosen`, `Blog` | `nim`, `name`, `email`, `generation` |
| **Kolom Dihapus** | - | `Kelas` (tidak relevan), `Kode Dosen` (tidak relevan) |
| **Duplikasi NIM** | 0 duplikasi | 0 duplikasi (100% Unik) |
| **Duplikasi Email**| 0 duplikasi | 0 duplikasi (100% Unik) |
| **Domain Email** | 100% valid `@student.telkomuniversity.ac.id` | 100% valid `@student.telkomuniversity.ac.id` |

### 2.2 Aturan Normalisasi & Transformasi

1. **Format Nama:** Mengubah format nama kapital terbalik `"LASTNAME, FIRSTNAME"` menjadi Title Case yang rapi dan alami `"Firstname Lastname"`.
2. **Ekstraksi Angkatan (Generation):** Mendeteksi pola transisi format NIM Telkom University Purwokerto:
   - **8 Digit** (contoh: `19102211`, `20102034`, `21102001`): Dua digit pertama menentukan tahun angkatan (`2019`, `2020`, `2021`).
   - **10 Digit** (contoh: `2210200001`, `2310200001`): Dua digit pertama menentukan tahun angkatan (`2022`, `2023`).
   - **12 Digit** (contoh: `103012400001`, `103012500001`, `103012600001`): Digit ke-6 dan ke-7 menentukan tahun angkatan (`2024`, `2025`, `2026`).
3. **Distribusi Angkatan Mahasiswa Terdata:**
   - **2019:** 2 mahasiswa
   - **2020:** 41 mahasiswa
   - **2021:** 45 mahasiswa
   - **2022:** 114 mahasiswa
   - **2023:** 312 mahasiswa
   - **2024:** 268 mahasiswa
   - **2025:** 252 mahasiswa
   - **2026:** 197 mahasiswa  
   **Total:** **1.231 mahasiswa aktif HMIF**

### 2.3 Lokasi & Struktur Berkas Hasil

- **Path:** `c:\Users\Pongo\Documents\Programming\project\e-voting\dpt_mahasiswa_hmif_clean.csv`
- **Header:** `nim,name,email,generation`
- **Contoh Data:**
  ```csv
  nim,name,email,generation
  19102211,Fatwa Meilidya,fatwamel@student.telkomuniversity.ac.id,2019
  19102257,Ibnu Aulianto,ibnuaulia@student.telkomuniversity.ac.id,2019
  20102034,Arga Dhifa Alfathoni,argadhifa@student.telkomuniversity.ac.id,2020
  ...
  103012600197,Siti Rahmawati,srahmawati@student.telkomuniversity.ac.id,2026
  ```

---

## 3. Verifikasi Invarian Keamanan & Integritas Data

Berdasarkan aturan konstitusi sistem Pemira HMIF (`AGENTS.md`), seluruh invarian keamanan telah terverifikasi:

| Invarian | Implementasi & Mekanisme Pengamanan | Status Verifikasi |
| :--- | :--- | :--- |
| **BALLOT SECRECY** | Dilarang keras ada foreign key, kolom NIM, IP, atau user_id di tabel `ballots`. Audit log, struk bukti vote, dan export CSV tidak pernah menyimpan asosiasi pemilih dengan kandidat pilihan. | ✅ **VERIFIED & IMMUTABLE** |
| **ATOMIC TRANSACTION** | Pencoblosan menggunakan transaksi Supabase RPC atomik (`cast_vote_atomic`). Operasi `has_voted = true` dan `INSERT INTO ballots` berjalan satu siklus; gagal salah satu otomatis rollback. | ✅ **VERIFIED & ROBUST** |
| **RESTRICTED VISIBILITY** | Proteksi role-based access control (RBAC). Mahasiswa/voter diblokir total dari API tally (`/api/admin/tally`). Auditor hanya dapat membaca. KPR Admin tidak dapat mengubah maintenance mode. | ✅ **VERIFIED & ENFORCED** |
| **RACE CONDITION & IDEMPOTENCY** | Simulasi penembakan request simultan (concurrent race condition) membuktikan pemilih tidak bisa mencoblos ganda. Token hash vote hanya dapat digunakan satu kali. | ✅ **VERIFIED (0 Double Votes)** |
| **SUPERADMIN PROTECTION** | Akun Superadmin utama (`superadmin@telkomuniversity.ac.id`) dilindungi secara mutlak: tidak dapat dihapus, diturunkan rolenya, atau diubah statusnya baik dari DPT maupun Admin store. | ✅ **VERIFIED & HARDENED** |

---

## 4. Hasil Pengujian Unit & Integrasi (51/51 PASSED)

Pengujian dieksekusi via `node --test tests/*.test.mjs` dengan hasil 51 passed (durasi ~1,08 detik):

```
✔ Dynamic Paslon Management, Kotak Kosong Toggle, & Election Schedule Engine (5 tests)
  1. Admin can update Paslon 1 name and remove/clear its photo
  2. Single Paslon Mode (1 Candidate): Kotak Kosong is MANDATORY
  3. Multi Paslon Mode (2+ Candidates): Admin can toggle Kotak Kosong ON and OFF
  4. Operational Election Schedule: Bilik Suara is ACTIVE only within window
  5. Chairman & Vice Chairman CV URLs are properly bound to candidate records

✔ Audit Trail & Admin Management Tests (5 tests)
  1. Primary Superadmin is registered and protected in admin store
  2. Admin User Store: CRUD & Email Duplication prevention
  3. RBAC Invariant: Only super_admin has manage_admins permission
  4. Audit Log Store records, retrieves, and filters administrative actions
  5. BALLOT SECRECY INVARIANT: Audit logs must never leak secret voter choices

✔ Auth & Session Unit Tests (5 tests)
  1. Creates and verifies JWT session token
  2. Extracts client IP behind Cloud Run reverse proxy from X-Forwarded-For
  3. Rejects expired JWT token
  4. Strict Email Domain Validation: Only @student.telkomuniversity.ac.id, valid NIM, or emergency Superadmin
  5. Session Cookie Standards: Enforces SameSite=Strict and HttpOnly

✔ High Concurrency Race-Condition & Idempotency Simulation (2 tests)
  1. Simultaneous duplicate ballot submission enforces atomic 1-voter-1-vote invariant
  2. Concurrent voters across multiple threads cast independent ballots atomically

✔ Superadmin DPT Management & Ballot Secrecy Invariants (4 tests)
  1. deleteSingleVoter deletes target voter and rejects deleting primary superadmin
  2. deleteVotersBatch deletes multiple selective voters while protecting superadmin
  3. resetAllVoters handles reset_to_default, clear_all, and reset_vote_status properly
  4. BALLOT SECRECY INVARIANT: Deleting DPT records never modifies or cascades to anonymous ballots

✔ Fase 3: Export Tally, Audit Logs, and BAST Public Verification (4 tests)
  1. Tally CSV Export conforms to Ballot Secrecy: zero voter PII, zero tokens
  2. Audit Log CSV Export formats timestamp, actor, action, and details
  3. BAST SHA-256 Integrity Hash Verification detects matches and tampering
  4. BAST Verification Response guarantees Ballot Secrecy

✔ Just-In-Time (JIT) 6-Digit OTP Cryptography & Auth Logic Tests (7 tests)
  1. generate6DigitPin produces valid 6-digit numeric codes with high randomness
  2. hashPin and verifyPinHash correctly validate matching PIN and reject mismatches
  3. maskEmail obfuscates local part for privacy while keeping domain clear
  4. OTP Lifecycle: Rate limiting, expiration check, and 3-attempt lockout
  5. escapeHtml properly neutralizes HTML tags and dangerous characters
  6. resolveSafeCtaUrl resolves relative path to absolute URL and blocks dangerous protocols
  7. Concurrent failed OTP verifications strictly enforce 3-attempt lockout without TOCTOU race condition

✔ RBAC & Permission Verification Tests (4 tests)
  1. Voters have zero administrative permissions
  2. KPR Admin has election management permissions but cannot toggle emergency maintenance
  3. Auditor is strictly read-only and cannot see live tally before election close
  4. Superadmin has system administration permissions

✔ Realtime Tally, DPT Management, and Anonymous Ballot Casting Tests (4 tests)
  1. Candidate Store CRUD: Add, update, and delete candidates properly
  2. DPT Store: Quick-add custom voter with test email for SMTP delivery
  3. Atomic Ballot Casting: Enforces Ballot Secrecy and 1-voter-1-vote
  4. Real-time Tally Aggregation: Accurately computes turnout and candidate vote counts

✔ Super Admin Functional Audit & Integration Verification (6 tests)
  1. Excel (.xlsx) DPT Generation & In-Memory Parsing with SheetJS
  2. DPT Duplicate and Malformed Record Detection Logic
  3. Candidate Deletion Integrity & Ballot Protection Guarantee
  4. Multi-Role Election Settings Guard Logic
  5. Audit Logs Formatting & Ballot Secrecy Verification
  6. Primary Superadmin Immutability in Admin Management

✔ Voting Engine & Receipt Cryptography Unit Tests (5 tests)
  1. Generates cryptographic receipt token with high entropy and valid SHA-256 hash
  2. Consecutive receipt generation generates completely unique tokens and hashes
  3. Validates UUID format for candidateId
  4. Ballot Secrecy: Receipt payload NEVER contains candidate choice
  5. Receipt verification logic matches SHA-256 hash against voter whitelist
```

---

## 5. Hasil Pengujian End-to-End (E2E) Playwright (31/31 PASSED)

Pengujian E2E dijalankan menggunakan Chromium Headless pada port `http://localhost:3002` dengan build produksi asli:

| File Spesifikasi | Deskripsi Pengujian | Hasil |
| :--- | :--- | :--- |
| `tests/e2e/smoke.spec.ts` | Validasi homepage publik, loading awal, dan navigasi ke login | **2/2 PASSED** |
| `tests/e2e/auth-flow.spec.ts` | Validasi alur autentikasi voter NIM OTP, token exchange, proteksi rute, dan Super Admin Direct Login | **7/7 PASSED** |
| `tests/e2e/voting-flow.spec.ts` | Alur penuh pencoblosan bilik suara, modal konfirmasi, penyerahan suara anonim, dan struk receipt | **4/4 PASSED** |
| `tests/e2e/admin-candidates.spec.ts` | Pengelolaan kandidat paslon: create, update foto & visi-misi, toggle Kotak Kosong, aktivasi/deaktivasi, dan hapus paslon | **5/5 PASSED** |
| `tests/e2e/admin-dpt-superadmin.spec.ts`| Operasi DPT Superadmin: seleksi batch, hapus tunggal, proteksi superadmin, dan preview impor | **2/2 PASSED** |
| `tests/e2e/admin-audit-manage.spec.ts` | Riwayat audit log tak terhapuskan, filter waktu, dan manajemen admin (tambah/hapus) | **2/2 PASSED** |
| `tests/e2e/export-and-bast-verify.spec.ts`| Unduh rekapitulasi Tally CSV, unduh Audit Log CSV, dan verifikasi publik hash integritas BAST SHA-256 | **3/3 PASSED** |
| `tests/e2e/mobile-responsive.spec.ts` | Responsivitas viewport ponsel (iPhone 13 / Android 390px): header ringkas, tap targets, drawer admin | **3/3 PASSED** |
| `tests/e2e/test-modal-scroll.spec.ts` | Verifikasi penguncian scroll latar belakang (`body` lock) saat modal konfirmasi vote, broadcast, dan detail paslon terbuka | **3/3 PASSED** |

---

## 6. Perbaikan Bug & Penyempurnaan Sistem Selama QA

Selama rangkaian QA, ditemukan dan diperbaiki beberapa detail teknis penting:
1. **Pencegahan Error Update Paslon Tanpa Foto (`photo_url NOT NULL`):**
   - *Gejala:* Saat admin memilih "Hapus Foto", frontend mengirimkan nilai string kosong / null yang memicu error constraint PostgreSQL `null value in column "photo_url" violates not-null constraint`.
   - *Solusi:* Di `app/api/admin/candidates/route.ts`, diterapkan fallback otomatis `updatePayload.photo_url = updates.photo_url || ''` sehingga PostgreSQL menerima string kosong alih-alih null.
2. **Penyempurnaan Form Impor Excel:**
   - DPT import route (`/api/admin/dpt/import` dan `/api/admin/dpt/preview`) mendukung file `.csv`, `.xlsx`, dan `.xls` secara penuh dengan pemetaan header fleksibel (mendukung header `NIM`, `Nama`, `Email`, `Angkatan` / `Generation`).
3. **Penyesuaian Asersi Sinkronisasi Tabel DPT:**
   - E2E test `admin-dpt-superadmin.spec.ts` disempurnakan dengan penantian eksplisit (`toBeVisible`) sebelum penghitungan checkbox untuk mengakomodasi jeda loading data dari database Supabase.

---

## 7. Panduan Langkah Impor DPT bagi Administrator

Karena berkas CSV bersih telah tersedia, Anda dapat langsung mengimpornya ke dalam sistem melalui antarmuka Super Admin:

1. **Buka Aplikasi:**
   - Masuk ke dashboard admin di `http://localhost:3000/login` menggunakan akun **Superadmin** (`superadmin@telkomuniversity.ac.id` atau tombol Emergency Access di halaman login).
2. **Navigasi ke Tab DPT:**
   - Di dashboard navigasi samping, klik menu **"Daftar Pemilih Tetap (DPT)"**.
3. **Pilih Tombol Impor DPT:**
   - Klik tombol **"Import DPT (.csv, .xlsx)"** di bagian atas kanan tabel DPT.
4. **Unggah File:**
   - Pilih berkas `dpt_mahasiswa_hmif_clean.csv` yang berada di folder root proyek ini.
5. **Pratinjau Data:**
   - Sistem akan menampilkan pratinjau data: jumlah baris valid (1.231), deteksi format, dan memastikan tidak ada duplikasi data.
6. **Konfirmasi & Simpan:**
   - Klik tombol **"Konfirmasi Impor"**. Data 1.231 mahasiswa akan tersimpan secara aman ke dalam tabel `voters_whitelist` di database Supabase.
