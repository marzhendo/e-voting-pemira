Product Requirement Document (PRD)Project Name: E-Voting Pemira HMIFDocument Version: 1.0.0Target Delivery: Periode Suksesi Kepengurusan HMIFAuthor: Senior System AnalystTech Lead / Coordinator: Koordinator IT Team Pemira HMIFStatus: Approved for Implementation1. Executive Summary & Objective1.1 Latar BelakangPemilihan Raya (Pemira) Himpunan Mahasiswa Informatika (HMIF) merupakan agenda tahunan suksesi kepemimpinan untuk memilih Ketua dan Wakil Ketua Himpunan (Kahim & Wakahim). Untuk mewujudkan pemilihan yang transparan, kredibel, efisien, dan ramah lingkungan, diperlukan platform E-Voting berbasis web terpusat.1.2 Problem StatementMetode manual berbasis kertas rentan terhadap kesalahan hitung, inefisiensi logistik, dan potensi manipulasi fisik.Autentikasi pemilih rentan terhadap pemilih ganda atau pemilih tidak sah jika tidak diverifikasi langsung dengan identitas kampus resmi.Ketidakpercayaan mahasiswa terhadap kerahasiaan pilihan jika sistem digital mencatat hubungan langsung antara identitas pemilih dan suara yang dicoblos.1.3 Tujuan & Key Results (OKRs)Integritas 100%: Memastikan prinsip One-Man-One-Vote tanpa celah double-voting atau race condition.Ballot Secrecy (LUBER): Menjamin suara bersifat anonim murni secara arsitektural tanpa relasi ke identitas pemilih.Adopsi & Turnout: Menyediakan alur voting yang dapat diselesaikan dalam waktu kurang dari 60 detik melalui SSO institusi.Akses Terkendali (JURDIL): Menjaga hasil suara (live count) tetap terkunci privat hanya untuk panitia berwenang (KPR/Admin) hingga waktu pemungutan suara resmi ditutup.2. Ruang Lingkup Sistem (Scope of Work)2.1 In-ScopeAutentikasi SSO Microsoft Entra ID: mahasiswa login menggunakan akun institusi Telkom University. App Registration dikelola pada tenant milik tim E-Voting dan dikonfigurasi multitenant; aplikasi hanya menerima tenant Telkom University yang telah diizinkan.Whitelist DPT Verification: Validasi silang data login terhadap Daftar Pemilih Tetap (DPT) dari kemahasiswaan.Bilik Suara Digital (Ballot Booth):Tampilan profil pasangan calon (Paslon 1, 2, dst.).Opsi pilihan Kotak Kosong / Abstain.Modal konfirmasi ganda (double-confirmation dialog).Token tanda terima digital usai mencoblos.Isolasi Data Suara: Pemisahan tabel pemilih dan tabel suara melalui transaksi atomik SQL.Dashboard Panitia (KPR/Admin):Manajemen impor DPT (CSV / Excel).Sakelar jadwal pemungutan suara (toggle voting window).Private Live Count (monitoring perolehan suara dan angka partisipasi per angkatan secara real-time).Export Berita Acara dan rekapitulasi akhir (PDF / Excel).Audit Trail: Pencatatan log aktivitas panitia secara terisolasi.2.2 Out-of-ScopeFitur debat/tanya-jawab interaktif langsung di dalam website (difasilitasi di forum luring/Instagram HMIF).Pendaftaran mandiri akun pemilih (seluruh pemilih terdaftar wajib berasal dari DPT resmi).Rekapitulasi suara publik secara terbuka selama jam pemilihan aktif.3. Matriks Pengguna & User Journey3.1 User PersonasPersonaPeranKebutuhan UtamaMahasiswa PemilihPemilih Aktif InformatikaLogin mudah via SSO, membaca visi-misi ringkas, mencoblos dengan aman, kepastian bahwa suaranya tidak bisa dilacak oleh siapa pun.Panitia KPR (Admin)Penyelenggara PemiraMengunggah DPT, memantau turnout suara per angkatan secara berkala, mengunci dan membuka bilik suara sesuai timeline.Koordinator IT (Superadmin)Penanggung Jawab TeknisMenjaga stabilitas server, memantau query database, konfigurasi integrasi Azure/Entra ID, memastikan integritas data.3.2 User Journey: Mahasiswa Pemilih[Buka Website] 
      │
      ▼
