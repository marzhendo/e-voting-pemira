import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { isDevFallbackAllowed } from '@/lib/security/env';
import { isSafeCandidateAssetUrl } from '@/lib/security/url-validation';
import type { Database } from '@/lib/supabase/types';
import {
  type CandidateRecord,
  getDevCandidates,
  setDevCandidates,
} from '@/lib/candidates/dev-store';

export const dynamic = 'force-dynamic';

const safeAssetUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || isSafeCandidateAssetUrl(val),
    'URL aset tidak valid. Hanya path lokal (/uploads/*, /assets/*, /candidates/*) atau HTTPS domain resmi yang diizinkan.'
  )
  .nullable()
  .optional();

const candidateSchema = z.object({
  candidate_number: z.number().int().min(0, 'Nomor urut minimal 0'),
  leader_name: z.string().min(2, 'Nama Calon Chairman minimal 2 karakter'),
  vice_leader_name: z.string().min(2, 'Nama Calon Vice Chairman minimal 2 karakter'),
  vision: z.string().min(5, 'Visi minimal 5 karakter'),
  mission: z.array(z.string()).min(1, 'Minimal sertakan 1 butir misi'),
  photo_url: safeAssetUrlSchema,
  chairman_cv_url: safeAssetUrlSchema,
  vice_chairman_cv_url: safeAssetUrlSchema,
  is_active: z.boolean().default(true),
});

const candidateUpdateSchema = candidateSchema.partial();

