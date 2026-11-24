"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Users,
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
  broadcastTemplate: "credentials" | "reminder" | "invitation" | "custom";
  broadcastTargetGroup: "not_voted" | "all" | "voted" | "failed_email" | "uncontacted";
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
  onSelectTemplate: (template: "credentials" | "reminder" | "invitation" | "custom") => void;
  onTargetGroupChange: (group: "not_voted" | "all" | "voted" | "failed_email" | "uncontacted") => void;
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
  const unvotedCount = Math.max(0, totalDpt - totalVotes);
  const participationRate =
    totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col gap-6">
      {/* Header Panel */}
      <div className="rounded-2xl bg-surface-container p-5 sm:p-6 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-on-surface">
              Broadcast Email Pemira
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Kirim pengumuman resmi dan pengingat pemungutan suara ke email SSO mahasiswa terdaftar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshQuota}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">
            Total DPT Terdaftar
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-on-surface tabular-nums">
              {totalDpt.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-on-surface-variant">pemilih</span>
          </div>
          <span className="text-[11px] text-on-surface-variant/70 mt-1">
            Data pemilih aktif HMIF
          </span>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Sudah Memilih</span>
            <span className="text-[11px] font-mono text-emerald-400/80">
              {participationRate}%
            </span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 tabular-nums">
              {totalVotes.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-on-surface-variant">pemilih</span>
          </div>
          <span className="text-[11px] text-on-surface-variant/70 mt-1">
            Suara masuk terverifikasi
          </span>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs text-amber-400 font-medium">
            Belum Memilih
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 tabular-nums">
              {unvotedCount.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-on-surface-variant">pemilih</span>
          </div>
          <span className="text-[11px] text-on-surface-variant/70 mt-1">
            Prioritas pengiriman pengingat
          </span>
        </div>
      </div>

      {/* Results / Error Banner */}
      {broadcastResult && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-sm">
              Broadcast berhasil dikirim
            </span>
            <span className="text-emerald-300 block mt-0.5">
              Sebanyak {broadcastResult.sentCount} email berhasil terkirim
              {broadcastResult.failedCount > 0
                ? ` (${broadcastResult.failedCount} email gagal)`
                : ""}{" "}
              dari sasaran {broadcastResult.totalTarget} mahasiswa.
            </span>
          </div>
        </div>
      )}

      {broadcastError && (
        <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-xs text-error flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-sm">
              Pengiriman broadcast tidak berhasil
            </span>
            <span className="block mt-0.5 text-error/90">{broadcastError}</span>
          </div>
        </div>
      )}

      {/* Main 2-Column Interface: Composer & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration & Message Composer */}
        <div className="lg:col-span-7 bg-surface-container rounded-2xl p-5 sm:p-6 border border-outline-variant/30 space-y-6">
          {/* Template Picker */}
          <div>
            <label className="text-xs font-semibold text-on-surface block mb-2.5">
              Pilih format pesan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTemplate("credentials")}
                className={`p-3 rounded-xl text-left border cursor-pointer transition-all active:scale-[0.98] relative ${
                  broadcastTemplate === "credentials"
                    ? "bg-primary/10 border-primary text-on-surface shadow-sm ring-1 ring-primary/30"
                    : "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="inline-block px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider mb-1.5">
                  Malam H-1
                </span>
                <span className="text-xs font-bold block text-primary">
                  Sandi &amp; Pengingat
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-1 leading-snug">
                  Reminder besok pemilihan + bagikan kata sandi unik
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate("reminder")}
                className={`p-3 rounded-xl text-left border cursor-pointer transition-all active:scale-[0.98] ${
                  broadcastTemplate === "reminder"
                    ? "bg-primary/10 border-primary text-on-surface shadow-sm ring-1 ring-primary/30"
                    : "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="text-xs font-bold block text-primary">
                  Pengingat Hari H
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-1 leading-snug">
                  Khusus mahasiswa yang belum menggunakan hak suara
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate("invitation")}
                className={`p-3 rounded-xl text-left border cursor-pointer transition-all active:scale-[0.98] ${
                  broadcastTemplate === "invitation"
                    ? "bg-primary/10 border-primary text-on-surface shadow-sm ring-1 ring-primary/30"
                    : "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="text-xs font-bold block text-primary">
                  Undangan Pembukaan
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-1 leading-snug">
                  Pengumuman resmi pembukaan bilik ke semua DPT
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplate("custom")}
                className={`p-3 rounded-xl text-left border cursor-pointer transition-all active:scale-[0.98] ${
                  broadcastTemplate === "custom"
                    ? "bg-primary/10 border-primary text-on-surface shadow-sm ring-1 ring-primary/30"
                    : "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="text-xs font-bold block text-primary">
                  Pesan Bebas
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-1 leading-snug">
                  Sesuaikan subjek dan isi pesan sendiri
                </span>
              </button>
            </div>
          </div>

          {/* Filter Target Penerima */}
          <div className="pt-4 border-t border-outline-variant/20 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface block">
                  Kelompok penerima
                </label>
                <select
                  value={broadcastTargetGroup}
                  onChange={(e) =>
                    onTargetGroupChange(
                      e.target.value as "not_voted" | "all" | "voted" | "failed_email" | "uncontacted",
                    )
                  }
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  <option value="not_voted">
                    Belum memilih (Disarankan)
                  </option>
                  <option value="all">Seluruh mahasiswa di DPT</option>
                  <option value="voted">Sudah memilih</option>
                  <option value="failed_email">Gagal terkirim sebelumnya (Kirim Ulang)</option>
                  <option value="uncontacted">Belum pernah menerima email</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface block">
                  Filter angkatan
                </label>
                <select
                  value={broadcastGeneration}
                  onChange={(e) => onGenerationChange(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  <option value="all">
                    Semua angkatan{" "}
                    {availableGenerations.length > 0
                      ? `(${availableGenerations[0]} – ${availableGenerations[availableGenerations.length - 1]})`
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

            {/* Target Counter Indicator */}
            <div className="bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Users className="w-4 h-4 text-primary" />
                <span>Estimasi penerima sasaran:</span>
              </div>
              <div className="font-semibold text-primary tabular-nums">
                {loadingBroadcastCount ? (
                  <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghitung...</span>
                  </span>
                ) : (
                  <span>
                    {(broadcastTargetCount ?? 0).toLocaleString("id-ID")} Mahasiswa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-4 border-t border-outline-variant/20">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface block">
                Subjek email
              </label>
              <input
                type="text"
                value={broadcastSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Contoh: [Pengingat] Gunakan hak suaramu di Pemira HMIF"
                className="w-full bg-surface-container-lowest text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface block">
                Judul pengumuman di dalam email
              </label>
              <input
                type="text"
                value={broadcastHeadline}
                onChange={(e) => onHeadlineChange(e.target.value)}
                placeholder="Contoh: Gunakan Hak Suaramu Sebelum Ditutup"
                className="w-full bg-surface-container-lowest text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-on-surface block">
                Isi pesan pengumuman
              </label>
              <textarea
                rows={6}
                value={broadcastBody}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder="Tuliskan pesan pengumuman resmi..."
                className="w-full bg-surface-container-lowest text-xs rounded-xl p-3.5 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-y transition-colors font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface block">
                  Teks tombol aksi
                </label>
                <input
                  type="text"
                  value={broadcastCtaText}
                  onChange={(e) => onCtaTextChange(e.target.value)}
                  placeholder="Contoh: Masuk ke Bilik Suara"
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface block">
                  Tautan tujuan (URL)
                </label>
                <input
                  type="text"
                  value={broadcastCtaUrl}
                  placeholder="/login"
                  onChange={(e) => onCtaUrlChange(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-[11px] transition-colors"
                />
                <span className="text-[11px] text-on-surface-variant block">
                  Tautan relatif seperti <code className="text-primary font-mono">/login</code> akan otomatis disesuaikan ke domain resmi Pemira.
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="button"
              disabled={
                isBroadcasting ||
                (broadcastTargetCount !== null && broadcastTargetCount === 0)
              }
              onClick={onOpenConfirmBroadcast}
              className="w-full h-11 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-secondary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    Kirim Email ke {(broadcastTargetCount ?? 0).toLocaleString("id-ID")} Mahasiswa
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Live Email Preview */}
        <div className="hidden lg:block lg:col-span-5 sticky top-6">
          <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-xs font-semibold text-on-surface">
                Pratinjau Email Siswa
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] text-on-surface-variant font-medium">
                Kotak Masuk
              </span>
            </div>

            {/* Email Container Frame */}
            <div className="bg-[#141414] rounded-xl border border-white/5 p-4 space-y-4 text-xs font-sans shadow-inner">
              {/* Email Meta Headers */}
              <div className="pb-3 border-b border-white/10 space-y-1.5 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="text-neutral-500 w-12 shrink-0">Dari:</span>
                  <span className="text-neutral-200 font-medium">
                    Panitia Pemira HMIF &lt;noreply@pemirahmif.com&gt;
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neutral-500 w-12 shrink-0">Kepada:</span>
                  <span className="text-neutral-300 font-mono">
                    103012300001@student.telkomuniversity.ac.id
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neutral-500 w-12 shrink-0">Subjek:</span>
                  <span className="text-primary font-semibold">
                    {broadcastSubject || "(Subjek pesan belum diisi)"}
                  </span>
                </div>
              </div>

              {/* Rendered Email Card */}
              <div className="bg-[#1E1E1E] rounded-xl p-5 border border-white/10 space-y-4">
                <div className="text-center pb-3 border-b border-white/10">
                  <span className="text-[10px] font-bold text-hmif-gold uppercase tracking-wider block">
                    PEMIRA HMIF 2026/2027
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {broadcastHeadline || "Judul Pengumuman"}
                  </h4>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Telkom University Purwokerto
                  </span>
                </div>

                <p className="text-neutral-300 text-[11px]">
                  Halo <strong>Ahmad Rizky Pratama</strong>
                  {broadcastTemplate === "credentials" ? " (NIM: 103012300001)" : ""},
                </p>

                <div className="text-neutral-300 text-[11px] whitespace-pre-line leading-relaxed space-y-2">
                  {broadcastBody || "Isi pesan pengumuman akan tampil di sini..."}
                </div>

                {broadcastTemplate === "credentials" && (
                  <>
                    {/* Kotak Sandi Pemilih */}
                    <div className="bg-[#242424] border border-[#3A3A3A] rounded-xl p-3 text-center my-3 shadow-inner">
                      <span className="text-[10px] font-bold tracking-wider text-hmif-gold uppercase block">
                        KATA SANDI PEMILIH
                      </span>
                      <span className="font-mono text-xl font-extrabold text-hmif-gold tracking-widest block mt-1">
                        7K9P-2M4X
                      </span>
                      <span className="text-[10px] text-neutral-400 block mt-1">
                        Format: 8 karakter unik (dapat diketik tanpa tanda strip)
                      </span>
                    </div>

                    {/* Panduan Masuk */}
                    <div className="bg-[#222222] rounded-lg p-2.5 text-[11px] text-neutral-300 space-y-1 my-2">
                      <p className="font-bold text-white text-[11px]">Cara Masuk ke Bilik Suara:</p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-neutral-400">
                        <li>Buka website pemilihan melalui tombol di bawah.</li>
                        <li>Ketik NIM kamu (<strong>103012300001</strong>).</li>
                        <li>Masukkan kata sandi unik di atas.</li>
                        <li>Pilih pasangan calon Chairman &amp; Vice Chairman, lalu kirimkan suara.</li>
                      </ol>
                    </div>
                  </>
                )}

                <div className="pt-2 text-center">
                  <span
                    className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm ${
                      broadcastTemplate === "credentials"
                        ? "bg-hmif-gold text-neutral-900 font-bold"
                        : "bg-hmif-blue text-white"
                    }`}
                  >
                    <span>{broadcastCtaText || "Buka Bilik Suara"}</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border-l-2 border-hmif-gold text-[10px] text-neutral-400 leading-normal">
                  {broadcastTemplate === "credentials"
                    ? "Simpan kata sandi ini dengan baik. Satu kata sandi hanya berlaku untuk satu kali pemungutan suara."
                    : "Pilihan suaramu bersifat rahasia dan disimpan secara anonim tanpa mencatat identitas pemilih pada surat suara."}
                </div>
              </div>

              <div className="text-center text-[10px] text-neutral-500 pt-1">
                Email otomatis dari Komisi Pemilihan Raya HMIF
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