[Klik "Login SSO Mahasiswa"] ──► [Redirect ke Microsoft Entra ID]
                                              │
                                              ▼ (Input email & password kampus)
[Verifikasi DPT & Status Memilih] ◄── [Callback ke Sistem]
      │
      ├───► (NIM tidak terdaftar) ───────► Tampilkan Halaman "Akses Ditolak / DPT Tidak Ditemukan"
      ├───► (has_voted == true) ────────► Tampilkan Halaman "Anda Sudah Menggunakan Hak Suara"
      └───► (Valid & has_voted == false) ──┐
                                           ▼
                            [Masuk Bilik Suara Digital]
                                           │
                            [Review Paslon / Kotak Kosong]
                                           │
                                  [Pilih Kandidat]
                                           │
                                  [Modal Konfirmasi]
                                           │
                                  [Kirim Suara (RPC)]
                                           │
                                           ▼
                      [Halaman Sukses & Tanda Terima Digital]
4. Arsitektur Keamanan & Prinsip Kerahasiaan Suara (Ballot Secrecy)Untuk mematuhi prinsip anonimitas murni (Pilihan A) tanpa kompromi:4.1 Anti-Correlation GuaranteeTantangan terbesar sistem anonim digital adalah Korelasi Waktu (Time-Correlation Attack): jika voters_whitelist.voted_at sama persis dengan ballots.created_at, penyerang yang memiliki akses database dapat mencocokkan siapa memilih siapa berdasarkan kesamaan timestamp.Solusi Arsitektural:Pemisahan Entitas: Tabel ballots sama sekali tidak memiliki kolom voter_id, nim, ip_address, atau session ID.Eliminasi Timestamp Presisi di Surat Suara: Tabel ballots hanya mencatat candidate_id dan ID acak (UUID v4). Tidak menyimpan created_at hingga milidetik, atau hanya mencatat tanggal tanpa jam (created_date DATE), sehingga urutan masuk tidak dapat dikorelasikan secara kronologis dengan data voters_whitelist.Atomic State Mutation: Operasi penandaan has_voted = TRUE dan penyisipan data suara dilakukan dalam satu fungsi transaksi database (RPC) dengan level isolasi ketat.5. Skema Basis Data (Supabase / PostgreSQL)SQL-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL DAFTAR PEMILIH TETAP (DPT)
CREATE TABLE public.voters_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    generation INT NOT NULL, -- Contoh: 2023, 2024, 2025
    has_voted BOOLEAN DEFAULT FALSE NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_voters_nim ON public.voters_whitelist(nim);
CREATE INDEX idx_voters_email ON public.voters_whitelist(email);

-- 3. TABEL KANDIDAT
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_number INT UNIQUE NOT NULL, -- 0 untuk Kotak Kosong, 1 untuk Paslon 1, dst.
    leader_name VARCHAR(150) NOT NULL,
    vice_leader_name VARCHAR(150) NOT NULL,
    vision TEXT NOT NULL,
    mission TEXT[] NOT NULL,
    photo_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 4. TABEL SURAT SUARA (BALLOTS) - TERISOLASI MURNI
CREATE TABLE public.ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
    voting_session_date DATE DEFAULT CURRENT_DATE NOT NULL
    -- CATATAN: TIDAK ADA TIMESTAMP PRESISI, TIDAK ADA RELASI KE VOTER
);

CREATE INDEX idx_ballots_candidate ON public.ballots(candidate_id);

-- 5. PENGATURAN PEMILIHAN (ELECTION SETTINGS)
CREATE TABLE public.election_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_voting_open BOOLEAN DEFAULT FALSE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- 6. AUDIT LOGS (ADMIN ONLY)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_email VARCHAR(120) NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'TOGGLE_VOTING', 'IMPORT_DPT', 'EXPORT_REPORT'
    details JSONB NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
