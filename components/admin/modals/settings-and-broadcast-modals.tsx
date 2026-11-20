"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  Send,
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

export interface BroadcastConfirmModalProps {
  isOpen: boolean;
  isBroadcasting: boolean;
  broadcastTargetCount: number | null;
  broadcastTargetGroup: "not_voted" | "all" | "voted";
  broadcastGeneration: string;
  availableGenerations: number[];
  broadcastSubject: string;
  onClose: () => void;
  onExecute: () => void;
}

export function BroadcastConfirmModal({
  isOpen,
  isBroadcasting,
  broadcastTargetCount,
  broadcastTargetGroup,
  broadcastGeneration,
  availableGenerations,
  broadcastSubject,
  onClose,
  onExecute,
}: BroadcastConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isBroadcasting) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
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

            <div className="bg-surface-container-high rounded-xl p-3.5 border border-outline-variant/20 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">
                  Jumlah Penerima:
                </span>
                <span className="font-bold text-primary font-mono">
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
                      : "Khusus yang Sudah Memilih"}
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

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              ⚠️ Sistem akan menggunakan mekanisme batching aman untuk menjaga
              deliverability SMTP dan reputasi domain di Microsoft Outlook
              Telkom University.
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
                {isBroadcasting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Ya, Kirim Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
