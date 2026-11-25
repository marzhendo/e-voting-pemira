"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, ShieldCheck, Users, Inbox, ArrowRight } from "lucide-react";
import type { RecapResultItem } from "@/lib/ballots/recap-contract";

interface RecapResultsViewProps {
  results: RecapResultItem[];
  totalVotes: number;
  totalDpt: number;
}

const SEGMENT_COLORS = ["#EBBD1C", "#29388B", "#F3EC51", "#8B8A8B"];

function CandidatePortrait({
  photoUrl,
  candidateNumber,
  leaderName,
  viceLeaderName,
}: {
  photoUrl: string | null;
  candidateNumber: number;
  leaderName: string;
  viceLeaderName: string;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(photoUrl);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(photoUrl);
    setImgFailed(false);
  }, [photoUrl]);

  const handleImageError = () => {
    const staticFallback = `/assets/candidates/paslon-${candidateNumber}.webp`;
    if (imgSrc && imgSrc !== staticFallback) {
      setImgSrc(staticFallback);
    } else {
      setImgFailed(true);
    }
  };

  if (candidateNumber === 0) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shrink-0">
        <Inbox className="w-7 h-7 text-on-surface-variant" aria-hidden="true" />
      </div>
    );
  }

  if (!imgSrc || imgFailed) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-container-high border border-outline-variant/40 flex flex-col items-center justify-center shrink-0 text-center p-1">
        <Users className="w-6 h-6 text-primary/80" aria-hidden="true" />
        <span className="text-[10px] font-bold text-primary mt-0.5 tabular-nums">
          {String(candidateNumber).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-container-high shrink-0 ring-1 ring-white/10">
      <img
        src={imgSrc}
        alt={`Pasangan Calon ${String(candidateNumber).padStart(2, "0")}: ${leaderName} dan ${viceLeaderName}`}
        className="w-full h-full object-cover object-top"
        onError={handleImageError}
      />
    </div>
  );
}

