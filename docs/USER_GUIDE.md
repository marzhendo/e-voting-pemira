# USER_GUIDE.md

> **Project:** E-Voting Pemira HMIF  
> **Document:** User Guide  
> **Version:** 0.1.0  
> **Status:** Draft — Requires Product and Operational Review  
> **Last updated:** 2026-10-31  
> **Primary sources:** `PRD.md` v1.0.0 and `UI.md`  
> **Audience:** Mahasiswa pemilih and election administrators/panitia

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan cara menggunakan sistem E-Voting Pemira HMIF. Panduan dibagi menjadi:

1. Panduan mahasiswa sebagai pemilih.
2. Panduan umum panitia/admin.
3. Pemecahan masalah dan FAQ.

Dokumen ini menjelaskan perilaku yang direncanakan dalam spesifikasi. Dokumen ini **bukan bukti bahwa seluruh fitur telah diimplementasikan atau dirilis**. Nama menu dan detail visual dapat berubah mengikuti UI final.

### 1.1 Konvensi status informasi

| Label | Arti |
|---|---|
| **Specified** | Tercantum dalam PRD/UI yang menjadi sumber acuan. |
| **Proposed** | Saran prosedural agar penggunaan lebih aman dan jelas. |
| **TBD** | Belum ditetapkan atau perlu persetujuan panitia/pemilik produk. |

---

## 2. Panduan Mahasiswa Pemilih

### 2.1 Persyaratan sebelum memilih

Sebelum menggunakan sistem, pastikan:

- Anda memiliki akun institusi Microsoft yang dapat digunakan untuk login.
- Alamat email akun mahasiswa menggunakan domain `@student.telkomuniversity.ac.id`.
- Data Anda tercantum dalam Daftar Pemilih Tetap (DPT) yang telah diimpor ke sistem.
- Periode pemungutan suara sedang dibuka dan sistem tidak berada dalam mode pemeliharaan.

**Penting:** Memiliki akun email institusi saja tidak otomatis menjamin Anda berhak memilih. Sistem juga melakukan pencocokan terhadap DPT.

Tanggal dan jam resmi pemungutan suara: **TBD**.  
Tautan resmi aplikasi: **TBD**.  
Kontak bantuan resmi: **TBD**.

### 2.2 Masuk ke sistem

1. Buka tautan resmi E-Voting Pemira HMIF.
2. Pilih opsi masuk menggunakan Microsoft.
3. Selesaikan proses autentikasi pada halaman Microsoft.
4. Setelah berhasil, sistem akan memeriksa kelayakan akun terhadap DPT.

**Catatan keamanan:**
- Pastikan alamat situs sesuai dengan tautan resmi yang dibagikan panitia.
- Jangan memasukkan kata sandi Microsoft pada halaman selain halaman autentikasi Microsoft yang sah.
- Jangan membagikan kata sandi, kode autentikasi, atau sesi login kepada siapa pun.

### 2.3 Pemeriksaan kelayakan DPT

Setelah login, sistem mencocokkan identitas akun dengan data pemilih.

Kemungkinan hasil:

| Hasil | Makna | Tindakan |
|---|---|---|
| Terdaftar dan belum memilih | Akun cocok dengan DPT dan belum tercatat menggunakan hak pilih. | Lanjutkan ke halaman pemilihan. |
| Tidak terdaftar | Identitas tidak ditemukan atau tidak cocok dengan DPT. | Periksa akun yang digunakan, lalu hubungi panitia melalui kanal resmi. |
| Sudah memilih | Sistem mencatat hak pilih telah digunakan. | Ikuti halaman status/bukti voting yang tersedia. Jangan mencoba memilih kembali. |
| Periode tertutup | Pemungutan suara belum dibuka atau sudah ditutup. | Periksa jadwal resmi. |
| Pemeliharaan | Sistem sedang dinonaktifkan sementara untuk pemeliharaan. | Tunggu pengumuman resmi panitia. |

Jangan mencoba menggunakan akun orang lain untuk melewati pemeriksaan DPT.

### 2.4 Memahami halaman kandidat

Halaman pemilihan menampilkan kandidat Ketua dan Wakil Ketua HMIF sesuai data yang disediakan panitia. PRD juga menetapkan opsi **Kotak Kosong** dengan nomor kandidat `0`.

Sebelum menentukan pilihan:

- Baca visi dan misi setiap kandidat.
- Periksa informasi kandidat yang ditampilkan.
- Pastikan Anda memahami perbedaan antara kandidat dan opsi Kotak Kosong.
- Jangan mengambil keputusan hanya berdasarkan nomor urut atau elemen visual.

