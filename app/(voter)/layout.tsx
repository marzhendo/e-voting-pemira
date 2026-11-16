import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bilik Suara Pemira HMIF',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
