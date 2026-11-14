'use client';

import { useEffect } from 'react';
import { ShieldCheck, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/portal';
import type { CandidateItem } from '@/components/ballot/candidate-card';

interface ConfirmationModalProps {
  isOpen: boolean;
  selectedCandidate: CandidateItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmationModal({
  isOpen,
  selectedCandidate,
  isSubmitting,
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isSubmitting) {
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
  }, [isOpen, isSubmitting, onClose]);

  const isKotakKosong = selectedCandidate?.candidate_number === 0;
  const numberStr = isKotakKosong
    ? '00'
    : (selectedCandidate?.candidate_number ?? 1).toString().padStart(2, '0');

  const title = isKotakKosong
    ? 'Kotak Kosong'
    : `Pasangan Calon ${numberStr}`;

  const subtitle = isKotakKosong
    ? 'Opsi Kotak Kosong'
    : `${selectedCandidate?.leader_name} & ${selectedCandidate?.vice_leader_name}`;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && selectedCandidate && (
          <motion.div
            key="confirmation-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-modal-title"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) {
                onClose();
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <motion.div
                key="confirmation-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-surface-container-high rounded-2xl p-6 flex flex-col gap-5 border border-outline-variant/30 my-auto"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 id="confirmation-modal-title" className="font-bebas text-2xl tracking-wide uppercase text-on-surface">
                        Konfirmasi Pilihan
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        Pilihanmu bersifat final dan langsung tercatat secara rahasia.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    aria-label="Tutup Konfirmasi"
                    className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Candidate Summary */}
                <div className="bg-surface-container rounded-xl p-4 flex items-center gap-4 border border-outline-variant/20">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant/30">
                    <span className="font-bebas text-3xl text-primary leading-none">
                      {numberStr}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-semibold">
                      Pilihanmu:
                    </span>
                    <h3 className="text-base text-on-surface font-bold truncate">
                      {title}
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {subtitle}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    className="w-full sm:w-auto h-11 min-h-[44px] px-5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    Ubah Pilihan
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    type="button"
                    disabled={isSubmitting}
                    onClick={onConfirm}
                    className="w-full sm:w-auto h-11 min-h-[44px] px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-on-primary bg-primary hover:bg-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                        <span>Mengunci Suara...</span>
                      </>
                    ) : (
                      <span>Kunci Suara</span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
