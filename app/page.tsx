import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-xl rounded-2xl bg-hmif-white p-8 shadow-md border border-hmif-gray-light/30">
        <div className="inline-flex items-center gap-2 rounded-full bg-hmif-gold/20 px-3 py-1 text-xs font-semibold text-hmif-dark">
          Pemira HMIF Telkom University Purwokerto
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-hmif-dark sm:text-4xl">
          E-Voting Pemira HMIF
        </h1>
        <p className="mt-3 text-sm text-hmif-gray-dark">
          Selamat datang di platform pemungutan suara elektronik suksesi Ketua dan Wakil Ketua Himpunan Mahasiswa Informatika.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-hmif-blue px-6 py-3 text-sm font-semibold text-hmif-white transition-all hover:bg-hmif-blue/90"
          >
            Masuk dengan Akun Kampus
          </Link>
          <Link
            href="/vote"
            className="inline-flex items-center justify-center rounded-xl bg-hmif-gold px-6 py-3 text-sm font-bold text-hmif-dark transition-all hover:bg-hmif-yellow"
          >
            Menuju Bilik Suara
          </Link>
        </div>
      </div>
    </main>
  );
}
