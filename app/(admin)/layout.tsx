import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mengisolasi panel internal Admin pada token tema gelap yang sudah teruji kontrasnya
  // agar peralihan mode terang di sisi pemilih/publik tidak merusak keterbacaan dashboard panitia.
  return (
    <div className="dark min-h-screen bg-surface text-on-surface font-sans antialiased">
      {children}
    </div>
  );
}
