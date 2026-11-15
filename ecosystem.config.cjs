const fs = require('fs');
const path = require('path');

/**
 * Parser file .env sederhana tanpa dependensi eksternal
 * Membaca .env.local dan meneruskannya ke runtime Node.js via PM2
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const envVars = {};
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envVars[key] = val;
      }
    }
    return envVars;
  } catch (err) {
    console.error('[PM2 Config] Gagal membaca env file:', err);
    return {};
  }
}

const localEnv = loadEnvFile(path.resolve(__dirname, '.env.local'));

/**
 * PM2 Process Manager Configuration for Pemira HMIF E-Voting
 * Optimized for Ubuntu 22.04 LTS VPS (Cloudra S3: 4 Core CPU, 6 GB RAM)
 */
module.exports = {
  apps: [
    {
      name: 'pemira-hmif',
      // Menjalankan server Next.js standalone hasil tracing
      script: '.next/standalone/server.js',
      cwd: './',
      // Cluster mode memanfaatkan seluruh 4 Core CPU secara optimal
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      // Alokasi memori aman per worker (RAM total 6GB, 4 worker x 1GB = 4GB, sisa 2GB untuk OS & Nginx)
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        ...localEnv,
      },
      // Otomatis restart jika crash dengan delay eksponensial
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 1000,
      // Format logging terstruktur
      time: true,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
