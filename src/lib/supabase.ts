import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

export function createSupabaseClient() {
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

// Default export for compatibility
export const supabase = createSupabaseClient();
