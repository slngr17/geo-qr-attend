// src/lib/profile.ts
import { createAuthenticatedSupabaseClient } from './supabaseClient';

export async function createOrUpdateProfile(clerkUserId: string, role: 'instructor' | 'student', fullName?: string) {
  const supabase = createAuthenticatedSupabaseClient();

  const { error } = await supabase
    .from('profiles')
    .upsert({
      clerk_user_id: clerkUserId,
      role: role,
      full_name: fullName || '',
    }, {
      onConflict: 'clerk_user_id'
    });

  if (error) console.error("Profile creation error:", error);
  return !error;
}
