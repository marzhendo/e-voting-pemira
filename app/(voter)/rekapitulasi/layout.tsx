import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rekapitulasi Suara & Partisipasi Pemilih | Pemira HMIF 2026/2027",
  description:
    "Pantauan resmi Partisipasi Pemilih DPT dan hasil Rekapitulasi Suara Pemira HMIF Telkom University Purwokerto 2026/2027.",
};

export default function RekapitulasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
