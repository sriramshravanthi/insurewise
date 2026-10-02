import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clearHouseholds } from "@/lib/guest-households";
import { SignIn } from "@/features/auth/sign-in";
import { createSupabaseClient } from "@/lib/supabase-client";

vi.mock("@/lib/supabase-client", () => ({
  createSupabaseClient: vi.fn(),
}));

function createFakeClient(session: { user: { id: string; email?: string } } | null) {
  return {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  } as unknown as SupabaseClient;
}

beforeEach(async () => {
  await clearHouseholds();
  vi.mocked(createSupabaseClient).mockReset();
});

describe("SignIn (docs/PRD.md PLT-1, PLT-2)", () => {
  it("shows guest mode is unaffected when Supabase isn't configured", () => {
    vi.mocked(createSupabaseClient).mockReturnValue(null);
    render(<SignIn />);
    expect(
      screen.getByText(/Sign-in isn't configured in this environment yet/),
    ).toBeInTheDocument();
  });

  it("sends a magic link and shows the confirmation message", async () => {
    const client = createFakeClient(null);
    vi.mocked(createSupabaseClient).mockReturnValue(client);
    render(<SignIn />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await waitFor(() => {
      expect(
        screen.getByText("Check your email for a sign-in link."),
      ).toBeInTheDocument();
    });
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "a@example.com",
    });
  });

  it("shows the signed-in state and migration outcome once a session exists", async () => {
    const client = createFakeClient({
      user: { id: "u1", email: "a@example.com" },
    });
    vi.mocked(createSupabaseClient).mockReturnValue(client);
    render(<SignIn />);

    await waitFor(() => {
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText("No guest data on this device to move."),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
