/**
 * Unified Create Activity Modal — Zenite CRM
 *
 * Single modal for creating all 6 activity types.
 * Segmented control switches type; fields adapt dynamically.
 * Footer always shows: entity link + owner picker (left) | cancel + save (right).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CalendarBlank,
  CheckCircle,
  Phone,
  NoteBlank,
  ChatCircle,
  Envelope,
  X,
  CaretDown,
  Spinner,
  LinkSimpleHorizontal,
  UserCircle,
  Building,
  Heart,
  IdentificationCard,
  SketchLogo,
  PencilSimple,
  MagnifyingGlass,
  LinkBreak,
  ArrowSquareOut,
  Check,
  Timer,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  createActivity,
  createGoogleTask,
  generateCrmId,
  listAccounts,
  listOpportunities,
  listContacts,
  listLeads,
  type DbActivity,
} from "./crm-api";
import { useTeamMembers } from "./use-team-members";
import { useAuth } from "../auth-context";

/* ================================================================== */
/*  Shared tokens                                                      */
/* ================================================================== */

import {
  fontFeature,
  modalInputCls as inputCls,
  modalInputStyle as inputStyle,
  modalLabelStyle as labelStyle,
  type ActivityType,
  ACTIVITY_TYPE_CONFIG,
  ACTIVITY_TYPE_KEYS,
  STATUS_BY_TYPE,
  PRIORITY_CONFIG,
  PRIORITY_OPTIONS,
  TAG_OPTIONS,
  CALL_TYPE_OPTIONS,
  CHANNEL_OPTIONS,
  NOTE_VISIBILITY_OPTIONS,
  REMINDER_OPTIONS,
  ENTITY_BADGE,
  ASSOC_TYPE_CONFIG,
  getDefaultStatus,
} from "./activity-config";

/* ================================================================== */
/*  Activity type config                                               */
/* ================================================================== */

export type { ActivityType } from "./activity-config";

interface TypeConfig {
  key: ActivityType;
  label: string;
  color: string;
  bg: string;
  icon: React.ComponentType<any>;
}

const ACTIVITY_TYPES: TypeConfig[] = ACTIVITY_TYPE_KEYS.map((key) => {
  const c = ACTIVITY_TYPE_CONFIG[key];
  const iconMap: Record<ActivityType, React.ComponentType<any>> = {
    compromisso: CalendarBlank,
    tarefa: CheckCircle,
    ligacao: Phone,
    nota: NoteBlank,
    mensagem: ChatCircle,
    email: Envelope,
  };
  return { key, label: c.label, color: c.color, bg: c.bg, icon: iconMap[key] };
});

/* ── Entity icon/color config for DS link fields (modal-specific, includes icon components) ── */
const ENTITY_ICON_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
  conta:        { icon: Building,           color: "#3CCEA7", bg: "#D9F8EF", label: "Conta" },
  lead:         { icon: Heart,              color: "#EAC23D", bg: "#FEEDCA", label: "Lead" },
  contato:      { icon: IdentificationCard, color: "#FF8C76", bg: "#FFEDEB", label: "Contato" },
  oportunidade: { icon: SketchLogo,         color: "#07ABDE", bg: "#DCF0FF", label: "Oportunidade" },
};

/* ================================================================== */
/*  Form state                                                         */
/* ================================================================== */

interface ActivityForm {
  type: ActivityType;
  subject: string;
  description: string;
  status: string;
  priority: string;
  tags: string[];
  body: string;
  /* Datas */
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  dueDate: string;
  allDay: boolean;
  /* Compromisso */
  location: string;
  meetLink: string;
  reminder: string[];
  /* Tarefa */
  assignedTo: string;
  /* Ligacao */
  contactId: string;
  contactName: string;
  callType: string;
  callDuration: string;
  callResult: string;
  /* Mensagem */
  channel: string;
  recipient: string;
  recipientContactId: string;
  recipientPhone: string;
  /* Nota */
  noteVisibility: string;
  /* Footer */
  owner: string;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  /* Compromisso — convidados (multi-select for meeting invites) */
  convidados: { id: string; name: string; email?: string }[];
}

function getDefaultForm(type: ActivityType = "compromisso"): ActivityForm {
  const defaultStatus = STATUS_BY_TYPE[type][0]?.key || "";
  return {
    type,
    subject: "",
    description: "",
    status: defaultStatus,
    priority: "normal",
    tags: [],
    body: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    dueDate: "",
    allDay: false,
    location: "",
    meetLink: "",
    reminder: [],
    assignedTo: "",
    contactId: "",
    contactName: "",
    callType: "saida",
    callDuration: "",
    callResult: "",
    channel: "whatsapp",
    recipient: "",
    recipientContactId: "",
    recipientPhone: "",
    noteVisibility: "publica",
    owner: "",
    relatedToType: "",
    relatedToId: "",
    relatedToName: "",
    convidados: [],
  };
}

/* ================================================================== */
/*  Pill Select helper (DS pill-style select)                          */
/* ================================================================== */

function PillSelect({ value, options, onChange }: {
  value: string;
  options: { key: string; label: string; color: string; bg: string }[];
  onChange: (v: string) => void;
}) {
  const cur = options.find((o) => o.key === value) || options[0];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[28px] px-[10px] pr-[24px] rounded-[500px] border-none outline-none cursor-pointer uppercase appearance-none w-fit"
      style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
        color: cur.color,
        backgroundColor: cur.bg,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256'%3E%3Cpath d='M128,188a12,12,0,0,1-8.49-3.51l-80-80a12,12,0,0,1,17-17L128,159,199.51,87.51a12,12,0,0,1,17,17l-80,80A12,12,0,0,1,128,188Z' fill='${encodeURIComponent(cur.color)}'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        ...fontFeature,
      }}
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>{o.label}</option>
      ))}
    </select>
  );
}

/* ================================================================== */
/*  Context Status Field (DS contextual field pattern)                  */
/* ================================================================== */

