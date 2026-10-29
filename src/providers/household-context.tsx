"use client";

/**
 * HouseholdContext — loads the user's household + all nested rows via
 * TanStack Query and exposes typed selector hooks.
 *
 * Wrap the authenticated layout with <HouseholdProvider>.
 */

import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loadHousehold,
  getOrCreateHousehold,
  createPolicy,
  updatePolicy,
  deletePolicy,
  upsertCoverage,
  createVehicle,
  updateVehicle,
  createProperty,
  updateProperty,
  updateHousehold,
  type HouseholdPayload,
  type DbResult,
} from "./household";
import type {
  HouseholdRow,
  VehicleRow,
  DriverRow,
  PropertyRow,
  PolicyRow,
  PolicyCoverageRow,
} from "./database.types";
import { qk } from "@/lib/query-keys";
import { useUser } from "./auth-context";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface HouseholdContextValue {
  householdId: string | null;
  /** true while the first load is in flight */
  loading: boolean;
  error: string | null;
  payload: HouseholdPayload | null;
}

const HouseholdContext = createContext<HouseholdContextValue>({
  householdId: null,
  loading: false,
  error: null,
  payload: null,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const queryClient = useQueryClient();

  // Step 1: resolve (or create) the household ID for this user
  const householdQuery = useQuery({
    queryKey: qk.households(),
    queryFn: async () => {
      if (!user) return null;
      const result = await getOrCreateHousehold(user.id);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min — household row rarely changes
  });

  const householdId = householdQuery.data?.id ?? null;

  // Step 2: load the full payload once we have an ID
  const payloadQuery = useQuery({
    queryKey: householdId ? qk.household(householdId) : (["household", null] as const),
    queryFn: async () => {
      if (!householdId) return null;
      const result = await loadHousehold(householdId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: !!householdId,
    staleTime: 30 * 1000, // 30 s — user data can change
  });

  const loading = householdQuery.isLoading || (!!householdId && payloadQuery.isLoading);
  const error =
    (householdQuery.error instanceof Error ? householdQuery.error.message : null) ??
    (payloadQuery.error instanceof Error ? payloadQuery.error.message : null);

  return (
    <HouseholdContext.Provider
      value={{
        householdId,
        loading,
        error,
        payload: payloadQuery.data ?? null,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Selector hooks
// ---------------------------------------------------------------------------

export function useHousehold(): HouseholdContextValue {
  return useContext(HouseholdContext);
}

export function useHouseholdRow(): HouseholdRow | null {
  return useContext(HouseholdContext).payload?.household ?? null;
}

export function usePolicies(): PolicyRow[] {
  return useContext(HouseholdContext).payload?.policies ?? [];
}

export function useVehicles(): VehicleRow[] {
  return useContext(HouseholdContext).payload?.vehicles ?? [];
}

export function useDrivers(): DriverRow[] {
  return useContext(HouseholdContext).payload?.drivers ?? [];
}

export function useProperties(): PropertyRow[] {
  return useContext(HouseholdContext).payload?.properties ?? [];
}

export function useCoverages(): PolicyCoverageRow[] {
  return useContext(HouseholdContext).payload?.coverages ?? [];
}

/** Coverages filtered to a specific policy. */
export function usePolicyCoverages(policyId: string): PolicyCoverageRow[] {
  const coverages = useContext(HouseholdContext).payload?.coverages ?? [];
  return coverages.filter((c) => c.policy_id === policyId);
}

// ---------------------------------------------------------------------------
// Mutation hooks (invalidate household payload on success)
// ---------------------------------------------------------------------------

function useInvalidate() {
  const qc = useQueryClient();
  const { householdId } = useContext(HouseholdContext);
  return () => {
    if (householdId) {
      qc.invalidateQueries({ queryKey: qk.household(householdId) });
    }
  };
}

// -- Policies --

export function useCreatePolicy() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (policy: Omit<PolicyRow, "id" | "created_at" | "updated_at">) =>
      createPolicy(policy),
    onSuccess: (result: DbResult<PolicyRow>) => {
      if (result.ok) invalidate();
    },
  });
}

export function useUpdatePolicy() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<PolicyRow, "id" | "household_id" | "created_at">>;
    }) => updatePolicy(id, patch),
    onSuccess: (result: DbResult<PolicyRow>) => {
      if (result.ok) invalidate();
    },
  });
}

export function useDeletePolicy() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deletePolicy(id),
    onSuccess: (result: DbResult<void>) => {
      if (result.ok) invalidate();
    },
  });
}

// -- Coverages --

export function useUpsertCoverage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (
      coverage: Omit<PolicyCoverageRow, "id" | "created_at" | "updated_at"> & { id?: string }
    ) => upsertCoverage(coverage),
    onSuccess: (result: DbResult<PolicyCoverageRow>) => {
      if (result.ok) invalidate();
    },
  });
}

// -- Vehicles --

export function useCreateVehicle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vehicle: Omit<VehicleRow, "id" | "created_at" | "updated_at">) =>
      createVehicle(vehicle),
    onSuccess: (result: DbResult<VehicleRow>) => {
      if (result.ok) invalidate();
    },
  });
}

export function useUpdateVehicle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<VehicleRow, "id" | "household_id" | "created_at">>;
    }) => updateVehicle(id, patch),
    onSuccess: (result: DbResult<VehicleRow>) => {
      if (result.ok) invalidate();
    },
  });
}

// -- Properties --

export function useCreateProperty() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (property: Omit<PropertyRow, "id" | "created_at" | "updated_at">) =>
      createProperty(property),
    onSuccess: (result: DbResult<PropertyRow>) => {
      if (result.ok) invalidate();
    },
  });
}

export function useUpdateProperty() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<PropertyRow, "id" | "household_id" | "created_at">>;
    }) => updateProperty(id, patch),
    onSuccess: (result: DbResult<PropertyRow>) => {
      if (result.ok) invalidate();
    },
  });
}

// -- Household --

export function useUpdateHousehold() {
  const invalidate = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Pick<HouseholdRow, "label" | "state"> & { zip5?: string | null };
    }) => updateHousehold(id, patch),
    onSuccess: (result: DbResult<HouseholdRow>) => {
      if (result.ok) {
        invalidate();
        qc.invalidateQueries({ queryKey: qk.households() });
      }
    },
  });
}
