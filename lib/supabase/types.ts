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
          updated_at: string;
        };
        Insert: {
          id?: number;
          is_voting_open?: boolean;
          start_time: string;
          end_time: string;
          maintenance_mode?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: number;
          is_voting_open?: boolean;
          start_time?: string;
          end_time?: string;
          maintenance_mode?: boolean;
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
    };
  };
}
