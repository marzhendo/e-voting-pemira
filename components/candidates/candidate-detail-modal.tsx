'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/portal';
import {
  ArrowLeft,
  X,
  Download,
  Target,
  CheckCircle2,
  Users,
  Vote,
  ShieldCheck,
  Award,
} from 'lucide-react';
import type { CandidateItem } from '@/components/ballot/candidate-card';

interface CandidateDetailModalProps {
  isOpen: boolean;
  candidate: CandidateItem | null;
  isSelected?: boolean;
  onClose: () => void;
  onSelectCandidate: (candidate: CandidateItem) => void;
}

function sanitizeCvUrl(url?: string | null, fallbackUrl: string = '#'): string {
  if (!url || typeof url !== 'string') return fallbackUrl;
  const trimmed = url.trim();
  // Cegah injeksi protokol berbahaya (javascript:, data:, vbscript:)
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return fallbackUrl;
  }
  // Hanya izinkan path lokal yang aman atau URL http/https
  if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return fallbackUrl;
}

export function CandidateDetailModal({
  isOpen,
  candidate,
  isSelected = false,
  onClose,
  onSelectCandidate,
}: CandidateDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const numberStr = candidate.candidate_number.toString().padStart(2, '0');
  const fallbackChairman = `/assets/docs/cv-paslon-${candidate.candidate_number}-chairman.pdf`;
  const fallbackViceChairman = `/assets/docs/cv-paslon-${candidate.candidate_number}-vice-chairman.pdf`;

  const chairmanCvUrl = sanitizeCvUrl(candidate.chairman_cv_url, fallbackChairman);
  const viceChairmanCvUrl = sanitizeCvUrl(candidate.vice_chairman_cv_url, fallbackViceChairman);

  const chairmanDownloadName = `CV-Chairman-Paslon-${numberStr}-${candidate.leader_name.replace(/\s+/g, '-')}.pdf`;
  const viceChairmanDownloadName = `CV-ViceChairman-Paslon-${numberStr}-${candidate.vice_leader_name.replace(/\s+/g, '-')}.pdf`;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && candidate && (
          <motion.div
            key="detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-detail-title"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md"
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
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col min-h-0 bg-surface-container rounded-2xl sm:rounded-3xl border border-outline-variant/40 overflow-hidden my-auto"
              >
            {/* TOP NAVBAR / HEADER */}
            <div className="shrink-0 px-4 sm:px-8 py-3.5 sm:py-4 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest min-h-[44px] px-3.5 py-2 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Bilik Suara</span>
              </button>

              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                  Nomor Urut {numberStr}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup Detail"
                  className="w-11 h-11 rounded-full bg-surface-container-highest hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE MAIN CONTENT */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8 touch-pan-y">
          {/* HERO BANNER & IDENTITY */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
            {/* Foto Paslon */}
            <div className="relative w-40 h-48 sm:w-48 sm:h-56 shrink-0 rounded-2xl overflow-hidden bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center shadow-md">
              {candidate.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={candidate.photo_url}
                  alt={`Paslon ${numberStr}`}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant p-4 text-center">
                  <Users className="w-12 h-12 text-primary/70" />
                  <span className="text-xs font-medium">Foto Paslon {numberStr}</span>
                </div>
              )}
            </div>

            {/* Nama & Deskripsi */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/30 text-[11px] font-bold uppercase tracking-widest text-primary">
                <Award className="w-3.5 h-3.5" />
                <span>Pemira HMIF 2026/2027</span>
              </div>

              <h1
                id="candidate-detail-title"
                className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight leading-tight"
              >
                {candidate.leader_name} <br className="hidden sm:inline" />
                <span className="text-primary">&amp; {candidate.vice_leader_name}</span>
              </h1>

              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-xl">
                Pasangan calon Chairman &amp; Vice Chairman HMIF Telkom University Purwokerto Periode 2026/2027.
              </p>
            </div>
          </div>

          {/* DUAL PROFILE CARDS & SEPARATE CV DOWNLOAD BUTTONS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Profil Kandidat &amp; CV</span>
              </h2>
              <span className="text-[11px] text-on-surface-variant hidden sm:inline">
                Klik tombol masing-masing untuk mengunduh dokumen CV
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* CARD CHAIRMAN */}
              <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between gap-5 relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 text-[11px] font-extrabold tracking-wider uppercase">
                      Calon Chairman
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">Informatika</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-on-surface">
                      {candidate.leader_name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Kandidat Chairman HMIF
                    </p>
                  </div>
                </div>

                {/* DEDICATED CHAIRMAN CV DOWNLOAD BUTTON */}
                <div className="pt-3 border-t border-outline-variant/20">
                  <a
                    href={chairmanCvUrl}
                    download={chairmanDownloadName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 min-h-[44px] px-4 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface border border-outline-variant/30 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer group/btn active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Download className="w-4 h-4 text-primary group-hover/btn:text-on-primary transition-all" />
                    <span>Unduh CV Chairman (PDF)</span>
                  </a>
                </div>
              </div>

              {/* CARD VICE CHAIRMAN */}
              <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between gap-5 relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 text-[11px] font-extrabold tracking-wider uppercase">
                      Calon Vice Chairman
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">Informatika</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-on-surface">
                      {candidate.vice_leader_name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Kandidat Vice Chairman HMIF
                    </p>
                  </div>
                </div>

                {/* DEDICATED VICE CHAIRMAN CV DOWNLOAD BUTTON */}
                <div className="pt-3 border-t border-outline-variant/20">
                  <a
                    href={viceChairmanCvUrl}
                    download={viceChairmanDownloadName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 min-h-[44px] px-4 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface border border-outline-variant/30 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer group/btn active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Download className="w-4 h-4 text-primary group-hover/btn:text-on-primary transition-all" />
                    <span>Unduh CV Vice Chairman (PDF)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* VISI & MISI DETAIL SECTION */}
          <div className="space-y-6">
            {/* Visi */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20 space-y-2.5">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>Visi Kepengurusan 2026/2027</span>
              </div>
              <p className="text-sm sm:text-base text-on-surface font-medium leading-relaxed italic border-l-2 border-primary pl-4 py-1">
                &ldquo;{candidate.vision}&rdquo;
              </p>
            </div>

            {/* Misi */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Misi</span>
              </div>

              <div className="space-y-3">
                {candidate.mission.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3.5 bg-surface-container-high/60 rounded-xl p-3.5 border border-outline-variant/20"
                  >
                    <span className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="shrink-0 px-5 sm:px-8 py-4 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Suara dijamin rahasia dan tidak ditautkan ke NIM.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none h-11 min-h-[44px] px-5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Tutup
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
              type="button"
              onClick={() => {
                onSelectCandidate(candidate);
                onClose();
              }}
              className="flex-1 sm:flex-none h-11 min-h-[44px] px-6 rounded-xl bg-primary text-on-primary hover:bg-secondary text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Vote className="w-4 h-4" />
              <span>{isSelected ? 'Kembali ke Surat Suara' : `Pilih Paslon ${numberStr}`}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  </motion.div>
)}
</AnimatePresence>
</Portal>
  );
}
