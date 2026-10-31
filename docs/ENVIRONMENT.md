# ENVIRONMENT.md

> **Project:** E-Voting Pemira HMIF  
> **Document:** Environment Configuration Guide  
> **Version:** 0.1.0  
> **Status:** Draft — Requires Engineering and Security Review  
> **Last updated:** 2026-10-31  
> **Audience:** Developers, DevOps/technical operators, and maintainers

---

## 1. Tujuan

Dokumen ini menjelaskan prinsip konfigurasi aplikasi E-Voting Pemira HMIF untuk lingkungan development, staging, dan production.

Tujuannya:

- memisahkan konfigurasi dan data antarlingkungan;
- mencegah secret masuk ke source code atau bundle browser;
- menjaga konfigurasi Microsoft Entra dan Supabase tetap konsisten;
- memvalidasi konfigurasi saat aplikasi dijalankan;
- menyediakan proses perubahan konfigurasi yang dapat ditinjau dan diaudit.

Dokumen ini bukan inventaris variabel final dari repositori. Nama variabel yang ditulis sebagai contoh harus dicocokkan dengan implementasi aktual sebelum digunakan.

## 2. Prinsip Konfigurasi

1. **Environment separation:** development, staging, dan production tidak boleh berbagi database atau credential secara tidak sengaja.
2. **Secret isolation:** secret hanya tersedia pada proses server atau secret manager yang berwenang.
3. **Explicit configuration:** konfigurasi wajib harus divalidasi, bukan diam-diam diganti dengan default yang tidak aman.
4. **Least privilege:** gunakan credential dengan izin minimum sesuai fungsi.
5. **Reproducibility:** konfigurasi yang diperlukan harus terdokumentasi melalui nama dan deskripsi, bukan nilai rahasia.
6. **Change control:** perubahan konfigurasi production harus memiliki reviewer, alasan, dan jejak perubahan.
7. **No production data in development:** data pemilih nyata dan data ballot produksi tidak boleh disalin ke lingkungan pengembangan.

---

## 3. Lingkungan Aplikasi

| Lingkungan | Tujuan | Data | Akses |
|---|---|---|---|
| Development | Pengembangan fitur dan debugging. | Data sintetis/dummy. | Developer yang berwenang. |
| Staging | Validasi integrasi dan simulasi sebelum rilis. | Data uji yang tidak mengidentifikasi pemilih nyata. | Tim penguji dan operator terkait. |
| Production | Pemilihan resmi. | Data operasional resmi. | Personel yang diotorisasi. |

### 3.1 Aturan isolasi

Setiap lingkungan harus memiliki konfigurasi terpisah untuk:

- URL aplikasi;
- Microsoft Entra application registration atau konfigurasi client yang sesuai;
- redirect URI;
- Supabase project/database;
- API key dan secret;
- callback/logout URL;
- logging dan monitoring;
- storage bucket dan file;
- domain/cookie scope.

Jangan menggunakan Supabase production untuk pengembangan lokal atau staging.

### 3.2 Environment lifecycle

- Development dapat berubah lebih sering, tetapi tetap tidak boleh memuat secret production.
- Staging harus mendekati konfigurasi production untuk menguji perilaku integrasi.
- Production hanya menerima perubahan melalui proses release dan change control.
- Penghapusan lingkungan harus memperhatikan backup, log, file, dan kewajiban retensi.

---

## 4. Konfigurasi Aplikasi Next.js

Aplikasi menggunakan Next.js App Router dan TypeScript berdasarkan stack proyek.

### 4.1 File environment lokal

Pola file yang umum digunakan:

| File | Kegunaan | Git |
|---|---|---|
| `.env.example` | Daftar nama variabel dan placeholder aman. | Boleh, setelah diperiksa. |
| `.env.local` | Konfigurasi lokal developer. | Jangan commit. |
| `.env.development` | Konfigurasi development jika digunakan. | Jangan commit nilai rahasia. |
| `.env.production` | Konfigurasi production bila mekanisme deployment menggunakannya. | Jangan commit nilai rahasia. |

Perilaku pemuatan file harus mengikuti versi Next.js dan platform deployment yang digunakan. Jangan mengandalkan urutan file tanpa memeriksa dokumentasi versi yang dipakai.

### 4.2 Public vs server-only variables

