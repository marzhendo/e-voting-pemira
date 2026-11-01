'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Info,
  Calendar,
  Vote,
} from 'lucide-react';

export default function ReceiptPage() {
  const [receiptToken, setReceiptToken] = useState<string>('HMIF-PEMIRA-MEMUAT-TOKEN');
  const [sessionDate, setSessionDate] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Ambil receipt dari sessionStorage jika tersedia dari alur voting langsung
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('hmif_receipt_token');
      const dateStored = sessionStorage.getItem('hmif_receipt_date');

      if (stored) {
        setReceiptToken(stored);
      } else {
        // Fallback jika pemilih me-refresh halaman atau masuk kembali setelah memilih
        setReceiptToken('HMIF-PEMIRA-TERCATAT-DI-LEDGER');
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
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback copy
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
          `✓ Tanda terima valid dan terdaftar resmi di basis data KPR pada tanggal ${data.votingSessionDate}.`
        );
      } else {
        setVerifyStatus('⚠️ Tanda terima tidak ditemukan atau format hash tidak cocok.');
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
    <div className="bg-background text-on-surface font-montserrat antialiased min-h-screen flex flex-col justify-between selection:bg-primary-container selection:text-on-primary">
      {/* Top Fixed Header */}
      <header className="fixed top-0 w-full z-40 bg-surface-container-low/95 backdrop-blur-md shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45)] border-b border-outline-variant/30">
        <div className="h-16 max-w-5xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-2 rounded-lg bg-surface-container text-primary">
              <Vote className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-on-surface uppercase">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[10px] text-outline uppercase tracking-wider hidden sm:inline">
                KPR HMIF Electronic Voting Chamber
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] text-primary uppercase font-bold tracking-wider">
                Hak Suara Digunakan
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-background flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="relative w-full max-w-xl mx-auto flex flex-col gap-6 py-6">
          {/* Top Authority Status Header */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center shadow-xl border border-outline-variant/30">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <CheckCircle className="w-10 h-10 fill-primary/20 stroke-primary stroke-[2.5]" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-container" />
              </span>
            </div>

            <div className="flex flex-col gap-1 max-w-md">
              <div className="inline-flex items-center justify-center gap-1.5 self-center px-3 py-0.5 rounded-full bg-surface-container-high text-primary text-[11px] uppercase tracking-widest font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Tercatat di Sistem Resmi</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-montserrat font-bold text-on-surface uppercase tracking-tight mt-1">
                Suara Berhasil Dikirim
              </h1>
              <p className="text-xs sm:text-sm text-outline">
                Terima kasih telah berpartisipasi dalam Pemira HMIF 2026/2027.
              </p>
            </div>
          </div>

          {/* Submission Status Card */}
          <div className="bg-surface-container-low rounded-xl p-5 sm:p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                Status Pemungutan Suara
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container-highest">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                  Tervalidasi
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm sm:text-base text-on-surface font-semibold">
                  Suara berhasil tercatat di ledger
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Sistem telah mengonfirmasi penerimaan surat suara Anda secara sah ke dalam basis data pemilihan melalui transaksi terisolasi.
              </p>
            </div>

            <div className="bg-surface-container rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-on-surface border border-outline-variant/20">
              <div className="flex flex-col">
                <span className="text-[10px] text-outline uppercase font-semibold">
                  Tanggal Pengiriman
                </span>
                <span className="text-xs sm:text-sm text-on-surface font-mono flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {sessionDate || 'Hari Pemilihan'} • Asia/Jakarta (WIB)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Terverifikasi Sistem</span>
              </div>
            </div>
          </div>

          {/* Simplified Receipt Reference Card */}
          <div className="bg-surface-container-low rounded-xl p-5 sm:p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-on-surface">
                  Referensi Bukti Pengiriman
                </span>
                <span className="text-[10px] text-outline uppercase font-semibold">
                  Kode Resmi KPR
                </span>
              </div>
              <p className="text-xs text-outline leading-relaxed">
                Simpan kode token unik berikut sebagai referensi resmi bahwa Anda telah menunaikan hak suara.
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-outline-variant/30">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                    Nomor Token Tanda Terima
                  </span>
                  <span className="font-bebas text-lg sm:text-2xl text-primary tracking-widest font-mono select-all break-all">
                    {receiptToken}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm border border-outline-variant/30"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tombol Uji Verifikasi Tanda Terima */}
            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleVerifyReceipt}
                className="text-xs text-primary hover:text-secondary-fixed transition-colors inline-flex items-center gap-1.5 font-semibold self-start"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Memvalidasi hash...' : 'Uji Verifikasi Bukti di Server'}</span>
              </button>

              {verifyStatus && (
                <div className="p-3 rounded-lg bg-surface-container text-xs text-on-surface border border-outline-variant/20">
                  {verifyStatus}
                </div>
              )}
            </div>
          </div>

          {/* Jaminan Kerahasiaan Suara (Asas Luberjurdil) */}
          <div className="bg-surface-container rounded-xl p-4 shadow-sm flex items-start gap-3 border border-outline-variant/20">
            <div className="p-2 rounded-lg bg-surface-container-high text-primary shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 text-left text-xs">
              <span className="font-bold text-on-surface uppercase tracking-wider">
                Jaminan Kerahasiaan Suara (Ballot Secrecy)
              </span>
              <p className="text-on-surface-variant leading-relaxed">
                Bukti tanda terima ini hanya membuktikan bahwa Anda telah menggunakan hak suara. Pilihan kandidat Anda tetap rahasia murni dan secara sengaja <strong className="text-on-surface">tidak ditampilkan pada halaman ini</strong> sesuai asas Luberjurdil.
              </p>
              <span className="text-[10px] text-outline mt-1">
                Pasal 14 Ayat (3) Peraturan Pemira HMIF: Pilihan pemilih diputus dari data identitas SSO.
              </span>
            </div>
          </div>

          {/* Closing Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3.5 px-6 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Selesai &amp; Keluar Sesi</span>
            </button>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-semibold uppercase tracking-wider text-center transition-colors border border-outline-variant/20"
            >
              Kembali ke Beranda Portal
            </Link>
          </div>

          {/* Immutability Advisory */}
          <div className="flex items-center justify-center gap-1.5 text-center pt-1 text-xs text-outline">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Hak pilih telah digunakan. Tidak ada opsi untuk memilih ulang atau mengubah suara.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 py-4 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-outline">
          <span>Komisi Pemilihan Raya (KPR) HMIF 2026/2027</span>
          <span>© 2026 HMIF Telkom University Purwokerto</span>
        </div>
      </footer>
    </div>
  );
}
