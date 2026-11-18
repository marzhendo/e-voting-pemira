'use client';

import { Calendar, Clock, AlertTriangle, Loader2, RotateCcw, Check } from 'lucide-react';
import { getElectionSystemStatus } from '../election-status-helper';

interface SettingsTabProps {
  startTime: string;
  endTime: string;
  isVotingOpen: boolean;
  maintenanceMode: boolean;
  settingsReason: string;
  settingsSaving: boolean;
  settingsMessage: string | null;
  isScheduleDirty: boolean;
  loadingSchedule: boolean;
  onStartTimeChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
  onReasonChange: (val: string) => void;
  onResetScheduleDraft: () => void;
  onOpenVotingToggleModal: () => void;
  onOpenMaintenanceToggleModal: () => void;
  onSaveSettings: () => void;
}

export function SettingsTab({
  startTime,
  endTime,
  isVotingOpen,
  maintenanceMode,
  settingsReason,
  settingsSaving,
  settingsMessage,
  isScheduleDirty,
  loadingSchedule,
  onStartTimeChange,
  onEndTimeChange,
  onReasonChange,
  onResetScheduleDraft,
  onOpenVotingToggleModal,
  onOpenMaintenanceToggleModal,
  onSaveSettings,
}: SettingsTabProps) {
  const status = getElectionSystemStatus({
    maintenanceMode,
    isVotingOpen,
    startTime,
    endTime,
  });
  const StatusIcon = status.icon;

  const trimmedReason = settingsReason.trim();
  const hasInvalidCustomReason = trimmedReason.length > 0 && trimmedReason.length < 3;
  const hasMissingDates = !startTime || !endTime;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="pb-4 border-b border-outline-variant/30">
        <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
          Pengaturan Pemilihan &amp; Jadwal Pemira
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Atur jadwal resmi pelaksanaan, kendali pembukaan bilik suara, dan sakelar darurat teknis.
        </p>
      </div>

      {settingsMessage && (
        <div
          role="status"
          className={`rounded-xl border p-3.5 text-xs ${
            settingsMessage.startsWith('❌')
              ? 'border-error/40 bg-error/10 text-error'
              : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
          }`}
        >
          {settingsMessage}
        </div>
      )}

      {/* KARTU 1: JADWAL RESMI PELAKSANAAN PEMIRA */}
      <div className="rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Jadwal Operasional Pemira
              </h3>
              <p className="text-xs text-on-surface-variant">
                Rentang waktu resmi pembukaan bilik suara digital (WIB / UTC+7).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isScheduleDirty && (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-amber-500/40 bg-amber-500/10 text-amber-400">
                Belum Disimpan
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-colors ${status.scheduleCardBadge}`}
            >
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{status.scheduleCardText}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="election-start-time"
              className="text-xs font-semibold uppercase text-on-surface-variant flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Waktu Mulai Pemilihan:</span>
            </label>
            <input
              id="election-start-time"
              type="datetime-local"
              value={startTime}
              disabled={loadingSchedule && !startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="election-end-time"
              className="text-xs font-semibold uppercase text-on-surface-variant flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Waktu Penutupan Pemilihan:</span>
            </label>
            <input
              id="election-end-time"
              type="datetime-local"
              value={endTime}
              disabled={loadingSchedule && !endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            />
          </div>
        </div>

        <p className="text-[11px] text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
          ℹ️ Sistem akan mengizinkan pengiriman suara hanya ketika waktu saat ini berada di antara waktu mulai dan penutupan. Di luar rentang waktu tersebut, bilik suara otomatis terkunci secara aman.
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-1">
          {isScheduleDirty && (
            <button
              type="button"
              disabled={settingsSaving}
              onClick={onResetScheduleDraft}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batalkan Perubahan</span>
            </button>
          )}
          <button
            type="button"
            disabled={settingsSaving || hasMissingDates || hasInvalidCustomReason}
            onClick={onSaveSettings}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {settingsSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Jadwal...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Jadwal</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KARTU 2: KENDALI BILIK SUARA & SAKELAR DARURAT */}
      <div className="rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col gap-5">
        <h3 className="text-sm font-bold text-on-surface pb-2 border-b border-outline-variant/20">
          Kendali Akses &amp; Sakelar Darurat
        </h3>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-on-surface">
              Buka Pemungutan Suara
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Sakelar utama izin pengiriman suara pemilih di bilik suara digital.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isVotingOpen}
            aria-label="Buka Pemungutan Suara"
            onClick={onOpenVotingToggleModal}
            className={`w-12 h-6 rounded-full relative p-0.5 cursor-pointer border transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.96] ${
              isVotingOpen
                ? 'bg-primary border-primary'
                : 'bg-surface-container-highest border-outline-variant/40'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform duration-200 ease-out will-change-transform ${
                isVotingOpen ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-outline-variant/20">
          <div>
            <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-hmif-red" />
              Mode Pemeliharaan Darurat
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Nonaktifkan sementara pengiriman suara, bisa diaktifkan kembali kapan saja.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={maintenanceMode}
            aria-label="Mode Pemeliharaan Darurat"
            onClick={onOpenMaintenanceToggleModal}
            className={`w-12 h-6 rounded-full relative p-0.5 cursor-pointer border transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.96] ${
              maintenanceMode
                ? 'bg-hmif-red border-hmif-red'
                : 'bg-surface-container-highest border-outline-variant/40'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform duration-200 ease-out will-change-transform ${
                maintenanceMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 pt-4 border-t border-outline-variant/20">
          <label
            htmlFor="settings-audit-reason"
            className="text-xs font-semibold uppercase text-on-surface-variant"
          >
            Catatan Audit / Alasan Perubahan (Opsional):
          </label>
          <textarea
            id="settings-audit-reason"
            value={settingsReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Opsional — misal: Penyesuaian jam pemilihan hari-H (kosongkan untuk catatan default)"
            rows={2}
            className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
          />
          {hasInvalidCustomReason && (
            <span className="text-[11px] text-error">
              Jika diisi, alasan minimal terdiri dari 3 karakter.
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={settingsSaving || hasMissingDates || hasInvalidCustomReason}
          onClick={onSaveSettings}
          className="w-full py-2.5 min-h-[44px] rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {settingsSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Pengaturan...</span>
            </>
          ) : (
            <span>Simpan Pengaturan &amp; Jadwal</span>
          )}
        </button>
      </div>
    </div>
  );
}
