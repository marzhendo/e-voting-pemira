import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palet Resmi HMIF Telkom University Purwokerto
        hmif: {
          dark: '#1E1E1E',        // Gelap utama pengganti hitam (header/dark card, heading). Dilarang #000000
          gold: '#EBBD1C',        // Brand Primary (tombol submit suara, highlight paslon terpilih, badge no urut)
          yellow: '#F3EC51',      // Brand Secondary / Hover state & aksen glow
          cream: '#F8FAE0',       // Background alternatif kartu pemilih, callout info, kontainer visi-misi
          red: '#B71B25',         // Aksen batas waktu, modal peringatan, opsi Abstain / Kotak Kosong
          blue: '#29388B',        // Tombol SSO Microsoft Entra dan navigasi sekunder
          'blue-hover': '#212E72',
          'gray-dark': '#5E5E5E',  // Teks sekunder (deskripsi paslon, timestamp, metadata)
          'gray-light': '#8B8A8B', // Border kartu, pembatas tabel DPT, status non-aktif
          white: '#FFFFFF',       // Background kartu utama bilik suara & teks di atas latar gelap
        },
        // Stitch Aura Civic Electoral Design Tokens
        'surface-container-lowest': '#0E0E0E',
        'surface-container-low': '#1B1B1C',
        'surface-container': '#202020',
        'surface-container-high': '#2A2A2A',
        'surface-container-highest': '#353535',
        surface: '#131313',
        'surface-bright': '#393939',
        'surface-dim': '#131313',
        'on-surface': '#E5E2E1',
        'on-surface-variant': '#D1C5AC',
        outline: '#9A9079',
        'outline-variant': '#4E4633',
        primary: '#FFDB76',
        'primary-container': '#EBBD1C',
        'on-primary': '#3D2F00',
        secondary: '#D2CB31',
        'secondary-container': '#B0AA00',
        'secondary-fixed': '#EFE84D',
        'secondary-fixed-dim': '#D2CB31',
        tertiary: '#D9DCFF',
        'tertiary-container': '#B6BFFF',
        error: '#FFB4AB',
        'error-container': '#93000A',
        'on-error': '#690005',
        // Brand shortcut aliases
        brand: {
          charcoal: '#1E1E1E',
          darker: '#161616',
          surface: '#242424',
          gold: '#EBBD1C',
          yellow: '#F3EC51',
          cream: '#F8FAE0',
          blue: '#29388B',
          'blue-hover': '#212E72',
          gray: '#5E5E5E',
          muted: '#A0A0A0',
        },
      },
      fontFamily: {
        bebas: ['var(--font-bebas)', 'Bebas Neue', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        sans: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
