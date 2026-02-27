/**
 * CRM Notes — Dedicated listing page for "Nota" activity type.
 *
 * Follows the same visual patterns as crm-calls.tsx but scoped
 * exclusively to notes, with note-specific statuses, columns,
 * detail panel and metrics.  Theme: Yellow/Amber (#FEEDCA / #EAC23D).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  NoteBlank,
  NotePencil,
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
  UserCircle,
  Lightning,
  CalendarBlank,
  Check,
  LinkSimple,
  User,
  Eye,
  EyeSlash,
  LockSimple,
  ShareNetwork,
  Archive,
  TextAlignLeft,
  CheckCircle,
  ClockCounterClockwise,
  Users,
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

type NoteStatus = "rascunho" | "publicada" | "compartilhada" | "privada" | "arquivada";
type NoteVisibility = "publica" | "privada";

interface Note {
  id: string;
  title: string;
  body: string;
  status: NoteStatus;
  visibility: NoteVisibility;
  priority: Priority;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  sharedWith: string[];
  version: number;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Status & Priority Config                                           */
/* ------------------------------------------------------------------ */

const STATUS_KEYS: NoteStatus[] = ["rascunho", "publicada", "compartilhada", "privada", "arquivada"];

const statusConfig: Record<NoteStatus, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  rascunho:       { label: "Rascunho",       color: "#4E6987", bg: "#DDE3EC",  icon: NotePencil },
  publicada:      { label: "Publicada",      color: "#135543", bg: "#D9F8EF",  icon: Check },
  compartilhada:  { label: "Compartilhada",  color: "#07ABDE", bg: "#DCF0FF",  icon: ShareNetwork },
  privada:        { label: "Privada",        color: "#917822", bg: "#FEEDCA",  icon: LockSimple },
  arquivada:      { label: "Arquivada",      color: "#B13B00", bg: "#FFEDEB",  icon: Archive },
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

type NoteFilterField = "priority" | "visibility" | "relatedToType" | "owner";

interface NoteFilterCondition {
  field: NoteFilterField;
  values: string[];
}

const NOTE_FILTER_FIELDS: { key: NoteFilterField; label: string; icon: React.ComponentType<any> }[] = [
  { key: "priority", label: "PRIORIDADE", icon: ArrowUp },
  { key: "visibility", label: "VISIBILIDADE", icon: Eye },
  { key: "relatedToType", label: "RELACIONADO A", icon: Lightning },
  { key: "owner", label: "PROPRIETARIO", icon: UserCircle },
];

function getNoteFilterOptions(field: NoteFilterField, notes: Note[]): { value: string; label: string }[] {
  switch (field) {
    case "priority":
      return (Object.keys(priorityConfig) as Priority[]).map((k) => ({ value: k, label: priorityConfig[k].label }));
    case "visibility":
      return [
        { value: "publica", label: "Publica" },
        { value: "privada", label: "Privada" },
      ];
    case "relatedToType":
      return Object.entries(relatedTypeLabels).map(([k, v]) => ({ value: k, label: v }));
    case "owner": {
      const unique = Array.from(new Set(notes.map((n) => n.owner).filter(Boolean)));
      return unique.sort().map((o) => ({ value: o, label: o }));
    }
    default:
      return [];
  }
}

function applyNoteFilters(notes: Note[], filters: NoteFilterCondition[]): Note[] {
  if (filters.length === 0) return notes;
  return notes.filter((n) => {
    for (const fc of filters) {
      if (fc.values.length === 0) continue;
      switch (fc.field) {
        case "priority":
          if (!fc.values.includes(n.priority)) return false;
          break;
        case "visibility":
          if (!fc.values.includes(n.visibility)) return false;
          break;
        case "relatedToType":
          if (!fc.values.includes(n.relatedToType)) return false;
          break;
        case "owner":
          if (!fc.values.includes(n.owner)) return false;
          break;
      }
    }
    return true;
  });
}

