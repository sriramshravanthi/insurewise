"use client";

/**
 * AuthContext — provides the current Supabase User to the React tree.
 * Wrap the app root with <AuthProvider>.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase";

interface AuthContextValue {
  user: User | null;
  /** true while the initial session check is in flight */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();

    // Hydrate from existing session
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    // Subscribe to future changes
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function useUser(): User | null {
  return useContext(AuthContext).user;
}

export function useRequireAuth(): User {
  const { user, loading } = useContext(AuthContext);
  if (!loading && !user) {
    // In real usage, middleware redirects before this fires.
    throw new Error("useRequireAuth: no authenticated user.");
  }
  // Non-null assertion is safe after the loading guard above
  return user!;
}
