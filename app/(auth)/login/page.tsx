import { Suspense } from 'react';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary">
      {/* Main Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-4xl bg-surface-container border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT COLUMN: Identity & Context */}
          <section className="hidden lg:flex lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-surface-container-low lg:border-r border-outline-variant/20">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3.5 mb-8">
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
                  <Image
                    src="/assets/img/hmif-logo.png"
                    alt="Logo HMIF Telkom University Purwokerto"
                    width={48}
                    height={48}
                    priority
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-primary">
                    PEMIRA HMIF 2026/2027
                  </p>
                  <h2 className="text-xs font-medium text-outline">
                    Telkom University Purwokerto
                  </h2>
                </div>
              </div>

              {/* Title & Concise Copy */}
              <div className="space-y-3 max-w-md">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-on-surface leading-tight">
                  Waktunya memilih.
                </h1>
                <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                  Pemilihan Chairman & Vice Chairman HMIF Periode 2026/2027.
                </p>
              </div>

              {/* Civic Security Notice */}
              <ul className="mt-8 pt-6 border-t border-outline-variant/20 space-y-2.5 text-xs sm:text-sm text-outline max-w-md">
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-on-surface-variant">Suara tidak ditautkan ke NIM pemilih</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-on-surface-variant">Durasi bilik suara 15 menit per sesi</span>
                </li>
              </ul>
            </div>
          </section>

          {/* RIGHT COLUMN: Authentication Panel */}
          <section className="col-span-1 lg:col-span-5 text-on-surface p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-surface-container-high">
            <div>
              {/* Mobile Compact Branding Header */}
              <div className="lg:hidden flex items-center gap-3 pb-5 mb-5 border-b border-outline-variant/20">
                <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                  <Image
                    src="/assets/img/hmif-logo.png"
                    alt="Logo HMIF"
                    width={40}
                    height={40}
                    priority
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase text-primary">
                    PEMIRA HMIF 2026/2027
                  </p>
                  <p className="text-xs font-medium text-outline">
                    Telkom University Purwokerto
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <h2 className="text-xl font-bold text-on-surface tracking-tight">
                  Masuk ke Bilik Suara
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Masukkan NIM untuk menerima kode PIN di email SSO kampus (@student.telkomuniversity.ac.id).
                </p>
              </div>

              <Suspense
                fallback={
                  <div className="text-xs text-outline py-8 text-center animate-pulse">
                    Memuat formulir login...
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

            <div className="pt-6 border-t border-outline-variant/20 text-center mt-6">
              <p className="text-xs text-outline">
                Kendala autentikasi?{' '}
                <a
                  href="https://wa.me/6281809300406"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline inline-flex items-center gap-1 min-h-[44px] px-2 py-1"
                >
                  Hubungi Panitia KPR
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-outline border-t border-outline-variant/20">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Komisi Pemilihan Raya • HMIF Telkom University Purwokerto</span>
          <span>Periode 2026/2027</span>
        </div>
      </footer>
    </div>
  );
}
