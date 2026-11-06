import Link from 'next/link';
import Image from 'next/image';
import { Shield, ArrowRight, Lock, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-montserrat flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Top Header */}
      <header className="w-full border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF Telkom University Purwokerto"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                PEMIRA HMIF 2026/2027
              </span>
              <span className="text-[11px] text-outline">
                Telkom University Purwokerto
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-xs text-outline hover:text-on-surface transition-colors min-h-[44px] min-w-[44px] inline-flex items-center px-3 rounded-lg"
            >
              Console KPR
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6 py-10 sm:py-16">
          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
            Satu Suara, <br />
            <span className="text-primary">Bawa Perubahan untuk Informatika.</span>
          </h1>

          <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg leading-relaxed">
            Platform resmi pemilihan Chairman &amp; Vice Chairman HMIF Periode 2026/2027.
          </p>

          {/* Single Dominant CTA */}
          <div className="pt-2 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-primary hover:bg-secondary-fixed text-on-primary text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98]"
            >
              <span>Masuk ke Bilik Suara</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Minimal Trust Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 pt-6 sm:pt-8 w-full text-xs text-outline">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span>Suara Bersifat Rahasia</span>
            </div>
            <span className="hidden sm:inline text-outline-variant/60">•</span>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <span>Satu Mahasiswa Satu Suara</span>
            </div>
            <span className="hidden sm:inline text-outline-variant/60">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tanda Terima Terverifikasi</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/20 py-4 text-xs text-outline text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Komisi Pemilihan Raya • HMIF Telkom University Purwokerto</span>
          <span>Periode 2026/2027</span>
        </div>
      </footer>
    </div>
  );
}
