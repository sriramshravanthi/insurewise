import { beforeEach, describe, expect, it } from "vitest";
import {
  clearHouseholds,
  deleteHousehold,
  loadHouseholds,
  saveHousehold,
} from "@/lib/guest-households";
import type { Household } from "@/schemas/household";
import { putRecord } from "@/lib/guest-storage";

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

describe("guest-households", () => {
  it("saves and loads a household", async () => {
    await saveHousehold(HOUSEHOLD);
    const { valid, quarantined } = await loadHouseholds();
    expect(valid).toEqual([HOUSEHOLD]);
    expect(quarantined).toEqual([]);
  });

  it("rejects saving an invalid household before it ever reaches storage", async () => {
    await expect(
      saveHousehold({ ...HOUSEHOLD, state: "California" }),
    ).rejects.toThrow();
    expect((await loadHouseholds()).valid).toEqual([]);
  });

  it("deletes a household by id", async () => {
    await saveHousehold(HOUSEHOLD);
    await deleteHousehold(HOUSEHOLD.id);
    expect((await loadHouseholds()).valid).toEqual([]);
  });

  it('quarantines a record that was valid once but no longer passes the current schema ("couldn\'t restore this item", docs/DATA-MODEL.md §10)', async () => {
    // Simulate a record stored before a stricter schema rule existed, by
    // writing directly to the generic store, bypassing saveHousehold's
    // validation.
    await putRecord("households", {
      id: HOUSEHOLD.id,
      state: "California", // no longer valid: must be exactly 2 letters
      isSample: false,
    });

    const { valid, quarantined } = await loadHouseholds();
    expect(valid).toEqual([]);
    expect(quarantined).toHaveLength(1);
    expect(quarantined[0].id).toBe(HOUSEHOLD.id);
  });

  it("clears every household", async () => {
    await saveHousehold(HOUSEHOLD);
    await clearHouseholds();
    expect((await loadHouseholds()).valid).toEqual([]);
  });
});
