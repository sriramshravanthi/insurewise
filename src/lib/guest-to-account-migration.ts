import type { SupabaseClient } from "@supabase/supabase-js";
import type { Household } from "@/schemas/household";
import { clearHouseholds, loadHouseholds } from "./guest-households";

// docs/DATA-MODEL.md §10: "Sign-in migration: validate -> upload in a
// transaction -> confirm -> clear local copies; on failure keep local data
// and show a retry."
//
// "validate" is loadHouseholds (already quarantines anything that no longer
// passes the current schema, docs/DATA-MODEL.md §10). "upload" is injected
// as a function rather than hardcoded to a live Supabase call, so this
// orchestration is fully testable with a fake uploader and needs no real
// Supabase project (see tests/unit/lib/guest-to-account-migration.test.ts).
// On failure, local data is deliberately left in place (no clear) so the
// user can retry.

export interface MigrationResult {
  status: "migrated" | "no_data" | "failed";
  migratedCount: number;
  quarantinedCount: number;
  error?: string;
}

export type HouseholdUploadResult =
  | { success: true }
  | { success: false; error: string };

export type HouseholdUploader = (
  households: Household[],
) => Promise<HouseholdUploadResult>;

export async function migrateGuestHouseholdsToAccount(
  ownerId: string,
  upload: HouseholdUploader,
): Promise<MigrationResult> {
  const { valid, quarantined } = await loadHouseholds();

  if (valid.length === 0) {
    return { status: "no_data", migratedCount: 0, quarantinedCount: quarantined.length };
  }

  const owned = valid.map((household) => ({ ...household, ownerId }));
  const result = await upload(owned);

  if (!result.success) {
    return {
      status: "failed",
      migratedCount: 0,
      quarantinedCount: quarantined.length,
      error: result.error,
    };
  }

  await clearHouseholds();
  return {
    status: "migrated",
    migratedCount: valid.length,
    quarantinedCount: quarantined.length,
  };
}

/**
 * The real uploader, backed by Supabase. Row shape is transcribed directly
 * from the `households` columns in docs/DATA-MODEL.md §3 (id, owner_id,
 * label, state, zip5, is_sample) — the table itself is created by a Phase 7
 * migration (docs/DATA-MODEL.md line 4), not yet written, so this call has
 * nothing live to reach until that exists.
 */
export function createSupabaseHouseholdUploader(
  client: SupabaseClient,
): HouseholdUploader {
  return async (households) => {
    const rows = households.map((h) => ({
      id: h.id,
      owner_id: h.ownerId,
      label: h.label ?? null,
      state: h.state,
      zip5: h.zip5 ?? null,
      is_sample: h.isSample,
    }));
    const { error } = await client.from("households").insert(rows);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };
}
