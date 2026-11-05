'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Vote,
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
import { SessionExpiredModal } from '@/components/ballot/session-expired-modal';
import { CandidateDetailModal } from '@/components/candidates/candidate-detail-modal';
import { castBallotAction } from '@/lib/actions/ballot';

export default function VotePage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<CandidateItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingElection, setLoadingElection] = useState(true);
  const [electionError, setElectionError] = useState<string | null>(null);
  const [votingActive, setVotingActive] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [electionSchedule, setElectionSchedule] = useState<{ start: string; end: string } | null>(null);

  // Sisa waktu sesi (15 menit countdown)
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDevOrTestHost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local');

      if (isDevOrTestHost) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('expired') === 'true') {
          setIsSessionExpired(true);
        } else if (params.get('timeout')) {
          const customSec = parseInt(params.get('timeout') || '15', 10);
          if (!isNaN(customSec)) setSecondsLeft(customSec);
        }
      }
    }

    // 1. Muat data kandidat dari endpoint master data pemilihan
    fetch('/api/election')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const candidateList: CandidateItem[] = data.candidates || [];
          setCandidates(candidateList);
          if (data.electionStatus) {
            setVotingActive(data.electionStatus.isVotingActive);
            setMaintenanceMode(data.electionStatus.maintenanceMode);
            if (data.electionStatus.startTime && data.electionStatus.endTime) {
              setElectionSchedule({
                start: data.electionStatus.startTime,
                end: data.electionStatus.endTime,
              });
            }
          }

          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const detailParam = params.get('detail') || params.get('candidate');
            if (detailParam) {
              const matched = candidateList.find(
                (c) =>
                  c.candidate_number.toString() === detailParam ||
                  c.id === detailParam ||
                  c.candidate_number.toString().padStart(2, '0') === detailParam
              );
              if (matched) setDetailCandidate(matched);
            }
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
          setIsSessionExpired(true);
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
        } else if (res.code === 'UNAUTHORIZED') {
          setIsSessionExpired(true);
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
  const isSingleCandidate = regularCandidates.length === 1;

  return (
    <div className="bg-surface font-montserrat text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      {/* Fixed Sticky Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
        <div className="h-16 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
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
            <div>
              <span className="text-xs sm:text-sm font-bold tracking-tight text-on-surface uppercase block">
                Pemira HMIF 2026/2027
              </span>
              <span className="text-xs text-outline hidden sm:block">
                Bilik Suara Mahasiswa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-on-surface-variant hidden sm:inline">
                Sisa Sesi:
              </span>
              <span className="font-bebas text-sm sm:text-base text-primary tracking-wider font-bold">
                {formatTimer(secondsLeft)}
              </span>
            </div>

            <a
              href="https://wa.me/6281809300406"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors flex items-center gap-1 p-2 -m-2 rounded-lg"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bantuan</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 pb-28 sm:pb-32">
          {/* Header Title Section */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Surat Suara Pemilihan
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
              {isSingleCandidate
                ? 'Pilih pasangan calon atau kotak kosong.'
                : 'Pilih pasangan calon Chairman & Vice Chairman HMIF 2026/2027.'}
            </p>
          </div>

          {/* Maintenance / Closed Notice */}
          {(!votingActive || maintenanceMode) && (
            <div className="mb-6 rounded-2xl border border-hmif-red/30 bg-hmif-red/10 p-4 text-on-surface flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-hmif-red shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-hmif-red">
                  {maintenanceMode
                    ? 'Bilik Suara Sedang Dalam Pemeliharaan'
                    : 'Pemungutan Suara Sedang Ditutup'}
                </h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {maintenanceMode
                    ? 'Sistem sedang dalam pemeliharaan. Coba lagi nanti atau hubungi Panitia KPR.'
                    : electionSchedule
                    ? `Pemungutan suara hanya dapat dilakukan pada jadwal resmi: ${new Date(
                        electionSchedule.start
                      ).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} s/d ${new Date(
                        electionSchedule.end
                      ).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB.`
                    : 'Pemungutan suara belum dibuka atau telah berakhir sesuai jadwal resmi.'}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {electionError && (
            <div className="mb-6 rounded-xl border border-hmif-red/30 bg-hmif-red/10 p-4 text-xs text-hmif-red flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{electionError}</span>
            </div>
          )}

          {/* Loading Candidates State */}
          {loadingElection ? (
            <div className="py-20 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-xs">Memuat data pasangan calon...</p>
            </div>
          ) : isSingleCandidate ? (
            /* ADAPTIVE LAYOUT 1: HEAD-TO-HEAD (Calon Tunggal vs Kotak Kosong) */
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {regularCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidate?.id === candidate.id}
                    onSelect={handleSelectCandidate}
                    onOpenDetail={setDetailCandidate}
                  />
                ))}

                {kotakKosongCandidate && (
                  <KotakKosongCard
                    candidate={kotakKosongCandidate}
                    isSelected={selectedCandidate?.id === kotakKosongCandidate.id}
                    onSelect={handleSelectCandidate}
                    variant="card"
                  />
                )}
              </div>
            </div>
          ) : (
            /* ADAPTIVE LAYOUT 2 & 3: GRID (2 Calon atau 3+ Calon) */
            <>
              <div
                className={`grid gap-6 mb-8 ${
                  regularCandidates.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {regularCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidate?.id === candidate.id}
                    onSelect={handleSelectCandidate}
                    onOpenDetail={setDetailCandidate}
                  />
                ))}
              </div>

              {/* Opsi Kotak Kosong Horizontal Bar untuk Multi-Paslon */}
              {kotakKosongCandidate && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-outline-variant/30" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                      Kotak Kosong
                    </span>
                    <div className="h-px flex-1 bg-outline-variant/30" />
                  </div>

                  <KotakKosongCard
                    candidate={kotakKosongCandidate}
                    isSelected={selectedCandidate?.id === kotakKosongCandidate.id}
                    onSelect={handleSelectCandidate}
                    variant="horizontal"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md z-40 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] border-t border-outline-variant/30 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedCandidate ? 'bg-primary' : 'bg-outline/50'
                }`}
              />
              <span className="text-xs font-semibold text-on-surface">
                {selectedCandidate
                  ? selectedCandidate.candidate_number === 0
                    ? 'Pilihan: Kotak Kosong'
                    : `Pilihan: Paslon ${selectedCandidate.candidate_number.toString().padStart(2, '0')}`
                  : 'Pilih pasangan calon'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {selectedCandidate && (
                <button
                  type="button"
                  onClick={handleResetSelection}
                  className="px-3.5 h-10 rounded-xl text-xs font-medium text-outline hover:text-on-surface transition-colors"
                >
                  Batal
                </button>
              )}

              <button
                type="button"
                disabled={!selectedCandidate || !votingActive || maintenanceMode || isSessionExpired}
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-5 h-10 rounded-xl text-xs font-bold uppercase tracking-wider text-on-primary bg-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Konfirmasi Pilihan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/20 py-3.5 text-center text-xs text-outline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>KPR HMIF Telkom University Purwokerto 2026/2027</span>
          </div>
          <span>Kerahasiaan Suara Dijamin Asas Luber Jurdil</span>
        </div>
      </footer>

      {/* Modal Konfirmasi */}
      <ConfirmationModal
        isOpen={isModalOpen && !isSessionExpired}
        selectedCandidate={selectedCandidate}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmVote}
      />

      {/* Modal Peringatan Sesi Kedaluwarsa */}
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onLoginRedirect={() => {
          window.location.href = '/login';
        }}
      />

      {/* Modal Detail Paslon & Unduh CV */}
      <CandidateDetailModal
        isOpen={!!detailCandidate}
        candidate={detailCandidate}
        isSelected={selectedCandidate?.id === detailCandidate?.id}
        onClose={() => setDetailCandidate(null)}
        onSelectCandidate={(c) => {
          handleSelectCandidate(c);
        }}
      />
    </div>
  );
}
