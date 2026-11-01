import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Calendar, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col justify-between antialiased selection:bg-hmif-gold selection:text-hmif-dark">
      {/* Main Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl bg-hmif-dark border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT COLUMN: Brand Identity & PEMIRA Information */}
          <section className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between bg-hmif-dark border-b lg:border-b-0 lg:border-r border-neutral-800">
            <div>
              {/* Logo & Campus Identity */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-white rounded-2xl p-2 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full rounded-xl bg-hmif-dark flex items-center justify-center text-hmif-gold font-bold text-xl">
                    HMIF
                  </div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-hmif-gold">
                    PEMIRA HMIF 2026/2027
                  </p>
                  <h2 className="text-sm sm:text-base font-medium text-neutral-300 leading-snug">
                    Telkom University Purwokerto
                  </h2>
                </div>
              </div>

              {/* Hero Statement & Subtext */}
              <div className="space-y-4 max-w-xl">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                  Suaramu, <br />
                  <span className="text-hmif-gold">Masa Depan HMIF.</span>
                </h1>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed pt-1">
                  Pemilihan Raya Ketua dan Wakil Ketua Himpunan Mahasiswa Teknik Informatika Periode 2026/2027 berasaskan LUBER JURDIL.
                </p>
              </div>
            </div>

            {/* Schedule & Voting Window Details */}
            <div className="pt-6 border-t border-neutral-800/80 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
                    Jadwal Pemilihan
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-hmif-gold" />
                    Hari Ini, 08.00 – 16.00 WIB
                  </p>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Bilik Suara Dibuka</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Clean High-Contrast SSO Authentication Panel */}
          <section className="lg:col-span-5 text-neutral-900 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* Header Tag */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Autentikasi Pemilih
                </span>
                <span className="text-xs font-medium text-neutral-500">
                  WIB (UTC+7)
                </span>
              </div>

              {/* Title & Context */}
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Masuk untuk Memilih
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Gunakan akun Microsoft kampus untuk verifikasi identitas dan pengecekan hak suara dalam Daftar Pemilih Tetap (DPT).
                </p>
              </div>

              {/* Interactive Login Area */}
              <Suspense
                fallback={
                  <div className="text-xs text-neutral-500 py-6 text-center">
                    Memuat autentikasi...
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

            {/* Helpdesk & Assistance Link */}
            <div className="pt-6 border-t border-neutral-200 text-center mt-6">
              <p className="text-xs text-neutral-600">
                Mengalami kendala akun?{' '}
                <a
                  href="https://t.me/hmif_tup"
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
      <footer className="w-full py-4 text-center text-xs text-neutral-500 border-t border-neutral-900">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-hmif-gold" />
            <span>KPR HMIF Telkom University Purwokerto 2026/2027</span>
          </div>
          <span>Ballot Secrecy Guaranteed • Zero Identity Leakage</span>
        </div>
      </footer>
    </div>
  );
}
