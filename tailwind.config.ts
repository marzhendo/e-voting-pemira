import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hmif: {
          dark: '#1E1E1E',       // Gelap utama pengganti hitam (header/dark card, heading). Dilarang #000000
          gold: '#EBBD1C',       // Brand Primary (tombol submit suara, highlight paslon terpilih, badge no urut)
          yellow: '#F3EC51',     // Brand Secondary / Hover state & aksen glow
          cream: '#F8FAE0',      // Background alternatif kartu pemilih, callout info, kontainer visi-misi
          red: '#B71B25',        // Aksen batas waktu, modal peringatan, opsi Abstain / Kotak Kosong
          blue: '#29388B',       // Tombol SSO Microsoft Entra dan navigasi sekunder
          'gray-dark': '#5E5E5E', // Teks sekunder (deskripsi paslon, timestamp, metadata)
          'gray-light': '#8B8A8B', // Border kartu, pembatas tabel DPT, status non-aktif
          white: '#FFFFFF',      // Background kartu utama bilik suara & teks di atas latar gelap
        },
      },
    },
  },
  plugins: [],
};

export default config;
