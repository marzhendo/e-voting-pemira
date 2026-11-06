'use client';

import { Users, Check, FileText } from 'lucide-react';

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
      onClick={() => onSelect(candidate)}
      className={`group relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-surface-container-high border-primary ring-2 ring-primary shadow-xl shadow-primary/10'
          : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-high'
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
              <span className="text-[11px] text-outline uppercase tracking-wider block font-semibold">
                Pasangan Calon
              </span>
              <h3 className="text-base text-on-surface font-bold">
                Nomor Urut {numberStr}
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

        {/* Foto Pasangan Calon */}
        <div className="relative w-full h-48 sm:h-64 md:h-72 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/20 flex flex-col items-center justify-center text-center p-4 select-none">
          {candidate.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidate.photo_url}
              alt={`Foto Pasangan Calon ${numberStr}`}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-outline">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <Users className="w-7 h-7 text-primary/70" />
              </div>
              <span className="text-xs font-medium text-on-surface-variant">
                Foto Paslon {numberStr}
              </span>
            </div>
          )}
        </div>

        {/* Nama Pasangan Calon */}
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
            {candidate.leader_name} &amp; {candidate.vice_leader_name}
          </h4>
          <p className="text-xs text-outline">
            Calon Chairman &amp; Vice Chairman HMIF
          </p>
        </div>

        {/* Fokus Visi Singkat */}
        <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 text-xs text-on-surface-variant">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-1">
            Fokus Visi:
          </span>
          <p className="line-clamp-2 text-xs leading-relaxed text-on-surface/90">
            &ldquo;{candidate.vision}&rdquo;
          </p>
        </div>

        {/* Tombol Masuk ke Halaman Detail & Unduh CV */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail?.(candidate);
          }}
          className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface border border-outline-variant/40 hover:border-primary/50 text-xs font-semibold flex items-center justify-between gap-2 transition-all shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Detail Visi Misi &amp; CV Paslon</span>
          </span>
          <span className="text-xs font-semibold text-primary">
            Lihat Profil →
          </span>
        </button>
      </div>

      {/* Footer Aksi Card */}
      <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
        <span className="text-xs text-outline font-medium">
          {isSelected ? '✓ Terpilih' : 'Ketuk untuk memilih'}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className={`h-11 min-h-[44px] px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer ${
            isSelected
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
          }`}
        >
          {isSelected ? 'Terpilih' : `Pilih Paslon ${numberStr}`}
        </button>
      </div>
    </div>
  );
}
