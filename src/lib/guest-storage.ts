import type { z } from "zod";

// docs/DATA-MODEL.md §10: "IndexedDB database `insurewise` with object
// stores mirroring user tables, each record carrying `schema_version`. On
// load, records are validated with current schemas; failing records are
// quarantined with a user-visible 'couldn't restore this item' state."
//
// This module implements the "validate" step (loadValidated) and the
// "clear local copies" step (clearStore, via clearHouseholds). The
// "upload"/"confirm" steps of the sign-in migration live in
// src/lib/guest-to-account-migration.ts, which calls back into this module.

const DATABASE_NAME = "insurewise";
const DATABASE_VERSION = 1;

// Additive per docs/DATA-MODEL.md §12 ("additive changes preferred"): add
// new store names here and bump DATABASE_VERSION when a new entity needs
// guest storage.
export const GUEST_STORE_NAMES = ["households"] as const;
export type GuestStoreName = (typeof GUEST_STORE_NAMES)[number];

export interface QuarantinedRecord {
  id: string;
  reason: string;
  raw: unknown;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of GUEST_STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  storeName: GuestStoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const request = run(tx.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export async function putRecord(
  storeName: GuestStoreName,
  record: { id: string } & Record<string, unknown>,
): Promise<void> {
  await withStore(storeName, "readwrite", (store) => store.put(record));
}

export async function deleteRecord(
  storeName: GuestStoreName,
  id: string,
): Promise<void> {
  await withStore(storeName, "readwrite", (store) => store.delete(id));
}

export async function clearStore(storeName: GuestStoreName): Promise<void> {
  await withStore(storeName, "readwrite", (store) => store.clear());
}

export async function getAllRecords(
  storeName: GuestStoreName,
): Promise<unknown[]> {
  return withStore(storeName, "readonly", (store) => store.getAll());
}

function recordId(record: unknown): string {
  if (
    typeof record === "object" &&
    record !== null &&
    "id" in record &&
    typeof (record as { id: unknown }).id === "string"
  ) {
    return (record as { id: string }).id;
  }
  return "unknown";
}

/**
 * Validates every record in a store against the current schema. Invalid
 * records are quarantined rather than dropped or thrown (docs/DATA-MODEL.md
 * §10) so the UI can show a "couldn't restore this item" state.
 */
export async function loadValidated<T>(
  storeName: GuestStoreName,
  schema: z.ZodType<T>,
): Promise<{ valid: T[]; quarantined: QuarantinedRecord[] }> {
  const records = await getAllRecords(storeName);
  const valid: T[] = [];
  const quarantined: QuarantinedRecord[] = [];

  for (const record of records) {
    const parsed = schema.safeParse(record);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      quarantined.push({
        id: recordId(record),
        reason: parsed.error.issues.map((issue) => issue.message).join("; "),
        raw: record,
      });
    }
  }

  return { valid, quarantined };
}
