/**
 * useFieldVisibility — loads field config overrides (visible/required/label) from backend
 * and exposes helpers for detail pages:
 *   isVisible(key)  — should the field render?
 *   isRequired(key) — is the field required?
 *   getLabel(key)   — returns uppercase label (backend override > NativeField default > key)
 *
 * Usage:
 *   const { isVisible, isRequired, getLabel } = useFieldVisibility("lead");
 *   {isVisible("lead_owner") && <EditableField label={getLabel("lead_owner")} required={isRequired("lead_owner")} ... />}
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getFieldConfig, type FieldConfigOverride } from "./crm-api";
import {
  LEAD_FIELDS,
  OPPORTUNITY_FIELDS,
  CONTACT_FIELDS,
  ACCOUNT_FIELDS,
  type NativeField,
} from "./crm-settings-native-fields";

const OBJECT_TO_FIELDS: Record<string, NativeField[]> = {
  lead: LEAD_FIELDS,
  oportunidade: OPPORTUNITY_FIELDS,
  contato: CONTACT_FIELDS,
  conta: ACCOUNT_FIELDS,
};

export function useFieldVisibility(objectType: string) {
  const [config, setConfig] = useState<Record<string, FieldConfigOverride>>({});
  const defaultsRef = useRef<NativeField[]>([]);
  defaultsRef.current = OBJECT_TO_FIELDS[objectType] ?? [];

  useEffect(() => {
    let cancelled = false;
    getFieldConfig(objectType)
      .then((cfg) => {
        if (!cancelled) setConfig(cfg ?? {});
      })
      .catch((err) => console.error("Error loading field visibility config:", err));
    return () => { cancelled = true; };
  }, [objectType]);

  /** Returns true if the field should be rendered (default: from NativeField.visible) */
  const isVisible = useCallback(
    (settingsKey: string): boolean => {
      const override = config[settingsKey];
      if (override?.visible !== undefined) return override.visible;
      const def = defaultsRef.current.find((f) => f.key === settingsKey);
      return def?.visible ?? true;
    },
    [config],
  );

  /** Returns true if the field is marked as required */
  const isRequired = useCallback(
    (settingsKey: string): boolean => {
      const override = config[settingsKey];
      if (override?.required !== undefined) return override.required;
      const def = defaultsRef.current.find((f) => f.key === settingsKey);
      return def?.required ?? false;
    },
    [config],
  );

  /** Returns the UPPERCASE label for the field (backend override > NativeField default) */
  const getLabel = useCallback(
    (settingsKey: string): string => {
      const override = config[settingsKey];
      if (override?.label != null && override.label !== "") return override.label.toUpperCase();
      const def = defaultsRef.current.find((f) => f.key === settingsKey);
      return (def?.label ?? settingsKey).toUpperCase();
    },
    [config],
  );

  return { isVisible, isRequired, getLabel, config };
}