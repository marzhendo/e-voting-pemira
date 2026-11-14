-- ==============================================================================
-- Migration: 00011_reset_simulation_ballots_rpc.sql
-- Description: Stored procedure for Superadmin to reset simulation/testing ballots
-- Standards:
--   1. Runs as SECURITY DEFINER with elevated privileges to temporarily bypass append-only trigger.
--   2. Truncates public.ballots to clear simulation votes.
--   3. Resets has_voted, voted_at, and receipt_hash on public.voters_whitelist using WHERE clause (Supabase safeupdate compliant).
--   4. Immediately re-enables trg_ballots_prevent_modification.
--   5. Execution granted exclusively to service_role; revoked from PUBLIC/anon/authenticated.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.reset_election_simulation_ballots()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_deleted_count BIGINT := 0;
BEGIN
    -- 1. Hitung total surat suara sebelum pembersihan
    SELECT COUNT(*) INTO v_deleted_count FROM public.ballots;

    -- 2. Nonaktifkan sementara trigger append-only pada tabel ballots
    ALTER TABLE public.ballots DISABLE TRIGGER trg_ballots_prevent_modification;

    -- 3. Kosongkan seluruh surat suara simulasi
    TRUNCATE TABLE public.ballots;

    -- 4. Aktifkan kembali trigger append-only demi menjamin keamanan berkelanjutan
    ALTER TABLE public.ballots ENABLE TRIGGER trg_ballots_prevent_modification;

    -- 5. Pulihkan status pemilih di DPT (klausa WHERE wajib ada untuk ekstensi safeupdate PostgreSQL)
    UPDATE public.voters_whitelist 
    SET has_voted = FALSE,
        voted_at = NULL,
        receipt_hash = NULL
    WHERE id IS NOT NULL;

    RETURN jsonb_build_object(
        'success', TRUE,
        'deletedBallotsCount', v_deleted_count,
        'message', 'Seluruh surat suara simulasi berhasil dikosongkan dan status DPT telah dipulihkan.'
    );
EXCEPTION WHEN OTHERS THEN
    -- Pastikan trigger tetap aktif kembali jika terjadi error tak terduga
    ALTER TABLE public.ballots ENABLE TRIGGER trg_ballots_prevent_modification;
    RAISE;
END;
$$;

-- Cabut akses eksekusi dari publik dan peruntukkan HANYA untuk service_role
REVOKE EXECUTE ON FUNCTION public.reset_election_simulation_ballots() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_election_simulation_ballots() TO service_role;
