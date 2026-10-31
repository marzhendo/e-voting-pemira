export default function VotePage() {
  return (
    <div className="min-h-screen bg-hmif-cream p-6 sm:p-10">
      <header className="mx-auto max-w-6xl pb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-hmif-gray-light/30 pb-4">
          <div>
            <h1 className="text-2xl font-black text-hmif-dark sm:text-3xl">
              Bilik Suara Digital
            </h1>
            <p className="text-xs text-hmif-gray-dark">
              Pemilihan Calon Ketua & Wakil Ketua HMIF Periode Mendatang
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-hmif-gold/20 px-3 py-1 text-xs font-bold text-hmif-dark">
              Sesi Aktif
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-hmif-gray-light/30 bg-hmif-white p-6 shadow-sm">
          <p className="text-sm text-hmif-gray-dark">
            Memuat daftar kandidat pasangan calon dan opsi Kotak Kosong...
          </p>
        </div>
      </main>
    </div>
  );
}
