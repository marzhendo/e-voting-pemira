import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDevCandidates } from '@/app/api/admin/candidates/route';

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

    if (!settingsError && settings) {
      const now = new Date();
      const startTime = new Date(settings.start_time);
      const endTime = new Date(settings.end_time);

      const isWithinWindow = now >= startTime && now <= endTime;
      const isVotingActive = settings.is_voting_open && !settings.maintenance_mode && isWithinWindow;

      // 2. Ambil Daftar Kandidat Aktif
      const { data: candidates, error: candError } = await adminSupabase
        .from('candidates')
        .select('id, candidate_number, leader_name, vice_leader_name, vision, mission, photo_url')
        .eq('is_active', true)
        .order('candidate_number', { ascending: true });

      if (!candError && candidates && candidates.length > 0) {
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
      }
    }
  } catch (error) {
    console.warn('[ElectionRoute] Supabase DB unreachable, checking dev fallback:', error);
  }

  // Jika di lingkungan non-produksi dan DB belum terhubung, kembalikan mock data untuk pengujian lokal
  if (process.env.NODE_ENV !== 'production' && process.env.APP_ENV !== 'production') {
    return NextResponse.json({
      success: true,
      electionStatus: {
        isVotingActive: true,
        isVotingOpen: true,
        maintenanceMode: false,
        isWithinWindow: true,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 28800000).toISOString(),
      },
      candidates: getDevCandidates().filter((c) => c.is_active),
    });
  }

  return NextResponse.json(
    { error: 'Gagal memuat status dan data pemilihan dari basis data.' },
    { status: 500 }
  );
}