Di Next.js, variabel dengan prefix `NEXT_PUBLIC_` dapat terekspos ke browser melalui proses build.

Aturan:

- Gunakan `NEXT_PUBLIC_` hanya untuk nilai yang memang boleh diketahui publik.
- Jangan pernah memberi prefix `NEXT_PUBLIC_` pada client secret, service-role key, database password, private key, atau token.
- Variabel server-only harus hanya dibaca pada kode server.
- Jangan mengirim objek konfigurasi server penuh ke Client Component.
- Review setiap perubahan nama variabel yang digunakan pada Client Component.

### 4.3 Validasi konfigurasi

**Proposed:** buat satu modul konfigurasi server yang memvalidasi environment variables menggunakan Zod saat startup atau saat modul konfigurasi digunakan.

Validasi sebaiknya memastikan:

- variabel wajib tersedia;
- URL memiliki format yang benar;
- nilai enum hanya menerima pilihan yang diizinkan;
- secret tidak kosong;
- konfigurasi antarvariabel konsisten;
- konfigurasi production tidak menggunakan endpoint development.

Jika konfigurasi wajib tidak valid, aplikasi sebaiknya gagal secara eksplisit dengan pesan aman yang tidak mengungkap nilai secret.

---

## 5. Inventaris Variabel Konfigurasi

Tabel ini merupakan **inventaris konseptual**, bukan jaminan bahwa nama-nama berikut sudah ada di codebase. Nama final harus disesuaikan dengan implementasi dan platform hosting.

### 5.1 Aplikasi

| Nama contoh | Tujuan | Exposure | Status |
|---|---|---|---|
| `APP_ENV` | Penanda lingkungan aplikasi. | Server-only | Proposed |
| `APP_BASE_URL` | URL utama aplikasi untuk lingkungan terkait. | Server-only | Proposed |
| `NEXT_PUBLIC_APP_URL` | URL aplikasi yang memang aman ditampilkan ke browser, jika diperlukan. | Public | Proposed |
| `LOG_LEVEL` | Tingkat detail log. | Server-only | Proposed |

### 5.2 Microsoft Entra ID

| Nama contoh | Tujuan | Exposure | Status |
|---|---|---|---|
| `MICROSOFT_CLIENT_ID` | Identitas aplikasi Entra. | Dapat bersifat public/config | Proposed |
| `MICROSOFT_CLIENT_SECRET` | Secret autentikasi aplikasi jika flow yang dipilih memerlukannya. | Server-only secret | Proposed |
| `MICROSOFT_TENANT_ID` | Tenant identifier yang digunakan. | Config | Proposed |
| `MICROSOFT_REDIRECT_URI` | Callback URI untuk lingkungan terkait. | Server-only/config | Proposed |
| `MICROSOFT_AUTHORITY` | Authority/issuer konfigurasi autentikasi jika diperlukan library. | Server-only/config | Proposed |

Catatan:

- Nama variabel dan library autentikasi final belum diverifikasi.
- Jangan mengasumsikan seluruh flow memerlukan client secret; ikuti konfigurasi provider dan arsitektur autentikasi yang disetujui.
- Tenant, issuer, audience, dan claim identitas harus divalidasi.
- Redirect URI harus terdaftar secara eksplisit pada konfigurasi Entra.
- Jangan menggunakan wildcard redirect URI pada production.

### 5.3 Supabase

| Nama contoh | Tujuan | Exposure | Status |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase yang digunakan client jika diperlukan. | Public | Proposed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key publik untuk akses yang tetap dibatasi policy/RLS. | Public | Proposed |
| `SUPABASE_SERVICE_ROLE_KEY` | Credential server dengan hak istimewa tinggi jika memang diperlukan. | Server-only secret | Proposed |
| `DATABASE_URL` | Koneksi PostgreSQL untuk proses server/migration bila digunakan. | Server-only secret | Proposed |

Aturan:

- Jangan mengekspos service-role key ke browser.
- RLS dan authorization tetap harus dikonfigurasi; anon key bukan pengganti kontrol akses.
- Batasi penggunaan direct database connection.
- Migration harus dijalankan dengan credential yang sesuai dan tidak tersedia untuk browser.
- Jangan menaruh nilai credential pada dokumentasi, screenshot, atau issue publik.

