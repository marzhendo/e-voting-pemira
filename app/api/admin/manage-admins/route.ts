import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import {
  getAllAdminUsers,
  addAdminUser,
  updateAdminRole,
  toggleAdminActive,
  deleteAdminUser,
} from '@/lib/admin/store';
import type { AdminRole } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const addAdminSchema = z.object({
  name: z.string().min(2, 'Nama administrator minimal 2 karakter.'),
  email: z.string().email('Format email tidak valid.'),
  nim: z.string().optional(),
  role: z.enum(['kpr_admin', 'auditor', 'super_admin']),
});

const updateAdminSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['kpr_admin', 'auditor', 'super_admin']).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'manage_admins');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Hanya Superadmin yang berwenang mengelola panitia.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const admins = getAllAdminUsers();
    return NextResponse.json({
      success: true,
      admins,
      stats: {
        total: admins.length,
        superAdminCount: admins.filter((a) => a.role === 'super_admin').length,
        kprAdminCount: admins.filter((a) => a.role === 'kpr_admin').length,
        auditorCount: admins.filter((a) => a.role === 'auditor').length,
      },
    });
  } catch (err) {
    console.error('[ManageAdminsRoute] GET error:', err);
    return NextResponse.json(
      { error: 'Gagal mengambil data administrator.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'manage_admins');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Hanya Superadmin yang berwenang menambah panitia.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = addAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data formulir administrator tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, nim, role } = parsed.data;
    const result = addAdminUser({ name, email, nim, role: role as AdminRole });

    if (!result.success || !result.admin) {
      return NextResponse.json(
        { error: result.error || 'Gagal menambahkan administrator.' },
        { status: 400 }
      );
    }

    // Catat ke Audit Trail
    const ip = getClientIp(request);
    await recordAuditLog({
      actorEmail: session?.email || 'superadmin@system',
      actorName: session?.name || 'Superadmin',
      actorRole: session?.role || 'super_admin',
      action: 'ADMIN_CREATE',
      description: `Menambahkan administrator baru: ${result.admin.name} (${result.admin.email}) dengan peran ${result.admin.role}.`,
      ipAddress: ip,
      details: {
        admin_id: result.admin.id,
        admin_name: result.admin.name,
        admin_email: result.admin.email,
        admin_role: result.admin.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Administrator ${result.admin.name} berhasil ditambahkan.`,
      admin: result.admin,
    });
  } catch (err) {
    console.error('[ManageAdminsRoute] POST error:', err);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat menambahkan administrator.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'manage_admins');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Hanya Superadmin yang berwenang mengubah status panitia.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data pembaruan administrator tidak valid.' },
        { status: 400 }
      );
    }

    const { id, role, isActive } = parsed.data;
    const ip = getClientIp(request);
    let updatedAdmin;

    if (role) {
      const resRole = updateAdminRole(id, role as AdminRole);
      if (!resRole.success) {
        return NextResponse.json({ error: resRole.error }, { status: 400 });
      }
      updatedAdmin = resRole.admin;

      await recordAuditLog({
        actorEmail: session?.email || 'superadmin@system',
        actorName: session?.name || 'Superadmin',
        actorRole: session?.role || 'super_admin',
        action: 'ADMIN_UPDATE_ROLE',
        description: `Mengubah peran administrator ${updatedAdmin?.name} menjadi ${role}.`,
        ipAddress: ip,
        details: { admin_id: id, new_role: role },
      });
    }

    if (typeof isActive === 'boolean') {
      const resActive = toggleAdminActive(id, isActive);
      if (!resActive.success) {
        return NextResponse.json({ error: resActive.error }, { status: 400 });
      }
      updatedAdmin = resActive.admin;

      await recordAuditLog({
        actorEmail: session?.email || 'superadmin@system',
        actorName: session?.name || 'Superadmin',
        actorRole: session?.role || 'super_admin',
        action: 'ADMIN_UPDATE_ROLE',
        description: `Mengubah status keaktifan administrator ${updatedAdmin?.name} menjadi ${isActive ? 'Aktif' : 'Nonaktif'}.`,
        ipAddress: ip,
        details: { admin_id: id, is_active: isActive },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Data administrator berhasil diperbarui.',
      admin: updatedAdmin,
    });
  } catch (err) {
    console.error('[ManageAdminsRoute] PATCH error:', err);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memperbarui administrator.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'manage_admins');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak: Hanya Superadmin yang berwenang mencabut panitia.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID administrator wajib disertakan.' }, { status: 400 });
    }

    const allAdmins = getAllAdminUsers();
    const target = allAdmins.find((a) => a.id === id);

    if (target?.email === session?.email) {
      return NextResponse.json(
        { error: 'Tindakan Ditolak: Anda tidak dapat mencabut atau menghapus akun Anda sendiri.' },
        { status: 400 }
      );
    }

    const res = deleteAdminUser(id);
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Gagal menghapus administrator.' }, { status: 400 });
    }

    const ip = getClientIp(request);
    await recordAuditLog({
      actorEmail: session?.email || 'superadmin@system',
      actorName: session?.name || 'Superadmin',
      actorRole: session?.role || 'super_admin',
      action: 'ADMIN_REVOKE',
      description: `Mencabut akses administrator: ${target?.name} (${target?.email}) [Peran: ${target?.role}].`,
      ipAddress: ip,
      details: {
        admin_id: id,
        admin_email: target?.email,
        admin_name: target?.name,
        admin_role: target?.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akses administrator ${target?.name || ''} berhasil dicabut.`,
    });
  } catch (err) {
    console.error('[ManageAdminsRoute] DELETE error:', err);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat mencabut administrator.' },
      { status: 500 }
    );
  }
}
