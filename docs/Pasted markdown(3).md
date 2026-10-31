# **📋 Laporan Audit & Konsistensi Dokumen Proyek**

Dokumentasi proyek ini **sangat komprehensif, matang, dan berstandar enterprise** (mencakup lebih dari 15 dokumen teknis dengan total \~250 KB teks spesifikasi). Namun, setelah diaudit secara silang (*cross-document audit*), ditemukan beberapa **ketidakkonsistenan antar-dokumen, broken references, celah logika pada spesifikasi teknis, serta hal-hal penting yang masih belum ditentukan (gaps)**.

---

## **1. ⚠️ Inkonsistensi & Kontradiksi Antar-Dokumen**

### **1.1 Kontradiksi Tipe Data: `DATA_DICTIONARY.md` vs `PRD.md` & `DATABASE.md`**

- **Temuan:** Di `DATA_DICTIONARY.md`, banyak kolom diberi keterangan *"Tipe belum dinyatakan eksplisit"* atau *"TBD"*, misalnya:     &#x20;
  - Kolom `email`, `name`, `generation` pada `voters_whitelist`.
  - Kolom `candidate_number`, `leader_name`, `vice_leader_name`, `vision`, `photo_url`, `is_active` pada `candidates`.
  - Kolom `is_voting_open`, `start_time`, `end_time`, `maintenance_mode` pada `election_settings`.
- **Fakta di Dokumen Lain:** DDL konkret sudah didefinisikan secara eksplisit dan lengkap di `PRD.md` Bagian 5 dan `DATABASE.md` Bagian 4 (misal: `email VARCHAR(120)`, `name VARCHAR(150)`, `generation INT`, `start_time TIMESTAMPTZ`, dsb.).
- **Rekomendasi:** Perbarui `DATA_DICTIONARY.md` agar mencerminkan tipe data dan *constraint* yang sudah ada di DDL resmi, bukan menandainya sebagai belum ditentukan.

### **1.2 Broken References & Dokumen "Hantu" yang Dirujuk**

Beberapa dokumen merujuk ke dokumen lain yang **belum ada** atau **salah nama file**:

1. **`README.md` (Baris 81):** Mencantumkan `ADMIN_GUIDE.md` (*"Panduan administrator dan panitia"*), namun file `docs/ADMIN_GUIDE.md` **tidak ada di repositori**. (Yang ada hanya `USER_GUIDE.md`).
2. **`ARCHITECTURE.md` & `DATABASE.md`:** Berkali-kali merujuk ke `AUTH.md`. Nama file aktual di repositori adalah `AUTHENTICATION.md`.
3. **`ARCHITECTURE.md` (Baris 609, 641):** Merujuk ke `RBAC.md` dan `DESIGN_SYSTEM.md`. Kedua file tersebut **tidak ada** di dalam folder `docs/`.
4. **Catatan status di `ARCHITECTURE.md` (Baris 18-20, 81-85):** Tertulis *"exact root AGENTS.md ... have not been inspected"*, padahal file `AGENTS.md` sudah ada di root proyek.

### **1.3 Inkonsistensi Routing Aplikasi & Struktur Folder**

- **Dashboard Panitia:**     &#x20;
  - Di `UI.md` (Layar 5): menggunakan path `/admin`.
  - Di `AGENTS.md` (Struktur Folder): menggunakan path `app/(admin)/dashboard/`.
- **Halaman Bukti Tanda Terima (*Receipt*):**     &#x20;
  - Di `UI.md` (Layar 4) dan `PRD.md`: menetapkan rute `/receipt`.
  - Di `AGENTS.md`: rute `(voter)/receipt` belum dicantumkan dalam pemetaan direktori standar.

---

## **2. 🛡️ Celah Logika & Keamanan pada Spesifikasi Teknis**

### **2.1 Bug Logika Kritis pada Stored Procedure `cast_ballot_secure`**

Pada `PRD.md` (Baris 97-105) dan `DATABASE.md`, pengecekan jendela pemilihan di RPC ditulis sebagai berikut:

```
sql
```

SELECT is_voting_open AND (v_now BETWEEN start_time AND end_time)

INTO v_voting_open

FROM public.election_settings

WHERE id = 1;

