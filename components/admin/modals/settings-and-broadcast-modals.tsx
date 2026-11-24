"use client";

import {
  AlertTriangle,
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Portal } from "@/components/ui/portal";
import type { ToggleModalConfig } from "../types";

export interface EmergencyLockModalProps {
  isOpen: boolean;
  emergencyReason: string;
  settingsSaving: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirmLock: () => void;
}

export function EmergencyLockModal({
  isOpen,
  emergencyReason,
  settingsSaving,
  onReasonChange,
  onClose,
  onConfirmLock,
}: EmergencyLockModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-modal-title"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !settingsSaving) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-error">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h3
                    id="emergency-modal-title"
                    className="text-sm font-bold text-on-surface"
                  >
                    Kunci Darurat Bilik Suara
                  </h3>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                    Tindakan Darurat
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup kunci darurat"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mengaktifkan kunci darurat akan menghentikan pengiriman suara
              sementara bagi seluruh pemilih.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase text-on-surface-variant font-semibold">
                Alasan Penguncian:
              </label>
              <select
                value={emergencyReason}
                onChange={(e) => onReasonChange(e.target.value)}
                className="w-full rounded-xl bg-surface-container-lowest px-3 py-2.5 min-h-[44px] text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="Jeda Teknis Terjadwal">
                  Jeda Teknis Terjadwal
                </option>
                <option value="Keadaan Kahar Organisasi">
                  Keadaan Kahar Organisasi
                </option>
                <option value="Audit Keamanan Sistem">
                  Audit Keamanan Sistem
                </option>
                <option value="Keputusan Sidang Pleno KPR">
                  Keputusan Sidang Pleno KPR
                </option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={settingsSaving}
                onClick={onConfirmLock}
                className="px-4 py-2.5 rounded-xl bg-error-solid text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Bilik Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export interface ToggleSettingConfirmModalProps {
  config: ToggleModalConfig | null;
  toggleReason: string;
  settingsSaving: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ToggleSettingConfirmModal({
  config,
  toggleReason,
  settingsSaving,
  onReasonChange,
  onClose,
  onConfirm,
}: ToggleSettingConfirmModalProps) {
  if (!config) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="toggle-modal-title"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !settingsSaving) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    config.isDanger
                      ? "bg-error/10 text-error border border-error/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                >
                  {config.type === "maintenance_mode" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : config.targetValue ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3
                    id="toggle-modal-title"
                    className="text-sm font-bold text-on-surface"
                  >
                    {config.title}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Konfirmasi Eksekutif
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={settingsSaving}
                onClick={onClose}
                aria-label="Tutup modal konfirmasi"
                className="w-9 h-9 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {config.description}
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase text-on-surface-variant font-semibold">
                Alasan Operasional / Catatan Audit:
              </label>
              <textarea
                value={toggleReason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder={config.defaultReason}
                rows={2}
                className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span className="text-[10px] text-on-surface-variant">
                Catatan ini akan direkam dalam Audit Log Pemira HMIF secara
                permanen.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                disabled={settingsSaving}
                onClick={onClose}
                className="px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={settingsSaving}
                onClick={onConfirm}
                className={`px-5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  config.isDanger
                    ? "bg-error-solid text-white hover:bg-error-solid/80"
                    : "bg-primary text-on-primary hover:bg-secondary-fixed"
                }`}
              >
                {settingsSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Konfirmasi &amp; Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export interface BroadcastProgressState {
  current: number;
  total: number;
  sent: number;
  failed: number;
  percentage: number;
  statusText?: string;
  isComplete: boolean;
}

export interface BroadcastConfirmModalProps {
  isOpen: boolean;
  isBroadcasting: boolean;
  broadcastProgress?: BroadcastProgressState | null;
  broadcastTargetCount: number | null;
  broadcastTargetGroup: "not_voted" | "all" | "voted" | "failed_email" | "uncontacted";
  broadcastGeneration: string;
  availableGenerations: number[];
  broadcastSubject: string;
  broadcastTemplate?: "credentials" | "reminder" | "invitation" | "custom";
  onClose: () => void;
  onExecute: () => void;
  onRetryFailed?: () => void;
}

export function BroadcastConfirmModal({
  isOpen,
  isBroadcasting,
  broadcastProgress,
  broadcastTargetCount,
  broadcastTargetGroup,
  broadcastGeneration,
  availableGenerations,
  broadcastSubject,
  broadcastTemplate = "credentials",
  onClose,
  onExecute,
  onRetryFailed,
}: BroadcastConfirmModalProps) {
  if (!isOpen) return null;

  const isCredentials = broadcastTemplate === "credentials";
  const isComplete = Boolean(broadcastProgress?.isComplete);
  const totalCount = broadcastProgress?.total ?? broadcastTargetCount ?? 0;
  const currentCount = broadcastProgress?.current ?? 0;
  const sentCount = broadcastProgress?.sent ?? 0;
  const failedCount = broadcastProgress?.failed ?? 0;
  const percentage = broadcastProgress?.percentage ?? (totalCount > 0 ? Math.round((currentCount / totalCount) * 100) : 0);

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && (!isBroadcasting || isComplete)) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150 shadow-2xl"
          >
            {/* Header: Dynamic per state */}
            {isComplete ? (
              <div className="flex items-start gap-3.5 pb-2 border-b border-outline-variant/20">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Broadcast Email Selesai!
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Seluruh antrean email mahasiswa telah berhasil diproses.
                  </p>
                </div>
              </div>
            ) : isBroadcasting ? (
              <div className="flex items-start gap-3.5 pb-2 border-b border-outline-variant/20">
                <div className="relative w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <Send className="w-5 h-5 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Mengirim Broadcast Email...
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Sedang mentransmisikan email secara bertahap via SMTP kampus.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3.5 pb-2 border-b border-outline-variant/20">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Konfirmasi Broadcast Email
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Tinjau sebelum pesan dikirimkan ke server email kampus.
                  </p>
                </div>
              </div>
            )}

            {/* Body: Completion State */}
            {isComplete ? (
              <div className="space-y-4 py-1">
                {/* Stat Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20">
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
                      Total Target
                    </p>
                    <p className="text-lg font-bold font-mono tabular-nums text-on-surface mt-1">
                      {totalCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                      Terkirim
                    </p>
                    <p className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1">
                      {sentCount}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${failedCount > 0 ? "bg-error/10 border-error/20" : "bg-surface-container-high border-outline-variant/20"}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-medium ${failedCount > 0 ? "text-error" : "text-on-surface-variant"}`}>
                      Gagal
                    </p>
                    <p className={`text-lg font-bold font-mono tabular-nums mt-1 ${failedCount > 0 ? "text-error" : "text-on-surface-variant"}`}>
                      {failedCount}
                    </p>
                  </div>
                </div>

                {/* Banner Keterangan */}
                {failedCount === 0 ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      Seluruh <strong>{sentCount} email</strong> berhasil disalurkan ke server email kampus mahasiswa tanpa kendala.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Terdapat <strong>{failedCount} email</strong> yang gagal dikirim (kemungkinan alamat mailbox tidak aktif atau ditolak server kampus).
                    </span>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/20">
                  {failedCount > 0 && onRetryFailed && (
                    <button
                      type="button"
                      onClick={onRetryFailed}
                      className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-on-primary hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Ulang ({failedCount}) Email Gagal</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className={`w-full sm:w-auto h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      failedCount > 0
                        ? "bg-surface-container-highest text-on-surface hover:bg-surface-container-high border border-outline-variant/30"
                        : "bg-primary text-on-primary hover:bg-secondary-fixed shadow-sm"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Selesai &amp; Tutup</span>
                  </button>
                </div>
              </div>
            ) : isBroadcasting ? (
              /* Body: Active Progress State */
              <div className="space-y-4 py-1">
                {/* Progress Bar Card */}
                <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Progres Pengiriman
                      </span>
                    </div>
                    <span className="text-xl font-bold font-mono tabular-nums text-primary">
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-3 bg-surface-container-lowest rounded-full overflow-hidden p-0.5 border border-outline-variant/30">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary to-secondary-fixed rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(235,189,28,0.4)]"
                      style={{ width: `${Math.max(3, percentage)}%` }}
                    />
                  </div>

                  {/* Counts Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="text-on-surface-variant">
                      <span className="font-bold text-on-surface font-mono tabular-nums">
                        {currentCount}
                      </span>{" "}
                      dari{" "}
                      <span className="font-bold text-on-surface font-mono tabular-nums">
                        {totalCount}
                      </span>{" "}
                      Mahasiswa
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold tabular-nums">
                        <CheckCircle2 className="w-3 h-3" />
                        {sentCount} Terkirim
                      </span>
                      {failedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error/10 border border-error/20 text-error font-semibold tabular-nums">
                          <AlertTriangle className="w-3 h-3" />
                          {failedCount} Gagal
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Aktivitas Batch */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs text-on-surface-variant">
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                  <span className="truncate font-medium">
                    {broadcastProgress?.statusText || "Mengirimkan email batch ke server kampus..."}
                  </span>
                </div>

                {/* Warning Tab */}
                <p className="text-[11px] text-on-surface-variant/80 leading-relaxed">
                  ⚠️ Mohon tidak menutup jendela atau menyegarkan halaman sampai seluruh antrean pengiriman selesai diproses.
                </p>

                {/* Disabled Action Button with Spinner */}
                <div className="flex items-center justify-end pt-2 border-t border-outline-variant/20">
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 flex items-center justify-center gap-2 opacity-80 cursor-not-allowed"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>
                      Mengirim... ({currentCount}/{totalCount})
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Body: Confirmation / Review State */
              <>
                <div className="bg-surface-container-high rounded-xl p-3.5 border border-outline-variant/20 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">
                      Format Pesan:
                    </span>
                    <span className="font-semibold text-primary">
                      {isCredentials ? "Sandi & Bilik Suara (Hari H)" : "Pengumuman / Pengingat"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">
                      Jumlah Penerima:
                    </span>
                    <span className="font-bold text-primary font-mono tabular-nums">
                      {broadcastTargetCount ?? "..."} Mahasiswa
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">
                      Kelompok Sasaran:
                    </span>
                    <span className="font-semibold text-on-surface">
                      {broadcastTargetGroup === "not_voted"
                        ? "Khusus yang Belum Memilih"
                        : broadcastTargetGroup === "all"
                          ? "Seluruh DPT"
                          : broadcastTargetGroup === "voted"
                            ? "Khusus yang Sudah Memilih"
                            : broadcastTargetGroup === "failed_email"
                              ? "Khusus yang Gagal Terkirim"
                              : "Khusus Belum Pernah Terima Email"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">
                      Filter Angkatan:
                    </span>
                    <span className="font-semibold text-on-surface">
                      {broadcastGeneration === "all"
                        ? `Semua Angkatan ${availableGenerations.length > 0 ? `(${availableGenerations[0]} - ${availableGenerations[availableGenerations.length - 1]})` : ""}`
                        : `Angkatan ${broadcastGeneration}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant block mb-1">
                      Subjek:
                    </span>
                    <span className="font-medium text-on-surface truncate block">
                      {broadcastSubject}
                    </span>
                  </div>
                </div>

                {isCredentials && (
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-on-surface-variant leading-relaxed">
                    <span className="font-bold text-primary block mb-0.5">
                      🔑 Sertakan Kata Sandi Pemilih:
                    </span>
                    Sistem akan secara otomatis menyertakan kata sandi unik dan memperbarui data sandi untuk setiap mahasiswa yang menerima email ini.
                  </div>
                )}

                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  ⚠️ Sistem menggunakan transmisi batching paralel berprogres untuk menjaga
                  deliverability SMTP dan mencegah batas waktu serverless (timeout).
                </p>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isBroadcasting}
                    onClick={onClose}
                    className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isBroadcasting}
                    onClick={onExecute}
                    className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-on-primary hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>Ya, Kirim Sekarang</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
