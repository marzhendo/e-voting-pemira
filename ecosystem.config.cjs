/**
 * PM2 Process Manager Configuration for Pemira HMIF E-Voting
 * Optimized for Debian 12 VPS (2 vCPU, 2 GB RAM)
 */
module.exports = {
  apps: [
    {
      name: 'pemira-hmif',
      // Menjalankan server Next.js standalone hasil tracing
      script: '.next/standalone/server.js',
      cwd: './',
      // Cluster mode memanfaatkan 2 vCPU secara optimal
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      // Batasi memori per worker agar tidak melebihi RAM 2GB
      max_memory_restart: '450M',
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
