"use client";

import { motion } from "framer-motion";
import type { GenerationTurnoutSummary } from "@/lib/ballots/tally-service";

interface ClosedParticipationCardProps {
  totalDpt: number;
  totalVotes: number;
  turnoutPercentage: number;
  cohorts: GenerationTurnoutSummary[];
}

export function ClosedParticipationCard({
  totalDpt,
  totalVotes,
  turnoutPercentage,
  cohorts,
}: ClosedParticipationCardProps) {
  const safePct = Math.max(0, Math.min(100, turnoutPercentage));
  const notVotedCount = Math.max(0, totalDpt - totalVotes);
  const sortedCohorts = [...cohorts].sort((a, b) => a.generation - b.generation);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePct / 100) * circumference;

  return (
    <section
      aria-label="Partisipasi Pemilih DPT"
      className="rounded-2xl bg-surface-container border border-outline-variant p-5 sm:p-7"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Compact Overall DPT Ring */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-start gap-5 pb-5 lg:pb-0 border-b lg:border-b-0 lg:border-r border-outline-variant lg:pr-6">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 150 150"
              className="w-full h-full -rotate-90"
              role="img"
              aria-label={`Partisipasi Pemilih ${safePct}%`}
            >
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="rgb(var(--surface-container-highest))"
                strokeWidth="12"
              />
              <motion.circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="#EBBD1C"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <span className="font-mono text-2xl sm:text-3xl font-bold leading-none text-on-surface tabular-nums">
                {safePct.toFixed(1)}%
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant mt-1">
                Partisipasi
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left min-w-0">
            <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
              Partisipasi Pemilih
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-mono tabular-nums">
              <strong className="text-on-surface">{totalVotes.toLocaleString("id-ID")}</strong> dari{" "}
              <strong className="text-on-surface">{totalDpt.toLocaleString("id-ID")}</strong> DPT menggunakan hak suara ({notVotedCount.toLocaleString("id-ID")} tidak memilih).
            </p>
          </div>
        </div>

        {/* Right: Per-Cohort Breakdown */}
        <div className="lg:col-span-8 min-w-0 space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-bold text-on-surface-variant">
              Rincian Per Angkatan
            </h3>
            <span className="font-mono text-xs text-on-surface-variant tabular-nums">
              {sortedCohorts.length} Angkatan
            </span>
          </div>

          {sortedCohorts.length === 0 ? (
            <p className="text-xs sm:text-sm text-on-surface-variant py-4">
              Belum ada data angkatan DPT.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-4">
              {sortedCohorts.map((cohort, idx) => {
                const cohortPct = Math.max(0, Math.min(100, cohort.turnoutPercentage));
                return (
                  <div key={cohort.generation} className="min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-semibold text-on-surface truncate">
                        Angkatan {cohort.generation}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                        <span className="text-on-surface-variant">
                          {cohort.votedCount}/{cohort.totalVoters}
                        </span>
                        <span className="font-bold text-tertiary min-w-[44px] text-right">
                          {cohortPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cohortPct}%` }}
                        transition={{
                          duration: 0.55,
                          delay: Math.min(idx * 0.04, 0.24),
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
