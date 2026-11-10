-- ==============================================================================
-- Migration: 00010_hardened_otp_invalidation.sql
-- Description: Instant invalidation of OTP secrets upon 3 failed attempts
-- Features:
--   1. Destroys otp_hash and otp_expires_at immediately upon reaching 3 attempts.
--   2. Prevents any residual brute-force attack window.
--   3. Maintains atomicity and row-level locking (FOR UPDATE).
-- ==============================================================================

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

    -- 3. Validasi Batas Percobaan Maksimal (Lockout)
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

        -- Jika mencapai batas percobaan 3x, SEGERA HANCURKAN HASH PIN
        IF v_next_attempts >= 3 THEN
            UPDATE public.voters_whitelist
            SET otp_attempts = v_next_attempts,
                otp_hash = NULL,
                otp_expires_at = NULL
            WHERE id = v_voter.id;

            RETURN jsonb_build_object(
                'success', false,
                'code', 'MAX_ATTEMPTS_EXCEEDED',
                'remainingAttempts', 0,
                'message', 'Batas percobaan (3x) telah habis. Kode PIN telah dibatalkan demi keamanan. Silakan minta kode baru.'
            );
        END IF;

        UPDATE public.voters_whitelist
        SET otp_attempts = v_next_attempts
        WHERE id = v_voter.id;

        v_remaining := GREATEST(0, 3 - v_next_attempts);

        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PIN',
            'remainingAttempts', v_remaining,
            'message', 'Kode PIN salah. Sisa kesempatan: ' || v_remaining || ' kali.'
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

REVOKE EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) TO service_role;