function ContextStatusField({ value, options, onChange, label: fieldLabel = "Status" }: {
  value: string;
  options: { key: string; label: string; color: string; bg: string }[];
  onChange: (v: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 200 });
  const cur = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 200) });
    }
  }, [open]);

  return (
    <div ref={btnRef} className={`relative flex flex-col gap-0 rounded-[8px] transition-all cursor-pointer ${open ? "" : "hover:bg-[#f6f7f9] group"}`}
      style={{ padding: open ? 5 : 6, border: `1px solid ${open ? "#07abde" : "transparent"}` }}
      onClick={() => !open && setOpen(true)}
    >
      {/* Label row */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: open ? "#07abde" : "#98989d", ...fontFeature }}>
          {fieldLabel}
        </span>
      </div>
      {/* Value row */}
      <div className="flex items-center gap-[6px] min-h-[22px]">
        <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: cur.color }} />
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: "#4e6987", ...fontFeature }}>
          {cur.label}
        </span>
      </div>
      {/* Idle: Pencil on hover */}
      {!open && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X button */}
      {open && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
      {/* Dropdown — portal */}
      {open && createPortal(
        <div ref={ref} className="fixed bg-white rounded-[10px] border border-[#eceef1] pb-[4px]"
          style={{ top: pos.top, left: pos.left, width: pos.width, zIndex: 99999, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", ...fontFeature }} onClick={(e) => e.stopPropagation()}>
          {options.map((o) => (
            <button key={o.key} onClick={() => { onChange(o.key); setOpen(false); }}
              className={`w-full flex items-center gap-[8px] px-[10px] py-[5px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer ${o.key === value ? "bg-[#f0f8ff]" : ""}`}>
              <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: o.color }} />
              <span className="text-[#4e6987] truncate" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>{o.label}</span>
              {o.key === value && <Check size={12} weight="bold" className="text-[#07ABDE] ml-auto shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================================================================== */
/*  DS Date Field (field shell with 4 DS states)                       */
/* ================================================================== */

function DSDateField({ label: fieldLabel, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.showPicker(); } catch {}
    }
  }, [editing]);

  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div
      className={`relative flex flex-col gap-0 rounded-[8px] transition-all ${editing ? "" : "hover:bg-[#f6f7f9] group cursor-pointer"}`}
      style={{ padding: editing ? 5 : 6, border: `1px solid ${editing ? "#07abde" : "transparent"}` }}
      onClick={() => { if (!editing) setEditing(true); }}
    >
      {/* Label row */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: editing ? "#07abde" : "#98989d", ...fontFeature }}>
          {fieldLabel}
        </span>
        <CalendarBlank size={10} weight="bold" style={{ color: editing ? "#07abde" : "#98989d" }} />
      </div>
      {/* Value row */}
      <div className="flex items-center gap-[6px] min-h-[22px]">
        {editing ? (
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setEditing(false); }}
            className="bg-transparent outline-none text-[#4e6987] w-full"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          />
        ) : (
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: value ? "#4e6987" : "#c8cfdb", ...fontFeature }}>
            {value ? formatDate(value) : "—"}
          </span>
        )}
      </div>
      {/* Idle: Pencil on hover */}
      {!editing && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X button */}
      {editing && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  DS DateTime Field (date + optional time, DS shell)                  */
/* ================================================================== */

function DSDateTimeField({ label: fieldLabel, dateValue, timeValue, onDateChange, onTimeChange, showTime = true }: {
  label: string;
  dateValue: string;
  timeValue?: string;
  onDateChange: (v: string) => void;
  onTimeChange?: (v: string) => void;
  showTime?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && dateRef.current) {
      dateRef.current.focus();
      try { dateRef.current.showPicker(); } catch {}
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [editing]);

  const formatDate = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
  };

  const displayValue = () => {
    const parts: string[] = [];
    if (dateValue) parts.push(formatDate(dateValue));
    if (showTime && timeValue) parts.push(timeValue);
    return parts.join(", ") || "";
  };

  return (
    <div
      ref={wrapRef}
      className={`relative flex flex-col gap-0 rounded-[8px] transition-all ${editing ? "" : "hover:bg-[#f6f7f9] group cursor-pointer"}`}
      style={{ padding: editing ? 5 : 6, border: `1px solid ${editing ? "#07abde" : "transparent"}` }}
      onClick={() => { if (!editing) setEditing(true); }}
    >
      {/* Label */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: editing ? "#07abde" : "#98989d", ...fontFeature }}>
          {fieldLabel}
        </span>
        <CalendarBlank size={10} weight="bold" style={{ color: editing ? "#07abde" : "#98989d" }} />
      </div>
      {/* Value */}
      <div className="flex items-center gap-[6px] min-h-[22px]">
        {editing ? (
          <>
            <input
              ref={dateRef}
              type="date"
              value={dateValue}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent outline-none text-[#4e6987] flex-1 min-w-0"
              style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", colorScheme: "light", ...fontFeature }}
            />
            {showTime && onTimeChange && (
              <input
                type="time"
                value={timeValue || ""}
                onChange={(e) => onTimeChange(e.target.value)}
                className="bg-transparent outline-none text-[#4e6987] w-[80px]"
                style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", colorScheme: "light", ...fontFeature }}
              />
            )}
          </>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: displayValue() ? "#4e6987" : "#c8cfdb", ...fontFeature }}>
            {displayValue() || "\u2014"}
          </span>
        )}
      </div>
      {/* Idle: Pencil */}
      {!editing && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X */}
      {editing && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  DS Multi-Select Field (picklist with multi-select)                  */
/* ================================================================== */

function DSMultiSelectField({ label: fieldLabel, selected, options, onToggle, emptyLabel = "Nenhum" }: {
  label: string;
  selected: string[];
  options: { key: string; label: string; color: string }[];
  onToggle: (key: string) => void;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 200 });

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 200) });
    }
  }, [open]);

  const selectedOptions = options.filter((o) => selected.includes(o.key));

  return (
    <div ref={btnRef} className={`relative flex flex-col gap-0 rounded-[8px] transition-all cursor-pointer ${open ? "" : "hover:bg-[#f6f7f9] group"}`}
      style={{ padding: open ? 5 : 6, border: `1px solid ${open ? "#07abde" : "transparent"}` }}
      onClick={() => !open && setOpen(true)}
    >
      {/* Label row */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: open ? "#07abde" : "#98989d", ...fontFeature }}>
          {fieldLabel}
        </span>
      </div>
      {/* Value row — show tags or empty label */}
      <div className="flex items-center gap-[4px] min-h-[22px] flex-wrap">
        {selectedOptions.length === 0 ? (
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: "#c8cfdb", ...fontFeature }}>
            {emptyLabel}
          </span>
        ) : (
          selectedOptions.map((o) => (
            <span key={o.key} className="inline-flex items-center h-[22px] px-[8px] rounded-[6px]"
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.2, color: o.color, backgroundColor: `${o.color}20`, ...fontFeature }}>
              {o.label}
            </span>
          ))
        )}
      </div>
      {/* Idle: Pencil on hover */}
      {!open && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X button */}
      {open && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
      {/* Dropdown — portal */}
      {open && createPortal(
        <div ref={ref} className="fixed bg-white rounded-[10px] border border-[#eceef1] py-[4px]"
          style={{ top: pos.top, left: pos.left, width: pos.width, zIndex: 99999, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", ...fontFeature }} onClick={(e) => e.stopPropagation()}>
          {options.map((o) => {
            const active = selected.includes(o.key);
            return (
              <button key={o.key} onClick={() => onToggle(o.key)}
                className={`w-full flex items-center gap-[8px] px-[10px] py-[5px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer ${active ? "bg-[#f0f8ff]" : ""}`}>
                <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: o.color }} />
                <span className="text-[#4e6987] truncate" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>{o.label}</span>
                {active && <Check size={12} weight="bold" className="text-[#07ABDE] ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================================================================== */
/*  DS Textarea Field (long text with 4-state shell)                    */
/* ================================================================== */

function DSTextareaField({ label: fieldLabel, value, onChange, placeholder = "" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [editing]);

  useEffect(() => {
    if (editing) requestAnimationFrame(() => taRef.current?.focus());
  }, [editing]);

  return (
    <div ref={ref}
      className={`relative flex flex-col gap-0 rounded-[8px] transition-all ${editing ? "" : "hover:bg-[#f6f7f9] group cursor-pointer"}`}
      style={{ padding: editing ? 5 : 6, border: `1px solid ${editing ? "#07abde" : "transparent"}` }}
      onClick={() => !editing && setEditing(true)}
    >
      {/* Label */}
      <div className="flex items-center">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: editing ? "#07abde" : "#98989d", ...fontFeature }}>
          {fieldLabel}
        </span>
      </div>
      {/* Value / Textarea */}
      {editing ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="text-[#4E6987] bg-transparent outline-none w-full min-w-0 resize-y"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}
        />
      ) : (
        <div className="min-h-[22px] flex items-start">
          <span className="line-clamp-2" style={{
            fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px",
            color: value ? "#4E6987" : "#c8cfdb", ...fontFeature,
          }}>
            {value || placeholder}
          </span>
        </div>
      )}
      {/* Idle: Pencil on hover */}
      {!editing && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X button */}
      {editing && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  DS Duration Field (number input with min suffix, 4-state shell)     */
/* ================================================================== */

function DSDurationField({ label: fieldLabel, value, onChange, placeholder = "0" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [editing]);

  useEffect(() => {
    if (editing) requestAnimationFrame(() => inputRef.current?.focus());
  }, [editing]);

  const displayValue = value ? `${value} min` : "";

  return (
    <div ref={ref}
      className={`relative flex flex-col gap-0 rounded-[8px] transition-all ${editing ? "" : "hover:bg-[#f6f7f9] group cursor-pointer"}`}
      style={{ padding: editing ? 5 : 6, border: `1px solid ${editing ? "#07abde" : "transparent"}` }}
      onClick={() => !editing && setEditing(true)}
    >
      {/* Label */}
      <div className="flex items-center">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: editing ? "#07abde" : "#98989d", ...fontFeature }}>
          {fieldLabel}
        </span>
      </div>
      {/* Value / Input */}
      {editing ? (
        <div className="flex items-center gap-[6px]">
          <Timer size={15} weight="bold" className="text-[#07abde] shrink-0" />
          <input
            ref={inputRef}
            type="number"
            min="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="text-[#4E6987] bg-transparent outline-none w-full min-w-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          />
          <span className="text-[#98989d] shrink-0" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>min</span>
        </div>
      ) : (
        <div className="min-h-[22px] flex items-center gap-[6px]">
          {value && <Timer size={14} weight="duotone" className="text-[#98989d] shrink-0" />}
          <span style={{
            fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px",
            color: displayValue ? "#4E6987" : "#c8cfdb", ...fontFeature,
          }}>
            {displayValue || placeholder + " min"}
          </span>
        </div>
      )}
      {/* Idle: Pencil on hover */}
      {!editing && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X button */}
      {editing && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  DS User Field (field shell + popover)                               */
/* ================================================================== */

function DSUserField({ label: fieldLabel, value, onChange, teamMembers, placeholder = "Selecionar...", className = "" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  teamMembers: { id: string; name: string; email: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 220 });

  // Resolve member by UUID or name (backward compat for legacy name values)
  const resolved = useMemo(() => {
    if (!value) return null;
    return teamMembers.find((m) => m.id === value) || teamMembers.find((m) => m.name === value) || null;
  }, [value, teamMembers]);
  const displayName = resolved?.name || value;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.top - 4, left: r.left, width: Math.max(r.width, 220) });
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return teamMembers.slice(0, 8);
    const q = search.toLowerCase();
    return teamMembers.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 8);
  }, [search, teamMembers]);

  return (
    <div ref={btnRef}
      className={`relative flex flex-col gap-0 rounded-[8px] transition-all ${open ? "" : "hover:bg-[#f6f7f9] group cursor-pointer"} ${className}`}
      style={{ padding: open ? 5 : 6, border: `1px solid ${open ? "#07abde" : "transparent"}` }}
      onClick={() => { if (!open) { setOpen(true); setSearch(""); } }}
    >
      {/* Label */}
      <div className="flex items-center">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: open ? "#07abde" : "#98989d", ...fontFeature }}>
          {fieldLabel}
        </span>
      </div>
      {/* Value row */}
      <div className="flex items-center gap-[6px] min-h-[22px]">
        {value ? (
          <>
            <span className="size-[16px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
              style={{ fontSize: 8, fontWeight: 700, ...fontFeature }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="text-[#0483AB] truncate underline decoration-transparent group-hover:decoration-[#0483AB] transition-all duration-200" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", textUnderlineOffset: 2, ...fontFeature }}>
              {displayName}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: "#c8cfdb", ...fontFeature }}>
            {placeholder}
          </span>
        )}
      </div>
      {/* Idle: Pencil on hover */}
      {!open && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X button */}
      {open && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
      {/* Popover dropdown — portal */}
      {open && createPortal(
        <div ref={ref} className="fixed bg-white border border-[#dde3ec] rounded-[12px] overflow-hidden"
          style={{ bottom: `calc(100vh - ${pos.top}px)`, left: pos.left, width: pos.width, zIndex: 99999, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="p-[6px]">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full h-[30px] px-[8px] rounded-[6px] bg-[#F6F7F9] border-none outline-none text-[#28415c]"
              style={{ fontSize: 11, fontWeight: 400, ...fontFeature }}
            />
          </div>
          <div className="border-t border-[#f0f2f5]" />
          <div className="max-h-[160px] overflow-y-auto py-[4px]">
            {filtered.map((m) => {
              const active = m.id === value || m.name === value;
              return (
                <button key={m.id} type="button"
                  onClick={() => { onChange(m.id); setOpen(false); setSearch(""); }}
                  className={`flex items-center gap-[8px] w-full px-[10px] py-[6px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left ${active ? "bg-[#f0f8ff]" : ""}`}>
                  <span className="size-[20px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
                    style={{ fontSize: 9, fontWeight: 700, ...fontFeature }}>
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{m.name}</span>
                    {m.email && <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 400, ...fontFeature }}>{m.email}</span>}
                  </div>
                  {active && <Check size={12} weight="bold" className="text-[#07ABDE] ml-auto shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-[10px] py-[8px] text-[#98989d]" style={{ fontSize: 11, ...fontFeature }}>Nenhum resultado</div>
            )}
          </div>
          {value && (
            <>
              <div className="border-t border-[#f0f2f5]" />
              <button type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="w-full flex items-center gap-[6px] px-[10px] py-[6px] text-[#f56233] hover:bg-[#fef2ef] transition-colors cursor-pointer"
                style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}>
                <X size={10} weight="bold" />
                Remover proprietário
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================================================================== */
/*  DSContactField — Contact association with DS field shell            */
/* ================================================================== */

function DSContactField({ label: fieldLabel, contactId, contactName, onChange, placeholder = "Selecionar..." }: {
  label: string;
  contactId: string;
  contactName: string;
  onChange: (id: string, name: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<{ id: string; name: string; email?: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 260 });

  useEffect(() => {
    (async () => {
      try {
        const raw = await listContacts().catch(() => []);
        setContacts((raw || []).map((c: any) => ({
          id: c.id,
          name: `${c.name} ${c.last_name || ""}`.trim(),
          email: c.email || "",
        })));
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 260) });
    }
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return contacts.slice(0, 8);
    const q = search.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)).slice(0, 8);
  }, [search, contacts]);

  const ff = fontFeature;

  return (
    <div ref={btnRef}
      className={`relative flex flex-col gap-0 rounded-[8px] transition-all ${open ? "" : "hover:bg-[#f6f7f9] group cursor-pointer"}`}
      style={{ padding: open ? 5 : 6, border: `1px solid ${open ? "#07abde" : "transparent"}` }}
      onClick={() => { if (!open) { setOpen(true); setSearch(""); } }}
    >
      {/* Label */}
      <div className="flex items-center">
        <span className="uppercase block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: open ? "#07abde" : "#98989d", ...ff }}>
          {fieldLabel}
        </span>
      </div>
      {/* Value row */}
      <div className="flex items-center gap-[6px] min-h-[22px]">
        {contactId ? (
          <>
            <span className="size-[16px] rounded-full bg-[#FFEDEB] flex items-center justify-center shrink-0 text-[#FF8C76]"
              style={{ fontSize: 8, fontWeight: 700, ...ff }}>
              {contactName.charAt(0).toUpperCase()}
            </span>
            <span className="text-[#0483AB] truncate underline decoration-transparent group-hover:decoration-[#0483AB] transition-all duration-200"
              style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", textUnderlineOffset: 2, ...ff }}>
              {contactName}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: "#c8cfdb", ...ff }}>
            {placeholder}
          </span>
        )}
      </div>
      {/* Idle: Pencil on hover */}
      {!open && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#FFEDEB] text-[#FF8C76]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {/* Editing: X button */}
      {open && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#dcf0ff", color: "#07abde" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
      {/* Popover dropdown — portal */}
      {open && createPortal(
        <div ref={ref} className="fixed bg-white rounded-[12px] overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: pos.width, zIndex: 99999, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}
          onClick={(e) => e.stopPropagation()}>
          {/* Selected contact card */}
          {contactId && (
            <>
              <div className="px-[12px] pt-[10px] pb-[6px]">
                <span className="text-[#98989d] uppercase block mb-[6px]"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                  Contato selecionado
                </span>
                <div className="flex items-center gap-[8px] p-[8px] rounded-[8px] bg-[#f6f7f9]">
                  <span
                    className="size-[28px] rounded-full bg-[#FFEDEB] flex items-center justify-center shrink-0 text-[#FF8C76]"
                    style={{ fontSize: 11, fontWeight: 700, ...ff }}>
                    {contactName.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                      {contactName}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-[1px] bg-[#eceef1] mx-[12px]" />
            </>
          )}
          {/* Search input — DS style */}
          <div className="px-[12px] py-[6px]">
            <div
              className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
              style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}>
              <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contato..."
                className="flex-1 bg-transparent text-[#28415c] outline-none min-w-0 placeholder:text-[#c8cfdb]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
              />
            </div>
          </div>
          {/* Search results */}
          <div className="max-h-[160px] overflow-y-auto">
            {filtered.map((c) => {
              const active = c.id === contactId;
              return (
                <button key={c.id} type="button"
                  onClick={() => { onChange(c.id, c.name); setOpen(false); setSearch(""); }}
                  className={`w-full flex items-center gap-[8px] px-[12px] py-[6px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer ${active ? "bg-[#f0f8ff]" : ""}`}>
                  <span
                    className="size-[24px] rounded-full bg-[#FFEDEB] flex items-center justify-center shrink-0 text-[#FF8C76]"
                    style={{ fontSize: 10, fontWeight: 700, ...ff }}>
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>{c.name}</span>
                    {c.email && <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 500, ...ff }}>{c.email}</span>}
                  </div>
                  {active && <Check size={12} weight="bold" className="text-[#07ABDE] ml-auto shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-[12px] py-[8px] text-[#98989d]" style={{ fontSize: 12, ...ff }}>
                Nenhum contato encontrado
              </div>
            )}
          </div>
          {/* Destructive: remove contact */}
          {contactId && (
            <>
              <div className="h-[1px] bg-[#eceef1] mx-[12px]" />
              <div className="px-[12px] pb-[10px] pt-[4px]">
                <button type="button"
                  onClick={() => { onChange("", ""); setOpen(false); }}
                  className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] bg-[#F6F7F9] hover:bg-[#FFEDEB] text-[#F56233] transition-colors cursor-pointer">
                  <LinkBreak size={13} weight="bold" />
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...ff }}>
                    Desvincular contato
                  </span>
                </button>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================================================================== */
/*  User Picker (legacy — used by Atribuido a)                          */
/* ================================================================== */

function UserPicker({ value, onChange, teamMembers, label, placeholder = "Selecionar..." }: {
  value: string;
  onChange: (v: string) => void;
  teamMembers: { id: string; name: string; email: string }[];
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 220 });

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 220) });
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return teamMembers.slice(0, 8);
    const q = search.toLowerCase();
    return teamMembers.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 8);
  }, [search, teamMembers]);

  return (
    <div ref={btnRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(""); }}
        className="flex items-center gap-[8px] w-full h-[38px] px-[10px] rounded-[8px] border border-transparent bg-[#F6F7F9] hover:bg-[#eef0f3] transition-colors cursor-pointer text-left"
      >
        {value ? (
          <>
            <span
              className="size-[20px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
              style={{ fontSize: 9, fontWeight: 700, ...fontFeature }}
            >
              {value.charAt(0).toUpperCase()}
            </span>
            <span className="text-[#0483AB] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
              {value}
            </span>
          </>
        ) : (
          <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 400, ...fontFeature }}>{placeholder}</span>
        )}
        <CaretDown size={10} weight="bold" className="text-[#98989d] ml-auto shrink-0" />
      </button>
      {open && createPortal(
        <div ref={ref} className="fixed bg-white border border-[#dde3ec] rounded-[12px] overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: pos.width, zIndex: 99999, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}>
          <div className="p-[6px]">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full h-[30px] px-[8px] rounded-[6px] bg-[#F6F7F9] border-none outline-none text-[#28415c]"
              style={{ fontSize: 11, fontWeight: 400, ...fontFeature }}
            />
          </div>
          <div className="max-h-[160px] overflow-y-auto">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onChange(m.name); setOpen(false); setSearch(""); }}
                className="flex items-center gap-[8px] w-full px-[10px] py-[6px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
              >
                <span
                  className="size-[20px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
                  style={{ fontSize: 9, fontWeight: 700, ...fontFeature }}
                >
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{m.name}</span>
                  {m.email && <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 400, ...fontFeature }}>{m.email}</span>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-[10px] py-[8px] text-[#98989d]" style={{ fontSize: 11, ...fontFeature }}>Nenhum resultado</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================================================================== */
/*  Entity Picker (link / vincular)                                    */
/* ================================================================== */

function EntityPicker({ value, valueName, valueType, onSelect, onClear }: {
  value: string;
  valueName: string;
  valueType: string;
  onSelect: (type: string, id: string, name: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<{ type: string; id: string; name: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 300 });

  useEffect(() => {
    (async () => {
      try {
        const [accounts, opps, contacts, leads] = await Promise.all([
          listAccounts().catch(() => []),
          listOpportunities().catch(() => []),
          listContacts().catch(() => []),
          listLeads().catch(() => []),
        ]);
        const opts: { type: string; id: string; name: string }[] = [];
        (accounts || []).forEach((a: any) => opts.push({ type: "conta", id: a.id, name: a.name }));
        (opps || []).forEach((o: any) => opts.push({ type: "oportunidade", id: o.id, name: o.name }));
        (contacts || []).forEach((c: any) => opts.push({ type: "contato", id: c.id, name: `${c.name} ${c.last_name || ""}`.trim() }));
        (leads || []).forEach((l: any) => opts.push({ type: "lead", id: l.id, name: l.name }));
        setOptions(opts);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.top - 4, left: r.left, width: Math.max(r.width, 300) });
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return options.slice(0, 8);
    const q = search.toLowerCase();
    return options.filter((e) => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)).slice(0, 8);
  }, [search, options]);

  const hasValue = !!(value && valueName);
  const entityConf = hasValue ? (ENTITY_ICON_CONFIG[valueType] || null) : null;
  const EntityIcon = entityConf?.icon || LinkSimpleHorizontal;

  const dropdown = open ? createPortal(
    <div
      ref={ref}
      className="fixed bg-white rounded-[12px] overflow-hidden"
      style={{
        bottom: `calc(100vh - ${pos.top}px)`,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Current linked record */}
      {hasValue && entityConf && (
        <>
          <div className="px-[12px] pt-[10px] pb-[6px]">
            <span className="text-[#98989d] uppercase block mb-[6px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
              Registro vinculado
            </span>
            <div className="flex items-center gap-[8px] p-[8px] rounded-[8px] bg-[#f6f7f9]">
              <div className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0" style={{ backgroundColor: entityConf.bg }}>
                <EntityIcon size={14} weight="duotone" style={{ color: entityConf.color }} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                  {valueName}
                </span>
                <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}>
                  {entityConf.label} · {value}
                </span>
              </div>
              <button
                type="button"
                className="flex items-center justify-center size-[24px] rounded-full hover:bg-[#DCF0FF] text-[#0483AB] transition-colors shrink-0 cursor-pointer"
                title="Abrir registro"
              >
                <ArrowSquareOut size={13} weight="bold" />
              </button>
            </div>
          </div>
          <div className="h-[1px] bg-[#eceef1] mx-[12px]" />
        </>
      )}

      {/* Search */}
      <div className="px-[12px] py-[6px]">
        <div
          className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
          style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
        >
          <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
          <input
            type="text"
            placeholder={hasValue ? `Trocar ${entityConf?.label?.toLowerCase() || "vinculo"}...` : "Buscar lead, conta, oportunidade..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb]"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
          />
        </div>
      </div>

      {/* Results list */}
      <div className="max-h-[180px] overflow-y-auto">
        {filtered.map((e) => {
          const badge = ENTITY_BADGE[e.type] || { label: e.type.toUpperCase(), bg: "#F6F7F9", color: "#4E6987" };
          const ic = ENTITY_ICON_CONFIG[e.type];
          const RowIcon = ic?.icon || LinkSimpleHorizontal;
          return (
            <button
              key={`${e.type}-${e.id}`}
              type="button"
              onClick={() => { onSelect(e.type, e.id, e.name); setOpen(false); setSearch(""); }}
              className="flex items-center gap-[8px] w-full px-[12px] py-[7px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center justify-center size-[22px] rounded-[6px] shrink-0" style={{ backgroundColor: badge.bg }}>
                <RowIcon size={12} weight="duotone" style={{ color: badge.color }} />
              </div>
              <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{e.name}</span>
              <span className="text-[#C8CFDB] ml-auto shrink-0" style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}>{e.id}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-[12px] py-[8px] text-[#98989d]" style={{ fontSize: 11, ...fontFeature }}>Nenhum resultado</div>
        )}
      </div>

      {/* Remove link */}
      {hasValue && (
        <div className="px-[12px] pb-[10px] pt-[2px]">
          <button
            type="button"
            onClick={() => { onClear(); setOpen(false); }}
            className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] bg-[#F6F7F9] hover:bg-[#FFEDEB] text-[#F56233] transition-colors cursor-pointer"
          >
            <LinkBreak size={13} weight="bold" />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}>
              Remover vinculo
            </span>
          </button>
        </div>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={btnRef}>
      <div
        className={`group relative flex flex-col gap-0 rounded-[8px] p-[6px] border transition-all cursor-pointer w-[260px] ${
          open ? "border-[#07abde]" : "border-transparent hover:bg-[#f6f7f9]"
        }`}
        onClick={() => { setOpen((v) => !v); setSearch(""); }}
      >
        {/* Label row */}
        <div className="flex items-center gap-[4px]">
          <span
            className={`uppercase block ${open ? "text-[#07abde]" : "text-[#98989d]"}`}
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
          >
            Vinculado a
          </span>
          <LinkSimpleHorizontal size={10} weight="bold" className={open ? "text-[#07abde]" : "text-[#98989d]"} />
        </div>

        {/* Value row */}
        <div className="flex items-center gap-[6px] min-h-[22px]">
          {hasValue && entityConf ? (
            <>
              <EntityIcon size={14} weight="duotone" className="shrink-0" style={{ color: entityConf.color }} />
              <span className="text-[#0483AB] truncate underline decoration-transparent group-hover:decoration-[#0483AB] transition-all duration-200" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", textUnderlineOffset: 2, ...fontFeature }}>
                {valueName}
              </span>
            </>
          ) : (
            <span className="text-[#c8cfdb]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
              —
            </span>
          )}
        </div>

        {/* Pencil / X button */}
        <div className={`absolute right-[5px] top-[10px] ${open ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
          {open ? (
            <span className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer">
              <X size={9} weight="bold" />
            </span>
          ) : (
            <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
              <PencilSimple size={9} weight="bold" />
            </span>
          )}
        </div>
      </div>
      {dropdown}
    </div>
  );
}

/* ================================================================== */
/*  Multi Contact Picker (convidados — DS popover, multi-select)       */
/* ================================================================== */

type ContactItem = { id: string; name: string; email?: string };

function MultiContactPicker({ selected: selectedRaw, onAdd, onRemove, onClear }: {
  selected: ContactItem[];
  onAdd: (c: ContactItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const selected = selectedRaw || [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 300 });

  useEffect(() => {
    (async () => {
      try {
        const raw = await listContacts().catch(() => []);
        setContacts((raw || []).map((c: any) => ({
          id: c.id,
          name: `${c.name} ${c.last_name || ""}`.trim(),
          email: c.email || "",
        })));
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 300) });
    }
  }, [open]);

  const selectedIds = useMemo(() => new Set(selected.map(s => s.id)), [selected]);

  const filtered = useMemo(() => {
    const base = contacts.filter(c => !selectedIds.has(c.id));
    if (!search) return base.slice(0, 8);
    const q = search.toLowerCase();
    return base.filter((c) => c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)).slice(0, 8);
  }, [search, contacts, selectedIds]);

  const ff = fontFeature;

  return (
    <div ref={btnRef} className="relative flex flex-col rounded-[8px] transition-all" style={{ padding: 6 }}>
      {/* Label */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block text-[#98989d]"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...ff }}>
          Convidados
        </span>
      </div>

      {/* Value area — clickable to open popover */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(""); }}
        className="flex items-center gap-[6px] min-h-[22px] flex-wrap cursor-pointer text-left"
      >
        {selected.length > 0 ? (
          <>
            {selected.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-[4px] h-[22px] pl-[2px] pr-[6px] rounded-full bg-[#DCF0FF]">
                <span
                  className="size-[18px] rounded-full bg-[#FFEDEB] flex items-center justify-center shrink-0 text-[#FF8C76]"
                  style={{ fontSize: 8, fontWeight: 700, ...ff }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[#0483AB] truncate max-w-[80px]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                  {c.name.split(" ")[0]}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onRemove(c.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onRemove(c.id); } }}
                  className="flex items-center justify-center size-[14px] rounded-full hover:bg-[#c5e4f5] cursor-pointer shrink-0"
                >
                  <X size={7} weight="bold" className="text-[#0483AB]" />
                </span>
              </span>
            ))}
          </>
        ) : (
          <span className="text-[#c8cfdb]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...ff }}>&mdash;</span>
        )}
      </button>

      {/* DS Popover — portal */}
      {open && createPortal(
        <div
          ref={ref}
          className="fixed bg-white rounded-[12px] overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: pos.width, zIndex: 99999, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", ...ff }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Selected contacts cards */}
          {selected.length > 0 && (
            <>
              <div className="px-[12px] pt-[10px] pb-[6px]">
                <span className="text-[#98989d] uppercase block mb-[6px]"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                  {selected.length === 1 ? "Convidado selecionado" : `${selected.length} convidados`}
                </span>
                <div className="flex flex-col gap-[4px]">
                  {selected.map((c) => (
                    <div key={c.id} className="flex items-center gap-[8px] p-[8px] rounded-[8px] bg-[#f6f7f9]">
                      <span
                        className="size-[28px] rounded-full bg-[#FFEDEB] flex items-center justify-center shrink-0 text-[#FF8C76]"
                        style={{ fontSize: 11, fontWeight: 700, ...ff }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[#28415c] truncate"
                          style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                          {c.name}
                        </span>
                        {c.email && (
                          <span className="text-[#98989d]"
                            style={{ fontSize: 10, fontWeight: 500, ...ff }}>
                            {c.email}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(c.id)}
                        className="flex items-center justify-center size-[24px] rounded-full hover:bg-[#FFEDEB] text-[#F56233] transition-colors shrink-0 cursor-pointer"
                        title="Remover convidado"
                      >
                        <X size={11} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Separator */}
              <div className="h-[1px] bg-[#eceef1] mx-[12px]" />
            </>
          )}

          {/* Search input — DS style */}
          <div className="px-[12px] py-[6px]">
            <div
              className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
              style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
            >
              <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contato..."
                className="flex-1 bg-transparent text-[#28415c] outline-none min-w-0 placeholder:text-[#c8cfdb]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
              />
            </div>
          </div>

          {/* Search results */}
          <div className="max-h-[160px] overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onAdd(c); setSearch(""); }}
                className="w-full flex items-center gap-[8px] px-[12px] py-[6px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer"
              >
                <span
                  className="size-[24px] rounded-full bg-[#FFEDEB] flex items-center justify-center shrink-0 text-[#FF8C76]"
                  style={{ fontSize: 10, fontWeight: 700, ...ff }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>{c.name}</span>
                  {c.email && <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 500, ...ff }}>{c.email}</span>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-[12px] py-[8px] text-[#98989d]" style={{ fontSize: 12, ...ff }}>
                Nenhum contato encontrado
              </div>
            )}
          </div>

          {/* Remove all — destructive action */}
          {selected.length > 0 && (
            <div className="px-[12px] pb-[10px] pt-[2px]">
              <button
                type="button"
                onClick={() => { onClear(); }}
                className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] bg-[#F6F7F9] hover:bg-[#FFEDEB] text-[#F56233] transition-colors cursor-pointer"
              >
                <LinkBreak size={13} weight="bold" />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...ff }}>
                  Remover todos
                </span>
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main Modal                                                         */
/* ================================================================== */

interface CreateActivityModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (activity: DbActivity) => void;
  defaultType?: ActivityType;
}

export function CreateActivityModal({ open, onClose, onCreated, defaultType }: CreateActivityModalProps) {
  const { user: authUser } = useAuth();
  const authUserId = authUser?.id || "";
  const [form, setForm] = useState<ActivityForm>(() => ({ ...getDefaultForm(defaultType || "compromisso"), owner: authUserId }));
  const [saving, setSaving] = useState(false);
  const teamMembers = useTeamMembers(open);

  // Reset form when opening — pre-fill owner with current user UUID
  useEffect(() => {
    if (open) setForm({ ...getDefaultForm(defaultType || "compromisso"), owner: authUserId });
  }, [open, defaultType, authUserId]);

  const patch = useCallback((p: Partial<ActivityForm>) => setForm((f) => ({ ...f, ...p })), []);

  const switchType = useCallback((type: ActivityType) => {
    setForm((f) => ({
      ...f,
      type,
      status: STATUS_BY_TYPE[type][0]?.key || "",
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }, []);

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.subject.trim()) {
      toast.error("Informe o assunto da atividade.");
      return;
    }
    setSaving(true);
    try {
      const startDatetime = form.startDate && form.startTime
        ? `${form.startDate}T${form.startTime}:00`
        : form.startDate ? `${form.startDate}T00:00:00` : "";
      const endDatetime = form.endDate && form.endTime
        ? `${form.endDate}T${form.endTime}:00`
        : form.endDate ? `${form.endDate}T23:59:59` : "";

      const dbData: Partial<DbActivity> = {
        id: generateCrmId("AT"),
        type: form.type,
        subject: form.subject.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        owner: form.owner || "Sistema",
        tags: form.tags.length > 0 ? form.tags.join(",") : null,
        related_to_type: form.relatedToType || null,
        related_to_id: form.relatedToId || null,
        related_to_name: form.relatedToName || null,
        entity_type: form.relatedToType || null,
        entity_id: form.relatedToId || null,
      };

      // Type-specific fields
      if (form.type === "compromisso") {
        dbData.start_date = startDatetime || null;
        dbData.end_date = endDatetime || null;
        dbData.all_day = form.allDay;
        dbData.reminder = form.reminder.length > 0 ? JSON.stringify(form.reminder) : null;
        dbData.guest = form.convidados.length > 0 ? JSON.stringify(form.convidados.map(c => c.id)) : null;
        dbData.guest_name = form.convidados.length > 0 ? JSON.stringify(form.convidados.map(c => c.name)) : null;
      } else if (form.type === "tarefa") {
        dbData.due_date = form.dueDate ? `${form.dueDate}T23:59:59` : null;
        dbData.assigned_to = form.assignedTo || null;
      } else if (form.type === "ligacao") {
        dbData.contact_id = form.contactId || null;
        dbData.contact_name = form.contactName || null;
        dbData.call_type = form.callType || null;
        dbData.call_direction = form.callType || null;
        dbData.call_duration = form.callDuration ? parseInt(form.callDuration) : null;
        dbData.call_result = form.callResult || null;
        dbData.start_date = startDatetime || null;
      } else if (form.type === "nota") {
        dbData.body = form.body || null;
        dbData.note_visibility = form.noteVisibility || null;
      } else if (form.type === "mensagem") {
        dbData.body = form.body || null;
        dbData.channel = form.channel || null;
        dbData.recipient = form.recipient || null;
        dbData.recipient_phone = form.recipientPhone || null;
      } else if (form.type === "email") {
        dbData.body = form.body || null;
      }

      const created = await createActivity(dbData);

      // ── Sync with Google Tasks when type is "tarefa" (fire-and-forget) ──
      if (form.type === "tarefa" && form.assignedTo) {
        const assignedMember = teamMembers.find(
          (m) => m.name === form.assignedTo || m.id === form.assignedTo,
        );
        const userEmail = assignedMember?.email || "";
        console.log("[Google Tasks] Resolved assignedTo:", form.assignedTo, "→ email:", userEmail);
        if (userEmail && userEmail.endsWith("@htz.agency")) {
          createGoogleTask({
            title: form.subject.trim(),
            notes: form.description.trim() || undefined,
            dueDate: form.dueDate || undefined,
            userEmail,
          })
            .then((res) => {
              console.log("Google Task created:", res.taskId);
              toast.success(`Tarefa sincronizada com Google Tasks de ${assignedMember!.name}`);
            })
            .catch((err) => {
              console.error("Google Tasks sync error:", err);
              toast.error(`Google Tasks: ${err?.message || err}`, { duration: 8000 });
            });
        } else {
          console.warn("[Google Tasks] Skipped — email not @htz.agency:", userEmail, "(assignedTo:", form.assignedTo, ")");
        }
      }

      onCreated?.(created);
      toast.success("Atividade criada com sucesso!");
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar atividade:", err);
      toast.error(`Erro ao criar atividade: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const curTypeConf = ACTIVITY_TYPES.find((t) => t.key === form.type) || ACTIVITY_TYPES[0];
  const curStatus = STATUS_BY_TYPE[form.type]?.find((s) => s.key === form.status) || STATUS_BY_TYPE[form.type]?.[0];
  const curPriority = PRIORITY_OPTIONS.find((p) => p.key === form.priority) || PRIORITY_OPTIONS[1];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="relative w-full max-w-[860px] max-h-[90vh] bg-white rounded-[20px] overflow-hidden flex flex-col"
        style={{ boxShadow: "0px 8px 32px rgba(18,34,50,0.25)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#f0f2f5]">
          <span className="text-[#28415c]" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, ...fontFeature }}>
            Nova Atividade
          </span>
          <button onClick={onClose} className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] transition-colors cursor-pointer">
            <X size={16} weight="bold" className="text-[#98989d]" />
          </button>
        </div>

        {/* ── Segmented Control ── */}
        <div className="px-[24px] pt-[16px] pb-[4px]">
          <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip">
            {ACTIVITY_TYPES.map((t) => {
              const isActive = form.type === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => switchType(t.key)}
                  className={`relative flex items-center gap-[3px] flex-1 justify-center h-[36px] px-[10px] rounded-[100px] transition-all cursor-pointer ${
                    isActive
                      ? "text-[#f6f7f9]"
                      : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
                  }`}
                >
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                        style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                      />
                    </>
                  )}
                  <Icon size={14} weight={isActive ? "fill" : "regular"} className="relative z-[1]" />
                  <span
                    className="relative z-[1] font-bold uppercase tracking-[0.5px] hidden sm:inline"
                    style={{ fontSize: 10, ...fontFeature }}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}

            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                boxShadow:
                  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-[24px] py-[16px] flex flex-col gap-[14px]">
          {/* Row 1: Assunto + Status + Prioridade */}
          <div className="grid grid-cols-3 gap-[12px] items-end">
            <div
              className="group relative flex flex-col rounded-[8px] transition-all focus-within:border-[#07abde] border border-transparent hover:bg-[#f6f7f9]"
              style={{ padding: 5 }}
            >
              <div className="flex items-center gap-[4px]">
                <span
                  className="uppercase block transition-colors text-[#98989d] group-focus-within:text-[#07abde]"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  Assunto *
                </span>
              </div>
              <input
                type="text"
                placeholder="Ex: Reuniao com cliente Alpha"
                value={form.subject}
                onChange={(e) => patch({ subject: e.target.value })}
                className="w-full bg-transparent text-[#4e6987] outline-none placeholder:text-[#c8cfdb]"
                style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                autoFocus
              />
            </div>
            <ContextStatusField
              value={form.status}
              options={STATUS_BY_TYPE[form.type]}
              onChange={(v) => patch({ status: v })}
            />
            {form.type !== "nota" ? (
              <ContextStatusField
                label="Prioridade"
                value={form.priority}
                options={PRIORITY_OPTIONS}
                onChange={(v) => patch({ priority: v })}
              />
            ) : (
              <ContextStatusField
                label="Visibilidade"
                value={form.noteVisibility}
                options={[...NOTE_VISIBILITY_OPTIONS]}
                onChange={(v) => patch({ noteVisibility: v })}
              />
            )}
          </div>

          {/* Descrição for Email - below Status */}
          {form.type === "email" && (
            <DSTextareaField
              label="Descrição"
              value={form.body}
              onChange={(v) => patch({ body: v })}
              placeholder="Escreva o corpo do email..."
            />
          )}

          {/* Row 1.5: Tags */}
          <div className="grid grid-cols-3 gap-[12px]">
            <DSMultiSelectField
              label="Tags"
              selected={form.tags}
              options={TAG_OPTIONS.map((t) => ({ key: t.value, label: t.label, color: t.color }))}
              onToggle={(key) => toggleTag(key)}
              emptyLabel="Sem tags"
            />
          </div>

          {/* ═══ TYPE-SPECIFIC FIELDS ═══ */}

          {/* ── Compromisso ── */}
          {form.type === "compromisso" && (
            <>
              <div className="grid grid-cols-3 gap-[12px]">
                <DSDateTimeField
                  label="Inicio"
                  dateValue={form.startDate}
                  timeValue={form.startTime}
                  onDateChange={(v) => patch({ startDate: v })}
                  onTimeChange={(v) => patch({ startTime: v })}
                  showTime={!form.allDay}
                />
                <DSDateTimeField
                  label="Termino"
                  dateValue={form.endDate}
                  timeValue={form.endTime}
                  onDateChange={(v) => patch({ endDate: v })}
                  onTimeChange={(v) => patch({ endTime: v })}
                  showTime={!form.allDay}
                />
                <div
                  className="group relative flex flex-col rounded-[8px] transition-all hover:bg-[#f6f7f9] cursor-pointer"
                  style={{ padding: 6 }}
                  onClick={() => patch({ allDay: !form.allDay })}
                >
                  <div className="flex items-center gap-[4px]">
                    <span
                      className="uppercase block text-[#98989d]"
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                    >
                      Dia Inteiro
                    </span>
                  </div>
                  <div className="flex items-center gap-[6px] min-h-[22px]">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); patch({ allDay: !form.allDay }); }}
                      className="relative w-[36px] h-[20px] rounded-full transition-colors cursor-pointer shrink-0"
                      style={{ backgroundColor: form.allDay ? "#07ABDE" : "#C8CFDB" }}
                    >
                      <span
                        className="absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-[left]"
                        style={{ left: form.allDay ? 18 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
                      />
                    </button>
                    <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                      {form.allDay ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-[12px]">
                <MultiContactPicker
                  selected={form.convidados}
                  onAdd={(c) => patch({ convidados: [...form.convidados, c] })}
                  onRemove={(id) => patch({ convidados: form.convidados.filter(x => x.id !== id) })}
                  onClear={() => patch({ convidados: [] })}
                />
                <DSMultiSelectField
                  label="Lembrete"
                  selected={form.reminder}
                  options={REMINDER_OPTIONS.map((r) => ({ key: r.key, label: r.label, color: "#07abde" }))}
                  onToggle={(key) => patch({ reminder: form.reminder.includes(key) ? form.reminder.filter((k) => k !== key) : [...form.reminder, key] })}
                  emptyLabel="Sem lembrete"
                />
                <DSMultiSelectField
                  label="Tags"
                  selected={form.tags}
                  options={TAG_OPTIONS.map((t) => ({ key: t.value, label: t.label, color: t.color }))}
                  onToggle={(key) => toggleTag(key)}
                  emptyLabel="Sem tags"
                />
              </div>
            </>
          )}

          {/* ── Tarefa ── */}
          {form.type === "tarefa" && (
            <div className="grid grid-cols-3 gap-[12px]">
              <DSDateField
                label="Data de Vencimento"
                value={form.dueDate}
                onChange={(v) => patch({ dueDate: v })}
              />
              <DSUserField
                label="Atribuido a"
                value={form.assignedTo}
                onChange={(v) => patch({ assignedTo: v })}
                teamMembers={teamMembers}
                placeholder="Selecionar..."
              />
              <div />
            </div>
          )}

          {/* ── Ligacao ── */}
          {form.type === "ligacao" && (
            <>
              <div className="grid grid-cols-3 gap-[12px]">
                <DSContactField
                  label="Contato"
                  contactId={form.contactId}
                  contactName={form.contactName}
                  onChange={(id, name) => patch({ contactId: id, contactName: name })}
                  placeholder="Selecionar..."
                />
                <ContextStatusField
                  label="Tipo de Ligacao"
                  value={form.callType}
                  options={[...CALL_TYPE_OPTIONS]}
                  onChange={(v) => patch({ callType: v })}
                />
                <DSDurationField
                  label="Duracao (min)"
                  value={form.callDuration}
                  onChange={(v) => patch({ callDuration: v })}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-3 gap-[12px]">
                <DSDateTimeField
                  label="Data"
                  dateValue={form.startDate}
                  timeValue={form.startTime}
                  onDateChange={(v) => patch({ startDate: v })}
                  onTimeChange={(v) => patch({ startTime: v })}
                />
                <div className="col-span-2 [&_textarea]:!min-h-[160px]">
                  <DSTextareaField
                    label="Resultado"
                    value={form.callResult}
                    onChange={(v) => patch({ callResult: v })}
                    placeholder="Ex: Cliente interessado"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Nota ── */}
          {form.type === "nota" && (
            <DSTextareaField
              label="Descrição"
              value={form.body}
              onChange={(v) => patch({ body: v })}
              placeholder="Escreva sua nota..."
            />
          )}

          {/* ── Mensagem ── */}
          {form.type === "mensagem" && (
            <>
              <div className="grid grid-cols-3 gap-[12px]">
                <ContextStatusField
                  label="Canal"
                  value={form.channel}
                  options={[...CHANNEL_OPTIONS]}
                  onChange={(v) => patch({ channel: v })}
                />
                <DSContactField
                  label="Destinatário"
                  contactId={form.recipientContactId}
                  contactName={form.recipient}
                  onChange={(id, name) => patch({ recipientContactId: id, recipient: name })}
                  placeholder="Selecionar contato..."
                />

              </div>
              <DSTextareaField
                  label="Descrição"
                  value={form.body}
                  onChange={(v) => patch({ body: v })}
                  placeholder="Escreva sua mensagem..."
                />
            </>
          )}

          {/* Descricao for generic types */}
          {form.type !== "nota" && form.type !== "mensagem" && form.type !== "email" && form.type !== "ligacao" && form.type !== "compromisso" && (
            <DSTextareaField
              label="Descricao"
              value={form.description}
              onChange={(v) => patch({ description: v })}
              placeholder="Detalhes adicionais..."
            />
          )}

          {/* Descricao full-width for compromisso */}
          {form.type === "compromisso" && (
            <DSTextareaField
              label="Descricao"
              value={form.description}
              onChange={(v) => patch({ description: v })}
              placeholder="Detalhes adicionais..."
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-[8px] px-[24px] py-[14px] border-t border-[#f0f2f5]">
          {/* Left: Entity link + Owner */}
          <div className="flex items-center gap-[8px] flex-1 min-w-0">
            <EntityPicker
              value={form.relatedToId}
              valueName={form.relatedToName}
              valueType={form.relatedToType}
              onSelect={(type, id, name) => patch({ relatedToType: type, relatedToId: id, relatedToName: name })}
              onClear={() => patch({ relatedToType: "", relatedToId: "", relatedToName: "" })}
            />
            <DSUserField
              label="Dono"
              value={form.owner}
              onChange={(v) => patch({ owner: v })}
              teamMembers={teamMembers}
              placeholder="Proprietário"
              className="w-[260px]"
            />
          </div>

          {/* Right: Cancel + Save */}
          <div className="flex items-center gap-[8px] shrink-0 w-[260px]">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center flex-1 h-[34px] rounded-[500px] bg-[#f6f7f9] text-[#4e6987] hover:bg-[#ebedf0] transition-colors cursor-pointer uppercase"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-[6px] flex-1 h-[34px] rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#32b592] transition-colors cursor-pointer disabled:opacity-50 uppercase"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
            >
              {saving && <Spinner size={14} className="animate-spin" />}
              SALVAR
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}