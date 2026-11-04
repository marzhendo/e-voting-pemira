-- ==============================================================================
-- MIGRATION: 00004_voter_otp_auth.sql
-- Description: Just-In-Time (JIT) 6-Digit OTP Authentication for Voters
-- Invariant: BALLOT SECRECY - No link between voters_whitelist and ballots table!
-- ==============================================================================

-- 1. Tambahkan kolom pendukung OTP pada voters_whitelist
ALTER TABLE public.voters_whitelist 
ADD COLUMN IF NOT EXISTS otp_hash TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_last_sent_at TIMESTAMPTZ;

-- 2. Index untuk pencarian cepat berdasarkan NIM dan Email (lowercased)
CREATE INDEX IF NOT EXISTS idx_voters_whitelist_nim ON public.voters_whitelist(nim);
CREATE INDEX IF NOT EXISTS idx_voters_whitelist_email ON public.voters_whitelist(lower(email));

-- 3. Komentar dokumentasi keamanan
COMMENT ON COLUMN public.voters_whitelist.otp_hash IS 'Cryptographic hash (SHA-256) of temporary 6-digit login PIN. Expired in 10 minutes.';
COMMENT ON COLUMN public.voters_whitelist.otp_attempts IS 'Failed attempt counter. Maximum 3 attempts before OTP is invalidated.';
COMMENT ON COLUMN public.voters_whitelist.otp_last_sent_at IS 'Timestamp of last OTP dispatch for 60-second cooldown rate limiting.';
