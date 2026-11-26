"use client";

import { motion } from "framer-motion";
import type { GenerationTurnoutSummary } from "@/lib/ballots/tally-service";

interface CohortTurnoutBarsProps {
  cohorts: GenerationTurnoutSummary[];
}

export function CohortTurnoutBars({ cohorts }: CohortTurnoutBarsProps) {
  const sortedCohorts = [...cohorts].sort((a, b) => a.generation - b.generation);

  return (
    <section
      aria-label="Partisipasi Pemilih Per Angkatan"
      className="rounded-2xl bg-surface-container border border-outline-variant p-5 sm:p-7"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 mb-5 border-b border-outline-variant">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
            Partisipasi Per Angkatan
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Perbandingan jumlah pemilih yang telah menggunakan hak suara pada tiap angkatan DPT.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-on-surface-variant shrink-0 tabular-nums">
          {sortedCohorts.length} Angkatan Terdaftar
        </span>
      </div>

      {sortedCohorts.length === 0 ? (
        <p className="text-xs sm:text-sm text-on-surface-variant py-6 text-center">
          Belum ada data angkatan DPT yang tercatat.
        </p>
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 ${
            sortedCohorts.length >= 4 ? "md:grid-cols-2 md:gap-x-8 md:gap-y-5" : ""
          }`}
        >
          {sortedCohorts.map((cohort, idx) => {
            const safePct = Math.max(0, Math.min(100, cohort.turnoutPercentage));

            return (
              <div key={cohort.generation} className="min-w-0 space-y-2">
                <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
                  <span className="font-semibold text-on-surface truncate">
                    Angkatan {cohort.generation}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                    <span className="text-xs text-on-surface-variant">
                      {cohort.votedCount.toLocaleString("id-ID")} /{" "}
                      {cohort.totalVoters.toLocaleString("id-ID")}
                    </span>
                    <span className="font-bold text-tertiary min-w-[46px] text-right">
                      {safePct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${safePct}%` }}
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
    </section>
  );
}
