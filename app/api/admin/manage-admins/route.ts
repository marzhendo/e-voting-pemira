import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import {
  getAllAdminUsers,
  addAdminUser,
  updateAdminRole,
  toggleAdminActive,
  deleteAdminUser,
} from '@/lib/admin/store';
import type { AdminRole, Database } from '@/lib/supabase/types';

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
    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data: dbAdmins, error } = await adminSupabase
          .from('admin_users')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && dbAdmins && dbAdmins.length > 0) {
          const emails = dbAdmins.map((a) => a.email.toLowerCase());
          const { data: voterProfiles } = await adminSupabase
            .from('voters_whitelist')
            .select('email, name, nim')
            .in('email', emails);

          const profileMap = new Map((voterProfiles || []).map((v) => [v.email.toLowerCase(), v]));
          const devAdmins = getAllAdminUsers();
          const devMap = new Map(devAdmins.map((d) => [d.email.toLowerCase(), d]));

          const mergedAdmins = dbAdmins.map((a) => {
            const p = profileMap.get(a.email.toLowerCase());
            const d = devMap.get(a.email.toLowerCase());
            return {
              id: a.id,
              email: a.email,
              role: a.role as AdminRole,
              is_active: a.is_active,
              name: p?.name || d?.name || a.created_by || a.email.split('@')[0],
              nim: p?.nim || d?.nim || undefined,
              created_at: a.created_at,
              updated_at: a.updated_at,
            };
          });

          return NextResponse.json({
            success: true,
            admins: mergedAdmins,
            stats: {
              total: mergedAdmins.length,
              superAdminCount: mergedAdmins.filter((a) => a.role === 'super_admin').length,
              kprAdminCount: mergedAdmins.filter((a) => a.role === 'kpr_admin').length,
              auditorCount: mergedAdmins.filter((a) => a.role === 'auditor').length,
            },
          });
        }
      } catch (err) {
        console.warn('[ManageAdminsRoute] Supabase error in GET, falling back to local store:', err);
      }
    }

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
    const cleanEmail = email.trim().toLowerCase();
    const ip = getClientIp(request);

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data: existing } = await adminSupabase
          .from('admin_users')
          .select('id, email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existing) {
          return NextResponse.json(
            { error: `Email ${cleanEmail} sudah terdaftar sebagai pengelola/administrator.` },
            { status: 400 }
          );
        }

        const { data: inserted, error: insErr } = await adminSupabase
          .from('admin_users')
          .insert({
            email: cleanEmail,
            role: role as AdminRole,
            is_active: true,
            created_by: session?.email || 'superadmin@system',
          })
          .select()
          .single();

        if (insErr) {
          console.error('[ManageAdminsRoute] Supabase insert error:', insErr);
          return NextResponse.json({ error: `Gagal menambahkan administrator ke basis data: ${insErr.message}` }, { status: 400 });
        }

        await recordAuditLog({
          actorEmail: session?.email || 'superadmin@system',
          actorName: session?.name || 'Superadmin',
          actorRole: session?.role || 'super_admin',
          action: 'ADMIN_CREATE',
          description: `Menambahkan administrator baru: ${name} (${cleanEmail}) dengan peran ${role}.`,
          ipAddress: ip,
          details: {
            admin_id: inserted.id,
            admin_name: name,
            admin_email: cleanEmail,
            admin_role: role,
          },
        });

        // Simpan juga ke local dev store untuk konsistensi fallback
        addAdminUser({ name, email: cleanEmail, nim, role: role as AdminRole });

        return NextResponse.json({
          success: true,
          message: `Administrator ${name} berhasil didaftarkan.`,
          admin: {
            id: inserted.id,
            name,
            email: inserted.email,
            nim,
            role: inserted.role as AdminRole,
            is_active: inserted.is_active,
            created_at: inserted.created_at,
            updated_at: inserted.updated_at,
          },
        });
      } catch (err) {
        console.warn('[ManageAdminsRoute] Supabase error in POST, using dev store:', err);
      }
    }

    const result = addAdminUser({ name, email, nim, role: role as AdminRole });

    if (!result.success || !result.admin) {
      return NextResponse.json(
        { error: result.error || 'Gagal menambahkan administrator.' },
        { status: 400 }
      );
    }

    await recordAuditLog({
      actorEmail: session?.email || 'superadmin@system',
      actorName: session?.name || 'Superadmin',
      actorRole: session?.role || 'super_admin',
      action: 'ADMIN_CREATE',
      description: `Menambahkan administrator baru: ${result.admin.name} (${result.admin.email}) dengan peran ${result.admin.role} (Dev Mode).`,
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

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data: targetAdmin } = await adminSupabase
          .from('admin_users')
          .select('*')
          .or(`id.eq.${id},email.eq.${id}`)
          .maybeSingle();

        if (targetAdmin) {
          if (targetAdmin.email.toLowerCase() === 'marzhendogalangs@gmail.com') {
            if (isActive === false) {
              return NextResponse.json({ error: 'Akun Superadmin utama tidak dapat dinonaktifkan.' }, { status: 400 });
            }
            if (role && role !== 'super_admin') {
              return NextResponse.json({ error: 'Peran akun Superadmin utama tidak dapat diubah.' }, { status: 400 });
            }
          }

          const updates: Database['public']['Tables']['admin_users']['Update'] = { updated_at: new Date().toISOString() };
          if (role) updates.role = role as AdminRole;
          if (typeof isActive === 'boolean') updates.is_active = isActive;

          const { data: updatedAdmin, error: updErr } = await adminSupabase
            .from('admin_users')
            .update(updates)
            .eq('id', targetAdmin.id)
            .select()
            .single();

          if (updErr) {
            console.error('[ManageAdminsRoute] Supabase update error:', updErr);
            return NextResponse.json({ error: `Gagal memperbarui status di database: ${updErr.message}` }, { status: 400 });
          }

          await recordAuditLog({
            actorEmail: session?.email || 'superadmin@system',
            actorName: session?.name || 'Superadmin',
            actorRole: session?.role || 'super_admin',
            action: 'ADMIN_UPDATE_ROLE',
            description: role
              ? `Mengubah peran administrator ${targetAdmin.email} menjadi ${role}.`
              : `Mengubah status keaktifan administrator ${targetAdmin.email} menjadi ${isActive ? 'Aktif' : 'Nonaktif'}.`,
            ipAddress: ip,
            details: { admin_id: targetAdmin.id, ...updates },
          });

          // Sync to local store
          if (role) updateAdminRole(targetAdmin.email, role as AdminRole);
          if (typeof isActive === 'boolean') toggleAdminActive(targetAdmin.email, isActive);

          return NextResponse.json({
            success: true,
            message: 'Data administrator berhasil diperbarui.',
            admin: updatedAdmin,
          });
        }
      } catch (err) {
        console.warn('[ManageAdminsRoute] Supabase error in PATCH:', err);
      }
    }

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

    const ip = getClientIp(request);

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data: targetAdmin } = await adminSupabase
          .from('admin_users')
          .select('*')
          .or(`id.eq.${id},email.eq.${id}`)
          .maybeSingle();

        if (targetAdmin) {
          if (targetAdmin.email.toLowerCase() === session?.email?.toLowerCase()) {
            return NextResponse.json(
              { error: 'Tindakan Ditolak: Anda tidak dapat mencabut atau menghapus akun Anda sendiri.' },
              { status: 400 }
            );
          }

          if (targetAdmin.email.toLowerCase() === 'marzhendogalangs@gmail.com') {
            return NextResponse.json(
              { error: 'Akun Superadmin utama tidak dapat dihapus.' },
              { status: 400 }
            );
          }

          const { error: delErr } = await adminSupabase
            .from('admin_users')
            .delete()
            .eq('id', targetAdmin.id);

          if (delErr) {
            console.error('[ManageAdminsRoute] Supabase delete error:', delErr);
            return NextResponse.json(
              { error: `Gagal mencabut akses di basis data: ${delErr.message}` },
              { status: 400 }
            );
          }

          await recordAuditLog({
            actorEmail: session?.email || 'superadmin@system',
            actorName: session?.name || 'Superadmin',
            actorRole: session?.role || 'super_admin',
            action: 'ADMIN_REVOKE',
            description: `Mencabut akses administrator: ${targetAdmin.email} [Peran: ${targetAdmin.role}].`,
            ipAddress: ip,
            details: {
              admin_id: targetAdmin.id,
              admin_email: targetAdmin.email,
              admin_role: targetAdmin.role,
            },
          });

          deleteAdminUser(targetAdmin.email);

          return NextResponse.json({
            success: true,
            message: `Akses administrator untuk ${targetAdmin.email} berhasil dicabut dari database.`,
          });
        }
      } catch (err) {
        console.warn('[ManageAdminsRoute] Supabase error in DELETE:', err);
      }
    }

    const allAdmins = getAllAdminUsers();
    const target = allAdmins.find((a) => a.id === id || a.email.toLowerCase() === id.toLowerCase());

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

    await recordAuditLog({
      actorEmail: session?.email || 'superadmin@system',
      actorName: session?.name || 'Superadmin',
      actorRole: session?.role || 'super_admin',
      action: 'ADMIN_REVOKE',
      description: `Mencabut akses administrator: ${target?.name} (${target?.email}) [Peran: ${target?.role}] (Dev Mode).`,
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
