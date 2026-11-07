import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import {
  type CandidateRecord,
  getDevCandidates,
  setDevCandidates,
} from '@/lib/candidates/dev-store';

export const dynamic = 'force-dynamic';

const candidateSchema = z.object({
  candidate_number: z.number().int().min(0, 'Nomor urut minimal 0'),
  leader_name: z.string().min(2, 'Nama Calon Chairman minimal 2 karakter'),
  vice_leader_name: z.string().min(2, 'Nama Calon Vice Chairman minimal 2 karakter'),
  vision: z.string().min(5, 'Visi minimal 5 karakter'),
  mission: z.array(z.string()).min(1, 'Minimal sertakan 1 butir misi'),
  photo_url: z.string().nullable().optional(),
  chairman_cv_url: z.string().nullable().optional(),
  vice_chairman_cv_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

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
    return NextResponse.json({ success: true, candidates: getDevCandidates() });
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
              chairman_cv_url: newCandidate.chairman_cv_url || null,
              vice_chairman_cv_url: newCandidate.vice_chairman_cv_url || null,
              is_active: newCandidate.is_active,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          const ip = getClientIp(req);
          await recordAuditLog({
            actorEmail: session?.email || 'admin@pemira.local',
            actorName: session?.name || 'Panitia KPR',
            actorRole: session?.role || 'kpr_admin',
            action: 'CANDIDATE_CREATE',
            description: `Mendaftarkan Paslon #${newCandidate.candidate_number} (${newCandidate.leader_name} & ${newCandidate.vice_leader_name}).`,
            ipAddress: ip,
            details: {
              candidate_number: newCandidate.candidate_number,
              leader_name: newCandidate.leader_name,
              vice_leader_name: newCandidate.vice_leader_name,
            },
          });
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
        chairman_cv_url: newCandidate.chairman_cv_url || null,
        vice_chairman_cv_url: newCandidate.vice_chairman_cv_url || null,
        is_active: newCandidate.is_active,
        created_at: new Date().toISOString(),
      };
      const currentList = getDevCandidates();
      const updatedList = [...currentList.filter((c) => c.candidate_number !== created.candidate_number), created].sort(
        (a, b) => a.candidate_number - b.candidate_number
      );
      setDevCandidates(updatedList);

      const ip = getClientIp(req);
      await recordAuditLog({
        actorEmail: session?.email || 'admin@pemira.local',
        actorName: session?.name || 'Panitia KPR',
        actorRole: session?.role || 'kpr_admin',
        action: 'CANDIDATE_CREATE',
        description: `Mendaftarkan Paslon #${newCandidate.candidate_number} (${newCandidate.leader_name} & ${newCandidate.vice_leader_name}) (Dev Mode).`,
        ipAddress: ip,
        details: {
          candidate_number: newCandidate.candidate_number,
          leader_name: newCandidate.leader_name,
          vice_leader_name: newCandidate.vice_leader_name,
        },
      });

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
          const ip = getClientIp(req);
          const isKotakKosong = updates.candidate_number === 0 || id === 'dev-cand-0';
          await recordAuditLog({
            actorEmail: session?.email || 'admin@pemira.local',
            actorName: session?.name || 'Panitia KPR',
            actorRole: session?.role || 'kpr_admin',
            action: isKotakKosong ? 'KOTAK_KOSONG_TOGGLE' : 'CANDIDATE_UPDATE',
            description: isKotakKosong
              ? `Memperbarui status opsi Kotak Kosong (Aktif: ${updates.is_active}).`
              : `Memperbarui data Paslon ID ${id} (${updates.leader_name || 'Kandidat'}).`,
            ipAddress: ip,
            details: updates,
          });
          return NextResponse.json({ success: true, candidate: data });
        }
      } catch (dbErr) {
        console.warn('[AdminCandidatesRoute] DB offline during update, using dev memory store:', dbErr);
      }
    }

    if (process.env.APP_ENV !== 'production') {
      const currentList = getDevCandidates();
      const updatedList = currentList.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setDevCandidates(updatedList);
      const updated = updatedList.find((c) => c.id === id);

      const ip = getClientIp(req);
      const isKotakKosong = updates.candidate_number === 0 || id === 'dev-cand-0';
      await recordAuditLog({
        actorEmail: session?.email || 'admin@pemira.local',
        actorName: session?.name || 'Panitia KPR',
        actorRole: session?.role || 'kpr_admin',
        action: isKotakKosong ? 'KOTAK_KOSONG_TOGGLE' : 'CANDIDATE_UPDATE',
        description: isKotakKosong
          ? `Memperbarui status opsi Kotak Kosong (Aktif: ${updates.is_active}) (Dev Mode).`
          : `Memperbarui data Paslon ID ${id} (${updated?.leader_name || 'Kandidat'}) (Dev Mode).`,
        ipAddress: ip,
        details: updates,
      });

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

    const currentList = getDevCandidates();
    const target = currentList.find((c) => c.id === id);
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
          const ip = getClientIp(req);
          await recordAuditLog({
            actorEmail: session?.email || 'admin@pemira.local',
            actorName: session?.name || 'Panitia KPR',
            actorRole: session?.role || 'kpr_admin',
            action: 'CANDIDATE_DELETE',
            description: `Menghapus Paslon ID ${id} (${target?.leader_name || 'Pasangan Calon'}).`,
            ipAddress: ip,
            details: { id, leader_name: target?.leader_name, candidate_number: target?.candidate_number },
          });
          return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus.' });
        }
      } catch (dbErr) {
        console.warn('[AdminCandidatesRoute] DB offline during delete, using dev memory store:', dbErr);
      }
    }

    if (process.env.APP_ENV !== 'production') {
      const filtered = getDevCandidates().filter((c) => c.id !== id);
      setDevCandidates(filtered);

      const ip = getClientIp(req);
      await recordAuditLog({
        actorEmail: session?.email || 'admin@pemira.local',
        actorName: session?.name || 'Panitia KPR',
        actorRole: session?.role || 'kpr_admin',
        action: 'CANDIDATE_DELETE',
        description: `Menghapus Paslon ID ${id} (${target?.leader_name || 'Pasangan Calon'}) (Dev Mode).`,
        ipAddress: ip,
        details: { id, leader_name: target?.leader_name, candidate_number: target?.candidate_number },
      });

      return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus (Dev Mode).' });
    }

    return NextResponse.json({ error: 'Gagal menghapus kandidat dari database.' }, { status: 500 });
  } catch (err) {
    console.error('[AdminCandidatesRoute] Exception:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan server.' }, { status: 500 });
  }
}
