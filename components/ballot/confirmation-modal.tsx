'use client';

import { ShieldCheck, AlertTriangle, X, Loader2 } from 'lucide-react';
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
    ? 'Suara Abstain Sah (Tidak Memilih Pasangan Calon)'
    : `${selectedCandidate.leader_name} & ${selectedCandidate.vice_leader_name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface-container-high rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 border border-outline-variant/40 scale-100 transition-transform">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-montserrat text-lg sm:text-xl text-on-surface font-bold">
                Konfirmasi Pilihan Suara
              </h2>
              <p className="text-xs text-outline">
                Langkah Terakhir • Validasi Integritas Pemilih
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

        {/* Selected Candidate Summary Review Card */}
        <div className="bg-surface-container rounded-xl p-4 flex items-center gap-4 border border-outline-variant/20">
          <div className="w-16 h-16 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant/20">
            <span className="font-bebas text-3xl text-primary leading-none">
              {numberStr}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-outline uppercase tracking-wider block font-semibold">
              Pilihan Anda:
            </span>
            <h3 className="font-montserrat text-base text-on-surface font-bold truncate">
              {title}
            </h3>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Warning & Security Disclaimers */}
        <div className="bg-surface-container-low p-4 rounded-xl flex items-start gap-3 text-error text-xs border border-outline-variant/30">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-hmif-red" />
          <p className="leading-relaxed">
            <strong className="font-bold text-on-surface">Peringatan:</strong> Pilihan Anda bersifat final, mutlak, dan langsung dienkripsi tanpa nama. Pilihan tidak dapat diubah setelah tombol konfirmasi ditekan.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-full sm:w-auto px-5 h-11 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Kembali, Ubah Pilihan
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 h-11 rounded-lg text-xs font-bold uppercase tracking-wider text-on-primary bg-primary-container hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                <span>Mengenkripsi Suara...</span>
              </>
            ) : (
              <span>Konfirmasi &amp; Kirim Suara</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