export function RecapResultsView({
  results,
  totalVotes,
  totalDpt,
}: RecapResultsViewProps) {
  const totalValidBallots = results.reduce((sum, item) => sum + item.voteCount, 0);
  const effectiveDenominator = totalValidBallots > 0 ? totalValidBallots : totalVotes;

  const topVotes = results.length > 0 ? results[0].voteCount : 0;
  const topLeadersCount = results.filter(
    (item) => item.voteCount === topVotes && topVotes > 0
  ).length;
  const hasUniqueLeader = topVotes > 0 && topLeadersCount === 1;
  const topItem = hasUniqueLeader ? results[0] : null;

  return (
    <div className="space-y-6">
      {/* Executive Official Result Banner */}
      <section
        aria-label="Ringkasan Hasil Resmi Rekapitulasi Suara"
        className="rounded-2xl bg-surface-container border border-primary/35 p-5 sm:p-7"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Hasil Resmi Rekapitulasi Suara</span>
            </div>

            {effectiveDenominator === 0 ? (
              <h2 className="font-bebas text-2xl sm:text-4xl tracking-wide uppercase text-on-surface text-balance">
                Belum Ada Surat Suara Masuk
              </h2>
            ) : topItem ? (
              <h2 className="font-bebas text-2xl sm:text-4xl tracking-wide uppercase text-brand-cream text-balance">
                {topItem.candidateNumber === 0
                  ? `Kotak Kosong Unggul dengan ${topItem.percentage}% Suara`
                  : `Paslon ${String(topItem.candidateNumber).padStart(2, "0")} (${topItem.leaderName} & ${topItem.viceLeaderName}) Meraih ${topItem.percentage}% Suara`}
              </h2>
            ) : (
              <h2 className="font-bebas text-2xl sm:text-4xl tracking-wide uppercase text-brand-cream text-balance">
                Perolehan Suara Teratas Imbang ({topVotes.toLocaleString("id-ID")} Suara)
              </h2>
            )}

            <p className="text-xs sm:text-sm text-on-surface-variant text-pretty max-w-2xl leading-relaxed">
              Agregasi resmi dari seluruh Surat Suara Anonim sah yang tercatat hingga penutupan Bilik Suara Digital Pemira HMIF 2026/2027.
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-outline-variant/25 md:pl-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block">
                Total Suara Sah
              </span>
              <span className="font-bebas text-3xl sm:text-4xl text-primary tabular-nums leading-none mt-1 block">
                {effectiveDenominator.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block">
                Dari Total DPT
              </span>
              <span className="font-bebas text-3xl sm:text-4xl text-on-surface tabular-nums leading-none mt-1 block">
                {totalDpt.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Stacked 100% Proportion Distribution Bar */}
        {results.length > 0 && effectiveDenominator > 0 && (
          <div className="mt-6 pt-5 border-t border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span className="font-semibold text-on-surface">
                Proporsi Perolehan Suara
              </span>
              <span className="tabular-nums">Total 100%</span>
            </div>

            <div
              className="w-full h-4 sm:h-5 rounded-full bg-surface-container-highest overflow-hidden flex"
              role="img"
              aria-label="Grafik proporsi perolehan suara pasangan calon"
            >
              {results.map((item, idx) => {
                const isKotakKosong = item.candidateNumber === 0;
                const fill = isKotakKosong
                  ? "#5E5E5E"
                  : SEGMENT_COLORS[idx % (SEGMENT_COLORS.length - 1)];
                const widthPct = Math.max(0, Math.min(100, item.percentage));
                if (widthPct <= 0) return null;

                return (
                  <motion.div
                    key={item.candidateId}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    style={{ backgroundColor: fill }}
                    className="h-full first:rounded-l-full last:rounded-r-full border-r border-surface-container last:border-r-0"
                    title={`${
                      isKotakKosong
                        ? "Kotak Kosong"
                        : `Paslon ${String(item.candidateNumber).padStart(2, "0")}`
                    }: ${item.percentage}%`}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-on-surface-variant pt-1">
              {results.map((item, idx) => {
                const isKotakKosong = item.candidateNumber === 0;
                const dotColor = isKotakKosong
                  ? "#5E5E5E"
                  : SEGMENT_COLORS[idx % (SEGMENT_COLORS.length - 1)];
                return (
                  <div key={item.candidateId} className="inline-flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium text-on-surface">
                      {isKotakKosong
                        ? "Kotak Kosong"
                        : `Paslon ${String(item.candidateNumber).padStart(2, "0")}`}
                    </span>
                    <span className="tabular-nums text-on-surface-variant">
                      ({item.percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Horizontal Ranked Vote Cards */}
      <section
        aria-label="Rincian Perolehan Suara Pasangan Calon"
        className="space-y-3.5"
      >
        {results.map((item, idx) => {
          const isKotakKosong = item.candidateNumber === 0;
          const isLeading = hasUniqueLeader && idx === 0;
          const numberLabel = String(item.candidateNumber).padStart(2, "0");

          return (
            <div
              key={item.candidateId}
              className={`rounded-2xl p-4 sm:p-5 border transition-colors ${
                isLeading && !isKotakKosong
                  ? "bg-surface-container border-primary/50"
                  : "bg-surface-container border-outline-variant/30"
              }`}
            >
              <div className="flex items-start sm:items-center gap-4">
                <CandidatePortrait
                  photoUrl={item.photoUrl}
                  candidateNumber={item.candidateNumber}
                  leaderName={item.leaderName}
                  viceLeaderName={item.viceLeaderName}
                />

                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md tabular-nums ${
                            isKotakKosong
                              ? "bg-surface-container-high text-on-surface-variant"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {isKotakKosong ? "Opsi Abstain Sah" : `Nomor Urut ${numberLabel}`}
                        </span>
                        {isLeading && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cream">
                            Perolehan Tertinggi
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-on-surface mt-1.5 break-words">
                        {isKotakKosong
                          ? "Kotak Kosong"
                          : `${item.leaderName} & ${item.viceLeaderName}`}
                      </h3>
                      {!isKotakKosong && (
                        <p className="text-xs text-on-surface-variant">
                          Calon Chairman &amp; Vice Chairman HMIF
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0.5 shrink-0 pt-1 sm:pt-0">
                      <span className="font-bebas text-3xl sm:text-4xl text-primary tabular-nums leading-none">
                        {item.percentage}%
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-on-surface tabular-nums">
                        {item.voteCount.toLocaleString("id-ID")} Suara
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }}
                      transition={{
                        duration: 0.65,
                        delay: Math.min(idx * 0.06, 0.24),
                        ease: "easeOut",
                      }}
                      className={`h-full rounded-full ${
                        isKotakKosong ? "bg-on-surface-variant/50" : "bg-primary"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Ballot Secrecy & BAST Verification Panel */}
      <section
        aria-label="Jaminan Kerahasiaan Surat Suara dan Verifikasi BAST"
        className="rounded-2xl bg-surface-container-low border border-outline-variant/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0 text-primary">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-on-surface">
              Integritas Surat Suara Anonim
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed text-pretty">
              Seluruh hasil dihitung langsung dari tabel Surat Suara Anonim tanpa keterkaitan identitas pemilih maupun NIM. Jika kamu memiliki kode hash Berita Acara (BAST) dari panitia, validasi keabsahannya secara mandiri.
            </p>
          </div>
        </div>

        <Link
          href="/bast/verify"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright border border-outline-variant/30 text-xs font-semibold text-on-surface inline-flex items-center justify-center gap-2 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span>Verifikasi BAST</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
