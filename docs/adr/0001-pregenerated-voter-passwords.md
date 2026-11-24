# Beralih dari On-Demand Email OTP ke Pre-generated Unique Password

## Konteks
Sistem autentikasi pemilih sebelumnya mengandalkan Just-In-Time (JIT) OTP 6-digit yang dikirimkan via SMTP Gmail (`hmif.telu.purwokerto@gmail.com`) saat pemilih memasukkan NIM di halaman login. Berdasarkan audit teknis, akun Gmail gratis memiliki batas pengiriman mutlak 500 email per 24 jam. Dengan jumlah Daftar Pemilih Tetap (DPT) sebanyak 1.232 mahasiswa, apabila mahasiswa meminta kode OTP secara serentak di hari pemilihan, kuota pengiriman akan habis sebelum seluruh pemilih dapat mencoblos, sehingga melumpuhkan akses bilik suara.

## Keputusan
Kita mengganti mekanisme autentikasi bilik suara dari email OTP kirim-langsung menjadi **Kata Sandi Pemilih Unik** yang digenerate dan didistribusikan panitia sebelum bilik suara dibuka. Di dalam basis data Supabase (`voters_whitelist`), kata sandi wajib disimpan secara aman dalam bentuk hash satu arah (`password_hash` dengan garam kriptografis), dan teks polos kata sandi tidak pernah disimpan di server setelah email didistribusikan. Pengiriman email berisi kata sandi dilakukan secara bertahap terjadwal per angkatan sebelum hari H.

## Konsekuensi
1. **Beban Pengiriman Email Hari-H Menjadi Nol**: Selama jam pemilihan berlangsung, sistem tidak perlu mengirimkan email transaksi untuk login pemilih biasa, mengeliminasi risiko kegagalan login akibat kehabisan kuota email.
2. **Pengalaman Pengguna Instan**: Pemilih dapat langsung masuk ke bilik suara dalam 1 langkah (NIM + Kata Sandi Pemilih) tanpa menunggu kedatangan email OTP.
3. **Kebutuhan Fasilitas Penanganan Darurat**: Panitia KPR di dasbor admin memerlukan fitur bantuan untuk melakukan reset atau pengiriman ulang kata sandi secara perorangan jika ada pemilih yang kehilangan email kata sandinya.
