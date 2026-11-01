-- ==============================================================================
-- Migration: 00002_admin_and_identity_bindings.sql
-- Description: Administrator whitelist (RBAC) and voter Entra/receipt bindings
-- ==============================================================================

-- 1. TABEL PENGELOLA PEMIRA (ADMIN USERS WHITELIST)
-- Menyimpan daftar administrator resmi (kpr_admin, auditor, super_admin)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entra_tenant_id UUID NULL,
    entra_object_id UUID NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('kpr_admin', 'auditor', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by VARCHAR(120) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_admin_entra_identity UNIQUE (entra_tenant_id, entra_object_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

-- 2. PENAMBAHAN BINDING IDENTITAS ENTRA & RECEIPT HASH PADA VOTERS_WHITELIST
-- entra_tenant_id + entra_object_id: Binding identitas Entra setelah validasi login pertama
-- receipt_hash: Hash SHA-256 dari token tanda terima digital (tanpa relasi ke ballots)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'voters_whitelist' 
          AND column_name = 'entra_tenant_id'
    ) THEN
        ALTER TABLE public.voters_whitelist
            ADD COLUMN entra_tenant_id UUID NULL,
            ADD COLUMN entra_object_id UUID NULL,
            ADD COLUMN receipt_hash VARCHAR(64) NULL;

        ALTER TABLE public.voters_whitelist
            ADD CONSTRAINT uq_voters_entra_identity UNIQUE (entra_tenant_id, entra_object_id);

        ALTER TABLE public.voters_whitelist
            ADD CONSTRAINT chk_voters_entra_pair CHECK (
                (entra_tenant_id IS NULL AND entra_object_id IS NULL) OR
                (entra_tenant_id IS NOT NULL AND entra_object_id IS NOT NULL)
            );

        CREATE INDEX idx_voters_entra_oid ON public.voters_whitelist(entra_object_id);
        CREATE INDEX idx_voters_receipt_hash ON public.voters_whitelist(receipt_hash);
    END IF;
END $$;
