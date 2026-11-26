'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

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
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans antialiased flex flex-col justify-between overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <SiteHeader subtitle="Verifikasi Berita Acara (BAST)" />

      <motion.main
        id="main-content"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
        className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
      >
        {/* Loading State */}
        {loading && (
          <div className="p-10 sm:p-12 text-center rounded-2xl bg-surface-container border border-outline-variant space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-tertiary" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Memeriksa keaslian dokumen Berita Acara...
            </p>
            {hashParam && (
              <p className="text-[11px] text-on-surface-variant font-mono break-all max-w-md mx-auto">
                {hashParam}
              </p>
            )}
          </div>
        )}

        {/* Empty State: Manual Check Form */}
        {!loading && !hasQueryHash && !error && !data && (
          <section
            aria-label="Cek Kode Berita Acara"
            className="rounded-2xl bg-surface-container border border-outline-variant p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-tertiary">
                <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Pemeriksaan Dokumen Resmi</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface leading-tight">
                Verifikasi Berita Acara (BAST)
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Pindai QR Code pada dokumen Berita Acara cetak dari Panitia KPR HMIF, atau masukkan 64 karakter kode verifikasi dokumen di bawah ini.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5" noValidate>
              <div>
                <label
                  htmlFor="bast-hash-input"
                  className="text-xs font-semibold text-on-surface block mb-1.5"
                >
                  Kode Verifikasi Dokumen (64 Karakter SHA-256)
                </label>
                <input
                  id="bast-hash-input"
                  type="text"
                  value={manualHash}
                  onChange={(e) => setManualHash(e.target.value)}
                  placeholder="Tempel 64 karakter kode verifikasi SHA-256"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs sm:text-sm font-mono text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-[color,background-color,border-color,box-shadow] duration-150"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-sm font-bold inline-flex items-center justify-center gap-2 transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Search className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                <span>Cek Keabsahan Dokumen</span>
              </button>
            </form>
          </section>
        )}

        {/* Error / Mismatch State */}
        {!loading && error && (
          <section
            role="alert"
            aria-label="Hasil Verifikasi Gagal"
            className="rounded-2xl bg-surface-container border border-error/40 p-6 sm:p-8 text-center space-y-5"
          >
            <div className="w-12 h-12 rounded-xl bg-error-container dark:bg-error-container/40 border border-error/30 flex items-center justify-center mx-auto text-error">
              <AlertTriangle className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
                Dokumen Tidak Cocok
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {error}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setManualHash('');
                  router.replace('/bast/verify');
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-xs sm:text-sm font-semibold text-on-surface transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Masukkan Kode Lain
              </button>
            </div>
          </section>
        )}

        {/* Success / Verified State */}
        {!loading && data && (
          <div className="space-y-6">
            <section
              aria-label="Status Keabsahan Berita Acara"
              className="rounded-2xl bg-surface-container border border-emerald-600/40 dark:border-emerald-500/40 p-5 sm:p-7 space-y-5"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/30 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400" strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                    Dokumen Resmi Terverifikasi
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface mt-0.5 leading-tight">
                    Berita Acara Sah &amp; Sesuai Sistem
                  </h1>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Berita Acara ini resmi diterbitkan oleh{' '}
                <strong className="text-on-surface">{data.organizer}</strong> dan datanya cocok dengan catatan sistem.
              </p>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                  <span className="font-semibold">Kode Verifikasi (SHA-256)</span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    aria-label={copied ? 'Kode verifikasi berhasil disalin' : 'Salin kode verifikasi'}
                    className="min-h-[44px] px-3 -my-2 rounded-lg hover:bg-surface-container-high hover:text-on-surface transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" strokeWidth={2} aria-hidden="true" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-tertiary font-medium break-all select-all">
                  {data.verifiedHash}
                </div>
              </div>
            </section>

            {/* Rekapitulasi Suara pada BAST */}
            <section
              aria-label="Rekapitulasi Suara pada Berita Acara"
              className="rounded-2xl bg-surface-container border border-outline-variant overflow-hidden"
            >
              <div className="p-5 sm:p-7 space-y-4 border-b border-outline-variant">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
                  Rekapitulasi Suara Resmi
                </h2>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                    <span className="text-[11px] text-on-surface-variant block font-semibold">
                      Total DPT
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-on-surface tabular-nums leading-none mt-1.5 block">
                      {data.summary.totalDpt.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                    <span className="text-[11px] text-on-surface-variant block font-semibold">
                      Suara Masuk
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums leading-none mt-1.5 block">
                      {data.summary.totalVotes.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
                    <span className="text-[11px] text-on-surface-variant block font-semibold">
                      Partisipasi
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-tertiary tabular-nums leading-none mt-1.5 block">
                      {data.summary.turnoutPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-outline-variant">
                {data.summary.tally.map((item) => {
                  const isKotakKosong = item.candidateNumber === 0;
                  return (
                    <div
                      key={item.candidateNumber}
                      className="px-5 py-4 sm:px-7 flex items-center justify-between gap-4 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0 tabular-nums ${
                            isKotakKosong
                              ? 'bg-surface-container-high border border-outline-variant text-on-surface-variant'
                              : 'bg-primary text-on-primary'
                          }`}
                        >
                          {isKotakKosong ? '00' : String(item.candidateNumber).padStart(2, '0')}
                        </span>
                        <span className="font-semibold text-on-surface break-words">
                          {isKotakKosong
                            ? 'Kotak Kosong'
                            : `${item.leaderName} & ${item.viceLeaderName}`}
                        </span>
                      </div>

                      <div className="text-right shrink-0 font-mono tabular-nums">
                        <span className="font-bold text-on-surface block">
                          {item.voteCount.toLocaleString('id-ID')} suara
                        </span>
                        <span className="text-xs text-tertiary font-semibold">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3.5 sm:px-7 bg-surface-container-low border-t border-outline-variant text-xs text-on-surface-variant">
                Dihitung dari Surat Suara Anonim tanpa catatan identitas maupun NIM pemilih.
              </div>
            </section>
          </div>
        )}
      </motion.main>

      <SiteFooter />
    </div>
  );
}

export default function BastVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface">
          <Loader2 className="w-7 h-7 animate-spin text-tertiary" strokeWidth={1.75} aria-hidden="true" />
        </div>
      }
    >
      <BastVerificationContent />
    </Suspense>
  );
}
