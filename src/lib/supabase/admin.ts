import { createClient } from '@supabase/supabase-js';

// Service-role client for server-side operations (cron jobs, background tasks)
// This bypasses RLS — use carefully
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
