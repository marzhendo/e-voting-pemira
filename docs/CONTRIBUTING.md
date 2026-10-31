# CONTRIBUTING.md

> **Project:** E-Voting Pemira HMIF  
> **Document:** Contribution Guidelines  
> **Version:** 0.1.0  
> **Status:** Draft — Requires Engineering Team Approval  
> **Last updated:** 2026-10-31  
> **Audience:** Developers, reviewers, and technical maintainers

---

## 1. Tujuan

Dokumen ini menetapkan cara berkontribusi pada codebase E-Voting Pemira HMIF agar perubahan:

- konsisten dengan spesifikasi yang telah disetujui;
- mudah ditinjau dan diuji;
- tidak melemahkan autentikasi, otorisasi, integritas suara, atau kerahasiaan ballot;
- dapat ditelusuri melalui riwayat Git;
- tidak memasukkan konfigurasi rahasia atau data pemilih ke repositori.

Dokumen ini adalah draft pedoman engineering. Aturan yang belum ditetapkan dalam sumber proyek ditandai **Proposed** atau **TBD**.

## 2. Prinsip Kontribusi

1. **Specification first:** pahami PRD, UI, dan dokumen teknis sebelum mengubah perilaku sistem.
2. **Small changes:** buat perubahan sekecil mungkin dan fokus pada satu tujuan.
3. **Security by design:** jangan mengandalkan validasi client-side untuk operasi sensitif.
4. **Test the risk:** perubahan pada voting, auth, DPT, dan admin harus memiliki pengujian yang relevan.
5. **Review before merge:** perubahan tidak boleh masuk ke branch utama tanpa review.
6. **No secrets in Git:** secret, token, credential, dan data pemilih tidak boleh masuk commit.
7. **Document decisions:** perubahan spesifikasi atau keputusan arsitektur harus dicatat.

---

## 3. Teknologi Proyek

Teknologi yang telah disebut dalam spesifikasi/konteks proyek:

| Area | Teknologi |
|---|---|
| Web framework | Next.js App Router |
| Language | TypeScript |
| Database | Supabase / PostgreSQL |
| Authentication | Microsoft Entra ID dengan MSAL/provider yang disepakati |
| Validation | Zod pada batas Server Actions dan Route Handlers |
| E2E testing | Playwright |
| Package manager | pnpm |

Versi dependency, runtime Node.js, formatter, linter, dan tool tambahan harus mengikuti konfigurasi repositori yang sebenarnya. Jangan memperbarui versi mayor dependency hanya sebagai bagian dari perubahan fitur tanpa alasan dan review.

## 4. Persiapan Lingkungan Developer

### 4.1 Prasyarat

- Git.
- Node.js dengan versi yang ditentukan repositori.
- pnpm.
- Akses ke repositori.
- Environment lokal yang dikonfigurasi menggunakan template resmi.
- Akses ke layanan development yang diperlukan.

Versi Node.js, pnpm, dan instruksi setup final: **TBD**. Gunakan file konfigurasi repositori seperti `package.json`, lockfile, dan dokumentasi setup sebagai acuan aktual.

### 4.2 Setup awal (contoh alur)

Perintah di bawah adalah pola umum. Sesuaikan dengan struktur repositori dan script yang tersedia.

```bash
git clone <repository-url>
cd <repository-directory>
pnpm install
```

Buat file environment lokal dari template yang disediakan tim. Jangan menyalin file `.env` milik anggota tim lain atau environment produksi.

Jalankan aplikasi dengan script yang didefinisikan dalam `package.json`, misalnya:

```bash
pnpm dev
```

Nama script development dan persyaratan layanan lokal: **TBD** sampai diverifikasi dari repositori.

### 4.3 Environment variables

- Commit file `.env.example` hanya jika telah dipastikan tidak berisi nilai rahasia.
- Jangan commit `.env`, private key, client secret, access token, refresh token, service-role key, atau credential database.
- Gunakan placeholder yang menjelaskan nama variabel tanpa mengungkap nilainya.
- Jika secret tidak sengaja ter-commit, anggap secret telah terekspos: rotasi/revoke dan ikuti prosedur insiden.

Nama variabel resmi harus mengacu pada `DEPLOYMENT.md` dan konfigurasi aplikasi aktual.

---

## 5. Git Workflow

### 5.1 Branch model

**Proposed:** gunakan branch kerja terpisah dan pull request menuju branch integrasi utama.

| Jenis branch | Contoh | Tujuan |
|---|---|---|
| Feature | `feat/voter-dashboard` | Fitur baru. |
| Bug fix | `fix/dpt-email-validation` | Perbaikan bug. |
| Security | `security/ballot-rpc-authorization` | Perbaikan keamanan. |
| Documentation | `docs/admin-guide` | Dokumentasi. |
| Refactor | `refactor/auth-session-service` | Refactor tanpa mengubah perilaku yang dimaksud. |
| Test | `test/concurrent-ballot-submission` | Penambahan/perbaikan pengujian. |

