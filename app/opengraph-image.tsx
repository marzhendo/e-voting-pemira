import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const alt = 'PEMIRA HMIF 2026/2027 - Telkom University Purwokerto';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  let logoDataUrl = '';
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'img', 'hmif-logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch {
    logoDataUrl = '';
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          backgroundColor: '#121212',
          backgroundImage:
            'radial-gradient(circle at 85% 20%, rgba(235, 189, 28, 0.15) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(183, 27, 37, 0.1) 0%, transparent 45%)',
          fontFamily: 'sans-serif',
          color: '#FFFFFF',
          border: '12px solid #1E1E1E',
          boxSizing: 'border-box',
        }}
      >
        {/* Top bar: Organization Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoDataUrl}
                alt="HMIF Logo"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: '2px solid rgba(235, 189, 28, 0.4)',
                }}
              />
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#EBBD1C',
                  letterSpacing: '1px',
                }}
              >
                HMIF TELKOM UNIVERSITY PURWOKERTO
              </span>
              <span style={{ fontSize: '16px', color: '#8B8A8B' }}>
                Komisi Pemilihan Raya (KPR)
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(235, 189, 28, 0.12)',
              border: '1px solid rgba(235, 189, 28, 0.3)',
              borderRadius: '9999px',
              padding: '8px 20px',
              color: '#EBBD1C',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '1.5px',
            }}
          >
            PORTAL RESMI
          </div>
        </div>

        {/* Center: Hero Heading */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '960px',
            margin: 'auto 0',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
              color: '#FFFFFF',
            }}
          >
            PEMIRA HMIF <span style={{ color: '#EBBD1C' }}>2026/2027</span>
          </div>

          <div
            style={{
              fontSize: '24px',
              color: '#D1D5DB',
              lineHeight: 1.4,
              fontWeight: 400,
            }}
          >
            Sistem Pemungutan Suara Elektronik Suksesi Chairman & Vice Chairman HMIF Telkom University Purwokerto.
          </div>
        </div>

        {/* Bottom bar: Pillars & Domain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', fontSize: '15px', color: '#8B8A8B' }}>
            <span>Langsung</span>
            <span>•</span>
            <span>Umum</span>
            <span>•</span>
            <span>Bebas</span>
            <span>•</span>
            <span>Rahasia</span>
            <span>•</span>
            <span>Jujur & Adil</span>
          </div>

          <div
            style={{
              fontSize: '16px',
              color: '#EBBD1C',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            pemirahmif.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
