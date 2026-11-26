'use client';

import React, { useEffect, useRef } from 'react';
import { Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/portal';
import { KPR_WHATSAPP_URL } from '@/components/layout/site-header';

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

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="expired-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
            aria-describedby="session-expired-description"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/70"
          >
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div
                key="expired-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-surface-container rounded-2xl p-6 sm:p-7 border border-outline-variant shadow-xl flex flex-col items-center text-center overflow-hidden my-auto"
              >
                <div className="w-12 h-12 rounded-xl bg-error-container dark:bg-error-container/40 border border-error/30 flex items-center justify-center text-error mb-4">
                  <Clock className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
                </div>

                <h2
                  id="session-expired-title"
                  className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface mb-2"
                >
                  Waktu Sesi Berakhir
                </h2>

                <p
                  id="session-expired-description"
                  className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-sm"
                >
                  Bilik Suara Digital memiliki batas waktu 15 menit demi keamanan. Hak suaramu belum digunakan, silakan masuk kembali dengan NIM dan Kata Sandi Pemilih.
                </p>

                <button
                  ref={buttonRef}
                  type="button"
                  onClick={onLoginRedirect}
                  className="w-full min-h-[48px] px-5 rounded-xl text-sm font-bold text-on-primary bg-primary hover:bg-secondary transition-[color,background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Masuk Kembali ke Bilik Suara
                </button>

                <div className="mt-3">
                  <a
                    href={KPR_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-tertiary hover:underline inline-flex items-center gap-1.5 font-semibold min-h-[44px] px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span>Kendala teknis? Hubungi Panitia KPR</span>
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
