import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Server-side Supabase client (recommended)
export async function createServerSupabaseClient() {
  const { getToken } = auth();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        accessToken: async () => getToken(),
      },
    }
  );
}

// Client-side Supabase client
import { useSession } from '@clerk/nextjs';

export function createClientSupabaseClient() {
  const { session } = useSession();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        accessToken: async () => session?.getToken() ?? null,
      },
    }
  );
}
