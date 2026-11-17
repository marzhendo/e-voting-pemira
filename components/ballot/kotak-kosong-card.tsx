'use client';

import { Check, Vote, SquareDashed } from 'lucide-react';
import { motion } from 'framer-motion';
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
        tabIndex={0}
        role="region"
        aria-label="Opsi Resmi Sah: Kotak Kosong"
        onClick={() => onSelect(candidate)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
            e.preventDefault();
            onSelect(candidate);
          }
        }}
        className={`group relative rounded-2xl p-6 flex flex-col justify-between transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isSelected
            ? 'bg-surface-container-high border-2 border-primary ring-1 ring-primary/30'
            : 'bg-surface-container border border-outline-variant/30 hover:border-outline hover:bg-surface-container-high'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/30">
                <span className="font-bebas text-3xl text-on-surface-variant leading-none">
                  00
                </span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-semibold">
                  Opsi Sah
                </span>
                <h3 className="text-base text-on-surface font-bold">
                  Kotak Kosong
                </h3>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                isSelected
                  ? 'bg-primary border-primary text-on-primary'
                  : 'border-outline/40 bg-surface-container-highest text-transparent'
              }`}
            >
              <motion.div
                animate={{ scale: isSelected ? 1 : 0.7, opacity: isSelected ? 1 : 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </motion.div>
            </div>
          </div>

          {/* Kotak Kosong Visual (Rasio Konsisten 4:3 Menyamai Foto Paslon) */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-highest/60 border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary/80 border border-outline-variant/30 mb-3">
              <SquareDashed className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-on-surface">
              Kotak Kosong
            </span>
            <p className="text-xs text-on-surface-variant max-w-xs mt-1 leading-relaxed">
              Pilihan resmi jika kamu belum menentukan suara untuk pasangan calon yang ada.
            </p>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
              Kotak Kosong
            </h4>
            <p className="text-xs text-on-surface-variant font-medium">
              Opsi jika belum ada paslon yang pas
            </p>
          </div>

          {/* Keterangan Hak Pilih Sah (Seimbang dengan Visi Utama Paslon) */}
          <div className="bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-1">
              HAK SUARA SAH
            </span>
            <p className="line-clamp-2 text-xs leading-relaxed text-on-surface/90">
              Pilih opsi ini kalau kamu merasa visi &amp; misi paslon yang ada belum sesuai harapanmu.
            </p>
          </div>

          {/* Info Status Asas (Menyamai Tombol Detail CV Paslon) */}
          <div className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-surface-container-highest text-on-surface border border-outline-variant/40 text-xs font-semibold flex items-center justify-between gap-2 select-none">
            <span className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-primary" />
              <span>Tetap Dihitung Resmi</span>
            </span>
            <span className="text-xs font-bold text-emerald-400">
              Sah KPR
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-outline-variant/20">
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
            type="button"
            aria-pressed={isSelected}
            aria-label={isSelected ? 'Kotak Kosong terpilih' : 'Pilih Kotak Kosong'}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(candidate);
            }}
            className={`w-full h-11 min-h-[44px] px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              isSelected
                ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Terpilih</span>
              </>
            ) : (
              <span>Pilih Kotak Kosong</span>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // Variant horizontal (default)
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Opsi Alternatif Sah: Kotak Kosong"
      onClick={() => onSelect(candidate)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          onSelect(candidate);
        }
      }}
      className={`group relative rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isSelected
          ? 'bg-surface-container-high border-2 border-primary ring-1 ring-primary/30'
          : 'bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-outline'
      }`}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/20">
          <span className="font-bebas text-2xl text-on-surface-variant leading-none">
            00
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base text-on-surface font-bold flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-primary" />
              Kotak Kosong
            </h3>
            <span className="bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant text-[11px] font-semibold">
              Opsi Sah
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
            Opsi jika belum ada paslon yang pas. Suaramu tetap dihitung resmi oleh panitia KPR.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
          type="button"
          aria-pressed={isSelected}
          aria-label={isSelected ? 'Kotak Kosong terpilih' : 'Pilih Kotak Kosong'}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className={`h-11 min-h-[44px] px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            isSelected
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
          }`}
        >
          {isSelected ? 'Terpilih' : 'Pilih Kotak Kosong'}
        </motion.button>

        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150 ${
            isSelected
              ? 'bg-primary border-primary text-on-primary'
              : 'border-outline/40 bg-surface-container-highest text-transparent'
          }`}
        >
          <motion.div
            animate={{ scale: isSelected ? 1 : 0.7, opacity: isSelected ? 1 : 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
