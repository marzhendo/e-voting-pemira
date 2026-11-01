import type { Metadata } from 'next';
import { Bebas_Neue, Montserrat } from 'next/font/google';
import './globals.css';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'E-Voting Pemira HMIF | Telkom University Purwokerto',
  description: 'Sistem Pemungutan Suara Elektronik Pemilihan Ketua dan Wakil Ketua HMIF Telkom University Purwokerto',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${bebas.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-surface text-on-surface font-montserrat antialiased selection:bg-primary-container selection:text-on-primary">
        {children}
      </body>
    </html>
  );
}
