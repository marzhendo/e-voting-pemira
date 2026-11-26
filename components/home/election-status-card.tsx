import { Calendar, CheckCircle2, Clock, Wrench } from "lucide-react";
import type { PublicElectionSummary } from "@/lib/election/public-summary";

function formatDateRange(startIso: string | null, endIso: string | null): string | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const startStr = start.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const endStr = end.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return startStr === endStr ? startStr : `${startStr} s/d ${endStr}`;
}

const PHASE_META = {
  closed: {
    label: "Pemungutan Suara Ditutup",
    note: "Masa pemilihan periode 2026/2027 telah selesai. Rekapitulasi Suara akhir dan verifikasi Berita Acara (BAST) tersedia untuk diperiksa.",
    icon: CheckCircle2,
    toneClass: "text-tertiary",
  },
  active: {
    label: "Bilik Suara Dibuka",
    note: "Pemilih yang terdaftar di Daftar Pemilih Tetap (DPT) dapat masuk menggunakan NIM dan Kata Sandi Pemilih. Perolehan suara tiap pasangan calon tetap terkunci hingga pemilihan ditutup.",
    icon: null,
    toneClass: "text-on-surface",
  },
  upcoming: {
    label: "Menunggu Jadwal Dibuka",
    note: "Bilik Suara Digital akan dibuka otomatis sesuai ketetapan jadwal resmi Komisi Pemilihan Raya (KPR) HMIF.",
    icon: Clock,
    toneClass: "text-tertiary",
  },
  maintenance: {
    label: "Pemeliharaan Sistem",
    note: "Akses Bilik Suara Digital sementara dijeda oleh panitia KPR HMIF untuk pemeliharaan teknis.",
    icon: Wrench,
    toneClass: "text-error",
  },
} as const;

interface ElectionStatusCardProps {
  summary: PublicElectionSummary;
}

export function ElectionStatusCard({ summary }: ElectionStatusCardProps) {
  const meta = PHASE_META[summary.phase];
  const StatusIcon = meta.icon;
  const scheduleLabel = formatDateRange(summary.startTime, summary.endTime);

  return (
    <aside
      aria-label="Status resmi pemilihan"
      className="rounded-2xl border border-outline-variant bg-surface-container p-5 sm:p-6 flex flex-col gap-5"
    >
      {/* Header Status */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-outline-variant">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-on-surface-variant block">
            Status Pemilihan
          </span>
          <div className={`inline-flex items-center gap-2 text-sm sm:text-base font-bold ${meta.toneClass}`}>
            {summary.phase === "active" ? (
              <span
                className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"
                aria-hidden="true"
              />
            ) : (
              StatusIcon && (
                <StatusIcon
                  className="w-4 h-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )
            )}
            <span>{meta.label}</span>
          </div>
        </div>

        <span className="font-mono text-xs font-semibold text-on-surface-variant tabular-nums shrink-0">
          2026/2027
        </span>
      </div>

      {/* Data Faktual Pemilihan */}
      {summary.dataAvailable ? (
        <dl className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3.5 space-y-1">
            <dt className="text-xs font-medium text-on-surface-variant">
              Total DPT
            </dt>
            <dd className="font-mono text-xl sm:text-2xl font-semibold text-on-surface tabular-nums">
              {summary.totalDpt !== null
                ? summary.totalDpt.toLocaleString("id-ID")
                : "-"}
            </dd>
          </div>

          <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3.5 space-y-1">
            <dt className="text-xs font-medium text-on-surface-variant">
              Partisipasi Pemilih
            </dt>
            <dd className="font-mono text-xl sm:text-2xl font-semibold text-on-surface tabular-nums">
              {summary.turnoutPercentage !== null
                ? `${summary.turnoutPercentage}%`
                : "-"}
            </dd>
          </div>

          {scheduleLabel && (
            <div className="col-span-2 rounded-xl bg-surface-container-low border border-outline-variant px-3.5 py-3 flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>Jadwal Resmi</span>
              </dt>
              <dd className="font-mono text-xs font-semibold text-on-surface tabular-nums text-right">
                {scheduleLabel}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4 text-xs text-on-surface-variant leading-relaxed">
          Data ringkasan pemilihan belum tersedia saat ini. Periksa halaman Rekapitulasi Suara atau hubungi KPR HMIF untuk informasi jadwal resmi.
        </div>
      )}

      {/* Catatan Siklus */}
      <div className="rounded-xl bg-surface-highlight border border-outline-variant p-4 text-xs text-on-surface leading-relaxed">
        {meta.note}
      </div>
    </aside>
  );
}
