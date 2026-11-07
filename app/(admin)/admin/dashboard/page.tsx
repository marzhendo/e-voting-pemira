'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Portal } from '@/components/ui/portal';
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
  Upload,
  Eye,
  Image as ImageIcon,
  Menu,
  Printer,
  History,
  UserCog,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  Activity,
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
  chairman_cv_url?: string | null;
  vice_chairman_cv_url?: string | null;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_name: string;
  actor_role: string;
  action: string;
  description: string;
  ip_address: string;
  details?: Record<string, unknown> | null;
}

interface AdminUserItem {
  id: string;
  nim?: string;
  name: string;
  email: string;
  role: 'super_admin' | 'kpr_admin' | 'auditor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'dpt' | 'tally' | 'settings' | 'emails' | 'audit' | 'admins'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const [candidateFormChairmanCvUrl, setCandidateFormChairmanCvUrl] = useState<string | null>(null);
  const [candidateFormViceChairmanCvUrl, setCandidateFormViceChairmanCvUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingChairmanCv, setUploadingChairmanCv] = useState(false);
  const [uploadingViceChairmanCv, setUploadingViceChairmanCv] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [allowKotakKosongMulti, setAllowKotakKosongMulti] = useState(true);
  const [togglingKotakKosong, setTogglingKotakKosong] = useState(false);
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [candidateActionMessage, setCandidateActionMessage] = useState<string | null>(null);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const chairmanCvFileInputRef = useRef<HTMLInputElement>(null);
  const viceChairmanCvFileInputRef = useRef<HTMLInputElement>(null);

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

  // State Modal Tambah Pemilih Uji Coba (Tes SMTP)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddNim, setQuickAddNim] = useState('103012399001');
  const [quickAddName, setQuickAddName] = useState('Penguji Sistem KPR');
  const [quickAddEmail, setQuickAddEmail] = useState('');
  const [quickAddGeneration, setQuickAddGeneration] = useState(2023);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  // State Reset Ballots Simulasi
  const [isResettingBallots, setIsResettingBallots] = useState(false);
  const [ballotActionMessage, setBallotActionMessage] = useState<string | null>(null);

  // State Modal Pratinjau Berita Acara (BAST)
  const [isBastModalOpen, setIsBastModalOpen] = useState(false);

