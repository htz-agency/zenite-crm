/**
 * Field History — In-memory tracking of field changes for CRM entities.
 *
 * Stores change entries locally (sessionStorage-backed) so detail pages
 * can show "last changed X ago" badges and a timeline feed.
 */

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export interface FieldHistoryEntry {
  entity_type: string;
  entity_id: string;
  field_key: string;
  old_value: string | number | boolean | null;
  new_value: string | number | boolean | null;
  changed_at: string; // ISO date string
  changed_by?: string;
}

interface EntityRef {
  entity_type: string;
  entity_id: string;
}

interface FieldRef extends EntityRef {
  field_key: string;
}

/* ================================================================== */
/*  In-memory store (session-scoped)                                   */
/* ================================================================== */

const STORAGE_KEY = "zenite_field_history";

function loadStore(): FieldHistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStore(entries: FieldHistoryEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded — silently ignore
  }
}

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

/** Record a field value change */
export function recordChange(entry: FieldHistoryEntry): void {
  const store = loadStore();
  store.push({
    ...entry,
    changed_at: entry.changed_at || new Date().toISOString(),
  });
  saveStore(store);
}

/** Seed an initial value (only if no entry exists for this field yet) */
export function seedInitialValue(entry: FieldHistoryEntry): void {
  const store = loadStore();
  const exists = store.some(
    (e) =>
      e.entity_type === entry.entity_type &&
      e.entity_id === entry.entity_id &&
      e.field_key === entry.field_key
  );
  if (!exists) {
    store.push({
      ...entry,
      changed_at: entry.changed_at || new Date().toISOString(),
    });
    saveStore(store);
  }
}

/** Get the last change date for a specific field on an entity */
export function getLastChangeDate(ref: FieldRef): string | null {
  const store = loadStore();
  const matching = store
    .filter(
      (e) =>
        e.entity_type === ref.entity_type &&
        e.entity_id === ref.entity_id &&
        e.field_key === ref.field_key
    )
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  return matching.length > 0 ? matching[0].changed_at : null;
}

/** Get all history entries for an entity, newest first */
export function getEntityHistory(ref: EntityRef): FieldHistoryEntry[] {
  const store = loadStore();
  return store
    .filter(
      (e) => e.entity_type === ref.entity_type && e.entity_id === ref.entity_id
    )
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
}
