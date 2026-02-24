import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  SketchLogo,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatCircleDots,
  Phone,
  CalendarBlank,
  Building,
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
  Link as LinkIcon,
  ArrowSquareDownRight,
  Columns,
  Table,
  Kanban,
  GearSix,
  PushPin,
  Bell,
  Info,
  Presentation,
  Sigma,
  ClipboardText,
  UsersThree,
  CheckCircle,
  CurrencyCircleDollar,
  ChartLineUp,
  TrendUp,
  Target,
  Timer,
  Hourglass,
  User,
  UserCircle,
  XCircle,
  ClockClockwise,
  ClockCounterClockwise,
  Funnel,
  FunnelSimple,
  X,
  FloppyDisk,
  CaretUp,
  Check,
  SealCheck,
  Money,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { RelativeDatePicker } from "./relative-date-picker";
import type { DateRange } from "./relative-date-engine";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import {
  listOpportunities,
  patchOpportunity,
  seedCrmData,
  dbOpToFrontend,
  frontendOpToDb,
  generateCrmId,
  listAccounts,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type OpStage = "apresentacao" | "dimensionamento" | "proposta" | "negociacao" | "ganho" | "perdido" | "op_futura";
type OpTipo = "novo_negocio" | "upsell" | "cross_sell" | "renovacao";

const OP_TIPO_LABELS: Record<OpTipo, string> = {
  novo_negocio: "Novo Negócio",
  upsell: "Upsell",
  cross_sell: "Cross-sell",
  renovacao: "Renovação",
};

interface Opportunity {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: OpStage;
  lastActivityDate: string;
  comments: number;
  calls: number;
  owner: string;
  closeDate: string;
  tipo: OpTipo;
  stageComplement: string;
  createdDate: string;
}

/* --- Filter / Saved‑View types --- */

type FilterField = "tipo" | "stage" | "stageComplement" | "value" | "lastActivityDate" | "owner" | "createdDate" | "viewMode";

interface FilterCondition {
  field: FilterField;
  values: string[];
  rangeMin?: number;
  rangeMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface SavedView {
  id: string;
  name: string;
  filters: FilterCondition[];
  viewMode?: "kanban" | "tabela";
}

const FILTER_FIELDS: { key: FilterField; label: string }[] = [
  { key: "tipo", label: "TIPO DE OP" },
  { key: "stage", label: "ESTÁGIO" },
  { key: "stageComplement", label: "COMPLEMENTO" },
  { key: "value", label: "VALOR" },
  { key: "lastActivityDate", label: "ÚLT. ATIVIDADE" },
  { key: "owner", label: "PROPRIETÁRIO" },
  { key: "createdDate", label: "DATA CRIAÇÃO" },
  { key: "viewMode", label: "VISUALIZAÇÃO" },
];

const STAGE_COMPLEMENT_OPTIONS = [
  "Aguardando retorno",
  "Em análise",
  "Pendente aprovação",
  "Reunião agendada",
  "Sem resposta",
  "Follow-up enviado",
];

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const TOUCH_BACKEND_OPTIONS = { enableMouseEvents: true };
const OP_CARD_TYPE = "OP_CARD";
const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

interface StageConfig {
  label: string;
  bg: string;
  color: string;
  icon: React.ComponentType<{ size?: number; weight?: "fill" | "duotone" | "bold" }>;
}

const stageConfig: Record<OpStage, StageConfig> = {
  apresentacao:     { label: "APRESENTAÇÃO",     bg: "#dde3ec", color: "#28415c", icon: Presentation },
  dimensionamento:  { label: "DIMENSIONAMENTO",  bg: "#dde3ec", color: "#28415c", icon: Sigma },
  proposta:         { label: "PROPOSTA",          bg: "#dde3ec", color: "#28415c", icon: ClipboardText },
  negociacao:       { label: "NEGOCIAÇÃO",        bg: "#dde3ec", color: "#28415c", icon: UsersThree },
  ganho:            { label: "GANHO",             bg: "#d9f8ef", color: "#20b48d", icon: CheckCircle },
  perdido:          { label: "PERDIDO",           bg: "#ffedeb", color: "#ED5200", icon: XCircle },
  op_futura:        { label: "OP FUTURA",         bg: "#e8e8fd", color: "#8c8cd4", icon: ClockClockwise },
};

const STAGES_OPEN: OpStage[] = ["apresentacao", "dimensionamento", "proposta", "negociacao", "ganho"];
const STAGES_CLOSED: OpStage[] = ["perdido", "op_futura"];
const ALL_STAGES: OpStage[] = [...STAGES_OPEN, ...STAGES_CLOSED];

/** Weighted probability per stage (for "Valor Ponderado") */
const STAGE_WEIGHT: Record<OpStage, number> = {
  apresentacao: 0.2,
  dimensionamento: 0.4,
  proposta: 0.6,
  negociacao: 0.8,
  ganho: 1.0,
  perdido: 0,
  op_futura: 0,
};

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const mockOpportunities: Opportunity[] = [
  { id: "OP-A1B2", name: "Projeto Alpha", company: "XPTO Company", value: 12000, stage: "apresentacao", lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "João Silva", closeDate: "2026-03-15", tipo: "novo_negocio", stageComplement: "Reunião agendada", createdDate: "2025-11-10" },
  { id: "OP-C3D4", name: "Rebrand Beta", company: "Beta Solutions", value: 25000, stage: "apresentacao", lastActivityDate: "2026-01-15", comments: 1, calls: 0, owner: "Maria Oliveira", closeDate: "2026-04-01", tipo: "upsell", stageComplement: "Aguardando retorno", createdDate: "2025-12-05" },
  { id: "OP-E5F6", name: "Campanha Gamma", company: "Gamma Corp", value: 8500, stage: "dimensionamento", lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Pedro Costa", closeDate: "2026-03-20", tipo: "novo_negocio", stageComplement: "Em análise", createdDate: "2025-12-15" },
  { id: "OP-G7H8", name: "Performance Delta", company: "Delta Tech", value: 34000, stage: "dimensionamento", lastActivityDate: "2026-02-01", comments: 3, calls: 2, owner: "Ana Paula", closeDate: "2026-05-10", tipo: "cross_sell", stageComplement: "Pendente aprovação", createdDate: "2026-01-02" },
  { id: "OP-J9K1", name: "SEO Epsilon", company: "Epsilon Ltda", value: 15000, stage: "proposta", lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Carlos Pereira", closeDate: "2026-03-30", tipo: "novo_negocio", stageComplement: "Follow-up enviado", createdDate: "2025-11-20" },
  { id: "OP-L2M3", name: "Social Media Zeta", company: "Zeta Inc", value: 9200, stage: "proposta", lastActivityDate: "2026-01-20", comments: 4, calls: 1, owner: "Fernanda Santos", closeDate: "2026-04-15", tipo: "renovacao", stageComplement: "Em análise", createdDate: "2025-12-28" },
  { id: "OP-N4P5", name: "Branding Theta", company: "Theta SA", value: 42000, stage: "negociacao", lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Rafael Alves", closeDate: "2026-05-01", tipo: "novo_negocio", stageComplement: "Reunião agendada", createdDate: "2025-10-15" },
  { id: "OP-Q6R7", name: "Ads Iota", company: "Iota Group", value: 18500, stage: "negociacao", lastActivityDate: "2026-02-10", comments: 5, calls: 3, owner: "Juliana Ferreira", closeDate: "2026-04-20", tipo: "upsell", stageComplement: "Sem resposta", createdDate: "2026-01-10" },
  { id: "OP-S8T9", name: "Website Kappa", company: "Kappa Digital", value: 55000, stage: "ganho", lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Lucas Souza", closeDate: "2026-02-28", tipo: "novo_negocio", stageComplement: "Aguardando retorno", createdDate: "2025-09-01" },
  { id: "OP-U1V2", name: "Mídia Lambda", company: "Lambda Media", value: 7800, stage: "apresentacao", lastActivityDate: "2026-02-15", comments: 0, calls: 1, owner: "Camila Ribeiro", closeDate: "2026-06-01", tipo: "cross_sell", stageComplement: "Follow-up enviado", createdDate: "2026-02-01" },
  { id: "OP-W3X4", name: "Design Mu", company: "Mu Design", value: 31000, stage: "dimensionamento", lastActivityDate: "2026-01-28", comments: 2, calls: 1, owner: "Rafaela Costa", closeDate: "2026-05-20", tipo: "renovacao", stageComplement: "Pendente aprovação", createdDate: "2025-11-05" },
  { id: "OP-Y5Z6", name: "Consulting Nu", company: "Nu Corp", value: 22000, stage: "ganho", lastActivityDate: "2026-02-05", comments: 1, calls: 2, owner: "João Pedro", closeDate: "2026-03-10", tipo: "upsell", stageComplement: "Em análise", createdDate: "2025-10-20" },
  { id: "OP-B7C8", name: "Portal Omicron", company: "Omicron Labs", value: 19500, stage: "perdido", lastActivityDate: "2026-01-05", comments: 3, calls: 2, owner: "Maria Oliveira", closeDate: "2026-02-15", tipo: "novo_negocio", stageComplement: "Sem resposta", createdDate: "2025-08-15" },
  { id: "OP-D9E1", name: "Infra Pi", company: "Pi Systems", value: 46000, stage: "perdido", lastActivityDate: "2025-12-20", comments: 1, calls: 4, owner: "Rafael Alves", closeDate: "2026-01-30", tipo: "renovacao", stageComplement: "Aguardando retorno", createdDate: "2025-07-10" },
  { id: "OP-F2G3", name: "App Rho", company: "Rho Mobile", value: 28000, stage: "op_futura", lastActivityDate: "2026-02-18", comments: 0, calls: 1, owner: "Ana Paula", closeDate: "2026-08-01", tipo: "novo_negocio", stageComplement: "Reunião agendada", createdDate: "2026-01-25" },
  { id: "OP-H4J5", name: "Analytics Sigma", company: "Sigma Data", value: 13500, stage: "op_futura", lastActivityDate: "2026-02-12", comments: 2, calls: 0, owner: "Carlos Pereira", closeDate: "2026-09-15", tipo: "cross_sell", stageComplement: "Em análise", createdDate: "2026-02-08" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace(".", ",")} mil`;
  return formatCurrency(value);
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
  } catch {
    return iso;
  }
}

function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 30) return `Há ${diffDays} dias`;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Small reusable pieces                                              */
/* ------------------------------------------------------------------ */

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

function HorizontalDivider() {
  return (
    <div className="h-0 relative w-full">
      <div className="absolute inset-[-0.75px_0_0_0]">
        <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
          <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter helpers                                                     */
/* ------------------------------------------------------------------ */

function getPicklistOptions(field: FilterField, ops: Opportunity[]): { value: string; label: string }[] {
  switch (field) {
    case "tipo":
      return (Object.keys(OP_TIPO_LABELS) as OpTipo[]).map((k) => ({ value: k, label: OP_TIPO_LABELS[k] }));
    case "stage":
      return ALL_STAGES.map((s) => ({ value: s, label: stageConfig[s].label }));
    case "stageComplement":
      return STAGE_COMPLEMENT_OPTIONS.map((s) => ({ value: s, label: s }));
    case "owner": {
      const unique = [...new Set(ops.map((o) => o.owner))].sort();
      return unique.map((o) => ({ value: o, label: o }));
    }
    case "viewMode":
      return [
        { value: "kanban", label: "Kanban" },
        { value: "tabela", label: "Tabela" },
      ];
    default:
      return [];
  }
}

function isPicklistField(f: FilterField): boolean {
  return ["tipo", "stage", "stageComplement", "owner", "viewMode"].includes(f);
}

function isValueField(f: FilterField): boolean {
  return f === "value";
}

function isDateField(f: FilterField): boolean {
  return f === "lastActivityDate" || f === "createdDate";
}

function applyFilters(ops: Opportunity[], filters: FilterCondition[]): Opportunity[] {
  if (filters.length === 0) return ops;
  return ops.filter((op) =>
    filters.every((fc) => {
      // viewMode is a UI preference, not a data filter
      if (fc.field === "viewMode") return true;
      if (isPicklistField(fc.field) && fc.values.length > 0) {
        const opVal = String(op[fc.field as keyof Opportunity]);
        return fc.values.includes(opVal);
      }
      if (isValueField(fc.field)) {
        if (fc.rangeMin !== undefined && op.value < fc.rangeMin) return false;
        if (fc.rangeMax !== undefined && op.value > fc.rangeMax) return false;
        return true;
      }
      if (isDateField(fc.field)) {
        const opDate = op[fc.field as keyof Opportunity] as string;
        if (fc.dateFrom && opDate < fc.dateFrom) return false;
        if (fc.dateTo && opDate > fc.dateTo) return false;
        return true;
      }
      return true;
    })
  );
}

function filterConditionLabel(fc: FilterCondition): string {
  const fieldDef = FILTER_FIELDS.find((f) => f.key === fc.field);
  const prefix = fieldDef?.label ?? fc.field;
  if (isPicklistField(fc.field) && fc.values.length > 0) {
    if (fc.field === "tipo") {
      const labels = fc.values.map((v) => OP_TIPO_LABELS[v as OpTipo] ?? v);
      return `${prefix}: ${labels.join(", ")}`;
    }
    if (fc.field === "stage") {
      const labels = fc.values.map((v) => stageConfig[v as OpStage]?.label ?? v);
      return `${prefix}: ${labels.join(", ")}`;
    }
    if (fc.field === "viewMode") {
      const modeLabels: Record<string, string> = { kanban: "Kanban", tabela: "Tabela" };
      const labels = fc.values.map((v) => modeLabels[v] ?? v);
      return `${prefix}: ${labels.join(", ")}`;
    }
    return `${prefix}: ${fc.values.join(", ")}`;
  }
  if (isValueField(fc.field)) {
    const parts: string[] = [];
    if (fc.rangeMin !== undefined) parts.push(`≥ ${formatCurrency(fc.rangeMin)}`);
    if (fc.rangeMax !== undefined) parts.push(`≤ ${formatCurrency(fc.rangeMax)}`);
    return `${prefix}: ${parts.join(" e ")}`;
  }
  if (isDateField(fc.field)) {
    // Show the relative date literal if available (stored in values[0])
    if (fc.values?.[0]) {
      return `${prefix}: ${fc.values[0]}`;
    }
    // Format exact dates as dd/mm/yyyy
    const fmtDate = (d: string) => {
      const [y, m, day] = d.split("-");
      return `${day}/${m}/${y}`;
    };
    if (fc.dateFrom && fc.dateTo) return `${prefix}: ${fmtDate(fc.dateFrom)} → ${fmtDate(fc.dateTo)}`;
    if (fc.dateFrom) return `${prefix}: a partir de ${fmtDate(fc.dateFrom)}`;
    if (fc.dateTo) return `${prefix}: até ${fmtDate(fc.dateTo)}`;
    return prefix;
  }
  return prefix;
}

/* ------------------------------------------------------------------ */
/*  FilterDropdownPill                                                 */
/* ------------------------------------------------------------------ */

function FilterDropdownPill({
  fieldDef,
  condition,
  onChange,
  ops,
}: {
  fieldDef: { key: FilterField; label: string };
  condition: FilterCondition | undefined;
  onChange: (fc: FilterCondition) => void;
  ops: Opportunity[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const f = fieldDef.key;
  const hasValue =
    (condition?.values && condition.values.length > 0) ||
    condition?.rangeMin !== undefined ||
    condition?.rangeMax !== undefined ||
    condition?.dateFrom ||
    condition?.dateTo;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const singleSelect = f === "viewMode";

  const toggleValue = (val: string) => {
    const current = condition?.values ?? [];
    const next = singleSelect
      ? (current.includes(val) ? [] : [val])
      : (current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
    onChange({ field: f, values: next, rangeMin: condition?.rangeMin, rangeMax: condition?.rangeMax, dateFrom: condition?.dateFrom, dateTo: condition?.dateTo });
  };

  /* ── date fields → use RelativeDatePicker (relative + exact) ── */
  if (isDateField(f)) {
    const literal = condition?.values?.[0] ?? "";
    const isExactMode = !literal && !!(condition?.dateFrom || condition?.dateTo);
    return (
      <RelativeDatePicker
        value={literal || undefined}
        onSelect={(lit: string, range: DateRange) => {
          const fmt = (d: Date) => d.toISOString().slice(0, 10);
          onChange({
            field: f,
            values: [lit],
            dateFrom: fmt(range.start),
            dateTo: fmt(range.end),
          });
        }}
        onClear={() =>
          onChange({
            field: f,
            values: [],
            dateFrom: undefined,
            dateTo: undefined,
          })
        }
        exactDateFrom={condition?.dateFrom}
        exactDateTo={condition?.dateTo}
        onExactRangeChange={(from, to) => {
          onChange({
            field: f,
            values: [],
            dateFrom: from,
            dateTo: to,
          });
        }}
        filterBar
        placeholder={fieldDef.label}
        triggerIcon={f === "createdDate" ? CalendarBlank : ClockCounterClockwise}
      />
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] transition-colors cursor-pointer whitespace-nowrap ${
          hasValue
            ? "bg-[#07abde] text-white"
            : "bg-[#f6f7f9] text-[#28415c] hover:bg-[#dcf0ff]"
        }`}
      >
        {singleSelect && hasValue && condition?.values[0] === "kanban" && <Kanban size={13} weight="fill" />}
        {singleSelect && hasValue && condition?.values[0] === "tabela" && <Table size={13} weight="bold" />}
        {f === "stage" && <SealCheck size={13} weight={hasValue ? "fill" : "bold"} />}
        {f === "value" && <CurrencyCircleDollar size={13} weight={hasValue ? "fill" : "bold"} />}
        {f === "owner" && <UserCircle size={13} weight={hasValue ? "fill" : "bold"} />}
        {f === "createdDate" && <CalendarBlank size={13} weight={hasValue ? "fill" : "bold"} />}
        <span
          className="font-bold uppercase tracking-[0.5px]"
          style={{ fontSize: 10, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
        >
          {singleSelect && hasValue ? (condition?.values[0] === "kanban" ? "KANBAN" : "TABELA") : fieldDef.label}
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

          {isPicklistField(f) && (
            <div className="flex flex-col gap-[2px] max-h-[240px] overflow-y-auto">
              {getPicklistOptions(f, ops).map((opt) => {
                const checked = condition?.values?.includes(opt.value) ?? false;
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleValue(opt.value)}
                    className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left w-full"
                  >
                    <div className={`size-[14px] ${singleSelect ? "rounded-full" : "rounded-[4px]"} border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "border-[#23E6B2] bg-[#23E6B2]" : "border-[#98989d] bg-transparent"
                    }`}>
                      {checked && (
                        singleSelect
                          ? <div className="size-[6px] rounded-full bg-white" />
                          : <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3.25 5.75L6.5 2.25" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                      )}
                    </div>
                    <span
                      className="text-[#28415c]"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {isValueField(f) && (
            <div className="flex flex-col gap-[8px] px-[6px] py-[4px]">
              <label className="text-[#98989d] uppercase text-[9px] font-bold tracking-[0.5px]">Mín</label>
              <input
                type="number"
                value={condition?.rangeMin ?? ""}
                onChange={(e) =>
                  onChange({
                    field: f,
                    values: [],
                    rangeMin: e.target.value ? Number(e.target.value) : undefined,
                    rangeMax: condition?.rangeMax,
                  })
                }
                placeholder="0"
                className="h-[34px] px-[10px] rounded-[10px] border border-[#dde3ec] text-[#28415c] text-[13px] outline-none focus:border-[#07abde] transition-colors"
              />
              <label className="text-[#98989d] uppercase text-[9px] font-bold tracking-[0.5px]">Máx</label>
              <input
                type="number"
                value={condition?.rangeMax ?? ""}
                onChange={(e) =>
                  onChange({
                    field: f,
                    values: [],
                    rangeMin: condition?.rangeMin,
                    rangeMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="∞"
                className="h-[34px] px-[10px] rounded-[10px] border border-[#dde3ec] text-[#28415c] text-[13px] outline-none focus:border-[#07abde] transition-colors"
              />
            </div>
          )}

          {/* Date fields are handled by RelativeDatePicker in early return above */}
        </div>
      )}
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
          checked ? "border-[#3ccea7] bg-[#3ccea7]" : "border-[#c8cfdb] bg-transparent backdrop-blur-[20px]"
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
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [160, 137, 120, 130, 136, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "OPORTUNIDADE",
  "EMPRESA",
  "ESTÁGIO",
  "VALOR",
  "PROPRIETÁRIO",
  "ÚLTIMA ATIVIDADE",
];

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

const stageTableLabel: Record<OpStage, string> = {
  apresentacao: "Apresentação",
  dimensionamento: "Dimensionamento",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
  op_futura: "Op Futura",
};

/* ------------------------------------------------------------------ */
/*  Op Card Content                                                    */
/* ------------------------------------------------------------------ */

function OpCardContent({
  op,
  activeMenu,
  setActiveMenu,
  menuRef,
  navigate,
  isSelected,
  onToggleSelect,
}: {
  op: Opportunity;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  navigate: ReturnType<typeof useNavigate>;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  return (
    <>
      {/* Name + menu */}
      <div className="flex items-start justify-between gap-1 mb-[6px]">
        <p
          className="text-[#122232] truncate flex-1"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {op.name}
        </p>
        <div className="flex items-center gap-[2px]">
          {/* Selection checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(op.id); }}
            className={`p-0.5 rounded-full hover:bg-[#DDE3EC] transition-colors cursor-pointer ${
              isSelected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
            }`}
          >
            <div className={`size-[14px] rounded-full border-[1.5px] transition-colors flex items-center justify-center ${
              isSelected ? "border-[#23E6B2] bg-[#23E6B2]" : "border-[#c8cfdb] bg-transparent"
            }`}>
              {isSelected && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3.25 5.75L6.5 2.25" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
          {/* Dots menu */}
          <div className="relative" ref={activeMenu === op.id ? menuRef : undefined}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === op.id ? null : op.id);
              }}
              className="p-0.5 rounded-full hover:bg-[#DDE3EC] transition-colors opacity-0 group-hover/card:opacity-100 cursor-pointer"
            >
              <DotsThree size={14} className="text-[#4E6987]" weight="bold" />
            </button>
          {activeMenu === op.id && (
            <div className="absolute right-0 top-6 z-30 backdrop-blur-[50px] bg-white flex flex-col gap-[2px] items-start p-[8px] rounded-[20px] min-w-[160px]">
              <div
                aria-hidden="true"
                className="absolute border-[1.4px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]"
                style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); navigate(`/crm/oportunidades/${op.id}`); }}
                className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[28px]"><Eye size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Visualizar</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); toast("Editar oportunidade (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[28px]"><PencilSimple size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Editar</span>
              </button>
              <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); toast("Excluir oportunidade (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#ED5200] hover:bg-[#FFEDEB] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[28px]"><Trash size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Excluir</span>
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Company */}
      <div className="flex items-center gap-[6px] mb-[2px]">
        <Building size={13} weight="duotone" className="text-[#98989d] shrink-0" />
        <span
          className="text-[#4e6987] truncate"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
        >
          {op.company}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-[6px] mb-[12px]">
        <CurrencyCircleDollar size={13} weight="duotone" className="text-[#98989d] shrink-0" />
        <span
          className="text-[#4e6987] truncate"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
        >
          {formatCurrency(op.value)}
        </span>
      </div>

      {/* Owner + Close date row */}
      <div className="flex items-center gap-[10px] mb-[8px]">
        <div className="flex items-center gap-[4px] min-w-0 flex-1">
          <UserCircle size={12} weight="duotone" className="text-[#98989d] shrink-0" />
          <span
            className="text-[#98989d] truncate"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, lineHeight: "14px", ...fontFeature }}
          >
            {op.owner}
          </span>
        </div>
        <div className="flex items-center gap-[4px] shrink-0">
          <CalendarBlank size={12} weight="duotone" className="text-[#98989d]" />
          <span
            className="text-[#98989d]"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, lineHeight: "14px", ...fontFeature }}
          >
            {formatShortDate(op.closeDate)}
          </span>
        </div>
      </div>

      {/* Thin separator */}
      <div className="h-[1px] bg-[#f0f2f5] mb-[8px]" />

      {/* Activity footer */}
      <div className="flex items-center justify-between">
        <span
          className="text-[#98989d] uppercase"
          style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
        >
          Atividades
        </span>
        <div className="flex items-center gap-[5px]">
          <div className="flex items-center gap-0">
            <CalendarBlank size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {formatShortDate(op.lastActivityDate)}
            </span>
          </div>
          <div className="flex items-center gap-[2px]">
            <ChatCircleDots size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {op.comments}
            </span>
          </div>
          <div className="flex items-center gap-[2px]">
            <Phone size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {op.calls}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  DnD: Draggable Op Card                                             */
/* ------------------------------------------------------------------ */

interface DragItem {
  id: string;
  fromStage: OpStage;
  op: Opportunity;
}

function DraggableOpCard({
  op,
  navigate,
  activeMenu,
  setActiveMenu,
  menuRef,
  isSelected,
  onToggleSelect,
}: {
  op: Opportunity;
  navigate: ReturnType<typeof useNavigate>;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: OP_CARD_TYPE,
    item: { id: op.id, fromStage: op.stage, op },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  if (isDragging) {
    return (
      <div
        className="rounded-[16px] border-[1.5px] border-dashed border-[#98989d] bg-[#dde3ec]"
        style={{ minHeight: 110, padding: 12, opacity: 0.5 }}
      >
        <div style={{ visibility: "hidden" }}>
          <OpCardContent op={op} activeMenu={null} setActiveMenu={() => {}} menuRef={menuRef} navigate={navigate} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(node) => { dragRef(node); }}
      onClick={() => navigate(`/crm/oportunidades/${op.id}`)}
      className={`bg-white p-[12px] cursor-grab hover:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] transition-all active:bg-[#F6F7F9] group/card rounded-[16px] active:cursor-grabbing ${
        isSelected ? "ring-2 ring-[#23E6B2] ring-inset" : ""
      }`}
    >
      <OpCardContent op={op} activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuRef={menuRef} navigate={navigate} isSelected={isSelected} onToggleSelect={onToggleSelect} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DnD: Droppable Column                                              */
/* ------------------------------------------------------------------ */

function DroppableColumn({
  stage,
  children,
  onDrop,
  collapsed,
}: {
  stage: OpStage;
  children: React.ReactNode;
  onDrop: (item: DragItem, newStage: OpStage) => void;
  collapsed?: boolean;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: OP_CARD_TYPE,
    canDrop: (item) => item.fromStage !== stage,
    drop: (item) => { onDrop(item, stage); },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  return (
    <div
      ref={(node) => { dropRef(node); }}
      className={`flex flex-col shrink-0 overflow-hidden transition-all ${
        collapsed ? "min-w-0 flex-none" : "min-w-[216px] flex-1"
      } ${
        isOver && canDrop ? "ring-2 ring-[#23E6B2] ring-inset rounded-xl" : ""
      }`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DnD: Custom Drag Layer                                             */
/* ------------------------------------------------------------------ */

function CustomDragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem() as DragItem | null,
    currentOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !item || !currentOffset) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ left: 0, top: 0 }}>
      <div
        style={{
          position: "absolute",
          left: currentOffset.x - 100,
          top: currentOffset.y - 60,
          width: 200,
          transform: "rotate(2.53deg)",
        }}
      >
        <div className="bg-white p-3 rounded-[16px]" style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}>
          <p className="text-[#122232] truncate" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.5, ...fontFeature }}>{item.op.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Building size={11} weight="duotone" className="text-[#98989d]" />
            <span className="text-[#4e6987]" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>{item.op.company}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <CurrencyCircleDollar size={11} weight="duotone" className="text-[#98989d]" />
            <span className="text-[#4e6987]" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>{formatCurrency(item.op.value)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stage Column Header Pill                                           */
/* ------------------------------------------------------------------ */

function StageHeaderPill({ stage }: { stage: OpStage }) {
  const config = stageConfig[stage];
  const Icon = config.icon;
  return (
    <div
      className="flex items-center justify-center gap-[4px] h-[40px] px-[12px] rounded-[500px] whitespace-nowrap w-full"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon size={16} weight="duotone" />
      <span
        className="uppercase tracking-[1px]"
        style={{ fontSize: 13, fontWeight: 700, ...fontFeature }}
      >
        {config.label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmOpportunities() {
  const navigate = useNavigate();
  const { query: globalSearch } = useCrmSearch();
  const [ops, setOps] = useState<Opportunity[]>(mockOpportunities);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "tabela">("kanban");
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showLost, setShowLost] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [collapsedStages, setCollapsedStages] = useState<Set<OpStage>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* ── Filter / Saved Views state ── */
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterCondition[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [savingViewName, setSavingViewName] = useState(false);
  const [viewNameInput, setViewNameInput] = useState("");
  const filterPanelRef = useRef<HTMLDivElement>(null);

  /* ── Load data from Supabase ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        /* Fetch opportunities + accounts in parallel */
        const [dbRows, acctRows] = await Promise.all([
          listOpportunities(),
          listAccounts(),
        ]);
        if (cancelled) return;

        const acctMap = Object.fromEntries(
          acctRows.map((a: any) => [a.id, a.name]),
        );

        if (dbRows.length === 0) {
          /* Show mock data immediately while seeding in background */
          setOps(mockOpportunities);
          setLoading(false);

          /* ── Map company names → account IDs (FK) ── */
          const companyToAccountId: Record<string, string> = {
            "XPTO Company": "AC-A1B2",
            "Beta Solutions": "AC-C3D4",
            "Gamma Corp": "AC-E5F6",
            "Delta Tech": "AC-G7H8",
            "Epsilon Ltda": "AC-J9K1",
            "Zeta Inc": "AC-L2M3",
            "Theta SA": "AC-N4P5",
            "Iota Group": "AC-Q6R7",
            "Kappa Digital": "AC-S8T9",
            "Empresa Alpha": "AC-0EA1",
            "Lambda Media": "AC-LM01",
            "Mu Design": "AC-MD02",
            "Nu Corp": "AC-NC03",
            "Omicron Labs": "AC-OL04",
            "Pi Systems": "AC-PS05",
            "Rho Mobile": "AC-RM06",
            "Sigma Data": "AC-SD07",
          };

          const accountSeedRows = Object.entries(companyToAccountId).map(
            ([name, acId]) => ({
              id: acId,
              name,
              type: "empresa",
              stage: "prospeccao",
              owner: "João Silva",
            }),
          );

          const seedRows = mockOpportunities.map((op) => ({
            id: op.id,
            name: op.name,
            company: companyToAccountId[op.company] ?? null,
            value: op.value,
            stage: op.stage,
            last_activity_date: op.lastActivityDate || null,
            comments: op.comments,
            calls: op.calls,
            owner: op.owner,
            close_date: op.closeDate || null,
            tipo: op.tipo,
            stage_complement: op.stageComplement || null,
            created_at: op.createdDate ? new Date(op.createdDate).toISOString() : new Date().toISOString(),
          }));

          /* Seed in background — UI already shows mock data */
          seedCrmData({
            crm_accounts: accountSeedRows,
            crm_opportunities: seedRows,
          }).catch((err) => console.error("Background seed error:", err));

          return; // loading already set to false above
        }

        /* ── Data exists — map account IDs → names ── */
        setOps(dbRows.map((r) => {
          const mapped = dbOpToFrontend(r);
          mapped.company = acctMap[r.company] ?? mapped.company;
          return mapped;
        }));
      } catch (err) {
        // Network error — mock data is already displayed, just log
        console.warn("Could not load opportunities from server, using local data:", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateDraftFilter = useCallback((fc: FilterCondition) => {
    setDraftFilters((prev) => {
      const idx = prev.findIndex((c) => c.field === fc.field);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fc;
        return next;
      }
      return [...prev, fc];
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    // Remove empty conditions
    const cleaned = draftFilters.filter((fc) => {
      if (isPicklistField(fc.field)) return fc.values.length > 0;
      if (isValueField(fc.field)) return fc.rangeMin !== undefined || fc.rangeMax !== undefined;
      if (isDateField(fc.field)) return !!fc.dateFrom || !!fc.dateTo;
      return false;
    });
    // Extract viewMode preference
    const vmCondition = cleaned.find((fc) => fc.field === "viewMode");
    if (vmCondition && vmCondition.values.length > 0) {
      setViewMode(vmCondition.values[0] as "kanban" | "tabela");
    }
    // Data filters (exclude viewMode)
    const dataFilters = cleaned.filter((fc) => fc.field !== "viewMode");
    setActiveFilters(dataFilters);
    setActiveViewId(null);
    const hasChanges = dataFilters.length > 0 || vmCondition;
    if (hasChanges) {
      setIsFilterPanelOpen(false);
      const parts: string[] = [];
      if (dataFilters.length > 0) parts.push(`${dataFilters.length} filtro(s)`);
      if (vmCondition) parts.push(vmCondition.values[0] === "kanban" ? "Kanban" : "Tabela");
      toast.success(`Aplicado: ${parts.join(" · ")}`);
    } else {
      toast("Nenhum filtro selecionado");
    }
  }, [draftFilters]);

  const handleSaveView = useCallback(() => {
    if (!viewNameInput.trim()) return;
    const cleaned = draftFilters.filter((fc) => {
      if (isPicklistField(fc.field)) return fc.values.length > 0;
      if (isValueField(fc.field)) return fc.rangeMin !== undefined || fc.rangeMax !== undefined;
      if (isDateField(fc.field)) return !!fc.dateFrom || !!fc.dateTo;
      return false;
    });
    // Extract viewMode preference
    const vmCondition = cleaned.find((fc) => fc.field === "viewMode");
    const savedViewMode = vmCondition?.values[0] as "kanban" | "tabela" | undefined;
    // Data filters (exclude viewMode)
    const dataFilters = cleaned.filter((fc) => fc.field !== "viewMode");
    if (dataFilters.length === 0 && !savedViewMode) {
      toast("Adicione pelo menos um filtro antes de salvar");
      return;
    }
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name: viewNameInput.trim(),
      filters: dataFilters,
      viewMode: savedViewMode,
    };
    setSavedViews((prev) => [...prev, newView]);
    setActiveFilters(dataFilters);
    if (savedViewMode) setViewMode(savedViewMode);
    setActiveViewId(newView.id);
    setIsFilterPanelOpen(false);
    setSavingViewName(false);
    setViewNameInput("");
    toast.success(`Visão "${newView.name}" salva`);
  }, [draftFilters, viewNameInput]);

  const handleSelectView = useCallback((view: SavedView) => {
    setActiveViewId(view.id);
    setActiveFilters(view.filters);
    // Rebuild draft: data filters + viewMode condition
    const draft = [...view.filters];
    if (view.viewMode) {
      draft.push({ field: "viewMode", values: [view.viewMode] });
      setViewMode(view.viewMode);
    }
    setDraftFilters(draft);
  }, []);

  const handleDeleteView = useCallback((viewId: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
    if (activeViewId === viewId) {
      setActiveViewId(null);
      setActiveFilters([]);
      setDraftFilters([]);
    }
    toast("Visão removida");
  }, [activeViewId]);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setDraftFilters([]);
    setActiveViewId(null);
  }, []);

  /* ── Table state ── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  /* ── Filtered ops (applies active filter conditions + global search) ── */
  const filteredOps = useMemo(() => {
    let result = applyFilters(ops, activeFilters);
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter((o) =>
        o.name.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.owner.toLowerCase().includes(q) ||
        OP_TIPO_LABELS[o.tipo].toLowerCase().includes(q)
      );
    }
    return result;
  }, [ops, activeFilters, globalSearch]);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredOps.length / ROWS_PER_PAGE));
  const paginated = filteredOps.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  /* ── Column resize handlers ── */
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
      setSelectedIds(new Set(paginated.map((o) => o.id)));
    }
  };

  const visibleStages: OpStage[] = showLost ? ALL_STAGES : STAGES_OPEN;
  // Filter ops shown in kanban — hide lost stages when not showing them
  const visibleOps = showLost ? filteredOps : filteredOps.filter((o) => !STAGES_CLOSED.includes(o.stage));

  const toggleCardSelect = (id: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const handleDrop = (item: DragItem, newStage: OpStage) => {
    if (item.fromStage === newStage) return;
    setOps((prev) =>
      prev.map((o) => (o.id === item.id ? { ...o, stage: newStage } : o))
    );
    toast.success(`${item.op.name} movido para ${stageConfig[newStage].label}`);
    // Persist stage change to DB
    patchOpportunity(item.id, { stage: newStage }).catch((err) =>
      console.error("Error persisting stage change:", err)
    );
  };

  const toggleStageCollapse = (stage: OpStage) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#07abde] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando oportunidades...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ═══════ HEADER + TABS WRAPPER ═══════ */}
      <div className="bg-[#ffffff] rounded-[16px] p-[16px] pb-[12px] mb-[12px] shrink-0">
        {/* ═══════ HEADER ═══════ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
          {/* Left: title */}
          <div className="relative" ref={titleMenuRef}>
            <div
              onClick={() => setTitleMenuOpen((v) => !v)}
              className={`flex items-center gap-[10px] p-[12px] rounded-[100px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/title ${titleMenuOpen ? "bg-[#f6f7f9]" : ""}`}
            >
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#dcf0ff] group-hover/title:bg-[#dde3ec] transition-colors">
                <SketchLogo size={22} weight="duotone" className="text-[#07abde] group-hover/title:text-[#28415c] transition-colors" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span
                  className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]"
                  style={fontFeature}
                >
                  Pipes
                </span>
                <div className="flex items-center">
                  <span
                    className="text-[#28415c] text-[19px] font-bold tracking-[-0.5px] leading-[24px]"
                    style={fontFeature}
                  >
                    Oportunidades
                  </span>
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
                  onClick={() => { setTitleMenuOpen(false); toast("Configurações (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><GearSix size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Configurações</span>
                </button>
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Fixado nos atalhos!"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><PushPin size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Fixar nos Atalhos</span>
                </button>
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Notificações (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Bell size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Notificações</span>
                </button>
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Excluir (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Trash size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Excluir</span>
                </button>
                <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Detalhes (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Info size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Oportunidades</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="hidden lg:flex items-center gap-[15px]">
            <div className="flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
              <button className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                <LinkIcon size={18} />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                <ArrowSquareDownRight size={18} />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                <Columns size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ TABS ═══════ */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Segmented Control */}
          <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px]">
            <button
              onClick={() => { setViewMode("kanban"); setActiveViewId(null); setActiveFilters([]); setDraftFilters([]); }}
              className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                viewMode === "kanban" && !activeViewId
                  ? "text-[#f6f7f9]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
            >
              {viewMode === "kanban" && !activeViewId && (
                <>
                  <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                </>
              )}
              <Kanban size={14} weight={viewMode === "kanban" && !activeViewId ? "fill" : "regular"} className="relative z-[1]" />
              <span
                className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 10, ...fontFeature }}
              >
                KANBAN
              </span>
            </button>

            <button
              onClick={() => { setViewMode("tabela"); setActiveViewId(null); setActiveFilters([]); setDraftFilters([]); }}
              className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                viewMode === "tabela" && !activeViewId
                  ? "text-[#f6f7f9]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
            >
              {viewMode === "tabela" && !activeViewId && (
                <>
                  <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                </>
              )}
              <Table size={14} weight={viewMode === "tabela" && !activeViewId ? "fill" : "regular"} className="relative z-[1]" />
              <span
                className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 10, ...fontFeature }}
              >
                TABELA
              </span>
            </button>

            {/* Saved Views as tabs */}
            {savedViews.map((sv) => (
              <div
                key={sv.id}
                onClick={() => handleSelectView(sv)}
                role="button"
                tabIndex={0}
                className={`relative flex items-center gap-[5px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer group/sv select-none ${
                  activeViewId === sv.id
                    ? "text-[#f6f7f9]"
                    : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
                }`}
              >
                {activeViewId === sv.id && (
                  <>
                    <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                      style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                    />
                  </>
                )}
                {sv.viewMode === "tabela"
                  ? <Table size={12} weight={activeViewId === sv.id ? "fill" : "regular"} className="relative z-[1]" />
                  : sv.viewMode === "kanban"
                    ? <Kanban size={12} weight={activeViewId === sv.id ? "fill" : "regular"} className="relative z-[1]" />
                    : <Funnel size={12} weight={activeViewId === sv.id ? "fill" : "regular"} className="relative z-[1]" />
                }
                <span
                  className="relative z-[1] font-bold uppercase tracking-[0.5px] whitespace-nowrap"
                  style={{ fontSize: 10, ...fontFeature }}
                >
                  {sv.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteView(sv.id); }}
                  className={`relative z-[1] flex items-center justify-center size-[16px] rounded-full transition-colors cursor-pointer ${
                    activeViewId === sv.id
                      ? "hover:bg-white/20 text-white/70 hover:text-white"
                      : "opacity-0 group-hover/sv:opacity-100 hover:bg-[#dde3ec] text-[#98989d] hover:text-[#28415c]"
                  }`}
                >
                  <X size={9} weight="bold" />
                </button>
              </div>
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

          {/* + Filter button */}
          <button
            onClick={() => {
              setIsFilterPanelOpen((v) => !v);
              if (!isFilterPanelOpen) {
                const base = activeFilters.length > 0 ? [...activeFilters] : [];
                // Seed draft with current viewMode preference
                if (!base.find((c) => c.field === "viewMode")) {
                  base.push({ field: "viewMode", values: [viewMode] });
                }
                setDraftFilters(base);
                setSavingViewName(false);
              }
            }}
            className={`relative flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors cursor-pointer ${
              isFilterPanelOpen || activeFilters.length > 0
                ? "bg-[#28415c] text-white"
                : "bg-[#dcf0ff] text-[#28415c] hover:bg-[#cce7fb]"
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
                ? "bg-[#28415c] text-white"
                : "bg-[#f6f7f9] text-[#98989d] hover:text-[#4e6987] hover:bg-[#dcf0ff]"
            }`}
          >
            <span
              className="font-bold uppercase tracking-[0.5px]"
              style={{ fontSize: 10, ...fontFeature }}
            >
              Métricas
            </span>
          </button>

          {/* Show Lost toggle */}
          <button
            onClick={() => setShowLost((v) => !v)}
            className={`relative flex items-center gap-[5px] h-[34px] px-[14px] rounded-[500px] transition-all cursor-pointer ${
              showLost
                ? "bg-[#28415c] text-white"
                : "bg-[#f6f7f9] text-[#98989d] hover:text-[#4e6987] hover:bg-[#dcf0ff]"
            }`}
          >
            <span
              className="font-bold uppercase tracking-[0.5px]"
              style={{ fontSize: 10, ...fontFeature }}
            >
              Perdidos
            </span>
          </button>
        </div>

        {/* ═══════ FILTER PANEL ═══════ */}
        {isFilterPanelOpen && (
          <div ref={filterPanelRef} className="mt-[8px] pt-[10px] border-t border-[#f0f2f5]">
            {/* Filter dropdown pills row */}
            <div className="flex items-center gap-[6px] flex-wrap">
              {FILTER_FIELDS.map((fd) => (
                <FilterDropdownPill
                  key={fd.key}
                  fieldDef={fd}
                  condition={draftFilters.find((c) => c.field === fd.key)}
                  onChange={updateDraftFilter}
                  ops={ops}
                />
              ))}

            </div>

            {/* Active filter pills preview */}
            {draftFilters.filter((fc) => {
              if (isPicklistField(fc.field)) return fc.values.length > 0;
              if (isValueField(fc.field)) return fc.rangeMin !== undefined || fc.rangeMax !== undefined;
              if (isDateField(fc.field)) return !!fc.dateFrom || !!fc.dateTo;
              return false;
            }).length > 0 && (
              <>
                {/* Divider + title */}
                <div className="mt-[14px] mb-[10px] border-t border-[#ebedf0]" />
                <span
                  className="text-[#98989d] font-bold uppercase tracking-[0.5px] mb-[8px] block"
                  style={{ fontSize: 10, letterSpacing: 0.5, ...fontFeature }}
                >
                  RESUMO DO FILTRO
                </span>
                <div className="flex items-center gap-[4px] flex-wrap">
                  {draftFilters
                    .filter((fc) => {
                      if (isPicklistField(fc.field)) return fc.values.length > 0;
                      if (isValueField(fc.field)) return fc.rangeMin !== undefined || fc.rangeMax !== undefined;
                      if (isDateField(fc.field)) return !!fc.dateFrom || !!fc.dateTo;
                      return false;
                    })
                    .map((fc) => (
                      <div
                        key={fc.field}
                        className="flex items-center gap-[6px] h-[26px] pl-[10px] pr-[6px] rounded-[500px] bg-[#dde3ec] text-[#28415c]"
                      >
                        <span
                          className="whitespace-nowrap"
                          style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
                        >
                          {filterConditionLabel(fc)}
                        </span>
                        <button
                          onClick={() =>
                            setDraftFilters((prev) => prev.filter((c) => c.field !== fc.field))
                          }
                          className="flex items-center justify-center size-[16px] rounded-full hover:bg-[#07abde] hover:text-white transition-colors cursor-pointer"
                        >
                          <X size={8} weight="bold" />
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* APLICAR + SALVAR buttons row */}
            <div className="flex items-center gap-[6px] mt-[14px]">
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] bg-[#f6f7f9] text-[#28415c] hover:bg-[#dcf0ff] transition-colors cursor-pointer"
              >
                <span
                  className="font-bold uppercase tracking-[0.5px]"
                  style={{ fontSize: 10, ...fontFeature }}
                >
                  APLICAR
                </span>
              </button>

              {!savingViewName ? (
                <button
                  onClick={() => setSavingViewName(true)}
                  className="flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] bg-[#f6f7f9] text-[#28415c] hover:bg-[#dcf0ff] transition-colors cursor-pointer"
                >
                  <FloppyDisk size={13} weight="bold" />
                  <span
                    className="font-bold uppercase tracking-[0.5px]"
                    style={{ fontSize: 10, ...fontFeature }}
                  >
                    SALVAR
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-[4px]">
                  <input
                    autoFocus
                    value={viewNameInput}
                    onChange={(e) => setViewNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveView(); if (e.key === "Escape") { setSavingViewName(false); setViewNameInput(""); } }}
                    placeholder="Nome da visão"
                    className="h-[34px] w-[140px] px-[12px] rounded-[100px] border-[1px] border-[#dde3ec] text-[#28415c] text-[12px] outline-none focus:border-[#07abde] transition-colors"
                    style={{ fontWeight: 500, ...fontFeature }}
                  />
                  <button
                    onClick={handleSaveView}
                    className="flex items-center justify-center size-[34px] rounded-full bg-[#dcf0ff] text-[#07abde] hover:bg-[#cce7fb] transition-colors cursor-pointer"
                  >
                    <Check size={12} weight="bold" />
                  </button>
                  <button
                    onClick={() => { setSavingViewName(false); setViewNameInput(""); }}
                    className="flex items-center justify-center size-[34px] rounded-full text-[#ff8c76] hover:bg-[#ffedeb] transition-colors cursor-pointer"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Metrics Strip (inline inside header) ── */}
        {showMetrics && viewMode === "kanban" && (() => {
          const pipelineOps = filteredOps.filter((o) => !STAGES_CLOSED.includes(o.stage));
          const totalValue = pipelineOps.reduce((s, o) => s + o.value, 0);
          const weightedValue = pipelineOps.reduce((s, o) => s + o.value * STAGE_WEIGHT[o.stage], 0);
          const openOps = pipelineOps.filter((o) => o.stage !== "ganho");
          const openValue = openOps.reduce((s, o) => s + o.value, 0);
          const wonOps = pipelineOps.filter((o) => o.stage === "ganho");
          const wonValue = wonOps.reduce((s, o) => s + o.value, 0);
          const avgValue = pipelineOps.length ? totalValue / pipelineOps.length : 0;
          const avgDaysOpen = (() => {
            const now = Date.now();
            const days = pipelineOps.map((o) => Math.floor((now - new Date(o.lastActivityDate).getTime()) / 86400000));
            return days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
          })();
          const lostOps = filteredOps.filter((o) => STAGES_CLOSED.includes(o.stage));
          const lostValue = lostOps.reduce((s, o) => s + o.value, 0);

          const metrics: { label: string; value: string; sub?: string; icon: React.ComponentType<any>; color: string; bg: string }[] = [
            { label: "VALOR TOTAL", value: formatCompactCurrency(totalValue), sub: `${pipelineOps.length} ops`, icon: CurrencyCircleDollar, color: "#07abde", bg: "#dcf0ff" },
            { label: "VALOR PONDERADO", value: formatCompactCurrency(weightedValue), sub: `Média ${formatCompactCurrency(avgValue)}`, icon: TrendUp, color: "#8c8cd4", bg: "#e8e8fd" },
            { label: "VALOR EM ABERTO", value: formatCompactCurrency(openValue), sub: `${openOps.length} ops`, icon: Hourglass, color: "#eac23d", bg: "#feedca" },
            { label: "VALOR GANHO", value: formatCompactCurrency(wonValue), sub: `${wonOps.length} ops`, icon: Target, color: "#3ccea7", bg: "#d9f8ef" },
            { label: "TICKET MÉDIO", value: formatCompactCurrency(avgValue), sub: "por op", icon: ChartLineUp, color: "#4e6987", bg: "#dde3ec" },
            { label: "IDADE MÉDIA", value: `${avgDaysOpen} dias`, sub: "desde últ. atividade", icon: Timer, color: "#ff8c76", bg: "#ffedeb" },
            ...(showLost ? [{ label: "VALOR PERDIDO", value: formatCompactCurrency(lostValue), sub: `${lostOps.length} ops`, icon: XCircle, color: "#ED5200", bg: "#ffedeb" }] : []),
          ];

          return (
            <div className="mt-[4px] pt-[8px] border-t border-[#f0f2f5] overflow-x-auto">
              <div className="flex gap-[2px] min-w-max">
                {metrics.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.label}
                      className="flex-1 min-w-[140px] flex items-center gap-[10px] px-[12px] py-[8px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors"
                    >
                      <div
                        className="flex items-center justify-center size-[32px] rounded-[8px] shrink-0"
                        style={{ backgroundColor: m.bg }}
                      >
                        <Icon size={16} weight="duotone" style={{ color: m.color }} />
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
                        {m.sub && (
                          <span
                            className="text-[#98989d] whitespace-nowrap"
                            style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.2, lineHeight: "14px", ...fontFeature }}
                          >
                            {m.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ═══════ CONTENT ═══════ */}
      {viewMode === "kanban" ? (
        <DndProvider backend={TouchBackend} options={TOUCH_BACKEND_OPTIONS}>
          <CustomDragLayer />

          {/* ── Kanban Columns ── */}
          <div className="flex-1 flex gap-[4px] overflow-x-auto pb-2 min-h-0">
            {visibleStages.flatMap((stage, idx) => {
              const colOps = visibleOps.filter((o) => o.stage === stage);
              const colTotal = colOps.reduce((s, o) => s + o.value, 0);
              const colWeighted = colOps.reduce((s, o) => s + o.value * STAGE_WEIGHT[o.stage], 0);
              const pct = Math.round(STAGE_WEIGHT[stage] * 100);
              const isCollapsed = collapsedStages.has(stage);
              const config = stageConfig[stage];
              const Icon = config.icon;

              const elements: React.ReactNode[] = [];

              /* ── Collapsed vertical bar ── */
              if (isCollapsed) {
                elements.push(
                  <DroppableColumn key={stage} stage={stage} onDrop={handleDrop} collapsed>
                    <div
                      onClick={() => toggleStageCollapse(stage)}
                      className="flex flex-col items-center w-[44px] min-w-[44px] max-w-[44px] h-full rounded-[16px] cursor-pointer hover:opacity-80 transition-opacity select-none"
                      style={{ backgroundColor: config.bg }}
                    >
                      {/* Icon at top */}
                      <div className="pt-[14px] pb-[8px] shrink-0">
                        <Icon size={16} weight="duotone" style={{ color: config.color }} />
                      </div>

                      {/* Vertical label */}
                      <div className="flex-1 flex items-start justify-center min-h-0 overflow-hidden">
                        <span
                          className="uppercase whitespace-nowrap"
                          style={{
                            writingMode: "vertical-lr",
                            textOrientation: "mixed",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 1.5,
                            color: config.color,
                            ...fontFeature,
                          }}
                        >
                          {config.label}
                        </span>
                      </div>

                      {/* Count badge at bottom */}
                      <div className="pb-[12px] pt-[8px] shrink-0">
                        <div
                          className="flex items-center justify-center size-[22px] rounded-full"
                          style={{ backgroundColor: config.color }}
                        >
                          <span
                            className="text-white"
                            style={{ fontSize: 10, fontWeight: 700, ...fontFeature }}
                          >
                            {colOps.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DroppableColumn>
                );
              } else {

              /* ── Expanded column ── */
              elements.push(
                <DroppableColumn key={stage} stage={stage} onDrop={handleDrop}>
                  {/* Column header */}
                  <div className="mb-[8px]">
                    <div className="flex items-center mb-[6px]">
                      <div
                        onClick={() => toggleStageCollapse(stage)}
                        className="flex items-center justify-center gap-[4px] h-[40px] px-[12px] rounded-[500px] whitespace-nowrap w-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: config.bg, color: config.color }}
                      >
                        <Icon size={16} weight="duotone" />
                        <span
                          className="uppercase tracking-[1px]"
                          style={{ fontSize: 13, fontWeight: 700, ...fontFeature }}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                    {/* Stage subtotals */}
                    <div className="flex items-center justify-between px-[6px]">
                      <div className="flex items-center gap-[4px]">
                        <span
                          className="text-[#28415c]"
                          style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
                        >
                          {formatCompactCurrency(colTotal)}
                        </span>
                        <span
                          className="text-[#98989d]"
                          style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.2, lineHeight: "14px", ...fontFeature }}
                        >
                          · {colOps.length} {colOps.length === 1 ? "op" : "ops"}
                        </span>
                      </div>
                      <span
                        className="text-[#98989d]"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
                      >
                        {pct}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mx-[6px] mt-[4px] h-[3px] rounded-full bg-[#f0f2f5] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${colTotal > 0 ? Math.min(100, (colTotal / visibleOps.reduce((s, o) => s + o.value, 0)) * 100) : 0}%`,
                          backgroundColor: config.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-[10px] min-h-[200px] pr-1">
                    {colOps.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[#C8CFDB]" style={{ fontSize: 11 }}>Nenhuma oportunidade</p>
                      </div>
                    ) : (
                      colOps.map((op) => (
                        <DraggableOpCard
                          key={op.id}
                          op={op}
                          navigate={navigate}
                          activeMenu={activeMenu}
                          setActiveMenu={setActiveMenu}
                          menuRef={menuRef}
                          isSelected={selectedCardIds.has(op.id)}
                          onToggleSelect={toggleCardSelect}
                        />
                      ))
                    )}
                  </div>

                  {/* Column footer */}
                  <div className="mt-[8px] px-[6px] pb-[4px]">
                    <div className="flex items-center gap-[4px]">
                      <span
                        className="text-[#98989d] uppercase"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
                      >
                        Ponderado
                      </span>
                      <span
                        className="text-[#4e6987]"
                        style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.2, lineHeight: "14px", ...fontFeature }}
                      >
                        {formatCompactCurrency(colWeighted)}
                      </span>
                    </div>
                  </div>
                </DroppableColumn>
              );
              }

              /* ── Divider between columns ── */
              if (idx < visibleStages.length - 1) {
                elements.push(
                  <div key={`div-${stage}`} className="self-start mt-[10px] shrink-0">
                    <VerticalDivider />
                  </div>
                );
              }

              return elements;
            })}
          </div>
        </DndProvider>
      ) : (
        /* ═══════ TABLE VIEW ═══════ */
        <>
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
                  {paginated.map((op, idx) => {
                    const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                    const isSelected = selectedIds.has(op.id);

                    return (
                      <div key={op.id}>
                        <HorizontalDivider />
                        <div
                          onClick={() => navigate(`/crm/oportunidades/${op.id}`)}
                          className={`grid items-center h-[34px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                            isSelected ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"
                          }`}
                          style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
                        >
                          <div
                            className="text-right text-[#28415c]"
                            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                          >
                            {rowNum}
                          </div>

                          <div className="flex items-center justify-center">
                            <CircleCheckbox
                              checked={isSelected}
                              onChange={() => toggleSelect(op.id)}
                            />
                          </div>

                          <div
                            className="truncate text-[#07abde]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {op.name}
                          </div>

                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {op.company}
                          </div>

                          <div
                            className="truncate"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: stageConfig[op.stage].color, ...fontFeature }}
                          >
                            {stageTableLabel[op.stage]}
                          </div>

                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {formatCompactCurrency(op.value)}
                          </div>

                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {op.owner}
                          </div>

                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {formatRelativeDate(op.lastActivityDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <HorizontalDivider />
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {filteredOps.length > ROWS_PER_PAGE && (
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
        </>
      )}

      {/* ═══════ FLOATING SELECTION BAR ═══════ */}
      {selectedCardIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-[12px] h-[48px] px-[20px] rounded-[500px] bg-[#28415c] text-white"
          style={{ boxShadow: "0px 4px 16px 0px rgba(18,34,50,0.35)" }}
        >
          <span
            className="font-bold uppercase tracking-[0.5px]"
            style={{ fontSize: 11, ...fontFeature }}
          >
            {selectedCardIds.size} {selectedCardIds.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => { toast(`Mover ${selectedCardIds.size} oportunidade(s) (em breve)`); }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Columns size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>MOVER</span>
          </button>
          <button
            onClick={() => { toast(`Excluir ${selectedCardIds.size} oportunidade(s) (em breve)`); }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-[#ED5200] transition-colors cursor-pointer"
          >
            <Trash size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>EXCLUIR</span>
          </button>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => setSelectedCardIds(new Set())}
            className="flex items-center justify-center size-[28px] rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <XCircle size={16} weight="fill" />
          </button>
        </div>
      )}
    </div>
  );
}