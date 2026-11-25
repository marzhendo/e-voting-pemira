import type { SessionUser } from '../auth/session.ts';
import type { ElectionTallySnapshot, GenerationTurnoutSummary } from './tally-service.ts';

export interface RecapResultItem {
  candidateId: string;
  candidateNumber: number;
  leaderName: string;
  viceLeaderName: string;
  photoUrl: string | null;
  voteCount: number;
  percentage: number;
}

export interface ElectionRecapPayload {
  success: true;
  isClosed: boolean;
  timestamp: string;
  electionWindow: {
    startTime: string;
    endTime: string;
    isVotingOpen: boolean;
  };
  turnout: {
    totalDpt: number;
    totalVotes: number;
    turnoutPercentage: number;
    byGeneration: GenerationTurnoutSummary[];
  };
  message?: string;
  results?: RecapResultItem[];
}

export type RecapAuthDecision =
  | { authorized: true; user: SessionUser }
  | { authorized: false; status: 401; error: string };

/**
 * Verifies an authenticated session exists before serving voter turnout or tally data.
 */
export function authorizeRecapAccess(session: SessionUser | null): RecapAuthDecision {
  if (!session) {
    return {
      authorized: false,
      status: 401,
      error: 'Autentikasi diperlukan untuk melihat Partisipasi Pemilih dan Rekapitulasi Suara.',
    };
  }

  return { authorized: true, user: session };
}

/**
 * Formats an aggregated snapshot into the /rekapitulasi response payload.
 * Enforces Restricted Visibility: omits candidate vote totals whenever voting is active.
 */
export function formatRecapPayload(snapshot: ElectionTallySnapshot): ElectionRecapPayload {
  const isClosed = Boolean(snapshot.electionSettings.isClosed);

  const turnout = {
    totalDpt: snapshot.turnout.totalDpt,
    totalVotes: snapshot.turnout.totalVotesRecorded,
    turnoutPercentage: snapshot.turnout.turnoutPercentage,
    byGeneration: [...(snapshot.turnout.byGeneration || [])].sort(
      (a, b) => a.generation - b.generation
    ),
  };

  const electionWindow = {
    startTime: snapshot.electionSettings.startTime,
    endTime: snapshot.electionSettings.endTime,
    isVotingOpen: Boolean(snapshot.electionSettings.isVotingOpen),
  };

  if (!isClosed) {
    return {
      success: true,
      isClosed: false,
      timestamp: snapshot.timestamp,
      electionWindow,
      turnout,
      message:
        'Pemungutan suara sedang berlangsung. Rekapitulasi Suara tiap pasangan calon dikunci sampai bilik suara resmi ditutup oleh Panitia KPR.',
    };
  }

  // Rank descending by vote count so official results always lead with top vote-getter
  const rankedResults: RecapResultItem[] = [...(snapshot.tally || [])]
    .sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.candidateNumber - b.candidateNumber;
    })
    .map((item) => ({
      candidateId: item.candidateId,
      candidateNumber: item.candidateNumber,
      leaderName: item.leaderName,
      viceLeaderName: item.viceLeaderName,
      photoUrl: item.candidateNumber === 0 ? null : item.photoUrl ?? null,
      voteCount: item.voteCount,
      percentage: item.percentage,
    }));

  return {
    success: true,
    isClosed: true,
    timestamp: snapshot.timestamp,
    electionWindow,
    turnout,
    results: rankedResults,
  };
}
