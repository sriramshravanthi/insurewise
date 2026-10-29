/**
 * Supabase client factory.
 *
 * - Browser client:  use in Client Components and hooks.
 * - Server client:   use in Server Components, Route Handlers, Server Actions.
 *
 * Both are typed via the hand-authored Database interface.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// ---------------------------------------------------------------------------
// Environment helpers (fail loudly at build time if vars are missing)
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[InsureWise] Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill in the values.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Browser client  (singleton — safe to call multiple times)
// ---------------------------------------------------------------------------

let _browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient() {
  if (!_browserClient) {
    _browserClient = createBrowserClient<Database>(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );
  }
  return _browserClient;
}

// ---------------------------------------------------------------------------
// Server client  (new instance per request — cookies are request-scoped)
// ---------------------------------------------------------------------------

/**
 * Returns a server-side Supabase client that reads/writes cookies from the
 * Next.js request context.  Import `createServerClient` from @supabase/ssr
 * and pass in the `cookies()` from `next/headers`.
 *
 * Usage in a Server Component or Route Handler:
 *
 *   import { createSupabaseServerClient } from "@/providers/supabase";
 *   const supabase = await createSupabaseServerClient();
 */
export async function createSupabaseServerClient() {
  // Dynamic imports so this module can be imported by client components
  // without pulling in next/headers at parse time.
  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");

  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies are
            // read-only.  Mutations happen in middleware instead.
          }
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Middleware client  (used in src/middleware.ts to refresh sessions)
// Note: middleware.ts imports createServerClient directly — this helper is
// kept here for documentation / future use.
// ---------------------------------------------------------------------------

// Re-export createServerClient so middleware.ts can import it without needing
// a runtime require() with type arguments.
export { createServerClient as createSupabaseMiddlewareClient } from "@supabase/ssr";
