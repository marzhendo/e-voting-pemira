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
            className="fixed inset-0 z-50 overflow-y-auto bg-black/70"
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
                className="relative w-full max-w-md bg-surface-container rounded-2xl p-6 flex flex-col gap-5 border border-outline-variant shadow-xl my-auto"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div>
                      <h2
                        id="confirmation-modal-title"
                        className="font-display text-xl font-extrabold tracking-tight text-on-surface"
                      >
                        Konfirmasi Pilihan
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        Pilihanmu bersifat final dan langsung tercatat sebagai Surat Suara Anonim.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    aria-label="Tutup Konfirmasi"
                    className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>

                {/* Selected Candidate Summary */}
                <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4 border border-outline-variant">
                  <div className="w-14 h-14 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                    <span className="font-mono text-2xl font-bold tabular-nums leading-none">
                      {numberStr}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-on-surface-variant block font-semibold">
                      Pilihanmu
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
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    className="min-h-[44px] px-5 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant transition-[color,background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Ubah Pilihan
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onConfirm}
                    className="min-h-[44px] px-6 rounded-xl text-sm font-bold text-on-primary bg-primary hover:bg-secondary transition-[color,background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-on-primary" strokeWidth={2} aria-hidden="true" />
                        <span>Mengunci Suara...</span>
                      </>
                    ) : (
                      <span>Kunci Suara</span>
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
