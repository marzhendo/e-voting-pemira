'use client';

import { Check, Vote, SquareDashed } from 'lucide-react';
import type { CandidateItem } from '@/components/ballot/candidate-card';

interface KotakKosongCardProps {
  candidate: CandidateItem;
  isSelected: boolean;
  onSelect: (candidate: CandidateItem) => void;
  variant?: 'card' | 'horizontal';
}

export function KotakKosongCard({
  candidate,
  isSelected,
  onSelect,
  variant = 'horizontal',
}: KotakKosongCardProps) {
  if (variant === 'card') {
    return (
      <div
        onClick={() => onSelect(candidate)}
        className={`group relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer border ${
          isSelected
            ? 'bg-surface-container-high border-primary ring-2 ring-primary shadow-xl shadow-primary/10'
            : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-high'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
                <span className="font-bebas text-3xl text-outline leading-none">
                  0
                </span>
              </div>
              <div>
                <span className="text-[11px] text-outline uppercase tracking-wider block font-medium">
                  Opsi Resmi Sah
                </span>
                <h3 className="text-base text-on-surface font-bold">
                  Kotak Kosong
                </h3>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                isSelected
                  ? 'bg-primary border-primary text-on-primary'
                  : 'border-outline/40 bg-surface-container-highest text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Kotak Kosong Visual */}
          <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden bg-surface-container-highest/60 border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
              <SquareDashed className="w-8 h-8 text-outline" />
            </div>
            <span className="text-sm font-bold text-on-surface">
              Kolom Kosong
            </span>
            <p className="text-xs text-on-surface-variant max-w-xs mt-1.5 leading-relaxed">
              Opsi sah konstitusional bagi pemilih yang tidak menyetujui pasangan calon tunggal.
            </p>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
              Tidak Memilih Calon Tunggal
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Suara Anda tetap dihitung sah dalam rekapitulasi pemilihan umum HMIF.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
          <span className="text-xs text-outline">
            {isSelected ? '✓ Dipilih' : 'Klik untuk memilih'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(candidate);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              isSelected
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
          >
            {isSelected ? 'Terpilih' : 'Pilih Kotak Kosong'}
          </button>
        </div>
      </div>
    );
  }

  // Variant horizontal (default)
  return (
    <div
      onClick={() => onSelect(candidate)}
      className={`group relative rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-surface-container-high border-primary ring-2 ring-primary shadow-lg shadow-primary/10'
          : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-outline-variant'
      }`}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/20">
          <span className="font-bebas text-2xl text-outline leading-none">
            0
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base text-on-surface font-bold flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-primary" />
              Kotak Kosong
            </h3>
            <span className="bg-surface-container-high px-2 py-0.5 rounded text-outline text-[11px] font-medium">
              Opsi Sah
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
            Pilihan resmi bagi pemilih yang tidak memilih pasangan calon yang terdaftar.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            isSelected
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
          }`}
        >
          {isSelected ? 'Terpilih' : 'Pilih Kotak Kosong'}
        </button>

        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
            isSelected
              ? 'bg-primary border-primary text-on-primary'
              : 'border-outline/40 bg-surface-container-highest text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>
    </div>
  );
}
