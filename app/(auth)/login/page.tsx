import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sisi Kiri: Branding HMIF */}
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
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Gunakan Hak Suara Anda untuk Masa Depan HMIF.
          </h2>
          <p className="mt-4 text-sm text-hmif-cream/80">
            Pemilihan berlangsung berasaskan Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER JURDIL). Suara Anda dienkripsi tanpa keterkaitan dengan identitas pribadi.
          </p>
        </div>
        <div className="text-xs text-hmif-gray-light">
          © {new Date().getFullYear()} HMIF Telkom University Purwokerto. All rights reserved.
        </div>
      </div>

      {/* Sisi Kanan: Autentikasi SSO */}
      <div className="flex w-full items-center justify-center bg-hmif-cream p-8 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-hmif-white p-8 shadow-sm border border-hmif-gray-light/30">
          <h3 className="text-2xl font-bold text-hmif-dark">
            Masuk Pemilih
          </h3>
          <p className="mt-2 text-xs text-hmif-gray-dark">
            Silakan masuk menggunakan akun email resmi institusi Telkom University (@student.telkomuniversity.ac.id).
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-hmif-blue px-4 py-3 text-sm font-semibold text-hmif-white transition hover:bg-hmif-blue/90"
            >
              <span>Masuk dengan Akun Kampus (Microsoft Entra)</span>
            </button>
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
