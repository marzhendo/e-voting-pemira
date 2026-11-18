'use client';

import {
  History,
  RefreshCw,
  Download,
  Search,
  Filter,
  Loader2,
  ShieldAlert,
  Shield,
} from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditStats {
  total: number;
  settingsCount: number;
  candidatesCount: number;
  dptCount: number;
  broadcastCount: number;
  adminCount: number;
}

interface AuditLogsTabProps {
  auditLogs: AuditLogItem[];
  auditStats: AuditStats | null;
  loadingAuditLogs: boolean;
  auditFilterAction: string;
  auditSearchQuery: string;
  onRefresh: () => void;
  onSearchChange: (q: string) => void;
  onFilterActionChange: (action: string) => void;
  onResetFilters: () => void;
}

export function AuditLogsTab({
  auditLogs,
  auditStats,
  loadingAuditLogs,
  auditFilterAction,
  auditSearchQuery,
  onRefresh,
  onSearchChange,
  onFilterActionChange,
  onResetFilters,
}: AuditLogsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-2xl bg-surface-container p-6 sm:p-7 border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
              Audit Trail &amp; Rekam Jejak Sistem
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Transparansi penuh seluruh aktivitas konfigurasi, perubahan paslon, DPT, dan aksi administratif panitia.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            disabled={loadingAuditLogs}
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold flex items-center gap-1.5 border border-outline-variant/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
            <span>Segarkan Log</span>
          </button>

          <a
            href={`/api/admin/audit-logs/export?action=${encodeURIComponent(auditFilterAction)}&q=${encodeURIComponent(auditSearchQuery)}`}
            download="Audit-Trail-Pemira-HMIF.csv"
            className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold flex items-center gap-1.5 border border-outline-variant/30 transition-colors"
            title="Ekspor Seluruh Log Audit ke Format CSV"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Ekspor Log (CSV)</span>
          </a>
        </div>
      </div>

      {/* Audit Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Log</span>
          <span className="text-xl sm:text-2xl font-bold text-on-surface mt-2 font-mono">
            {auditStats?.total || auditLogs.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Konfigurasi</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-400 mt-2 font-mono">
            {auditStats?.settingsCount || 0}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Paslon</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-2 font-mono">
            {auditStats?.candidatesCount || 0}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">DPT &amp; Pemilih</span>
          <span className="text-xl sm:text-2xl font-bold text-amber-400 mt-2 font-mono">
            {auditStats?.dptCount || 0}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Broadcast</span>
          <span className="text-xl sm:text-2xl font-bold text-purple-400 mt-2 font-mono">
            {auditStats?.broadcastCount || 0}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Administrator</span>
          <span className="text-xl sm:text-2xl font-bold text-primary mt-2 font-mono">
            {auditStats?.adminCount || 0}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="Cari pelaksana, email, atau rincian aksi..."
            value={auditSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
          <select
            value={auditFilterAction}
            onChange={(e) => onFilterActionChange(e.target.value)}
            className="px-3 py-2.5 min-h-[44px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <option value="all">Semua Kategori Aktivitas</option>
            <option value="ELECTION_SETTINGS_UPDATE">Pengaturan Jadwal &amp; Jam</option>
            <option value="MAINTENANCE_TOGGLE">Mode Pemeliharaan</option>
            <option value="CANDIDATE_CREATE">Pendaftaran Paslon</option>
            <option value="CANDIDATE_UPDATE">Pembaruan Paslon</option>
            <option value="CANDIDATE_DELETE">Penghapusan Paslon</option>
            <option value="KOTAK_KOSONG_TOGGLE">Sakelar Kotak Kosong</option>
            <option value="DPT_QUICK_ADD">Tambah Pemilih Cepat</option>
            <option value="DPT_BATCH_IMPORT">Impor DPT Massal</option>
            <option value="BROADCAST_EMAIL_SENT">Broadcast Email</option>
            <option value="BALLOTS_RESET">Reset Surat Suara</option>
            <option value="ADMIN_CREATE">Tambah Administrator</option>
            <option value="ADMIN_UPDATE_ROLE">Ubah Peran Administrator</option>
            <option value="ADMIN_REVOKE">Cabut Akses Administrator</option>
          </select>

          {(auditFilterAction !== 'all' || auditSearchQuery) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2 min-h-[44px] rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-highest/60 text-on-surface-variant uppercase font-semibold text-[10px] tracking-wider border-b border-outline-variant/20">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pelaksana / Admin</th>
                <th className="py-3 px-4">Kategori Aksi</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4 text-right">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loadingAuditLogs ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Memuat rekam jejak audit...</span>
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/40" />
                    <p className="font-semibold text-sm text-on-surface">Tidak ada log audit yang cocok</p>
                    <p className="text-xs text-on-surface-variant mt-1">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : log.timestamp;

                  let badgeBg = 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30';
                  let categoryLabel = log.action;
                  if (log.action.startsWith('ELECTION_') || log.action.startsWith('MAINTENANCE_')) {
                    badgeBg = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                    categoryLabel = 'Konfigurasi';
                  } else if (log.action.startsWith('CANDIDATE_') || log.action.startsWith('KOTAK_')) {
                    badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                    categoryLabel = 'Kandidat';
                  } else if (log.action.startsWith('DPT_')) {
                    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                    categoryLabel = 'DPT Pemilih';
                  } else if (log.action.startsWith('BROADCAST_')) {
                    badgeBg = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
                    categoryLabel = 'Broadcast';
                  } else if (log.action.startsWith('ADMIN_')) {
                    badgeBg = 'bg-primary/10 text-primary border-primary/30';
                    categoryLabel = 'Akses Admin';
                  } else if (log.action.startsWith('BALLOTS_')) {
                    badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                    categoryLabel = 'Reset Suara';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap text-on-surface-variant">
                        {formattedTime}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{log.actor_name}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">{log.actor_email}</div>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant">
                          {log.actor_role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badgeBg}`}>
                          {categoryLabel}
                        </span>
                        <span className="block text-[10px] text-on-surface-variant font-mono mt-1">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-on-surface leading-relaxed max-w-lg">
                          {log.description}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-1.5 text-[11px] text-on-surface-variant cursor-pointer">
                            <summary className="hover:text-primary transition-colors select-none font-semibold">
                              Rincian Parameter
                            </summary>
                            <pre className="mt-1.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 font-mono text-[10px] text-on-surface overflow-x-auto max-w-md">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="w-3 h-3 text-on-surface-variant/60" />
                          <span>{log.ip_address}</span>
                        </span>
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
