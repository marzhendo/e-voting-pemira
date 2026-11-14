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
