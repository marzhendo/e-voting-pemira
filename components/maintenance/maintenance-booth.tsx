'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ShieldAlert,
  RefreshCw,
  MessageCircle,
  LogOut,
  ShieldCheck,
  Lock,
  Clock,
  Loader2,
} from 'lucide-react';

interface MaintenanceBoothProps {
  onRefresh: () => Promise<void>;
  isChecking?: boolean;
  lastCheckedTime?: string | null;
}

export function MaintenanceBooth({
  onRefresh,
  isChecking = false,
  lastCheckedTime,
}: MaintenanceBoothProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Abaikan error jaringan saat logout
    } finally {
      window.location.href = '/login';
    }
  };

  const whatsappUrl =
    'https://wa.me/6281809300406?text=Halo%20Panitia%20KPR%20Pemira%20HMIF%2C%20saya%20sedang%20berada%20di%20bilik%20suara%20dan%20ingin%20menanyakan%20status%20pemeliharaan%20teknis.';

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 w-full border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 shrink-0">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF Telkom University Purwokerto"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bebas text-lg tracking-wider uppercase text-on-surface leading-tight">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Telkom University Purwokerto
              </span>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pusat Bantuan KPR via WhatsApp"
            className="text-on-surface-variant hover:text-primary text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <MessageCircle className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Pusat Bantuan KPR</span>
          </a>
        </div>
      </header>

      {/* Main Interstitial Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-page-enter">
        <div className="w-full max-w-xl bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-primary/5 transition-all duration-200">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-hmif-dark border border-hmif-gold/40 text-xs font-semibold text-hmif-gold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hmif-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-hmif-gold" />
              </span>
              <span>PEMELIHARAAN SISTEM BERLANGSUNG</span>
            </div>
          </div>

          {/* Headline & Brief Explanation */}
          <div className="text-center space-y-3 mb-8">
            <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl tracking-wide uppercase text-on-surface leading-none">
              Bilik Suara Ditangguhkan Sementara
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-lg mx-auto">
              Panitia KPR dan Tim Pengembang HMIF sedang melakukan pemeliharaan infrastruktur dan validasi integritas data bilik suara.
            </p>
          </div>

          {/* Fact-based Guarantees (No AI Slop, Direct & Transparent) */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20">
              <div className="p-2 rounded-xl bg-hmif-gold/10 text-hmif-gold shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-on-surface">Data Suara Aman & Terenkripsi</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                  Seluruh hak suara yang telah dikirimkan sebelum masa pemeliharaan tersimpan utuh tanpa perubahan dalam basis data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20">
              <div className="p-2 rounded-xl bg-hmif-gold/10 text-hmif-gold shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-on-surface">Asas LUBER JURDIL Terjamin</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                  Kerahasiaan pilihan pemilih tetap dilindungi. Tidak ada pihak yang dapat mengakses atau mengubah suara sah pemilih.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20">
              <div className="p-2 rounded-xl bg-hmif-gold/10 text-hmif-gold shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-on-surface">Pemulihan Akses Otomatis</h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                  Bilik suara akan dibuka kembali segera setelah pemeriksaan teknis diselesaikan oleh Administrator. Sesi Anda tetap aktif di peramban ini.
                </p>
              </div>
            </div>
          </div>

          {/* Action Affordances */}
          <div className="space-y-3">
            {/* Primary Action: Recheck Status */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isChecking}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-xs uppercase tracking-wider bg-primary text-on-primary hover:bg-secondary transition-all shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Memeriksa Status Sistem...' : 'Periksa Status Sekarang'}</span>
            </button>

            {/* Secondary Action: WhatsApp Support */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-xs text-on-surface hover:text-primary bg-surface-container-high/80 hover:bg-surface-container-high border border-outline-variant/30 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Hubungi Panitia KPR via WhatsApp</span>
            </a>
          </div>

          {/* Last checked feedback & subtle logout */}
          <div className="mt-6 pt-5 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-on-surface-variant">
            <span>
              {lastCheckedTime ? `Terakhir diperiksa: ${lastCheckedTime}` : 'Status diperbarui secara berkala'}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 hover:text-error transition-colors min-h-[36px] px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>Keluar dari Bilik Suara</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-[11px] text-on-surface-variant border-t border-outline-variant/15">
        <p className="max-w-4xl mx-auto px-4">
          &copy; 2026 HMIF Telkom University Purwokerto. &bull; Komisi Pemilihan Raya. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
