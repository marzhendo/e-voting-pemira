'use client';

import { Users, Check, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CandidateItem {
  id: string;
  candidate_number: number;
  leader_name: string;
  vice_leader_name: string;
  vision: string;
  mission: string[];
  photo_url: string | null;
  chairman_cv_url?: string | null;
  vice_chairman_cv_url?: string | null;
}

interface CandidateCardProps {
  candidate: CandidateItem;
  isSelected: boolean;
  onSelect: (candidate: CandidateItem) => void;
  onOpenDetail?: (candidate: CandidateItem) => void;
}

export function CandidateCard({
  candidate,
  isSelected,
  onSelect,
  onOpenDetail,
}: CandidateCardProps) {
  const numberStr = candidate.candidate_number.toString().padStart(2, '0');

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={`Pasangan Calon Nomor Urut ${numberStr}: ${candidate.leader_name} dan ${candidate.vice_leader_name}`}
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
        {/* Header: Nomor Urut & Radio Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="font-bebas text-3xl text-primary leading-none">
                {numberStr}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-semibold">
                Pasangan Calon
              </span>
              <h3 className="text-base text-on-surface font-bold">
                Nomor Urut {numberStr}
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

        {/* Foto Pasangan Calon (Rasio Konsisten 4:3, Tanpa Gepeng, Wajah Tidak Terpotong) */}
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center select-none">
          {candidate.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidate.photo_url}
              alt={`Foto Pasangan Calon ${numberStr}`}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant/30 text-primary/80">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold text-on-surface block">
                  Foto Resmi Paslon {numberStr}
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5 block">
                  Chairman &amp; Vice Chairman
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nama Pasangan Calon */}
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
            {candidate.leader_name} &amp; {candidate.vice_leader_name}
          </h4>
          <p className="text-xs text-on-surface-variant font-medium">
            Calon Chairman &amp; Vice Chairman HMIF
          </p>
        </div>

        {/* Visi Utama */}
        <div className="bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-1">
            Visi Utama
          </span>
          <p className="line-clamp-2 text-xs leading-relaxed text-on-surface/90">
            &ldquo;{candidate.vision}&rdquo;
          </p>
        </div>

        {/* Tombol Masuk ke Halaman Detail & Unduh CV */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail?.(candidate);
          }}
          aria-label={`Detail Visi Misi & CV Paslon nomor urut ${numberStr}`}
          className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface border border-outline-variant/40 hover:border-primary/50 text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Detail Visi Misi &amp; CV Paslon</span>
          </span>
          <ChevronRight className="w-4 h-4 text-primary shrink-0" />
        </motion.button>
      </div>

      {/* Footer Aksi Card */}
      <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
        <span className="text-xs text-on-surface-variant font-medium">
          {isSelected ? '✓ Terpilih' : 'Belum dipilih'}
        </span>
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
          type="button"
          aria-pressed={isSelected}
          aria-label={isSelected ? `Paslon ${numberStr} terpilih` : `Pilih Paslon ${numberStr}`}
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
          {isSelected ? 'Terpilih' : `Pilih Paslon ${numberStr}`}
        </motion.button>
      </div>
    </div>
  );
}
