import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getMaintenanceStatus } from "@/lib/election/maintenance-status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Masuk ke Bilik Suara",
  description:
    "Verifikasi identitas NIM mahasiswa aktif Informatika Telkom University Purwokerto untuk mengakses bilik suara Pemira HMIF 2026/2027.",
  alternates: {
    canonical: "/login",
  },
};

interface LoginPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Pre-fetch status pemeliharaan secara server-side untuk mengeliminasi flash of content (FOAC)
  const initialMaintenance = await getMaintenanceStatus();
  const adminParam = searchParams?.admin;
  const initialAdmin = adminParam === "1" || adminParam === "true";

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary">
      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 animate-page-enter">
        {/* Subtle Back to Home Navigation */}
        <div className="w-full max-w-[420px] mb-2 sm:mb-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors min-h-[36px] px-2 py-1 -ml-2 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Focused Single-Column Card */}
        <div className="w-full max-w-[420px] bg-surface-container border border-outline-variant/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/40">
          <Suspense
            fallback={
              <div className="text-xs text-on-surface-variant py-12 text-center animate-pulse">
                Memuat bilik suara...
              </div>
            }
          >
            <LoginForm
              initialMaintenance={initialMaintenance}
              initialAdminMode={initialAdmin}
            />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 sm:py-4 text-center text-[11px] sm:text-xs text-on-surface-variant border-t border-outline-variant/15">
        <p className="max-w-4xl mx-auto px-4">
          &copy; 2026 HMIF Telkom University Purwokerto. &bull; Komisi Pemilihan
          Raya. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
