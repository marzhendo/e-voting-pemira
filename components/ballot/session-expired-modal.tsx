'use client';

import React, { useEffect, useRef } from 'react';
import { Clock, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md"
          >
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div
                key="expired-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-surface-container-high rounded-3xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col items-center text-center overflow-hidden my-auto"
              >
                {/* Warning Icon */}
                <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-4">
                  <Clock className="w-6 h-6" />
                </div>

                {/* Title */}
                <h2
                  id="session-expired-title"
                  className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface mb-2"
                >
                  Waktu Sesi Berakhir
                </h2>

                {/* Description */}
                <p
                  id="session-expired-description"
                  className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-sm"
                >
                  Bilik suara memiliki batas waktu 15 menit demi keamanan. Hak suaramu belum digunakan, silakan masuk kembali dengan NIM untuk memilih.
                </p>

                {/* Primary Action Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                  ref={buttonRef}
                  type="button"
                  onClick={onLoginRedirect}
                  className="w-full h-12 min-h-[48px] rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-on-primary bg-primary hover:bg-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span>Masuk Kembali ke Bilik Suara</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                {/* Help Link with adequate tap target */}
                <div className="mt-4">
                  <a
                    href="https://wa.me/6281809300406"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-1.5 font-medium min-h-[44px] px-3 py-2 rounded-lg hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <span>Kendala teknis? Hubungi Panitia KPR</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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
