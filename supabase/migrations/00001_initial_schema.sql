-- ==============================================================================
-- Migration: 00001_initial_schema.sql
-- Description: Core tables for Pemira HMIF E-Voting Platform
-- Standards: Pure anonymous ballot isolation, One-Man-One-Vote, Auditability
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
    generation INT NOT NULL, -- e.g. 2023, 2024, 2025, 2026
    has_voted BOOLEAN DEFAULT FALSE NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voters_nim ON public.voters_whitelist(nim);
CREATE INDEX IF NOT EXISTS idx_voters_email ON public.voters_whitelist(email);
CREATE INDEX IF NOT EXISTS idx_voters_generation ON public.voters_whitelist(generation);
CREATE INDEX IF NOT EXISTS idx_voters_has_voted ON public.voters_whitelist(has_voted);

-- 3. TABEL KANDIDAT & OPSI KOTAK KOSONG
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_number INT UNIQUE NOT NULL, -- 0 untuk Kotak Kosong / Abstain, 1..N untuk Paslon Resmi
    leader_name VARCHAR(150) NOT NULL,
    vice_leader_name VARCHAR(150) NOT NULL,
    vision TEXT NOT NULL,
    mission TEXT[] NOT NULL,
    photo_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_active ON public.candidates(is_active);
CREATE INDEX IF NOT EXISTS idx_candidates_number ON public.candidates(candidate_number);

-- 4. TABEL SURAT SUARA (BALLOTS) - TERISOLASI SECARA MURNI
-- INVARIAN ARSITEKTUR KEAMANAN:
-- DILARANG KERAS MENAMBAHKAN voter_id, nim, email, session_id, ip_address,
-- ATAU TIMESTAMP MILIDETIK PADA TABEL INI UNTUK MENCEGAH TIME-CORRELATION ATTACK.
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- 6. TABEL AUDIT LOGS (ADMINISTRATIVE TRAIL ONLY)
-- DILARANG MENYIMPAN PILIHAN KANDIDAT ATAU RAW RECEIPT TOKEN DI SINI
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_email VARCHAR(120) NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g. 'TOGGLE_VOTING', 'TOGGLE_MAINTENANCE', 'IMPORT_DPT', 'EXPORT_REPORT'
    details JSONB NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
