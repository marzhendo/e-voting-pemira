"use client";

import type { ChangeEvent, RefObject } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Search,
  Trash2,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react";
import type { VoterRow } from "../types";

export interface ImportPreviewSummary {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
}

export interface DptTabProps {
  userRole: string;
  fileInputRef: RefObject<HTMLInputElement>;
  importSuccessMessage: string | null;
  dptActionMessage: string | null;
  dptErrorMessage: string | null;
  importPreview: ImportPreviewSummary | null;
  stagedFile: File | null;
  isCommittingImport: boolean;
  searchQuery: string;
  selectedGeneration: string;
  selectedStatus: string;
  availableGenerations: number[];
  voters: VoterRow[];
  loadingVoters: boolean;
  selectedVoterIds: string[];
  isAllVisibleVotersSelected: boolean;
  dptPage: number;
  dptPageSize: number;
  dptTotalPages: number;
  voterTotalCount: number;
  onOpenQuickAddModal: () => void;
  onDownloadTemplate: () => void;
  onOpenResetDptModal: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDismissImportSuccess: () => void;
  onDismissDptActionMessage: () => void;
  onDismissDptError: () => void;
  onCancelImportPreview: () => void;
  onCommitImport: () => void;
  onSearchChange: (value: string) => void;
  onGenerationChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearSelectedVoters: () => void;
  onOpenBatchDeleteModal: () => void;
  onToggleSelectAllVoters: () => void;
  onToggleSelectVoter: (id: string) => void;
  onRequestDeleteVoter: (voter: VoterRow) => void;
  onPageSizeChange: (size: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function DptTab({
  userRole,
  fileInputRef,
  importSuccessMessage,
  dptActionMessage,
  dptErrorMessage,
  importPreview,
  stagedFile,
  isCommittingImport,
  searchQuery,
  selectedGeneration,
  selectedStatus,
  availableGenerations,
  voters,
  loadingVoters,
  selectedVoterIds,
  isAllVisibleVotersSelected,
  dptPage,
  dptPageSize,
  dptTotalPages,
  voterTotalCount,
  onOpenQuickAddModal,
  onDownloadTemplate,
  onOpenResetDptModal,
  onFileChange,
  onDismissImportSuccess,
  onDismissDptActionMessage,
  onDismissDptError,
  onCancelImportPreview,
  onCommitImport,
  onSearchChange,
  onGenerationChange,
  onStatusChange,
  onClearSelectedVoters,
  onOpenBatchDeleteModal,
  onToggleSelectAllVoters,
  onToggleSelectVoter,
  onRequestDeleteVoter,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: DptTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
            Manajemen Daftar Pemilih Tetap (DPT)
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kelola hak pilih mahasiswa aktif Informatika Telkom University
            Purwokerto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenQuickAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary border border-primary/30 transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            <span>+ Pemilih Uji Coba</span>
          </button>

          <button
            type="button"
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Template CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Unggah berkas DPT format CSV atau Excel (.xlsx, .xls)"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload DPT</span>
          </button>

          {userRole === "super_admin" && (
            <button
              type="button"
              onClick={onOpenResetDptModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-xs font-bold text-error border border-error/30 transition-colors shadow-sm cursor-pointer"
              title="Reset atau Kosongkan Data DPT (Khusus Superadmin)"
            >
              <Trash2 className="w-3.5 h-3.5 text-error" />
              <span>Reset DPT</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      {importSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{importSuccessMessage}</span>
          </div>
          <button
            onClick={onDismissImportSuccess}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {dptActionMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{dptActionMessage}</span>
          </div>
          <button
            onClick={onDismissDptActionMessage}
            className="text-emerald-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {dptErrorMessage && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{dptErrorMessage}</span>
          </div>
          <button
            onClick={onDismissDptError}
            className="text-error hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staging / Pre-commit Preview Area */}
      {importPreview && (
        <div className="rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Pratinjau Berkas: {stagedFile?.name}</span>
              </h3>
              <span className="text-xs text-on-surface-variant">
                Sistem memvalidasi kelengkapan data sebelum disimpan ke
                database.
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
              Staging
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-[11px] block">
                Total Baris:
              </span>
              <span className="font-bebas text-2xl text-on-surface">
                {importPreview.totalRows}
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-[11px] block">
                Valid:
              </span>
              <span className="font-bebas text-2xl text-secondary">
                {importPreview.validCount}
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-[11px] block">
                Duplikat:
              </span>
              <span className="font-bebas text-2xl text-hmif-yellow">
                {importPreview.duplicateCount}
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-[11px] block">
                Format Invalid:
              </span>
              <span className="font-bebas text-2xl text-error">
                {importPreview.invalidCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancelImportPreview}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isCommittingImport || importPreview.validCount === 0}
              onClick={onCommitImport}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isCommittingImport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan {importPreview.validCount} Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Voter Search & Filters */}
      <div className="rounded-2xl bg-surface-container p-4 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari NIM, Nama, atau Email..."
            className="w-full bg-surface-container-lowest text-xs rounded-xl pl-9 pr-3 py-2.5 min-h-[44px] border border-outline-variant/30 focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedGeneration}
            onChange={(e) => onGenerationChange(e.target.value)}
            className="bg-surface-container-lowest text-xs rounded-xl px-3 py-2.5 min-h-[44px] border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <option value="all">Semua Angkatan</option>
            {availableGenerations.map((gen) => (
              <option key={gen} value={gen.toString()}>
                Angkatan {gen}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-surface-container-lowest text-xs rounded-xl px-3 py-2.5 min-h-[44px] border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="voted">Sudah Memilih</option>
            <option value="not_voted">Belum Memilih</option>
          </select>
        </div>
      </div>

      {/* Batch Action Bar untuk Seleksi Pemilih */}
      {selectedVoterIds.length > 0 && (
        <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs font-bold text-on-surface">
              {selectedVoterIds.length} pemilih dipilih
            </span>
            <span className="text-[11px] text-on-surface-variant hidden sm:inline">
              (dari {voters.length} pemilih yang ditampilkan)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearSelectedVoters}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Batal
            </button>
            {userRole === "super_admin" && (
              <button
                type="button"
                onClick={onOpenBatchDeleteModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-error-solid hover:bg-error-solid/80 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih ({selectedVoterIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voters Table */}
      <div className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-on-surface-variant uppercase tracking-wider font-semibold">
                {userRole === "super_admin" && (
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleVotersSelected}
                      onChange={onToggleSelectAllVoters}
                      className="rounded border-outline-variant/40 text-primary focus:ring-0 cursor-pointer"
                      title="Pilih semua pemilih di halaman ini"
                    />
                  </th>
                )}
                <th className="py-3 px-5">NIM</th>
                <th className="py-3 px-5">Nama Mahasiswa</th>
                <th className="py-3 px-5">Email SSO</th>
                <th className="py-3 px-5">Angkatan</th>
                <th className="py-3 px-5">Status</th>
                {userRole === "super_admin" && (
                  <th className="py-3 px-5 text-right w-20">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loadingVoters ? (
                <tr>
                  <td
                    colSpan={userRole === "super_admin" ? 7 : 5}
                    className="py-8 text-center text-on-surface-variant"
                  >
                    Memuat data pemilih...
                  </td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td
                    colSpan={userRole === "super_admin" ? 7 : 5}
                    className="py-8 text-center text-on-surface-variant"
                  >
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                voters.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-surface-container-high/40 transition-colors"
                  >
                    {userRole === "super_admin" && (
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedVoterIds.includes(v.id)}
                          onChange={() => onToggleSelectVoter(v.id)}
                          className="rounded border-outline-variant/40 text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-3 px-5 font-mono font-semibold text-primary">
                      {v.nim}
                    </td>
                    <td className="py-3 px-5 font-medium text-on-surface">
                      {v.name}
                    </td>
                    <td className="py-3 px-5 font-mono text-[11px] text-on-surface-variant">
                      {v.email}
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[11px]">
                        {v.generation}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      {v.has_voted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          Sudah Memilih
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                          Belum Memilih
                        </span>
                      )}
                    </td>
                    {userRole === "super_admin" && (
                      <td className="py-3 px-5 text-right">
                        {v.email?.toLowerCase() ===
                        "marzhendogalangs@gmail.com" ? (
                          <span
                            className="text-[10px] text-primary/70 font-mono italic"
                            title="Akun Superadmin Utama (Dilindungi)"
                          >
                            Utama
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRequestDeleteVoter(v)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                            title={`Hapus ${v.name} (${v.nim}) dari DPT`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Menampilkan{" "}
              <strong className="text-on-surface">
                {voterTotalCount > 0 ? (dptPage - 1) * dptPageSize + 1 : 0} -{" "}
                {Math.min(dptPage * dptPageSize, voterTotalCount)}
              </strong>{" "}
              dari{" "}
              <strong className="text-on-surface">{voterTotalCount}</strong>{" "}
              pemilih terdaftar
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-on-surface-variant/70">
                Baris:
              </span>
              <select
                value={dptPageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-surface-container-lowest text-xs rounded-lg px-2.5 py-1 min-h-[32px] border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={dptPage <= 1 || loadingVoters}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="px-3 py-1.5 min-h-[36px] flex items-center font-mono text-xs text-on-surface font-semibold bg-surface-container-high rounded-xl border border-outline-variant/30">
              <span>
                Halaman {dptPage} / {dptTotalPages}
              </span>
            </div>

            <button
              type="button"
              onClick={onNextPage}
              disabled={dptPage >= dptTotalPages || loadingVoters}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
