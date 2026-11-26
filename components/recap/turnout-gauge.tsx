"use client";

import { motion } from "framer-motion";
import { Users, CheckCircle2, Clock } from "lucide-react";

interface TurnoutGaugeProps {
  totalDpt: number;
  totalVotes: number;
  turnoutPercentage: number;
  isClosed: boolean;
}

export function TurnoutGauge({
  totalDpt,
  totalVotes,
  turnoutPercentage,
  isClosed,
}: TurnoutGaugeProps) {
  const safePercentage = Math.max(0, Math.min(100, turnoutPercentage));
  const notVotedCount = Math.max(0, totalDpt - totalVotes);

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (safePercentage / 100) * circumference;

  return (
    <section
      aria-label="Ringkasan Partisipasi Pemilih DPT"
      className="rounded-2xl bg-surface-container border border-outline-variant p-5 sm:p-7"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        {/* SVG Circular Gauge */}
        <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto md:mx-0 shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 180 180"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label={`Tingkat Partisipasi Pemilih ${safePercentage}%`}
          >
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgb(var(--surface-container-highest))"
              strokeWidth="14"
            />
            <motion.circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#EBBD1C"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            <span className="font-mono text-3xl sm:text-4xl font-bold leading-none text-on-surface tabular-nums">
              {safePercentage.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-on-surface-variant mt-1">
              Partisipasi
            </span>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
              Partisipasi Pemilih DPT
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
              {isClosed
                ? "Tingkat keikutsertaan mahasiswa aktif Informatika dalam Daftar Pemilih Tetap (DPT) hingga penutupan Bilik Suara Digital."
                : "Pantauan jumlah pemilih dalam Daftar Pemilih Tetap (DPT) yang telah menyalurkan hak suara."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Sudah Memilih</span>
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-on-surface mt-1.5 tabular-nums leading-none">
                {totalVotes.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                <Clock className="w-3.5 h-3.5 text-on-surface-variant shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Belum Memilih</span>
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-on-surface-variant mt-1.5 tabular-nums leading-none">
                {notVotedCount.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                <Users className="w-3.5 h-3.5 text-tertiary shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Total DPT</span>
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-tertiary mt-1.5 tabular-nums leading-none">
                {totalDpt.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
