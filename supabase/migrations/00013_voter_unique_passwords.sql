-- ==============================================================================
-- MIGRATION: 00013_voter_unique_passwords.sql
-- Description: Pre-generated unique password authentication for DPT voters.
-- Invariant: BALLOT SECRECY - No link between voters_whitelist and ballots table!
-- ==============================================================================

-- 1. Tambahkan kolom pendukung kata sandi pemilih pada voters_whitelist
ALTER TABLE public.voters_whitelist 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL;

-- 2. Index untuk mendukung pencarian cepat berdasarkan NIM dan status kata sandi
CREATE INDEX IF NOT EXISTS idx_voters_whitelist_pwd_lookup ON public.voters_whitelist(nim) WHERE password_hash IS NOT NULL;

-- 3. Komentar dokumentasi keamanan
COMMENT ON COLUMN public.voters_whitelist.password_hash IS 'Cryptographic hash (SHA-256 with server salt) of the pre-generated unique voter password. Zero plaintext stored.';
COMMENT ON COLUMN public.voters_whitelist.password_created_at IS 'Timestamp of when the unique password was generated.';
COMMENT ON COLUMN public.voters_whitelist.login_attempts IS 'Consecutive failed login attempts counter. Resets to 0 upon successful login.';
COMMENT ON COLUMN public.voters_whitelist.locked_until IS 'Timestamp until which login attempts for this NIM are temporarily locked out (rate-limiting protection).';
