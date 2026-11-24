import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { queryVoters, deleteSingleVoter, deleteVotersBatch, resetAllVoters, getAllVoters } from '@/lib/dpt/store';
import { recordAuditLog } from '@/lib/audit/store';
import { getClientIp } from '@/lib/auth/client-ip';
import { getRootSuperadminEmail, isRootSuperadminEmail } from '@/lib/auth/constants';
import { isDevFallbackAllowed } from '@/lib/security/env';

export const dynamic = 'force-dynamic';

const DeleteDptSchema = z.object({
  action: z.enum(['delete_single', 'delete_batch', 'reset_all']),
  id: z.string().optional(),
  nim: z.string().optional(),
  ids: z.array(z.string()).optional(),
  nims: z.array(z.string()).optional(),
  mode: z.enum(['reset_to_default', 'clear_all', 'reset_vote_status']).optional(),
});

export async function GET(req: NextRequest) {
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
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('q') || '';
      const generation = searchParams.get('generation');
      const status = searchParams.get('status'); // 'voted' | 'not_voted' | null
      const requestedLimit = Number(searchParams.get('limit') || '50');
      const limit = Math.min(Math.max(requestedLimit, 10), 100);
      const requestedPage = Number(searchParams.get('page') || '0');
      const offset = requestedPage > 0
        ? (requestedPage - 1) * limit
        : Math.max(Number(searchParams.get('offset') || '0'), 0);

      const adminSupabase = createAdminClient();

      let query = adminSupabase
        .from('voters_whitelist')
        .select('id, nim, name, email, generation, has_voted, password_created_at, password_hash, created_at', { count: 'exact' });

      const sanitizedSearch = search.trim().replace(/[^a-zA-Z0-9\s@._-]/g, '');
      if (sanitizedSearch) {
        query = query.or(`nim.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
      }

      if (generation && generation !== 'all') {
        const parsedGen = Number(generation);
        if (Number.isInteger(parsedGen)) {
          query = query.eq('generation', parsedGen);
        }
      }

      if (status === 'voted') {
        query = query.eq('has_voted', true);
      } else if (status === 'not_voted') {
        query = query.eq('has_voted', false);
      }

      query = query.order('nim', { ascending: true }).range(offset, offset + limit - 1);

      const { data: voters, error, count } = await query;

      if (error) {
        console.error('[AdminDptRoute] Supabase query error:', error);
      }

      if (!error && voters) {
        const total = count || 0;
        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(total / limit) || 1;

        return NextResponse.json({
          success: true,
          voters: voters.map((v) => ({
            id: v.id,
            nim: v.nim,
            name: v.name,
            email: v.email,
            generation: v.generation,
            has_voted: v.has_voted,
            has_password: Boolean(v.password_hash),
            password_created_at: v.password_created_at || null,
            updated_at: v.created_at || new Date().toISOString(),
          })),
          total,
          limit,
          offset,
          page: currentPage,
          totalPages,
        });
      }
    } catch (err) {
      console.error('[AdminDptRoute] Database error:', err);
      return NextResponse.json({ error: 'Gagal memuat data pemilih dari basis data.' }, { status: 500 });
    }
  }

  // Dev store jika Supabase belum online
  if (isDevFallbackAllowed(isSupabaseConfigured())) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const generation = searchParams.get('generation');
    const status = searchParams.get('status') as 'voted' | 'not_voted' | 'all' | null;
    const requestedLimit = Number(searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(requestedLimit, 10), 100);
    const requestedPage = Number(searchParams.get('page') || '0');
    const offset = requestedPage > 0
      ? (requestedPage - 1) * limit
      : Math.max(Number(searchParams.get('offset') || '0'), 0);

    const result = queryVoters({
      search,
      generation: generation || undefined,
      status: status || undefined,
      limit,
      offset,
    });

    const total = result.total;
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      voters: result.voters.map((v) => ({
        id: v.id,
        nim: v.nim,
        name: v.name,
        email: v.email,
        generation: v.generation,
        has_voted: v.has_voted,
        has_password: Boolean(v.password_hash),
        password_created_at: v.password_created_at || null,
        updated_at: v.updated_at || v.created_at || new Date().toISOString(),
      })),
      total,
      limit,
      offset,
      page: currentPage,
      totalPages,
    });
  }

  return NextResponse.json({ error: 'Gagal mengambil data pemilih.' }, { status: 500 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session, 'manage_dpt');

  if (!authCheck.authorized || !session) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  // Wewenang hapus dan reset DPT secara ketat dibatasi hanya untuk super_admin
  if (authCheck.effectiveRole !== 'super_admin') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Fitur penghapusan atau reset DPT hanya dapat diakses oleh peran Superadmin.' },
      { status: 403 }
    );
  }

  const actorRole = authCheck.effectiveRole;

  try {
    const body = await req.json();
    const parsed = DeleteDptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Format permintaan tidak valid.' },
        { status: 400 }
      );
    }

    const { action, id, nim, ids, nims, mode } = parsed.data;
    const clientIp = getClientIp(req);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = (val?: string) => Boolean(val && UUID_REGEX.test(val));

    // 1. DELETE SINGLE
    if (action === 'delete_single') {
      const targetIdentifier = id || nim;
      if (!targetIdentifier) {
        return NextResponse.json({ error: 'ID atau NIM pemilih wajib disertakan.' }, { status: 400 });
      }

      if (isSupabaseConfigured()) {
        const adminSupabase = createAdminClient();
        let query = adminSupabase
          .from('voters_whitelist')
          .select('id, nim, name, email, has_voted');

        if (id && isUuid(id)) {
          query = query.eq('id', id);
        } else if (nim) {
          query = query.eq('nim', nim);
        } else if (isUuid(targetIdentifier)) {
          query = query.eq('id', targetIdentifier);
        } else {
          query = query.eq('nim', targetIdentifier);
        }

        const { data: voter, error: fetchErr } = await query.maybeSingle();

        if (fetchErr) {
          console.warn('[AdminDptRoute] Supabase fetch error on delete_single:', fetchErr);
        }

        if (voter) {
          if (isRootSuperadminEmail(voter.email)) {
            return NextResponse.json({ error: 'Akun Superadmin utama tidak dapat dihapus.' }, { status: 400 });
          }

          const { error: delError } = await adminSupabase
            .from('voters_whitelist')
            .delete()
            .eq('id', voter.id);

          if (delError) {
            console.error('[AdminDptRoute] Supabase delete error:', delError);
            return NextResponse.json({ error: 'Gagal menghapus pemilih dari database.' }, { status: 500 });
          }

          // Sinkronisasi hapus dari dev store juga jika ada
          deleteSingleVoter(voter.nim);
          deleteSingleVoter(voter.id);

          recordAuditLog({
            actorEmail: session.email,
            actorName: session.name,
            actorRole,
            action: 'DPT_DELETE',
            description: `Menghapus pemilih DPT: ${voter.name} (NIM: ${voter.nim})${voter.has_voted ? ' [PERINGATAN: Pemilih sudah memilih]' : ''}.`,
            ipAddress: clientIp,
            details: { target: 'voters_whitelist', voterId: voter.id, nim: voter.nim },
          });

          return NextResponse.json({
            success: true,
            message: `Pemilih ${voter.name} (NIM: ${voter.nim}) berhasil dihapus dari DPT.`,
            voter,
          });
        }
      }

      // Dev store fallback
      const delResult = deleteSingleVoter(targetIdentifier);
      if (!delResult.success) {
        return NextResponse.json({ error: delResult.error || 'Gagal menghapus pemilih.' }, { status: 400 });
      }

      recordAuditLog({
        actorEmail: session.email,
        actorName: session.name,
        actorRole,
        action: 'DPT_DELETE',
        description: `Menghapus pemilih DPT: ${delResult.voter?.name} (NIM: ${delResult.voter?.nim})${delResult.voter?.has_voted ? ' [PERINGATAN: Pemilih sudah memilih]' : ''} (Dev Mode).`,
        ipAddress: clientIp,
        details: { target: 'voters_whitelist', voterId: delResult.voter?.id, nim: delResult.voter?.nim },
      });

      return NextResponse.json({
        success: true,
        message: `Pemilih ${delResult.voter?.name} (NIM: ${delResult.voter?.nim}) berhasil dihapus dari DPT.`,
        voter: delResult.voter,
      });
    }

    // 2. DELETE BATCH (SELECTIVE)
    if (action === 'delete_batch') {
      const targetIds = ids || [];
      const targetNims = nims || [];

      if (targetIds.length === 0 && targetNims.length === 0) {
        return NextResponse.json({ error: 'Daftar ID atau NIM pemilih yang akan dihapus tidak boleh kosong.' }, { status: 400 });
      }

      const validUuidIds = targetIds.filter(isUuid);
      const nonUuidIds = targetIds.filter((tid) => !isUuid(tid));

      // Resolusi NIM dari dev store jika ID yang dikirim berasal dari format dev (contoh: 'voter-1')
      const devVoters = getAllVoters();
      const nimsFromDevStore = nonUuidIds
        .map((targetId) => {
          const match = devVoters.find(
            (v) => v.id.toLowerCase() === targetId.toLowerCase() || v.nim.toLowerCase() === targetId.toLowerCase()
          );
          return match?.nim;
        })
        .filter((resolvedNim): resolvedNim is string => Boolean(resolvedNim));

      // Kumpulkan seluruh NIM yang ditargetkan
      const allTargetNims = Array.from(
        new Set([
          ...targetNims,
          ...nonUuidIds.filter((tid) => /^\d+$/.test(tid)),
          ...nimsFromDevStore,
        ])
      );

      let totalDeletedFromDb = 0;

      if (isSupabaseConfigured()) {
        try {
          const adminSupabase = createAdminClient();

          // 1. Hapus berdasarkan UUID yang valid (mencegah error PostgreSQL 22P02)
          if (validUuidIds.length > 0) {
            const { error: uuidDelErr, count: uuidCount } = await adminSupabase
              .from('voters_whitelist')
              .delete({ count: 'exact' })
              .in('id', validUuidIds)
              .neq('email', getRootSuperadminEmail());

            if (!uuidDelErr && uuidCount) {
              totalDeletedFromDb += uuidCount;
            } else if (uuidDelErr) {
              console.warn('[AdminDptRoute] Supabase error deleting by UUIDs:', uuidDelErr);
            }
          }

          // 2. Hapus berdasarkan NIM (menangani voter yang diimpor, record non-UUID, atau seleksi NIM)
          if (allTargetNims.length > 0) {
            const { error: nimDelErr, count: nimCount } = await adminSupabase
              .from('voters_whitelist')
              .delete({ count: 'exact' })
              .in('nim', allTargetNims)
              .neq('email', getRootSuperadminEmail());

            if (!nimDelErr && nimCount) {
              totalDeletedFromDb += nimCount;
            } else if (nimDelErr) {
              console.warn('[AdminDptRoute] Supabase error deleting by NIMs:', nimDelErr);
            }
          }
        } catch (dbErr) {
          console.warn('[AdminDptRoute] Database error during batch delete:', dbErr);
        }
      }

      // Sinkronisasi hapus dari dev store juga
      const batchResult = deleteVotersBatch([...targetIds, ...allTargetNims]);
      const finalCount = Math.max(totalDeletedFromDb, batchResult.deletedCount, targetIds.length);

      recordAuditLog({
        actorEmail: session.email,
        actorName: session.name,
        actorRole,
        action: 'DPT_BATCH_DELETE',
        description: `Menghapus massal secara selektif sejumlah ${finalCount} data pemilih DPT.`,
        ipAddress: clientIp,
        details: { target: 'voters_whitelist', deletedCount: finalCount },
      });

      return NextResponse.json({
        success: true,
        deletedCount: finalCount,
        message: `${finalCount} pemilih berhasil dihapus dari DPT.`,
      });
    }

    // 3. RESET ALL
    if (action === 'reset_all') {
      const selectedMode = mode || 'reset_to_default';

      if (isSupabaseConfigured()) {
        const adminSupabase = createAdminClient();

        if (selectedMode === 'reset_vote_status') {
          await adminSupabase
            .from('voters_whitelist')
            .update({ has_voted: false, receipt_hash: null, voted_at: null })
            .gte('generation', 0);

          recordAuditLog({
            actorEmail: session.email,
            actorName: session.name,
            actorRole,
            action: 'DPT_RESET',
            description: 'Mereset status voting seluruh pemilih menjadi Belum Memilih (Simulasi DPT).',
            ipAddress: clientIp,
            details: { mode: selectedMode },
          });

          return NextResponse.json({
            success: true,
            message: 'Status voting seluruh pemilih berhasil direset.',
          });
        }

        if (selectedMode === 'clear_all') {
          await adminSupabase
            .from('voters_whitelist')
            .delete()
            .neq('email', 'marzhendogalangs@gmail.com');

          recordAuditLog({
            actorEmail: session.email,
            actorName: session.name,
            actorRole,
            action: 'DPT_RESET',
            description: 'Mengosongkan seluruh data pemilih mahasiswa DPT (kecuali akun Superadmin).',
            ipAddress: clientIp,
            details: { mode: selectedMode },
          });

          return NextResponse.json({
            success: true,
            message: 'Seluruh data pemilih mahasiswa berhasil dikosongkan.',
          });
        }

        if (selectedMode === 'reset_to_default') {
          await adminSupabase
            .from('voters_whitelist')
            .delete()
            .neq('email', getRootSuperadminEmail());

          const defaultVoters = [
            { nim: '103012300001', name: 'Ahmad Rizky Pratama', email: 'voter1@student.telkomuniversity.ac.id', generation: 2023, has_voted: false },
            { nim: '103012300002', name: 'Budi Santoso', email: 'voter2@student.telkomuniversity.ac.id', generation: 2023, has_voted: false },
            { nim: '103012400003', name: 'Citra Dewi Lestari', email: 'voter3@student.telkomuniversity.ac.id', generation: 2024, has_voted: false },
            { nim: '103012400004', name: 'Dimas Wicaksono', email: 'dimasw@student.telkomuniversity.ac.id', generation: 2024, has_voted: false },
            { nim: '103012500005', name: 'Fadhil Muhammad', email: 'fadhilm@student.telkomuniversity.ac.id', generation: 2025, has_voted: false },
            { nim: '103012600006', name: 'Siti Nurhaliza', email: 'sitinur@student.telkomuniversity.ac.id', generation: 2026, has_voted: false },
            { nim: '103012400099', name: 'Marzhendo', email: 'marzhendo03@gmail.com', generation: 2024, has_voted: false },
            { nim: '103112400102', name: 'Penguji Sistem KPR (Galang)', email: 'marzhendogalang@student.telkomuniversity.ac.id', generation: 2024, has_voted: false },
          ];

          await adminSupabase
            .from('voters_whitelist')
            .upsert(defaultVoters, { onConflict: 'email' });

          recordAuditLog({
            actorEmail: session.email,
            actorName: session.name,
            actorRole,
            action: 'DPT_RESET',
            description: 'Mereset data DPT dan memulihkan data pemilih standar ke basis data.',
            ipAddress: clientIp,
            details: { mode: selectedMode },
          });

          return NextResponse.json({
            success: true,
            message: 'Data DPT berhasil dikembalikan ke pengaturan default sistem.',
          });
        }
      }

      // Dev store reset
      const resetResult = resetAllVoters(selectedMode);
      recordAuditLog({
        actorEmail: session.email,
        actorName: session.name,
        actorRole,
        action: 'DPT_RESET',
        description: `Mereset data DPT dengan mode: ${selectedMode} (Dev Mode).`,
        ipAddress: clientIp,
        details: { mode: selectedMode },
      });

      return NextResponse.json({
        success: true,
        count: resetResult.count,
        message:
          selectedMode === 'reset_vote_status'
            ? 'Status voting seluruh pemilih berhasil direset.'
            : selectedMode === 'clear_all'
            ? 'Seluruh data pemilih mahasiswa berhasil dikosongkan.'
            : 'Data DPT berhasil dikembalikan ke pengaturan default sistem.',
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err) {
    console.error('[AdminDptRoute:DELETE] Error:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan server saat memproses penghapusan DPT.' }, { status: 500 });
  }
}
