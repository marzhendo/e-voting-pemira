export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-hmif-dark text-hmif-white">
      <header className="border-b border-hmif-gray-dark px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-hmif-gold">
              Dashboard Panitia KPR
            </h1>
            <p className="text-xs text-hmif-gray-light">
              Panel Pengawasan Pemira HMIF & Rekapitulasi Privat
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-hmif-red/30 px-3 py-1 text-xs font-semibold text-hmif-cream">
              Restricted Area
            </span>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-hmif-gray-dark bg-hmif-dark/80 p-5">
            <div className="text-xs text-hmif-gray-light">Total DPT Terdaftar</div>
            <div className="mt-2 text-2xl font-bold text-hmif-gold">-- Mahasiswa</div>
          </div>
          <div className="rounded-xl border border-hmif-gray-dark bg-hmif-dark/80 p-5">
            <div className="text-xs text-hmif-gray-light">Suara Masuk (Turnout)</div>
            <div className="mt-2 text-2xl font-bold text-hmif-white">-- Suara</div>
          </div>
          <div className="rounded-xl border border-hmif-gray-dark bg-hmif-dark/80 p-5">
            <div className="text-xs text-hmif-gray-light">Persentase Partisipasi</div>
            <div className="mt-2 text-2xl font-bold text-hmif-yellow">-- %</div>
          </div>
        </div>
      </main>
    </div>
  );
}
