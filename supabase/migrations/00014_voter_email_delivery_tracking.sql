-- ==============================================================================
-- MIGRATION: 00014_voter_email_delivery_tracking.sql
-- Description: Email delivery tracking and targeted retry for voters_whitelist
-- Invariant: BALLOT SECRECY - No link between voters_whitelist and ballots table!
-- ==============================================================================

-- 1. Tambahkan kolom status pengiriman email pada voters_whitelist
ALTER TABLE public.voters_whitelist 
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_email_status TEXT,
ADD COLUMN IF NOT EXISTS last_email_error TEXT;

-- 2. Index untuk mendukung pencarian cepat pemilih yang gagal menerima email
CREATE INDEX IF NOT EXISTS idx_voters_whitelist_email_status ON public.voters_whitelist(last_email_status) WHERE last_email_status = 'failed';
CREATE INDEX IF NOT EXISTS idx_voters_whitelist_email_sent_at ON public.voters_whitelist(last_email_sent_at);

-- 3. Komentar dokumentasi
COMMENT ON COLUMN public.voters_whitelist.last_email_sent_at IS 'Timestamp of the most recent successful email dispatch to this voter.';
COMMENT ON COLUMN public.voters_whitelist.last_email_status IS 'Outcome of most recent email dispatch: sent | failed | null.';
COMMENT ON COLUMN public.voters_whitelist.last_email_error IS 'Sanitized error summary if the most recent email dispatch failed.';
