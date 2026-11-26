"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "@/components/ui/portal";
import {
  X,
  Check,
  Download,
  Target,
  CheckCircle2,
  Users,
  Vote,
} from "lucide-react";
import type { CandidateItem } from "@/components/ballot/candidate-card";
import { sanitizeCandidateAssetUrl } from "@/lib/security/url-validation";

interface CandidateDetailModalProps {
  isOpen: boolean;
  candidate: CandidateItem | null;
  isSelected?: boolean;
  onClose: () => void;
  onSelectCandidate: (candidate: CandidateItem) => void;
}

function sanitizeCvUrl(url?: string | null, fallbackUrl: string = "#"): string {
  return sanitizeCandidateAssetUrl(url, fallbackUrl);
}

export function CandidateDetailModal({
  isOpen,
  candidate,
  isSelected = false,
  onClose,
  onSelectCandidate,
}: CandidateDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [modalImgSrc, setModalImgSrc] = useState<string | null>(null);
  const [modalImgFailed, setModalImgFailed] = useState(false);

  useEffect(() => {
    if (candidate) {
      setModalImgSrc(sanitizeCandidateAssetUrl(candidate.photo_url));
      setModalImgFailed(false);
    }
  }, [candidate]);

  const handleModalImageError = () => {
    if (candidate) {
      const staticCandidateFallback = `/assets/candidates/paslon-${candidate.candidate_number}.webp`;
      if (modalImgSrc && modalImgSrc !== staticCandidateFallback) {
        setModalImgSrc(staticCandidateFallback);
        return;
      }
    }
    setModalImgFailed(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const numberStr = candidate.candidate_number.toString().padStart(2, "0");
  const fallbackChairman = `/assets/docs/cv-paslon-${candidate.candidate_number}-chairman.pdf`;
  const fallbackViceChairman = `/assets/docs/cv-paslon-${candidate.candidate_number}-vice-chairman.pdf`;

  const chairmanCvUrl = sanitizeCvUrl(
    candidate.chairman_cv_url,
    fallbackChairman,
  );
  const viceChairmanCvUrl = sanitizeCvUrl(
    candidate.vice_chairman_cv_url,
    fallbackViceChairman,
  );

  const chairmanDownloadName = `CV-Chairman-Paslon-${numberStr}-${candidate.leader_name.replace(/\s+/g, "-")}.pdf`;
  const viceChairmanDownloadName = `CV-ViceChairman-Paslon-${numberStr}-${candidate.vice_leader_name.replace(/\s+/g, "-")}.pdf`;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && candidate && (
          <motion.div
            key="detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-detail-title"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/70"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-left">
              <motion.div
                key="detail-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.18 }}
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col min-h-0 bg-surface-container rounded-2xl border border-outline-variant shadow-xl overflow-hidden my-auto"
              >
                {/* TOP HEADER */}
                <div className="shrink-0 px-4 sm:px-7 py-3.5 bg-surface-container border-b border-outline-variant flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold tabular-nums">
                      Nomor Urut {numberStr}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">
                      Detail Profil &amp; Berkas CV
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup Detail"
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>

                {/* SCROLLABLE MAIN CONTENT */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-7 py-5 sm:py-6 space-y-6 touch-pan-y">
                  {/* IDENTITY BANNER */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-surface-container-low p-5 sm:p-6 rounded-xl border border-outline-variant">
                    <div className="relative w-40 h-48 sm:w-44 sm:h-52 shrink-0 rounded-xl overflow-hidden bg-surface-container-high ring-1 ring-inset ring-black/10 dark:ring-white/10 flex items-center justify-center">
                      {!modalImgFailed && modalImgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={modalImgSrc}
                          alt={`Paslon ${numberStr}`}
                          className="w-full h-full object-cover object-top"
                          onError={handleModalImageError}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant p-4 text-center">
                          <Users className="w-10 h-10" strokeWidth={1.75} aria-hidden="true" />
                          <span className="text-xs font-medium">
                            Foto Paslon {numberStr}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2.5">
                      <p className="text-xs font-semibold text-tertiary">
                        Pemira HMIF 2026/2027
                      </p>

                      <h2
                        id="candidate-detail-title"
                        className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface leading-tight"
                      >
                        {candidate.leader_name}{" "}
                        <br className="hidden sm:inline" />
                        <span>&amp; {candidate.vice_leader_name}</span>
                      </h2>

                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-xl">
                        Pasangan calon Chairman &amp; Vice Chairman HMIF Telkom
                        University Purwokerto Periode 2026/2027.
                      </p>
                    </div>
                  </div>

                  {/* DUAL PROFILE CARDS & CV DOWNLOAD */}
                  <div>
                    <h3 className="text-xs font-bold text-tertiary flex items-center gap-2 mb-3.5">
                      <Users className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                      <span>Profil Kandidat &amp; CV</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CARD CHAIRMAN */}
                      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-primary text-on-primary text-[11px] font-bold">
                            Calon Chairman
                          </span>
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-on-surface">
                              {candidate.leader_name}
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Kandidat Chairman HMIF
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-outline-variant">
                          <a
                            href={chairmanCvUrl}
                            download={chairmanDownloadName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full min-h-[44px] px-4 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface border border-outline-variant text-xs sm:text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Download className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                            <span>Unduh CV Chairman (PDF)</span>
                          </a>
                        </div>
                      </div>

                      {/* CARD VICE CHAIRMAN */}
                      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-primary text-on-primary text-[11px] font-bold">
                            Calon Vice Chairman
                          </span>
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-on-surface">
                              {candidate.vice_leader_name}
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Kandidat Vice Chairman HMIF
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-outline-variant">
                          <a
                            href={viceChairmanCvUrl}
                            download={viceChairmanDownloadName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full min-h-[44px] px-4 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface border border-outline-variant text-xs sm:text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Download className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                            <span>Unduh CV Vice Chairman (PDF)</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VISI & MISI */}
                  <div className="space-y-5">
                    <div className="bg-surface-highlight rounded-xl p-5 sm:p-6 border border-outline-variant space-y-2.5">
                      <div className="flex items-center gap-2 text-tertiary font-bold text-xs">
                        <Target className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        <span>Visi Kepengurusan 2026/2027</span>
                      </div>
                      <p className="text-base sm:text-lg text-on-surface font-medium leading-relaxed">
                        &ldquo;{candidate.vision}&rdquo;
                      </p>
                    </div>

                    <div className="bg-surface-container-low rounded-xl p-5 sm:p-6 border border-outline-variant space-y-4">
                      <div className="flex items-center gap-2 text-tertiary font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        <span>Misi</span>
                      </div>

                      <ol className="space-y-2.5">
                        {candidate.mission.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 bg-surface-container rounded-xl p-3.5 sm:p-4 border border-outline-variant"
                          >
                            <span className="w-6 h-6 rounded-lg bg-primary text-on-primary font-mono font-bold text-xs tabular-nums flex items-center justify-center shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <p className="text-sm sm:text-base text-on-surface leading-relaxed">
                              {item}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="shrink-0 px-4 sm:px-7 py-4 bg-surface-container border-t border-outline-variant flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSelected) {
                        onSelectCandidate(candidate);
                      }
                      onClose();
                    }}
                    className={`w-full sm:w-auto min-h-[44px] px-6 rounded-xl text-sm font-bold transition-[color,background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "bg-surface-container-high text-on-surface border border-primary hover:bg-surface-bright"
                        : "bg-primary text-on-primary hover:bg-secondary"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                        <span>Terpilih &bull; Kembali ke Bilik Suara</span>
                      </>
                    ) : (
                      <>
                        <Vote className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                        <span>Pilih Paslon {numberStr}</span>
                      </>
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
