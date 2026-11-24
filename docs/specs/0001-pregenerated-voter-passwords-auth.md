# Spesifikasi: Autentikasi Pemilih Berbasis Kata Sandi Unik Terdistribusi (Pre-Generated Passwords)

## Problem Statement

Pada arsitektur sistem pemilihan saat ini, pemilih masuk ke bilik suara menggunakan kode OTP 6-digit yang dikirimkan secara langsung (*on-demand*) ke email kampus mahasiswa saat mereka mengetikkan NIM di halaman login. 

Namun, akun pengirim email resmi panitia (`hmif.telu.purwokerto@gmail.com`) memiliki kuota pengiriman mutlak sebesar **500 email per 24 jam**. Dengan total Daftar Pemilih Tetap (DPT) sebanyak **1.232 mahasiswa**, jika pemilih mengakses bilik suara pada hari pemilihan, kuota pengiriman email akan habis total setelah mahasiswa ke-500. Akibatnya, lebih dari 700 mahasiswa lainnya tidak akan dapat menerima kode PIN verifikasi, menyebabkan kegagalan sistemik di mana mayoritas mahasiswa kehilangan hak suara dan bilik suara macet total.

## Solution

Mengganti mekanisme login pemilih dari Just-In-Time OTP menjadi sistem **Kata Sandi Pemilih Unik** yang digenerate oleh sistem dan didistribusikan secara privat ke email masing-masing pemilih sebelum hari pemilihan dimulai:

1. **Distribusi Pra-Pemilihan**: Panitia mengirimkan email resmi berisi kredensial (NIM dan Kata Sandi Pemilih unik) secara bertahap per angkatan sebelum hari H.
2. **Login Satu Langkah (*Single-Step Login*)**: Di hari pemilihan, pemilih cukup memasukkan NIM dan Kata Sandi Pemilih mereka dalam satu formulir sederhana. Sistem langsung menerbitkan token sesi JWT tanpa perlu mengirimkan email apa pun saat login.
3. **Penyimpanan Terenkripsi (*Zero Plaintext Storage*)**: Basis data hanya menyimpan nilai hash kriptografis (`password_hash`) dengan salt rahasia, memastikan kerahasiaan kata sandi pemilih tetap terlindungi.
4. **Proteksi Anti Brute-Force**: Sistem membatasi percobaan login salah maksimal 5 kali berturut-turut per NIM sebelum mengunci sementara akun tersebut.
5. **Dukungan Bantuan Panitia**: Disediakan tombol aksi bagi Panitia KPR di dasbor admin untuk mereset dan mengirimkan ulang kata sandi secara perorangan apabila ada pemilih yang emailnya terhapus atau terselip di folder spam.

## User Stories

