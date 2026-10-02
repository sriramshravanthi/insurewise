import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clearHouseholds, loadHouseholds, saveHousehold } from "@/lib/guest-households";
import type { Household } from "@/schemas/household";
import {
  createSupabaseHouseholdUploader,
  migrateGuestHouseholdsToAccount,
  type HouseholdUploadResult,
} from "@/lib/guest-to-account-migration";

const HOUSEHOLD: Household = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  label: "My household",
  state: "CA",
  zip5: "90210",
  isSample: false,
};

beforeEach(async () => {
  await clearHouseholds();
});

describe("migrateGuestHouseholdsToAccount (docs/DATA-MODEL.md §10)", () => {
  it("reports no_data when there is nothing on this device to migrate", async () => {
    const upload = vi.fn();
    const result = await migrateGuestHouseholdsToAccount("owner-1", upload);
    expect(result).toEqual({ status: "no_data", migratedCount: 0, quarantinedCount: 0 });
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads, then clears local copies only after the upload confirms", async () => {
    await saveHousehold(HOUSEHOLD);
    const upload = vi
      .fn<(households: Household[]) => Promise<HouseholdUploadResult>>()
      .mockResolvedValue({ success: true });

    const result = await migrateGuestHouseholdsToAccount("owner-1", upload);

    expect(result).toEqual({ status: "migrated", migratedCount: 1, quarantinedCount: 0 });
    expect(upload).toHaveBeenCalledWith([{ ...HOUSEHOLD, ownerId: "owner-1" }]);
    expect((await loadHouseholds()).valid).toEqual([]);
  });

  it("keeps local data and reports failed when the upload fails, so the user can retry", async () => {
    await saveHousehold(HOUSEHOLD);
    const upload = vi
      .fn<(households: Household[]) => Promise<HouseholdUploadResult>>()
      .mockResolvedValue({ success: false, error: "network error" });

    const result = await migrateGuestHouseholdsToAccount("owner-1", upload);

    expect(result).toEqual({
      status: "failed",
      migratedCount: 0,
      quarantinedCount: 0,
      error: "network error",
    });
    expect((await loadHouseholds()).valid).toEqual([HOUSEHOLD]);
  });
});

function createFakeClient(insertResult: { error: { message: string } | null }) {
  const insert = vi.fn().mockResolvedValue(insertResult);
  const from = vi.fn().mockReturnValue({ insert });
  return { client: { from } as unknown as SupabaseClient, insert, from };
}

describe("createSupabaseHouseholdUploader", () => {
  it("maps households to the documented `households` columns (docs/DATA-MODEL.md §3)", async () => {
    const { client, insert, from } = createFakeClient({ error: null });
    const uploader = createSupabaseHouseholdUploader(client);

    const result = await uploader([{ ...HOUSEHOLD, ownerId: "owner-1" }]);

    expect(result).toEqual({ success: true });
    expect(from).toHaveBeenCalledWith("households");
    expect(insert).toHaveBeenCalledWith([
      {
        id: HOUSEHOLD.id,
        owner_id: "owner-1",
        label: HOUSEHOLD.label,
        state: HOUSEHOLD.state,
        zip5: HOUSEHOLD.zip5,
        is_sample: HOUSEHOLD.isSample,
      },
    ]);
  });

  it("surfaces an insert error as a failed upload", async () => {
    const { client } = createFakeClient({ error: { message: "table not found" } });
    const uploader = createSupabaseHouseholdUploader(client);

    const result = await uploader([{ ...HOUSEHOLD, ownerId: "owner-1" }]);

    expect(result).toEqual({ success: false, error: "table not found" });
  });
});
