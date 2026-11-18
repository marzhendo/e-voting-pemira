/**
 * Centralized Runtime Environment & Security Mode Resolver
 *
 * Ensures production security guards activate reliably whenever either
 * NODE_ENV or APP_ENV indicates a production runtime (e.g. `next start` / VPS).
 */

/**
 * Returns true if the application is running in production mode.
 */
export function isProductionEnvironment(): boolean {
  return process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
}

/**
 * Returns true only when local dev-mode mock fallbacks are explicitly allowed
 * (i.e. non-production runtime AND live Supabase is not configured).
 */
export function isDevFallbackAllowed(supabaseConfigured: boolean): boolean {
  if (isProductionEnvironment()) {
    return false;
  }
  return !supabaseConfigured;
}