1. Sebagai seorang pemilih terdaftar, saya ingin menerima email pemberitahuan sebelum hari pemilihan yang berisi NIM dan Kata Sandi Pemilih unik saya, sehingga saya siap masuk ke bilik suara tanpa kendala kuota email.
2. Sebagai seorang pemilih, saya ingin masuk ke bilik suara dengan memasukkan NIM dan Kata Sandi Pemilih dalam satu layar formulir, sehingga proses login berlangsung cepat, ringkas, dan tanpa jeda waktu menunggu email.
3. Sebagai seorang pemilih di perangkat ponsel pintar, saya ingin dapat melihat atau menyembunyikan karakter kata sandi melalui tombol ikon mata, sehingga saya dapat memastikan kata sandi yang saya ketik sudah benar.
4. Sebagai seorang pemilih di perangkat ponsel pintar, saya ingin kolom input dan tombol aksi memiliki target sentuh minimal 44 piksel, sehingga saya dapat menekan tombol dengan nyaman tanpa salah klik.
5. Sebagai seorang pemilih, saya ingin melihat pesan kesalahan yang jelas dan manusiawi jika saya salah memasukkan kata sandi, sehingga saya mengetahui sisa kesempatan percobaan login saya.
6. Sebagai seorang pemilih yang akunnya terkunci akibat salah memasukkan kata sandi 5 kali berturut-turut, saya ingin melihat petunjuk waktu tunggu dan tautan bantuan panitia KPR, sehingga saya tahu langkah yang harus saya ambil.
7. Sebagai seorang pemilih yang sudah menggunakan hak suara, saya ingin tetap dapat login menggunakan NIM dan Kata Sandi Pemilih saya untuk melihat tanda terima dan rekapitulasi suara akhir, sehingga saya memiliki transparansi atas hak suara saya.
8. Sebagai seorang pemilih yang sudah menggunakan hak suara, saya ingin sistem secara otomatis mengarahkan saya ke halaman tanda terima (`/receipt`) dan mencegah saya masuk kembali ke bilik suara (`/vote`), sehingga prinsip satu pemilih satu suara tetap terjaga.
9. Sebagai seorang pemilih yang kehilangan email kata sandinya, saya ingin dapat melapor ke panitia KPR untuk mendapatkan pengiriman ulang kata sandi baru, sehingga hak pilih saya tidak hilang.
10. Sebagai seorang Panitia KPR, saya ingin dapat men-generate kata sandi unik untuk seluruh pemilih di DPT dengan satu tindakan aman, sehingga setiap pemilih memiliki kredensial unik ber-entropi tinggi.
11. Sebagai seorang Panitia KPR, saya ingin dapat mengirimkan email kata sandi secara bertahap berdasarkan angkatan, sehingga pengiriman tidak menabrak batas harian 500 email akun Gmail.
12. Sebagai seorang Panitia KPR, saya ingin melihat indikator status pada data pemilih apakah kata sandi sudah pernah di-generate dan dikirimkan, sehingga panitia dapat memantau kesiapan distribusi kredensial.
13. Sebagai seorang Panitia KPR, saya ingin memiliki tombol aksi di dasbor admin untuk me-reset dan mengirim ulang kata sandi kepada pemilih tertentu yang meminta bantuan, sehingga masalah teknis pemilih dapat diselesaikan dalam hitungan detik.
14. Sebagai seorang Panitia KPR, saya ingin memastikan kata sandi pemilih di basis data disimpan dalam bentuk hash kriptografis satu arah, sehingga integritas dan keamanan data pemilih terjamin meskipun basis data diakses oleh pihak luar.
15. Sebagai seorang Superadmin, saya ingin proses login saya tetap menggunakan akun email resmi superadmin yang terdaftar dan terlindungi dari pembatasan pemilih biasa, sehingga kendali administratif sistem tetap terjaga.
16. Sebagai seorang auditor independen, saya ingin setiap tindakan pembuatan dan pengiriman ulang kata sandi oleh panitia tercatat di dalam Audit Log resmi, sehingga seluruh proses distribusi kredensial dapat diaudit secara akuntabel.

## Implementation Decisions

### 1. Perubahan Skema Basis Data (Database Schema)
Pada tabel `public.voters_whitelist` di PostgreSQL / Supabase, ditambahkan kolom-kolom berikut:
- `password_hash` (`TEXT`): Nilai hash kriptografis SHA-256 tersalt dari kata sandi pemilih.
- `password_created_at` (`TIMESTAMPTZ`): Waktu pembuatan kata sandi.
- `login_attempts` (`INT DEFAULT 0`): Penghitung kegagalan login untuk proteksi *brute-force*.
- `locked_until` (`TIMESTAMPTZ NULL`): Waktu akhir masa penguncian akun jika gagal 5 kali berturut-turut.
- Kolom legacy `otp_hash`, `otp_expires_at`, dan `otp_attempts` dipertahankan sementara (*deprecated*) untuk transisi mulus dan *backward compatibility* pengujian lokal.

### 2. Generator Kredensial & Enkripsi (Cryptographic Generator)
- Generator kata sandi menggunakan fungsi acak ber-entropi tinggi (`crypto.randomInt` / CSPRNG).
- Format kata sandi: 8 karakter alfanumerik huruf kapital dan angka tanpa karakter ambigu (mengecualikan `0`, `O`, `1`, `I`, `L`), contoh: `K97M-2P4Q` atau `HM-83K9X2`.
- Verifikasi kata sandi di server menggunakan `crypto.timingSafeEqual` untuk mencegah serangan kebocoran waktu (*timing attacks*).

### 3. API Contract & Endpoint Handlers
- **`POST /api/auth/login`**:
  - Payload: `{ nim: string, password: string }`
  - Validasi runtime Zod: NIM numerik valid, password minimal 6 karakter.
  - Return:
    - Sukses: Cookie sesi HTTP-Only JWT diterbitkan, redirect target (`/vote` jika belum memilih, `/receipt` jika sudah memilih).
    - Gagal: HTTP 401 dengan sisa percobaan login (`"Kata sandi salah. Sisa kesempatan: X kali"`).
    - Terkunci: HTTP 423 Locked dengan sisa menit penguncian.
- **`POST /api/admin/dpt/passwords/generate`**:
  - Khusus peran `super_admin` dan `kpr_admin`.
  - Membuat kata sandi unik baru bagi pemilih yang belum memiliki kata sandi atau yang di-reset.
