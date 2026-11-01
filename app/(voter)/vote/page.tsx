'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Vote,
  Info,
  Clock,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  Shield,
  Loader2,
} from 'lucide-react';
import {
  CandidateCard,
  type CandidateItem,
} from '@/components/ballot/candidate-card';
import { KotakKosongCard } from '@/components/ballot/kotak-kosong-card';
import { ConfirmationModal } from '@/components/ballot/confirmation-modal';
import { castBallotAction } from '@/lib/actions/ballot';

export default function VotePage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingElection, setLoadingElection] = useState(true);
  const [electionError, setElectionError] = useState<string | null>(null);
  const [votingActive, setVotingActive] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Sisa waktu sesi (15 menit countdown)
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    // 1. Muat data kandidat dari endpoint master data pemilihan
    fetch('/api/election')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCandidates(data.candidates || []);
          if (data.electionStatus) {
            setVotingActive(data.electionStatus.isVotingActive);
            setMaintenanceMode(data.electionStatus.maintenanceMode);
          }
        } else {
          setElectionError(data.error || 'Gagal memuat daftar kandidat.');
        }
      })
      .catch(() => {
        setElectionError('Terjadi kesalahan koneksi saat memuat bilik suara.');
      })
      .finally(() => {
        setLoadingElection(false);
      });

    // 2. Timer countdown sesi bilik suara
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert('Sesi bilik suara Anda telah kedaluwarsa. Silakan login kembali.');
          window.location.href = '/login';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSelectCandidate = (candidate: CandidateItem) => {
    setSelectedCandidate(candidate);
  };

  const handleResetSelection = () => {
    setSelectedCandidate(null);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);
    setElectionError(null);

    try {
      const res = await castBallotAction(selectedCandidate.id);

      if (res.success && res.receipt) {
        // Simpan tanda terima sementara di sessionStorage untuk ditampilkan di /receipt
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hmif_receipt_token', res.receipt.token);
          sessionStorage.setItem('hmif_receipt_date', res.receipt.date);
        }
        setIsModalOpen(false);
        router.push('/receipt');
      } else {
        setIsModalOpen(false);
        setElectionError(res.message || 'Gagal mengirim surat suara.');
        if (res.code === 'ALREADY_VOTED') {
          setTimeout(() => {
            router.push('/receipt');
          }, 2000);
        }
      }
    } catch {
      setIsModalOpen(false);
      setElectionError('Terjadi kegagalan jaringan saat mengirim surat suara.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const regularCandidates = candidates.filter((c) => c.candidate_number > 0);
  const kotakKosongCandidate = candidates.find((c) => c.candidate_number === 0);

  return (
    <div className="bg-surface font-montserrat text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary-container selection:text-on-primary">
      {/* Fixed Sticky Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-outline-variant/20">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm">
              HMIF
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-on-surface uppercase">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-outline text-xs hidden sm:inline">
                • Bilik Suara Digital
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Timer Badge */}
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full shadow-[0_0_0_1px_rgba(235,189,28,0.25)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">
                Sisa Sesi:
              </span>
              <span className="font-bebas text-sm sm:text-base text-primary tracking-widest font-bold">
                {formatTimer(secondsLeft)}
              </span>
            </div>

            <a
              href="https://t.me/hmif_tup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bantuan KPR</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Chamber Container */}
      <main className="w-full pt-20 bg-surface flex-1 flex flex-col relative">
        {/* Atmospheric Ambient Glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary-container/10 blur-[120px] rounded-full" />
          <div className="absolute top-12 left-12 w-64 h-64 bg-tertiary-container/5 blur-[90px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 pt-6 pb-36 relative z-10">
          {/* Header Title Section */}
          <div className="mb-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-outline-variant/30 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
              <Vote className="w-3.5 h-3.5" />
              <span>Pemungutan Suara Resmi</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-montserrat font-bold text-on-surface tracking-tight">
              Bilik Suara Digital
            </h1>
            <p className="text-on-surface-variant text-sm sm:text-base mt-1">
              Pilih satu pasangan calon untuk Ketua dan Wakil Ketua HMIF periode 2026/2027.
            </p>
            <p className="text-outline text-xs mt-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Tinjau informasi kandidat sebelum menentukan pilihan. Pilih tepat 1 (satu) pilihan.</span>
            </p>
          </div>

          {/* Maintenance / Closed Notice */}
          {(!votingActive || maintenanceMode) && (
            <div className="mb-6 rounded-2xl border border-hmif-red/40 bg-hmif-red/10 p-5 text-on-surface flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-hmif-red shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-hmif-red">
                  {maintenanceMode ? 'Bilik Suara Sedang Dalam Pemeliharaan' : 'Pemungutan Suara Sedang Ditutup'}
                </h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {maintenanceMode
                    ? 'Sistem sedang menjalankan sinkronisasi data darurat. Pengiriman suara dinonaktifkan sementara.'
                    : 'Jadwal pemungutan suara resmi belum dibuka atau telah berakhir sesuai keputusan KPR.'}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {electionError && (
            <div className="mb-6 rounded-2xl border border-hmif-red/40 bg-hmif-red/10 p-4 text-xs text-hmif-red flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{electionError}</span>
            </div>
          )}

          {/* Loading Candidates State */}
          {loadingElection ? (
            <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Menyiapkan bilik suara dan data pasangan calon...</p>
            </div>
          ) : (
            <>
              {/* Grid Paslon Terdaftar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {regularCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidate?.id === candidate.id}
                    onSelect={handleSelectCandidate}
                  />
                ))}
              </div>

              {/* Opsi Kotak Kosong / Abstain Sah */}
              {kotakKosongCandidate && (
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-px flex-1 bg-surface-container-highest" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-outline">
                      Opsi Alternatif Sah
                    </span>
                    <div className="h-px flex-1 bg-surface-container-highest" />
                  </div>

                  <KotakKosongCard
                    candidate={kotakKosongCandidate}
                    isSelected={selectedCandidate?.id === kotakKosongCandidate.id}
                    onSelect={handleSelectCandidate}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="fixed bottom-0 inset-x-0 bg-surface-container-lowest/95 backdrop-blur-xl z-40 py-4 border-t border-outline-variant/30 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Selection Status Display */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  selectedCandidate ? 'bg-secondary-fixed animate-pulse' : 'bg-outline'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
                  Status Pemilihan
                </span>
                <span className="text-xs sm:text-sm font-bold text-on-surface">
                  {selectedCandidate
                    ? selectedCandidate.candidate_number === 0
                      ? 'Pilihan Terpilih: Kotak Kosong (Abstain Sah)'
                      : `Pilihan Terpilih: Pasangan Calon ${selectedCandidate.candidate_number.toString().padStart(2, '0')}`
                    : 'Belum ada kandidat dipilih'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {selectedCandidate && (
                <button
                  type="button"
                  onClick={handleResetSelection}
                  className="px-4 h-11 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                >
                  Batalkan Pilihan
                </button>
              )}

              <button
                type="button"
                disabled={!selectedCandidate || !votingActive || maintenanceMode}
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-6 h-11 rounded-lg text-xs font-bold uppercase tracking-wider text-on-primary bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span>Lanjutkan ke Konfirmasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Konfirmasi Pilihan Suara */}
        <ConfirmationModal
          isOpen={isModalOpen}
          selectedCandidate={selectedCandidate}
          isSubmitting={isSubmitting}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmVote}
        />
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 mt-auto py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-outline">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto 2026/2027</span>
          </div>
          <span>Kerahasiaan Suara Dijamin Kriptografis Murni</span>
        </div>
      </footer>
    </div>
  );
}