### 5.4 Testing dan observability

| Nama contoh | Tujuan | Exposure | Status |
|---|---|---|---|
| `PLAYWRIGHT_BASE_URL` | URL target pengujian E2E. | Test-only | Proposed |
| `TEST_AUTH_*` | Credential khusus akun pengujian jika diperlukan. | Test-only secret | TBD |
| `ERROR_REPORTING_DSN` | DSN layanan pelaporan error, jika digunakan. | Config; cek provider | TBD |

Gunakan akun dan data uji sintetis. Jangan mengarahkan test otomatis ke pemilih atau data production.

---

## 6. Microsoft Entra Configuration

### 6.1 Application registration

Untuk setiap lingkungan, tetapkan konfigurasi aplikasi yang sesuai:

- tenant yang benar;
- client/application ID;
- redirect URI;
- logout/post-logout URI jika digunakan;
- platform dan flow autentikasi;
- permission/scopes minimum;
- credential dan masa berlaku;
- pemilik aplikasi serta proses rotasi.

Apakah development, staging, dan production menggunakan app registration terpisah atau konfigurasi lain: **TBD**.

### 6.2 Redirect URI

Redirect URI harus:

- sama persis dengan callback yang digunakan aplikasi;
- terdaftar pada Entra untuk lingkungan tersebut;
- menggunakan HTTPS pada staging/production;
- tidak menerima redirect ke domain yang tidak dipercaya.

Jangan menyalin redirect URI lokal ke konfigurasi production.

### 6.3 Identity claims

Sistem perlu memetakan identitas Microsoft ke record DPT. Claim kanonis—misalnya email, `preferred_username`, atau Entra object identifier—belum ditetapkan final.

Sebelum production:

1. tentukan claim identitas kanonis;
2. tentukan aturan normalisasi;
3. validasi issuer, tenant, dan audience;
4. tetapkan penanganan perubahan email;
5. pastikan pemetaan ke DPT tidak menerima identitas yang dikirim bebas oleh browser;
6. uji akun di luar domain institusi dan akun yang tidak ada di DPT.

Lihat `AUTHENTICATION.md` untuk keputusan yang masih terbuka.

---

## 7. Supabase dan PostgreSQL Configuration

### 7.1 Project isolation

Gunakan project terpisah untuk setiap lingkungan sejauh didukung setup proyek:

- development project;
- staging project;
- production project.

Jangan mengimpor DPT produksi ke development atau staging. Untuk pengujian, gunakan data sintetis dengan identitas fiktif.

### 7.2 Keys and roles

- Public/anon key hanya boleh digunakan dengan policy yang aman.
- Service-role key harus server-only dan memiliki prosedur rotasi.
- Credential migration tidak boleh digunakan oleh browser.
- Batasi akses dashboard Supabase kepada personel yang memang memerlukan.
- Review RLS, grants, function permissions, dan `SECURITY DEFINER` setelah perubahan schema/RPC.

### 7.3 Migration

Migration harus:

- tersimpan dalam version control;
- memiliki urutan yang deterministik;
- ditinjau sebelum diterapkan;
- diuji pada development dan staging;
- memiliki rencana rollback atau forward-fix;
- tidak memuat data pemilih nyata sebagai seed.

Migration production harus mengikuti `DEPLOYMENT.md` dan persetujuan release.

---

## 8. Cookies, Session, dan Security Settings

Konfigurasi session/cookie harus mengikuti `AUTHENTICATION.md` dan `SECURITY.md`.

PRD menyebut target cookie:

- `HttpOnly`;
- `Secure`;
- `SameSite=Strict`.

PRD juga menyebut JWT maksimum 15 menit di ballot booth. Makna tepatnya—token mana, kapan TTL dimulai, dan bagaimana refresh/re-authentication dilakukan—harus diputuskan dalam desain autentikasi.

Jangan menurunkan flag cookie atau memperpanjang masa berlaku token di production hanya untuk mengatasi masalah UX tanpa review keamanan.

---

## 9. Pengelolaan Secret

### 9.1 Penyimpanan

Gunakan secret manager atau mekanisme secret environment dari platform deployment. Jangan menyimpan secret pada:

- source code;
- file Markdown;
- screenshot;
- issue tracker publik;
- chat grup umum;
- commit Git;
- file `.env.example`.