5.1 Stored Procedure: Atomic Vote Casting (Pencegah Race Condition)SQLCREATE OR REPLACE FUNCTION public.cast_ballot_secure(
    p_nim VARCHAR(15),
    p_candidate_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voting_open BOOLEAN;
    v_has_voted BOOLEAN;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 1. Validasi Window Pemilihan Aktif
    SELECT is_voting_open AND (v_now BETWEEN start_time AND end_time)
    INTO v_voting_open
    FROM public.election_settings
    WHERE id = 1;

    IF v_voting_open IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'code', 'VOTING_CLOSED', 'message', 'Bilik suara belum dibuka atau sudah ditutup.');
    END IF;

    -- 2. Lock baris pemilih untuk mencegah race condition (Concurrency Protection)
    SELECT has_voted
    INTO v_has_voted
    FROM public.voters_whitelist
    WHERE nim = p_nim
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'NOT_REGISTERED', 'message', 'NIM tidak terdaftar dalam DPT.');
    END IF;

    IF v_has_voted THEN
        RETURN jsonb_build_object('success', false, 'code', 'ALREADY_VOTED', 'message', 'Hak suara Anda telah digunakan sebelumnya.');
    END IF;

    -- 3. Verifikasi Kandidat Valid
    IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = p_candidate_id AND is_active = TRUE) THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_CANDIDATE', 'message', 'Pilihan kandidat tidak sah.');
    END IF;

    -- 4. Mutasi Data: Tandai Pemilih
    UPDATE public.voters_whitelist
    SET has_voted = TRUE,
        voted_at = v_now
    WHERE nim = p_nim;

    -- 5. Masukkan Surat Suara (Terpisah & Tanpa Jejak Identitas)
    INSERT INTO public.ballots (candidate_id)
    VALUES (p_candidate_id);

    RETURN jsonb_build_object('success', true, 'code', 'SUCCESS', 'message', 'Suara Anda berhasil dicatat.');
END;
$$;
## 6. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### Modul 1: SSO & Verifikasi Akses Pemilih
- **FR-01-01:** Sistem menyediakan autentikasi OpenID Connect via Microsoft Entra ID.
- **FR-01-02:** Sistem mengekstrak payload token: `email` dan `preferred_username` (atau pola NIM dari domain email).
- **FR-01-03:** Sistem melakukan pencocokan data login dengan `voters_whitelist`. Jika data tidak cocok, tampilkan view penolakan formal dengan kontak narahubung KPR.
- **FR-01-04:** Jika pemilih terdaftar memiliki flag `has_voted == true`, sesi langsung dialihkan ke halaman tanda terima, menolak akses kembali ke bilik suara.

### Modul 2: Bilik Suara Digital (Voting Booth)
- **FR-02-01:** Menampilkan seluruh kandidat yang terdaftar secara seimbang (Foto, Nomor Urut, Nama Pasangan Calon, Visi & Misi accordion).
- **FR-02-02:** Menyediakan opsi pilihan eksplisit: Kotak Kosong / Tidak Memilih Semua Calon (Candidate Number: 0).
- **FR-02-03:** Saat tombol "Pilih" diklik, sistem memicu Modal Dialog Konfirmasi:
  - Menampilkan nama dan nomor kandidat yang dipilih.
  - Pernyataan: *"Pilihan Anda bersifat mutlak dan tidak dapat diubah setelah dikirim."*
  - Tombol: "Batalkan" dan "Ya, Konfirmasi Pilihan Saya".
- **FR-02-04:** Mengirim permintaan eksekusi voting melalui RPC database `cast_ballot_secure`.
- **FR-02-05:** Menghasilkan receipt token acak secara server-side setelah transaksi voting berhasil. Token diverifikasi tanpa mengungkap kandidat dan tidak boleh menghubungkan identitas pemilih dengan ballot.

