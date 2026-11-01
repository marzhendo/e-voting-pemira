'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Calendar,
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

      if (data.verified) {
        setVerifyStatus(
          `✓ Tanda terima sah dan terverifikasi di server KPR pada ${data.votingSessionDate}.`
        );
      } else {
        setVerifyStatus('⚠️ Tanda terima tidak ditemukan dalam basis data.');
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
    <div className="bg-background text-on-surface font-montserrat antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Top Header */}
      <header className="w-full border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
        <div className="h-16 max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              HMIF
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-on-surface uppercase block">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[10px] text-outline">
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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg flex flex-col gap-5 py-6">
          {/* Official Digital Ballot Pass */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-xl overflow-hidden">
            {/* Pass Header */}
            <div className="p-6 pb-5 border-b border-outline-variant/20 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div>
                <span className="text-[11px] text-primary uppercase font-bold tracking-wider">
                  Pemira HMIF Telkom University Purwokerto
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">
                  Suara Berhasil Dikirim
                </h1>
                <p className="text-xs text-outline mt-1">
                  Terima kasih atas partisipasi aktif Anda dalam suksesi kepengurusan HMIF.
                </p>
              </div>
            </div>

            {/* Token Section */}
            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-[11px] text-outline uppercase tracking-wider block font-medium">
                  Token Bukti Pemilihan
                </span>
                <div className="mt-1.5 flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-highest border border-outline-variant/30">
                  <span className="font-mono text-sm sm:text-base font-bold text-primary select-all break-all">
                    {receiptToken}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-surface-container hover:bg-surface text-on-surface transition-colors shrink-0"
                    title="Salin Token"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-outline" />
                    )}
                  </button>
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-outline text-[11px] block">Waktu Pencatatan:</span>
                  <span className="font-medium text-on-surface mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {sessionDate || 'Hari Pemilihan'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-outline text-[11px] block">Status Pilihan:</span>
                  <span className="font-medium text-on-surface mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    Dirahasiakan (LUBER)
                  </span>
                </div>
              </div>

              {/* Verification Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifyReceipt}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isVerifying ? 'Memeriksa...' : 'Verifikasi Keabsahan Token di Server'}</span>
                </button>

                {verifyStatus && (
                  <div className="mt-2 p-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/20">
                    {verifyStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Note & Actions Footer */}
            <div className="p-6 pt-0 flex flex-col gap-3">
              <p className="text-[11px] text-outline text-center leading-relaxed">
                Pilihan Anda bersifat rahasia dan tidak dapat diubah kembali. Simpan token ini sebagai bukti partisipasi.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Selesai &amp; Keluar</span>
                </button>

                <Link
                  href="/"
                  className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold text-center transition-colors"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/20 py-3 text-center text-xs text-outline">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>KPR HMIF Telkom University Purwokerto 2026/2027</span>
          <span>© 2026 HMIF Telkom University Purwokerto</span>
        </div>
      </footer>
    </div>
  );
}
