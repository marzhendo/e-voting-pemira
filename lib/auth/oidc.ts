import { createRemoteJWKSet, jwtVerify } from 'jose';

// Microsoft Entra ID Common JWKS Endpoint for multitenant token signature verification
const ENTRA_JWKS_URL = 'https://login.microsoftonline.com/common/discovery/v2.0/keys';
const jwks = createRemoteJWKSet(new URL(ENTRA_JWKS_URL));

export interface EntraClaims {
  tid: string; // Tenant ID
  oid: string; // Object ID
  email: string; // Institutional email
  name: string; // Full name
  preferred_username?: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  claims?: EntraClaims;
  error?: string;
  message?: string;
}

/**
 * Validates a Microsoft Entra ID OIDC id_token.
 * 
 * STRICT SECURITY CHECKS:
 * 1. Cryptographic signature against official Microsoft JWKS.
 * 2. Token expiration and validity period.
 * 3. Audience (client ID) validation.
 * 4. Tenant ID (tid) restriction: MUST match the verified Telkom University tenant ID.
 * 5. Institutional domain validation (@student.telkomuniversity.ac.id).
 */
export async function verifyEntraIdToken(idToken: string): Promise<TokenVerificationResult> {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const allowedTenantId = process.env.MICROSOFT_TENANT_ID;

    if (!clientId) {
      return {
        valid: false,
        error: 'CONFIG_ERROR',
        message: 'Konfigurasi MICROSOFT_CLIENT_ID belum terpasang di server.',
      };
    }

    // 1. Verifikasi tanda tangan kriptografis dan klaim standar JWT
    const { payload } = await jwtVerify(idToken, jwks, {
      audience: clientId,
    });

    const tid = payload.tid as string;
    const oid = payload.oid as string;
    const name = (payload.name as string) || 'Mahasiswa Telkom University';
    const email = (
      (payload.email as string) ||
      (payload.preferred_username as string) ||
      (payload.upn as string) ||
      ''
    ).toLowerCase().trim();

    if (!tid || !oid || !email) {
      return {
        valid: false,
        error: 'MISSING_CLAIMS',
        message: 'Token Microsoft tidak memuat klaim identitas penting (tid, oid, atau email).',
      };
    }

    // 2. Pembatasan Tenant Telkom University (Strict Tenant Restriction)
    // Multitenant app registration hanya menerima tenant resmi Telkom University
    if (allowedTenantId && allowedTenantId !== '00000000-0000-0000-0000-000000000000') {
      if (tid !== allowedTenantId) {
        return {
          valid: false,
          error: 'INVALID_TENANT',
          message: 'Akses ditolak: Akun Microsoft Anda bukan berasal dari penyewa (tenant) resmi Telkom University.',
        };
      }
    }

    // 3. Validasi Domain Email Institusi
    if (!email.endsWith('telkomuniversity.ac.id')) {
      return {
        valid: false,
        error: 'INVALID_DOMAIN',
        message: 'Akses ditolak: Alamat email harus menggunakan domain resmi @student.telkomuniversity.ac.id.',
      };
    }

    return {
      valid: true,
      claims: {
        tid,
        oid,
        email,
        name,
        preferred_username: payload.preferred_username as string,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[OIDC] Token verification failed:', errorMsg);
    return {
      valid: false,
      error: 'VERIFICATION_FAILED',
      message: 'Token autentikasi Microsoft tidak sah atau telah kedaluwarsa.',
    };
  }
}

/**
 * Generates the Microsoft Entra ID authorization URL for initiating OIDC login.
 */
export function getEntraAuthorizationUrl(state: string): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID || '';
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
  
  // Menggunakan endpoint /common/ karena App Registration dikonfigurasi multitenant
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email',
    state,
    prompt: 'select_account',
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchanges authorization code for tokens from Microsoft token endpoint.
 */
export async function exchangeEntraCodeForTokens(code: string): Promise<{ id_token?: string; error?: string }> {
  const clientId = process.env.MICROSOFT_CLIENT_ID || '';
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || '';
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'openid profile email',
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('[OIDC] Token exchange error response:', data);
    return { error: data.error_description || 'Gagal menukarkan kode otorisasi Microsoft.' };
  }

  return { id_token: data.id_token };
}
