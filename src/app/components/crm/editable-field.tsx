import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  PencilSimple,
  X,
  Check,
  Sparkle,
  Buildings,
  CaretDown,
  Function as FnIcon,
  Copy,
  Plus,
  GitBranch,
} from "@phosphor-icons/react";
import {
  evaluateFormula,
  type FormulaReturnType,
  type FormulaContext,
} from "./formula-engine";
import { ZeniteToggle } from "../zenite-toggle";

/* ================================================================== */
/*  Shared style tokens                                                */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  lineHeight: "20px",
  ...fontFeature,
} as const;

const valueStyle = {
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: -0.5,
  lineHeight: "22px",
  ...fontFeature,
} as const;

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

export type FieldType =
  | "text"
  | "textarea"       // long text (multi-line)
  | "phone"
  | "email"
  | "link"
  | "user"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "number"
  | "percentage"
  | "currency"
  | "duration"
  | "association"     // reference – FK to another entity
  | "address"
  | "type"            // picklist – single-select enum
  | "multipicklist"   // multi-select tags (values separated by ;)
  | "combobox"        // picklist + free text
  | "calculated"      // formula – always read-only
  | "id"              // record identifier – always read-only
  | "contextual";     // conditional picklist – options change based on a watched context variable

export interface FieldOption {
  value: string;
  label: string;
  color?: string; // coloured dot
}

export interface EditableFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;

  /** Field type — determines input widget, formatting, colours. Default `"text"` */
  fieldType?: FieldType;

  // ── type-specific props ──
  /** Avatar src (fieldType="user") */
  avatar?: string;
  /** Options list (fieldType="type" | "multipicklist" | "combobox") */
  options?: FieldOption[];
  /** Association entity label, e.g. "Conta" (fieldType="association") */
  associationLabel?: string;
  /** Currency symbol — default "R$" (fieldType="currency") */
  currencySymbol?: string;
  /** Formula expression displayed in tooltip (fieldType="calculated") */
  formula?: string;

  // ── contextual field props (fieldType="contextual") ──
  /** Map of context values → available options. E.g. { "novo": [...], "em_contato": [...] } */
  contextualOptions?: Record<string, FieldOption[]>;
  /** The current value of the watched variable (e.g. the current stage) */
  contextualValue?: string;
  /** Optional label shown next to the branch icon describing which variable is being watched */
  contextualLabel?: string;

  // ── formula engine props (fieldType="calculated") ──
  /** Formula expression for live computation. When provided, `value` is ignored and the
   *  engine evaluates the expression against `formulaContext` on every render. */
  formulaExpression?: string;
  /** Return type for the formula engine (default "number") */
  formulaReturnType?: FormulaReturnType;
  /** Context map of field values, e.g. { annualRevenue: 1500000, score: 72 } */
  formulaContext?: FormulaContext;

  // ── display modifiers ──
  /** Show AI sparkle before label */
  ai?: boolean;
  /** Permanent bg-[#f6f7f9] background */
  highlighted?: boolean;
  /** Allow editing — default true (forced false for "calculated" and "id") */
  editable?: boolean;
  /** Mark field as required — shows red asterisk next to label */
  required?: boolean;
  className?: string;
  /** Optional custom icon for the idle edit button (replaces PencilSimple). Pass a React element. */
  editIcon?: React.ReactNode;
}

/* ================================================================== */
/*  Helpers – which types render with link colour                      */
/* ================================================================== */

const LINK_TYPES: Set<FieldType> = new Set([
  "phone",
  "email",
  "link",
  "user",
  "association",
  "id",
]);

/** Types that are always read-only regardless of `editable` prop */
const READONLY_TYPES: Set<FieldType> = new Set(["calculated", "id"]);

/** Types that use a dropdown / special widget instead of a plain <input> */
const DROPDOWN_TYPES: Set<FieldType> = new Set(["type", "combobox", "multipicklist", "contextual"]);

/* ================================================================== */
/*  Helpers – formatting                                               */
/* ================================================================== */

/** Format raw digits into Brazilian phone: (DD) DDD DDD DDD */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  let r = `(${d.slice(0, 2)}) ${d.slice(2, 5)}`;
  if (d.length > 5) r += ` ${d.slice(5, 8)}`;
  if (d.length > 8) r += ` ${d.slice(8)}`;
  return r;
}

