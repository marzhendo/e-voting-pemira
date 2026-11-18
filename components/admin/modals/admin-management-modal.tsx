'use client';

import type { FormEvent } from 'react';
import {
  AlertTriangle,
  Loader2,
  UserPlus,
  X,
} from 'lucide-react';
import { Portal } from '@/components/ui/portal';

export interface AddAdminModalProps {
  isOpen: boolean;
  adminSaving: boolean;
  adminErrorMessage: string | null;
  adminFormName: string;
  adminFormEmail: string;
  adminFormNim: string;
  adminFormRole: 'kpr_admin' | 'auditor' | 'super_admin';
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNimChange: (value: string) => void;
  onRoleChange: (role: 'kpr_admin' | 'auditor' | 'super_admin') => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function AddAdminModal({
  isOpen,
  adminSaving,
  adminErrorMessage,
  adminFormName,
  adminFormEmail,
  adminFormNim,
  adminFormRole,
  onNameChange,
  onEmailChange,
  onNimChange,
  onRoleChange,
  onClose,
  onSubmit,
}: AddAdminModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !adminSaving) {
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
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Tambah Administrator Baru</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Berikan hak akses panitia atau auditor Pemira.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminErrorMessage && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{adminErrorMessage}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Nama Lengkap Administrator <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dimas Wahyu Pratama"
                  value={adminFormName}
                  onChange={(e) => onNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Email SSO Kampus / Akun <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: dimas@student.telkomuniversity.ac.id"
                  value={adminFormEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary font-mono"
                />
                <span className="text-[10px] text-on-surface-variant mt-1 block">
                  Email ini digunakan untuk login SSO / OTP ke bilik dan dashboard.
                </span>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  NIM (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 103012300088"
                  value={adminFormNim}
                  onChange={(e) => onNimChange(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Wewenang &amp; Peran (Role) <span className="text-error">*</span>
                </label>
                <select
                  value={adminFormRole}
                  onChange={(e) => onRoleChange(e.target.value as 'kpr_admin' | 'auditor' | 'super_admin')}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <option value="kpr_admin">Panitia KPR (Hak operasional penuh, paslon, DPT &amp; broadcast)</option>
                  <option value="auditor">Auditor Independen (Pengawas read-only &amp; rekapitulasi pasca pemilihan)</option>
                  <option value="super_admin">Superadmin (Wewenang tertinggi &amp; manajemen admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  disabled={adminSaving}
                  onClick={onClose}
                  className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adminSaving}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {adminSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Administrator</span>
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
