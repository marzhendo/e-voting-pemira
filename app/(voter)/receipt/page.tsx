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
  ArrowRight,
} from 'lucide-react';

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
      // Fallback
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
    <div className="bg-surface text-on-surface font-montserrat antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Top Header */}
      <header className="w-full border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
        <div className="h-16 max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-on-surface uppercase block">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                Bukti Pemilihan
              </span>
            </div>
          </div>

          <a
            href="https://wa.me/6281809300406?text=Halo%20Panitia%20KPR%20Pemira%20HMIF%2C%20saya%20sudang%20menyelesaikan%20pemilihan%20dan%20ingin%20menanyakan%20informasi%20terkait%20bukti%20suara."
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bantuan Panitia KPR via WhatsApp"
            className="text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <HelpCircle className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
            <span className="hidden sm:inline">Bantuan KPR</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-md py-4">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-6 sm:p-7 flex flex-col gap-5 shadow-sm">
            {/* Header: Sapaan Sederhana */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-0.5">
                <Check className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight" style={{ textWrap: 'balance' }}>
                Suara Kamu Sudah Masuk
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs leading-relaxed" style={{ textWrap: 'pretty' }}>
                Terima kasih sudah memilih. Pilihanmu tersimpan rahasia dan tidak dapat diubah lagi.
              </p>
            </div>

            {/* Kode Bukti */}
            <div className="p-3.5 rounded-xl bg-surface-container-highest border border-outline-variant/30 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-on-surface-variant block">Kode Bukti</span>
                <span className="font-mono text-sm sm:text-base font-semibold text-primary block truncate tabular-nums select-all">
                  {receiptToken}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Kode berhasil disalin" : "Salin kode bukti"}
                className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface text-on-surface text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400 font-medium">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-on-surface-variant" aria-hidden="true" />
                    <span>Salin</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Waktu Pemilihan */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant px-1 -mt-1">
              <span>Waktu pemilihan</span>
              <span className="font-medium text-on-surface tabular-nums">{sessionDate}</span>
            </div>

            {/* Rekapitulasi Suara / Partisipasi */}
            <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>{tallyData?.isClosed ? 'Hasil Suara' : 'Partisipasi Pemilih'}</span>
                </span>
                {loadingTally ? (
                  <span className="text-on-surface-variant text-[11px]">Memuat...</span>
                ) : (
                  <span className="font-medium text-on-surface-variant tabular-nums">
                    {tallyData?.turnout?.turnoutPercentage ?? 0}% ({tallyData?.turnout?.totalVotes?.toLocaleString('id-ID') ?? 0} dari {tallyData?.turnout?.totalDpt?.toLocaleString('id-ID') ?? 0} pemilih)
                  </span>
                )}
              </div>

              {/* Saat Bilik Suara Aktif */}
              {!loadingTally && !tallyData?.isClosed && (
                <div className="flex flex-col gap-2">
                  <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, tallyData?.turnout?.turnoutPercentage ?? 0)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Perolehan tiap pasangan calon dibuka setelah pemilihan ditutup.
                  </p>
                </div>
              )}

              {/* Saat Bilik Suara Selesai / Ditutup */}
              {!loadingTally && tallyData?.isClosed && tallyData.results && (
                <div className="flex flex-col gap-2 pt-1">
                  {tallyData.results.map((item) => {
                    const isKotakKosong = item.candidateNumber === 0;
                    return (
                      <div
                        key={item.candidateId}
                        className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-on-surface truncate pr-2">
                            {isKotakKosong
                              ? 'Kotak Kosong'
                              : `${String(item.candidateNumber).padStart(2, '0')}. ${item.leaderName} & ${item.viceLeaderName}`}
                          </span>
                          <span className="font-mono text-on-surface font-semibold tabular-nums shrink-0">
                            {item.voteCount.toLocaleString('id-ID')} suara ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${isKotakKosong ? 'bg-on-surface-variant/40' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tautan Ringkas ke Halaman Rekapitulasi Lengkap */}
              {!loadingTally && (
                <Link
                  href="/rekapitulasi"
                  className="print:hidden min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/25 flex items-center justify-between text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none group"
                >
                  <span>
                    {tallyData?.isClosed
                      ? 'Lihat rekapitulasi lengkap'
                      : 'Lihat partisipasi per angkatan'}
                  </span>
                  <ArrowRight
                    className="w-3.5 h-3.5 text-primary transition-transform group-hover:translate-x-0.5 shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </div>

            {/* Aksi Selesai / Keluar */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                  className="h-11 px-4 rounded-xl border border-outline-variant/30 hover:border-outline bg-surface-container-high hover:bg-surface-bright text-xs font-semibold text-on-surface flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <Printer className="w-4 h-4 text-on-surface-variant" aria-hidden="true" />
                  <span>Cetak</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                  type="button"
                  onClick={handleLogout}
                  className="h-11 px-4 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Keluar</span>
                </motion.button>
              </div>

              <Link
                href="/"
                className="w-full h-10 rounded-xl hover:bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface font-medium flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/20 py-4 text-center text-xs text-on-surface-variant font-medium">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Komisi Pemilihan Raya • HMIF Telkom University Purwokerto</span>
          <span>Periode 2026/2027</span>
        </div>
      </footer>
    </div>
  );
}
