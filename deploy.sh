#!/bin/bash
# ==============================================================================
# Automated Zero-Downtime Deployment Script for Pemira HMIF
# Target OS: Ubuntu 22.04 LTS VPS (Cloudra S3: 4 Core CPU, 6 GB RAM)
# Usage: ./deploy.sh
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "🚀 Starting Deployment: Pemira HMIF E-Voting Platform"
echo "   Target: Ubuntu 22.04 LTS (4 Cores, 6 GB RAM)"
echo "=========================================================="

APP_DIR="/var/www/e-voting"
cd "$APP_DIR"

# Pastikan path pnpm, node, dan pm2 terbaca saat dieksekusi via SSH/script non-login
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:$HOME/.local/share/pnpm"

# 1. Tarik pembaruan kode terbaru dari Git
echo "📥 1. Pulling latest code from Git..."
git pull origin main

# 2. Instalasi dependencies
echo "📦 2. Installing dependencies..."
pnpm install --frozen-lockfile

# 3. Validasi tipe TypeScript
echo "🔍 3. Typechecking TypeScript..."
pnpm typecheck

# 4. Bangun Next.js Standalone Production Build
echo "🏗️  4. Building Next.js Standalone..."
pnpm build

# 5. Salin folder public dan .next/static ke dalam .next/standalone
echo "📋 5. Syncing public and static assets to standalone directory..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# Pastikan folder data dan logs memiliki izin yang benar
mkdir -p logs data
chmod -R 755 logs data

# 6. Zero-Downtime Reload via PM2 Cluster (4 Workers)
echo "🔄 6. Reloading PM2 Cluster (Zero-Downtime)..."
if pm2 list | grep -q "pemira-hmif"; then
    pm2 reload ecosystem.config.cjs --update-env
else
    pm2 start ecosystem.config.cjs
fi

pm2 save

echo "=========================================================="
echo "✅ Deployment Succeeded! E-Voting is live and healthy."
echo "=========================================================="