### 9.2 Akses

- Batasi akses secret sesuai peran.
- Jangan membagikan secret antaranggota tim melalui pesan biasa.
- Gunakan credential terpisah antarlingkungan.
- Cabut akses saat personel tidak lagi bertugas.
- Review akses secara berkala.

### 9.3 Rotasi dan kebocoran

Rotasi secret harus memiliki penanggung jawab dan rencana perubahan agar layanan tidak terputus.

Jika secret diduga bocor:

1. identifikasi jenis dan lingkungan secret;
2. segera eskalasikan;
3. revoke/rotate credential;
4. periksa penggunaan yang tidak sah;
5. perbarui deployment yang terdampak;
6. verifikasi layanan;
7. dokumentasikan insiden.

Jangan menganggap menghapus secret dari file atau commit terbaru sudah cukup untuk membatalkan credential yang telah terekspos.

---

## 10. Perbedaan Konfigurasi per Lingkungan

| Area | Development | Staging | Production |
|---|---|---|---|
| Domain | Local/dev domain | Domain staging | Domain resmi |
| Entra | Registration/config dev | Registration/config staging | Registration/config production |
| Supabase | Project dev | Project staging | Project production |
| Data pemilih | Dummy/synthetic | Synthetic/test | DPT resmi |
| Logging | Lebih detail, tanpa secret | Terukur dan aman | Minimum yang diperlukan |
| Debug mode | Dapat aktif secara lokal | Dikendalikan | Nonaktif |
| Secret | Secret dev | Secret staging | Secret production |
| Access | Developer terbatas | Tester/operator | Personel berwenang |
| Testing | Unit/integration/E2E | Release validation | Tidak menjalankan test destruktif |

Nilai konfigurasi spesifik dan platform hosting: **TBD**.

---

## 11. Prosedur Perubahan Konfigurasi

### 11.1 Perubahan development/staging

1. Buat permintaan perubahan atau issue.
2. Jelaskan variabel yang berubah dan alasannya.
3. Periksa apakah perubahan berdampak pada client bundle.
4. Perbarui `.env.example` jika nama variabel berubah.
5. Uji aplikasi dan integrasi.
6. Review diff dan dokumentasi.
7. Catat hasil pengujian.

### 11.2 Perubahan production

1. Ajukan change request.
2. Identifikasi dampak terhadap autentikasi, database, voting, dan ketersediaan.
3. Dapatkan persetujuan dari pemilik konfigurasi.
4. Siapkan rollback/forward-fix.
5. Terapkan melalui mekanisme deployment resmi.
6. Verifikasi health check dan fungsi kritis.
7. Catat waktu, pelaksana, reviewer, dan hasil.

Jangan mengubah konfigurasi kritis selama pemungutan suara berlangsung kecuali diperlukan untuk respons insiden dan disetujui otoritas yang berwenang.

---

## 12. Validasi dan Troubleshooting

| Gejala | Pemeriksaan awal | Tindakan |
|---|---|---|
| Aplikasi gagal start | Variabel wajib hilang atau format tidak valid. | Periksa nama dan validasi konfigurasi; jangan menampilkan secret pada log. |
| Login gagal | Tenant, client ID, authority, redirect URI, atau provider config. | Cocokkan konfigurasi lingkungan dengan Entra. |
| Redirect URI mismatch | URI callback tidak sama dengan yang terdaftar. | Perbaiki konfigurasi di aplikasi dan Entra. |
| Supabase tidak terhubung | URL/key salah, project tidak tersedia, atau policy menolak. | Periksa environment target dan status layanan. |
| Browser mendapat akses ditolak | RLS/policy atau session/authorization tidak sesuai. | Periksa policy dan authorization server-side; jangan mengekspos service-role key. |
| Staging memakai data salah | Environment mengarah ke project/database yang tidak tepat. | Hentikan pengujian, perbaiki target, dan evaluasi paparan data. |
| Secret terlihat di log/client bundle | Konfigurasi atau logging tidak aman. | Perlakukan sebagai potensi kebocoran dan jalankan incident response. |

---

## 13. Checklist Sebelum Production

