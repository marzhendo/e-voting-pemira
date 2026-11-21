import { NextResponse } from 'next/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getDevCandidates } from '@/lib/candidates/dev-store';
import { getDevElectionSettings } from '@/lib/election/dev-settings-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  if (isSupabaseConfigured()) {
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
          .select('id, candidate_number, leader_name, vice_leader_name, vision, mission, photo_url, chairman_cv_url, vice_chairman_cv_url')
          .eq('is_active', true)
          .order('candidate_number', { ascending: true });

        if (!candError && candidates && candidates.length > 0) {
          return NextResponse.json(
            {
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
            },
            {
              headers: {
                'Cache-Control': 'no-store, max-age=0',
              },
            }
          );
        }
      }
    } catch (error) {
      console.warn('[ElectionRoute] Supabase DB unreachable, checking dev fallback:', error);
    }
  }

  // Jika di lingkungan non-produksi dan DB belum terhubung, kembalikan mock data untuk pengujian lokal
  if (process.env.APP_ENV !== 'production') {
    const devSettings = getDevElectionSettings();
    const now = new Date();
    const startTime = new Date(devSettings.start_time);
    const endTime = new Date(devSettings.end_time);
    const isWithinWindow = now >= startTime && now <= endTime;
    const isVotingActive = devSettings.is_voting_open && !devSettings.maintenance_mode && isWithinWindow;

    const allCandidates = getDevCandidates().filter((c) => c.is_active);
    const regularCandidates = allCandidates.filter((c) => c.candidate_number > 0);
    const kotakKosong = allCandidates.find((c) => c.candidate_number === 0);

    const candidatesList = [...regularCandidates];
    if (kotakKosong) {
      if (regularCandidates.length === 1) {
        // Calon tunggal: Kotak kosong wajib diikutsertakan
        candidatesList.push(kotakKosong);
      } else if (regularCandidates.length >= 2 && devSettings.allow_kotak_kosong_multi !== false) {
        // Multi-paslon: Kotak kosong disertakan jika toggle aktif
        candidatesList.push(kotakKosong);
      }
    }
    candidatesList.sort((a, b) => a.candidate_number - b.candidate_number);

    return NextResponse.json({
      success: true,
      electionStatus: {
        isVotingActive,
        isVotingOpen: devSettings.is_voting_open,
        maintenanceMode: devSettings.maintenance_mode,
        isWithinWindow,
        startTime: devSettings.start_time,
        endTime: devSettings.end_time,
        allowKotakKosongMulti: devSettings.allow_kotak_kosong_multi,
      },
      candidates: candidatesList,
    });
  }

  return NextResponse.json(
    { error: 'Gagal memuat status dan data pemilihan dari basis data.' },
    { status: 500 }
  );
}
