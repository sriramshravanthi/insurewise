/**
 * Barrel export for all providers and hooks.
 *
 * Import from "@/providers" in components.
 */

// Auth
export { AuthProvider, useAuth, useUser, useRequireAuth } from "./auth-context";

// Household data + mutation hooks
export {
  HouseholdProvider,
  useHousehold,
  useHouseholdRow,
  usePolicies,
  useVehicles,
  useDrivers,
  useProperties,
  useCoverages,
  usePolicyCoverages,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  useUpsertCoverage,
  useCreateVehicle,
  useUpdateVehicle,
  useCreateProperty,
  useUpdateProperty,
  useUpdateHousehold,
} from "./household-context";

// TanStack Query
export { QueryProvider } from "./query-provider";

// Supabase clients (for advanced use)
export {
  getSupabaseBrowserClient,
  createSupabaseServerClient,
} from "./supabase";

// Auth helpers
export {
  signInWithEmail,
  signInWithGoogle,
  signOut,
  getSession,
  getUser,
  onAuthStateChange,
  type AuthResult,
} from "./auth";

// DB result type
export type { DbResult, HouseholdPayload } from "./household";
