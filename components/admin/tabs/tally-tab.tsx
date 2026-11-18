'use client';

import {
  Activity,
  RefreshCw,
  Trash2,
  FileText,
  Download,
  LockKeyhole,
} from 'lucide-react';
import type { TallyItem } from '../types';

interface TallyTabProps {
  tallyData: TallyItem[];
  loadingTally: boolean;
  isTallyLocked: boolean;
  isResettingBallots: boolean;
  onRefresh: () => void;
  onResetBallots: () => void;
  onOpenBastModal: () => void;
}

export function TallyTab({
  tallyData,
  loadingTally,
  isTallyLocked,
  isResettingBallots,
  onRefresh,
  onResetBallots,
  onOpenBastModal,
}: TallyTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface">
              Rekapitulasi Suara
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/30 text-[11px] font-medium text-on-surface-variant">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Live Telemetri</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Hasil agregasi surat suara yang sah tanpa keterkaitan identitas pemilih.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingTally}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
            title="Segarkan Perolehan Suara"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTally ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={onResetBallots}
            disabled={isResettingBallots}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-xs font-semibold text-error border border-error/30 transition-colors"
            title="Kosongkan Suara Pengujian Simulasi"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Suara</span>
          </button>

          <button
            type="button"
            onClick={onOpenBastModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-bright transition-colors border border-outline-variant/30"
          >
            <FileText className="w-4 h-4 text-primary" />
            <span>Cetak Berita Acara</span>
          </button>

          <a
            href="/api/admin/tally/export"
            download="Rekapitulasi-Suara-Pemira-HMIF-2026-2027.csv"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold transition-colors border border-outline-variant/30"
            title="Ekspor Rekapitulasi Suara Resmi ke Format CSV"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Unduh CSV</span>
          </a>
        </div>
      </div>

      {isTallyLocked ? (
        <div className="rounded-2xl bg-surface-container p-8 text-center flex flex-col items-center justify-center gap-3 border border-outline-variant/30 max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <LockKeyhole className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-on-surface">
            Hasil Rekapitulasi Suara Terkunci
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Sesuai keputusan KPR HMIF, hasil perolehan suara ditutup selama pemilihan berlangsung aktif untuk menjaga kerahasiaan dan integritas proses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tallyData.map((cand) => (
            <div
              key={cand.candidateId}
              className="rounded-2xl bg-surface-container p-5 border border-outline-variant/30 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bebas text-3xl text-primary font-bold">
                    {cand.candidateNumber.toString().padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">
                      {cand.candidateNumber === 0
                        ? 'Kotak Kosong'
                        : `${cand.leaderName} & ${cand.viceLeaderName}`}
                    </h3>
                    <span className="text-xs text-on-surface-variant">
                      {cand.candidateNumber === 0 ? 'Opsi Abstain Sah' : 'Pasangan Calon'}
                    </span>
                  </div>
                </div>

                <span className="font-bebas text-2xl text-secondary">
                  {cand.percentage}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${cand.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                <span>Suara Masuk:</span>
                <span className="font-bold text-on-surface font-mono">{cand.voteCount} Suara</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
