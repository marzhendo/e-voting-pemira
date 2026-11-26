"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Inbox } from "lucide-react";
import type { RecapResultItem } from "@/lib/ballots/recap-contract";

interface RecapResultsViewProps {
  results: RecapResultItem[];
  totalVotes: number;
}

const SEGMENT_COLORS = ["#EBBD1C", "#29388B", "#B71B25", "#5E5E5E"];

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
      <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0">
        <Inbox className="w-6 h-6 text-on-surface-variant" strokeWidth={1.75} aria-hidden="true" />
      </div>
    );
  }

  if (!imgSrc || imgFailed) {
    return (
      <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl bg-surface-container-high border border-outline-variant flex flex-col items-center justify-center shrink-0 text-center p-1">
        <Users className="w-5 h-5 text-on-surface-variant" strokeWidth={1.75} aria-hidden="true" />
        <span className="font-mono text-[10px] font-bold text-on-surface mt-0.5 tabular-nums">
          {String(candidateNumber).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-surface-container-high shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
}: RecapResultsViewProps) {
  const totalValidBallots = results.reduce((sum, item) => sum + item.voteCount, 0);
  const effectiveDenominator = totalValidBallots > 0 ? totalValidBallots : totalVotes;

  const topVotes = results.length > 0 ? results[0].voteCount : 0;
  const topLeadersCount = results.filter(
    (item) => item.voteCount === topVotes && topVotes > 0
  ).length;
  const hasUniqueLeader = topVotes > 0 && topLeadersCount === 1;
  const topItem = hasUniqueLeader ? results[0] : null;

  const summaryHeading =
    effectiveDenominator === 0
      ? "Belum Ada Suara Masuk"
      : topItem
      ? topItem.candidateNumber === 0
        ? "Kotak Kosong Unggul"
        : `Paslon ${String(topItem.candidateNumber).padStart(2, "0")} Meraih Suara Terbanyak`
      : "Perolehan Suara Imbang";

  return (
    <section
      aria-label="Hasil Resmi Rekapitulasi Suara"
      className="rounded-2xl bg-surface-container border border-outline-variant overflow-hidden"
    >
      {/* Top Summary & Stacked Proportion Bar */}
      <div className="p-5 sm:p-7 space-y-5 border-b border-outline-variant">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-tertiary block">
              Hasil Akhir Pemilihan
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface mt-1 leading-tight">
              {summaryHeading}
            </h2>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs font-semibold text-on-surface-variant block">
              Total Suara Sah
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold text-on-surface tabular-nums leading-none mt-1 block">
              {effectiveDenominator.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {results.length > 0 && effectiveDenominator > 0 && (
          <div className="space-y-2.5">
            <div
              className="w-full h-3.5 rounded-full bg-surface-container-highest overflow-hidden flex"
              role="img"
              aria-label="Proporsi perolehan suara"
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
                    className="h-full border-r border-surface-container last:border-r-0"
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-on-surface-variant">
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
                    <span className="text-on-surface font-semibold truncate">
                      {isKotakKosong
                        ? "Kotak Kosong"
                        : `Paslon ${String(item.candidateNumber).padStart(2, "0")}`}
                    </span>
                    <span className="font-mono tabular-nums">{item.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ranked Candidate Rows */}
      <div className="divide-y divide-outline-variant">
        {results.map((item, idx) => {
          const isKotakKosong = item.candidateNumber === 0;
          const isLeading = hasUniqueLeader && idx === 0;
          const numberLabel = String(item.candidateNumber).padStart(2, "0");

          return (
            <div
              key={item.candidateId}
              className={`p-5 sm:px-7 sm:py-5 ${
                isLeading && !isKotakKosong ? "bg-surface-highlight/60" : ""
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md font-mono tabular-nums ${
                            isKotakKosong
                              ? "bg-surface-container-high text-on-surface-variant border border-outline-variant"
                              : "bg-primary text-on-primary"
                          }`}
                        >
                          {isKotakKosong ? "Opsi Abstain Sah" : `Nomor Urut ${numberLabel}`}
                        </span>
                        {isLeading && (
                          <span className="text-xs font-bold text-tertiary">
                            Suara Terbanyak
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
                          Chairman &amp; Vice Chairman HMIF
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0.5 shrink-0 font-mono tabular-nums">
                      <span className="text-2xl sm:text-3xl font-bold text-on-surface leading-none">
                        {item.percentage}%
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
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
                        isKotakKosong ? "bg-on-surface-variant/60" : "bg-primary"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
