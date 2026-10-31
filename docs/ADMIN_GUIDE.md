# ADMIN_GUIDE.md

> **Project:** E-Voting Pemira HMIF  
> **Document:** Administrator Guide  
> **Version:** 0.1.0  
> **Status:** Draft — Requires Product, Security, and Operations Approval  
> **Last updated:** 2026-10-31  
> **Primary sources:** `PRD.md` v1.0.0, `UI.md`, and the project documentation drafts  
> **Audience:** Authorized election administrators, KPR/panitia, and technical operators

---

## 1. Tujuan dan Batas Penggunaan

Dokumen ini menjelaskan prosedur administratif dan operasional untuk menjalankan E-Voting Pemira HMIF. Dokumen ini ditujukan hanya kepada personel yang telah memperoleh otorisasi.

Panduan ini tidak memberikan hak akses baru. Semua tindakan harus tetap mengikuti role-based access control (RBAC), keputusan resmi panitia, dan prosedur yang telah disahkan.

### 1.1 Label status

| Label | Arti |
|---|---|
| **Specified** | Dinyatakan dalam PRD/UI atau dokumen proyek yang menjadi acuan. |
| **Proposed** | Prosedur pengendalian yang direkomendasikan untuk mengurangi risiko. |
| **TBD** | Belum diputuskan; perlu persetujuan pemilik proses. |

### 1.2 Prinsip operasional

1. **Least privilege:** setiap personel hanya memperoleh izin minimum untuk tugasnya.
2. **Separation of duties:** tindakan kritis sebaiknya tidak bergantung pada satu orang saja.
3. **Traceability:** perubahan administratif harus dapat ditelusuri.
4. **Confidentiality:** data pemilih dan tally internal hanya boleh diakses sesuai kebutuhan dan otorisasi.
5. **Ballot secrecy:** proses operasional tidak boleh menghubungkan identitas pemilih dengan pilihan kandidat.
6. **No undocumented mutation:** jangan mengubah data secara langsung atau melakukan reset manual tanpa prosedur resmi.

---

## 2. Peran dan Tanggung Jawab

PRD menyebut KPR/Admin dashboard dan superadmin/manual override, tetapi belum menyediakan matriks izin lengkap. Tabel berikut merupakan rancangan pembagian tanggung jawab, bukan pernyataan bahwa role-role ini sudah tersedia di aplikasi.

| Peran konseptual | Tanggung jawab yang diusulkan | Batasan |
|---|---|---|
| Ketua/otoritas Pemira | Menyetujui jadwal, pembukaan/penutupan, dan publikasi hasil. | Tidak otomatis memperoleh akses teknis ke data sensitif. |
| KPR/Admin Pemira | Mengelola data pemilihan, memantau partisipasi, dan menyiapkan laporan sesuai izin. | Tidak boleh mengakses pilihan individual pemilih. |
| Operator DPT | Menyiapkan, memvalidasi, dan mengimpor data pemilih. | Akses data dibatasi pada kebutuhan pengelolaan DPT. |
| Operator teknis | Menangani deployment, konfigurasi, monitoring, dan insiden teknis. | Tidak boleh mengubah hasil pemilihan tanpa prosedur yang disetujui. |
| Auditor/pengawas | Meninjau bukti, log, dan kepatuhan proses. | Akses read-only sejauh memungkinkan. |
| Superadmin | Menangani tindakan administratif khusus yang telah disetujui. | Manual override wajib memiliki alasan, otorisasi, dan jejak audit. |

**TBD:** nama role aktual, permission matrix, pemilik persetujuan, dan mekanisme pemisahan tugas.

### 2.1 Aturan akun admin

- Gunakan akun individual yang telah diotorisasi.
- Jangan berbagi akun atau kredensial admin.
- Aktifkan autentikasi institusi sesuai konfigurasi yang disetujui.
- Jangan menggunakan akun admin untuk aktivitas pemilih biasa.
- Cabut akses personel yang sudah tidak bertugas.
- Tinjau daftar akun dan role sebelum serta setelah pemilihan.

