'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  BarChart3,
  History,
  LogOut,
  Mail,
  Menu,
  PieChart,
  RefreshCw,
  Settings,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminUserItem,
  AuditLogItem,
  CandidateItem,
  DashboardTabId,
  GenerationTurnout,
  TallyItem,
  ToggleModalConfig,
  VoterRow,
} from '@/components/admin/types';
import {
  formatDateTimeLocal,
  getElectionSystemStatus,
} from '@/components/admin/election-status-helper';
import { BastPrintableReport } from '@/components/admin/bast-printable-report';
import { OverviewTab } from '@/components/admin/tabs/overview-tab';
import { CandidatesTab } from '@/components/admin/tabs/candidates-tab';
import { DptTab } from '@/components/admin/tabs/dpt-tab';
import { TallyTab } from '@/components/admin/tabs/tally-tab';
import { SettingsTab } from '@/components/admin/tabs/settings-tab';
import { BroadcastTab } from '@/components/admin/tabs/broadcast-tab';
import { AuditLogsTab } from '@/components/admin/tabs/audit-logs-tab';
import { AdminsTab } from '@/components/admin/tabs/admins-tab';
import { CandidateFormModal } from '@/components/admin/modals/candidate-form-modal';
import {
  BroadcastConfirmModal,
  type BroadcastProgressState,
  EmergencyLockModal,
  ToggleSettingConfirmModal,
} from '@/components/admin/modals/settings-and-broadcast-modals';
import {
  BatchDeleteVotersModal,
  DeleteVoterModal,
  GenerateBatchPasswordsModal,
  QuickAddVoterModal,
  ResetDptModal,
  type ResetDptMode,
} from '@/components/admin/modals/dpt-action-modals';
import { AddAdminModal } from '@/components/admin/modals/admin-management-modal';
import { BastPreviewModal } from '@/components/admin/modals/bast-preview-modal';

