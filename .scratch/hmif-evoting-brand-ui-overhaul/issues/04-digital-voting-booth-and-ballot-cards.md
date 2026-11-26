# 04: Perombakan Bilik Suara Digital, Kartu Paslon, dan Sticky Action Bar

**What to build:** Pemilih di dalam Bilik Suara Digital dapat meninjau setiap pasangan calon Chairman & Vice Chairman HMIF beserta opsi Kotak Kosong dalam tata letak bersih dan objektif tanpa bias visual. Timer sesi ditampilkan dalam angka tabular yang stabil, foto kandidat memiliki outline netral 1px, modal detail dan konfirmasi mudah dipindai, serta bilah aksi bawah pada ponsel menghormati safe-area tanpa menutupi kartu pilihan terakhir.

**Blocked by:** 01: Fondasi Design System, Tipografi Baru, dan Tema Ganda (Light/Dark)

**Status:** ready-for-agent

- [ ] Kartu Paslon dan Kartu Kotak Kosong menerapkan hierarki tipografi `Plus Jakarta Sans`, nomor urut editorial tabular, concentric border radius, border struktural 1px, dan outline foto 1px (`black/10` di terang, `white/10` di gelap).
- [ ] Countdown sisa waktu sesi menggunakan `IBM Plex Mono` dengan `tabular-nums` sehingga angka tidak bergeser secara horizontal setiap detik.
- [ ] Seluruh tombol interaktif di Bilik Suara Digital dan modal konfirmasi menggunakan `scale(0.96)` saat ditekan, properti transisi spesifik (bukan `transition: all`), dan mendukung navigasi keyboard penuh (termasuk tutup modal dengan Escape).
- [ ] Sticky bottom action bar tetap ringkas di mobile, menghormati `env(safe-area-inset-bottom)`, dan menyisakan jarak gulir memadai agar kartu terakhir dapat dilihat penuh.
- [ ] Tidak ada perubahan pada mekanisme transaksi atomik, idempotensi, maupun isolasi Surat Suara Anonim; suite Playwright `voting-flow` dan `test-modal-scroll` serta `pnpm tsc --noEmit` lulus.
