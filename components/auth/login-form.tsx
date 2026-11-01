'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { DummyAccount } from '@/lib/auth/dummy';

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorMessage = searchParams.get('message');
  const errorCode = searchParams.get('error');

  const [dummyAccounts, setDummyAccounts] = useState<DummyAccount[]>([]);
  const [dummyEnabled, setDummyEnabled] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    // Muat daftar akun dummy jika diizinkan oleh server
    fetch('/api/auth/dummy-login')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.enabled) {
          setDummyEnabled(true);
          setDummyAccounts(data.accounts || []);
        }
      })
      .catch(() => {
        // Mode dummy non-aktif / di lingkungan produksi
      });
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

      // Pengalihan cerdas berdasarkan role dan status voting
      if (data.user?.role && data.user.role !== 'voter') {
        router.push('/admin/dashboard');
      } else if (data.user?.hasVoted) {
        router.push('/receipt');
      } else {
        router.push('/vote');
      }
    } catch {
      setCustomError('Terjadi kesalahan jaringan saat mencoba login.');
    } finally {
      setLoadingAccountId(null);
    }
  }

  function handleEntraLogin() {
    setIsSubmitting(true);
    window.location.href = '/api/auth/login';
  }

  return (
    <div className="w-full">
      {/* Banner Notifikasi Error */}
      {(errorMessage || customError) && (
        <div className="mb-6 rounded-xl border border-hmif-red/40 bg-hmif-red/10 p-4 text-xs text-hmif-red">
          <div className="font-bold">
            {errorCode ? `Akses Ditolak [${errorCode}]` : 'Perhatian'}
          </div>
          <div className="mt-1">{customError || errorMessage}</div>
        </div>
      )}

      {/* Tombol Login SSO Utama */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleEntraLogin}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-hmif-blue px-5 py-3.5 text-sm font-bold text-hmif-white shadow-sm transition hover:bg-hmif-blue/90 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
          <path d="M10 0H0V10H10V0Z" fill="#F25022" />
          <path d="M21 0H11V10H21V0Z" fill="#7FBA00" />
          <path d="M10 11H0V21H10V11Z" fill="#00A4EF" />
          <path d="M21 11H11V21H21V11Z" fill="#FFB900" />
        </svg>
        <span>
          {isSubmitting ? 'Mengarahkan ke Microsoft...' : 'Masuk dengan Akun Kampus (Microsoft Entra)'}
        </span>
      </button>

      {/* Panel Pengujian Mode Dummy (Khusus Development / Testing) */}
      {dummyEnabled && (
        <div className="mt-8 rounded-2xl border border-hmif-gold/40 bg-hmif-cream/60 p-5">
          <div className="flex items-center justify-between border-b border-hmif-gold/30 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-hmif-dark">
              🛠️ Panel Dummy Auth (Development Only)
            </span>
            <span className="rounded-full bg-hmif-gold/20 px-2 py-0.5 text-[10px] font-bold text-hmif-dark">
              MOCK MODE
            </span>
          </div>
          <p className="mt-2 text-[11px] text-hmif-gray-dark">
            Simulasi login instan tanpa internet/Entra untuk menguji seluruh skenario DPT & RBAC:
          </p>

          <div className="mt-3 space-y-2">
            {dummyAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                disabled={loadingAccountId !== null}
                onClick={() => handleDummyLogin(account.id)}
                className="flex w-full flex-col items-start rounded-xl border border-hmif-gray-light/30 bg-hmif-white p-2.5 text-left transition hover:border-hmif-gold hover:shadow-xs disabled:opacity-50"
              >
                <div className="flex w-full items-center justify-between text-xs font-bold text-hmif-dark">
                  <span>{account.name}</span>
                  <span className="rounded bg-hmif-gray-light/20 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-hmif-gray-dark">
                    {account.role}
                  </span>
                </div>
                <div className="text-[11px] text-hmif-gray-dark">
                  {account.email} {account.nim ? `• NIM: ${account.nim}` : ''}
                </div>
                <div className="mt-1 text-[10px] text-hmif-gray-dark/80 italic">
                  {account.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
