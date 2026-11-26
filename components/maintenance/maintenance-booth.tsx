'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  RefreshCw,
  MessageCircle,
  LogOut,
  ShieldCheck,
  Lock,
  Clock,
  Loader2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { KPR_WHATSAPP_URL } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

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

  const whatsappUrl = `${KPR_WHATSAPP_URL}?text=Halo%20Panitia%20KPR%20Pemira%20HMIF%2C%20saya%20sedang%20berada%20di%20Bilik%20Suara%20Digital%20dan%20ingin%20menanyakan%20status%20pemeliharaan%20teknis.`;

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary overflow-x-hidden">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 w-full border-b border-outline-variant bg-surface/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
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
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-on-surface block truncate">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium block truncate">
                Telkom University Purwokerto
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pusat Bantuan KPR via WhatsApp"
              className="text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <MessageCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Bantuan KPR</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 animate-page-enter"
      >
        <div className="w-full max-w-xl bg-surface-container border border-outline-variant rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2.5">
            <p className="text-xs font-bold text-error">
              Pemeliharaan Sistem Berlangsung
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface leading-tight">
              Bilik Suara Digital Dalam Pemeriksaan
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-lg mx-auto">
              Panitia KPR HMIF sedang melakukan pemeliharaan infrastruktur dan validasi integritas data Bilik Suara Digital.
            </p>
          </div>

          {/* Jaminan Faktual */}
          <div className="space-y-3">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-container-low border border-outline-variant">
              <div className="p-2 rounded-lg bg-surface-container border border-outline-variant text-tertiary shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="text-left">
                <h2 className="text-xs sm:text-sm font-bold text-on-surface">
                  Surat Suara Anonim Tetap Utuh
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                  Seluruh suara sah yang telah dikirim sebelum masa pemeliharaan tersimpan utuh tanpa perubahan di basis data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-container-low border border-outline-variant">
              <div className="p-2 rounded-lg bg-surface-container border border-outline-variant text-tertiary shrink-0 mt-0.5">
                <Lock className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="text-left">
                <h2 className="text-xs sm:text-sm font-bold text-on-surface">
                  Kerahasiaan Pilihan Terjaga
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                  Tidak ada relasi antara identitas pemilih di DPT dan Surat Suara Anonim, sehingga pilihan tidak dapat dilacak.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-container-low border border-outline-variant">
              <div className="p-2 rounded-lg bg-surface-container border border-outline-variant text-tertiary shrink-0 mt-0.5">
                <Clock className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="text-left">
                <h2 className="text-xs sm:text-sm font-bold text-on-surface">
                  Pemulihan Akses Otomatis
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                  Bilik Suara Digital akan dibuka kembali segera setelah pemeriksaan selesai. Sesi kamu tetap aktif di peramban ini.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isChecking}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl font-bold text-sm bg-primary text-on-primary hover:bg-secondary transition-[color,background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} strokeWidth={2} aria-hidden="true" />
              <span>{isChecking ? 'Memeriksa Status Sistem...' : 'Periksa Status Sekarang'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl font-semibold text-xs sm:text-sm text-on-surface bg-surface-container-low hover:bg-surface-container-high border border-outline-variant transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" strokeWidth={1.75} aria-hidden="true" />
              <span>Hubungi Panitia KPR via WhatsApp</span>
            </a>
          </div>

          {/* Last checked & logout */}
          <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <span className="font-mono tabular-nums">
              {lastCheckedTime ? `Terakhir diperiksa: ${lastCheckedTime}` : 'Status diperbarui secara berkala'}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 hover:text-error transition-colors min-h-[44px] px-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <LogOut className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>Keluar dari Bilik Suara</span>
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
