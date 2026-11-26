import { getElectionTallySnapshot } from "@/lib/ballots/tally-service";

export type PublicElectionPhase = "upcoming" | "active" | "maintenance" | "closed";

export interface PublicElectionSummary {
  phase: PublicElectionPhase;
  startTime: string | null;
  endTime: string | null;
  totalDpt: number | null;
  totalVotes: number | null;
  turnoutPercentage: number | null;
  candidateCount: number | null;
  dataAvailable: boolean;
}

export function deriveElectionPhase(input: {
  isVotingOpen: boolean;
  maintenanceMode: boolean;
  startTime: string;
  endTime: string;
  now?: Date;
}): PublicElectionPhase {
  if (input.maintenanceMode) {
    return "maintenance";
  }

  const now = input.now ?? new Date();
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  if (!input.isVotingOpen || (!Number.isNaN(end.getTime()) && now > end)) {
    return "closed";
  }

  if (!Number.isNaN(start.getTime()) && now < start) {
    return "upcoming";
  }

  return "active";
}

/**
 * Mengambil ringkasan siklus pemilihan publik secara aman di sisi server.
 * Tidak pernah mengembalikan rincian perolehan suara pasangan calon.
 */
export async function getPublicElectionSummary(): Promise<PublicElectionSummary> {
  try {
    const snapshot = await getElectionTallySnapshot();
    const { electionSettings, turnout, tally } = snapshot;

    const phase = deriveElectionPhase({
      isVotingOpen: electionSettings.isVotingOpen,
      maintenanceMode: electionSettings.maintenanceMode,
      startTime: electionSettings.startTime,
      endTime: electionSettings.endTime,
    });

    const regularCandidates = tally.filter((item) => item.candidateNumber > 0);

    return {
      phase,
      startTime: electionSettings.startTime || null,
      endTime: electionSettings.endTime || null,
      totalDpt: turnout.totalDpt,
      totalVotes: turnout.totalVotersParticipated,
      turnoutPercentage: turnout.turnoutPercentage,
      candidateCount: regularCandidates.length,
      dataAvailable: true,
    };
  } catch (error) {
    console.warn("[PublicElectionSummary] Gagal memuat ringkasan pemilihan:", error);
    return {
      phase: "closed",
      startTime: null,
      endTime: null,
      totalDpt: null,
      totalVotes: null,
      turnoutPercentage: null,
      candidateCount: null,
      dataAvailable: false,
    };
  }
}
