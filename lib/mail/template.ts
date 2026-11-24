import type { SendPinPayload } from './types';
import { resolveSafeEmailCtaUrl } from '../security/url-validation.ts';

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
 * dengan strict allowlist protokol (`https:`, `http:`, atau relative `/...`).
 */
export function resolveSafeCtaUrl(rawUrl?: string): string {
  return resolveSafeEmailCtaUrl(rawUrl);
}

export function generatePinEmailHtml({ voterName, pin }: Omit<SendPinPayload, 'to'>): string {
  const safeName = escapeHtml(voterName);
  const safePin = escapeHtml(pin);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Kode Verifikasi Bilik Suara Pemira HMIF</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121212; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #1C1C1C; border: 1px solid #2D2D2D; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #282828; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #EBBD1C; display: block; margin-bottom: 6px;">
                PEMIRA HMIF 2026/2027
              </span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.2px;">
                Kode Verifikasi Masuk
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #A3A3A3;">
                Himpunan Mahasiswa Informatika &bull; Telkom University Purwokerto
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #FFFFFF; line-height: 1.6;">
                Halo <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #CCCCCC; line-height: 1.65;">
                Berikut adalah kode verifikasi 6 digit untuk mengakses bilik suara digital Pemira HMIF:
              </p>

              <!-- PIN Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #242424; border: 1px solid #3A3A3A; border-radius: 14px; padding: 24px 16px;">
                    <span style="font-family: ui-monospace, 'SF Mono', Menlo, Consolas, 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #EBBD1C; display: block; line-height: 1.1;">
                      ${safePin}
                    </span>
                    <span style="font-size: 12px; color: #A8A8A8; display: block; margin-top: 10px;">
                      Berlaku selama <strong style="color: #FFFFFF;">10 menit</strong> &bull; Maksimal 3 kali percobaan
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; font-size: 13px; color: #CCCCCC; line-height: 1.6;">
                Masukkan kode di atas pada halaman login untuk mulai memilih. Demi keamanan hak suaramu, jangan berikan kode ini kepada siapa pun.
              </p>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #222222; border-left: 3px solid #EBBD1C; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #B5B5B5; line-height: 1.6;">
                    Jika kamu tidak merasa meminta kode verifikasi ini, abaikan email ini atau segera laporkan ke panitia.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #161616; border-top: 1px solid #262626; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #8E8E8E; line-height: 1.6;">
                Komisi Pemilihan Raya (KPR) HMIF 2026/2027<br>
                Telkom University Purwokerto &bull; <a href="https://wa.me/6281809300406" style="color: #EBBD1C; text-decoration: underline;">Pusat Bantuan WhatsApp</a>
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

export function generatePinEmailText({ voterName, pin }: Omit<SendPinPayload, 'to'>): string {
  return `[PEMIRA HMIF 2026/2027] KODE VERIFIKASI BILIK SUARA

Halo ${voterName},

Berikut kode verifikasi 6 digit untuk mengakses bilik suara digital Pemira HMIF:

KODE PIN: ${pin}

Masa aktif: 10 menit (maksimal 3 kali percobaan)

Masukkan kode ini pada halaman verifikasi untuk mulai memilih.
Demi keamanan hak suaramu, jangan bagikan kode ini kepada siapa pun.

Jika kamu tidak merasa meminta kode ini, silakan abaikan pesan ini.

--
Komisi Pemilihan Raya (KPR) HMIF 2026/2027
Telkom University Purwokerto
Pusat Bantuan: https://wa.me/6281809300406`;
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
  headline,
  bodyText,
  ctaText = 'Masuk ke Bilik Suara',
  ctaUrl,
}: BroadcastEmailTemplateOptions): string {
  const safeName = escapeHtml(voterName);
  const safeHeadline = escapeHtml(headline);
  const safeCtaText = escapeHtml(ctaText);
  const safeCtaUrl = escapeHtml(resolveSafeCtaUrl(ctaUrl));

  const formattedBody = bodyText
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin: 0 0 14px 0; font-size: 14px; color: #D6D6D6; line-height: 1.65;">${escapeHtml(line)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${safeHeadline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121212; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #1C1C1C; border: 1px solid #2D2D2D; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #282828; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #EBBD1C; display: block; margin-bottom: 6px;">
                PEMIRA HMIF 2026/2027
              </span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.2px;">
                ${safeHeadline}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #A3A3A3;">
                Himpunan Mahasiswa Informatika &bull; Telkom University Purwokerto
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 18px 0; font-size: 15px; color: #FFFFFF; line-height: 1.6;">
                Halo <strong>${safeName}</strong>,
              </p>

              ${formattedBody}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #29388B; border-radius: 12px; box-shadow: 0 4px 14px rgba(41, 56, 139, 0.45);">
                          <a href="${safeCtaUrl}" style="display: inline-block; background-color: #29388B; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.3px;">
                            ${safeCtaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Privacy Assurance Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #222222; border-left: 3px solid #EBBD1C; border-radius: 4px; padding: 12px 16px; margin-top: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #B5B5B5; line-height: 1.6;">
                    Pilihan suaramu bersifat rahasia dan disimpan secara anonim tanpa mencatat identitas pemilih pada surat suara.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #161616; border-top: 1px solid #262626; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #8E8E8E; line-height: 1.6;">
                Komisi Pemilihan Raya (KPR) HMIF 2026/2027<br>
                Telkom University Purwokerto &bull; <a href="https://wa.me/6281809300406" style="color: #EBBD1C; text-decoration: underline;">Pusat Bantuan WhatsApp</a>
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
  headline,
  bodyText,
  ctaText = 'Masuk ke Bilik Suara',
  ctaUrl,
}: BroadcastEmailTemplateOptions): string {
  const resolvedUrl = resolveSafeCtaUrl(ctaUrl);

  return `[PEMIRA HMIF 2026/2027] ${headline}

Halo ${voterName},

${bodyText}

${ctaText}:
${resolvedUrl}

---
Pilihan suaramu bersifat rahasia dan disimpan secara anonim.
Komisi Pemilihan Raya (KPR) HMIF 2026/2027
Telkom University Purwokerto
Pusat Bantuan: https://wa.me/6281809300406`;
}

