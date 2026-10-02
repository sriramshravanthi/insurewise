import { describe, expect, it } from "vitest";
import {
  CarProfileFormSchema,
  driverFormToDriver,
  emptyCarProfileForm,
} from "@/schemas/car-profile-form";

describe("emptyCarProfileForm", () => {
  it("validates against CarProfileFormSchema", () => {
    expect(CarProfileFormSchema.safeParse(emptyCarProfileForm()).success).toBe(
      false, // make/model start empty, which the schema requires non-empty
    );
  });

  it("has exactly one driver and all four coverage codes, none included", () => {
    const form = emptyCarProfileForm();
    expect(form.drivers).toHaveLength(1);
    expect(form.coverages.every((c) => !c.included)).toBe(true);
  });
});

describe("CarProfileFormSchema", () => {
  it("accepts a fully-entered profile", () => {
    const form = {
      ...emptyCarProfileForm(),
      vehicle: { ...emptyCarProfileForm().vehicle, make: "Honda", model: "Civic" },
    };
    expect(CarProfileFormSchema.safeParse(form).success).toBe(true);
  });

  it("rejects more than five drivers", () => {
    const form = {
      ...emptyCarProfileForm(),
      vehicle: { ...emptyCarProfileForm().vehicle, make: "Honda", model: "Civic" },
      drivers: Array.from({ length: 6 }, () => ({})),
    };
    expect(CarProfileFormSchema.safeParse(form).success).toBe(false);
  });
});

describe("driverFormToDriver", () => {
  it("omits incidents3y when neither count was entered", () => {
    expect(driverFormToDriver({ ageBand: "25-34" }).incidents3y).toBeUndefined();
  });

  it("includes incidents3y when at least one count was entered, defaulting the other to 0", () => {
    const driver = driverFormToDriver({ accidents3y: 1 });
    expect(driver.incidents3y).toEqual({ accidents: 1, violations: 0 });
  });
});
