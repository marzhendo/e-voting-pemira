import { createAdminClient } from '@/lib/supabase/admin';
import type { AdminRole } from '@/lib/supabase/types';
import type { SessionUser } from './session';

export interface IdentityResolutionResult {
  success: boolean;
  code: 'ELIGIBLE' | 'ALREADY_VOTED' | 'NOT_FOUND' | 'ADMIN_ONLY' | 'IDENTITY_MISMATCH' | 'ERROR';
  message: string;
  user?: SessionUser;
}

/**
 * Resolves an authenticated email address against the official voters_whitelist (DPT)
 * and admin_users whitelist.
 * 
 * INVARIANT:
 * Identity resolution must always happen on the server using trusted database queries,
 * never from untrusted browser input.
 */
export async function resolveUserIdentity(params: {
  email: string;
  name?: string;
  entraTenantId?: string | null;
  entraObjectId?: string | null;
}): Promise<IdentityResolutionResult> {
  try {
    const normalizedEmail = params.email.trim().toLowerCase();
    const adminSupabase = createAdminClient();

    // 1. Cek apakah pengguna terdaftar sebagai Administrator Pemira
    const { data: adminRecord, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (adminError) {
      console.error('[IdentityResolution] Error checking admin_users:', adminError);
    }

    const adminRole: AdminRole | undefined = adminRecord?.role;

    // 2. Cari pemilih di tabel DPT (voters_whitelist)
    const { data: voterRecord, error: voterError } = await adminSupabase
      .from('voters_whitelist')
      .select('id, nim, email, name, generation, has_voted, entra_tenant_id, entra_object_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (voterError) {
      console.error('[IdentityResolution] Error querying voters_whitelist:', voterError);
      return {
        success: false,
        code: 'ERROR',
        message: 'Terjadi kesalahan sistem saat memverifikasi data DPT.',
      };
    }

    // 3. Jika tidak ditemukan di DPT, periksa apakah pengguna adalah panitia murni
    if (!voterRecord) {
      if (adminRecord && adminRole) {
        return {
          success: true,
          code: 'ADMIN_ONLY',
          message: 'Berhasil masuk sebagai Panitia / Pengawas Pemira.',
          user: {
            id: adminRecord.id,
            email: normalizedEmail,
            name: params.name || 'Panitia Pemira',
            role: adminRole,
            isDptVerified: false,
            hasVoted: false,
            entraTenantId: params.entraTenantId,
            entraObjectId: params.entraObjectId,
          },
        };
      }

      return {
        success: false,
        code: 'NOT_FOUND',
        message: 'Akun Anda tidak terdaftar dalam Daftar Pemilih Tetap (DPT) resmi KEMA HMIF.',
      };
    }

    // 4. Verifikasi Binding Identitas Entra (Anti-Account Hijacking)
    if (params.entraObjectId && params.entraTenantId) {
      if (!voterRecord.entra_object_id) {
        // First login binding: kunci tid + oid ke baris DPT
        const { error: bindError } = await adminSupabase
          .from('voters_whitelist')
          .update({
            entra_tenant_id: params.entraTenantId,
            entra_object_id: params.entraObjectId,
          })
          .eq('id', voterRecord.id);

        if (bindError) {
          console.error('[IdentityResolution] Error binding Entra ID to voter:', bindError);
        }
      } else if (voterRecord.entra_object_id !== params.entraObjectId) {
        // Entra ID berbeda mencoba menggunakan email pemilih yang telah terikat
        return {
          success: false,
          code: 'IDENTITY_MISMATCH',
          message: 'Identitas Microsoft Entra tidak cocok dengan akun terdaftar sebelumnya.',
        };
      }
    }

    // 5. Kembalikan entitas sesi terverifikasi
    const sessionUser: SessionUser = {
      id: voterRecord.id,
      email: normalizedEmail,
      name: voterRecord.name,
      nim: voterRecord.nim,
      generation: voterRecord.generation,
      role: adminRole || 'voter',
      isDptVerified: true,
      hasVoted: voterRecord.has_voted,
      entraTenantId: params.entraTenantId || voterRecord.entra_tenant_id,
      entraObjectId: params.entraObjectId || voterRecord.entra_object_id,
    };

    if (voterRecord.has_voted) {
      return {
        success: true,
        code: 'ALREADY_VOTED',
        message: 'Hak suara Anda telah digunakan sebelumnya.',
        user: sessionUser,
      };
    }

    return {
      success: true,
      code: 'ELIGIBLE',
      message: 'Verifikasi DPT berhasil. Anda berhak menggunakan hak suara.',
      user: sessionUser,
    };
  } catch (err) {
    console.error('[IdentityResolution] Unexpected exception:', err);
    return {
      success: false,
      code: 'ERROR',
      message: 'Terjadi kegagalan server saat memproses identitas pemilih.',
    };
  }
}
