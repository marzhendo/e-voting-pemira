import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/theme/theme-provider';
import {
  getSiteUrl,
  SEO_CONFIG,
  getOrganizationSchema,
  getWebSiteSchema,
} from '@/lib/seo/constants';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: SEO_CONFIG.titleTemplate,
  },
  description: SEO_CONFIG.description,
  keywords: [...SEO_CONFIG.keywords],
  authors: [...SEO_CONFIG.authors],
  creator: SEO_CONFIG.creator,
  publisher: SEO_CONFIG.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.locale,
    url: getSiteUrl(),
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.description,
    siteName: SEO_CONFIG.siteName,
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.description,
    creator: '@hmif_telkompurwokerto',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebSiteSchema()),
          }}
        />
      </head>
      <body className="min-h-screen bg-surface text-on-surface font-sans antialiased selection:bg-primary selection:text-on-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-primary focus:text-on-primary focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-on-surface"
        >
          Langsung ke konten utama
        </a>
        <ThemeProvider>
          <NavigationProgress />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
