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

function getAuthErrorDisplay(
  urlError: string | null,
  urlMessage: string | null,
  errorMessage: string | null,
): { title: string; message: string } | null {
  // 1. Error dari respons API login
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
        title: "Kata Sandi Tidak Sesuai",
        message: errorMessage,
      };
    }
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
    return {
      title: "Gagal Masuk",
      message: errorMessage,
    };
  }

  // 2. Pemetaan error pengalihan middleware
  if (
    urlError === "ADMIN_AUTH_REQUIRED" ||
    (urlError === "AUTH_REQUIRED" && urlMessage?.includes("panitia"))
  ) {
    return {
      title: "Perlu Akun Panitia",
      message:
        "Halaman dashboard hanya dapat diakses oleh Panitia KPR. Jika kamu pemilih, silakan masuk ke bilik suara menggunakan NIM dan kata sandi pemilih.",
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
      title: "Sesi Berakhir",
      message:
        "Waktu sesi pemilihan kamu telah selesai. Silakan masukkan kembali NIM dan kata sandi pemilih.",
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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null,
  );
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
            "Pemeliharaan sistem telah selesai. Silakan masukkan NIM dan kata sandi kamu.",
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

  // Submit Login dengan NIM dan Kata Sandi Pemilih
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanNim = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanNim || cleanNim.length < 4) {
      setErrorMessage(
        isAdminMode
          ? "Masukkan email atau NIM admin yang valid."
          : "Masukkan NIM yang valid.",
      );
      return;
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      setErrorMessage("Masukkan kata sandi pemilih minimal 4 karakter.");
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
        setErrorMessage(data?.error || "Gagal masuk. Periksa kembali NIM dan kata sandi kamu.");
        return;
      }

      const isStaff = data.user?.role && data.user.role !== "voter";
      const hasVoted = Boolean(data.user?.hasVoted);

      setSuccessNotice(
        isStaff
          ? "Terverifikasi sebagai administrator. Membuka dashboard..."
          : hasVoted
          ? "Terverifikasi. Membuka tanda terima pemilihan..."
          : "Terverifikasi. Membuka bilik suara...",
      );

      setTimeout(() => {
        window.location.href =
          data.redirectUrl || (isStaff ? "/admin/dashboard" : hasVoted ? "/receipt" : "/vote");
      }, 500);
    } catch {
      setErrorMessage("Terjadi gangguan jaringan saat memproses login.");
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

  const errorDisplay = getAuthErrorDisplay(urlError, urlMessage, errorMessage);
  const isInputLocked = lockoutMinutes !== null && lockoutMinutes > 0;

  return (
    <div className="w-full flex flex-col justify-between">
      {/* 1. Card Header: Logo, Identity, & Dynamic Headline */}
      <div className="text-center flex flex-col items-center space-y-2 mb-4">
        <div
          onClick={handleLogoClick}
          className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center select-none cursor-default"
          title={isAdminMode ? "Mode Admin Aktif" : "Logo HMIF (Klik 3x untuk Akses Admin)"}
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
          <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-on-surface">
            PEMIRA HMIF 2026/2027
          </p>
          <p className="text-[11px] sm:text-xs font-medium text-on-surface-variant">
            Telkom University Purwokerto
          </p>
        </div>

        <div className="pt-0.5">
          {isMaintenance && !isAdminMode ? (
            <>
              <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface leading-none text-balance">
                Sedang Ada Pemeriksaan Sistem
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mt-1 max-w-xs mx-auto text-pretty">
                Sistem pemilihan sedang dalam penyesuaian berkala oleh Panitia
                KPR. Pemungutan suara akan segera dibuka kembali.
              </p>
            </>
          ) : isAdminMode ? (
            <>
              <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface leading-none">
                Masuk Administrator
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mt-1 max-w-xs mx-auto">
                Masukkan NIM atau email panitia dan kata sandi akun untuk mengelola sistem.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface leading-none">
                Waktunya Memilih.
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mt-1 max-w-xs mx-auto text-pretty">
                Masukkan NIM dan kata sandi pemilih yang telah dikirimkan ke email resmi kampus kamu.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 2. Interactive Feedback Banners (Error / Success) */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {errorDisplay && (
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
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="mt-1 text-xs font-semibold text-error">
                    Sisa kesempatan login: {remainingAttempts} kali sebelum akun terkunci.
                  </p>
                )}
                {lockoutMinutes !== null && lockoutMinutes > 0 && (
                  <p className="mt-1 text-xs font-semibold text-error">
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

      {/* 3. Main Content: Maintenance State vs Single-Screen Login Form */}
      {isMaintenance && !isAdminMode ? (
        <div className="space-y-4 pt-1 flex flex-col justify-end">
          <div className="min-h-[20px] flex items-center justify-center text-xs text-center text-on-surface-variant font-medium">
            {isCheckingStatus ? (
              <span className="text-on-surface-variant/80">
                Menghubungkan ke server...
              </span>
            ) : checkStatusNotice ? (
              <span>{checkStatusNotice}</span>
            ) : (
              <span className="text-on-surface-variant/50">
                Klik tombol untuk memeriksa status bilik suara
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="w-full h-12 px-5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform duration-100 active:scale-[0.98] shadow-sm disabled:opacity-60 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-[44px]"
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
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Input NIM / Identitas */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5"
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
                    ? "Contoh: panitia@telkomuniversity.ac.id"
                    : "Contoh: 103012300001"
                }
                disabled={isLoading || isInputLocked}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-highest focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-primary text-sm font-medium transition-all outline-none min-h-[44px] disabled:opacity-50"
              />
              <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          {/* Input Kata Sandi Pemilih */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-on-surface"
              >
                {isAdminMode ? "Kata Sandi Akun" : "Kata Sandi Pemilih"}
              </label>
            </div>
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
                placeholder={isAdminMode ? "Masukkan kata sandi" : "Contoh: 7K9P-2M4X"}
                disabled={isLoading || isInputLocked}
                className="w-full h-12 pl-11 pr-12 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-highest focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-primary text-sm font-mono tracking-wider transition-all outline-none min-h-[44px] disabled:opacity-50"
              />
              <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Tombol Masuk */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
            type="submit"
            disabled={isLoading || !identifier.trim() || !password.trim() || isInputLocked}
            className="w-full h-12 px-5 rounded-xl bg-primary hover:bg-secondary text-on-primary text-sm font-bold flex items-center justify-center gap-2 transition-transform duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>
                {isAdminMode ? "Masuk ke Dashboard" : "Masuk ke Bilik Suara"}
              </span>
            )}
          </motion.button>
        </form>
      )}

      {/* 4. Card Footer: Panitia Support */}
      <div className="pt-3 border-t border-outline-variant/20 text-center mt-3.5">
        <p className="text-xs text-on-surface-variant font-medium">
          Kendala DPT atau kata sandi?{" "}
          <a
            href="https://wa.me/6281809300406"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline inline-flex items-center min-h-[36px] px-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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
