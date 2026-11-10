-- ==============================================================================
-- ALL-IN-ONE INITIALIZATION SCRIPT FOR SUPABASE POSTGRESQL
-- Project: Platform E-Voting Pemira HMIF Telkom University Purwokerto
-- Standards: Pure Ballot Secrecy, Row-Level Locking, Atomic Concurrency
-- Instructions: Copy and paste this entire script into Supabase SQL Editor and click RUN.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL DAFTAR PEMILIH TETAP (DPT)
CREATE TABLE IF NOT EXISTS public.voters_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    generation INT NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE NULL,
    entra_tenant_id UUID NULL,
    entra_object_id UUID NULL,
    receipt_hash VARCHAR(64) NULL,
    otp_hash TEXT NULL,
    otp_expires_at TIMESTAMPTZ NULL,
    otp_attempts INT DEFAULT 0 NOT NULL,
    otp_last_sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_voters_entra_identity UNIQUE (entra_tenant_id, entra_object_id),
    CONSTRAINT chk_voters_entra_pair CHECK (
        (entra_tenant_id IS NULL AND entra_object_id IS NULL) OR
        (entra_tenant_id IS NOT NULL AND entra_object_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_voters_nim ON public.voters_whitelist(nim);
CREATE INDEX IF NOT EXISTS idx_voters_email ON public.voters_whitelist(lower(email));
CREATE INDEX IF NOT EXISTS idx_voters_generation ON public.voters_whitelist(generation);
CREATE INDEX IF NOT EXISTS idx_voters_has_voted ON public.voters_whitelist(has_voted);
CREATE INDEX IF NOT EXISTS idx_voters_receipt_hash ON public.voters_whitelist(receipt_hash);
CREATE INDEX IF NOT EXISTS idx_voters_entra_oid ON public.voters_whitelist(entra_object_id);

-- 3. TABEL KANDIDAT & OPSI KOTAK KOSONG
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_number INT UNIQUE NOT NULL, -- 0 untuk Kotak Kosong, 1..N untuk Paslon Resmi
    leader_name VARCHAR(150) NOT NULL,
    vice_leader_name VARCHAR(150) NOT NULL,
    vision TEXT NOT NULL,
    mission TEXT[] NOT NULL,
    photo_url TEXT NOT NULL,
    chairman_cv_url TEXT NULL,
    vice_chairman_cv_url TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidates_active ON public.candidates(is_active);
CREATE INDEX IF NOT EXISTS idx_candidates_number ON public.candidates(candidate_number);

-- 4. TABEL SURAT SUARA (BALLOTS) - TERISOLASI SECARA MURNI
-- INVARIAN ARSITEKTUR: DILARANG MENYIMPAN NIM, VOTER ID, ATAU IP DI SINI!
CREATE TABLE IF NOT EXISTS public.ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
    voting_session_date DATE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ballots_candidate ON public.ballots(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ballots_session_date ON public.ballots(voting_session_date);

-- 5. TABEL PENGATURAN PEMILIHAN (ELECTION SETTINGS)
CREATE TABLE IF NOT EXISTS public.election_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_voting_open BOOLEAN DEFAULT FALSE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
    allow_kotak_kosong_multi BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- 6. TABEL AUDIT LOGS (ADMINISTRATIVE TRAIL ONLY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_email VARCHAR(120) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 7. TABEL PENGELOLA PEMIRA (ADMIN USERS WHITELIST)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entra_tenant_id UUID NULL,
    entra_object_id UUID NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('kpr_admin', 'auditor', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by VARCHAR(120) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_admin_entra_identity UNIQUE (entra_tenant_id, entra_object_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.voters_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Candidates: Publik hanya berhak melihat kandidat aktif
DROP POLICY IF EXISTS "Public read active candidates" ON public.candidates;
CREATE POLICY "Public read active candidates"
    ON public.candidates FOR SELECT TO anon, authenticated USING (is_active = TRUE);

DROP POLICY IF EXISTS "Service role full access candidates" ON public.candidates;
CREATE POLICY "Service role full access candidates"
    ON public.candidates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Election Settings: Publik hanya berhak membaca jadwal
DROP POLICY IF EXISTS "Public read election settings" ON public.election_settings;
CREATE POLICY "Public read election settings"
    ON public.election_settings FOR SELECT TO anon, authenticated USING (id = 1);

DROP POLICY IF EXISTS "Service role full access election_settings" ON public.election_settings;
CREATE POLICY "Service role full access election_settings"
    ON public.election_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ballots: Ditolak total dari browser publik (akses hanya via RPC / service_role). Hanya INSERT dan SELECT (Append-Only)
DROP POLICY IF EXISTS "Deny direct public access to ballots" ON public.ballots;
CREATE POLICY "Deny direct public access to ballots"
    ON public.ballots FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Service role full access ballots" ON public.ballots;
DROP POLICY IF EXISTS "Service role insert ballots" ON public.ballots;
DROP POLICY IF EXISTS "Service role read ballots for tally" ON public.ballots;

CREATE POLICY "Service role insert ballots"
    ON public.ballots FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role read ballots for tally"
    ON public.ballots FOR SELECT TO service_role USING (true);

-- Voters Whitelist: Ditolak total dari browser publik
DROP POLICY IF EXISTS "Deny direct public access to voters_whitelist" ON public.voters_whitelist;
CREATE POLICY "Deny direct public access to voters_whitelist"
    ON public.voters_whitelist FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Service role full access voters_whitelist" ON public.voters_whitelist;
CREATE POLICY "Service role full access voters_whitelist"
    ON public.voters_whitelist FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit Logs: Ditolak dari browser publik. Hanya INSERT dan SELECT (Append-Only)
DROP POLICY IF EXISTS "Deny direct public access to audit_logs" ON public.audit_logs;
CREATE POLICY "Deny direct public access to audit_logs"
    ON public.audit_logs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Service role full access audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role read audit_logs" ON public.audit_logs;

CREATE POLICY "Service role insert audit_logs"
    ON public.audit_logs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role read audit_logs"
    ON public.audit_logs FOR SELECT TO service_role USING (true);

-- Admin Users: Ditolak dari browser publik
DROP POLICY IF EXISTS "Deny direct public access to admin_users" ON public.admin_users;
CREATE POLICY "Deny direct public access to admin_users"
    ON public.admin_users FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Service role full access admin_users" ON public.admin_users;
CREATE POLICY "Service role full access admin_users"
    ON public.admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Cabut Izin DML UPDATE & DELETE untuk tabel Append-Only
REVOKE UPDATE, DELETE ON TABLE public.ballots FROM PUBLIC, anon, authenticated, service_role;
REVOKE UPDATE, DELETE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated, service_role;

-- Enforce Append-Only Triggers
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

DROP TRIGGER IF EXISTS trg_ballots_prevent_modification ON public.ballots;
CREATE TRIGGER trg_ballots_prevent_modification
BEFORE UPDATE OR DELETE ON public.ballots
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_modification();

DROP TRIGGER IF EXISTS trg_audit_logs_prevent_modification ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_prevent_modification
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_modification();

-- Enforce Superadmin Immutability Trigger
CREATE OR REPLACE FUNCTION public.protect_superadmin_immutability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF LOWER(OLD.email) = 'marzhendogalangs@gmail.com' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'CRITICAL SECURITY: Akun Superadmin utama (%) bersifat IMMUTABLE dan DILARANG dihapus dari sistem Pemira HMIF.', OLD.email;
        END IF;

        IF TG_OP = 'UPDATE' THEN
            IF NEW.is_active = FALSE THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Akun Superadmin utama (%) tidak boleh dinonaktifkan.', OLD.email;
            END IF;

            IF NEW.role <> 'super_admin' THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Peran akun Superadmin utama (%) tidak boleh diubah atau diturunkan.', OLD.email;
            END IF;

            IF LOWER(NEW.email) <> LOWER(OLD.email) THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Alamat email akun Superadmin utama (%) tidak boleh diubah.', OLD.email;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_superadmin_admin_users ON public.admin_users;
CREATE TRIGGER trg_protect_superadmin_admin_users
BEFORE UPDATE OR DELETE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.protect_superadmin_immutability();

DROP TRIGGER IF EXISTS trg_protect_superadmin_voters ON public.voters_whitelist;
CREATE TRIGGER trg_protect_superadmin_voters
BEFORE DELETE ON public.voters_whitelist
FOR EACH ROW
WHEN (LOWER(OLD.email) = 'marzhendogalangs@gmail.com')
EXECUTE FUNCTION public.protect_superadmin_immutability();

-- ==============================================================================
-- 9. STORED PROCEDURE: ATOMIC VOTE SUBMISSION (cast_ballot_secure)
-- ==============================================================================
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

    -- 2. Lock baris pemilih (FOR UPDATE) untuk anti race condition
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

    -- 4. Mutasi data pemilih: tandai has_voted = TRUE dan simpan receipt_hash
    UPDATE public.voters_whitelist
    SET has_voted = TRUE,
        voted_at = v_now,
        receipt_hash = COALESCE(p_receipt_hash, receipt_hash)
    WHERE nim = p_nim;

    -- 5. Masukkan surat suara murni terisolasi anonim
    INSERT INTO public.ballots (candidate_id, voting_session_date)
    VALUES (p_candidate_id, v_session_date);

    RETURN jsonb_build_object(
        'success', true,
        'code', 'SUCCESS',
        'message', 'Suara Anda berhasil dicatat secara sah ke dalam bilik suara elektronik.'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cast_ballot_secure(VARCHAR, UUID, VARCHAR) TO service_role;

-- ==============================================================================
-- 10. STORED PROCEDURES: ATOMIC OTP (REQUEST & VERIFY)
-- ==============================================================================
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

    IF v_voter.has_voted THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_VOTED',
            'message', 'Hak suara kamu telah digunakan pada pemilihan ini.'
        );
    END IF;

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

    IF v_now > v_voter.otp_expires_at THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'OTP_EXPIRED',
            'message', 'Kode PIN telah kedaluwarsa (10 menit). Silakan minta kode baru.'
        );
    END IF;

    IF v_voter.otp_attempts >= 3 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'MAX_ATTEMPTS_EXCEEDED',
            'remainingAttempts', 0,
            'message', 'Batas percobaan salah terlampaui. Silakan minta kode PIN baru.'
        );
    END IF;

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
            'message', CASE 
                WHEN v_remaining > 0 THEN 'Kode PIN salah. Sisa kesempatan: ' || v_remaining || ' kali.'
                ELSE 'Kode PIN salah. Batas percobaan habis, silakan minta kode baru.'
            END
        );
    END IF;

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

REVOKE EXECUTE ON FUNCTION public.request_voter_otp_secure(VARCHAR, TEXT, TIMESTAMPTZ, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_voter_otp_secure(VARCHAR, TEXT, TIMESTAMPTZ, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_voter_otp_secure(VARCHAR, TEXT) TO service_role;

-- ==============================================================================
-- 11. DATA AWAL (SEED DATA: SETTINGS, KANDIDAT, ADMIN, & TEST DPT)
-- ==============================================================================
-- 1. Pengaturan Pemilihan (Jendela Buka 14 Hari)
INSERT INTO public.election_settings (id, is_voting_open, start_time, end_time, maintenance_mode, allow_kotak_kosong_multi)
VALUES (1, TRUE, NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', FALSE, TRUE)
ON CONFLICT (id) DO UPDATE SET
    is_voting_open = EXCLUDED.is_voting_open,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    maintenance_mode = EXCLUDED.maintenance_mode,
    allow_kotak_kosong_multi = EXCLUDED.allow_kotak_kosong_multi;

-- 2. Pasangan Calon & Kotak Kosong
INSERT INTO public.candidates (candidate_number, leader_name, vice_leader_name, vision, mission, photo_url, is_active)
VALUES
    (
        0,
        'Kotak Kosong',
        'Tidak Memilih Calon Manapun',
        'Opsi sah bila pemilih memutuskan untuk tidak memberikan suara kepada seluruh pasangan calon terdaftar.',
        ARRAY['Menjaga prinsip kebebasan berekspresi dan hak pilih demokratis mahasiswa.'],
        '/assets/img/tel-u-logo.png',
        TRUE
    ),
    (
        1,
        'Calon Ketua 1',
        'Calon Wakil 1',
        'Mewujudkan HMIF yang sinergis, inovatif, dan berdaya saing global berbasis teknologi masa depan.',
        ARRAY[
            'Optimalisasi program kerja inovasi berbasis teknologi.',
            'Peningkatan prestasi akademik dan non-akademik mahasiswa Informatika.'
        ],
        '/assets/img/tel-u-logo.png',
        TRUE
    )
ON CONFLICT (candidate_number) DO NOTHING;

-- 3. Daftar Administrator Awal
INSERT INTO public.admin_users (email, role, is_active, created_by)
VALUES
    ('marzhendogalangs@gmail.com', 'super_admin', TRUE, 'INITIAL_SETUP'),
    ('marzhendo03@gmail.com', 'super_admin', TRUE, 'INITIAL_SETUP'),
    ('kpradmin@student.telkomuniversity.ac.id', 'kpr_admin', TRUE, 'INITIAL_SETUP')
ON CONFLICT (email) DO NOTHING;

-- 4. Sample DPT untuk Pengujian Awal & Akun Administrator
INSERT INTO public.voters_whitelist (nim, email, name, generation, has_voted)
VALUES
    ('999999999999', 'marzhendogalangs@gmail.com', 'Marzhendo Galang (Superadmin)', 2024, FALSE),
    ('103012300001', 'voter1@student.telkomuniversity.ac.id', 'Ahmad Rizky Pratama', 2023, FALSE),
    ('103012400099', 'marzhendo03@gmail.com', 'Marzhendo (Tester)', 2024, FALSE),
    ('103112400102', 'marzhendogalang@student.telkomuniversity.ac.id', 'Penguji Sistem KPR (Galang)', 2024, FALSE)
ON CONFLICT (nim) DO NOTHING;
