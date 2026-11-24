/**
 * Root Superadmin Configuration & Protections
 * 
 * Provides centralized resolution and protection for the primary root administrator
 * across environments, configurable via SUPER_ADMIN_EMAIL or ADMIN_EMAIL in .env.local,
 * with fallback to the default initial superadmin email.
 */

export const DEFAULT_ROOT_SUPERADMIN_EMAIL = 'marzhendogalangs@gmail.com';

/**
 * Returns the configured authoritative root superadmin email in lowercase.
 */
export function getRootSuperadminEmail(): string {
  return (
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    DEFAULT_ROOT_SUPERADMIN_EMAIL
  )
    .trim()
    .toLowerCase();
}

/**
 * Checks if the given email matches the authoritative root superadmin email.
 */
export function isRootSuperadminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === getRootSuperadminEmail();
}
