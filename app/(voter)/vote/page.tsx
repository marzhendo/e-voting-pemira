"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  HelpCircle,
  Loader2,
  LogOut,
} from "lucide-react";
import {
  CandidateCard,
  type CandidateItem,
} from "@/components/ballot/candidate-card";
import { KotakKosongCard } from "@/components/ballot/kotak-kosong-card";
import { ConfirmationModal } from "@/components/ballot/confirmation-modal";
import { SessionExpiredModal } from "@/components/ballot/session-expired-modal";
import { LogoutModal } from "@/components/ballot/logout-modal";
import { CandidateDetailModal } from "@/components/candidates/candidate-detail-modal";
import { castBallotAction } from "@/lib/actions/ballot";
import { MaintenanceBooth } from "@/components/maintenance/maintenance-booth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { KPR_WHATSAPP_URL } from "@/components/layout/site-header";

export default function VotePage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateItem | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<CandidateItem | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingElection, setLoadingElection] = useState(true);
  const [electionError, setElectionError] = useState<string | null>(null);
  const [votingActive, setVotingActive] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [electionSchedule, setElectionSchedule] = useState<{
    start: string;
    end: string;
  } | null>(null);

  // Sisa waktu sesi (15 menit countdown)
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(false);
  const [lastCheckedMaintenance, setLastCheckedMaintenance] = useState<
    string | null
  >(null);

  const checkElectionStatus = async () => {
    setIsCheckingMaintenance(true);
    try {
      const res = await fetch("/api/election", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.electionStatus) {
        setVotingActive(data.electionStatus.isVotingActive);
        setMaintenanceMode(data.electionStatus.maintenanceMode);
        if (data.electionStatus.startTime && data.electionStatus.endTime) {
          setElectionSchedule({
            start: data.electionStatus.startTime,
            end: data.electionStatus.endTime,
          });
        }
        if (data.candidates) {
          setCandidates(data.candidates);
        }
        const now = new Date();
        setLastCheckedMaintenance(
          now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) + " WIB",
        );
      }
    } catch {
      // Abaikan gangguan koneksi sesaat
    } finally {
      setIsCheckingMaintenance(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDevOrTestHost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local");

      if (isDevOrTestHost) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("expired") === "true") {
          setIsSessionExpired(true);
        } else if (params.get("timeout")) {
          const customSec = parseInt(params.get("timeout") || "15", 10);
          if (!isNaN(customSec)) setSecondsLeft(customSec);
        }
      }
    }

    const loadCandidates = () => {
      fetch("/api/election", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const candidateList: CandidateItem[] = data.candidates || [];
            setCandidates(candidateList);
            if (data.electionStatus) {
              setVotingActive(data.electionStatus.isVotingActive);
              setMaintenanceMode(data.electionStatus.maintenanceMode);
              if (
                data.electionStatus.startTime &&
                data.electionStatus.endTime
              ) {
                setElectionSchedule({
                  start: data.electionStatus.startTime,
                  end: data.electionStatus.endTime,
                });
              }
            }

            if (typeof window !== "undefined") {
              const params = new URLSearchParams(window.location.search);
              const detailParam =
                params.get("detail") || params.get("candidate");
              if (detailParam) {
                const matched = candidateList.find(
                  (c) =>
                    c.candidate_number.toString() === detailParam ||
                    c.id === detailParam ||
                    c.candidate_number.toString().padStart(2, "0") ===
                      detailParam,
                );
                if (matched) setDetailCandidate(matched);
              }
            }
          } else {
            setElectionError(data.error || "Gagal memuat daftar kandidat.");
          }
        })
        .catch(() => {
          setElectionError(
            "Terjadi kesalahan koneksi saat memuat Bilik Suara Digital.",
          );
        })
        .finally(() => {
          setLoadingElection(false);
        });
    };

    loadCandidates();

    const handleFocus = () => loadCandidates();
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSessionExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSelectCandidate = (candidate: CandidateItem) => {
    setSelectedCandidate(candidate);
  };

  const handleResetSelection = () => {
    setSelectedCandidate(null);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Abaikan gangguan koneksi sesaat saat logout
    } finally {
      window.location.href = "/login";
    }
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    setElectionError(null);

    try {
      const res = await castBallotAction(selectedCandidate.id);

      if (res.success && res.receipt) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("hmif_receipt_token", res.receipt.token);
          sessionStorage.setItem("hmif_receipt_date", res.receipt.date);
        }
        setIsModalOpen(false);
        router.push("/receipt");
      } else {
        setIsModalOpen(false);
        setElectionError(res.message || "Gagal mengirim Surat Suara Anonim.");
        if (res.code === "ALREADY_VOTED") {
          setTimeout(() => {
            router.push("/receipt");
          }, 2000);
        } else if (res.code === "UNAUTHORIZED") {
          setIsSessionExpired(true);
        }
      }
    } catch {
      setIsModalOpen(false);
      setElectionError("Terjadi kegagalan jaringan saat mengirim surat suara.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (maintenanceMode) {
    return (
      <MaintenanceBooth
        onRefresh={checkElectionStatus}
        isChecking={isCheckingMaintenance}
        lastCheckedTime={lastCheckedMaintenance}
      />
    );
  }

  const regularCandidates = candidates.filter((c) => c.candidate_number > 0);
  const kotakKosongCandidate = candidates.find((c) => c.candidate_number === 0);
  const isSingleCandidate = regularCandidates.length === 1;

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-[100dvh] flex flex-col justify-between selection:bg-primary selection:text-on-primary overflow-x-hidden">
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant">
        <div className="h-16 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF Telkom University Purwokerto"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-on-surface block truncate">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium hidden sm:block truncate">
                Bilik Suara Digital
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              aria-label={`Sisa waktu sesi ${formatTimer(secondsLeft)}`}
              className="flex items-center gap-2 bg-surface-container px-3 py-2 min-h-[44px] rounded-xl border border-outline-variant text-xs"
            >
              <span className="text-on-surface-variant font-medium hidden md:inline">
                Sisa Waktu
              </span>
              <span className="font-mono text-sm sm:text-base text-on-surface font-semibold tabular-nums">
                {formatTimer(secondsLeft)}
              </span>
            </div>

            <ThemeToggle />

            <a
              href={KPR_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Bantuan KPR via WhatsApp"
              className="text-on-surface-variant hover:text-on-surface text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <HelpCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden lg:inline">Bantuan KPR</span>
            </a>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              aria-label="Keluar dari Bilik Suara Digital"
              className="text-on-surface-variant hover:text-error hover:bg-error-container dark:hover:bg-error-container/30 text-xs sm:text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-xl bg-surface-container border border-outline-variant hover:border-error/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
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
        className="w-full pt-20 flex-1 flex flex-col"
      >
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 pb-36 sm:pb-32">
          {/* Header Title Section & Institutional Schedule */}
          <div className="mb-8 pb-5 border-b border-outline-variant flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                Surat Suara Pemilihan
              </h1>
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed max-w-2xl">
                {isSingleCandidate
                  ? "Tentukan pilihanmu untuk Chairman & Vice Chairman HMIF 2026/2027: pasangan calon atau Kotak Kosong."
                  : "Salurkan satu hak suara sah untuk memilih Chairman & Vice Chairman HMIF Periode 2026/2027."}
              </p>
            </div>

            {electionSchedule && (
              <div className="text-xs text-on-surface-variant font-medium sm:text-right shrink-0">
                <span className="block text-[11px] font-semibold text-on-surface-variant">
                  Jadwal Resmi
                </span>
                <span className="font-mono text-on-surface font-semibold tabular-nums">
                  {new Date(electionSchedule.start).toLocaleDateString(
                    "id-ID",
                    { day: "numeric", month: "short" },
                  )}{" "}
                  s/d{" "}
                  {new Date(electionSchedule.end).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Closed Notice */}
          {!votingActive && (
            <div className="mb-6 rounded-2xl border border-error/40 bg-error-container dark:bg-error-container/30 p-5 text-on-surface flex items-start gap-3.5">
              <AlertTriangle
                className="w-5 h-5 text-error shrink-0 mt-0.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="space-y-2">
                <h2 className="font-bold text-sm sm:text-base text-error">
                  Pemungutan Suara Sedang Ditutup
                </h2>
                <p className="text-sm text-on-surface leading-relaxed">
                  {electionSchedule
                    ? `Bilik Suara Digital dibuka sesuai jadwal resmi: ${new Date(
                        electionSchedule.start,
                      ).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })} s/d ${new Date(electionSchedule.end).toLocaleString(
                        "id-ID",
                        { dateStyle: "medium", timeStyle: "short" },
                      )} WIB.`
                    : "Waktu pemungutan suara telah berakhir atau belum dimulai sesuai ketetapan panitia KPR."}
                </p>
                <div className="pt-1">
                  <Link
                    href="/rekapitulasi"
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs sm:text-sm font-bold inline-flex items-center justify-center transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Lihat Rekapitulasi Suara
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {electionError && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-error/40 bg-error-container dark:bg-error-container/30 p-4 text-sm text-error flex items-start gap-2.5"
            >
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="text-on-surface font-medium">{electionError}</span>
            </div>
          )}

          {/* Loading Candidates State */}
          {loadingElection ? (
            <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
              <Loader2
                className="w-7 h-7 animate-spin text-tertiary"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p className="text-sm">Memuat daftar pasangan calon...</p>
            </div>
          ) : isSingleCandidate ? (
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
                {regularCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidate?.id === candidate.id}
                    onSelect={handleSelectCandidate}
                    onOpenDetail={setDetailCandidate}
                  />
                ))}

                {kotakKosongCandidate && (
                  <KotakKosongCard
                    candidate={kotakKosongCandidate}
                    isSelected={
                      selectedCandidate?.id === kotakKosongCandidate.id
                    }
                    onSelect={handleSelectCandidate}
                    variant="card"
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              <div
                className={`grid gap-6 mb-8 ${
                  regularCandidates.length === 2
                    ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {regularCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidate?.id === candidate.id}
                    onSelect={handleSelectCandidate}
                    onOpenDetail={setDetailCandidate}
                  />
                ))}
              </div>

              {kotakKosongCandidate && (
                <div
                  className={`mb-8 ${regularCandidates.length === 2 ? "max-w-5xl mx-auto" : ""}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-outline-variant" />
                    <span className="text-xs font-semibold text-on-surface-variant">
                      Opsi Alternatif Sah
                    </span>
                    <div className="h-px flex-1 bg-outline-variant" />
                  </div>

                  <KotakKosongCard
                    candidate={kotakKosongCandidate}
                    isSelected={
                      selectedCandidate?.id === kotakKosongCandidate.id
                    }
                    onSelect={handleSelectCandidate}
                    variant="horizontal"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Sticky Action Bar (Solid surface + subtle top elevation, respects safe-area) */}
        <div className="fixed bottom-0 inset-x-0 bg-surface-container z-40 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-outline-variant shadow-[0_-4px_20px_rgb(0_0_0/0.06)] dark:shadow-[0_-4px_20px_rgb(0_0_0/0.35)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  selectedCandidate ? "bg-primary" : "bg-outline-variant"
                }`}
              />
              <span className="text-sm font-semibold text-on-surface truncate">
                {selectedCandidate
                  ? selectedCandidate.candidate_number === 0
                    ? "Pilihan: Kotak Kosong"
                    : `Pilihan: Paslon ${selectedCandidate.candidate_number.toString().padStart(2, "0")}`
                  : "Pilih salah satu opsi di atas"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              {selectedCandidate && (
                <button
                  type="button"
                  onClick={handleResetSelection}
                  className="px-4 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Ganti Pilihan
                </button>
              )}

              <button
                type="button"
                disabled={
                  !selectedCandidate ||
                  !votingActive ||
                  maintenanceMode ||
                  isSessionExpired
                }
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-none px-6 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-on-primary bg-primary hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,transform] duration-150 active:scale-[0.96] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
              >
                Konfirmasi Pilihan
              </button>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Modals */}
      <ConfirmationModal
        isOpen={isModalOpen && !isSessionExpired}
        selectedCandidate={selectedCandidate}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmVote}
      />

      <SessionExpiredModal
        isOpen={isSessionExpired}
        onLoginRedirect={() => {
          window.location.href = "/login";
        }}
      />

      <LogoutModal
        isOpen={isLogoutModalOpen}
        isLoggingOut={isLoggingOut}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleLogout}
      />

      <CandidateDetailModal
        isOpen={!!detailCandidate}
        candidate={detailCandidate}
        isSelected={selectedCandidate?.id === detailCandidate?.id}
        onClose={() => setDetailCandidate(null)}
        onSelectCandidate={(c) => {
          handleSelectCandidate(c);
        }}
      />
    </div>
  );
}
