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
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md"
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
                className="relative w-full max-w-md bg-surface-container-high rounded-3xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col items-center text-center overflow-hidden my-auto"
              >
                {/* Warning / Exit Badge Icon */}
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                  <LogOut className="w-7 h-7" aria-hidden="true" />
                </div>

                <h2
                  id="logout-modal-title"
                  className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface"
                >
                  Keluar dari Bilik Suara?
                </h2>

                <p
                  id="logout-modal-description"
                  className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mt-2 text-pretty"
                >
                  Hak suara kamu <strong className="text-on-surface font-semibold">belum digunakan</strong>. Sesi bilik suara akan diakhiri, namun kamu tetap dapat masuk kembali menggunakan NIM &amp; PIN selama jadwal pemilihan masih berlangsung.
                </p>

                {/* Information Card */}
                <div className="w-full mt-4 p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 text-left flex items-start gap-2.5 text-xs text-on-surface-variant">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-relaxed">
                    Pilihan calon yang belum dikonfirmasi tidak akan tersimpan.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <button
                    ref={cancelBtnRef}
                    type="button"
                    disabled={isLoggingOut}
                    onClick={onClose}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface text-on-surface text-xs font-bold uppercase tracking-wider transition-colors border border-outline-variant/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer disabled:opacity-50"
                  >
                    Lanjutkan Memilih
                  </button>

                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={onConfirmLogout}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-error/90 hover:bg-error text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Keluar...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" aria-hidden="true" />
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
