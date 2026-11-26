"use client";

import { useState, useEffect } from "react";
import { Users, Check, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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
  const numberStr = candidate.candidate_number.toString().padStart(2, "0");

  const [imgSrc, setImgSrc] = useState<string | null>(
    candidate.photo_url || null,
  );
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(candidate.photo_url || null);
    setImgFailed(false);
  }, [candidate.photo_url]);

  const handleImageError = () => {
    const staticCandidateFallback = `/assets/candidates/paslon-${candidate.candidate_number}.webp`;
    if (imgSrc && imgSrc !== staticCandidateFallback) {
      setImgSrc(staticCandidateFallback);
    } else {
      setImgFailed(true);
    }
  };

  return (
    <article
      tabIndex={0}
      aria-label={`Pasangan Calon Nomor Urut ${numberStr}: ${candidate.leader_name} dan ${candidate.vice_leader_name}`}
      onClick={() => onSelect(candidate)}
      onKeyDown={(e) => {
        if (
          (e.key === "Enter" || e.key === " ") &&
          e.target === e.currentTarget
        ) {
          e.preventDefault();
          onSelect(candidate);
        }
      }}
      className={`group relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        isSelected
          ? "bg-surface-container border-2 border-primary ring-2 ring-primary/25"
          : "bg-surface-container border border-outline-variant hover:border-outline"
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Header: Nomor Urut Editorial & Indikator Pilihan */}
        <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="font-mono text-2xl font-bold tabular-nums leading-none">
                {numberStr}
              </span>
            </div>
            <div>
              <span className="text-xs text-on-surface-variant block font-semibold">
                Pasangan Calon
              </span>
              <h2 className="text-base text-on-surface font-bold tracking-tight">
                Nomor Urut {numberStr}
              </h2>
            </div>
          </div>

          <div
            aria-hidden="true"
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
              isSelected
                ? "bg-primary border-primary text-on-primary"
                : "border-outline bg-surface-container-low text-transparent"
            }`}
          >
            <motion.div
              animate={{
                scale: isSelected ? 1 : 0.7,
                opacity: isSelected ? 1 : 0,
              }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </motion.div>
          </div>
        </div>

        {/* Foto Pasangan Calon (Rasio 4:3, Outline Netral 1px) */}
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-high ring-1 ring-inset ring-black/10 dark:ring-white/10 flex items-center justify-center select-none">
          {!imgFailed && imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={`Foto Pasangan Calon ${numberStr}`}
              className="w-full h-full object-cover object-top"
              onError={handleImageError}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5 p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant text-on-surface-variant">
                <Users className="w-7 h-7" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div>
                <span className="text-sm font-semibold text-on-surface block">
                  Foto Resmi Paslon {numberStr}
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5 block">
                  Chairman &amp; Vice Chairman
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Nama Pasangan Calon */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-on-surface leading-snug tracking-tight">
            {candidate.leader_name} &amp; {candidate.vice_leader_name}
          </h3>
          <p className="text-xs text-on-surface-variant font-medium">
            Calon Chairman &amp; Vice Chairman HMIF
          </p>
        </div>

        {/* Visi Utama */}
        <div className="bg-surface-highlight rounded-xl p-4 border border-outline-variant">
          <span className="text-xs font-bold text-tertiary block mb-1">
            Visi Utama
          </span>
          <p className="line-clamp-3 text-sm leading-relaxed text-on-surface">
            &ldquo;{candidate.vision}&rdquo;
          </p>
        </div>

        {/* Tombol Detail & Unduh CV */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail?.(candidate);
          }}
          aria-label={`Detail Visi Misi & CV Paslon nomor urut ${numberStr}`}
          className="w-full min-h-[44px] px-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant text-sm font-semibold flex items-center justify-between gap-2 transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex items-center gap-2">
            <FileText
              className="w-4 h-4 text-on-surface-variant"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Detail Visi Misi &amp; CV Paslon</span>
          </span>
          <ChevronRight
            className="w-4 h-4 text-on-surface-variant shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Footer Aksi Card */}
      <div className="pt-4 mt-5 border-t border-outline-variant">
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={
            isSelected
              ? `Paslon ${numberStr} terpilih`
              : `Pilih Paslon ${numberStr}`
          }
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className={`w-full min-h-[44px] px-5 rounded-xl text-sm font-bold transition-[color,background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isSelected
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface hover:bg-surface-bright border border-outline-variant"
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              <span>Terpilih</span>
            </>
          ) : (
            <span>Pilih Paslon {numberStr}</span>
          )}
        </button>
      </div>
    </article>
  );
}
