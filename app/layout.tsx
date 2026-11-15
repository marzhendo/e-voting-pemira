import type { Metadata } from 'next';
import { Bebas_Neue, Montserrat } from 'next/font/google';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import './globals.css';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  fallback: ['Impact', 'sans-serif'],
});

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'E-Voting Pemira HMIF | Telkom University Purwokerto',
  description: 'Sistem Pemungutan Suara Elektronik Pemilihan Chairman dan Vice Chairman HMIF Telkom University Purwokerto',
  icons: {
    icon: '/assets/img/hmif-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`dark ${bebas.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-surface text-on-surface font-montserrat antialiased selection:bg-primary-container selection:text-on-primary">
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
