'use client';

import { Check, Vote } from 'lucide-react';
import type { CandidateItem } from '@/components/ballot/candidate-card';

interface KotakKosongCardProps {
  candidate: CandidateItem;
  isSelected: boolean;
  onSelect: (candidate: CandidateItem) => void;
}

export function KotakKosongCard({
  candidate,
  isSelected,
  onSelect,
}: KotakKosongCardProps) {
  return (
    <div
      onClick={() => onSelect(candidate)}
      className={`group relative rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 cursor-pointer border ${
        isSelected
          ? 'bg-surface-container-high border-primary-container shadow-[0_0_0_2px_#EBBD1C] shadow-[0_12px_40px_-8px_rgba(235,189,28,0.25)]'
          : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-hmif-red/60'
      }`}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-14 h-14 rounded-xl bg-surface-container-high flex flex-col items-center justify-center shrink-0 border border-outline-variant/20">
          <span className="font-bebas text-3xl text-on-surface-variant leading-none">
            0
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-montserrat text-base sm:text-lg text-on-surface font-bold flex items-center gap-2">
              <Vote className="w-4 h-4 text-hmif-red" />
              Kotak Kosong
            </h3>
            <span className="bg-surface-container-high px-2 py-0.5 rounded text-outline text-[11px] font-semibold uppercase tracking-wider">
              Nomor 0 • Opsi Sah
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            Tidak Memilih Pasangan Calon. Opsi sah resmi berasaskan Luberjurdil bagi pemilih yang menyatakan tidak memilih pasangan calon yang terdaftar.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            isSelected
              ? 'bg-primary-container text-on-primary shadow-sm'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
          }`}
        >
          {isSelected ? 'Pilihan Aktif' : 'Pilih Kotak Kosong'}
        </button>

        <div
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
            isSelected
              ? 'bg-primary-container border-primary-container text-on-primary'
              : 'border-outline bg-surface-container-highest text-transparent'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      </div>
    </div>
  );
}
