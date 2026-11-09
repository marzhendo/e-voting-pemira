-- ==============================================================================
-- Migration: 00006_atomic_otp_procedures.sql
-- Description: Hardened atomic OTP generation and verification procedures
-- Invariant: Ballot Secrecy maintained (only touches voters_whitelist)
-- Features:
--   1. request_voter_otp_secure: Row-level lock (FOR UPDATE), anti double-click,
--      strict 60-second cooldown calculation in PostgreSQL.
--   2. verify_voter_otp_secure: Row-level lock (FOR UPDATE), anti concurrent brute-force,
--      atomic failed-attempt increment, and 3x lockout enforcement.
--   3. Execution revoked from PUBLIC, anon, authenticated; granted ONLY to service_role.
-- ==============================================================================

-- 1. PROSEDUR ATOMIK REQUEST OTP
CREATE OR REPLACE FUNCTION public.request_voter_otp_secure(
    p_identifier VARCHAR,
    p_pin_hash TEXT,
    p_expires_at TIMESTAMPTZ,
    p_cooldown_seconds INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_voter RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_diff_seconds NUMERIC;
    v_remaining_seconds INT;
BEGIN
    -- 1. Kunci baris pemilih (FOR UPDATE) untuk serialisasi transaksi konkuren
    SELECT id, nim, name, email, generation, has_voted, otp_last_sent_at
    INTO v_voter
    FROM public.voters_whitelist
    WHERE (nim = p_identifier OR LOWER(email) = LOWER(p_identifier))
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NIM_NOT_IN_DPT',
            'message', 'NIM atau email kamu belum terdaftar dalam Daftar Pemilih Tetap (DPT) Pemira HMIF.'
        );
    END IF;

    -- 2. Cek apakah pemilih sudah pernah menggunakan hak suara
    IF v_voter.has_voted THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_VOTED',
            'message', 'Hak suara kamu telah digunakan pada pemilihan ini.'
        );
    END IF;

    -- 3. Cek Cooldown Anti-Spam (Serial & Atomik)
    IF v_voter.otp_last_sent_at IS NOT NULL THEN
        v_diff_seconds := EXTRACT(EPOCH FROM (v_now - v_voter.otp_last_sent_at));
        IF v_diff_seconds < p_cooldown_seconds THEN
            v_remaining_seconds := CEIL(p_cooldown_seconds - v_diff_seconds)::INT;
            RETURN jsonb_build_object(
                'success', false,
                'code', 'RATE_LIMITED',
                'cooldownSeconds', v_remaining_seconds,
                'message', 'Mohon tunggu ' || v_remaining_seconds || ' detik sebelum meminta kode PIN baru.'
            );
        END IF;
    END IF;

    -- 4. Mutasi status OTP atomik
    UPDATE public.voters_whitelist
    SET otp_hash = p_pin_hash,
        otp_expires_at = p_expires_at,
        otp_attempts = 0,
        otp_last_sent_at = v_now
    WHERE id = v_voter.id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'SUCCESS',
        'voter', jsonb_build_object(
            'id', v_voter.id,
            'nim', v_voter.nim,
            'name', v_voter.name,
            'email', v_voter.email,
            'generation', v_voter.generation,
            'has_voted', v_voter.has_voted
        )
    );
END;
$$;

-- 2. PROSEDUR ATOMIK VERIFIKASI OTP
CREATE OR REPLACE FUNCTION public.verify_voter_otp_secure(
    p_identifier VARCHAR,
    p_pin_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_voter RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_next_attempts INT;
    v_remaining INT;
BEGIN
    -- 1. Kunci baris pemilih (FOR UPDATE) mencegah bypass konkurensi brute-force
    SELECT id, nim, name, email, generation, has_voted, otp_hash, otp_expires_at, otp_attempts
    INTO v_voter
    FROM public.voters_whitelist
    WHERE (nim = p_identifier OR LOWER(email) = LOWER(p_identifier))
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NIM_NOT_IN_DPT',
            'message', 'Data mahasiswa tidak ditemukan di DPT.'
        );
    END IF;

    IF v_voter.has_voted THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_VOTED',
            'message', 'Hak suara kamu telah digunakan sebelumnya.'
        );
    END IF;

    IF v_voter.otp_hash IS NULL OR v_voter.otp_expires_at IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NO_OTP_ACTIVE',
            'message', 'Tidak ada kode PIN aktif. Silakan minta kode baru.'
        );
    END IF;

    -- 2. Validasi Batas Waktu Kadaluarsa
    IF v_now > v_voter.otp_expires_at THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'OTP_EXPIRED',
            'message', 'Kode PIN telah kedaluwarsa (10 menit). Silakan minta kode baru.'
        );
    END IF;

    -- 3. Validasi Batas Percobaan Maksimal (3x Lockout)
    IF v_voter.otp_attempts >= 3 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'MAX_ATTEMPTS_EXCEEDED',
            'remainingAttempts', 0,
            'message', 'Batas percobaan salah terlampaui. Silakan minta kode PIN baru.'
        );
    END IF;

    -- 4. Verifikasi Hash Kriptografis
    IF v_voter.otp_hash <> p_pin_hash THEN
        v_next_attempts := COALESCE(v_voter.otp_attempts, 0) + 1;

        UPDATE public.voters_whitelist
        SET otp_attempts = v_next_attempts
        WHERE id = v_voter.id;

        v_remaining := GREATEST(0, 3 - v_next_attempts);

        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PIN',
            'remainingAttempts', v_remaining,
            'message', CASE 
                WHEN v_remaining > 0 THEN 'Kode PIN salah. Sisa kesempatan: ' || v_remaining || ' kali.'
                ELSE 'Kode PIN salah. Batas percobaan habis, silakan minta kode baru.'
            END
        );
    END IF;

    -- 5. Verifikasi Berhasil: Bersihkan State OTP
    UPDATE public.voters_whitelist
    SET otp_hash = NULL,
        otp_expires_at = NULL,
        otp_attempts = 0
    WHERE id = v_voter.id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'SUCCESS',
        'voter', jsonb_build_object(
            'id', v_voter.id,
            'nim', v_voter.nim,
            'name', v_voter.name,
            'email', v_voter.email,
            'generation', v_voter.generation,
            'has_voted', v_voter.has_voted
        )
    );
END;
$$;

-- 3. CABUT HAK AKSES DARI PUBLIK (LEAST PRIVILEGE)
REVOKE EXECUTE ON FUNCTION public.request_voter_otp_secure(VARCHAR, TEXT, TIMESTAMPTZ, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.request_voter_otp_secure(VARCHAR, TEXT, TIMESTAMPTZ, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_voter_otp_secure(VARCHAR, TEXT, TIMESTAMPTZ, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.request_voter_otp_secure(VARCHAR, TEXT, TIMESTAMPTZ, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) TO service_role;