export async function GET() {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session);

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

      if (!error && candidates) {
        return NextResponse.json({ success: true, candidates });
      }

      if (error) {
        console.warn('[AdminCandidatesRoute] Supabase error in GET:', error.message);
      }
    } catch (err) {
      console.warn('[AdminCandidatesRoute] Database offline, checking dev storage:', err);
    }
  }

  if (isDevFallbackAllowed(isSupabaseConfigured())) {
    return NextResponse.json({ success: true, candidates: getDevCandidates() });
  }

  return NextResponse.json({ error: 'Gagal memuat daftar kandidat.' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session, 'manage_candidates');

  if (!authCheck.authorized || authCheck.effectiveRole === 'auditor') {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki hak mengelola data kandidat.', code: 'FORBIDDEN' },
      { status: authCheck.authorized ? 403 : authCheck.status }
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

        if (error) {
          console.error('[AdminCandidatesRoute] Supabase insert error:', error);
          const errorMsg = error.code === '23505'
            ? `Nomor urut ${newCandidate.candidate_number} sudah digunakan oleh pasangan calon lain.`
            : `Gagal menyimpan ke database: ${error.message}`;
          return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

        if (data) {
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
        console.error('[AdminCandidatesRoute] DB error during insert:', dbErr);
        return NextResponse.json({ error: 'Gagal terhubung ke basis data kandidat.' }, { status: 500 });
      }
    }

    if (isDevFallbackAllowed(isSupabaseConfigured())) {
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
  const authCheck = await verifyActiveAdminAccess(session, 'manage_candidates');

  if (!authCheck.authorized || authCheck.effectiveRole === 'auditor') {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki hak memperbarui data kandidat.', code: 'FORBIDDEN' },
      { status: authCheck.authorized ? 403 : authCheck.status }
    );
  }

  try {
    const body = await req.json();
    const { id, ...rawUpdates } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID kandidat wajib disertakan.' }, { status: 400 });
    }

    const parsedUpdates = candidateUpdateSchema.safeParse(rawUpdates);
    if (!parsedUpdates.success) {
      return NextResponse.json(
        { error: 'Data pembaruan kandidat tidak valid.', details: parsedUpdates.error.format() },
        { status: 400 }
      );
    }

    const updates = parsedUpdates.data;

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { photo_url, ...restUpdates } = updates;
        const updatePayload: Database['public']['Tables']['candidates']['Update'] = {
          ...restUpdates,
          ...(photo_url !== undefined ? { photo_url: photo_url ?? '' } : {}),
        };

        const { data, error } = await adminSupabase
          .from('candidates')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('[AdminCandidatesRoute] Supabase update error:', error);
          const errorMsg = error.code === '23505'
            ? `Nomor urut ${updates.candidate_number || ''} sudah digunakan oleh pasangan calon lain.`
            : `Gagal memperbarui di database: ${error.message}`;
          return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

        if (data) {
          const ip = getClientIp(req);
          const isKotakKosong = updates.candidate_number === 0 || id === 'dev-cand-0';
          await recordAuditLog({
            actorEmail: session?.email || 'admin@pemira.local',
            actorName: session?.name || 'Panitia KPR',
            actorRole: session?.role || 'kpr_admin',
            action: isKotakKosong ? 'KOTAK_KOSONG_TOGGLE' : 'CANDIDATE_UPDATE',
            description: isKotakKosong
              ? `Memperbarui status opsi Kotak Kosong (Aktif: ${updates.is_active}).`
              : `Memperbarui data Paslon ID ${id} (${updates.leader_name || data.leader_name || 'Kandidat'}).`,
            ipAddress: ip,
            details: updates,
          });
          return NextResponse.json({ success: true, candidate: data });
        }
      } catch (dbErr) {
        console.error('[AdminCandidatesRoute] DB error during update:', dbErr);
        return NextResponse.json({ error: 'Gagal terhubung ke basis data saat memperbarui kandidat.' }, { status: 500 });
      }
    }

    if (isDevFallbackAllowed(isSupabaseConfigured())) {
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
  const authCheck = await verifyActiveAdminAccess(session, 'manage_candidates');

  if (!authCheck.authorized || authCheck.effectiveRole === 'auditor') {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki hak menghapus kandidat.', code: 'FORBIDDEN' },
      { status: authCheck.authorized ? 403 : authCheck.status }
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

        // 1. Ambil info kandidat dari DB untuk verifikasi dan audit log
        const { data: dbCandidate, error: fetchErr } = await adminSupabase
          .from('candidates')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchErr) {
          console.error('[AdminCandidatesRoute] Error fetching candidate before delete:', fetchErr);
        }

        const candidateToDelete = dbCandidate || target;

        if (candidateToDelete && candidateToDelete.candidate_number === 0) {
          return NextResponse.json(
            { error: 'Opsi Kotak Kosong adalah opsi konstitusional dasar dan tidak dapat dihapus.' },
            { status: 400 }
          );
        }

        // 2. Integritas Surat Suara: Cek apakah kandidat sudah memiliki surat suara terkait
        const { count: ballotCount, error: countErr } = await adminSupabase
          .from('ballots')
          .select('*', { count: 'exact', head: true })
          .eq('candidate_id', id);

        if (!countErr && typeof ballotCount === 'number' && ballotCount > 0) {
          return NextResponse.json(
            {
              error: `Tindakan Ditolak: Pasangan calon ini telah menerima ${ballotCount} suara sah di bilik suara. Untuk menjaga integritas riwayat pemilihan dan asas kerahasiaan suara (*Ballot Secrecy*), pasangan calon tidak dapat dihapus permanen. Silakan gunakan opsi nonaktifkan (arsip).`,
              code: 'CANDIDATE_HAS_BALLOTS',
              ballotCount,
            },
            { status: 409 }
          );
        }

        // 3. Eksekusi penghapusan di Supabase
        const { error: delError } = await adminSupabase
          .from('candidates')
          .delete()
          .eq('id', id);

        if (delError) {
          console.error('[AdminCandidatesRoute] Supabase delete error:', delError);
          return NextResponse.json(
            { error: `Gagal menghapus kandidat dari database: ${delError.message}` },
            { status: 400 }
          );
        }

        const ip = getClientIp(req);
        await recordAuditLog({
          actorEmail: session?.email || 'admin@pemira.local',
          actorName: session?.name || 'Panitia KPR',
          actorRole: session?.role || 'kpr_admin',
          action: 'CANDIDATE_DELETE',
          description: `Menghapus Paslon ID ${id} (${candidateToDelete?.leader_name || 'Pasangan Calon'}).`,
          ipAddress: ip,
          details: {
            id,
            leader_name: candidateToDelete?.leader_name,
            candidate_number: candidateToDelete?.candidate_number,
          },
        });

        return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus dari database.' });
      } catch (dbErr) {
        console.error('[AdminCandidatesRoute] DB error during delete:', dbErr);
        return NextResponse.json({ error: 'Gagal terhubung ke basis data saat menghapus kandidat.' }, { status: 500 });
      }
    }

    if (isDevFallbackAllowed(isSupabaseConfigured())) {
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
