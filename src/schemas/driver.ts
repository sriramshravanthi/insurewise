import { z } from "zod";

// docs/DATA-MODEL.md "drivers" table. ageBand/yearsLicensedBand are opaque
// free-text placeholders — see the note in vehicle.ts on INK-5.
export const DriverIncidentsSchema = z.object({
  accidents: z.number().int().nonnegative(),
  violations: z.number().int().nonnegative(),
});
export type DriverIncidents = z.infer<typeof DriverIncidentsSchema>;

export const DriverSchema = z.object({
  /** Opaque band label — see the file-level note in vehicle.ts on INK-5. */
  ageBand: z.string().min(1).max(40).optional(),
  /** Opaque band label — see the file-level note in vehicle.ts on INK-5. */
  yearsLicensedBand: z.string().min(1).max(40).optional(),
  incidents3y: DriverIncidentsSchema.optional(),
  /** References a vehicle within the same car profile, if one is primary. */
  primaryVehicleId: z.string().min(1).optional(),
});
export type Driver = z.infer<typeof DriverSchema>;
