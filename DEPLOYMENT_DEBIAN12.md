# PANDUAN DEPLOYMENT PRODUKSI: DEBIAN 12 VPS
**Platform E-Voting Pemira HMIF Telkom University Purwokerto**
*Spesifikasi: 2 vCPU, 2 GB RAM, 40 GB Storage, 20 Mbps Port (Jakarta Node)*

---

## 1. Persiapan Awal & Hardening Server (SSH)

Masuk ke VPS baru kamu via terminal/PowerShell:
```bash
ssh root@<IP_VPS_KAMU>
```

### A. Update Paket Sistem
```bash
apt update && apt upgrade -y
apt install -y curl wget git ufw htop fail2ban unzip build-essential
```

### B. Konfigurasi 2 GB Swap File (PENTING untuk 2GB RAM)
Agar server memiliki jaring pengaman memori saat lonjakan traffic:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf
```

### C. Konfigurasi Firewall UFW
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
```

---

## 2. Instalasi Node.js 20 LTS, PNPM, dan PM2

### A. Instalasi Node.js v20 (NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v # Pastikan v20.x.x
```

### B. Instalasi PNPM & PM2
```bash
npm install -g pnpm pm2
pnpm -v
pm2 -v
```

---

## 3. Clone Proyek & Konfigurasi Lingkungan

### A. Setup Direktori Aplikasi
```bash
mkdir -p /var/www
cd /var/www
git clone <URL_REPOSITORY_GIT_KAMU> e-voting
cd /var/www/e-voting
```

### B. Konfigurasi File Environment Produksi
Buat file `.env.production` (atau `.env.local`):
```bash
nano .env.local
```
Salin seluruh variabel yang sudah kita uji:
```env
APP_ENV=production
NODE_ENV=production

# Ganti dengan domain resmi Anda
APP_BASE_URL=https://pemirahmif.org
NEXT_PUBLIC_APP_URL=https://pemirahmif.org

# Session Secret (Minimal 32 karakter acak)
SESSION_SECRET=kombinasi-rahasia-minimal-32-karakter-acak-aman-2026

# Nonaktifkan dummy auth di produksi
ENABLE_DUMMY_AUTH=false

# Supabase Credentials (Sudah diverifikasi)
NEXT_PUBLIC_SUPABASE_URL=https://vczmkojngvjounuoyhhv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_KQLOfhp9qZRkiHIIYhDNZA_Y7FfV4Dd
SUPABASE_SERVICE_ROLE_KEY=sb_secret_NQyB-FyYx9Kl56E2cmGG6A_LvMuUk2P

# SMTP Configuration (Untuk OTP & Broadcast)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email.panitia@gmail.com
SMTP_PASS=app_password_16_karakter
SMTP_FROM_NAME="Panitia Pemira HMIF 2026"
SMTP_FROM_EMAIL=noreply@pemirahmif.org
```
Simpan dengan menekan `Ctrl + O`, lalu `Enter`, dan keluar dengan `Ctrl + X`.

---

## 4. Build & Jalankan Aplikasi dengan PM2 Cluster

### A. Build Aplikasi
```bash
pnpm install --frozen-lockfile
pnpm build

# Sinkronkan folder aset ke standalone
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

### B. Jalankan dengan PM2 (2 Worker Instances)
```bash
# Jalankan menggunakan konfigurasi cluster
pm2 start ecosystem.config.cjs

# Konfigurasi agar PM2 otomatis menyala saat server reboot
pm2 startup systemd
# (Jalankan perintah sudo env PATH... yang muncul di layar terminal)
pm2 save
```

Cek status cluster:
```bash
pm2 status
pm2 logs pemira-hmif
```

---

## 5. Konfigurasi Nginx Reverse Proxy & SSL (HTTPS)

### A. Instalasi Nginx & Certbot
```bash
apt install -y nginx certbot python3-certbot-nginx
```

### B. Konfigurasi Virtual Host
```bash
cp /var/www/e-voting/nginx.conf.example /etc/nginx/sites-available/pemira-hmif.conf
nano /etc/nginx/sites-available/pemira-hmif.conf
```
*Ganti `pemirahmif.org` dengan nama domain yang kamu miliki.*

Aktifkan konfigurasi:
```bash
ln -s /etc/nginx/sites-available/pemira-hmif.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t # Pastikan syntax ok
systemctl restart nginx
```

### C. Pasang Sertifikat SSL Gratis (Let's Encrypt)
*(Pastikan Domain DNS A-Record sudah diarahkan ke IP VPS)*
```bash
certbot --nginx -d pemirahmif.org -d www.pemirahmif.org
```
Certbot akan memperbarui file Nginx secara otomatis dan mengaktifkan HTTPS.

---

## 6. Integrasi Cloudflare (Mitigasi Port 20 Mbps)

Untuk mengatasi batas kecepatan port 20 Mbps pada paket VPS:
1. Tambahkan domainmu ke **Cloudflare (Free Plan)**.
2. Atur DNS:
   - **Type A** | Name: `@` | IPv4: `<IP_VPS>` | **Proxy Status: Proxied (Awan Oranye)**.
   - **Type A** | Name: `www` | IPv4: `<IP_VPS>` | **Proxy Status: Proxied (Awan Oranye)**.
3. Di tab **SSL/TLS**, pilih mode **Full (Strict)**.
4. Di tab **Caching**, aktifkan **Standard Caching**.
   - Cloudflare akan otomatis meng-cache file `_next/static/` dan foto kandidat di server Jakarta mereka.
   - VPS-mu hanya akan melayani data JSON autentikasi dan vote, menjamin kecepatan maksimal meski diakses 50+ user serentak.

---

## 7. Pembaruan Kode Cepat (Zero-Downtime Deployment)

Jika di kemudian hari ada perubahan kode atau fitur baru:
```bash
cd /var/www/e-voting
chmod +x deploy.sh
./deploy.sh
```
Script `deploy.sh` akan secara otomatis menarik kode terbaru, melakukan build, dan me-reload PM2 cluster tanpa *downtime* (tanpa memutus user yang sedang mengakses).
