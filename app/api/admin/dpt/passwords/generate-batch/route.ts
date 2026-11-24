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

const CHUNK_SIZE = 25;

/**
 * GET /api/admin/dpt/passwords/generate-batch
 * Mengambil ringkasan statistik status kata sandi pemilih per angkatan.
 * Membantu admin memilih angkatan spesifik untuk diterbitkan secara bertahap.
 */
export async function GET() {
  try {
    const session = await getSession();
    const authCheck = await verifyActiveAdminAccess(session);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();
      let isUsingLegacyCols = false;
      let allRows: Array<{ generation: number | null; password_hash?: string | null; otp_hash?: string | null }> = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await adminSupabase
          .from('voters_whitelist')
          .select('generation, password_hash')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          if (error.code === '42703' || error.message?.includes('does not exist')) {
            isUsingLegacyCols = true;
            break;
          }
          console.error('[BatchPassword GET] Query error:', error);
          return NextResponse.json(
            { success: false, error: 'Gagal mengambil statistik dari basis data.' },
            { status: 500 }
          );
        }

        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < pageSize) break;
        page++;
      }

      if (isUsingLegacyCols) {
        allRows = [];
        page = 0;
        while (true) {
          const { data, error } = await adminSupabase
            .from('voters_whitelist')
            .select('generation, otp_hash')
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) {
            console.error('[BatchPassword GET legacy] Query error:', error);
            return NextResponse.json(
              { success: false, error: 'Gagal mengambil statistik dari basis data.' },
              { status: 500 }
            );
          }

          if (!data || data.length === 0) break;
          allRows.push(
            ...data.map((r) => ({
              generation: r.generation,
              password_hash: r.otp_hash,
            }))
          );
          if (data.length < pageSize) break;
          page++;
        }
      }

      const byGenMap: Record<number, { total: number; hasPassword: number; pending: number }> = {};
      let totalVoters = 0;
      let totalHasPassword = 0;

      for (const row of allRows) {
        const gen = row.generation || 0;
        if (!byGenMap[gen]) {
          byGenMap[gen] = { total: 0, hasPassword: 0, pending: 0 };
        }
        byGenMap[gen].total++;
        totalVoters++;

        if (row.password_hash) {
          byGenMap[gen].hasPassword++;
          totalHasPassword++;
        } else {
          byGenMap[gen].pending++;
        }
      }

      const byGeneration = Object.entries(byGenMap)
        .map(([genStr, stats]) => ({
          generation: Number(genStr),
          ...stats,
        }))
        .filter((g) => g.generation > 0)
        .sort((a, b) => b.generation - a.generation);

      return NextResponse.json({
        success: true,
        summary: {
          total: totalVoters,
          hasPassword: totalHasPassword,
          pending: totalVoters - totalHasPassword,
        },
        byGeneration,
      });
    }

    // Dev In-Memory Fallback
    if (!isDevFallbackAllowed(false)) {
      return NextResponse.json(
        { success: false, error: 'Basis data tidak tersedia pada lingkungan produksi.' },
        { status: 500 }
      );
    }

    const all = getAllVoters();
    const byGenMap: Record<number, { total: number; hasPassword: number; pending: number }> = {};
    let totalVoters = 0;
    let totalHasPassword = 0;

    for (const v of all) {
      const gen = v.generation || 0;
      if (!byGenMap[gen]) {
        byGenMap[gen] = { total: 0, hasPassword: 0, pending: 0 };
      }
      byGenMap[gen].total++;
      totalVoters++;

      if (v.password_hash) {
        byGenMap[gen].hasPassword++;
        totalHasPassword++;
      } else {
        byGenMap[gen].pending++;
      }
    }

    const byGeneration = Object.entries(byGenMap)
      .map(([genStr, stats]) => ({
        generation: Number(genStr),
        ...stats,
      }))
      .filter((g) => g.generation > 0)
      .sort((a, b) => b.generation - a.generation);

    return NextResponse.json({
      success: true,
      summary: {
        total: totalVoters,
        hasPassword: totalHasPassword,
        pending: totalVoters - totalHasPassword,
      },
      byGeneration,
    });
  } catch (error) {
    console.error('[BatchPassword GET] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kegagalan server saat memuat statistik kata sandi.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dpt/passwords/generate-batch
 * Menghasilkan kata sandi pemilih unik (CSPRNG) secara massal untuk pemilih di DPT.
 * Mendukung filter spesifik per angkatan dan dieksekusi secara konkurensi (chunks)
 * untuk menghindari timeout serverless / network error.
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
      let isUsingLegacyCols = false;
      const voters: Array<{
        id: string;
        nim: string;
        name: string;
        email: string;
        generation: number;
        password_hash?: string | null;
        otp_hash?: string | null;
      }> = [];

      let parsedGenNumber: number | null = null;
      if (generation !== 'all') {
        parsedGenNumber = Number(generation);
        if (!Number.isInteger(parsedGenNumber) || parsedGenNumber < 2000 || parsedGenNumber > 2100) {
          return NextResponse.json({ error: 'Parameter angkatan tidak valid.' }, { status: 400 });
        }
      }

      // Ambil pemilih dengan paging agar mendukung ribuan pemilih tanpa limit default 1000
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let q = adminSupabase
          .from('voters_whitelist')
          .select('id, nim, name, email, generation, password_hash')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (parsedGenNumber !== null) {
          q = q.eq('generation', parsedGenNumber);
        }

        const { data, error } = await q;

        if (error) {
          if (error.code === '42703' || error.message?.includes('does not exist')) {
            isUsingLegacyCols = true;
            break;
          }
          console.error('[BatchPassword] Supabase query error:', error);
          return NextResponse.json(
            { success: false, error: 'Gagal mengambil data pemilih dari basis data.' },
            { status: 500 }
          );
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        voters.push(...data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      if (isUsingLegacyCols) {
        voters.length = 0;
        page = 0;
        hasMore = true;

        while (hasMore) {
          let legacyQ = adminSupabase
            .from('voters_whitelist')
            .select('id, nim, name, email, generation, otp_hash')
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (parsedGenNumber !== null) {
            legacyQ = legacyQ.eq('generation', parsedGenNumber);
          }

          const { data, error } = await legacyQ;

          if (error) {
            console.error('[BatchPassword legacy] Supabase query error:', error);
            return NextResponse.json(
              { success: false, error: 'Gagal mengambil data pemilih dari basis data.' },
              { status: 500 }
            );
          }

          if (!data || data.length === 0) {
            hasMore = false;
            break;
          }

          voters.push(
            ...data.map((v) => ({
              ...v,
              password_hash: v.otp_hash,
            }))
          );

          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      totalEligible = voters.length;

      // Filter pemilih yang perlu dibuatkan sandi
      const targets = voters.filter((v) => overwriteExisting || !v.password_hash);
      skippedCount = totalEligible - targets.length;

      // Eksekusi pembaruan dalam chunk paralel (CHUNK_SIZE = 25)
      // Meningkatkan kecepatan ~15x dan mencegah 504 Gateway Timeout pada serverless
      for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
        const chunk = targets.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(async (voter) => {
            const { rawPassword } = generateVoterPassword();
            const passwordHash = hashVoterPassword(rawPassword);

            if (isUsingLegacyCols) {
              const { error: updateError } = await adminSupabase
                .from('voters_whitelist')
                .update({
                  otp_hash: passwordHash,
                  otp_last_sent_at: nowIso,
                  otp_attempts: 0,
                })
                .eq('id', voter.id);

              if (!updateError) {
                generatedCount++;
              } else {
                console.error(`[BatchPassword] Error updating voter ${voter.nim}:`, updateError);
              }
            } else {
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
          })
        );
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

    const genLabel = generation === 'all' ? 'Semua Angkatan' : `Angkatan ${generation}`;

    // Catat log audit
    await recordAuditLog({
      actorEmail: session?.email || 'admin@kpr.hmif',
      actorName: session?.name || 'Panitia KPR',
      actorRole: session?.role || 'admin',
      action: 'VOTER_PASSWORD_BATCH_GENERATION',
      description: `Menghasilkan kata sandi pemilih unik untuk ${generatedCount} pemilih (${genLabel}, overwrite: ${overwriteExisting}).`,
      ipAddress: clientIp,
      details: {
        generation,
        genLabel,
        overwriteExisting,
        generatedCount,
        skippedCount,
        totalEligible,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menerbitkan kata sandi untuk ${generatedCount} pemilih (${genLabel}).`,
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
