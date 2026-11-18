/**
 * File Upload Magic-Bytes Signature Verification
 *
 * Prevents MIME-type spoofing (e.g., uploading HTML/SVG/scripts renamed as .png or .pdf)
 * by inspecting the actual binary file header bytes before persisting to storage.
 */

export type AllowedUploadMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

const EXTENSION_MAP: Record<AllowedUploadMime, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

/**
 * Validates that the binary content of `buffer` matches the declared `mimeType`.
 */
export function validateFileMagicBytes(buffer: Buffer, mimeType: string): { valid: boolean; extension?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  const normalizedMime = mimeType.toLowerCase() as AllowedUploadMime;

  switch (normalizedMime) {
    case 'image/png': {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a;
      return { valid: isPng, extension: isPng ? EXTENSION_MAP[normalizedMime] : undefined };
    }

    case 'image/jpeg': {
      // JPEG signature: FF D8 FF
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      return { valid: isJpeg, extension: isJpeg ? EXTENSION_MAP[normalizedMime] : undefined };
    }

    case 'image/webp': {
      // WEBP signature: "RIFF" .... "WEBP"
      const riff = buffer.toString('ascii', 0, 4) === 'RIFF';
      const webp = buffer.toString('ascii', 8, 12) === 'WEBP';
      const isWebp = riff && webp;
      return { valid: isWebp, extension: isWebp ? EXTENSION_MAP[normalizedMime] : undefined };
    }

    case 'application/pdf': {
      // PDF signature: "%PDF-"
      const isPdf = buffer.toString('ascii', 0, 5) === '%PDF-';
      return { valid: isPdf, extension: isPdf ? EXTENSION_MAP[normalizedMime] : undefined };
    }

    default:
      return { valid: false };
  }
}
