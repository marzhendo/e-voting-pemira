-- ==============================================================================
-- Migration: 00008_enforce_append_only_storage.sql
-- Description: Enforce pure append-only storage policy on ballots and audit_logs
-- Invariant: Ballot Secrecy & Audit Trail Immutability
--   1. Blocks all UPDATE and DELETE operations at PostgreSQL trigger level.
--   2. Explicitly separates INSERT and SELECT privileges for service_role.
--   3. Revokes UPDATE and DELETE privileges from all database roles.
-- ==============================================================================

-- 1. FUNGSI TRIGGER PENOLAKAN MODIFIKASI DATA (APPEND-ONLY ENFORCER)
CREATE OR REPLACE FUNCTION public.prevent_append_only_modification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'CRITICAL SECURITY VIOLATION: Tabel % bersifat APPEND-ONLY. Operasi % DILARANG KERAS oleh protokol integritas Pemira HMIF.', 
        TG_TABLE_NAME, TG_OP;
END;
$$;

-- 2. PASANG TRIGGER PADA TABEL BALLOTS
DROP TRIGGER IF EXISTS trg_ballots_prevent_modification ON public.ballots;
CREATE TRIGGER trg_ballots_prevent_modification
BEFORE UPDATE OR DELETE ON public.ballots
FOR EACH ROW
EXECUTE FUNCTION public.prevent_append_only_modification();

-- 3. PASANG TRIGGER PADA TABEL AUDIT_LOGS
DROP TRIGGER IF EXISTS trg_audit_logs_prevent_modification ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_prevent_modification
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_append_only_modification();

-- 4. CABUT HAK DML UPDATE & DELETE PADA LEVEL PRIVILEGE POSTGRESQL
REVOKE UPDATE, DELETE ON TABLE public.ballots FROM PUBLIC, anon, authenticated, service_role;
REVOKE UPDATE, DELETE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated, service_role;

-- 5. REKONFIGURASI ROW LEVEL SECURITY (RLS) POLICIES
-- Ganti kebijakan "FOR ALL" menjadi kebijakan eksplisit INSERT dan SELECT saja
DROP POLICY IF EXISTS "Service role full access ballots" ON public.ballots;
DROP POLICY IF EXISTS "Service role insert ballots" ON public.ballots;
DROP POLICY IF EXISTS "Service role read ballots for tally" ON public.ballots;

CREATE POLICY "Service role insert ballots"
    ON public.ballots
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role read ballots for tally"
    ON public.ballots
    FOR SELECT
    TO service_role
    USING (true);

DROP POLICY IF EXISTS "Service role full access audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role read audit_logs" ON public.audit_logs;

CREATE POLICY "Service role insert audit_logs"
    ON public.audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role read audit_logs"
    ON public.audit_logs
    FOR SELECT
    TO service_role
    USING (true);
