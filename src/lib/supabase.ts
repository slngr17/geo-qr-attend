import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

export function createSupabaseClient() {
  const { session } = useSession();

  return createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      global: {
        accessToken: async () => {
          return session?.getToken() ?? null;
        },
      },
    }
  );
}

// Default export for backward compatibility with other files
export const supabase = createSupabaseClient();
