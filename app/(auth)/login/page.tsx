import { Suspense } from 'react';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col justify-between antialiased selection:bg-hmif-gold selection:text-hmif-dark">
      {/* Main Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-4xl bg-hmif-dark border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT COLUMN: Identity & Branding */}
          <section className="hidden lg:flex lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-hmif-dark lg:border-r border-neutral-800">
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
                  <p className="text-xs font-bold tracking-wider uppercase text-hmif-gold">
                    PEMIRA HMIF 2026/2027
                  </p>
                  <h2 className="text-xs font-medium text-neutral-400">
                    Telkom University Purwokerto
                  </h2>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3 max-w-md">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                  Gunakan Hak Suaramu <br />
                  <span className="text-hmif-gold">di Pemira HMIF 2026/2027.</span>
                </h1>
                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  Masuk dengan NIM untuk menerima kode PIN verifikasi dan mengakses bilik suara.
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Authentication Panel */}
          <section className="col-span-1 lg:col-span-5 text-neutral-900 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
            <div>
              {/* Mobile Compact Branding Header */}
              <div className="lg:hidden flex items-center gap-3 pb-5 mb-5 border-b border-neutral-200">
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
                  <p className="text-xs font-bold tracking-wider uppercase text-hmif-dark">
                    PEMIRA HMIF 2026/2027
                  </p>
                  <p className="text-xs font-medium text-neutral-500">
                    Telkom University Purwokerto
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Autentikasi Pemilih
                </span>
                <span className="text-xs text-neutral-400">
                  WIB (UTC+7)
                </span>
              </div>

              <div className="space-y-1.5 mb-6">
                <h2 className="text-xl font-bold text-neutral-900">
                  Masuk ke Bilik Suara
                </h2>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Masukkan NIM Anda untuk menerima kode PIN verifikasi di email Outlook mahasiswa Telkom University.
                </p>
              </div>

              <Suspense
                fallback={
                  <div className="text-xs text-neutral-500 py-6 text-center">
                    Memuat formulir login...
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

            <div className="pt-6 border-t border-neutral-200 text-center mt-6">
              <p className="text-xs text-neutral-600">
                Kendala autentikasi?{' '}
                <a
                  href="https://wa.me/6281809300406"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-hmif-blue hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Hubungi Panitia KPR
                  <ArrowRight className="w-3 h-3" />
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3.5 text-center text-xs text-neutral-500 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-hmif-gold" />
            <span>KPR HMIF Telkom University Purwokerto 2026/2027</span>
          </div>
          <span>Kerahasiaan suara dijamin asas Luber Jurdil</span>
        </div>
      </footer>
    </div>
  );
}
