'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Calendar,
  Printer,
} from 'lucide-react';

export default function ReceiptPage() {
  const [receiptToken, setReceiptToken] = useState<string>('HMIF-PEMIRA-MEMUAT-TOKEN');
  const [sessionDate, setSessionDate] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleVerifyReceipt = async () => {
    if (!receiptToken || receiptToken.includes('MEMUAT')) return;

    setIsVerifying(true);
    setVerifyStatus(null);

    try {
      const res = await fetch(`/api/receipt/verify?token=${encodeURIComponent(receiptToken)}`);
      const data = await res.json();

      if (data.verified || data.valid) {
        setVerifyStatus(
          `✓ Tanda terima sah dan terverifikasi di server KPR pada ${data.votingSessionDate || 'sesi pemilihan'}.`
        );
      } else {
        setVerifyStatus(`⚠️ ${data.message || 'Tanda terima tidak ditemukan dalam basis data.'}`);
      }
    } catch {
      setVerifyStatus('Gagal memverifikasi tanda terima.');
    } finally {
      setIsVerifying(false);
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
                Bukti Pemungutan Suara
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-xs text-primary font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Hak Suara Digunakan</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-lg flex flex-col gap-5 py-6">
          {/* Official Digital Ballot Pass */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
            {/* Pass Header */}
            <div className="p-6 pb-5 border-b border-outline-variant/20 flex flex-col items-center text-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary"
              >
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </motion.div>

              <div>
                <span className="text-[11px] text-primary uppercase font-bold tracking-wider">
                  Pemira HMIF Telkom University Purwokerto
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
                  Suara Tercatat
                </h1>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Hak suaramu telah resmi tercatat. Terima kasih sudah berpartisipasi!
                </p>
              </div>
            </div>

            {/* Token Section */}
            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-xs text-on-surface-variant uppercase tracking-wider block font-semibold">
                  Token Bukti Pemilihan
                </span>
                <div className="mt-1.5 flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-highest border border-outline-variant/30">
                  <span className="font-mono text-sm sm:text-base font-bold text-primary select-all break-all">
                    {receiptToken}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    type="button"
                    onClick={handleCopy}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-surface-container hover:bg-surface text-on-surface transition-colors flex items-center justify-center shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    title="Salin Token"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-on-surface-variant" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-on-surface-variant text-xs block font-medium">Waktu Pencatatan:</span>
                  <span className="font-medium text-on-surface mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {sessionDate || 'Hari Pemilihan'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-on-surface-variant text-xs block font-medium">Status Pilihan:</span>
                  <span className="font-medium text-on-surface mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    Rahasia (Asas Luber)
                  </span>
                </div>
              </div>

              {/* Verification Button */}
              <div className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifyReceipt}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1.5 font-semibold min-h-[44px] px-3 rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer -mx-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isVerifying ? 'Memeriksa...' : 'Cek Keabsahan Bukti Pemilihan'}</span>
                </motion.button>

                {verifyStatus && (
                  <div className="mt-2 p-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/20">
                    {verifyStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Note & Actions Footer */}
            <div className="p-6 pt-0 flex flex-col gap-3">
              <p className="text-xs text-on-surface-variant text-center leading-relaxed">
                Simpan token ini atau cetak dokumen sebagai bukti sah telah menyalurkan hak suara.
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.print();
                      }
                    }}
                    className="w-full h-11 min-h-[44px] rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/30"
                  >
                    <Printer className="w-4 h-4 text-primary" />
                    <span>Cetak Bukti</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    type="button"
                    onClick={handleLogout}
                    className="w-full h-11 min-h-[44px] rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </motion.button>
                </div>

                <motion.div
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                >
                  <Link
                    href="/"
                    className="w-full h-11 min-h-[44px] rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    Kembali ke Beranda
                  </Link>
                </motion.div>
              </div>
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