- **`POST /api/admin/dpt/passwords/resend`**:
  - Mengirimkan ulang kata sandi baru untuk satu pemilih tertentu berdasarkan ID/NIM.

### 4. Desain Antarmuka Login (UI/UX Engineering)
Memenuhi standar 4 panduan desain wajib:
- **`make-interfaces-feel-better`**:
  - Kolom input NIM dan Kata Sandi memiliki tinggi sentuh nyaman (minimal 44px).
  - Terdapat tombol *toggle* mata (*Eye/EyeOff*) untuk melihat karakter kata sandi di layar ponsel.
  - Tombol aksi utama "Masuk ke Bilik Suara" memiliki status aktif mikro (`active:scale-[0.98]`) dan fokus cincin emas tegas (`focus-visible:ring-2 focus-visible:ring-primary`).
- **`design-taste-frontend`**:
  - Konsistensi palet resmi HMIF Telkom University Purwokerto (Dark `#1E1E1E`, Gold `#EBBD1C`, Putih `#FFFFFF`).
  - Kartu formulir berbayang halus (*subtle border* `border-outline-variant/30`) di tengah layar tanpa ornamen berlebih.
- **`antislop-copywriting`**:
  - Seluruh label menggunakan format *sentence case* (`NIM mahasiswa`, `Kata sandi pemilih`).
  - Menghapus seluruh ikon emoji anak muda/AI pada antarmuka login.
  - Pesan peringatan ditulis dalam bahasa Indonesia resmi dan lugas tanpa jargon teknis asing.
- **`antislop-layoutmobile`**:
  - Tata letak satu kolom responsif (`w-full max-w-md mx-auto`) yang nyaman di semua ukuran layar mulai dari ponsel 360px hingga desktop 1440px.
  - Tidak ada luapan horizontal (*zero horizontal overflow*) dan padding adaptif saat papan ketik virtual (*virtual keyboard*) muncul di ponsel.

## Testing Decisions

### Modul yang Diuji
1. **`lib/auth/password-service.ts`**:
   - Memverifikasi entropi dan keacakan generator kata sandi (tidak pernah menghasilkan karakter ambigu `0, O, 1, I`).
   - Memverifikasi fungsi hashing dan `timingSafeEqual` menolak kata sandi yang salah secara konsisten.
2. **`lib/auth/rate-limiter.ts`**:
   - Memverifikasi penguncian otomatis setelah 5 kali gagal memasukkan kata sandi.
   - Memverifikasi reset penghitung saat kata sandi yang dimasukkan benar.
3. **`app/api/auth/login/route.ts`**:
   - Menguji *happy path* login pemilih baru $\rightarrow$ cookie sesi terbit dengan `hasVoted: false`.
   - Menguji pemilih yang sudah memilih $\rightarrow$ cookie sesi terbit dengan `hasVoted: true`, respons mengarahkan ke `/receipt`.
   - Menguji penolakan NIM yang tidak terdaftar di DPT (HTTP 403).
4. **`tests/e2e/login-flow.spec.ts`**:
   - Pengujian alur antarmuka di perangkat mobile dan desktop: input NIM dan kata sandi, melihat password, validasi error, dan navigasi ke bilik suara.

### Standar Pengujian
- Pengujian hanya menguji perilaku eksternal (*black-box contract*), bukan detail implementasi internal variabel privat.
- Menggunakan suite pengujian bawaan Node.js (`node --test`) yang sudah terpasang di repositori untuk menjaga kecepatan eksekusi CI/CD.

## Out of Scope

1. **Formulir "Lupa Kata Sandi" Mandiri Tanpa Batas**: Sistem sengaja tidak menyediakan tombol publik bagi siapa pun untuk meminta email massal secara mandiri di halaman login demi mencegah serangan *denial-of-service* yang menghabiskan kuota email SMTP. Mahasiswa yang kehilangan kata sandi wajib menghubungi Panitia KPR.
2. **Autentikasi Dua Faktor (2FA) via SMS atau WhatsApp**: Sistem tidak menggunakan OTP berbayar via SMS/WhatsApp Gateway pihak ketiga untuk meminimalkan ketergantungan biaya eksternal.

## Further Notes

- **Jadwal Distribusi Batch**: Disarankan pengiriman email kata sandi dibagi menjadi 2 sesi:
  - **Sesi 1 (H-1 Malam)**: Angkatan 2024 dan 2025 (~521 pemilih).
  - **Sesi 2 (Hari-H Dini Hari / Pagi)**: Angkatan 2023, 2022, dan angkatan atas (~711 pemilih).
  Dengan jeda tersebut, limit 500 email per 24 jam akun Gmail tidak akan terlampaui.