Informasi kandidat yang tidak tampil atau tampak keliru perlu dilaporkan kepada panitia sebelum suara dikirimkan.

### 2.5 Memilih dan mengonfirmasi suara

1. Pilih satu opsi yang tersedia pada halaman pemilihan.
2. Periksa kembali pilihan Anda.
3. Tekan tombol untuk melanjutkan ke konfirmasi.
4. Pada dialog konfirmasi, pastikan pilihan sudah benar.
5. Konfirmasikan pengiriman suara hanya jika Anda yakin.

**Peringatan — keputusan final:** PRD menetapkan mekanisme satu pemilih satu suara dan pemeriksaan agar pemilih yang sudah memilih tidak dapat memilih kembali. Karena itu, perlakukan konfirmasi sebagai tindakan final. Jangan menganggap pilihan dapat diedit setelah dikirim.

Jika pilihan yang tampil tidak sesuai dengan yang Anda maksud, batalkan dialog konfirmasi dan periksa kembali sebelum mengirim.

### 2.6 Setelah suara dikirim

Setelah pengiriman berhasil, sistem dirancang untuk:

- mencatat bahwa hak pilih pemilih telah digunakan;
- menyimpan suara pada penyimpanan hasil pemilihan;
- menampilkan halaman atau tanda terima (receipt).

UI yang direncanakan menampilkan token acak pada receipt dan tidak menampilkan pilihan kandidat. Namun, definisi teknis token—termasuk apakah token dapat digunakan untuk memverifikasi transaksi yang sudah tersimpan—masih perlu dipastikan.

**Jangan menganggap token receipt sebagai bukti kriptografis bahwa pilihan tertentu telah tercatat.** Receipt yang direncanakan tidak mengungkap pilihan kandidat.

Simpan atau dokumentasikan receipt sesuai petunjuk resmi panitia. Jangan membagikan token kepada pihak lain sebelum panitia menjelaskan fungsi dan sensitivitasnya.

### 2.7 Jika halaman tidak merespons setelah konfirmasi

Jika koneksi terputus, halaman macet, atau Anda tidak menerima status berhasil:

1. Jangan langsung mengirim suara berulang kali.
2. Jangan berasumsi suara gagal hanya karena halaman tidak berpindah.
3. Periksa apakah sistem menampilkan status sudah memilih atau receipt.
4. Jika status masih tidak jelas, hubungi panitia melalui kanal resmi.
5. Sampaikan waktu kejadian dan pesan kesalahan yang terlihat. Jangan mengirim kata sandi atau kode autentikasi.

Prosedur rekonsiliasi untuk transaksi dengan status tidak pasti: **TBD**. Panitia perlu memeriksa status pemilih melalui prosedur resmi tanpa meminta pemilih mengungkap pilihan kandidat.

---

## 3. Panduan Umum Panitia/Admin

> Bagian ini ditujukan untuk personel yang telah diberi akses resmi. Hak akses aktual harus mengikuti matriks RBAC yang disetujui. Jangan mengasumsikan setiap admin memiliki izin yang sama.

### 3.1 Akses dashboard

1. Buka tautan resmi aplikasi.
2. Login menggunakan akun institusi yang telah diotorisasi.
3. Sistem memeriksa role dan izin akun.
4. Gunakan hanya menu yang tersedia untuk role Anda.

Akun yang berhasil login belum tentu memiliki hak akses administratif. Jika menu admin tidak tersedia, jangan mencoba mengakses endpoint atau data secara langsung. Minta verifikasi kepada administrator sistem.

Matriks role dan izin rinci: **TBD**.

### 3.2 Pengelolaan DPT

PRD menetapkan dukungan impor DPT melalui CSV atau Excel. Kolom wajib yang disebutkan:

- `nim`
- `email`
- `name`
- `generation`

Alur operasional yang disarankan:

1. Siapkan file berdasarkan format resmi yang ditentukan panitia.
2. Periksa kelengkapan kolom wajib.
3. Periksa format NIM dan email institusi.
4. Jalankan proses preview/validasi jika tersedia.
5. Tinjau baris yang gagal validasi dan potensi duplikasi.
6. Pastikan jumlah serta isi data sesuai sumber DPT yang disahkan.
7. Lakukan impor hanya setelah memperoleh persetujuan sesuai prosedur.

**Peringatan:** Jangan mengunggah file DPT ke kanal publik atau membagikannya kepada personel yang tidak berwenang. DPT memuat data pribadi mahasiswa.

Format template, batas ukuran file, kebijakan update data, dan prosedur rollback impor: **TBD**.

### 3.3 Pemeriksaan data kandidat

Sebelum periode pemungutan suara:

