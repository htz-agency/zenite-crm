/**
 * CRM Tasks — Dedicated listing page for "Tarefa" activity type.
 *
 * Follows the same visual patterns as crm-activities.tsx but scoped
 * exclusively to tasks, with status segmented pills and task-specific
 * columns / metrics.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  CheckCircle,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  Trash,
  GearSix,
  PushPin,
  Bell,
  Info,
  X,
  FunnelSimple,
  ArrowUp,
  ArrowDown,
  Clock,
  Warning,
  UserCircle,
  SealCheck,
  Lightning,
  Hourglass,
  CalendarBlank,
  Spinner,
  Check,
  LinkSimpleHorizontal,
  NotePencil,
  User,
  Tag,
  TextAlignLeft,
  Calendar,
  Building,
  ArrowSquareOut,
  MagnifyingGlass,
  LinkBreak,
  PencilSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  listActivities,
  createActivity,
  patchActivity,
  generateCrmId,
  listAccounts,
  listOpportunities,
  listContacts,
  listLeads,
  createGoogleTask,
  type DbActivity,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";
import { useCreateActivity } from "./create-activity-context";
import { useTeamMembers } from "./use-team-members";
import { OwnerCell } from "./owner-cell";
import { EditableField } from "./editable-field";
import {
  fontFeature,
  type TaskStatus,
  type Priority,
  type Task,
  TASK_STATUS_CONFIG,
  TASK_STATUS_KEYS,
  PRIORITY_CONFIG,
  PRIORITY_KEYS as PRIORITY_KEYS_CFG,
  TAG_OPTIONS,
  ASSOC_TYPE_CONFIG,
  ENTITY_BADGE,
  RELATED_TYPE_LABELS,
  STATUS_BY_TYPE,
  dbActivityToTask,
  isTaskOverdue,
  formatRelativeDate,
  modalInputCls,
  modalInputStyle,
  modalLabelStyle,
} from "./activity-config";

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

/* Status & Priority configs — single source from activity-config */
const STATUS_KEYS = TASK_STATUS_KEYS;
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

const relatedTypeLabels = RELATED_TYPE_LABELS;

/* ------------------------------------------------------------------ */
/*  Filter Panel Types & Config                                        */
/* ------------------------------------------------------------------ */

type TaskFilterField = "priority" | "relatedToType" | "owner";

interface TaskFilterCondition {
  field: TaskFilterField;
  values: string[];
}

const TASK_FILTER_FIELDS: { key: TaskFilterField; label: string; icon: React.ComponentType<any> }[] = [
  { key: "priority", label: "PRIORIDADE", icon: ArrowUp },
  { key: "relatedToType", label: "RELACIONADO A", icon: Lightning },
  { key: "owner", label: "PROPRIETARIO", icon: UserCircle },
];

function getTaskFilterOptions(field: TaskFilterField, tasks: Task[]): { value: string; label: string }[] {
  switch (field) {
    case "priority":
      return (Object.keys(priorityConfig) as Priority[]).map((k) => ({ value: k, label: priorityConfig[k].label }));
    case "relatedToType":
      return Object.entries(relatedTypeLabels).map(([k, v]) => ({ value: k, label: v }));
    case "owner": {
      const unique = Array.from(new Set(tasks.map((t) => t.owner).filter(Boolean)));
      return unique.sort().map((o) => ({ value: o, label: o }));
    }
    default:
      return [];
  }
}

function applyTaskFilters(tasks: Task[], filters: TaskFilterCondition[]): Task[] {
  if (filters.length === 0) return tasks;
  return tasks.filter((t) => {
    for (const fc of filters) {
      if (fc.values.length === 0) continue;
      switch (fc.field) {
        case "priority":
          if (!fc.values.includes(t.priority)) return false;
          break;
        case "relatedToType":
          if (!fc.values.includes(t.relatedToType)) return false;
          break;
        case "owner":
          if (!fc.values.includes(t.owner)) return false;
          break;
      }
    }
    return true;
  });
}

function taskFilterConditionLabel(fc: TaskFilterCondition): string {
  const fieldDef = TASK_FILTER_FIELDS.find((f) => f.key === fc.field);
  const prefix = fieldDef?.label ?? fc.field;
  if (fc.values.length === 0) return prefix;
  if (fc.values.length === 1) {
    if (fc.field === "priority") return `${prefix}: ${priorityConfig[fc.values[0] as Priority]?.label ?? fc.values[0]}`;
    if (fc.field === "relatedToType") return `${prefix}: ${relatedTypeLabels[fc.values[0]] ?? fc.values[0]}`;
    return `${prefix}: ${fc.values[0]}`;
  }
  return `${prefix}: ${fc.values.length} selecionados`;
}

/* ------------------------------------------------------------------ */
/*  TaskFilterDropdownPill                                             */
/* ------------------------------------------------------------------ */

