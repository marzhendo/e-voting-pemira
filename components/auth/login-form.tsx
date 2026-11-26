"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { DummyAccount } from "@/lib/auth/dummy";
import {
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { KPR_WHATSAPP_URL } from "@/components/layout/site-header";

function getAuthErrorDisplay(
  urlError: string | null,
  urlMessage: string | null,
  errorMessage: string | null,
): { title: string; message: string } | null {
  if (errorMessage) {
    const lower = errorMessage.toLowerCase();

    if (
      lower.includes("terkunci") ||
      lower.includes("lockout") ||
      lower.includes("batas percobaan")
    ) {
      return {
        title: "Akun Sementara Terkunci",
        message: errorMessage,
      };
    }
    if (lower.includes("sandi") || lower.includes("password")) {
      return {
        title: "Kata Sandi Pemilih Tidak Sesuai",
        message: errorMessage,
      };
    }
    if (lower.includes("pemeliharaan") || lower.includes("maintenance")) {
      return {
        title: "Bilik Suara Digital Dalam Pemeliharaan",
        message: errorMessage,
      };
    }
    if (lower.includes("dpt") || lower.includes("terdaftar")) {
      return {
        title: "NIM Belum Terdaftar di DPT",
        message: errorMessage,
      };
    }
    if (lower.includes("hak suara")) {
      return {
        title: "Hak Suara Sudah Digunakan",
        message: errorMessage,
      };
    }
    return {
      title: "Gagal Masuk",
      message: errorMessage,
    };
  }

  if (
    urlError === "ADMIN_AUTH_REQUIRED" ||
    (urlError === "AUTH_REQUIRED" && urlMessage?.includes("panitia"))
  ) {
    return {
      title: "Perlu Akun Panitia",
      message:
        "Halaman dashboard hanya dapat diakses oleh Panitia KPR. Pemilih dapat masuk ke Bilik Suara Digital menggunakan NIM dan Kata Sandi Pemilih.",
    };
  }

  if (urlError === "ADMIN_FORBIDDEN" || urlError === "FORBIDDEN") {
    return {
      title: "Akses Terbatas",
      message:
        "Akun ini terdaftar sebagai pemilih, bukan panitia. Silakan kembali ke Bilik Suara Digital.",
    };
  }

  if (urlError === "REKAP_AUTH_REQUIRED") {
    return {
      title: "Masuk untuk Melihat Rekapitulasi",
      message:
        "Masukkan NIM dan Kata Sandi Pemilih untuk membuka halaman Partisipasi Pemilih dan Rekapitulasi Suara.",
    };
  }

  if (
    urlError === "VOTE_SESSION_REQUIRED" ||
    urlError === "SESSION_REQUIRED" ||
    urlError === "AUTH_REQUIRED"
  ) {
    return {
      title: "Sesi Berakhir",
      message:
        "Waktu sesi pemilihan telah selesai. Masukkan kembali NIM dan Kata Sandi Pemilih kamu.",
    };
  }

  if (urlError === "NOT_REGISTERED") {
    return {
      title: "NIM Belum Terdaftar di DPT",
      message:
        "NIM belum tercatat di Daftar Pemilih Tetap (DPT). Mahasiswa aktif Informatika dapat melakukan konfirmasi ke Panitia KPR.",
    };
  }

  if (urlMessage) {
    return {
      title: "Perhatian",
      message: urlMessage,
    };
  }

  return null;
}

interface LoginFormProps {
  initialMaintenance?: boolean;
  initialAdminMode?: boolean;
}

export function LoginForm({
  initialMaintenance = false,
  initialAdminMode = false,
}: LoginFormProps = {}) {
  const searchParams = useSearchParams();

  const urlMessage = searchParams.get("message");
  const urlError = searchParams.get("error");
  const urlRedirect = searchParams.get("redirect");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  // Status Pemeliharaan & Mode Admin Tersembunyi (Secret Trigger 3x Logo)
  const [isMaintenance, setIsMaintenance] = useState(initialMaintenance);
  const [isAdminMode, setIsAdminMode] = useState(
    initialAdminMode ||
      searchParams.get("admin") === "1" ||
      searchParams.get("admin") === "true",
  );
  const [logoClicks, setLogoClicks] = useState<number[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [checkStatusNotice, setCheckStatusNotice] = useState<string | null>(null);

  // Dev Mock Accounts
  const [dummyAccounts, setDummyAccounts] = useState<DummyAccount[]>([]);
  const [dummyEnabled, setDummyEnabled] = useState(false);
  const [showDummyAccounts, setShowDummyAccounts] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);

  useEffect(() => {
    setIsMaintenance(initialMaintenance);
  }, [initialMaintenance]);

  useEffect(() => {
    const adminParam = searchParams.get("admin");
    if (adminParam === "1" || adminParam === "true") {
      setIsAdminMode(true);
    }

    fetch("/api/auth/dummy-login")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.enabled) {
          setDummyEnabled(true);
          setDummyAccounts(data.accounts || []);
        }
      })
      .catch(() => {});

    fetch("/api/election", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.electionStatus) {
          setIsMaintenance(Boolean(data.electionStatus.maintenanceMode));
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Secret Trigger: 3x klik logo HMIF dalam 1.5 detik memunculkan/menutup form admin
  const handleLogoClick = () => {
    const now = Date.now();
    const recent = [...logoClicks.filter((t) => now - t < 1500), now];
    setLogoClicks(recent);

    if (recent.length >= 3) {
      setIsAdminMode((prev) => !prev);
      setLogoClicks([]);
      setErrorMessage(null);
      setSuccessNotice(null);
      setRemainingAttempts(null);
      setLockoutMinutes(null);
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/election", { cache: "no-store" });
      const data = await res.json();
      if (data?.electionStatus) {
        if (!data.electionStatus.maintenanceMode) {
          setIsMaintenance(false);
          setSuccessNotice(
            "Pemeliharaan sistem telah selesai. Masukkan NIM dan Kata Sandi Pemilih kamu.",
          );
        } else {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
          setCheckStatusNotice(
            `Status per ${timeStr} WIB: Pemeliharaan masih berlangsung.`,
          );
        }
      }
    } catch {
      setCheckStatusNotice("Gagal memeriksa status. Coba beberapa saat lagi.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanNim = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanNim || cleanNim.length < 4) {
      setErrorMessage(
        isAdminMode
          ? "Masukkan email atau NIM panitia yang valid."
          : "Masukkan NIM yang valid.",
      );
      return;
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      setErrorMessage("Masukkan Kata Sandi Pemilih minimal 4 karakter.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    setRemainingAttempts(null);
    setLockoutMinutes(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nim: cleanNim,
          password: cleanPassword,
          redirect: urlRedirect || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data?.code === "MAINTENANCE_MODE") {
          setIsMaintenance(true);
        }
        if (typeof data?.remainingAttempts === "number") {
          setRemainingAttempts(data.remainingAttempts);
        }
        if (typeof data?.lockoutMinutes === "number") {
          setLockoutMinutes(data.lockoutMinutes);
        }
        setErrorMessage(
          data?.error ||
            "Gagal masuk. Periksa kembali NIM dan Kata Sandi Pemilih kamu.",
        );
        return;
      }

      const isStaff = data.user?.role && data.user.role !== "voter";
      const hasVoted = Boolean(data.user?.hasVoted);
      const isRecapDest = data.redirectUrl === "/rekapitulasi";

      setSuccessNotice(
        isRecapDest
          ? "Terverifikasi. Membuka halaman Rekapitulasi Suara..."
          : isStaff
          ? "Terverifikasi sebagai administrator. Membuka dashboard..."
          : hasVoted
          ? "Terverifikasi. Membuka Tanda Terima Pemilihan..."
          : "Terverifikasi. Membuka Bilik Suara Digital...",
      );

      setTimeout(() => {
        window.location.href =
          data.redirectUrl ||
          (isStaff ? "/admin/dashboard" : hasVoted ? "/receipt" : "/vote");
      }, 500);
    } catch {
      setErrorMessage("Terjadi gangguan jaringan saat memproses login.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDummyLogin(accountId: string) {
    setLoadingAccountId(accountId);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/dummy-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Login gagal.");
        return;
      }

      if (data.user?.role && data.user.role !== "voter") {
        window.location.href = "/admin/dashboard";
      } else if (data.user?.hasVoted) {
        window.location.href = "/receipt";
      } else {
        window.location.href = "/vote";
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi saat login simulasi.");
    } finally {
      setLoadingAccountId(null);
    }
  }

  const errorDisplay = getAuthErrorDisplay(urlError, urlMessage, errorMessage);
  const isInputLocked = lockoutMinutes !== null && lockoutMinutes > 0;

  return (
    <div className="w-full flex flex-col justify-between">
      {/* 1. Card Header */}
      <div className="text-center flex flex-col items-center space-y-2.5 mb-6">
        <div
          onClick={handleLogoClick}
          className="relative w-12 h-12 shrink-0 flex items-center justify-center select-none cursor-default"
          title={
            isAdminMode
              ? "Mode Admin Aktif"
              : "Logo HMIF (Klik 3x untuk Akses Panitia)"
          }
        >
          <Image
            src="/assets/img/hmif-logo.png"
            alt="Logo HMIF Telkom University Purwokerto"
            width={48}
            height={48}
            priority
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-tertiary tracking-tight">
            Pemilihan Chairman &amp; Vice Chairman HMIF 2026/2027
          </p>

          {isMaintenance && !isAdminMode ? (
            <>
              <h1 className="font-display text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-on-surface leading-tight">
                Bilik Suara Dalam Pemeliharaan
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
                Sistem sedang dalam penyesuaian berkala oleh Panitia KPR. Pemungutan suara akan segera dibuka kembali.
              </p>
            </>
          ) : isAdminMode ? (
            <>
              <h1 className="font-display text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-on-surface leading-tight">
                Masuk Panitia KPR
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
                Masukkan NIM atau email panitia serta kata sandi akun untuk mengelola sistem pemilihan.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-on-surface leading-tight">
                Masuk ke Bilik Suara Digital
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
                Verifikasi NIM yang tercatat di Daftar Pemilih Tetap (DPT) dan Kata Sandi Pemilih dari email kampus kamu.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 2. Interactive Feedback Banners */}
      <div className="space-y-3 mb-4" aria-live="polite">
        <AnimatePresence>
          {errorDisplay && (
            <motion.div
              key="error-banner"
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
              className="rounded-xl border border-error/40 bg-error-container dark:bg-error-container/30 p-3.5 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0 text-error"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-error">{errorDisplay.title}</div>
                <div className="mt-0.5 text-on-surface leading-relaxed">
                  {errorDisplay.message}
                </div>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="mt-1 text-xs font-semibold text-error tabular-nums">
                    Sisa kesempatan masuk: {remainingAttempts} kali sebelum akun terkunci.
                  </p>
                )}
                {lockoutMinutes !== null && lockoutMinutes > 0 && (
                  <p className="mt-1 text-xs font-semibold text-error tabular-nums">
                    Akun terkunci selama {lockoutMinutes} menit demi keamanan.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {successNotice && (
            <motion.div
              key="success-banner"
              role="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
              className="rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200 p-3.5 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <CheckCircle2
                className="w-4 h-4 mt-0.5 text-emerald-700 dark:text-emerald-400 shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="flex-1 leading-relaxed">{successNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Main Content */}
      {isMaintenance && !isAdminMode ? (
        <div className="space-y-4 pt-1 flex flex-col justify-end">
          <div className="min-h-[20px] flex items-center justify-center text-xs text-center text-on-surface-variant font-medium">
            {isCheckingStatus ? (
              <span>Menghubungkan ke server...</span>
            ) : checkStatusNotice ? (
              <span className="tabular-nums">{checkStatusNotice}</span>
            ) : (
              <span>Tekan tombol di bawah untuk memeriksa status terbaru.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="w-full min-h-[48px] px-5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-sm font-bold flex items-center justify-center gap-2 transition-[color,background-color,transform] duration-150 active:scale-[0.96] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
          >
            <RefreshCw
              className={`w-4 h-4 ${isCheckingStatus ? "animate-spin" : ""}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>
              {isCheckingStatus ? "Memeriksa Status..." : "Periksa Status Sekarang"}
            </span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          {/* Input NIM / Identitas */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-semibold text-on-surface mb-1.5"
            >
              {isAdminMode ? "NIM atau Email Panitia" : "NIM"}
            </label>
            <div className="relative">
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  if (errorMessage) setErrorMessage(null);
                  setIdentifier(e.target.value);
                }}
                placeholder={
                  isAdminMode
                    ? "Masukkan NIM atau email panitia"
                    : "Masukkan NIM kamu"
                }
                disabled={isLoading || isInputLocked}
                className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container focus:border-primary focus:ring-2 focus:ring-primary/25 text-sm font-medium font-mono tabular-nums transition-[color,background-color,border-color,box-shadow] duration-150 outline-none disabled:opacity-50"
              />
              <User
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Input Kata Sandi Pemilih */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-on-surface mb-1.5"
            >
              {isAdminMode ? "Kata Sandi Akun" : "Kata Sandi Pemilih"}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                autoCapitalize="characters"
                value={password}
                onChange={(e) => {
                  if (errorMessage) setErrorMessage(null);
                  setPassword(e.target.value);
                }}
                placeholder={
                  isAdminMode
                    ? "Masukkan kata sandi akun"
                    : "Masukkan Kata Sandi Pemilih"
                }
                disabled={isLoading || isInputLocked}
                className="w-full min-h-[48px] pl-11 pr-12 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container focus:border-primary focus:ring-2 focus:ring-primary/25 text-sm font-mono tracking-wider transition-[color,background-color,border-color,box-shadow] duration-150 outline-none disabled:opacity-50"
              />
              <KeyRound
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={
                  showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Tombol Masuk */}
          <button
            type="submit"
            disabled={
              isLoading || !identifier.trim() || !password.trim() || isInputLocked
            }
            className="w-full min-h-[48px] px-5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-sm font-bold flex items-center justify-center gap-2 transition-[color,background-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2
                  className="w-4 h-4 animate-spin text-on-primary"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>
                {isAdminMode ? "Masuk ke Dashboard" : "Masuk ke Bilik Suara"}
              </span>
            )}
          </button>
        </form>
      )}

      {/* 4. Card Footer: Panitia Support */}
      <div className="pt-4 border-t border-outline-variant text-center mt-5">
        <p className="text-xs text-on-surface-variant font-medium">
          Kendala Daftar Pemilih Tetap (DPT) atau Kata Sandi Pemilih?{" "}
          <a
            href={KPR_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-tertiary hover:underline inline-flex items-center min-h-[44px] px-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Hubungi Panitia KPR
          </a>
        </p>
      </div>

      {/* 5. Panel Pengujian Mode Dummy (Khusus saat parameter ?dev=true disertakan) */}
      {dummyEnabled &&
        (searchParams.get("dev") === "true" ||
          searchParams.get("dev") === "1") && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden text-on-surface">
            <button
              type="button"
              onClick={() => setShowDummyAccounts(!showDummyAccounts)}
              className="w-full px-3.5 py-2.5 min-h-[44px] flex items-center justify-between text-left hover:bg-surface-container-high transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-xs font-bold text-tertiary">
                Mode Uji Coba Cepat (Dev)
              </span>
              {showDummyAccounts ? (
                <ChevronUp
                  className="w-4 h-4 text-on-surface-variant"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="w-4 h-4 text-on-surface-variant"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              )}
            </button>

            {showDummyAccounts && (
              <div className="p-3 pt-2 border-t border-outline-variant space-y-2 max-h-56 overflow-y-auto">
                <p className="text-[11px] text-on-surface-variant">
                  Pilih akun simulasi untuk login cepat:
                </p>
                {dummyAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    disabled={loadingAccountId !== null}
                    onClick={() => handleDummyLogin(account.id)}
                    className="w-full min-h-[48px] p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-left transition-colors flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-on-surface block truncate">
                        {account.name}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-mono tabular-nums block truncate">
                        {account.role.toUpperCase()}{" "}
                        {account.nim ? `• ${account.nim}` : ""}
                      </span>
                    </div>
                    <span className="text-xs text-tertiary font-semibold shrink-0">
                      {loadingAccountId === account.id ? "Masuk..." : "Pilih"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
