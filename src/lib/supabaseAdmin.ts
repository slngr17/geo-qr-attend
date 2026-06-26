import { createClient } from '@supabase/supabase-js';

// Uses the service role key — bypasses RLS entirely.
// ONLY use this in the admin panel. Never expose to regular users.
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);
