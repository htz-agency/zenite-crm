/**
 * Zenite CRM — Field History Tracking Engine
 *
 * Based on the Notion reference doc:
 *   "Zenite CRM - Rastreamento de historico de alteracoes de campos"
 *
 * Tracks field-level changes per entity, storing:
 *   - entity_type / entity_id  (which record)
 *   - field_name               (which field changed)
 *   - old_value / new_value    (before & after)
 *   - changed_by               (who made the change)
 *   - changed_at               (ISO timestamp)
 *   - change_source            ("ui" | "api" | "automation")
 *
 * The history begins when tracking is activated for a field.
 * Previous changes are NOT retroactively captured (Salesforce-like behaviour).
 *
 * Retention: entries are kept in-memory for now.
 * Future: persist via Supabase KV or dedicated table.
 */

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type ChangeSource = "ui" | "api" | "automation";

export interface FieldHistoryEntry {
  id: string;
  entity_type: string;   // e.g. "lead", "oportunidade", "conta", "contato"
  entity_id: string;     // e.g. "LD-J9K1"
  field_name: string;    // e.g. "stage", "owner", "valor"
  old_value: string | null;
  new_value: string | null;
  changed_by: string;    // user name or system identifier
  changed_at: string;    // ISO 8601 timestamp
  change_source: ChangeSource;
}

export interface TrackedFieldConfig {
  entity_type: string;
  field_name: string;
  /** Human-readable label for display */
  label?: string;
}

/* ================================================================== */
/*  In-memory store (singleton)                                        */
/* ================================================================== */

let _entries: FieldHistoryEntry[] = [];
let _idCounter = 0;
const _trackedFields = new Set<string>(); // "entity_type::field_name"

function makeKey(entityType: string, fieldName: string): string {
  return `${entityType}::${fieldName}`;
}

/* ================================================================== */
/*  Configuration — which fields are tracked                           */
/* ================================================================== */

/**
 * Enable tracking for a specific field on a specific entity type.
 * History only starts recording from this point forward.
 */
export function enableTracking(entityType: string, fieldName: string): void {
  _trackedFields.add(makeKey(entityType, fieldName));
}

/**
 * Disable tracking for a field. Existing history is kept.
 */
export function disableTracking(entityType: string, fieldName: string): void {
  _trackedFields.delete(makeKey(entityType, fieldName));
}

/**
 * Check if a field is currently being tracked.
 */
export function isTracked(entityType: string, fieldName: string): boolean {
  return _trackedFields.has(makeKey(entityType, fieldName));
}

/**
 * Return all tracked field configs.
 */
export function getTrackedFields(): TrackedFieldConfig[] {
  return Array.from(_trackedFields).map((key) => {
    const [entity_type, field_name] = key.split("::");
    return { entity_type, field_name };
  });
}

/* ================================================================== */
/*  Recording changes                                                  */
/* ================================================================== */

/**
 * Record a field change. Only records if the field is tracked
 * AND the value actually changed.
 *
 * Returns the new entry if recorded, or null if skipped.
 */
export function recordChange(params: {
  entity_type: string;
  entity_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by?: string;
  change_source?: ChangeSource;
}): FieldHistoryEntry | null {
  const {
    entity_type,
    entity_id,
    field_name,
    old_value,
    new_value,
    changed_by = "Sistema",
    change_source = "ui",
  } = params;

  // Only record if tracking is enabled for this field
  if (!_trackedFields.has(makeKey(entity_type, field_name))) {
    return null;
  }

  // Skip if value didn't actually change
  if (old_value === new_value) {
    return null;
  }

  const entry: FieldHistoryEntry = {
    id: `fh_${++_idCounter}`,
    entity_type,
    entity_id,
    field_name,
    old_value,
    new_value,
    changed_by,
    changed_at: new Date().toISOString(),
    change_source,
  };

  _entries.push(entry);
  return entry;
}

/* ================================================================== */
/*  Querying history                                                   */
/* ================================================================== */

/**
 * Get all history entries for a given entity, optionally filtered by field.
 * Ordered by changed_at descending (most recent first).
 */
export function getHistory(params: {
  entity_type: string;
  entity_id: string;
  field_name?: string;
  limit?: number;
}): FieldHistoryEntry[] {
  let results = _entries.filter(
    (e) =>
      e.entity_type === params.entity_type &&
      e.entity_id === params.entity_id &&
      (params.field_name ? e.field_name === params.field_name : true)
  );

  // Sort descending by changed_at
  results.sort((a, b) => b.changed_at.localeCompare(a.changed_at));

  if (params.limit) {
    results = results.slice(0, params.limit);
  }

  return results;
}

/**
 * Get the most recent change for a specific field on a specific entity.
 * Returns null if no history exists.
 */
export function getLastChange(params: {
  entity_type: string;
  entity_id: string;
  field_name: string;
}): FieldHistoryEntry | null {
  const results = getHistory({ ...params, limit: 1 });
  return results.length > 0 ? results[0] : null;
}

/**
 * Get the ISO timestamp of the most recent change for a field.
 * Returns null if no history exists.
 */
export function getLastChangeDate(params: {
  entity_type: string;
  entity_id: string;
  field_name: string;
}): string | null {
  const last = getLastChange(params);
  return last ? last.changed_at : null;
}

/**
 * Get full history for an entity across all tracked fields.
 * Useful for an "Historico de Alteracoes" related list on the record.
 */
export function getEntityHistory(params: {
  entity_type: string;
  entity_id: string;
  limit?: number;
}): FieldHistoryEntry[] {
  return getHistory(params);
}

/* ================================================================== */
/*  Seed / bootstrap helper                                            */
/* ================================================================== */

/**
 * Seed an initial "creation" entry for a field, representing
 * the value at the time tracking was enabled.
 * This sets the baseline so DAYS_SINCE calculations work from the start.
 */
export function seedInitialValue(params: {
  entity_type: string;
  entity_id: string;
  field_name: string;
  current_value: string | null;
  created_at?: string;  // ISO timestamp, defaults to entity creation time
  changed_by?: string;
}): FieldHistoryEntry {
  const entry: FieldHistoryEntry = {
    id: `fh_${++_idCounter}`,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    field_name: params.field_name,
    old_value: null,
    new_value: params.current_value,
    changed_by: params.changed_by ?? "Sistema",
    changed_at: params.created_at ?? new Date().toISOString(),
    change_source: "automation",
  };

  _entries.push(entry);
  return entry;
}

/* ================================================================== */
/*  Utility: clear (for testing)                                       */
/* ================================================================== */

export function clearHistory(): void {
  _entries = [];
  _idCounter = 0;
}

export function clearTracking(): void {
  _trackedFields.clear();
}

/* ================================================================== */
/*  Default tracked fields for Leads                                   */
/* ================================================================== */

// Auto-enable tracking for critical lead fields (as recommended by docs)
enableTracking("lead", "stage");
enableTracking("lead", "owner");
enableTracking("lead", "score");

// Auto-enable tracking for critical opportunity fields
enableTracking("oportunidade", "stage");
enableTracking("oportunidade", "owner");
enableTracking("oportunidade", "valor");