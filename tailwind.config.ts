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
        // Stitch Aura Civic Electoral Design Tokens (Aligned with HMIF Brand Identity)
        'surface-container-lowest': '#0A0A0A',
        'surface-container-low': '#161616',
        'surface-container': '#1E1E1E',
        'surface-container-high': '#262626',
        'surface-container-highest': '#303030',
        surface: '#121212',
        'surface-bright': '#383838',
        'surface-dim': '#121212',
        'on-surface': '#FFFFFF',
        'on-surface-variant': '#B5B5B5',
        outline: '#707070',
        'outline-variant': '#2E2E2E',
        primary: '#EBBD1C',
        'primary-container': '#EBBD1C',
        'on-primary': '#1E1E1E',
        secondary: '#F3EC51',
        'secondary-container': '#D2CB31',
        'secondary-fixed': '#F3EC51',
        'secondary-fixed-dim': '#D2CB31',
        tertiary: '#29388B',
        'tertiary-container': '#212E72',
        error: '#B71B25',
        'error-container': '#93000A',
        'on-error': '#FFFFFF',
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
      keyframes: {
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        slideFadeIn: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        modalEnter: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'page-enter': 'pageEnter 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-fade-in': 'slideFadeIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pop-in': 'popIn 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-enter': 'modalEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 1.8s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
