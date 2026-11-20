# Panduan UI Pemira HMIF

Dokumen ini menggantikan blueprint lama (SSO Microsoft, kartu putih, split-screen). Sumber kebenaran adalah source di `app/`, `components/`, dan `tailwind.config.ts`. Arah visual: **Editorial HMIF, dark–cream–gold** (dipilih pada `anti-slop/audit-003-2026-11-20.md`, opsi A).

Batas yang tidak berubah: copywriting disetujui pengguna, perilaku aplikasi, alur autentikasi NIM/PIN, dan invarian keamanan voting (lihat `AGENTS.md`).

## Peran warna

| Token                          | Hex                        | Peran                                                                                                        |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `brand-charcoal` / `hmif-dark` | `#1E1E1E`                  | Kanvas landing; teks di atas gold dan cream.                                                                 |
| `surface*`                     | `#0A0A0A` sampai `#383838` | Permukaan aplikasi gelap (login, bilik suara, admin).                                                        |
| `primary` (gold)               | `#EBBD1C`                  | Aksi utama dan pilihan pemilih saja: CTA, tombol konfirmasi, state terpilih, fokus input aktif.              |
| `secondary` (yellow)           | `#F3EC51`                  | Hover tombol gold. Bukan bidang besar.                                                                       |
| `brand-cream`                  | `#F8FAE0`                  | Judul landing dan permukaan baca visi–misi. Teks di atasnya `hmif-dark` (isi) atau `hmif-gray-dark` (label). |
| `on-surface`                   | `#FFFFFF`                  | Teks utama di atas gelap, termasuk judul identitas dan timer.                                                |
| `on-surface-variant`           | `#B5B5B5`                  | Deskripsi, ikon sekunder, metadata di atas gelap.                                                            |
| `error`                        | `#FF6B72`                  | Teks, ikon, border, dan tint error di atas surface gelap.                                                    |
| `error-solid` / `hmif-red`     | `#B71B25`                  | Bidang solid berteks putih (tombol destruktif, toggle bahaya). Jangan dipakai sebagai teks di atas gelap.    |
| `hmif-blue` / `tertiary`       | `#29388B`                  | Cadangan untuk aksi sekunder. Tidak dipakai sekarang.                                                        |

Kontras pasangan solid: `#1E1E1E` di atas `#EBBD1C` 9,39:1; `#FFFFFF` di atas `#B71B25` 6,56:1; `#B71B25` di atas `#1E1E1E` hanya 2,53:1, sebab itu merah resmi tidak boleh jadi teks gelap. Nilai `error` `#FF6B72` di atas `#1E1E1E` dihitung manual sekitar 6,0:1; verifikasi ulang dengan pengukuran komposit di browser bila token diubah.

Warna success (emerald) tetap sebagai warna status fungsional di luar palet brand.

## Identitas lintas halaman

- Logo HMIF di sisi kiri teks (header landing dan bilik suara) atau di atas teks (kartu login).
- Baris pertama: `PEMIRA HMIF 2026/2027`, `text-sm`, bold, uppercase, `tracking-wider`, putih. Bukan gold.
- Baris kedua: `text-xs`, `on-surface-variant`.
- Display memakai Bebas Neue, informasi memakai Montserrat.

## Layar

**Landing (`/`)**: kanvas charcoal, satu motif halftone di tepi (aset `public/assets/img/*.jpg`), judul cream, satu CTA gold ke `/login`. Header dan footer solid tanpa blur. Tidak ada aura atau vignette tambahan.

**Login (`/login`)**: kartu satu kolom maksimal 440px dengan alur NIM lalu PIN 6 digit. Tidak ada tombol Microsoft. Instruksi 14px.

**Bilik suara (`/vote`)**: kanvas `surface`, kartu paslon setara. Kotak kosong memakai struktur dan perlakuan cream yang sama dengan kartu paslon dan tidak diberi treatment bahaya. Gold paling kuat hanya pada pilihan pemilih dan tombol konfirmasi.

**Detail paslon**: modal dengan Visi dan Misi pada permukaan cream; perlakuan identik untuk semua paslon.

**Tanda terima (`/receipt`)**: tidak mencantumkan pilihan kandidat.

**Admin**: sidebar dan kanvas gelap, merah solid hanya untuk tindakan destruktif.

## Ukuran teks

- Instruksi dan informasi yang dibutuhkan untuk menyelesaikan tugas: 14px ke atas (`text-sm`), `leading-relaxed`.
- Metadata dan label uppercase: 12px (`text-xs`). Hindari 11px.
- Area sentuh minimal 44px.

## Netralitas kandidat

Rasio foto, ukuran nomor, ruang isi, urutan, dan akses detail setara untuk semua paslon. Dilarang membuat satu kandidat lebih menarik lewat warna, ukuran, glow, atau animasi khusus. Tidak ada autoplay video di bilik suara.
