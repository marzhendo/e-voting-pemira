"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RefreshCw,
  LockKeyhole,
  LogOut,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { ElectionRecapPayload } from "@/lib/ballots/recap-contract";
import { TurnoutGauge } from "@/components/recap/turnout-gauge";
import { CohortTurnoutBars } from "@/components/recap/cohort-turnout-bars";
import { RecapResultsView } from "@/components/recap/recap-results-view";
import { ClosedParticipationCard } from "@/components/recap/closed-participation-card";

const POLLING_INTERVAL_MS = 30_000;

function formatCountdown(targetIso: string, nowMs: number): string | null {
  const targetMs = new Date(targetIso).getTime();
  if (Number.isNaN(targetMs)) return null;
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function RekapitulasiPage() {
  const [recap, setRecap] = useState<ElectionRecapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const isFetchingRef = useRef(false);

  const fetchRecap = useCallback(async (isBackgroundPoll = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isBackgroundPoll) {
      setRefreshing(true);
    }

    try {
      const res = await fetch("/api/election/tally", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login?redirect=%2Frekapitulasi&error=REKAP_AUTH_REQUIRED";
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Gagal memuat data rekapitulasi.");
      }

      setRecap(data as ElectionRecapPayload);
      setErrorMsg(null);
      setLastUpdatedLabel(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kendala saat mengambil data.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchRecap(false);
  }, [fetchRecap]);

  // Poll every 30s ONLY while voting is open; automatically stops once closed
  useEffect(() => {
    if (!recap || recap.isClosed) return;

    const pollTimer = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchRecap(true);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(pollTimer);
  }, [recap, fetchRecap]);

  // Live 1s countdown ticker while voting is active
  useEffect(() => {
    if (!recap || recap.isClosed) return;

    const clock = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(clock);
  }, [recap]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      sessionStorage.clear();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const isClosed = Boolean(recap?.isClosed);
  const countdownText =
    recap && !recap.isClosed
      ? formatCountdown(recap.electionWindow.endTime, nowMs)
      : null;

  const formattedCloseTime = recap?.electionWindow.endTime
    ? new Date(recap.electionWindow.endTime).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : null;

  return (
    <div className="bg-surface text-on-surface font-montserrat antialiased min-h-screen flex flex-col justify-between overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF Telkom University Purwokerto"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider block leading-tight truncate">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium block leading-tight truncate">
                {isClosed ? "Rekapitulasi Suara Resmi" : "Partisipasi Pemilih"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
              type="button"
              onClick={() => fetchRecap(false)}
              disabled={refreshing || loading}
              aria-label="Muat ulang data"
              className="min-h-[44px] min-w-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface inline-flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Segarkan</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
              type="button"
              onClick={handleLogout}
              aria-label="Keluar dari akun"
              className="min-h-[44px] min-w-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-surface-container hover:bg-error/10 border border-outline-variant/30 hover:border-error/30 text-xs font-semibold text-on-surface-variant hover:text-error inline-flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.18 }}
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6"
      >
        {/* Title & Status Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-outline-variant/20">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              {isClosed ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Pemungutan Suara Ditutup Resmi</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                  <span>Pemungutan Suara Berlangsung</span>
                </span>
              )}
            </div>

            <h1 className="font-bebas text-3xl sm:text-5xl tracking-wide uppercase text-on-surface text-balance leading-tight">
              {isClosed ? "Rekapitulasi Suara" : "Pantauan Partisipasi Pemilih"}
            </h1>

            {!isClosed && (
              <p className="text-xs sm:text-sm text-on-surface-variant text-pretty max-w-2xl">
                Pantauan partisipasi DPT secara berkala. Perolehan suara tiap pasangan calon baru dipublikasikan setelah bilik suara resmi ditutup.
              </p>
            )}
          </div>

          {/* Timing & Polling Metadata */}
          {recap && (
            <div className="text-xs space-y-1 shrink-0 md:text-right">
              {!isClosed && countdownText && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-surface-container border border-outline-variant/25 px-3.5 py-2 text-on-surface">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-on-surface-variant">Sisa waktu:</span>
                  <span className="font-mono font-bold text-primary tabular-nums">
                    {countdownText}
                  </span>
                </div>
              )}
              {lastUpdatedLabel && (
                <p className="text-[11px] text-on-surface-variant tabular-nums">
                  {isClosed
                    ? `Data final diperbarui pukul ${lastUpdatedLabel}`
                    : `Diperbarui pukul ${lastUpdatedLabel} • Auto-refresh 30 dtk`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant rounded-2xl bg-surface-container border border-outline-variant/25">
            <Loader2 className="w-7 h-7 animate-spin text-primary" aria-hidden="true" />
            <p className="text-xs sm:text-sm">Memuat data pemilihan terbaru...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && !recap && (
          <div className="rounded-2xl bg-surface-container border border-error/30 p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/25 flex items-center justify-center mx-auto text-error">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h2 className="text-sm sm:text-base font-bold text-on-surface">
                Data Belum Dapat Dimuat
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchRecap(false)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* Transient warning if refresh fails after initial data */}
        {!loading && errorMsg && recap && (
          <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-xs text-error flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Gagal menyegarkan data: {errorMsg}. Menampilkan data terakhir yang tercatat.</span>
          </div>
        )}

        {/* Data Loaded Views */}
        {!loading && recap && (
          <>
            {recap.isClosed && recap.results ? (
              <>
                <RecapResultsView
                  results={recap.results}
                  totalVotes={recap.turnout.totalVotes}
                />

                <ClosedParticipationCard
                  totalDpt={recap.turnout.totalDpt}
                  totalVotes={recap.turnout.totalVotes}
                  turnoutPercentage={recap.turnout.turnoutPercentage}
                  cohorts={recap.turnout.byGeneration}
                />
              </>
            ) : (
              <>
                <TurnoutGauge
                  totalDpt={recap.turnout.totalDpt}
                  totalVotes={recap.turnout.totalVotes}
                  turnoutPercentage={recap.turnout.turnoutPercentage}
                  isClosed={false}
                />

                <CohortTurnoutBars cohorts={recap.turnout.byGeneration} />

                {/* Candidate Results Strictly Locked Notice */}
                <section
                  aria-label="Kerahasiaan Perolehan Suara Pasangan Calon"
                  className="rounded-2xl bg-surface-container-low border border-outline-variant/25 p-5 sm:p-6 flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center shrink-0 text-primary">
                    <LockKeyhole className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-on-surface">
                      Perolehan Suara Pasangan Calon Terkunci
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-pretty">
                      Untuk menjaga netralitas dan kerahasiaan pilihan pemilih, rincian perolehan suara setiap pasangan calon tidak ditampilkan selama pemungutan suara masih berjalan. Rekapitulasi Suara akan terbuka otomatis di halaman ini setelah pemilihan resmi ditutup
                      {formattedCloseTime ? ` (${formattedCloseTime})` : ""}.
                    </p>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </motion.main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/20 bg-surface-container-low/50 py-5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant text-center sm:text-left">
          <p>Surat Suara Anonim terpisah dari identitas pemilih.</p>
          <p>Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto</p>
        </div>
      </footer>
    </div>
  );
}
