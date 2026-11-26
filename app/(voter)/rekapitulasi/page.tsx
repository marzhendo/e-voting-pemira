"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SiteFooter } from "@/components/layout/site-footer";

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
        throw new Error(data?.error || "Gagal memuat data Rekapitulasi Suara.");
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

  useEffect(() => {
    if (!recap || recap.isClosed) return;

    const pollTimer = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchRecap(true);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(pollTimer);
  }, [recap, fetchRecap]);

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
    <div className="bg-surface text-on-surface font-sans antialiased min-h-[100dvh] flex flex-col justify-between overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-outline-variant bg-surface/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
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
              <span className="text-xs sm:text-sm font-bold text-on-surface tracking-tight block leading-tight truncate">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium block leading-tight truncate">
                {isClosed ? "Rekapitulasi Suara Resmi" : "Partisipasi Pemilih"}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => fetchRecap(false)}
              disabled={refreshing || loading}
              aria-label="Muat ulang data"
              className="min-h-[44px] min-w-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface-variant hover:text-on-surface inline-flex items-center justify-center gap-2 transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-tertiary" : ""}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar dari akun"
              className="min-h-[44px] min-w-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-surface-container hover:bg-error-container dark:hover:bg-error-container/30 border border-outline-variant hover:border-error/40 text-xs font-semibold text-on-surface-variant hover:text-error inline-flex items-center justify-center gap-2 transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        id="main-content"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.18 }}
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6"
      >
        {/* Title & Status Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-outline-variant">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-bold">
              {isClosed ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span>Pemungutan Suara Ditutup Resmi</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-tertiary">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                  <span>Pemungutan Suara Berlangsung</span>
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
              {isClosed ? "Rekapitulasi Suara" : "Pantauan Partisipasi Pemilih"}
            </h1>

            {!isClosed && (
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                Pantauan Partisipasi Pemilih dalam Daftar Pemilih Tetap (DPT) secara berkala. Perolehan suara tiap pasangan calon Chairman &amp; Vice Chairman HMIF baru dipublikasikan setelah Bilik Suara Digital ditutup resmi.
              </p>
            )}
          </div>

          {/* Timing & Polling Metadata */}
          {recap && (
            <div className="text-xs space-y-1 shrink-0 md:text-right">
              {!isClosed && countdownText && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-surface-container border border-outline-variant px-3.5 py-2 text-on-surface">
                  <Clock className="w-3.5 h-3.5 text-tertiary shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="text-on-surface-variant">Sisa waktu:</span>
                  <span className="font-mono font-bold text-on-surface tabular-nums">
                    {countdownText}
                  </span>
                </div>
              )}
              {lastUpdatedLabel && (
                <p className="font-mono text-[11px] text-on-surface-variant tabular-nums">
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
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant rounded-2xl bg-surface-container border border-outline-variant">
            <Loader2 className="w-7 h-7 animate-spin text-tertiary" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs sm:text-sm">Memuat data pemilihan terbaru...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && !recap && (
          <div
            role="alert"
            className="rounded-2xl bg-surface-container border border-error/40 p-6 sm:p-8 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-error-container dark:bg-error-container/40 border border-error/30 flex items-center justify-center mx-auto text-error">
              <AlertTriangle className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
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
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs sm:text-sm font-bold transition-[color,background-color,transform] duration-150 active:scale-[0.96] inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Muat Ulang Data</span>
            </button>
          </div>
        )}

        {/* Transient warning */}
        {!loading && errorMsg && recap && (
          <div
            role="alert"
            className="rounded-xl bg-error-container dark:bg-error-container/30 border border-error/40 px-4 py-3 text-xs text-error flex items-center gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="text-on-surface">
              Gagal menyegarkan data: {errorMsg}. Menampilkan data terakhir yang tercatat.
            </span>
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

                <section
                  aria-label="Kerahasiaan Perolehan Suara Pasangan Calon"
                  className="rounded-2xl bg-surface-highlight border border-outline-variant p-5 sm:p-6 flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center shrink-0 text-tertiary">
                    <LockKeyhole className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-on-surface">
                      Perolehan Suara Pasangan Calon Terkunci
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
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

      <SiteFooter />
    </div>
  );
}
