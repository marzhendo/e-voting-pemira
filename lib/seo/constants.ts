/**
 * SEO & Social Graph Configuration
 * Centralized metadata, canonical URL resolution, and keywords for Pemira HMIF.
 */

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_BASE_URL ||
    'https://pemirahmif.com';
  return url.replace(/\/+$/, '');
}

export const SEO_CONFIG = {
  siteName: 'PEMIRA HMIF Telkom University Purwokerto',
  defaultTitle: 'E-Voting Pemira HMIF 2026/2027 | Telkom University Purwokerto',
  titleTemplate: '%s | Pemira HMIF Telkom University Purwokerto',
  description:
    'Platform resmi pemungutan suara elektronik suksesi Chairman dan Vice Chairman HMIF Telkom University Purwokerto Periode 2026/2027. Mengedepankan asas langsung, umum, bebas, rahasia, jujur, dan adil.',
  keywords: [
    'Pemira HMIF',
    'E-Voting HMIF',
    'HMIF Telkom University Purwokerto',
    'Pemilihan Ketua HMIF',
    'Teknik Informatika Telkom Purwokerto',
    'Komisi Pemilihan Raya HMIF',
    'Suksesi HMIF 2026',
    'Bilik Suara Mahasiswa Informatika',
    'Telkom University Purwokerto',
    'Pemira Informatika',
    'E-Voting Pemira',
  ],
  authors: [
    {
      name: 'Komisi Pemilihan Raya HMIF Telkom University Purwokerto',
      url: 'https://www.instagram.com/hmif_telkompurwokerto/',
    },
  ],
  creator: 'Komisi Pemilihan Raya (KPR) HMIF',
  publisher: 'HMIF Telkom University Purwokerto',
  themeColor: '#121212',
  locale: 'id_ID',
} as const;

/**
 * Schema.org JSON-LD definitions for Organization and WebSite
 */
export function getOrganizationSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HMIF Telkom University Purwokerto',
    alternateName: 'Himpunan Mahasiswa Teknik Informatika Telkom University Purwokerto',
    url: siteUrl,
    logo: `${siteUrl}/assets/img/hmif-logo.png`,
    sameAs: [
      'https://www.instagram.com/hmif_telkompurwokerto/',
      'https://hmif.ittelkom-pwt.ac.id',
    ],
    department: {
      '@type': 'EducationalOrganization',
      name: 'Program Studi S1 Teknik Informatika Telkom University Purwokerto',
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: 'Telkom University Purwokerto',
        url: 'https://telkomuniversity.ac.id',
      },
    },
  };
}

export function getWebSiteSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.siteName,
    url: siteUrl,
    description: SEO_CONFIG.description,
    inLanguage: 'id-ID',
    publisher: {
      '@type': 'Organization',
      name: 'HMIF Telkom University Purwokerto',
    },
  };
}

export function getElectionEventSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Pemilihan Raya HMIF Telkom University Purwokerto 2026/2027',
    description:
      'Pemungutan suara resmi mahasiswa aktif Informatika untuk menentukan Chairman dan Vice Chairman HMIF Periode 2026/2027.',
    startDate: '2026-11-01T08:00:00+07:00',
    endDate: '2026-11-30T17:00:00+07:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: `${siteUrl}/login`,
    },
    organizer: {
      '@type': 'Organization',
      name: 'Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto',
      url: siteUrl,
    },
  };
}
