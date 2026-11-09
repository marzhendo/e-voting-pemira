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
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface-container-high rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 flex flex-col items-center text-center animate-modal-enter overflow-hidden my-auto"
          >
            {/* Warning Icon Badge without trend-stacked glows */}
            <div className="w-14 h-14 rounded-2xl bg-error-container/20 border border-error/30 flex items-center justify-center text-error mb-5 shadow-inner">
              <Clock className="w-7 h-7" />
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
              Sesi bilik suara 15 menit telah berakhir. Masuk kembali dengan NIM untuk melanjutkan pemilihan.
            </p>

            {/* Status Box (Free of Em Dash R-02) */}
            <div className="w-full bg-surface-container rounded-2xl p-4 border border-outline-variant/20 mb-6 text-left space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-on-surface block">
                    Hak Suaramu Tetap Aman
                  </span>
                  <span className="text-outline text-[11px] leading-normal block mt-0.5">
                    Sesi 15 menit telah habis dan suara belum tercatat. Masuk kembali dengan NIM untuk memilih.
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              ref={buttonRef}
              type="button"
              onClick={onLoginRedirect}
              className="w-full h-12 min-h-[48px] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-on-primary bg-primary hover:bg-secondary-fixed focus:ring-4 focus:ring-primary/20 transition-all duration-150 flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>Masuk Kembali ke Bilik Suara</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Help Link with adequate tap target */}
            <div className="mt-4">
              <a
                href="https://wa.me/6281809300406"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-outline hover:text-on-surface transition-colors inline-flex items-center gap-1.5 font-medium min-h-[44px] px-3 py-2 rounded-lg hover:bg-surface-container"
              >
                <span>Kendala teknis? Hubungi Panitia KPR</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
