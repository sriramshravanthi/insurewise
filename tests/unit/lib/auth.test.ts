import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getCurrentSession,
  onAuthStateChange,
  signInWithGoogle,
  signInWithMagicLink,
  signOut,
} from "@/lib/auth";

// A fake Supabase client shaped to just the `auth` methods this module
// calls, so these are testable without a real Supabase project
// (docs/PRD.md PLT-2; no production account needed).
function createFakeClient(overrides: Partial<SupabaseClient["auth"]> = {}) {
  return {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      ...overrides,
    },
  } as unknown as SupabaseClient;
}

describe("auth (docs/PRD.md PLT-2: magic link, Google)", () => {
  it("sends a magic link", async () => {
    const client = createFakeClient();
    const result = await signInWithMagicLink(client, "a@example.com");
    expect(result).toEqual({ status: "ok" });
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "a@example.com",
    });
  });

  it("reports an error from the magic-link call", async () => {
    const client = createFakeClient({
      signInWithOtp: vi
        .fn()
        .mockResolvedValue({ error: { message: "rate limited" } }),
    });
    const result = await signInWithMagicLink(client, "a@example.com");
    expect(result).toEqual({ status: "error", message: "rate limited" });
  });

  it("signs in with Google", async () => {
    const client = createFakeClient();
    const result = await signInWithGoogle(client);
    expect(result).toEqual({ status: "ok" });
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
    });
  });

  it("signs out", async () => {
    const client = createFakeClient();
    const result = await signOut(client);
    expect(result).toEqual({ status: "ok" });
    expect(client.auth.signOut).toHaveBeenCalled();
  });

  it("reads the current session", async () => {
    const session = { user: { id: "u1" } };
    const client = createFakeClient({
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
    });
    await expect(getCurrentSession(client)).resolves.toBe(session);
  });

  it("subscribes to auth state changes and can unsubscribe", () => {
    const unsubscribe = vi.fn();
    const onAuthStateChangeMock = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    const client = createFakeClient({
      onAuthStateChange: onAuthStateChangeMock,
    });
    const callback = vi.fn();

    const subscription = onAuthStateChange(client, callback);
    expect(onAuthStateChangeMock).toHaveBeenCalled();

    const registeredHandler = onAuthStateChangeMock.mock.calls[0][0];
    const session = { user: { id: "u1" } };
    registeredHandler("SIGNED_IN", session);
    expect(callback).toHaveBeenCalledWith(session);

    subscription.unsubscribe();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
