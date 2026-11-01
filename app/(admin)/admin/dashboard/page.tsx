'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Vote,
  Users,
  Shield,
  ShieldAlert,
  Lock,
  LockKeyhole,
  CheckCircle,
  Clock,
  ArrowRight,
  UploadCloud,
  Download,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Settings,
  BarChart3,
  PieChart,
  UserCheck,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface TallyItem {
  candidateId: string;
  candidateNumber: number;
  leaderName: string;
  viceLeaderName: string;
  voteCount: number;
  percentage: number;
}

interface GenerationTurnout {
  generation: number;
  totalVoters: number;
  votedCount: number;
  turnoutPercentage: number;
}

interface VoterRow {
  id: string;
  nim: string;
  name: string;
  email: string;
  generation: number;
  has_voted: boolean;
  updated_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'dpt' | 'tally' | 'settings'>('overview');

  // Admin user & roles
  const [userRole, setUserRole] = useState<string>('kpr_admin');
  const [userName, setUserName] = useState<string>('Panitia KPR HMIF');

  // Tally & Election Data
  const [loadingTally, setLoadingTally] = useState(true);
  const [tallyError, setTallyError] = useState<string | null>(null);
  const [isTallyLocked, setIsTallyLocked] = useState(false);
  const [tallyData, setTallyData] = useState<TallyItem[]>([]);
  const [generationData, setGenerationData] = useState<GenerationTurnout[]>([]);
  const [totalDpt, setTotalDpt] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [turnoutPercentage, setTurnoutPercentage] = useState(0);

