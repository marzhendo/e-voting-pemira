'use client';

import type { FormEvent } from 'react';
import {
  AlertTriangle,
  Loader2,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { Portal } from '@/components/ui/portal';
import type { VoterRow } from '../types';

export interface QuickAddVoterModalProps {
  isOpen: boolean;
  quickAddLoading: boolean;
  quickAddError: string | null;
  quickAddNim: string;
  quickAddName: string;
  quickAddEmail: string;
  quickAddGeneration: number;
  availableGenerations: number[];
  onNimChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onGenerationChange: (value: number) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function QuickAddVoterModal({
  isOpen,
  quickAddLoading,
  quickAddError,
  quickAddNim,
  quickAddName,
  quickAddEmail,
  quickAddGeneration,
  availableGenerations,
  onNimChange,
  onNameChange,
  onEmailChange,
  onGenerationChange,
  onClose,
  onSubmit,
}: QuickAddVoterModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !quickAddLoading) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Tambah Pemilih Uji Coba
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Gunakan email aktif sendiri untuk menguji pengiriman OTP &amp; Broadcast.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickAddError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
                {quickAddError}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  NIM Mahasiswa <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 103012399001"
                  value={quickAddNim}
                  onChange={(e) => onNimChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Nama Mahasiswa <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Penguji E-Voting"
                  value={quickAddName}
                  onChange={(e) => onNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Email Tujuan (Email Pengujian Anda) <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: namaanda@gmail.com / kampus"
                  value={quickAddEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary font-mono"
                />
                <span className="text-[10px] text-on-surface-variant mt-1 block">
                  Masukkan email riil yang bisa Anda buka di inbox untuk memverifikasi penerimaan surat.
                </span>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Angkatan
                </label>
                <select
                  value={quickAddGeneration}
                  onChange={(e) => onGenerationChange(Number(e.target.value))}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {availableGenerations.map((gen) => (
                    <option key={gen} value={gen}>
                      {gen}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  disabled={quickAddLoading}
                  onClick={onClose}
                  className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={quickAddLoading}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {quickAddLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menambahkan...</span>
                    </>
                  ) : (
                    <span>Simpan &amp; Uji Coba</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export interface DeleteVoterModalProps {
  voterToDelete: VoterRow | null;
  isDeletingSingleVoter: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteVoterModal({
  voterToDelete,
  isDeletingSingleVoter,
  onClose,
  onConfirm,
}: DeleteVoterModalProps) {
  if (!voterToDelete) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDeletingSingleVoter) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Konfirmasi Hapus Pemilih</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Penghapusan data pemilih dari Daftar Pemilih Tetap.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeletingSingleVoter}
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Nama Mahasiswa:</span>
                  <span className="font-semibold text-on-surface">{voterToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">NIM:</span>
                  <span className="font-mono font-semibold text-primary">{voterToDelete.nim}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Email SSO:</span>
                  <span className="font-mono text-on-surface-variant">{voterToDelete.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Angkatan:</span>
                  <span className="text-on-surface">{voterToDelete.generation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status Hak Suara:</span>
                  <span>
                    {voterToDelete.has_voted ? (
                      <span className="text-emerald-400 font-semibold">Sudah Memilih</span>
                    ) : (
                      <span className="text-on-surface-variant">Belum Memilih</span>
                    )}
                  </span>
                </div>
              </div>

              {voterToDelete.has_voted ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Peringatan Integritas Pemilu</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Mahasiswa ini tercatat sudah mencoblos. Menghapus akun ini <strong>tidak menghapus</strong> surat suara anonim di bilik suara (*Ballot Secrecy*), namun akan mengurangi total DPT terdaftar.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant leading-relaxed text-[11px]">
                  Mahasiswa ini belum menggunakan hak suara. Penghapusan akan mencabut hak pilih akun ini secara permanen dari sistem.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                disabled={isDeletingSingleVoter}
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingSingleVoter}
                onClick={onConfirm}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-error hover:bg-error/80 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeletingSingleVoter ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Pemilih</span>
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

export interface BatchDeleteVotersModalProps {
  isOpen: boolean;
  selectedCount: number;
  isDeletingBatchVoters: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BatchDeleteVotersModal({
  isOpen,
  selectedCount,
  isDeletingBatchVoters,
  onClose,
  onConfirm,
}: BatchDeleteVotersModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDeletingBatchVoters) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Hapus Selektif ({selectedCount} Pemilih)</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Penghapusan massal pemilih DPT yang dipilih.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeletingBatchVoters}
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-on-surface">
                Anda akan menghapus <strong>{selectedCount} data pemilih</strong> terpilih dari Daftar Pemilih Tetap (DPT).
              </p>

              <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error space-y-1">
                <div className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Konfirmasi Tindakan Eksekutif</span>
                </div>
                <p className="text-[11px] leading-relaxed text-error/90">
                  Tindakan ini tidak dapat dibatalkan secara otomatis. Setiap akun yang dihapus akan kehilangan akses ke bilik suara. Catatan audit akan direkam atas nama Anda.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                disabled={isDeletingBatchVoters}
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingBatchVoters}
                onClick={onConfirm}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-error hover:bg-error/80 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeletingBatchVoters ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus {selectedCount} Pemilih</span>
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

export type ResetDptMode = 'reset_to_default' | 'clear_all' | 'reset_vote_status';

export interface ResetDptModalProps {
  isOpen: boolean;
  isResettingDpt: boolean;
  resetDptMode: ResetDptMode;
  resetDptConfirmText: string;
  onModeChange: (mode: ResetDptMode) => void;
  onConfirmTextChange: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetDptModal({
  isOpen,
  isResettingDpt,
  resetDptMode,
  resetDptConfirmText,
  onModeChange,
  onConfirmTextChange,
  onClose,
  onConfirm,
}: ResetDptModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isResettingDpt) {
            onClose();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center p-4 text-left">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Reset &amp; Kosongkan DPT</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Operasi tingkat tinggi untuk mengelola database pemilih.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isResettingDpt}
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-on-surface-variant font-semibold">Pilih Mode Reset:</label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${resetDptMode === 'reset_to_default' ? 'bg-primary/10 border-primary/40' : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-high/30'}`}>
                  <input
                    type="radio"
                    name="resetDptMode"
                    value="reset_to_default"
                    checked={resetDptMode === 'reset_to_default'}
                    onChange={() => onModeChange('reset_to_default')}
                    className="mt-0.5 text-primary focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-on-surface block">Kembalikan ke Default Sistem</span>
                    <span className="text-on-surface-variant text-[11px] block mt-0.5">
                      Menghapus data pemilih baru yang diimpor dan mengembalikan daftar ke pemilih inisial sistem.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${resetDptMode === 'clear_all' ? 'bg-error/10 border-error/40' : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-high/30'}`}>
                  <input
                    type="radio"
                    name="resetDptMode"
                    value="clear_all"
                    checked={resetDptMode === 'clear_all'}
                    onChange={() => onModeChange('clear_all')}
                    className="mt-0.5 text-error focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-error block">Kosongkan Seluruh Pemilih Mahasiswa (0 Pemilih)</span>
                    <span className="text-on-surface-variant text-[11px] block mt-0.5">
                      Menghapus semua data mahasiswa dari DPT agar panitia dapat mengunggah berkas CSV resmi yang baru. Akun Superadmin tetap dipertahankan.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${resetDptMode === 'reset_vote_status' ? 'bg-primary/10 border-primary/40' : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-high/30'}`}>
                  <input
                    type="radio"
                    name="resetDptMode"
                    value="reset_vote_status"
                    checked={resetDptMode === 'reset_vote_status'}
                    onChange={() => onModeChange('reset_vote_status')}
                    className="mt-0.5 text-primary focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-on-surface block">Reset Status Voting Saja (Simulasi)</span>
                    <span className="text-on-surface-variant text-[11px] block mt-0.5">
                      Mengubah seluruh status pemilih menjadi Belum Memilih tanpa menghapus data pemilih. Cocok untuk mengulang gladi bersih.
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error space-y-2">
                <p className="font-bold text-[11px] uppercase tracking-wider">Ketik Konfirmasi:</p>
                <p className="text-[11px] leading-relaxed">
                  Untuk mencegah reset yang tidak disengaja, ketik <strong>RESET DPT</strong> pada kolom di bawah ini:
                </p>
                <input
                  type="text"
                  placeholder="RESET DPT"
                  value={resetDptConfirmText}
                  onChange={(e) => onConfirmTextChange(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-error/40 text-on-surface focus:outline-none focus:border-error focus-visible:ring-2 focus-visible:ring-error font-mono text-center uppercase tracking-widest font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                disabled={isResettingDpt}
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResettingDpt || resetDptConfirmText.trim().toUpperCase() !== 'RESET DPT'}
                onClick={onConfirm}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-error hover:bg-error/80 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
              >
                {isResettingDpt ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mereset DPT...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eksekusi Reset DPT</span>
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
