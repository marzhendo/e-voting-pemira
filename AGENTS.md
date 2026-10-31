# Antigravity Agent Guidelines: Pemira HMIF E-Voting Platform

## 1. Project Context
Sistem pemungutan suara suksesi Kahim/Wakahim HMIF berbasis web Next.js App Router, TailwindCSS, dan Supabase/PostgreSQL. 
Autentikasi menggunakan Microsoft Entra ID SSO dengan validasi DPT internal.

## 2. Invarian Keamanan (Non-Negotiable Rules)
- **BALLOT SECRECY:** DILARANG KERAS membuat foreign key, kolom NIM, user ID, IP address, atau relasi apapun antara tabel pemilih (`voters_whitelist`) dan tabel suara (`ballots`).
- **ATOMIC TRANSACTION:** Proses voting wajib menggunakan Supabase RPC / SQL Transaction atomik: set `has_voted = true` dan `INSERT` ke `ballots` harus terjadi dalam satu transaksi yang tidak bisa dipecah.
- **RESTRICTED VISIBILITY:** API endpoint untuk penghitungan hasil suara (`/api/admin/tally`) wajib diproteksi Middleware dengan verifikasi role panitia. Mahasiswa biasa tidak boleh memiliki akses membaca agregasi suara.
- **IDEMPOTENCY:** Proteksi race condition pada voting. Pastikan pemilih tidak bisa menembakkan request submit berkali-kali secara simultan.

## 3. Tech Stack & Directory Structure
- Framework: Next.js 14/15 (App Router, TypeScript)
- Database & Auth: Supabase (PostgreSQL), `@azure/msal-browser` / NextAuth Azure Provider
- Styling: TailwindCSS (Palet Resmi HMIF Telkom University Purwokerto: Dark #1E1E1E, Gold #EBBD1C, Yellow #F3EC51, Cream #F8FAE0, Red #B71B25, Blue #29388B, Gray Dark #5E5E5E, Gray Light #8B8A8B, White #FFFFFF)
- Testing: Playwright (E2E)

Format direktori:
├── app/
│   ├── (auth)/login/
│   ├── (voter)/vote/
│   ├── (admin)/dashboard/
│   └── api/
├── components/
│   ├── ballot/
│   ├── candidates/
│   └── ui/
├── lib/
│   ├── supabase/
│   └── msal/
└── tests/
    └── e2e/

## 4. Coding Standards
- Selalu gunakan Server Actions atau Route Handlers dengan validasi runtime schema (Zod).
- Semua error handling DB wajib fail-safe: jika salah satu query voting gagal, batalkan seluruh transaksi (rollback).
- Tidak boleh meninggalkan placeholder credential di codebase. Semua variabel masuk ke `.env.local`.

## 5. Automated Verification
- Sebelum menyatakan fitur selesai, jalankan validasi schema TypeScript (`pnpm tsc --noEmit`).
- Pastikan test flow autentikasi dan bilik suara diuji via Playwright.