### Modul 3: Dashboard Monitoring & Manajemen (KPR / Admin)
- **FR-03-01:** Autentikasi berjenjang (Role-Based Access Control) yang hanya mengizinkan akun panitia terdaftar.
- **FR-03-02:** Private Live Count:
  - Diagram batang / donat perolehan suara terkini per pasangan calon dan kotak kosong.
  - Hanya dapat diakses oleh akun panitia/admin. API route wajib dilindungi middleware dan menolak akses mahasiswa reguler.
- **FR-03-03:** Metrik Partisipasi (Turnout):
  - Persentase total partisipasi pemilih terhadap total DPT.
  - Agregasi partisipasi per angkatan (e.g., Angkatan 2023: 84%, Angkatan 2024: 72%).
- **FR-03-04:** Master Sakelar Pemilihan: Tombol toggle untuk mengaktifkan/menonaktifkan bilik suara sewaktu-waktu jika terjadi keadaan darurat teknis.
- **FR-03-05:** Ekspor Berita Acara: Menghasilkan dokumen rekapitulasi akhir format PDF lengkap dengan total perolehan suara, total DPT, dan tanda tangan digital panitia.

### Modul 4: Manajemen DPT
- **FR-04-01:** Formulir unggah berkas DPT (.csv / .xlsx) dengan kolom wajib: `nim`, `email`, `name`, `generation`. Sumber DPT: KEMA untuk angkatan 2023, 2024, 2025, dan 2026. Proses impor menggunakan preview validasi dan commit all-or-nothing.
- **FR-04-02:** Validasi format berkas otomatis: memeriksa duplikasi NIM/email sebelum komit ke database.
- **FR-04-03:** Fitur pencarian dan manual override data status pemilih (hanya dengan otorisasi Superadmin).

---

## 7. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kategori | Parameter | Spesifikasi & Target |
| :--- | :--- | :--- |
| **Performance** | Response Time | Waktu pemrosesan cast vote < 400ms pada beban puncak 100 concurrent requests. |
| **Concurrency** | Peak Traffic | Mampu menangani hingga 500 pengguna aktif simultan (rush hour saat jam istirahat kuliah). |
| **Security** | Session Management | Token sesi JWT berumur pendek (Max 15 menit di bilik suara). Menggunakan cookie HTTP-Only, Secure, SameSite=Strict. |
| **Integrity** | Idempotency | Mencegah multi-submit melalui debounced button di sisi UI dan database row-level lock di sisi backend. |
| **Compatibility** | Responsivitas | UI wajib dioptimalkan untuk mobile browser (Brave, Chrome Mobile, Safari iOS) dengan layout responsif. |

---

## 8. Desain Sistem & Panduan Palet HMIF

Token desain, tipografi, dan konfigurasi TailwindCSS resmi berdasarkan panduan *design rule* **HMIF Telkom University Purwokerto**:

### 8.1 Pemetaan Palet Warna & Token UI

| Token | HEX Code | Peran di Sistem E-Voting |
| :--- | :--- | :--- |
| `hmif-dark` | `#1E1E1E` | Warna gelap utama pengganti hitam (background header/dark card, teks heading). **Dilarang memakai `#000000`**. |
| `hmif-gold` | `#EBBD1C` | Brand Primary (tombol submit suara, highlight paslon terpilih, badge nomor urut paslon). |
| `hmif-yellow` | `#F3EC51` | Brand Secondary / Hover state untuk elemen interaktif dan aksen glow. |
| `hmif-cream` | `#F8FAE0` | Background alternatif kartu pemilih, callout info, dan kontainer detail visi-misi. |
| `hmif-red` | `#B71B25` | Aksen penanda batas waktu, modal konfirmasi peringatan, dan opsi Abstain / Kotak Kosong. |
| `hmif-blue` | `#29388B` | Tombol SSO Microsoft Entra dan link navigasi sekunder. |
| `hmif-gray-dark` | `#5E5E5E` | Teks sekunder (deskripsi paslon, timestamp, label metadata). |
| `hmif-gray-light` | `#8B8A8B` | Border kartu, pembatas tabel DPT, dan status non-aktif. |
| `hmif-white` | `#FFFFFF` | Background kartu utama bilik suara dan warna teks di atas latar gelap. |

