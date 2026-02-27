/**
 * CRM Task Detail — Full-page detail view for a single task (activity type "tarefa").
 *
 * Purple palette: #E8E8FD, #ddd8fd, #8C8CD4, #31315C
 * Loads from Supabase via getActivity(), persists via patchActivity().
 * Follows the same layout pattern as crm-contact-detail.tsx / crm-lead-detail.tsx.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  CaretDown,
  CaretRight,
  X,
  Tag,
  ClockCounterClockwise,
  PencilSimple,
  Trash,
  CopySimple,
  Plus,
  GearSix,
  ListBullets,
  ArrowSquareDownRight,
  FunnelSimple,
  Building,
  CircleNotch,
  Spinner,
  Clock,
  Warning,
  Hourglass,
  ArrowUp,
  ArrowDown,
  SealCheck,
  Lightning,
  Check,
  UserCircle,
  TextAlignLeft,
  CalendarBlank,
  Calendar,
  LinkSimpleHorizontal,
  NotePencil,
  MagnifyingGlass,
  LinkBreak,
  ArrowSquareOut,
  User,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { EditableField } from "./editable-field";
import { useMultitask } from "../multitask-context";
import { useCrmSearch } from "./crm-search-context";
import {
  getActivity,
  patchActivity,
  deleteActivity,
  listAccounts,
  listOpportunities,
  listContacts,
  listLeads,
  type DbActivity,
} from "./crm-api";
import { toast } from "sonner";
import {
  type Activity,
  VerticalDivider,
  ActionButton,
  ActivityItem,
  SectionToggle,
  useEntityActivities,
} from "./crm-detail-shared";
import { useTeamMembers, resolveMember } from "./use-team-members";
import {
  fontFeature,
  type TaskStatus,
  type Priority,
  TASK_STATUS_CONFIG,
  TASK_STATUS_KEYS,
  PRIORITY_CONFIG,
  PRIORITY_KEYS,
  TAG_OPTIONS,
  ASSOC_TYPE_CONFIG,
  isTaskOverdue,
  formatDatePtBr,
} from "./activity-config";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

type TaskTab = "detalhes" | "historico";

const STATUS_KEYS = TASK_STATUS_KEYS;

/* Enrich canonical status configs with icons */
const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  nao_iniciada: { ...TASK_STATUS_CONFIG.nao_iniciada, icon: Spinner },
  em_andamento: { ...TASK_STATUS_CONFIG.em_andamento, icon: Clock },
  concluida:    { ...TASK_STATUS_CONFIG.concluida,    icon: Check },
  aguardando:   { ...TASK_STATUS_CONFIG.aguardando,   icon: Hourglass },
  cancelada:    { ...TASK_STATUS_CONFIG.cancelada,    icon: X },
};

const priorityConfig: Record<Priority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  baixa:  { ...PRIORITY_CONFIG.baixa,  icon: ArrowDown },
  normal: { ...PRIORITY_CONFIG.normal, icon: Clock },
  alta:   { ...PRIORITY_CONFIG.alta,   icon: ArrowUp },
};

const TABS: { key: TaskTab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "detalhes", label: "Detalhes", icon: ListBullets },
  { key: "historico", label: "Historico", icon: ClockCounterClockwise },
];

/* ------------------------------------------------------------------ */
/*  Task Data shape                                                    */
/* ------------------------------------------------------------------ */

import { type Task, EMPTY_TASK, dbActivityToTask } from "./activity-config";

type TaskData = Task;

const emptyTask: TaskData = EMPTY_TASK;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const isOverdue = (task: TaskData) => isTaskOverdue(task);
const formatDate = formatDatePtBr;

/* ------------------------------------------------------------------ */
/*  StatusField — interactive DS PicklistField for status              */
/* ------------------------------------------------------------------ */

