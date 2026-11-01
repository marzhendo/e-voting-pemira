import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sisi Kiri: Branding HMIF Telkom University Purwokerto */}
      <div className="flex w-full flex-col justify-between bg-hmif-dark p-8 text-hmif-white lg:w-1/2 lg:p-12">
        <div>
          <div className="text-xl font-black tracking-wider text-hmif-gold">
            HMIF TELKOM UNIVERSITY PURWOKERTO
          </div>
          <p className="mt-1 text-xs text-hmif-gray-light">
            Komisi Pemilihan Raya (KPR) Mahasiswa Informatika
          </p>
        </div>
        <div className="my-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-hmif-gold/20 px-3 py-1 text-xs font-semibold text-hmif-gold mb-4">
            Pemilihan Ketua & Wakil Ketua HMIF
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl text-hmif-white leading-tight">
            Gunakan Hak Suara Anda untuk Masa Depan Informatika.
          </h2>
          <p className="mt-4 text-sm text-hmif-cream/80 leading-relaxed">
            Pemilihan berlangsung berasaskan Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER JURDIL). Surat suara Anda tersimpan murni secara terisolasi tanpa keterkaitan identitas pribadi.
          </p>
        </div>
        <div className="text-xs text-hmif-gray-light">
          © {new Date().getFullYear()} HMIF Telkom University Purwokerto. All rights reserved.
        </div>
      </div>

      {/* Sisi Kanan: Form Autentikasi SSO & Verifikasi Akses */}
      <div className="flex w-full items-center justify-center bg-hmif-cream p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-hmif-white p-8 shadow-sm border border-hmif-gray-light/30">
          <h3 className="text-2xl font-black text-hmif-dark">
            Portal Masuk Pemira
          </h3>
          <p className="mt-2 text-xs text-hmif-gray-dark">
            Masuk dengan akun resmi institusi Telkom University (<span className="font-semibold">@student.telkomuniversity.ac.id</span>).
          </p>

          <div className="mt-6">
            <Suspense fallback={<div className="text-xs text-hmif-gray-dark">Memuat formulir masuk...</div>}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-6 border-t border-hmif-gray-light/20 pt-4 text-center">
            <p className="text-xs text-hmif-gray-dark">
              Mengalami kendala akun atau tidak terdaftar di DPT?{' '}
              <span className="font-semibold text-hmif-dark">Hubungi Panitia KPR</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
