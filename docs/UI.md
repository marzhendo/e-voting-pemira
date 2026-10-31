1. Blueprint Tata Letak (Screen Breakdown)

Layar 1: Login & Verifikasi SSO (/login)

Layout: Split-screen (desktop) atau kartu vertikal terpusat (mobile).

Elemen: Sisi kiri latar gelap (#1E1E1E) dengan ilustrasi garis/geometris abstrak khas HMIF dan judul Pemira. Sisi kanan kartu putih (#FFFFFF) berisi salam pembuka, status jadwal pemungutan suara (aktif/belum dibuka), dan tombol tunggal "Masuk dengan Akun Kampus (Microsoft Entra)" berwarna biru institusi (#29388B).

Layar 2: Bilik Suara Digital (/vote)

Layout: Sticky top bar berisi sisa sesi login dan tombol bantuan, diikuti grid kartu paslon (1 kolom di mobile, 2-3 kolom di desktop).

Kartu Paslon:

Background putih dengan border tipis #8B8A8B. Saat kursor diarahkan (hover) atau dipilih, border menyala dengan warna emas #EBBD1C.

Nomor urut besar di pojok kiri atas menggunakan font Bebas Neue warna #EBBD1C.

Foto formal paslon rasio 4:5 dengan sudut melengkung halus (rounded-xl).

Nama calon Ketua & Wakil Ketua (font Montserrat tebal).

Tombol accordion kecil untuk membuka ringkasan Visi & Misi (font Poppins warna #5E5E5E).

Tombol utama di bawah kartu: "Pilih Paslon Ini" warna #EBBD1C dengan teks #1E1E1E.

Kartu Kotak Kosong / Abstain:

Diletakkan terpisah di urutan paling akhir atau baris bawah.

Desain minimalis tanpa foto, menggunakan ikon siluet netral atau lambang kotak suara kosong dengan aksen border merah maroon #B71B25.

Layar 3: Modal Konfirmasi Coblos (Pop-up Dialog)

Layout: Backdrop overlay semi-transparan warna gelap (#1E1E1E opacity 75%) dengan efek backdrop-blur.

Elemen: Dialog terpusat yang menampilkan miniatur foto dan nomor paslon yang dipilih. Teks peringatan tebal: "Pilihan Anda bersifat final dan langsung dienkripsi tanpa nama." Dua tombol aksi: "Ubah Pilihan" (border abu-abu) dan "Konfirmasi & Kirim Suara" (latar emas #EBBD1C).

Layar 4: Tanda Terima Digital (/receipt)

Layout: Halaman konfirmasi terpusat bergaya digital ticket atau boarding pass.

Elemen: Ikon centang sukses, teks apresiasi telah menggunakan hak suara, tanggal pemilihan, dan blok token heksadesimal acak sebagai bukti validasi tanpa mencantumkan kandidat yang dicoblos.

Layar 5: Dashboard Panitia / Private Live Count (/admin)

Layout: Admin shell dengan sidebar gelap (#1E1E1E) dan kanvas kerja putih/krem (#F8FAE0).

Elemen: Tiga kartu metrik di baris atas (Total DPT, Suara Masuk, Persentase Partisipasi). Di bawahnya terdapat diagram batang perolehan suara real-time per paslon dan breakdown persentase pemilih per angkatan.