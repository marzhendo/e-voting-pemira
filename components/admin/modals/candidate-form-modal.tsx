'use client';

import type { FormEvent, RefObject } from 'react';
import {
  AlertTriangle,
  Crop,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { Portal } from '@/components/ui/portal';
import { CandidatePhotoFrameModal } from '@/components/admin/candidate-photo-frame-modal';
import type { CandidateItem } from '../types';

export interface CandidateFormModalProps {
  isOpen: boolean;
  editingCandidate: CandidateItem | null;
  savingCandidate: boolean;
  candidateFormNumber: number;
  candidateFormLeader: string;
  candidateFormViceLeader: string;
  candidateFormPhotoUrl: string;
  candidateFormChairmanCvUrl: string | null;
  candidateFormViceChairmanCvUrl: string | null;
  candidateFormVision: string;
  candidateFormMission: string;
  candidateFormIsActive: boolean;
  uploadingPhoto: boolean;
  uploadingChairmanCv: boolean;
  uploadingViceChairmanCv: boolean;
  uploadError: string | null;
  isPhotoFrameModalOpen: boolean;
  photoToFrame: string | null;
  photoFileInputRef: RefObject<HTMLInputElement>;
  chairmanCvFileInputRef: RefObject<HTMLInputElement>;
  viceChairmanCvFileInputRef: RefObject<HTMLInputElement>;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onNumberChange: (value: number) => void;
  onLeaderChange: (value: string) => void;
  onViceLeaderChange: (value: string) => void;
  onPhotoUrlChange: (value: string) => void;
  onChairmanCvUrlChange: (value: string | null) => void;
  onViceChairmanCvUrlChange: (value: string | null) => void;
  onVisionChange: (value: string) => void;
  onMissionChange: (value: string) => void;
  onIsActiveChange: (value: boolean) => void;
  onDismissUploadError: () => void;
  onOpenPhotoFrame: (url: string) => void;
  onClosePhotoFrame: () => void;
  onFramedPhotoConfirm: (croppedFile: File) => void;
  onUploadCvFile: (
    file: File,
    setter: (url: string) => void,
    loadingSetter: (loading: boolean) => void
  ) => void;
  onSetUploadingChairmanCv: (loading: boolean) => void;
  onSetUploadingViceChairmanCv: (loading: boolean) => void;
}

export function CandidateFormModal({
  isOpen,
  editingCandidate,
  savingCandidate,
  candidateFormNumber,
  candidateFormLeader,
  candidateFormViceLeader,
  candidateFormPhotoUrl,
  candidateFormChairmanCvUrl,
  candidateFormViceChairmanCvUrl,
  candidateFormVision,
  candidateFormMission,
  candidateFormIsActive,
  uploadingPhoto,
  uploadingChairmanCv,
  uploadingViceChairmanCv,
  uploadError,
  isPhotoFrameModalOpen,
  photoToFrame,
  photoFileInputRef,
  chairmanCvFileInputRef,
  viceChairmanCvFileInputRef,
  onClose,
  onSubmit,
  onNumberChange,
  onLeaderChange,
  onViceLeaderChange,
  onPhotoUrlChange,
  onChairmanCvUrlChange,
  onViceChairmanCvUrlChange,
  onVisionChange,
  onMissionChange,
  onIsActiveChange,
  onDismissUploadError,
  onOpenPhotoFrame,
  onClosePhotoFrame,
  onFramedPhotoConfirm,
  onUploadCvFile,
  onSetUploadingChairmanCv,
  onSetUploadingViceChairmanCv,
}: CandidateFormModalProps) {
  return (
    <>
      {isOpen && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !savingCandidate) {
                onClose();
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg rounded-2xl bg-surface-container p-6 flex flex-col gap-4 border border-outline-variant/30 max-h-[calc(100dvh-2rem)] min-h-0 overflow-y-auto my-auto animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-start justify-between pb-2 border-b border-outline-variant/20">
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      {editingCandidate ? 'Edit Pasangan Calon' : 'Tambah Pasangan Calon Baru'}
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Isi detail data pasangan calon peserta Pemira.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup formulir paslon"
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase block mb-1">
                      Nomor Urut Paslon
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={candidateFormNumber}
                      onChange={(e) => onNumberChange(Number(e.target.value))}
                      className="w-full bg-surface-container-lowest text-xs rounded-xl px-3 py-2.5 min-h-[44px] border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase block mb-1">
                      Nama Calon Chairman
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Farhan"
                      value={candidateFormLeader}
                      onChange={(e) => onLeaderChange(e.target.value)}
                      className="w-full bg-surface-container-lowest text-xs rounded-xl px-3 py-2.5 min-h-[44px] border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary placeholder:text-on-surface-variant/60"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase block mb-1">
                      Nama Calon Vice Chairman
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Siti Aisyah"
                      value={candidateFormViceLeader}
                      onChange={(e) => onViceLeaderChange(e.target.value)}
                      className="w-full bg-surface-container-lowest text-xs rounded-xl px-3 py-2.5 min-h-[44px] border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary placeholder:text-on-surface-variant/60"
                    />
                  </div>

                  {/* Banner Kesalahan Unggah Berkas */}
                  {uploadError && (
                    <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{uploadError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={onDismissUploadError}
                        aria-label="Tutup pesan error"
                        className="text-error hover:opacity-80 p-1.5 -m-1 rounded-lg hover:bg-error/10 transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* FOTO PASLON DENGAN FITUR UNGGAH & HAPUS FOTO */}
                  <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        <span>Foto Pasangan Calon</span>
                      </label>
                      <span className="text-[11px] text-on-surface-variant">Maks. 5 MB (.png, .jpg, .webp)</span>
                    </div>

                    <input
                      ref={photoFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const objectUrl = URL.createObjectURL(f);
                          onOpenPhotoFrame(objectUrl);
                          e.target.value = '';
                        }
                      }}
                    />

                    {candidateFormPhotoUrl ? (
                      <div className="flex items-center gap-3 bg-surface-container p-2.5 rounded-xl border border-outline-variant/20">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 border border-outline-variant/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={candidateFormPhotoUrl}
                            alt="Preview Foto Paslon"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-on-surface block truncate">
                            Foto Paslon Terpasang
                          </span>
                          <span className="text-[11px] text-on-surface-variant block truncate font-mono mt-0.5">
                            {candidateFormPhotoUrl}
                          </span>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onOpenPhotoFrame(candidateFormPhotoUrl)}
                              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Crop className="w-3 h-3" />
                              <span>Sesuaikan Frame (4:3)</span>
                            </button>
                            <span className="text-on-surface-variant text-[11px]">•</span>
                            <button
                              type="button"
                              disabled={uploadingPhoto}
                              onClick={() => photoFileInputRef.current?.click()}
                              className="text-[11px] font-semibold text-on-surface hover:text-primary hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              {uploadingPhoto ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Mengunggah...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  <span>Ganti Foto</span>
                                </>
                              )}
                            </button>
                            <span className="text-on-surface-variant text-[11px]">•</span>
                            <button
                              type="button"
                              onClick={() => onPhotoUrlChange('')}
                              className="text-[11px] font-semibold text-error hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus Foto</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={() => photoFileInputRef.current?.click()}
                          className="flex-1 py-3 px-4 rounded-xl border border-dashed border-outline-variant hover:border-primary/60 bg-surface-container hover:bg-surface-bright transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer group"
                        >
                          {uploadingPhoto ? (
                            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Mengunggah foto...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface group-hover:text-primary">
                                <UploadCloud className="w-4 h-4 text-primary" />
                                <span>Pilih / Unggah Berkas Foto Paslon</span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant">
                                Foto akan otomatis ditampilkan di bilik suara pemilih
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BERKAS CV TERPISAH: CHAIRMAN & VICE CHAIRMAN (PDF) */}
                  <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span>Berkas CV Pasangan Calon (PDF)</span>
                      </label>
                      <span className="text-[11px] text-on-surface-variant">Maks. 10 MB per berkas</span>
                    </div>

                    {/* CV Chairman */}
                    <input
                      ref={chairmanCvFileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadCvFile(f, (url) => onChairmanCvUrlChange(url), onSetUploadingChairmanCv);
                      }}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                      <div>
                        <span className="text-xs font-bold text-on-surface block">
                          CV Calon Chairman
                        </span>
                        {candidateFormChairmanCvUrl ? (
                          <span className="text-[11px] text-emerald-400 font-medium block truncate max-w-[220px]">
                            ✓ Terunggah: {candidateFormChairmanCvUrl.split('/').pop()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant block">
                            Belum ada berkas PDF CV Chairman
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {candidateFormChairmanCvUrl && (
                          <>
                            <a
                              href={candidateFormChairmanCvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface text-[11px] font-semibold flex items-center gap-1 border border-outline-variant/30"
                            >
                              <Eye className="w-3 h-3 text-primary" />
                              <span>Lihat</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => onChairmanCvUrlChange(null)}
                              className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-error/20 text-error text-[11px] font-semibold flex items-center gap-1 border border-outline-variant/30"
                              title="Hapus CV Chairman"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={uploadingChairmanCv}
                          onClick={() => chairmanCvFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary-fixed text-on-primary text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {uploadingChairmanCv ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Mengunggah...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              <span>{candidateFormChairmanCvUrl ? 'Ganti CV' : 'Unggah CV Chairman'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CV Vice Chairman */}
                    <input
                      ref={viceChairmanCvFileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadCvFile(f, (url) => onViceChairmanCvUrlChange(url), onSetUploadingViceChairmanCv);
                      }}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                      <div>
                        <span className="text-xs font-bold text-on-surface block">
                          CV Calon Vice Chairman
                        </span>
                        {candidateFormViceChairmanCvUrl ? (
                          <span className="text-[11px] text-emerald-400 font-medium block truncate max-w-[220px]">
                            ✓ Terunggah: {candidateFormViceChairmanCvUrl.split('/').pop()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant block">
                            Belum ada berkas PDF CV Vice Chairman
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {candidateFormViceChairmanCvUrl && (
                          <>
                            <a
                              href={candidateFormViceChairmanCvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface text-[11px] font-semibold flex items-center gap-1 border border-outline-variant/30"
                            >
                              <Eye className="w-3 h-3 text-primary" />
                              <span>Lihat</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => onViceChairmanCvUrlChange(null)}
                              className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-error/20 text-error text-[11px] font-semibold flex items-center gap-1 border border-outline-variant/30"
                              title="Hapus CV Vice Chairman"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={uploadingViceChairmanCv}
                          onClick={() => viceChairmanCvFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary-fixed text-on-primary text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {uploadingViceChairmanCv ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Mengunggah...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              <span>{candidateFormViceChairmanCvUrl ? 'Ganti CV' : 'Unggah CV Vice Chairman'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase block mb-1">
                      Visi
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Visi kepemimpinan pasangan calon..."
                      value={candidateFormVision}
                      onChange={(e) => onVisionChange(e.target.value)}
                      className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary placeholder:text-on-surface-variant/60"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase block mb-1">
                      Misi (Satu butir per baris)
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                      value={candidateFormMission}
                      onChange={(e) => onMissionChange(e.target.value)}
                      className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary placeholder:text-on-surface-variant/60 font-sans"
                    />
                  </div>

                  {/* Status Aktif Paslon */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                    <input
                      type="checkbox"
                      id="candidate-is-active"
                      checked={candidateFormIsActive}
                      onChange={(e) => onIsActiveChange(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <label htmlFor="candidate-is-active" className="text-xs font-semibold text-on-surface cursor-pointer select-none">
                      Status Aktif (Pasangan calon dapat dipilih di bilik suara)
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={savingCandidate}
                      className="px-5 py-2.5 min-h-[44px] rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {savingCandidate ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Paslon</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL VISUAL FRAMING FOTO PASLON (4:3) */}
      {isPhotoFrameModalOpen && photoToFrame && (
        <Portal>
          <CandidatePhotoFrameModal
            isOpen={isPhotoFrameModalOpen}
            onClose={onClosePhotoFrame}
            imageUrl={photoToFrame}
            candidateNumber={candidateFormNumber}
            candidateNames={
              candidateFormLeader || candidateFormViceLeader
                ? `${candidateFormLeader} & ${candidateFormViceLeader}`
                : undefined
            }
            onConfirm={onFramedPhotoConfirm}
            isUploading={uploadingPhoto}
          />
        </Portal>
      )}
    </>
  );
}
