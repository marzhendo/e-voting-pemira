import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getAllVoters, markVoterAsVoted, findVoterByIdentifier } from '../dpt/store.ts';
import { getCandidatesStore, type CandidateItem } from '../candidates/dev-store.ts';

/**
 * STRUKTUR SURAT SUARA (BALLOT):
 * INVARIAN MUTLAK (BALLOT SECRECY):
 * DILARANG KERAS menyimpan NIM, nama, user ID, IP address, atau pengidentifikasi apapun
 * di dalam tabel/store ballots.
 */
export interface AnonymousBallot {
  id: string;
  candidate_id: string;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'dev-ballots.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[BallotStore] Failed to create data directory:', err);
  }
}

let inMemoryBallots: AnonymousBallot[] | null = null;

export function getAllBallots(): AnonymousBallot[] {
  if (inMemoryBallots !== null) {
    return inMemoryBallots;
  }

  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      inMemoryBallots = JSON.parse(content) as AnonymousBallot[];
      return inMemoryBallots;
    }
  } catch (err) {
    console.warn('[BallotStore] Failed to read ballots store file, using empty:', err);
  }

  inMemoryBallots = [];
  saveBallotsStore(inMemoryBallots);
  return inMemoryBallots;
}

export function saveBallotsStore(ballots: AnonymousBallot[]): void {
  inMemoryBallots = ballots;
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(ballots, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[BallotStore] Failed to persist ballots to disk:', err);
  }
}

/**
 * TRANSAKSI ATOMIK PENCATATAN SUARA:
 * 1. Memeriksa eligibilitas pemilih (harus terdaftar dan belum pernah mencoblos).
 * 2. Mengunci status has_voted = true pada DPT.
 * 3. Merekam surat suara anonim (hanya candidate_id) ke ballots.
 */
export function castBallotAtomicDev(
  nim: string,
  candidateId: string,
  receiptHash?: string
): { success: boolean; code: string; message: string; ballotId?: string } {
  const voter = findVoterByIdentifier(nim);

  if (!voter) {
    return {
      success: false,
      code: 'NOT_REGISTERED',
      message: 'Akses Ditolak: Kamu tidak terdaftar dalam Daftar Pemilih Tetap (DPT).',
    };
  }

  if (voter.has_voted) {
    return {
      success: false,
      code: 'ALREADY_VOTED',
      message: 'Hak suara kamu telah digunakan sebelumnya.',
    };
  }

  // Verifikasi kandidat valid
  const candidates = getCandidatesStore();
  const validCandidate = candidates.find((c: CandidateItem) => c.id === candidateId && c.is_active);
  if (!validCandidate) {
    return {
      success: false,
      code: 'INVALID_CANDIDATE',
      message: 'Kandidat yang dipilih tidak terdaftar atau tidak aktif.',
    };
  }

  // 1. Kunci status pemilih dan simpan hash tanda terima (Ballot Secrecy Terjaga)
  markVoterAsVoted(voter.nim, receiptHash);

  // 2. Simpan suara anonim (Ballot Secrecy Terpenuhi)
  const currentBallots = getAllBallots();
  const newBallot: AnonymousBallot = {
    id: crypto.randomUUID(),
    candidate_id: candidateId,
    created_at: new Date().toISOString(),
  };

  saveBallotsStore([...currentBallots, newBallot]);

  return {
    success: true,
    code: 'SUCCESS',
    message: 'Suara Anda berhasil dicatat secara sah.',
    ballotId: newBallot.id,
  };
}

export interface CandidateTallyItem {
  candidateId: string;
  candidateNumber: number;
  leaderName: string;
  viceLeaderName: string;
  photoUrl?: string | null;
  voteCount: number;
  percentage: number;
}

export interface GenerationTurnoutItem {
  generation: number;
  totalVoters: number;
  votedCount: number;
  turnoutPercentage: number;
}

export interface TallyAggregationResult {
  totalDpt: number;
  totalVotesRecorded: number;
  totalVotersParticipated: number;
  turnoutPercentage: number;
  byGeneration: GenerationTurnoutItem[];
  tally: CandidateTallyItem[];
}

/**
 * Menghitung rekapitulasi suara (tally) secara real-time dari data aktual
 */
export function calculateLiveTally(): TallyAggregationResult {
  const ballots = getAllBallots();
  const voters = getAllVoters();
  const candidates = getCandidatesStore().filter((c: CandidateItem) => c.is_active);

  const totalVotesRecorded = ballots.length;
  const totalDpt = voters.length;
  const totalVotersParticipated = voters.filter((v) => v.has_voted).length;

  const turnoutPercentage =
    totalDpt > 0 ? Number(((totalVotersParticipated / totalDpt) * 100).toFixed(2)) : 0;

  // Hitung jumlah suara per kandidat
  const voteCounts: Record<string, number> = {};
  for (const b of ballots) {
    voteCounts[b.candidate_id] = (voteCounts[b.candidate_id] || 0) + 1;
  }

  const tally: CandidateTallyItem[] = candidates
    .map((cand: CandidateItem) => {
      const count = voteCounts[cand.id] || 0;
      const percentage =
        totalVotesRecorded > 0 ? Number(((count / totalVotesRecorded) * 100).toFixed(2)) : 0;
      return {
        candidateId: cand.id,
        candidateNumber: cand.candidate_number,
        leaderName: cand.leader_name,
        viceLeaderName: cand.vice_leader_name,
        photoUrl: cand.photo_url || null,
        voteCount: count,
        percentage,
      };
    })
    .sort((a: CandidateTallyItem, b: CandidateTallyItem) => a.candidateNumber - b.candidateNumber);

  // Hitung partisipasi per angkatan
  const cohortMap: Record<number, { total: number; voted: number }> = {};
  for (const v of voters) {
    if (!cohortMap[v.generation]) {
      cohortMap[v.generation] = { total: 0, voted: 0 };
    }
    cohortMap[v.generation].total += 1;
    if (v.has_voted) {
      cohortMap[v.generation].voted += 1;
    }
  }

  const byGeneration: GenerationTurnoutItem[] = Object.entries(cohortMap)
    .map(([genStr, counts]) => {
      const generation = Number(genStr);
      const percentage =
        counts.total > 0 ? Number(((counts.voted / counts.total) * 100).toFixed(2)) : 0;
      return {
        generation,
        totalVoters: counts.total,
        votedCount: counts.voted,
        turnoutPercentage: percentage,
      };
    })
    .sort((a, b) => a.generation - b.generation);

  return {
    totalDpt,
    totalVotesRecorded,
    totalVotersParticipated,
    turnoutPercentage,
    byGeneration,
    tally,
  };
}

export function resetBallotsStore(): void {
  inMemoryBallots = [];
  saveBallotsStore(inMemoryBallots);
}
