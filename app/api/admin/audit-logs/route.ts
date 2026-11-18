import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { fetchAuditLogsSnapshot } from '@/lib/audit/query';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'view_audit_logs');

  if (!authCheck.authorized) {
    return NextResponse.json(
      {
        error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat log audit.',
        code: 'FORBIDDEN',
      },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const search = searchParams.get('q') || '';
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(Number(searchParams.get('offset') || '0'), 0);

    const snapshot = await fetchAuditLogsSnapshot({ action, search, limit, offset });

    return NextResponse.json({
      success: true,
      logs: snapshot.logs,
      total: snapshot.total,
      stats: snapshot.stats,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[AuditLogsRoute] GET error:', err);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memuat data audit log.' },
      { status: 500 }
    );
  }
}
