export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminRole = 'kpr_admin' | 'auditor' | 'super_admin';

export interface Database {
  public: {
    Tables: {
      voters_whitelist: {
        Row: {
          id: string;
          nim: string;
          email: string;
          name: string;
          generation: number;
          has_voted: boolean;
          voted_at: string | null;
          entra_tenant_id: string | null;
          entra_object_id: string | null;
          receipt_hash: string | null;
          otp_hash: string | null;
          otp_expires_at: string | null;
          otp_attempts: number;
          otp_last_sent_at: string | null;
          password_hash: string | null;
          password_created_at: string | null;
          login_attempts: number;
          locked_until: string | null;
          last_email_sent_at?: string | null;
          last_email_status?: string | null;
          last_email_error?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nim: string;
          email: string;
          name: string;
          generation: number;
          has_voted?: boolean;
          voted_at?: string | null;
          entra_tenant_id?: string | null;
          entra_object_id?: string | null;
          receipt_hash?: string | null;
          otp_hash?: string | null;
          otp_expires_at?: string | null;
          otp_attempts?: number;
          otp_last_sent_at?: string | null;
          password_hash?: string | null;
          password_created_at?: string | null;
          login_attempts?: number;
          locked_until?: string | null;
          last_email_sent_at?: string | null;
          last_email_status?: string | null;
          last_email_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nim?: string;
          email?: string;
          name?: string;
          generation?: number;
          has_voted?: boolean;
          voted_at?: string | null;
          entra_tenant_id?: string | null;
          entra_object_id?: string | null;
          receipt_hash?: string | null;
          otp_hash?: string | null;
          otp_expires_at?: string | null;
          otp_attempts?: number;
          otp_last_sent_at?: string | null;
          password_hash?: string | null;
          password_created_at?: string | null;
          login_attempts?: number;
          locked_until?: string | null;
          last_email_sent_at?: string | null;
          last_email_status?: string | null;
          last_email_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          id: string;
          candidate_number: number;
          leader_name: string;
          vice_leader_name: string;
          vision: string;
          mission: string[];
          photo_url: string;
          chairman_cv_url?: string | null;
          vice_chairman_cv_url?: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_number: number;
          leader_name: string;
          vice_leader_name: string;
          vision: string;
          mission: string[];
          photo_url: string;
          chairman_cv_url?: string | null;
          vice_chairman_cv_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_number?: number;
          leader_name?: string;
          vice_leader_name?: string;
          vision?: string;
          mission?: string[];
          photo_url?: string;
          chairman_cv_url?: string | null;
          vice_chairman_cv_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      ballots: {
        Row: {
          id: string;
          candidate_id: string;
          voting_session_date: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          voting_session_date?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          voting_session_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ballots_candidate_id_fkey';
            columns: ['candidate_id'];
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          }
        ];
      };
      election_settings: {
        Row: {
          id: number;
          is_voting_open: boolean;
          start_time: string;
          end_time: string;
          maintenance_mode: boolean;
          allow_kotak_kosong_multi?: boolean;
          updated_at: string;
        };
        Insert: {
          id?: number;
          is_voting_open?: boolean;
          start_time: string;
          end_time: string;
          maintenance_mode?: boolean;
          allow_kotak_kosong_multi?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: number;
          is_voting_open?: boolean;
          start_time?: string;
          end_time?: string;
          maintenance_mode?: boolean;
          allow_kotak_kosong_multi?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_email: string;
          action: string;
          details: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_email: string;
          action: string;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_email?: string;
          action?: string;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          entra_tenant_id: string | null;
          entra_object_id: string | null;
          email: string;
          role: AdminRole;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entra_tenant_id?: string | null;
          entra_object_id?: string | null;
          email: string;
          role: AdminRole;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entra_tenant_id?: string | null;
          entra_object_id?: string | null;
          email?: string;
          role?: AdminRole;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      cast_ballot_secure: {
        Args: {
          p_nim: string;
          p_candidate_id: string;
          p_receipt_hash?: string | null;
        };
        Returns: {
          success: boolean;
          code: string;
          message: string;
        };
      };
      request_voter_otp_secure: {
        Args: {
          p_identifier: string;
          p_pin_hash: string;
          p_expires_at: string;
          p_cooldown_seconds?: number;
        };
        Returns: {
          success: boolean;
          code: string;
          message?: string;
          cooldownSeconds?: number;
          voter?: {
            id: string;
            nim: string;
            name: string;
            email: string;
            generation: number;
            has_voted: boolean;
          };
        };
      };
      verify_voter_otp_secure: {
        Args: {
          p_identifier: string;
          p_pin_hash: string;
        };
        Returns: {
          success: boolean;
          code: string;
          message?: string;
          remainingAttempts?: number;
          voter?: {
            id: string;
            nim: string;
            name: string;
            email: string;
            generation: number;
            has_voted: boolean;
          };
        };
      };
      get_election_tally_summary: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          timestamp: string;
          electionSettings: {
            isVotingOpen: boolean;
            isClosed: boolean;
            maintenanceMode: boolean;
            startTime: string;
            endTime: string;
            allowKotakKosongMulti: boolean;
          };
          turnout: {
            totalDpt: number;
            totalVotesRecorded: number;
            totalVotersParticipated: number;
            turnoutPercentage: number;
            byGeneration: Array<{
              generation: number;
              totalVoters: number;
              votedCount: number;
              turnoutPercentage: number;
            }>;
          };
          tally: Array<{
            candidateId: string;
            candidateNumber: number;
            leaderName: string;
            viceLeaderName: string;
            voteCount: number;
            percentage: number;
          }>;
        };
      };
      reset_election_simulation_ballots: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          deletedBallotsCount: number;
          message: string;
        };
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
