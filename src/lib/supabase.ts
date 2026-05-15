import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

// Client-side Supabase client with Clerk token
export function createSupabaseClient() {
  const { session } = useSession();

  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    {
      global: {
        accessToken: async () => {
          return session?.getToken() ?? null;
        },
      },
    }
  );
}

// Export a default instance (for files that expect the old `supabase`)
export const supabase = createSupabaseClient();