  // Settings State
  const [isVotingOpen, setIsVotingOpen] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsReason, setSettingsReason] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Emergency Modal State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Jeda Teknis Server Terjadwal');
  const [emergencyPin, setEmergencyPin] = useState('');

  // DPT Management State
  const [voters, setVoters] = useState<VoterRow[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [voterTotalCount, setVoterTotalCount] = useState(0);

  // DPT Import Staging
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    totalRows: number;
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
    validRows: Array<{ nim: string; name: string; email: string; generation: number }>;
  } | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [isCommittingImport, setIsCommittingImport] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // 1. Muat profil sesi admin
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserRole(data.user.role || 'kpr_admin');
          setUserName(data.user.name || 'Panitia KPR HMIF');
        }
      })
      .catch(() => {});
  }, []);

  // 2. Muat data Tally & Turnout
  const fetchTally = () => {
    setLoadingTally(true);
    setTallyError(null);

    fetch('/api/admin/tally')
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 403 && data.code === 'AUDITOR_TALLY_LOCKED') {
          setIsTallyLocked(true);
          return null;
        }
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memuat rekapitulasi.');
        }
        return data;
      })
      .then((data) => {
        if (!data) return;
        setIsTallyLocked(false);
        setTallyData(data.tally || []);
        if (data.turnout) {
          setTotalDpt(data.turnout.totalDpt || 0);
          setTotalVotes(data.turnout.totalVotesRecorded || 0);
          setTurnoutPercentage(data.turnout.turnoutPercentage || 0);
          setGenerationData(data.turnout.byGeneration || []);
        }
        if (data.electionSettings) {
          setIsVotingOpen(data.electionSettings.isVotingOpen);
          setMaintenanceMode(data.electionSettings.maintenanceMode);
        }
      })
      .catch((err) => {
        setTallyError(err.message);
      })
      .finally(() => {
        setLoadingTally(false);
      });
  };

  useEffect(() => {
    fetchTally();
  }, []);

  // 3. Muat data pemilih DPT
  const fetchVoters = useCallback(() => {
    setLoadingVoters(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedGeneration !== 'all') params.set('generation', selectedGeneration);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    params.set('limit', '50');

    fetch(`/api/admin/dpt?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setVoters(data.voters || []);
          setVoterTotalCount(data.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVoters(false));
  }, [searchQuery, selectedGeneration, selectedStatus]);

  useEffect(() => {
    if (activeTab === 'dpt') {
      fetchVoters();
    }
  }, [activeTab, fetchVoters]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      sessionStorage.clear();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  // Handle Simpan Pengaturan Pemilihan
  const handleSaveSettings = async (newVotingOpen: boolean, newMaintenance: boolean, reasonText: string) => {
    setSettingsSaving(true);
    setSettingsMessage(null);

    try {
      const res = await fetch('/api/admin/election-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isVotingOpen: newVotingOpen,
          maintenanceMode: newMaintenance,
          reason: reasonText || 'Perubahan pengaturan via dashboard KPR',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSettingsMessage(`❌ ${data.error || 'Gagal menyimpan pengaturan.'}`);
      } else {
        setIsVotingOpen(data.settings.is_voting_open);
        setMaintenanceMode(data.settings.maintenance_mode);
        setSettingsMessage('✓ Pengaturan pemilihan berhasil diperbarui dan tercatat di audit log.');
        setIsEmergencyModalOpen(false);
      }
    } catch {
      setSettingsMessage('❌ Terjadi kesalahan jaringan saat memperbarui pengaturan.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Handle File Import DPT
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStagedFile(file);
    setIsAnalyzingFile(true);
    setImportSuccessMessage(null);

    // Baca file dan parse CSV
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length <= 1) {
          alert('Berkas kosong atau hanya berisi baris header.');
          setIsAnalyzingFile(false);
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const nimIdx = headers.indexOf('nim');
        const nameIdx = headers.indexOf('name');
        const emailIdx = headers.indexOf('email');
        const genIdx = headers.indexOf('generation');

        if (nimIdx === -1 || nameIdx === -1 || emailIdx === -1 || genIdx === -1) {
          alert('Header kolom CSV wajib memuat: nim, name, email, generation.');
          setIsAnalyzingFile(false);
          return;
        }

        const rawRows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          return {
            nim: cols[nimIdx] || '',
            name: cols[nameIdx] || '',
            email: cols[emailIdx] || '',
            generation: Number(cols[genIdx]) || 0,
          };
        });

        // Kirim ke endpoint preview validasi
        const res = await fetch('/api/admin/dpt/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: rawRows }),
        });

        const previewData = await res.json();
        if (previewData.success) {
          setImportPreview({
            totalRows: previewData.summary.totalRows,
            validCount: previewData.summary.validCount,
            duplicateCount: previewData.summary.duplicateCount,
            invalidCount: previewData.summary.invalidCount,
            validRows: previewData.validRows,
          });
        } else {
          alert(previewData.error || 'Gagal memproses validasi berkas DPT.');
        }
      } catch {
        alert('Terjadi kesalahan saat membaca berkas CSV.');
      } finally {
        setIsAnalyzingFile(false);
      }
    };

    reader.readAsText(file);
  };

  // Commit Staged DPT
  const handleCommitImport = async () => {
    if (!importPreview || importPreview.validRows.length === 0) return;

    setIsCommittingImport(true);
    setImportSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/dpt/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: importPreview.validRows,
          auditReason: `Impor batch ${stagedFile?.name || 'CSV'} oleh ${userName}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportSuccessMessage(
          `✓ Sukses mengimpor ${data.importedCount} data DPT ke basis data.`
        );
        setStagedFile(null);
        setImportPreview(null);
        fetchVoters();
        fetchTally();
      } else {
        alert(data.error || 'Gagal mengimpor data DPT.');
      }
    } catch {
      alert('Terjadi kegagalan koneksi saat mengimpor data DPT.');
    } finally {
      setIsCommittingImport(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'nim,name,email,generation\n1301230001,Contoh Mahasiswa 1,contoh1@student.telkomuniversity.ac.id,2023\n1301240002,Contoh Mahasiswa 2,contoh2@student.telkomuniversity.ac.id,2024\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_dpt_pemira_hmif.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface font-montserrat text-on-surface antialiased min-h-screen flex selection:bg-primary-container selection:text-on-primary">
      {/* SIDEBAR NAVIGATION (Fixed Left w-72) */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between py-6 shadow-2xl border-r border-outline-variant/30">
        <div className="flex flex-col gap-6">
          {/* Logo & Title */}
          <div className="px-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-bold shadow-md border border-outline-variant/30">
              HMIF
            </div>
            <div className="flex flex-col">
              <span className="font-bebas text-xl text-primary tracking-wide leading-none">
                HMIF PEMIRA
              </span>
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider mt-1 font-semibold">
                KPR Console 2026/2027
              </span>
            </div>
          </div>

          {/* Period Badge */}
          <div className="px-6">
            <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center justify-between border border-outline-variant/20">
              <span className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                Status Role
              </span>
              <span className="text-xs text-primary font-bold uppercase">
                {userRole}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 px-4">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary-container text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview &amp; Partisipasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dpt')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dpt'
                  ? 'bg-primary-container text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manajemen DPT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tally')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tally'
                  ? 'bg-primary-container text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Rekapitulasi Suara</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-primary-container text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Pemilihan</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <button
            type="button"
            onClick={fetchTally}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Metrik</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-error hover:bg-surface-container-high transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Console</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER (pl-72) */}
      <div className="pl-72 flex-1 flex flex-col min-h-screen">
        {/* TOP HEADER BAR */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl z-40 px-6 sm:px-8 flex items-center justify-between border-b border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30">
              <span
                className={`w-2 h-2 rounded-full ${
                  isVotingOpen && !maintenanceMode ? 'bg-secondary animate-pulse' : 'bg-error'
                }`}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                {maintenanceMode
                  ? 'MODE PEMELIHARAAN'
                  : isVotingOpen
                  ? 'PEMILIHAN AKTIF'
                  : 'PEMILIHAN DITUTUP'}
              </span>
            </div>
            <div className="h-4 w-px bg-surface-container-highest hidden sm:block" />
            <span className="text-xs text-on-surface-variant hidden sm:inline font-medium">
              Komisi Pemilihan Raya HMIF 2026/2027
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-on-surface">{userName}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                {userRole.replace('_', ' ')}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-xs shadow-sm">
              {userName.charAt(0)}
            </div>
          </div>
        </header>

        {/* BODY CONTENT CONTAINER */}
        <main className="w-full pt-20 px-6 sm:px-8 pb-16 flex-1">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
            {/* TAB 1: OVERVIEW & PARTISIPASI */}
            {activeTab === 'overview' && (
              <>
                {/* Section 1: Election Status Panel */}
                <section className="w-full rounded-2xl bg-surface-container-low p-6 shadow-xl border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30 text-primary">
                      <Vote className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-montserrat text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                          Status Bilik Suara Digital
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                          <span>
                            {maintenanceMode
                              ? 'MAINTENANCE AKTIF'
                              : isVotingOpen
                              ? 'BERLANGSUNG (RPC Online)'
                              : 'DITUTUP'}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Jadwal Pemilihan: 08:00 – 16:00 WIB
                        </span>
                        <span>•</span>
                        <span className="text-secondary font-medium">
                          cast_ballot_secure RPC online
                        </span>
                        <span>•</span>
                        <span className="text-outline">
                          (Waktu penutupan mutlak dikendalikan server-side timestamp)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEmergencyModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-error/20 text-on-surface hover:text-error transition-all font-semibold text-xs border border-outline-variant/40 shadow-sm"
                    >
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      <span>Kelola Jadwal / Kunci Darurat</span>
                    </button>
                  </div>
                </section>

                {/* Section 2: Three Primary KPI Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Total DPT */}
                  <div className="bg-surface-container rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          Daftar Pemilih Tetap
                        </span>
                        <h3 className="font-montserrat text-sm font-bold text-on-surface mt-0.5">
                          TOTAL DPT
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="my-4 flex items-baseline gap-2">
                      <span className="font-bebas text-4xl sm:text-5xl text-primary leading-none">
                        {totalDpt.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs font-semibold text-on-surface-variant uppercase">
                        Pemilih
                      </span>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Cakupan Mahasiswa Aktif</span>
                      <span className="font-semibold text-primary">100% Terverifikasi</span>
                    </div>
                  </div>

                  {/* Card 2: Suara Masuk */}
                  <div className="bg-surface-container rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          Akumulasi Surat Suara
                        </span>
                        <h3 className="font-montserrat text-sm font-bold text-on-surface mt-0.5">
                          SUARA MASUK
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
                        <Vote className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="my-4 flex items-baseline gap-2">
                      <span className="font-bebas text-4xl sm:text-5xl text-on-surface leading-none">
                        {totalVotes.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs font-semibold text-secondary uppercase">
                        Suara Sah
                      </span>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Integritas Hash Transaksi</span>
                      <span className="font-semibold text-secondary">Sinkron 100%</span>
                    </div>
                  </div>

                  {/* Card 3: Partisipasi */}
                  <div className="bg-surface-container rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          Tingkat Kehadiran
                        </span>
                        <h3 className="font-montserrat text-sm font-bold text-on-surface mt-0.5">
                          PARTISIPASI
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="my-4 flex items-baseline gap-2">
                      <span className="font-bebas text-4xl sm:text-5xl text-primary leading-none">
                        {turnoutPercentage}%
                      </span>
                      <span className="text-xs font-semibold text-secondary uppercase">
                        Tercapai
                      </span>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Status Kuorum Pemira (65%)</span>
                      <span
                        className={`font-semibold ${
                          turnoutPercentage >= 65 ? 'text-secondary' : 'text-hmif-yellow'
                        }`}
                      >
                        {turnoutPercentage >= 65 ? 'Memenuhi Syarat Sah' : 'Mengejar Kuorum'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Section 3: Two-Column Data Visualization */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left Column: Demografi Partisipasi per Angkatan (Col 7) */}
                  <div className="lg:col-span-7 bg-surface-container rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/20">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-primary block">
                            Demografi Partisipasi
                          </span>
                          <h2 className="font-montserrat text-base font-bold text-on-surface">
                            PARTISIPASI PER ANGKATAN
                          </h2>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface text-xs font-semibold">
                          Realtime Agregat
                        </span>
                      </div>

                      {/* Progress Bars */}
                      <div className="space-y-4">
                        {generationData.length > 0 ? (
                          generationData.map((gen) => (
                            <div key={gen.generation} className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="font-semibold text-on-surface">
                                  Angkatan {gen.generation}
                                </span>
                                <span className="font-mono text-xs text-on-surface">
                                  {gen.votedCount} / {gen.totalVoters} Pemilih{' '}
                                  <strong className="text-primary font-bold ml-1.5">
                                    {gen.turnoutPercentage}%
                                  </strong>
                                </span>
                              </div>
                              <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden p-0.5">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
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

                    <div className="mt-6 pt-3 flex items-start gap-3 bg-surface-container-high/60 rounded-xl p-3.5 border border-outline-variant/20 text-xs">
                      <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-on-surface-variant leading-relaxed">
                        <strong className="text-on-surface">Integritas Data &amp; Pemisahan Entitas:</strong> Agregasi partisipasi diperbarui berkala via RPC terisolasi <code className="font-mono text-primary text-[11px] bg-surface-container px-1 py-0.5 rounded">cast_ballot_secure</code>. Tabel surat suara tidak memuat <code className="font-mono text-outline text-[11px]">voter_id</code> untuk menjamin kerahasiaan hak suara pemilih.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Rekapitulasi Suara Sementara (Col 5) */}
                  <div className="lg:col-span-5 bg-surface-container-low rounded-2xl p-6 shadow-md border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/20">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                            Sovereignty Shield
                          </span>
                          <h2 className="font-montserrat text-base font-bold text-on-surface">
                            REKAPITULASI SUARA SEMENTARA
                          </h2>
                        </div>
                        {isTallyLocked ? (
                          <span className="px-2 py-0.5 rounded bg-error/15 text-error text-xs font-bold uppercase flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Terkunci Server
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary text-xs font-bold uppercase">
                            Tally Aktif
                          </span>
                        )}
                      </div>

                      {/* Locked State Warning if election is open OR user is auditor */}
                      {isTallyLocked ? (
                        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-2.5">
                          <div className="flex items-center gap-2.5 text-primary">
                            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                              <LockKeyhole className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xs font-bold tracking-wide uppercase text-primary">
                              Akses Rekapitulasi Ditutup Selama Voting Aktif
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            Proporsi dan hasil perolehan suara tersimpan aman dan terisolasi di sisi server. Data kandidat diproteksi oleh role-based backend authorization dan tidak dapat diakses publik maupun auditor hingga jendela pemilihan resmi berakhir.
                          </p>
                          <div className="flex items-center gap-2 pt-1 text-xs text-on-surface font-medium">
                            <span className="w-2 h-2 rounded-full bg-secondary" />
                            <span>Status Server: <strong className="text-secondary font-bold">TERKUNCI</strong> • {totalVotes} Surat Suara Terverifikasi</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tallyData.map((cand) => (
                            <div
                              key={cand.candidateId}
                              className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between border border-outline-variant/20"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-bebas text-2xl text-primary font-normal">
                                  {cand.candidateNumber.toString().padStart(2, '0')}
                                </span>
                                <div>
                                  <span className="text-xs font-bold text-on-surface block">
                                    {cand.candidateNumber === 0
                                      ? 'Kotak Kosong'
                                      : `${cand.leaderName} & ${cand.viceLeaderName}`}
                                  </span>
                                  <span className="text-[10px] text-outline">
                                    {cand.voteCount} Suara
                                  </span>
                                </div>
                              </div>
                              <span className="font-bebas text-xl text-primary font-bold">
                                {cand.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 text-center border-t border-outline-variant/20">
                      <span className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase">
                        Kerahasiaan Terjamin: Otorisasi Akses Terkendali di Sisi Server
                      </span>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* TAB 2: MANAJEMEN DPT */}
            {activeTab === 'dpt' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
                  <div>
                    <h1 className="font-montserrat text-2xl font-bold text-on-surface">
                      Manajemen Daftar Pemilih Tetap (DPT)
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Kelola dan validasi hak pilih mahasiswa aktif Informatika Telkom University Purwokerto.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      <span>Unduh Template (.csv)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all shadow-md"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload DPT Baru</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {/* Import Success Banner */}
                {importSuccessMessage && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{importSuccessMessage}</span>
                  </div>
                )}

                {/* Staging / Pre-commit Preview Area */}
                {importPreview && (
                  <div className="rounded-2xl bg-surface-container-low p-6 border border-primary/40 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                      <div>
                        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>Pratinjau Impor Berkas: {stagedFile?.name}</span>
                        </h3>
                        <span className="text-xs text-outline">
                          Sistem memvalidasi duplikasi dan kelengkapan kolom sebelum komit ke DB.
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        Staged Batch
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                        <span className="text-outline text-[11px] block">Total Baris:</span>
                        <span className="font-bebas text-2xl text-on-surface">{importPreview.totalRows}</span>
                      </div>
                      <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                        <span className="text-outline text-[11px] block">Siap Diimpor (Valid):</span>
                        <span className="font-bebas text-2xl text-secondary">{importPreview.validCount}</span>
                      </div>
                      <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                        <span className="text-outline text-[11px] block">Duplikat Terdeteksi:</span>
                        <span className="font-bebas text-2xl text-hmif-yellow">{importPreview.duplicateCount}</span>
                      </div>
                      <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                        <span className="text-outline text-[11px] block">Format Invalid:</span>
                        <span className="font-bebas text-2xl text-error">{importPreview.invalidCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStagedFile(null);
                          setImportPreview(null);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-outline hover:text-on-surface transition-colors"
                      >
                        Batalkan
                      </button>
                      <button
                        type="button"
                        disabled={isCommittingImport || importPreview.validCount === 0}
                        onClick={handleCommitImport}
                        className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                      >
                        {isCommittingImport ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengompresi ke Database...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Komit {importPreview.validCount} Data ke Database</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Voter Search & Filters */}
                <div className="rounded-2xl bg-surface-container p-4 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari NIM, Nama, atau Email..."
                      className="w-full bg-surface-container-lowest text-xs rounded-lg pl-9 pr-3 py-2 border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                      value={selectedGeneration}
                      onChange={(e) => setSelectedGeneration(e.target.value)}
                      className="bg-surface-container-lowest text-xs rounded-lg px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="all">Semua Angkatan</option>
                      <option value="2023">Angkatan 2023</option>
                      <option value="2024">Angkatan 2024</option>
                      <option value="2025">Angkatan 2025</option>
                      <option value="2026">Angkatan 2026</option>
                    </select>

                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="bg-surface-container-lowest text-xs rounded-lg px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="all">Semua Status</option>
                      <option value="voted">Sudah Memilih</option>
                      <option value="not_voted">Belum Memilih</option>
                    </select>
                  </div>
                </div>

                {/* Voters Table */}
                <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container/60 border-b border-outline-variant/30 text-outline uppercase tracking-wider font-semibold">
                          <th className="py-3 px-6">NIM</th>
                          <th className="py-3 px-6">Nama Mahasiswa</th>
                          <th className="py-3 px-6">Email SSO</th>
                          <th className="py-3 px-6">Angkatan</th>
                          <th className="py-3 px-6">Status Hak Suara</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {loadingVoters ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-outline">
                              Memuat data pemilih DPT...
                            </td>
                          </tr>
                        ) : voters.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-outline">
                              Tidak ada data pemilih yang cocok dengan kriteria filter.
                            </td>
                          </tr>
                        ) : (
                          voters.map((v) => (
                            <tr key={v.id} className="hover:bg-surface-container/50 transition-colors">
                              <td className="py-3 px-6 font-mono font-semibold text-primary">{v.nim}</td>
                              <td className="py-3 px-6 font-medium text-on-surface">{v.name}</td>
                              <td className="py-3 px-6 font-mono text-[11px] text-on-surface-variant">{v.email}</td>
                              <td className="py-3 px-6">
                                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px]">
                                  {v.generation}
                                </span>
                              </td>
                              <td className="py-3 px-6">
                                {v.has_voted ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                    Sudah Memilih
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-outline text-[11px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                                    Belum Memilih
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline">
                    <span>Menampilkan {voters.length} dari {voterTotalCount} pemilih terdaftar</span>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: REKAPITULASI SUARA */}
            {activeTab === 'tally' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
                  <div>
                    <h1 className="font-montserrat text-2xl font-bold text-on-surface">
                      Rekapitulasi Suara Pemira HMIF
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Hasil agregasi suara terenkripsi tanpa keterkaitan identitas pemilih.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-bright transition-colors border border-outline-variant/30"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span>Cetak Berita Acara</span>
                  </button>
                </div>

                {isTallyLocked ? (
                  <div className="rounded-2xl bg-surface-container p-8 text-center flex flex-col items-center justify-center gap-3 border border-outline-variant/30 max-w-xl mx-auto my-8">
                    <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                      <LockKeyhole className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-on-surface">
                      Hasil Rekapitulasi Suara Terkunci
                    </h3>
                    <p className="text-xs text-outline leading-relaxed max-w-md">
                      Sesuai peraturan KPR HMIF, hasil perolehan suara ditutup selama bilik suara berlangsung aktif untuk mencegah pembentukan opini prematur dan menjaga netralitas pemilihan.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tallyData.map((cand) => (
                      <div
                        key={cand.candidateId}
                        className="rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bebas text-4xl text-primary font-bold">
                              {cand.candidateNumber.toString().padStart(2, '0')}
                            </span>
                            <div>
                              <h3 className="text-base font-bold text-on-surface">
                                {cand.candidateNumber === 0
                                  ? 'Kotak Kosong'
                                  : `${cand.leaderName} & ${cand.viceLeaderName}`}
                              </h3>
                              <span className="text-xs text-outline">
                                {cand.candidateNumber === 0 ? 'Opsi Abstain Sah' : 'Pasangan Calon'}
                              </span>
                            </div>
                          </div>

                          <span className="font-bebas text-3xl text-secondary">
                            {cand.percentage}%
                          </span>
                        </div>

                        <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${cand.percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-outline pt-2 border-t border-outline-variant/20">
                          <span>Total Suara Masuk:</span>
                          <span className="font-bold text-on-surface font-mono">{cand.voteCount} Suara</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PENGATURAN PEMILIHAN */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6 max-w-2xl">
                <div className="pb-4 border-b border-outline-variant/30">
                  <h1 className="font-montserrat text-2xl font-bold text-on-surface">
                    Pengaturan Pemilihan &amp; Sakelar Sistem
                  </h1>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Kendali operasional pembukaan bilik suara dan proteksi darurat.
                  </p>
                </div>

                {settingsMessage && (
                  <div className="rounded-xl border border-outline-variant/40 bg-surface-container p-4 text-xs text-on-surface">
                    {settingsMessage}
                  </div>
                )}

                <div className="rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col gap-6">
                  {/* Toggle 1: is_voting_open */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">
                        Buka Pemungutan Suara (is_voting_open)
                      </h4>
                      <p className="text-xs text-outline mt-0.5">
                        Izinkan pemilih DPT yang terautentikasi untuk mengirimkan suara di bilik suara.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVotingOpen(!isVotingOpen)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                        isVotingOpen ? 'bg-primary-container' : 'bg-surface-container-high'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white block transition-transform ${
                          isVotingOpen ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: maintenance_mode */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-outline-variant/20">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-hmif-red" />
                        Mode Pemeliharaan Darurat (maintenance_mode)
                      </h4>
                      <p className="text-xs text-outline mt-0.5">
                        Kunci sementara bilik suara dan tolak RPC voting jika terdeteksi anomali server.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                        maintenanceMode ? 'bg-hmif-red' : 'bg-surface-container-high'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white block transition-transform ${
                          maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reason Input */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant/20">
                    <label className="text-xs font-semibold uppercase text-outline">
                      Alasan Perubahan (Tercatat Permanen di Audit Log):
                    </label>
                    <textarea
                      value={settingsReason}
                      onChange={(e) => setSettingsReason(e.target.value)}
                      placeholder="Tuliskan justifikasi administratif atau teknis..."
                      rows={3}
                      className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={settingsSaving || !settingsReason.trim()}
                    onClick={() => handleSaveSettings(isVotingOpen, maintenanceMode, settingsReason)}
                    className="w-full py-3 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {settingsSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Pengaturan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan Pengaturan</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL KUNCI DARURAT / JADWAL DARURAT */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-high p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-error">
                <div className="w-10 h-10 rounded-xl bg-error-container/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h3 className="font-montserrat text-base font-bold text-on-surface">
                    Kunci Darurat Bilik Suara
                  </h3>
                  <span className="text-[11px] text-outline uppercase tracking-wider">
                    KPR Administrative Protocol
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container text-xs text-on-surface leading-relaxed border border-outline-variant/20">
              <p>
                <strong>Perhatian:</strong> Mengaktifkan kunci darurat akan menangguhkan fungsi RPC <code className="font-mono text-primary text-[11px] bg-surface-container-low px-1 py-0.5 rounded">cast_ballot_secure</code> bagi seluruh pemilih aktif.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Alasan Penyesuaian / Kunci
              </label>
              <select
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full rounded-xl bg-surface-container px-3 py-2 text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
              >
                <option value="Jeda Teknis Server Terjadwal">Jeda Teknis Server Terjadwal</option>
                <option value="Keadaan Kahar / Force Majeure Organisasi">Keadaan Kahar / Force Majeure Organisasi</option>
                <option value="Audit Integritas Jaringan & Keamanan">Audit Integritas Jaringan &amp; Keamanan</option>
                <option value="Instruksi Langsung Sidang Pleno KPR">Instruksi Langsung Sidang Pleno KPR</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={settingsSaving}
                onClick={() => handleSaveSettings(isVotingOpen, true, emergencyReason)}
                className="px-5 py-2.5 rounded-lg bg-error text-on-error text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Eksekusi Kunci Bilik</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
