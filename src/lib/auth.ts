import type { Session, SupabaseClient } from "@supabase/supabase-js";

// docs/PRD.md PLT-2: "Sign-in (magic link, Google) only to save across
// devices; guest data migrates." Only those two methods are implemented —
// no other provider is documented.
//
// Every function here takes the client as a parameter (rather than reaching
// for a module-level singleton) so it can be exercised in tests with a fake
// client, without a real Supabase project (no production account needed).

export interface AuthResult {
  status: "ok" | "error";
  message?: string;
}

export async function signInWithMagicLink(
  client: SupabaseClient,
  email: string,
): Promise<AuthResult> {
  const { error } = await client.auth.signInWithOtp({ email });
  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "ok" };
}

export async function signInWithGoogle(
  client: SupabaseClient,
): Promise<AuthResult> {
  const { error } = await client.auth.signInWithOAuth({ provider: "google" });
  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "ok" };
}

export async function signOut(client: SupabaseClient): Promise<AuthResult> {
  const { error } = await client.auth.signOut();
  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "ok" };
}

export async function getCurrentSession(
  client: SupabaseClient,
): Promise<Session | null> {
  const { data } = await client.auth.getSession();
  return data.session;
}

export function onAuthStateChange(
  client: SupabaseClient,
  callback: (session: Session | null) => void,
): { unsubscribe: () => void } {
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return { unsubscribe: () => subscription.unsubscribe() };
}
