-- ==============================================================================
-- Migration: 00012_fix_protect_superadmin_trigger_delete.sql
-- Description: Fix PostgreSQL BEFORE DELETE trigger in protect_superadmin_immutability
-- Target Table: public.admin_users, public.voters_whitelist
-- Problem:
--   The previous trigger returned NEW at the end of protect_superadmin_immutability().
--   In PostgreSQL, for a BEFORE DELETE trigger, NEW is always NULL.
--   When a BEFORE trigger returns NULL, PostgreSQL silently aborts/cancels
--   the row deletion without raising an error (0 rows affected).
-- Fix:
--   For DELETE operations on non-superadmin accounts, return OLD so PostgreSQL
--   proceeds with deleting the row.
--   For INSERT/UPDATE operations, return NEW.
-- ==============================================================================

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

    -- PENTING: Pada operasi DELETE, PostgreSQL mewajibkan mengembalikan OLD
    -- agar proses penghapusan baris non-superadmin diizinkan berlanjut.
    -- Mengembalikan NEW (yang bernilai NULL pada DELETE) akan membatalkan penghapusan secara diam-diam.
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;
