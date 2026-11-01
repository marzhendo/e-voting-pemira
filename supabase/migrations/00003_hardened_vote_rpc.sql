-- ==============================================================================
-- Migration: 00003_hardened_vote_rpc.sql
-- Description: Hardened atomic vote casting procedure
-- Fixes applied from audit:
--   1. Validates maintenance_mode in election_settings
--   2. Explicit search_path = public, pg_temp to prevent hijack
--   3. Explicit Asia/Jakarta session date
--   4. Atomic update of receipt_hash (SHA-256) alongside has_voted
--   5. Execution revoked from PUBLIC, anon, authenticated; granted ONLY to service_role
-- ==============================================================================

-- Fungsi Utama (3 Parameter: NIM, Candidate ID, Receipt Hash)
CREATE OR REPLACE FUNCTION public.cast_ballot_secure(
    p_nim VARCHAR(15),
    p_candidate_id UUID,
    p_receipt_hash VARCHAR(64) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_voting_open BOOLEAN;
    v_has_voted BOOLEAN;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_session_date DATE := (v_now AT TIME ZONE 'Asia/Jakarta')::DATE;
BEGIN
    -- 1. Validasi Jendela Pemilihan & Emergency Maintenance Mode
    SELECT is_voting_open AND NOT maintenance_mode AND (v_now BETWEEN start_time AND end_time)
    INTO v_voting_open
    FROM public.election_settings
    WHERE id = 1;

    IF v_voting_open IS NOT TRUE THEN
        -- Deteksi penyebab spesifik untuk respon informatif
        IF EXISTS (SELECT 1 FROM public.election_settings WHERE id = 1 AND maintenance_mode = TRUE) THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'MAINTENANCE_MODE',
                'message', 'Bilik suara sedang ditutup sementara untuk pemeliharaan teknis darurat.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'VOTING_CLOSED',
            'message', 'Bilik suara belum dibuka atau jadwal pemungutan suara telah berakhir.'
        );
    END IF;

    -- 2. Lock baris pemilih untuk serialisasi konkurensi (Anti Race-Condition)
    SELECT has_voted
    INTO v_has_voted
    FROM public.voters_whitelist
    WHERE nim = p_nim
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_REGISTERED',
            'message', 'NIM Anda tidak terdaftar dalam Daftar Pemilih Tetap (DPT).'
        );
    END IF;

    IF v_has_voted THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_VOTED',
            'message', 'Hak suara Anda telah digunakan sebelumnya. Satu pemilih hanya berhak mencoblos satu kali.'
        );
    END IF;

    -- 3. Verifikasi kandidat aktif
    IF NOT EXISTS (
        SELECT 1
        FROM public.candidates
        WHERE id = p_candidate_id
          AND is_active = TRUE
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_CANDIDATE',
            'message', 'Pilihan pasangan calon atau opsi pemilihan tidak sah atau tidak aktif.'
        );
    END IF;

    -- 4. Mutasi Data Pemilih: tandai has_voted = TRUE dan simpan receipt_hash jika ada
    UPDATE public.voters_whitelist
    SET has_voted = TRUE,
        voted_at = v_now,
        receipt_hash = COALESCE(p_receipt_hash, receipt_hash)
    WHERE nim = p_nim;

    -- 5. Masukkan Surat Suara (MURNI TERISOLASI TANPA IDENTITAS PEMILIH)
    -- Invarian: Dilarang menyertakan p_nim, voter_id, atau id relasi di sini!
    INSERT INTO public.ballots (candidate_id, voting_session_date)
    VALUES (p_candidate_id, v_session_date);

    RETURN jsonb_build_object(
        'success', true,
        'code', 'SUCCESS',
        'message', 'Suara Anda berhasil dicatat secara sah ke dalam bilik suara elektronik.'
    );
END;
$$;

-- Wrapper Kompatibilitas 2 Parameter (NIM, Candidate ID)
CREATE OR REPLACE FUNCTION public.cast_ballot_secure(
    p_nim VARCHAR(15),
    p_candidate_id UUID
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.cast_ballot_secure(p_nim, p_candidate_id, NULL);
$$;

-- 6. PEMBATASAN AKSES EKSEKUSI (ACCESS CONTROL HARDENING)
-- Cabut hak eksekusi langsung dari role publik browser di PostgREST Supabase
REVOKE EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID, VARCHAR) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID, VARCHAR) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID, VARCHAR) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID, VARCHAR) TO service_role;

REVOKE EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID) TO service_role;
