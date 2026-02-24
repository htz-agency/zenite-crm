/**
 * CRM Field Config — Single Source of Truth
 *
 * Builds lookup maps from the centralized NativeField arrays
 * (LEAD_FIELDS, OPPORTUNITY_FIELDS, CONTACT_FIELDS, ACCOUNT_FIELDS)
 * so that detail pages can consume fieldType, options, labels, etc.
 * from the same definitions used in CRM Settings.
 */

import type { NativeField, FieldType } from "./crm-settings-native-fields";
import {
  LEAD_FIELDS,
  OPPORTUNITY_FIELDS,
  CONTACT_FIELDS,
  ACCOUNT_FIELDS,
} from "./crm-settings-native-fields";

/* ================================================================== */
/*  Lookup builder                                                     */
/* ================================================================== */

type FieldLookup = Map<string, NativeField>;

function buildLookup(fields: NativeField[]): FieldLookup {
  return new Map(fields.map((f) => [f.key, f]));
}

const leadLookup = buildLookup(LEAD_FIELDS);
const opLookup = buildLookup(OPPORTUNITY_FIELDS);
const contactLookup = buildLookup(CONTACT_FIELDS);
const accountLookup = buildLookup(ACCOUNT_FIELDS);

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

export type ObjectType = "lead" | "oportunidade" | "contato" | "conta";

const LOOKUPS: Record<ObjectType, FieldLookup> = {
  lead: leadLookup,
  oportunidade: opLookup,
  contato: contactLookup,
  conta: accountLookup,
};

/** Get the NativeField definition for a given object + field key */
export function getFieldDef(object: ObjectType, key: string): NativeField | undefined {
  return LOOKUPS[object]?.get(key);
}

/** Get options array for a field (or undefined if field has none) */
export function getFieldOptions(
  object: ObjectType,
  key: string
): { value: string; label: string; color?: string }[] | undefined {
  return LOOKUPS[object]?.get(key)?.options;
}

/** Get the fieldType for a field (or fallback) */
export function getFieldType(
  object: ObjectType,
  key: string,
  fallback: FieldType = "text"
): FieldType {
  return LOOKUPS[object]?.get(key)?.fieldType ?? fallback;
}

/** Get all fields for an object, grouped by section */
export function getFieldsBySection(
  object: ObjectType
): { section: string; fields: NativeField[] }[] {
  const lookup = LOOKUPS[object];
  if (!lookup) return [];

  const sections: { section: string; fields: NativeField[] }[] = [];
  for (const field of lookup.values()) {
    const existing = sections.find((s) => s.section === field.section);
    if (existing) existing.fields.push(field);
    else sections.push({ section: field.section, fields: [field] });
  }
  return sections;
}

/** Get all visible fields for an object */
export function getVisibleFields(object: ObjectType): NativeField[] {
  const lookup = LOOKUPS[object];
  if (!lookup) return [];
  return [...lookup.values()].filter((f) => f.visible);
}

/* ================================================================== */
/*  Convenience re-exports                                             */
/* ================================================================== */

export { LEAD_FIELDS, OPPORTUNITY_FIELDS, CONTACT_FIELDS, ACCOUNT_FIELDS };
