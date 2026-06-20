// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Create an authenticated Supabase client (with Clerk token).
// IMPORTANT: this is a plain factory function, not a hook — it must NOT call
// React hooks like useSession() internally, since it gets invoked from event
// handlers (e.g. form submit), not during component render. Call useSession()
// in your component body instead, and pass session.getToken down as getToken.
export function createAuthenticatedSupabaseClient(
  getToken: () => Promise<string | null>
) {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        return (await getToken()) ?? null;
      },
    }
  );
}
