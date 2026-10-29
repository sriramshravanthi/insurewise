"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase-client";
import { getCurrentSession, onAuthStateChange } from "@/lib/auth";
import {
  createSupabaseHouseholdUploader,
  migrateGuestHouseholdsToAccount,
  type MigrationResult,
} from "@/lib/guest-to-account-migration";

export type AuthConfigState = "not_configured" | "ready";

export interface AuthSessionState {
  configState: AuthConfigState;
  session: Session | null;
  migration: MigrationResult | null;
}

/**
 * Tracks the current Supabase session and, on each new sign-in, runs the
 * guest-to-account migration exactly once (docs/DATA-MODEL.md §10). When
 * Supabase isn't configured (no live project in this environment), this
 * reports "not_configured" and guest mode keeps working untouched
 * (docs/PRD.md PLT-1).
 */
export function useAuthSession(): AuthSessionState {
  const client = useMemo(() => createSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [migration, setMigration] = useState<MigrationResult | null>(null);
  const migratedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!client) return;
    let active = true;
    getCurrentSession(client).then((current) => {
      if (active) setSession(current);
    });
    const { unsubscribe } = onAuthStateChange(client, (next) => {
      if (active) setSession(next);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!client || !session) return;
    const userId = session.user.id;
    if (migratedForUserId.current === userId) return;
    migratedForUserId.current = userId;

    migrateGuestHouseholdsToAccount(
      userId,
      createSupabaseHouseholdUploader(client),
    ).then(setMigration);
  }, [client, session]);

  return {
    configState: client ? "ready" : "not_configured",
    session,
    migration,
  };
}
