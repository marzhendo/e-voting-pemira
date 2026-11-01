import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Ambil Pengaturan Pemilihan
    const { data: settings, error: settingsError } = await adminSupabase
      .from('election_settings')
      .select('is_voting_open, start_time, end_time, maintenance_mode')
      .eq('id', 1)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Gagal memuat status jadwal pemilihan.' },
        { status: 500 }
      );
    }

    const now = new Date();
    const startTime = new Date(settings.start_time);
    const endTime = new Date(settings.end_time);

    const isWithinWindow = now >= startTime && now <= endTime;
    const isVotingActive = settings.is_voting_open && !settings.maintenance_mode && isWithinWindow;

    // 2. Ambil Daftar Kandidat Aktif (Termasuk Kotak Kosong nomor urut 0)
    const { data: candidates, error: candError } = await adminSupabase
      .from('candidates')
      .select('id, candidate_number, leader_name, vice_leader_name, vision, mission, photo_url')
      .eq('is_active', true)
      .order('candidate_number', { ascending: true });

    if (candError || !candidates) {
      return NextResponse.json(
        { error: 'Gagal memuat daftar pasangan calon pemilihan.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      electionStatus: {
        isVotingActive,
        isVotingOpen: settings.is_voting_open,
        maintenanceMode: settings.maintenance_mode,
        isWithinWindow,
        startTime: settings.start_time,
        endTime: settings.end_time,
      },
      candidates,
    });
  } catch (error) {
    console.error('[ElectionRoute] Error loading election info:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memuat data pemilihan.' },
      { status: 500 }
    );
  }
}
