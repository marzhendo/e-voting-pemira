import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { queryAuditLogs, getAllAuditLogs } from '@/lib/audit/store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'view_audit_logs');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat log audit.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const search = searchParams.get('q') || '';
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);
    const offset = Number(searchParams.get('offset') || '0');

    const result = queryAuditLogs({
      action: action === 'all' ? null : action,
      search: search.trim() || null,
      limit,
      offset,
    });

    const allLogs = getAllAuditLogs();
    const stats = {
      total: allLogs.length,
      settingsCount: allLogs.filter((l) => l.action.startsWith('ELECTION_') || l.action.startsWith('MAINTENANCE_')).length,
      candidatesCount: allLogs.filter((l) => l.action.startsWith('CANDIDATE_') || l.action.startsWith('KOTAK_')).length,
      dptCount: allLogs.filter((l) => l.action.startsWith('DPT_')).length,
      broadcastCount: allLogs.filter((l) => l.action.startsWith('BROADCAST_')).length,
      adminCount: allLogs.filter((l) => l.action.startsWith('ADMIN_')).length,
    };

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      stats,
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
