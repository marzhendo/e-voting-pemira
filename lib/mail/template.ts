import type { SendPinPayload } from './types';

/**
 * Meloloskan karakter spesial HTML untuk mencegah injeksi HTML atau tampilan rusak pada email client
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Mengonversi path relatif menjadi absolute URL yang valid untuk email client
 * serta mencegah skema berbahaya (javascript:, data:)
 */
export function resolveSafeCtaUrl(rawUrl?: string): string {
  const fallback = 'http://localhost:3000/login';
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();

  // Cegah protokol berbahaya
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return fallback;
  }

  // Jika URL relatif (e.g. '/login'), konversikan menjadi URL lengkap berbasis domain aplikasi
  if (trimmed.startsWith('/')) {
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}${trimmed}`;
  }

  return trimmed;
}

export function generatePinEmailHtml({ voterName, nim, pin }: Omit<SendPinPayload, 'to'>): string {
  const safeName = escapeHtml(voterName);
  const safeNim = escapeHtml(nim);
  const safePin = escapeHtml(pin);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode PIN Masuk Pemira HMIF</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #121212; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #1E1E1E; border: 1px solid #2E2E2E; border-radius: 16px; overflow: hidden; padding: 0;">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 28px 20px 28px; border-bottom: 1px solid #2E2E2E; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #EBBD1C; display: block; margin-bottom: 4px;">
                PEMIRA HMIF 2026/2027
              </span>
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">
                Kode Verifikasi Bilik Suara
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #8B8A8B;">
                Telkom University Purwokerto
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #E0E0E0; line-height: 1.6;">
                Halo <strong>${safeName}</strong> (<span style="font-family: monospace; color: #EBBD1C;">${safeNim}</span>),
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #A0A0A0; line-height: 1.6;">
                Gunakan kode PIN 6-digit berikut untuk mengakses bilik suara digital Anda pada Pemilihan Raya HMIF:
              </p>

              <!-- PIN Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #262626; border: 1px solid #383838; border-radius: 12px; padding: 22px 16px;">
                    <span style="font-family: ui-monospace, 'SF Mono', Consolas, 'Segoe UI Mono', 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #EBBD1C; display: block;">
                      ${safePin}
                    </span>
                    <span style="font-size: 11px; color: #B8B8B8; display: block; margin-top: 8px;">
                      Masa aktif: <strong style="color: #FFFFFF;">10 Menit</strong> (Batas 3x percobaan)
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Warning Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #222222; border: 1px solid #333333; padding: 14px 16px; border-radius: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #D5D5D5; line-height: 1.5;">
                    <span style="display: inline-block; background-color: rgba(235, 189, 28, 0.15); color: #EBBD1C; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">PENTING</span>
                    Jangan berikan kode PIN ini kepada siapa pun demi menjaga kerahasiaan hak suara Anda.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 11px; color: #A5A5A5; line-height: 1.5;">
                Jika Anda tidak merasa meminta kode ini, abaikan email ini atau hubungi Panitia KPR HMIF.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #181818; border-top: 1px solid #282828; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #8E8E8E; line-height: 1.5;">
                Komisi Pemilihan Raya (KPR) HMIF Periode 2026/2027<br>
                Telkom University Purwokerto &bull; Kendala? <a href="https://wa.me/6281809300406" style="color: #EBBD1C; text-decoration: underline;">WhatsApp Panitia KPR</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generatePinEmailText({ voterName, nim, pin }: Omit<SendPinPayload, 'to'>): string {
  return `[PEMIRA HMIF 2026/2027] KODE VERIFIKASI BILIK SUARA

Halo ${voterName} (${nim}),

Gunakan kode PIN 6-digit berikut untuk mengakses bilik suara digital Anda pada Pemira HMIF:

KODE PIN: ${pin}

Masa aktif: 10 Menit (Batas maksimal 3x percobaan)

PENTING:
Jangan berikan kode PIN ini kepada siapa pun demi menjaga kerahasiaan hak suara Anda.

Jika Anda tidak merasa meminta kode ini, silakan abaikan email ini.

--
Komisi Pemilihan Raya (KPR) HMIF Periode 2026/2027
Telkom University Purwokerto`;
}

export interface BroadcastEmailTemplateOptions {
  voterName: string;
  nim: string;
  headline: string;
  bodyText: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function generateBroadcastEmailHtml({
  voterName,
  nim,
  headline,
  bodyText,
  ctaText = 'Masuk ke Bilik Suara Digital',
  ctaUrl,
}: BroadcastEmailTemplateOptions): string {
  const safeName = escapeHtml(voterName);
  const safeNim = escapeHtml(nim);
  const safeHeadline = escapeHtml(headline);
  const safeCtaText = escapeHtml(ctaText);
  const safeCtaUrl = escapeHtml(resolveSafeCtaUrl(ctaUrl));

  const formattedBody = bodyText
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin: 0 0 14px 0; font-size: 13px; color: #D1D1D1; line-height: 1.6;">${escapeHtml(line)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeHeadline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #121212; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #1E1E1E; border: 1px solid #2E2E2E; border-radius: 16px; overflow: hidden; padding: 0;">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 28px 20px 28px; border-bottom: 1px solid #2E2E2E; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #EBBD1C; display: block; margin-bottom: 4px;">
                PEMIRA HMIF 2026/2027
              </span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">
                ${safeHeadline}
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #8B8A8B;">
                Komisi Pemilihan Raya (KPR) HMIF Telkom University Purwokerto
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #FFFFFF; line-height: 1.6;">
                Halo <strong>${safeName}</strong> (<span style="font-family: monospace; color: #EBBD1C;">${safeNim}</span>),
              </p>

              ${formattedBody}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeCtaUrl}" style="display: inline-block; background-color: #29388B; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(41, 56, 139, 0.4);">
                      ${safeCtaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #222222; border-left: 3px solid #EBBD1C; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #CCCCCC; line-height: 1.5;">
                    🛡️ <strong>Asas LUBER JURDIL:</strong> Hak suara Anda bersifat Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil. Kerahasiaan pilihan dijamin penuh oleh sistem tanpa rekam jejak identitas ke surat suara (*Ballot Secrecy*).
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #181818; border-top: 1px solid #282828; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #666666; line-height: 1.5;">
                Komisi Pemilihan Raya (KPR) HMIF Periode 2026/2027<br>
                Telkom University Purwokerto &bull; Kendala? WhatsApp: <a href="https://wa.me/6281809300406" style="color: #EBBD1C; text-decoration: none;">+62 818-0930-0406</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateBroadcastEmailText({
  voterName,
  nim,
  headline,
  bodyText,
  ctaUrl,
}: BroadcastEmailTemplateOptions): string {
  const resolvedUrl = resolveSafeCtaUrl(ctaUrl);

  return `[PEMIRA HMIF 2026/2027] ${headline}

Halo ${voterName} (${nim}),

${bodyText}

Akses Bilik Suara Digital:
${resolvedUrl}

---
KPR HMIF Telkom University Purwokerto 2026/2027
Kerahasiaan Hak Suara Dijamin Asas Luber Jurdil (Ballot Secrecy)`;
}