---

## 3. Persiapan Sebelum Hari Pemilihan

### 3.1 Readiness checklist

Sebelum voting dibuka, pastikan setiap butir berikut memiliki bukti pemeriksaan.

| Area | Pemeriksaan | Bukti yang disarankan |
|---|---|---|
| Tata kelola | Jadwal dan otoritas pembukaan/penutupan disahkan. | Keputusan atau berita acara. |
| DPT | Data final telah divalidasi dan diimpor. | Ringkasan validasi dan jumlah record. |
| Kandidat | Nama, nomor, visi, misi, foto, status aktif benar. | Checklist verifikasi kandidat. |
| Kotak Kosong | Opsi tersedia dan konfigurasi sesuai ketentuan. | Hasil pengujian. |
| Authentication | Login Microsoft dan pemetaan akun ke DPT berjalan. | Hasil uji autentikasi. |
| Ballot | Pemilihan, konfirmasi, dan receipt telah diuji. | Hasil E2E test. |
| Concurrency | Pengujian satu pemilih dengan permintaan bersamaan lulus. | Laporan pengujian. |
| Privacy | Tally tidak dapat diakses pemilih biasa. | Hasil uji akses negatif. |
| Availability | Monitoring, backup, dan jalur eskalasi tersedia. | Checklist operasional. |
| Communication | URL, jadwal, dan kontak bantuan diumumkan. | Pengumuman resmi. |

**Release gate:** jangan membuka voting jika ada kegagalan kritis pada autentikasi, DPT, pencatatan suara, kerahasiaan ballot, atau kontrol akses tally.

### 3.2 Pemeriksaan lingkungan

Operator teknis perlu memastikan:

- konfigurasi environment sesuai lingkungan yang dituju;
- kredensial Microsoft Entra dan redirect URI sesuai;
- koneksi Supabase/PostgreSQL berfungsi;
- migration database yang disetujui sudah diterapkan;
- kebijakan akses database dan API aktif;
- monitoring dan pencatatan error berjalan;
- backup dan prosedur pemulihan telah diuji.

Jangan menyalin secret produksi ke dokumen, tiket, chat, atau repositori.

---

## 4. Pengelolaan Daftar Pemilih Tetap (DPT)

### 4.1 Format data

PRD menetapkan impor DPT melalui CSV atau Excel dengan kolom wajib:

| Kolom | Keterangan |
|---|---|
| `nim` | Nomor Induk Mahasiswa. |
| `email` | Email institusi pemilih. |
| `name` | Nama pemilih. |
| `generation` | Angkatan pemilih. |

Domain email mahasiswa yang ditetapkan dalam spesifikasi: `@student.telkomuniversity.ac.id`.

Aturan format rinci, normalisasi NIM, format angkatan, ukuran file maksimum, dan template resmi: **TBD**.

### 4.2 Prosedur impor

1. Terima file DPT dari sumber resmi yang ditunjuk.
2. Catat sumber file, tanggal penerimaan, dan penanggung jawab.
3. Simpan file pada lokasi terbatas akses.
4. Periksa keberadaan seluruh kolom wajib.
5. Validasi NIM dan email.
6. Periksa duplikasi NIM dan email.
7. Periksa nilai kosong dan format yang tidak sesuai.
8. Jalankan preview/validasi impor jika fitur tersedia.
9. Bandingkan jumlah data sumber dengan jumlah data yang akan diimpor.
10. Minta persetujuan sesuai matriks kewenangan.
11. Jalankan impor.
12. Simpan ringkasan hasil: jumlah berhasil, gagal, duplikat, dan alasan kegagalan.
13. Batasi akses file sumber dan hasil validasi.

### 4.3 Penanganan duplikasi dan kesalahan

