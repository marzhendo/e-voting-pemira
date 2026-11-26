import Link from "next/link";
import { KPR_WHATSAPP_URL } from "@/components/layout/site-header";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-outline-variant bg-surface-container-low">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-on-surface-variant">
        <div className="space-y-1">
          <p className="font-semibold text-on-surface">
            Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto
          </p>
          <p>
            Platform Resmi Pemilihan Chairman &amp; Vice Chairman HMIF Periode 2026/2027.
          </p>
        </div>

        <nav
          aria-label="Navigasi footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        >
          <Link
            href="/rekapitulasi"
            className="min-h-[44px] inline-flex items-center hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
          >
            Rekapitulasi Suara
          </Link>
          <Link
            href="/bast/verify"
            className="min-h-[44px] inline-flex items-center hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
          >
            Verifikasi BAST
          </Link>
          <a
            href={KPR_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
          >
            Bantuan KPR
          </a>
        </nav>
      </div>
    </footer>
  );
}
