/**
 * Interactive Field Examples — Zenite CRM Design System
 *
 * Cada campo segue os 5 estados canonicos do DS:
 *   1. Idle   — border-transparent, hover:bg-[#f6f7f9], pencil bg-[#dde3ec]
 *   2. Hover  — bg-[#f6f7f9], pencil visivel, vazio: text-[#c8cfdb] "—"
 *   3. Editing — border-[#07abde], label text-[#07abde], botao unico X bg-[#dcf0ff]
 *   4. Unsaved — border-[#C4990D], label+value text-[#C4990D], botao Check bg-[#feedca]
 *   5. Error  — border-[#f56233], label+value text-[#f56233], botao X bg-[#ffedeb]
 *
 * Estado local apenas (mockup, sem Supabase).
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  PencilSimple,
  TextT,
  TextAlignLeft,
  Phone,
  EnvelopeSimple,
  Calendar,
  LinkSimpleHorizontal,
  UserCircle,
  ToggleLeft,
  MapPin,
  Tag,
  ListBullets,
  Timer,
  CurrencyDollar,
  Hash,
  Percent,
  CaretCircleUpDown,
  Shapes,
  Function as FunctionIcon,
  Sparkle,
  Fingerprint,
  Building,
  Check,
  X,
  CaretDown,
  MagnifyingGlass,
  ArrowSquareOut,
  LinkBreak,
  Heart,
  IdentificationCard,
  SketchLogo,
} from "@phosphor-icons/react";

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const labelStyle = { fontSize: 10, fontWeight: 700 as const, letterSpacing: 0.5, lineHeight: "20px", ...ff };
const valueStyle = { fontSize: 15, fontWeight: 500 as const, letterSpacing: -0.5, lineHeight: "22px", ...ff };
const inputStyle = {
  fontSize: 15, fontWeight: 500 as const, letterSpacing: -0.5, lineHeight: "22px", ...ff,
  outline: "none", background: "transparent", color: "#4e6987", width: "100%",
};
const catStyle = { fontSize: 9, fontWeight: 700 as const, letterSpacing: 0.8, ...ff };

/* ================================================================ */
/*  Field state type                                                   */
/* ================================================================ */

type FieldState = "idle" | "editing" | "unsaved" | "error";

const STATE_COLORS = {
  idle:     { label: "#98989d", value: "#4e6987", border: "transparent",  btnBg: "#dde3ec", btnText: "#4e6987" },
  editing:  { label: "#07abde", value: "#4e6987", border: "#07abde",     btnBg: "#dcf0ff", btnText: "#07abde" },
  unsaved:  { label: "#C4990D", value: "#C4990D", border: "#C4990D",     btnBg: "#feedca", btnText: "#C4990D" },
  error:    { label: "#f56233", value: "#f56233", border: "#f56233",     btnBg: "#ffedeb", btnText: "#ff8c76" },
} as const;

/* ================================================================ */
/*  Shared wrapper — follows DS 5-state pattern                        */
/* ================================================================ */

function FieldShell({
  label, icon, children, state, onStartEdit, onAction,
  readOnly, minW = "180px", maxW, actionColor,
}: {
  label: string; icon: ReactNode; children: ReactNode;
  state: FieldState; onStartEdit: () => void; onAction?: () => void;
  readOnly?: boolean; minW?: string; maxW?: string; actionColor?: boolean;
}) {
  const c = STATE_COLORS[state];
  const isActive = state !== "idle";
  // DS: p-[6px] idle, p-[5px] active (compensates 1px border)
  const padding = isActive ? "5px" : "6px";

  return (
    <div
      className={`relative flex flex-col gap-0 rounded-[8px] transition-all ${
        isActive
          ? "cursor-text"
          : readOnly
            ? "bg-[#f6f7f9]"
            : "hover:bg-[#f6f7f9] cursor-pointer group"
      }`}
      style={{
        minWidth: minW,
        ...(maxW ? { maxWidth: maxW } : {}),
        padding,
        border: `1px solid ${c.border}`,
      }}
      onClick={!isActive && !readOnly ? onStartEdit : undefined}
    >
      {/* Label row */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block" style={{ ...labelStyle, color: c.label }}>{label}</span>
        {icon}
      </div>

      {/* Value / edit row */}
      <div className="flex items-center gap-[6px] min-h-[22px]">
        {children}
      </div>

      {/* Idle: Pencil on hover */}
      {!readOnly && state === "idle" && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}

      {/* Editing: single X (cancel) */}
      {state === "editing" && onAction && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: c.btnBg, color: c.btnText }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}

      {/* Unsaved: single Check (save) */}
      {state === "unsaved" && onAction && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: c.btnBg, color: c.btnText }}
            title="Salvar"
          >
            <Check size={9} weight="bold" />
          </button>
        </div>
      )}

      {/* Error: single X (dismiss) */}
      {state === "error" && onAction && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: c.btnBg, color: c.btnText }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Dropdown overlay                                                  */
/* ================================================================ */

