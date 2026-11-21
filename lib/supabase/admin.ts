import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Checks whether live Supabase credentials are configured and not placeholders.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return false;
  if (url.includes('your-project-id') || url.includes('placeholder')) return false;
  if (key.includes('placeholder')) return false;

  return true;
}

/**
 * Privileged Supabase client using the service_role key.
 * 
 * STRICT SECURITY INVARIANT:
 * This client bypasses Row Level Security (RLS) and has full database privileges.
 * NEVER import or execute this module in Client Components or browser bundles.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

  if (process.env.APP_ENV === 'production' && (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder'))) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production environment.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          cache: 'no-store',
        });
      },
    },
  });
}
