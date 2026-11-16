import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { addSingleVoter } from '@/lib/dpt/store';

const quickAddSchema = z.object({
  nim: z.string().min(4, 'NIM minimal 4 karakter').max(20),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(150),
  email: z.string().email('Format email tidak valid'),
  generation: z.number().int().min(2015).max(2035).default(2023),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'manage_dpt');

  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await req.json();
    const parsed = quickAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data pemilih tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { nim, name, email, generation } = parsed.data;

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
          .from('voters_whitelist')
          .insert([
            {
              nim: nim.trim(),
              name: name.trim(),
              email: email.trim().toLowerCase(),
              generation,
              has_voted: false,
            },
          ])
          .select()
          .single();

        if (error) {
          return NextResponse.json(
            { error: `Gagal menyimpan ke database: ${error.message}` },
            { status: 409 }
          );
        }

        const ip = getClientIp(req);
        await recordAuditLog({
          actorEmail: session?.email || 'admin@pemira.local',
          actorName: session?.name || 'Panitia KPR',
          actorRole: session?.role || 'kpr_admin',
          action: 'DPT_QUICK_ADD',
          description: `Menambahkan pemilih mandiri baru ke DPT: ${name} (${nim}) - Angkatan ${generation}.`,
          ipAddress: ip,
          details: { nim, name, email, generation },
        });

        return NextResponse.json({
          success: true,
          message: `Pemilih ${name} (${nim}) berhasil ditambahkan ke DPT.`,
          voter: data,
        });
      } catch (err) {
        console.warn('[DptQuickAdd] Supabase offline, using dev store:', err);
      }
    }

    const res = addSingleVoter({
      nim: nim.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      generation,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const ip = getClientIp(req);
    await recordAuditLog({
      actorEmail: session?.email || 'admin@pemira.local',
      actorName: session?.name || 'Panitia KPR',
      actorRole: session?.role || 'kpr_admin',
      action: 'DPT_QUICK_ADD',
      description: `Menambahkan pemilih mandiri baru ke DPT: ${name} (${nim}) - Angkatan ${generation} (Dev Mode).`,
      ipAddress: ip,
      details: { nim, name, email, generation },
    });

    return NextResponse.json({
      success: true,
      message: `Pemilih ${name} (${nim}) berhasil ditambahkan ke DPT (Mode Dev).`,
      voter: res.voter,
    });
  } catch (err) {
    console.error('[DptQuickAdd] Exception:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan server.' }, { status: 500 });
  }
}
