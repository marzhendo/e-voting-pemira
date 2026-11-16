-- ==============================================================================
-- Migration: 00009_protect_superadmin_immutability.sql
-- Description: Enforce immutability and undeletable status for primary Superadmin
-- Target Account: marzhendogalangs@gmail.com
-- Standards:
--   1. Rejects DELETE operations targeting the primary Superadmin.
--   2. Rejects role demotions (role must remain 'super_admin').
--   3. Rejects deactivation (is_active cannot be set to false).
--   4. Rejects email address tampering.
-- ==============================================================================

-- 1. FUNGSI TRIGGER PENGUNCIAN SUPERADMIN UTAMA
CREATE OR REPLACE FUNCTION public.protect_superadmin_immutability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Evaluasi apakah target baris adalah akun Superadmin utama
    IF LOWER(OLD.email) = 'marzhendogalangs@gmail.com' THEN
        -- Blokir operasi DELETE
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'CRITICAL SECURITY: Akun Superadmin utama (%) bersifat IMMUTABLE dan DILARANG dihapus dari sistem Pemira HMIF.', OLD.email;
        END IF;

        -- Blokir mutasi merugikan pada operasi UPDATE
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

    -- PENTING: Pada operasi DELETE, kembalikan OLD agar row deletion non-superadmin diproses.
    -- Mengembalikan NEW (bernilai NULL pada DELETE) akan membatalkan operasi delete secara diam-diam.
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. PASANG TRIGGER PADA TABEL ADMIN_USERS
DROP TRIGGER IF EXISTS trg_protect_superadmin_admin_users ON public.admin_users;
CREATE TRIGGER trg_protect_superadmin_admin_users
BEFORE UPDATE OR DELETE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.protect_superadmin_immutability();

-- 3. PASANG TRIGGER PADA TABEL VOTERS_WHITELIST (JIKA ADA RECORD SEED/TERDAFTAR)
DROP TRIGGER IF EXISTS trg_protect_superadmin_voters ON public.voters_whitelist;
CREATE TRIGGER trg_protect_superadmin_voters
BEFORE DELETE ON public.voters_whitelist
FOR EACH ROW
WHEN (LOWER(OLD.email) = 'marzhendogalangs@gmail.com')
EXECUTE FUNCTION public.protect_superadmin_immutability();
