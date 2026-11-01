import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const candidateSchema = z.object({
  candidate_number: z.number().int().min(0, 'Nomor urut minimal 0'),
  leader_name: z.string().min(2, 'Nama Calon Ketua minimal 2 karakter'),
  vice_leader_name: z.string().min(2, 'Nama Calon Wakil Ketua minimal 2 karakter'),
  vision: z.string().min(5, 'Visi minimal 5 karakter'),
  mission: z.array(z.string()).min(1, 'Minimal sertakan 1 butir misi'),
  photo_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export interface CandidateRecord {
  id: string;
  candidate_number: number;
  leader_name: string;
  vice_leader_name: string;
  vision: string;
  mission: string[];
  photo_url: string | null;
  is_active: boolean;
  created_at?: string;
}

// In-memory dev storage jika DB belum online
let DEV_CANDIDATES: CandidateRecord[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    candidate_number: 0,
    leader_name: 'Kotak Kosong',
    vice_leader_name: 'Tidak Memilih Calon',
    vision: 'Opsi konstitusional sah berasaskan LUBER JURDIL.',
    mission: ['Menampung suara pemilih yang menyatakan tidak memilih pasangan calon yang terdaftar.'],
    photo_url: null,
    is_active: true,
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
    is_active: true,
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
    is_active: true,
  },
];

export function getDevCandidates(): CandidateRecord[] {
  return DEV_CANDIDATES;
}

export async function GET() {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  if (isSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();
      const { data: candidates, error } = await adminSupabase
        .from('candidates')
        .select('*')
        .order('candidate_number', { ascending: true });

      if (!error && candidates && candidates.length > 0) {
        return NextResponse.json({ success: true, candidates });
      }
    } catch (err) {
      console.warn('[AdminCandidatesRoute] Database offline, checking dev storage:', err);
    }
  }

  if (process.env.APP_ENV !== 'production') {
    return NextResponse.json({ success: true, candidates: DEV_CANDIDATES });
  }

  return NextResponse.json({ error: 'Gagal memuat daftar kandidat.' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const body = await req.json();
    const parsed = candidateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data kandidat tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newCandidate = parsed.data;

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
          .from('candidates')
          .insert([
            {
              candidate_number: newCandidate.candidate_number,
              leader_name: newCandidate.leader_name,
              vice_leader_name: newCandidate.vice_leader_name,
              vision: newCandidate.vision,
              mission: newCandidate.mission,
              photo_url: newCandidate.photo_url || '',
              is_active: newCandidate.is_active,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, candidate: data });
        }
      } catch (dbErr) {
        console.warn('[AdminCandidatesRoute] DB offline during insert, using dev memory store:', dbErr);
      }
    }

    if (process.env.APP_ENV !== 'production') {
      const created: CandidateRecord = {
        id: `dev-cand-${Date.now()}`,
        candidate_number: newCandidate.candidate_number,
        leader_name: newCandidate.leader_name,
        vice_leader_name: newCandidate.vice_leader_name,
        vision: newCandidate.vision,
        mission: newCandidate.mission,
        photo_url: newCandidate.photo_url || null,
        is_active: newCandidate.is_active,
        created_at: new Date().toISOString(),
      };
      DEV_CANDIDATES = [...DEV_CANDIDATES.filter((c) => c.candidate_number !== created.candidate_number), created].sort(
        (a, b) => a.candidate_number - b.candidate_number
      );
      return NextResponse.json({ success: true, candidate: created });
    }

    return NextResponse.json({ error: 'Gagal menyimpan data kandidat ke database.' }, { status: 500 });
  } catch (err) {
    console.error('[AdminCandidatesRoute] Exception:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan server.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID kandidat wajib disertakan.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
          .from('candidates')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, candidate: data });
        }
      } catch (dbErr) {
        console.warn('[AdminCandidatesRoute] DB offline during update, using dev memory store:', dbErr);
      }
    }

    if (process.env.APP_ENV !== 'production') {
      DEV_CANDIDATES = DEV_CANDIDATES.map((c) => (c.id === id ? { ...c, ...updates } : c));
      const updated = DEV_CANDIDATES.find((c) => c.id === id);
      return NextResponse.json({ success: true, candidate: updated });
    }

    return NextResponse.json({ error: 'Gagal memperbarui data kandidat di database.' }, { status: 500 });
  } catch (err) {
    console.error('[AdminCandidatesRoute] Exception:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan server.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kandidat wajib disertakan.' }, { status: 400 });
    }

    const target = DEV_CANDIDATES.find((c) => c.id === id);
    if (target && target.candidate_number === 0) {
      return NextResponse.json({ error: 'Opsi Kotak Kosong adalah opsi konstitusional dasar dan tidak dapat dihapus.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
          .from('candidates')
          .delete()
          .eq('id', id);

        if (!error) {
          return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus.' });
        }
      } catch (dbErr) {
        console.warn('[AdminCandidatesRoute] DB offline during delete, using dev memory store:', dbErr);
      }
    }

    if (process.env.APP_ENV !== 'production') {
      DEV_CANDIDATES = DEV_CANDIDATES.filter((c) => c.id !== id);
      return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus (Dev Mode).' });
    }

    return NextResponse.json({ error: 'Gagal menghapus kandidat dari database.' }, { status: 500 });
  } catch (err) {
    console.error('[AdminCandidatesRoute] Exception:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan server.' }, { status: 500 });
  }
}
