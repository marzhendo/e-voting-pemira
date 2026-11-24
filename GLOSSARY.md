# Pemira HMIF E-Voting Platform

Kamus istilah domain resmi untuk sistem pemilihan raya Chairman dan Vice Chairman Himpunan Mahasiswa Informatika (HMIF) Telkom University Purwokerto.

## Language

**Daftar Pemilih Tetap (DPT)**:
Daftar resmi mahasiswa aktif Informatika yang memiliki hak suara sah dan terverifikasi di dalam basis data sistem.
_Avoid_: Voter whitelist, voter roster, daftar akun, user list

**Kata Sandi Pemilih**:
Kode alfanumerik unik 6–8 karakter yang dihasilkan sistem dan dibagikan secara privat kepada masing-masing pemilih sebelum hari pemilihan untuk autentikasi masuk ke bilik suara.
_Avoid_: OTP, PIN login, token pemilihan, voting password, sandi sementara

**Bilik Suara Digital**:
Antarmuka web interaktif tempat pemilih melihat profil kandidat dan menyalurkan satu hak suara secara sah dan rahasia.
_Avoid_: Voting booth, bilik pencoblosan, halaman voting, voting screen

**Tanda Terima Pemilihan**:
Bukti pencatatan suara anonim berupa token acak dan hash SHA-256 yang membuktikan bahwa hak suara pemilih telah tercatat tanpa memuat identitas pilihan kandidat.
_Avoid_: Voting receipt, voting token, kuitansi suara, bukti coblos

**Surat Suara Anonim**:
Entitas rekaman pilihan suara di dalam basis data yang sepenuhnya terisolasi dan tidak memiliki keterkaitan relasi (foreign key) dengan identitas pemilih.
_Avoid_: Ballot record, suara pemilih, user ballot

**Rekapitulasi Suara**:
Hasil agregasi penghitungan perolehan suara sah seluruh pasangan calon dan kotak kosong yang dipublikasikan setelah masa pemilihan resmi ditutup oleh panitia.
_Avoid_: Live tally, quick count, hasil suara sementara, perolehan real-time
