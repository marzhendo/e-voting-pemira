#!/bin/bash
# ==============================================================================
# Automated VPS Provisioning & Hardening Script for Pemira HMIF
# Target OS: Ubuntu 22.04 LTS (Cloudra S3: 4 Core CPU, 6 GB RAM)
# Usage: sudo ./setup.sh
# ==============================================================================

set -euo pipefail

# Pastikan script dijalankan sebagai root / sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Script ini wajib dijalankan dengan hak akses root."
    echo "Gunakan: sudo ./setup.sh"
    exit 1
fi

echo "=========================================================="
echo "🔧 Inisialisasi & Setup VPS Ubuntu 22.04 LTS (Cloudra S3)"
echo "   Spesifikasi Target: 4 Core CPU, 6 GB RAM"
echo "=========================================================="

# 1. Update & Upgrade Paket Sistem
echo "📦 1. Memperbarui repositori dan paket sistem Ubuntu 22.04..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# 2. Instalasi Paket Utilitas Esensial
echo "🛠️  2. Menginstal utilitas esensial..."
apt-get install -y \
    curl \
    wget \
    git \
    ufw \
    htop \
    fail2ban \
    unzip \
    build-essential \
    nginx \
    certbot \
    python3-certbot-nginx \
    ca-certificates \
    gnupg

# 3. Konfigurasi 4 GB Swap File (Optimal untuk VPS 6 GB RAM)
# Mencegah Out-Of-Memory (OOM) saat Next.js build dan kompilasi TypeScript
echo "💾 3. Memeriksa dan mengonfigurasi Swap File 4 GB..."
if [ ! -f /swapfile ]; then
    echo "   -> Membuat swap file 4 GB..."
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    if ! grep -q "vm.swappiness=10" /etc/sysctl.conf; then
        echo 'vm.swappiness=10' >> /etc/sysctl.conf
    fi
    echo "   ✅ Swap 4 GB berhasil diaktifkan."
else
    echo "   ℹ️  Swapfile sudah tersedia, melewati pembuatan swap."
fi

# 4. Instalasi Node.js 20.x LTS via NodeSource Resmi
echo "🟢 4. Menginstal Node.js 20.x LTS (NodeSource)..."
if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    NODE_MAJOR=20
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -y
    apt-get install -y nodejs
    echo "   ✅ Node.js terinstal: $(node -v) (npm: $(npm -v))"
else
    echo "   ℹ️  Node.js 20.x sudah terinstal: $(node -v)"
fi

# 5. Instalasi Global Package: PNPM & PM2
echo "⚡ 5. Menginstal PNPM dan PM2 Process Manager..."
npm install -g pnpm pm2
echo "   ✅ pnpm versi: $(pnpm -v)"
echo "   ✅ pm2 versi: $(pm2 -v)"

# 6. Konfigurasi Keamanan Firewall (UFW)
echo "🛡️  6. Mengonfigurasi firewall UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH Management'
ufw allow 80/tcp comment 'HTTP Web'
ufw allow 443/tcp comment 'HTTPS Secure Web'
ufw --force enable
echo "   ✅ UFW Firewall aktif."

# 7. Aktifkan Layanan Fail2Ban & Nginx
echo "🔒 7. Mengaktifkan daemon Fail2Ban & Nginx..."
systemctl enable fail2ban
systemctl start fail2ban
systemctl enable nginx
systemctl start nginx

# 8. Setup Direktori Aplikasi
echo "📁 8. Memeriksa direktori aplikasi /var/www/e-voting..."
mkdir -p /var/www/e-voting
mkdir -p /var/www/certbot

echo "=========================================================="
echo "🎉 Setup VPS Selesai!"
echo "Langkah selanjutnya:"
echo "1. Clone proyek ke /var/www/e-voting jika belum ada:"
echo "   git clone <URL_REPO> /var/www/e-voting"
echo "2. Salin .env.production ke /var/www/e-voting/.env.local"
echo "3. Salin konfigurasi Nginx:"
echo "   sudo cp /var/www/e-voting/nginx.conf.example /etc/nginx/sites-available/pemira-hmif.conf"
echo "   sudo ln -sf /etc/nginx/sites-available/pemira-hmif.conf /etc/nginx/sites-enabled/"
echo "   sudo rm -f /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo "4. Jalankan deployment perdana:"
echo "   cd /var/www/e-voting && chmod +x deploy.sh && ./deploy.sh"
echo "=========================================================="
