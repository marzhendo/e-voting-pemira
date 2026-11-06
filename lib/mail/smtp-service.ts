import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailService, SendPinPayload, SendBroadcastPayload, MailDeliveryResult } from './types';
import {
  generatePinEmailHtml,
  generatePinEmailText,
  generateBroadcastEmailHtml,
  generateBroadcastEmailText,
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
      dkim: dkimConfig,
    });

    return this.transporter;
  }

  async sendLoginPin({ to, voterName, nim, pin }: SendPinPayload): Promise<MailDeliveryResult> {
    const transporter = this.getTransporter();

    // Fallback Dev / Offline mode
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

    const domain = process.env.SMTP_FROM_DOMAIN || 'pemirahmif.org';
    const fromName = process.env.SMTP_FROM_NAME || 'Panitia Pemira HMIF';
    const fromEmail = process.env.SMTP_FROM_EMAIL || `noreply@${domain}`;

    const html = generatePinEmailHtml({ voterName, nim, pin });
    const text = generatePinEmailText({ voterName, nim, pin });

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        replyTo: `bantuan@${domain}`,
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
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim email melalui SMTP.';
      console.error('[SmtpMailService] Gagal mengirim email via SMTP:', err);
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

    const domain = process.env.SMTP_FROM_DOMAIN || 'pemirahmif.org';
    const fromName = process.env.SMTP_FROM_NAME || 'Panitia Pemira HMIF';
    const fromEmail = process.env.SMTP_FROM_EMAIL || `noreply@${domain}`;

    const html = generateBroadcastEmailHtml({ voterName, nim, headline, bodyText, ctaText, ctaUrl });
    const text = generateBroadcastEmailText({ voterName, nim, headline, bodyText, ctaUrl });

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        replyTo: `bantuan@${domain}`,
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
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim email broadcast via SMTP.';
      console.error('[SmtpMailService] Gagal kirim broadcast via SMTP:', err);
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
