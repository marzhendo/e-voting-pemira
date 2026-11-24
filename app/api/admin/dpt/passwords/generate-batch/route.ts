import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { generateVoterPassword, hashVoterPassword } from '@/lib/auth/password-service';
import { getAllVoters, setVoterPasswordHash } from '@/lib/dpt/store';
import { isDevFallbackAllowed } from '@/lib/security/env';

export const dynamic = 'force-dynamic';

const batchGenerateSchema = z.object({
  generation: z.string().default('all'),
  overwriteExisting: z.boolean().default(false),
});

/**
 * POST /api/admin/dpt/passwords/generate-batch
 * Menghasilkan kata sandi pemilih unik (CSPRNG) secara massal untuk pemilih di DPT.
 * Hanya dapat dipicu oleh Panitia KPR / Superadmin yang terotentikasi.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const authCheck = await verifyActiveAdminAccess(session);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = batchGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Parameter permintaan tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { generation, overwriteExisting } = parsed.data;
    const clientIp = getClientIp(request.headers);
    const nowIso = new Date().toISOString();

    let generatedCount = 0;
    let skippedCount = 0;
    let totalEligible = 0;

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();
      let query = adminSupabase
        .from('voters_whitelist')
        .select('id, nim, name, email, generation, password_hash');

      if (generation !== 'all') {
        const parsedGen = Number(generation);
        if (!Number.isInteger(parsedGen) || parsedGen < 2000 || parsedGen > 2100) {
          return NextResponse.json({ error: 'Parameter angkatan tidak valid.' }, { status: 400 });
        }
        query = query.eq('generation', parsedGen);
      }

      const { data: voters, error: queryError } = await query;

      if (queryError || !voters) {
        console.error('[BatchPassword] Supabase query error:', queryError);
        return NextResponse.json(
          { success: false, error: 'Gagal mengambil data pemilih dari basis data.' },
          { status: 500 }
        );
      }

      totalEligible = voters.length;

      // Filter yang perlu digenerate
      const targets = voters.filter((v) => overwriteExisting || !v.password_hash);
      skippedCount = totalEligible - targets.length;

      // Generate & update secara batch
      for (const voter of targets) {
        const { rawPassword } = generateVoterPassword();
        const passwordHash = hashVoterPassword(rawPassword);

        const { error: updateError } = await adminSupabase
          .from('voters_whitelist')
          .update({
            password_hash: passwordHash,
            password_created_at: nowIso,
            login_attempts: 0,
            locked_until: null,
          })
          .eq('id', voter.id);

        if (!updateError) {
          generatedCount++;
        } else {
          console.error(`[BatchPassword] Error updating voter ${voter.nim}:`, updateError);
        }
      }
    } else {
      // Dev In-Memory Fallback
      if (!isDevFallbackAllowed(false)) {
        return NextResponse.json(
          { success: false, error: 'Basis data tidak tersedia pada lingkungan produksi.' },
          { status: 500 }
        );
      }

      const all = getAllVoters();
      let targets = all;

      if (generation !== 'all') {
        const parsedGen = Number(generation);
        targets = all.filter((v) => v.generation === parsedGen);
      }

      totalEligible = targets.length;

      for (const voter of targets) {
        if (!overwriteExisting && voter.password_hash) {
          skippedCount++;
          continue;
        }

        const { rawPassword } = generateVoterPassword();
        const passwordHash = hashVoterPassword(rawPassword);

        setVoterPasswordHash(voter.nim, passwordHash);
        generatedCount++;
      }
    }

    // Catat log audit
    await recordAuditLog({
      actorEmail: session?.email || 'admin@kpr.hmif',
      actorName: session?.name || 'Panitia KPR',
      actorRole: session?.role || 'admin',
      action: 'VOTER_PASSWORD_BATCH_GENERATION',
      description: `Menghasilkan kata sandi pemilih unik untuk ${generatedCount} pemilih (Angkatan: ${generation}, overwrite: ${overwriteExisting}).`,
      ipAddress: clientIp,
      details: {
        generation,
        overwriteExisting,
        generatedCount,
        skippedCount,
        totalEligible,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghasilkan kata sandi untuk ${generatedCount} pemilih.`,
      generatedCount,
      skippedCount,
      totalEligible,
      generation,
    });
  } catch (error) {
    console.error('[BatchPassword] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kegagalan server saat menghasilkan kata sandi.' },
      { status: 500 }
    );
  }
}