  // State Audit Logs & Audit Trail
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditStats, setAuditStats] = useState<{
    total: number;
    settingsCount: number;
    candidatesCount: number;
    dptCount: number;
    broadcastCount: number;
    adminCount: number;
  } | null>(null);

  // State Manajemen Admin
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminStats, setAdminStats] = useState<{
    total: number;
    superAdminCount: number;
    kprAdminCount: number;
    auditorCount: number;
  } | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminFormName, setAdminFormName] = useState('');
  const [adminFormEmail, setAdminFormEmail] = useState('');
  const [adminFormNim, setAdminFormNim] = useState('');
  const [adminFormRole, setAdminFormRole] = useState<'kpr_admin' | 'auditor' | 'super_admin'>('kpr_admin');
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null);
  const [adminErrorMessage, setAdminErrorMessage] = useState<string | null>(null);

  // Kunci scroll halaman (body & html) saat modal atau menu drawer terbuka
  useEffect(() => {
    const shouldLock =
      candidateModalOpen ||
      isEmergencyModalOpen ||
      isConfirmBroadcastOpen ||
      isSidebarOpen ||
      isQuickAddModalOpen ||
      adminModalOpen;
    if (shouldLock) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isConfirmBroadcastOpen && !isBroadcasting) setIsConfirmBroadcastOpen(false);
          else if (isEmergencyModalOpen && !settingsSaving) setIsEmergencyModalOpen(false);
          else if (candidateModalOpen && !savingCandidate && !uploadingPhoto && !uploadingChairmanCv && !uploadingViceChairmanCv) setCandidateModalOpen(false);
          else if (isQuickAddModalOpen && !quickAddLoading) setIsQuickAddModalOpen(false);
          else if (adminModalOpen && !adminSaving) setAdminModalOpen(false);
          else if (isSidebarOpen) setIsSidebarOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    candidateModalOpen,
    isEmergencyModalOpen,
    isConfirmBroadcastOpen,
    isSidebarOpen,
    isQuickAddModalOpen,
    adminModalOpen,
    isBroadcasting,
    settingsSaving,
    savingCandidate,
    uploadingPhoto,
    uploadingChairmanCv,
    uploadingViceChairmanCv,
    quickAddLoading,
    adminSaving,
  ]);

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
  const fetchTally = useCallback((silent = false) => {
    if (!silent) setLoadingTally(true);
    setTallyError(null);

    fetch('/api/admin/tally', { cache: 'no-store' })
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
          if (data.electionSettings.allowKotakKosongMulti !== undefined) {
            setAllowKotakKosongMulti(data.electionSettings.allowKotakKosongMulti);
          }
        }
      })
      .catch((err) => {
        if (!silent) setTallyError(err.message);
      })
      .finally(() => {
        if (!silent) setLoadingTally(false);
      });
  }, []);

  useEffect(() => {
    fetchTally();

    // Auto-polling real-time setiap 3 detik saat tab Overview atau Tally aktif
    if (activeTab === 'overview' || activeTab === 'tally') {
      const pollTimer = setInterval(() => {
        fetchTally(true);
      }, 3000);
      return () => clearInterval(pollTimer);
    }
  }, [fetchTally, activeTab]);

  // 3. Muat data Kandidat
  const fetchCandidates = useCallback((silent = false) => {
    if (!silent) setLoadingCandidates(true);
    fetch('/api/admin/candidates', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.candidates) {
          setCandidates(data.candidates);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!silent) setLoadingCandidates(false);
      });
  }, []);

  useEffect(() => {
    if (activeTab === 'candidates' || activeTab === 'overview') {
      fetchCandidates();
      const candTimer = setInterval(() => {
        fetchCandidates(true);
      }, 5000);
      return () => clearInterval(candTimer);
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

  // 5. Muat data Audit Logs & Rekam Jejak
  const fetchAuditLogs = useCallback((action = auditFilterAction, search = auditSearchQuery) => {
    setLoadingAuditLogs(true);
    const params = new URLSearchParams();
    if (action && action !== 'all') params.set('action', action);
    if (search && search.trim()) params.set('q', search.trim());
    params.set('limit', '50');

    fetch(`/api/admin/audit-logs?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setAuditLogs(data.logs || []);
          if (data.stats) setAuditStats(data.stats);
        }
      })
      .catch((err) => console.warn('[AuditLogs] Fetch error:', err))
      .finally(() => setLoadingAuditLogs(false));
  }, [auditFilterAction, auditSearchQuery]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  // 6. Muat data Manajemen Admin
  const fetchAdminUsers = useCallback(() => {
    setLoadingAdmins(true);
    fetch('/api/admin/manage-admins')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setAdminUsers(data.admins || []);
          if (data.stats) setAdminStats(data.stats);
        }
      })
      .catch((err) => console.warn('[ManageAdmins] Fetch error:', err))
      .finally(() => setLoadingAdmins(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdminUsers();
    }
  }, [activeTab, fetchAdminUsers]);

  // Handler Tambah Admin Baru
  const handleSaveAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    setAdminActionMessage(null);
    setAdminErrorMessage(null);

    try {
      const res = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminFormName.trim(),
          email: adminFormEmail.trim(),
          nim: adminFormNim.trim() || undefined,
          role: adminFormRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdminErrorMessage(data.error || 'Gagal menambahkan administrator.');
      } else {
        setAdminActionMessage(`✓ Administrator ${data.admin?.name || ''} berhasil ditambahkan.`);
        setAdminModalOpen(false);
        setAdminFormName('');
        setAdminFormEmail('');
        setAdminFormNim('');
        setAdminFormRole('kpr_admin');
        fetchAdminUsers();
      }
    } catch {
      setAdminErrorMessage('Terjadi kesalahan jaringan saat menyimpan administrator.');
    } finally {
      setAdminSaving(false);
    }
  };

  // Handler Ubah Status Aktif Admin
  const handleToggleAdminStatus = async (admin: AdminUserItem) => {
    try {
      const res = await fetch('/api/admin/manage-admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: admin.id,
          isActive: !admin.is_active,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminActionMessage(`✓ Status ${admin.name} diubah menjadi ${!admin.is_active ? 'Aktif' : 'Nonaktif'}.`);
        fetchAdminUsers();
      } else {
        alert(data.error || 'Gagal mengubah status administrator.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Handler Ubah Peran Admin
  const handleUpdateAdminRole = async (id: string, newRole: 'super_admin' | 'kpr_admin' | 'auditor') => {
    try {
      const res = await fetch('/api/admin/manage-admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminActionMessage('✓ Peran administrator berhasil diperbarui.');
        fetchAdminUsers();
      } else {
        alert(data.error || 'Gagal memperbarui peran.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Handler Cabut / Hapus Admin
  const handleDeleteAdminUser = async (admin: AdminUserItem) => {
    if (!confirm(`Apakah Anda yakin ingin mencabut akses administrator untuk ${admin.name} (${admin.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/manage-admins?id=${encodeURIComponent(admin.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminActionMessage(`✓ Akses administrator untuk ${admin.name} berhasil dicabut.`);
        fetchAdminUsers();
      } else {
        alert(data.error || 'Gagal mencabut akses administrator.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat mencabut administrator.');
    }
  };

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
    setCandidateFormChairmanCvUrl(null);
    setCandidateFormViceChairmanCvUrl(null);
    setUploadError(null);
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
    setCandidateFormChairmanCvUrl(candidate.chairman_cv_url || null);
    setCandidateFormViceChairmanCvUrl(candidate.vice_chairman_cv_url || null);
    setUploadError(null);
    setCandidateFormVision(candidate.vision || '');
    setCandidateFormMission(Array.isArray(candidate.mission) ? candidate.mission.join('\n') : '');
    setCandidateModalOpen(true);
  };

  // Upload file helper for candidate photo or CVs
  const handleUploadFile = async (
    file: File,
    category: 'candidates' | 'cv',
    onSuccess: (url: string) => void,
    setLoadingState: (loading: boolean) => void
  ) => {
    setLoadingState(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('candidateNumber', candidateFormNumber.toString());

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || 'Gagal mengunggah berkas.');
      } else {
        onSuccess(data.url);
      }
    } catch {
      setUploadError('Terjadi kesalahan jaringan saat mengunggah berkas.');
    } finally {
      setLoadingState(false);
    }
  };

  // Toggle Kotak Kosong for Multi-Candidate Elections
  const handleToggleKotakKosong = async () => {
    const nextVal = !allowKotakKosongMulti;
    setTogglingKotakKosong(true);
    try {
      const res = await fetch('/api/admin/election-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allow_kotak_kosong_multi: nextVal,
          reason: `Admin mengubah opsi kotak kosong multi-kandidat menjadi ${nextVal ? 'Aktif' : 'Nonaktif'}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAllowKotakKosongMulti(nextVal);
        setCandidateActionMessage(
          nextVal
            ? '✓ Opsi Kotak Kosong diaktifkan untuk pemilihan multi-paslon.'
            : '✓ Opsi Kotak Kosong dinonaktifkan untuk pemilihan multi-paslon.'
        );
      } else {
        alert(data.error || 'Gagal memperbarui status sakelar Kotak Kosong.');
      }
    } catch {
      alert('Gagal memperbarui status sakelar Kotak Kosong.');
    } finally {
      setTogglingKotakKosong(false);
    }
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
      chairman_cv_url: candidateFormChairmanCvUrl || null,
      vice_chairman_cv_url: candidateFormViceChairmanCvUrl || null,
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

  const handleQuickAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickAddLoading(true);
    setQuickAddError(null);

    try {
      const res = await fetch('/api/admin/dpt/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim: quickAddNim.trim(),
          name: quickAddName.trim(),
          email: quickAddEmail.trim(),
          generation: Number(quickAddGeneration),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setQuickAddError(data.error || 'Gagal menambahkan pemilih.');
      } else {
        setImportSuccessMessage(
          `✓ Pemilih uji coba (${data.voter?.name} - ${data.voter?.email}) berhasil didaftarkan ke DPT.`
        );
        setIsQuickAddModalOpen(false);
        fetchVoters();
        fetchTally();
      }
    } catch {
      setQuickAddError('Terjadi kesalahan jaringan saat menambahkan pemilih.');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleResetDevBallots = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset seluruh surat suara simulasi pengujian? Tindakan ini akan mengosongkan perolehan suara.')) {
      return;
    }
    setIsResettingBallots(true);
    setBallotActionMessage(null);

    try {
      const res = await fetch('/api/admin/tally', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setBallotActionMessage('✓ Seluruh surat suara simulasi berhasil direset ke 0.');
        fetchTally();
      } else {
        alert(data.error || 'Gagal mereset surat suara.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat mereset surat suara.');
    } finally {
      setIsResettingBallots(false);
    }
  };

  const regularCandidates = candidates.filter((c) => c.candidate_number > 0);
  const regularCount = regularCandidates.length;

  const renderBeritaAcaraContent = () => {
    const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
    }).format(new Date());

    const currentTimeFormatted =
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(new Date()) + ' WIB';

    const sortedCandidates = [...tallyData].sort((a, b) => b.voteCount - a.voteCount);
    const leadingCandidate = sortedCandidates[0];

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* KOP SURAT RESMI */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b-4 border-double border-black">
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <Image
              src="/assets/img/hmif-logo.png"
              alt="Logo HMIF"
              width={72}
              height={72}
              priority
              className="object-contain"
            />
          </div>
          <div className="flex-1 text-center font-sans">
            <div className="text-xs sm:text-sm font-bold tracking-wider uppercase text-gray-900">
              KOMISI PEMILIHAN RAYA (KPR)
            </div>
            <div className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-black">
              HIMPUNAN MAHASISWA INFORMATIKA (HMIF)
            </div>
            <div className="text-xs sm:text-sm font-bold tracking-wider uppercase text-gray-900">
              TELKOM UNIVERSITY PURWOKERTO
            </div>
            <p className="text-[10px] text-gray-600 mt-1 leading-tight">
              Sekretariat: Gedung Student Center Lt. 2, Jl. D.I. Panjaitan No. 128, Purwokerto 53147
              <br />
              Laman Resmi: pemirahmif.org • Surel: kpr.hmif@student.telkomuniversity.ac.id
            </p>
          </div>
          <div className="w-20 h-20 shrink-0 hidden sm:block" />
        </div>

        {/* JUDUL DOKUMEN */}
        <div className="text-center space-y-1 pt-2 font-sans">
          <div className="text-sm sm:text-base font-bold underline uppercase tracking-wide">
            BERITA ACARA REKAPITULASI DAN PENETAPAN HASIL PEROLEHAN SUARA
          </div>
          <p className="text-xs font-semibold text-gray-800">
            PEMILIHAN RAYA KETUA DAN WAKIL KETUA HMIF PERIODE 2026/2027
          </p>
          <p className="text-[11px] font-mono text-gray-600">
            Nomor: 009/BA-KPR/HMIF/XI/2026
          </p>
        </div>

        {/* PARAGRAF PEMBUKA */}
        <p className="text-justify leading-relaxed text-xs sm:text-[13px]">
          Pada hari ini, <strong>{currentDateFormatted}</strong> pukul {currentTimeFormatted}, bertempat di Sekretariat Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto, telah diselesaikan rekapitulasi akhir penghitungan suara elektronik (<em>E-Voting</em>) Pemira HMIF 2026/2027 yang diselenggarakan berasaskan Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER JURDIL) dengan rincian sebagai berikut:
        </p>

        {/* BAGIAN I: DATA PARTISIPASI PEMILIH */}
        <div className="space-y-2">
          <h4 className="font-bold font-sans text-xs uppercase tracking-wider text-gray-900">
            I. DATA PARTISIPASI DAN DAFTAR PEMILIH TETAP (DPT)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-sans">
            <div className="p-2.5 border border-gray-300 rounded bg-gray-50">
              <span className="text-[10px] text-gray-600 block">Total DPT Terdaftar:</span>
              <span className="font-bold text-sm text-black font-mono">{totalDpt} Mahasiswa</span>
            </div>
            <div className="p-2.5 border border-gray-300 rounded bg-gray-50">
              <span className="text-[10px] text-gray-600 block">Total Suara Masuk:</span>
              <span className="font-bold text-sm text-black font-mono">{totalVotes} Suara</span>
            </div>
            <div className="p-2.5 border border-gray-300 rounded bg-gray-50">
              <span className="text-[10px] text-gray-600 block">Tingkat Partisipasi (Turnout):</span>
              <span className="font-bold text-sm text-black font-mono">{turnoutPercentage}%</span>
            </div>
          </div>

          {generationData.length > 0 && (
            <table className="w-full text-xs font-sans border-collapse border border-gray-300 mt-2">
              <thead>
                <tr className="bg-gray-100 text-gray-800">
                  <th className="border border-gray-300 p-1.5 text-center w-12">No.</th>
                  <th className="border border-gray-300 p-1.5 text-left">Angkatan Mahasiswa</th>
                  <th className="border border-gray-300 p-1.5 text-center">Jumlah DPT</th>
                  <th className="border border-gray-300 p-1.5 text-center">Suara Digunakan</th>
                  <th className="border border-gray-300 p-1.5 text-center">Partisipasi (%)</th>
                </tr>
              </thead>
              <tbody>
                {generationData.map((gen, idx) => (
                  <tr key={gen.generation} className="text-gray-900">
                    <td className="border border-gray-300 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-gray-300 p-1.5 font-medium">Informatika Angkatan {gen.generation}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{gen.totalVoters}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{gen.votedCount}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-mono">{gen.turnoutPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* BAGIAN II: REKAPITULASI HASIL PEROLEHAN SUARA */}
        <div className="space-y-2 pt-2">
          <h4 className="font-bold font-sans text-xs uppercase tracking-wider text-gray-900">
            II. HASIL PEROLEHAN SUARA PASANGAN CALON
          </h4>
          <table className="w-full text-xs font-sans border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-800">
                <th className="border border-gray-300 p-2 text-center w-12">No.</th>
                <th className="border border-gray-300 p-2 text-center w-16">No. Urut</th>
                <th className="border border-gray-300 p-2 text-left">Nama Pasangan Calon / Opsi</th>
                <th className="border border-gray-300 p-2 text-center w-28">Perolehan Suara</th>
                <th className="border border-gray-300 p-2 text-center w-24">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {tallyData.map((cand, idx) => (
                <tr key={cand.candidateId} className="text-gray-900">
                  <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold font-mono">
                    {cand.candidateNumber === 0 ? '-' : cand.candidateNumber.toString().padStart(2, '0')}
                  </td>
                  <td className="border border-gray-300 p-2 font-medium">
                    {cand.candidateNumber === 0
                      ? 'Kotak Kosong (Abstain Sah)'
                      : `${cand.leaderName} & ${cand.viceLeaderName}`}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-mono font-bold">
                    {cand.voteCount} Suara
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-mono font-bold">
                    {cand.percentage}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold text-gray-900">
                <td colSpan={3} className="border border-gray-300 p-2 text-right">
                  TOTAL SUARA SAH MASUK:
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {totalVotes} Suara
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BAGIAN III: KETETAPAN DAN PENJAMINAN KEAMANAN */}
        <div className="space-y-1.5 pt-2 text-justify text-xs sm:text-[13px]">
          <h4 className="font-bold font-sans text-xs uppercase tracking-wider text-gray-900">
            III. KETETAPAN DAN INTEGRITAS SISTEM
          </h4>
          <p>
            Berdasarkan hasil rekapitulasi suara di atas, pasangan calon{' '}
            <strong>
              {leadingCandidate
                ? leadingCandidate.candidateNumber === 0
                  ? 'Kotak Kosong'
                  : `${leadingCandidate.leaderName} & ${leadingCandidate.viceLeaderName}`
                : '-'}
            </strong>{' '}
            memperoleh akumulasi suara tertinggi sejumlah{' '}
            <strong>{leadingCandidate ? leadingCandidate.voteCount : 0} suara</strong> (
            {leadingCandidate ? leadingCandidate.percentage : 0}%).
          </p>
          <p className="text-[11px] text-gray-600 italic">
            Seluruh surat suara telah diverifikasi secara kriptografis dan disimpan secara anonim tanpa rekaman identitas pemilih ke surat suara (*Ballot Secrecy*), sesuai ketetapan Komisi Pemilihan Raya HMIF Telkom University Purwokerto.
          </p>
        </div>

        {/* BAGIAN IV: TANDA TANGAN PIHAK-PIHAK */}
        <div className="pt-6 font-sans text-xs">
          <p className="text-right text-gray-700 mb-6">
            Purwokerto, {currentDateFormatted}
          </p>
          <div className="grid grid-cols-2 gap-y-10 gap-x-8 text-center">
            <div>
              <p className="font-bold text-gray-800">Ketua Panitia KPR HMIF</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 italic">( Tanda Tangan &amp; Cap )</span>
              </div>
              <p className="font-bold underline text-black">Marzhendo Galang Saputra</p>
              <p className="text-[11px] text-gray-600">NIM. 103112400102</p>
            </div>

            <div>
              <p className="font-bold text-gray-800">Sekretaris KPR HMIF</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
              </div>
              <p className="font-bold underline text-black">Siti Nurhaliza</p>
              <p className="text-[11px] text-gray-600">NIM. 103012400015</p>
            </div>

            <div>
              <p className="font-bold text-gray-800">Saksi Paslon 01</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
              </div>
              <p className="font-bold underline text-black">( ........................................ )</p>
              <p className="text-[11px] text-gray-600">Saksi Mandat Resmi</p>
            </div>

            <div>
              <p className="font-bold text-gray-800">Pengawas Pemira / DPM</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 italic">( Tanda Tangan )</span>
              </div>
              <p className="font-bold underline text-black">( ........................................ )</p>
              <p className="text-[11px] text-gray-600">Dewan Perwakilan Mahasiswa</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="print:hidden bg-surface font-montserrat text-on-surface antialiased min-h-screen flex selection:bg-primary selection:text-on-primary">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col justify-between py-6 border-r border-outline-variant/30 shadow-lg lg:shadow-sm transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo & Title */}
          <div className="px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
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
                <span className="text-[11px] text-outline font-medium">
                  Panel Panitia KPR
                </span>
              </div>
            </div>

            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Tutup navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Badge */}
          <div className="px-6">
            <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center justify-between border border-outline-variant/20">
              <span className="text-[11px] text-outline uppercase font-medium">
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
              onClick={() => {
                setActiveTab('overview');
                setIsSidebarOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('candidates');
                setIsSidebarOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('dpt');
                setIsSidebarOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('tally');
                setIsSidebarOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('settings');
                setIsSidebarOpen(false);
              }}
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
              onClick={() => {
                setActiveTab('emails');
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'emails'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Broadcast Email</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Log</span>
            </button>

            {userRole === 'super_admin' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admins');
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'admins'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span>Kelola Admin</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fetchTally()}
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
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* TOP HEADER BAR */}
        <header className="fixed top-0 lg:left-64 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md z-40 px-4 sm:px-8 flex items-center justify-between border-b border-outline-variant/20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors -ml-1 cursor-pointer"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
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
              <span className="text-[11px] text-outline uppercase">
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
                      <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-on-surface">
                          Bilik Suara Digital Pemira HMIF
                        </h1>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live Real-time</span>
                        </div>
                      </div>
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

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => fetchTally()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs border border-outline-variant/30 transition-colors"
                      title="Segarkan data perolehan suara sekarang"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingTally ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Segarkan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEmergencyModalOpen(true)}
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
                                  <span className="text-[11px] text-outline">
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
                          <span className="text-[11px] text-outline">
                            {allowKotakKosongMulti ? 'Diikutsertakan' : 'Dinonaktifkan'}
                          </span>
                        </div>
                        <button
                          type="button"
                          title={
                            allowKotakKosongMulti
                              ? 'Klik untuk mematikan opsi Kotak Kosong'
                              : 'Klik untuk mengaktifkan opsi Kotak Kosong'
                          }
                          disabled={togglingKotakKosong}
                          onClick={handleToggleKotakKosong}
                          className={`w-11 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                            allowKotakKosongMulti
                              ? 'bg-primary'
                              : 'bg-surface-container-highest border border-outline/30'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white block transition-transform ${
                              allowKotakKosongMulti ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ) : null}
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

                          {/* Leader & Vice Leader with Photo / Avatar */}
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

                          {/* CV status badges */}
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            <span
                              className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                cand.chairman_cv_url
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium'
                                  : 'bg-surface-container-high text-outline border-outline-variant/30'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>{cand.chairman_cv_url ? 'CV Chairman ✓' : 'CV Chairman -'}</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                cand.vice_chairman_cv_url
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium'
                                  : 'bg-surface-container-high text-outline border-outline-variant/30'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>{cand.vice_chairman_cv_url ? 'CV Vice ✓' : 'CV Vice -'}</span>
                            </span>
                          </div>

                          {/* Vision preview */}
                          <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant border border-outline-variant/20">
                            <span className="text-[11px] text-outline uppercase font-semibold block mb-0.5">
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

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary border border-primary/30 transition-colors shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-primary" />
                      <span>+ Pemilih Uji Coba</span>
                    </button>

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
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                        Rekapitulasi Suara
                      </h1>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Live Real-time</span>
                      </span>
                    </div>
                    <p className="text-xs text-outline mt-0.5">
                      Hasil agregasi surat suara yang sah tanpa keterkaitan identitas pemilih.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fetchTally()}
                      disabled={loadingTally}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-outline hover:text-on-surface border border-outline-variant/30 transition-colors"
                      title="Segarkan Perolehan Suara"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingTally ? 'animate-spin text-primary' : ''}`} />
                      <span className="hidden sm:inline">Segarkan</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetDevBallots}
                      disabled={isResettingBallots}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-xs font-semibold text-error border border-error/30 transition-colors"
                      title="Kosongkan Suara Pengujian Simulasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset Suara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsBastModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-bright transition-colors border border-outline-variant/30"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Cetak Berita Acara</span>
                    </button>
                  </div>
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
                          <span className="text-[11px] opacity-80 block mt-0.5">Khusus belum memilih</span>
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
                          <span className="text-[11px] opacity-80 block mt-0.5">Untuk semua DPT</span>
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
                          <span className="text-[11px] opacity-80 block mt-0.5">Tulis bebas</span>
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
                          <span className="text-[11px] text-outline block">
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
                  <div className="hidden lg:block lg:col-span-5 bg-surface-container rounded-3xl p-6 sm:p-7 border border-outline-variant/30 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-outline">
                        Pratinjau Email Mahasiswa
                      </span>
                      <span className="text-[11px] text-outline font-mono">
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
                          <span className="text-[11px] font-bold text-hmif-gold uppercase tracking-widest block">
                            PEMIRA HMIF 2026/2027
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {broadcastHeadline}
                          </h4>
                          <span className="text-[11px] text-neutral-400 block mt-0.5">
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

                        <div className="p-2.5 rounded bg-neutral-900 border-l-2 border-hmif-gold text-[11px] text-neutral-400 leading-normal">
                          🛡️ Kerahasiaan suara dijamin penuh berasaskan LUBER JURDIL (*Ballot Secrecy*).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: AUDIT LOG & REKAM JEJAK SISTEM */}
            {activeTab === 'audit' && (
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
                      <p className="text-xs text-outline mt-0.5">
                        Transparansi penuh seluruh aktivitas konfigurasi, perubahan paslon, DPT, dan aksi administratif panitia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      type="button"
                      disabled={loadingAuditLogs}
                      onClick={() => fetchAuditLogs()}
                      className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold flex items-center gap-1.5 border border-outline-variant/30 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
                      <span>Segarkan Log</span>
                    </button>
                  </div>
                </div>

                {/* Audit Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Total Log</span>
                    <span className="text-xl sm:text-2xl font-bold text-on-surface mt-2 font-mono">
                      {auditStats?.total || auditLogs.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Konfigurasi</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-400 mt-2 font-mono">
                      {auditStats?.settingsCount || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Paslon</span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-2 font-mono">
                      {auditStats?.candidatesCount || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">DPT &amp; Pemilih</span>
                    <span className="text-xl sm:text-2xl font-bold text-amber-400 mt-2 font-mono">
                      {auditStats?.dptCount || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Broadcast</span>
                    <span className="text-xl sm:text-2xl font-bold text-purple-400 mt-2 font-mono">
                      {auditStats?.broadcastCount || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Administrator</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary mt-2 font-mono">
                      {auditStats?.adminCount || 0}
                    </span>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      placeholder="Cari pelaksana, email, atau rincian aksi..."
                      value={auditSearchQuery}
                      onChange={(e) => {
                        setAuditSearchQuery(e.target.value);
                        fetchAuditLogs(auditFilterAction, e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary placeholder:text-outline/60"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-outline shrink-0 ml-1" />
                    <select
                      value={auditFilterAction}
                      onChange={(e) => {
                        setAuditFilterAction(e.target.value);
                        fetchAuditLogs(e.target.value, auditSearchQuery);
                      }}
                      className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer"
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
                        onClick={() => {
                          setAuditFilterAction('all');
                          setAuditSearchQuery('');
                          fetchAuditLogs('all', '');
                        }}
                        className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer"
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
                      <thead className="bg-surface-container-highest/60 text-outline uppercase font-semibold text-[10px] tracking-wider border-b border-outline-variant/20">
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
                            <td colSpan={5} className="py-12 text-center text-outline">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                              <span>Memuat rekam jejak audit...</span>
                            </td>
                          </tr>
                        ) : auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-outline">
                              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-outline/40" />
                              <p className="font-semibold text-sm text-on-surface">Tidak ada log audit yang cocok</p>
                              <p className="text-xs text-outline mt-1">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
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

                            // Badge style per action type
                            let badgeBg = 'bg-surface-container-highest text-outline border-outline-variant/30';
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
                                <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap text-outline">
                                  {formattedTime}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-on-surface">{log.actor_name}</div>
                                  <div className="text-[11px] text-outline font-mono">{log.actor_email}</div>
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-container-highest text-outline">
                                    {log.actor_role.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badgeBg}`}>
                                    {categoryLabel}
                                  </span>
                                  <span className="block text-[10px] text-outline font-mono mt-1">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-medium text-on-surface leading-relaxed max-w-lg">
                                    {log.description}
                                  </div>
                                  {log.details && Object.keys(log.details).length > 0 && (
                                    <details className="mt-1.5 text-[11px] text-outline cursor-pointer">
                                      <summary className="hover:text-primary transition-colors select-none font-semibold">
                                        Rincian Parameter
                                      </summary>
                                      <pre className="mt-1.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 font-mono text-[10px] text-on-surface overflow-x-auto max-w-md">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono text-[11px] text-outline whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1">
                                    <Shield className="w-3 h-3 text-outline/60" />
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
            )}

            {/* TAB 8: MANAJEMEN ADMIN (SUPERADMIN ONLY) */}
            {activeTab === 'admins' && (
              <div className="space-y-6">
                {userRole !== 'super_admin' ? (
                  <div className="p-8 rounded-2xl bg-surface-container border border-error/30 text-center max-w-xl mx-auto space-y-3">
                    <ShieldAlert className="w-12 h-12 text-error mx-auto" />
                    <h3 className="text-base font-bold text-on-surface">Akses Dibatasi Khusus Superadmin</h3>
                    <p className="text-xs text-outline leading-relaxed">
                      Wewenang penambahan panitia dan pembagian peran hanya dapat dikelola langsung oleh akun Superadmin utama (<span className="text-primary font-mono">marzhendogalangs@gmail.com</span>).
                    </p>
                  </div>
                ) : (
                  <>
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
                          <p className="text-xs text-outline mt-0.5">
                            Kontrol otorisasi peran panitia Komisi Pemilihan Raya (KPR), Auditor Independen (DPM), dan Superadmin.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setAdminErrorMessage(null);
                            setAdminModalOpen(true);
                          }}
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
                          onClick={() => setAdminActionMessage(null)}
                          className="text-emerald-400 hover:opacity-80 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
                        <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">Total Pengelola</span>
                        <span className="text-2xl font-bold text-on-surface mt-2 block font-mono">
                          {adminStats?.total || adminUsers.length}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
                        <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">Superadmin</span>
                        <span className="text-2xl font-bold text-primary mt-2 block font-mono">
                          {adminStats?.superAdminCount || 0}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
                        <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">Panitia KPR</span>
                        <span className="text-2xl font-bold text-blue-400 mt-2 block font-mono">
                          {adminStats?.kprAdminCount || 0}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
                        <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block">Auditor Independen</span>
                        <span className="text-2xl font-bold text-purple-400 mt-2 block font-mono">
                          {adminStats?.auditorCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Table of Admins */}
                    <div className="rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface-container-highest/60 text-outline uppercase font-semibold text-[10px] tracking-wider border-b border-outline-variant/20">
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
                                <td colSpan={5} className="py-12 text-center text-outline">
                                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                                  <span>Memuat daftar administrator...</span>
                                </td>
                              </tr>
                            ) : adminUsers.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-outline">
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
                                        <div className="text-[11px] text-outline font-mono mt-0.5">
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
                                            handleUpdateAdminRole(
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
                                        onClick={() => handleToggleAdminStatus(admin)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                          admin.is_active
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                            : 'bg-outline/10 text-outline border border-outline/30 hover:bg-outline/20'
                                        } ${isPrimarySuperadmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-emerald-400' : 'bg-outline'}`} />
                                        <span>{admin.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                      </button>
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                      {!isPrimarySuperadmin && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteAdminUser(admin)}
                                          className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
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
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL TAMBAH / EDIT PASANGAN CALON */}
      {candidateModalOpen && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !savingCandidate) {
                setCandidateModalOpen(false);
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 max-h-[calc(100dvh-2rem)] min-h-0 overflow-y-auto my-auto animate-in zoom-in-95 duration-150"
              >
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
                aria-label="Tutup formulir paslon"
                className="w-11 h-11 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
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

              {/* Banner Kesalahan Unggah Berkas */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
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
                  <label className="text-[11px] font-bold text-outline uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Foto Pasangan Calon</span>
                  </label>
                  <span className="text-[11px] text-outline">Maks. 5 MB (.png, .jpg, .webp)</span>
                </div>

                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFile(f, 'candidates', (url) => setCandidateFormPhotoUrl(url), setUploadingPhoto);
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
                      <span className="text-[11px] text-outline block truncate font-mono mt-0.5">
                        {candidateFormPhotoUrl}
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={() => photoFileInputRef.current?.click()}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
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
                        <span className="text-outline text-[11px]">•</span>
                        <button
                          type="button"
                          onClick={() => setCandidateFormPhotoUrl('')}
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
                          <span className="text-[11px] text-outline">
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
                  <label className="text-[11px] font-bold text-outline uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Berkas CV Pasangan Calon (PDF)</span>
                  </label>
                  <span className="text-[11px] text-outline">Maks. 10 MB per berkas</span>
                </div>

                {/* CV Chairman */}
                <input
                  ref={chairmanCvFileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFile(f, 'cv', (url) => setCandidateFormChairmanCvUrl(url), setUploadingChairmanCv);
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
                      <span className="text-[11px] text-outline block">
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
                          onClick={() => setCandidateFormChairmanCvUrl(null)}
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
                    if (f) handleUploadFile(f, 'cv', (url) => setCandidateFormViceChairmanCvUrl(url), setUploadingViceChairmanCv);
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
                      <span className="text-[11px] text-outline block">
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
                          onClick={() => setCandidateFormViceChairmanCvUrl(null)}
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
      </div>
    </Portal>
    )}

      {/* MODAL KUNCI DARURAT */}
      {isEmergencyModalOpen && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !settingsSaving) {
                setIsEmergencyModalOpen(false);
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
              >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-error">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Kunci Darurat Bilik Suara
                  </h3>
                  <span className="text-[11px] text-outline uppercase tracking-wider">
                    Tindakan Darurat
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                aria-label="Tutup kunci darurat"
                className="w-11 h-11 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
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
      </div>
    </Portal>
    )}

      {/* MODAL KONFIRMASI BROADCAST EMAIL */}
      {isConfirmBroadcastOpen && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isBroadcasting) {
                setIsConfirmBroadcastOpen(false);
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
              >
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

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={() => setIsConfirmBroadcastOpen(false)}
                className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer flex items-center justify-center"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isBroadcasting}
                onClick={handleExecuteBroadcast}
                className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary text-on-primary hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
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
      </div>
    </Portal>
    )}

      {/* MODAL TAMBAH PEMILIH UJI COBA (EMAIL PENGUJIAN) */}
      {isQuickAddModalOpen && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !quickAddLoading) {
                setIsQuickAddModalOpen(false);
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
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
                      <p className="text-[11px] text-outline">
                        Gunakan email aktif sendiri untuk menguji pengiriman OTP &amp; Broadcast.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddModalOpen(false)}
                    className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {quickAddError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
                    {quickAddError}
                  </div>
                )}

                <form onSubmit={handleQuickAddVoter} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      NIM Mahasiswa <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 103012399001"
                      value={quickAddNim}
                      onChange={(e) => setQuickAddNim(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      Nama Mahasiswa <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Penguji E-Voting"
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      Email Tujuan (Email Pengujian Anda) <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Contoh: namaanda@gmail.com / kampus"
                      value={quickAddEmail}
                      onChange={(e) => setQuickAddEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                    <span className="text-[10px] text-outline mt-1 block">
                      Masukkan email riil yang bisa Anda buka di inbox untuk memverifikasi penerimaan surat.
                    </span>
                  </div>

                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      Angkatan
                    </label>
                    <select
                      value={quickAddGeneration}
                      onChange={(e) => setQuickAddGeneration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      disabled={quickAddLoading}
                      onClick={() => setIsQuickAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={quickAddLoading}
                      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
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
      )}

      {/* MODAL TAMBAH ADMINISTRATOR BARU */}
      {adminModalOpen && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !adminSaving) {
                setAdminModalOpen(false);
              }
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 my-auto animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">Tambah Administrator Baru</h3>
                      <p className="text-xs text-outline mt-0.5">Berikan hak akses panitia atau auditor Pemira.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
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

                <form onSubmit={handleSaveAdminUser} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      Nama Lengkap Administrator <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Dimas Wahyu Pratama"
                      value={adminFormName}
                      onChange={(e) => setAdminFormName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      Email SSO Kampus / Akun <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Contoh: dimas@student.telkomuniversity.ac.id"
                      value={adminFormEmail}
                      onChange={(e) => setAdminFormEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                    <span className="text-[10px] text-outline mt-1 block">
                      Email ini digunakan untuk login SSO / OTP ke bilik dan dashboard.
                    </span>
                  </div>

                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      NIM (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 103012300088"
                      value={adminFormNim}
                      onChange={(e) => setAdminFormNim(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-outline font-semibold mb-1">
                      Wewenang &amp; Peran (Role) <span className="text-error">*</span>
                    </label>
                    <select
                      value={adminFormRole}
                      onChange={(e) => setAdminFormRole(e.target.value as 'kpr_admin' | 'auditor' | 'super_admin')}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
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
                      onClick={() => setAdminModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={adminSaving}
                      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
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
      )}

      {/* Modal Pratinjau Dokumen Berita Acara (BAST) */}
      {isBastModalOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
            onClick={() => setIsBastModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-white text-black rounded-2xl shadow-2xl overflow-hidden my-auto border border-gray-300 flex flex-col max-h-[90vh]"
            >
              {/* Controls Bar Atas */}
              <div className="bg-gray-100 px-6 py-3.5 border-b border-gray-300 flex items-center justify-between text-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-sm">Pratinjau Berita Acara Rekapitulasi Suara (BAST)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak / Simpan PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBastModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Dokumen Paper Preview */}
              <div className="p-8 sm:p-12 overflow-y-auto font-serif text-[13px] leading-relaxed text-black bg-white">
                {renderBeritaAcaraContent()}
              </div>

              {/* Controls Bar Bawah */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
                <span>Dokumen sah Komisi Pemilihan Raya HMIF Telkom University Purwokerto</span>
                <button
                  type="button"
                  onClick={() => setIsBastModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>

    {/* Dokumen Bersih Khusus Cetak Kertas A4 (Print-Only) */}
    <div className="hidden print:block bg-white text-black font-serif text-[12px] leading-relaxed p-6">
      {renderBeritaAcaraContent()}
    </div>
  </>
  );
}