- **Celah:** Kolom `maintenance_mode` yang ada di tabel `election_settings` **sama sekali tidak dicek** di dalam RPC ini!
- **Dampak:** Jika panitia menyalakan `maintenance_mode = true` karena insiden darurat, pengguna yang langsung memicu transaksi database tetap bisa mencoblos selama `is_voting_open = true` dan waktunya masih berada dalam rentang jadwal.
- **Perbaikan:** Syarat di RPC wajib diubah menjadi:  &#x20;
  ```
  sql
  ```
  SELECT is_voting_open AND NOT maintenance_mode AND (v_now BETWEEN start_time AND end_time)

  INTO v_voting_open

  ...

### **2.2 Kerentanan Integritas: *Client-Side Receipt Token***

- Di `PRD.md` FR-02-05: tertulis *"Menghasilkan Hash Token unik acak (Voting Receipt Code) di sisi klien sebagai bukti bahwa proses pemilihan telah tuntas"*.
- **Risiko:** Token yang dibuat di sisi browser tanpa tanda tangan kriptografis dari server (*HMAC/Signature*) atau tanpa pencatatan token di server tidak memiliki nilai pembuktian (*non-repudiation*). Siapa pun bisa merekayasa string hex acak di browser console.
- **Solusi yang Perlu Disepakati:** Token tanda terima sebaiknya dihasilkan oleh server saat RPC berhasil (misal: UUID transaksi acak atau signature hash) dan disimpan di kolom `voters_whitelist.receipt_hash` (aman karena tidak menghubungkan ke pilihan paslon di `ballots`).

### **2.3 Risiko Timezone Database pada Tanggal Sesi (`CURRENT_DATE`)**

- Di tabel `ballots`: kolom `voting_session_date DATE DEFAULT CURRENT_DATE`.
- **Isu:** Supabase / PostgreSQL cloud default-nya berjalan di zona waktu **UTC**. Di Indonesia (WIB = UTC+7), jam 00:00 s.d. 06:59 pagi WIB masih tercatat sebagai tanggal hari sebelumnya di UTC.
- **Solusi:** Tentukan secara eksplisit zona waktu pemilihan (misal: `(NOW() AT TIME ZONE 'Asia/Jakarta')::DATE`).

---

## **3. 🧩 Hal-Hal yang Masih Belum Ditetapkan (*Missing Specifications & Gaps*)**

### **3.1 Skema & Mekanisme Role-Based Access Control (RBAC) Admin**

- Meskipun `PRD.md`, `API.md`, dan `SECURITY.md` menyebut peran KPR/Admin dan Superadmin:     &#x20;
  - **Belum ada tabel database untuk admin** (misal tabel `admin_users` atau `roles`).
  - Belum ada kepastian apakah role admin diambil dari *Microsoft Entra App Roles*, *Security Group*, atau *whitelist* email di environment variable (`ADMIN_EMAILS`).
  - Tanpa ini, middleware otorisasi `/api/admin/*` belum dapat diimplementasikan secara konkret.

### **3.2 Ambiguitas Yuridis Opsi "Kotak Kosong" vs "Abstain" (Kandidat ID `0`)**

- Di berbagai dokumen, istilah **Kotak Kosong** dan **Abstain** dipakai bergantian (*interchangeable*).
- Dalam hukum pemilu:     &#x20;
  - *Kotak Kosong* umumnya hanya ada jika pemilihan calon tunggal (Paslon 1 vs Kotak Kosong).
  - Jika terdapat 2 atau lebih paslon, apakah opsi `0` ini tetap ada sebagai "Abstain / Tidak Memilih Calon Manapun"?
  - Dokumen membutuhkan konfirmasi aturan teknis pemira dari panitia KPR HMIF.

### **3.3 Kebijakan Konflik & Validasi Impor DPT**

- Pada modul DPT (`PRD.md` FR-04 & `DATABASE.md`):     &#x20;
  - Belum didefinisikan perilaku jika ada baris duplikat di file Excel/CSV: Apakah seluruh file di-*reject* (transaksional penuh), atau baris valid tetap diimpor sedangkan baris invalid di-skip?
  - Belum ada batasan maksimum ukuran file upload (.xlsx/.csv).

### **3.4 Ketiadaan Dokumen `ADMIN_GUIDE.md`**

- `README.md` menjanjikan adanya `ADMIN_GUIDE.md` sebagai panduan operasional panitia, namun file tersebut belum dibuat. Dokumen `OPERATIONS.md` saat ini lebih berfokus pada runbook teknis/insiden daripada panduan penggunaan UI dashboard admin.

### **3.5 Belum Tersedianya Kode Implementasi & File Environment Contoh**

