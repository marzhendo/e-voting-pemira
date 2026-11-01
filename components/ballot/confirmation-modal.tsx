'use client';

import { ShieldCheck, X, Loader2 } from 'lucide-react';
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
  if (!isOpen || !selectedCandidate) return null;

  const isKotakKosong = selectedCandidate.candidate_number === 0;
  const numberStr = isKotakKosong
    ? '0'
    : selectedCandidate.candidate_number.toString().padStart(2, '0');

  const title = isKotakKosong
    ? 'Kotak Kosong'
    : `Pasangan Calon ${numberStr}`;

  const subtitle = isKotakKosong
    ? 'Opsi Tidak Memilih Pasangan Calon'
    : `${selectedCandidate.leader_name} & ${selectedCandidate.vice_leader_name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-surface-container-high rounded-2xl p-6 shadow-2xl flex flex-col gap-5 border border-outline-variant/30">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Konfirmasi Pilihan
              </h2>
              <p className="text-xs text-outline">
                Pastikan pilihan Anda sudah sesuai
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1.5 rounded-lg transition-colors disabled:opacity-50"
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
            <span className="text-[11px] text-outline uppercase tracking-wider block font-semibold">
              Pilihan Anda:
            </span>
            <h3 className="text-base text-on-surface font-bold truncate">
              {title}
            </h3>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Suara yang telah dikonfirmasi bersifat final dan tidak dapat diubah kembali.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Ubah Pilihan
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-on-primary bg-primary hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                <span>Mengirim Suara...</span>
              </>
            ) : (
              <span>Ya, Kirim Suara</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
