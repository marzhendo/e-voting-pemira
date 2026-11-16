import type { MetadataRoute } from 'next';
import { SEO_CONFIG } from '../lib/seo/constants.ts';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_CONFIG.siteName,
    short_name: 'Pemira HMIF',
    description: SEO_CONFIG.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#121212',
    icons: [
      {
        src: '/assets/img/hmif-logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
