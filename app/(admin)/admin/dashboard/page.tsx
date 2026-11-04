'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
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
  UserPlus,
  Edit3,
  Trash2,
  LayoutGrid,
  Mail,
  Send,
  Calendar,
  CheckCircle2,
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

interface CandidateItem {
  id: string;
  candidate_number: number;
  leader_name: string;
  vice_leader_name: string;
  vision: string;
  mission: string[];
  photo_url: string | null;
}

function formatDateTimeLocal(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '2026-11-04T08:00';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '2026-11-04T08:00';
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'dpt' | 'tally' | 'settings' | 'emails'>('overview');

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

  // Candidates Management State
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateItem | null>(null);
  const [candidateFormNumber, setCandidateFormNumber] = useState<number>(1);
  const [candidateFormLeader, setCandidateFormLeader] = useState('');
  const [candidateFormViceLeader, setCandidateFormViceLeader] = useState('');
  const [candidateFormPhotoUrl, setCandidateFormPhotoUrl] = useState('');
  const [candidateFormVision, setCandidateFormVision] = useState('');
  const [candidateFormMission, setCandidateFormMission] = useState('');
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [candidateActionMessage, setCandidateActionMessage] = useState<string | null>(null);

  // Settings State
  const [isVotingOpen, setIsVotingOpen] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [startTime, setStartTime] = useState<string>('2026-11-04T08:00');
  const [endTime, setEndTime] = useState<string>('2026-11-04T16:00');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsReason, setSettingsReason] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Emergency Modal State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Jeda Teknis Terjadwal');

  // Broadcast Email State
  const [broadcastTargetGroup, setBroadcastTargetGroup] = useState<'not_voted' | 'all' | 'voted'>('not_voted');
  const [broadcastGeneration, setBroadcastGeneration] = useState('all');
  const [broadcastTemplate, setBroadcastTemplate] = useState<'invitation' | 'reminder' | 'custom'>('reminder');
  const [broadcastSubject, setBroadcastSubject] = useState('[PENTING] Sisa Waktu Pemira HMIF - Segera Gunakan Hak Suara Anda!');
  const [broadcastHeadline, setBroadcastHeadline] = useState('Peringatan: Waktu Pemungutan Suara Segera Berakhir');
  const [broadcastBody, setBroadcastBody] = useState(
    'Berdasarkan data sistem, Anda tercatat belum menggunakan hak suara pada Pemira HMIF 2026/2027.\n\nBilik suara digital akan ditutup tepat sesuai jadwal resmi. Jangan lewatkan kesempatan Anda untuk menentukan Chairman & Vice Chairman HMIF berikutnya.\n\nProses voting hanya memerlukan waktu 2 menit menggunakan NIM dan kode PIN verifikasi Outlook.'
  );
  const [broadcastCtaText, setBroadcastCtaText] = useState('Beri Suara Sekarang');
  const [broadcastCtaUrl, setBroadcastCtaUrl] = useState('/login');
  const [broadcastTargetCount, setBroadcastTargetCount] = useState<number | null>(null);
  const [loadingBroadcastCount, setLoadingBroadcastCount] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ totalTarget: number; sentCount: number; failedCount: number } | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [isConfirmBroadcastOpen, setIsConfirmBroadcastOpen] = useState(false);

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
  const fetchTally = useCallback(() => {
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
          if (data.electionSettings.startTime) {
            setStartTime(formatDateTimeLocal(data.electionSettings.startTime));
          }
          if (data.electionSettings.endTime) {
            setEndTime(formatDateTimeLocal(data.electionSettings.endTime));
          }
        }
      })
      .catch((err) => {
        setTallyError(err.message);
      })
      .finally(() => {
        setLoadingTally(false);
      });
  }, []);

  useEffect(() => {
    fetchTally();
  }, [fetchTally]);

  // 3. Muat data Kandidat
  const fetchCandidates = useCallback(() => {
    setLoadingCandidates(true);
    fetch('/api/admin/candidates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.candidates) {
          setCandidates(data.candidates);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCandidates(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'candidates' || activeTab === 'overview') {
      fetchCandidates();
    }
  }, [activeTab, fetchCandidates]);

  // 4. Muat data pemilih DPT
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

  // Open candidate modal for Add
  const handleOpenAddCandidate = () => {
    const regularCandidates = candidates.filter((c) => c.candidate_number > 0);
    const nextNumber = regularCandidates.length > 0
      ? Math.max(...regularCandidates.map((c) => c.candidate_number)) + 1
      : 1;

    setEditingCandidate(null);
    setCandidateFormNumber(nextNumber);
    setCandidateFormLeader('');
    setCandidateFormViceLeader('');
    setCandidateFormPhotoUrl('');
    setCandidateFormVision('');
    setCandidateFormMission('');
    setCandidateModalOpen(true);
  };

  // Open candidate modal for Edit
  const handleOpenEditCandidate = (candidate: CandidateItem) => {
    setEditingCandidate(candidate);
    setCandidateFormNumber(candidate.candidate_number);
    setCandidateFormLeader(candidate.leader_name);
    setCandidateFormViceLeader(candidate.vice_leader_name);
    setCandidateFormPhotoUrl(candidate.photo_url || '');
    setCandidateFormVision(candidate.vision || '');
    setCandidateFormMission(Array.isArray(candidate.mission) ? candidate.mission.join('\n') : '');
    setCandidateModalOpen(true);
  };

  // Save Candidate (Create or Update)
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCandidate(true);
    setCandidateActionMessage(null);

    const missionArray = candidateFormMission
      .split('\n')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const payload = {
      candidate_number: Number(candidateFormNumber),
      leader_name: candidateFormLeader.trim(),
      vice_leader_name: candidateFormViceLeader.trim(),
      vision: candidateFormVision.trim(),
      mission: missionArray,
      photo_url: candidateFormPhotoUrl.trim() || null,
    };

    try {
      let res;
      if (editingCandidate) {
        res = await fetch('/api/admin/candidates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCandidate.id, ...payload }),
        });
      } else {
        res = await fetch('/api/admin/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Gagal menyimpan data calon.');
      } else {
        setCandidateActionMessage(
          editingCandidate
            ? '✓ Data pasangan calon berhasil diperbarui.'
            : '✓ Pasangan calon baru berhasil ditambahkan.'
        );
        setCandidateModalOpen(false);
        fetchCandidates();
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menyimpan data calon.');
    } finally {
      setSavingCandidate(false);
    }
  };

  // Delete Candidate
  const handleDeleteCandidate = async (candidate: CandidateItem) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus Paslon Nomor Urut ${candidate.candidate_number} (${candidate.leader_name} & ${candidate.vice_leader_name})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/candidates?id=${encodeURIComponent(candidate.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Gagal menghapus calon.');
      } else {
        setCandidateActionMessage('✓ Pasangan calon berhasil dihapus.');
        fetchCandidates();
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menghapus calon.');
    }
  };

  // Handle Simpan Pengaturan Pemilihan & Jadwal
  const handleSaveSettings = async (
    newVotingOpen: boolean,
    newMaintenance: boolean,
    newStartTime: string,
    newEndTime: string,
    reasonText: string
  ) => {
    setSettingsSaving(true);
    setSettingsMessage(null);

    try {
      const res = await fetch('/api/admin/election-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isVotingOpen: newVotingOpen,
          maintenanceMode: newMaintenance,
          startTime: new Date(newStartTime).toISOString(),
          endTime: new Date(newEndTime).toISOString(),
          reason: reasonText || 'Pembaruan jadwal dan status pemilihan via dashboard KPR',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSettingsMessage(`❌ ${data.error || 'Gagal menyimpan pengaturan.'}`);
      } else {
        setIsVotingOpen(data.settings.is_voting_open);
        setMaintenanceMode(data.settings.maintenance_mode);
        if (data.settings.start_time) setStartTime(formatDateTimeLocal(data.settings.start_time));
        if (data.settings.end_time) setEndTime(formatDateTimeLocal(data.settings.end_time));
        setSettingsMessage('✓ Pengaturan jadwal dan bilik suara berhasil diperbarui.');
        setIsEmergencyModalOpen(false);
      }
    } catch {
      setSettingsMessage('❌ Terjadi kesalahan jaringan saat memperbarui pengaturan.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Broadcast Email Handlers
  const handleSelectTemplate = (templateKey: 'invitation' | 'reminder' | 'custom') => {
    setBroadcastTemplate(templateKey);
    setBroadcastResult(null);
    setBroadcastError(null);

    if (templateKey === 'invitation') {
      setBroadcastTargetGroup('all');
      setBroadcastSubject('[PEMIRA HMIF 2026/2027] Bilik Suara Telah Dibuka - Gunakan Hak Suara Anda!');
      setBroadcastHeadline('Bilik Suara Pemira HMIF Resmi Dibuka');
      setBroadcastBody(
        'Pemilihan Raya (PEMIRA) Chairman & Vice Chairman HMIF Periode 2026/2027 telah resmi dibuka.\n\nSebagai mahasiswa aktif Informatika Telkom University Purwokerto, hak suara Anda menentukan arah dan masa depan himpunan kita.\n\nSilakan akses bilik suara menggunakan NIM Anda untuk menerima kode PIN verifikasi di email Outlook kampus.'
      );
      setBroadcastCtaText('Masuk ke Bilik Suara Digital');
    } else if (templateKey === 'reminder') {
      setBroadcastTargetGroup('not_voted');
      setBroadcastSubject('[PENTING] Sisa Waktu Pemira HMIF - Segera Gunakan Hak Suara Anda!');
      setBroadcastHeadline('Peringatan: Waktu Pemungutan Suara Segera Berakhir');
      setBroadcastBody(
        'Berdasarkan data sistem, Anda tercatat belum menggunakan hak suara pada Pemira HMIF 2026/2027.\n\nBilik suara digital akan ditutup tepat sesuai jadwal resmi. Jangan lewatkan kesempatan Anda untuk menentukan Chairman & Vice Chairman HMIF berikutnya.\n\nProses voting hanya memerlukan waktu 2 menit menggunakan NIM dan kode PIN verifikasi Outlook.'
      );
      setBroadcastCtaText('Beri Suara Sekarang');
    } else {
      setBroadcastSubject('[PENGUMUMAN] Pemilihan Raya HMIF 2026/2027');
      setBroadcastHeadline('Pengumuman Panitia KPR HMIF');
      setBroadcastBody('Tuliskan isi pengumuman atau instruksi resmi Panitia KPR di sini...');
      setBroadcastCtaText('Buka Platform Pemira');
    }
  };

  const fetchBroadcastCount = useCallback(() => {
    setLoadingBroadcastCount(true);
    fetch(`/api/admin/broadcast-email?targetGroup=${broadcastTargetGroup}&generation=${broadcastGeneration}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setBroadcastTargetCount(data.count);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBroadcastCount(false));
  }, [broadcastTargetGroup, broadcastGeneration]);

  useEffect(() => {
    if (activeTab === 'emails') {
      fetchBroadcastCount();
    }
  }, [activeTab, fetchBroadcastCount]);

  const handleExecuteBroadcast = async () => {
    setIsBroadcasting(true);
    setBroadcastError(null);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/admin/broadcast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetGroup: broadcastTargetGroup,
          generation: broadcastGeneration,
          subject: broadcastSubject,
          headline: broadcastHeadline,
          bodyText: broadcastBody,
          ctaText: broadcastCtaText,
          ctaUrl: broadcastCtaUrl || '/login',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBroadcastError(data.error || 'Gagal memproses pengiriman email broadcast.');
      } else {
        setBroadcastResult(data.stats);
        setIsConfirmBroadcastOpen(false);
      }
    } catch {
      setBroadcastError('Terjadi kesalahan koneksi saat memproses broadcast email.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle File Import DPT
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStagedFile(file);
    setIsAnalyzingFile(true);
    setImportSuccessMessage(null);

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
          `✓ Sukses mengimpor ${data.importedCount} data DPT ke database.`
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

  const regularCandidates = candidates.filter((c) => c.candidate_number > 0);
  const regularCount = regularCandidates.length;

  return (
    <div className="bg-surface font-montserrat text-on-surface antialiased min-h-screen flex selection:bg-primary selection:text-on-primary">
      {/* SIDEBAR NAVIGATION */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col justify-between py-6 border-r border-outline-variant/30 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Logo & Title */}
          <div className="px-6 flex items-center gap-3">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
              <Image
                src="/assets/img/hmif-logo.png"
                alt="Logo HMIF"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-on-surface tracking-tight leading-tight">
                PEMIRA HMIF
              </span>
              <span className="text-[10px] text-outline font-medium">
                Panel Panitia KPR
              </span>
            </div>
          </div>

          {/* User Role Badge */}
          <div className="px-6">
            <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center justify-between border border-outline-variant/20">
              <span className="text-[10px] text-outline uppercase font-medium">
                Role
              </span>
              <span className="text-xs text-primary font-bold uppercase">
                {userRole.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 px-3">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview &amp; Partisipasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'candidates'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kelola Pasangan Calon</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dpt')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dpt'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Manajemen DPT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tally')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tally'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Rekapitulasi Suara</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Pemilihan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'emails'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Broadcast Email</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <button
            type="button"
            onClick={fetchTally}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-outline hover:text-on-surface transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan Data</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* TOP HEADER BAR */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface/90 backdrop-blur-md z-40 px-6 sm:px-8 flex items-center justify-between border-b border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isVotingOpen && !maintenanceMode ? 'bg-secondary' : 'bg-error'
                }`}
              />
              <span className="font-semibold text-on-surface">
                {maintenanceMode
                  ? 'Mode Pemeliharaan'
                  : isVotingOpen
                  ? 'Pemilihan Berlangsung'
                  : 'Pemilihan Ditutup'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-on-surface">{userName}</span>
              <span className="text-[10px] text-outline uppercase">
                {userRole.replace('_', ' ')}
              </span>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 pt-20 px-6 sm:px-8 pb-12">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">

            {/* TAB 1: OVERVIEW & PARTISIPASI */}
            {activeTab === 'overview' && (
              <>
                {/* Header Status Panel */}
                <section className="w-full rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                      <Vote className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-on-surface">
                        Bilik Suara Digital Pemira HMIF
                      </h1>
                      <div className="flex items-center gap-2 text-xs text-outline mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Jadwal Resmi: 08.00 – 16.00 WIB</span>
                        <span>•</span>
                        <span>Tata letak bilik suara aktif: <strong className="text-on-surface font-semibold">
                          {regularCount === 1 ? 'Head-to-Head' : `${regularCount} Paslon Grid`}
                        </strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEmergencyModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs border border-outline-variant/30 transition-colors self-start sm:self-auto"
                  >
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <span>Kunci Darurat Bilik</span>
                  </button>
                </section>

                {/* KPI Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-xs text-outline font-medium">TOTAL DPT</span>
                    <div className="my-3 flex items-baseline gap-1.5">
                      <span className="font-bebas text-4xl text-primary leading-none">
                        {totalDpt.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-outline">Pemilih</span>
                    </div>
                    <span className="text-xs text-outline">Mahasiswa Aktif Terdaftar</span>
                  </div>

                  <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-xs text-outline font-medium">SUARA MASUK</span>
                    <div className="my-3 flex items-baseline gap-1.5">
                      <span className="font-bebas text-4xl text-on-surface leading-none">
                        {totalVotes.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-secondary">Suara Sah</span>
                    </div>
                    <span className="text-xs text-outline">Tercatat di Basis Data</span>
                  </div>

                  <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-xs text-outline font-medium">TINGKAT PARTISIPASI</span>
                    <div className="my-3 flex items-baseline gap-1.5">
                      <span className="font-bebas text-4xl text-primary leading-none">
                        {turnoutPercentage}%
                      </span>
                      <span className="text-xs text-outline">Tercapai</span>
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
                      <span className="text-xs text-outline">Agregat Realtime</span>
                    </div>

                    <div className="space-y-4">
                      {generationData.length > 0 ? (
                        generationData.map((gen) => (
                          <div key={gen.generation} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface">
                                Angkatan {gen.generation}
                              </span>
                              <span className="text-outline">
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
                        <div className="text-xs text-outline py-4 text-center">
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
                        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-outline leading-relaxed flex flex-col gap-2">
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
                                  <span className="text-[10px] text-outline">
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

                    <div className="mt-4 pt-3 border-t border-outline-variant/20 text-xs text-outline text-center">
                      Ballot Secrecy: Data pemilih dan surat suara terpisah murni.
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* TAB 2: KELOLA PASANGAN CALON (KANDIDAT) */}
            {activeTab === 'candidates' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                      Kelola Pasangan Calon (Kandidat)
                    </h1>
                    <p className="text-xs text-outline mt-0.5">
                      Atur daftar calon Chairman &amp; Vice Chairman HMIF. Tata letak bilik suara menyesuaikan otomatis.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddCandidate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all shadow-sm self-start sm:self-auto"
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
                      onClick={() => setCandidateActionMessage(null)}
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
                      <span className="text-[11px] text-outline uppercase tracking-wider block font-medium">
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

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs text-on-surface font-semibold border border-outline-variant/30">
                      Total: {regularCount} Paslon
                    </span>
                    <span className="px-3 py-1 rounded-full bg-surface-container-high text-xs text-primary font-semibold border border-outline-variant/30">
                      Kotak Kosong: Aktif Otomatis
                    </span>
                  </div>
                </div>

                {/* Candidates List Cards */}
                {loadingCandidates ? (
                  <div className="py-16 text-center text-xs text-outline flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Memuat data calon...</span>
                  </div>
                ) : regularCandidates.length === 0 ? (
                  <div className="py-16 text-center text-xs text-outline bg-surface-container rounded-2xl border border-outline-variant/30 p-8">
                    <Users className="w-10 h-10 text-outline mx-auto mb-2 opacity-50" />
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
                          {/* Card Top: Number & Actions */}
                          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bebas text-xl text-primary">
                                {cand.candidate_number.toString().padStart(2, '0')}
                              </span>
                              <span className="text-xs font-bold text-on-surface">
                                Paslon {cand.candidate_number.toString().padStart(2, '0')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCandidate(cand)}
                                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                                title="Edit Paslon"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCandidate(cand)}
                                className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container-high transition-colors"
                                title="Hapus Paslon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Leader & Vice Leader */}
                          <div>
                            <h4 className="text-sm font-bold text-on-surface leading-snug">
                              {cand.leader_name}
                            </h4>
                            <p className="text-xs text-on-surface-variant">
                              &amp; {cand.vice_leader_name}
                            </p>
                          </div>

                          {/* Vision preview */}
                          <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant border border-outline-variant/20">
                            <span className="text-[10px] text-outline uppercase font-semibold block mb-0.5">
                              Visi:
                            </span>
                            <p className="line-clamp-2 leading-relaxed">
                              {cand.vision || 'Belum ada visi.'}
                            </p>
                          </div>

                          {/* Missions summary */}
                          <div className="text-xs text-outline">
                            <span>{Array.isArray(cand.mission) ? cand.mission.length : 0} butir misi</span>
                          </div>
                        </div>

                        {/* Card Footer Status */}
                        <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-outline">
                          <span>Status: Terdaftar Resmi</span>
                          <span className="text-primary font-medium">Bilik Suara Aktif</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MANAJEMEN DPT */}
            {activeTab === 'dpt' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                      Manajemen Daftar Pemilih Tetap (DPT)
                    </h1>
                    <p className="text-xs text-outline mt-0.5">
                      Kelola hak pilih mahasiswa aktif Informatika Telkom University Purwokerto.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      <span>Template CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all shadow-sm"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload DPT</span>
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

                {importSuccessMessage && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{importSuccessMessage}</span>
                  </div>
                )}

                {/* Staging / Pre-commit Preview Area */}
                {importPreview && (
                  <div className="rounded-2xl bg-surface-container p-6 border border-primary/40 shadow-lg flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                      <div>
                        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>Pratinjau Berkas: {stagedFile?.name}</span>
                        </h3>
                        <span className="text-xs text-outline">
                          Sistem memvalidasi kelengkapan data sebelum disimpan ke database.
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        Staging
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                        <span className="text-outline text-[11px] block">Total Baris:</span>
                        <span className="font-bebas text-2xl text-on-surface">{importPreview.totalRows}</span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                        <span className="text-outline text-[11px] block">Valid:</span>
                        <span className="font-bebas text-2xl text-secondary">{importPreview.validCount}</span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                        <span className="text-outline text-[11px] block">Duplikat:</span>
                        <span className="font-bebas text-2xl text-hmif-yellow">{importPreview.duplicateCount}</span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
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
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isCommittingImport || importPreview.validCount === 0}
                        onClick={handleCommitImport}
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
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari NIM, Nama, atau Email..."
                      className="w-full bg-surface-container-lowest text-xs rounded-xl pl-9 pr-3 py-2 border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedGeneration}
                      onChange={(e) => setSelectedGeneration(e.target.value)}
                      className="bg-surface-container-lowest text-xs rounded-xl px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
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
                      className="bg-surface-container-lowest text-xs rounded-xl px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="all">Semua Status</option>
                      <option value="voted">Sudah Memilih</option>
                      <option value="not_voted">Belum Memilih</option>
                    </select>
                  </div>
                </div>

                {/* Voters Table */}
                <div className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-outline uppercase tracking-wider font-semibold">
                          <th className="py-3 px-5">NIM</th>
                          <th className="py-3 px-5">Nama Mahasiswa</th>
                          <th className="py-3 px-5">Email SSO</th>
                          <th className="py-3 px-5">Angkatan</th>
                          <th className="py-3 px-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {loadingVoters ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-outline">
                              Memuat data pemilih...
                            </td>
                          </tr>
                        ) : voters.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-outline">
                              Tidak ada data yang cocok dengan pencarian.
                            </td>
                          </tr>
                        ) : (
                          voters.map((v) => (
                            <tr key={v.id} className="hover:bg-surface-container-high/40 transition-colors">
                              <td className="py-3 px-5 font-mono font-semibold text-primary">{v.nim}</td>
                              <td className="py-3 px-5 font-medium text-on-surface">{v.name}</td>
                              <td className="py-3 px-5 font-mono text-[11px] text-outline">{v.email}</td>
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
              </div>
            )}

            {/* TAB 4: REKAPITULASI SUARA */}
            {activeTab === 'tally' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                      Rekapitulasi Suara
                    </h1>
                    <p className="text-xs text-outline mt-0.5">
                      Hasil agregasi surat suara yang sah tanpa keterkaitan identitas pemilih.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-bright transition-colors border border-outline-variant/30"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span>Cetak Berita Acara</span>
                  </button>
                </div>

                {isTallyLocked ? (
                  <div className="rounded-2xl bg-surface-container p-8 text-center flex flex-col items-center justify-center gap-3 border border-outline-variant/30 max-w-md mx-auto my-8">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                      <LockKeyhole className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-on-surface">
                      Hasil Rekapitulasi Suara Terkunci
                    </h3>
                    <p className="text-xs text-outline leading-relaxed">
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
                              <span className="text-xs text-outline">
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

                        <div className="flex items-center justify-between text-xs text-outline pt-2 border-t border-outline-variant/20">
                          <span>Suara Masuk:</span>
                          <span className="font-bold text-on-surface font-mono">{cand.voteCount} Suara</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PENGATURAN PEMILIHAN & JADWAL */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6 max-w-3xl">
                <div className="pb-4 border-b border-outline-variant/30">
                  <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                    Pengaturan Pemilihan & Jadwal Pemira
                  </h1>
                  <p className="text-xs text-outline mt-0.5">
                    Atur jadwal resmi pelaksanaan, kendali pembukaan bilik suara, dan sakelar darurat teknis.
                  </p>
                </div>

                {settingsMessage && (
                  <div className="rounded-xl border border-outline-variant/40 bg-surface-container p-3.5 text-xs text-on-surface">
                    {settingsMessage}
                  </div>
                )}

                {/* KARTU 1: JADWAL RESMI PELAKSANAAN PEMIRA */}
                <div className="rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="text-sm font-bold text-on-surface">
                          Jadwal Operasional Pemira
                        </h3>
                        <p className="text-xs text-outline">
                          Rentang waktu resmi pembukaan bilik suara digital (WIB / UTC+7).
                        </p>
                      </div>
                    </div>

                    {/* Schedule Status Badge */}
                    {(() => {
                      const now = new Date();
                      const start = new Date(startTime);
                      const end = new Date(endTime);
                      if (now >= start && now <= end) {
                        return (
                          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Sedang Berlangsung
                          </span>
                        );
                      } else if (now < start) {
                        return (
                          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Belum Dimulai
                          </span>
                        );
                      } else {
                        return (
                          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-hmif-red/10 text-hmif-red border border-hmif-red/30 flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            Telah Berakhir
                          </span>
                        );
                      }
                    })()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase text-outline flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Waktu Mulai Pemilihan:</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase text-outline flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Waktu Penutupan Pemilihan:</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-outline leading-relaxed bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                    ℹ️ Sistem akan mengizinkan pengiriman suara hanya ketika waktu saat ini berada di antara waktu mulai dan penutupan. Di luar rentang waktu tersebut, bilik suara otomatis terkunci secara aman.
                  </p>
                </div>

                {/* KARTU 2: KENDALI BILIK SUARA & SAKELAR DARURAT */}
                <div className="rounded-2xl bg-surface-container p-6 border border-outline-variant/30 flex flex-col gap-5">
                  <h3 className="text-sm font-bold text-on-surface pb-2 border-b border-outline-variant/20">
                    Kendali Akses &amp; Sakelar Darurat
                  </h3>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">
                        Buka Pemungutan Suara
                      </h4>
                      <p className="text-xs text-outline mt-0.5">
                        Sakelar utama izin pengiriman suara pemilih di bilik suara digital.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVotingOpen(!isVotingOpen)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                        isVotingOpen ? 'bg-primary' : 'bg-surface-container-high'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white block transition-transform ${
                          isVotingOpen ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-outline-variant/20">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-hmif-red" />
                        Mode Pemeliharaan Darurat
                      </h4>
                      <p className="text-xs text-outline mt-0.5">
                        Nonaktifkan sementara pengiriman suara — bisa diaktifkan kembali kapan saja.
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

                  <div className="flex flex-col gap-1.5 pt-4 border-t border-outline-variant/20">
                    <label className="text-xs font-semibold uppercase text-outline">
                      Alasan Perubahan:
                    </label>
                    <textarea
                      value={settingsReason}
                      onChange={(e) => setSettingsReason(e.target.value)}
                      placeholder="Contoh: Jeda teknis sebelum penghitungan suara"
                      rows={2}
                      className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={settingsSaving || !settingsReason.trim()}
                    onClick={() => handleSaveSettings(isVotingOpen, maintenanceMode, startTime, endTime, settingsReason)}
                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {settingsSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Pengaturan...</span>
                      </>
                    ) : (
                      <span>Simpan Pengaturan &amp; Jadwal</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: BROADCAST EMAIL */}
            {activeTab === 'emails' && (
              <div className="flex flex-col gap-6">
                <div className="pb-4 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2.5">
                      <Mail className="w-6 h-6 text-primary" />
                      <span>Broadcast Email Pemira HMIF</span>
                    </h1>
                    <p className="text-xs text-outline mt-0.5">
                      Kirim email pengumuman resmi dan pengingat hak suara ke mahasiswa Telkom University.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchBroadcastCount}
                    className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container border border-outline-variant/30 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Segarkan Kuota</span>
                  </button>
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30">
                    <span className="text-[11px] font-semibold uppercase text-outline block">Total DPT Resmi</span>
                    <span className="text-xl font-bold text-on-surface font-mono">{totalDpt || 1240} Mahasiswa</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30">
                    <span className="text-[11px] font-semibold uppercase text-emerald-400 block">Sudah Menggunakan Hak Suara</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{totalVotes || 892} Mahasiswa</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30">
                    <span className="text-[11px] font-semibold uppercase text-amber-400 block">Belum Menggunakan Hak Suara</span>
                    <span className="text-xl font-bold text-amber-400 font-mono">{(totalDpt - totalVotes) > 0 ? (totalDpt - totalVotes) : 348} Mahasiswa</span>
                  </div>
                </div>

                {/* Results / Error Banner */}
                {broadcastResult && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Broadcast terkirim.</span>
                      <span className="text-emerald-300 block mt-0.5">
                        Total {broadcastResult.sentCount} email berhasil terkirim ke mahasiswa ({broadcastResult.failedCount} gagal) dari total target {broadcastResult.totalTarget} penerima.
                      </span>
                    </div>
                  </div>
                )}

                {broadcastError && (
                  <div className="rounded-2xl border border-hmif-red/30 bg-hmif-red/10 p-4 text-xs text-hmif-red flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Gagal Mengirim Broadcast</span>
                      <span className="block mt-0.5">{broadcastError}</span>
                    </div>
                  </div>
                )}

                {/* Main 2-Column Interface: Composer & Live Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Configuration & Message Composer */}
                  <div className="lg:col-span-7 bg-surface-container rounded-3xl p-6 sm:p-7 border border-outline-variant/30 space-y-5">
                    {/* Template Picker */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-outline block mb-2">
                        Pilih Template Pesan:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectTemplate('reminder')}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                            broadcastTemplate === 'reminder'
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-outline-variant'
                          }`}
                        >
                          <span className="block">⏳ Pengingat (Nudge)</span>
                          <span className="text-[10px] opacity-80 block mt-0.5">Khusus belum memilih</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectTemplate('invitation')}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                            broadcastTemplate === 'invitation'
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-outline-variant'
                          }`}
                        >
                          <span className="block">📢 Undangan Buka</span>
                          <span className="text-[10px] opacity-80 block mt-0.5">Untuk semua DPT</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectTemplate('custom')}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                            broadcastTemplate === 'custom'
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-outline-variant'
                          }`}
                        >
                          <span className="block">✍️ Pesan Kustom</span>
                          <span className="text-[10px] opacity-80 block mt-0.5">Tulis bebas</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Target Penerima */}
                    <div className="pt-4 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-outline">
                          Target Kelompok Pemilih:
                        </label>
                        <select
                          value={broadcastTargetGroup}
                          onChange={(e) => setBroadcastTargetGroup(e.target.value as any)}
                          className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                        >
                          <option value="not_voted">🔴 Khusus yang Belum Memilih (Rekomendasi)</option>
                          <option value="all">👥 Seluruh Mahasiswa di DPT</option>
                          <option value="voted">🟢 Khusus yang Sudah Memilih</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-outline">
                          Filter Angkatan:
                        </label>
                        <select
                          value={broadcastGeneration}
                          onChange={(e) => setBroadcastGeneration(e.target.value)}
                          className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                        >
                          <option value="all">Semua Angkatan (2023 - 2026)</option>
                          <option value="2023">Angkatan 2023</option>
                          <option value="2024">Angkatan 2024</option>
                          <option value="2025">Angkatan 2025</option>
                          <option value="2026">Angkatan 2026</option>
                        </select>
                      </div>
                    </div>

                    {/* Target Counter Badge */}
                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/20 flex items-center justify-between text-xs">
                      <span className="text-outline">Jumlah Penerima Sasaran:</span>
                      <span className="font-bold text-primary font-mono text-sm">
                        {loadingBroadcastCount ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : (
                          `${broadcastTargetCount ?? '...'} Mahasiswa`
                        )}
                      </span>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-outline">
                          Subjek Email:
                        </label>
                        <input
                          type="text"
                          value={broadcastSubject}
                          onChange={(e) => setBroadcastSubject(e.target.value)}
                          className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-outline">
                          Judul Pengumuman:
                        </label>
                        <input
                          type="text"
                          value={broadcastHeadline}
                          onChange={(e) => setBroadcastHeadline(e.target.value)}
                          className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-outline">
                          Isi Pesan Pengumuman:
                        </label>
                        <textarea
                          rows={6}
                          value={broadcastBody}
                          onChange={(e) => setBroadcastBody(e.target.value)}
                          className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase text-outline">
                            Teks Tombol Aksi (CTA):
                          </label>
                          <input
                            type="text"
                            value={broadcastCtaText}
                            onChange={(e) => setBroadcastCtaText(e.target.value)}
                            className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase text-outline">
                            Tautan Tombol Aksi:
                          </label>
                          <input
                            type="text"
                            value={broadcastCtaUrl}
                            placeholder="/login atau https://pemirahmif.org/login"
                            onChange={(e) => setBroadcastCtaUrl(e.target.value)}
                            className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                          />
                          <span className="text-[10px] text-outline block">
                            Tautan relatif (contoh: /login) akan otomatis dikonversi sistem ke alamat domain resmi Pemira.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Action */}
                    <button
                      type="button"
                      disabled={isBroadcasting || (broadcastTargetCount !== null && broadcastTargetCount === 0)}
                      onClick={() => setIsConfirmBroadcastOpen(true)}
                      className="w-full h-12 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer mt-4"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Broadcast Email ({broadcastTargetCount ?? '...'} Penerima)</span>
                    </button>
                  </div>

                  {/* Right Column: Live Email Preview */}
                  <div className="lg:col-span-5 bg-surface-container rounded-3xl p-6 sm:p-7 border border-outline-variant/30 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-outline">
                        Pratinjau Email Mahasiswa
                      </span>
                      <span className="text-[10px] text-outline font-mono">
                        Outlook Preview
                      </span>
                    </div>

                    {/* Email Container Frame */}
                    <div className="bg-[#181818] rounded-2xl border border-neutral-800 p-5 space-y-4 text-xs font-sans">
                      {/* Email Meta Headers */}
                      <div className="pb-3 border-b border-neutral-800 space-y-1 text-[11px]">
                        <div><strong className="text-neutral-400">Dari:</strong> <span className="text-neutral-200">Panitia Pemira HMIF &lt;noreply@pemirahmif.org&gt;</span></div>
                        <div><strong className="text-neutral-400">Kepada:</strong> <span className="text-neutral-200 font-mono">103012300001@student.telkomuniversity.ac.id</span></div>
                        <div><strong className="text-neutral-400">Subjek:</strong> <span className="text-primary font-medium">{broadcastSubject}</span></div>
                      </div>

                      {/* Rendered Email Card */}
                      <div className="bg-[#1E1E1E] rounded-xl p-5 border border-neutral-800 space-y-4">
                        <div className="text-center pb-3 border-b border-neutral-800">
                          <span className="text-[10px] font-bold text-hmif-gold uppercase tracking-widest block">
                            PEMIRA HMIF 2026/2027
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {broadcastHeadline}
                          </h4>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            Telkom University Purwokerto
                          </span>
                        </div>

                        <p className="text-neutral-300 leading-relaxed text-[11px]">
                          Halo <strong>Ahmad Rizky Pratama</strong> (<span className="text-hmif-gold font-mono">103012300001</span>),
                        </p>

                        <div className="text-neutral-300 leading-relaxed text-[11px] whitespace-pre-line space-y-2">
                          {broadcastBody}
                        </div>

                        <div className="pt-2 text-center">
                          <span className="inline-block px-5 py-2.5 rounded-lg bg-hmif-blue text-white text-[11px] font-bold shadow-md">
                            {broadcastCtaText} &rarr;
                          </span>
                        </div>

                        <div className="p-2.5 rounded bg-neutral-900 border-l-2 border-hmif-gold text-[10px] text-neutral-400 leading-normal">
                          🛡️ Kerahasiaan suara dijamin penuh berasaskan LUBER JURDIL (*Ballot Secrecy*).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL TAMBAH / EDIT PASANGAN CALON */}
      {candidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-2 border-b border-outline-variant/20">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  {editingCandidate ? 'Edit Pasangan Calon' : 'Tambah Pasangan Calon Baru'}
                </h3>
                <p className="text-xs text-outline">
                  Isi detail data pasangan calon peserta Pemira.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCandidateModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Nomor Urut Paslon
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={candidateFormNumber}
                  onChange={(e) => setCandidateFormNumber(Number(e.target.value))}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Nama Calon Chairman
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Farhan"
                  value={candidateFormLeader}
                  onChange={(e) => setCandidateFormLeader(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Nama Calon Vice Chairman
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Aisyah"
                  value={candidateFormViceLeader}
                  onChange={(e) => setCandidateFormViceLeader(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  URL Foto Paslon (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="https://... atau /images/paslon.png"
                  value={candidateFormPhotoUrl}
                  onChange={(e) => setCandidateFormPhotoUrl(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl px-3 py-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Visi
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Visi kepemimpinan pasangan calon..."
                  value={candidateFormVision}
                  onChange={(e) => setCandidateFormVision(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-outline uppercase block mb-1">
                  Misi (Satu butir per baris)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                  value={candidateFormMission}
                  onChange={(e) => setCandidateFormMission(e.target.value)}
                  className="w-full bg-surface-container-lowest text-xs rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setCandidateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCandidate}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
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
      )}

      {/* MODAL KUNCI DARURAT */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-error">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Kunci Darurat Bilik Suara
                  </h3>
                  <span className="text-[10px] text-outline uppercase tracking-wider">
                    Tindakan Darurat
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

            <p className="text-xs text-outline leading-relaxed">
              Mengaktifkan kunci darurat akan menghentikan pengiriman suara sementara bagi seluruh pemilih.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase text-outline font-semibold">
                Alasan Penguncian:
              </label>
              <select
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
              >
                <option value="Jeda Teknis Terjadwal">Jeda Teknis Terjadwal</option>
                <option value="Keadaan Kahar Organisasi">Keadaan Kahar Organisasi</option>
                <option value="Audit Keamanan Sistem">Audit Keamanan Sistem</option>
                <option value="Keputusan Sidang Pleno KPR">Keputusan Sidang Pleno KPR</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={settingsSaving}
                onClick={() => handleSaveSettings(isVotingOpen, true, startTime, endTime, emergencyReason)}
                className="px-4 py-2.5 rounded-xl bg-error text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Bilik Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BROADCAST EMAIL */}
      {isConfirmBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Konfirmasi Broadcast Email
                </h3>
                <p className="text-xs text-outline mt-0.5">
                  Tinjau sebelum pesan dikirimkan ke server email kampus.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-3.5 border border-outline-variant/20 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-outline">Jumlah Penerima:</span>
                <span className="font-bold text-primary font-mono">{broadcastTargetCount ?? '...'} Mahasiswa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Kelompok Sasaran:</span>
                <span className="font-semibold text-on-surface">
                  {broadcastTargetGroup === 'not_voted' ? 'Khusus yang Belum Memilih' : broadcastTargetGroup === 'all' ? 'Seluruh DPT' : 'Khusus yang Sudah Memilih'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Filter Angkatan:</span>
                <span className="font-semibold text-on-surface">
                  {broadcastGeneration === 'all' ? 'Semua (2023 - 2026)' : `Angkatan ${broadcastGeneration}`}
                </span>
              </div>
              <div className="pt-2 border-t border-outline-variant/20">
                <span className="text-outline block mb-1">Subjek:</span>
                <span className="font-medium text-on-surface truncate block">{broadcastSubject}</span>
              </div>
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              ⚠️ Sistem akan menggunakan mekanisme batching aman untuk menjaga deliverability SMTP dan reputasi domain di Microsoft Outlook Telkom University.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={() => setIsConfirmBroadcastOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={handleExecuteBroadcast}
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-on-primary hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Ya, Kirim Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
