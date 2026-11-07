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
      setErrorMessage('Masukkan NIM atau email kampus yang valid.');
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

      setMaskedEmail(data.maskedEmail || 'email SSO kampus');
      setCooldown(data.cooldownSeconds || 60);
      setSuccessNotice(`Kode PIN 6-digit dikirim ke ${data.maskedEmail || 'email SSO kampus'}.`);
      setStep('pin');
      setPin('');
    } catch {
      setErrorMessage('Terjadi gangguan jaringan saat meminta kode PIN.');
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
        setErrorMessage(data.error || 'Kode PIN salah atau telah kedaluwarsa.');
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
        return;
      }

      const isStaff = data.user?.role && data.user.role !== 'voter';
      setSuccessNotice(
        isStaff
          ? 'Terverifikasi sebagai Administrator. Membuka dashboard...'
          : 'Terverifikasi. Membuka bilik suara...'
      );
      setTimeout(() => {
        window.location.href = data.redirectTo || (isStaff ? '/admin/dashboard' : '/vote');
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
      setErrorMessage('Terjadi kesalahan koneksi saat login simulasi.');
    } finally {
      setLoadingAccountId(null);
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Banner Error / Notifikasi */}
      {(errorMessage || urlMessage) && (
        <div className="rounded-xl border border-error/40 bg-error-container/20 p-3.5 text-xs text-error flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-bold">
              {urlError ? `Akses Ditolak (${urlError})` : 'Gagal Masuk'}
            </div>
            <div className="mt-0.5 text-on-surface-variant">{errorMessage || urlMessage}</div>
            {remainingAttempts !== null && (
              <div className="mt-1 font-semibold text-on-surface">
                Sisa kesempatan percobaan: {remainingAttempts} kali.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner Sukses Pengiriman */}
      {successNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
          <span className="flex-1 leading-relaxed">{successNotice}</span>
        </div>
      )}

      {/* STEP 1: INPUT NIM */}
      {step === 'nim' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
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
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: 103012300001"
                disabled={isLoading}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface placeholder:text-outline/60 text-sm font-medium focus:bg-surface-container-highest focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              <Mail className="w-4 h-4 text-outline absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !identifier.trim()}
            className="w-full h-12 px-5 rounded-xl bg-primary hover:bg-secondary-fixed text-on-primary text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                <span>Mengirim Kode PIN...</span>
              </>
            ) : (
              <span>Kirim Kode PIN</span>
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
                className="block text-xs font-bold uppercase tracking-wider text-on-surface"
              >
                Kode PIN 6 Digit
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep('nim');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-surface-container transition-colors -my-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ganti NIM</span>
              </button>
            </div>

            <div>
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
                className="w-full h-14 text-center tracking-[0.4em] font-mono text-2xl font-bold rounded-xl border border-outline-variant/40 bg-surface-container text-primary placeholder:text-outline/40 focus:bg-surface-container-highest focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-outline">
              <span>Terkirim ke: <strong className="text-on-surface">{maskedEmail}</strong></span>
              <span>Aktif: <strong className="text-on-surface">10 Menit</strong></span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || pin.length !== 6}
            className="w-full h-12 px-5 rounded-xl bg-primary hover:bg-secondary-fixed text-on-primary text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
                <span>Memverifikasi PIN...</span>
              </>
            ) : (
              <span>Masuk ke Bilik Suara</span>
            )}
          </button>

          {/* Tombol Kirim Ulang Kode PIN */}
          <div className="pt-1 text-center">
            <button
              type="button"
              disabled={cooldown > 0 || isLoading}
              onClick={() => handleRequestOtp()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-on-surface-variant hover:text-primary hover:bg-surface-container disabled:text-outline disabled:opacity-80 disabled:cursor-not-allowed"
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

      {/* DPT Verification Note */}
      <div className="flex items-center gap-2 text-xs text-outline justify-center text-center pt-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Hanya untuk mahasiswa aktif Informatika terdaftar di DPT.</span>
      </div>

      {/* Panel Pengujian Mode Dummy (Khusus saat parameter ?dev=true disertakan untuk pengujian otomatis) */}
      {dummyEnabled && (searchParams.get('dev') === 'true' || searchParams.get('dev') === '1') && (
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
              <ChevronUp className="w-4 h-4 text-outline" />
            ) : (
              <ChevronDown className="w-4 h-4 text-outline" />
            )}
          </button>

          {showDummyAccounts && (
            <div className="p-3 pt-0 border-t border-outline-variant/20 space-y-2 max-h-56 overflow-y-auto">
              <p className="text-[11px] text-outline pb-1">
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
                    <span className="text-[11px] text-outline block truncate">
                      {account.role.toUpperCase()} {account.nim ? `• ${account.nim}` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-primary font-semibold shrink-0">
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