function Dropdown({ children, onClose, width = 200 }: { children: ReactNode; onClose: () => void; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute left-0 top-full mt-[4px] z-50 bg-white rounded-[10px] border border-[#eceef1] pb-[4px] shadow-lg"
      style={{ width, ...ff }} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

function DropItem({ label, color, selected, onClick, avatar }: {
  label: string; color?: string; selected?: boolean; onClick: () => void; avatar?: string;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-[8px] px-[10px] py-[5px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer ${selected ? "bg-[#f0f8ff]" : ""}`}>
      {color && <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: color }} />}
      {avatar && (
        <span className="size-[16px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
          style={{ fontSize: 8, fontWeight: 700 }}>{avatar}</span>
      )}
      <span className="text-[#4e6987] truncate" style={{ fontSize: 13, fontWeight: 500, ...ff }}>{label}</span>
      {selected && <Check size={12} weight="bold" className="text-[#07ABDE] ml-auto shrink-0" />}
    </button>
  );
}

/* ================================================================ */
/*  Hook: manages idle → editing → unsaved → idle flow                */
/* ================================================================ */

function useFieldState(initialValue: string) {
  const [saved, setSaved] = useState(initialValue);
  const [draft, setDraft] = useState(initialValue);
  const [state, setState] = useState<FieldState>("idle");

  const startEdit = () => {
    setDraft(saved);
    setState("editing");
  };

  const changeDraft = (v: string) => {
    setDraft(v);
    // Transition to unsaved when value differs
    if (v !== saved) setState("unsaved");
    else setState("editing");
  };

  const save = () => {
    setSaved(draft);
    setState("idle");
  };

  const cancel = () => {
    setDraft(saved);
    setState("idle");
  };

  // Action button behavior depends on state
  const onAction = () => {
    if (state === "editing") cancel();
    else if (state === "unsaved") save();
    else if (state === "error") cancel();
  };

  return { saved, draft, state, setState, startEdit, changeDraft, save, cancel, onAction, setDraft, setSaved };
}

/* ================================================================ */
/*  TEXT FIELD                                                        */
/* ================================================================ */

function TextField({ label, icon, defaultValue, minW, maxW, actionColor, validationFn }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string; maxW?: string;
  actionColor?: boolean; validationFn?: (v: string) => string | null;
}) {
  const f = useFieldState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (f.state === "editing") inputRef.current?.focus(); }, [f.state]);

  const handleChange = (v: string) => {
    f.changeDraft(v);
    if (validationFn) {
      const err = validationFn(v);
      if (err) f.setState("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && f.state === "unsaved") f.save();
    if (e.key === "Escape") f.cancel();
  };

  const sc = STATE_COLORS[f.state];
  const valColor = f.state === "unsaved" ? sc.value
    : f.state === "error" ? sc.value
    : actionColor ? "#0483AB" : "#4e6987";

  return (
    <FieldShell label={label} icon={icon} state={f.state}
      onStartEdit={f.startEdit} onAction={f.onAction}
      minW={minW} maxW={maxW} actionColor={actionColor}>
      {f.state !== "idle" ? (
        <input ref={inputRef} value={f.draft} onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full" style={{ ...inputStyle, color: valColor }} />
      ) : (
        <span className={actionColor ? "underline decoration-transparent group-hover:decoration-current transition-all duration-200 underline-offset-2"
          : ""}
          style={{ ...valueStyle, color: valColor }}>
          {f.saved || <span className="text-[#c8cfdb]">&mdash;</span>}
        </span>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  TEXTAREA FIELD                                                    */
/* ================================================================ */

function TextAreaField({ label, icon, defaultValue, minW, maxW }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string; maxW?: string;
}) {
  const f = useFieldState(defaultValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (f.state === "editing") ref.current?.focus(); }, [f.state]);

  const sc = STATE_COLORS[f.state];
  const valColor = f.state === "unsaved" ? sc.value : f.state === "error" ? sc.value : "#4e6987";

  return (
    <FieldShell label={label} icon={icon} state={f.state}
      onStartEdit={f.startEdit} onAction={f.onAction}
      minW={minW} maxW={maxW}>
      {f.state !== "idle" ? (
        <textarea ref={ref} value={f.draft} onChange={(e) => f.changeDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") f.cancel(); }}
          rows={3} className="w-full resize-none" style={{ ...inputStyle, lineHeight: "20px", color: valColor }} />
      ) : (
        <span className="text-[#4e6987] line-clamp-2" style={valueStyle}>
          {f.saved || <span className="text-[#c8cfdb]">&mdash;</span>}
        </span>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  DATE FIELD                                                        */
/* ================================================================ */

function DateField({ label, icon, defaultValue, minW }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string;
}) {
  const f = useFieldState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const toISO = (br: string) => {
    const p = br.split("/"); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : "";
  };
  const toBR = (iso: string) => {
    if (!iso) return f.saved;
    const p = iso.split("-"); return `${p[2]}/${p[1]}/${p[0]}`;
  };

  const [isoDraft, setIsoDraft] = useState("");

  useEffect(() => { if (f.state === "editing") inputRef.current?.focus(); }, [f.state]);

  const startEdit = () => {
    setIsoDraft(toISO(f.saved));
    f.startEdit();
  };

  const handleChange = (iso: string) => {
    setIsoDraft(iso);
    const br = toBR(iso);
    f.changeDraft(br);
  };

  const sc = STATE_COLORS[f.state];
  const valColor = f.state === "unsaved" ? sc.value : "#4e6987";

  return (
    <FieldShell label={label} icon={icon} state={f.state}
      onStartEdit={startEdit} onAction={f.onAction}
      minW={minW}>
      {f.state !== "idle" ? (
        <input ref={inputRef} type="date" value={isoDraft}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") f.cancel(); }}
          className="w-full" style={{ ...inputStyle, colorScheme: "light", color: valColor }} />
      ) : (
        <span className="text-[#4e6987]" style={valueStyle}>{f.saved}</span>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  TIME FIELD                                                        */
/* ================================================================ */

function TimeField({ label, icon, defaultValue, minW }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string;
}) {
  const f = useFieldState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (f.state === "editing") inputRef.current?.focus(); }, [f.state]);

  const sc = STATE_COLORS[f.state];
  const valColor = f.state === "unsaved" ? sc.value : "#4e6987";

  return (
    <FieldShell label={label} icon={icon} state={f.state}
      onStartEdit={f.startEdit} onAction={f.onAction}
      minW={minW}>
      {f.state !== "idle" ? (
        <input ref={inputRef} type="time" value={f.draft}
          onChange={(e) => f.changeDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") f.cancel(); }}
          className="w-full" style={{ ...inputStyle, colorScheme: "light", color: valColor }} />
      ) : (
        <span className="text-[#4e6987]" style={valueStyle}>{f.saved}</span>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  DATETIME FIELD                                                    */
/* ================================================================ */

function DateTimeField({ label, icon, defaultValue, minW }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string;
}) {
  const f = useFieldState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isoDraft, setIsoDraft] = useState("");

  // "28/02/2026 as 10:00" -> "2026-02-28T10:00"
  const toISO = (v: string) => {
    const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})\s+[aà]s\s+(\d{2}):(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}` : "";
  };
  const toBR = (iso: string) => {
    if (!iso) return f.saved;
    const [d, t] = iso.split("T");
    const p = d.split("-");
    return `${p[2]}/${p[1]}/${p[0]} às ${t}`;
  };

  useEffect(() => { if (f.state === "editing") inputRef.current?.focus(); }, [f.state]);

  const startEdit = () => {
    setIsoDraft(toISO(f.saved));
    f.startEdit();
  };

  const handleChange = (iso: string) => {
    setIsoDraft(iso);
    f.changeDraft(toBR(iso));
  };

  const sc = STATE_COLORS[f.state];
  const valColor = f.state === "unsaved" ? sc.value : "#4e6987";

  return (
    <FieldShell label={label} icon={icon} state={f.state}
      onStartEdit={startEdit} onAction={f.onAction}
      minW={minW}>
      {f.state !== "idle" ? (
        <input ref={inputRef} type="datetime-local" value={isoDraft}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") f.cancel(); }}
          className="w-full" style={{ ...inputStyle, colorScheme: "light", color: valColor }} />
      ) : (
        <span className="text-[#4e6987]" style={valueStyle}>{f.saved}</span>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  DURATION FIELD                                                    */
/* ================================================================ */

function DurationField({ label, icon, defaultValue, minW }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string;
}) {
  const options = ["15min", "30min", "45min", "1h", "1h 30min", "2h", "3h", "4h"];
  const [value, setValue] = useState(defaultValue);
  const [state, setState] = useState<FieldState>("idle");
  const [pendingValue, setPendingValue] = useState(defaultValue);

  const startEdit = () => { setPendingValue(value); setState("editing"); };
  const cancel = () => { setPendingValue(value); setState("idle"); };
  const select = (v: string) => {
    setPendingValue(v);
    if (v !== value) setState("unsaved");
    else setState("idle");
  };
  const save = () => { setValue(pendingValue); setState("idle"); };
  const onAction = () => {
    if (state === "editing") cancel();
    else if (state === "unsaved") save();
  };

  const sc = STATE_COLORS[state];

  return (
    <FieldShell label={label} icon={icon} state={state}
      onStartEdit={startEdit} onAction={onAction} minW={minW}>
      <span style={{ ...valueStyle, color: state === "unsaved" ? sc.value : "#4e6987" }}>
        {state === "idle" ? value : pendingValue}
      </span>
      {state === "editing" && (
        <Dropdown onClose={cancel} width={140}>
          {options.map((o) => (
            <DropItem key={o} label={o} selected={o === value}
              onClick={() => select(o)} />
          ))}
        </Dropdown>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  NUMBER FIELD                                                      */
/* ================================================================ */

function NumberField({ label, icon, defaultValue, suffix, prefix, minW }: {
  label: string; icon: ReactNode; defaultValue: string; suffix?: string; prefix?: string; minW?: string;
}) {
  const f = useFieldState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (f.state === "editing") inputRef.current?.focus(); }, [f.state]);

  const display = `${prefix || ""}${f.saved}${suffix || ""}`;
  const sc = STATE_COLORS[f.state];
  const valColor = f.state === "unsaved" ? sc.value : "#4e6987";

  return (
    <FieldShell label={label} icon={icon} state={f.state}
      onStartEdit={f.startEdit} onAction={f.onAction}
      minW={minW}>
      {f.state !== "idle" ? (
        <div className="flex items-center gap-[2px] w-full">
          {prefix && <span style={{ fontSize: 14, color: valColor }}>{prefix}</span>}
          <input ref={inputRef} value={f.draft} onChange={(e) => f.changeDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && f.state === "unsaved") f.save(); if (e.key === "Escape") f.cancel(); }}
            className="flex-1 min-w-0" style={{ ...inputStyle, color: valColor }} />
          {suffix && <span style={{ fontSize: 14, color: valColor }}>{suffix}</span>}
        </div>
      ) : (
        <span className="text-[#4e6987]" style={valueStyle}>{display}</span>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  PICKLIST FIELD                                                    */
/* ================================================================ */

function PicklistField({ label, icon, defaultValue, options, minW }: {
  label: string; icon: ReactNode; defaultValue: string;
  options: { label: string; color: string }[]; minW?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [state, setState] = useState<FieldState>("idle");
  const [pendingValue, setPendingValue] = useState(defaultValue);
  const current = options.find((o) => o.label === (state === "idle" ? value : pendingValue));

  const startEdit = () => { setPendingValue(value); setState("editing"); };
  const cancel = () => { setPendingValue(value); setState("idle"); };
  const select = (v: string) => {
    setPendingValue(v);
    if (v !== value) setState("unsaved");
    else setState("idle");
  };
  const save = () => { setValue(pendingValue); setState("idle"); };
  const onAction = () => {
    if (state === "editing") cancel();
    else if (state === "unsaved") save();
  };

  const sc = STATE_COLORS[state];

  return (
    <FieldShell label={label} icon={icon} state={state}
      onStartEdit={startEdit} onAction={onAction} minW={minW}>
      {current && <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: current.color }} />}
      <span style={{ ...valueStyle, color: state === "unsaved" ? sc.value : "#4e6987" }}>
        {state === "idle" ? value : pendingValue}
      </span>
      {state === "editing" && (
        <>
          <CaretDown size={12} weight="bold" className="ml-auto" style={{ color: sc.label }} />
          <Dropdown onClose={cancel} width={180}>
            {options.map((o) => (
              <DropItem key={o.label} label={o.label} color={o.color} selected={o.label === value}
                onClick={() => select(o.label)} />
            ))}
          </Dropdown>
        </>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  MULTIPICKLIST FIELD                                               */
/* ================================================================ */

function MultiPicklistField({ label, icon, defaultValues, options, minW }: {
  label: string; icon: ReactNode; defaultValues: string[];
  options: { label: string; color: string }[]; minW?: string;
}) {
  const [saved, setSaved] = useState<string[]>(defaultValues);
  const [pending, setPending] = useState<string[]>(defaultValues);
  const [state, setState] = useState<FieldState>("idle");

  const startEdit = () => { setPending([...saved]); setState("editing"); };
  const cancel = () => { setPending([...saved]); setState("idle"); };
  const save = () => { setSaved([...pending]); setState("idle"); };

  const toggle = (l: string) => {
    const next = pending.includes(l) ? pending.filter((x) => x !== l) : [...pending, l];
    setPending(next);
    const same = next.length === saved.length && next.every((v) => saved.includes(v));
    setState(same ? "editing" : "unsaved");
  };

  const onAction = () => {
    if (state === "editing") cancel();
    else if (state === "unsaved") save();
  };

  const sc = STATE_COLORS[state];
  const display = state === "idle" ? saved : pending;

  return (
    <FieldShell label={label} icon={icon} state={state}
      onStartEdit={startEdit} onAction={onAction} minW={minW}>
      <div className="flex flex-wrap gap-[4px] min-h-[22px] items-center">
        {display.length === 0 && <span className="text-[#c8cfdb]" style={{ fontSize: 13, ...ff }}>&mdash;</span>}
        {display.map((s) => {
          const o = options.find((x) => x.label === s);
          const c = state === "unsaved" ? sc.value : (o?.color || "#98989d");
          return (
            <span key={s} className="inline-flex items-center h-[22px] px-[8px] rounded-[6px]"
              style={{
                backgroundColor: state === "unsaved" ? `${sc.value}20` : `${o?.color || "#98989d"}20`,
                color: c, fontSize: 12, fontWeight: 600, letterSpacing: 0.2, ...ff,
              }}>
              {s}
              {state !== "idle" && (
                <button onClick={(e) => { e.stopPropagation(); toggle(s); }}
                  className="ml-[4px] hover:opacity-70 cursor-pointer"><X size={9} weight="bold" /></button>
              )}
            </span>
          );
        })}
      </div>
      {state === "editing" && (
        <Dropdown onClose={cancel} width={200}>
          {options.map((o) => (
            <DropItem key={o.label} label={o.label} color={o.color} selected={pending.includes(o.label)}
              onClick={() => toggle(o.label)} />
          ))}
        </Dropdown>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  COMBOBOX FIELD (picklist + search)                                */
/* ================================================================ */

function ComboboxField({ label, icon, defaultValue, options, minW }: {
  label: string; icon: ReactNode; defaultValue: string;
  options: { label: string; color: string }[]; minW?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [state, setState] = useState<FieldState>("idle");
  const [pendingValue, setPendingValue] = useState(defaultValue);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const current = options.find((o) => o.label === (state === "idle" ? value : pendingValue));
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  const startEdit = () => { setPendingValue(value); setSearch(""); setState("editing"); };
  const cancel = () => { setPendingValue(value); setState("idle"); };
  const select = (v: string) => {
    setPendingValue(v);
    if (v !== value) setState("unsaved");
    else setState("idle");
  };
  const save = () => { setValue(pendingValue); setState("idle"); };
  const onAction = () => {
    if (state === "editing") cancel();
    else if (state === "unsaved") save();
  };

  useEffect(() => { if (state === "editing") setTimeout(() => searchRef.current?.focus(), 50); }, [state]);

  const sc = STATE_COLORS[state];

  return (
    <FieldShell label={label} icon={icon} state={state}
      onStartEdit={startEdit} onAction={onAction} minW={minW}>
      <span style={{ ...valueStyle, color: state === "unsaved" ? sc.value : "#4e6987" }}>
        {state === "idle" ? value : pendingValue}
      </span>
      {state === "editing" && (
        <Dropdown onClose={cancel} width={200}>
          <div className="p-[8px]">
            <div
              className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
              style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
            >
              <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-[#28415c] outline-none min-w-0 placeholder:text-[#c8cfdb]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }} />
            </div>
          </div>
          {filtered.map((o) => (
            <DropItem key={o.label} label={o.label} selected={o.label === value}
              onClick={() => select(o.label)} />
          ))}
          {filtered.length === 0 && (
            <div className="px-[10px] py-[8px] text-[#98989d]" style={{ fontSize: 12, ...ff }}>Nenhum resultado</div>
          )}
        </Dropdown>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  USER FIELD                                                        */
/* ================================================================ */

const MOCK_USERS = [
  { name: "Marcelo Silva", initials: "MS", role: "Gerente Comercial" },
  { name: "Ana Costa", initials: "AC", role: "Executiva de Contas" },
  { name: "Pedro Souza", initials: "PS", role: "SDR" },
  { name: "Julia Lima", initials: "JL", role: "Diretora de Vendas" },
  { name: "Carlos Dias", initials: "CD", role: "Analista CRM" },
];

function UserField({ label, icon, defaultValue, minW }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [state, setState] = useState<FieldState>("idle");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const filtered = MOCK_USERS.filter((u) =>
    u.name !== value && u.name.toLowerCase().includes(search.toLowerCase())
  );
  const currentUser = MOCK_USERS.find((u) => u.name === value);
  const isEmpty = !value;

  const startEdit = () => { setSearch(""); setState("editing"); };
  const cancel = () => { setState("idle"); };
  const selectUser = (name: string) => {
    setValue(name);
    setState("idle");
  };
  const removeUser = () => {
    setValue("");
    setState("idle");
  };

  useEffect(() => {
    if (state === "editing") setTimeout(() => searchRef.current?.focus(), 50);
  }, [state]);

  // Close popover on outside click
  useEffect(() => {
    if (state !== "editing") return;
    const h = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) cancel();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [state]);

  return (
    <FieldShell label={label} icon={icon} state={state}
      onStartEdit={startEdit} onAction={cancel} minW={minW}>
      {/* Value display */}
      {isEmpty ? (
        <span className="text-[#c8cfdb]" style={valueStyle}>&mdash;</span>
      ) : (
        <>
          {currentUser && (
            <span className="size-[16px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
              style={{ fontSize: 7, fontWeight: 700, ...ff }}>{currentUser.initials}</span>
          )}
          <span className="underline decoration-transparent group-hover:decoration-current transition-all duration-200 underline-offset-2"
            style={{ ...valueStyle, color: "#0483AB" }}>{value}</span>
        </>
      )}

      {/* DS Popover: usuario vinculado + busca + remover */}
      {state === "editing" && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-[4px] z-50 bg-white rounded-[12px] overflow-hidden"
          style={{ width: 280, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", ...ff }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Current linked user */}
          {!isEmpty && currentUser && (
            <>
              <div className="px-[12px] pt-[10px] pb-[6px]">
                <span className="text-[#98989d] uppercase block mb-[6px]"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                  Proprietário atual
                </span>
                <div className="flex items-center gap-[8px] p-[8px] rounded-[8px] bg-[#f6f7f9]">
                  <div className="flex items-center justify-center size-[28px] rounded-full shrink-0 bg-[#dde3ec] text-[#4e6987]"
                    style={{ fontSize: 10, fontWeight: 700, ...ff }}>
                    {currentUser.initials}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#28415c] truncate"
                      style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                      {currentUser.name}
                    </span>
                    <span className="text-[#98989d]"
                      style={{ fontSize: 10, fontWeight: 500, ...ff }}>
                      {currentUser.role}
                    </span>
                  </div>
                  <button className="flex items-center justify-center size-[24px] rounded-full hover:bg-[#DCF0FF] text-[#0483AB] transition-colors shrink-0 cursor-pointer"
                    title="Abrir perfil">
                    <ArrowSquareOut size={13} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="h-[1px] bg-[#eceef1] mx-[12px]" />
            </>
          )}

          {/* Search input — DS style: bg-[#DDE3EC] inner shadow */}
          <div className="px-[12px] py-[6px]">
            <div
              className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
              style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
            >
              <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-[#28415c] outline-none min-w-0 placeholder:text-[#c8cfdb]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }} />
            </div>
          </div>

          {/* Search results */}
          {search.length > 0 && (
            <div className="max-h-[160px] overflow-y-auto">
              {filtered.map((u) => (
                <button key={u.name} onClick={() => selectUser(u.name)}
                  className="w-full flex items-center gap-[8px] px-[12px] py-[6px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer">
                  <div className="flex items-center justify-center size-[24px] rounded-full shrink-0 bg-[#dde3ec] text-[#4e6987]"
                    style={{ fontSize: 8, fontWeight: 700, ...ff }}>
                    {u.initials}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                      {u.name}
                    </span>
                    <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 500, ...ff }}>
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-[12px] py-[8px] text-[#98989d]" style={{ fontSize: 12, ...ff }}>
                  Nenhum resultado
                </div>
              )}
            </div>
          )}

          {/* Remove user */}
          {!isEmpty && (
            <div className="px-[12px] pb-[10px] pt-[2px]">
              <button
                onClick={removeUser}
                className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] bg-[#F6F7F9] hover:bg-[#FFEDEB] text-[#F56233] transition-colors cursor-pointer"
              >
                <LinkBreak size={13} weight="bold" />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...ff }}>
                  Remover proprietário
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  BOOLEAN FIELD                                                     */
/* ================================================================ */

function BooleanField({ label, icon, defaultValue, minW }: {
  label: string; icon: ReactNode; defaultValue: boolean; minW?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <FieldShell label={label} icon={icon} state="idle"
      onStartEdit={() => setValue(!value)} minW={minW}>
      <button onClick={(e) => { e.stopPropagation(); setValue(!value); }}
        className="relative w-[36px] h-[20px] rounded-full transition-colors cursor-pointer shrink-0"
        style={{ backgroundColor: value ? "#07ABDE" : "#C8CFDB" }}>
        <span className="absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-[left]"
          style={{ left: value ? 18 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </button>
      <span className="text-[#4e6987]" style={valueStyle}>{value ? "Sim" : "Nao"}</span>
    </FieldShell>
  );
}

/* ================================================================ */
/*  ASSOCIATION FIELD — DS popover with linked record + search        */
/* ================================================================ */

const MOCK_ACCOUNTS = [
  { name: "Alpha Tecnologia", icon: "A", meta: "Tecnologia · São Paulo, SP" },
  { name: "Beta Consultoria", icon: "B", meta: "Consultoria · Rio de Janeiro, RJ" },
  { name: "Gamma Seguros", icon: "G", meta: "Seguros · Curitiba, PR" },
  { name: "Delta Logistica", icon: "D", meta: "Logistica · Belo Horizonte, MG" },
];

function AssociationField({ label, icon, defaultValue, minW }: {
  label: string; icon: ReactNode; defaultValue: string; minW?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [state, setState] = useState<FieldState>("idle");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const filtered = MOCK_ACCOUNTS.filter((a) =>
    a.name !== value && a.name.toLowerCase().includes(search.toLowerCase())
  );
  const currentAccount = MOCK_ACCOUNTS.find((a) => a.name === value);
  const isEmpty = !value;

  const startEdit = () => { setSearch(""); setState("editing"); };
  const cancel = () => { setState("idle"); };
  const selectAccount = (name: string) => {
    setValue(name);
    setState("idle");
  };
  const removeLink = () => {
    setValue("");
    setState("idle");
  };

  useEffect(() => {
    if (state === "editing") setTimeout(() => searchRef.current?.focus(), 50);
  }, [state]);

  // Close popover on outside click
  useEffect(() => {
    if (state !== "editing") return;
    const h = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) cancel();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [state]);

  const sc = STATE_COLORS[state];

  return (
    <FieldShell label={label} icon={icon} state={state}
      onStartEdit={startEdit} onAction={cancel} minW={minW}>
      {/* Value display */}
      {isEmpty ? (
        <span className="text-[#c8cfdb]" style={valueStyle}>&mdash;</span>
      ) : (
        <>
          <Building size={14} weight="duotone" className="text-[#3CCEA7] shrink-0" />
          <span className="underline decoration-transparent group-hover:decoration-current transition-all duration-200 underline-offset-2"
            style={{ ...valueStyle, color: "#0483AB" }}>{value}</span>
        </>
      )}

      {/* DS Popover: registro vinculado + busca + remover */}
      {state === "editing" && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-[4px] z-50 bg-white rounded-[12px] overflow-hidden"
          style={{ width: 280, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", ...ff }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Current linked record */}
          {!isEmpty && currentAccount && (
            <>
              <div className="px-[12px] pt-[10px] pb-[6px]">
                <span className="text-[#98989d] uppercase block mb-[6px]"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                  Registro vinculado
                </span>
                <div className="flex items-center gap-[8px] p-[8px] rounded-[8px] bg-[#f6f7f9]">
                  <div className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0"
                    style={{ backgroundColor: "#D9F8EF" }}>
                    <Building size={14} weight="duotone" className="text-[#3CCEA7]" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#28415c] truncate"
                      style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                      {currentAccount.name}
                    </span>
                    <span className="text-[#98989d]"
                      style={{ fontSize: 10, fontWeight: 500, ...ff }}>
                      {currentAccount.meta}
                    </span>
                  </div>
                  <button className="flex items-center justify-center size-[24px] rounded-full hover:bg-[#DCF0FF] text-[#0483AB] transition-colors shrink-0 cursor-pointer"
                    title="Abrir registro">
                    <ArrowSquareOut size={13} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="h-[1px] bg-[#eceef1] mx-[12px]" />
            </>
          )}

          {/* Search input — DS style: bg-[#DDE3EC] inner shadow */}
          <div className="px-[12px] py-[6px]">
            <div
              className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
              style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
            >
              <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-[#28415c] outline-none min-w-0 placeholder:text-[#c8cfdb]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }} />
            </div>
          </div>

          {/* Search results */}
          {search.length > 0 && (
            <div className="max-h-[160px] overflow-y-auto">
              {filtered.map((a) => (
                <button key={a.name} onClick={() => selectAccount(a.name)}
                  className="w-full flex items-center gap-[8px] px-[12px] py-[6px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer">
                  <div className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                    style={{ backgroundColor: "#D9F8EF" }}>
                    <Building size={12} weight="duotone" className="text-[#3CCEA7]" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                      {a.name}
                    </span>
                    <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 500, ...ff }}>
                      {a.meta}
                    </span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-[12px] py-[8px] text-[#98989d]" style={{ fontSize: 12, ...ff }}>
                  Nenhum resultado
                </div>
              )}
            </div>
          )}

          {/* Remove link — destructive action */}
          {!isEmpty && (
            <div className="px-[12px] pb-[10px] pt-[2px]">
              <button
                onClick={removeLink}
                className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] bg-[#F6F7F9] hover:bg-[#FFEDEB] text-[#F56233] transition-colors cursor-pointer"
              >
                <LinkBreak size={13} weight="bold" />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...ff }}>
                  Remover vínculo
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </FieldShell>
  );
}

/* ================================================================ */
/*  READ-ONLY FIELD                                                   */
/* ================================================================ */

function ReadOnlyField({ label, icon, value, minW, mono }: {
  label: string; icon: ReactNode; value: string; minW?: string; mono?: boolean;
}) {
  return (
    <FieldShell label={label} icon={icon} state="idle" onStartEdit={() => {}} readOnly minW={minW}>
      <span className={mono ? "text-[#98989d] font-mono" : "text-[#4e6987]"}
        style={mono ? { fontSize: 13, fontWeight: 500, letterSpacing: 0, lineHeight: "22px" } : valueStyle}>
        {value}
      </span>
    </FieldShell>
  );
}

/* ================================================================ */
/*  ERROR DEMO FIELD — shows error state from DS                      */
/* ================================================================ */

function ErrorDemoField({ label, icon, errorValue, errorMsg, minW }: {
  label: string; icon: ReactNode; errorValue: string; errorMsg?: string; minW?: string;
}) {
  const [state, setState] = useState<FieldState>("error");
  const sc = STATE_COLORS.error;

  return (
    <FieldShell label={`${label}*`} icon={icon} state={state}
      onStartEdit={() => {}} onAction={() => setState("idle")} minW={minW}>
      <span style={{ ...valueStyle, color: sc.value }}>
        {errorMsg || errorValue}
      </span>
    </FieldShell>
  );
}

/* ================================================================ */
/*  EXPORT: main component                                            */
/* ================================================================ */

export function InteractiveFieldExamples() {
  return (
    <>
      {/* ── Texto & Comunicacao ── */}
      <span className="text-[#98989d] uppercase block mb-[8px]" style={catStyle}>
        Texto & Comunicacao
      </span>
      <div className="flex items-start gap-[12px] flex-wrap mb-[16px]">
        <TextField label="Razao Social" icon={<TextT size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Alpha Tecnologia LTDA" minW="180px" />
        <TextAreaField label="Descricao" icon={<TextAlignLeft size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Empresa focada em solucoes cloud para o setor financeiro com atuacao nacional." minW="260px" maxW="320px" />
        <TextField label="Telefone" icon={<Phone size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="(11) 98765-4321" minW="180px" actionColor />
        <TextField label="Email" icon={<EnvelopeSimple size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="contato@alpha.com.br" minW="200px" actionColor />
        <TextField label="Website" icon={<LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="alpha.com.br" minW="180px" actionColor />
      </div>

      {/* ── Data & Tempo ── */}
      <span className="text-[#98989d] uppercase block mb-[8px]" style={catStyle}>
        Data & Tempo
      </span>
      <div className="flex items-start gap-[12px] flex-wrap mb-[16px]">
        <DateField label="Data de Nascimento" icon={<Calendar size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="15/03/1992" minW="160px" />
        <TimeField label="Horario" icon={<Timer size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="14:30" minW="120px" />
        <DateTimeField label="Proximo Contato" icon={<Calendar size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="28/02/2026 às 10:00" minW="200px" />
        <DurationField label="Duracao" icon={<Timer size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="1h 30min" minW="140px" />
      </div>

      {/* ── Numerico & Monetario ── */}
      <span className="text-[#98989d] uppercase block mb-[8px]" style={catStyle}>
        Numerico & Monetario
      </span>
      <div className="flex items-start gap-[12px] flex-wrap mb-[16px]">
        <NumberField label="Funcionarios" icon={<Hash size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="245" minW="140px" />
        <NumberField label="Probabilidade" icon={<Percent size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="75" suffix="%" minW="140px" />
        <NumberField label="Receita Anual" icon={<CurrencyDollar size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="1.500.000,00" prefix="R$ " minW="180px" />
      </div>

      {/* ── Selecao & Listas ── */}
      <span className="text-[#98989d] uppercase block mb-[8px]" style={catStyle}>
        Selecao & Listas
      </span>
      <div className="flex items-start gap-[12px] flex-wrap mb-[16px]">
        <PicklistField label="Setor" icon={<ListBullets size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Tecnologia"
          options={[
            { label: "Tecnologia", color: "#07ABDE" },
            { label: "Financeiro", color: "#3CCEA7" },
            { label: "Saude", color: "#FF8C76" },
            { label: "Educacao", color: "#8C8CD4" },
            { label: "Varejo", color: "#EAC23D" },
          ]} minW="160px" />
        <MultiPicklistField label="Tags" icon={<Tag size={10} weight="bold" className="text-[#98989d]" />}
          defaultValues={["VIP", "Enterprise", "Prioridade"]}
          options={[
            { label: "VIP", color: "#3CCEA7" },
            { label: "Enterprise", color: "#07ABDE" },
            { label: "Prioridade", color: "#EAC23D" },
            { label: "Parceiro", color: "#8C8CD4" },
            { label: "Inativo", color: "#98989d" },
          ]} minW="220px" />
        <ComboboxField label="Origem" icon={<CaretCircleUpDown size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Indicacao"
          options={[
            { label: "Indicacao", color: "#8C8CD4" },
            { label: "Website", color: "#07ABDE" },
            { label: "Evento", color: "#FF8C76" },
            { label: "Cold Call", color: "#4E6987" },
            { label: "LinkedIn", color: "#3CCEA7" },
          ]} minW="180px" />
      </div>

      {/* ── Referencia & Estrutura ── */}
      <span className="text-[#98989d] uppercase block mb-[8px]" style={catStyle}>
        Referencia & Estrutura
      </span>
      <div className="flex items-start gap-[12px] flex-wrap mb-[16px]">
        <UserField label="Proprietario" icon={<UserCircle size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Marcelo Silva" minW="180px" />
        <BooleanField label="Opt-in Email" icon={<ToggleLeft size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue={true} minW="140px" />
        <TextField label="Endereco" icon={<MapPin size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Av. Paulista, 1000 — Sao Paulo, SP" minW="240px" />
        <AssociationField label="Conta" icon={<LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Alpha Tecnologia" minW="180px" />
      </div>

      {/* ── Sistema & Automacao ── */}
      <span className="text-[#98989d] uppercase block mb-[8px]" style={catStyle}>
        Sistema & Automacao
      </span>
      <div className="flex items-start gap-[12px] flex-wrap mb-[16px]">
        <PicklistField label="Pipeline" icon={<Shapes size={10} weight="bold" className="text-[#98989d]" />}
          defaultValue="Vendas B2B"
          options={[
            { label: "Vendas B2B", color: "#3CCEA7" },
            { label: "Vendas B2C", color: "#07ABDE" },
            { label: "Parcerias", color: "#8C8CD4" },
            { label: "Pos-venda", color: "#EAC23D" },
          ]} minW="160px" />
        <ReadOnlyField label="Valor Total" icon={<FunctionIcon size={10} weight="bold" className="text-[#98989d]" />}
          value="R$ 45.000,00" minW="160px" />
        <ReadOnlyField label="Score IA" icon={<Sparkle size={10} weight="duotone" className="text-[#98989d]" />}
          value="87" minW="120px" />
        <ReadOnlyField label="ID" icon={<Fingerprint size={10} weight="bold" className="text-[#98989d]" />}
          value="acc_7f3a2b91e4d0" minW="200px" mono />
      </div>

      {/* ── Estado: Erro (demo) ── */}
      <span className="text-[#98989d] uppercase block mb-[8px]" style={catStyle}>
        Estado: Erro (demonstracao)
      </span>
      <div className="flex items-start gap-[12px] flex-wrap mb-[16px]">
        <ErrorDemoField label="Email" icon={<EnvelopeSimple size={10} weight="bold" style={{ color: "#f56233" }} />}
          errorValue="email-invalido" minW="180px" />
        <ErrorDemoField label="Telefone" icon={<Phone size={10} weight="bold" style={{ color: "#f56233" }} />}
          errorValue="" errorMsg="Campo obrigatorio" minW="160px" />
      </div>

      <span className="text-[#98989d] font-mono block mb-[4px]" style={{ fontSize: 10 }}>
        Fluxo: Idle → clique → Editing (azul, X cancela) → altere valor → Unsaved (amarelo, Check salva) → clique Check → Idle · Erro: vermelho, X descarta · Read-only: bg permanente, sem hover · Campos de acao: valor #0483AB · Usuario: avatar + #0483AB
      </span>
    </>
  );
}