- Proyek saat ini memiliki dokumentasi yang luar biasa detail, namun:     &#x20;
  - Belum memiliki `package.json`, `tsconfig.json`, atau struktur `app/` Next.js.
  - Belum memiliki `.env.example` sebagai acuan setup environment lokal.

---

## **4. 📌 Matriks Ringkasan Audit Dokumen**

| Dokumen              | Status             | Temuan Utama / Catatan                                                            | Tindakan yang Diperlukan                                   |
| -------------------- | ------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `README.md`          | Lengkap            | Merujuk ke `ADMIN_GUIDE.md` yang belum ada                                        | Buat `ADMIN_GUIDE.md` atau hapus rujukannya                |
| `PRD.md`             | Sangat Baik        | `cast_ballot_secure` tidak mengecek `maintenance_mode`; receipt token client-side | Tambahkan cek `maintenance_mode` di SQL                    |
| `UI.md`              | Baik               | Path `/admin` vs `/dashboard` di AGENTS.md                                        | Samakan konvensi rute admin                                |
| `ARCHITECTURE.md`    | Sangat Lengkap     | Rujukan `AUTH.md`, `RBAC.md`, `DESIGN_SYSTEM.md`                                  | Perbaiki link ke `AUTHENTICATION.md`, lengkapi yang kurang |
| `DATABASE.md`        | Sangat Lengkap     | Menyoroti potensi risiko RLS dan trust boundary `p_nim`                           | Siapkan migrasi SQL konkret                                |
| `DATA_DICTIONARY.md` | Perlu Sinkronisasi | Masih mencatat tipe data sebagai "TBD" padahal DDL sudah ada                      | Sinkronkan tipe data dari PRD/DATABASE.md                  |
| `API.md`             | Sangat Baik        | Kontrak route & server actions rapi                                               | Tetapkan implementasi RBAC admin                           |
| `AUTHENTICATION.md`  | Sangat Baik        | Menguraikan OIDC dan NIM mapping                                                  | Finalkan aturan mapping Entra ID claim -> NIM              |
| `SECURITY.md`        | Sangat Lengkap     | Threat register mencakup 21 skenario ancaman                                      | Pertahankan sebagai acuan code review                      |
| `TESTING.md`         | Sangat Lengkap     | Skema pengujian Playwright & Concurrency jelas                                    | Siapkan test runner                                        |
| `DEPLOYMENT.md`      | Baik               | Kebutuhan infrastruktur terpetakan                                                | Pilih provider hosting resmi (Vercel/Cloud Run)            |
| `ENVIRONMENT.md`     | Baik               | Prinsip pemisahan env & secret aman                                               | Buat template file `.env.example`                          |
| `OPERATIONS.md`      | Sangat Baik        | Runbook fase pra-pemilihan, buka-tutup, dan insiden                               | Sesuaikan jadwal resmi pemira                              |
| `USER_GUIDE.md`      | Baik               | Panduan pemilih ramah pengguna                                                    | Lengkapi tautan/kontak narahubung resmi                    |
| `CONTRIBUTING.md`    | Sangat Baik        | Aturan PR, Git workflow, dan larangan commit secret                               | Siapkan pre-commit hook (Husky)                            |
| `CHANGELOG.md`       | Rapi               | Format Keep a Changelog                                                           | Siap digunakan saat rilis dimulai                          |

---

## **5. 🎯 Rekomendasi Langkah Selanjutnya**

1. **Sinkronisasi Cepat (Dokumentasi):**     &#x20;
   - Update `DATA_DICTIONARY.md` agar tipe datanya sesuai dengan DDL di `PRD.md`.
   - Perbaiki nama referensi dokumen (`AUTH.md` -> `AUTHENTICATION.md`) dan buat `docs/ADMIN_GUIDE.md`.
2. **Koreksi Fungsi Database:**     &#x20;
   - Tambahkan syarat `AND NOT maintenance_mode` pada stored procedure `cast_ballot_secure` di `PRD.md` dan `DATABASE.md`.
3. **Keputusan Arsitektur Kunci (ADR):**     &#x20;
   - Putuskan mekanisme penetapan role Admin/Panitia (rekomendasi praktis: tabel `admin_whitelist` berisi email panitia terverifikasi).
   - Putuskan verifikasi server-side untuk Voting Receipt Token agar bukti pemilih tidak dapat dipalsukan.
4. **Mulai Inisialisasi Proyek (Codebase):**     &#x20;
   - Buat `package.json`, inisialisasi Next.js 14/15 App Router, file `.env.example`, dan skrip migrasi SQL Supabase pertama.