- Jangan menghapus pemeriksaan duplikasi hanya agar proses impor berhasil.
- Jangan memilih record yang dipertahankan berdasarkan perkiraan.
- Cocokkan data dengan sumber DPT resmi.
- Catat perubahan dan alasan koreksi.
- Jika ada konflik identitas, eskalasikan kepada penanggung jawab DPT.

Kebijakan upsert, pembaruan data setelah impor, dan mekanisme rollback: **TBD**.

### 4.4 Manual override

PRD menyebut kemungkinan manual override oleh superadmin. Ini merupakan tindakan berisiko tinggi.

**Prosedur yang diusulkan:**

1. Terima permintaan tertulis dengan alasan yang jelas.
2. Verifikasi bukti terhadap sumber resmi.
3. Pastikan pemohon bukan satu-satunya pihak yang menyetujui tindakannya.
4. Dapatkan persetujuan dari otoritas yang ditentukan.
5. Lakukan perubahan melalui mekanisme resmi.
6. Catat aktor, waktu, objek perubahan, alasan, dan persetujuan.
7. Verifikasi hasil perubahan.

Tidak boleh ada reset `has_voted` atau perubahan status pemilih secara informal. Kebijakan khusus koreksi status pemilih: **TBD**.

---

## 5. Pengelolaan Data Kandidat

Sebelum pemilihan:

1. Cocokkan nama Ketua dan Wakil Ketua dengan data yang disahkan.
2. Pastikan nomor kandidat unik.
3. Periksa visi dan misi.
4. Periksa foto dan tautan aset.
5. Pastikan status aktif benar.
6. Verifikasi opsi Kotak Kosong sesuai ketentuan.

PRD mencatat `candidate_number = 0` untuk Kotak Kosong. Jangan mengubah konvensi tersebut tanpa revisi spesifikasi yang disetujui.

Setelah voting dibuka, perubahan kandidat harus diperlakukan sebagai perubahan kritis. Hentikan perubahan sampai ada keputusan resmi, analisis dampak, persetujuan, dan pencatatan audit.

---

## 6. Membuka Pemungutan Suara

PRD mencantumkan pengaturan:

- `is_voting_open`
- `start_time`
- `end_time`
- `maintenance_mode`

### 6.1 Sebelum aktivasi

- Pastikan jadwal sesuai keputusan resmi.
- Pastikan zona waktu dan interpretasi waktu telah ditetapkan.
- Pastikan DPT dan kandidat telah dikunci untuk periode pemilihan.
- Pastikan semua release gate pada Bagian 3 terpenuhi.
- Pastikan petugas helpdesk dan operator teknis siap.
- Pastikan pengumuman pembukaan telah disiapkan.

### 6.2 Aktivasi

1. Operator yang berwenang masuk ke dashboard.
2. Verifikasi kembali jadwal dan status konfigurasi.
3. Aktifkan pemungutan suara sesuai prosedur yang disetujui.
4. Verifikasi status aplikasi dari sisi pemilih.
5. Lakukan smoke test terbatas sesuai prosedur yang aman.
6. Catat waktu aktivasi dan pihak yang menyetujui.
7. Umumkan pembukaan melalui kanal resmi.

Jangan melakukan suara uji pada data pemilih nyata tanpa prosedur pengujian yang disetujui.

### 6.3 Verifikasi pasca-pembukaan

- Login pemilih yang memenuhi syarat dapat mencapai halaman pemilihan.
- Akun yang tidak ada dalam DPT ditolak.
- Kandidat dan Kotak Kosong tampil sesuai konfigurasi.
- Konfirmasi dan receipt bekerja.
- Pemilih yang telah memilih tidak dapat memilih kembali.
- Tally tetap tidak dapat diakses oleh pemilih biasa.

---

## 7. Monitoring Selama Pemungutan Suara

### 7.1 Indikator operasional

Pantau setidaknya:

- ketersediaan aplikasi;
- tingkat kegagalan autentikasi;
- error pada proses pemilihan;
- latensi dan error database;
- jumlah pemilih yang telah menggunakan hak pilih;
- lonjakan trafik atau pola permintaan tidak wajar;
- status layanan eksternal yang menjadi dependensi.

