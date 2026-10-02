import { HouseholdSchema, type Household } from "@/schemas/household";
import {
  clearStore,
  deleteRecord,
  loadValidated,
  putRecord,
  type QuarantinedRecord,
} from "./guest-storage";

const STORE_NAME = "households" as const;

export async function saveHousehold(household: Household): Promise<void> {
  const validated = HouseholdSchema.parse(household);
  await putRecord(STORE_NAME, validated);
}

export async function loadHouseholds(): Promise<{
  valid: Household[];
  quarantined: QuarantinedRecord[];
}> {
  return loadValidated(STORE_NAME, HouseholdSchema);
}

export async function deleteHousehold(id: string): Promise<void> {
  await deleteRecord(STORE_NAME, id);
}

export async function clearHouseholds(): Promise<void> {
  await clearStore(STORE_NAME);
}
