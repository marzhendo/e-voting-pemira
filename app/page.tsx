import Link from "next/link";
import { getElectionEventSchema } from "@/lib/seo/constants";
import { getPublicElectionSummary, type PublicElectionPhase } from "@/lib/election/public-summary";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ElectionStatusCard } from "@/components/home/election-status-card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PHASE_COPY: Record<
  PublicElectionPhase,
  {
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  }
> = {
  closed: {
    subtitle:
      "Pemungutan suara Chairman & Vice Chairman HMIF periode 2026/2027 telah resmi ditutup. Periksa Rekapitulasi Suara akhir atau verifikasi keabsahan Berita Acara (BAST).",
    primaryCta: { label: "Lihat Rekapitulasi Suara", href: "/rekapitulasi" },
    secondaryCta: { label: "Verifikasi BAST", href: "/bast/verify" },
  },
  active: {
    subtitle:
      "Bilik Suara Digital pemilihan Chairman & Vice Chairman HMIF periode 2026/2027 sedang dibuka. Masuk menggunakan NIM dan Kata Sandi Pemilih yang terdaftar di Daftar Pemilih Tetap (DPT).",
    primaryCta: { label: "Masuk ke Bilik Suara", href: "/login" },
    secondaryCta: { label: "Pantau Partisipasi Pemilih", href: "/rekapitulasi" },
  },
  upcoming: {
    subtitle:
      "Platform resmi pemilihan Chairman & Vice Chairman HMIF periode 2026/2027. Bilik Suara Digital akan dibuka sesuai jadwal resmi Komisi Pemilihan Raya (KPR).",
    primaryCta: { label: "Cek Status Bilik Suara", href: "/login" },
    secondaryCta: { label: "Verifikasi BAST", href: "/bast/verify" },
  },
  maintenance: {
    subtitle:
      "Bilik Suara Digital pemilihan Chairman & Vice Chairman HMIF periode 2026/2027 sedang dalam pemeliharaan terjadwal oleh Komisi Pemilihan Raya (KPR).",
    primaryCta: { label: "Cek Status Bilik Suara", href: "/login" },
    secondaryCta: { label: "Verifikasi BAST", href: "/bast/verify" },
  },
};

const GUARANTEES = [
  {
    index: "01",
    title: "Surat Suara Anonim",
    description:
      "Pilihan kandidat disimpan terpisah di basis data tanpa relasi ke NIM, akun, atau identitas pemilih sehingga kerahasiaan suara terjaga.",
  },
  {
    index: "02",
    title: "Satu Mahasiswa Satu Suara",
    description:
      "Hanya mahasiswa aktif Informatika yang tercatat pada Daftar Pemilih Tetap (DPT) dengan Kata Sandi Pemilih yang dapat menyalurkan satu hak suara sah.",
  },
  {
    index: "03",
    title: "Rekapitulasi & BAST Terverifikasi",
    description:
      "Setiap pemilih menerima Tanda Terima Pemilihan berkode unik, dan hasil akhir disahkan melalui Rekapitulasi Suara serta Berita Acara (BAST) yang dapat diperiksa.",
  },
];

export default async function HomePage() {
  const summary = await getPublicElectionSummary();
  const copy = PHASE_COPY[summary.phase];

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans flex flex-col justify-between selection:bg-primary selection:text-on-primary overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getElectionEventSchema()),
        }}
      />

      <SiteHeader />

      <main id="main-content" className="flex-1 w-full">
        {/* Hero Section: Asimetris 2 Kolom di Desktop, Stack Terstruktur di Mobile */}
        <section
          aria-labelledby="home-hero-heading"
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <p className="text-xs sm:text-sm font-semibold text-tertiary tracking-tight">
                Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto
              </p>

              <h1
                id="home-hero-heading"
                className="font-display text-[clamp(2rem,4vw+1rem,3.35rem)] font-extrabold tracking-tight text-on-surface leading-[1.08]"
              >
                Pemilihan Raya HMIF Telkom University Purwokerto
              </h1>

              <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">
                {copy.subtitle}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href={copy.primaryCta.href}
                  prefetch={false}
                  className="min-h-[48px] px-6 sm:px-7 py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary text-sm font-bold tracking-tight transition-[color,background-color,transform] duration-150 active:scale-[0.96] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {copy.primaryCta.label}
                </Link>

                <Link
                  href={copy.secondaryCta.href}
                  prefetch={false}
                  className="min-h-[48px] px-6 py-3 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold tracking-tight transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {copy.secondaryCta.label}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 w-full">
              <ElectionStatusCard summary={summary} />
            </div>
          </div>
        </section>

        {/* Jaminan Proses Pemira: Struktur Hairline Editorial (RHYTHM 2) */}
        <section
          aria-labelledby="guarantees-heading"
          className="border-t border-outline-variant bg-surface-container-low"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 space-y-8 sm:space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2
                id="guarantees-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-on-surface"
              >
                Jaminan Penyelenggaraan Pemira
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Dirancang untuk menjaga kerahasiaan pilihan mahasiswa Informatika sekaligus memastikan hasil pemilihan dapat dipertanggungjawabkan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {GUARANTEES.map((item) => (
                <article
                  key={item.index}
                  className="pt-5 border-t border-outline-variant space-y-2.5"
                >
                  <span className="font-mono text-xs font-semibold text-tertiary tabular-nums block">
                    {item.index}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-on-surface tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
