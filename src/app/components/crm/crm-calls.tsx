/**
 * CRM Calls — Dedicated listing page for "Ligacao" activity type.
 *
 * Follows the same visual patterns as crm-tasks.tsx but scoped
 * exclusively to calls, with call-specific statuses, columns,
 * detail panel and metrics.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneX,
  PhoneSlash,
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
  Lightning,
  CalendarBlank,
  Check,
  LinkSimple,
  NotePencil,
  CalendarDots,
  User,
  Timer,
  Voicemail,
  CheckCircle,
  Spinner,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  listActivities,
  patchActivity,
  type DbActivity,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";
import { useCreateActivity } from "./create-activity-context";
import { OwnerCell } from "./owner-cell";
import {
  fontFeature,
  type Priority,
  PRIORITY_CONFIG,
  RELATED_TYPE_LABELS,
} from "./activity-config";

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

type CallStatus = "agendada" | "em_andamento" | "concluida" | "nao_atendida" | "cancelada";
type CallDirection = "saida" | "entrada";

interface Call {
  id: string;
  subject: string;
  description: string;
  status: CallStatus;
  direction: CallDirection;
  priority: Priority;
  dueDate: string;
  duration: number; // in seconds
  completedAt: string;
  assignedTo: string;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  contactName: string;
  phoneNumber: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Status & Priority Config                                           */
/* ------------------------------------------------------------------ */

const STATUS_KEYS: CallStatus[] = ["agendada", "em_andamento", "concluida", "nao_atendida", "cancelada"];

const statusConfig: Record<CallStatus, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  agendada:      { label: "Agendada",      color: "#4E6987", bg: "#DDE3EC",  icon: CalendarBlank },
  em_andamento:  { label: "Em andamento",  color: "#07ABDE", bg: "#DCF0FF",  icon: PhoneOutgoing },
  concluida:     { label: "Concluida",     color: "#135543", bg: "#D9F8EF",  icon: Check },
  nao_atendida:  { label: "Nao atendida",  color: "#917822", bg: "#FEEDCA",  icon: PhoneX },
  cancelada:     { label: "Cancelada",     color: "#B13B00", bg: "#FFEDEB",  icon: X },
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

type CallFilterField = "priority" | "direction" | "relatedToType" | "owner";

interface CallFilterCondition {
  field: CallFilterField;
  values: string[];
}

const CALL_FILTER_FIELDS: { key: CallFilterField; label: string; icon: React.ComponentType<any> }[] = [
  { key: "priority", label: "PRIORIDADE", icon: ArrowUp },
  { key: "direction", label: "DIRECAO", icon: PhoneOutgoing },
  { key: "relatedToType", label: "RELACIONADO A", icon: Lightning },
  { key: "owner", label: "PROPRIETARIO", icon: UserCircle },
];

function getCallFilterOptions(field: CallFilterField, calls: Call[]): { value: string; label: string }[] {
  switch (field) {
    case "priority":
      return (Object.keys(priorityConfig) as Priority[]).map((k) => ({ value: k, label: priorityConfig[k].label }));
    case "direction":
      return [
        { value: "saida", label: "Saida" },
        { value: "entrada", label: "Entrada" },
      ];
    case "relatedToType":
      return Object.entries(relatedTypeLabels).map(([k, v]) => ({ value: k, label: v }));
    case "owner": {
      const unique = Array.from(new Set(calls.map((c) => c.owner).filter(Boolean)));
      return unique.sort().map((o) => ({ value: o, label: o }));
    }
    default:
      return [];
  }
}

function applyCallFilters(calls: Call[], filters: CallFilterCondition[]): Call[] {
  if (filters.length === 0) return calls;
  return calls.filter((c) => {
    for (const fc of filters) {
      if (fc.values.length === 0) continue;
      switch (fc.field) {
        case "priority":
          if (!fc.values.includes(c.priority)) return false;
          break;
        case "direction":
          if (!fc.values.includes(c.direction)) return false;
          break;
        case "relatedToType":
          if (!fc.values.includes(c.relatedToType)) return false;
          break;
        case "owner":
          if (!fc.values.includes(c.owner)) return false;
          break;
      }
    }
    return true;
  });
}

