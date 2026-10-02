"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseClient } from "@/lib/supabase-client";
import { signInWithGoogle, signInWithMagicLink, signOut } from "@/lib/auth";
import { useAuthSession } from "./use-auth-session";

const MIGRATION_MESSAGES: Record<string, string> = {
  migrated: "Moved your guest household from this device to your account.",
  no_data: "No guest data on this device to move.",
  failed:
    "Couldn't move your guest data to your account yet — it's still saved on this device. Try again.",
};

export function SignIn() {
  const { configState, session, migration } = useAuthSession();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  if (configState === "not_configured") {
    return (
      <div className="max-w-md space-y-2">
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Sign-in isn&apos;t configured in this environment yet. Guest mode
          works fully without it — your data stays on this device.
        </p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="max-w-md space-y-3">
        <h1 className="text-lg font-semibold">Signed in</h1>
        <p className="text-sm text-muted-foreground">
          {session.user.email ?? "Signed in"}
        </p>
        {migration && (
          <p className="text-sm text-muted-foreground">
            {MIGRATION_MESSAGES[migration.status]}
          </p>
        )}
        <Button
          onClick={() => {
            const client = createSupabaseClient();
            if (client) void signOut(client);
          }}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-lg font-semibold">Sign in</h1>
      <p className="text-sm text-muted-foreground">
        Sign in only to save your data across devices. Guest mode on this
        device keeps working either way, and nothing here is required to use
        InsureWise.
      </p>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const client = createSupabaseClient();
          if (!client) return;
          void signInWithMagicLink(client, email).then((result) => {
            setStatus(
              result.status === "ok"
                ? "Check your email for a sign-in link."
                : `Couldn't send the link: ${result.message}`,
            );
          });
        }}
      >
        <Label htmlFor="sign-in-email">Email</Label>
        <Input
          id="sign-in-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit">Send magic link</Button>
      </form>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const client = createSupabaseClient();
          if (client) void signInWithGoogle(client);
        }}
      >
        Continue with Google
      </Button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
