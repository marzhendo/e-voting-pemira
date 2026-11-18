/**
 * Strict URL Allowlist & Protocol Validation (Anti-Stored-XSS / Anti-Open-Scheme)
 *
 * Prevents `javascript:`, `data:`, `vbscript:`, protocol-relative (`//evil.com`),
 * path traversal (`..`), and untrusted external origins from being persisted or rendered
 * in candidate asset fields (photo, Chairman CV, Vice Chairman CV) and email CTAs.
 */

const SAFE_LOCAL_ASSET_PREFIXES = ['/uploads/', '/assets/', '/candidates/'];

const DEFAULT_TRUSTED_HOSTS = ['pemirahmif.com', 'www.pemirahmif.com'];

function getTrustedHttpsHosts(): Set<string> {
  const hosts = new Set<string>(DEFAULT_TRUSTED_HOSTS);
  for (const envUrl of [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_BASE_URL]) {
    if (!envUrl) continue;
    try {
      const parsed = new URL(envUrl);
      if (parsed.protocol === 'https:' && parsed.hostname) {
        hosts.add(parsed.hostname.toLowerCase());
      }
    } catch {
      // Ignore malformed env URL
    }
  }
  return hosts;
}

/**
 * Validates that a candidate photo or CV URL is either:
 * 1. A safe local asset path under `/uploads/`, `/assets/`, or `/candidates/` (no `//`, no `..`, no control chars)
 * 2. An `https://` URL on an explicitly trusted domain (`pemirahmif.com` / configured `NEXT_PUBLIC_APP_URL`).
 */
export function isSafeCandidateAssetUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return false;

  // Reject protocol-relative URLs and directory traversal
  if (trimmed.startsWith('//') || trimmed.includes('..') || trimmed.includes('\\')) {
    return false;
  }

  // 1. Allow strict local asset prefixes
  if (SAFE_LOCAL_ASSET_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return true;
  }

  // 2. Allow HTTPS only on trusted hostnames
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    const trustedHosts = getTrustedHttpsHosts();
    return trustedHosts.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Returns the trimmed URL if it passes strict candidate asset allowlist validation,
 * otherwise returns `fallback`.
 */
export function sanitizeCandidateAssetUrl(
  rawUrl?: string | null,
  fallback = ''
): string {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  return isSafeCandidateAssetUrl(trimmed) ? trimmed : fallback;
}

/**
 * Resolves a safe absolute URL for broadcast email CTA buttons using an allowlist.
 * Only permits relative paths (`/login`) or explicit `https://` / `http://` URLs.
 */
export function resolveSafeEmailCtaUrl(rawUrl?: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    'https://pemirahmif.com'
  ).replace(/\/$/, '');
  const fallback = `${base}/login`;

  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return fallback;

  // Reject protocol-relative paths like //evil.com
  if (trimmed.startsWith('//')) return fallback;

  // Safe relative app path
  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`;
  }

  // Strict protocol allowlist for absolute URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}
