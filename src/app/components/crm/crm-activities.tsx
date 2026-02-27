/**
 * CRM Activities — Table-based listing page for all 6 activity types:
 * Compromisso, Tarefa, Ligacao, Nota, Mensagem, Email.
 *
 * Follows the visual patterns of crm-opportunities.tsx (table view).
 */

import { useState, useEffect, useRef, useMemo } from "react";
import {
  CalendarBlank,
  CheckCircle,
  Phone,
  NoteBlank,
  ChatCircle,
  Envelope,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  Trash,
  Plus,
  GearSix,
  PushPin,
  Bell,
  Info,
  Lightning,
  X,
  FunnelSimple,
  ArrowUp,
  ArrowDown,
  Clock,
  Warning,
  UserCircle,
  SealCheck,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  listActivities,
  patchActivity,
  type DbActivity,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";
import { useCreateActivity } from "./create-activity-context";
import { OwnerCell } from "./owner-cell";
import { PillButton } from "../pill-button";
import {
  fontFeature,
  type ActivityType,
  type Priority,
  ACTIVITY_TYPE_CONFIG,
  ACTIVITY_TYPE_KEYS,
  STATUS_BY_TYPE,
  PRIORITY_CONFIG,
  RELATED_TYPE_LABELS,
  type StatusOption,
  resolveStatus,
} from "./activity-config";

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

/** Merged status map: all unique statuses across all activity types for generic display */
const allStatusMap: Record<string, { label: string; color: string; bg: string }> = (() => {
  const map: Record<string, { label: string; color: string; bg: string }> = {};
  for (const type of ACTIVITY_TYPE_KEYS) {
    for (const s of STATUS_BY_TYPE[type]) {
      if (!map[s.key]) map[s.key] = { label: s.label, color: s.color, bg: s.bg };
    }
  }
  return map;
})();

interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description: string;
  status: string;
  priority: Priority;
  dueDate: string;
  startDate: string;
  endDate: string;
  completedAt: string;
  assignedTo: string;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  contactName: string;
  location: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Activity Type Config — enriched with icons (from SSOT)              */
/* ------------------------------------------------------------------ */

const activityTypeIconMap: Record<ActivityType, React.ComponentType<any>> = {
  compromisso: CalendarBlank,
  tarefa: CheckCircle,
  ligacao: Phone,
  nota: NoteBlank,
  mensagem: ChatCircle,
  email: Envelope,
};

const activityTypeConfig: Record<ActivityType, {
  icon: React.ComponentType<any>;
  bg: string;
  color: string;
  label: string;
}> = Object.fromEntries(
  ACTIVITY_TYPE_KEYS.map((key) => {
    const c = ACTIVITY_TYPE_CONFIG[key];
    return [key, { icon: activityTypeIconMap[key], bg: c.bg, color: c.color, label: c.label }];
  })
) as any;

const ACTIVITY_TYPES = ACTIVITY_TYPE_KEYS;

/* ------------------------------------------------------------------ */
/*  Status & Priority Config — from single source of truth              */
/* ------------------------------------------------------------------ */

/** Generic status lookup: checks all types, returns display config */
const statusConfig = allStatusMap;

const priorityConfig: Record<Priority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  baixa:  { ...PRIORITY_CONFIG.baixa,  icon: ArrowDown },
  normal: { ...PRIORITY_CONFIG.normal, icon: Clock },
  alta:   { ...PRIORITY_CONFIG.alta,   icon: ArrowUp },
};

const relatedTypeLabels = RELATED_TYPE_LABELS;

/* ------------------------------------------------------------------ */
/*  Filter Panel Types & Config                                        */
/* ------------------------------------------------------------------ */

type ActFilterField = "status" | "priority" | "relatedToType" | "owner";

interface ActFilterCondition {
  field: ActFilterField;
  values: string[];
}

