import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { queryVoters, deleteSingleVoter, deleteVotersBatch, resetAllVoters } from '@/lib/dpt/store';
import { recordAuditLog } from '@/lib/audit/store';
import { getClientIp } from '@/lib/auth/client-ip';

export const dynamic = 'force-dynamic';

const DeleteDptSchema = z.object({
  action: z.enum(['delete_single', 'delete_batch', 'reset_all']),
  id: z.string().optional(),
  nim: z.string().optional(),
  ids: z.array(z.string()).optional(),
  mode: z.enum(['reset_to_default', 'clear_all', 'reset_vote_status']).optional(),
});

export async function GET(req: NextRequest) {
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
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('q') || '';
      const generation = searchParams.get('generation');
      const status = searchParams.get('status'); // 'voted' | 'not_voted' | null
      const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);
      const offset = Number(searchParams.get('offset') || '0');

      const adminSupabase = createAdminClient();

      let query = adminSupabase
        .from('voters_whitelist')
        .select('id, nim, name, email, generation, has_voted, updated_at', { count: 'exact' });

      if (search.trim()) {
        query = query.or(`nim.ilike.%${search.trim()}%,name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
      }

      if (generation && generation !== 'all') {
        query = query.eq('generation', Number(generation));
      }

      if (status === 'voted') {
        query = query.eq('has_voted', true);
      } else if (status === 'not_voted') {
        query = query.eq('has_voted', false);
      }

      query = query.order('nim', { ascending: true }).range(offset, offset + limit - 1);

      const { data: voters, error, count } = await query;

      if (!error && voters) {
        return NextResponse.json({
          success: true,
          voters: voters || [],
          total: count || 0,
          limit,
          offset,
        });
      }
    } catch (err) {
      console.warn('[AdminDptRoute] Database offline, checking dev fallback:', err);
    }
  }

  // Dev store jika Supabase belum online
  if (process.env.APP_ENV !== 'production') {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const generation = searchParams.get('generation');
    const status = searchParams.get('status') as 'voted' | 'not_voted' | 'all' | null;
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);
    const offset = Number(searchParams.get('offset') || '0');

    const result = queryVoters({
      search,
      generation: generation || undefined,
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      voters: result.voters,
      total: result.total,
      limit,
      offset,
    });
  }

  return NextResponse.json({ error: 'Gagal mengambil data pemilih.' }, { status: 500 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'manage_dpt');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  // Wewenang hapus dan reset DPT secara ketat dibatasi hanya untuk super_admin
  if (session?.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Fitur penghapusan atau reset DPT hanya dapat diakses oleh peran Superadmin.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = DeleteDptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Format permintaan tidak valid.' },
        { status: 400 }
      );
    }

    const { action, id, nim, ids, mode } = parsed.data;
    const clientIp = getClientIp(req);

    // 1. DELETE SINGLE
    if (action === 'delete_single') {
      const targetIdentifier = id || nim;
      if (!targetIdentifier) {
        return NextResponse.json({ error: 'ID atau NIM pemilih wajib disertakan.' }, { status: 400 });
      }

      if (isSupabaseConfigured()) {
        const adminSupabase = createAdminClient();
        const { data: voter } = await adminSupabase
          .from('voters_whitelist')
          .select('id, nim, name, email, has_voted')
          .or(`id.eq.${targetIdentifier},nim.eq.${targetIdentifier}`)
          .maybeSingle();

        if (!voter) {
          return NextResponse.json({ error: 'Pemilih tidak ditemukan.' }, { status: 404 });
        }

        if (voter.email?.toLowerCase() === 'marzhendogalangs@gmail.com') {
          return NextResponse.json({ error: 'Akun Superadmin utama tidak dapat dihapus.' }, { status: 400 });
        }

        const { error: delError } = await adminSupabase
          .from('voters_whitelist')
          .delete()
          .eq('id', voter.id);

        if (delError) {
          return NextResponse.json({ error: 'Gagal menghapus pemilih dari database.' }, { status: 500 });
        }

        recordAuditLog({
          actorEmail: session.email,
          actorName: session.name,
          actorRole: session.role,
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

      // Dev store fallback
      const delResult = deleteSingleVoter(targetIdentifier);
      if (!delResult.success) {
        return NextResponse.json({ error: delResult.error || 'Gagal menghapus pemilih.' }, { status: 400 });
      }

      recordAuditLog({
        actorEmail: session.email,
        actorName: session.name,
        actorRole: session.role,
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
      if (!ids || ids.length === 0) {
        return NextResponse.json({ error: 'Daftar ID pemilih yang akan dihapus tidak boleh kosong.' }, { status: 400 });
      }

      if (isSupabaseConfigured()) {
        const adminSupabase = createAdminClient();
        const { error: delBatchError, count } = await adminSupabase
          .from('voters_whitelist')
          .delete({ count: 'exact' })
          .in('id', ids)
          .neq('email', 'marzhendogalangs@gmail.com');

        if (delBatchError) {
          return NextResponse.json({ error: 'Gagal menghapus pemilih terpilih.' }, { status: 500 });
        }

        recordAuditLog({
          actorEmail: session.email,
          actorName: session.name,
          actorRole: session.role,
          action: 'DPT_BATCH_DELETE',
          description: `Menghapus massal secara selektif sejumlah ${count || ids.length} data pemilih DPT.`,
          ipAddress: clientIp,
          details: { target: 'voters_whitelist', deletedCount: count || ids.length },
        });

        return NextResponse.json({
          success: true,
          deletedCount: count || ids.length,
          message: `${count || ids.length} pemilih berhasil dihapus dari DPT.`,
        });
      }

      const batchResult = deleteVotersBatch(ids);
      recordAuditLog({
        actorEmail: session.email,
        actorName: session.name,
        actorRole: session.role,
        action: 'DPT_BATCH_DELETE',
        description: `Menghapus massal secara selektif sejumlah ${batchResult.deletedCount} data pemilih DPT (Dev Mode).`,
        ipAddress: clientIp,
        details: { target: 'voters_whitelist', deletedCount: batchResult.deletedCount },
      });

      return NextResponse.json({
        success: true,
        deletedCount: batchResult.deletedCount,
        message: `${batchResult.deletedCount} pemilih berhasil dihapus dari DPT.`,
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
            actorRole: session.role,
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
            actorRole: session.role,
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
      }

      // Dev store reset
      const resetResult = resetAllVoters(selectedMode);
      recordAuditLog({
        actorEmail: session.email,
        actorName: session.name,
        actorRole: session.role,
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
