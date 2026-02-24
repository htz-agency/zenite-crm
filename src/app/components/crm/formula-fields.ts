/**
 * Zenite — Shared formula field data
 *
 * Single source of truth for the field list and demo context
 * used by FormulaBuilder across all pages (Campos Calculados,
 * Criar Campo Customizado, etc.).
 */

import {
  LEAD_FIELDS,
  OPPORTUNITY_FIELDS,
  CONTACT_FIELDS,
  ACCOUNT_FIELDS,
  type NativeField,
} from "./crm-settings-native-fields";
import type { FieldSchema, FormulaContext } from "./formula-engine";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

/** Map native CRM field types to the simplified FieldSchema types */
function mapFieldType(ft: string): FieldSchema["type"] {
  switch (ft) {
    case "number":
      return "number";
    case "currency":
      return "currency";
    case "percentage":
      return "percentage";
    case "date":
    case "time":
    case "datetime":
    case "duration":
      return "date";
    case "boolean":
      return "boolean";
    default:
      return "text";
  }
}

/** Convert NativeField[] to FieldSchema[] with object group */
function nativeToSchema(
  fields: NativeField[],
  objectGroup: FieldSchema["objectGroup"],
): FieldSchema[] {
  return fields
    .filter((f) => f.fieldType !== "id")
    .map((f) => ({
      key: f.key,
      label: f.label,
      type: mapFieldType(f.fieldType),
      objectGroup,
    }));
}

/* ================================================================== */
/*  Exports                                                            */
/* ================================================================== */

/** All native CRM fields from the 4 objects, ready for FormulaBuilder */
export const FORMULA_AVAILABLE_FIELDS: FieldSchema[] = [
  ...nativeToSchema(LEAD_FIELDS, "lead"),
  ...nativeToSchema(OPPORTUNITY_FIELDS, "oportunidade"),
  ...nativeToSchema(CONTACT_FIELDS, "contato"),
  ...nativeToSchema(ACCOUNT_FIELDS, "conta"),
];

/** Demo context with sample values for live formula preview */
export const FORMULA_DEMO_CONTEXT: FormulaContext = {
  lead_annual_revenue: 1500000,
  lead_employee_count: 85,
  lead_qual_progress: 25,
  lead_is_active: true,
  lead_name: "Joao Silva",
  lead_company: "XPTO Company",
  lead_mkt_conversao: "2023-07-04T09:56:00Z",
  op_needs_budget: "50000",
  op_amount: 120000,
  ac_annual_revenue: 3200000,
  ac_employees: 120,
  ct_name: "Maria",
};
