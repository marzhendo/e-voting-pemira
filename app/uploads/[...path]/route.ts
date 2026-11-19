import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { resolveSafeUploadPath } from '../../../lib/security/upload-validation.ts';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

interface RouteContext {
  params: {
    path?: string[];
  };
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const pathSegments = params?.path;
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  // Construct relative URL starting with /uploads/
  const relativeUrl = `/uploads/${pathSegments.join('/')}`;

  // Candidate root paths to check across various runtime environments:
  // 1. Standard project root (development / VPS standard PM2)
  // 2. Standalone nested public root (.next/standalone/public/uploads)
  // 3. Fallback when cwd is already inside .next/standalone (../../public/uploads)
  const candidateRoots = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads'),
    path.resolve(process.cwd(), '..', '..', 'public', 'uploads'),
  ];

  let resolvedFilePath: string | null = null;

  for (const root of candidateRoots) {
    const safePath = resolveSafeUploadPath(relativeUrl, root);
    if (safePath && existsSync(safePath)) {
      resolvedFilePath = safePath;
      break;
    }
  }

  // Reject missing files or directory traversal attempts
  if (!resolvedFilePath) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const ext = path.extname(resolvedFilePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const fileBuffer = await fs.readFile(resolvedFilePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[UploadServeRoute] Failed to serve file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
