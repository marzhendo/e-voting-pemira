"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { DummyAccount } from "@/lib/auth/dummy";
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

function getAuthErrorDisplay(
  urlError: string | null,
  urlMessage: string | null,
  errorMessage: string | null,
  step?: "nim" | "pin",
): { title: string; message: string } | null {
  // 1. Error dari aksi klien (input NIM / verifikasi PIN)
  if (errorMessage) {
    const lower = errorMessage.toLowerCase();

    // Jika sedang di tahap verifikasi PIN
    if (step === "pin") {
      if (lower.includes("kedaluwarsa") || lower.includes("expired")) {
        return {
          title: "Kode PIN Kedaluwarsa",
          message: errorMessage,
        };
      }
      if (
        lower.includes("batas") ||
        lower.includes("terkunci") ||
        lower.includes("percobaan") ||
        lower.includes("habis")
      ) {
        return {
          title: "Percobaan Melebihi Batas",
          message: errorMessage,
        };
      }
      return {
        title: "Kode PIN Tidak Sesuai",
        message: errorMessage,
      };
    }

    // Jika sedang di tahap input NIM
    if (lower.includes("pemeliharaan") || lower.includes("maintenance")) {
      return {
        title: "Bilik Suara Dalam Pemeliharaan",
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
    if (
      lower.includes("tunggu") ||
      lower.includes("detik") ||
      lower.includes("rate") ||
      lower.includes("cooldown")
    ) {
      return {
        title: "Batas Frekuensi Permintaan",
        message: errorMessage,
      };
    }
    if (
      lower.includes("email") ||
      lower.includes("kirim") ||
      lower.includes("server") ||
      lower.includes("smtp") ||
      lower.includes("pin")
    ) {
      return {
        title: "Gagal Mengirim Kode PIN",
        message: errorMessage,
      };
    }
    return {
      title: "Gagal Masuk",
      message: errorMessage,
    };
  }

  // 2. Pemetaan pengalihan URL (Middleware) ke bahasa yang manusiawi
  if (
    urlError === "ADMIN_AUTH_REQUIRED" ||
    (urlError === "AUTH_REQUIRED" && urlMessage?.includes("panitia"))
  ) {
    return {
      title: "Perlu Akun Panitia",
      message:
        "Halaman dashboard hanya dapat diakses oleh Panitia KPR. Jika kamu pemilih, silakan masuk ke bilik suara menggunakan NIM.",
    };
  }

  if (urlError === "ADMIN_FORBIDDEN" || urlError === "FORBIDDEN") {
    return {
      title: "Akses Terbatas",
      message:
        "Akunmu terdaftar sebagai pemilih, bukan panitia. Silakan kembali ke Bilik Suara.",
    };
  }

  if (
    urlError === "VOTE_SESSION_REQUIRED" ||
    urlError === "SESSION_REQUIRED" ||
    urlError === "AUTH_REQUIRED"
  ) {
    return {
      title: "Sesi Perlu Diperbarui",
      message:
        "Waktu sesi bilik suaramu sudah berakhir. Silakan masukkan NIM untuk meminta kode PIN baru.",
    };
  }

  if (urlError === "NOT_REGISTERED") {
    return {
      title: "NIM Belum Terdaftar di DPT",
      message:
        "NIM kamu belum tercatat di daftar pemilih tetap. Mahasiswa aktif Informatika dapat konfirmasi langsung ke Panitia KPR.",
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

  // Step 1: 'nim' | Step 2: 'pin'
  const [step, setStep] = useState<"nim" | "pin">("nim");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [isPinFocused, setIsPinFocused] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );

  // Status Pemeliharaan & Mode Admin Tersembunyi (Secret Trigger 3x Logo)
  const [isMaintenance, setIsMaintenance] = useState(initialMaintenance);
  const [isAdminMode, setIsAdminMode] = useState(
    initialAdminMode ||
      searchParams.get("admin") === "1" ||
      searchParams.get("admin") === "true",
  );
  const [logoClicks, setLogoClicks] = useState<number[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [checkStatusNotice, setCheckStatusNotice] = useState<string | null>(
    null,
  );

  // Dev Mock Accounts
  const [dummyAccounts, setDummyAccounts] = useState<DummyAccount[]>([]);
  const [dummyEnabled, setDummyEnabled] = useState(false);
  const [showDummyAccounts, setShowDummyAccounts] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);

  // Sinkronisasi status jika props server diperbarui
  useEffect(() => {
    setIsMaintenance(initialMaintenance);
  }, [initialMaintenance]);

  useEffect(() => {
    // Parameter URL ?admin=1 atau ?admin=true langsung membuka form login admin
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

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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
    }
  };

  // Cek Status Pemilihan secara manual oleh pemilih saat pemeliharaan aktif
  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/election", { cache: "no-store" });
      const data = await res.json();
      if (data?.electionStatus) {
        if (!data.electionStatus.maintenanceMode) {
          setIsMaintenance(false);
          setSuccessNotice(
            "Pemeliharaan sistem telah selesai. Silakan masukkan NIM kamu.",
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

  // Request OTP (Step 1)
  async function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();

    if (!cleanId || cleanId.length < 4) {
      setErrorMessage(
        isAdminMode
          ? "Masukkan email atau NIM admin yang valid."
          : "Masukkan NIM yang valid.",
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data?.code === "MAINTENANCE_MODE") {
          setIsMaintenance(true);
        }
        setErrorMessage(data.error || "Gagal mengirim kode PIN verifikasi.");
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
        return;
      }

      setMaskedEmail(data.maskedEmail || "email SSO kampus");
      setCooldown(data.cooldownSeconds || 60);
      setSuccessNotice(
        `Kode PIN 6-digit dikirim ke ${data.maskedEmail || "email SSO kampus"}.`,
      );
      setStep("pin");
      setPin("");
    } catch {
      setErrorMessage("Terjadi gangguan jaringan saat meminta kode PIN.");
    } finally {
      setIsLoading(false);
    }
  }

  // Verify OTP (Step 2)
  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanPin = pin.trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMessage("Kode PIN harus tepat 6 digit angka.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          pin: cleanPin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Kode PIN salah atau telah kedaluwarsa.");
        if (typeof data.remainingAttempts === "number") {
          setRemainingAttempts(data.remainingAttempts);
        }
        return;
      }

      const isStaff = data.user?.role && data.user.role !== "voter";
      setSuccessNotice(
        isStaff
          ? "Terverifikasi sebagai Administrator. Membuka dashboard..."
          : "Terverifikasi. Membuka bilik suara...",
      );
      setTimeout(() => {
        window.location.href =
          data.redirectTo || (isStaff ? "/admin/dashboard" : "/vote");
      }, 600);
    } catch {
      setErrorMessage("Terjadi gangguan jaringan saat memverifikasi kode PIN.");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Dummy Login (Instant Bypass for Dev Testing)
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

  const errorDisplay = getAuthErrorDisplay(
    urlError,
    urlMessage,
    errorMessage,
    step,
  );
  const hasPinError = Boolean(errorDisplay && step === "pin");
  const hasNimError = Boolean(errorDisplay && step === "nim" && errorMessage);

  return (
    <div className="w-full flex flex-col justify-between">
      {/* 1. Card Header: Logo, Identity, & Dynamic Headline */}
      <div className="text-center flex flex-col items-center space-y-3 mb-6">
        <div
          onClick={handleLogoClick}
          className="relative w-14 h-14 shrink-0 flex items-center justify-center select-none cursor-default"
        >
          <Image
            src="/assets/img/hmif-logo.png"
            alt="Logo HMIF Telkom University Purwokerto"
            width={56}
            height={56}
            priority
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        <div>
          <p className="text-sm font-bold tracking-wider uppercase text-on-surface">
            PEMIRA HMIF 2026/2027
          </p>
          <p className="text-xs font-medium text-on-surface-variant">
            Telkom University Purwokerto
          </p>
        </div>

        <div className="pt-1">
          {isMaintenance && !isAdminMode ? (
            <>
              <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide uppercase text-on-surface leading-none text-balance">
                Bilik Suara Ditutup Sementara
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-1.5 max-w-xs mx-auto text-pretty">
                Sistem pemilihan sedang dalam penyesuaian berkala oleh Panitia
                KPR. Pemungutan suara akan segera dibuka kembali.
              </p>
            </>
          ) : isAdminMode ? (
            <>
              <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide uppercase text-on-surface leading-none">
                Masuk Administrator
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-1.5 max-w-xs mx-auto">
                Masukkan NIM akun panitia untuk mengelola sistem.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide uppercase text-on-surface leading-none">
                Waktunya Memilih.
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-1.5 max-w-xs mx-auto text-pretty">
                Ketik NIM kamu untuk menerima kode PIN verifikasi di email SSO
                kampus (@student.telkomuniversity.ac.id).
              </p>
            </>
          )}
        </div>
      </div>

      {/* 2. Interactive Feedback Banners (Error / Success) */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {errorDisplay && !errorMessage && (
            <motion.div
              key="error-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
              className="rounded-xl border border-error/40 bg-error-container/20 p-3.5 text-sm text-error flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-error" />
              <div className="flex-1">
                <div className="font-bold">{errorDisplay.title}</div>
                <div className="mt-0.5 text-on-surface-variant leading-relaxed">
                  {errorDisplay.message}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {successNotice &&
            (step !== "pin" ||
              successNotice.includes("berhasil") ||
              successNotice.includes("Terverifikasi") ||
              successNotice.includes("selesai")) && (
              <motion.div
                key="success-banner"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                <span className="flex-1 leading-relaxed">{successNotice}</span>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* 3. Main Content: Maintenance State vs Interactive Form */}
      {isMaintenance && !isAdminMode ? (
        <div className="space-y-4 pt-1 flex flex-col justify-end">
          {/* Slot status feedback dengan tinggi tetap (zero layout shift) */}
          <div className="min-h-[20px] flex items-center justify-center text-xs text-center text-on-surface-variant font-medium">
            {isCheckingStatus ? (
              <span className="text-on-surface-variant/80">
                Menghubungkan ke server...
              </span>
            ) : checkStatusNotice ? (
              <span>{checkStatusNotice}</span>
            ) : (
              <span className="text-on-surface-variant/50">
                Klik tombol untuk memverifikasi status
              </span>
            )}
          </div>

          {/* Action Button: Cek Status Sekarang */}
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="w-full h-12 px-5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform duration-100 active:scale-[0.96] shadow-sm disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-[44px]"
          >
            <RefreshCw
              className={`w-4 h-4 ${isCheckingStatus ? "animate-spin" : ""}`}
            />
            <span>
              {isCheckingStatus ? "Memeriksa Status..." : "Cek Status Sekarang"}
            </span>
          </button>
        </div>
      ) : (
        /* Regular Login Form (or Admin Login Form if isAdminMode is true) */
        <div className="w-full space-y-4">
          <AnimatePresence mode="wait">
            {step === "nim" ? (
              <motion.form
                key="step-nim"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
                onSubmit={handleRequestOtp}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5"
                  >
                    NIM
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
                      placeholder="Contoh: 103012300001"
                      disabled={isLoading}
                      className={`w-full h-12 pl-11 pr-4 rounded-xl border text-sm font-medium transition-all outline-none focus-visible:ring-2 ${
                        hasNimError
                          ? "border-2 border-error bg-error/10 text-error focus:border-error focus-visible:ring-error/20"
                          : "border border-outline-variant/40 bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-highest focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-primary"
                      }`}
                    />
                    <Mail
                      className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${
                        hasNimError ? "text-error" : "text-on-surface-variant"
                      }`}
                    />
                  </div>
                  {hasNimError && (
                    <p className="mt-1.5 text-xs text-error font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {errorDisplay?.message || "Masukkan data yang valid."}
                      </span>
                    </p>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full h-12 px-5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-sm font-bold flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                      <span>Mengirim Kode PIN...</span>
                    </>
                  ) : (
                    <span>Kirim Kode PIN</span>
                  )}
                </motion.button>

                {!isAdminMode && !hasNimError && (
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant justify-center text-center pt-1 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Hanya untuk mahasiswa aktif Informatika terdaftar di DPT.
                    </span>
                  </div>
                )}
              </motion.form>
            ) : (
              <motion.form
                key="step-pin"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="pin"
                    className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5"
                  >
                    Kode PIN 6 Digit
                  </label>

                  <div className="relative">
                    <input
                      id="pin"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      value={pin}
                      onChange={(e) => {
                        if (errorMessage) setErrorMessage(null);
                        setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                      }}
                      onFocus={() => setIsPinFocused(true)}
                      onBlur={() => setIsPinFocused(false)}
                      disabled={isLoading}
                      className="absolute inset-0 w-full h-full text-transparent bg-transparent border-0 outline-none focus:outline-none z-10 cursor-pointer caret-transparent"
                      aria-label="Kode PIN 6 Digit"
                    />

                    {/* Tampilan Visual 6-Box Segmented OTP */}
                    <div
                      className={`grid grid-cols-6 gap-2 sm:gap-2.5 p-1 rounded-2xl transition-all ${
                        hasPinError
                          ? "ring-2 ring-error/30"
                          : isPinFocused
                            ? "ring-2 ring-primary/20"
                            : ""
                      }`}
                    >
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const char = pin[idx];
                        const isFilled = Boolean(char);
                        const isCurrent = isPinFocused && pin.length === idx;

                        return (
                          <div
                            key={idx}
                            className={`h-12 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-150 ${
                              hasPinError
                                ? "border-2 border-error bg-error/10 text-error shadow-xs"
                                : isCurrent
                                  ? "border-2 border-primary bg-surface-container-highest shadow-xs"
                                  : isFilled
                                    ? "border border-primary/50 bg-surface-container-high"
                                    : "border border-outline-variant/40 bg-surface-container"
                            }`}
                          >
                            {isFilled ? (
                              <span
                                className={`font-mono text-2xl sm:text-3xl font-bold ${hasPinError ? "text-error" : "text-on-surface"}`}
                              >
                                {char}
                              </span>
                            ) : isCurrent ? (
                              <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.9,
                                  ease: "linear",
                                }}
                                className={`w-0.5 h-6 rounded-full ${hasPinError ? "bg-error" : "bg-primary"}`}
                              />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-outline/30" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Pengiriman & Error Inline */}
                  <div className="mt-2.5 flex items-center justify-between text-xs px-1 min-h-[20px]">
                    {hasPinError ? (
                      <div className="flex items-center gap-1.5 min-w-0 text-error animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-error" />
                        <span className="truncate font-semibold">
                          Kode PIN tidak sesuai{" "}
                          {remainingAttempts !== null
                            ? `(Sisa ${remainingAttempts}x)`
                            : ""}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0 text-on-surface-variant">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Terkirim ke{" "}
                          <span className="font-mono text-on-surface font-semibold">
                            {maskedEmail}
                          </span>
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-on-surface-variant shrink-0 font-medium pl-2">
                      Berlaku 10 mnt
                    </span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
                  type="submit"
                  disabled={isLoading || pin.length !== 6}
                  className="w-full h-12 px-5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-sm font-bold flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                      <span>Memverifikasi PIN...</span>
                    </>
                  ) : (
                    <span>
                      {isAdminMode
                        ? "Masuk ke Dashboard"
                        : "Masuk ke Bilik Suara"}
                    </span>
                  )}
                </motion.button>

                {/* Tombol Kirim Ulang Kode PIN */}
                <div className="pt-0.5 text-center">
                  <button
                    type="button"
                    disabled={cooldown > 0 || isLoading}
                    onClick={() => handleRequestOtp()}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-on-surface-variant hover:text-primary hover:bg-surface-container disabled:text-on-surface-variant/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                    />
                    <span>
                      {cooldown > 0
                        ? `Kirim ulang PIN dalam ${cooldown} detik`
                        : "Belum menerima email? Kirim ulang PIN"}
                    </span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Card Footer: Panitia Support (Satu-satunya tautan bantuan resmi, zero redundansi) */}
      <div className="pt-5 border-t border-outline-variant/20 text-center mt-6">
        <p className="text-sm text-on-surface-variant font-medium">
          Butuh bantuan atau informasi DPT?{" "}
          <a
            href="https://wa.me/6281809300406"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline inline-flex items-center gap-1 min-h-[44px] px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Hubungi Panitia KPR
          </a>
        </p>
      </div>

      {/* 5. Panel Pengujian Mode Dummy (Khusus saat parameter ?dev=true disertakan) */}
      {dummyEnabled &&
        (searchParams.get("dev") === "true" ||
          searchParams.get("dev") === "1") && (
          <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-low overflow-hidden text-on-surface">
            <button
              type="button"
              onClick={() => setShowDummyAccounts(!showDummyAccounts)}
              className="w-full p-3 min-h-[44px] flex items-center justify-between text-left hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-bold text-primary">
                  Mode Uji Coba Cepat (Dev)
                </span>
              </div>
              {showDummyAccounts ? (
                <ChevronUp className="w-4 h-4 text-on-surface-variant" />
              ) : (
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              )}
            </button>

            {showDummyAccounts && (
              <div className="p-3 pt-0 border-t border-outline-variant/20 space-y-2 max-h-56 overflow-y-auto">
                <p className="text-[11px] text-on-surface-variant pb-1">
                  Pilih akun simulasi untuk login instan:
                </p>
                {dummyAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    disabled={loadingAccountId !== null}
                    onClick={() => handleDummyLogin(account.id)}
                    className="w-full min-h-[48px] p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-highest hover:border-primary/50 border border-outline-variant/30 text-left transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-on-surface block truncate">
                        {account.name}
                      </span>
                      <span className="text-[11px] text-on-surface-variant block truncate">
                        {account.role.toUpperCase()}{" "}
                        {account.nim ? `• ${account.nim}` : ""}
                      </span>
                    </div>
                    <span className="text-[11px] text-primary font-semibold shrink-0">
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
