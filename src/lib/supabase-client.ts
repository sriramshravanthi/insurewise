import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// docs/ARCHITECTURE.md §4: "lib" — "Supabase clients, auth helpers..."
// No live Supabase project is connected in this environment (.env.example
// only has placeholder keys). Returning null when unconfigured, rather than
// throwing, keeps guest mode fully usable (docs/PRD.md PLT-1) with no
// Supabase project at all — matching docs/ARCHITECTURE.md §8's "Database
// unavailable -> Guest mode and engine continue."
export function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey);
}
