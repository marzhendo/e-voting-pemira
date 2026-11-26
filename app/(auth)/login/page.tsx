import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getMaintenanceStatus } from "@/lib/election/maintenance-status";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Masuk ke Bilik Suara Digital",
  description:
    "Verifikasi NIM dan Kata Sandi Pemilih mahasiswa aktif Informatika Telkom University Purwokerto untuk mengakses Bilik Suara Digital Pemira HMIF 2026/2027.",
  alternates: {
    canonical: "/login",
  },
};

interface LoginPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Pre-fetch status pemeliharaan secara server-side untuk mengeliminasi flash of content
  const initialMaintenance = await getMaintenanceStatus();
  const adminParam = searchParams?.admin;
  const initialAdmin = adminParam === "1" || adminParam === "true";

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary overflow-x-hidden">
      <SiteHeader subtitle="Verifikasi Pemilih" />

      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 animate-page-enter"
      >
        <div className="w-full max-w-[440px] mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors min-h-[44px] px-2 -ml-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="w-full max-w-[440px] bg-surface-container border border-outline-variant rounded-2xl p-6 sm:p-7">
          <Suspense
            fallback={
              <div className="text-sm text-on-surface-variant py-12 text-center">
                Memuat formulir verifikasi...
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

      <SiteFooter />
    </div>
  );
}