export default function AdminDashboardPage() {
  // Active navigation tab
  const [activeTab, setActiveTab] = useState<DashboardTabId>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Admin user & roles
  const [userRole, setUserRole] = useState<string>('kpr_admin');
  const [userName, setUserName] = useState<string>('Panitia KPR HMIF');

  // Tally & Election Data
  const [loadingTally, setLoadingTally] = useState(true);
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
  const [candidateFormIsActive, setCandidateFormIsActive] = useState<boolean>(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingChairmanCv, setUploadingChairmanCv] = useState(false);
  const [uploadingViceChairmanCv, setUploadingViceChairmanCv] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [allowKotakKosongMulti, setAllowKotakKosongMulti] = useState(true);
  const [togglingKotakKosong, setTogglingKotakKosong] = useState(false);
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [candidateActionMessage, setCandidateActionMessage] = useState<string | null>(null);

  // Candidate Photo Framing Editor State
  const [photoToFrame, setPhotoToFrame] = useState<string | null>(null);
  const [isPhotoFrameModalOpen, setIsPhotoFrameModalOpen] = useState(false);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const chairmanCvFileInputRef = useRef<HTMLInputElement>(null);
  const viceChairmanCvFileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [isVotingOpen, setIsVotingOpen] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [savedStartTime, setSavedStartTime] = useState<string>('');
  const [savedEndTime, setSavedEndTime] = useState<string>('');
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsReason, setSettingsReason] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const isScheduleDirty = Boolean(
    savedStartTime &&
      savedEndTime &&
      (startTime !== savedStartTime || endTime !== savedEndTime)
  );
  const isScheduleDirtyRef = useRef(false);
  isScheduleDirtyRef.current = isScheduleDirty;

  // Emergency Modal State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Jeda Teknis Terjadwal');

  // Sakelar Bilik Suara & Maintenance Confirmation Modal
  const [toggleModalConfig, setToggleModalConfig] = useState<ToggleModalConfig | null>(null);
  const [toggleReason, setToggleReason] = useState<string>('');

  // Broadcast Email State
  const [broadcastTargetGroup, setBroadcastTargetGroup] = useState<'not_voted' | 'all' | 'voted' | 'failed_email' | 'uncontacted'>('not_voted');
  const [broadcastGeneration, setBroadcastGeneration] = useState('all');
  const [broadcastTemplate, setBroadcastTemplate] = useState<'credentials' | 'reminder' | 'invitation' | 'custom'>('credentials');
  const [broadcastSubject, setBroadcastSubject] = useState('[Pemira HMIF] Hari Pemilihan: Kata Sandi & Akses Bilik Suara');
  const [broadcastHeadline, setBroadcastHeadline] = useState('Bilik Suara Dibuka Hari Ini: Berikan Suaramu');
  const [broadcastBody, setBroadcastBody] = useState(
    'Pemilihan Raya Chairman dan Vice Chairman HMIF periode 2026/2027 resmi dibuka hari ini, Rabu, 25 November 2026.\n\nBilik suara digital dapat diakses mulai pukul 08.00 hingga 16.30 WIB. Gunakan NIM dan kata sandi unik di bawah untuk masuk ke bilik suara.\n\nSatu kata sandi hanya berlaku untuk satu kali memilih. Jaga kerahasiaan kata sandi ini dan jangan berikan kepada siapa pun.'
  );
  const [broadcastCtaText, setBroadcastCtaText] = useState('Buka Bilik Suara');
  const [broadcastCtaUrl, setBroadcastCtaUrl] = useState('/login');
  const [broadcastTargetCount, setBroadcastTargetCount] = useState<number | null>(null);
  const [loadingBroadcastCount, setLoadingBroadcastCount] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ totalTarget: number; sentCount: number; failedCount: number } | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [isConfirmBroadcastOpen, setIsConfirmBroadcastOpen] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<BroadcastProgressState | null>(null);

  // DPT Management State
  const [voters, setVoters] = useState<VoterRow[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [voterTotalCount, setVoterTotalCount] = useState(0);
  const [dptPage, setDptPage] = useState(1);
  const [dptPageSize, setDptPageSize] = useState(50);
  const [dptTotalPages, setDptTotalPages] = useState(1);
  const [isGenerateBatchModalOpen, setIsGenerateBatchModalOpen] = useState(false);
  const [passwordStats, setPasswordStats] = useState<{
    total: number;
    hasPassword: number;
    pending: number;
    byGeneration: Array<{ generation: number; total: number; hasPassword: number; pending: number }>;
  } | null>(null);
  const [loadingPasswordStats, setLoadingPasswordStats] = useState(false);

  // Daftar angkatan unik secara dinamis dari DPT aktif (dengan fallback 2019-2026 jika data belum dimuat)
  const availableGenerations = useMemo(() => {
    const gens = new Set<number>();
    if (generationData && generationData.length > 0) {
      generationData.forEach((g) => {
        if (g.generation && g.generation > 2000) gens.add(g.generation);
      });
    }
    if (voters && voters.length > 0) {
      voters.forEach((v) => {
        if (v.generation && v.generation > 2000) gens.add(v.generation);
      });
    }
    if (gens.size === 0) {
      [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].forEach((g) => gens.add(g));
    }
    return Array.from(gens).sort((a, b) => a - b);
  }, [generationData, voters]);

  // DPT Import Staging
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    totalRows: number;
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
    validRows: Array<{ nim: string; name: string; email: string; generation: number }>;
    sampleErrors?: Array<unknown>;
    databaseConflictsSample?: Array<unknown>;
  } | null>(null);
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

  // State Hapus Selektif & Reset DPT (Khusus Superadmin)
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);
  const [voterToDelete, setVoterToDelete] = useState<VoterRow | null>(null);
  const [isDeletingSingleVoter, setIsDeletingSingleVoter] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isDeletingBatchVoters, setIsDeletingBatchVoters] = useState(false);
  const [isResetDptModalOpen, setIsResetDptModalOpen] = useState(false);
  const [resetDptMode, setResetDptMode] = useState<ResetDptMode>('reset_to_default');
  const [resetDptConfirmText, setResetDptConfirmText] = useState('');
  const [isResettingDpt, setIsResettingDpt] = useState(false);
  const [dptActionMessage, setDptActionMessage] = useState<string | null>(null);
  const [dptErrorMessage, setDptErrorMessage] = useState<string | null>(null);
  const [isGeneratingPasswords, setIsGeneratingPasswords] = useState(false);
  const [resendingPasswordNim, setResendingPasswordNim] = useState<string | null>(null);

  // State Reset Ballots Simulasi
  const [isResettingBallots, setIsResettingBallots] = useState(false);

  // State Modal Pratinjau Berita Acara (BAST) & Verifikasi Digital
  const [isBastModalOpen, setIsBastModalOpen] = useState(false);
  const [bastQrDataUrl, setBastQrDataUrl] = useState<string>('');
  const [bastIntegrityHash, setBastIntegrityHash] = useState<string>('');

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
      Boolean(toggleModalConfig) ||
      isConfirmBroadcastOpen ||
      isSidebarOpen ||
      isQuickAddModalOpen ||
      adminModalOpen ||
      voterToDelete !== null ||
      isBatchDeleteModalOpen ||
      isResetDptModalOpen;
    if (shouldLock) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isConfirmBroadcastOpen && !isBroadcasting) {
            setIsConfirmBroadcastOpen(false);
            setBroadcastProgress(null);
          }
          else if (toggleModalConfig && !settingsSaving) setToggleModalConfig(null);
          else if (isEmergencyModalOpen && !settingsSaving) setIsEmergencyModalOpen(false);
          else if (candidateModalOpen && !savingCandidate && !uploadingPhoto && !uploadingChairmanCv && !uploadingViceChairmanCv) setCandidateModalOpen(false);
          else if (isQuickAddModalOpen && !quickAddLoading) setIsQuickAddModalOpen(false);
          else if (adminModalOpen && !adminSaving) setAdminModalOpen(false);
          else if (voterToDelete && !isDeletingSingleVoter) setVoterToDelete(null);
          else if (isBatchDeleteModalOpen && !isDeletingBatchVoters) setIsBatchDeleteModalOpen(false);
          else if (isResetDptModalOpen && !isResettingDpt) setIsResetDptModalOpen(false);
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
    toggleModalConfig,
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
    voterToDelete,
    isDeletingSingleVoter,
    isBatchDeleteModalOpen,
    isDeletingBatchVoters,
    isResetDptModalOpen,
    isResettingDpt,
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

  const applyServerSettings = useCallback((settings: {
    isVotingOpen?: boolean;
    maintenanceMode?: boolean;
    startTime?: string;
    endTime?: string;
    allowKotakKosongMulti?: boolean;
  }) => {
    if (settings.isVotingOpen !== undefined) setIsVotingOpen(settings.isVotingOpen);
    if (settings.maintenanceMode !== undefined) setMaintenanceMode(settings.maintenanceMode);
    if (settings.allowKotakKosongMulti !== undefined) {
      setAllowKotakKosongMulti(settings.allowKotakKosongMulti);
    }

    const formattedStart = settings.startTime ? formatDateTimeLocal(settings.startTime) : '';
    const formattedEnd = settings.endTime ? formatDateTimeLocal(settings.endTime) : '';
    if (formattedStart) setSavedStartTime(formattedStart);
    if (formattedEnd) setSavedEndTime(formattedEnd);

    if (!isScheduleDirtyRef.current) {
      if (formattedStart) setStartTime(formattedStart);
      if (formattedEnd) setEndTime(formattedEnd);
    }
    setLoadingSchedule(false);
  }, []);

  const fetchElectionSettings = useCallback(() => {
    fetch('/api/admin/election-settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          applyServerSettings({
            isVotingOpen: data.settings.is_voting_open,
            maintenanceMode: data.settings.maintenance_mode,
            startTime: data.settings.start_time,
            endTime: data.settings.end_time,
            allowKotakKosongMulti: data.settings.allow_kotak_kosong_multi,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSchedule(false));
  }, [applyServerSettings]);

  // 2. Muat data Tally & Turnout
  const fetchTally = useCallback((silent = false) => {
    if (!silent) setLoadingTally(true);

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
          applyServerSettings(data.electionSettings);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!silent) setLoadingTally(false);
      });
  }, [applyServerSettings]);

  useEffect(() => {
    fetchElectionSettings();
  }, [fetchElectionSettings]);

  useEffect(() => {
    fetchTally();
    if (activeTab === 'settings') {
      fetchElectionSettings();
    }

    // Auto-polling real-time setiap 15 detik saat tab Overview atau Tally aktif
    if (activeTab === 'overview' || activeTab === 'tally') {
      const pollTimer = setInterval(() => {
        fetchTally(true);
      }, 15000);
      return () => clearInterval(pollTimer);
    }
  }, [fetchTally, fetchElectionSettings, activeTab]);

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
  const fetchVoters = useCallback((page = dptPage, limit = dptPageSize) => {
    setLoadingVoters(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedGeneration !== 'all') params.set('generation', selectedGeneration);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    params.set('page', String(page));
    params.set('limit', String(limit));

    fetch(`/api/admin/dpt?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setVoters(data.voters || []);
          setVoterTotalCount(data.total || 0);
          setDptTotalPages(data.totalPages || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVoters(false));
  }, [searchQuery, selectedGeneration, selectedStatus, dptPage, dptPageSize]);

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

  // 7. Hitung Hash Integritas BAST & Buat QR Code Verifikasi Publik
  useEffect(() => {
    let isMounted = true;
    const generateBastVerification = async () => {
      try {
        if (!window.crypto?.subtle) return;
        const sortedByNumber = tallyData.toSorted((a, b) => a.candidateNumber - b.candidateNumber);
        const payload = JSON.stringify({
          totalDpt,
          totalVotes,
          tally: sortedByNumber.map((t) => ({ no: t.candidateNumber, votes: t.voteCount })),
        });

        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        if (!isMounted) return;
        setBastIntegrityHash(hashHex);

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const verifyUrl = `${origin}/bast/verify?hash=${hashHex}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 140,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        if (isMounted) {
          setBastQrDataUrl(qrDataUrl);
        }
      } catch (err) {
        console.error('Gagal men-generate QR BAST:', err);
      }
    };

    generateBastVerification();

    return () => {
      isMounted = false;
    };
  }, [totalDpt, totalVotes, tallyData]);

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
    const regularList = candidates.filter((c) => c.candidate_number > 0);
    const nextNumber = regularList.length > 0
      ? Math.max(...regularList.map((c) => c.candidate_number)) + 1
      : 1;

    setEditingCandidate(null);
    setCandidateFormNumber(nextNumber);
    setCandidateFormLeader('');
    setCandidateFormViceLeader('');
    setCandidateFormPhotoUrl('');
    setCandidateFormChairmanCvUrl(null);
    setCandidateFormViceChairmanCvUrl(null);
    setCandidateFormIsActive(true);
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
    setCandidateFormIsActive(candidate.is_active !== false);
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

  // Callback saat admin menyetujui hasil framing foto paslon (rasio 4:3)
  const handleFramedPhotoConfirm = async (croppedFile: File) => {
    await handleUploadFile(
      croppedFile,
      'candidates',
      (url) => {
        setCandidateFormPhotoUrl(url);
        setIsPhotoFrameModalOpen(false);
        setPhotoToFrame(null);
      },
      setUploadingPhoto
    );
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
      is_active: candidateFormIsActive,
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

  // Toggle Candidate Active / Inactive
  const handleToggleCandidateActive = async (candidate: CandidateItem) => {
    const nextState = candidate.is_active === false;
    const actionLabel = nextState ? 'mengaktifkan' : 'menonaktifkan';
    if (
      !confirm(
        `Apakah Anda yakin ingin ${actionLabel} Paslon ${candidate.candidate_number} (${candidate.leader_name})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: candidate.id,
          candidate_number: candidate.candidate_number,
          leader_name: candidate.leader_name,
          vice_leader_name: candidate.vice_leader_name,
          vision: candidate.vision,
          mission: candidate.mission,
          photo_url: candidate.photo_url,
          chairman_cv_url: candidate.chairman_cv_url,
          vice_chairman_cv_url: candidate.vice_chairman_cv_url,
          is_active: nextState,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || `Gagal ${actionLabel} calon.`);
      } else {
        setCandidateActionMessage(
          `✓ Paslon ${candidate.candidate_number} berhasil di-${nextState ? 'aktifkan' : 'nonaktifkan'}.`
        );
        fetchCandidates();
      }
    } catch {
      alert(`Terjadi kesalahan jaringan saat ${actionLabel} calon.`);
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
        if (data.code === 'CANDIDATE_HAS_BALLOTS') {
          alert(
            `Kandidat Paslon ${candidate.candidate_number} tidak dapat dihapus permanen karena sudah memiliki surat suara sah yang tercatat di bilik suara.\n\nDemi menjaga integritas dan transparansi audit pemilihan, silakan nonaktifkan status kandidat melalui tombol "Nonaktifkan" untuk mengarsipkan paslon.`
          );
        } else {
          alert(data.error || 'Gagal menghapus calon.');
        }
      } else {
        setCandidateActionMessage('✓ Pasangan calon berhasil dihapus.');
        fetchCandidates();
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menghapus calon.');
    }
  };

  const handleResetScheduleDraft = () => {
    if (savedStartTime) setStartTime(savedStartTime);
    if (savedEndTime) setEndTime(savedEndTime);
    setSettingsMessage(null);
  };

  // Handle Simpan Pengaturan Pemilihan & Jadwal
  const handleSaveSettings = async (
    newVotingOpen: boolean,
    newMaintenance: boolean,
    newStartTime: string,
    newEndTime: string,
    reasonText: string
  ) => {
    const startDate = new Date(newStartTime);
    const endDate = new Date(newEndTime);
    if (!newStartTime || !newEndTime || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setSettingsMessage('❌ Waktu mulai dan penutupan pemilihan wajib diisi dengan format yang valid.');
      return { success: false, error: 'Format waktu tidak valid.' };
    }
    if (startDate >= endDate) {
      setSettingsMessage('❌ Waktu mulai pemilihan harus lebih awal daripada waktu penutupan.');
      return { success: false, error: 'Urutan waktu tidak valid.' };
    }

    const trimmedReason = reasonText.trim();
    if (trimmedReason.length > 0 && trimmedReason.length < 3) {
      setSettingsMessage('❌ Jika diisi, catatan audit minimal terdiri dari 3 karakter.');
      return { success: false, error: 'Alasan terlalu pendek.' };
    }

    setSettingsSaving(true);
    setSettingsMessage(null);

    try {
      const res = await fetch('/api/admin/election-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isVotingOpen: newVotingOpen,
          maintenanceMode: newMaintenance,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          reason: trimmedReason || 'Pembaruan jadwal dan status pemilihan via dashboard KPR',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSettingsMessage(`❌ ${data.error || 'Gagal menyimpan pengaturan.'}`);
        return { success: false, error: data.error };
      } else {
        const nextStart = data.settings.start_time ? formatDateTimeLocal(data.settings.start_time) : newStartTime;
        const nextEnd = data.settings.end_time ? formatDateTimeLocal(data.settings.end_time) : newEndTime;
        setIsVotingOpen(data.settings.is_voting_open);
        setMaintenanceMode(data.settings.maintenance_mode);
        if (nextStart) {
          setSavedStartTime(nextStart);
          setStartTime(nextStart);
        }
        if (nextEnd) {
          setSavedEndTime(nextEnd);
          setEndTime(nextEnd);
        }
        setSettingsMessage('✓ Pengaturan jadwal dan bilik suara berhasil diperbarui.');
        setIsEmergencyModalOpen(false);
        fetchTally(true);
        return { success: true, settings: data.settings };
      }
    } catch {
      setSettingsMessage('❌ Terjadi kesalahan jaringan saat memperbarui pengaturan.');
      return { success: false, error: 'Terjadi kesalahan jaringan.' };
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleOpenVotingToggleModal = () => {
    const target = !isVotingOpen;
    const defaultReason = target
      ? 'Pembukaan resmi bilik suara digital oleh Administrator'
      : 'Penutupan sementara bilik suara digital oleh Administrator';
    setToggleModalConfig({
      type: 'voting_open',
      targetValue: target,
      title: target ? 'Buka Pemungutan Suara' : 'Tutup Pemungutan Suara',
      description: target
        ? 'Membuka bilik suara digital akan mengizinkan pemilih terdaftar (DPT) untuk memberikan suaranya sesuai jadwal pemilihan.'
        : 'Menutup bilik suara digital akan menghentikan proses pengiriman suara bagi seluruh pemilih hingga bilik dibuka kembali.',
      defaultReason,
      isDanger: !target,
    });
    setToggleReason(defaultReason);
  };

  const handleOpenMaintenanceToggleModal = () => {
    const target = !maintenanceMode;
    const defaultReason = target
      ? 'Pemeliharaan darurat teknis sistem oleh Superadmin'
      : 'Pemeliharaan teknis darurat selesai, operasional sistem dipulihkan';
    setToggleModalConfig({
      type: 'maintenance_mode',
      targetValue: target,
      title: target ? 'Aktifkan Mode Pemeliharaan Darurat' : 'Nonaktifkan Mode Pemeliharaan Darurat',
      description: target
        ? 'Mengaktifkan mode pemeliharaan darurat akan menghentikan akses bilik suara seketika untuk perbaikan teknis sistem.'
        : 'Menonaktifkan mode pemeliharaan darurat akan memulihkan operasional bilik suara ke kondisi normal.',
      defaultReason,
      isDanger: target,
    });
    setToggleReason(defaultReason);
  };

  const handleConfirmToggle = async () => {
    if (!toggleModalConfig) return;
    const reasonToUse = toggleReason.trim() || toggleModalConfig.defaultReason;

    const newVotingOpen = toggleModalConfig.type === 'voting_open' ? toggleModalConfig.targetValue : isVotingOpen;
    const newMaintenance = toggleModalConfig.type === 'maintenance_mode' ? toggleModalConfig.targetValue : maintenanceMode;

    const result = await handleSaveSettings(newVotingOpen, newMaintenance, startTime, endTime, reasonToUse);
    if (result?.success) {
      setToggleModalConfig(null);
    }
  };

  // Broadcast Email Handlers
  const handleSelectTemplate = (templateKey: 'credentials' | 'reminder' | 'invitation' | 'custom') => {
    setBroadcastTemplate(templateKey);
    setBroadcastResult(null);
    setBroadcastError(null);

    if (templateKey === 'credentials') {
      setBroadcastTargetGroup('not_voted');
      setBroadcastSubject('[Pemira HMIF] Hari Pemilihan: Kata Sandi & Akses Bilik Suara');
      setBroadcastHeadline('Bilik Suara Dibuka Hari Ini: Berikan Suaramu');
      setBroadcastBody(
        'Pemilihan Raya Chairman dan Vice Chairman HMIF periode 2026/2027 resmi dibuka hari ini, Rabu, 25 November 2026.\n\nBilik suara digital dapat diakses mulai pukul 08.00 hingga 16.30 WIB. Gunakan NIM dan kata sandi unik di bawah untuk masuk ke bilik suara.\n\nSatu kata sandi hanya berlaku untuk satu kali memilih. Jaga kerahasiaan kata sandi ini dan jangan berikan kepada siapa pun.'
      );
      setBroadcastCtaText('Buka Bilik Suara Digital');
      setBroadcastCtaUrl('/login');
    } else if (templateKey === 'reminder') {
      setBroadcastTargetGroup('not_voted');
      setBroadcastSubject('[Pengingat] Pemungutan Suara Pemira HMIF Sedang Berlangsung');
      setBroadcastHeadline('Gunakan Hak Suaramu Sebelum Pukul 16.30 WIB');
      setBroadcastBody(
        'Pemilihan Raya Chairman dan Vice Chairman HMIF periode 2026/2027 sedang berlangsung hari ini.\n\nBerdasarkan data DPT, kamu tercatat belum menggunakan hak suara. Pemilihan dilakukan secara online dan hanya memerlukan waktu sekitar 1 menit.\n\nBuka bilik suara melalui tautan di bawah, lalu masuk menggunakan NIM dan kata sandi unik yang telah dikirimkan ke email kampusmu.'
      );
      setBroadcastCtaText('Masuk ke Bilik Suara');
      setBroadcastCtaUrl('/login');
    } else if (templateKey === 'invitation') {
      setBroadcastTargetGroup('all');
      setBroadcastSubject('[Pemira HMIF 2026/2027] Bilik Suara Digital Resmi Dibuka');
      setBroadcastHeadline('Pemungutan Suara Pemira HMIF Resmi Dibuka');
      setBroadcastBody(
        'Pemilihan Raya Chairman dan Vice Chairman HMIF periode 2026/2027 resmi dibuka hari ini, Rabu, 25 November 2026.\n\nSeluruh mahasiswa aktif Informatika Telkom University Purwokerto yang terdaftar dalam DPT berhak memberikan suara. Bilik suara digital dibuka hingga pukul 16.30 WIB.\n\nSilakan masuk ke website pemilihan menggunakan NIM dan kata sandi unik yang telah dikirimkan ke email kampusmu.'
      );
      setBroadcastCtaText('Masuk ke Bilik Suara');
      setBroadcastCtaUrl('/login');
    } else {
      setBroadcastSubject('[Pengumuman] Pemira HMIF 2026/2027');
      setBroadcastHeadline('Informasi Panitia Pemira HMIF');
      setBroadcastBody('Tuliskan isi pengumuman atau instruksi resmi Panitia KPR di sini...');
      setBroadcastCtaText('Buka Bilik Suara');
      setBroadcastCtaUrl('/login');
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

  const handleExecuteBroadcast = async (overrideTargetGroup?: 'not_voted' | 'all' | 'voted' | 'failed_email' | 'uncontacted') => {
    const activeTarget = overrideTargetGroup || broadcastTargetGroup;
    setIsBroadcasting(true);
    setBroadcastError(null);
    setBroadcastResult(null);

    const targetTotal =
      overrideTargetGroup === 'failed_email' && broadcastProgress?.failed
        ? broadcastProgress.failed
        : (broadcastTargetCount || 0);
    setBroadcastProgress({
      current: 0,
      total: targetTotal,
      sent: 0,
      failed: 0,
      percentage: 0,
      statusText: 'Mempersiapkan antrean pengiriman email...',
      isComplete: false,
    });

    const CHUNK_LIMIT = 20;
    let offset = 0;
    let currentLastNim: string | undefined = undefined;
    let cumulativeSent = 0;
    let cumulativeFailed = 0;
    let hasMore = true;
    let actualTotal = targetTotal;

    try {
      while (hasMore) {
        const isLast = actualTotal > 0 && offset + CHUNK_LIMIT >= actualTotal;
        const res: Response = await fetch('/api/admin/broadcast-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetGroup: activeTarget,
            generation: broadcastGeneration,
            template: broadcastTemplate,
            includeCredentials: broadcastTemplate === 'credentials',
            subject: broadcastSubject,
            headline: broadcastHeadline,
            bodyText: broadcastBody,
            ctaText: broadcastCtaText,
            ctaUrl: broadcastCtaUrl || '/login',
            offset,
            limit: CHUNK_LIMIT,
            lastNim: currentLastNim,
            isLastChunk: isLast,
            accumulatedStats: {
              sent: cumulativeSent,
              failed: cumulativeFailed,
            },
          }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memproses pengiriman batch email.');
        }

        if (!currentLastNim && data.stats.totalTarget > 0) {
          actualTotal = data.stats.totalTarget;
        }
        cumulativeSent += data.stats.chunkSent;
        cumulativeFailed += data.stats.chunkFailed;
        const currentProcessed = Math.min(offset + data.stats.processedCount, actualTotal);
        const percent = actualTotal > 0 ? Math.min(100, Math.round((currentProcessed / actualTotal) * 100)) : 100;

        hasMore = data.stats.hasMore;
        offset = data.stats.nextOffset;
        currentLastNim = data.stats.lastNim || undefined;

        const nextBatchStart = Math.min(offset + 1, actualTotal);
        const nextBatchEnd = Math.min(offset + CHUNK_LIMIT, actualTotal);
        const chunkLastError = data.stats.failedRecipients?.length > 0
          ? data.stats.failedRecipients[0].error
          : undefined;

        setBroadcastProgress((prev) => ({
          current: currentProcessed,
          total: actualTotal,
          sent: cumulativeSent,
          failed: cumulativeFailed,
          percentage: percent,
          statusText: hasMore
            ? `Memproses batch penerima ${nextBatchStart}–${nextBatchEnd} dari ${actualTotal}...`
            : 'Seluruh batch pengiriman selesai diproses.',
          isComplete: !hasMore,
          lastError: chunkLastError || prev?.lastError,
        }));

        if (!hasMore) {
          break;
        }
      }

      setBroadcastResult({
        totalTarget: actualTotal,
        sentCount: cumulativeSent,
        failedCount: cumulativeFailed,
      });

      if (broadcastTemplate === 'credentials') {
        fetchVoters();
      }
      fetchBroadcastCount();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi saat memproses broadcast email.';
      setBroadcastError(errorMessage);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle File Import DPT (.csv, .txt, .xlsx, .xls)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStagedFile(file);
    setImportSuccessMessage(null);

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        let rawRows: Array<{ nim: string; name: string; email: string; generation: number }> = [];

        if (isExcel) {
          const XLSX = await import('xlsx');
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];

          if (!firstSheetName) {
            alert('Berkas Excel tidak memiliki sheet yang dapat dibaca.');
            return;
          }

          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

          if (rawJson.length === 0) {
            alert('Berkas Excel kosong atau tidak memiliki baris data.');
            return;
          }

          rawRows = rawJson.map((row) => {
            const keys = Object.keys(row);
            const findVal = (col: string) => {
              const matchKey = keys.find((k) => k.trim().toLowerCase() === col);
              return matchKey ? String(row[matchKey]).trim() : '';
            };

            return {
              nim: findVal('nim'),
              name: findVal('name') || findVal('nama'),
              email: findVal('email'),
              generation: Number(findVal('generation') || findVal('angkatan')) || 0,
            };
          });
        } else {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

          if (lines.length <= 1) {
            alert('Berkas CSV kosong atau hanya berisi baris header.');
            return;
          }

          try {
            const XLSX = await import('xlsx');
            const wb = XLSX.read(text, { type: 'string' });
            const firstSheet = wb.Sheets[wb.SheetNames[0]];
            const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

            if (rawJson.length > 0) {
              rawRows = rawJson.map((row) => {
                const keys = Object.keys(row);
                const findVal = (col: string) => {
                  const matchKey = keys.find((k) => k.trim().toLowerCase() === col);
                  return matchKey ? String(row[matchKey]).trim() : '';
                };

                return {
                  nim: findVal('nim'),
                  name: findVal('name') || findVal('nama'),
                  email: findVal('email'),
                  generation: Number(findVal('generation') || findVal('angkatan')) || 0,
                };
              });
            }
          } catch {
            // Fallback split manual jika format non-standar
          }

          if (rawRows.length === 0) {
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
            const nimIdx = headers.indexOf('nim');
            const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('nama');
            const emailIdx = headers.indexOf('email');
            const genIdx = headers.indexOf('generation') !== -1 ? headers.indexOf('generation') : headers.indexOf('angkatan');

            if (nimIdx === -1 || nameIdx === -1 || emailIdx === -1 || genIdx === -1) {
              alert('Header kolom berkas wajib memuat: nim, name, email, generation.');
              return;
            }

            rawRows = lines.slice(1).map((line) => {
              const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
              return {
                nim: cols[nimIdx] || '',
                name: cols[nameIdx] || '',
                email: cols[emailIdx] || '',
                generation: Number(cols[genIdx]) || 0,
              };
            });
          }
        }

        if (rawRows.length === 0) {
          alert('Tidak ada baris data valid yang terbaca dari berkas.');
          return;
        }

        const res = await fetch('/api/admin/dpt/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: rawRows }),
        });

        const previewData = await res.json();
        if (previewData.success) {
          setImportPreview({
            totalRows: previewData.summary.totalRows ?? previewData.summary.totalRowsRead ?? rawRows.length,
            validCount: previewData.summary.validCount ?? previewData.summary.validRowsCount ?? 0,
            duplicateCount: previewData.summary.duplicateCount ?? previewData.summary.databaseConflictsCount ?? 0,
            invalidCount: previewData.summary.invalidCount ?? previewData.summary.invalidRowsCount ?? 0,
            validRows: previewData.validRows || [],
            sampleErrors: previewData.sampleErrors || [],
            databaseConflictsSample: previewData.databaseConflictsSample || [],
          });
        } else {
          alert(previewData.error || 'Gagal memproses validasi berkas DPT.');
        }
      } catch (parseErr) {
        console.error('[FileImport] Parse error:', parseErr);
        alert('Terjadi kesalahan saat membaca berkas data DPT.');
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
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

  // Handler Seleksi Pemilih DPT (Multi-Select)
  const toggleSelectVoter = (id: string) => {
    setSelectedVoterIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllVisibleVotersSelected =
    voters.length > 0 && voters.every((v) => selectedVoterIds.includes(v.id));

  const toggleSelectAllVoters = () => {
    if (isAllVisibleVotersSelected) {
      setSelectedVoterIds([]);
    } else {
      setSelectedVoterIds(voters.map((v) => v.id));
    }
  };

  // Handler Hapus 1 Pemilih DPT (Khusus Superadmin)
  const handleConfirmDeleteSingle = async () => {
    if (!voterToDelete) return;
    setIsDeletingSingleVoter(true);
    setDptActionMessage(null);
    setDptErrorMessage(null);

    try {
      const res = await fetch('/api/admin/dpt', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_single',
          id: voterToDelete.id,
          nim: voterToDelete.nim,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDptErrorMessage(data.error || 'Gagal menghapus pemilih.');
      } else {
        setDptActionMessage(`✓ Pemilih ${voterToDelete.name} (NIM: ${voterToDelete.nim}) berhasil dihapus dari DPT.`);
        setVoterToDelete(null);
        setSelectedVoterIds((prev) => prev.filter((id) => id !== voterToDelete.id));
        fetchVoters();
        fetchTally();
      }
    } catch {
      setDptErrorMessage('Terjadi kesalahan jaringan saat menghapus pemilih.');
    } finally {
      setIsDeletingSingleVoter(false);
    }
  };

  // Handler Hapus Massal / Selektif (Batch Delete)
  const handleConfirmDeleteBatch = async () => {
    if (selectedVoterIds.length === 0) return;
    setIsDeletingBatchVoters(true);
    setDptActionMessage(null);
    setDptErrorMessage(null);

    const selectedVoters = voters.filter((v) => selectedVoterIds.includes(v.id));
    const selectedNims = selectedVoters.map((v) => v.nim);

    try {
      const res = await fetch('/api/admin/dpt', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_batch',
          ids: selectedVoterIds,
          nims: selectedNims,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDptErrorMessage(data.error || 'Gagal menghapus pemilih terpilih.');
      } else {
        setDptActionMessage(`✓ Berhasil menghapus ${data.deletedCount || selectedVoterIds.length} pemilih terpilih dari DPT.`);
        setIsBatchDeleteModalOpen(false);
        setSelectedVoterIds([]);
        fetchVoters();
        fetchTally();
      }
    } catch {
      setDptErrorMessage('Terjadi kesalahan jaringan saat menghapus pemilih massal.');
    } finally {
      setIsDeletingBatchVoters(false);
    }
  };

  // Handler Reset DPT (Khusus Superadmin)
  const handleConfirmResetDpt = async () => {
    if (resetDptConfirmText.trim().toUpperCase() !== 'RESET DPT') {
      setDptErrorMessage('Silakan ketik kata konfirmasi "RESET DPT" dengan benar.');
      return;
    }

    setIsResettingDpt(true);
    setDptActionMessage(null);
    setDptErrorMessage(null);

    try {
      const res = await fetch('/api/admin/dpt', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_all',
          mode: resetDptMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDptErrorMessage(data.error || 'Gagal mereset data DPT.');
      } else {
        setDptActionMessage(`✓ ${data.message || 'Data DPT berhasil direset.'}`);
        setIsResetDptModalOpen(false);
        setResetDptConfirmText('');
        setSelectedVoterIds([]);
        fetchVoters();
        fetchTally();
      }
    } catch {
      setDptErrorMessage('Terjadi kesalahan jaringan saat mereset data DPT.');
    } finally {
      setIsResettingDpt(false);
    }
  };

  const handleOpenGenerateBatchModal = async () => {
    setIsGenerateBatchModalOpen(true);
    setLoadingPasswordStats(true);
    try {
      const res = await fetch('/api/admin/dpt/passwords/generate-batch');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.summary) {
          setPasswordStats({
            total: data.summary.total,
            hasPassword: data.summary.hasPassword,
            pending: data.summary.pending,
            byGeneration: data.byGeneration || [],
          });
        }
      }
    } catch (err) {
      console.error('Failed to load password statistics:', err);
    } finally {
      setLoadingPasswordStats(false);
    }
  };

  const handleGenerateBatchSubmit = async ({
    generation,
    overwriteExisting,
  }: {
    generation: string;
    overwriteExisting: boolean;
  }) => {
    setIsGeneratingPasswords(true);
    setDptActionMessage(null);
    setDptErrorMessage(null);

    try {
      const res = await fetch('/api/admin/dpt/passwords/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation,
          overwriteExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDptErrorMessage(data.error || 'Gagal menerbitkan kata sandi pemilih.');
      } else {
        setDptActionMessage(`✓ ${data.message}`);
        setIsGenerateBatchModalOpen(false);
        fetchVoters();
        // Refresh statistik sandi jika modal dibuka lagi
        handleOpenGenerateBatchModal();
      }
    } catch {
      setDptErrorMessage('Terjadi kesalahan jaringan saat menerbitkan kata sandi.');
    } finally {
      setIsGeneratingPasswords(false);
    }
  };

  const handleGenerateBatchPasswords = async (gen = selectedGeneration) => {
    if (!confirm(`Apakah Anda yakin ingin menerbitkan kata sandi unik untuk pemilih (Angkatan: ${gen}) yang belum memiliki sandi?`)) {
      return;
    }
    setIsGeneratingPasswords(true);
    setDptActionMessage(null);
    setDptErrorMessage(null);

    try {
      const res = await fetch('/api/admin/dpt/passwords/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation: gen,
          overwriteExisting: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDptErrorMessage(data.error || 'Gagal menerbitkan kata sandi pemilih.');
      } else {
        setDptActionMessage(`✓ ${data.message}`);
        fetchVoters();
      }
    } catch {
      setDptErrorMessage('Terjadi kesalahan jaringan saat menerbitkan kata sandi.');
    } finally {
      setIsGeneratingPasswords(false);
    }
  };

  const handleResendVoterPassword = async (voter: VoterRow) => {
    if (!confirm(`Reset dan kirim ulang kata sandi baru untuk ${voter.name} (${voter.nim}) ke email ${voter.email}?`)) {
      return;
    }
    setResendingPasswordNim(voter.nim);
    setDptActionMessage(null);
    setDptErrorMessage(null);

    try {
      const res = await fetch('/api/admin/dpt/passwords/resend-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: voter.nim }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDptErrorMessage(data.error || 'Gagal mengirim ulang kata sandi pemilih.');
      } else {
        setDptActionMessage(`✓ ${data.message}`);
        fetchVoters();
      }
    } catch {
      setDptErrorMessage('Terjadi kesalahan jaringan saat mengirim ulang kata sandi.');
    } finally {
      setResendingPasswordNim(null);
    }
  };

  const handleResetDevBallots = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset seluruh surat suara simulasi pengujian? Tindakan ini akan mengosongkan perolehan suara.')) {
      return;
    }
    setIsResettingBallots(true);

    try {
      const res = await fetch('/api/admin/tally', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchTally();
        fetchVoters();
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

  const systemStatus = getElectionSystemStatus({
    maintenanceMode,
    isVotingOpen,
    startTime,
    endTime,
  });
  const StatusIcon = systemStatus.icon;

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
          className={`fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col justify-between py-6 border-r border-outline-variant/30 transition-transform duration-150 ease-out ${
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
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Panel Panitia KPR
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Tutup navigasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Role Badge */}
            <div className="px-6">
              <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center justify-between border border-outline-variant/20">
                <span className="text-[11px] text-on-surface-variant uppercase font-medium">
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
                    ? 'bg-primary text-on-primary'
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
                    ? 'bg-primary text-on-primary'
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
                    ? 'bg-primary text-on-primary'
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
                    ? 'bg-primary text-on-primary'
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
                    ? 'bg-primary text-on-primary'
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
                    ? 'bg-primary text-on-primary'
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
                    ? 'bg-primary text-on-primary'
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
                      ? 'bg-primary text-on-primary'
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
              className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <RefreshCw className="w-4 h-4 text-primary" />
              <span>Segarkan Data</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-error hover:bg-error/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
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
                className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors -ml-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-wide transition-colors ${systemStatus.badgeBg}`}
                title={`Status Operasional: ${systemStatus.label}`}
              >
                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{systemStatus.label}</span>
                <span className="sm:hidden">{systemStatus.shortLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface">{userName}</span>
                <span className="text-[11px] text-on-surface-variant uppercase font-medium">
                  {userRole.replace('_', ' ')}
                </span>
              </div>
            </div>
          </header>

          {/* MAIN BODY CONTENT */}
          <main className="flex-1 pt-20 px-6 sm:px-8 pb-12">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {activeTab === 'overview' && (
                <OverviewTab
                  regularCount={regularCount}
                  loadingTally={loadingTally}
                  totalDpt={totalDpt}
                  totalVotes={totalVotes}
                  turnoutPercentage={turnoutPercentage}
                  generationData={generationData}
                  tallyData={tallyData}
                  isTallyLocked={isTallyLocked}
                  onRefreshTally={() => fetchTally()}
                  onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
                />
              )}

              {activeTab === 'candidates' && (
                <CandidatesTab
                  regularCandidates={regularCandidates}
                  regularCount={regularCount}
                  loadingCandidates={loadingCandidates}
                  candidateActionMessage={candidateActionMessage}
                  allowKotakKosongMulti={allowKotakKosongMulti}
                  togglingKotakKosong={togglingKotakKosong}
                  onDismissMessage={() => setCandidateActionMessage(null)}
                  onOpenAdd={handleOpenAddCandidate}
                  onOpenEdit={handleOpenEditCandidate}
                  onDelete={handleDeleteCandidate}
                  onToggleActive={handleToggleCandidateActive}
                  onToggleKotakKosong={handleToggleKotakKosong}
                />
              )}

              {activeTab === 'dpt' && (
                <DptTab
                  userRole={userRole}
                  fileInputRef={fileInputRef}
                  importSuccessMessage={importSuccessMessage}
                  dptActionMessage={dptActionMessage}
                  dptErrorMessage={dptErrorMessage}
                  importPreview={importPreview}
                  stagedFile={stagedFile}
                  isCommittingImport={isCommittingImport}
                  searchQuery={searchQuery}
                  selectedGeneration={selectedGeneration}
                  selectedStatus={selectedStatus}
                  availableGenerations={availableGenerations}
                  voters={voters}
                  loadingVoters={loadingVoters}
                  selectedVoterIds={selectedVoterIds}
                  isAllVisibleVotersSelected={isAllVisibleVotersSelected}
                  dptPage={dptPage}
                  dptPageSize={dptPageSize}
                  dptTotalPages={dptTotalPages}
                  voterTotalCount={voterTotalCount}
                  onOpenQuickAddModal={() => setIsQuickAddModalOpen(true)}
                  onDownloadTemplate={handleDownloadTemplate}
                  onOpenResetDptModal={() => {
                    setIsResetDptModalOpen(true);
                    setResetDptConfirmText('');
                    setDptErrorMessage(null);
                  }}
                  onFileChange={handleFileChange}
                  onDismissImportSuccess={() => setImportSuccessMessage(null)}
                  onDismissDptActionMessage={() => setDptActionMessage(null)}
                  onDismissDptError={() => setDptErrorMessage(null)}
                  onCancelImportPreview={() => {
                    setStagedFile(null);
                    setImportPreview(null);
                  }}
                  onCommitImport={handleCommitImport}
                  onSearchChange={(value) => {
                    setSearchQuery(value);
                    setDptPage(1);
                  }}
                  onGenerationChange={(value) => {
                    setSelectedGeneration(value);
                    setDptPage(1);
                  }}
                  onStatusChange={(value) => {
                    setSelectedStatus(value);
                    setDptPage(1);
                  }}
                  onClearSelectedVoters={() => setSelectedVoterIds([])}
                  onOpenBatchDeleteModal={() => setIsBatchDeleteModalOpen(true)}
                  onToggleSelectAllVoters={toggleSelectAllVoters}
                  onToggleSelectVoter={toggleSelectVoter}
                  onRequestDeleteVoter={(v) => setVoterToDelete(v)}
                  onPageSizeChange={(size) => {
                    setDptPageSize(size);
                    setDptPage(1);
                  }}
                  onPrevPage={() => setDptPage((p) => Math.max(p - 1, 1))}
                  onNextPage={() => setDptPage((p) => Math.min(p + 1, dptTotalPages))}
                  onGenerateBatchPasswords={handleGenerateBatchPasswords}
                  onOpenGenerateBatchModal={handleOpenGenerateBatchModal}
                  isGeneratingPasswords={isGeneratingPasswords}
                  onResendVoterPassword={handleResendVoterPassword}
                  resendingPasswordNim={resendingPasswordNim}
                />
              )}

              {activeTab === 'tally' && (
                <TallyTab
                  tallyData={tallyData}
                  loadingTally={loadingTally}
                  isTallyLocked={isTallyLocked}
                  isResettingBallots={isResettingBallots}
                  onRefresh={() => fetchTally()}
                  onResetBallots={handleResetDevBallots}
                  onOpenBastModal={() => setIsBastModalOpen(true)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  startTime={startTime}
                  endTime={endTime}
                  isVotingOpen={isVotingOpen}
                  maintenanceMode={maintenanceMode}
                  settingsReason={settingsReason}
                  settingsSaving={settingsSaving}
                  settingsMessage={settingsMessage}
                  isScheduleDirty={isScheduleDirty}
                  loadingSchedule={loadingSchedule}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  onReasonChange={setSettingsReason}
                  onResetScheduleDraft={handleResetScheduleDraft}
                  onOpenVotingToggleModal={handleOpenVotingToggleModal}
                  onOpenMaintenanceToggleModal={handleOpenMaintenanceToggleModal}
                  onSaveSettings={() =>
                    handleSaveSettings(isVotingOpen, maintenanceMode, startTime, endTime, settingsReason)
                  }
                />
              )}

              {activeTab === 'emails' && (
                <BroadcastTab
                  totalDpt={totalDpt}
                  totalVotes={totalVotes}
                  broadcastResult={broadcastResult}
                  broadcastError={broadcastError}
                  broadcastTemplate={broadcastTemplate}
                  broadcastTargetGroup={broadcastTargetGroup}
                  broadcastGeneration={broadcastGeneration}
                  availableGenerations={availableGenerations}
                  loadingBroadcastCount={loadingBroadcastCount}
                  broadcastTargetCount={broadcastTargetCount}
                  broadcastSubject={broadcastSubject}
                  broadcastHeadline={broadcastHeadline}
                  broadcastBody={broadcastBody}
                  broadcastCtaText={broadcastCtaText}
                  broadcastCtaUrl={broadcastCtaUrl}
                  isBroadcasting={isBroadcasting}
                  onRefreshQuota={fetchBroadcastCount}
                  onSelectTemplate={handleSelectTemplate}
                  onTargetGroupChange={setBroadcastTargetGroup}
                  onGenerationChange={setBroadcastGeneration}
                  onSubjectChange={setBroadcastSubject}
                  onHeadlineChange={setBroadcastHeadline}
                  onBodyChange={setBroadcastBody}
                  onCtaTextChange={setBroadcastCtaText}
                  onCtaUrlChange={setBroadcastCtaUrl}
                  onOpenConfirmBroadcast={() => setIsConfirmBroadcastOpen(true)}
                />
              )}

              {activeTab === 'audit' && (
                <AuditLogsTab
                  auditLogs={auditLogs}
                  auditStats={auditStats}
                  loadingAuditLogs={loadingAuditLogs}
                  auditFilterAction={auditFilterAction}
                  auditSearchQuery={auditSearchQuery}
                  onRefresh={() => fetchAuditLogs()}
                  onSearchChange={setAuditSearchQuery}
                  onFilterActionChange={setAuditFilterAction}
                  onResetFilters={() => {
                    setAuditFilterAction('all');
                    setAuditSearchQuery('');
                  }}
                />
              )}

              {activeTab === 'admins' && (
                <AdminsTab
                  userRole={userRole}
                  adminUsers={adminUsers}
                  adminStats={adminStats}
                  loadingAdmins={loadingAdmins}
                  adminActionMessage={adminActionMessage}
                  onDismissActionMessage={() => setAdminActionMessage(null)}
                  onOpenAddAdmin={() => {
                    setAdminModalOpen(true);
                    setAdminErrorMessage(null);
                  }}
                  onUpdateRole={handleUpdateAdminRole}
                  onToggleStatus={handleToggleAdminStatus}
                  onDeleteAdmin={handleDeleteAdminUser}
                />
              )}
            </div>
          </main>
        </div>

        {/* MODALS */}
        <CandidateFormModal
          isOpen={candidateModalOpen}
          editingCandidate={editingCandidate}
          savingCandidate={savingCandidate}
          candidateFormNumber={candidateFormNumber}
          candidateFormLeader={candidateFormLeader}
          candidateFormViceLeader={candidateFormViceLeader}
          candidateFormPhotoUrl={candidateFormPhotoUrl}
          candidateFormChairmanCvUrl={candidateFormChairmanCvUrl}
          candidateFormViceChairmanCvUrl={candidateFormViceChairmanCvUrl}
          candidateFormVision={candidateFormVision}
          candidateFormMission={candidateFormMission}
          candidateFormIsActive={candidateFormIsActive}
          uploadingPhoto={uploadingPhoto}
          uploadingChairmanCv={uploadingChairmanCv}
          uploadingViceChairmanCv={uploadingViceChairmanCv}
          uploadError={uploadError}
          isPhotoFrameModalOpen={isPhotoFrameModalOpen}
          photoToFrame={photoToFrame}
          photoFileInputRef={photoFileInputRef}
          chairmanCvFileInputRef={chairmanCvFileInputRef}
          viceChairmanCvFileInputRef={viceChairmanCvFileInputRef}
          onClose={() => setCandidateModalOpen(false)}
          onSubmit={handleSaveCandidate}
          onNumberChange={setCandidateFormNumber}
          onLeaderChange={setCandidateFormLeader}
          onViceLeaderChange={setCandidateFormViceLeader}
          onPhotoUrlChange={setCandidateFormPhotoUrl}
          onChairmanCvUrlChange={setCandidateFormChairmanCvUrl}
          onViceChairmanCvUrlChange={setCandidateFormViceChairmanCvUrl}
          onVisionChange={setCandidateFormVision}
          onMissionChange={setCandidateFormMission}
          onIsActiveChange={setCandidateFormIsActive}
          onDismissUploadError={() => setUploadError(null)}
          onOpenPhotoFrame={(url) => {
            setPhotoToFrame(url);
            setIsPhotoFrameModalOpen(true);
          }}
          onClosePhotoFrame={() => {
            setIsPhotoFrameModalOpen(false);
            setPhotoToFrame(null);
          }}
          onFramedPhotoConfirm={handleFramedPhotoConfirm}
          onUploadCvFile={(file, setter, loadingSetter) =>
            handleUploadFile(file, 'cv', setter, loadingSetter)
          }
          onSetUploadingChairmanCv={setUploadingChairmanCv}
          onSetUploadingViceChairmanCv={setUploadingViceChairmanCv}
        />

        <EmergencyLockModal
          isOpen={isEmergencyModalOpen}
          emergencyReason={emergencyReason}
          settingsSaving={settingsSaving}
          onReasonChange={setEmergencyReason}
          onClose={() => setIsEmergencyModalOpen(false)}
          onConfirmLock={() =>
            handleSaveSettings(isVotingOpen, true, startTime, endTime, emergencyReason)
          }
        />

        <ToggleSettingConfirmModal
          config={toggleModalConfig}
          toggleReason={toggleReason}
          settingsSaving={settingsSaving}
          onReasonChange={setToggleReason}
          onClose={() => setToggleModalConfig(null)}
          onConfirm={handleConfirmToggle}
        />

        <BroadcastConfirmModal
          isOpen={isConfirmBroadcastOpen}
          isBroadcasting={isBroadcasting}
          broadcastProgress={broadcastProgress}
          broadcastTargetCount={broadcastTargetCount}
          broadcastTargetGroup={broadcastTargetGroup}
          broadcastGeneration={broadcastGeneration}
          availableGenerations={availableGenerations}
          broadcastSubject={broadcastSubject}
          broadcastTemplate={broadcastTemplate}
          onClose={() => {
            if (!isBroadcasting) {
              setIsConfirmBroadcastOpen(false);
              setBroadcastProgress(null);
            }
          }}
          onExecute={() => handleExecuteBroadcast()}
          onRetryFailed={() => {
            setBroadcastTargetGroup('failed_email');
            handleExecuteBroadcast('failed_email');
          }}
        />

        <QuickAddVoterModal
          isOpen={isQuickAddModalOpen}
          quickAddLoading={quickAddLoading}
          quickAddError={quickAddError}
          quickAddNim={quickAddNim}
          quickAddName={quickAddName}
          quickAddEmail={quickAddEmail}
          quickAddGeneration={quickAddGeneration}
          availableGenerations={availableGenerations}
          onNimChange={setQuickAddNim}
          onNameChange={setQuickAddName}
          onEmailChange={setQuickAddEmail}
          onGenerationChange={setQuickAddGeneration}
          onClose={() => setIsQuickAddModalOpen(false)}
          onSubmit={handleQuickAddVoter}
        />

        <AddAdminModal
          isOpen={adminModalOpen}
          adminSaving={adminSaving}
          adminErrorMessage={adminErrorMessage}
          adminFormName={adminFormName}
          adminFormEmail={adminFormEmail}
          adminFormNim={adminFormNim}
          adminFormRole={adminFormRole}
          onNameChange={setAdminFormName}
          onEmailChange={setAdminFormEmail}
          onNimChange={setAdminFormNim}
          onRoleChange={setAdminFormRole}
          onClose={() => setAdminModalOpen(false)}
          onSubmit={handleSaveAdminUser}
        />

        <BastPreviewModal
          isOpen={isBastModalOpen}
          totalDpt={totalDpt}
          totalVotes={totalVotes}
          turnoutPercentage={turnoutPercentage}
          generationData={generationData}
          tallyData={tallyData}
          bastQrDataUrl={bastQrDataUrl}
          bastIntegrityHash={bastIntegrityHash}
          onClose={() => setIsBastModalOpen(false)}
        />

        <DeleteVoterModal
          voterToDelete={voterToDelete}
          isDeletingSingleVoter={isDeletingSingleVoter}
          onClose={() => setVoterToDelete(null)}
          onConfirm={handleConfirmDeleteSingle}
        />

        <BatchDeleteVotersModal
          isOpen={isBatchDeleteModalOpen}
          selectedCount={selectedVoterIds.length}
          isDeletingBatchVoters={isDeletingBatchVoters}
          onClose={() => setIsBatchDeleteModalOpen(false)}
          onConfirm={handleConfirmDeleteBatch}
        />

        <ResetDptModal
          isOpen={isResetDptModalOpen}
          isResettingDpt={isResettingDpt}
          resetDptMode={resetDptMode}
          resetDptConfirmText={resetDptConfirmText}
          onModeChange={setResetDptMode}
          onConfirmTextChange={setResetDptConfirmText}
          onClose={() => setIsResetDptModalOpen(false)}
          onConfirm={handleConfirmResetDpt}
        />

        <GenerateBatchPasswordsModal
          isOpen={isGenerateBatchModalOpen}
          isGenerating={isGeneratingPasswords}
          availableGenerations={availableGenerations}
          initialGeneration={selectedGeneration}
          stats={passwordStats}
          loadingStats={loadingPasswordStats}
          onClose={() => setIsGenerateBatchModalOpen(false)}
          onSubmit={handleGenerateBatchSubmit}
        />
      </div>

      {/* Dokumen Bersih Khusus Cetak Kertas A4 (Print-Only) */}
      <div className="hidden print:block bg-white text-black font-serif text-[12px] leading-relaxed p-6">
        <BastPrintableReport
          totalDpt={totalDpt}
          totalVotes={totalVotes}
          turnoutPercentage={turnoutPercentage}
          generationData={generationData}
          tallyData={tallyData}
          bastQrDataUrl={bastQrDataUrl}
          bastIntegrityHash={bastIntegrityHash}
        />
      </div>
    </>
  );
}