- Pastikan nomor kandidat unik.
- Pastikan data Ketua dan Wakil Ketua benar.
- Periksa visi dan misi.
- Periksa foto dan aset yang digunakan.
- Pastikan status aktif sesuai keputusan panitia.
- Pastikan opsi Kotak Kosong tersedia sesuai konfigurasi yang disetujui.

Jangan mengubah data kandidat ketika pemungutan suara berlangsung tanpa prosedur perubahan yang disahkan dan dicatat.

### 3.4 Pengaturan periode pemungutan suara

PRD mencantumkan pengaturan berikut:

- `is_voting_open`
- `start_time`
- `end_time`
- `maintenance_mode`

Hanya personel dengan izin yang sesuai yang boleh mengubah pengaturan tersebut.

Sebelum membuka pemungutan suara, lakukan pemeriksaan kesiapan yang mencakup:

- validasi DPT;
- verifikasi kandidat;
- pemeriksaan autentikasi;
- pengujian alur pemungutan suara;
- pemeriksaan dashboard dan monitoring;
- persetujuan pembukaan dari pejabat/panitia yang berwenang.

Sebelum menutup pemungutan suara, pastikan keputusan penutupan sesuai jadwal dan ketentuan resmi. Perubahan waktu atau status harus memiliki alasan dan jejak audit.

Siapa yang berwenang membuka/menutup pemungutan suara dan mekanisme persetujuan dua pihak: **TBD**.

### 3.5 Dashboard, partisipasi, dan hasil

PRD membedakan informasi berikut:

- **Turnout/partisipasi:** jumlah atau proporsi pemilih yang telah menggunakan hak pilih.
- **Tally/perolehan suara:** distribusi suara pada masing-masing opsi kandidat.

Keduanya bukan metrik yang sama. Akses terhadap tally selama pemungutan suara harus dibatasi sesuai kebijakan kerahasiaan hasil.

PRD menyatakan hasil langsung selama pemungutan suara bersifat privat dan tidak dipublikasikan kepada pemilih umum. Endpoint tally administratif juga harus menolak akses pemilih biasa.

Kebijakan siapa yang boleh melihat tally, kapan tally boleh dibuka, dan apakah angka agregat tertentu boleh ditampilkan kepada operator: **TBD**. Jangan membagikan tangkapan layar atau angka tally kepada pihak yang tidak berwenang.

### 3.6 Ekspor laporan

PRD mencantumkan ekspor laporan PDF dan Excel. Sebelum membagikan laporan:

- pastikan periode dan status pemilihan benar;
- pastikan angka laporan sesuai hasil resmi;
- periksa apakah laporan mengandung data pribadi;
- hapus atau minimalkan data yang tidak diperlukan;
- distribusikan hanya kepada penerima yang berwenang.

Format laporan final, pihak yang mengesahkan, dan jadwal publikasi: **TBD**.

### 3.7 Audit dan penanganan data

- Gunakan akun pribadi yang terotorisasi; jangan berbagi akun admin.
- Lakukan perubahan melalui antarmuka/prosedur resmi.
- Jangan menghapus atau mengubah catatan audit.
- Jangan mencoba menghubungkan identitas pemilih dengan pilihan suara.
- Jangan mengekspor atau menyalin data pemilih tanpa kebutuhan dan otorisasi.
- Laporkan dugaan akses tidak sah, perubahan data, atau kebocoran melalui jalur insiden resmi.

Prosedur retensi, akses, dan penghapusan data: **TBD** dan perlu ditetapkan sebelum produksi.

---

## 4. Pemecahan Masalah

| Masalah | Kemungkinan penyebab | Langkah yang disarankan |
|---|---|---|
| Login Microsoft gagal | Akun salah, sesi browser bermasalah, atau konfigurasi autentikasi. | Pastikan memakai akun institusi; coba sesi browser baru; jika tetap gagal, hubungi dukungan. |
| Akun tidak ditemukan di DPT | Data belum diimpor atau identitas tidak cocok. | Periksa alamat akun dan minta panitia memeriksa DPT. |
| Status sudah memilih padahal merasa belum memilih | Suara telah tercatat sebelumnya atau status perlu diperiksa. | Jangan mencoba memilih ulang; minta panitia melakukan pemeriksaan resmi. |
| Kandidat tidak muncul | Data kandidat tidak aktif atau gangguan tampilan. | Jangan lanjut jika pilihan tidak lengkap; laporkan kepada panitia. |
| Tombol konfirmasi tidak merespons | Gangguan jaringan/browser atau server. | Hindari klik berulang; periksa status sebelum mencoba tindakan lain. |
| Halaman berhenti setelah submit | Respons jaringan terputus atau status transaksi belum diketahui. | Jangan submit ulang secara membabi buta; hubungi panitia untuk rekonsiliasi. |
| Voting tertutup | Di luar jadwal atau status voting telah ditutup. | Periksa pengumuman resmi. |
| Mode pemeliharaan | Sistem dinonaktifkan sementara. | Tunggu instruksi resmi; jangan mencoba jalur alternatif. |
| Admin tidak melihat menu tertentu | Role tidak memiliki izin atau sesi belum diperbarui. | Minta administrator memeriksa role; jangan mencoba melewati kontrol akses. |
| Impor DPT gagal | Kolom wajib hilang, format salah, atau data duplikat. | Perbaiki file berdasarkan hasil validasi; jangan menghapus pemeriksaan duplikasi. |

