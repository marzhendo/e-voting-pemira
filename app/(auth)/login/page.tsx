import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Masuk ke Bilik Suara',
  description:
    'Verifikasi identitas NIM mahasiswa aktif Informatika Telkom University Purwokerto untuk mengakses bilik suara Pemira HMIF 2026/2027.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary">
      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-page-enter">
        {/* Subtle Back to Home Navigation */}
        <div className="w-full max-w-[440px] mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors min-h-[44px] px-2 py-1 -ml-2 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Focused Single-Column Card */}
        <div className="w-full max-w-[440px] bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary/5 transition-all duration-200 ease-out">
          {/* Card Header: Brand Identity & Unified Headline */}
          <div className="text-center flex flex-col items-center space-y-3 mb-6">
            <div className="relative w-12 h-12 rounded-full border border-primary/40 bg-surface-container-high p-1 shadow-inner flex items-center justify-center">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF Telkom University Purwokerto"
                width={40}
                height={40}
                priority
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-primary">
                PEMIRA HMIF 2026/2027
              </p>
              <p className="text-[11px] font-medium text-on-surface-variant">
                Telkom University Purwokerto
              </p>
            </div>

            <div className="pt-1">
              <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide uppercase text-on-surface leading-none">
                Waktunya Memilih.
              </h1>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1.5 max-w-xs mx-auto">
                Ketik NIM kamu untuk menerima kode PIN verifikasi di email SSO kampus (@student.telkomuniversity.ac.id).
              </p>
            </div>
          </div>

          {/* Form Component */}
          <Suspense
            fallback={
              <div className="text-xs text-on-surface-variant py-8 text-center animate-pulse">
                Memuat formulir login...
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          {/* Card Footer: Panitia Support */}
          <div className="pt-5 border-t border-outline-variant/20 text-center mt-6">
            <p className="text-xs text-on-surface-variant font-medium">
              Butuh bantuan login atau verifikasi DPT?{' '}
              <a
                href="https://wa.me/6281809300406"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1 min-h-[44px] px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                Hubungi Panitia KPR
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-[11px] text-on-surface-variant border-t border-outline-variant/15">
        <p className="max-w-4xl mx-auto px-4">
          &copy; 2026 HMIF Telkom University Purwokerto. &bull; Komisi Pemilihan Raya. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
