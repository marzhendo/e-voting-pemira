'use client';

import React, { useEffect, useRef } from 'react';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/portal';

interface LogoutModalProps {
  isOpen: boolean;
  isLoggingOut?: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export function LogoutModal({
  isOpen,
  isLoggingOut = false,
  onClose,
  onConfirmLogout,
}: LogoutModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();

      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoggingOut) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isLoggingOut, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="logout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/70"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isLoggingOut) {
                onClose();
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <motion.div
                key="logout-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-surface-container rounded-2xl p-6 sm:p-7 border border-outline-variant shadow-xl flex flex-col items-center text-center overflow-hidden my-auto"
              >
                <div className="w-12 h-12 rounded-xl bg-error-container dark:bg-error-container/40 border border-error/30 text-error flex items-center justify-center mb-4">
                  <LogOut className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
                </div>

                <h2
                  id="logout-modal-title"
                  className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface"
                >
                  Keluar dari Bilik Suara Digital?
                </h2>

                <p
                  id="logout-modal-description"
                  className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mt-2"
                >
                  Hak suara kamu <strong className="text-on-surface font-semibold">belum digunakan</strong>. Sesi akan diakhiri, namun kamu dapat masuk kembali menggunakan NIM dan Kata Sandi Pemilih selama jadwal pemilihan masih berlangsung.
                </p>

                <div className="w-full mt-4 p-3.5 rounded-xl bg-surface-highlight border border-outline-variant text-left flex items-start gap-2.5 text-xs text-on-surface">
                  <AlertCircle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
                  <span className="leading-relaxed">
                    Pilihan calon yang belum dikonfirmasi tidak akan tersimpan.
                  </span>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6">
                  <button
                    ref={cancelBtnRef}
                    type="button"
                    disabled={isLoggingOut}
                    onClick={onClose}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold transition-[color,background-color,transform] duration-150 active:scale-[0.96] border border-outline-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  >
                    Lanjutkan Memilih
                  </button>

                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={onConfirmLogout}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-error-solid hover:bg-error-solid/90 text-on-error text-xs sm:text-sm font-bold transition-[background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                        <span>Keluar...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        <span>Ya, Keluar</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
