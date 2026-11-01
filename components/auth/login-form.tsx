'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DummyAccount } from '@/lib/auth/dummy';
import { ShieldCheck, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export function LoginForm() {
  const searchParams = useSearchParams();

  const errorMessage = searchParams.get('message');
  const errorCode = searchParams.get('error');

  const [dummyAccounts, setDummyAccounts] = useState<DummyAccount[]>([]);
  const [dummyEnabled, setDummyEnabled] = useState(false);
  const [showDummyAccounts, setShowDummyAccounts] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

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

  async function handleDummyLogin(accountId: string) {
    setLoadingAccountId(accountId);
    setCustomError(null);

    try {
      const res = await fetch('/api/auth/dummy-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCustomError(data.error || 'Login gagal.');
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
      setCustomError('Terjadi kesalahan koneksi saat login.');
    } finally {
      setLoadingAccountId(null);
    }
  }

  function handleEntraLogin() {
    setIsSubmitting(true);
    window.location.href = '/api/auth/login';
  }

  return (
    <div className="w-full space-y-4">
      {/* Banner Notifikasi Error */}
      {(errorMessage || customError) && (
        <div className="rounded-xl border border-hmif-red/30 bg-red-50 p-3.5 text-xs text-hmif-red flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">
              {errorCode ? `Akses Ditolak (${errorCode})` : 'Perhatian'}
            </div>
            <div className="mt-0.5 text-neutral-700">{customError || errorMessage}</div>
          </div>
        </div>
      )}

      {/* Tombol Login SSO Microsoft Entra */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleEntraLogin}
        className="w-full h-12 px-5 rounded-xl bg-hmif-blue hover:bg-brand-blue-hover text-white text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hmif-blue disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Mengarahkan ke Microsoft SSO...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect fill="#F25022" height="9" width="9" x="1" y="1" />
              <rect fill="#7FBA00" height="9" width="9" x="11" y="1" />
              <rect fill="#00A4EF" height="9" width="9" x="11" y="11" />
              <rect fill="#FFB900" height="9" width="9" x="11" y="11" />
            </svg>
            <span>Masuk dengan Email Kampus</span>
          </>
        )}
      </button>

      {/* Domain Notice */}
      <p className="text-center text-xs text-neutral-500 font-medium">
        Khusus akun <span className="font-semibold text-neutral-800">@student.telkomuniversity.ac.id</span>
      </p>

      {/* DPT Verification Badge */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center text-center pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Hak pilih divalidasi dengan Daftar Pemilih Tetap (DPT).</span>
      </div>

      {/* Panel Pengujian Mode Dummy (Collapsible Drawer) */}
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
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {account.role.toUpperCase()} {account.nim ? `• ${account.nim}` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-hmif-gold font-medium shrink-0">
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
