import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { verifyActiveAdminAccess } from '@/lib/rbac/active-admin';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/auth/client-ip';
import { recordAuditLog } from '@/lib/audit/store';
import { generateVoterPassword, hashVoterPassword } from '@/lib/auth/password-service';
import { smtpMailService } from '@/lib/mail/smtp-service';
import { findVoterByIdentifier, setVoterPasswordHash } from '@/lib/dpt/store';
import { isDevFallbackAllowed } from '@/lib/security/env';

export const dynamic = 'force-dynamic';

const resendSingleSchema = z.object({
  nim: z.string().trim().min(4, 'NIM pemilih wajib diisi.').max(50),
});

/**
 * POST /api/admin/dpt/passwords/resend-single
 * Mereset dan mengirim ulang kata sandi unik untuk seorang pemilih ke email resminya.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const authCheck = await verifyActiveAdminAccess(session);

    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = resendSingleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Format NIM tidak valid.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const cleanNim = parsed.data.nim.trim().toLowerCase();
    const clientIp = getClientIp(request.headers);
    const nowIso = new Date().toISOString();

    let targetVoter: {
      id: string;
      nim: string;
      name: string;
      email: string;
    } | null = null;

    if (isSupabaseConfigured()) {
      const adminSupabase = createAdminClient();
      const { data: voter, error: fetchError } = await adminSupabase
        .from('voters_whitelist')
        .select('id, nim, name, email')
        .or(`nim.ilike.${cleanNim},email.ilike.${cleanNim}`)
        .maybeSingle();

      if (fetchError || !voter) {
        return NextResponse.json(
          { success: false, error: 'Pemilih dengan NIM tersebut tidak ditemukan di DPT.' },
          { status: 404 }
        );
      }

      targetVoter = voter;

      // Generate password baru
      const { rawPassword, formattedPassword } = generateVoterPassword();
      const passwordHash = hashVoterPassword(rawPassword);

      let { error: updateError } = await adminSupabase
        .from('voters_whitelist')
        .update({
          password_hash: passwordHash,
          password_created_at: nowIso,
          login_attempts: 0,
          locked_until: null,
        })
        .eq('id', voter.id);

      if (updateError && (updateError.code === '42703' || updateError.message?.includes('does not exist'))) {
        const legacyUpdate = await adminSupabase
          .from('voters_whitelist')
          .update({
            otp_hash: passwordHash,
            otp_last_sent_at: nowIso,
            otp_attempts: 0,
          })
          .eq('id', voter.id);
        updateError = legacyUpdate.error;
      }

      if (updateError) {
        console.error('[ResendPassword] Supabase update error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Gagal memperbarui kata sandi di basis data.' },
          { status: 500 }
        );
      }

      // Kirim via SMTP
      const mailResult = await smtpMailService.sendVoterPassword({
        to: voter.email,
        voterName: voter.name,
        nim: voter.nim,
        password: formattedPassword,
        loginUrl: '/login',
      });

      if (!mailResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: mailResult.error || 'Kata sandi berhasil direset tetapi gagal dikirim via email.',
          },
          { status: 502 }
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

      const voter = findVoterByIdentifier(cleanNim);
      if (!voter) {
        return NextResponse.json(
          { success: false, error: 'Pemilih tidak ditemukan di data lokal.' },
          { status: 404 }
        );
      }

      targetVoter = {
        id: voter.id,
        nim: voter.nim,
        name: voter.name,
        email: voter.email,
      };

      const { rawPassword, formattedPassword } = generateVoterPassword();
      const passwordHash = hashVoterPassword(rawPassword);

      setVoterPasswordHash(voter.nim, passwordHash);

      await smtpMailService.sendVoterPassword({
        to: voter.email,
        voterName: voter.name,
        nim: voter.nim,
        password: formattedPassword,
        loginUrl: '/login',
      });
    }

    // Catat log audit
    await recordAuditLog({
      actorEmail: session?.email || 'admin@kpr.hmif',
      actorName: session?.name || 'Panitia KPR',
      actorRole: session?.role || 'admin',
      action: 'VOTER_PASSWORD_RESET',
      description: `Mereset dan mengirim ulang kata sandi pemilih untuk NIM ${targetVoter.nim} (${targetVoter.name}) ke ${targetVoter.email}.`,
      ipAddress: clientIp,
      details: {
        voterId: targetVoter.id,
        nim: targetVoter.nim,
        email: targetVoter.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Kata sandi pemilih untuk NIM ${targetVoter.nim} berhasil direset dan dikirimkan ke email resmi (${targetVoter.email}).`,
      nim: targetVoter.nim,
      name: targetVoter.name,
      email: targetVoter.email,
    });
  } catch (error) {
    console.error('[ResendPassword] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kegagalan server saat mereset kata sandi.' },
      { status: 500 }
    );
  }
}
