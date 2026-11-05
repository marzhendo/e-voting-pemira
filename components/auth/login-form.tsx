'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DummyAccount } from '@/lib/auth/dummy';
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export function LoginForm() {
  const searchParams = useSearchParams();

  const urlMessage = searchParams.get('message');
  const urlError = searchParams.get('error');

  // Step 1: 'nim' | Step 2: 'pin'
  const [step, setStep] = useState<'nim' | 'pin'>('nim');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Dev Mock Accounts
  const [dummyAccounts, setDummyAccounts] = useState<DummyAccount[]>([]);
  const [dummyEnabled, setDummyEnabled] = useState(false);
  const [showDummyAccounts, setShowDummyAccounts] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/dummy-login')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.enabled) {
          setDummyEnabled(true);
          setDummyAccounts(data.accounts || []);
        }
      })
      .catch(() => {});
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request OTP (Step 1)
  async function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();

    if (!cleanId || cleanId.length < 4) {
      setErrorMessage('Silakan masukkan NIM atau email kampus yang valid.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal mengirim kode PIN verifikasi.');
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
        return;
      }

      setMaskedEmail(data.maskedEmail || 'email kampus Anda');
      setCooldown(data.cooldownSeconds || 60);
      setSuccessNotice(`Kode PIN 6-digit dikirim ke ${data.maskedEmail || 'Outlook kampus Anda'}.`);
      setStep('pin');
      setPin('');
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan saat mengirim permintaan kode PIN.');
    } finally {
      setIsLoading(false);
    }
  }

  // Verify OTP (Step 2)
  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanPin = pin.trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMessage('Kode PIN harus tepat 6 digit angka.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          pin: cleanPin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Kode PIN tidak valid atau telah kedaluwarsa.');
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
        return;
      }

      setSuccessNotice('Terverifikasi. Membuka bilik suara...');
      setTimeout(() => {
        window.location.href = data.redirectTo || '/vote';
      }, 600);
    } catch {
      setErrorMessage('Terjadi gangguan jaringan saat memverifikasi kode PIN.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Dummy Login (Instant Bypass for Dev Testing)
  async function handleDummyLogin(accountId: string) {
    setLoadingAccountId(accountId);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/dummy-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Login gagal.');
        return;
      }

      if (data.user?.role && data.user.role !== 'voter') {
        window.location.href = '/admin/dashboard';
      } else if (data.user?.hasVoted) {
        window.location.href = '/receipt';
      } else {
        window.location.href = '/vote';
      }
    } catch {
      setErrorMessage('Terjadi kesalahan koneksi saat login.');
    } finally {
      setLoadingAccountId(null);
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Banner Error / Notifikasi */}
      {(errorMessage || urlMessage) && (
        <div className="rounded-xl border border-hmif-red/30 bg-red-50 p-3.5 text-xs text-hmif-red flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-bold">
              {urlError ? `Akses Ditolak (${urlError})` : 'Gagal masuk'}
            </div>
            <div className="mt-0.5 text-neutral-700">{errorMessage || urlMessage}</div>
            {remainingAttempts !== null && (
              <div className="mt-1 font-semibold text-neutral-800">
                Sisa kesempatan percobaan: {remainingAttempts} kali.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner Sukses Pengiriman */}
      {successNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <span className="flex-1 leading-relaxed">{successNotice}</span>
        </div>
      )}

      {/* STEP 1: INPUT NIM */}
      {step === 'nim' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
            >
              NIM
            </label>
            <div className="relative">
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: 103012300001"
                disabled={isLoading}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 text-sm font-medium focus:bg-white focus:border-hmif-blue focus:ring-2 focus:ring-hmif-blue/20 transition-all outline-none"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5 leading-normal">
              Kode PIN 6-digit dikirim ke email Outlook kampus Anda.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !identifier.trim()}
            className="w-full h-12 px-5 rounded-xl bg-hmif-blue hover:bg-brand-blue-hover text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hmif-blue disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Mengirim Kode PIN...</span>
              </>
            ) : (
              <>
                <span>Kirim Kode PIN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: INPUT 6-DIGIT PIN */}
      {step === 'pin' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="pin"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700"
              >
                Masukkan Kode PIN 6-Digit
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep('nim');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="text-xs text-hmif-blue hover:underline flex items-center gap-1 font-medium min-h-[2.75rem] px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors -my-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ganti NIM</span>
              </button>
            </div>

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
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                disabled={isLoading}
                className="w-full h-14 text-center tracking-[0.4em] font-mono text-2xl font-bold rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-hmif-blue focus:ring-2 focus:ring-hmif-blue/20 transition-all outline-none"
              />
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
              <span>Dikirim ke: <strong className="text-neutral-700">{maskedEmail}</strong></span>
              <span>Masa aktif: <strong>10 Menit</strong></span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || pin.length !== 6}
            className="w-full h-12 px-5 rounded-xl bg-hmif-blue hover:bg-brand-blue-hover text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hmif-blue disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memverifikasi Kode PIN...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Bilik Suara</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Tombol Kirim Ulang Kode PIN */}
          <div className="pt-1 text-center">
            <button
              type="button"
              disabled={cooldown > 0 || isLoading}
              onClick={() => handleRequestOtp()}
              className="min-h-[2.75rem] px-3.5 py-2 rounded-xl text-xs text-neutral-600 hover:text-hmif-blue hover:bg-neutral-100 transition-colors font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0
                  ? `Kirim ulang PIN dalam ${cooldown} detik`
                  : 'Belum menerima email? Kirim ulang PIN'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* DPT Verification Badge */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center text-center pt-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Hak pilih divalidasi dengan Daftar Pemilih Tetap resmi.</span>
      </div>

      {/* Panel Pengujian Mode Dummy (Collapsible Drawer for Dev Testing) */}
      {dummyEnabled && (
        <div className="mt-4 rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden text-white">
          <button
            type="button"
            onClick={() => setShowDummyAccounts(!showDummyAccounts)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-neutral-800/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-hmif-gold animate-pulse" />
              <span className="text-xs font-bold text-hmif-gold">
                Mode Uji Coba Cepat (Dev)
              </span>
            </div>
            {showDummyAccounts ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          {showDummyAccounts && (
            <div className="p-3 pt-0 border-t border-neutral-800 space-y-1.5 max-h-56 overflow-y-auto">
              <p className="text-[11px] text-neutral-400 pb-1">
                Pilih akun simulasi untuk login instan:
              </p>
              {dummyAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  disabled={loadingAccountId !== null}
                  onClick={() => handleDummyLogin(account.id)}
                  className="w-full p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 hover:border-hmif-gold/50 border border-neutral-700 text-left transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block truncate">
                      {account.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 block truncate">
                      {account.role.toUpperCase()} {account.nim ? `• ${account.nim}` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-hmif-gold font-medium shrink-0">
                    {loadingAccountId === account.id ? 'Masuk...' : 'Pilih →'}
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
