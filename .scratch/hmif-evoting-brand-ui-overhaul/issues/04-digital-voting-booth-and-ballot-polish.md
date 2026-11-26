# 04: Perombakan Bilik Suara Digital, Kartu Paslon, dan Sticky Action Bar

**What to build:** Merombak antarmuka Bilik Suara Digital, Kartu Paslon, Kartu Kotak Kosong, modal detail visi-misi/CV, modal konfirmasi pengiriman Surat Suara Anonim, modal keluar, dan modal sesi kedaluwarsa agar mengikuti sistem desain baru. Menerapkan nomor urut editorial, outline foto 1px netral murni, concentric border radius pada kartu dan kontainer dalam, angka `tabular-nums` pada timer sesi, efek tekan `scale(0.96)`, serta bilah aksi bawah (sticky action bar) yang kompak dan menghormati safe-area mobile tanpa menutupi opsi terakhir.

**Blocked by:** 01: Fondasi Design System, Tipografi Baru, dan Tema Ganda (Light/Dark)

**Status:** done

- [x] Bilik Suara Digital mendukung mode terang dan mode gelap secara penuh, dengan status kartu terpilih ditandai jelas secara visual dan non-warna (ikon centang + label + border tegas).
- [x] Timer sesi menggunakan `IBM Plex Mono` dan `tabular-nums` sehingga tidak bergeser setiap detik; foto pasangan calon memiliki outline halus 1px netral dan rasio konsisten tanpa terpotong.
- [x] Kartu Paslon tetap menampilkan sebutan jabatan resmi AD/ART **Chairman dan Vice Chairman** HMIF, serta seluruh modal dapat ditutup dengan tombol `Escape` dan dioperasikan penuh via keyboard.
- [x] Bilah aksi bawah di mobile tidak menutupi kartu pilihan terakhir, mematuhi `safe-area-inset-bottom`, dan seluruh target sentuh minimal 44x44px dengan jarak cukup.
- [x] Invarian keamanan voting (Surat Suara Anonim, transaksi atomik, idempotensi) tetap utuh dan lulus `tests/voting.test.mjs`, `tests/candidate-photo-framing.test.mjs`, serta `pnpm tsc --noEmit` (catatan: E2E `voting-flow.spec.ts` menggunakan akun dummy `103012300001` yang tidak ada di DPT Supabase produksi pada `.env.local`).
