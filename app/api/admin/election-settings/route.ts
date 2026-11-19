import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getDevElectionSettings, updateDevElectionSettings } from '@/lib/election/dev-settings-store';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { isDevFallbackAllowed } from '@/lib/security/env';
import type { Database } from '@/lib/supabase/types';

const validDateStringSchema = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), 'Format waktu jadwal tidak valid.')
  .optional();

const updateSettingsSchema = z.object({
  is_voting_open: z.boolean().optional(),
  isVotingOpen: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  start_time: validDateStringSchema,
  startTime: validDateStringSchema,
  end_time: validDateStringSchema,
  endTime: validDateStringSchema,
  allow_kotak_kosong_multi: z.boolean().optional(),
  allowKotakKosongMulti: z.boolean().optional(),
  reason: z.string().trim().min(3, 'Alasan operasional minimal 3 karakter.').optional(),
});

export async function GET() {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  if (isSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();
      const { data, error } = await adminSupabase
        .from('election_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, settings: data });
      }
      console.error('[ElectionSettings] Supabase GET error:', error?.message);
    } catch (err) {
      console.error('[ElectionSettings] Supabase GET exception:', err);
    }
    return NextResponse.json(
      { error: 'Gagal memuat pengaturan pemilihan dari basis data.' },
      { status: 500 }
    );
  }

  if (isDevFallbackAllowed(false)) {
    return NextResponse.json({ success: true, settings: getDevElectionSettings() });
  }

  return NextResponse.json(
    { error: 'Basis data pengaturan pemilihan tidak tersedia.' },
    { status: 500 }
  );
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session, 'manage_election_settings');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  // Auditor bersifat read-only mutlak, tidak berhak mengubah pengaturan
  if (authCheck.effectiveRole === 'auditor') {
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

    const is_voting_open = parsed.data.is_voting_open ?? parsed.data.isVotingOpen;
    const maintenance_mode = parsed.data.maintenance_mode ?? parsed.data.maintenanceMode;
    const start_time = parsed.data.start_time ?? parsed.data.startTime;
    const end_time = parsed.data.end_time ?? parsed.data.endTime;
    const allow_kotak_kosong_multi = parsed.data.allow_kotak_kosong_multi ?? parsed.data.allowKotakKosongMulti;
    const reason = parsed.data.reason || 'Pembaruan pengaturan pemilihan via dashboard KPR';

    // Ambil setting aktif saat ini untuk memverifikasi apakah ada mutasi nyata
    let currentIsVotingOpen = true;
    let currentMaintenanceMode = false;

    if (isSupabaseConfigured()) {
      const curSupabase = createAdminClient();
      const { data: cur, error: curErr } = await curSupabase
        .from('election_settings')
        .select('is_voting_open, maintenance_mode')
        .eq('id', 1)
        .single();
      if (curErr || !cur) {
        console.error('[ElectionSettings] Error reading current settings for auth check:', curErr);
        return NextResponse.json(
          { error: 'Gagal memverifikasi status pengaturan pemilihan saat ini dari database.' },
          { status: 500 }
        );
      }
      currentIsVotingOpen = cur.is_voting_open;
      currentMaintenanceMode = cur.maintenance_mode;
    } else {
      const cur = getDevElectionSettings();
      currentIsVotingOpen = cur.is_voting_open;
      currentMaintenanceMode = cur.maintenance_mode;
    }

    // Batasan Wewenang Berdasarkan Aturan Operasional:
    // 1. Superadmin memiliki wewenang penuh atas konfigurasi sistem, pembukaan/penutupan bilik suara, serta maintenance mode.
    // 2. KPR Admin tidak boleh mengubah maintenance mode teknis jika itu ranah Superadmin/IT Coordinator.
    if (
      authCheck.effectiveRole === 'kpr_admin' &&
      maintenance_mode !== undefined &&
      maintenance_mode !== currentMaintenanceMode
    ) {
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

    const clientIp = getClientIp(request);

    // Jika Supabase tidak terkonfigurasi (dev mode), simpan di in-memory store
    if (!isSupabaseConfigured()) {
      const devUpdates: Record<string, boolean | string> = {};
      if (is_voting_open !== undefined) devUpdates.is_voting_open = is_voting_open;
      if (maintenance_mode !== undefined) devUpdates.maintenance_mode = maintenance_mode;
      if (start_time !== undefined) devUpdates.start_time = start_time;
      if (end_time !== undefined) devUpdates.end_time = end_time;
      if (allow_kotak_kosong_multi !== undefined) devUpdates.allow_kotak_kosong_multi = allow_kotak_kosong_multi;

      const updated = updateDevElectionSettings(devUpdates);

      await recordAuditLog({
        actorEmail: session?.email || 'admin@pemirahmif',
        actorName: session?.name || 'Administrator',
        actorRole: session?.role || 'kpr_admin',
        action: maintenance_mode !== undefined ? 'MAINTENANCE_TOGGLE' : 'ELECTION_SETTINGS_UPDATE',
        description: maintenance_mode !== undefined
          ? `Mengubah status maintenance mode menjadi ${maintenance_mode ? 'AKTIF' : 'NONAKTIF'}. Alasan: ${reason || '-'}`
          : `Memperbarui jadwal/status bilik suara (Buka: ${is_voting_open ?? updated.is_voting_open}).`,
        ipAddress: clientIp,
        details: { updates: devUpdates, reason },
      });

      try {
        revalidatePath('/login');
        revalidatePath('/');
        revalidatePath('/vote');
      } catch {
        // Safe ignore in isolated non-Next test runners
      }

      return NextResponse.json({
        success: true,
        message: 'Pengaturan pemilihan berhasil diperbarui (Dev Mode).',
        settings: updated,
      });
    }

    const adminSupabase = createAdminClient();

    // Kumpulkan field yang akan diupdate
    const updatePayload: Database['public']['Tables']['election_settings']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (is_voting_open !== undefined) updatePayload.is_voting_open = is_voting_open;
    if (maintenance_mode !== undefined) updatePayload.maintenance_mode = maintenance_mode;
    if (start_time !== undefined) updatePayload.start_time = start_time;
    if (end_time !== undefined) updatePayload.end_time = end_time;
    if (allow_kotak_kosong_multi !== undefined) updatePayload.allow_kotak_kosong_multi = allow_kotak_kosong_multi;

    // Eksekusi mutasi
    const { data: updatedSettings, error: updateError } = await adminSupabase
      .from('election_settings')
      .update(updatePayload)
      .eq('id', 1)
      .select()
      .single();

    if (updateError) {
      console.error('[ElectionSettingsRoute] Update error:', updateError);
      return NextResponse.json(
        { error: `Gagal memperbarui pengaturan pemilihan di database: ${updateError.message}` },
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
    if (allow_kotak_kosong_multi !== undefined) auditDetails.allow_kotak_kosong_multi = allow_kotak_kosong_multi;

    // Catat ke Audit Log secara terisolasi
    await adminSupabase.from('audit_logs').insert({
      actor_email: session?.email || 'unknown_admin',
      action: 'UPDATE_ELECTION_SETTINGS',
      details: auditDetails,
      ip_address: clientIp,
    });

    try {
      revalidatePath('/login');
      revalidatePath('/');
      revalidatePath('/vote');
    } catch {
      // Safe ignore in isolated non-Next test runners
    }

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

export async function POST(request: NextRequest) {
  return PATCH(request);
}
