-- ==============================================================================
-- Migration: 00004_rls_policies.sql
-- Description: Row Level Security (RLS) policies for all tables
-- Principle: Least Privilege, Strict Denial of Sensitive Tables from Browser
-- ==============================================================================

-- 1. AKTIFKAN RLS PADA SELURUH TABEL
ALTER TABLE public.voters_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. KEBIJAKAN TABEL CANDIDATES
-- Siapapun (publik/pemilih terautentikasi) berhak membaca profil kandidat yang AKTIF
CREATE POLICY "Public read active candidates"
    ON public.candidates
    FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

-- Manajemen data kandidat hanya boleh via service_role server
CREATE POLICY "Service role full access candidates"
    ON public.candidates
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. KEBIJAKAN TABEL ELECTION_SETTINGS
-- Siapapun berhak membaca status jadwal & jendela pemilihan (id = 1)
CREATE POLICY "Public read election settings"
    ON public.election_settings
    FOR SELECT
    TO anon, authenticated
    USING (id = 1);

-- Mutasi pengaturan pemilihan hanya via service_role server
CREATE POLICY "Service role full access election_settings"
    ON public.election_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. KEBIJAKAN TABEL BALLOTS (SURAT SUARA)
-- DILARANG KERAS MEMBERIKAN AKSES BACA/TULIS LANGSUNG DARI BROWSER (ANON / AUTHENTICATED)
-- Surat suara hanya bisa dimasukkan via RPC cast_ballot_secure dan dibaca untuk tally via service_role
CREATE POLICY "Deny direct public access to ballots"
    ON public.ballots
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Service role full access ballots"
    ON public.ballots
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. KEBIJAKAN TABEL VOTERS_WHITELIST (DPT)
-- Cegah kebocoran data pemilih: pemilih tidak boleh membaca daftar pemilih lain
CREATE POLICY "Deny direct public access to voters_whitelist"
    ON public.voters_whitelist
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Service role full access voters_whitelist"
    ON public.voters_whitelist
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. KEBIJAKAN TABEL AUDIT_LOGS
CREATE POLICY "Deny direct public access to audit_logs"
    ON public.audit_logs
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Service role full access audit_logs"
    ON public.audit_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. KEBIJAKAN TABEL ADMIN_USERS
CREATE POLICY "Deny direct public access to admin_users"
    ON public.admin_users
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Service role full access admin_users"
    ON public.admin_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