PRD menargetkan proses cast vote di bawah 400 ms pada 100 permintaan konkuren dan menyebut 500 pengguna aktif. Definisi pengukuran, lingkungan uji, percentile, serta batas error perlu disepakati sebelum target dipakai sebagai SLA.

### 7.2 Turnout dan tally

Bedakan dua jenis data:

- **Turnout:** jumlah/proporsi pemilih yang telah menggunakan hak pilih.
- **Tally:** distribusi suara per opsi kandidat.

Jangan menyamakan kenaikan turnout dengan perolehan suara kandidat.

PRD menetapkan tally langsung bersifat privat selama pemungutan suara. Akses harus dibatasi dan diuji. Jangan membagikan angka tally, screenshot, atau ekspor internal kepada pihak yang tidak berwenang.

### 7.3 Komunikasi insiden

Gunakan satu kanal koordinasi resmi untuk:

- gangguan layanan;
- lonjakan kegagalan login;
- masalah DPT;
- transaksi dengan status tidak pasti;
- dugaan akses tidak sah;
- dugaan kebocoran data.

Catat fakta yang diketahui, waktu, dampak, tindakan sementara, penanggung jawab, dan keputusan eskalasi. Hindari spekulasi dalam pengumuman publik.

---

## 8. Mode Pemeliharaan

`maintenance_mode` tercantum sebagai pengaturan dalam PRD.

Mode pemeliharaan tidak boleh diaktifkan hanya untuk menyembunyikan masalah atau menghindari pelaporan insiden.

Prosedur yang diusulkan:

1. Identifikasi alasan dan dampak gangguan.
2. Tentukan apakah layanan perlu dihentikan sementara.
3. Dapatkan persetujuan dari otoritas yang ditetapkan.
4. Aktifkan mode pemeliharaan oleh operator berwenang.
5. Umumkan status dan estimasi informasi yang telah terverifikasi.
6. Perbaiki dan uji sistem.
7. Verifikasi kembali autentikasi, DPT, ballot, receipt, dan kontrol akses.
8. Dapatkan persetujuan untuk membuka layanan kembali.
9. Catat durasi, alasan, tindakan, dan hasil pemulihan.

**TBD:** apakah mode pemeliharaan otomatis menolak seluruh operasi voting, apakah jadwal voting diperpanjang setelah gangguan, dan siapa yang berwenang memutuskan.

---

## 9. Menutup Pemungutan Suara

### 9.1 Prosedur penutupan

1. Verifikasi waktu penutupan dan keputusan resmi.
2. Beri tahu personel terkait bahwa periode voting akan ditutup.
3. Ubah status voting melalui mekanisme yang berwenang.
4. Verifikasi bahwa permintaan voting baru ditolak setelah penutupan.
5. Pastikan status transaksi yang sedang berlangsung ditangani sesuai prosedur.
6. Catat waktu penutupan dan pihak yang menyetujui.
7. Amankan data dan bukti operasional.
8. Lakukan rekonsiliasi jumlah pemilih dan jumlah ballot melalui prosedur yang disetujui.

Jangan mengubah atau menghapus ballot untuk membuat angka terlihat sesuai. Setiap selisih harus diselidiki dan dicatat.

### 9.2 Rekonsiliasi

Rekonsiliasi yang disarankan mencakup:

- jumlah pemilih DPT yang memenuhi syarat;
- jumlah pemilih dengan status telah memilih;
- jumlah ballot tersimpan;
- jumlah transaksi gagal/ditolak;
- selisih yang perlu dijelaskan.

Karena identitas pemilih dan ballot harus dipisahkan, rekonsiliasi tidak boleh membuat pemetaan identitas ke pilihan kandidat. Metode rekonsiliasi final harus ditinjau oleh penanggung jawab keamanan dan auditor.

---

## 10. Pengelolaan Hasil dan Laporan

