/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone mode relies on filesystem symlinks.
  // On Linux (VPS production), standalone is enabled automatically.
  // On Windows, it gracefully falls back to standard build unless BUILD_STANDALONE=true is passed with admin rights.
  output: process.platform === 'win32' && !process.env.BUILD_STANDALONE ? undefined : 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

