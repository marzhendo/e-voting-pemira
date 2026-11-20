"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react";

export interface BroadcastResultSummary {
  sentCount: number;
  failedCount: number;
  totalTarget: number;
}

export interface BroadcastTabProps {
  totalDpt: number;
  totalVotes: number;
  broadcastResult: BroadcastResultSummary | null;
  broadcastError: string | null;
  broadcastTemplate: "reminder" | "invitation" | "custom";
  broadcastTargetGroup: "not_voted" | "all" | "voted";
  broadcastGeneration: string;
  availableGenerations: number[];
  loadingBroadcastCount: boolean;
  broadcastTargetCount: number | null;
  broadcastSubject: string;
  broadcastHeadline: string;
  broadcastBody: string;
  broadcastCtaText: string;
  broadcastCtaUrl: string;
  isBroadcasting: boolean;
  onRefreshQuota: () => void;
  onSelectTemplate: (template: "reminder" | "invitation" | "custom") => void;
  onTargetGroupChange: (group: "not_voted" | "all" | "voted") => void;
  onGenerationChange: (generation: string) => void;
  onSubjectChange: (subject: string) => void;
  onHeadlineChange: (headline: string) => void;
  onBodyChange: (body: string) => void;
  onCtaTextChange: (text: string) => void;
  onCtaUrlChange: (url: string) => void;
  onOpenConfirmBroadcast: () => void;
}