PRD mencantumkan ekspor PDF dan Excel.

Sebelum hasil dipublikasikan:

1. Pastikan voting telah ditutup secara resmi.
2. Pastikan rekonsiliasi selesai.
3. Pastikan anomali dan insiden yang relevan telah ditangani atau didokumentasikan.
4. Verifikasi perhitungan hasil.
5. Pastikan kategori/opsi yang dilaporkan sesuai konfigurasi.
6. Dapatkan persetujuan pengesahan hasil.
7. Buat laporan sesuai format yang disetujui.
8. Periksa apakah laporan mengandung data pribadi atau informasi internal.
9. Publikasikan hanya melalui kanal resmi.

**TBD:** pihak pengesah, format laporan final, definisi hasil resmi, waktu publikasi, dan data agregat yang boleh dipublikasikan.

---

## 11. Audit Trail dan Bukti Operasional

PRD mencantumkan `audit_logs` dengan informasi seperti aktor, aksi, detail, alamat IP, dan waktu.

Catatan audit harus digunakan untuk menelusuri tindakan administratif dan kejadian sistem, bukan untuk membangun hubungan antara identitas pemilih dan pilihan suara.

Praktik yang disarankan:

- batasi akses audit log;
- lindungi log dari perubahan tidak sah;
- gunakan waktu sistem yang konsisten;
- catat alasan perubahan administratif;
- hindari memasukkan token sesi, secret, atau data sensitif yang tidak diperlukan;
- tetapkan masa retensi dan prosedur penghapusan;
- dokumentasikan pengambilan bukti untuk investigasi.

Karena kombinasi timestamp, IP, dan log autentikasi dapat meningkatkan risiko korelasi, konfigurasi log harus ditinjau terhadap prinsip kerahasiaan ballot.

---

## 12. Penanganan Insiden

### 12.1 Klasifikasi awal

| Kategori | Contoh |
|---|---|
| Availability | Aplikasi tidak dapat diakses atau database tidak tersedia. |
| Authentication | Login gagal secara luas atau ada indikasi penyalahgunaan akun. |
| Integrity | Jumlah ballot atau status pemilih tidak konsisten. |
| Confidentiality | Data DPT, credential, atau tally terbuka kepada pihak tidak berwenang. |
| Ballot secrecy | Ada indikasi identitas pemilih dapat dikaitkan dengan pilihan suara. |
| Abuse | Trafik otomatis, percobaan akses tidak sah, atau manipulasi permintaan. |

### 12.2 Respons awal

1. Catat waktu deteksi dan pelapor.
2. Dokumentasikan gejala dan bukti yang tersedia.
3. Tentukan dampak terhadap kerahasiaan, integritas, dan ketersediaan.
4. Eskalasikan kepada penanggung jawab teknis dan otoritas Pemira.
5. Terapkan containment yang disetujui, misalnya pembatasan akses atau mode pemeliharaan.
6. Lindungi bukti dan jangan mengubah log.
7. Jangan melakukan reset status pemilih atau mengubah ballot untuk memperbaiki gejala.
8. Komunikasikan status berdasarkan fakta yang telah diverifikasi.
9. Lakukan pemulihan dan pengujian sebelum layanan dibuka kembali.
10. Buat laporan pascainsiden dan tindakan pencegahan.

Kontak eskalasi, target waktu respons, kewajiban notifikasi, dan format laporan insiden: **TBD**.

### 12.3 Insiden kerahasiaan ballot

Jika terdapat indikasi identitas pemilih dapat dikaitkan dengan pilihan kandidat:

- perlakukan sebagai insiden keamanan kritis;
- batasi akses terhadap log dan data terkait;
- jangan melakukan eksplorasi data yang memperluas korelasi;
- pertahankan bukti secara terkendali;
- eskalasikan kepada otoritas dan reviewer keamanan;
- jangan menyatakan ballot secrecy tetap terjamin sebelum investigasi selesai.

---

