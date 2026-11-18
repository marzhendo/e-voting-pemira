# Laporan Audit Keamanan & Codebase Design: Pemira HMIF E-Voting

**Tanggal Audit:** 18 November 2026  
**Cakupan:** Arsitektur Aplikasi, API Route Handlers (`app/api/**`), Autentikasi & Sesi (`lib/auth/**`), Kontrol Akses RBAC (`lib/rbac/**`), Migrasi SQL & RPC Supabase (`supabase/migrations/**`), dan Utilitas Inti (`lib/**`).  
**Metodologi:** Open Code Review & Deep-Module Codebase Design Evaluation.

---

## 1. Ringkasan Eksekutif

Platform E-Voting Pemira HMIF telah memiliki fondasi database PostgreSQL/Supabase yang kokoh terhadap transaksi atomik (*One-Man-One-Vote*), isolasi anonimitas surat suara (*Ballot Secrecy* tanpa relasi/foreign key ke pemilih), Row-Level Security (RLS) ketat, serta penghancuran hash OTP otomatis saat gagal 3x.

Namun, pada audit menyeluruh lapisan aplikasi dan API routes ditemukan **2 temuan Critical**, **4 temuan High**, dan **4 temuan Medium**, serta beberapa utang arsitektur desain (*design debt*). Seluruh celah keamanan Tahap 1 telah ditambal (*patched*), sementara pemecahan arsitektur UI/repository dipetakan pada Tahap 2.

---

## 2. Evaluasi Progres *Codebase Design*

### A. Lapisan yang Sudah Solid (Deep Modules)
- **Transaksi Atomik SQL (`supabase/migrations/00003_hardened_vote_rpc.sql`, `00006_atomic_otp_procedures.sql`, `00010_hardened_otp_invalidation.sql`)**:
  Logika penguncian baris (`FOR UPDATE`), validasi jendela waktu pemilihan & maintenance mode, mutasi `has_voted`, dan penyisipan surat suara anonim terenkapsulasi rapi dalam Stored Procedure `SECURITY DEFINER` yang hak eksekusinya dicabut dari `PUBLIC`, `anon`, dan `authenticated`.
- **Kebijakan RLS & Append-Only (`supabase/migrations/00004_rls_policies.sql`, `00008_enforce_append_only_storage.sql`)**:
  Akses langsung dari browser ke tabel sensitif (`ballots`, `voters_whitelist`, `audit_logs`, `admin_users`) diblokir total di tingkat database.
- **Modul Terfokus (`lib/receipt/generator.ts`, `lib/rbac/permissions.ts`, `lib/auth/client-ip.ts`)**:
  Memiliki tanggung jawab tunggal, antarmuka bersih, dan mudah diuji secara terisolasi.

### B. Utang Desain Struktural (*Codebase Design Debt* — Roadmap Tahap 2)
1. **God Component Monolith — `app/(admin)/admin/dashboard/page.tsx` (5.529 baris)**:
   Seluruh 7 tab dashboard admin beserta modal, ekspor PDF/CSV, import Excel, dan handler API masih menyatu dalam satu file.  
   *Rekomendasi:* Pecah ke komponen modular per fitur (`components/admin/tabs/TallyTab.tsx`, `CandidatesTab.tsx`, `DptTab.tsx`, `SettingsTab.tsx`, `BroadcastTab.tsx`, `AuditLogsTab.tsx`, `AdminsTab.tsx`).
2. **Leaky Seam & Duplikasi Adapter Supabase vs Dev JSON Store**:
   Setiap Route Handler mengulang blok percabangan `if (isSupabaseConfigured()) ... else ...` secara manual.  
   *Rekomendasi:* Ekstrak ke pola Repository/Adapter dengan seam tunggal (misal `VoterRepository`, `CandidateRepository`, `AuditRepository`).
3. **Duplikasi Alur Voting (`app/api/ballots/route.ts` vs `lib/actions/ballot.ts`)**:
   Validasi sesi, pembuatan receipt, RPC `cast_ballot_secure`, dan pembaruan cookie masih ditulis di dua tempat.  
   *Rekomendasi:* Satukan dalam satu fungsi inti `castVoteCore(session, candidateId)` di `lib/ballots/cast-core.ts`.
4. **Duplikasi Helper `getLogDescription`**:
   Masih terduplikasi di `app/api/admin/audit-logs/route.ts` dan `app/api/admin/audit-logs/export/route.ts`.

---

## 3. Matriks Kerentanan Keamanan & Status Perbaikan

