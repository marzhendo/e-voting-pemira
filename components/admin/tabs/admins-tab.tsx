'use client';

import {
  ShieldAlert,
  UserCog,
  UserPlus,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { AdminUserItem } from '../types';

interface AdminStats {
  total: number;
  superAdminCount: number;
  kprAdminCount: number;
  auditorCount: number;
}

interface AdminsTabProps {
  userRole: string;
  adminUsers: AdminUserItem[];
  adminStats: AdminStats | null;
  loadingAdmins: boolean;
  adminActionMessage: string | null;
  onDismissActionMessage: () => void;
  onOpenAddAdmin: () => void;
  onUpdateRole: (id: string, newRole: 'super_admin' | 'kpr_admin' | 'auditor') => void;
  onToggleStatus: (admin: AdminUserItem) => void;
  onDeleteAdmin: (admin: AdminUserItem) => void;
}

export function AdminsTab({
  userRole,
  adminUsers,
  adminStats,
  loadingAdmins,
  adminActionMessage,
  onDismissActionMessage,
  onOpenAddAdmin,
  onUpdateRole,
  onToggleStatus,
  onDeleteAdmin,
}: AdminsTabProps) {
  if (userRole !== 'super_admin') {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-surface-container border border-error/30 text-center max-w-xl mx-auto space-y-3">
          <ShieldAlert className="w-12 h-12 text-error mx-auto" />
          <h3 className="text-base font-bold text-on-surface">Akses Dibatasi Khusus Superadmin</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Wewenang penambahan panitia dan pembagian peran hanya dapat dikelola langsung oleh akun Superadmin utama (<span className="text-primary font-mono">marzhendogalangs@gmail.com</span>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-2xl bg-surface-container p-6 sm:p-7 border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <UserCog className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
              Manajemen Administrator &amp; Panitia
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Kontrol otorisasi peran panitia Komisi Pemilihan Raya (KPR), Auditor Independen (DPM), dan Superadmin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onOpenAddAdmin}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Admin Baru</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {adminActionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{adminActionMessage}</span>
          <button
            type="button"
            onClick={onDismissActionMessage}
            className="text-emerald-400 hover:opacity-80 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Total Pengelola</span>
          <span className="text-2xl font-bold text-on-surface mt-2 block font-mono">
            {adminStats?.total || adminUsers.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Superadmin</span>
          <span className="text-2xl font-bold text-primary mt-2 block font-mono">
            {adminStats?.superAdminCount || 0}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Panitia KPR</span>
          <span className="text-2xl font-bold text-blue-400 mt-2 block font-mono">
            {adminStats?.kprAdminCount || 0}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Auditor Independen</span>
          <span className="text-2xl font-bold text-purple-400 mt-2 block font-mono">
            {adminStats?.auditorCount || 0}
          </span>
        </div>
      </div>

      {/* Table of Admins */}
      <div className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-highest/60 text-on-surface-variant uppercase font-semibold text-[10px] tracking-wider border-b border-outline-variant/20">
              <tr>
                <th className="py-3 px-4">Nama Lengkap &amp; NIM</th>
                <th className="py-3 px-4">Email SSO / Akun</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loadingAdmins ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Memuat daftar administrator...</span>
                  </td>
                </tr>
              ) : adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    Belum ada administrator terdaftar.
                  </td>
                </tr>
              ) : (
                adminUsers.map((admin) => {
                  const isPrimarySuperadmin = admin.email === 'marzhendogalangs@gmail.com';

                  return (
                    <tr key={admin.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface flex items-center gap-2">
                          <span>{admin.name}</span>
                          {isPrimarySuperadmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30">
                              Owner
                            </span>
                          )}
                        </div>
                        {admin.nim && (
                          <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                            NIM: {admin.nim}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface">
                        {admin.email}
                      </td>
                      <td className="py-3.5 px-4">
                        {isPrimarySuperadmin ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 inline-block">
                            Superadmin
                          </span>
                        ) : (
                          <select
                            value={admin.role}
                            onChange={(e) =>
                              onUpdateRole(
                                admin.id,
                                e.target.value as 'super_admin' | 'kpr_admin' | 'auditor'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer font-medium"
                          >
                            <option value="kpr_admin">Panitia KPR</option>
                            <option value="auditor">Auditor Independen</option>
                            <option value="super_admin">Superadmin</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={isPrimarySuperadmin}
                          onClick={() => onToggleStatus(admin)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            admin.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
                          } ${isPrimarySuperadmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-emerald-400' : 'bg-on-surface-variant'}`} />
                          <span>{admin.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isPrimarySuperadmin && (
                          <button
                            type="button"
                            onClick={() => onDeleteAdmin(admin)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                            title="Cabut Akses Administrator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
