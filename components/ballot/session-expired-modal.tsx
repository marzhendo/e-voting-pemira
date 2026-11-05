'use client';

import React, { useEffect, useRef } from 'react';
import { Clock, ArrowRight, ShieldAlert, ExternalLink } from 'lucide-react';
import { Portal } from '@/components/ui/portal';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onLoginRedirect: () => void;
}

export function SessionExpiredModal({
  isOpen,
  onLoginRedirect,
}: SessionExpiredModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Fokuskan tombol login otomatis saat modal terbuka untuk aksesibilitas
      buttonRef.current?.focus();

      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-description"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-md bg-surface-container-high rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 inset-x-0 h-28 bg-gradient-to-b from-hmif-red/20 to-transparent pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="relative w-16 h-16 rounded-2xl bg-hmif-red/10 border border-hmif-red/30 flex items-center justify-center text-hmif-red mb-5 shadow-inner">
          <Clock className="w-8 h-8 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-hmif-red ring-4 ring-surface-container-high" />
        </div>

        {/* Title */}
        <h2
          id="session-expired-title"
          className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mb-2"
        >
          Sesi Bilik Suara Kedaluwarsa
        </h2>

        {/* Description */}
        <p
          id="session-expired-description"
          className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6"
        >
          Sesi bilik suara 15 menit telah berakhir. Masuk kembali dengan NIM Anda untuk melanjutkan.
        </p>

        {/* Security & Voter Peace-of-Mind Status Box */}
        <div className="w-full bg-surface-container rounded-2xl p-4 border border-outline-variant/20 mb-6 text-left space-y-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-hmif-gold shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-on-surface block">
                Hak Suara Anda Tetap Aman
              </span>
              <span className="text-on-surface-variant text-[11px] leading-normal block mt-0.5">
                Suara Anda belum tercatat. Hak suara tetap aktif — masuk kembali untuk melanjutkan.
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={onLoginRedirect}
          className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-hmif-blue hover:bg-brand-blue-hover focus:ring-4 focus:ring-hmif-blue/30 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <span>Masuk Kembali ke Bilik Suara</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Help Link */}
        <div className="mt-4">
          <a
            href="https://wa.me/6281809300406"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-outline hover:text-on-surface transition-colors inline-flex items-center gap-1 font-medium p-2 -m-2 rounded-lg"
          >
            <span>Kendala teknis? Hubungi Panitia KPR</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  </Portal>
  );
}