- [ ] Environment production terpisah dari development/staging.
- [ ] Domain resmi dan HTTPS dikonfigurasi.
- [ ] Entra tenant/client/redirect URI telah diverifikasi.
- [ ] Claim identitas kanonis telah diputuskan.
- [ ] Supabase project production benar.
- [ ] RLS, grants, RPC, dan service-role access telah ditinjau.
- [ ] Tidak ada secret di client bundle.
- [ ] Cookie dan session settings sesuai kebijakan.
- [ ] Migration telah diuji dan disetujui.
- [ ] DPT hanya diimpor dari sumber resmi melalui prosedur yang disetujui.
- [ ] Logging tidak merekam credential atau menghubungkan identitas dengan pilihan suara.
- [ ] Backup dan prosedur pemulihan tersedia.
- [ ] Monitoring dan alert telah diuji.
- [ ] Akses admin dibatasi.
- [ ] Rollback/forward-fix disiapkan.

---

## 14. Keputusan yang Masih TBD

| ID | Keputusan | Mengapa diperlukan |
|---|---|---|
| ENV-01 | Platform hosting | Menentukan cara menyuntikkan environment variables dan secret. |
| ENV-02 | Nama variabel final | Harus sesuai kode dan provider autentikasi. |
| ENV-03 | Versi Node.js dan pnpm | Menjamin reproducible builds. |
| ENV-04 | App registration Entra per lingkungan | Mengisolasi redirect dan credential. |
| ENV-05 | Claim identitas kanonis | Menentukan pemetaan akun ke DPT. |
| ENV-06 | Provider autentikasi/library final | Menentukan konfigurasi dan lifecycle credential. |
| ENV-07 | Supabase project per lingkungan | Memastikan isolasi data. |
| ENV-08 | Mekanisme secret manager | Menentukan penyimpanan dan akses secret. |
| ENV-09 | Strategi rotasi secret | Mengurangi dampak kebocoran/kedaluwarsa. |
| ENV-10 | Cookie domain dan session lifecycle | Menjaga keamanan session antarlingkungan. |
| ENV-11 | Logging/monitoring provider | Menentukan penyimpanan dan akses observability. |
| ENV-12 | Backup dan retention | Menentukan recovery serta kepatuhan data. |
| ENV-13 | Build-time vs runtime configuration | Penting untuk variabel Next.js dan deployment. |
| ENV-14 | Approval perubahan production | Menetapkan kontrol perubahan. |

---

## 15. Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-31 | Draft awal panduan environment dan secret management. |

---

## 16. Dokumen Terkait

- `PRD.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `API.md`
- `AUTHENTICATION.md`
- `SECURITY.md`
- `TESTING.md`
- `DEPLOYMENT.md`
- `CONTRIBUTING.md`

**Release gate:** jangan menggunakan tabel nama variabel contoh sebagai konfigurasi final sebelum dicocokkan dengan source code, provider autentikasi, dan platform deployment yang benar-benar dipakai.


## Entra configuration decision update (2026-10-31)

The project owner creates and personally manages the Entra tenant. The app registration is multitenant, while the application accepts only the verified Telkom University tenant ID. Required configuration should distinguish:

- `ENTRA_APP_TENANT_ID`: tenant that owns the app registration (project tenant).
- `ENTRA_ALLOWED_TENANT_ID`: verified Telkom University tenant ID allowed to authenticate.
- `ENTRA_CLIENT_ID`: app registration client ID.
- `ENTRA_CLIENT_SECRET` or certificate: server-side only, if required by the selected confidential-client flow.
- `ENTRA_AUTHORITY`: authority/issuer configuration consistent with multitenant sign-in and tenant validation.

These names are proposed; align them with the actual auth library before implementation. Never expose secrets to client bundles. DPT columns from KEMA: `nim`, `email`, `name`, `generation` (cohorts 2023–2026). After verified first-login matching, persist `tid` + `oid` binding in the database.


## Addendum — Dummy authentication guardrails (2026-10-31)

The first development phase uses synthetic dummy accounts and an isolated mock authentication provider. Configure this only in local/development or isolated test environments. Production configuration must explicitly reject the mock provider; do not rely only on hiding the login button. Use synthetic NIMs and test-only email addresses, and keep dummy DPT/admin fixtures in a separate database/project from production. Add a startup/configuration validation that fails deployment if dummy authentication is enabled in a production environment.
