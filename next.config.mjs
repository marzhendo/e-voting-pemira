/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const isHttpsProduction =
  (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || '').startsWith('https://') ||
  isProduction;

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  isProduction ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
].join('; ');

const nextConfig = {
  // Standalone mode relies on filesystem symlinks.
  // On Linux (VPS production), standalone is enabled automatically.
  // On Windows, it gracefully falls back to standard build unless BUILD_STANDALONE=true is passed with admin rights.
  output: process.platform === 'win32' && !process.env.BUILD_STANDALONE ? undefined : 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    if (isHttpsProduction) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