## 13. Tindakan yang Dilarang Tanpa Persetujuan Khusus

- Mengubah ballot secara langsung.
- Menghapus ballot untuk memperbaiki hasil.
- Mereset `has_voted` secara informal.
- Mengubah jadwal ketika voting berjalan tanpa keputusan resmi.
- Mengaktifkan/menonaktifkan kandidat tanpa prosedur.
- Membuka tally kepada pemilih umum selama voting.
- Membagikan file DPT atau kredensial.
- Menggunakan akun admin bersama.
- Menghubungkan identitas pemilih dengan pilihan kandidat.
- Mengubah konfigurasi produksi tanpa catatan dan persetujuan.

---

## 14. Checklist Penutupan Operasional

- [ ] Status voting telah ditutup secara resmi.
- [ ] Permintaan voting baru ditolak.
- [ ] Status transaksi tidak pasti telah ditangani.
- [ ] Rekonsiliasi pemilih dan ballot selesai.
- [ ] Tally diverifikasi oleh pihak berwenang.
- [ ] Laporan telah ditinjau dan disahkan.
- [ ] Bukti operasional dan audit diamankan.
- [ ] Data sensitif hanya dibagikan kepada penerima berwenang.
- [ ] Akses sementara/personel yang tidak lagi bertugas ditinjau.
- [ ] Insiden dan tindak lanjut didokumentasikan.
- [ ] Retrospektif dan rekomendasi perbaikan dijadwalkan.

---

## 15. Daftar Keputusan yang Masih TBD

| ID | Keputusan | Mengapa diperlukan |
|---|---|---|
| AG-01 | Matriks role dan permission final | Mencegah akses berlebihan dan konflik kewenangan. |
| AG-02 | Otoritas pembukaan/penutupan voting | Menetapkan akuntabilitas tindakan kritis. |
| AG-03 | Mekanisme persetujuan dua pihak | Mengurangi risiko perubahan sepihak. |
| AG-04 | Template dan aturan validasi DPT | Menjamin konsistensi impor. |
| AG-05 | Kebijakan koreksi DPT setelah impor | Menghindari perubahan data tanpa kontrol. |
| AG-06 | Prosedur manual override | Mengendalikan perubahan status pemilih. |
| AG-07 | Kebijakan perubahan kandidat | Mencegah perubahan saat pemilihan tanpa persetujuan. |
| AG-08 | Zona waktu dan aturan batas jadwal | Menghindari perbedaan interpretasi waktu. |
| AG-09 | Definisi metrik monitoring dan SLA | Menjadikan target performa terukur. |
| AG-10 | Kebijakan tally dan turnout | Menentukan data yang boleh dilihat tiap role. |
| AG-11 | Prosedur transaksi tidak pasti | Mencegah pemilih melakukan submit berulang. |
| AG-12 | Kebijakan perpanjangan waktu setelah gangguan | Menjamin keputusan operasional konsisten. |
| AG-13 | Prosedur rekonsiliasi yang menjaga ballot secrecy | Menghindari korelasi identitas dan pilihan. |
| AG-14 | Pengesahan dan publikasi hasil | Menetapkan hasil resmi dan pihak yang bertanggung jawab. |
| AG-15 | Retensi audit log dan bukti | Menetapkan masa simpan dan perlindungan data. |
| AG-16 | Kontak eskalasi dan target respons insiden | Memastikan respons terkoordinasi. |
| AG-17 | Prosedur pencabutan akses admin | Mengurangi risiko akun lama tetap aktif. |

---

## 16. Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-31 | Draft awal panduan administrator berdasarkan PRD/UI dan dokumentasi proyek. |

---

## 17. Dokumen Terkait