function TaskFilterDropdownPill({
  fieldDef,
  condition,
  onChange,
  tasks,
}: {
  fieldDef: { key: TaskFilterField; label: string; icon: React.ComponentType<any> };
  condition: TaskFilterCondition | undefined;
  onChange: (fc: TaskFilterCondition) => void;
  tasks: Task[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const f = fieldDef.key;
  const hasValue = condition?.values && condition.values.length > 0;
  const Icon = fieldDef.icon;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleValue = (val: string) => {
    const current = condition?.values ?? [];
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    onChange({ field: f, values: next });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] transition-colors cursor-pointer whitespace-nowrap ${
          hasValue
            ? "bg-[#07ABDE] text-[#DCF0FF]"
            : "bg-[#f6f7f9] text-[#0483AB] hover:bg-[#dcf0ff] hover:text-[#0483AB]"
        }`}
      >
        <Icon size={13} weight={hasValue ? "fill" : "bold"} />
        <span
          className="font-bold uppercase tracking-[0.5px]"
          style={{ fontSize: 10, ...fontFeature }}
        >
          {fieldDef.label}
        </span>
        {open ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />}
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 bg-white backdrop-blur-[50px] rounded-[20px] p-[10px] min-w-[220px]"
          style={{ boxShadow: "0px 2px 8px 0px rgba(18,34,50,0.25)" }}
        >
          <div
            aria-hidden="true"
            className="absolute border-[1.2px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]"
          />
          <div className="flex flex-col gap-[2px] max-h-[240px] overflow-y-auto">
            {getTaskFilterOptions(f, tasks).map((opt) => {
              const checked = condition?.values?.includes(opt.value) ?? false;
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleValue(opt.value)}
                  className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left w-full"
                >
                  <div className={`size-[14px] rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "border-[#23E6B2] bg-[#23E6B2]" : "border-[#98989d] bg-transparent"
                  }`}>
                    {checked && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.25 5.75L6.5 2.25" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-[#28415c]"
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock Data (tasks only)                                             */
/* ------------------------------------------------------------------ */

const mockTasks: Task[] = [
  { id: "TK-A1B2", subject: "Enviar proposta comercial", description: "Preparar e enviar a proposta para o cliente Alpha", status: "nao_iniciada", priority: "alta", dueDate: "2026-02-28", completedAt: "", assignedTo: "Joao Silva", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", contactName: "Ana Carolina", owner: "Joao Silva", tags: ["importante", "urgente"], createdAt: "2026-02-20", updatedAt: "2026-02-20" },
  { id: "TK-E5F6", subject: "Follow-up apos apresentacao", description: "", status: "em_andamento", priority: "normal", dueDate: "2026-02-25", completedAt: "", assignedTo: "Pedro Costa", relatedToType: "lead", relatedToId: "LD-E5F6", relatedToName: "Carlos Eduardo", contactName: "", owner: "Pedro Costa", tags: ["follow-up"], createdAt: "2026-02-18", updatedAt: "2026-02-22" },
  { id: "TK-Q6R7", subject: "Preparar apresentacao para demo", description: "Slides + roteiro de demonstracao do produto", status: "aguardando", priority: "alta", dueDate: "2026-03-01", completedAt: "", assignedTo: "Juliana Ferreira", relatedToType: "oportunidade", relatedToId: "OP-E5F6", relatedToName: "Contrato Gamma", contactName: "", owner: "Juliana Ferreira", tags: ["importante"], createdAt: "2026-02-13", updatedAt: "2026-02-20" },
  { id: "TK-U1V2", subject: "Atualizar CRM com dados do contato", description: "", status: "concluida", priority: "baixa", dueDate: "2026-02-20", completedAt: "2026-02-20", assignedTo: "Camila Ribeiro", relatedToType: "contato", relatedToId: "CT-W3X4", relatedToName: "Kleber Oliveira", contactName: "Kleber Oliveira", owner: "Camila Ribeiro", tags: ["interno"], createdAt: "2026-02-11", updatedAt: "2026-02-20" },
  { id: "TK-Y5Z6", subject: "Revisar contrato antes do envio", description: "Verificar clausulas e valores", status: "cancelada", priority: "alta", dueDate: "2026-02-27", completedAt: "", assignedTo: "Rafaela Costa", relatedToType: "oportunidade", relatedToId: "OP-G7H8", relatedToName: "Renovacao Delta", contactName: "", owner: "Rafaela Costa", tags: ["urgente"], createdAt: "2026-02-09", updatedAt: "2026-02-25" },
  { id: "TK-B3C4", subject: "Mapear stakeholders do projeto Beta", description: "", status: "nao_iniciada", priority: "normal", dueDate: "2026-03-04", completedAt: "", assignedTo: "Maria Oliveira", relatedToType: "conta", relatedToId: "AC-0EA1", relatedToName: "Empresa Alpha", contactName: "Bruno Mendes", owner: "Maria Oliveira", tags: [], createdAt: "2026-02-21", updatedAt: "2026-02-21" },
  { id: "TK-D5E6", subject: "Criar relatorio mensal de vendas", description: "Dados de Janeiro para diretoria", status: "em_andamento", priority: "normal", dueDate: "2026-02-26", completedAt: "", assignedTo: "Lucas Souza", relatedToType: "conta", relatedToId: "AC-L2M3", relatedToName: "Zeta Inc", contactName: "", owner: "Lucas Souza", tags: ["interno"], createdAt: "2026-02-19", updatedAt: "2026-02-24" },
  { id: "TK-F7G8", subject: "Agendar call com time tecnico", description: "", status: "concluida", priority: "baixa", dueDate: "2026-02-22", completedAt: "2026-02-22", assignedTo: "Ana Paula", relatedToType: "oportunidade", relatedToId: "OP-C3D4", relatedToName: "Expansao Beta", contactName: "Daniela Souza", owner: "Ana Paula", tags: [], createdAt: "2026-02-15", updatedAt: "2026-02-22" },
  { id: "TK-H9J1", subject: "Enviar material de onboarding", description: "Kit boas-vindas + acessos", status: "nao_iniciada", priority: "alta", dueDate: "2026-03-02", completedAt: "", assignedTo: "Carlos Pereira", relatedToType: "contato", relatedToId: "CT-Q6R7", relatedToName: "Helena Rocha", contactName: "Helena Rocha", owner: "Carlos Pereira", tags: ["follow-up", "importante"], createdAt: "2026-02-23", updatedAt: "2026-02-23" },
  { id: "TK-K2L3", subject: "Levantar requisitos do escopo", description: "", status: "em_andamento", priority: "alta", dueDate: "2026-02-27", completedAt: "", assignedTo: "Fernanda Santos", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", contactName: "Ana Carolina", owner: "Fernanda Santos", tags: ["urgente"], createdAt: "2026-02-17", updatedAt: "2026-02-25" },
  { id: "TK-M4N5", subject: "Registrar ata da reuniao", description: "", status: "concluida", priority: "baixa", dueDate: "2026-02-19", completedAt: "2026-02-19", assignedTo: "Rafael Alves", relatedToType: "conta", relatedToId: "AC-J9K1", relatedToName: "Epsilon Ltda", contactName: "", owner: "Rafael Alves", tags: [], createdAt: "2026-02-14", updatedAt: "2026-02-19" },
  { id: "TK-P6Q7", subject: "Configurar automacao de emails", description: "Sequencia de nurturing para leads novos", status: "aguardando", priority: "normal", dueDate: "2026-03-06", completedAt: "", assignedTo: "Joao Pedro", relatedToType: "lead", relatedToId: "LD-Y5Z6", relatedToName: "Larissa Campos", contactName: "Larissa Campos", owner: "Joao Pedro", tags: ["interno", "follow-up"], createdAt: "2026-02-10", updatedAt: "2026-02-24" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/* dbActivityToTask, formatRelativeDate, isTaskOverdue — imported from activity-config */
const isOverdue = (t: Task) => isTaskOverdue(t);

/* ------------------------------------------------------------------ */
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [260, 120, 100, 100, 150, 140, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "ASSUNTO",
  "STATUS",
  "PRIORIDADE",
  "VENCIMENTO",
  "RELACIONADO A",
  "PROPRIETARIO",
  "CRIADO EM",
];

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

/* ------------------------------------------------------------------ */
/*  Shared UI: Dividers & Checkbox                                     */
/* ------------------------------------------------------------------ */

function HorizontalDivider() {
  return (
    <div className="h-0 relative w-full">
      <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
        <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
      </svg>
    </div>
  );
}

function VerticalDivider() {
  return (
    <div className="flex h-[20px] items-center justify-center shrink-0 w-[1.5px]">
      <div className="-rotate-90 flex-none">
        <div className="h-[1.5px] relative w-[20px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.9651 1.5">
            <path d="M0.75 0.75H20.2151" stroke="#DDE3EC" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function CircleCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative shrink-0 size-[16px] cursor-pointer"
    >
      <div
        className={`absolute inset-0 rounded-full border-[1.5px] border-solid transition-colors ${
          checked ? "border-[#3ccea7] bg-[#3ccea7]" : "border-[#28415c] bg-transparent"
        }`}
      />
      {checked && (
        <svg className="absolute inset-0 size-full" viewBox="0 0 16 16" fill="none">
          <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TaskAssociationField — DS-style Association field                   */
/* ------------------------------------------------------------------ */

interface AssociationRecord {
  id: string;
  name: string;
  type: "conta" | "oportunidade" | "contato" | "lead";
  meta: string;
}

/* ASSOC_TYPE_CONFIG — imported from activity-config */

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
  const [loadingRecords, setLoadingRecords] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const isEmpty = !value;
  const typeConf = ASSOC_TYPE_CONFIG[relatedToType] || ASSOC_TYPE_CONFIG.conta;
  const currentRecord = records.find((r) => r.name === value) ?? (value ? { id: "", name: value, type: relatedToType as any, meta: typeConf.label } : null);

  // Load all association records on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingRecords(true);
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
      } finally {
        if (!cancelled) setLoadingRecords(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Position popover
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

  // Close on outside click
  useEffect(() => {
    if (state !== "editing") return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      setState("idle");
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [state]);

  // Auto-focus search
  useEffect(() => {
    if (state === "editing") {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [state]);

  const filtered = records.filter(
    (r) => r.name !== value && (r.name.toLowerCase().includes(search.toLowerCase()) || r.meta.toLowerCase().includes(search.toLowerCase()))
  );

  const selectRecord = (r: AssociationRecord) => {
    onChange(r.name, r.type, r.id);
    setState("idle");
  };

  const removeLink = () => {
    onChange("", "", "");
    setState("idle");
  };

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
      {/* Label */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: labelColor, ...fontFeature }}>
          Relacionado a
        </span>
        <LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />
      </div>

      {/* Value */}
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

      {/* Idle hover pencil */}
      {state === "idle" && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover/assoc:opacity-100 transition-opacity">
          <span className="hidden group-hover/assoc:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}

      {/* Editing: X cancel */}
      {isActive && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setState("idle"); }}
            className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer transition-colors"
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}

      {/* DS Popover */}
      {isActive && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[99999] bg-white rounded-[12px] overflow-hidden"
          style={{
            top: pos.top,
            left: pos.left,
            width: 280,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            ...fontFeature,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Current linked record */}
          {!isEmpty && currentRecord && (() => {
            const tc = ASSOC_TYPE_CONFIG[currentRecord.type] || ASSOC_TYPE_CONFIG.conta;
            return (
              <>
                <div className="px-[12px] pt-[10px] pb-[6px]">
                  <span
                    className="text-[#98989d] uppercase block mb-[6px]"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                  >
                    Registro vinculado
                  </span>
                  <div className="flex items-center gap-[8px] p-[8px] rounded-[8px] bg-[#f6f7f9]">
                    <div
                      className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0"
                      style={{ backgroundColor: tc.bg }}
                    >
                      <Building size={14} weight="duotone" style={{ color: tc.color }} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                        {currentRecord.name}
                      </span>
                      <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}>
                        {currentRecord.meta}
                      </span>
                    </div>
                    <button
                      className="flex items-center justify-center size-[24px] rounded-full hover:bg-[#DCF0FF] text-[#0483AB] transition-colors shrink-0 cursor-pointer"
                      title="Abrir registro"
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Separator */}
                <div className="h-[1px] bg-[#eceef1] mx-[12px]" />
              </>
            );
          })()}

          {/* Search input — DS style */}
          <div className="px-[12px] py-[6px]">
            <div
              className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
              style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
            >
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

          {/* Search results — only when search has content */}
          {search.length > 0 && (
            <div className="max-h-[160px] overflow-y-auto">
              {filtered.map((r) => {
                const rc = ASSOC_TYPE_CONFIG[r.type] || ASSOC_TYPE_CONFIG.conta;
                return (
                  <button
                    key={r.id || r.name}
                    onClick={() => selectRecord(r)}
                    className="w-full flex items-center gap-[8px] px-[12px] py-[6px] text-left hover:bg-[#f6f7f9] transition-colors cursor-pointer"
                  >
                    <div
                      className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                      style={{ backgroundColor: rc.bg }}
                    >
                      <Building size={12} weight="duotone" style={{ color: rc.color }} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                        {r.name}
                      </span>
                      <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}>
                        {r.meta}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-[12px] py-[8px] text-[#98989d]" style={{ fontSize: 12, ...fontFeature }}>
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
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}>
                  Remover vínculo
                </span>
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
/*  Task Priority Field (DS PicklistField pattern)                     */
/* ------------------------------------------------------------------ */

const PRIORITY_KEYS = PRIORITY_KEYS_CFG;

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

  useEffect(() => {
    if (state === "idle") setPendingValue(value);
  }, [value, state]);

  useEffect(() => {
    if (state !== "editing" || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [state]);

  useEffect(() => {
    if (state === "idle") return;
    const handler = (e: MouseEvent) => {
      if (
        anchorRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return;
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
      {/* Label row */}
      <div className="flex items-center gap-[4px]">
        <span className="uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: labelColor, ...fontFeature }}>
          Prioridade
        </span>
        <Lightning size={10} weight="bold" className="ml-[2px]" style={{ color: labelColor }} />
      </div>

      {/* Value row */}
      <div className="flex items-center gap-[6px] min-h-[22px]">
        <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: conf.color }} />
        <span style={{
          fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px",
          color: state === "unsaved" ? "#C4990D" : "#4e6987",
          ...fontFeature,
        }}>
          {conf.label}
        </span>
        {state === "editing" && (
          <CaretDown size={12} weight="bold" className="ml-auto" style={{ color: "#07abde" }} />
        )}
        {overdue && state === "idle" && (
          <div className="flex items-center gap-[3px] h-[22px] px-[8px] rounded-[500px] bg-[#FFEDEB]">
            <Warning size={10} weight="fill" className="text-[#ED5200]" />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "#ED5200", ...fontFeature }}>Atrasada</span>
          </div>
        )}
      </div>

      {/* Idle hover pencil */}
      {state === "idle" && (
        <div className="absolute right-[5px] top-[10px] opacity-0 group-hover/prio:opacity-100 transition-opacity">
          <span className="hidden group-hover/prio:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
            <PencilSimple size={9} weight="bold" />
          </span>
        </div>
      )}

      {/* Active: cancel / unsaved action bar */}
      {state === "editing" && (
        <div className="absolute right-[5px] top-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setState("idle"); }}
            className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer transition-colors"
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}
      {state === "unsaved" && (
        <div className="absolute right-[5px] top-[10px] flex items-center gap-[3px]">
          <button
            onClick={(e) => { e.stopPropagation(); save(); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#feedca", color: "#C4990D" }}
          >
            <Check size={9} weight="bold" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); discard(); }}
            className="flex items-center justify-center size-[16px] rounded-full cursor-pointer transition-colors"
            style={{ backgroundColor: "#feedca", color: "#C4990D" }}
          >
            <X size={9} weight="bold" />
          </button>
        </div>
      )}

      {/* DS Dropdown Popover */}
      {state === "editing" && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[99999] bg-white rounded-[10px] border border-[#eceef1] pb-[4px] shadow-lg"
          style={{
            top: pos.top,
            left: pos.left,
            width: 180,
            ...fontFeature,
          }}
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
                {isSelected && (
                  <Check size={12} weight="bold" className="ml-auto text-[#07ABDE] shrink-0" />
                )}
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
/*  Task Detail Panel                                                  */
/* ------------------------------------------------------------------ */

function TaskDetailPanel({
  task,
  onClose,
  onStatusChange,
  onTaskUpdate,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
}) {
  const detailNavigate = useNavigate();
  const statusConf = statusConfig[task.status] || statusConfig.nao_iniciada;
  const priorityConf = priorityConfig[task.priority] || priorityConfig.normal;
  const PriorityIcon = priorityConf.icon;
  const StatusIcon = statusConf.icon;
  const overdue = isOverdue(task);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="h-full flex flex-col bg-white rounded-[15px] overflow-hidden">
      {/* ─── Purple Header ─── */}
      <div className="relative shrink-0">
        <div className="bg-[#E8E8FD] px-[20px] pt-[16px] pb-[16px]">
          <div className="flex justify-end mb-[4px]">
            <button
              onClick={onClose}
              className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#ddd8fd] transition-colors text-[#31315C] cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="flex items-center justify-center w-[44px] h-[44px] rounded-[12px] bg-[#ddd8fd] shrink-0">
              <CheckCircle size={22} weight="duotone" className="text-[#8C8CD4]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#31315C] truncate" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}>{task.subject}</p>
              <p className="text-[#31315C] uppercase truncate" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "18px", ...fontFeature }}>{task.id}</p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto px-[14px] pt-[12px] pb-[20px]">
        {/* ── Status field (DS style) ── */}
        <div className="group/field relative flex flex-col gap-0 rounded-[8px] transition-all duration-150 border border-transparent p-[6px] hover:bg-[#f6f7f9]">
          <div className="flex items-center gap-[4px]">
            <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
              Status
            </span>
            <SealCheck size={10} weight="bold" className="ml-[2px] text-[#98989d]" />
          </div>
          <div className="flex items-center gap-[6px] min-h-[22px]">
            <div className="flex items-center gap-[4px] h-[22px] px-[8px] rounded-[500px]" style={{ backgroundColor: statusConf.bg }}>
              <StatusIcon size={10} weight="fill" style={{ color: statusConf.color }} />
              <span className="uppercase whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: statusConf.color, ...fontFeature }}>{statusConf.label}</span>
            </div>
          </div>
        </div>

        {/* ── Prioridade field (DS PicklistField pattern) ── */}
        <TaskPriorityField
          value={task.priority}
          overdue={overdue}
          onChange={(newPriority) => {
            onTaskUpdate(task.id, { priority: newPriority });
            patchActivity(task.id, { priority: newPriority }).catch(console.error);
          }}
        />

        {/* ─── Separator ─── */}
        <div className="h-[1px] bg-[#f0f2f5] mx-[6px] my-[4px]" />

        <EditableField
          label="Descrição"
          value={task.description || ""}
          fieldType="textarea"
          labelIcon={<TextAlignLeft size={10} weight="bold" />}
          onChange={(val) => {
            onTaskUpdate(task.id, { description: val });
            patchActivity(task.id, { description: val }).catch(console.error);
          }}
        />

        <EditableField
          label="Data de Vencimento"
          value={task.dueDate || ""}
          fieldType="datetime"
          labelIcon={<CalendarBlank size={10} weight="bold" />}
          onChange={(val) => {
            onTaskUpdate(task.id, { dueDate: val });
            patchActivity(task.id, { due_date: val }).catch(console.error);
          }}
        />

        <EditableField
          label="Atribuído a"
          value={task.assignedTo || ""}
          fieldType="user"
          labelIcon={<UserCircle size={10} weight="bold" />}
          onChange={(val) => {
            onTaskUpdate(task.id, { assignedTo: val });
            patchActivity(task.id, { assigned_to: val }).catch(console.error);
          }}
        />

        <EditableField
          label="Proprietário"
          value={task.owner || ""}
          fieldType="user"
          labelIcon={<UserCircle size={10} weight="bold" />}
          onChange={(val) => {
            onTaskUpdate(task.id, { owner: val });
            patchActivity(task.id, { owner: val }).catch(console.error);
          }}
        />

        <TaskAssociationField
          value={task.relatedToName || ""}
          relatedToType={task.relatedToType || "conta"}
          onChange={(name, type, id) => {
            onTaskUpdate(task.id, { relatedToName: name, relatedToType: type, relatedToId: id });
            patchActivity(task.id, { related_to_name: name, related_to_type: type, related_to_id: id }).catch(console.error);
          }}
        />

        <EditableField
          label="Tags"
          value={(task.tags || []).join(";")}
          fieldType="multipicklist"
          options={TAG_OPTIONS}
          labelIcon={<Tag size={10} weight="bold" />}
          onChange={(val) => {
            const newTags = val.split(";").filter(Boolean);
            onTaskUpdate(task.id, { tags: newTags });
            patchActivity(task.id, { tags: newTags.join(";") }).catch(console.error);
          }}
        />

        {/* ─── Separator: Metadata section ─── */}
        <div className="h-[1px] bg-[#f0f2f5] mx-[6px] my-[4px]" />

        <EditableField
          label="Criado em"
          value={task.createdAt || ""}
          fieldType="datetime"
          labelIcon={<Calendar size={10} weight="bold" />}
          editable={false}
        />

        <EditableField
          label="Atualizado em"
          value={task.updatedAt || ""}
          fieldType="datetime"
          labelIcon={<Calendar size={10} weight="bold" />}
          editable={false}
        />

        {task.completedAt && (
          <EditableField
            label="Concluída em"
            value={task.completedAt}
            fieldType="datetime"
            labelIcon={<Calendar size={10} weight="bold" />}
            editable={false}
          />
        )}
      </div>

      {/* ─── Footer actions ─── */}
      <div className="shrink-0 px-[20px] py-[12px]">
        <div className="h-[1px] bg-[#DDE3EC] mb-[12px]" />
        <div className="flex items-center gap-[6px] flex-wrap">
          {task.status !== "concluida" && (
            <button
              onClick={() => onStatusChange(task.id, "concluida")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer"
            >
              <CheckCircle size={13} weight="fill" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Concluir</span>
            </button>
          )}
          {task.status !== "cancelada" && task.status !== "concluida" && (
            <button
              onClick={() => onStatusChange(task.id, "cancelada")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#f6f7f9] text-[#F56233] hover:bg-[#FFEDEB] hover:text-[#F56233] transition-colors cursor-pointer"
            >
              <X size={11} weight="bold" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Cancelar</span>
            </button>
          )}
          <button
            onClick={() => detailNavigate(`/crm/atividades/tarefas/${task.id}`)}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer ml-auto"
          >
            <ArrowSquareOut size={13} weight="bold" />
            <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Abrir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Filter Pill (segmented)                                     */
/* ------------------------------------------------------------------ */

function StatusFilterPill({
  status,
  active,
  onClick,
}: {
  status: TaskStatus | "all";
  active: boolean;
  onClick: () => void;
}) {
  if (status === "all") {
    return (
      <button
        onClick={onClick}
        className={`relative flex items-center gap-[5px] h-[34px] px-[14px] rounded-[500px] transition-all cursor-pointer ${
          active
            ? "text-[#f6f7f9]"
            : "text-[#98989d] hover:text-[#4e6987] hover:bg-[#e8eaee]"
        }`}
      >
        {active && (
          <>
            <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
              style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
            />
          </>
        )}
        <span className="relative z-[1] font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
          Todas
        </span>
      </button>
    );
  }

  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-[5px] h-[34px] px-[12px] rounded-[500px] transition-all cursor-pointer ${
        active
          ? "text-[#f6f7f9]"
          : "text-[#98989d] hover:text-[#4e6987] hover:bg-[#e8eaee]"
      }`}
    >
      {active && (
        <>
          <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
            style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
          />
        </>
      )}
      <Icon size={14} weight={active ? "fill" : "regular"} className="relative z-[1]" />
      <span className="relative z-[1] font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
        {config.label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Task Modal                                                  */
/* ------------------------------------------------------------------ */

interface CreateTaskForm {
  subject: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  owner: string;
  assignedTo: string;
  tags: string[];
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
}

function getDefaultTaskForm(): CreateTaskForm {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    subject: "",
    description: "",
    status: "nao_iniciada",
    priority: "normal",
    dueDate: toDateStr(nextWeek),
    owner: "",
    assignedTo: "",
    tags: [],
    relatedToType: "",
    relatedToId: "",
    relatedToName: "",
  };
}

/* TAG_OPTIONS — imported from activity-config */

const TASK_STATUS_OPTIONS = STATUS_BY_TYPE.tarefa;

const TASK_PRIORITY_OPTIONS = Object.values(PRIORITY_CONFIG);

function CreateTaskModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [form, setForm] = useState<CreateTaskForm>(getDefaultTaskForm);
  const [saving, setSaving] = useState(false);
  const teamMembers = useTeamMembers(open);
  const [entitySearch, setEntitySearch] = useState("");
  const [entityOptions, setEntityOptions] = useState<{ type: string; id: string; name: string }[]>([]);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const entityRef = useRef<HTMLDivElement>(null);
  const [ownerDropdown, setOwnerDropdown] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const ownerRef = useRef<HTMLDivElement>(null);
  const [assignedDropdown, setAssignedDropdown] = useState(false);
  const [assignedSearch, setAssignedSearch] = useState("");
  const assignedRef = useRef<HTMLDivElement>(null);

  // Load entities for linking
  useEffect(() => {
    if (!open) return;
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
        setEntityOptions(opts);
      } catch { /* ignore */ }
    })();
  }, [open]);

  // Reset form when opening
  useEffect(() => {
    if (open) setForm(getDefaultTaskForm());
  }, [open]);

  // Close dropdowns on click outside
  useEffect(() => {
    if (!showEntityDropdown && !ownerDropdown && !assignedDropdown) return;
    const handler = (e: MouseEvent) => {
      if (showEntityDropdown && entityRef.current && !entityRef.current.contains(e.target as Node)) setShowEntityDropdown(false);
      if (ownerDropdown && ownerRef.current && !ownerRef.current.contains(e.target as Node)) setOwnerDropdown(false);
      if (assignedDropdown && assignedRef.current && !assignedRef.current.contains(e.target as Node)) setAssignedDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEntityDropdown, ownerDropdown, assignedDropdown]);

  const patch = (p: Partial<CreateTaskForm>) => setForm((f) => ({ ...f, ...p }));

  const filteredOwnerMembers = useMemo(() => {
    if (!ownerSearch) return teamMembers.slice(0, 8);
    const q = ownerSearch.toLowerCase();
    return teamMembers.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 8);
  }, [ownerSearch, teamMembers]);

  const filteredAssignedMembers = useMemo(() => {
    if (!assignedSearch) return teamMembers.slice(0, 8);
    const q = assignedSearch.toLowerCase();
    return teamMembers.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 8);
  }, [assignedSearch, teamMembers]);

  // Resolve UUID → member for display (backward compat with legacy name values)
  const resolvedOwner = useMemo(() => {
    if (!form.owner) return null;
    return teamMembers.find((m) => m.id === form.owner) || teamMembers.find((m) => m.name === form.owner) || null;
  }, [form.owner, teamMembers]);
  const ownerDisplayName = resolvedOwner?.name || form.owner;

  const resolvedAssigned = useMemo(() => {
    if (!form.assignedTo) return null;
    return teamMembers.find((m) => m.id === form.assignedTo) || teamMembers.find((m) => m.name === form.assignedTo) || null;
  }, [form.assignedTo, teamMembers]);
  const assignedDisplayName = resolvedAssigned?.name || form.assignedTo;

  const filteredEntities = useMemo(() => {
    if (!entitySearch) return entityOptions.slice(0, 8);
    const q = entitySearch.toLowerCase();
    return entityOptions.filter((e) => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)).slice(0, 8);
  }, [entitySearch, entityOptions]);

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSave = async () => {
    if (!form.subject.trim()) {
      toast.error("Informe o assunto da tarefa.");
      return;
    }
    setSaving(true);
    try {
      const dbData: Partial<DbActivity> = {
        id: generateCrmId("AT"),
        type: "tarefa",
        subject: form.subject.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        due_date: form.dueDate ? `${form.dueDate}T23:59:59` : "",
        owner: form.owner || "Sistema",
        assigned_to: form.assignedTo,
        tags: form.tags,
        related_to_type: form.relatedToType,
        related_to_id: form.relatedToId,
        related_to_name: form.relatedToName,
        entity_type: form.relatedToType,
        entity_id: form.relatedToId,
      };

      const created = await createActivity(dbData);

      const task: Task = {
        id: created.id,
        subject: created.subject || form.subject,
        description: created.description || form.description,
        status: (created.status || "nao_iniciada") as TaskStatus,
        priority: (created.priority || "normal") as Priority,
        dueDate: created.due_date || form.dueDate,
        completedAt: created.completed_at || "",
        assignedTo: created.assigned_to || form.assignedTo,
        relatedToType: created.related_to_type || form.relatedToType,
        relatedToId: created.related_to_id || form.relatedToId,
        relatedToName: created.related_to_name || form.relatedToName,
        contactName: created.contact_name || "",
        owner: created.owner || form.owner,
        tags: Array.isArray(created.tags) ? created.tags : form.tags,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      };

      onCreated(task);
      toast.success("Tarefa criada com sucesso!");
      onClose();

      // ── Sync to Google Tasks (fire-and-forget) ──
      // resolvedAssigned comes from teamMembers (ajustes/usuarios) by UUID
      if (resolvedAssigned?.email?.endsWith("@htz.agency")) {
        createGoogleTask({
          title: form.subject.trim(),
          notes: form.description.trim() || undefined,
          dueDate: form.dueDate || undefined,
          userEmail: resolvedAssigned.email,
        })
          .then((res) => {
            console.log("Google Task criada:", res.taskId);
            toast.success(`Tarefa sincronizada com Google Tasks de ${resolvedAssigned.name}`);
          })
          .catch((err) => {
            console.error("Erro ao criar Google Task:", err);
            toast.error(`Falha ao sincronizar Google Tasks: ${err?.message || err}`);
          });
      } else if (form.assignedTo) {
        console.warn("[Google Tasks] Skipped — membro não encontrado ou email não @htz.agency. assignedTo:", form.assignedTo, "resolved:", resolvedAssigned?.email);
      }
    } catch (err: any) {
      console.error("Erro ao criar tarefa:", err);
      toast.error(`Erro ao criar tarefa: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls = modalInputCls;
  const inputStyle = modalInputStyle;
  const labelStyle = modalLabelStyle;

  const curStatus = TASK_STATUS_OPTIONS.find((s) => s.key === form.status) || TASK_STATUS_OPTIONS[0];
  const curPriority = TASK_PRIORITY_OPTIONS.find((p) => p.key === form.priority) || TASK_PRIORITY_OPTIONS[1];

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
        className="relative w-full max-w-[520px] max-h-[90vh] bg-white rounded-[20px] overflow-hidden flex flex-col"
        style={{ boxShadow: "0px 8px 32px rgba(18,34,50,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#f0f2f5]">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-[36px] rounded-[10px] bg-[#E8E8FD]">
              <CheckCircle size={18} weight="duotone" className="text-[#8C8CD4]" />
            </div>
            <span className="text-[#28415c]" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, ...fontFeature }}>
              Nova Tarefa
            </span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] transition-colors cursor-pointer">
            <X size={16} weight="bold" className="text-[#98989d]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[24px] py-[20px] flex flex-col gap-[16px]">
          {/* Assunto */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Assunto *</label>
            <input
              type="text"
              placeholder="Ex: Enviar proposta comercial"
              value={form.subject}
              onChange={(e) => patch({ subject: e.target.value })}
              className={inputCls}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Status + Prioridade */}
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => patch({ status: e.target.value as TaskStatus })}
                className="h-[28px] px-[10px] pr-[24px] rounded-[500px] border-none outline-none cursor-pointer uppercase appearance-none w-fit"
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  color: curStatus.color,
                  backgroundColor: curStatus.bg,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256'%3E%3Cpath d='M128,188a12,12,0,0,1-8.49-3.51l-80-80a12,12,0,0,1,17-17L128,159,199.51,87.51a12,12,0,0,1,17,17l-80,80A12,12,0,0,1,128,188Z' fill='${encodeURIComponent(curStatus.color)}'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  ...fontFeature,
                }}
              >
                {TASK_STATUS_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) => patch({ priority: e.target.value as Priority })}
                className="h-[28px] px-[10px] pr-[24px] rounded-[500px] border-none outline-none cursor-pointer uppercase appearance-none w-fit"
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  color: curPriority.color,
                  backgroundColor: curPriority.bg,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256'%3E%3Cpath d='M128,188a12,12,0,0,1-8.49-3.51l-80-80a12,12,0,0,1,17-17L128,159,199.51,87.51a12,12,0,0,1,17,17l-80,80A12,12,0,0,1,128,188Z' fill='${encodeURIComponent(curPriority.color)}'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  ...fontFeature,
                }}
              >
                {TASK_PRIORITY_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data de Vencimento */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Data de Vencimento</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => patch({ dueDate: e.target.value })}
              className={`${inputCls} w-fit`}
              style={inputStyle}
            />
          </div>

          {/* Proprietário + Atribuído a — DS User Picker */}
          <div className="grid grid-cols-2 gap-[12px]">
            {/* Owner */}
            <div className="flex flex-col gap-[6px]" ref={ownerRef}>
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Proprietário</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setOwnerDropdown((v) => !v); setOwnerSearch(""); }}
                  className="flex items-center gap-[8px] w-full h-[38px] px-[10px] rounded-[8px] border border-transparent bg-[#F6F7F9] hover:bg-[#eef0f3] transition-colors cursor-pointer text-left"
                >
                  {form.owner ? (
                    <>
                      <span
                        className="size-[20px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
                        style={{ fontSize: 9, fontWeight: 700, ...fontFeature }}
                      >
                        {ownerDisplayName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-[#0483AB] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                        {ownerDisplayName}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 400, ...fontFeature }}>Selecionar...</span>
                  )}
                  <CaretDown size={10} weight="bold" className="text-[#98989d] ml-auto shrink-0" />
                </button>
                {ownerDropdown && (
                  <div className="absolute left-0 right-0 top-[42px] z-30 bg-white border border-[#dde3ec] rounded-[12px] overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    <div className="p-[6px]">
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        autoFocus
                        className="w-full h-[30px] px-[8px] rounded-[6px] bg-[#F6F7F9] border-none outline-none text-[#28415c]"
                        style={{ fontSize: 11, fontWeight: 400, ...fontFeature }}
                      />
                    </div>
                    <div className="max-h-[160px] overflow-y-auto">
                      {filteredOwnerMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { patch({ owner: m.id }); setOwnerDropdown(false); setOwnerSearch(""); }}
                          className="flex items-center gap-[8px] w-full px-[10px] py-[6px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
                        >
                          <span
                            className="size-[20px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
                            style={{ fontSize: 9, fontWeight: 700, ...fontFeature }}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                              {m.name}
                            </span>
                            {m.email && (
                              <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 400, ...fontFeature }}>
                                {m.email}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                      {filteredOwnerMembers.length === 0 && (
                        <div className="px-[10px] py-[8px] text-[#98989d]" style={{ fontSize: 11, ...fontFeature }}>Nenhum resultado</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned to */}
            <div className="flex flex-col gap-[6px]" ref={assignedRef}>
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Atribuído a</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setAssignedDropdown((v) => !v); setAssignedSearch(""); }}
                  className="flex items-center gap-[8px] w-full h-[38px] px-[10px] rounded-[8px] border border-transparent bg-[#F6F7F9] hover:bg-[#eef0f3] transition-colors cursor-pointer text-left"
                >
                  {form.assignedTo ? (
                    <>
                      <span
                        className="size-[20px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
                        style={{ fontSize: 9, fontWeight: 700, ...fontFeature }}
                      >
                        {assignedDisplayName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-[#0483AB] truncate" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                        {assignedDisplayName}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 400, ...fontFeature }}>Selecionar...</span>
                  )}
                  <CaretDown size={10} weight="bold" className="text-[#98989d] ml-auto shrink-0" />
                </button>
                {assignedDropdown && (
                  <div className="absolute left-0 right-0 top-[42px] z-30 bg-white border border-[#dde3ec] rounded-[12px] overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    <div className="p-[6px]">
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={assignedSearch}
                        onChange={(e) => setAssignedSearch(e.target.value)}
                        autoFocus
                        className="w-full h-[30px] px-[8px] rounded-[6px] bg-[#F6F7F9] border-none outline-none text-[#28415c]"
                        style={{ fontSize: 11, fontWeight: 400, ...fontFeature }}
                      />
                    </div>
                    <div className="max-h-[160px] overflow-y-auto">
                      {filteredAssignedMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { patch({ assignedTo: m.id }); setAssignedDropdown(false); setAssignedSearch(""); }}
                          className="flex items-center gap-[8px] w-full px-[10px] py-[6px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
                        >
                          <span
                            className="size-[20px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]"
                            style={{ fontSize: 9, fontWeight: 700, ...fontFeature }}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                              {m.name}
                            </span>
                            {m.email && (
                              <span className="text-[#98989d] truncate" style={{ fontSize: 10, fontWeight: 400, ...fontFeature }}>
                                {m.email}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                      {filteredAssignedMembers.length === 0 && (
                        <div className="px-[10px] py-[8px] text-[#98989d]" style={{ fontSize: 11, ...fontFeature }}>Nenhum resultado</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Tags</label>
            <div className="flex flex-wrap gap-[6px]">
              {TAG_OPTIONS.map((tag) => {
                const active = form.tags.includes(tag.value);
                return (
                  <button
                    key={tag.value}
                    onClick={() => toggleTag(tag.value)}
                    className="h-[26px] px-[10px] rounded-[500px] transition-colors cursor-pointer uppercase"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      color: active ? tag.color : "#98989d",
                      backgroundColor: active ? `${tag.color}18` : "#F6F7F9",
                      border: active ? `1.5px solid ${tag.color}40` : "1.5px solid transparent",
                      ...fontFeature,
                    }}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vinculado a */}
          <div className="flex flex-col gap-[6px]" ref={entityRef}>
            <div className="flex items-center gap-[6px]">
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Vinculado a</label>
              <LinkSimpleHorizontal size={12} weight="duotone" className="text-[#98989d]" />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar lead, conta, oportunidade ou contato..."
                value={form.relatedToName || entitySearch}
                onChange={(e) => {
                  setEntitySearch(e.target.value);
                  if (form.relatedToId) patch({ relatedToType: "", relatedToId: "", relatedToName: "" });
                  setShowEntityDropdown(true);
                }}
                onFocus={() => setShowEntityDropdown(true)}
                className={inputCls}
                style={inputStyle}
              />
              {form.relatedToId && (
                <button
                  onClick={() => { patch({ relatedToType: "", relatedToId: "", relatedToName: "" }); setEntitySearch(""); }}
                  className="absolute right-[8px] top-1/2 -translate-y-1/2 flex items-center justify-center size-[20px] rounded-full hover:bg-[#f6f7f9] cursor-pointer"
                >
                  <X size={10} weight="bold" className="text-[#98989d]" />
                </button>
              )}
            </div>
            {showEntityDropdown && filteredEntities.length > 0 && !form.relatedToId && (
              <div className="relative z-20 mt-[-4px] bg-white border border-[#dde3ec] rounded-[12px] overflow-hidden max-h-[200px] overflow-y-auto" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                {filteredEntities.map((e) => {
                  const badge = ENTITY_BADGE[e.type] || { label: e.type.toUpperCase(), bg: "#F6F7F9", color: "#4E6987" };
                  return (
                    <button
                      key={`${e.type}-${e.id}`}
                      onClick={() => {
                        patch({ relatedToType: e.type, relatedToId: e.id, relatedToName: e.name });
                        setEntitySearch("");
                        setShowEntityDropdown(false);
                      }}
                      className="flex items-center gap-[8px] w-full px-[12px] py-[8px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
                    >
                      <span
                        className="inline-flex items-center h-[18px] px-[6px] rounded-[4px] shrink-0"
                        style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
                        {e.name}
                      </span>
                      <span className="text-[#C8CFDB] ml-auto shrink-0" style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}>
                        {e.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Descrição</label>
            <textarea
              placeholder="Detalhes da tarefa..."
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="w-full bg-[#F6F7F9] rounded-[8px] px-[10px] py-[6px] outline-none border border-transparent focus:border-[#07ABDE] transition-colors resize-none text-[#4E6987]"
              style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[14px] border-t border-[#f0f2f5]">
          <button
            onClick={onClose}
            className="flex items-center h-[34px] px-[18px] rounded-[500px] bg-[#f6f7f9] text-[#4e6987] hover:bg-[#ebedf0] transition-colors cursor-pointer uppercase"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-[6px] h-[34px] px-[18px] rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#32b592] transition-colors cursor-pointer disabled:opacity-50 uppercase"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
          >
            {saving && <Spinner size={14} className="animate-spin" />}
            SALVAR
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmTasks() {
  const navigate = useNavigate();
  const { query: globalSearch } = useCrmSearch();
  const { openModal: openCreateActivityModal, refreshKey } = useCreateActivity();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* -- Filter state -- */
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<TaskFilterCondition[]>([]);
  const [draftFilters, setDraftFilters] = useState<TaskFilterCondition[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  /* -- Detail panel state -- */
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleStatusChange = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === "concluida" ? new Date().toISOString().slice(0, 10) : t.completedAt }
          : t
      )
    );
    patchActivity(taskId, { status: newStatus, ...(newStatus === "concluida" ? { completed_at: new Date().toISOString() } : {}) }).catch(console.error);
    toast.success(`Tarefa ${newStatus === "concluida" ? "concluida" : "cancelada"}!`);
  }, []);

  /* -- Load from Supabase (real data only) -- */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) { setTasks([]); setLoading(false); } }, 8000);

    (async () => {
      try {
        const dbRows = await listActivities();
        if (cancelled) return;
        const converted = (dbRows || []).map(dbActivityToTask).filter(Boolean) as Task[];
        setTasks(converted);
      } catch (err) {
        console.error("[CRM Tasks] Error loading activities:", err);
        if (!cancelled) setTasks([]);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  /* -- Filtered tasks -- */
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Apply multi-filter panel filters
    result = applyTaskFilters(result, activeFilters);

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter((t) =>
        t.subject.toLowerCase().includes(q) ||
        t.relatedToName.toLowerCase().includes(q) ||
        t.contactName.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, statusFilter, activeFilters, globalSearch]);

  /* -- Table state -- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMetrics, setShowMetrics] = useState(true);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ROWS_PER_PAGE));
  const paginated = filteredTasks.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length };
    for (const s of STATUS_KEYS) {
      counts[s] = tasks.filter((t) => t.status === s).length;
    }
    return counts;
  }, [tasks]);

  /* -- Column resize handlers -- */
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const delta = e.clientX - r.startX;
      const newW = Math.max(MIN_COL_WIDTH, r.startW + delta);
      setColWidths((prev) => {
        const next = [...prev];
        next[r.colIdx] = newW;
        return next;
      });
    };
    const onMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startResize = (colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { colIdx, startX: e.clientX, startW: colWidths[colIdx] };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((t) => t.id)));
    }
  };

  /* -- Filter panel handlers -- */
  const updateDraftFilter = (fc: TaskFilterCondition) => {
    setDraftFilters((prev) => {
      const existing = prev.findIndex((c) => c.field === fc.field);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = fc;
        return next;
      }
      return [...prev, fc];
    });
  };

  const handleApplyFilters = () => {
    const meaningful = draftFilters.filter((fc) => fc.values.length > 0);
    setActiveFilters(meaningful);
    setIsFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    setDraftFilters([]);
    setIsFilterPanelOpen(false);
  };

  // Close menus on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
      if (titleMenuRef.current && !titleMenuRef.current.contains(e.target as Node)) {
        setTitleMenuOpen(false);
      }
    };
    if (activeMenu || titleMenuOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [activeMenu, titleMenuOpen]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, activeFilters, globalSearch]);

  /* -- Loading state -- */
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#8C8CD4] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando tarefas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-[12px] min-h-0 overflow-hidden">
      {/* ═══════ LEFT: MAIN LIST AREA ═══════ */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden min-w-0 transition-all ${selectedTask ? "xl:flex hidden" : "flex"} xl:flex`}>
      {/* HEADER + TABS WRAPPER */}
      <div className="bg-[#ffffff] rounded-[16px] p-[16px] pb-[12px] mb-[12px] shrink-0">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
          {/* Left: title */}
          <div className="relative" ref={titleMenuRef}>
            <div
              onClick={() => setTitleMenuOpen((v) => !v)}
              className={`flex items-center gap-[10px] p-[12px] rounded-[100px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/title ${titleMenuOpen ? "bg-[#f6f7f9]" : ""}`}
            >
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#E8E8FD] group-hover/title:bg-[#ddd8fd] transition-colors">
                <CheckCircle size={22} weight="duotone" className="text-[#8C8CD4] group-hover/title:text-[#6b6bc0] transition-colors" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span
                  className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]"
                  style={fontFeature}
                >ATIVIDADES</span>
                <div className="flex items-center">
                  <span
                    className="text-[#28415c] text-[19px] font-bold tracking-[-0.5px] leading-[24px]"
                    style={fontFeature}
                  >Tarefas</span>
                  <div className={`flex items-center justify-center size-[24px] rounded-full transition-transform ${titleMenuOpen ? "rotate-180" : ""}`}>
                    <CaretDown size={14} weight="bold" className="text-[#28415c]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title dropdown menu */}
            {titleMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+5px)] z-50 backdrop-blur-[50px] bg-white flex flex-col gap-[6px] items-start p-[12px] rounded-[34px]">
                <div
                  aria-hidden="true"
                  className="absolute border border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[34px]"
                  style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                />
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Configuracoes de tarefas (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><GearSix size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Configuracoes</span>
                </button>
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Fixado nos atalhos!"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><PushPin size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Fixar nos Atalhos</span>
                </button>
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Notificacoes (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Bell size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Notificacoes</span>
                </button>
                <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Detalhes (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Info size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Tarefas</span>
                </button>
              </div>
            )}
          </div>


        </div>

        {/* TABS ROW */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Status filter pills */}
          <div className="relative flex items-center gap-[2px] p-[4px] bg-[#f6f7f9] rounded-[100px]">
            <StatusFilterPill status="all" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
            {STATUS_KEYS.map((s) => (
              <StatusFilterPill key={s} status={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                boxShadow:
                  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          <VerticalDivider />

          {/* Filter button */}
          <button
            onClick={() => {
              setIsFilterPanelOpen((v) => !v);
              if (!isFilterPanelOpen) {
                setDraftFilters(activeFilters.length > 0 ? [...activeFilters] : []);
              }
            }}
            className={`relative flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors cursor-pointer ${
              isFilterPanelOpen || activeFilters.length > 0
                ? "bg-[#07ABDE] text-[#DCF0FF]"
                : "bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB]"
            }`}
          >
            {isFilterPanelOpen ? <X size={14} weight="bold" /> : <FunnelSimple size={16} weight={activeFilters.length > 0 ? "fill" : "bold"} />}
          </button>

          {/* Active filter count badge */}
          {activeFilters.length > 0 && !isFilterPanelOpen && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-[4px] h-[28px] px-[10px] rounded-[500px] bg-[#dcf0ff] text-[#28415c] hover:bg-[#cce7fb] transition-colors cursor-pointer"
            >
              <span
                className="font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 9, ...fontFeature }}
              >
                {activeFilters.length} filtro{activeFilters.length > 1 ? "s" : ""}
              </span>
              <X size={10} weight="bold" />
            </button>
          )}

          <VerticalDivider />

          {/* Metrics toggle */}
          <button
            onClick={() => setShowMetrics((v) => !v)}
            className={`relative flex items-center gap-[5px] h-[34px] px-[14px] rounded-[500px] transition-all cursor-pointer ${
              showMetrics
                ? "bg-[#07ABDE] text-[#DCF0FF]"
                : "bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB]"
            }`}
          >
            <span
              className="font-bold uppercase tracking-[0.5px]"
              style={{ fontSize: 10, ...fontFeature }}
            >
              Metricas
            </span>
          </button>

        </div>

        {/* ═══════ FILTER PANEL ═══════ */}
        {isFilterPanelOpen && (
          <div ref={filterPanelRef} className="mt-[8px] pt-[10px] border-t border-[#f0f2f5]">
            {/* Filter dropdown pills row */}
            <div className="flex items-center gap-[6px] flex-wrap">
              {TASK_FILTER_FIELDS.map((fd) => (
                <TaskFilterDropdownPill
                  key={fd.key}
                  fieldDef={fd}
                  condition={draftFilters.find((c) => c.field === fd.key)}
                  onChange={updateDraftFilter}
                  tasks={tasks}
                />
              ))}
            </div>

            {/* Active filter pills preview */}
            {draftFilters.filter((fc) => fc.values.length > 0).length > 0 && (
              <>
                <div className="mt-[14px] mb-[10px] border-t border-[#ebedf0]" />
                <span
                  className="text-[#98989d] font-bold uppercase tracking-[0.5px] mb-[8px] block"
                  style={{ fontSize: 10, letterSpacing: 0.5, ...fontFeature }}
                >
                  RESUMO DO FILTRO
                </span>
                <div className="flex items-center gap-[4px] flex-wrap">
                  {draftFilters
                    .filter((fc) => fc.values.length > 0)
                    .map((fc) => (
                      <div
                        key={fc.field}
                        className="flex items-center gap-[6px] h-[26px] pl-[10px] pr-[6px] rounded-[500px] bg-[#dde3ec] text-[#28415c]"
                      >
                        <span
                          className="whitespace-nowrap"
                          style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
                        >
                          {taskFilterConditionLabel(fc)}
                        </span>
                        <button
                          onClick={() =>
                            setDraftFilters((prev) => prev.filter((c) => c.field !== fc.field))
                          }
                          className="flex items-center justify-center size-[16px] rounded-full hover:bg-[#07ABDE] hover:text-[#DCF0FF] transition-colors cursor-pointer"
                        >
                          <X size={8} weight="bold" />
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* APLICAR button row */}
            <div className="flex items-center gap-[6px] mt-[14px]">
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer"
              >
                <span
                  className="font-bold uppercase tracking-[0.5px]"
                  style={{ fontSize: 10, ...fontFeature }}
                >
                  APLICAR
                </span>
              </button>
              {(activeFilters.length > 0 || draftFilters.some((fc) => fc.values.length > 0)) && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] bg-[#f6f7f9] text-[#F56233] hover:bg-[#ffedeb] hover:text-[#F56233] transition-colors cursor-pointer"
                >
                  <Trash size={13} weight="bold" />
                  <span
                    className="font-bold uppercase tracking-[0.5px]"
                    style={{ fontSize: 10, ...fontFeature }}
                  >
                    LIMPAR
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Metrics strip */}
        {showMetrics && (() => {
          const total = tasks.length;
          const open = tasks.filter((t) => t.status !== "concluida").length;
          const overdue = tasks.filter(isOverdue).length;
          const completed = tasks.filter((t) => t.status === "concluida").length;
          const waiting = tasks.filter((t) => t.status === "aguardando").length;
          const highPriority = tasks.filter((t) => t.priority === "alta" && t.status !== "concluida").length;

          const metrics = [
            { label: "TOTAL", value: String(total), sub: "tarefas", icon: CheckCircle, color: "#8C8CD4", bg: "#E8E8FD" },
            { label: "EM ABERTO", value: String(open), sub: `${highPriority} prioridade alta`, icon: Clock, color: "#07ABDE", bg: "#DCF0FF" },
            { label: "ATRASADAS", value: String(overdue), sub: "vencidas", icon: Warning, color: "#ED5200", bg: "#FFEDEB" },
            { label: "CONCLUIDAS", value: String(completed), sub: `${Math.round((completed / Math.max(1, total)) * 100)}% do total`, icon: CheckCircle, color: "#3CCEA7", bg: "#D9F8EF" },
            { label: "AGUARDANDO", value: String(waiting), sub: "dependencias", icon: Hourglass, color: "#917822", bg: "#FEEDCA" },
          ];

          return (
            <div className="mt-[4px] pt-[8px] border-t border-[#f0f2f5] overflow-x-auto">
              <div className="flex gap-[2px] min-w-max">
                {metrics.map((m) => {
                  const MIcon = m.icon;
                  return (
                    <div
                      key={m.label}
                      className="flex-1 min-w-[120px] flex items-center gap-[10px] px-[12px] py-[8px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors"
                    >
                      <div
                        className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] shrink-0"
                        style={{ backgroundColor: m.bg }}
                      >
                        <MIcon size={22} weight="duotone" style={{ color: m.color }} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="text-[#98989d] uppercase whitespace-nowrap"
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
                        >
                          {m.label}
                        </span>
                        <span
                          className="text-[#28415c] whitespace-nowrap"
                          style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}
                        >
                          {m.value}
                        </span>
                        <span
                          className="text-[#98989d] whitespace-nowrap"
                          style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.2, lineHeight: "14px", ...fontFeature }}
                        >
                          {m.sub}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col bg-white rounded-t-xl overflow-hidden">
        <div className="overflow-x-auto flex-1 flex flex-col min-w-0">
          <div className="w-fit min-w-full">
            {/* Column Headers */}
            <div
              className="grid items-center px-5 pt-2 pb-0"
              style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
            >
              <div />
              <div className="flex items-center justify-center">
                <CircleCheckbox
                  checked={paginated.length > 0 && selectedIds.size === paginated.length}
                  onChange={toggleSelectAll}
                />
              </div>
              {COL_HEADERS.map((col, idx) => (
                <div key={col} className="flex items-center h-[32px] relative cursor-pointer group/hdr">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c] whitespace-nowrap leading-[20px]"
                    style={fontFeature}
                  >
                    {col}
                  </span>
                  {idx < COL_HEADERS.length && (
                    <div
                      className="absolute right-[-5px] top-0 bottom-0 w-[10px] z-10 flex items-center justify-center cursor-col-resize group/resize"
                      onMouseDown={(e) => startResize(idx, e)}
                    >
                      <div className="w-[1.5px] h-[20px] rounded-full bg-[#DDE3EC] transition-colors group-hover/resize:bg-[#0483AB] group-hover/resize:h-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Table rows */}
            <div className="flex flex-col mt-1">
              {paginated.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle size={32} weight="duotone" className="text-[#C8CFDB]" />
                    <p className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                      Nenhuma tarefa encontrada
                    </p>
                  </div>
                </div>
              ) : (
                paginated.map((task, idx) => {
                  const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                  const isSelected = selectedIds.has(task.id);
                  const statusConf = statusConfig[task.status] || statusConfig.nao_iniciada;
                  const priorityConf = priorityConfig[task.priority] || priorityConfig.normal;
                  const PriorityIcon = priorityConf.icon;
                  const overdue = isOverdue(task);

                  return (
                    <div key={task.id}>
                      <HorizontalDivider />
                      <div
                        onClick={() => setSelectedTaskId(task.id)}
                        onDoubleClick={() => navigate(`/crm/atividades/tarefas/${task.id}`)}
                        className={`grid items-center h-[38px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                          selectedTaskId === task.id
                            ? "bg-[#E8E8FD]"
                            : isSelected
                            ? "bg-[#f6f7f9]"
                            : "hover:bg-[#f6f7f9]"
                        }`}
                        style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
                      >
                        {/* Row number */}
                        <div
                          className="text-right text-[#28415c]"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                        >
                          {rowNum}
                        </div>

                        {/* Checkbox */}
                        <div className="flex items-center justify-center">
                          <CircleCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelect(task.id)}
                          />
                        </div>

                        {/* Subject */}
                        <div
                          className="truncate text-[#122232]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {task.subject}
                        </div>

                        {/* Status pill */}
                        <div className="flex items-center">
                          <div
                            className="flex items-center gap-[4px] h-[22px] px-[8px] rounded-[500px]"
                            style={{ backgroundColor: statusConf.bg }}
                          >
                            <span
                              className="whitespace-nowrap"
                              style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, color: statusConf.color, ...fontFeature }}
                            >
                              {statusConf.label}
                            </span>
                          </div>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-[4px]">
                          <PriorityIcon size={13} weight="bold" style={{ color: priorityConf.color }} />
                          <span
                            className="whitespace-nowrap"
                            style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, color: priorityConf.color, ...fontFeature }}
                          >
                            {priorityConf.label}
                          </span>
                        </div>

                        {/* Due date */}
                        <div
                          className={`truncate ${overdue ? "text-[#ED5200]" : "text-[#28415c]"}`}
                          style={{ fontSize: 12, fontWeight: overdue ? 600 : 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {overdue && <Warning size={11} weight="fill" className="inline-block mr-[3px] -mt-[1px]" />}
                          {formatRelativeDate(task.dueDate)}
                        </div>

                        {/* Related to */}
                        <div className="flex items-center gap-[4px] truncate">
                          {task.relatedToName ? (
                            <>
                              <span
                                className="text-[#98989d] shrink-0"
                                style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                              >
                                {relatedTypeLabels[task.relatedToType] || ""}
                              </span>
                              <span
                                className="truncate text-[#07abde]"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                              >
                                {task.relatedToName}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
                          )}
                        </div>

                        {/* Owner */}
                        <OwnerCell ownerId={task.owner} />

                        {/* Created at */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatRelativeDate(task.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <HorizontalDivider />
            </div>
          </div>
        </div>
      </div>

      {/* PAGINATION */}
      {filteredTasks.length > ROWS_PER_PAGE && (
        <div className="flex items-center gap-2 py-4 bg-white rounded-b-xl px-5 border-t-0">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
          >
            <CaretRight size={14} weight="bold" />
          </button>
          <div className="flex items-center gap-0.5 ml-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors ${
                  page === currentPage
                    ? "bg-[#28415C] text-white"
                    : "text-[#28415C] hover:bg-[#F6F7F9]"
                }`}
                style={{ fontSize: 12, fontWeight: page === currentPage ? 700 : 500, ...fontFeature }}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLOATING SELECTION BAR */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-[12px] h-[48px] px-[20px] rounded-[500px] bg-[#28415c] text-white"
          style={{ boxShadow: "0px 4px 16px 0px rgba(18,34,50,0.35)" }}
        >
          <span
            className="font-bold uppercase tracking-[0.5px]"
            style={{ fontSize: 11, ...fontFeature }}
          >
            {selectedIds.size} {selectedIds.size === 1 ? "selecionada" : "selecionadas"}
          </span>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => {
              toast.success(`${selectedIds.size} tarefa(s) concluida(s)`);
              setTasks((prev) =>
                prev.map((t) =>
                  selectedIds.has(t.id)
                    ? { ...t, status: "concluida" as TaskStatus, completedAt: new Date().toISOString().slice(0, 10) }
                    : t
                )
              );
              selectedIds.forEach((id) => {
                patchActivity(id, { status: "concluida", completed_at: new Date().toISOString() }).catch(console.error);
              });
              setSelectedIds(new Set());
            }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-[#3CCEA7] transition-colors cursor-pointer"
          >
            <CheckCircle size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>CONCLUIR</span>
          </button>
          <button
            onClick={() => {
              toast(`Excluir ${selectedIds.size} tarefa(s) (em breve)`);
            }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-[#ED5200] transition-colors cursor-pointer"
          >
            <Trash size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>EXCLUIR</span>
          </button>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="flex items-center justify-center size-[28px] rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}
      </div>

      {/* ═══════ RIGHT: DETAIL SIDE PANEL ═══════ */}
      <AnimatePresence mode="wait">
        {selectedTask && (
          <motion.div
            key={selectedTask.id}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[320px] h-full">
              <TaskDetailPanel
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onStatusChange={handleStatusChange}
                onTaskUpdate={(taskId, patch) => setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...patch } : t))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal is now handled globally via CreateActivityModal in CrmLayout */}
    </div>
  );
}