export interface VoterPasswordTemplateOptions {
  voterName: string;
  nim: string;
  password: string;
  loginUrl?: string;
}

export function generateVoterPasswordEmailHtml({
  voterName,
  nim,
  password,
  loginUrl = '/login',
}: VoterPasswordTemplateOptions): string {
  const safeName = escapeHtml(voterName);
  const safeNim = escapeHtml(nim);
  const safePassword = escapeHtml(password);
  const safeUrl = resolveSafeCtaUrl(loginUrl);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Kata Sandi Masuk Bilik Suara Pemira HMIF</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121212; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #1C1C1C; border: 1px solid #2D2D2D; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #282828; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #EBBD1C; display: block; margin-bottom: 6px;">
                PEMIRA HMIF 2026/2027
              </span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.2px;">
                Kredensial Bilik Suara Pemilih
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #A3A3A3;">
                Himpunan Mahasiswa Informatika &bull; Telkom University Purwokerto
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #FFFFFF; line-height: 1.6;">
                Halo <strong>${safeName}</strong> (NIM: <strong>${safeNim}</strong>),
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #CCCCCC; line-height: 1.65;">
                Berikut adalah kata sandi unik kamu untuk masuk dan memberikan suara di bilik suara digital Pemira HMIF:
              </p>

              <!-- Password Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #242424; border: 1px solid #3A3A3A; border-radius: 14px; padding: 24px 16px;">
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #A8A8A8; display: block; margin-bottom: 8px;">
                      KATA SANDI PEMILIH
                    </span>
                    <span style="font-family: ui-monospace, 'SF Mono', Menlo, Consolas, 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #EBBD1C; display: block; line-height: 1.1;">
                      ${safePassword}
                    </span>
                    <span style="font-size: 12px; color: #A8A8A8; display: block; margin-top: 10px;">
                      Format: 8 karakter (dapat diketik tanpa tanda strip)
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Steps Guide -->
              <div style="background-color: #222222; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">
                  Cara Masuk ke Bilik Suara:
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #CCCCCC; line-height: 1.6;">
                  <li>Buka website pemilihan melalui tautan di bawah ini.</li>
                  <li>Ketik NIM kamu (<strong>${safeNim}</strong>).</li>
                  <li>Masukkan kata sandi unik di atas.</li>
                  <li>Pilih pasangan calon ketua & wakil ketua dan kirimkan suara.</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #EBBD1C; border-radius: 12px; box-shadow: 0 4px 14px rgba(235, 189, 28, 0.35);">
                          <a href="${safeUrl}" style="display: inline-block; background-color: #EBBD1C; color: #1E1E1E; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.3px;">
                            Buka Bilik Suara
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #222222; border-left: 3px solid #EBBD1C; border-radius: 4px; padding: 12px 16px; margin-bottom: 12px;">
                <tr>
                  <td style="font-size: 12px; color: #B5B5B5; line-height: 1.6;">
                    Demi menjaga integritas suara, jangan bagikan kata sandi ini kepada siapa pun. Hak suara kamu disimpan secara anonim tanpa keterkaitan antara surat suara dan data pemilih.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #161616; border-top: 1px solid #262626; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #8E8E8E; line-height: 1.6;">
                Komisi Pemilihan Raya (KPR) HMIF 2026/2027<br>
                Telkom University Purwokerto &bull; <a href="https://wa.me/6281809300406" style="color: #EBBD1C; text-decoration: underline;">Pusat Bantuan WhatsApp</a>
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

export function generateVoterPasswordEmailText({
  voterName,
  nim,
  password,
  loginUrl = '/login',
}: VoterPasswordTemplateOptions): string {
  const resolvedUrl = resolveSafeCtaUrl(loginUrl);

  return `[PEMIRA HMIF 2026/2027] Kredensial Bilik Suara Pemilih

Halo ${voterName} (NIM: ${nim}),

Berikut adalah kata sandi unik kamu untuk masuk ke bilik suara digital Pemira HMIF:

KATA SANDI PEMILIH: ${password}

Cara Masuk:
1. Buka website: ${resolvedUrl}
2. Masukkan NIM kamu (${nim})
3. Masukkan kata sandi unik di atas
4. Tentukan pilihanmu di bilik suara digital

---
Demi kerahasiaan hak suara, jangan bagikan kata sandi ini kepada siapa pun.
Komisi Pemilihan Raya (KPR) HMIF 2026/2027
Telkom University Purwokerto
Pusat Bantuan: https://wa.me/6281809300406`;
}
