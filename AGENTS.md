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
- **DEV SERVER CACHE INTEGRITY:** DILARANG menjalankan `pnpm build` atau `next build` secara otomatis ketika server pengembangan (`next dev`) sedang aktif berjalan di lingkungan lokal. Menjalankan build produksi akan menimpa folder `.next/` dan merusak runtime Webpack Hot-Reloader (`Error: Cannot find module './<chunk>.js'`). Gunakan `pnpm tsc --noEmit` untuk memverifikasi integritas tipe tanpa merusak cache dev server.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
