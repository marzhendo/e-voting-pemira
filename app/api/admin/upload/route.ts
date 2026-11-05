import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/rbac/permissions';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE = 10 * 1024 * 1024;   // 10 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

export async function POST(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  // Auditor bersifat read-only
  if (session?.role === 'auditor') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Peran Auditor hanya memiliki hak baca (read-only).' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'candidates'; // 'candidates' | 'cv'
    const candidateNumber = (formData.get('candidateNumber') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah.' }, { status: 400 });
    }

    const mimeType = file.type.toLowerCase();
    const size = file.size;

    let subfolder = 'candidates';
    let allowedTypes = ALLOWED_IMAGE_TYPES;
    let maxSize = MAX_IMAGE_SIZE;

    if (category === 'cv' || mimeType === 'application/pdf') {
      subfolder = 'cv';
      allowedTypes = ALLOWED_PDF_TYPES;
      maxSize = MAX_PDF_SIZE;
    }

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Format berkas tidak didukung. Diizinkan: ${
            subfolder === 'cv' ? 'PDF (.pdf)' : 'PNG, JPG, atau WEBP'
          }.`,
        },
        { status: 400 }
      );
    }

    if (size > maxSize) {
      return NextResponse.json(
        {
          error: `Ukuran berkas melebihi batas maksimal (${
            subfolder === 'cv' ? '10 MB' : '5 MB'
          }).`,
        },
        { status: 400 }
      );
    }

    // Ekstensi berkas yang aman
    let extension = '.bin';
    if (mimeType === 'image/jpeg') extension = '.jpg';
    else if (mimeType === 'image/png') extension = '.png';
    else if (mimeType === 'image/webp') extension = '.webp';
    else if (mimeType === 'application/pdf') extension = '.pdf';

    const safeCandidatePrefix = candidateNumber.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${safeCandidatePrefix}-${timestamp}-${randomSuffix}${extension}`;

    const targetDir = path.join(process.cwd(), 'public', 'uploads', subfolder);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(targetFilePath, buffer);

    const publicUrl = `/uploads/${subfolder}/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'Berkas berhasil diunggah.',
      url: publicUrl,
      filename,
      originalName: file.name,
      size,
      mimeType,
    });
  } catch (error) {
    console.error('[AdminUploadRoute] Exception during file upload:', error);
    return NextResponse.json(
      { error: 'Terjadi kegagalan server saat memproses unggahan berkas.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  const authCheck = verifyAdminAccess(session);

  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error || 'Akses Ditolak.', code: 'FORBIDDEN' },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const relativeUrl = searchParams.get('path');

    if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'Path berkas tidak valid atau di luar direktori uploads.' },
        { status: 400 }
      );
    }

    // Mencegah path traversal attack
    const cleanSubPath = path.normalize(relativeUrl.replace(/^\/uploads\//, '')).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', cleanSubPath);

    if (existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }

    return NextResponse.json({
      success: true,
      message: 'Berkas berhasil dihapus.',
    });
  } catch (error) {
    console.error('[AdminUploadRoute] Delete error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus berkas.' },
      { status: 500 }
    );
  }
}
