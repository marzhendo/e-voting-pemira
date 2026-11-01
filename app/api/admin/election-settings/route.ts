import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import type { Database } from '@/lib/supabase/types';

const updateSettingsSchema = z.object({
  is_voting_open: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  reason: z.string().min(5, 'Alasan operasional wajib dicantumkan minimal 5 karakter.'),
});

export async function GET() {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from('election_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Gagal membaca data pengaturan pemilihan.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, settings: data });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  // Auditor bersifat read-only mutlak, tidak berhak mengubah pengaturan
  if (session?.role === 'auditor') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Peran Auditor hanya memiliki hak baca (read-only).' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { is_voting_open, maintenance_mode, start_time, end_time, reason } = parsed.data;

    // Batasan Wewenang Berdasarkan Aturan Operasional:
    // 1. Superadmin TIDAK BOLEH membuka/menutup pemilu secara sepihak (wewenang KPR)
    if (session?.role === 'super_admin' && is_voting_open !== undefined) {
      return NextResponse.json(
        {
          error: 'Akses Ditolak: Pembukaan dan penutupan bilik suara merupakan wewenang mutlak Panitia KPR.',
          code: 'KPR_AUTHORITY_REQUIRED',
        },
        { status: 403 }
      );
    }

    // 2. KPR Admin tidak boleh mengubah maintenance mode teknis jika itu ranah Superadmin
    if (session?.role === 'kpr_admin' && maintenance_mode !== undefined) {
      return NextResponse.json(
        {
          error: 'Akses Ditolak: Pengaktifan mode pemeliharaan darurat teknis merupakan wewenang Koordinator IT / Superadmin.',
          code: 'SUPERADMIN_AUTHORITY_REQUIRED',
        },
        { status: 403 }
      );
    }

    // Validasi urutan waktu
    if (start_time && end_time && new Date(start_time) >= new Date(end_time)) {
      return NextResponse.json(
        { error: 'Waktu mulai harus lebih awal daripada waktu penutupan.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const clientIp = getClientIp(request.headers);

    // Kumpulkan field yang akan diupdate
    const updatePayload: Database['public']['Tables']['election_settings']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (is_voting_open !== undefined) updatePayload.is_voting_open = is_voting_open;
    if (maintenance_mode !== undefined) updatePayload.maintenance_mode = maintenance_mode;
    if (start_time !== undefined) updatePayload.start_time = start_time;
    if (end_time !== undefined) updatePayload.end_time = end_time;

    // Eksekusi mutasi
    const { data: updatedSettings, error: updateError } = await adminSupabase
      .from('election_settings')
      .update(updatePayload)
      .eq('id', 1)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Gagal memperbarui pengaturan pemilihan di database.' },
        { status: 500 }
      );
    }

    const auditDetails: Record<string, string | number | boolean | null | undefined> = {
      reason,
      actor_role: session?.role,
    };
    if (is_voting_open !== undefined) auditDetails.is_voting_open = is_voting_open;
    if (maintenance_mode !== undefined) auditDetails.maintenance_mode = maintenance_mode;
    if (start_time !== undefined) auditDetails.start_time = start_time;
    if (end_time !== undefined) auditDetails.end_time = end_time;

    // Catat ke Audit Log secara terisolasi
    await adminSupabase.from('audit_logs').insert({
      actor_email: session?.email || 'unknown_admin',
      action: 'UPDATE_ELECTION_SETTINGS',
      details: auditDetails,
      ip_address: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: 'Pengaturan pemilihan berhasil diperbarui.',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('[ElectionSettingsRoute] Error updating settings:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses pembaruan pengaturan.' },
      { status: 500 }
    );
  }
}