function TaskStatusField({
  value,
  onChange,
}: {
  value: TaskStatus;
  onChange: (s: TaskStatus) => void;
}) {
  const [state, setState] = useState<"idle" | "editing" | "unsaved">("idle");
  const [pendingValue, setPendingValue] = useState<TaskStatus>(value);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => { if (state === "idle") setPendingValue(value); }, [value, state]);

  useEffect(() => {
    if (state !== "editing" || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [state]);

  useEffect(() => {
    if (state === "idle") return;
    const handler = (e: MouseEvent) => {
      if (anchorRef.current?.contains(e.target as Node) || popoverRef.current?.contains(e.target as Node)) return;
      if (state === "editing") setState("idle");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [state]);

  const startEdit = () => { setPendingValue(value); setState("editing"); };
  const select = (s: TaskStatus) => {
    setPendingValue(s);
    if (s !== value) setState("unsaved"); else setState("idle");
  };
  const save = () => { onChange(pendingValue); setState("idle"); };
  const discard = () => { setPendingValue(value); setState("idle"); };

  const displayValue = state === "idle" ? value : pendingValue;
  const conf = statusConfig[displayValue] || statusConfig.nao_iniciada;
  const SIcon = conf.icon;
  const isActive = state !== "idle";
  const borderColor = state === "editing" ? "#07abde" : state === "unsaved" ? "#C4990D" : "transparent";
  const labelColor = state === "editing" ? "#07abde" : state === "unsaved" ? "#C4990D" : "#98989d";
  const padding = isActive ? "5px" : "6px";

  return (
    <div
      ref={anchorRef}
      className={`group/status relative flex flex-col gap-0 rounded-[8px] transition-all duration-150 ${
        isActive ? "cursor-text" : "hover:bg-[#f6f7f9] cursor-pointer"
      }`}
      style={{ padding, border: `1px solid ${borderColor}` }}
      onClick={!isActive ? startEdit : undefined}
    >
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: labelColor, ...fontFeature }}>
          Status
        </span>
        <SealCheck size={10} weight="bold" className="ml-[2px]" style={{ color: labelColor }} />
      </div>
      <div className="flex items-center gap-[6px] min-h-[22px]">
        <div className="flex items-center gap-[4px] h-[22px] px-[8px] rounded-[500px]" style={{ backgroundColor: conf.bg }}>
          <SIcon size={10} weight="fill" style={{ color: conf.color }} />
          <span className="uppercase whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: state === "unsaved" ? "#C4990D" : conf.color, ...fontFeature }}>
            {conf.label}
          </span>
        </div>
        {state === "editing" && <CaretDown size={12} weight="bold" className="ml-auto" style={{ color: "#07abde" }} />}
      </div>

      {state === "idle" && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover/status:opacity-100 transition-opacity">
          <span className="hidden group-hover/status:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}

      {state === "editing" && (
        <div className="absolute right-[5px] top-[10px]">
          <button onClick={(e) => { e.stopPropagation(); setState("idle"); }} className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer transition-colors">
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
      {state === "unsaved" && (
        <div className="absolute right-[5px] top-[10px] flex items-center gap-[3px]">
          <button onClick={(e) => { e.stopPropagation(); save(); }} className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors" style={{ backgroundColor: "#feedca", color: "#C4990D" }}>
            <Check size={9} weight="bold" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); discard(); }} className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors" style={{ backgroundColor: "#feedca", color: "#C4990D" }}>
            <X size={9} weight="bold" />
          </button>
        </div>
      )}

      {state === "editing" && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[99999] bg-white rounded-[10px] border border-[#eceef1] pb-[4px] shadow-lg"
          style={{ top: pos.top, left: pos.left, width: 200, ...fontFeature }}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_KEYS.map((key) => {
            const c = statusConfig[key];
            const Icon = c.icon;
            const isSelected = key === value;
            return (
              <button
                key={key}
                onClick={() => select(key)}
                className={`w-full flex items-center gap-[8px] px-[10px] py-[5px] text-left transition-colors cursor-pointer ${
                  isSelected ? "bg-[#f0f8ff]" : "hover:bg-[#f6f7f9]"
                }`}
              >
                <Icon size={12} weight="fill" style={{ color: c.color }} />
                <span className="text-[#4e6987] truncate" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                  {c.label}
                </span>
                {isSelected && <Check size={12} weight="bold" className="ml-auto text-[#07ABDE] shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PriorityField — interactive DS PicklistField for priority          */
/* ------------------------------------------------------------------ */

/* PRIORITY_KEYS imported from activity-config */

function TaskPriorityField({
  value,
  overdue,
  onChange,
}: {
  value: Priority;
  overdue: boolean;
  onChange: (newPriority: Priority) => void;
}) {
  const [state, setState] = useState<"idle" | "editing" | "unsaved">("idle");
  const [pendingValue, setPendingValue] = useState<Priority>(value);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => { if (state === "idle") setPendingValue(value); }, [value, state]);

  useEffect(() => {
    if (state !== "editing" || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [state]);

  useEffect(() => {
    if (state === "idle") return;
    const handler = (e: MouseEvent) => {
      if (anchorRef.current?.contains(e.target as Node) || popoverRef.current?.contains(e.target as Node)) return;
      if (state === "editing") setState("idle");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [state]);

  const startEdit = () => { setPendingValue(value); setState("editing"); };
  const select = (p: Priority) => {
    setPendingValue(p);
    if (p !== value) setState("unsaved"); else setState("idle");
  };
  const save = () => { onChange(pendingValue); setState("idle"); };
  const discard = () => { setPendingValue(value); setState("idle"); };

  const displayValue = state === "idle" ? value : pendingValue;
  const conf = priorityConfig[displayValue] || priorityConfig.normal;
  const PIcon = conf.icon;
  const isActive = state !== "idle";
  const borderColor = state === "editing" ? "#07abde" : state === "unsaved" ? "#C4990D" : "transparent";
  const labelColor = state === "editing" ? "#07abde" : state === "unsaved" ? "#C4990D" : "#98989d";
  const padding = isActive ? "5px" : "6px";

  return (
    <div
      ref={anchorRef}
      className={`group/prio relative flex flex-col gap-0 rounded-[8px] transition-all duration-150 ${
        isActive ? "cursor-text" : "hover:bg-[#f6f7f9] cursor-pointer"
      }`}
      style={{ padding, border: `1px solid ${borderColor}` }}
      onClick={!isActive ? startEdit : undefined}
    >
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: labelColor, ...fontFeature }}>
          Prioridade
        </span>
        <Lightning size={10} weight="bold" className="ml-[2px]" style={{ color: labelColor }} />
      </div>
      <div className="flex items-center gap-[6px] min-h-[22px]">
        <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: conf.color }} />
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: state === "unsaved" ? "#C4990D" : "#4e6987", ...fontFeature }}>
          {conf.label}
        </span>
        {state === "editing" && <CaretDown size={12} weight="bold" className="ml-auto" style={{ color: "#07abde" }} />}
        {overdue && state === "idle" && (
          <div className="flex items-center gap-[3px] h-[22px] px-[8px] rounded-[500px] bg-[#FFEDEB]">
            <Warning size={10} weight="fill" className="text-[#ED5200]" />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "#ED5200", ...fontFeature }}>Atrasada</span>
          </div>
        )}
      </div>

      {state === "idle" && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover/prio:opacity-100 transition-opacity">
          <span className="hidden group-hover/prio:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {state === "editing" && (
        <div className="absolute right-[5px] top-[10px]">
          <button onClick={(e) => { e.stopPropagation(); setState("idle"); }} className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer transition-colors">
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
      {state === "unsaved" && (
        <div className="absolute right-[5px] top-[10px] flex items-center gap-[3px]">
          <button onClick={(e) => { e.stopPropagation(); save(); }} className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors" style={{ backgroundColor: "#feedca", color: "#C4990D" }}>
            <Check size={9} weight="bold" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); discard(); }} className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors" style={{ backgroundColor: "#feedca", color: "#C4990D" }}>
            <X size={9} weight="bold" />
          </button>
        </div>
      )}

      {state === "editing" && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[99999] bg-white rounded-[10px] border border-[#eceef1] pb-[4px] shadow-lg"
          style={{ top: pos.top, left: pos.left, width: 180, ...fontFeature }}
          onClick={(e) => e.stopPropagation()}
        >
          {PRIORITY_KEYS.map((key) => {
            const c = priorityConfig[key];
            const isSelected = key === value;
            return (
              <button
                key={key}
                onClick={() => select(key)}
                className={`w-full flex items-center gap-[8px] px-[10px] py-[5px] text-left transition-colors cursor-pointer ${
                  isSelected ? "bg-[#f0f8ff]" : "hover:bg-[#f6f7f9]"
                }`}
              >
                <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-[#4e6987] truncate" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                  {c.label}
                </span>
                {isSelected && <Check size={12} weight="bold" className="ml-auto text-[#07ABDE] shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AssociationField — DS pattern for related entity                   */
/* ------------------------------------------------------------------ */

interface AssociationRecord {
  id: string;
  name: string;
  type: "conta" | "oportunidade" | "contato" | "lead";
  meta: string;
}

function TaskAssociationField({
  value,
  relatedToType,
  onChange,
}: {
  value: string;
  relatedToType: string;
  onChange: (name: string, type: string, id: string) => void;
}) {
  const [state, setState] = useState<"idle" | "editing">("idle");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<AssociationRecord[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const isEmpty = !value;
  const typeConf = ASSOC_TYPE_CONFIG[relatedToType] || ASSOC_TYPE_CONFIG.conta;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [accounts, opps, contacts, leads] = await Promise.all([
          listAccounts().catch(() => []),
          listOpportunities().catch(() => []),
          listContacts().catch(() => []),
          listLeads().catch(() => []),
        ]);
        if (cancelled) return;
        const all: AssociationRecord[] = [
          ...accounts.map((a: any) => ({ id: a.id, name: a.name, type: "conta" as const, meta: `Conta${a.sector ? ` · ${a.sector}` : ""}` })),
          ...opps.map((o: any) => ({ id: o.id, name: o.name, type: "oportunidade" as const, meta: `Oportunidade${o.stage ? ` · ${o.stage}` : ""}` })),
          ...contacts.map((c: any) => ({ id: c.id, name: `${c.name}${c.last_name ? ` ${c.last_name}` : ""}`, type: "contato" as const, meta: `Contato${c.role ? ` · ${c.role}` : ""}` })),
          ...leads.map((l: any) => ({ id: l.id, name: `${l.name}${l.lastname ? ` ${l.lastname}` : ""}`, type: "lead" as const, meta: `Lead${l.company ? ` · ${l.company}` : ""}` })),
        ];
        setRecords(all);
      } catch (err) {
        console.error("[TaskAssociationField] Failed to load records:", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state !== "editing") return;
    function updatePos() {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [state]);

  useEffect(() => {
    if (state !== "editing") return;
    const h = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      setState("idle");
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [state]);

  useEffect(() => {
    if (state === "editing") {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [state]);

  const filtered = records.filter(
    (r) => r.name !== value && (r.name.toLowerCase().includes(search.toLowerCase()) || r.meta.toLowerCase().includes(search.toLowerCase()))
  );

  const selectRecord = (r: AssociationRecord) => { onChange(r.name, r.type, r.id); setState("idle"); };
  const removeLink = () => { onChange("", "", ""); setState("idle"); };

  const isActive = state === "editing";
  const borderColor = isActive ? "#07abde" : "transparent";
  const labelColor = isActive ? "#07abde" : "#98989d";
  const padding = isActive ? "5px" : "6px";

  return (
    <div
      ref={anchorRef}
      className={`group/assoc relative flex flex-col gap-0 rounded-[8px] transition-all ${
        isActive ? "cursor-text" : "hover:bg-[#f6f7f9] cursor-pointer"
      }`}
      style={{ padding, border: `1px solid ${borderColor}` }}
      onClick={() => { if (state === "idle") setState("editing"); }}
    >
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: labelColor, ...fontFeature }}>
          Relacionado a
        </span>
        <LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />
      </div>
      <div className="flex items-center gap-[6px] min-h-[22px]">
        {isEmpty ? (
          <span className="text-[#c8cfdb]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>&mdash;</span>
        ) : (
          <>
            <Building size={14} weight="duotone" style={{ color: typeConf.color }} className="shrink-0" />
            <span
              className="underline decoration-transparent group-hover/assoc:decoration-current transition-all duration-200 underline-offset-2 truncate"
              style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", color: "#0483AB", ...fontFeature }}
            >
              {value}
            </span>
          </>
        )}
        {isActive && <CaretDown size={12} weight="bold" className="text-[#4e6987]" />}
      </div>

      {state === "idle" && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover/assoc:opacity-100 transition-opacity">
          <span className="hidden group-hover/assoc:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}
      {isActive && (
        <div className="absolute right-[5px] top-[10px]">
          <button onClick={(e) => { e.stopPropagation(); setState("idle"); }} className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer transition-colors">
            <X size={9} weight="bold" />
          </button>
        </div>
      )}

      {isActive && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[99999] bg-white rounded-[12px] overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: 280, boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)", ...fontFeature }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-[12px] py-[6px]">
            <div className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]" style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1)" }}>
              <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setState("idle"); }}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-[#28415c] outline-none min-w-0 placeholder:text-[#c8cfdb]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
              />
            </div>
          </div>
          {search.length > 0 && (
            <div className="max-h-[160px] overflow-y-auto">
              {filtered.map((r) => {
                const rc = ASSOC_TYPE_CONFIG[r.type] || ASSOC_TYPE_CONFIG.conta;
                return (
                  <button key={r.id || r.name} onClick={() => selectRecord(r)} className="w-full flex items-center gap-[8px] px-[12px] py-[6px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer">
                    <div className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0" style={{ backgroundColor: rc.bg }}>
                      <Building size={12} weight="duotone" style={{ color: rc.color }} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{r.name}</span>
                      <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}>{r.meta}</span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="px-[12px] py-[8px] text-[#98989d]" style={{ fontSize: 12, ...fontFeature }}>Nenhum resultado</div>}
            </div>
          )}
          {!isEmpty && (
            <div className="px-[12px] pb-[10px] pt-[2px]">
              <button onClick={removeLink} className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] bg-[#F6F7F9] hover:bg-[#FFEDEB] text-[#F56233] transition-colors cursor-pointer">
                <LinkBreak size={13} weight="bold" />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}>Remover vinculo</span>
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Detalhes                                                      */
/* ------------------------------------------------------------------ */

function TabDetalhes({
  task,
  overdue,
  onFieldChange,
  onStatusChange,
  onPriorityChange,
  onAssociationChange,
}: {
  task: TaskData;
  overdue: boolean;
  onFieldChange: (fieldKey: string, value: string) => void;
  onStatusChange: (s: TaskStatus) => void;
  onPriorityChange: (p: Priority) => void;
  onAssociationChange: (name: string, type: string, id: string) => void;
}) {
  const [mainOpen, setMainOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const [metaOpen, setMetaOpen] = useState(false);

  return (
    <div className="flex flex-col gap-[4px]">
      {/* Main task fields */}
      <SectionToggle title="Detalhes da Tarefa" expanded={mainOpen} onToggle={() => setMainOpen((v) => !v)}>
        <div className="mt-[12px] pl-[39px]">
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[4px]">
            <TaskStatusField value={task.status} onChange={onStatusChange} />
            <TaskPriorityField value={task.priority} overdue={overdue} onChange={onPriorityChange} />
            <EditableField
              label="ASSUNTO"
              value={task.subject}
              fieldType="text"
              labelIcon={<NotePencil size={10} weight="bold" />}
              onChange={(val) => onFieldChange("subject", val)}
            />
            <EditableField
              label="DATA DE VENCIMENTO"
              value={task.dueDate}
              fieldType="datetime"
              labelIcon={<CalendarBlank size={10} weight="bold" />}
              onChange={(val) => onFieldChange("dueDate", val)}
            />
            <div className="col-span-2">
              <EditableField
                label="DESCRICAO"
                value={task.description}
                fieldType="textarea"
                labelIcon={<TextAlignLeft size={10} weight="bold" />}
                onChange={(val) => onFieldChange("description", val)}
              />
            </div>
            <EditableField
              label="ATRIBUIDO A"
              value={task.assignedTo}
              fieldType="user"
              labelIcon={<UserCircle size={10} weight="bold" />}
              onChange={(val) => onFieldChange("assignedTo", val)}
            />
            <EditableField
              label="PROPRIETARIO"
              value={task.owner}
              fieldType="user"
              labelIcon={<UserCircle size={10} weight="bold" />}
              onChange={(val) => onFieldChange("owner", val)}
            />
            <div className="col-span-2">
              <EditableField
                label="TAGS"
                value={(task.tags || []).join(";")}
                fieldType="multipicklist"
                options={TAG_OPTIONS}
                labelIcon={<Tag size={10} weight="bold" />}
                onChange={(val) => onFieldChange("tags", val)}
              />
            </div>
          </div>
        </div>
      </SectionToggle>

      {/* Context: association */}
      <SectionToggle title="Contexto" expanded={contextOpen} onToggle={() => setContextOpen((v) => !v)}>
        <div className="mt-[12px] pl-[39px]">
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[4px]">
            <TaskAssociationField
              value={task.relatedToName}
              relatedToType={task.relatedToType || "conta"}
              onChange={onAssociationChange}
            />
            <EditableField
              label="CONTATO"
              value={task.contactName}
              fieldType="text"
              labelIcon={<User size={10} weight="bold" />}
              onChange={(val) => onFieldChange("contactName", val)}
            />
          </div>
        </div>
      </SectionToggle>

      {/* Metadata */}
      <SectionToggle title="Informacoes" expanded={metaOpen} onToggle={() => setMetaOpen((v) => !v)}>
        <div className="mt-[12px] pl-[39px]">
          <div className="grid grid-cols-3 gap-x-[16px] gap-y-[4px]">
            <EditableField label="ID" value={task.id} fieldType="id" editable={false} />
            <EditableField label="CRIADO EM" value={task.createdAt} editable={false} />
            <EditableField label="ATUALIZADO EM" value={task.updatedAt} editable={false} />
            {task.completedAt && (
              <EditableField label="CONCLUIDA EM" value={task.completedAt} editable={false} />
            )}
            {task.createdBy && (
              <EditableField label="CRIADO POR" value={task.createdBy} fieldType="user" editable={false} />
            )}
          </div>
        </div>
      </SectionToggle>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Historico                                                     */
/* ------------------------------------------------------------------ */

function TabHistorico({ activities }: { activities: Activity[] }) {
  const grouped: { group: string; items: Activity[] }[] = [];
  activities.forEach((a) => {
    const existing = grouped.find((g) => g.group === a.group);
    if (existing) existing.items.push(a);
    else grouped.push({ group: a.group, items: [a] });
  });

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-[6px] py-[12px]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0">
          <div className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#dde3ec] shrink-0">
            <ListBullets size={17} weight="duotone" className="text-[#4e6987]" />
          </div>
          <span className="text-[#4e6987]" style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
            Atividades relacionadas
          </span>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="flex items-center justify-center h-[200px]">
          <span className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
            Nenhuma atividade encontrada para esta tarefa.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-[4px] items-center">
          {grouped.map((group) => (
            <div key={group.group} className="w-full flex flex-col gap-[4px] items-center">
              <span className="text-[#64676c] uppercase text-center" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                {group.group}
              </span>
              {group.items.map((a) => (
                <ActivityItem key={a.id} activity={a} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { minimize } = useMultitask();
  const { trackRecent } = useCrmSearch();
  const [task, setTask] = useState<TaskData>(emptyTask);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskTab>("detalhes");
  const [deleting, setDeleting] = useState(false);
  const teamMembers = useTeamMembers(true);

  /* ── Load task from Supabase ── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await getActivity(id);
        if (cancelled) return;
        if ((row.type || "") !== "tarefa") {
          toast.error("Esta atividade nao e uma tarefa.");
          navigate("/crm/atividades/tarefas");
          return;
        }

        const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR") : "");

        setTask({
          id: row.id,
          subject: row.subject || row.label || "",
          description: row.description || "",
          status: (row.status || "nao_iniciada") as TaskStatus,
          priority: (row.priority || "normal") as Priority,
          dueDate: row.due_date || "",
          completedAt: row.completed_at || "",
          assignedTo: row.assigned_to || row.owner || "",
          relatedToType: row.related_to_type || "",
          relatedToId: row.related_to_id || "",
          relatedToName: row.related_to_name || "",
          contactName: row.contact_name || "",
          owner: row.owner || "",
          tags: row.tags ? (typeof row.tags === "string" ? row.tags.split(";").filter(Boolean) : Array.isArray(row.tags) ? row.tags : []) : [],
          createdAt: fmtDate(row.created_at),
          updatedAt: fmtDate(row.updated_at),
          createdBy: row.created_by || "",
        });

        trackRecent({
          id: row.id,
          label: row.subject || row.label || "Tarefa",
          subtitle: row.id,
          objectType: "activity",
          visitedAt: Date.now(),
        });
      } catch (err) {
        console.error("Error loading task detail:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("not found")) {
            toast.error("Tarefa nao encontrada no banco de dados.");
            navigate("/crm/atividades/tarefas");
            return;
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  /* ── Status change handler ── */
  const handleStatusChange = useCallback(
    (newStatus: TaskStatus) => {
      setTask((prev) => ({
        ...prev,
        status: newStatus,
        completedAt: newStatus === "concluida" ? new Date().toISOString() : prev.completedAt,
      }));
      patchActivity(task.id, {
        status: newStatus,
        ...(newStatus === "concluida" ? { completed_at: new Date().toISOString() } : {}),
      }).catch((err) => console.error("Error persisting task status:", err));
      toast.success(`Status atualizado para "${statusConfig[newStatus]?.label || newStatus}"`);
    },
    [task.id],
  );

  /* ── Priority change handler ── */
  const handlePriorityChange = useCallback(
    (newPriority: Priority) => {
      setTask((prev) => ({ ...prev, priority: newPriority }));
      patchActivity(task.id, { priority: newPriority }).catch((err) =>
        console.error("Error persisting task priority:", err),
      );
    },
    [task.id],
  );

  /* ── Association change handler ── */
  const handleAssociationChange = useCallback(
    (name: string, type: string, assocId: string) => {
      setTask((prev) => ({ ...prev, relatedToName: name, relatedToType: type, relatedToId: assocId }));
      patchActivity(task.id, { related_to_name: name, related_to_type: type, related_to_id: assocId }).catch(console.error);
    },
    [task.id],
  );

  /* ── Field DB key mapping ── */
  const TASK_FIELD_TO_DB: Record<string, string> = {
    subject: "subject",
    description: "description",
    dueDate: "due_date",
    assignedTo: "assigned_to",
    owner: "owner",
    contactName: "contact_name",
    tags: "tags",
  };

  /* ── Generic field update ── */
  const updateTaskField = useCallback(
    (fieldKey: string, value: string) => {
      if (fieldKey === "tags") {
        const newTags = value.split(";").filter(Boolean);
        setTask((prev) => ({ ...prev, tags: newTags }));
        patchActivity(task.id, { tags: newTags.join(";") } as any).catch((err) =>
          console.error(`Error persisting task ${fieldKey}:`, err),
        );
        return;
      }
      setTask((prev) => ({ ...prev, [fieldKey]: value }));
      const dbKey = TASK_FIELD_TO_DB[fieldKey];
      if (!dbKey) return;
      patchActivity(task.id, { [dbKey]: value } as any).catch((err) =>
        console.error(`Error persisting task ${dbKey}:`, err),
      );
    },
    [task.id],
  );

  /* ── Delete task ── */
  const handleDelete = useCallback(async () => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    setDeleting(true);
    try {
      await deleteActivity(task.id);
      toast.success("Tarefa excluida com sucesso.");
      navigate("/crm/atividades/tarefas");
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Erro ao excluir tarefa.");
    } finally {
      setDeleting(false);
    }
  }, [task.id, navigate]);

  /* ── Derived values ── */
  const overdue = isOverdue(task);
  const sc = statusConfig[task.status] || statusConfig.nao_iniciada;
  const SIcon = sc.icon;

  // Resolve member names
  const resolvedOwner = useMemo(() => {
    if (!task.owner) return null;
    return teamMembers.find((m) => m.id === task.owner) || teamMembers.find((m) => m.name === task.owner) || null;
  }, [task.owner, teamMembers]);
  const ownerDisplayName = resolvedOwner?.name || task.owner;

  const resolvedAssigned = useMemo(() => {
    if (!task.assignedTo) return null;
    return teamMembers.find((m) => m.id === task.assignedTo) || teamMembers.find((m) => m.name === task.assignedTo) || null;
  }, [task.assignedTo, teamMembers]);
  const assignedDisplayName = resolvedAssigned?.name || task.assignedTo;

  // Activities for the historico tab
  const { activities: relatedActivities } = useEntityActivities(
    task.relatedToType || "tarefa",
    task.relatedToId || task.id,
    [],
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircleNotch size={32} weight="bold" className="text-[#8C8CD4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-auto">
      {/* ═══════ TOP HEADER BAR ═══════ */}
      <div className="bg-white rounded-[16px] p-[20px] pb-[16px] shrink-0">
        {/* Row 1: Name + actions */}
        <div className="flex items-center justify-between gap-4 mb-[12px]">
          {/* Left: icon + name */}
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#E8E8FD] shrink-0">
              <CheckCircle size={18} weight="duotone" className="text-[#8C8CD4]" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-[#64676c] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
              >
                TAREFA
              </span>
              <span
                className="text-[#28415c]"
                style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...fontFeature }}
              >
                {task.subject || "Sem assunto"}
              </span>
            </div>
          </div>

          {/* Right: status badge + priority + actions + close */}
          <div className="flex items-center gap-[16px]">
            {/* Status badge */}
            <div className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px]" style={{ backgroundColor: sc.bg, color: sc.color }}>
              <SIcon size={12} weight="fill" />
              <span className="uppercase whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                {sc.label}
              </span>
            </div>

            {/* Overdue badge */}
            {overdue && (
              <div className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-[#FFEDEB] text-[#ED5200]">
                <Warning size={12} weight="fill" />
                <span className="uppercase whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Atrasada
                </span>
              </div>
            )}

            {/* Assigned user badge */}
            {assignedDisplayName && (
              <div className="hidden md:flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-[#ddd8fd] text-[#31315C]">
                <UserCircle size={14} weight="fill" />
                <span className="uppercase whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  {assignedDisplayName}
                </span>
              </div>
            )}

            <VerticalDivider />

            {/* Action buttons pill */}
            <div className="hidden lg:flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
              <ActionButton><Tag size={18} weight="bold" /></ActionButton>
              <ActionButton><ClockCounterClockwise size={18} weight="bold" /></ActionButton>
              <ActionButton><CopySimple size={18} weight="bold" /></ActionButton>
              <ActionButton onClick={handleDelete}><Trash size={18} weight="bold" /></ActionButton>
              <ActionButton onClick={() => {
                minimize({
                  id: task.id,
                  title: task.subject || "Tarefa",
                  subtitle: task.id,
                  path: `/crm/atividades/tarefas/${task.id}`,
                  statusColor: "#8C8CD4",
                });
                navigate("/crm/atividades/tarefas");
              }}>
                <ArrowSquareDownRight size={18} weight="bold" />
              </ActionButton>
              <ActionButton onClick={() => navigate(-1)}>
                <X size={18} weight="bold" />
              </ActionButton>
            </div>

            {/* Mobile close */}
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] text-[#28415c] cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Row 2: Summary bar */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[12px]">
          <EditableField label="ID" value={task.id} editable={false} />
          <EditableField
            label="STATUS"
            value={sc.label}
            editable={false}
          />
          <EditableField
            label="PRIORIDADE"
            value={priorityConfig[task.priority]?.label || task.priority}
            editable={false}
          />
          <EditableField
            label="VENCIMENTO"
            value={task.dueDate ? formatDate(task.dueDate) : ""}
            editable={false}
          />
          <EditableField
            label="PROPRIETARIO"
            value={ownerDisplayName}
            fieldType="user"
            editable={false}
          />
        </div>
      </div>

      {/* ═══════ BELOW HEADER: Tabs + Content + Right Panel ═══════ */}
      <div className="flex gap-[12px] flex-1 min-h-0 pt-[12px]">
        {/* LEFT: Tabs + Content */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* TABS */}
          <div className="flex items-end gap-px shrink-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-[4px] h-[32px] px-[12px] rounded-tl-[12px] rounded-tr-[12px] cursor-pointer transition-colors ${
                    isActive ? "bg-white text-[#28415c]" : "text-[#98989d] hover:text-[#4E6987]"
                  }`}
                >
                  <Icon size={15} weight={isActive ? "fill" : "duotone"} />
                  <span
                    className="uppercase"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CONTENT */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className={`bg-white rounded-[16px] ${activeTab === "detalhes" ? "rounded-tl-none" : ""} overflow-auto h-full min-w-0`}>
              <div className="p-[18px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === "detalhes" && (
                      <TabDetalhes
                        task={task}
                        overdue={overdue}
                        onFieldChange={updateTaskField}
                        onStatusChange={handleStatusChange}
                        onPriorityChange={handlePriorityChange}
                        onAssociationChange={handleAssociationChange}
                      />
                    )}
                    {activeTab === "historico" && (
                      <TabHistorico activities={relatedActivities} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Quick actions panel */}
        <div className="hidden xl:flex flex-col w-[320px] shrink-0">
          <div className="bg-white rounded-[16px] flex flex-col h-full overflow-hidden">
            {/* Quick actions header */}
            <div className="px-[20px] pt-[16px] pb-[12px] border-b border-[#f0f2f5]">
              <span className="text-[#28415c]" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, ...fontFeature }}>
                Acoes rapidas
              </span>
            </div>

            <div className="flex-1 overflow-auto p-[16px] flex flex-col gap-[8px]">
              {/* Complete task */}
              {task.status !== "concluida" && (
                <button
                  onClick={() => handleStatusChange("concluida")}
                  className="flex items-center gap-[8px] w-full h-[44px] px-[14px] rounded-[12px] bg-[#D9F8EF] text-[#135543] hover:bg-[#c4f0e3] transition-colors cursor-pointer"
                >
                  <CheckCircle size={18} weight="fill" />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                    Concluir tarefa
                  </span>
                </button>
              )}

              {/* Start task */}
              {task.status === "nao_iniciada" && (
                <button
                  onClick={() => handleStatusChange("em_andamento")}
                  className="flex items-center gap-[8px] w-full h-[44px] px-[14px] rounded-[12px] bg-[#DCF0FF] text-[#07ABDE] hover:bg-[#c8e7fc] transition-colors cursor-pointer"
                >
                  <Clock size={18} weight="fill" />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                    Iniciar tarefa
                  </span>
                </button>
              )}

              {/* Cancel task */}
              {task.status !== "cancelada" && task.status !== "concluida" && (
                <button
                  onClick={() => handleStatusChange("cancelada")}
                  className="flex items-center gap-[8px] w-full h-[44px] px-[14px] rounded-[12px] bg-[#f6f7f9] text-[#F56233] hover:bg-[#FFEDEB] transition-colors cursor-pointer"
                >
                  <X size={18} weight="bold" />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                    Cancelar tarefa
                  </span>
                </button>
              )}

              {/* Reopen if completed */}
              {(task.status === "concluida" || task.status === "cancelada") && (
                <button
                  onClick={() => handleStatusChange("nao_iniciada")}
                  className="flex items-center gap-[8px] w-full h-[44px] px-[14px] rounded-[12px] bg-[#DDE3EC] text-[#4E6987] hover:bg-[#d0d7e4] transition-colors cursor-pointer"
                >
                  <ClockCounterClockwise size={18} weight="fill" />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                    Reabrir tarefa
                  </span>
                </button>
              )}

              {/* Separator */}
              <div className="h-[1px] bg-[#f0f2f5] my-[4px]" />

              {/* Related entity link */}
              {task.relatedToName && (
                <button
                  onClick={() => {
                    const typeRouteMap: Record<string, string> = {
                      lead: "leads",
                      oportunidade: "oportunidades",
                      conta: "contas",
                      contato: "contatos",
                    };
                    const route = typeRouteMap[task.relatedToType];
                    if (route && task.relatedToId) {
                      navigate(`/crm/${route}/${task.relatedToId}`);
                    }
                  }}
                  className="flex items-center gap-[8px] w-full h-[44px] px-[14px] rounded-[12px] bg-[#f6f7f9] text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer"
                >
                  <ArrowSquareOut size={18} weight="bold" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                      {task.relatedToName}
                    </span>
                    <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}>
                      {ASSOC_TYPE_CONFIG[task.relatedToType]?.label || "Registro"}
                    </span>
                  </div>
                </button>
              )}

              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-[8px] w-full h-[44px] px-[14px] rounded-[12px] bg-[#f6f7f9] text-[#F56233] hover:bg-[#FFEDEB] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash size={18} weight="bold" />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                  {deleting ? "Excluindo..." : "Excluir tarefa"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}