const ACT_FILTER_FIELDS: { key: ActFilterField; label: string; icon: React.ComponentType<any> }[] = [
  { key: "status", label: "STATUS", icon: SealCheck },
  { key: "priority", label: "PRIORIDADE", icon: ArrowUp },
  { key: "relatedToType", label: "RELACIONADO A", icon: Lightning },
  { key: "owner", label: "PROPRIETÁRIO", icon: UserCircle },
];

function getActFilterOptions(field: ActFilterField, activities: Activity[]): { value: string; label: string }[] {
  switch (field) {
    case "status":
      return Object.keys(statusConfig).map((k) => ({ value: k, label: statusConfig[k].label }));
    case "priority":
      return (Object.keys(priorityConfig) as Priority[]).map((k) => ({ value: k, label: priorityConfig[k].label }));
    case "relatedToType":
      return Object.entries(relatedTypeLabels).map(([k, v]) => ({ value: k, label: v }));
    case "owner": {
      const unique = Array.from(new Set(activities.map((a) => a.owner).filter(Boolean)));
      return unique.sort().map((o) => ({ value: o, label: o }));
    }
    default:
      return [];
  }
}

function applyActFilters(acts: Activity[], filters: ActFilterCondition[]): Activity[] {
  if (filters.length === 0) return acts;
  return acts.filter((a) => {
    for (const fc of filters) {
      if (fc.values.length === 0) continue;
      switch (fc.field) {
        case "status":
          if (!fc.values.includes(a.status)) return false;
          break;
        case "priority":
          if (!fc.values.includes(a.priority)) return false;
          break;
        case "relatedToType":
          if (!fc.values.includes(a.relatedToType)) return false;
          break;
        case "owner":
          if (!fc.values.includes(a.owner)) return false;
          break;
      }
    }
    return true;
  });
}

function actFilterConditionLabel(fc: ActFilterCondition): string {
  const fieldDef = ACT_FILTER_FIELDS.find((f) => f.key === fc.field);
  const prefix = fieldDef?.label ?? fc.field;
  if (fc.values.length === 0) return prefix;
  if (fc.values.length === 1) {
    if (fc.field === "status") return `${prefix}: ${statusConfig[fc.values[0]]?.label ?? fc.values[0]}`;
    if (fc.field === "priority") return `${prefix}: ${priorityConfig[fc.values[0] as Priority]?.label ?? fc.values[0]}`;
    if (fc.field === "relatedToType") return `${prefix}: ${relatedTypeLabels[fc.values[0]] ?? fc.values[0]}`;
    return `${prefix}: ${fc.values[0]}`;
  }
  return `${prefix}: ${fc.values.length} selecionados`;
}

/* ------------------------------------------------------------------ */
/*  ActivityFilterDropdownPill                                         */
/* ------------------------------------------------------------------ */