function callFilterConditionLabel(fc: CallFilterCondition): string {
  const fieldDef = CALL_FILTER_FIELDS.find((f) => f.key === fc.field);
  const prefix = fieldDef?.label ?? fc.field;
  if (fc.values.length === 0) return prefix;
  if (fc.values.length === 1) {
    if (fc.field === "priority") return `${prefix}: ${priorityConfig[fc.values[0] as Priority]?.label ?? fc.values[0]}`;
    if (fc.field === "direction") return `${prefix}: ${fc.values[0] === "saida" ? "Saida" : "Entrada"}`;
    if (fc.field === "relatedToType") return `${prefix}: ${relatedTypeLabels[fc.values[0]] ?? fc.values[0]}`;
    return `${prefix}: ${fc.values[0]}`;
  }
  return `${prefix}: ${fc.values.length} selecionados`;
}

/* ------------------------------------------------------------------ */
/*  CallFilterDropdownPill                                             */
/* ------------------------------------------------------------------ */

function CallFilterDropdownPill({
  fieldDef,
  condition,
  onChange,
  calls,
}: {
  fieldDef: { key: CallFilterField; label: string; icon: React.ComponentType<any> };
  condition: CallFilterCondition | undefined;
  onChange: (fc: CallFilterCondition) => void;
  calls: Call[];
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
            {getCallFilterOptions(f, calls).map((opt) => {
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
/*  Mock Data (calls only)                                             */
/* ------------------------------------------------------------------ */

const mockCalls: Call[] = [
  { id: "LG-A1B2", subject: "Ligar para confirmar interesse", description: "Confirmar se o lead tem interesse no plano Enterprise", status: "concluida", direction: "saida", priority: "alta", dueDate: "2026-02-24", duration: 420, completedAt: "2026-02-24", assignedTo: "Ana Paula", relatedToType: "lead", relatedToId: "LD-G7H8", relatedToName: "Daniela Souza", contactName: "Daniela Souza", phoneNumber: "(11) 98765-4321", owner: "Ana Paula", createdAt: "2026-02-17", updatedAt: "2026-02-24" },
  { id: "LG-C3D4", subject: "Cold call lista de prospeccao", description: "", status: "agendada", direction: "saida", priority: "normal", dueDate: "2026-03-05", duration: 0, completedAt: "", assignedTo: "Joao Pedro", relatedToType: "lead", relatedToId: "LD-Y5Z6", relatedToName: "Larissa Campos", contactName: "Larissa Campos", phoneNumber: "(21) 97654-3210", owner: "Joao Pedro", createdAt: "2026-02-10", updatedAt: "2026-02-10" },
  { id: "LG-E5F6", subject: "Follow-up proposta comercial", description: "Retornar ligacao sobre a proposta enviada na semana passada", status: "concluida", direction: "saida", priority: "alta", dueDate: "2026-02-22", duration: 780, completedAt: "2026-02-22", assignedTo: "Joao Silva", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", contactName: "Ana Carolina", phoneNumber: "(11) 91234-5678", owner: "Joao Silva", createdAt: "2026-02-15", updatedAt: "2026-02-22" },
  { id: "LG-G7H8", subject: "Qualificacao de lead - Epsilon", description: "", status: "nao_atendida", direction: "saida", priority: "normal", dueDate: "2026-02-25", duration: 0, completedAt: "", assignedTo: "Fernanda Santos", relatedToType: "lead", relatedToId: "LD-L2M3", relatedToName: "Marcos Tavares", contactName: "Marcos Tavares", phoneNumber: "(31) 96543-2100", owner: "Fernanda Santos", createdAt: "2026-02-20", updatedAt: "2026-02-25" },
  { id: "LG-J9K1", subject: "Retorno sobre suporte tecnico", description: "Cliente ligou reclamando de instabilidade no sistema", status: "concluida", direction: "entrada", priority: "alta", dueDate: "2026-02-21", duration: 1200, completedAt: "2026-02-21", assignedTo: "Pedro Costa", relatedToType: "conta", relatedToId: "AC-E5F6", relatedToName: "Gamma Corp", contactName: "Roberto Nunes", phoneNumber: "(11) 93456-7890", owner: "Pedro Costa", createdAt: "2026-02-21", updatedAt: "2026-02-21" },
  { id: "LG-L2M3", subject: "Agendar demo do produto", description: "Ligar para agendar demonstracao para a equipe de compras", status: "agendada", direction: "saida", priority: "alta", dueDate: "2026-03-02", duration: 0, completedAt: "", assignedTo: "Maria Oliveira", relatedToType: "oportunidade", relatedToId: "OP-C3D4", relatedToName: "Expansao Beta", contactName: "Bruno Mendes", phoneNumber: "(21) 94567-8901", owner: "Maria Oliveira", createdAt: "2026-02-23", updatedAt: "2026-02-23" },
  { id: "LG-N4P5", subject: "Negociacao de valores", description: "Discutir desconto solicitado pelo cliente", status: "concluida", direction: "saida", priority: "normal", dueDate: "2026-02-20", duration: 540, completedAt: "2026-02-20", assignedTo: "Carlos Pereira", relatedToType: "oportunidade", relatedToId: "OP-E5F6", relatedToName: "Contrato Gamma", contactName: "Helena Rocha", phoneNumber: "(41) 95678-9012", owner: "Carlos Pereira", createdAt: "2026-02-18", updatedAt: "2026-02-20" },
  { id: "LG-Q6R7", subject: "Confirmacao de reuniao presencial", description: "", status: "concluida", direction: "saida", priority: "baixa", dueDate: "2026-02-19", duration: 180, completedAt: "2026-02-19", assignedTo: "Lucas Souza", relatedToType: "conta", relatedToId: "AC-L2M3", relatedToName: "Zeta Inc", contactName: "Gabriel Santos", phoneNumber: "(11) 96789-0123", owner: "Lucas Souza", createdAt: "2026-02-17", updatedAt: "2026-02-19" },
  { id: "LG-S8T9", subject: "Pesquisa de satisfacao", description: "Ligacao pos-venda para medir satisfacao", status: "cancelada", direction: "saida", priority: "baixa", dueDate: "2026-02-26", duration: 0, completedAt: "", assignedTo: "Rafaela Costa", relatedToType: "contato", relatedToId: "CT-W3X4", relatedToName: "Kleber Oliveira", contactName: "Kleber Oliveira", phoneNumber: "(51) 97890-1234", owner: "Rafaela Costa", createdAt: "2026-02-14", updatedAt: "2026-02-25" },
  { id: "LG-U1V2", subject: "Apresentacao inicial por telefone", description: "Primeiro contato com o lead para apresentar a empresa", status: "em_andamento", direction: "saida", priority: "normal", dueDate: "2026-02-25", duration: 0, completedAt: "", assignedTo: "Camila Ribeiro", relatedToType: "lead", relatedToId: "LD-U1V2", relatedToName: "Patricia Lima", contactName: "Patricia Lima", phoneNumber: "(11) 98901-2345", owner: "Camila Ribeiro", createdAt: "2026-02-22", updatedAt: "2026-02-25" },
  { id: "LG-W3X4", subject: "Retorno de cliente insatisfeito", description: "Cliente ligou para reclamar do atraso na entrega", status: "concluida", direction: "entrada", priority: "alta", dueDate: "2026-02-23", duration: 960, completedAt: "2026-02-23", assignedTo: "Rafael Alves", relatedToType: "conta", relatedToId: "AC-N4P5", relatedToName: "Theta SA", contactName: "Fernanda Costa", phoneNumber: "(51) 92345-6789", owner: "Rafael Alves", createdAt: "2026-02-23", updatedAt: "2026-02-23" },
  { id: "LG-Y5Z6", subject: "Cobranca de pagamento pendente", description: "", status: "nao_atendida", direction: "saida", priority: "alta", dueDate: "2026-02-27", duration: 0, completedAt: "", assignedTo: "Juliana Ferreira", relatedToType: "conta", relatedToId: "AC-Q6R7", relatedToName: "Iota Group", contactName: "Marcelo Dias", phoneNumber: "(11) 93456-7891", owner: "Juliana Ferreira", createdAt: "2026-02-24", updatedAt: "2026-02-27" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dbActivityToCall(row: DbActivity): Call | null {
  if ((row.type || "") !== "ligacao") return null;
  return {
    id: row.id,
    subject: row.subject || row.label || "",
    description: row.description || "",
    status: (row.status || "agendada") as CallStatus,
    direction: ((row as any).direction || "saida") as CallDirection,
    priority: (row.priority || "normal") as Priority,
    dueDate: row.due_date || "",
    duration: (row as any).duration || 0,
    completedAt: row.completed_at || "",
    assignedTo: row.assigned_to || row.owner || "",
    relatedToType: row.related_to_type || "",
    relatedToId: row.related_to_id || "",
    relatedToName: row.related_to_name || "",
    contactName: row.contact_name || "",
    phoneNumber: (row as any).phone_number || "",
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

function formatFullDate(iso: string): string {
  if (!iso) return "\u2014";
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "\u2014";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function formatDurationShort(seconds: number): string {
  if (!seconds || seconds <= 0) return "\u2014";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}`;
  return `0:${String(s).padStart(2, "0")}`;
}

function isOverdue(c: Call): boolean {
  if (c.status === "concluida" || c.completedAt) return false;
  if (c.status === "cancelada") return false;
  if (!c.dueDate) return false;
  return new Date(c.dueDate) < new Date();
}

/* ------------------------------------------------------------------ */
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [240, 110, 50, 80, 100, 150, 140, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "ASSUNTO",
  "STATUS",
  "DIR.",
  "DURACAO",
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
          checked ? "border-[#07ABDE] bg-[#07ABDE]" : "border-[#28415c] bg-transparent"
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
/*  Call Detail Panel                                                   */
/* ------------------------------------------------------------------ */

function CallDetailPanel({
  call,
  onClose,
  onStatusChange,
}: {
  call: Call;
  onClose: () => void;
  onStatusChange: (callId: string, newStatus: CallStatus) => void;
}) {
  const statusConf = statusConfig[call.status] || statusConfig.agendada;
  const priorityConf = priorityConfig[call.priority] || priorityConfig.normal;
  const PriorityIcon = priorityConf.icon;
  const StatusIcon = statusConf.icon;
  const overdue = isOverdue(call);
  const DirectionIcon = call.direction === "entrada" ? PhoneIncoming : PhoneOutgoing;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const DetailRow = ({ icon: Icon, label, children }: { icon: React.ComponentType<any>; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-[10px] py-[10px]">
      <div className="flex items-center justify-center w-[28px] h-[28px] rounded-[8px] bg-[#f6f7f9] shrink-0 mt-[1px]">
        <Icon size={14} weight="duotone" className="text-[#4E6987]" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="text-[#98989d] uppercase mb-[2px]"
          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
        >
          {label}
        </span>
        <div>{children}</div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-[15px] overflow-hidden">
      {/* Green Header */}
      <div className="relative shrink-0">
        <div className="bg-[#D9F8EF] px-[20px] pt-[16px] pb-[48px]">
          <div className="flex justify-end mb-[4px]">
            <button
              onClick={onClose}
              className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#b8f0dd] transition-colors text-[#083226] cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="flex items-center justify-center w-[44px] h-[44px] rounded-[12px] bg-[#b8f0dd] shrink-0">
              <Phone size={22} weight="duotone" className="text-[#3CCEA7]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#083226] truncate" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}>{call.subject}</p>
              <p className="text-[#083226] uppercase truncate" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "18px", ...fontFeature }}>{call.id}</p>
            </div>
          </div>
        </div>
        {/* Pills overlapping header bottom */}
        <div className="absolute left-[20px] right-[20px] bottom-[12px] flex items-center gap-[6px] flex-wrap">
          <div className="flex items-center gap-[4px] h-[24px] px-[10px] rounded-[500px]" style={{ backgroundColor: statusConf.bg }}>
            <StatusIcon size={10} weight="fill" style={{ color: statusConf.color }} />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: statusConf.color, ...fontFeature }}>{statusConf.label}</span>
          </div>
          <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-white/70">
            <DirectionIcon size={10} weight="bold" className="text-[#4E6987]" />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#4E6987", ...fontFeature }}>
              {call.direction === "entrada" ? "Entrada" : "Saida"}
            </span>
          </div>
          <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-white/70">
            <PriorityIcon size={10} weight="bold" style={{ color: priorityConf.color }} />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: priorityConf.color, ...fontFeature }}>{priorityConf.label}</span>
          </div>
          {overdue && (
            <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-[#FFEDEB]">
              <Warning size={10} weight="fill" className="text-[#ED5200]" />
              <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#ED5200", ...fontFeature }}>Atrasada</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[20px] pt-[16px] pb-[20px]">
        {/* Description */}
        {call.description ? (
          <p className="text-[#4E6987] mb-[14px]" style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>{call.description}</p>
        ) : (
          <p className="text-[#C8CFDB] italic mb-[14px]" style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>Sem descricao</p>
        )}

        <div className="h-[1px] bg-[#f0f2f5] mb-[2px]" />

        {call.phoneNumber && (
          <>
            <DetailRow icon={Phone} label="TELEFONE">
              <span className="text-[#0483AB]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{call.phoneNumber}</span>
            </DetailRow>
            <div className="h-[1px] bg-[#f0f2f5]" />
          </>
        )}

        <DetailRow icon={Timer} label="DURACAO">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatDuration(call.duration)}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={CalendarDots} label="DATA">
          <span className={overdue ? "text-[#ED5200]" : "text-[#28415c]"} style={{ fontSize: 12, fontWeight: overdue ? 600 : 500, letterSpacing: -0.3, ...fontFeature }}>
            {overdue && <Warning size={10} weight="fill" className="inline-block mr-[3px] -mt-[1px]" />}
            {formatFullDate(call.dueDate)}
            {call.dueDate && <span className="text-[#98989d] ml-[4px]" style={{ fontSize: 10, fontWeight: 400 }}>({formatRelativeDate(call.dueDate)})</span>}
          </span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        {call.contactName && (
          <>
            <DetailRow icon={User} label="CONTATO">
              <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{call.contactName}</span>
            </DetailRow>
            <div className="h-[1px] bg-[#f0f2f5]" />
          </>
        )}

        <DetailRow icon={User} label="RESPONSAVEL">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{call.assignedTo || "\u2014"}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={UserCircle} label="PROPRIETARIO">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{call.owner || "\u2014"}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={LinkSimple} label="RELACIONADO A">
          {call.relatedToName ? (
            <div className="flex items-center gap-[6px]">
              <span className="text-[#98989d] uppercase" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>{relatedTypeLabels[call.relatedToType] || call.relatedToType}</span>
              <span className="text-[#0483AB]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{call.relatedToName}</span>
            </div>
          ) : (
            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
          )}
        </DetailRow>

        <div className="h-[1px] bg-[#f0f2f5]" />
        <DetailRow icon={CalendarBlank} label="CRIADO EM">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(call.createdAt)}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={Clock} label="ATUALIZADO EM">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(call.updatedAt)}</span>
        </DetailRow>

        {call.completedAt && (
          <>
            <div className="h-[1px] bg-[#f0f2f5]" />
            <DetailRow icon={CheckCircle} label="CONCLUIDA EM">
              <span className="text-[#135543]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(call.completedAt)}</span>
            </DetailRow>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 px-[20px] py-[12px]">
        <div className="h-[1px] bg-[#DDE3EC] mb-[12px]" />
        <div className="flex items-center gap-[6px] flex-wrap">
          {call.status !== "concluida" && (
            <button
              onClick={() => onStatusChange(call.id, "concluida")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer"
            >
              <CheckCircle size={13} weight="fill" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Concluir</span>
            </button>
          )}
          {call.status !== "cancelada" && call.status !== "concluida" && (
            <button
              onClick={() => onStatusChange(call.id, "cancelada")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#f6f7f9] text-[#F56233] hover:bg-[#FFEDEB] hover:text-[#F56233] transition-colors cursor-pointer"
            >
              <X size={11} weight="bold" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Cancelar</span>
            </button>
          )}
          <button
            onClick={() => toast("Editar ligacao (em breve)")}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer ml-auto"
          >
            <NotePencil size={13} weight="duotone" />
            <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Editar</span>
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
  status: CallStatus | "all";
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
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmCalls() {
  const { query: globalSearch } = useCrmSearch();
  const { refreshKey } = useCreateActivity();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* -- Filter state -- */
  const [statusFilter, setStatusFilter] = useState<CallStatus | "all">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<CallFilterCondition[]>([]);
  const [draftFilters, setDraftFilters] = useState<CallFilterCondition[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  /* -- Detail panel state -- */
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const handleStatusChange = useCallback((callId: string, newStatus: CallStatus) => {
    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId
          ? { ...c, status: newStatus, completedAt: newStatus === "concluida" ? new Date().toISOString().slice(0, 10) : c.completedAt }
          : c
      )
    );
    patchActivity(callId, { status: newStatus, ...(newStatus === "concluida" ? { completed_at: new Date().toISOString() } : {}) }).catch(console.error);
    toast.success(`Ligacao ${newStatus === "concluida" ? "concluida" : "cancelada"}!`);
  }, []);

  /* -- Load from Supabase (real data only) -- */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) { setCalls([]); setLoading(false); } }, 8000);

    (async () => {
      try {
        const dbRows = await listActivities();
        if (cancelled) return;
        const converted = (dbRows || []).map(dbActivityToCall).filter(Boolean) as Call[];
        setCalls(converted);
      } catch (err) {
        console.error("[CRM Calls] Error loading activities:", err);
        if (!cancelled) setCalls([]);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  /* -- Filtered calls -- */
  const filteredCalls = useMemo(() => {
    let result = calls;

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    result = applyCallFilters(result, activeFilters);

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter((c) =>
        c.subject.toLowerCase().includes(q) ||
        c.relatedToName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q)
      );
    }

    return result;
  }, [calls, statusFilter, activeFilters, globalSearch]);

  /* -- Table state -- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMetrics, setShowMetrics] = useState(true);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / ROWS_PER_PAGE));
  const paginated = filteredCalls.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const selectedCall = selectedCallId ? calls.find((c) => c.id === selectedCallId) : null;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: calls.length };
    for (const s of STATUS_KEYS) {
      counts[s] = calls.filter((c) => c.status === s).length;
    }
    return counts;
  }, [calls]);

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
      setSelectedIds(new Set(paginated.map((c) => c.id)));
    }
  };

  /* -- Filter panel handlers -- */
  const updateDraftFilter = (fc: CallFilterCondition) => {
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
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#3CCEA7] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando ligacoes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-[12px] min-h-0 overflow-hidden">
      {/* LEFT: MAIN LIST AREA */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden min-w-0 transition-all ${selectedCall ? "xl:flex hidden" : "flex"} xl:flex`}>
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
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#D9F8EF] group-hover/title:bg-[#b8f0dd] transition-colors">
                <Phone size={22} weight="duotone" className="text-[#3CCEA7] group-hover/title:text-[#1ea07e] transition-colors" />
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
                  >Ligacoes</span>
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
                  onClick={() => { setTitleMenuOpen(false); toast("Configuracoes de ligacoes (em breve)"); }}
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
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Ligacoes</span>
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

        {/* FILTER PANEL */}
        {isFilterPanelOpen && (
          <div ref={filterPanelRef} className="mt-[8px] pt-[10px] border-t border-[#f0f2f5]">
            {/* Filter dropdown pills row */}
            <div className="flex items-center gap-[6px] flex-wrap">
              {CALL_FILTER_FIELDS.map((fd) => (
                <CallFilterDropdownPill
                  key={fd.key}
                  fieldDef={fd}
                  condition={draftFilters.find((c) => c.field === fd.key)}
                  onChange={updateDraftFilter}
                  calls={calls}
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
                          {callFilterConditionLabel(fc)}
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
          const total = calls.length;
          const scheduled = calls.filter((c) => c.status === "agendada").length;
          const overdue = calls.filter(isOverdue).length;
          const completed = calls.filter((c) => c.status === "concluida").length;
          const noAnswer = calls.filter((c) => c.status === "nao_atendida").length;
          const totalDuration = calls.reduce((acc, c) => acc + c.duration, 0);
          const avgDuration = completed > 0 ? Math.round(totalDuration / completed) : 0;

          const metrics = [
            { label: "TOTAL", value: String(total), sub: "ligacoes", icon: Phone, color: "#3CCEA7", bg: "#D9F8EF" },
            { label: "AGENDADAS", value: String(scheduled), sub: `${overdue} atrasada${overdue !== 1 ? "s" : ""}`, icon: CalendarBlank, color: "#4E6987", bg: "#DDE3EC" },
            { label: "CONCLUIDAS", value: String(completed), sub: `${Math.round((completed / Math.max(1, total)) * 100)}% do total`, icon: CheckCircle, color: "#135543", bg: "#D9F8EF" },
            { label: "NAO ATENDIDAS", value: String(noAnswer), sub: `${Math.round((noAnswer / Math.max(1, total)) * 100)}% do total`, icon: PhoneX, color: "#917822", bg: "#FEEDCA" },
            { label: "DURACAO MEDIA", value: formatDurationShort(avgDuration), sub: "por ligacao", icon: Timer, color: "#07ABDE", bg: "#DCF0FF" },
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
                    <Phone size={32} weight="duotone" className="text-[#C8CFDB]" />
                    <p className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                      Nenhuma ligacao encontrada
                    </p>
                  </div>
                </div>
              ) : (
                paginated.map((call, idx) => {
                  const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                  const isSelected = selectedIds.has(call.id);
                  const statusConf = statusConfig[call.status] || statusConfig.agendada;
                  const priorityConf = priorityConfig[call.priority] || priorityConfig.normal;
                  const overdue = isOverdue(call);
                  const DirectionIcon = call.direction === "entrada" ? PhoneIncoming : PhoneOutgoing;

                  return (
                    <div key={call.id}>
                      <HorizontalDivider />
                      <div
                        onClick={() => setSelectedCallId(call.id)}
                        className={`grid items-center h-[38px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                          selectedCallId === call.id
                            ? "bg-[#F6F7F9]"
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
                            onChange={() => toggleSelect(call.id)}
                          />
                        </div>

                        {/* Subject */}
                        <div
                          className="truncate text-[#122232]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {call.subject}
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

                        {/* Direction */}
                        <div className="flex items-center justify-center">
                          <DirectionIcon
                            size={14}
                            weight="duotone"
                            className={call.direction === "entrada" ? "text-[#3CCEA7]" : "text-[#07ABDE]"}
                          />
                        </div>

                        {/* Duration */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatDurationShort(call.duration)}
                        </div>

                        {/* Date */}
                        <div
                          className={`truncate ${overdue ? "text-[#ED5200]" : "text-[#28415c]"}`}
                          style={{ fontSize: 12, fontWeight: overdue ? 600 : 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {overdue && <Warning size={11} weight="fill" className="inline-block mr-[3px] -mt-[1px]" />}
                          {formatRelativeDate(call.dueDate)}
                        </div>

                        {/* Related to */}
                        <div className="flex items-center gap-[4px] truncate">
                          {call.relatedToName ? (
                            <>
                              <span
                                className="text-[#98989d] shrink-0"
                                style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                              >
                                {relatedTypeLabels[call.relatedToType] || ""}
                              </span>
                              <span
                                className="truncate text-[#0483AB]"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                              >
                                {call.relatedToName}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
                          )}
                        </div>

                        {/* Owner */}
                        <OwnerCell ownerId={call.owner} />

                        {/* Created at */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatRelativeDate(call.createdAt)}
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
      {filteredCalls.length > ROWS_PER_PAGE && (
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
              toast.success(`${selectedIds.size} ligacao(oes) concluida(s)`);
              setCalls((prev) =>
                prev.map((c) =>
                  selectedIds.has(c.id)
                    ? { ...c, status: "concluida" as CallStatus, completedAt: new Date().toISOString().slice(0, 10) }
                    : c
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
              toast(`Excluir ${selectedIds.size} ligacao(oes) (em breve)`);
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

      {/* RIGHT: DETAIL SIDE PANEL */}
      <AnimatePresence mode="wait">
        {selectedCall && (
          <motion.div
            key={selectedCall.id}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[320px] h-full">
              <CallDetailPanel
                call={selectedCall}
                onClose={() => setSelectedCallId(null)}
                onStatusChange={handleStatusChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