Nama branch dapat disesuaikan dengan kebijakan tim. Hindari nama yang tidak menjelaskan tujuan.

### 5.2 Aturan branch

- Jangan mengembangkan fitur langsung pada branch produksi.
- Sinkronkan branch kerja dengan branch target sebelum membuat pull request.
- Hindari memasukkan perubahan yang tidak terkait ke satu branch.
- Jangan force-push ke branch bersama yang dilindungi.
- Hapus branch kerja setelah merge jika tidak lagi diperlukan.

Branch default, branch staging, dan branch release: **TBD**.

### 5.3 Commit convention

**Proposed:** gunakan Conventional Commits.

Format:

```text
<type>(<scope>): <short description>
```

Contoh:

```text
feat(voting): add ballot confirmation flow
fix(auth): reject accounts outside student domain
fix(dpt): detect duplicate student identifiers
test(voting): cover concurrent ballot submissions
docs(api): document voter status responses
refactor(admin): isolate election settings service
```

Jenis commit yang disarankan:

- `feat`: fitur baru.
- `fix`: perbaikan bug.
- `security`: perbaikan keamanan.
- `test`: pengujian.
- `docs`: dokumentasi.
- `refactor`: perubahan struktur tanpa perubahan perilaku yang dimaksud.
- `chore`: pemeliharaan tooling/dependency.

Jangan menulis pesan commit seperti `update`, `fix bug`, atau `final` tanpa konteks.

---

## 6. Standar Implementasi

### 6.1 TypeScript

- Utamakan tipe yang eksplisit pada batas sistem dan kontrak data.
- Hindari `any`; gunakan tipe yang lebih sempit atau `unknown` dengan validasi.
- Jangan menganggap data dari browser, request, file impor, atau layanan eksternal sudah valid.
- Hindari duplikasi definisi tipe untuk kontrak yang sama jika dapat menggunakan satu sumber tipe yang terawat.
- Jangan menonaktifkan pemeriksaan TypeScript untuk meloloskan perubahan tanpa penjelasan dan persetujuan.

### 6.2 Next.js App Router

- Ikuti pemisahan Server Components dan Client Components sesuai kebutuhan.
- Jangan menaruh secret atau akses service-role di bundle client.
- Operasi sensitif harus diproses pada batas server yang sesuai.
- Jangan mengandalkan penyembunyian tombol/menu sebagai kontrol otorisasi.
- Periksa ulang otorisasi pada setiap operasi administratif dan data sensitif.

### 6.3 Validasi Zod

Spesifikasi proyek menetapkan penggunaan Zod pada batas Server Actions dan Route Handlers.

- Validasi seluruh input yang berasal dari pengguna atau sistem eksternal.
- Validasi format dan batas nilai, bukan hanya keberadaan field.
- Tolak field yang tidak diharapkan bila kontrak mengharuskannya.
- Normalisasi input hanya jika aturan normalisasi telah ditetapkan.
- Jangan menggunakan data hasil validasi client sebagai pengganti validasi server.

### 6.4 Database dan Supabase

- Perubahan schema harus melalui migration yang dapat direview.
- Jangan mengandalkan perubahan manual di dashboard sebagai satu-satunya catatan schema.
- Terapkan prinsip least privilege pada database role dan policy.
- Tinjau RLS dan akses RPC setiap kali tabel atau fungsi berubah.
- Operasi voting harus mempertahankan atomicity dan perlindungan terhadap concurrent submission.
- Jangan menambahkan identitas pemilih, NIM, IP, atau session ID ke record ballot.
- Jangan menambahkan precise timestamp ke ballot tanpa keputusan arsitektur dan tinjauan privasi.
- Jangan mengubah atau menghapus ballot untuk memperbaiki tampilan hasil.

### 6.5 Authentication dan authorization

- Gunakan alur autentikasi Microsoft Entra yang telah disepakati.
- Validasi identitas pada server.
- Pemetaan identitas ke DPT harus menggunakan claim kanonis yang telah disetujui.
- Jangan menerima NIM dari client sebagai bukti identitas pemilih.
- Periksa role dan permission pada server untuk setiap tindakan admin.
- Jangan mengekspos token atau credential pada log maupun response yang tidak perlu.

Claim identitas kanonis dan matriks RBAC final masih perlu diputuskan; lihat `AUTHENTICATION.md`.

---

## 7. Aturan Khusus untuk Fitur Voting

Perubahan pada jalur voting termasuk perubahan berisiko tinggi.

### 7.1 Invariant yang harus dijaga

