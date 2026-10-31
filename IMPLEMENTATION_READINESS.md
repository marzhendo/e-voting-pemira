# E-Voting Pemira HMIF — Implementation Readiness Checklist

**Versi:** 0.1.0 Draft  
**Tanggal:** 31 Oktober 2026  
**Status:** Pra-implementasi — belum menjadi persetujuan produksi

## 1. Tujuan dan aturan penggunaan

Checklist ini digunakan untuk menentukan apakah tim sudah memiliki keputusan, sumber data, akses, dan kontrol yang cukup untuk memulai implementasi.

Status:
- `[x]` Disepakati sebagai keputusan/desain.
- `[ ]` Belum selesai atau perlu diverifikasi.
- `TBD` Memerlukan keputusan atau informasi tambahan.
- `VERIFY` Harus dibuktikan melalui repository, konfigurasi, atau pengujian.

Persetujuan desain tidak membuktikan bahwa fitur sudah diimplementasikan.

## 2. Keputusan yang sudah disepakati

### Produk dan pemilihan
- [x] Tujuan sistem: Pemira HMIF untuk pemilihan Kahim/Wakahim.
- [x] Prinsip One-Man-One-Vote.
- [x] Ballot dipisahkan dari identitas pemilih.
- [x] Live count tidak dipublikasikan selama pemungutan suara.
- [x] Hasil publikasi melalui dashboard publik dan PDF.
- [x] Informasi publik: suara kandidat/Kotak Kosong, turnout, partisipasi per angkatan.
- [x] Koreksi hasil memerlukan persetujuan KPR, pemeriksaan Auditor, dan jejak versi.
- [x] Aturan Kotak Kosong mengikuti ketentuan final KPR; detail hukumnya belum final.

### Identitas dan autentikasi
- [x] Tenant Entra awal dibuat dan dikelola secara personal.
- [x] App Registration direncanakan multitenant.
- [x] Akses produksi dibatasi ke Tenant ID Telkom University.
- [x] Data DPT yang diminta: NIM, email institusi, nama, angkatan.
- [x] Pencocokan DPT dilakukan oleh aplikasi setelah autentikasi.
- [x] Identitas stabil yang direkomendasikan: kombinasi `tid` + `oid`.
- [x] Pengujian awal menggunakan dummy authentication dan data sintetis.
- [x] Dummy authentication hanya boleh aktif di development/test dan harus ditolak di production.

### Hak akses dan operasional
- [x] `kpr_admin`: operasional Pemira, membuka/menutup voting, mengesahkan hasil setelah pemeriksaan Auditor.
- [x] `auditor`: pemeriksaan hasil, turnout, dan audit log tanpa hak mengubah data operasional.
- [x] `super_admin`: pengelolaan administrator/konfigurasi teknis, maintenance darurat, pemulihan teknis.
- [x] KPR Admin membuka/menutup voting dengan alasan dan audit log.
- [x] Superadmin mengaktifkan maintenance darurat.
- [x] Superadmin menyatakan kesiapan teknis; KPR Admin memutuskan voting dilanjutkan.
- [x] Timeout transaksi diperiksa terhadap database sebelum retry.
- [x] Semua insiden dicatat.
- [x] Perpanjangan jadwal memerlukan persetujuan KPR dan pihak berwenang Pemira.

### Retensi dan kepemilikan
- [x] DPT dan pemetaan identitas Entra: 1 tahun setelah hasil disahkan.
- [x] Ballot anonim: arsip permanen.
- [x] Hash receipt: 1 tahun setelah hasil disahkan.
- [x] Audit log: arsip permanen dengan minimisasi data.
- [x] Legal hold menangguhkan penghapusan data relevan sampai proses selesai.
- [x] HMIF menjadi pemilik organisasi dan pengelola jangka panjang.
- [x] Minimal dua administrator teknis organisasi untuk serah terima.

## 3. Blocker sebelum implementasi inti

### A. Repository dan source of truth
- [ ] Verifikasi repository E-Voting yang benar.
- [ ] Periksa `AGENTS.md`, `SKILLS.md`, `package.json`, `tsconfig.json`, struktur `app/`, dan `.env.example`.
- [ ] Pastikan dokumen PRD/UI/arsitektur yang berlaku sama dengan versi keputusan terakhir.
- [ ] Perbaiki broken references dan nama file dokumentasi.
- [ ] Cocokkan seluruh dokumentasi dengan kode dan migrasi aktual; jangan menganggap dokumen berarti fitur sudah ada.

### B. Identitas Entra dan DPT
- [ ] Buat tenant/App Registration untuk pengembangan.
- [ ] Implementasikan dummy provider terpisah dari provider Entra.
- [ ] Pastikan dummy provider tidak dapat aktif pada environment production.
- [ ] Uji autentikasi dummy dan pemetaan ke DPT sintetis.
- [ ] Dapatkan Tenant ID Telkom University.
- [ ] Verifikasi kebijakan consent/admin consent tenant Telkom.
- [ ] Uji akun mahasiswa Telkom setelah tenant ID tersedia.
- [ ] Konfirmasi format, keakuratan, dan izin penggunaan data DPT dari KEMA.
- [ ] Tentukan prosedur koreksi email/NIM dan rekonsiliasi data DPT.

