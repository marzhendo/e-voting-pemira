import Link from 'next/link';
import { Vote, Shield, ArrowRight, Lock, CheckCircle, ExternalLink } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-[#181818] min-h-screen text-white font-montserrat flex flex-col justify-between selection:bg-hmif-gold selection:text-hmif-dark">
      {/* Top Header */}
      <header className="w-full border-b border-neutral-800 bg-[#181818]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center font-bold text-hmif-dark text-xs">
              HMIF
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-hmif-gold uppercase tracking-wider">
                PEMIRA HMIF 2026/2027
              </span>
              <span className="text-[10px] text-neutral-400">
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
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6 py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-hmif-gold/15 border border-hmif-gold/30 text-hmif-gold text-xs font-semibold uppercase tracking-wider">
            <Vote className="w-3.5 h-3.5" />
            <span>Pemungutan Suara Elektronik Resmi</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Suaramu, <br />
            <span className="text-hmif-gold">Masa Depan HMIF.</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed">
            Selamat datang di sistem E-Voting Pemilihan Ketua dan Wakil Ketua Himpunan Mahasiswa Teknik Informatika Periode 2026/2027 berasaskan LUBER JURDIL dan terenkripsi murni.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-hmif-blue hover:bg-brand-blue-hover text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Masuk dengan Akun Kampus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/vote"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-hmif-gold hover:bg-hmif-yellow text-hmif-dark text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Vote className="w-4 h-4" />
              <span>Menuju Bilik Suara</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 w-full text-left">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
              <Shield className="w-5 h-5 text-hmif-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Ballot Secrecy</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Identitas pemilih terputus total dari pilihan suara di database.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
              <Lock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Transaksi Atomik</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  RPC PostgreSQL menjamin 1 NIM tepat 1 suara tanpa race condition.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Bukti Digital</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Token kriptografis tanda terima validasi dapat diverifikasi server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 py-4 text-xs text-neutral-500 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto 2026/2027</span>
          <span>© 2026 HMIF Telkom University Purwokerto</span>
        </div>
      </footer>
    </div>
  );
}
