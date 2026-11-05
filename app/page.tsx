import Link from 'next/link';
import Image from 'next/image';
import { Vote, Shield, ArrowRight, Lock, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-[#181818] min-h-screen text-white font-montserrat flex flex-col justify-between selection:bg-hmif-gold selection:text-hmif-dark">
      {/* Top Header */}
      <header className="w-full border-b border-neutral-800 bg-[#181818]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
              <span className="text-xs font-bold text-hmif-gold uppercase tracking-wider block">
                PEMIRA HMIF 2026/2027
              </span>
              <span className="text-[11px] text-neutral-400">
                Telkom University Purwokerto
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Console KPR
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6 py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hmif-gold/10 border border-hmif-gold/25 text-hmif-gold text-xs font-semibold uppercase tracking-wider">
            <Vote className="w-3.5 h-3.5" />
            <span>Pemilihan Raya Mahasiswa</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Suaramu, <br />
            <span className="text-hmif-gold">Masa Depan HMIF.</span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 max-w-lg leading-relaxed">
            Platform resmi pemilihan Chairman &amp; Vice Chairman HMIF Periode 2026/2027.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-hmif-blue hover:bg-brand-blue-hover text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>Masuk ke Bilik Suara</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/vote"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-neutral-700"
            >
              <Vote className="w-4 h-4 text-hmif-gold" />
              <span>Buka Bilik Suara</span>
            </Link>
          </div>

          {/* Core Principles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-8 w-full text-left">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
              <Shield className="w-4 h-4 text-hmif-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Kerahasiaan Suara</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  Pilihan Anda bersifat rahasia dan tidak dapat dilacak kembali ke identitas pemilih.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
              <Lock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Satu Mahasiswa Satu Suara</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  Setiap pemilih hanya dapat memilih satu kali tanpa risiko duplikasi suara.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Tanda Terima Digital</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                  Bukti partisipasi yang bisa diverifikasi kapan saja.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 py-3.5 text-xs text-neutral-500 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Komisi Pemilihan Raya (KPR) HMIF 2026/2027</span>
          <span>© 2026 HMIF Telkom University Purwokerto</span>
        </div>
      </footer>
    </div>
  );
}