| ID | Severity | Lokasi File | Deskripsi Celah & Dampak | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | `app/api/bast/verify/route.ts` | Endpoint publik `/api/bast/verify?hash=<64-hex>` menerima hash sembarang karena logika `if (!isValidFormat && !isExactMatch)` dan mengembalikan `currentSystemHash` + **live tally lengkap** meski pemilihan masih berjalan (melanggar *Restricted Visibility*). | **FIXED** |
| **SEC-02** | **CRITICAL** | `lib/auth/session.ts`, `lib/auth/otp.ts`, `lib/auth/dummy.ts` | Pengecekan produksi hanya melihat `APP_ENV === 'production'`, mengabaikan `NODE_ENV === 'production'`. Jika `APP_ENV` tidak terset saat runtime `next start`, sistem memakai secret hardcoded di repo untuk menandatangani JWT `super_admin` dan mengizinkan login dummy. | **FIXED** |
| **SEC-03** | **HIGH** | `app/api/admin/candidates/route.ts` | Handler `POST`, `PUT`, `DELETE` memanggil `verifyAdminAccess(session)` tanpa permission `'manage_candidates'` dan tanpa memblokir `auditor`. Selain itu `PUT` melakukan `...updates` tanpa validasi Zod (mass-assignment & risiko menghapus `photo_url` jika tidak dikirim). | **FIXED** |
| **SEC-04** | **HIGH** | `lib/auth/otp.ts`, `app/api/ballots/route.ts` | **Fail-Open Fallback**: Saat `isSupabaseConfigured()` bernilai `true` dan koneksi Supabase error/timeout, OTP & voting jatuh ke file JSON lokal (`dev-voters.json` / `castBallotAtomicDev`), menyebabkan pemilih mendapat tanda terima sah palsu atau privilege admin berasal dari JSON lokal. | **FIXED** |
| **SEC-05** | **HIGH** | `app/api/auth/otp/request/route.ts`, `otp/verify/route.ts`, `receipt/verify/route.ts`, `bast/verify/route.ts` | Belum ada rate limiter berbasis IP pada endpoint publik autentikasi dan verifikasi (rentan spam OTP, enumerasi DPT massal, dan brute-force token). | **FIXED** |
| **SEC-06** | **HIGH** | `app/api/admin/upload/route.ts` | Upload berkas hanya memvalidasi header MIME `file.type` yang mudah dipalsukan tanpa memeriksa **magic bytes** isi file, menggunakan `Math.random()`, dan `DELETE` belum mewajibkan permission `'manage_candidates'` / non-auditor. | **FIXED** |
| **SEC-07** | **MEDIUM** | `app/api/admin/tally/export/route.ts`, `audit-logs/export/route.ts` | Potensi *CSV Formula Injection* karena cell tidak menetralkan karakter pemicu rumus (`=`, `+`, `-`, `@`, `\t`, `\r`). | **FIXED** |
| **SEC-08** | **MEDIUM** | `app/api/admin/dpt/route.ts` | String pencarian `search` disisipkan langsung ke `.or(...)` PostgREST tanpa sanitasi karakter parser (`,`, `.`, `()`). | **FIXED** |
| **SEC-09** | **MEDIUM** | `app/api/admin/broadcast-email/route.ts` | `parseInt(generation, 10)` tidak divalidasi `Number.isInteger`, berisiko mengirim `NaN` ke query PostgreSQL. | **FIXED** |
| **SEC-10** | **MEDIUM** | `next.config.mjs` | Belum menyertakan HTTP Security Headers standar (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`). | **FIXED** |

---

## 4. Rincian Patch Keamanan Tahap 1

1. **`lib/security/env.ts`**: Menyatukan resolver `isProductionEnvironment()` (`APP_ENV === 'production' || NODE_ENV === 'production'`) dan `isDevFallbackAllowed()`.
2. **`lib/security/rate-limit.ts`**: Menambahkan `SlidingWindowRateLimiter` in-memory berbasis IP klien nyata (`X-Forwarded-For` via `getClientIp()`).
3. **`lib/security/upload-validation.ts`**: Verifikasi tanda tangan biner (*magic bytes*) untuk PNG (`89 50 4E 47 0D 0A 1A 0A`), JPEG (`FF D8 FF`), WEBP (`RIFF....WEBP`), dan PDF (`%PDF-`).
4. **`lib/utils/csv.ts`**: Sentralisasi `escapeCsvCell` dengan prefiks kutip tunggal `'` untuk karakter pemicu formula spreadsheet.
5. **Hardening BAST (`/api/bast/verify`)**:
   - Wajibkan pemilihan sudah ditutup (`isClosed`) untuk akses publik, atau sesi panitia aktif (`kpr_admin` / `super_admin`).
   - Perbandingan SHA-256 wajib *exact match* menggunakan `crypto.timingSafeEqual`; menolak hash yang tidak cocok dengan HTTP 404 tanpa membocorkan `currentSystemHash` maupun tally.
   - Menyelaraskan query kandidat dengan `.eq('is_active', true)`.

---

## 5. Checklist Verifikasi Operasional Pra-Rilis

- [ ] Pastikan variabel lingkungan server produksi di VPS memiliki `APP_ENV=production`, `NODE_ENV=production`, `ENABLE_DUMMY_AUTH=false`, `SESSION_SECRET` (acak minimal 32 karakter), dan `OTP_SECRET_SALT` (acak minimal 32 karakter).
- [ ] Jalankan seluruh migrasi SQL (`00001` s.d. `00012`) pada database Supabase produksi.
- [ ] Verifikasi `pnpm tsc --noEmit` menghasilkan 0 error dan seluruh automated tests lulus.
