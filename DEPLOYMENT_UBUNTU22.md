# PANDUAN DEPLOYMENT PRODUKSI: UBUNTU 22.04 LTS VPS
**Platform E-Voting Pemira HMIF Telkom University Purwokerto**
*Spesifikasi: 4 Core CPU, 6 GB RAM, Paket Cloudra S3 (Jakarta Node)*

---

## 1. Persiapan Awal & Hardening Server (Otomatis via `setup.sh`)

Masuk ke VPS Cloudra S3 kamu via SSH dari terminal atau PowerShell:
```bash
ssh root@<IP_VPS_KAMU>
```

### A. Clone Repositori dan Jalankan Otomasi Provisioning
```bash
mkdir -p /var/www
cd /var/www
git clone <URL_REPOSITORY_GIT_KAMU> e-voting
cd /var/www/e-voting

# Berikan izin eksekusi dan jalankan script setup
chmod +x setup.sh deploy.sh
sudo ./setup.sh
```

Script `setup.sh` secara otomatis dan aman (*idempotent*) melakukan:
1. Pembaruan repositori paket sistem Ubuntu 22.04 LTS (`apt update && apt upgrade`).
2. Pemasangan dependensi esensial (`curl`, `wget`, `git`, `ufw`, `htop`, `fail2ban`, `build-essential`, `nginx`, `certbot`).
3. Pengaktifan **4 GB Swap File** dengan `swappiness=10` untuk menjamin stabilitas memori saat *build* Next.js.
4. Instalasi **Node.js 20.x LTS (Iron)** melalui repositori resmi NodeSource.
5. Instalasi global package manager `pnpm` dan process manager `pm2`.
6. Pengaktifan firewall `ufw` (port 22/SSH, 80/HTTP, 443/HTTPS) dan proteksi *brute-force* `fail2ban`.

---

## 2. Konfigurasi Lingkungan Produksi (.env.local)

Salin dan buat berkas konfigurasi *environment* di folder aplikasi:
```bash
cd /var/www/e-voting
nano .env.local
```

Isi dengan nilai variabel produksi resmi:
```env
APP_ENV=production
NODE_ENV=production

# Domain resmi e-voting
APP_BASE_URL=https://pemirahmif.org
NEXT_PUBLIC_APP_URL=https://pemirahmif.org

# Session Secret (Minimal 32 karakter acak kriptografis)
SESSION_SECRET=kombinasi-rahasia-minimal-32-karakter-acak-aman-2026

# Nonaktifkan dummy auth di lingkungan produksi
ENABLE_DUMMY_AUTH=false

# Supabase Credentials (Wajib valid & terverifikasi dari Dashboard Supabase Anda)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SMTP Configuration (Untuk pengiriman kode OTP & Bukti Suara)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email.panitia@gmail.com
SMTP_PASS=app_password_16_karakter
SMTP_FROM_NAME="Panitia Pemira HMIF 2026"
SMTP_FROM_EMAIL=noreply@pemirahmif.org
```
Simpan dengan menekan `Ctrl + O`, lalu `Enter`, dan keluar dengan `Ctrl + X`.

---

## 3. Build & Jalankan Aplikasi dengan PM2 Cluster (4 Core CPU)

Lakukan *build* perdana dan jalankan klaster worker:
```bash
cd /var/www/e-voting

# 1. Pasang dependensi dan lakukan build Next.js Standalone
pnpm install --frozen-lockfile
pnpm build

# 2. Sinkronkan folder aset statis ke direktori standalone
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 3. Jalankan aplikasi via PM2 Cluster Mode (4 Core CPU)
pm2 start ecosystem.config.cjs

# 4. Atur PM2 agar otomatis menyala saat server reboot
pm2 startup systemd
# Salin dan jalankan perintah 'sudo env PATH...' yang ditampilkan oleh PM2 di terminal
pm2 save
```

Verifikasi kesehatan klaster PM2:
```bash
pm2 status
pm2 logs pemira-hmif
```
*Pastikan 4 worker berstatus `online` dengan mode `cluster`.*

---

## 4. Konfigurasi Nginx Reverse Proxy & Keamanan

### A. Pasang Virtual Host Nginx
```bash
sudo cp /var/www/e-voting/nginx.conf.example /etc/nginx/sites-available/pemira-hmif.conf
sudo nano /etc/nginx/sites-available/pemira-hmif.conf
```
*Sesuaikan `server_name` dengan nama domain atau IP VPS Anda.*

Aktifkan konfigurasi Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/pemira-hmif.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```
Saat ini Nginx pada port 80 telah langsung meneruskan *traffic* ke Next.js (port 3000) dengan proteksi *rate-limiting* dan *security headers*.

### B. Pasang Sertifikat SSL Gratis (Let's Encrypt / Certbot)
*(Pastikan DNS A-Record domain sudah mengarah ke IP VPS Cloudra S3)*
```bash
sudo certbot --nginx -d pemirahmif.org -d www.pemirahmif.org
```
Certbot akan memperbarui file Nginx secara otomatis dan mengaktifkan HTTPS dengan pembaruan otomatis (*auto-renewal*).

---

## 5. Integrasi Cloudflare (Mitigasi Port 20 Mbps & Akselerasi Global)

Untuk memaksimalkan performa di bawah batasan port 20 Mbps:
1. Tambahkan domain ke **Cloudflare (Free Plan)**.
2. Atur DNS:
   - **Type A** | Name: `@` | IPv4: `<IP_VPS>` | **Proxy Status: Proxied (Awan Oranye)**.
   - **Type A** | Name: `www` | IPv4: `<IP_VPS>` | **Proxy Status: Proxied (Awan Oranye)**.
3. Di menu **SSL/TLS**, pilih mode **Full (Strict)**.
4. Di menu **Caching -> Cache Rules**, aktifkan caching untuk:
   - `/_next/static/*`
   - `/assets/*`
   - `/candidates/*`
5. Dengan setup ini, seluruh beban unduhan file statis dan gambar foto kandidat diserap oleh jaringan CDN Cloudflare di Jakarta, sehingga VPS 4 Core hanya fokus memproses validasi OTP dan transaksi bilik suara (*database RPC*).

---

## 6. Prosedur Pembaruan Kode (Zero-Downtime Deployment)

Jika terdapat pembaruan kode di branch `main`:
```bash
cd /var/www/e-voting
./deploy.sh
```
Script `deploy.sh` akan:
- Menarik pembaruan kode dari Git (`git pull origin main`).
- Memasang dependensi (`pnpm install --frozen-lockfile`).
- Menjalankan validasi tipe TypeScript (`pnpm typecheck`).
- Membangun Next.js standalone (`pnpm build`).
- Menyinkronkan aset statis `public` dan `.next/static`.
- Me-*reload* klaster PM2 satu demi satu secara bergantian (*zero-downtime*) tanpa memutus koneksi pemilih yang sedang berada di bilik suara.
