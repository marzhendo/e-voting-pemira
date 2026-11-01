import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production environment.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
