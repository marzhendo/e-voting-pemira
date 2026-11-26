# 01: Fondasi Design System, Tipografi Baru, dan Tema Ganda (Light/Dark)

**What to build:** Membangun fondasi sistem desain baru untuk Platform E-Voting Pemira HMIF dengan mode terang sebagai default (`#FAFAF7` canvas, `#FFFFFF` surface, `#F8FAE0` highlight, `#1E1E1E` teks utama, `#EBBD1C` aksen utama, `#29388B` aksen institusional) serta mode gelap penuh yang dapat dialihkan pengguna melalui tombol tema di header tanpa kedipan tema saat muat ulang. Memperbarui tipografi global ke `Plus Jakarta Sans` untuk heading dan teks UI serta `IBM Plex Mono` (`tabular-nums`) untuk data faktual, disertai komponen header dan footer bersama yang responsif (termasuk menu mobile berlabel jelas tanpa tautan mati).

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Mode terang aktif sebagai default dan tombol pengalih tema di header dapat beralih ke mode gelap serta menyimpan preferensi lintas halaman tanpa kedipan visual (FOUC).
- [x] Seluruh token warna pada mode terang dan mode gelap mengikuti palet resmi HMIF dan memenuhi kontras minimum WCAG 2.2 AA (4.5:1 teks normal, 3:1 teks besar).
- [x] Font `Plus Jakarta Sans` dan `IBM Plex Mono` termuat global menggantikan `Bebas Neue` dan `Montserrat`, dengan `text-wrap: balance` pada heading dan `text-wrap: pretty` pada paragraf.
- [x] Header dan footer bersama hanya berisi tautan dengan tujuan nyata (Rekapitulasi Suara, Verifikasi BAST, Bantuan KPR), memiliki navigasi mobile yang rapi dengan target sentuh minimal 44x44px, serta dapat dioperasikan penuh dengan keyboard.
- [x] Validasi tipe TypeScript (`pnpm tsc --noEmit`) dan pengujian E2E dasar untuk perpindahan tema lulus tanpa error konsol.
