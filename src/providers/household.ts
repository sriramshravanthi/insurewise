/**
 * Household data-access layer.
 *
 * - All mutations go through the browser client (RLS enforces ownership).
 * - Every function returns a typed Result; callers never need try/catch.
 * - "Sample household" copy: duplicates the fixture into the user's own space.
 */

import { getSupabaseBrowserClient } from "./supabase";
import type {
  HouseholdRow,
  VehicleRow,
  DriverRow,
  PropertyRow,
  PolicyRow,
  PolicyCoverageRow,
} from "./database.types";

// ---------------------------------------------------------------------------
// Result wrapper
// ---------------------------------------------------------------------------

export type DbResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function wrap<T>(data: T): DbResult<T> {
  return { ok: true, data };
}
function fail(msg: string): DbResult<never> {
  return { ok: false, error: msg };
}
function pgErr(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Database error.";
}

// ---------------------------------------------------------------------------
// Full household payload (all nested rows in one fetch)
// ---------------------------------------------------------------------------

export interface HouseholdPayload {
  household: HouseholdRow;
  vehicles: VehicleRow[];
  drivers: DriverRow[];
  properties: PropertyRow[];
  policies: PolicyRow[];
  coverages: PolicyCoverageRow[];
}

// ---------------------------------------------------------------------------
// Load household + related rows for the current user
// ---------------------------------------------------------------------------

export async function loadHousehold(
  householdId: string
): Promise<DbResult<HouseholdPayload>> {
  const sb = getSupabaseBrowserClient();

  const [hRes, vRes, dRes, prRes, poRes] = await Promise.all([
    sb.from("households").select("*").eq("id", householdId).single(),
    sb.from("vehicles").select("*").eq("household_id", householdId),
    sb.from("drivers").select("*").eq("household_id", householdId),
    sb.from("properties").select("*").eq("household_id", householdId),
    sb.from("policies").select("*").eq("household_id", householdId),
  ]);

  if (hRes.error) return fail(pgErr(hRes.error));
  if (vRes.error) return fail(pgErr(vRes.error));
  if (dRes.error) return fail(pgErr(dRes.error));
  if (prRes.error) return fail(pgErr(prRes.error));
  if (poRes.error) return fail(pgErr(poRes.error));

  const policyIds = (poRes.data ?? []).map((p) => p.id);
  let coverages: PolicyCoverageRow[] = [];

  if (policyIds.length > 0) {
    const cRes = await sb
      .from("policy_coverages")
      .select("*")
      .in("policy_id", policyIds);
    if (cRes.error) return fail(pgErr(cRes.error));
    coverages = cRes.data ?? [];
  }

  return wrap({
    household: hRes.data as HouseholdRow,
    vehicles: (vRes.data ?? []) as VehicleRow[],
    drivers: (dRes.data ?? []) as DriverRow[],
    properties: (prRes.data ?? []) as PropertyRow[],
    policies: (poRes.data ?? []) as PolicyRow[],
    coverages,
  });
}

// ---------------------------------------------------------------------------
// Get the first household for the current user (MVP: one household)
// ---------------------------------------------------------------------------

export async function getOrCreateHousehold(
  userId: string
): Promise<DbResult<HouseholdRow>> {
  const sb = getSupabaseBrowserClient();

  // Try to find existing
  const { data: existing, error: selErr } = await sb
    .from("households")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selErr) return fail(pgErr(selErr));
  if (existing) return wrap(existing as HouseholdRow);

  // Create a new empty household
  const { data: created, error: insErr } = await sb
    .from("households")
    .insert({ owner_id: userId, label: "My Household", state: "CA", zip5: null, is_sample: false })
    .select("*")
    .single();

  if (insErr) return fail(pgErr(insErr));
  return wrap(created as HouseholdRow);
}

// ---------------------------------------------------------------------------
// Policy CRUD
// ---------------------------------------------------------------------------

export async function createPolicy(
  policy: Omit<PolicyRow, "id" | "created_at" | "updated_at">
): Promise<DbResult<PolicyRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("policies")
    .insert(policy)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as PolicyRow);
}

export async function updatePolicy(
  id: string,
  patch: Partial<Omit<PolicyRow, "id" | "household_id" | "created_at">>
): Promise<DbResult<PolicyRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("policies")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as PolicyRow);
}

export async function deletePolicy(id: string): Promise<DbResult<void>> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb.from("policies").delete().eq("id", id);
  if (error) return fail(pgErr(error));
  return wrap(undefined);
}

// ---------------------------------------------------------------------------
// Coverage CRUD
// ---------------------------------------------------------------------------

export async function upsertCoverage(
  coverage: Omit<PolicyCoverageRow, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<DbResult<PolicyCoverageRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("policy_coverages")
    .upsert(coverage)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as PolicyCoverageRow);
}

// ---------------------------------------------------------------------------
// Vehicle CRUD
// ---------------------------------------------------------------------------

export async function createVehicle(
  vehicle: Omit<VehicleRow, "id" | "created_at" | "updated_at">
): Promise<DbResult<VehicleRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("vehicles")
    .insert(vehicle)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as VehicleRow);
}

export async function updateVehicle(
  id: string,
  patch: Partial<Omit<VehicleRow, "id" | "household_id" | "created_at">>
): Promise<DbResult<VehicleRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("vehicles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as VehicleRow);
}

// ---------------------------------------------------------------------------
// Property CRUD
// ---------------------------------------------------------------------------

export async function createProperty(
  property: Omit<PropertyRow, "id" | "created_at" | "updated_at">
): Promise<DbResult<PropertyRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("properties")
    .insert(property)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as PropertyRow);
}

export async function updateProperty(
  id: string,
  patch: Partial<Omit<PropertyRow, "id" | "household_id" | "created_at">>
): Promise<DbResult<PropertyRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as PropertyRow);
}

// ---------------------------------------------------------------------------
// Household label / state update
// ---------------------------------------------------------------------------

export async function updateHousehold(
  id: string,
  patch: Pick<HouseholdRow, "label" | "state"> & { zip5?: string | null }
): Promise<DbResult<HouseholdRow>> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("households")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(pgErr(error));
  return wrap(data as HouseholdRow);
}
