import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — only created when first used inside AdminDashboard,
// not at module load time. Prevents a white screen if the env var is missing.
let _client: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (_client) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Admin client unavailable: VITE_SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.'
    );
  }

  _client = createClient(url, key);
  return _client;
};
