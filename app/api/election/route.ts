import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DEV_FALLBACK_CANDIDATES = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    candidate_number: 0,
    leader_name: 'Kotak Kosong',
    vice_leader_name: 'Tidak Memilih Calon',
    vision: 'Opsi konstitusional sah berasaskan LUBER JURDIL.',
    mission: ['Menampung suara pemilih yang menyatakan tidak memilih pasangan calon yang terdaftar.'],
    photo_url: null,
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    candidate_number: 1,
    leader_name: 'Arya Narendra Putra',
    vice_leader_name: 'Rayhan Al-Fayeed',
    vision: 'Terwujudnya HMIF yang adaptif, kolaboratif, dan inklusif berlandaskan inovasi teknologi.',
    mission: [
      'Membangun ekosistem riset mahasiswa terpadu.',
      'Memperluas relasi industri strategis nasional dan inkubasi technopreneur.',
      'Advokasi akademik cepat tanggap berkeadilan.',
    ],
    photo_url: null,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    candidate_number: 2,
    leader_name: 'Dimas Satria Wicaksana',
    vice_leader_name: 'Cynthia Maharani',
    vision: 'Sinergi Informatika berdaya saing global yang berintegritas dan berjiwa technopreneur.',
    mission: [
      'Mengoptimalkan inkubasi bakat informatika.',
      'Digitalisasi layanan kemahasiswaan satu pintu.',
      'Pengabdian masyarakat berbasis teknologi tepat guna.',
    ],
    photo_url: null,
  },
];

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
      candidates: DEV_FALLBACK_CANDIDATES,
    });
  }

  return NextResponse.json(
    { error: 'Gagal memuat status dan data pemilihan dari basis data.' },
    { status: 500 }
  );
}
