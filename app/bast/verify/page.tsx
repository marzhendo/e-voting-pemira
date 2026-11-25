'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Search,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const hashParam = searchParams.get('hash')?.trim() || '';

  const [manualHash, setManualHash] = useState(hashParam);
  const [loading, setLoading] = useState(Boolean(hashParam));
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyHash = useCallback(async (targetHash: string) => {
    const clean = targetHash.trim();
    if (!clean) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/bast/verify?hash=${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.valid) {
        throw new Error(
          json.error || 'Dokumen Berita Acara tidak dapat diverifikasi oleh sistem.'
        );
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memeriksa kode dokumen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setManualHash(hashParam);
    verifyHash(hashParam);
  }, [hashParam, verifyHash]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualHash.trim();
    if (!clean) {
      setError('Masukkan 64 karakter kode verifikasi dari dokumen Berita Acara.');
      return;
    }
    router.replace(`/bast/verify?hash=${encodeURIComponent(clean)}`);
  };

  const handleCopyHash = async () => {
    if (!data?.verifiedHash) return;
    try {
      await navigator.clipboard.writeText(data.verifiedHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Abaikan jika clipboard diblokir browser
    }
  };

  const hasQueryHash = Boolean(hashParam);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-montserrat antialiased flex flex-col justify-between overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* Top Header */}
      <header className="w-full border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider block leading-tight truncate">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium block leading-tight truncate">
                Verifikasi Berita Acara (BAST)
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Viewport Content */}
      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
        className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
      >
        {/* Loading State */}
        {loading && (
          <div className="p-10 sm:p-12 text-center rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-primary" aria-hidden="true" />
            <p className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Memeriksa keaslian dokumen...
            </p>
            {hashParam && (
              <p className="text-[11px] text-on-surface-variant/80 font-mono break-all max-w-md mx-auto">
                {hashParam}
              </p>
            )}
          </div>
        )}

        {/* Empty State (Visited without ?hash=): Clean Manual Check Form */}
        {!loading && !hasQueryHash && !error && !data && (
          <section
            aria-label="Cek Kode Berita Acara"
            className="rounded-2xl bg-surface-container border border-outline-variant/30 p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Pemeriksaan Dokumen Resmi</span>
              </div>
              <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide uppercase text-on-surface text-balance leading-tight">
                Verifikasi Berita Acara (BAST)
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-pretty">
                Pindai QR Code pada dokumen Berita Acara cetak dari Panitia KPR, atau masukkan 64 karakter kode verifikasi dokumen di bawah ini.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="bast-hash-input"
                  className="text-xs font-semibold text-on-surface block mb-2"
                >
                  Kode Verifikasi Dokumen (64 Karakter)
                </label>
                <input
                  id="bast-hash-input"
                  type="text"
                  value={manualHash}
                  onChange={(e) => setManualHash(e.target.value)}
                  placeholder="Contoh: 8F3A19C0..."
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs sm:text-sm font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                type="submit"
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                <span>Cek Keabsahan Dokumen</span>
              </motion.button>
            </form>
          </section>
        )}

        {/* Error / Mismatch State */}
        {!loading && error && (
          <section
            aria-label="Hasil Verifikasi Gagal"
            className="rounded-2xl bg-surface-container border border-error/30 p-6 sm:p-8 text-center space-y-5"
          >
            <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/25 flex items-center justify-center mx-auto text-error">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface">
                Dokumen Tidak Cocok
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-pretty">
                {error}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                type="button"
                onClick={() => {
                  setError(null);
                  setManualHash('');
                  router.replace('/bast/verify');
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright border border-outline-variant/30 text-xs font-semibold text-on-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                Masukkan Kode Lain
              </motion.button>
            </div>
          </section>
        )}

        {/* Success / Verified State */}
        {!loading && data && (
          <div className="space-y-6">
            {/* Block 1: Authentic Status & Reference Code */}
            <section
              aria-label="Status Keabsahan Berita Acara"
              className="rounded-2xl bg-surface-container border border-emerald-500/35 p-5 sm:p-7 space-y-5"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Dokumen Resmi Terverifikasi
                  </span>
                  <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface mt-0.5 leading-tight text-balance">
                    Berita Acara Sah &amp; Sesuai Sistem
                  </h1>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-pretty">
                Berita Acara ini resmi diterbitkan oleh{' '}
                <strong className="text-on-surface">{data.organizer}</strong> dan datanya cocok dengan catatan sistem.
              </p>

              {/* Document Verification Code Box */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                  <span className="font-semibold uppercase tracking-wider">
                    Kode Verifikasi (SHA-256)
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    type="button"
                    onClick={handleCopyHash}
                    aria-label={copied ? 'Kode verifikasi berhasil disalin' : 'Salin kode verifikasi'}
                    className="min-h-[44px] px-2.5 -my-2 rounded-lg hover:bg-surface-container-high hover:text-on-surface transition-colors inline-flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400 font-semibold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Salin</span>
                      </>
                    )}
                  </motion.button>
                </div>
                <div className="font-mono text-xs text-primary break-all select-all">
                  {data.verifiedHash}
                </div>
              </div>
            </section>

            {/* Block 2: Clean Vote Tally Summary */}
            <section
              aria-label="Rekapitulasi Suara pada Berita Acara"
              className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden"
            >
              <div className="p-5 sm:p-7 space-y-4 border-b border-outline-variant/20">
                <h2 className="font-bebas text-2xl tracking-wide uppercase text-on-surface">
                  Rekapitulasi Suara Resmi
                </h2>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/25">
                    <span className="text-[10px] sm:text-[11px] text-on-surface-variant block uppercase font-semibold tracking-wider">
                      Total DPT
                    </span>
                    <span className="font-bebas text-2xl sm:text-3xl text-on-surface tabular-nums leading-none mt-1 block">
                      {data.summary.totalDpt.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/25">
                    <span className="text-[10px] sm:text-[11px] text-on-surface-variant block uppercase font-semibold tracking-wider">
                      Suara Masuk
                    </span>
                    <span className="font-bebas text-2xl sm:text-3xl text-emerald-400 tabular-nums leading-none mt-1 block">
                      {data.summary.totalVotes.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/25">
                    <span className="text-[10px] sm:text-[11px] text-on-surface-variant block uppercase font-semibold tracking-wider">
                      Partisipasi
                    </span>
                    <span className="font-bebas text-2xl sm:text-3xl text-primary tabular-nums leading-none mt-1 block">
                      {data.summary.turnoutPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-outline-variant/20">
                {data.summary.tally.map((item) => {
                  const isKotakKosong = item.candidateNumber === 0;
                  return (
                    <div
                      key={item.candidateNumber}
                      className="px-5 py-4 sm:px-7 flex items-center justify-between gap-4 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center font-bebas text-lg text-primary shrink-0 tabular-nums">
                          {isKotakKosong ? '00' : String(item.candidateNumber).padStart(2, '0')}
                        </span>
                        <span className="font-semibold text-on-surface break-words">
                          {isKotakKosong
                            ? 'Kotak Kosong'
                            : `${item.leaderName} & ${item.viceLeaderName}`}
                        </span>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        <span className="font-bold text-on-surface block">
                          {item.voteCount.toLocaleString('id-ID')} suara
                        </span>
                        <span className="text-xs text-primary font-semibold">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3.5 sm:px-7 bg-surface-container-low/60 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                Dihitung dari Surat Suara Anonim tanpa catatan identitas maupun NIM pemilih.
              </div>
            </section>
          </div>
        )}
      </motion.main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/20 bg-surface-container-low/50 py-5 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant text-center sm:text-left">
          <p>Surat Suara Anonim terpisah dari identitas pemilih.</p>
          <p>Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto</p>
        </div>
      </footer>
    </div>
  );
}

export default function BastVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface">
          <Loader2 className="w-7 h-7 animate-spin text-primary" aria-hidden="true" />
        </div>
      }
    >
      <BastVerificationContent />
    </Suspense>
  );
}
