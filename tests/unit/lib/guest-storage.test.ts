import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  clearStore,
  deleteRecord,
  getAllRecords,
  loadValidated,
  putRecord,
} from "@/lib/guest-storage";

// The generic mechanism is schema-agnostic; this is a minimal stand-in
// schema distinct from any real domain schema, to test loadValidated's
// validate/quarantine behavior in isolation.
const TestRecordSchema = z.object({ id: z.string(), value: z.number() });

beforeEach(async () => {
  await clearStore("households");
});

describe("guest-storage (docs/DATA-MODEL.md §10)", () => {
  it("round-trips a record through putRecord and getAllRecords", async () => {
    await putRecord("households", { id: "a", value: 1 });
    const records = await getAllRecords("households");
    expect(records).toEqual([{ id: "a", value: 1 }]);
  });

  it("overwrites a record with the same id", async () => {
    await putRecord("households", { id: "a", value: 1 });
    await putRecord("households", { id: "a", value: 2 });
    const records = await getAllRecords("households");
    expect(records).toEqual([{ id: "a", value: 2 }]);
  });

  it("deletes a record by id", async () => {
    await putRecord("households", { id: "a", value: 1 });
    await putRecord("households", { id: "b", value: 2 });
    await deleteRecord("households", "a");
    const records = await getAllRecords("households");
    expect(records).toEqual([{ id: "b", value: 2 }]);
  });

  it("clears every record in a store", async () => {
    await putRecord("households", { id: "a", value: 1 });
    await putRecord("households", { id: "b", value: 2 });
    await clearStore("households");
    expect(await getAllRecords("households")).toEqual([]);
  });

  it("validates records against the current schema, returning them as-is", async () => {
    await putRecord("households", { id: "a", value: 1 });
    const { valid, quarantined } = await loadValidated(
      "households",
      TestRecordSchema,
    );
    expect(valid).toEqual([{ id: "a", value: 1 }]);
    expect(quarantined).toEqual([]);
  });

  it('quarantines a record that fails validation, with a "couldn\'t restore" reason (docs/DATA-MODEL.md §10)', async () => {
    await putRecord("households", { id: "a", value: "not-a-number" });
    const { valid, quarantined } = await loadValidated(
      "households",
      TestRecordSchema,
    );
    expect(valid).toEqual([]);
    expect(quarantined).toHaveLength(1);
    expect(quarantined[0].id).toBe("a");
    expect(quarantined[0].raw).toEqual({ id: "a", value: "not-a-number" });
    expect(quarantined[0].reason.length).toBeGreaterThan(0);
  });

  it("separates valid and quarantined records in a mixed store, without dropping either", async () => {
    await putRecord("households", { id: "good", value: 1 });
    await putRecord("households", { id: "bad", value: "oops" });
    const { valid, quarantined } = await loadValidated(
      "households",
      TestRecordSchema,
    );
    expect(valid).toEqual([{ id: "good", value: 1 }]);
    expect(quarantined.map((q) => q.id)).toEqual(["bad"]);
  });
});
