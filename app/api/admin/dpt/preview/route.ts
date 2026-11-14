import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getAllVoters } from '@/lib/dpt/store';

const dptRowSchema = z.object({
  nim: z.string().min(4).max(20).regex(/^[a-zA-Z0-9]+$/, 'NIM hanya boleh berisi karakter alfanumerik'),
  email: z.string().email('Format email tidak valid').refine((val) => {
    const lower = val.toLowerCase();
    return lower.endsWith('telkomuniversity.ac.id') || lower.endsWith('@gmail.com');
  }, {
    message: 'Email harus menggunakan domain resmi @student.telkomuniversity.ac.id atau email terverifikasi',
  }),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(150),
  generation: z.coerce.number().int().min(2018).max(2030),
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

  try {
    const body = await request.json();
    const rows = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Format berkas tidak valid: data baris DPT tidak ditemukan.' },
        { status: 400 }
      );
    }

    if (rows.length > 5000) {
      return NextResponse.json(
        { error: 'Ukuran batch melebihi batas maksimum 5000 baris per unggahan.' },
        { status: 400 }
      );
    }

    const validRows: Array<z.infer<typeof dptRowSchema>> = [];
    const invalidRows: Array<{ rowNumber: number; reason: string }> = [];
    const seenNims = new Set<string>();
    const seenEmails = new Set<string>();
    const inFileDataDuplicates: Array<{ rowNumber: number; nim: string; email: string }> = [];

    // 1. Validasi Schema & Duplikasi Lokal dalam Berkas
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const parsed = dptRowSchema.safeParse(rows[i]);

      if (!parsed.success) {
        const errorMsg = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        invalidRows.push({ rowNumber: rowNum, reason: errorMsg });
        continue;
      }

      const data = parsed.data;
      const normalizedNim = data.nim.trim();
      const normalizedEmail = data.email.trim().toLowerCase();

      if (seenNims.has(normalizedNim) || seenEmails.has(normalizedEmail)) {
        inFileDataDuplicates.push({ rowNumber: rowNum, nim: normalizedNim, email: normalizedEmail });
        invalidRows.push({ rowNumber: rowNum, reason: 'NIM atau Email duplikat di dalam berkas yang sama.' });
        continue;
      }

      seenNims.add(normalizedNim);
      seenEmails.add(normalizedEmail);
      validRows.push({
        ...data,
        nim: normalizedNim,
        email: normalizedEmail,
      });
    }

    // 2. Validasi Konflik dengan Data Eksisting di Database / Store
    let existingNims = new Set<string>();
    let existingEmails = new Set<string>();

    if (isSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();
        const { data: existingVoters } = await adminSupabase
          .from('voters_whitelist')
          .select('nim, email');

        if (existingVoters) {
          existingNims = new Set(existingVoters.map((v) => v.nim));
          existingEmails = new Set(existingVoters.map((v) => v.email.toLowerCase()));
        }
      } catch (err) {
        console.warn('[DptPreviewRoute] Supabase offline, using dev store:', err);
        const devVoters = getAllVoters();
        existingNims = new Set(devVoters.map((v) => v.nim));
        existingEmails = new Set(devVoters.map((v) => v.email.toLowerCase()));
      }
    } else {
      const devVoters = getAllVoters();
      existingNims = new Set(devVoters.map((v) => v.nim));
      existingEmails = new Set(devVoters.map((v) => v.email.toLowerCase()));
    }

    const dbConflicts: Array<{ nim: string; email: string; conflictType: 'NIM' | 'EMAIL' | 'BOTH' }> = [];
    const nonConflictingValidRows: Array<z.infer<typeof dptRowSchema>> = [];

    for (const row of validRows) {
      const hasNim = existingNims.has(row.nim);
      const hasEmail = existingEmails.has(row.email);

      if (hasNim && hasEmail) {
        dbConflicts.push({ nim: row.nim, email: row.email, conflictType: 'BOTH' });
      } else if (hasNim) {
        dbConflicts.push({ nim: row.nim, email: row.email, conflictType: 'NIM' });
      } else if (hasEmail) {
        dbConflicts.push({ nim: row.nim, email: row.email, conflictType: 'EMAIL' });
      } else {
        nonConflictingValidRows.push(row);
      }
    }

    const totalDuplicates = inFileDataDuplicates.length + dbConflicts.length;
    const canImport = nonConflictingValidRows.length > 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        totalRowsRead: rows.length,
        validCount: nonConflictingValidRows.length,
        validRowsCount: nonConflictingValidRows.length,
        duplicateCount: totalDuplicates,
        inFileDataDuplicatesCount: inFileDataDuplicates.length,
        databaseConflictsCount: dbConflicts.length,
        invalidCount: invalidRows.length,
        invalidRowsCount: invalidRows.length,
        canImport,
      },
      validRows: nonConflictingValidRows,
      invalidRows: invalidRows.slice(0, 50),
      dbConflicts: dbConflicts.slice(0, 50),
      previewSample: nonConflictingValidRows.slice(0, 10),
    });
  } catch (error) {
    console.error('[DptPreviewRoute] Error parsing DPT preview:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses preview DPT.' },
      { status: 500 }
    );
  }
}
