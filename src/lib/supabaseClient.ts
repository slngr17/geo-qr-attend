// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

// Create an authenticated Supabase client (with Clerk token)
export function createAuthenticatedSupabaseClient() {
  const { session } = useSession();

  return createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        return session?.getToken() ?? null;
      },
    }
  );
}