### C. Keamanan voting dan receipt
- [ ] Pastikan NIM tidak dipercaya dari browser sebagai identitas otoritatif.
- [ ] Identitas pemilih diturunkan dari sesi server yang tervalidasi dan dipetakan ke DPT.
- [ ] RPC memeriksa voting open, waktu mulai/akhir, maintenance mode, status pemilih, dan kandidat aktif.
- [ ] Operasi update `has_voted` dan insert ballot berlangsung atomik.
- [ ] Receipt dibuat server-side dan disimpan dalam bentuk hash/verifier yang aman.
- [ ] Receipt tidak mengungkap kandidat dan tidak membangun relasi identitas-ke-ballot.
- [ ] Uji retry/idempotency dan status transaksi yang tidak pasti.
- [ ] Uji bahwa tidak ada tabel, log, atau telemetry yang menghubungkan identitas dengan pilihan kandidat.

### D. RBAC dan audit
- [ ] Finalisasi nama role dan matriks hak akses di kode.
- [ ] Tentukan cara mengidentifikasi admin secara stabil (Entra `tid` + `oid`).
- [ ] Buat proses bootstrap superadmin yang aman.
- [ ] Otorisasi dilakukan di server, bukan hanya menyembunyikan UI.
- [ ] Audit log mencatat aktor, aksi, waktu, alasan, dan perubahan yang relevan.
- [ ] Audit log tidak menyimpan password, token, receipt mentah, atau pilihan kandidat.
- [ ] Uji akses lintas-role dan akses langsung ke endpoint.

## 4. Keputusan/TBD yang harus diselesaikan sebelum produksi

| Item | Status | Pemilik keputusan |
|---|---|---|
| Pihak berwenang Pemira untuk menyetujui perpanjangan jadwal | TBD | KPR/aturan Pemira |
| Ambang minimum agregasi statistik per angkatan | TBD | KPR |
| Makna, ketersediaan, dan konsekuensi Kotak Kosong | TBD | KPR |
| Kebijakan apakah impor DPT boleh memperbarui baris lama | TBD | KPR/pengelola DPT |
| Batas ukuran/jumlah baris file DPT | TBD | Tim teknis + KPR |
| Pejabat yang dapat menetapkan legal hold | TBD | HMIF/KPR |
| Siklus backup, masa simpan backup, dan penghapusan backup | TBD | Pengelola teknis HMIF |
| Mekanisme tenant Entra setelah serah terima | TBD | HMIF |
| Jabatan/orang yang ditunjuk sebagai KPR Admin, Auditor, Superadmin | TBD | HMIF/KPR |
| Region Cloud Run dan Supabase | TBD | Tim teknis |
| Domain, billing owner, dan akses organisasi untuk Cloud Run/Supabase | TBD | HMIF |
| Kebijakan pemulihan dan komunikasi kepada pemilih saat outage | TBD | KPR/HMIF |

## 5. Kriteria minimum sebelum coding modul voting

Semua item berikut wajib berstatus selesai atau diverifikasi:
- [ ] Struktur repository dan instruksi proyek telah diperiksa.
- [ ] Skema database dan migrasi disetujui.
- [ ] Model autentikasi dummy dan Entra dipisahkan.
- [ ] Model identitas server-side dan DPT mapping disetujui.
- [ ] Model ballot anonim dan receipt disetujui.
- [ ] RPC voting memiliki transaksi atomik dan kontrol maintenance.
- [ ] RBAC server-side tersedia.
- [ ] Pengujian concurrency One-Man-One-Vote dirancang.
- [ ] Kebijakan logging tidak membocorkan identitas-pilihan.

## 6. Kriteria minimum sebelum produksi

- [ ] Uji autentikasi nyata pada tenant Telkom berhasil.
- [ ] Admin consent dan batasan tenant sudah diverifikasi.
- [ ] DPT resmi telah divalidasi dan diimpor dengan prosedur preview/all-or-nothing.
- [ ] Uji keamanan, E2E, concurrency, dan beban telah lulus.
- [ ] Backup dan restore telah diuji.
- [ ] Cloud Run, Supabase, domain, dan billing berada dalam kendali organisasi yang disepakati.
- [ ] Dummy authentication dinonaktifkan dan diblokir di production.
- [ ] Semua TBD yang berdampak pada hak pemilih, hasil, privasi, dan kewenangan telah diselesaikan.
- [ ] Prosedur insiden, publikasi, legal hold, dan serah terima disetujui.
- [ ] KPR menyetujui kesiapan operasional.

## 7. Rekomendasi urutan implementasi

1. Audit repository dan rekonsiliasi dokumen.
2. Setup project, environment, lint/typecheck, dan CI.
3. Skema database dan migration.
4. Dummy authentication + DPT mapping.
5. RBAC dan admin bootstrap.
6. Voting RPC, atomicity, anonymity, dan receipt.
7. UI pemilih dan alur konfirmasi.
8. Admin dashboard dan impor DPT.
9. Audit log, laporan, dan dashboard publik.
10. E2E, concurrency, security, dan load testing.
11. Entra integration nyata.
12. Deployment, backup/restore, dan operational handover.

**Catatan:** Urutan ini adalah rekomendasi implementasi. Integrasi Entra nyata dapat dikerjakan setelah alur dummy stabil, tetapi kontrak identitas dan batas keamanan harus dirancang sejak awal agar tidak perlu membongkar autentikasi di akhir.
