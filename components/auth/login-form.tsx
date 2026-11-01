'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { DummyAccount } from '@/lib/auth/dummy';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

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
    <div className="w-full space-y-4">
      {/* Banner Notifikasi Error */}
      {(errorMessage || customError) && (
        <div className="rounded-xl border border-hmif-red/40 bg-red-50 p-3.5 text-xs text-hmif-red flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">
              {errorCode ? `Akses Ditolak [${errorCode}]` : 'Perhatian'}
            </div>
            <div className="mt-0.5 text-neutral-700">{customError || errorMessage}</div>
          </div>
        </div>
      )}

      {/* Tombol Login SSO Utama Microsoft Entra */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleEntraLogin}
        className="w-full h-12 px-5 rounded-xl bg-hmif-blue hover:bg-brand-blue-hover text-white text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hmif-blue disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Mengarahkan ke Microsoft Entra...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect fill="#F25022" height="9" width="9" x="1" y="1" />
              <rect fill="#7FBA00" height="9" width="9" x="11" y="1" />
              <rect fill="#00A4EF" height="9" width="9" x="1" y="11" />
              <rect fill="#FFB900" height="9" width="9" x="11" y="11" />
            </svg>
            <span>Masuk dengan Akun Kampus</span>
          </>
        )}
      </button>

      {/* Domain Notice */}
      <p className="text-center text-xs text-neutral-500 font-medium pt-1">
        Khusus mahasiswa aktif via <span className="font-semibold text-neutral-800">@student.telkomuniversity.ac.id</span>
      </p>

      {/* DPT Verification Badge */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center text-center pt-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>
          Hak pilih diverifikasi melalui <strong className="text-neutral-700 font-semibold">Daftar Pemilih Tetap (DPT)</strong>.
        </span>
      </div>

      {/* Panel Pengujian Mode Dummy (Khusus Development / Testing) */}
      {dummyEnabled && (
        <div className="mt-6 rounded-2xl border border-hmif-gold/40 bg-neutral-900 text-white p-4">
          <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-hmif-gold flex items-center gap-1.5">
              🛠️ Dummy Auth Mock
            </span>
            <span className="rounded-full bg-hmif-gold/20 px-2 py-0.5 text-[10px] font-bold text-hmif-gold">
              DEV MODE
            </span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            Pilih akun simulasi untuk menguji bilik suara & dashboard RBAC:
          </p>

          <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
            {dummyAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                disabled={loadingAccountId !== null}
                onClick={() => handleDummyLogin(account.id)}
                className="flex w-full flex-col items-start rounded-xl border border-neutral-800 bg-neutral-800/80 p-2 text-left transition hover:border-hmif-gold hover:bg-neutral-800 disabled:opacity-50"
              >
                <div className="flex w-full items-center justify-between text-xs font-bold text-white">
                  <span>{account.name}</span>
                  <span className="rounded bg-neutral-700 px-1.5 py-0.2 text-[10px] uppercase font-semibold text-hmif-gold">
                    {account.role}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  {account.email} {account.nim ? `• ${account.nim}` : ''}
                </div>
                <div className="text-[10px] text-neutral-500 italic mt-0.5">
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