function noteFilterConditionLabel(fc: NoteFilterCondition): string {
  const fieldDef = NOTE_FILTER_FIELDS.find((f) => f.key === fc.field);
  const prefix = fieldDef?.label ?? fc.field;
  if (fc.values.length === 0) return prefix;
  if (fc.values.length === 1) {
    if (fc.field === "priority") return `${prefix}: ${priorityConfig[fc.values[0] as Priority]?.label ?? fc.values[0]}`;
    if (fc.field === "visibility") return `${prefix}: ${fc.values[0] === "publica" ? "Publica" : "Privada"}`;
    if (fc.field === "relatedToType") return `${prefix}: ${relatedTypeLabels[fc.values[0]] ?? fc.values[0]}`;
    return `${prefix}: ${fc.values[0]}`;
  }
  return `${prefix}: ${fc.values.length} selecionados`;
}

/* ------------------------------------------------------------------ */
/*  NoteFilterDropdownPill                                             */
/* ------------------------------------------------------------------ */

function NoteFilterDropdownPill({
  fieldDef,
  condition,
  onChange,
  notes,
}: {
  fieldDef: { key: NoteFilterField; label: string; icon: React.ComponentType<any> };
  condition: NoteFilterCondition | undefined;
  onChange: (fc: NoteFilterCondition) => void;
  notes: Note[];
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
            {getNoteFilterOptions(f, notes).map((opt) => {
              const checked = condition?.values?.includes(opt.value) ?? false;
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleValue(opt.value)}
                  className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left w-full"
                >
                  <div className={`size-[14px] rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "border-[#07ABDE] bg-[#07ABDE]" : "border-[#98989d] bg-transparent"
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
/*  Mock Data (notes only)                                             */
/* ------------------------------------------------------------------ */

const mockNotes: Note[] = [
  { id: "NT-A1B2", title: "Anotacoes da reuniao de vendas", body: "Discutimos budget e timeline. Cliente interessado em fechar Q1. Proximo passo: enviar proposta revisada ate sexta.", status: "publicada", visibility: "publica", priority: "alta", relatedToType: "oportunidade", relatedToId: "OP-C3D4", relatedToName: "Expansao Beta", sharedWith: ["Joao Silva", "Maria Oliveira"], version: 3, owner: "Carlos Pereira", createdAt: "2026-02-16", updatedAt: "2026-02-23" },
  { id: "NT-C3D4", title: "Requisitos tecnicos do projeto", body: "Stack preferida: React + Node. Integracao com API legada necessaria. Prazo de entrega: 60 dias uteis.", status: "compartilhada", visibility: "publica", priority: "alta", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", sharedWith: ["Pedro Costa", "Ana Paula", "Lucas Souza"], version: 5, owner: "Joao Silva", createdAt: "2026-02-10", updatedAt: "2026-02-24" },
  { id: "NT-E5F6", title: "Feedback do cliente sobre proposta", body: "Cliente solicitou desconto de 15% e extensao de garantia. Precisa de aprovacao da diretoria.", status: "privada", visibility: "privada", priority: "normal", relatedToType: "conta", relatedToId: "AC-E5F6", relatedToName: "Gamma Corp", sharedWith: [], version: 1, owner: "Fernanda Santos", createdAt: "2026-02-18", updatedAt: "2026-02-18" },
  { id: "NT-G7H8", title: "Estrategia de abordagem lead Epsilon", body: "Lead tem urgencia. Focar em ROI e cases do segmento. Agendado call para quinta.", status: "publicada", visibility: "publica", priority: "alta", relatedToType: "lead", relatedToId: "LD-L2M3", relatedToName: "Marcos Tavares", sharedWith: ["Camila Ribeiro"], version: 2, owner: "Ana Paula", createdAt: "2026-02-20", updatedAt: "2026-02-25" },
  { id: "NT-J9K1", title: "Analise de concorrencia - setor financeiro", body: "Mapeamos 3 concorrentes diretos. Nosso diferencial: integracao nativa com ERP e suporte 24h.", status: "compartilhada", visibility: "publica", priority: "normal", relatedToType: "oportunidade", relatedToId: "OP-E5F6", relatedToName: "Contrato Gamma", sharedWith: ["Joao Silva", "Carlos Pereira"], version: 4, owner: "Pedro Costa", createdAt: "2026-02-12", updatedAt: "2026-02-22" },
  { id: "NT-L2M3", title: "Informacoes sensíveis de negociacao", body: "Margem minima aprovada pela diretoria: 22%. Nao compartilhar com equipe comercial geral.", status: "privada", visibility: "privada", priority: "alta", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", sharedWith: [], version: 1, owner: "Maria Oliveira", createdAt: "2026-02-15", updatedAt: "2026-02-15" },
  { id: "NT-N4P5", title: "Rascunho - plano de onboarding", body: "Etapas: 1) Kickoff 2) Setup tecnico 3) Treinamento 4) Go-live. Tempo estimado: 3 semanas.", status: "rascunho", visibility: "publica", priority: "normal", relatedToType: "conta", relatedToId: "AC-L2M3", relatedToName: "Zeta Inc", sharedWith: [], version: 1, owner: "Lucas Souza", createdAt: "2026-02-22", updatedAt: "2026-02-22" },
  { id: "NT-Q6R7", title: "Pontos de melhoria pos-reuniao", body: "Apresentacao precisa de mais dados quantitativos. Incluir ROI projetado e comparativo.", status: "publicada", visibility: "publica", priority: "baixa", relatedToType: "contato", relatedToId: "CT-W3X4", relatedToName: "Kleber Oliveira", sharedWith: [], version: 2, owner: "Rafaela Costa", createdAt: "2026-02-14", updatedAt: "2026-02-21" },
  { id: "NT-S8T9", title: "Resumo da call de qualificacao", body: "Lead qualificado como SQL. Budget confirmado: R$ 150k. Decision maker: diretor de TI.", status: "compartilhada", visibility: "publica", priority: "alta", relatedToType: "lead", relatedToId: "LD-Y5Z6", relatedToName: "Larissa Campos", sharedWith: ["Joao Pedro", "Fernanda Santos"], version: 3, owner: "Camila Ribeiro", createdAt: "2026-02-19", updatedAt: "2026-02-25" },
  { id: "NT-U1V2", title: "Historico de interacoes - Theta SA", body: "4 reunioes realizadas, 2 propostas enviadas. Cliente indeciso entre nos e concorrente.", status: "publicada", visibility: "publica", priority: "normal", relatedToType: "conta", relatedToId: "AC-N4P5", relatedToName: "Theta SA", sharedWith: ["Rafael Alves"], version: 6, owner: "Rafael Alves", createdAt: "2026-02-08", updatedAt: "2026-02-24" },
  { id: "NT-W3X4", title: "Nota arquivada - projeto cancelado", body: "Projeto descontinuado pelo cliente por questoes orcamentarias. Manter contato para Q3.", status: "arquivada", visibility: "publica", priority: "baixa", relatedToType: "oportunidade", relatedToId: "OP-G7H8", relatedToName: "Parceria Delta", sharedWith: [], version: 2, owner: "Juliana Ferreira", createdAt: "2026-01-20", updatedAt: "2026-02-10" },
  { id: "NT-Y5Z6", title: "Checklist de documentos pendentes", body: "Faltam: contrato social, CNPJ atualizado, referencias comerciais. Prazo: ate 28/02.", status: "rascunho", visibility: "publica", priority: "normal", relatedToType: "conta", relatedToId: "AC-Q6R7", relatedToName: "Iota Group", sharedWith: [], version: 1, owner: "Joao Pedro", createdAt: "2026-02-24", updatedAt: "2026-02-24" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dbActivityToNote(row: DbActivity): Note | null {
  if ((row.type || "") !== "nota") return null;
  return {
    id: row.id,
    title: row.subject || row.label || "",
    body: row.description || "",
    status: (row.status || "rascunho") as NoteStatus,
    visibility: ((row as any).visibility || "publica") as NoteVisibility,
    priority: (row.priority || "normal") as Priority,
    relatedToType: row.related_to_type || "",
    relatedToId: row.related_to_id || "",
    relatedToName: row.related_to_name || "",
    sharedWith: (row as any).shared_with || [],
    version: (row as any).version || 1,
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

function truncateBody(text: string, max = 60): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "\u2026";
}

/* ------------------------------------------------------------------ */
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [220, 120, 80, 200, 150, 140, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "TITULO",
  "STATUS",
  "VISIBILIDADE",
  "RELACIONADO A",
  "PROPRIETARIO",
  "ATUALIZADO",
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
/*  Note Detail Panel                                                   */
/* ------------------------------------------------------------------ */

function NoteDetailPanel({
  note,
  onClose,
  onStatusChange,
}: {
  note: Note;
  onClose: () => void;
  onStatusChange: (noteId: string, newStatus: NoteStatus) => void;
}) {
  const statusConf = statusConfig[note.status] || statusConfig.rascunho;
  const priorityConf = priorityConfig[note.priority] || priorityConfig.normal;
  const PriorityIcon = priorityConf.icon;
  const StatusIcon = statusConf.icon;
  const VisibilityIcon = note.visibility === "privada" ? LockSimple : Eye;

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
      {/* Amber Header */}
      <div className="relative shrink-0">
        <div className="bg-[#FEEDCA] px-[20px] pt-[16px] pb-[48px]">
          <div className="flex justify-end mb-[4px]">
            <button
              onClick={onClose}
              className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#f5dda0] transition-colors text-[#5c4a14] cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="flex items-center justify-center w-[44px] h-[44px] rounded-[12px] bg-[#f5dda0] shrink-0">
              <NoteBlank size={22} weight="duotone" className="text-[#EAC23D]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#5c4a14] truncate" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}>{note.title}</p>
              <p className="text-[#5c4a14] uppercase truncate" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "18px", ...fontFeature }}>{note.id}</p>
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
            <VisibilityIcon size={10} weight="bold" className="text-[#4E6987]" />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#4E6987", ...fontFeature }}>
              {note.visibility === "privada" ? "Privada" : "Publica"}
            </span>
          </div>
          <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-white/70">
            <PriorityIcon size={10} weight="bold" style={{ color: priorityConf.color }} />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: priorityConf.color, ...fontFeature }}>{priorityConf.label}</span>
          </div>
          {note.version > 1 && (
            <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-white/70">
              <ClockCounterClockwise size={10} weight="bold" className="text-[#4E6987]" />
              <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#4E6987", ...fontFeature }}>v{note.version}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[20px] pt-[16px] pb-[20px]">
        {/* Body preview */}
        {note.body ? (
          <p className="text-[#4E6987] mb-[14px]" style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>{note.body}</p>
        ) : (
          <p className="text-[#C8CFDB] italic mb-[14px]" style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>Nota vazia</p>
        )}

        <div className="h-[1px] bg-[#f0f2f5] mb-[2px]" />

        <DetailRow icon={UserCircle} label="PROPRIETARIO">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{note.owner || "\u2014"}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={LinkSimple} label="RELACIONADO A">
          {note.relatedToName ? (
            <div className="flex items-center gap-[6px]">
              <span className="text-[#98989d] uppercase" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>{relatedTypeLabels[note.relatedToType] || note.relatedToType}</span>
              <span className="text-[#0483AB]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{note.relatedToName}</span>
            </div>
          ) : (
            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
          )}
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        {note.sharedWith.length > 0 && (
          <>
            <DetailRow icon={Users} label="COMPARTILHADA COM">
              <div className="flex flex-wrap gap-[4px]">
                {note.sharedWith.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center h-[22px] px-[8px] rounded-[500px] bg-[#DCF0FF] text-[#07ABDE]"
                    style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </DetailRow>
            <div className="h-[1px] bg-[#f0f2f5]" />
          </>
        )}

        <DetailRow icon={ClockCounterClockwise} label="VERSAO">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>Versao {note.version}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={CalendarBlank} label="CRIADO EM">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(note.createdAt)}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={Clock} label="ATUALIZADO EM">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(note.updatedAt)}</span>
        </DetailRow>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 px-[20px] py-[12px]">
        <div className="h-[1px] bg-[#DDE3EC] mb-[12px]" />
        <div className="flex items-center gap-[6px] flex-wrap">
          {note.status === "rascunho" && (
            <button
              onClick={() => onStatusChange(note.id, "publicada")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer"
            >
              <Check size={13} weight="bold" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Publicar</span>
            </button>
          )}
          {note.status !== "compartilhada" && note.status !== "arquivada" && note.visibility !== "privada" && (
            <button
              onClick={() => onStatusChange(note.id, "compartilhada")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#f6f7f9] text-[#07ABDE] hover:bg-[#DCF0FF] transition-colors cursor-pointer"
            >
              <ShareNetwork size={13} weight="duotone" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Compartilhar</span>
            </button>
          )}
          {note.status !== "arquivada" && (
            <button
              onClick={() => onStatusChange(note.id, "arquivada")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#f6f7f9] text-[#F56233] hover:bg-[#FFEDEB] hover:text-[#F56233] transition-colors cursor-pointer"
            >
              <Archive size={11} weight="bold" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Arquivar</span>
            </button>
          )}
          <button
            onClick={() => toast("Editar nota (em breve)")}
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
  status: NoteStatus | "all";
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

export function CrmNotes() {
  const { query: globalSearch } = useCrmSearch();
  const { refreshKey } = useCreateActivity();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* -- Filter state -- */
  const [statusFilter, setStatusFilter] = useState<NoteStatus | "all">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<NoteFilterCondition[]>([]);
  const [draftFilters, setDraftFilters] = useState<NoteFilterCondition[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  /* -- Detail panel state -- */
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const handleStatusChange = useCallback((noteId: string, newStatus: NoteStatus) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, status: newStatus, updatedAt: new Date().toISOString().slice(0, 10) }
          : n
      )
    );
    patchActivity(noteId, { status: newStatus }).catch(console.error);
    const labels: Record<NoteStatus, string> = {
      rascunho: "movida para rascunho",
      publicada: "publicada",
      compartilhada: "compartilhada",
      privada: "marcada como privada",
      arquivada: "arquivada",
    };
    toast.success(`Nota ${labels[newStatus]}!`);
  }, []);

  /* -- Load from Supabase (real data only) -- */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) { setNotes([]); setLoading(false); } }, 8000);

    (async () => {
      try {
        const dbRows = await listActivities();
        if (cancelled) return;
        const converted = (dbRows || []).map(dbActivityToNote).filter(Boolean) as Note[];
        setNotes(converted);
      } catch (err) {
        console.error("[CRM Notes] Error loading activities:", err);
        if (!cancelled) setNotes([]);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  /* -- Filtered notes -- */
  const filteredNotes = useMemo(() => {
    let result = notes;

    if (statusFilter !== "all") {
      result = result.filter((n) => n.status === statusFilter);
    }

    result = applyNoteFilters(result, activeFilters);

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.relatedToName.toLowerCase().includes(q) ||
        n.owner.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notes, statusFilter, activeFilters, globalSearch]);

  /* -- Table state -- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMetrics, setShowMetrics] = useState(true);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / ROWS_PER_PAGE));
  const paginated = filteredNotes.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const selectedNote = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : null;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notes.length };
    for (const s of STATUS_KEYS) {
      counts[s] = notes.filter((n) => n.status === s).length;
    }
    return counts;
  }, [notes]);

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
      setSelectedIds(new Set(paginated.map((n) => n.id)));
    }
  };

  /* -- Filter panel handlers -- */
  const updateDraftFilter = (fc: NoteFilterCondition) => {
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
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#EAC23D] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando notas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-[12px] min-h-0 overflow-hidden">
      {/* LEFT: MAIN LIST AREA */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden min-w-0 transition-all ${selectedNote ? "xl:flex hidden" : "flex"} xl:flex`}>
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
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#FEEDCA] group-hover/title:bg-[#f5dda0] transition-colors">
                <NoteBlank size={22} weight="duotone" className="text-[#EAC23D] group-hover/title:text-[#c9a21e] transition-colors" />
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
                  >Notas</span>
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
                  onClick={() => { setTitleMenuOpen(false); toast("Configuracoes de notas (em breve)"); }}
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
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Notas</span>
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

        </div>

        {/* FILTER PANEL */}
        {isFilterPanelOpen && (
          <div ref={filterPanelRef} className="mt-[8px] pt-[10px] border-t border-[#f0f2f5]">
            {/* Filter dropdown pills row */}
            <div className="flex items-center gap-[6px] flex-wrap">
              {NOTE_FILTER_FIELDS.map((fd) => (
                <NoteFilterDropdownPill
                  key={fd.key}
                  fieldDef={fd}
                  condition={draftFilters.find((c) => c.field === fd.key)}
                  onChange={updateDraftFilter}
                  notes={notes}
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
                          {noteFilterConditionLabel(fc)}
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
                    <NoteBlank size={32} weight="duotone" className="text-[#C8CFDB]" />
                    <p className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                      Nenhuma nota encontrada
                    </p>
                  </div>
                </div>
              ) : (
                paginated.map((note, idx) => {
                  const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                  const isSelected = selectedIds.has(note.id);
                  const statusConf = statusConfig[note.status] || statusConfig.rascunho;
                  const VisIcon = note.visibility === "privada" ? LockSimple : Eye;

                  return (
                    <div key={note.id}>
                      <HorizontalDivider />
                      <div
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`grid items-center h-[38px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                          selectedNoteId === note.id
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
                            onChange={() => toggleSelect(note.id)}
                          />
                        </div>

                        {/* Title */}
                        <div
                          className="truncate text-[#122232]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {note.title}
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

                        {/* Visibility */}
                        <div className="flex items-center justify-center">
                          <VisIcon
                            size={14}
                            weight="duotone"
                            className={note.visibility === "privada" ? "text-[#917822]" : "text-[#4E6987]"}
                          />
                        </div>

                        {/* Related to */}
                        <div className="flex items-center gap-[4px] truncate">
                          {note.relatedToName ? (
                            <>
                              <span
                                className="text-[#98989d] shrink-0"
                                style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                              >
                                {relatedTypeLabels[note.relatedToType] || ""}
                              </span>
                              <span
                                className="truncate text-[#0483AB]"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                              >
                                {note.relatedToName}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
                          )}
                        </div>

                        {/* Owner */}
                        <OwnerCell ownerId={note.owner} />

                        {/* Updated at */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatRelativeDate(note.updatedAt)}
                        </div>

                        {/* Created at */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatRelativeDate(note.createdAt)}
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
      {filteredNotes.length > ROWS_PER_PAGE && (
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
              toast.success(`${selectedIds.size} nota(s) arquivada(s)`);
              setNotes((prev) =>
                prev.map((n) =>
                  selectedIds.has(n.id)
                    ? { ...n, status: "arquivada" as NoteStatus, updatedAt: new Date().toISOString().slice(0, 10) }
                    : n
                )
              );
              selectedIds.forEach((id) => {
                patchActivity(id, { status: "arquivada" }).catch(console.error);
              });
              setSelectedIds(new Set());
            }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-[#EAC23D] transition-colors cursor-pointer"
          >
            <Archive size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>ARQUIVAR</span>
          </button>
          <button
            onClick={() => {
              toast(`Excluir ${selectedIds.size} nota(s) (em breve)`);
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
        {selectedNote && (
          <motion.div
            key={selectedNote.id}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[320px] h-full">
              <NoteDetailPanel
                note={selectedNote}
                onClose={() => setSelectedNoteId(null)}
                onStatusChange={handleStatusChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
