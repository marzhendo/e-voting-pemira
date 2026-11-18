export type DashboardTabId =
  | 'overview'
  | 'candidates'
  | 'dpt'
  | 'tally'
  | 'settings'
  | 'emails'
  | 'audit'
  | 'admins';

export interface TallyItem {
  candidateId: string;
  candidateNumber: number;
  leaderName: string;
  viceLeaderName: string;
  voteCount: number;
  percentage: number;
}

export interface GenerationTurnout {
  generation: number;
  totalVoters: number;
  votedCount: number;
  turnoutPercentage: number;
}

export interface VoterRow {
  id: string;
  nim: string;
  name: string;
  email: string;
  generation: number;
  has_voted: boolean;
  updated_at: string;
}

export interface CandidateItem {
  id: string;
  candidate_number: number;
  leader_name: string;
  vice_leader_name: string;
  vision: string;
  mission: string[];
  photo_url: string | null;
  chairman_cv_url?: string | null;
  vice_chairman_cv_url?: string | null;
  is_active?: boolean;
}

export interface AuditLogItem {
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

export interface AdminUserItem {
  id: string;
  nim?: string;
  name: string;
  email: string;
  role: 'super_admin' | 'kpr_admin' | 'auditor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToggleModalConfig {
  type: 'voting_open' | 'maintenance_mode';
  targetValue: boolean;
  title: string;
  description: string;
  defaultReason: string;
  isDanger: boolean;
}