### 8.2 Konfigurasi TailwindCSS (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hmif: {
          dark: '#1E1E1E',       // Gelap utama pengganti hitam (header/dark card, heading). Dilarang #000000
          gold: '#EBBD1C',       // Brand Primary (tombol submit, highlight paslon terpilih, badge no urut)
          yellow: '#F3EC51',     // Brand Secondary / Hover state & aksen glow
          cream: '#F8FAE0',      // Background alternatif kartu pemilih, callout info, kontainer visi-misi
          red: '#B71B25',        // Aksen batas waktu, modal peringatan, opsi Abstain / Kotak Kosong
          blue: '#29388B',       // Tombol SSO Microsoft Entra dan navigasi sekunder
          'gray-dark': '#5E5E5E', // Teks sekunder (deskripsi paslon, timestamp, metadata)
          'gray-light': '#8B8A8B', // Border kartu, pembatas tabel DPT, status non-aktif
          white: '#FFFFFF',      // Background kartu utama bilik suara & teks di atas latar gelap
        }
      }
    }
  },
  plugins: [],
}
export default config
```

### 8.3 Panduan Gaya Antarmuka
- **Halaman Login:** Desain minimalis elegan dengan aksen `hmif-dark`, logo HMIF & Pemira, serta tombol login Microsoft Entra `hmif-blue` yang kontras.
- **Kartu Kandidat:** Menggunakan sudut membulat (`rounded-xl`), bayangan halus (`shadow-sm` ke `shadow-md` saat hover), badge nomor urut dengan `hmif-gold`, pemisahan tegas antara Paslon Resmi dan Kotak Kosong (`hmif-red`).
- **Bilik Suara (Voting Booth):** Antarmuka bebas distraksi (*distraction-free mode*) tanpa navbar luar saat proses mencoblos berlangsung. Tombol submit utama menggunakan `hmif-gold` dengan hover `hmif-yellow`.

---

## 9. Rencana Pengujian (QA & Automated Testing)

### 9.1 Skenario Pengujian Playwright (E2E)
Jalankan pengujian menggunakan browser berbasis Chromium / Brave:
- **Test Case 1: Happy Path Voter**  
  Mock login SSO dengan akun mahasiswa terdaftar -> Akses halaman `/vote` -> Pilih Paslon 1 -> Konfirmasi modal -> Submit -> Verifikasi redirect ke `/receipt` dan cek di DB bahwa `has_voted == true`.
- **Test Case 2: Double Voting Prevention (Race Condition)**  
  Eksekusi 5 request voting paralel dengan NIM yang sama secara bersamaan.  
  *Ekspektasi:* Hanya 1 request berhasil (`SUCCESS`), 4 request lainnya gagal (`ALREADY_VOTED`).
- **Test Case 3: Whitelist Boundary**  
  Mock login dengan akun di luar DPT.  
  *Ekspektasi:* Sistem memblokir akses ke bilik suara dan menampilkan pesan kesalahan hak akses.
- **Test Case 4: Private Tally Protection**  
  Login sebagai mahasiswa biasa -> Akses `/api/admin/tally`.  
  *Ekspektasi:* Mendapatkan status HTTP 403 Forbidden.

### 9.2 Audit Keamanan Kode (Open Code Review)
Jalankan review otomatis pada direktori kritis sebelum merge:
```bash
open-code-review run --path=app/api
open-code-review run --path=lib/supabase
```

---

## 10. Checklist Kesiapan Deployment (Koordinator IT)
- [ ] **Azure AD / Microsoft Entra Registration:** Client ID, Tenant ID, dan Client Secret terpasang di environment variable.
- [ ] **Redirect URIs:** Menambahkan URL callback production dan localhost di portal Azure.
- [ ] **Database Migration:** Skema tabel dan fungsi RPC `cast_ballot_secure` tereksekusi di instance Supabase.
- [ ] **Seed Data:** Data pasangan calon dan Kotak Kosong (ID 0) telah terisi lengkap dengan URL aset foto.
- [ ] **Data DPT:** Berkas mahasiswa dari kemahasiswaan telah dibersihkan (NIM valid, tidak ada duplikasi) dan diimpor.
- [ ] **Simulasi Beban (Load Test):** Memastikan server Supabase dan Vercel/Next.js sanggup menangani concurrent load saat voting dibuka.

## Addendum Keputusan — 2026-10-31

Status keputusan berdasarkan konfirmasi pemilik proyek:

- **Entra tenant:** tim E-Voting membuat dan mengelola tenant sendiri menggunakan akun di luar domain Telkom University. Kepemilikan tenant tetap personal.
- **App Registration:** multitenant agar akun organisasi Telkom University dapat melakukan sign-in. Aplikasi wajib memvalidasi token dan membatasi `tid` ke Tenant ID resmi Telkom University.
- **DPT:** bersumber dari KEMA untuk angkatan 2023, 2024, 2025, dan 2026; kolom wajib `nim`, `email`, `name`, `generation`.
- **Eligibility:** autentikasi Entra tidak otomatis memberikan hak memilih. Setelah token valid, aplikasi mencocokkan identitas mahasiswa dengan DPT. Tidak ditemukan atau ambigu berarti akses voting ditolak.
- **Identitas stabil:** usulan teknis menyimpan pasangan `tid` + `oid` setelah identitas berhasil dipetakan. Perlu migrasi/skema dan prosedur linking yang aman.
- **Kepemilikan personal:** keputusan disetujui pemilik proyek. Risiko ketergantungan akun, pemulihan akses, credential expiry, dan keberlanjutan setelah pergantian pengurus harus diterima dan dimitigasi.
- **Receipt:** requirement client-generated pada versi sebelumnya diganti menjadi server-generated; detail verifikasi dan penyimpanan hash harus konsisten dengan `SECURITY.md`, `DATABASE.md`, dan `API.md`.
- **Admin route:** route publik admin yang disepakati adalah `/admin/dashboard`.

**Belum diputuskan/harus diuji:** Tenant ID Telkom yang benar; apakah tenant Telkom mengizinkan consent aplikasi multitenant atau memerlukan admin consent; claim email yang benar-benar tersedia; strategi linking awal `tid`/`oid` ke DPT; detail role admin; serta ketentuan resmi Kotak Kosong dari KPR.

**Catatan biaya:** jangan menganggap trial Azure satu bulan sebagai prasyarat atau fondasi produksi. Evaluasi penggunaan Microsoft Entra ID Free untuk OIDC dasar dan verifikasi ketentuan lisensi/fitur terkini sebelum mengajukan biaya.


## Addendum — RBAC and staged identity testing (2026-10-31)

### Approved administrator roles

Administrative authorization uses a database-backed `admin_users` whitelist with explicit roles. Entra sign-in alone does not grant administrative access. The approved role matrix is maintained in `AUTHENTICATION.md` and consists of:

- `kpr_admin`: election operations, DPT, candidates, election settings, authorized live tally, and official reports.
- `auditor`: read-only audit/turnout and released final reports; no pre-close candidate tally or mutation.
- `super_admin`: admin whitelist and technical/security configuration; no default access to individual ballot rows or pre-close candidate tally.
- `voter`: DPT-based eligibility, separate from administrator role membership.

No role may read an individual ballot in a way that links it to a voter. Server-side authorization is mandatory.

### Staged authentication testing

Initial development and testing use synthetic dummy accounts and an isolated mock authentication provider. Dummy auth must be disabled in production and must not bypass DPT or RBAC checks. Once the official Telkom University Tenant ID is obtained, conduct a separate Entra integration test with an authorized student account. Verify tenant restriction, consent/admin-consent behavior, claims, and DPT mapping before production readiness.

### DPT input

KEMA is expected to provide `nim`, `email`, `name`, and `generation` for cohorts 2023–2026. Development uses synthetic DPT data; real student data is reserved for an authorized, access-controlled environment.

## Kebijakan Operasional yang Disepakati (31 Oktober 2026)

1. KPR Admin berwenang membuka dan menutup voting. Alasan dan waktu tindakan dicatat dalam audit log.
2. Superadmin berwenang mengaktifkan maintenance darurat dan melakukan pemulihan teknis. Superadmin tidak berwenang membuka/menutup voting atau memperpanjang jadwal secara sepihak.
3. Voting dapat dilanjutkan setelah Superadmin menyatakan sistem siap dan KPR Admin memutuskan untuk melanjutkan.
4. Perpanjangan jadwal membutuhkan persetujuan KPR dan pihak berwenang Pemira. Jabatan/identitas pihak berwenang tersebut masih TBD dan harus mengikuti aturan resmi KPR.
5. Database adalah sumber kebenaran untuk status transaksi suara. Timeout di browser tidak boleh dianggap sebagai kegagalan transaksi tanpa pemeriksaan status di database.
6. Semua insiden, termasuk gangguan ringan, wajib dicatat dengan kategori, waktu, dampak, tindakan, dan keputusan pemulihan.

## Kebijakan Publikasi Hasil (31 Oktober 2026)

1. KPR Admin bertanggung jawab mengumumkan hasil resmi.
2. Hasil diumumkan pada tanggal/jam yang ditetapkan KPR, setelah pemeriksaan Auditor dan pengesahan KPR.
3. Kanal publikasi adalah dashboard publik dan PDF hasil resmi.
4. Data publik meliputi suara per kandidat/Kotak Kosong, jumlah/tingkat partisipasi, dan partisipasi berdasarkan angkatan.
5. Data identitas pemilih, status voting individual, receipt token, dan hubungan identitas-pilihan dilarang dipublikasikan.
6. Koreksi hasil setelah publikasi membutuhkan persetujuan KPR dan pemeriksaan Auditor, serta wajib mempertahankan riwayat versi.
7. Ambang agregasi minimum untuk statistik angkatan masih TBD.

## Kebijakan Retensi Data (31 Oktober 2026)

1. DPT dan pemetaan identitas Entra disimpan selama 1 tahun setelah hasil disahkan, lalu dihapus dari sistem operasional kecuali terkena legal hold.
2. Ballot anonim diarsipkan permanen dan tidak boleh memuat identitas atau penghubung ke pemilih.
3. Hash receipt disimpan selama 1 tahun setelah hasil disahkan, lalu dihapus kecuali terkena legal hold. Token mentah tidak disimpan.
4. Audit log diarsipkan permanen dengan minimisasi data dan pembatasan akses.
5. Sengketa atau pemeriksaan resmi menangguhkan penghapusan data yang relevan sampai proses selesai.
6. Siklus backup, penghapusan salinan ekspor/file sementara, serta pejabat yang berwenang menerapkan legal hold harus ditetapkan sebelum produksi.

## Kepemilikan Organisasi dan Serah Terima (31 Oktober 2026)

1. HMIF ditetapkan sebagai pemilik organisasi dan pengelola jangka panjang sistem E-Voting.
2. Sistem tidak boleh bergantung pada satu akun atau satu orang pengembang untuk operasional berkelanjutan.
3. Minimal dua pengelola teknis HMIF harus memiliki akses yang diperlukan ke source code, deployment, database, backup, domain, dan dokumentasi.
4. Credential harus dikelola melalui mekanisme secret management dan MFA wajib untuk akun administrator.
5. Tenant Entra yang direncanakan dimiliki secara personal merupakan risiko sementara. Mekanisme pemindahan atau pengelolaan formal oleh HMIF masih TBD dan harus diselesaikan sebelum produksi.
6. Serah terima mencakup dokumentasi, pelatihan pengelola pengganti, serta uji pemulihan backup.
