import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailService, SendPinPayload, SendBroadcastPayload, SendVoterPasswordPayload, MailDeliveryResult } from './types';
import {
  generatePinEmailHtml,
  generatePinEmailText,
  generateBroadcastEmailHtml,
  generateBroadcastEmailText,
  generateVoterPasswordEmailHtml,
  generateVoterPasswordEmailText,
} from './template';

export class SmtpMailService implements MailService {
  private transporter: Transporter | null = null;

  private isConfigured(): boolean {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) return false;
    if (host.includes('example.com') || host.includes('your-smtp')) return false;

    return true;
  }

  private getTransporter(): Transporter | null {
    if (!this.isConfigured()) return null;
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST!;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER!;
    // Bersihkan spasi jika password disalin langsung dari Google App Password (misal: "xxxx yyyy zzzz aaaa")
    const pass = process.env.SMTP_PASS!.replace(/\s+/g, '');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    // Opsional: In-App DKIM Signing untuk memvalidasi tanda tangan kriptografi di Microsoft EOP
    const dkimConfig = process.env.DKIM_PRIVATE_KEY
      ? {
          domainName: process.env.DKIM_DOMAIN || process.env.SMTP_FROM_DOMAIN || 'pemirahmif.org',
          keySelector: process.env.DKIM_SELECTOR || 'default',
          privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      : undefined;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      dkim: dkimConfig,
    });

    return this.transporter;
  }

  private extractErrorMessage(err: unknown): string {
    if (!err) return 'Gagal mengirim email melalui SMTP.';

    // Tangani AggregateError di Node.js 18+ (kegagalan multi-IP / IPv6 & IPv4 timeout)
    if (typeof err === 'object' && 'errors' in err && Array.isArray((err as { errors: unknown[] }).errors)) {
      const subErrors = (err as { errors: unknown[] }).errors;
      const combined = subErrors
        .map((e) => (e instanceof Error ? e.message : String(e)))
        .filter(Boolean)
        .join(', ');
      if (combined) return combined;
    }

    if (err instanceof Error && err.message) {
      return err.message;
    }

    return 'Gagal mengirim email melalui SMTP.';
  }

  async sendLoginPin({ to, voterName, nim, pin }: SendPinPayload): Promise<MailDeliveryResult> {
    const transporter = this.getTransporter();

    // Fallback Dev / Offline mode jika SMTP sengaja tidak dikonfigurasi
    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`📧 [DEV EMAIL FALLBACK] Kode PIN Masuk Dikirim`);
      console.log(`Penerima  : ${to} (${voterName} - NIM: ${nim})`);
      console.log(`KODE PIN  : [ ${pin} ] (Berlaku 10 Menit)`);
      console.log(`Status    : SMTP tidak aktif / dev mode, PIN dicetak di console.`);
      console.log(`======================================================\n`);

      return {
        success: true,
        isDevFallback: true,
        messageId: `dev-fallback-${Date.now()}`,
      };
    }

    const domain = process.env.SMTP_FROM_DOMAIN || 'pemirahmif.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Panitia Pemira HMIF';
    const fromEmail = process.env.SMTP_FROM_EMAIL || `noreply@${domain}`;
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

    const html = generatePinEmailHtml({ voterName, nim, pin });
    const text = generatePinEmailText({ voterName, nim, pin });

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        replyTo,
        subject: `[PEMIRA HMIF] Kode Verifikasi Masuk: ${pin}`,
        text,
        html,
        headers: {
          'X-Entity-Ref-ID': `pemira-${nim}-${Date.now()}`,
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });

      return {
        success: true,
        isDevFallback: false,
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      const errorMsg = this.extractErrorMessage(err);
      console.error('[SmtpMailService] Gagal mengirim email via SMTP:', errorMsg);

      // Fail-Safe di Lingkungan Lokal / Development:
      // Jika port SMTP keluar (25/465/587) diblokir oleh ISP/firewall lokal,
      // cetak kode PIN ke konsol agar alur login developer/penguji tidak terputus.
      const isDevEnv = process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'development';
      if (isDevEnv) {
        console.warn(`\n⚠️  [DEV FAIL-SAFE] Koneksi SMTP gagal (${errorMsg}). Mengaktifkan fallback konsol dev.`);
        console.log(`======================================================`);
        console.log(`📧 [DEV EMAIL FAIL-SAFE] Kode PIN Masuk Mahasiswa`);
        console.log(`Penerima  : ${to} (${voterName} - NIM: ${nim})`);
        console.log(`KODE PIN  : [ ${pin} ] (Berlaku 10 Menit)`);
        console.log(`Catatan   : Port SMTP diblokir oleh jaringan lokal. PIN dicetak di console ini.`);
        console.log(`======================================================\n`);

        return {
          success: true,
          isDevFallback: true,
          messageId: `dev-failsafe-${Date.now()}`,
        };
      }

      return {
        success: false,
        isDevFallback: false,
        error: errorMsg,
      };
    }
  }

  async sendVoterPassword({
    to,
    voterName,
    nim,
    password,
    loginUrl,
  }: SendVoterPasswordPayload): Promise<MailDeliveryResult> {
    const transporter = this.getTransporter();

    // Fallback Dev / Offline mode jika SMTP tidak dikonfigurasi
    if (!transporter) {
      console.log(`\n======================================================`);
      console.log(`📧 [DEV EMAIL FALLBACK] Kata Sandi Pemilih Dikirim`);
      console.log(`Penerima  : ${to} (${voterName} - NIM: ${nim})`);
      console.log(`SANDI     : [ ${password} ]`);
      console.log(`Login URL : ${loginUrl || '/login'}`);
      console.log(`Status    : SMTP tidak aktif / dev mode, kata sandi dicetak di console.`);
      console.log(`======================================================\n`);

      return {
        success: true,
        isDevFallback: true,
        messageId: `dev-pwd-${Date.now()}-${nim}`,
      };
    }

    const domain = process.env.SMTP_FROM_DOMAIN || 'pemirahmif.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Panitia Pemira HMIF';
    const fromEmail = process.env.SMTP_FROM_EMAIL || `noreply@${domain}`;
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

    const html = generateVoterPasswordEmailHtml({ voterName, nim, password, loginUrl });
    const text = generateVoterPasswordEmailText({ voterName, nim, password, loginUrl });

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        replyTo,
        subject: `[PEMIRA HMIF] Kata Sandi Bilik Suara Pemilih: ${nim}`,
        text,
        html,
        headers: {
          'X-Entity-Ref-ID': `pemira-pwd-${nim}-${Date.now()}`,
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });

      return {
        success: true,
        isDevFallback: false,
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      const errorMsg = this.extractErrorMessage(err);
      console.error('[SmtpMailService] Gagal kirim kata sandi pemilih via SMTP:', errorMsg);

      const isDevEnv = process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'development';
      if (isDevEnv) {
        console.warn(`[DEV FAIL-SAFE] Kata sandi mail fallback untuk ${to} (NIM: ${nim}): ${errorMsg}`);
        console.log(`📧 [DEV EMAIL FALLBACK] KATA SANDI PEMILIH: [ ${password} ]`);
        return {
          success: true,
          isDevFallback: true,
          messageId: `dev-pwd-failsafe-${Date.now()}-${nim}`,
        };
      }

      return {
        success: false,
        isDevFallback: false,
        error: errorMsg,
      };
    }
  }

  async sendBroadcastEmail({
    to,
    voterName,
    nim,
    subject,
    headline,
    bodyText,
    ctaText,
    ctaUrl,
  }: SendBroadcastPayload): Promise<MailDeliveryResult> {
    const transporter = this.getTransporter();

    // Fallback Dev / Offline mode
    if (!transporter) {
      return {
        success: true,
        isDevFallback: true,
        messageId: `dev-broadcast-${Date.now()}-${nim}`,
      };
    }

    const domain = process.env.SMTP_FROM_DOMAIN || 'pemirahmif.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Panitia Pemira HMIF';
    const fromEmail = process.env.SMTP_FROM_EMAIL || `noreply@${domain}`;
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

    const html = generateBroadcastEmailHtml({ voterName, nim, headline, bodyText, ctaText, ctaUrl });
    const text = generateBroadcastEmailText({ voterName, nim, headline, bodyText, ctaUrl });

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        replyTo,
        subject,
        text,
        html,
        headers: {
          'X-Entity-Ref-ID': `pemira-broadcast-${nim}-${Date.now()}`,
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
          Precedence: 'bulk',
        },
      });

      return {
        success: true,
        isDevFallback: false,
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      const errorMsg = this.extractErrorMessage(err);
      console.error('[SmtpMailService] Gagal kirim broadcast via SMTP:', errorMsg);

      const isDevEnv = process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'development';
      if (isDevEnv) {
        console.warn(`[DEV FAIL-SAFE] Broadcast mail fallback untuk ${to} (NIM: ${nim}): ${errorMsg}`);
        return {
          success: true,
          isDevFallback: true,
          messageId: `dev-broadcast-failsafe-${Date.now()}-${nim}`,
        };
      }

      return {
        success: false,
        isDevFallback: false,
        error: errorMsg,
      };
    }
  }
}

// Singleton instance
export const smtpMailService = new SmtpMailService();