- Satu pemilih hanya dapat menggunakan hak pilih satu kali.
- Validasi kelayakan pemilih dilakukan terhadap DPT.
- Status periode voting diperiksa di server.
- Kandidat harus valid dan aktif.
- Pembaruan status pemilih dan penyimpanan ballot harus atomik.
- Ballot tidak menyimpan identitas pemilih.
- Pemilih biasa tidak dapat membaca tally privat.
- Operasi concurrent tidak boleh menghasilkan lebih dari satu ballot untuk pemilih yang sama.

### 7.2 Larangan implementasi

- Jangan mempercayai NIM yang dikirim browser.
- Jangan membuat endpoint alternatif yang melewati RPC/aturan voting resmi.
- Jangan menghapus row lock atau perlindungan concurrency tanpa analisis formal.
- Jangan menampilkan pilihan pemilih pada receipt.
- Jangan mengirim pilihan kandidat ke analytics atau log operasional yang dapat dikaitkan dengan identitas.
- Jangan menambahkan fitur ubah pilihan setelah submit tanpa revisi kebijakan dan threat model.

### 7.3 Perubahan RPC dan migration

Setiap perubahan pada fungsi voting harus mencakup:

1. alasan perubahan;
2. analisis authorization dan trust boundary;
3. analisis atomicity dan concurrency;
4. tinjauan ballot secrecy;
5. migration yang dapat direview;
6. pengujian keberhasilan dan kegagalan;
7. persetujuan reviewer teknis dan keamanan.

---

## 8. Testing dan Quality Gate

### 8.1 Pemeriksaan minimum

Perintah typecheck yang ditetapkan dalam proyek:

```bash
pnpm tsc --noEmit
```

Script lint, unit test, integration test, dan Playwright harus mengikuti `package.json` dan konfigurasi aktual. Nama script final: **TBD**.

Sebelum pull request siap direview:

- [ ] Perubahan sesuai tujuan dan spesifikasi.
- [ ] `pnpm tsc --noEmit` lulus.
- [ ] Lint lulus jika tersedia.
- [ ] Unit/integration test terkait lulus.
- [ ] E2E test terkait lulus jika alur pengguna berubah.
- [ ] Tidak ada secret atau data pribadi dalam diff.
- [ ] Migration dan dokumentasi diperbarui jika relevan.
- [ ] Tidak ada perubahan tidak terkait.

### 8.2 Pengujian wajib untuk voting

Skenario penting dari spesifikasi:

- pemilih terdaftar dapat memilih ketika periode terbuka;
- pemilih yang tidak terdaftar ditolak;
- voting tertutup menolak submit;
- kandidat tidak aktif/invalid ditolak;
- pemilih yang sudah memilih ditolak;
- lima request konkuren untuk NIM yang sama menghasilkan tepat satu `SUCCESS` dan empat `ALREADY_VOTED`;
- hanya satu ballot tersimpan untuk skenario tersebut;
- pemilih biasa menerima HTTP 403 saat mengakses `/api/admin/tally`.

Pengujian tidak boleh menggunakan data pemilih produksi.

### 8.3 Test evidence

Untuk perubahan sensitif, sertakan:

- nama test dan hasil;
- environment pengujian;
- bukti hasil yang tidak mengandung secret/data pribadi;
- migration yang digunakan;
- risiko yang belum teruji.

---

## 9. Pull Request (PR)

### 9.1 Checklist PR

Setiap PR sebaiknya menjelaskan:

- masalah atau kebutuhan yang diselesaikan;
- ringkasan perubahan;
- bagian sistem yang terdampak;
- keputusan teknis yang relevan;
- migration/configuration yang diperlukan;
- test yang dijalankan;
- risiko keamanan dan privasi;
- dokumentasi yang diperbarui;
- screenshot/video jika perubahan UI memerlukannya.

### 9.2 Template PR

```markdown
## Ringkasan
Jelaskan perubahan secara singkat.

## Konteks
Tautkan issue, requirement, atau keputusan terkait.

## Perubahan
- [ ] ...
- [ ] ...

## Pengujian
- [ ] pnpm tsc --noEmit
- [ ] Lint
- [ ] Unit/integration tests
- [ ] Playwright E2E

## Security & Privacy Review
- Apakah perubahan menyentuh auth, DPT, ballot, tally, atau admin?
- Apakah ada data sensitif yang dapat terekspos?
- Apakah authorization diperiksa di server?

## Database / Configuration
Jelaskan migration atau perubahan environment.

## Dokumentasi
Sebutkan dokumen yang diperbarui.
```

### 9.3 Review dan approval

**Proposed:**

- Minimal satu reviewer selain author.
- Perubahan auth, DPT, voting RPC, ballot, tally, atau RBAC memerlukan reviewer yang memahami dampak keamanan.
- Author harus menanggapi komentar dan memperbarui test.
- PR tidak boleh merge jika ada blocker kritis atau pemeriksaan wajib gagal.

