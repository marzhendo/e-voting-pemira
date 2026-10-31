import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="id">
      <body className="min-h-screen bg-hmif-cream text-hmif-dark antialiased">
        {children}
      </body>
    </html>
  );
}
