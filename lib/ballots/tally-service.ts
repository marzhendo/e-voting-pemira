import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getDevElectionSettings } from '@/lib/election/dev-settings-store';
import { isDevFallbackAllowed } from '@/lib/security/env';
import { calculateLiveTally } from './store';

export interface TallyCandidateSummary {
  candidateId: string;
  candidateNumber: number;
  leaderName: string;
  viceLeaderName: string;
  photoUrl?: string | null;
  voteCount: number;
  percentage: number;
}

export interface GenerationTurnoutSummary {
  generation: number;
  totalVoters: number;
  votedCount: number;
  turnoutPercentage: number;
}

export interface ElectionTallySnapshot {
  timestamp: string;
  electionSettings: {
    isVotingOpen: boolean;
    isClosed: boolean;
    maintenanceMode: boolean;
    startTime: string;
    endTime: string;
    allowKotakKosongMulti?: boolean;
  };
  turnout: {
    totalDpt: number;
    totalVotesRecorded: number;
    totalVotersParticipated: number;
    turnoutPercentage: number;
    byGeneration: GenerationTurnoutSummary[];
  };
  tally: TallyCandidateSummary[];
}

/**
 * Centralized Deep Module for Aggregating Election Tally & Turnout.
 *
 * Uses server-side SQL RPC (`get_election_tally_summary`) when available,
 * falls back cleanly to direct indexed queries on Supabase if RPC isn't migrated yet,
 * and supports offline dev-store only when live Supabase is unconfigured in non-production.
 */
export async function getElectionTallySnapshot(): Promise<ElectionTallySnapshot> {
  if (isSupabaseConfigured()) {
    const adminSupabase = createAdminClient();

    // 1. Primary path: high-performance SQL stored procedure + candidate portrait lookup (read-only)
    const [{ data: rpcSummary, error: rpcError }, { data: candidatePhotos }] = await Promise.all([
      adminSupabase.rpc('get_election_tally_summary'),
      adminSupabase
        .from('candidates')
        .select('id, photo_url')
        .eq('is_active', true),
    ]);

    if (!rpcError && rpcSummary && rpcSummary.success) {
      const photoById = new Map<string, string | null>();
      for (const cand of candidatePhotos || []) {
        photoById.set(cand.id, cand.photo_url || null);
      }

      const enrichedTally: TallyCandidateSummary[] = (rpcSummary.tally || []).map((item) => ({
        ...item,
        photoUrl:
          item.candidateNumber === 0
            ? null
            : photoById.get(item.candidateId) ?? null,
      }));

      return {
        timestamp: rpcSummary.timestamp || new Date().toISOString(),
        electionSettings: rpcSummary.electionSettings,
        turnout: rpcSummary.turnout,
        tally: enrichedTally,
      };
    }

    if (rpcError) {
      console.warn('[TallyService] RPC fallback to direct queries:', rpcError.message);
    }

    // 2. Secondary Supabase fallback: direct read queries
    const { data: settings, error: settingsError } = await adminSupabase
      .from('election_settings')
      .select('is_voting_open, start_time, end_time, maintenance_mode')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      throw new Error('Gagal membaca status pengaturan pemilihan dari Supabase.');
    }

    const isClosed = !settings.is_voting_open || new Date() > new Date(settings.end_time);

    const [{ data: candidates, error: candError }, { data: ballots, error: ballotError }, { data: voters, error: voterError }] =
      await Promise.all([
        adminSupabase
          .from('candidates')
          .select('id, candidate_number, leader_name, vice_leader_name, photo_url, is_active')
          .eq('is_active', true)
          .order('candidate_number', { ascending: true }),
        adminSupabase.from('ballots').select('candidate_id'),
        adminSupabase.from('voters_whitelist').select('generation, has_voted'),
      ]);

    if (candError || !candidates || ballotError || !ballots || voterError || !voters) {
      throw new Error('Gagal mengambil data kandidat, surat suara, atau partisipasi DPT.');
    }

    const totalVotes = ballots.length;
    const voteCounts: Record<string, number> = {};
    for (const b of ballots) {
      voteCounts[b.candidate_id] = (voteCounts[b.candidate_id] || 0) + 1;
    }

    const tally: TallyCandidateSummary[] = candidates.map((cand) => {
      const count = voteCounts[cand.id] || 0;
      const percentage = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(2)) : 0;
      return {
        candidateId: cand.id,
        candidateNumber: cand.candidate_number,
        leaderName: cand.leader_name,
        viceLeaderName: cand.vice_leader_name,
        photoUrl: cand.candidate_number === 0 ? null : cand.photo_url || null,
        voteCount: count,
        percentage,
      };
    });

    const totalDpt = voters.length;
    const totalVotedDpt = voters.filter((v) => v.has_voted).length;
    const overallTurnoutPercentage =
      totalDpt > 0 ? Number(((totalVotedDpt / totalDpt) * 100).toFixed(2)) : 0;

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

    const byGeneration: GenerationTurnoutSummary[] = Object.entries(cohortMap)
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
      timestamp: new Date().toISOString(),
      electionSettings: {
        isVotingOpen: settings.is_voting_open,
        isClosed,
        maintenanceMode: settings.maintenance_mode,
        startTime: settings.start_time,
        endTime: settings.end_time,
      },
      turnout: {
        totalDpt,
        totalVotesRecorded: totalVotes,
        totalVotersParticipated: totalVotedDpt,
        turnoutPercentage: overallTurnoutPercentage,
        byGeneration,
      },
      tally,
    };
  }

  // 3. Offline Dev Mode Fallback
  if (!isDevFallbackAllowed(false)) {
    throw new Error('Basis data pemilihan tidak tersedia pada mode produksi.');
  }

  const devSettings = getDevElectionSettings();
  const isClosed = !devSettings.is_voting_open || new Date() > new Date(devSettings.end_time);
  const liveData = calculateLiveTally();

  return {
    timestamp: new Date().toISOString(),
    electionSettings: {
      isVotingOpen: devSettings.is_voting_open,
      isClosed,
      maintenanceMode: devSettings.maintenance_mode,
      startTime: devSettings.start_time,
      endTime: devSettings.end_time,
      allowKotakKosongMulti: devSettings.allow_kotak_kosong_multi,
    },
    turnout: {
      totalDpt: liveData.totalDpt,
      totalVotesRecorded: liveData.totalVotesRecorded,
      totalVotersParticipated: liveData.totalVotersParticipated,
      turnoutPercentage: liveData.turnoutPercentage,
      byGeneration: liveData.byGeneration,
    },
    tally: liveData.tally,
  };
}