Jumlah reviewer, CODEOWNERS, protected branch, dan aturan merge final: **TBD**.

---

## 10. Dependency dan Perubahan Konfigurasi

- Hindari dependency baru jika fungsi dapat dicapai dengan dependency yang sudah ada.
- Jelaskan alasan, pemeliharaan, ukuran, dan risiko keamanan dependency baru.
- Jangan memperbarui lockfile menggunakan package manager selain pnpm.
- Review perubahan dependency yang memiliki akses jaringan, autentikasi, atau pemrosesan data.
- Jangan melakukan upgrade besar bersamaan dengan perubahan fitur sensitif kecuali memang diperlukan.

---

## 11. Dokumentasi dan Keputusan Teknis

Perubahan berikut harus memicu peninjauan dokumentasi:

| Perubahan | Dokumen yang perlu ditinjau |
|---|---|
| Perubahan scope/aturan pemilihan | `PRD.md` |
| Perubahan tampilan/alur UI | `UI.md`, `USER_GUIDE.md` |
| Perubahan komponen/arus data | `ARCHITECTURE.md` |
| Perubahan schema/RPC | `DATABASE.md` |
| Perubahan endpoint/kontrak | `API.md` |
| Perubahan login/session/role | `AUTHENTICATION.md` |
| Perubahan threat/control | `SECURITY.md` |
| Perubahan test strategy | `TESTING.md` |
| Perubahan deployment/config | `DEPLOYMENT.md` |
| Perubahan prosedur operasional | `OPERATIONS.md`, `ADMIN_GUIDE.md` |

Keputusan arsitektur yang berdampak lintas dokumen sebaiknya dicatat sebagai Architecture Decision Record (ADR). Format dan lokasi ADR: **TBD**.

---

## 12. Penanganan Secret dan Data Pribadi

Jangan pernah memasukkan ke Git:

- password;
- Microsoft client secret/private key;
- Supabase service-role key;
- database connection string yang memuat credential;
- access/refresh token;
- session cookie;
- file DPT nyata;
- data pemilih produksi;
- export tally internal;
- log yang memuat informasi sensitif.

Jika terjadi kebocoran:

1. hentikan distribusi secret lebih lanjut;
2. laporkan kepada penanggung jawab teknis;
3. rotasi atau revoke credential yang terpapar;
4. identifikasi commit, artifact, dan sistem yang terdampak;
5. ikuti prosedur incident response pada `SECURITY.md`;
6. jangan menganggap menghapus file dari commit terbaru sudah cukup untuk menghilangkan paparan.

---

## 13. Definition of Done

Sebuah kontribusi dapat dianggap siap digabungkan jika:

- requirement dan acceptance criteria terpenuhi;
- implementasi mengikuti arsitektur yang disetujui;
- validasi dan authorization dilakukan di server;
- pengujian yang relevan lulus;
- tidak ada secret/data sensitif dalam perubahan;
- dokumentasi dan migration diperbarui;
- review wajib selesai;
- risiko residual dicatat dan diterima oleh pihak yang berwenang.

---

## 14. Keputusan yang Masih TBD

| ID | Keputusan | Catatan |
|---|---|---|
| CG-01 | Branch model final | Trunk-based atau branch integrasi dengan release branch. |
| CG-02 | Nama branch utama | Misalnya `main` dan `develop`; verifikasi repositori. |
| CG-03 | Conventional Commits | Perlu persetujuan tim. |
| CG-04 | Versi Node.js/pnpm | Harus konsisten dengan CI dan local development. |
| CG-05 | Formatter dan linter | Ikuti konfigurasi repositori aktual. |
| CG-06 | Script lint/unit/integration | Perlu inventarisasi `package.json`. |
| CG-07 | Jumlah reviewer minimum | Termasuk reviewer keamanan untuk perubahan sensitif. |
| CG-08 | Protected branch dan merge rule | Perlu konfigurasi repository hosting. |
| CG-09 | CODEOWNERS | Tentukan pemilik area auth, voting, database, dan deployment. |
| CG-10 | Lokasi ADR | Tentukan folder dan template. |
| CG-11 | CI quality gate | Tentukan checks wajib dan urutan pipeline. |
| CG-12 | Aturan dependency update | Tentukan jadwal dan approval. |

---

## 15. Riwayat Perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1.0 | 2026-10-31 | Draft awal pedoman kontribusi developer. |

---

## 16. Dokumen Terkait

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
- `ADMIN_GUIDE.md`

**Release gate:** sebelum pedoman ini dijadikan aturan wajib, verifikasi struktur repositori, script aktual, versi runtime, aturan branch, dan pipeline CI.
