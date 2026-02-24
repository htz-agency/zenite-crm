/**
 * useCustomFields — React hook for loading/saving custom field values per entity.
 *
 * Usage:
 *   const { customFields, customValues, updateCustomValue, loading } = useCustomFields("lead", leadId);
 *
 * - customFields: CustomFieldDef[] filtered to this objectType
 * - customValues: Record<string, string> — current values keyed by field key
 * - updateCustomValue(key, val): persists the value immediately
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  listCustomFields,
  getCustomFieldValues,
  saveCustomFieldValues,
  type CustomFieldDef,
} from "./crm-api";

export function useCustomFields(objectType: string, entityId: string | undefined) {
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Track if mounted to avoid state updates on unmounted component
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load field definitions + values
  useEffect(() => {
    if (!entityId) return;
    setLoading(true);

    (async () => {
      try {
        const [allDefs, values] = await Promise.all([
          listCustomFields(),
          getCustomFieldValues(objectType, entityId),
        ]);
        if (!mountedRef.current) return;
        // Filter definitions for this object type
        const filtered = (allDefs ?? []).filter((d) => d.objectType === objectType);
        setCustomFields(filtered);
        setCustomValues(values ?? {});
      } catch (err) {
        console.error(`Error loading custom fields for ${objectType}/${entityId}:`, err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [objectType, entityId]);

  // Persist a single value change (optimistic)
  const updateCustomValue = useCallback(
    (fieldKey: string, value: string) => {
      if (!entityId) return;
      setCustomValues((prev) => ({ ...prev, [fieldKey]: value }));
      // Fire and forget — persist in background
      saveCustomFieldValues(objectType, entityId, { [fieldKey]: value }).catch((err) =>
        console.error(`Error persisting custom field ${fieldKey}:`, err)
      );
    },
    [objectType, entityId]
  );

  return { customFields, customValues, updateCustomValue, loading };
}