function formatDisplay(
  raw: string,
  type: FieldType,
  currencySymbol: string,
): string {
  switch (type) {
    case "phone":
      return formatPhone(raw);

    case "boolean":
      return raw === "true" ? "Sim" : "Não";

    case "date": {
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split("-");
        return `${d}/${m}/${y}`;
      }
      return raw;
    }

    case "time":
      return raw;

    case "datetime": {
      if (raw.includes("T")) {
        const [date, time] = raw.split("T");
        const [y, m, d] = date.split("-");
        return `${d}/${m}/${y} ${time.slice(0, 5)}`;
      }
      return raw;
    }

    case "number": {
      const n = parseFloat(raw);
      return isNaN(n) ? raw : n.toLocaleString("pt-BR");
    }

    case "percentage": {
      const n = parseFloat(raw);
      return isNaN(n) ? raw : `${n.toLocaleString("pt-BR")}%`;
    }

    case "currency": {
      const n = parseFloat(raw);
      return isNaN(n)
        ? raw
        : `${currencySymbol} ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    case "duration": {
      const mins = parseInt(raw, 10);
      if (isNaN(mins)) return raw;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0 && m > 0) return `${h}h ${m}min`;
      if (h > 0) return `${h}h`;
      return `${m}min`;
    }

    case "calculated": {
      // Calculated fields can hold any type of result.
      // If the raw value looks numeric, format it with locale;
      // otherwise return as-is.
      const cn = parseFloat(raw);
      return isNaN(cn) ? raw : cn.toLocaleString("pt-BR");
    }

    default:
      return raw;
  }
}

/** Map FieldType → HTML input type */
function htmlInputType(ft: FieldType): string {
  switch (ft) {
    case "phone":
      return "tel";
    case "email":
      return "email";
    case "link":
      return "url";
    case "number":
    case "percentage":
    case "currency":
      return "number";
    case "date":
      return "date";
    case "time":
      return "time";
    case "datetime":
      return "datetime-local";
    default:
      return "text";
  }
}

/* ================================================================== */
/*  Colour palette per field state                                     */
/* ================================================================== */

type FieldState = "idle" | "editing" | "unsaved" | "error";

function palette(state: FieldState, isLink: boolean) {
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
    case "error":
      return {
        label: "text-[#f56233]",
        value: "text-[#f56233]",
        border: "border-[#f56233]",
        btnBg: "bg-[#ffedeb]",
        btnText: "text-[#ff8c76]",
      };
    default:
      return {
        label: "text-[#98989d]",
        value: isLink ? "text-[#07abde]" : "text-[#4e6987]",
        border: "border-transparent",
        btnBg: "bg-[#dde3ec]",
        btnText: "text-[#4e6987]",
      };
  }
}



/* ================================================================== */
/*  Sub-component: Dropdown (shared by type, combobox, multipicklist)   */
/* ================================================================== */

function Dropdown({
  options,
  selected,
  onSelect,
  onClose,
  multi = false,
  allowFreeText = false,
  anchorRef,
}: {
  options: FieldOption[];
  selected: string; // semicolon-separated for multi
  onSelect: (v: string) => void;
  onClose: () => void;
  multi?: boolean;
  allowFreeText?: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [freeText, setFreeText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 200 });

  const selectedSet = new Set(multi ? selected.split(";").filter(Boolean) : [selected]);

  // Position dropdown below anchor via getBoundingClientRect
  useEffect(() => {
    function updatePos() {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 200),
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [anchorRef]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as Node;
      // Ignore clicks inside the dropdown itself or on the anchor field
      if (ref.current && ref.current.contains(target)) return;
      if (anchorRef.current && anchorRef.current.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose, anchorRef]);

  useEffect(() => {
    if (allowFreeText) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [allowFreeText]);

  const handleSelect = (v: string) => {
    if (multi) {
      const next = new Set(selectedSet);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      onSelect([...next].filter(Boolean).join(";"));
    } else {
      onSelect(v);
    }
  };

  const handleFreeTextSubmit = () => {
    const trimmed = freeText.trim();
    if (!trimmed) return;
    if (multi) {
      const next = new Set(selectedSet);
      next.add(trimmed);
      onSelect([...next].filter(Boolean).join(";"));
    } else {
      onSelect(trimmed);
    }
    setFreeText("");
  };

  return (
    <div
      ref={ref}
      className="fixed z-[9999] min-w-[200px] max-h-[240px] bg-white rounded-[10px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-[#ebedf0] py-[4px] overflow-auto"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      {/* Free text input (combobox) */}
      {allowFreeText && (
        <div className="px-[8px] py-[4px] border-b border-[#ebedf0]">
          <input
            ref={inputRef}
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleFreeTextSubmit(); }
              if (e.key === "Escape") onClose();
            }}
            placeholder="Digitar valor..."
            className="w-full text-[#4e6987] bg-transparent outline-none placeholder:text-[#c8cfdb]"
            style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}
          />
        </div>
      )}

      {options.map((o) => {
        const isSelected = selectedSet.has(o.value);
        return (
          <button
            key={o.value}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(o.value);
            }}
            className={`flex items-center gap-[8px] w-full px-[12px] py-[8px] text-left cursor-pointer transition-colors hover:bg-[#f6f7f9] ${
              isSelected ? "bg-[#f6f7f9]" : ""
            }`}
          >
            {/* Multi checkbox */}
            {multi && (
              <span
                className={`flex items-center justify-center size-[16px] rounded-[4px] border shrink-0 transition-colors ${
                  isSelected ? "bg-[#07abde] border-[#07abde]" : "border-[#c8cfdb]"
                }`}
              >
                {isSelected && <Check size={10} weight="bold" className="text-white" />}
              </span>
            )}

            <span
              className="text-[#4e6987] flex-1"
              style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}
            >
              {o.label}
            </span>
            {!multi && isSelected && (
              <Check size={12} weight="bold" className="ml-auto text-[#07abde]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Sub-component: Multi-picklist pills                                */
/* ================================================================== */

function MultiPills({
  values,
  options,
  onRemove,
  colorClass,
}: {
  values: string[];
  options?: FieldOption[];
  onRemove?: (v: string) => void;
  colorClass: string;
}) {
  const optMap = new Map(options?.map((o) => [o.value, o]) ?? []);

  if (values.length === 0) {
    return (
      <span className="text-[#c8cfdb]" style={valueStyle}>
        —
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-[4px]">
      {values.map((v) => {
        const opt = optMap.get(v);
        const bg = opt?.color ? `${opt.color}20` : "#f6f7f9";
        const fg = opt?.color ?? "#4e6987";

        return (
          <span
            key={v}
            className={`inline-flex items-center gap-[4px] h-[22px] px-[8px] rounded-[6px] ${colorClass}`}
            style={{
              backgroundColor: bg,
              color: fg,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.2,
              ...fontFeature,
            }}
          >
            {opt?.label ?? v}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(v);
                }}
                className="ml-[1px] opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={9} weight="bold" />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export function EditableField({
  label,
  value,
  onChange,
  fieldType = "text",
  avatar,
  options,
  associationLabel,
  currencySymbol = "R$",
  formula,
  ai = false,
  highlighted = false,
  editable: editableProp = true,
  className = "",
  formulaExpression,
  formulaReturnType,
  formulaContext,
  contextualOptions,
  contextualValue,
  contextualLabel,
  editIcon,
  required = false,
}: EditableFieldProps) {
  // Force read-only for calculated & id types
  const editable = READONLY_TYPES.has(fieldType) ? false : editableProp;

  const isLink = LINK_TYPES.has(fieldType);
  const isBool = fieldType === "boolean";
  const isDropdown = DROPDOWN_TYPES.has(fieldType);
  const isMulti = fieldType === "multipicklist";
  const isCombo = fieldType === "combobox";
  const isTextarea = fieldType === "textarea";
  const isCalc = fieldType === "calculated";
  const isId = fieldType === "id";
  const isContextual = fieldType === "contextual";

  // ── Contextual field: resolve options from context ──
  const ctxOptions = useMemo(() => {
    if (!isContextual || !contextualOptions || !contextualValue) return [];
    return contextualOptions[contextualValue] ?? [];
  }, [isContextual, contextualOptions, contextualValue]);

  // Flatten all contextual options for label lookup
  const allCtxOptions = useMemo(() => {
    if (!isContextual || !contextualOptions) return [];
    return Object.values(contextualOptions).flat();
  }, [isContextual, contextualOptions]);

  // ── Contextual: auto-clear value when context changes and value is no longer valid ──
  const prevContextualValue = useRef(contextualValue);
  useEffect(() => {
    if (!isContextual || !contextualOptions) return;
    if (prevContextualValue.current !== contextualValue) {
      prevContextualValue.current = contextualValue;
      // Check if current value is still valid in new context
      const newOpts = contextualValue ? (contextualOptions[contextualValue] ?? []) : [];
      const isStillValid = newOpts.some((o) => o.value === value);
      if (!isStillValid && value) {
        // Auto-clear — notify parent
        onChange?.("");
      }
    }
  }, [contextualValue, isContextual, contextualOptions, value, onChange]);

  // The effective options for contextual are the resolved ctxOptions
  const resolvedOptions = isContextual ? ctxOptions : options;

  // ── Live formula computation (compute-on-read) ──
  const computedValue = useMemo(() => {
    if (isCalc && formulaExpression && formulaContext) {
      return evaluateFormula(
        formulaExpression,
        formulaContext,
        formulaReturnType ?? "number",
        { currencySymbol },
      );
    }
    return null; // not a computed field, use raw value
  }, [isCalc, formulaExpression, formulaContext, formulaReturnType, currencySymbol]);

  // The effective value for display — formula result takes priority
  const effectiveValue = computedValue ?? value;

  const [state, setState] = useState<FieldState>("idle");
  const [editValue, setEditValue] = useState(effectiveValue);
  const [originalValue, setOriginalValue] = useState(effectiveValue);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    if (state === "idle") {
      setEditValue(effectiveValue);
      setOriginalValue(effectiveValue);
    }
  }, [effectiveValue, state]);

  // Auto-focus
  useEffect(() => {
    if (state === "editing" && !isBool && !isDropdown) {
      requestAnimationFrame(() => {
        if (isTextarea) textareaRef.current?.focus();
        else inputRef.current?.focus();
      });
    }
  }, [state, isBool, isDropdown, isTextarea]);

  /* ---- handlers ---- */

  const startEdit = useCallback(() => {
    if (!editable) return;
    setOriginalValue(effectiveValue);
    setEditValue(effectiveValue);
    if (isDropdown) {
      setDropdownOpen(true);
      setState("editing");
    } else if (isBool) {
      const next = value === "true" ? "false" : "true";
      setEditValue(next);
      setState("unsaved");
    } else {
      setState("editing");
    }
  }, [editable, effectiveValue, isBool, isDropdown]);

  const cancel = useCallback(() => {
    setEditValue(originalValue);
    setDropdownOpen(false);
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

  const discard = useCallback(() => {
    setEditValue(originalValue);
    setState("idle");
  }, [originalValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isTextarea) {
        if (e.key === "Escape") cancel();
        // Shift+Enter for newline, Enter alone commits
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
      } else {
        if (e.key === "Enter") commitEdit();
        else if (e.key === "Escape") cancel();
      }
    },
    [commitEdit, cancel, isTextarea],
  );

  /** Boolean re-toggle while unsaved */
  const handleBoolToggle = useCallback(() => {
    if (state === "unsaved") {
      const next = editValue === "true" ? "false" : "true";
      setEditValue(next);
      if (next === originalValue) setState("idle");
    } else {
      startEdit();
    }
  }, [state, editValue, originalValue, startEdit]);

  /** Dropdown option picked */
  const handleDropdownSelect = useCallback(
    (v: string) => {
      setEditValue(v);
      if (!isMulti) setDropdownOpen(false);
      if (v !== originalValue) {
        setState("unsaved");
      } else {
        setState("idle");
      }
    },
    [originalValue, isMulti],
  );

  /** Multi-picklist remove one tag */
  const handleMultiRemove = useCallback(
    (tag: string) => {
      const vals = editValue.split(";").filter(Boolean).filter((v) => v !== tag);
      const next = vals.join(";");
      setEditValue(next);
      if (next !== originalValue) setState("unsaved");
      else setState("idle");
    },
    [editValue, originalValue],
  );

  /** Copy ID to clipboard */
  const handleCopyId = useCallback(() => {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(textArea);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 1500);
  }, [value]);

  /* ---- derived styles ---- */

  const c = palette(state, isLink);
  const isIdle = state === "idle";
  const hasBorder = !isIdle;
  const pad = hasBorder ? "p-[5px]" : "p-[6px]";
  const hoverBg = isIdle ? "hover:bg-[#f6f7f9]" : "";
  const permBg = highlighted && isIdle ? "bg-[#f6f7f9]" : "";

  const handleContainerClick = () => {
    if (isId) return; // id doesn't enter edit mode
    if (isIdle && editable) {
      startEdit();
    } else if (state === "unsaved" && !isBool) {
      setState("editing");
      if (isDropdown) setDropdownOpen(true);
    }
  };

  /* ---- resolve display value ---- */

  const displayRaw = state === "unsaved" || state === "error" ? editValue : effectiveValue;

  const displayFormatted = (() => {
    // If formula computed the value, it's already formatted — show as-is
    if (isCalc && computedValue !== null) return computedValue;
    // picklist / combobox / contextual → resolve label from options
    if ((fieldType === "type" || isCombo || isContextual) && resolvedOptions) {
      // For contextual, look in all options (across all contexts) for label
      const lookupList = isContextual ? allCtxOptions : resolvedOptions;
      const opt = lookupList.find((o) => o.value === displayRaw);
      return opt ? opt.label : displayRaw;
    }
    return formatDisplay(displayRaw, fieldType, currencySymbol);
  })();

  /* ---- type-option colour dot ---- */
  const typeOptionColor = (() => {
    if (isContextual) {
      const opt = allCtxOptions.find((o) => o.value === displayRaw);
      return opt?.color;
    }
    if (!(fieldType === "type" || isCombo) || !resolvedOptions) return undefined;
    return resolvedOptions.find((o) => o.value === displayRaw)?.color;
  })();

  /* ---- multi-picklist values ---- */
  const multiValues = isMulti ? displayRaw.split(";").filter(Boolean) : [];

  /* ================================================================ */

  return (
    <div
      ref={anchorRef}
      className={`group/field relative flex flex-col gap-0 rounded-[8px] transition-all duration-150 border ${c.border} ${pad} ${hoverBg} ${permBg} ${
        (isIdle && editable) || (state === "unsaved" && !isBool) ? "cursor-pointer" : ""
      } ${className}`}
      onClick={handleContainerClick}
    >
      {/* ── Label row ── */}
      <div className="flex items-center gap-[2px]">
        {ai && (
          <Sparkle
            size={10}
            weight="duotone"
            className={isIdle ? "text-[#98989d]" : c.label}
          />
        )}
        {isCalc && (
          <FnIcon
            size={10}
            weight="bold"
            className={isIdle ? "text-[#98989d]" : c.label}
          />
        )}
        <span className={`${c.label} uppercase block`} style={labelStyle}>
          {label}{required && <span className="text-[#f56233] ml-[2px]">*</span>}
        </span>
        {isContextual && (
          <FnIcon
            size={10}
            weight="bold"
            className={isIdle ? "text-[#8c8cd4]" : c.label}
          />
        )}
        {isContextual && contextualLabel && isIdle && (
          <span className="text-[#c8cfdb] uppercase" style={{ ...labelStyle, letterSpacing: 0.3 }}>
            {" "}· {contextualLabel}
          </span>
        )}
      </div>

      {/* ── Value row ── */}
      <div className={`flex items-center gap-[6px] min-w-0 overflow-hidden ${isTextarea && state === "editing" ? "" : "min-h-[22px]"}`}>
        {/* Avatar (user) */}
        {fieldType === "user" && avatar && (
          <img
            src={avatar}
            alt=""
            className="size-[16px] rounded-full object-cover shrink-0"
          />
        )}

        {/* Association icon */}
        {fieldType === "association" && (
          <Buildings size={14} weight="duotone" className={isIdle ? "text-[#98989d]" : c.value} />
        )}

        {/* Type / combobox option colour dot */}
        {typeOptionColor && (
          <span
            className="size-[8px] rounded-full shrink-0"
            style={{ backgroundColor: typeOptionColor }}
          />
        )}

        {/* ── Render by field type ── */}

        {/* ID → monospace + copy button */}
        {isId ? (
          <div className="flex items-center gap-[6px]">
            <span
              className={c.value}
              style={{ ...valueStyle, fontFamily: "'DM Mono', monospace", letterSpacing: 0 }}
            >
              {displayFormatted}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyId();
              }}
              className="flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987] hover:bg-[#c8cfdb] transition-colors cursor-pointer"
              title="Copiar ID"
            >
              {idCopied ? <Check size={9} weight="bold" className="text-[#3ccea7]" /> : <Copy size={9} weight="bold" />}
            </button>
          </div>
        ) : /* Calculated → formatted value + formula tooltip */
        isCalc ? (
          <span className={c.value} style={valueStyle} title={formula ? `= ${formula}` : undefined}>
            {displayFormatted}
          </span>
        ) : /* Boolean → toggle + text */
        isBool ? (
          <div className="flex items-center gap-[8px]">
            <ZeniteToggle
              active={displayRaw === "true"}
              onChange={handleBoolToggle}
              disabled={!editable}
            />
            <span className={c.value} style={valueStyle}>
              {displayFormatted}
            </span>
          </div>
        ) : /* Multi-picklist → pills */
        isMulti && state !== "editing" ? (
          <MultiPills
            values={multiValues}
            options={options}
            onRemove={editable && state === "unsaved" ? handleMultiRemove : undefined}
            colorClass=""
          />
        ) : /* Multi-picklist editing → pills + add button (dropdown shown separately) */
        isMulti && state === "editing" ? (
          <div className="flex items-center gap-[4px] flex-wrap">
            <MultiPills
              values={multiValues}
              options={options}
              onRemove={handleMultiRemove}
              colorClass=""
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!dropdownOpen) setDropdownOpen(true);
              }}
              className="flex items-center justify-center size-[22px] rounded-[6px] bg-[#dcf0ff] text-[#07abde] hover:bg-[#c4e4fa] cursor-pointer transition-colors"
            >
              <Plus size={11} weight="bold" />
            </button>
          </div>
        ) : /* Dropdown types → display + caret (when editing) */
        isDropdown && state === "editing" ? (
          <>
            <span className={c.value} style={valueStyle}>
              {displayFormatted}
            </span>
            <CaretDown size={12} weight="bold" className={c.value} />
          </>
        ) : /* Textarea editing → <textarea> */
        isTextarea && state === "editing" ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            rows={3}
            className={`${c.value} bg-transparent outline-none flex-1 min-w-0 resize-y`}
            style={{ ...valueStyle, lineHeight: "20px" }}
          />
        ) : /* Regular editing → <input> */
        state === "editing" ? (
          <input
            ref={inputRef}
            type={fieldType === "phone" ? "text" : htmlInputType(fieldType)}
            value={fieldType === "phone" ? formatPhone(editValue) : editValue}
            onChange={(e) => {
              if (fieldType === "phone") {
                setEditValue(e.target.value.replace(/\D/g, "").slice(0, 11));
              } else {
                setEditValue(e.target.value);
              }
            }}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            step={fieldType === "currency" ? "0.01" : undefined}
            placeholder={fieldType === "phone" ? "(00) 000 000 000" : undefined}
            className={`${c.value} bg-transparent outline-none flex-1 min-w-0`}
            style={valueStyle}
          />
        ) : /* Textarea idle/unsaved → truncated */
        isTextarea ? (
          <span className={`${c.value} line-clamp-2`} style={valueStyle}>
            {displayFormatted}
          </span>
        ) : (
          /* Default idle / unsaved / error → formatted text */
          <span className={`${c.value} truncate`} style={valueStyle}>
            {displayFormatted}
          </span>
        )}
      </div>

      {/* ── Dropdown (type / combobox / multipicklist / contextual) ── */}
      {isDropdown && dropdownOpen && resolvedOptions && (
        createPortal(
          <Dropdown
            options={resolvedOptions}
            selected={editValue}
            onSelect={handleDropdownSelect}
            onClose={() => {
              setDropdownOpen(false);
              if (isMulti) {
                // For multi, commit when dropdown closes
                if (editValue !== originalValue) setState("unsaved");
                else setState("idle");
              } else {
                if (editValue === originalValue) setState("idle");
              }
            }}
            multi={isMulti}
            allowFreeText={isCombo}
            anchorRef={anchorRef}
          />,
          document.body,
        )
      )}

      {/* ── Action button (right) ── */}
      {editable && (
        <div className="absolute right-[5px] top-[10px]">
          {/* Idle → pencil on hover */}
          {isIdle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEdit();
              }}
              className={`hidden group-hover/field:flex items-center justify-center size-[16px] rounded-full ${c.btnBg} ${c.btnText} cursor-pointer transition-colors`}
            >
              {editIcon ?? <PencilSimple size={9} weight="bold" />}
            </button>
          )}

          {/* Editing → X (cancel) */}
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

          {/* Unsaved → check (must click to save) */}
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

          {/* Error → X (discard) */}
          {state === "error" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                discard();
              }}
              className={`flex items-center justify-center size-[16px] rounded-full ${c.btnBg} ${c.btnText} cursor-pointer transition-colors`}
            >
              <X size={9} weight="bold" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}