- `PRD.md`
- `UI.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `API.md`
- `AUTHENTICATION.md`
- `SECURITY.md`
- `TESTING.md`
- `DEPLOYMENT.md`
- `OPERATIONS.md`
- `USER_GUIDE.md`

**Release gate:** dokumen ini belum layak menjadi SOP resmi sebelum matriks role, kewenangan, persetujuan, kontak eskalasi, dan kebijakan publikasi hasil disahkan.

## Kewenangan Operasional — Finalisasi 31 Oktober 2026

- **KPR Admin:** membuka/menutup voting, menjalankan operasional Pemira sesuai kewenangan, memutuskan kelanjutan voting setelah Superadmin menyatakan sistem siap, serta mengesahkan hasil setelah pemeriksaan Auditor.
- **Auditor:** memeriksa hasil, turnout, dan audit log. Tidak dapat mengubah DPT, kandidat, jadwal, status voting, atau data hasil.
- **Superadmin:** mengelola akun administrator dan konfigurasi teknis, mengaktifkan maintenance darurat, serta memulihkan layanan. Tidak berwenang mengesahkan hasil atau membuka/menutup voting atas inisiatif sendiri.

Setiap pembukaan/penutupan voting dan aktivasi maintenance wajib menyertakan alasan dan menghasilkan audit log. Perpanjangan jadwal membutuhkan persetujuan KPR dan pihak berwenang Pemira; identitas/jabatan pihak tersebut masih TBD berdasarkan aturan resmi.

## Publikasi Hasil — Finalisasi 31 Oktober 2026

- KPR Admin mengesahkan dan mengumumkan hasil setelah pemeriksaan Auditor.
- Pengumuman mengikuti tanggal dan jam resmi yang ditetapkan KPR; tidak otomatis dilakukan saat voting ditutup.
- Kanal publikasi: dashboard publik dan PDF hasil resmi.
- Informasi publik: suara per kandidat/Kotak Kosong, turnout, dan partisipasi per angkatan.
- Data identitas pemilih, status pemilih individual, receipt token, dan hubungan pemilih dengan pilihan kandidat tidak boleh dipublikasikan.
- Koreksi setelah publikasi memerlukan persetujuan KPR dan pemeriksaan Auditor. Versi lama harus tetap dapat ditelusuri.
- Ambang minimum agregasi statistik per angkatan masih TBD untuk mengurangi risiko identifikasi kelompok kecil.

## Retensi Data dan Akses Arsip — Finalisasi 31 Oktober 2026

- DPT dan pemetaan identitas Entra: 1 tahun setelah hasil disahkan.
- Ballot anonim: arsip permanen.
- Hash receipt: 1 tahun setelah hasil disahkan.
- Audit log: arsip permanen dengan minimisasi data dan akses terbatas.
- Sengketa/pemeriksaan resmi: penghapusan data relevan ditangguhkan sampai proses selesai.
- Administrator tidak boleh mengekspor atau menyimpan salinan data pemilih di luar prosedur yang disetujui.
- Detail siklus backup, penghapusan salinan, dan pejabat legal hold harus ditetapkan sebelum produksi.

## Kepemilikan dan Serah Terima — Finalisasi 31 Oktober 2026

HMIF adalah pemilik organisasi dan pengelola jangka panjang E-Voting Pemira. Pengembang awal tidak menjadi satu-satunya pemegang akses.

Persyaratan serah terima:
- Minimal dua pengelola teknis HMIF.
- Akses organisasi terhadap repository, Cloud Run, Supabase, domain/DNS, backup, dan pipeline deployment.
- MFA untuk seluruh akun administrator.
- Credential disimpan melalui secret manager dan tidak dimasukkan ke dokumentasi.
- Recovery information dan panduan pemulihan tersedia bagi pengelola HMIF.
- Pengujian backup/restore dan akses pengelola pengganti dilakukan sebelum serah terima selesai.
- Akses ditinjau dan dicabut saat pergantian kepengurusan.

Tenant Entra saat ini direncanakan dimiliki secara personal. Ini merupakan risiko keberlanjutan yang harus diselesaikan sebelum produksi melalui pemindahan kendali ke HMIF atau perjanjian pengelolaan formal. Mekanisme final tenant masih TBD.
