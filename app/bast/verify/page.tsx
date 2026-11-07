'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileText,
  Lock,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface VerificationResult {
  valid: boolean;
  isExactMatch: boolean;
  electionTitle: string;
  organizer: string;
  institution: string;
  verifiedHash: string;
  currentSystemHash: string;
  timestamp: string;
  summary: {
    totalDpt: number;
    totalVotes: number;
    turnoutPercentage: number;
    tally: Array<{
      candidateNumber: number;
      leaderName: string;
      viceLeaderName: string;
      voteCount: number;
      percentage: number;
    }>;
  };
  secrecyNotice: string;
}

function BastVerificationContent() {
  const searchParams = useSearchParams();
  const hashParam = searchParams.get('hash') || '';

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hashParam) {
      setError('Kode hash integritas dokumen Berita Acara tidak disertakan dalam tautan verifikasi.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/bast/verify?hash=${encodeURIComponent(hashParam)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.valid) {
          throw new Error(json.error || 'Dokumen Berita Acara tidak dapat diverifikasi oleh sistem.');
        }
        setData(json);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memverifikasi dokumen.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hashParam]);

  const handleCopyHash = () => {
    if (data?.verifiedHash) {
      navigator.clipboard.writeText(data.verifiedHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto w-full space-y-6 pt-4 pb-12">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/img/hmif-logo.png"
              alt="Logo HMIF"
              width={42}
              height={42}
              className="w-10 h-10 object-contain drop-shadow"
            />
            <div>
              <span className="text-xs font-bold text-hmif-gold uppercase tracking-widest block">
                PEMIRA HMIF 2026/2027
              </span>
              <h1 className="text-sm sm:text-base font-bold text-white">
                Verifikasi Keabsahan Berita Acara (BAST)
              </h1>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center rounded-3xl bg-[#1E1E1E] border border-neutral-800 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-hmif-gold" />
            <p className="text-sm font-semibold text-neutral-300">Memvalidasi tanda tangan digital dokumen...</p>
            <p className="text-xs text-neutral-500 font-mono break-all max-w-md mx-auto">{hashParam}</p>
          </div>
        )}

        {/* Error / Invalid State */}
        {!loading && error && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#1E1E1E] border border-red-500/30 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Dokumen Tidak Terverifikasi</h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors"
              >
                Kembali ke Portal Pemira
              </Link>
            </div>
          </div>
        )}

        {/* Success / Valid State */}
        {!loading && data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Status Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#1E1E1E] border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center gap-3.5 text-emerald-400">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
                    Status Dokumen Sah &amp; Asli
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Berita Acara Rekapitulasi Suara Terverifikasi
                  </h2>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Dokumen Berita Acara Rekapitulasi Suara (BAST) ini terbukti autentik, diterbitkan resmi oleh{' '}
                <strong className="text-white">{data.organizer}</strong>, dan tercatat dalam sistem bilik suara digital Pemira HMIF.
              </p>

              {/* SHA-256 Hash Display */}
              <div className="p-3.5 rounded-2xl bg-[#151515] border border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-hmif-gold" />
                    <span>Hash Integritas SHA-256</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-hmif-gold break-all select-all">
                  {data.verifiedHash}
                </div>
              </div>
            </div>

            {/* Rekapitulasi Resmi Ringkas */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#1E1E1E] border border-neutral-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-hmif-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Ringkasan Hasil Rekapitulasi
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Partisipasi: {data.summary.turnoutPercentage}%
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-[#151515] border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block uppercase">Total DPT</span>
                  <span className="text-base sm:text-lg font-bold text-white font-mono">{data.summary.totalDpt}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#151515] border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block uppercase">Suara Masuk</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">{data.summary.totalVotes}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#151515] border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block uppercase">Partisipasi</span>
                  <span className="text-base sm:text-lg font-bold text-hmif-gold font-mono">{data.summary.turnoutPercentage}%</span>
                </div>
              </div>

              {/* Tally Paslon List */}
              <div className="space-y-2">
                <span className="text-[11px] text-neutral-400 font-semibold block uppercase">
                  Perolehan Suara Pasangan Calon &amp; Kotak Kosong:
                </span>
                <div className="space-y-2">
                  {data.summary.tally.map((item) => (
                    <div
                      key={item.candidateNumber}
                      className="p-3 rounded-xl bg-[#151515] border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-hmif-gold text-[11px] font-mono">
                          {item.candidateNumber === 0 ? '0' : item.candidateNumber}
                        </span>
                        <div>
                          <span className="font-semibold text-white block">
                            {item.candidateNumber === 0
                              ? 'Kotak Kosong'
                              : `${item.leaderName} & ${item.viceLeaderName}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white font-mono block">{item.voteCount} suara</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ballot Secrecy Guarantee Badge */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border-l-2 border-hmif-gold text-xs text-neutral-400 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-hmif-gold shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Asas LUBER JURDIL &amp; <strong>Ballot Secrecy</strong> dijamin penuh. Hasil rekapitulasi murni agregasi suara tanpa kaitan ke nomor induk pemilih.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-neutral-500 pt-6 border-t border-neutral-800">
        Komisi Pemilihan Raya (KPR) HMIF Periode 2026/2027 • Telkom University Purwokerto
      </footer>
    </div>
  );
}

export default function BastVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-hmif-gold" />
        </div>
      }
    >
      <BastVerificationContent />
    </Suspense>
  );
}
