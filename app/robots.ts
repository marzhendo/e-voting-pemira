import type { MetadataRoute } from 'next';
import { getSiteUrl } from '../lib/seo/constants.ts';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/admin',
        '/admin/*',
        '/vote',
        '/vote/*',
        '/receipt',
        '/receipt/*',
        '/bast',
        '/bast/*',
        '/api',
        '/api/*',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
