import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({
    success: true,
    message: 'Sesi telah berhasil diakhiri.',
  });
}

export async function GET() {
  clearSessionCookie();
  return NextResponse.redirect(new URL('/login', process.env.APP_BASE_URL || 'http://localhost:3000'));
}
