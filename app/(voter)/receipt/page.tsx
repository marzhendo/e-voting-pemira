'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  LogOut,
  Printer,
  BarChart2,
  HelpCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { KPR_WHATSAPP_URL } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

interface TallyResultItem {
  candidateId: string;
  candidateNumber: number;
  leaderName: string;
  viceLeaderName: string;
  voteCount: number;
  percentage: number;
}

interface TallyData {
  isClosed: boolean;
  turnout: {
    totalDpt: number;
    totalVotes: number;
    turnoutPercentage: number;
  };
  message?: string;
  results?: TallyResultItem[];
}

export default function ReceiptPage() {
  const [receiptToken, setReceiptToken] = useState<string>('HMIF-PEMIRA-MEMUAT-TOKEN');
  const [sessionDate, setSessionDate] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [tallyData, setTallyData] = useState<TallyData | null>(null);
  const [loadingTally, setLoadingTally] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTally() {
      try {
        const res = await fetch('/api/election/tally', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setTallyData(data);
          }
        }
      } catch {
        // Fallback jika jaringan offline
      } finally {
        if (isMounted) setLoadingTally(false);
      }
    }
    fetchTally();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hmif_receipt_token');
      const dateStored = sessionStorage.getItem('hmif_receipt_date');

      if (stored) {
        setReceiptToken(stored);
      } else {
        setReceiptToken('HMIF-PEMIRA-SUARA-TERCATAT');
      }

      if (dateStored) {
        setSessionDate(dateStored);
      } else {
        const now = new Date();
        setSessionDate(
          now.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        );
      }
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Abaikan jika clipboard diblokir browser
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      sessionStorage.clear();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-[100dvh] flex flex-col justify-between selection:bg-primary selection:text-on-primary overflow-x-hidden">
      {/* Top Header */}
      <header className="print:hidden w-full border-b border-outline-variant bg-surface/95 backdrop-blur-sm">
        <div className="h-16 max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
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
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-on-surface tracking-tight block truncate">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium block truncate">
                Tanda Terima Pemilihan
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <a
              href={`${KPR_WHATSAPP_URL}?text=Halo%20Panitia%20KPR%20Pemira%20HMIF%2C%20saya%20sudah%20menyelesaikan%20pemilihan%20dan%20ingin%20menanyakan%20informasi%20terkait%20Tanda%20Terima%20Pemilihan.`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Bantuan Panitia KPR via WhatsApp"
              className="text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <HelpCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Bantuan KPR</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        id="main-content"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
        className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12"
      >
        <div className="w-full max-w-md">
          <div className="bg-surface-container rounded-2xl border border-outline-variant p-6 sm:p-7 flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center mb-1">
                <Check className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
              </div>
              <h1 className="font-display text-2xl font-extrabold text-on-surface tracking-tight">
                Tanda Terima Pemilihan
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs leading-relaxed">
                Hak suaramu telah tercatat sebagai Surat Suara Anonim dan tidak dapat diubah kembali.
              </p>
            </div>

            {/* Kode Tanda Terima */}
            <div className="p-4 rounded-xl bg-surface-highlight border border-outline-variant flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-on-surface-variant block">
                  Kode Tanda Terima Pemilihan
                </span>
                <span className="font-mono text-sm sm:text-base font-semibold text-on-surface block truncate tabular-nums select-all mt-0.5">
                  {receiptToken}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Kode berhasil disalin' : 'Salin kode tanda terima'}
                className="print:hidden min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold transition-[color,background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" strokeWidth={2} aria-hidden="true" />
                    <span className="text-emerald-700 dark:text-emerald-400">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden="true" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            {/* Waktu Pemilihan */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
              <span>Tanggal pencatatan</span>
              <span className="font-mono font-semibold text-on-surface tabular-nums">
                {sessionDate}
              </span>
            </div>

            {/* Rekapitulasi Suara / Partisipasi */}
            <div className="pt-4 border-t border-outline-variant flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-on-surface flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-tertiary" strokeWidth={1.75} aria-hidden="true" />
                  <span>{tallyData?.isClosed ? 'Rekapitulasi Suara' : 'Partisipasi Pemilih'}</span>
                </span>
                {loadingTally ? (
                  <span className="text-on-surface-variant text-xs">Memuat...</span>
                ) : (
                  <span className="font-mono font-semibold text-on-surface-variant tabular-nums">
                    {tallyData?.turnout?.turnoutPercentage ?? 0}% ({tallyData?.turnout?.totalVotes?.toLocaleString('id-ID') ?? 0}/{tallyData?.turnout?.totalDpt?.toLocaleString('id-ID') ?? 0})
                  </span>
                )}
              </div>

              {!loadingTally && !tallyData?.isClosed && (
                <div className="flex flex-col gap-2">
                  <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.min(100, tallyData?.turnout?.turnoutPercentage ?? 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Perolehan suara tiap pasangan calon dibuka setelah pemungutan suara ditutup resmi.
                  </p>
                </div>
              )}

              {!loadingTally && tallyData?.isClosed && tallyData.results && (
                <div className="flex flex-col gap-2 pt-1">
                  {tallyData.results.map((item) => {
                    const isKotakKosong = item.candidateNumber === 0;
                    return (
                      <div
                        key={item.candidateId}
                        className="p-3 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-semibold text-on-surface truncate">
                            {isKotakKosong
                              ? 'Kotak Kosong'
                              : `${String(item.candidateNumber).padStart(2, '0')}. ${item.leaderName} & ${item.viceLeaderName}`}
                          </span>
                          <span className="font-mono text-on-surface font-semibold tabular-nums shrink-0">
                            {item.voteCount.toLocaleString('id-ID')} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-[width] duration-500 ${isKotakKosong ? 'bg-on-surface-variant/60' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loadingTally && (
                <Link
                  href="/rekapitulasi"
                  className="print:hidden min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant flex items-center justify-center text-xs font-semibold text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {tallyData?.isClosed
                    ? 'Lihat Rekapitulasi Suara Lengkap'
                    : 'Lihat Partisipasi Pemilih per Angkatan'}
                </Link>
              )}
            </div>

            {/* Aksi Selesai / Keluar */}
            <div className="print:hidden pt-2 flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                  className="min-h-[44px] px-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container-high text-xs sm:text-sm font-semibold text-on-surface flex items-center justify-center gap-2 transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Printer className="w-4 h-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden="true" />
                  <span>Cetak</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] px-4 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              </div>

              <Link
                href="/"
                className="w-full min-h-[44px] rounded-xl hover:bg-surface-container-high text-xs sm:text-sm text-on-surface-variant hover:text-on-surface font-medium flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </motion.main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
