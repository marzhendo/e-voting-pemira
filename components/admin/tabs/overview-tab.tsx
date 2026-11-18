'use client';

import {
  Vote,
  Activity,
  Clock,
  RefreshCw,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import type { GenerationTurnout, TallyItem } from '../types';

interface OverviewTabProps {
  regularCount: number;
  loadingTally: boolean;
  totalDpt: number;
  totalVotes: number;
  turnoutPercentage: number;
  generationData: GenerationTurnout[];
  tallyData: TallyItem[];
  isTallyLocked: boolean;
  onRefreshTally: () => void;
  onOpenEmergencyModal: () => void;
}

export function OverviewTab({
  regularCount,
  loadingTally,
  totalDpt,
  totalVotes,
  turnoutPercentage,
  generationData,
  tallyData,
  isTallyLocked,
  onRefreshTally,
  onOpenEmergencyModal,
}: OverviewTabProps) {
  return (
    <>
      {/* Header Status Panel */}
      <section className="w-full rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide uppercase text-on-surface">
                Bilik Suara Digital Pemira HMIF
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/30 text-[11px] font-medium text-on-surface-variant">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span>Live Telemetri</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Jadwal Resmi: 08.00 - 16.00 WIB</span>
              <span>•</span>
              <span>
                Tata letak bilik suara aktif:{' '}
                <strong className="text-on-surface font-semibold">
                  {regularCount === 1 ? 'Head-to-Head' : `${regularCount} Paslon Grid`}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onRefreshTally}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs border border-outline-variant/30 transition-colors"
            title="Segarkan data perolehan suara sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTally ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={onOpenEmergencyModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs border border-outline-variant/30 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span>Kunci Darurat Bilik</span>
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">TOTAL DPT</span>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="font-bebas text-4xl text-primary leading-none">
              {totalDpt.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-on-surface-variant">Pemilih</span>
          </div>
          <span className="text-xs text-on-surface-variant">Mahasiswa Aktif Terdaftar</span>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">SUARA MASUK</span>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="font-bebas text-4xl text-on-surface leading-none">
              {totalVotes.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-secondary">Suara Sah</span>
          </div>
          <span className="text-xs text-on-surface-variant">Tercatat di Basis Data</span>
        </div>

        <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">TINGKAT PARTISIPASI</span>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="font-bebas text-4xl text-primary leading-none">
              {turnoutPercentage}%
            </span>
            <span className="text-xs text-on-surface-variant">Tercapai</span>
          </div>
          <span className={`text-xs font-medium ${turnoutPercentage >= 65 ? 'text-secondary' : 'text-hmif-yellow'}`}>
            {turnoutPercentage >= 65 ? 'Memenuhi Kuorum (65%)' : 'Target Kuorum 65%'}
          </span>
        </div>
      </section>

      {/* Partisipasi per Angkatan & Rekap Singkat */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-surface-container rounded-2xl p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/20">
            <h2 className="text-sm font-bold text-on-surface">
              Partisipasi per Angkatan
            </h2>
            <span className="text-xs text-on-surface-variant">Agregat Realtime</span>
          </div>

          <div className="space-y-4">
            {generationData.length > 0 ? (
              generationData.map((gen) => (
                <div key={gen.generation} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface">
                      Angkatan {gen.generation}
                    </span>
                    <span className="text-on-surface-variant">
                      {gen.votedCount} / {gen.totalVoters} Pemilih ({gen.turnoutPercentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(gen.turnoutPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-on-surface-variant py-4 text-center">
                Memuat data partisipasi angkatan...
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface-container rounded-2xl p-6 border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/20">
              <h2 className="text-sm font-bold text-on-surface">
                Rekapitulasi Suara
              </h2>
              {isTallyLocked && (
                <span className="px-2 py-0.5 rounded bg-error/15 text-error text-[11px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Terkunci
                </span>
              )}
            </div>

            {isTallyLocked ? (
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant leading-relaxed flex flex-col gap-2">
                <p>
                  Hasil suara ditutup selama pemilihan aktif untuk menjaga objektivitas dan netralitas.
                </p>
                <span className="text-primary font-medium">
                  {totalVotes} surat suara sah telah tercatat.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {tallyData.map((cand) => (
                  <div
                    key={cand.candidateId}
                    className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bebas text-2xl text-primary">
                        {cand.candidateNumber.toString().padStart(2, '0')}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-on-surface block">
                          {cand.candidateNumber === 0
                            ? 'Kotak Kosong'
                            : `${cand.leaderName} & ${cand.viceLeaderName}`}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {cand.voteCount} Suara
                        </span>
                      </div>
                    </div>
                    <span className="font-bebas text-lg text-primary font-bold">
                      {cand.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant text-center">
            Ballot Secrecy: Data pemilih dan surat suara terpisah murni.
          </div>
        </div>
      </section>
    </>
  );
}
