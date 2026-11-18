import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { importVotersBatch } from '@/lib/dpt/store';

const dptImportRowSchema = z.object({
  nim: z.string().min(4).max(20).regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email().refine((val) => {
    const lower = val.toLowerCase();
    return lower.endsWith('telkomuniversity.ac.id') || lower.endsWith('@gmail.com');
  }),
  name: z.string().min(2).max(150),
  generation: z.coerce.number().int().min(2018).max(2030),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session, 'manage_dpt');

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  // Auditor dilarang keras memutasi DPT
  if (authCheck.effectiveRole === 'auditor') {
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

    if (isSupabaseConfigured()) {
      try {
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

        // Sinkronisasi data ke dev store agar dev fallback tetap mutakhir
        try {
          importVotersBatch(validatedRecords);
        } catch (devSyncErr) {
          console.warn('[DptImportRoute] Failed to sync dev store:', devSyncErr);
        }

        // 3. Catat ke Audit Log
        await recordAuditLog({
          actorEmail: session?.email || 'admin@pemira.local',
          actorName: session?.name || 'Panitia KPR',
          actorRole: session?.role || 'kpr_admin',
          action: 'DPT_BATCH_IMPORT',
          description: `Mengimpor ${insertedCount} pemilih baru ke dalam DPT.`,
          ipAddress: clientIp,
          details: {
            total_imported: insertedCount,
            cohorts_included: Array.from(new Set(validatedRecords.map((r) => r.generation))),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Berhasil mengimpor ${insertedCount} pemilih baru ke dalam Daftar Pemilih Tetap (DPT).`,
          totalImported: insertedCount,
          importedCount: insertedCount,
        });
      } catch (dbErr) {
        console.warn('[DptImportRoute] Supabase offline, using dev store fallback:', dbErr);
      }
    }

    // Dev store fallback
    const result = importVotersBatch(validatedRecords);
    const clientIp = getClientIp(request);
    await recordAuditLog({
      actorEmail: session?.email || 'admin@pemira.local',
      actorName: session?.name || 'Panitia KPR',
      actorRole: session?.role || 'kpr_admin',
      action: 'DPT_BATCH_IMPORT',
      description: `Mengimpor ${result.insertedCount} pemilih baru ke dalam DPT (Mode Dev).`,
      ipAddress: clientIp,
      details: {
        total_imported: result.insertedCount,
        cohorts_included: Array.from(new Set(validatedRecords.map((r) => r.generation))),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${result.insertedCount} pemilih baru ke dalam Daftar Pemilih Tetap (DPT) (Mode Dev).`,
      totalImported: result.insertedCount,
      importedCount: result.insertedCount,
    });
  } catch (error) {
    console.error('[DptImportRoute] Unexpected error during DPT import:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses komit DPT.' },
      { status: 500 }
    );
  }
}