function ActivityFilterDropdownPill({
  fieldDef,
  condition,
  onChange,
  activities,
}: {
  fieldDef: { key: ActFilterField; label: string; icon: React.ComponentType<any> };
  condition: ActFilterCondition | undefined;
  onChange: (fc: ActFilterCondition) => void;
  activities: Activity[];
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
            {getActFilterOptions(f, activities).map((opt) => {
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
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const mockActivities: Activity[] = [
  { id: "AT-A1B2", type: "tarefa", subject: "Enviar proposta comercial", description: "", status: "nao_iniciada", priority: "alta", dueDate: "2026-02-28", startDate: "", endDate: "", completedAt: "", assignedTo: "Joao Silva", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", contactName: "Ana Carolina", location: "", owner: "Joao Silva", createdAt: "2026-02-20", updatedAt: "2026-02-20" },
  { id: "AT-C3D4", type: "compromisso", subject: "Reuniao de alinhamento", description: "", status: "nao_iniciada", priority: "normal", dueDate: "", startDate: "2026-02-26T10:00", endDate: "2026-02-26T11:00", completedAt: "", assignedTo: "Maria Oliveira", relatedToType: "conta", relatedToId: "AC-0EA1", relatedToName: "Empresa Alpha", contactName: "Bruno Mendes", location: "Google Meet", owner: "Maria Oliveira", createdAt: "2026-02-19", updatedAt: "2026-02-19" },
  { id: "AT-E5F6", type: "tarefa", subject: "Follow-up apos apresentacao", description: "", status: "em_andamento", priority: "normal", dueDate: "2026-02-25", startDate: "", endDate: "", completedAt: "", assignedTo: "Pedro Costa", relatedToType: "lead", relatedToId: "LD-E5F6", relatedToName: "Carlos Eduardo", contactName: "", location: "", owner: "Pedro Costa", createdAt: "2026-02-18", updatedAt: "2026-02-22" },
  { id: "AT-G7H8", type: "ligacao", subject: "Ligar para confirmar interesse", description: "", status: "concluida", priority: "alta", dueDate: "2026-02-24", startDate: "", endDate: "", completedAt: "2026-02-24", assignedTo: "Ana Paula", relatedToType: "lead", relatedToId: "LD-G7H8", relatedToName: "Daniela Souza", contactName: "Daniela Souza", location: "", owner: "Ana Paula", createdAt: "2026-02-17", updatedAt: "2026-02-24" },
  { id: "AT-J9K1", type: "nota", subject: "Anotacoes da reuniao de vendas", description: "Discutimos budget e timeline. Cliente interessado em fechar Q1.", status: "concluida", priority: "baixa", dueDate: "", startDate: "", endDate: "", completedAt: "2026-02-23", assignedTo: "Carlos Pereira", relatedToType: "oportunidade", relatedToId: "OP-C3D4", relatedToName: "Expansao Beta", contactName: "", location: "", owner: "Carlos Pereira", createdAt: "2026-02-16", updatedAt: "2026-02-23" },
  { id: "AT-L2M3", type: "email", subject: "Re: Proposta comercial - Epsilon", description: "", status: "concluida", priority: "normal", dueDate: "", startDate: "", endDate: "", completedAt: "2026-02-22", assignedTo: "Fernanda Santos", relatedToType: "conta", relatedToId: "AC-J9K1", relatedToName: "Epsilon Ltda", contactName: "Fernanda Costa", location: "", owner: "Fernanda Santos", createdAt: "2026-02-15", updatedAt: "2026-02-22" },
  { id: "AT-N4P5", type: "mensagem", subject: "WhatsApp: Confirmacao de horario", description: "", status: "concluida", priority: "baixa", dueDate: "", startDate: "", endDate: "", completedAt: "2026-02-21", assignedTo: "Rafael Alves", relatedToType: "contato", relatedToId: "CT-Q6R7", relatedToName: "Helena Rocha", contactName: "Helena Rocha", location: "", owner: "Rafael Alves", createdAt: "2026-02-14", updatedAt: "2026-02-21" },
  { id: "AT-Q6R7", type: "tarefa", subject: "Preparar apresentacao para demo", description: "", status: "aguardando", priority: "alta", dueDate: "2026-03-01", startDate: "", endDate: "", completedAt: "", assignedTo: "Juliana Ferreira", relatedToType: "oportunidade", relatedToId: "OP-E5F6", relatedToName: "Contrato Gamma", contactName: "", location: "", owner: "Juliana Ferreira", createdAt: "2026-02-13", updatedAt: "2026-02-20" },
  { id: "AT-S8T9", type: "compromisso", subject: "Visita ao escritorio do cliente", description: "", status: "nao_iniciada", priority: "normal", dueDate: "", startDate: "2026-03-03T14:00", endDate: "2026-03-03T16:00", completedAt: "", assignedTo: "Lucas Souza", relatedToType: "conta", relatedToId: "AC-L2M3", relatedToName: "Zeta Inc", contactName: "Gabriel Santos", location: "Av. Paulista, 1000", owner: "Lucas Souza", createdAt: "2026-02-12", updatedAt: "2026-02-12" },
  { id: "AT-U1V2", type: "tarefa", subject: "Atualizar CRM com dados do contato", description: "", status: "concluida", priority: "baixa", dueDate: "2026-02-20", startDate: "", endDate: "", completedAt: "2026-02-20", assignedTo: "Camila Ribeiro", relatedToType: "contato", relatedToId: "CT-W3X4", relatedToName: "Kleber Oliveira", contactName: "Kleber Oliveira", location: "", owner: "Camila Ribeiro", createdAt: "2026-02-11", updatedAt: "2026-02-20" },
  { id: "AT-W3X4", type: "ligacao", subject: "Cold call lista de prospecao", description: "", status: "nao_iniciada", priority: "normal", dueDate: "2026-03-05", startDate: "", endDate: "", completedAt: "", assignedTo: "Joao Pedro", relatedToType: "lead", relatedToId: "LD-Y5Z6", relatedToName: "Larissa Campos", contactName: "Larissa Campos", location: "", owner: "Joao Pedro", createdAt: "2026-02-10", updatedAt: "2026-02-10" },
  { id: "AT-Y5Z6", type: "tarefa", subject: "Revisar contrato antes do envio", description: "", status: "adiada", priority: "alta", dueDate: "2026-02-27", startDate: "", endDate: "", completedAt: "", assignedTo: "Rafaela Costa", relatedToType: "oportunidade", relatedToId: "OP-G7H8", relatedToName: "Renovacao Delta", contactName: "", location: "", owner: "Rafaela Costa", createdAt: "2026-02-09", updatedAt: "2026-02-25" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dbActivityToFrontend(row: DbActivity): Activity {
  return {
    id: row.id,
    type: (row.type || "tarefa") as ActivityType,
    subject: row.subject || row.label || "",
    description: row.description || "",
    status: row.status || "nao_iniciada",
    priority: (row.priority || "normal") as Priority,
    dueDate: row.due_date || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    completedAt: row.completed_at || "",
    assignedTo: row.assigned_to || row.owner || "",
    relatedToType: row.related_to_type || "",
    relatedToId: row.related_to_id || "",
    relatedToName: row.related_to_name || "",
    contactName: row.contact_name || "",
    location: row.location || "",
    owner: row.owner || "",
    createdAt: row.created_at ? row.created_at.slice(0, 10) : "",
    updatedAt: row.updated_at ? row.updated_at.slice(0, 10) : "",
  };
}

function formatRelativeDate(iso: string): string {
  if (!iso) return "\u2014";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays === -1) return "Amanha";
    if (diffDays < 0) return `Em ${Math.abs(diffDays)} dias`;
    if (diffDays < 30) return `Ha ${diffDays} dias`;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

function getActivityDate(a: Activity): string {
  if (a.type === "compromisso") return a.startDate || a.endDate || a.createdAt;
  if (a.dueDate) return a.dueDate;
  return a.createdAt;
}

function isOverdue(a: Activity): boolean {
  if (a.status === "concluida" || a.completedAt) return false;
  const dateStr = a.type === "compromisso" ? a.startDate : a.dueDate;
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/* ------------------------------------------------------------------ */
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [48, 240, 110, 110, 90, 140, 140, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "TIPO",
  "ASSUNTO",
  "STATUS",
  "PRIORIDADE",
  "DATA",
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
/*  Type Filter Pill                                                   */
/* ------------------------------------------------------------------ */

function TypeFilterPill({
  type,
  active,
  count,
  onClick,
}: {
  type: ActivityType | "all";
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  if (type === "all") {
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
        <Lightning size={14} weight={active ? "fill" : "regular"} className="relative z-[1]" />
        <span className="relative z-[1] font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
          Todas
        </span>
      </button>
    );
  }

  const config = activityTypeConfig[type];
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
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmActivities() {
  const { query: globalSearch } = useCrmSearch();
  const { refreshKey } = useCreateActivity();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* -- Filter state -- */
  const [typeFilter, setTypeFilter] = useState<ActivityType | "all">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActFilterCondition[]>([]);
  const [draftFilters, setDraftFilters] = useState<ActFilterCondition[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  /* -- Load from Supabase (real data only) -- */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) { setActivities([]); setLoading(false); } }, 8000);

    (async () => {
      try {
        const dbRows = await listActivities();
        if (cancelled) return;
        setActivities((dbRows || []).map(dbActivityToFrontend));
      } catch (err) {
        console.error("[CRM Activities] Error loading activities:", err);
        if (!cancelled) setActivities([]);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  /* -- Filtered activities -- */
  const filteredActivities = useMemo(() => {
    let result = activities;

    if (typeFilter !== "all") {
      result = result.filter((a) => a.type === typeFilter);
    }

    // Apply multi-filter panel filters
    result = applyActFilters(result, activeFilters);

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter((a) =>
        a.subject.toLowerCase().includes(q) ||
        a.relatedToName.toLowerCase().includes(q) ||
        a.contactName.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activities, typeFilter, activeFilters, globalSearch]);

  /* -- Table state -- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMetrics, setShowMetrics] = useState(true);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / ROWS_PER_PAGE));
  const paginated = filteredActivities.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activities.length };
    for (const t of ACTIVITY_TYPES) {
      counts[t] = activities.filter((a) => a.type === t).length;
    }
    return counts;
  }, [activities]);

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
      setSelectedIds(new Set(paginated.map((a) => a.id)));
    }
  };

  /* -- Filter panel handlers -- */
  const updateDraftFilter = (fc: ActFilterCondition) => {
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
  }, [activeMenu, titleMenuOpen, isFilterPanelOpen]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [typeFilter, activeFilters, globalSearch]);

  /* -- Loading state -- */
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#07abde] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando atividades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
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
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#DDE3EC] group-hover/title:bg-[#dde3ec] transition-colors">
                <Lightning size={22} weight="duotone" className="text-[#4E6987] group-hover/title:text-[#28415c] transition-colors" />
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
                  >Todas Atividades</span>
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
                  onClick={() => { setTitleMenuOpen(false); toast("Configuracoes de atividades (em breve)"); }}
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
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Atividades</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* TABS ROW */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Type filter pills */}
          <div className="relative flex items-center gap-[2px] p-[4px] bg-[#f6f7f9] rounded-[100px]">
            <TypeFilterPill type="all" active={typeFilter === "all"} count={typeCounts.all} onClick={() => setTypeFilter("all")} />
            {ACTIVITY_TYPES.map((t) => (
              <TypeFilterPill key={t} type={t} active={typeFilter === t} count={typeCounts[t] || 0} onClick={() => setTypeFilter(t)} />
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
              Métricas
            </span>
          </button>

        </div>

        {/* ═══════ FILTER PANEL ═══════ */}
        {isFilterPanelOpen && (
          <div ref={filterPanelRef} className="mt-[8px] pt-[10px] border-t border-[#f0f2f5]">
            {/* Filter dropdown pills row */}
            <div className="flex items-center gap-[6px] flex-wrap">
              {ACT_FILTER_FIELDS.map((fd) => (
                <ActivityFilterDropdownPill
                  key={fd.key}
                  fieldDef={fd}
                  condition={draftFilters.find((c) => c.field === fd.key)}
                  onChange={updateDraftFilter}
                  activities={activities}
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
                          {actFilterConditionLabel(fc)}
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
        {showMetrics && (
          (() => {
            const total = activities.length;
            const open = activities.filter((a) => a.status !== "concluida").length;
            const overdue = activities.filter(isOverdue).length;
            const completed = activities.filter((a) => a.status === "concluida").length;
            const tasksOpen = activities.filter((a) => a.type === "tarefa" && a.status !== "concluida").length;
            const eventsUpcoming = activities.filter((a) => a.type === "compromisso" && a.status !== "concluida").length;

            const metrics = [
              { label: "TOTAL", value: String(total), sub: "atividades", icon: Lightning, color: "#8C8CD4", bg: "#E8E8FD" },
              { label: "EM ABERTO", value: String(open), sub: `${tasksOpen} tarefas`, icon: Clock, color: "#07ABDE", bg: "#DCF0FF" },
              { label: "ATRASADAS", value: String(overdue), sub: "vencidas", icon: Warning, color: "#ED5200", bg: "#FFEDEB" },
              { label: "CONCLUIDAS", value: String(completed), sub: `${Math.round((completed / Math.max(1, total)) * 100)}% do total`, icon: CheckCircle, color: "#3CCEA7", bg: "#D9F8EF" },
              { label: "COMPROMISSOS", value: String(eventsUpcoming), sub: "proximos", icon: CalendarBlank, color: "#FF8C76", bg: "#FFEDEB" },
            ];

            return (
              <div className="mt-[4px] pt-[8px] border-t border-[#f0f2f5] overflow-x-auto">
                <div className="flex gap-[2px] min-w-max">
                  {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div
                        key={m.label}
                        className="flex-1 min-w-[84px] flex items-center gap-[10px] px-[12px] py-[8px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors"
                      >
                        <div
                          className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] shrink-0"
                          style={{ backgroundColor: m.bg }}
                        >
                          <Icon size={22} weight="duotone" style={{ color: m.color }} />
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
          })()
        )}
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
                    <Lightning size={32} weight="duotone" className="text-[#C8CFDB]" />
                    <p className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                      Nenhuma atividade encontrada
                    </p>
                  </div>
                </div>
              ) : (
                paginated.map((activity, idx) => {
                  const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                  const isSelected = selectedIds.has(activity.id);
                  const typeConf = activityTypeConfig[activity.type];
                  const TypeIcon = typeConf.icon;
                  const statusConf = statusConfig[activity.status] || statusConfig.nao_iniciada;
                  const priorityConf = priorityConfig[activity.priority] || priorityConfig.normal;
                  const PriorityIcon = priorityConf.icon;
                  const dateStr = getActivityDate(activity);
                  const overdue = isOverdue(activity);

                  return (
                    <div key={activity.id}>
                      <HorizontalDivider />
                      <div
                        onClick={() => toast(`Detalhe da atividade ${activity.id} (em breve)`)}
                        className={`grid items-center h-[38px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                          isSelected ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"
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
                            onChange={() => toggleSelect(activity.id)}
                          />
                        </div>

                        {/* Type icon */}
                        <div className="flex items-center justify-center">
                          <div
                            className="flex items-center justify-center size-[26px] rounded-[7px] shrink-0"
                            style={{ backgroundColor: typeConf.bg }}
                          >
                            <TypeIcon size={15} weight="duotone" style={{ color: typeConf.color }} />
                          </div>
                        </div>

                        {/* Subject */}
                        <div
                          className="truncate text-[#122232]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {activity.subject}
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

                        {/* Date */}
                        <div
                          className={`truncate ${overdue ? "text-[#ED5200]" : "text-[#28415c]"}`}
                          style={{ fontSize: 12, fontWeight: overdue ? 600 : 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {overdue && <Warning size={11} weight="fill" className="inline-block mr-[3px] -mt-[1px]" />}
                          {formatRelativeDate(dateStr)}
                        </div>

                        {/* Related to */}
                        <div className="flex items-center gap-[4px] truncate">
                          {activity.relatedToName ? (
                            <>
                              <span
                                className="text-[#98989d] shrink-0"
                                style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                              >
                                {relatedTypeLabels[activity.relatedToType] || ""}
                              </span>
                              <span
                                className="truncate text-[#07abde]"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                              >
                                {activity.relatedToName}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
                          )}
                        </div>

                        {/* Owner */}
                        <OwnerCell ownerId={activity.owner} />

                        {/* Created at */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatRelativeDate(activity.createdAt)}
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
      {filteredActivities.length > ROWS_PER_PAGE && (
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
            {selectedIds.size} {selectedIds.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => {
              toast.success(`${selectedIds.size} atividade(s) concluida(s)`);
              setActivities((prev) =>
                prev.map((a) =>
                  selectedIds.has(a.id)
                    ? { ...a, status: "concluida", completedAt: new Date().toISOString().slice(0, 10) }
                    : a
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
              toast(`Excluir ${selectedIds.size} atividade(s) (em breve)`);
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
  );
}