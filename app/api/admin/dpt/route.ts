import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { queryVoters } from '@/lib/dpt/store';

export const dynamic = 'force-dynamic';

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
