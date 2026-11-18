/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone mode relies on filesystem symlinks.
  // On Linux (VPS production), standalone is enabled automatically.
  // On Windows, it gracefully falls back to standard build unless BUILD_STANDALONE=true is passed with admin rights.
  output: process.platform === 'win32' && !process.env.BUILD_STANDALONE ? undefined : 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
