import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Calendar, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col justify-between antialiased selection:bg-hmif-gold selection:text-hmif-dark">
      {/* Main Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-4xl bg-hmif-dark border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT COLUMN: Identity & Schedule */}
          <section className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-hmif-dark border-b lg:border-b-0 lg:border-r border-neutral-800">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-12 h-12 shrink-0 bg-white rounded-xl p-1.5 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full rounded-lg bg-hmif-dark flex items-center justify-center text-hmif-gold font-bold text-base">
                    HMIF
                  </div>
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
                  Suaramu, <br />
                  <span className="text-hmif-gold">Masa Depan HMIF.</span>
                </h1>
                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  Pemilihan Raya Ketua dan Wakil Ketua Himpunan Mahasiswa Teknik Informatika Periode 2026/2027.
                </p>
              </div>
            </div>

            {/* Schedule */}
            <div className="pt-6 border-t border-neutral-800 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                    Jadwal Pemilihan
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-hmif-gold" />
                    Hari Ini, 08.00 – 16.00 WIB
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Bilik Suara Dibuka</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Authentication Panel */}
          <section className="lg:col-span-5 text-neutral-900 p-8 sm:p-10 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
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
                  Gunakan akun Microsoft kampus untuk memverifikasi hak suara Anda di DPT.
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
      <footer className="w-full py-3.5 text-center text-xs text-neutral-500 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-hmif-gold" />
            <span>KPR HMIF Telkom University Purwokerto 2026/2027</span>
          </div>
          <span>Ballot Secrecy &amp; Asas Luber Jurdil</span>
        </div>
      </footer>
    </div>
  );
}
