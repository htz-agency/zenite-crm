/**
 * PriceEditableField — lightweight editable field for the Price module.
 * Replicates the CRM EditableField interaction pattern:
 *   idle (hover bg + pencil) → editing (blue border + X cancel) → unsaved (yellow + check confirm) → saved → idle
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { PencilSimple, X, Check } from "@phosphor-icons/react";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type FieldState = "idle" | "editing" | "unsaved";

interface PriceEditableFieldProps {
  label: string;
  value: string;
  onChange?: (newValue: string) => void;
  placeholder?: string;
  className?: string;
}

/* ================================================================== */
/*  Colour palette per state (matches CRM EditableField exactly)       */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  lineHeight: "14px",
  fontWeight: 500,
  letterSpacing: 0.8,
  ...fontFeature,
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: "20px",
  fontWeight: 500,
  ...fontFeature,
};

function palette(state: FieldState) {
  switch (state) {
    case "editing":
      return {
        label: "text-[#07abde]",
        value: "text-[#4e6987]",
        border: "border-[#07abde]",
        btnBg: "bg-[#dcf0ff]",
        btnText: "text-[#07abde]",
      };
    case "unsaved":
      return {
        label: "text-[#eac23d]",
        value: "text-[#eac23d]",
        border: "border-[#eac23d]",
        btnBg: "bg-[#feedca]",
        btnText: "text-[#eac23d]",
      };
    default:
      return {
        label: "text-[#98989d]",
        value: "text-[#4e6987]",
        border: "border-transparent",
        btnBg: "bg-[#dde3ec]",
        btnText: "text-[#4e6987]",
      };
  }
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function PriceEditableField({
  label,
  value,
  onChange,
  placeholder = "",
  className = "",
}: PriceEditableFieldProps) {
  const [state, setState] = useState<FieldState>("idle");
  const [editValue, setEditValue] = useState(value);
  const [originalValue, setOriginalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value when idle
  useEffect(() => {
    if (state === "idle") {
      setEditValue(value);
      setOriginalValue(value);
    }
  }, [value, state]);

  // Auto-focus input on edit
  useEffect(() => {
    if (state === "editing") {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [state]);

  /* ── Handlers ── */

  const startEdit = useCallback(() => {
    setOriginalValue(value);
    setEditValue(value);
    setState("editing");
  }, [value]);

  const cancel = useCallback(() => {
    setEditValue(originalValue);
    setState("idle");
  }, [originalValue]);

  const commitEdit = useCallback(() => {
    if (editValue.trim() !== originalValue.trim()) {
      setState("unsaved");
    } else {
      setState("idle");
    }
  }, [editValue, originalValue]);

  const save = useCallback(() => {
    onChange?.(editValue);
    setOriginalValue(editValue);
    setState("idle");
  }, [editValue, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commitEdit();
      else if (e.key === "Escape") cancel();
    },
    [commitEdit, cancel],
  );

  const handleContainerClick = () => {
    if (state === "idle") startEdit();
    else if (state === "unsaved") setState("editing");
  };

  /* ── Derived styles ── */
  const c = palette(state);
  const isIdle = state === "idle";
  const pad = !isIdle ? "p-[5px]" : "p-[6px]";
  const hoverBg = isIdle ? "hover:bg-[#f6f7f9]" : "";

  return (
    <div
      className={`group/field relative flex flex-col gap-0 rounded-[8px] transition-all duration-150 border ${c.border} ${pad} ${hoverBg} ${
        isIdle || state === "unsaved" ? "cursor-pointer" : ""
      } ${className}`}
      onClick={handleContainerClick}
    >
      {/* ── Label ── */}
      <span className={`${c.label} uppercase block`} style={labelStyle}>
        {label}
      </span>

      {/* ── Value row ── */}
      <div className="flex items-center gap-[6px] min-w-0 overflow-hidden min-h-[22px]">
        {state === "editing" ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${c.value} bg-transparent outline-none flex-1 min-w-0`}
            style={valueStyle}
          />
        ) : (
          <span
            className={`${c.value} truncate`}
            style={valueStyle}
          >
            {(state === "unsaved" ? editValue : value) || (
              <span className="text-[#C8CFDB]">{placeholder || "\u2014"}</span>
            )}
          </span>
        )}
      </div>

      {/* ── Action button (right) ── */}
      <div className="absolute right-[5px] top-[10px]">
        {/* Idle -> pencil on hover */}
        {isIdle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEdit();
            }}
            className={`hidden group-hover/field:flex items-center justify-center size-[16px] rounded-full ${c.btnBg} ${c.btnText} cursor-pointer transition-colors`}
          >
            <PencilSimple size={9} weight="bold" />
          </button>
        )}

        {/* Editing -> X (cancel) */}
        {state === "editing" && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              cancel();
            }}
            className={`flex items-center justify-center size-[16px] rounded-full ${c.btnBg} ${c.btnText} cursor-pointer transition-colors`}
          >
            <X size={9} weight="bold" />
          </button>
        )}

        {/* Unsaved -> check (confirm) */}
        {state === "unsaved" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              save();
            }}
            className={`flex items-center justify-center size-[16px] rounded-full ${c.btnBg} ${c.btnText} cursor-pointer transition-colors`}
          >
            <Check size={9} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
