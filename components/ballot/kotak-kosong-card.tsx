"use client";

import { Check, Vote, SquareDashed } from "lucide-react";
import { motion } from "framer-motion";
import type { CandidateItem } from "@/components/ballot/candidate-card";

interface KotakKosongCardProps {
  candidate: CandidateItem;
  isSelected: boolean;
  onSelect: (candidate: CandidateItem) => void;
  variant?: "card" | "horizontal";
}

export function KotakKosongCard({
  candidate,
  isSelected,
  onSelect,
  variant = "horizontal",
}: KotakKosongCardProps) {
  if (variant === "card") {
    return (
      <article
        tabIndex={0}
        aria-label="Opsi Resmi Sah: Kotak Kosong"
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
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant shrink-0">
                <span className="font-mono text-2xl font-bold text-on-surface-variant tabular-nums leading-none">
                  00
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block font-semibold">
                  Opsi Sah
                </span>
                <h2 className="text-base text-on-surface font-bold tracking-tight">
                  Kotak Kosong
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

          {/* Kotak Kosong Visual */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low border border-dashed border-outline flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant border border-outline-variant mb-3">
              <SquareDashed className="w-7 h-7" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-on-surface">
              Kotak Kosong
            </span>
            <p className="text-sm text-on-surface-variant max-w-xs mt-1 leading-relaxed">
              Pilihan resmi jika kamu belum menentukan suara untuk pasangan calon yang ada.
            </p>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-on-surface leading-snug tracking-tight">
              Kotak Kosong
            </h3>
            <p className="text-xs text-on-surface-variant font-medium">
              Opsi alternatif resmi dalam surat suara
            </p>
          </div>

          {/* Keterangan Hak Pilih Sah */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant">
            <span className="text-xs font-bold text-on-surface-variant block mb-1">
              Hak Suara Sah
            </span>
            <p className="line-clamp-3 text-sm leading-relaxed text-on-surface">
              Pilih opsi ini jika visi dan misi pasangan calon yang tersedia belum sesuai dengan harapanmu.
            </p>
          </div>

          {/* Info Status Asas */}
          <div className="w-full min-h-[44px] px-4 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant text-sm font-semibold flex items-center justify-between gap-2 select-none">
            <span className="flex items-center gap-2">
              <Vote
                className="w-4 h-4 text-on-surface-variant"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Tetap Dihitung Resmi</span>
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Sah KPR
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-5 border-t border-outline-variant">
          <button
            type="button"
            aria-pressed={isSelected}
            aria-label={
              isSelected ? "Kotak Kosong terpilih" : "Pilih Kotak Kosong"
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
              <span>Pilih Kotak Kosong</span>
            )}
          </button>
        </div>
      </article>
    );
  }

  // Variant horizontal (default)
  return (
    <article
      tabIndex={0}
      aria-label="Opsi Alternatif Sah: Kotak Kosong"
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
      className={`group relative rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        isSelected
          ? "bg-surface-container border-2 border-primary ring-2 ring-primary/25"
          : "bg-surface-container border border-outline-variant hover:border-outline"
      }`}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant">
          <span className="font-mono text-xl font-bold text-on-surface-variant tabular-nums leading-none">
            00
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base text-on-surface font-bold flex items-center gap-1.5">
              <Vote
                className="w-4 h-4 text-on-surface-variant"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Kotak Kosong</span>
            </h3>
            <span className="bg-surface-container-high border border-outline-variant px-2 py-0.5 rounded-md text-on-surface-variant text-xs font-semibold">
              Opsi Sah
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed">
            Opsi jika belum ada pasangan calon yang sesuai. Suaramu tetap dihitung resmi oleh Panitia KPR.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
        <button
          type="button"
          aria-pressed={isSelected}
          aria-label={
            isSelected ? "Kotak Kosong terpilih" : "Pilih Kotak Kosong"
          }
          onClick={(e) => {
            e.stopPropagation();
            onSelect(candidate);
          }}
          className={`min-h-[44px] px-5 rounded-xl text-xs sm:text-sm font-bold transition-[color,background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isSelected
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface hover:bg-surface-bright border border-outline-variant"
          }`}
        >
          {isSelected ? "Terpilih" : "Pilih Kotak Kosong"}
        </button>

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
    </article>
  );
}
