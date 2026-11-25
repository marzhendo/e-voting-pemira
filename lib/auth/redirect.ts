const ALLOWED_INTERNAL_REDIRECT_PREFIXES = ['/rekapitulasi', '/receipt', '/vote', '/admin/dashboard'];

/**
 * Validates that a requested redirect target is a strict internal application path
 * (rejecting external origins, protocol-relative URLs, backslashes, or control characters).
 */
export function resolveSafeInternalRedirect(
  rawRedirect: string | null | undefined
): string | null {
  if (!rawRedirect || typeof rawRedirect !== 'string') {
    return null;
  }

  const trimmed = rawRedirect.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes('@') ||
    /[\x00-\x1f\x7f]/.test(trimmed)
  ) {
    return null;
  }

  const pathnameOnly = trimmed.split(/[?#]/)[0];
  const isAllowed = ALLOWED_INTERNAL_REDIRECT_PREFIXES.some(
    (prefix) => pathnameOnly === prefix || pathnameOnly.startsWith(`${prefix}/`)
  );

  return isAllowed ? trimmed : null;
}

export interface PostLoginRouteInput {
  role?: string | null;
  hasVoted: boolean;
  isElectionClosed: boolean;
  requestedRedirect?: string | null;
}

/**
 * Resolves the safe post-login destination honoring explicit `/rekapitulasi` redirects
 * and automatically routing unvoted voters to `/rekapitulasi` after closing time.
 */
export function resolvePostLoginDestination({
  role,
  hasVoted,
  isElectionClosed,
  requestedRedirect,
}: PostLoginRouteInput): string {
  const safeRedirect = resolveSafeInternalRedirect(requestedRedirect);
  const isStaff = Boolean(role && role !== 'voter');

  if (safeRedirect) {
    if (safeRedirect.startsWith('/admin') && !isStaff) {
      return hasVoted ? '/receipt' : isElectionClosed ? '/rekapitulasi' : '/vote';
    }
    if (safeRedirect === '/vote' && hasVoted) {
      return '/receipt';
    }
    return safeRedirect;
  }

  if (isStaff) {
    return '/admin/dashboard';
  }
  if (hasVoted) {
    return '/receipt';
  }
  return isElectionClosed ? '/rekapitulasi' : '/vote';
}
