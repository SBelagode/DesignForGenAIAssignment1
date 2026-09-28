import { createClient } from "@supabase/supabase-js";

// Plain anon client — no session cookies attached.
// Queries run as the `anon` role, matching Assignment 2 RLS policy behavior.
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
