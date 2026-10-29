/**
 * Auth helpers — thin wrappers over Supabase Auth.
 * All functions return typed results; they never throw.
 */

import { getSupabaseBrowserClient } from "./supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Result type (avoids thrown exceptions in the UI layer)
// ---------------------------------------------------------------------------

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function wrapError(err: AuthError | Error | unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Current session / user (client-side)
// ---------------------------------------------------------------------------

export async function getSession(): Promise<Session | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const sb = getSupabaseBrowserClient();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

// ---------------------------------------------------------------------------
// Sign-in with magic link (email OTP — no password stored)
// ---------------------------------------------------------------------------

export async function signInWithEmail(
  email: string
): Promise<AuthResult<void>> {
  try {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
      },
    });
    if (error) return { ok: false, error: wrapError(error) };
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: wrapError(err) };
  }
}

// ---------------------------------------------------------------------------
// OAuth (Google) — optional, wired to same redirect
// ---------------------------------------------------------------------------

export async function signInWithGoogle(): Promise<AuthResult<void>> {
  try {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
      },
    });
    if (error) return { ok: false, error: wrapError(error) };
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: wrapError(err) };
  }
}

// ---------------------------------------------------------------------------
// Sign-out
// ---------------------------------------------------------------------------

export async function signOut(): Promise<AuthResult<void>> {
  try {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.auth.signOut();
    if (error) return { ok: false, error: wrapError(error) };
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: wrapError(err) };
  }
}

// ---------------------------------------------------------------------------
// Auth state change listener (for React context)
// ---------------------------------------------------------------------------

export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const sb = getSupabaseBrowserClient();
  const { data: subscription } = sb.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.subscription.unsubscribe();
}
