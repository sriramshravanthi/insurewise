"use client";

/**
 * QueryProvider — wraps the app with TanStack QueryClient.
 * Must be a Client Component because QueryClientProvider uses React context.
 */

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures each request gets its own client in SSR/RSC environments.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus in development (noisy)
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Retry once on failure; network errors get one more chance
            retry: 1,
            // 30 s stale time by default; individual queries can tighten this
            staleTime: 30 * 1000,
          },
          mutations: {
            // Mutations don't retry by default — user action is idempotent-unsafe
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
