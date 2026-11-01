import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';

const dptImportRowSchema = z.object({
  nim: z.string().min(5).max(15).regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email().refine((val) => val.toLowerCase().endsWith('telkomuniversity.ac.id')),
  name: z.string().min(2).max(150),
  generation: z.number().int().min(2020).max(2027),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session, 'manage_dpt');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  // Auditor dilarang keras memutasi DPT
  if (session?.role === 'auditor') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Peran Auditor hanya memiliki hak baca (read-only).' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const rows = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Data DPT yang dikirimkan kosong atau tidak berformat array.' },
        { status: 400 }
      );
    }

    // 1. Validasi All-or-Nothing
    const validatedRecords: Array<{
      nim: string;
      email: string;
      name: string;
      generation: number;
    }> = [];

    const seenNims = new Set<string>();
    const seenEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const parsed = dptImportRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: `Validasi gagal pada baris ${i + 1}: ${parsed.error.errors[0]?.message}`,
            code: 'VALIDATION_FAILED',
          },
          { status: 400 }
        );
      }

      const row = parsed.data;
      const normalizedNim = row.nim.trim();
      const normalizedEmail = row.email.trim().toLowerCase();

      if (seenNims.has(normalizedNim) || seenEmails.has(normalizedEmail)) {
        return NextResponse.json(
          {
            error: `Duplikasi terdeteksi pada baris ${i + 1} (NIM/Email sudah ada dalam antrean impor).`,
            code: 'DUPLICATE_IN_FILE',
          },
          { status: 400 }
        );
      }

      seenNims.add(normalizedNim);
      seenEmails.add(normalizedEmail);
      validatedRecords.push({
        nim: normalizedNim,
        email: normalizedEmail,
        name: row.name.trim(),
        generation: row.generation,
      });
    }

    const adminSupabase = createAdminClient();
    const clientIp = getClientIp(request.headers);

    // 2. Insert batch ke tabel voters_whitelist
    const { data: insertedData, error: insertError } = await adminSupabase
      .from('voters_whitelist')
      .insert(validatedRecords)
      .select('id');

    if (insertError) {
      console.error('[DptImportRoute] Database insert error:', insertError);
      return NextResponse.json(
        {
          error: 'Gagal memasukkan data DPT ke database. Pastikan tidak ada NIM atau Email yang bertabrakan dengan data yang sudah terdaftar.',
          details: insertError.message,
        },
        { status: 409 }
      );
    }

    const insertedCount = insertedData ? insertedData.length : validatedRecords.length;

    // 3. Catat ke Audit Log
    await adminSupabase.from('audit_logs').insert({
      actor_email: session?.email || 'unknown_admin',
      action: 'IMPORT_DPT',
      details: {
        total_imported: insertedCount,
        cohorts_included: Array.from(new Set(validatedRecords.map((r) => r.generation))),
      },
      ip_address: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${insertedCount} pemilih baru ke dalam Daftar Pemilih Tetap (DPT).`,
      totalImported: insertedCount,
    });
  } catch (error) {
    console.error('[DptImportRoute] Unexpected error during DPT import:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses komit DPT.' },
      { status: 500 }
    );
  }
}