export function BroadcastTab({
  totalDpt,
  totalVotes,
  broadcastResult,
  broadcastError,
  broadcastTemplate,
  broadcastTargetGroup,
  broadcastGeneration,
  availableGenerations,
  loadingBroadcastCount,
  broadcastTargetCount,
  broadcastSubject,
  broadcastHeadline,
  broadcastBody,
  broadcastCtaText,
  broadcastCtaUrl,
  isBroadcasting,
  onRefreshQuota,
  onSelectTemplate,
  onTargetGroupChange,
  onGenerationChange,
  onSubjectChange,
  onHeadlineChange,
  onBodyChange,
  onCtaTextChange,
  onCtaUrlChange,
  onOpenConfirmBroadcast,
}: BroadcastTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="pb-4 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-primary" />
            <span>Broadcast Email Pemira HMIF</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kirim email pengumuman resmi dan pengingat hak suara ke mahasiswa
            Telkom University.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshQuota}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span>Segarkan Kuota</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30">
          <span className="text-[11px] font-semibold uppercase text-on-surface-variant block">
            Total DPT Resmi
          </span>
          <span className="text-xl font-bold text-on-surface font-mono">
            {totalDpt} Mahasiswa
          </span>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30">
          <span className="text-[11px] font-semibold uppercase text-emerald-400 block">
            Sudah Menggunakan Hak Suara
          </span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {totalVotes} Mahasiswa
          </span>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30">
          <span className="text-[11px] font-semibold uppercase text-amber-400 block">
            Belum Menggunakan Hak Suara
          </span>
          <span className="text-xl font-bold text-amber-400 font-mono">
            {Math.max(0, totalDpt - totalVotes)} Mahasiswa
          </span>
        </div>
      </div>

      {/* Results / Error Banner */}
      {broadcastResult && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Broadcast terkirim.</span>
            <span className="text-emerald-300 block mt-0.5">
              Total {broadcastResult.sentCount} email berhasil terkirim ke
              mahasiswa ({broadcastResult.failedCount} gagal) dari total target{" "}
              {broadcastResult.totalTarget} penerima.
            </span>
          </div>
        </div>
      )}

      {broadcastError && (
        <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-xs text-error flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Gagal Mengirim Broadcast</span>
            <span className="block mt-0.5">{broadcastError}</span>
          </div>
        </div>
      )}

      {/* Main 2-Column Interface: Composer & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration & Message Composer */}
        <div className="lg:col-span-7 bg-surface-container rounded-3xl p-6 sm:p-7 border border-outline-variant/30 space-y-5">
          {/* Template Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
              Pilih Template Pesan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectTemplate("reminder")}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                  broadcastTemplate === "reminder"
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-outline-variant"
                }`}
              >
                <span className="block">⏳ Pengingat (Nudge)</span>
                <span className="text-[11px] opacity-80 block mt-0.5">
                  Khusus belum memilih
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate("invitation")}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                  broadcastTemplate === "invitation"
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-outline-variant"
                }`}
              >
                <span className="block">📢 Undangan Buka</span>
                <span className="text-[11px] opacity-80 block mt-0.5">
                  Untuk semua DPT
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate("custom")}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                  broadcastTemplate === "custom"
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-outline-variant"
                }`}
              >
                <span className="block">✍️ Pesan Kustom</span>
                <span className="text-[11px] opacity-80 block mt-0.5">
                  Tulis bebas
                </span>
              </button>
            </div>
          </div>

          {/* Filter Target Penerima */}
          <div className="pt-4 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Target Kelompok Pemilih:
              </label>
              <select
                value={broadcastTargetGroup}
                onChange={(e) =>
                  onTargetGroupChange(
                    e.target.value as "not_voted" | "all" | "voted",
                  )
                }
                className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="not_voted">
                  🔴 Khusus yang Belum Memilih (Rekomendasi)
                </option>
                <option value="all">👥 Seluruh Mahasiswa di DPT</option>
                <option value="voted">🟢 Khusus yang Sudah Memilih</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Filter Angkatan:
              </label>
              <select
                value={broadcastGeneration}
                onChange={(e) => onGenerationChange(e.target.value)}
                className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="all">
                  Semua Angkatan{" "}
                  {availableGenerations.length > 0
                    ? `(${availableGenerations[0]} - ${availableGenerations[availableGenerations.length - 1]})`
                    : ""}
                </option>
                {availableGenerations.map((gen) => (
                  <option key={gen} value={gen.toString()}>
                    Angkatan {gen}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Counter Badge */}
          <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">
              Jumlah Penerima Sasaran:
            </span>
            <span className="font-bold text-primary font-mono text-sm">
              {loadingBroadcastCount ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : (
                `${broadcastTargetCount ?? "..."} Mahasiswa`
              )}
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Subjek Email:
              </label>
              <input
                type="text"
                value={broadcastSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Judul Pengumuman:
              </label>
              <input
                type="text"
                value={broadcastHeadline}
                onChange={(e) => onHeadlineChange(e.target.value)}
                className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Isi Pesan Pengumuman:
              </label>
              <textarea
                rows={6}
                value={broadcastBody}
                onChange={(e) => onBodyChange(e.target.value)}
                className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Teks Tombol Aksi (CTA):
                </label>
                <input
                  type="text"
                  value={broadcastCtaText}
                  onChange={(e) => onCtaTextChange(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Tautan Tombol Aksi:
                </label>
                <input
                  type="text"
                  value={broadcastCtaUrl}
                  placeholder="/login atau https://pemirahmif.com/login"
                  onChange={(e) => onCtaUrlChange(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                <span className="text-[11px] text-on-surface-variant block">
                  Tautan relatif (contoh: /login) akan otomatis dikonversi
                  sistem ke alamat domain resmi Pemira.
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="button"
            disabled={
              isBroadcasting ||
              (broadcastTargetCount !== null && broadcastTargetCount === 0)
            }
            onClick={onOpenConfirmBroadcast}
            className="w-full h-12 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer mt-4"
          >
            <Send className="w-4 h-4" />
            <span>
              Kirim Broadcast Email ({broadcastTargetCount ?? "..."} Penerima)
            </span>
          </button>
        </div>

        {/* Right Column: Live Email Preview */}
        <div className="hidden lg:block lg:col-span-5 bg-surface-container rounded-3xl p-6 sm:p-7 border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Pratinjau Email Mahasiswa
            </span>
            <span className="text-[11px] text-on-surface-variant font-mono">
              Outlook Preview
            </span>
          </div>

          {/* Email Container Frame */}
          <div className="bg-[#181818] rounded-2xl border border-neutral-800 p-5 space-y-4 text-xs font-sans">
            {/* Email Meta Headers */}
            <div className="pb-3 border-b border-neutral-800 space-y-1 text-[11px]">
              <div>
                <strong className="text-neutral-400">Dari:</strong>{" "}
                <span className="text-neutral-200">
                  Panitia Pemira HMIF &lt;noreply@pemirahmif.com&gt;
                </span>
              </div>
              <div>
                <strong className="text-neutral-400">Kepada:</strong>{" "}
                <span className="text-neutral-200 font-mono">
                  103012300001@student.telkomuniversity.ac.id
                </span>
              </div>
              <div>
                <strong className="text-neutral-400">Subjek:</strong>{" "}
                <span className="text-primary font-medium">
                  {broadcastSubject}
                </span>
              </div>
            </div>

            {/* Rendered Email Card */}
            <div className="bg-[#1E1E1E] rounded-xl p-5 border border-neutral-800 space-y-4">
              <div className="text-center pb-3 border-b border-neutral-800">
                <span className="text-[11px] font-bold text-hmif-gold uppercase tracking-widest block">
                  PEMIRA HMIF 2026/2027
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  {broadcastHeadline}
                </h4>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Telkom University Purwokerto
                </span>
              </div>

              <p className="text-neutral-300 leading-relaxed text-[11px]">
                Halo <strong>Ahmad Rizky Pratama</strong>,
              </p>

              <div className="text-neutral-300 leading-relaxed text-[11px] whitespace-pre-line space-y-2">
                {broadcastBody}
              </div>

              <div className="pt-2 text-center">
                <span className="inline-block px-5 py-2.5 rounded-lg bg-hmif-blue text-white text-[11px] font-bold shadow-md">
                  {broadcastCtaText}
                </span>
              </div>

              <div className="p-2.5 rounded bg-neutral-900 border-l-2 border-hmif-gold text-[11px] text-neutral-400 leading-normal">
                Pilihan suaramu bersifat rahasia dan disimpan secara anonim
                tanpa mencatat identitas pemilih pada surat suara.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