---

## 5. FAQ

### Apakah semua mahasiswa yang memiliki email institusi dapat memilih?

Tidak otomatis. PRD menetapkan bahwa akun harus cocok dengan data pemilih dalam DPT.

### Apakah saya dapat mengganti pilihan setelah menekan konfirmasi?

PRD menetapkan satu suara per pemilih dan mencegah pemilih yang sudah memilih untuk memilih kembali. Karena itu, anggap suara yang berhasil dikirim sebagai final. Kebijakan koreksi suara tidak ditetapkan dalam sumber yang tersedia.

### Apakah receipt memperlihatkan kandidat yang saya pilih?

UI yang direncanakan menyatakan receipt tidak menampilkan pilihan kandidat. Detail final receipt tetap perlu diverifikasi pada implementasi.

### Apakah panitia dapat melihat siapa memilih kandidat tertentu?

Desain PRD mengharuskan pemisahan data pemilih dan data ballot serta melarang identitas pemilih disimpan pada tabel ballot. Namun, kerahasiaan pilihan harus dijaga di seluruh sistem dan proses operasional, bukan hanya melalui struktur tabel. Jangan membuat klaim absolut sebelum audit teknis dan operasional selesai.

### Apakah hasil suara dapat dilihat selama pemungutan suara?

Hasil/tally langsung direncanakan bersifat privat selama pemungutan suara. Aksesnya dibatasi untuk pihak yang berwenang sesuai kebijakan yang harus disahkan.

### Kepada siapa saya harus menghubungi jika mengalami masalah?

Kontak dan kanal bantuan resmi belum tercantum dalam sumber yang tersedia: **TBD**. Panitia perlu mengisi bagian ini sebelum panduan dipublikasikan.

---

## 6. Informasi yang Wajib Dilengkapi Sebelum Publikasi

| Item | Status | Catatan |
|---|---|---|
| URL aplikasi produksi | TBD | Isi setelah domain resmi ditetapkan. |
| Jadwal pembukaan dan penutupan | TBD | Harus sesuai keputusan resmi Pemira. |
| Kontak helpdesk dan jam layanan | TBD | Sertakan kanal resmi dan eskalasi. |
| Template CSV/XLSX DPT | TBD | Sertakan contoh file dan aturan format. |
| Matriks role dan izin admin | TBD | Hindari panduan yang memberi kesan semua admin setara. |
| Kebijakan publikasi hasil | TBD | Bedakan turnout, tally internal, dan hasil resmi. |
| Semantik receipt/token | TBD | Tetapkan fungsi, masa berlaku, dan sensitivitas token. |
| Prosedur transaksi berstatus tidak pasti | TBD | Wajib tersedia sebelum pemungutan suara. |
| Kebijakan koreksi data pemilih | TBD | Termasuk penanganan duplikasi dan perubahan DPT. |
| Prosedur insiden dan kontak eskalasi | TBD | Selaraskan dengan `SECURITY.md` dan `OPERATIONS.md`. |
| Screenshot UI final | TBD | Ambil dari build yang telah disetujui, bukan mockup lama. |

---

## 7. Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-31 | Draft awal panduan pemilih dan panduan umum admin berdasarkan PRD/UI. |

---

## 8. Catatan Peninjauan

Dokumen ini perlu ditinjau bersama:

- `PRD.md` untuk kesesuaian alur dan ruang lingkup;
- `UI.md` untuk label dan tampilan aktual;
- `AUTHENTICATION.md` untuk alur login dan status sesi;
- `SECURITY.md` untuk perlindungan data dan penanganan insiden;
- `OPERATIONS.md` untuk prosedur operasional panitia;
- `API.md` dan `DATABASE.md` bila penjelasan status transaksi/receipt perlu diperjelas.

**Release gate:** Jangan publikasikan panduan ini kepada pemilih sebelum URL, jadwal, kontak bantuan, screenshot UI final, serta prosedur transaksi tidak pasti telah ditetapkan.
