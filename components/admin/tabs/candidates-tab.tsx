'use client';

import {
  UserPlus,
  X,
  LayoutGrid,
  Loader2,
  Users,
  Edit3,
  Trash2,
  FileText,
} from 'lucide-react';
import type { CandidateItem } from '../types';

interface CandidatesTabProps {
  regularCandidates: CandidateItem[];
  regularCount: number;
  loadingCandidates: boolean;
  candidateActionMessage: string | null;
  allowKotakKosongMulti: boolean;
  togglingKotakKosong: boolean;
  onDismissMessage: () => void;
  onOpenAdd: () => void;
  onOpenEdit: (cand: CandidateItem) => void;
  onDelete: (cand: CandidateItem) => void;
  onToggleActive: (cand: CandidateItem) => void;
  onToggleKotakKosong: () => void;
}

export function CandidatesTab({
  regularCandidates,
  regularCount,
  loadingCandidates,
  candidateActionMessage,
  allowKotakKosongMulti,
  togglingKotakKosong,
  onDismissMessage,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onToggleActive,
  onToggleKotakKosong,
}: CandidatesTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
            Kelola Pasangan Calon (Kandidat)
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Atur daftar calon Chairman &amp; Vice Chairman HMIF. Tata letak bilik suara menyesuaikan otomatis.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-primary text-on-primary hover:bg-secondary-fixed font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Paslon Baru</span>
        </button>
      </div>

      {/* Banner Notifikasi Pesan Aksi */}
      {candidateActionMessage && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs text-primary flex items-center justify-between">
          <span>{candidateActionMessage}</span>
          <button
            type="button"
            onClick={onDismissMessage}
            className="text-primary hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Layout Bilik Suara Indicator */}
      <div className="rounded-2xl bg-surface-container p-5 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider block font-medium">
              Adaptasi Tata Letak Bilik Suara
            </span>
            <h3 className="text-sm font-bold text-on-surface">
              {regularCount === 1
                ? 'Model Head-to-Head (1 Paslon vs Kotak Kosong)'
                : regularCount === 2
                ? 'Model 2 Kolom (Kotak Kosong di Bawah)'
                : `Model Grid ${regularCount} Kolom Responsif`}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs text-on-surface font-semibold border border-outline-variant/30">
            Total: {regularCount} Paslon
          </span>
          {regularCount === 1 ? (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-xs text-primary font-semibold border border-primary/30">
              Kotak Kosong: Wajib Aktif (Calon Tunggal)
            </span>
          ) : regularCount >= 2 ? (
            <div className="flex items-center gap-3 bg-surface-container-high px-3 py-1.5 rounded-xl border border-outline-variant/30">
              <div className="text-right">
                <span className="text-[11px] font-bold text-on-surface block leading-tight">
                  Opsi Kotak Kosong
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {allowKotakKosongMulti ? 'Diikutsertakan' : 'Dinonaktifkan'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowKotakKosongMulti}
                aria-label="Opsi Kotak Kosong Multi-Paslon"
                title={
                  allowKotakKosongMulti
                    ? 'Klik untuk mematikan opsi Kotak Kosong'
                    : 'Klik untuk mengaktifkan opsi Kotak Kosong'
                }
                disabled={togglingKotakKosong}
                onClick={onToggleKotakKosong}
                className={`w-12 h-6 rounded-full relative p-0.5 cursor-pointer border transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.96] disabled:opacity-50 ${
                  allowKotakKosongMulti
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container-highest border-outline-variant/40'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm block transition-transform duration-200 ease-out will-change-transform ${
                    allowKotakKosongMulti ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Candidates List Cards */}
      {loadingCandidates ? (
        <div className="py-16 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Memuat data calon...</span>
        </div>
      ) : regularCandidates.length === 0 ? (
        <div className="py-16 text-center text-xs text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/30 p-8">
          <Users className="w-10 h-10 text-on-surface-variant mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-on-surface">Belum ada pasangan calon</h3>
          <p className="mt-1">Klik tombol &ldquo;Tambah Paslon Baru&rdquo; untuk mendaftarkan kandidat pertama.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {regularCandidates.map((cand) => (
            <div
              key={cand.id}
              className="rounded-2xl bg-surface-container p-5 border border-outline-variant/30 flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bebas text-xl text-primary">
                      {cand.candidate_number.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-on-surface">
                      Paslon {cand.candidate_number.toString().padStart(2, '0')}
                    </span>
                    {cand.is_active === false ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Nonaktif
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Aktif
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEdit(cand)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Edit Paslon"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cand)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors"
                      title="Hapus Paslon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center shrink-0">
                    {cand.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cand.photo_url}
                        alt={`Paslon ${cand.candidate_number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-primary/70" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-on-surface leading-snug truncate">
                      {cand.leader_name}
                    </h4>
                    <p className="text-xs text-on-surface-variant truncate">
                      &amp; {cand.vice_leader_name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      cand.chairman_cv_url
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium'
                        : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>{cand.chairman_cv_url ? 'CV Chairman ✓' : 'CV Chairman -'}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      cand.vice_chairman_cv_url
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium'
                        : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>{cand.vice_chairman_cv_url ? 'CV Vice ✓' : 'CV Vice -'}</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant border border-outline-variant/20">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold block mb-0.5">
                    Visi:
                  </span>
                  <p className="line-clamp-2 leading-relaxed">
                    {cand.vision || 'Belum ada visi.'}
                  </p>
                </div>

                <div className="text-xs text-on-surface-variant">
                  <span>{Array.isArray(cand.mission) ? cand.mission.length : 0} butir misi</span>
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Status: {cand.is_active === false ? 'Diarsipkan' : 'Terdaftar Resmi'}</span>
                <button
                  type="button"
                  onClick={() => onToggleActive(cand)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                    cand.is_active === false
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                  title={cand.is_active === false ? 'Aktifkan Paslon di Bilik Suara' : 'Nonaktifkan Paslon dari Bilik Suara'}
                >
                  <span>{cand.is_active === false ? 'Aktifkan' : 'Nonaktifkan'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
