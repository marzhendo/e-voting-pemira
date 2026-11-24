'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  RefreshCw,
  MessageCircle,
  LogOut,
  Loader2,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

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
    'https://wa.me/6281809300406?text=Halo%20Panitia%20KPR%20Pemira%20HMIF%2C%20saya%20sedang%20berada%20di%20bilik%20suara%20dan%20ingin%20menanyakan%20status%20pemilihan.';

  return (
    <div className="min-h-screen bg-surface text-on-surface font-montserrat flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 w-full border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 shrink-0">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-on-surface leading-tight">
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
            <span className="hidden sm:inline">Bantuan KPR</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 animate-page-enter">
        <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
          {/* Header & Notice */}
          <div className="flex flex-col items-center text-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-1">
              <Clock className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              Bilik Suara Jeda Sebentar
            </span>

            <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight" style={{ textWrap: 'balance' }}>
              Sedang Ada Pemeriksaan Sistem
            </h1>

            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-xs" style={{ textWrap: 'pretty' }}>
              Panitia sedang memeriksa sistem pemilihan. Hak suaramu tetap aman dan bilik suara akan segera dibuka kembali.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
              type="button"
              onClick={onRefresh}
              disabled={isChecking}
              className="w-full h-11 px-5 rounded-xl font-semibold text-xs bg-primary text-on-primary hover:bg-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isChecking ? 'Memeriksa...' : 'Cek Status'}</span>
            </motion.button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 px-5 rounded-xl font-semibold text-xs text-on-surface hover:text-primary bg-surface-container-high hover:bg-surface-bright border border-outline-variant/30 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Tanya Panitia via WhatsApp</span>
            </a>
          </div>

          {/* Footer note & logout */}
          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>
              {lastCheckedTime ? `Dicek pukul ${lastCheckedTime}` : 'Status dicek berkala'}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 hover:text-error transition-colors min-h-[36px] px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-on-surface-variant border-t border-outline-variant/15">
        <p className="max-w-4xl mx-auto px-4">
          &copy; 2026 Komisi Pemilihan Raya &bull; HMIF Telkom University Purwokerto
        </p>
      </footer>
    </div>
  );
}
