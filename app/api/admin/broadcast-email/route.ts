import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { smtpMailService } from '@/lib/mail/smtp-service';
import { getAllVoters, setVoterPasswordHash } from '@/lib/dpt/store';
import { generateVoterPassword, hashVoterPassword } from '@/lib/auth/password-service';
import { isDevFallbackAllowed } from '@/lib/security/env';

export const dynamic = 'force-dynamic';

const broadcastRequestSchema = z.object({
  targetGroup: z.enum(['all', 'not_voted', 'voted']),
  generation: z.string().default('all'),
  template: z.enum(['credentials', 'reminder', 'invitation', 'custom']).default('reminder'),
  includeCredentials: z.boolean().default(false),
  subject: z.string().min(5, 'Subjek wajib minimal 5 karakter.'),
  headline: z.string().min(5, 'Judul pengumuman wajib minimal 5 karakter.'),
  bodyText: z.string().min(10, 'Isi pesan pengumuman wajib minimal 10 karakter.'),
  ctaText: z.string().default('Masuk ke Bilik Suara Digital'),
  ctaUrl: z.string().default('/login'),
});

/**
 * GET: Mengambil ringkasan jumlah calon penerima broadcast berdasarkan filter
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { searchParams } = new URL(request.url);
  const targetGroup = searchParams.get('targetGroup') || 'all';
  const generation = searchParams.get('generation') || 'all';

  if (isSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();
      let query = adminSupabase.from('voters_whitelist').select('nim, name, email, generation, has_voted');

      if (targetGroup === 'not_voted') query = query.eq('has_voted', false);
      if (targetGroup === 'voted') query = query.eq('has_voted', true);
      if (generation !== 'all') {
        const parsedGen = Number(generation);
        if (!Number.isInteger(parsedGen) || parsedGen < 2000 || parsedGen > 2100) {
          return NextResponse.json({ error: 'Parameter angkatan tidak valid.' }, { status: 400 });
        }
        query = query.eq('generation', parsedGen);
      }

      const { data: voters, error } = await query;
      if (!error && voters) {
        return NextResponse.json({
          success: true,
          count: voters.length,
          previewRecipients: voters.slice(0, 5).map((v) => ({
            nim: v.nim,
            name: v.name,
            email: v.email,
            generation: v.generation,
            has_voted: v.has_voted,
          })),
        });
      }
      console.error('[BroadcastEmailRoute] Supabase query error:', error?.message);
    } catch (err) {
      console.error('[BroadcastEmailRoute] Supabase query exception:', err);
    }
    return NextResponse.json(
      { error: 'Gagal memuat jumlah target penerima dari basis data.' },
      { status: 500 }
    );
  }

  if (!isDevFallbackAllowed(false)) {
    return NextResponse.json(
      { error: 'Basis data DPT tidak tersedia pada mode produksi.' },
      { status: 500 }
    );
  }

  // Dev store filter
  let filtered = getAllVoters();
  if (targetGroup === 'not_voted') filtered = filtered.filter((v) => !v.has_voted);
  if (targetGroup === 'voted') filtered = filtered.filter((v) => v.has_voted);
  if (generation !== 'all') filtered = filtered.filter((v) => v.generation.toString() === generation);

  return NextResponse.json({
    success: true,
    count: filtered.length,
    previewRecipients: filtered.slice(0, 5).map((v) => ({
      nim: v.nim,
      name: v.name,
      email: v.email,
      generation: v.generation,
      has_voted: v.has_voted,
    })),
  });
}

/**
 * POST: Menjalankan eksekusi pengiriman email massal / broadcast
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  const authCheck = await verifyActiveAdminAccess(session, 'manage_dpt');

  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // Auditor bersifat read-only mutlak
  if (authCheck.effectiveRole === 'auditor') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Peran Auditor hanya memiliki hak baca (read-only).' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = broadcastRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data formulir tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      targetGroup,
      generation,
      template,
      includeCredentials,
      subject,
      headline,
      bodyText,
      ctaText,
      ctaUrl,
    } = parsed.data;

    const isCredentialsMode = includeCredentials || template === 'credentials';

    // Ambil daftar penerima
    let recipients: Array<{ nim: string; name: string; email: string }> = [];

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();
      let query = adminSupabase.from('voters_whitelist').select('nim, name, email');

      if (targetGroup === 'not_voted') query = query.eq('has_voted', false);
      if (targetGroup === 'voted') query = query.eq('has_voted', true);
      if (generation !== 'all') {
        const parsedGen = Number(generation);
        if (!Number.isInteger(parsedGen) || parsedGen < 2000 || parsedGen > 2100) {
          return NextResponse.json({ error: 'Parameter angkatan tidak valid.' }, { status: 400 });
        }
        query = query.eq('generation', parsedGen);
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: 'Gagal mengambil data penerima DPT dari basis data.' }, { status: 500 });
      }
      recipients = data || [];
    } else {
      if (!isDevFallbackAllowed(false)) {
        return NextResponse.json({ error: 'Basis data DPT tidak tersedia pada mode produksi.' }, { status: 500 });
      }
      let filtered = getAllVoters();
      if (targetGroup === 'not_voted') filtered = filtered.filter((v) => !v.has_voted);
      if (targetGroup === 'voted') filtered = filtered.filter((v) => v.has_voted);
      if (generation !== 'all') filtered = filtered.filter((v) => v.generation.toString() === generation);
      recipients = filtered;
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ditemukan pemilih yang sesuai dengan kriteria filter yang dipilih.' },
        { status: 400 }
      );
    }

    // Jalankan pengiriman dengan concurrent batching aman (anti-spam throttling)
    // CHUNK_SIZE = 5 menjaga efisiensi throughput tanpa membebani connection pool SMTP
    const CHUNK_SIZE = 5;
    let sentCount = 0;
    let failedCount = 0;
    let isUsingLegacyCols = false;

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map(async (voter) => {
          if (isCredentialsMode) {
            const { rawPassword, formattedPassword } = generateVoterPassword();
            const passwordHash = hashVoterPassword(rawPassword);
            const nowIso = new Date().toISOString();

            if (isSupabaseConfigured()) {
              const adminSupabase = createAdminClient();
              if (isUsingLegacyCols) {
                await adminSupabase
                  .from('voters_whitelist')
                  .update({
                    otp_hash: passwordHash,
                    otp_last_sent_at: nowIso,
                    otp_attempts: 0,
                  })
                  .eq('nim', voter.nim);
              } else {
                const { error: updateError } = await adminSupabase
                  .from('voters_whitelist')
                  .update({
                    password_hash: passwordHash,
                    password_created_at: nowIso,
                    login_attempts: 0,
                    locked_until: null,
                  })
                  .eq('nim', voter.nim);

                if (updateError && (updateError.code === '42703' || updateError.message?.includes('does not exist'))) {
                  isUsingLegacyCols = true;
                  await adminSupabase
                    .from('voters_whitelist')
                    .update({
                      otp_hash: passwordHash,
                      otp_last_sent_at: nowIso,
                      otp_attempts: 0,
                    })
                    .eq('nim', voter.nim);
                }
              }
            } else {
              setVoterPasswordHash(voter.nim, passwordHash);
            }

            return smtpMailService
              .sendVoterPassword({
                to: voter.email,
                voterName: voter.name,
                nim: voter.nim,
                password: formattedPassword,
                loginUrl: ctaUrl || '/login',
                subject,
                headline,
                bodyText,
              })
              .catch(() => ({ success: false }));
          } else {
            return smtpMailService
              .sendBroadcastEmail({
                to: voter.email,
                voterName: voter.name,
                nim: voter.nim,
                subject,
                headline,
                bodyText,
                ctaText,
                ctaUrl,
              })
              .catch(() => ({ success: false }));
          }
        })
      );

      for (const res of results) {
        if (res.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }
    }

    // Catat ke Audit Log & Audit Trail
    const clientIp = getClientIp(request);
    await recordAuditLog({
      actorEmail: session?.email || 'admin@pemira.local',
      actorName: session?.name || 'Panitia KPR',
      actorRole: session?.role || 'kpr_admin',
      action: 'BROADCAST_EMAIL_SENT',
      description: `Mengirim broadcast email "${subject}" ke target ${targetGroup} (Angkatan: ${generation}, sandi disertakan: ${isCredentialsMode}, ${sentCount} terkirim, ${failedCount} gagal).`,
      ipAddress: clientIp,
      details: {
        targetGroup,
        generation,
        template,
        isCredentialsMode,
        totalTarget: recipients.length,
        sentCount,
        failedCount,
        subject,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast email selesai diproses. ${sentCount} berhasil, ${failedCount} gagal dari total ${recipients.length} target.`,
      stats: {
        totalTarget: recipients.length,
        sentCount,
        failedCount,
      },
    });
  } catch (error) {
    console.error('[BroadcastEmailRoute] Error sending broadcast:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses pengiriman email massal.' },
      { status: 500 }
    );
  }
}
