import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Heart,
  CaretDown,
  CaretRight,
  X,
  Tag,
  ClockCounterClockwise,
  PencilSimple,
  Trash,
  Link as LinkIcon,
  CopySimple,
  Phone,
  Envelope,
  ChatCircle,
  CalendarBlank,
  CheckCircle,
  NoteBlank,
  Sparkle,
  Trophy,
  Plus,
  FunnelSimple,
  GearSix,
  ListBullets,
  ArrowSquareRight,
  ArrowSquareDownRight,
  CircleNotch,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";
import { EditableField } from "./editable-field";
import type { FormulaContext } from "./formula-engine";
import { useMultitask } from "../multitask-context";
import { useCrmSearch } from "./crm-search-context";
import {
  recordChange,
  getLastChangeDate,
  seedInitialValue,
  getEntityHistory,
  type FieldHistoryEntry,
} from "./field-history";
import { getLead, patchLead as patchLeadApi, getObjectConfig } from "./crm-api";
import { toast } from "sonner";
import { ConvertLeadModal } from "./convert-lead-modal";
import { DraggableFieldGrid, FieldDndProvider } from "./draggable-field-grid";
import { getFieldOptions, getFieldType } from "./crm-field-config";
import { useCustomFields } from "./use-custom-fields";
import { useFieldVisibility } from "./use-field-visibility";


/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

type LeadStage = "novo" | "em_contato" | "qualificacao" | "descartado" | "qualificado";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

interface LeadData {
  id: string;
  name: string;
  lastName: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  type: string;
  origin: string;
  segment: string;
  stage: LeadStage;
  owner: string;
  score: number;
  scoreLabel: string;
  qualificationProgress: number;
  lastActivity: string;
  responseTime: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  labels: { text: string; bg: string; color: string }[];
  qualificationQuestions: { question: string; answer: string }[];
  // ── new typed fields ──
  tags: string;              // multipicklist – semicolon-separated
  notes: string;             // textarea
  website: string;           // link (url)
  annualRevenue: string;     // currency (raw number)
  employeeCount: string;     // number
  conversionRate: string;    // calculated (percentage, raw number)
  isActive: string;          // boolean ("true"/"false")
  preferredContact: string;  // combobox
  // ── system fields (read-only, managed by system) ──
  isDeleted: string;         // boolean – soft delete flag
  lastViewedDate: string;    // datetime – last viewed by current user
  lastReferencedDate: string;// datetime – last referenced by current user
  systemModstamp: string;    // datetime – system modification timestamp
  // ── date fields for formulas ──
  lastActivityDate: string;  // ISO date of last activity (for formula engine)
  // ── marketing fields ──
  mktCampanha: string;           // text – campaign name
  mktGrupoAnuncios: string;     // text – ad group
  mktAnuncio: string;            // text – ad creative
  mktUltimaConversao: string;   // datetime – last conversion date/time
  mktCanal: string;              // picklist – channel (Google Ads, Meta Ads, LinkedIn Ads)
}

interface Activity {
  id: string;
  type: "compromisso" | "tarefa" | "ligacao" | "nota" | "mensagem" | "email";
  label: string;
  date: string;
  group: string;
}

const activityConfig: Record<Activity["type"], { icon: React.ComponentType<any>; bg: string; color: string }> = {
  compromisso: { icon: CalendarBlank, bg: "#FFEDEB", color: "#FF8C76" },
  tarefa: { icon: CheckCircle, bg: "#E8E8FD", color: "#8C8CD4" },
  ligacao: { icon: Phone, bg: "#D9F8EF", color: "#3CCEA7" },
  nota: { icon: NoteBlank, bg: "#FEEDCA", color: "#EAC23D" },
  mensagem: { icon: ChatCircle, bg: "#DCF0FF", color: "#07ABDE" },
  email: { icon: Envelope, bg: "#DDE3EC", color: "#4E6987" },
};

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "novo", label: "NOVO" },
  { key: "em_contato", label: "EM CONTATO" },
  { key: "qualificacao", label: "QUALIFICAÇÃO" },
  { key: "descartado", label: "DESCARTADO" },
  { key: "qualificado", label: "QUALIFICADO" },
];

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

/** Empty lead – used as initial state before DB fetch. No fake data. */
const emptyLead: LeadData = {
  id: "",
  name: "",
  lastName: "",
  role: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  type: "",
  origin: "",
  segment: "",
  stage: "novo",
  owner: "",
  score: 0,
  scoreLabel: "",
  qualificationProgress: 0,
  lastActivity: "",
  responseTime: "",
  createdAt: "",
  updatedAt: "",
  createdBy: "",
  updatedBy: "",
  labels: [],
  qualificationQuestions: [],
  tags: "",
  notes: "",
  website: "",
  annualRevenue: "",
  employeeCount: "",
  conversionRate: "",
  isActive: "false",
  preferredContact: "",
  isDeleted: "false",
  lastViewedDate: "",
  lastReferencedDate: "",
  systemModstamp: "",
  lastActivityDate: "",
  mktCampanha: "",
  mktGrupoAnuncios: "",
  mktAnuncio: "",
  mktUltimaConversao: "",
  mktCanal: "",
};

const mockActivities: Activity[] = [
  { id: "a1", type: "compromisso", label: "Compromisso", date: "04/01/2024 09:30", group: "FUTURO" },
  { id: "a2", type: "tarefa", label: "Tarefa", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a3", type: "ligacao", label: "Ligação", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a4", type: "nota", label: "Nota", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a5", type: "mensagem", label: "Mensagem", date: "04/01/2024 09:30", group: "JUNHO" },
  { id: "a6", type: "email", label: "Email", date: "04/01/2024 09:30", group: "2022" },
];

/* ─── Lead Tag / Etiqueta config ─── */
/* Derived from centralized LEAD_FIELDS (lead_tags) in crm-settings-native-fields */

interface LeadTagOption {
  id: string;
  label: string;
  bg: string;
  text: string;
  dot: string;
}

/** Map from dot color → lighter bg + darker text for tag pills */
const TAG_STYLE_MAP: Record<string, { bg: string; text: string }> = {
  "#3CCEA7": { bg: "bg-[#D9F8EF]", text: "text-[#135543]" },
  "#8C8CD4": { bg: "bg-[#E8E8FD]", text: "text-[#6868B1]" },
  "#07ABDE": { bg: "bg-[#DCF0FF]", text: "text-[#025E7B]" },
  "#EAC23D": { bg: "bg-[#FFF4E0]", text: "text-[#8B6914]" },
  "#B13B00": { bg: "bg-[#FFEDEB]", text: "text-[#B13B00]" },
  "#6868B1": { bg: "bg-[#E8E8FD]", text: "text-[#6868B1]" },
  "#0483AB": { bg: "bg-[#DCF0FF]", text: "text-[#025E7B]" },
  "#D4A017": { bg: "bg-[#FFF4E0]", text: "text-[#8B6914]" },
};

const leadTagOptions: LeadTagOption[] = (() => {
  const opts = getFieldOptions("lead", "lead_tags") ?? [];
  return opts.map((opt) => {
    const c = (opt.color ?? "#98989d").toUpperCase();
    const styles = TAG_STYLE_MAP[c] ?? { bg: "bg-[#f0f2f5]", text: "text-[#4e6987]" };
    return {
      id: opt.value,
      label: opt.label,
      bg: styles.bg,
      text: styles.text,
      dot: `bg-[${c}]`,
    };
  });
})();

/* ------------------------------------------------------------------ */
/*  Small reusable components                                          */
/* ------------------------------------------------------------------ */

function VerticalDivider() {
  return (
    <div className="flex h-[20px] items-center justify-center shrink-0 w-[1.5px]">
      
    </div>
  );
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c] cursor-pointer"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Segmented Control Pipeline                                         */
/* ------------------------------------------------------------------ */

function PipelineControl({ stage, onStageChange }: { stage: LeadStage; onStageChange: (s: LeadStage) => void }) {
  const activeIdx = STAGES.findIndex((s) => s.key === stage);

  return (
    <div
      className="flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip relative"
    >
      {STAGES.map((s, idx) => {
        const isActive = s.key === stage;
        const isPast = idx < activeIdx;
        return (
          <button
            key={s.key}
            onClick={() => onStageChange(s.key)}
            className={`group/stage flex-1 h-[36px] rounded-[20px] flex items-center justify-center transition-all duration-200 relative cursor-pointer z-[1] ${
              isActive
                ? "cursor-default"
                : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
            }`}
          >
            {/* Sliding active pill */}
            {isActive && (
              <motion.div
                layoutId="crm-pipeline-active"
                className="absolute inset-0 bg-[#28415C] rounded-[20px]"
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                style={{
                  border: "0.5px solid rgba(200,207,219,0.6)",
                  boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                }}
              />
            )}
            {isPast ? (
              <div className="relative z-[1] flex items-center justify-center">
                <CheckCircle
                  size={16}
                  weight="bold"
                  className="text-[#3CCEA7] transition-opacity duration-200 opacity-100 group-hover/stage:opacity-0 absolute"
                />
                <span
                  className="opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200 uppercase whitespace-nowrap"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {s.label}
                </span>
              </div>
            ) : (
              <span
                className={`relative z-[1] uppercase whitespace-nowrap ${isActive ? "text-[#f6f7f9]" : ""}`}
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
              >
                {s.label}
              </span>
            )}
          </button>
        );
      })}
      {/* Inner shadow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] z-[2]"
        style={{
          boxShadow:
            "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lead Score Card                                                    */
/* ------------------------------------------------------------------ */

function LeadScoreCard({ score, label }: { score: number; label: string }) {
  return (
    <div
      className="flex items-center gap-[16px] rounded-[10px] bg-[#f6f7f9] px-[20px] py-[10px]"
      style={{ border: "1px solid rgba(200,207,219,0.6)" }}
    >
      <div className="flex flex-col gap-[2px]">
        <div className="flex items-center gap-[10px]">
          <Trophy size={24} weight="duotone" className="text-[#28415c]" />
          <span
            className="text-[#28415c]"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.4, lineHeight: "normal", ...fontFeature }}
          >
            Lead<br />Score
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center size-[60px]">
          <svg className="absolute inset-0 size-full" fill="none" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="29.5" fill="#FEEDCA" stroke="url(#scoreGrad)" />
            <defs>
              <linearGradient id="scoreGrad" gradientUnits="userSpaceOnUse" x1="4.2" x2="32.8" y1="0" y2="65.8">
                <stop stopColor="#C8CFDB" stopOpacity="0.6" />
                <stop offset="0.333" stopColor="white" stopOpacity="0.01" />
                <stop offset="0.667" stopColor="white" stopOpacity="0.01" />
                <stop offset="1" stopColor="#C8CFDB" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="relative text-[#917822] text-center"
            style={{ fontSize: 28, fontWeight: 400, letterSpacing: 1, fontFamily: "'DM Serif Text', serif" }}
          >
            {score}
          </span>
        </div>
        
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Item                                                      */
/* ------------------------------------------------------------------ */

function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex gap-[4px] items-center px-[12px] py-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors w-full">
      {/* Expand arrow */}
      <button className="flex items-center justify-center size-[28px] shrink-0 text-[#4e6987] cursor-pointer rounded-full hover:bg-[#dde3ec] transition-colors">
        <CaretRight size={14} weight="bold" />
      </button>
      {/* Type icon */}
      <div
        className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={17} weight="duotone" style={{ color: config.color }} />
      </div>
      {/* Label */}
      <span
        className="text-[#4e6987] flex-1"
        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {activity.label}
      </span>
      {/* Date */}
      <span
        className="text-[#4e6987] text-right shrink-0"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
      >
        {activity.date}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Toggle                                                     */
/* ------------------------------------------------------------------ */

function SectionToggle({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-[15px] cursor-pointer py-[4px] group/section"
      >
        <div className="flex items-center justify-center size-[24px] text-[#28415c]">
          {expanded ? <CaretDown size={18} weight="bold" /> : <CaretRight size={18} weight="bold" />}
        </div>
        <span
          className="text-[#28415c]"
          style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {title}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { minimize } = useMultitask();
  const { trackRecent } = useCrmSearch();
  const [lead, setLead] = useState<LeadData>(emptyLead);
  const [leadLoading, setLeadLoading] = useState(true);
  const { customFields, customValues, updateCustomValue } = useCustomFields("lead", id);
  const { isVisible: v, isRequired: rq, getLabel: fl } = useFieldVisibility("lead");

  /* ─── Load layout config from obj-config ─── */
  const [layoutConfig, setLayoutConfig] = useState<{ title: string; fields: string[] }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getObjectConfig("lead")
      .then((cfg) => {
        if (cancelled) return;
        if (cfg?.layout && cfg.layout.length > 0) {
          setLayoutConfig(cfg.layout);
        }
      })
      .catch((err) => console.error("Error loading lead layout config:", err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const dbRow = await getLead(id);
        if (cancelled) return;
        // company is plain text on leads (no FK — lead hasn't been converted yet)
        const companyName = dbRow.company ?? "";
        // Helper: format ISO date to pt-BR locale string
        const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleString("pt-BR") : "";
        // Helper: compute relative time string from ISO date
        const relativeTime = (iso: string | null): string => {
          if (!iso) return "";
          const diff = Date.now() - new Date(iso).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 1) return "Agora mesmo";
          if (mins < 60) return `Há ${mins}min`;
          const hrs = Math.floor(diff / 3600000);
          if (hrs < 24) return `Há ${hrs}h`;
          const days = Math.floor(diff / 86400000);
          if (days === 1) return "Há 1 dia";
          return `Há ${days} dias`;
        };
        // Parse labels from DB (JSON array or null)
        let parsedLabels: { text: string; bg: string; color: string }[] = [];
        if (dbRow.labels) {
          try { parsedLabels = typeof dbRow.labels === "string" ? JSON.parse(dbRow.labels) : dbRow.labels; } catch { /* ignore */ }
        }
        // Parse qualification questions from DB
        let parsedQQ: { question: string; answer: string }[] = [];
        if (dbRow.qualification_questions) {
          try { parsedQQ = typeof dbRow.qualification_questions === "string" ? JSON.parse(dbRow.qualification_questions) : dbRow.qualification_questions; } catch { /* ignore */ }
        }
        setLead({
          ...emptyLead,
          id: dbRow.id,
          name: dbRow.name ?? "",
          lastName: dbRow.lastname ?? "",
          role: dbRow.role ?? "",
          company: companyName,
          phone: dbRow.phone ?? "",
          email: dbRow.email ?? "",
          address: dbRow.address ?? "",
          type: dbRow.type ?? "",
          origin: dbRow.origin ?? "",
          segment: dbRow.segment ?? "",
          stage: (dbRow.stage as LeadStage) ?? "novo",
          owner: dbRow.owner ?? "",
          score: dbRow.score ?? 0,
          scoreLabel: dbRow.score_label ?? "",
          qualificationProgress: dbRow.qualification_progress ?? 0,
          website: dbRow.website ?? "",
          annualRevenue: dbRow.annual_revenue != null ? String(dbRow.annual_revenue) : "",
          employeeCount: dbRow.employee_count != null ? String(dbRow.employee_count) : "",
          conversionRate: dbRow.conversion_rate != null ? String(dbRow.conversion_rate) : "",
          isActive: dbRow.is_active != null ? String(dbRow.is_active) : "false",
          preferredContact: dbRow.preferred_contact ?? "",
          tags: dbRow.tags ?? "",
          notes: dbRow.notes ?? "",
          labels: parsedLabels,
          qualificationQuestions: parsedQQ,
          // Activity & response
          lastActivity: relativeTime(dbRow.last_activity_date ?? dbRow.updated_at),
          lastActivityDate: dbRow.last_activity_date ?? dbRow.updated_at ?? "",
          responseTime: dbRow.response_time ?? "",
          // Timestamps
          createdAt: fmtDate(dbRow.created_at),
          updatedAt: fmtDate(dbRow.updated_at),
          createdBy: dbRow.created_by ?? "",
          updatedBy: dbRow.updated_by ?? "",
          // System fields
          isDeleted: dbRow.is_deleted != null ? String(dbRow.is_deleted) : "false",
          lastViewedDate: fmtDate(dbRow.last_viewed_date),
          lastReferencedDate: fmtDate(dbRow.last_referenced_date),
          systemModstamp: fmtDate(dbRow.system_modstamp),
          // Marketing
          mktCampanha: dbRow.mkt_campanha ?? "",
          mktGrupoAnuncios: dbRow.mkt_grupo_anuncios ?? "",
          mktAnuncio: dbRow.mkt_anuncio ?? "",
          mktUltimaConversao: dbRow.mkt_ultima_conversao ?? "",
          mktCanal: dbRow.mkt_canal ?? "",
        });
        setStage((dbRow.stage as LeadStage) ?? "novo");
        // Initialize stageComplement from DB
        if (dbRow.stage_complement) setStageComplement(dbRow.stage_complement);
        // Initialize tags from DB
        const rawTags = dbRow.tags ?? "";
        if (rawTags) {
          try {
            const parsed = JSON.parse(rawTags);
            if (Array.isArray(parsed)) setSelectedTags(parsed);
          } catch {
            // If not JSON, treat as semicolon-separated (legacy)
            if (rawTags) setSelectedTags(rawTags.split(";").map((t: string) => t.trim()).filter(Boolean));
          }
        }
        trackRecent({ id: dbRow.id, label: `${dbRow.name} ${dbRow.lastname ?? ""}`.trim(), subtitle: `${dbRow.role ?? ""} · ${companyName}`, objectType: "lead", visitedAt: Date.now() });
      } catch (err) {
        console.error("Error loading lead detail:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("not found")) {
            toast.error("Lead não encontrado no banco de dados.");
            navigate("/crm/leads");
            return;
          }
        }
      } finally {
        if (!cancelled) setLeadLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const [stage, setStage] = useState<LeadStage>(lead.stage);
  const [stageComplement, setStageComplement] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(true);
  // marketingOpen and infoOpen now handled by dynamic openSections state
  const [systemOpen, setSystemOpen] = useState(false);
  const [qualificationOpen, setQualificationOpen] = useState(true);
  const [activityTab, setActivityTab] = useState<"feed" | "engajamento">("feed");
  const [fieldHistoryEntries, setFieldHistoryEntries] = useState<FieldHistoryEntry[]>([]);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  // ── Tags state ──
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const tagBtnRef = useRef<HTMLButtonElement>(null);

  // ── Close tag menu on outside click ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        tagMenuRef.current && !tagMenuRef.current.contains(target) &&
        tagBtnRef.current && !tagBtnRef.current.contains(target)
      ) {
        setShowTagMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTag = useCallback(
    (tagId: string) => {
      setSelectedTags((prev) => {
        const newTags = prev.includes(tagId)
          ? prev.filter((t) => t !== tagId)
          : [...prev, tagId];
        // Persist to DB as JSON array
        const jsonStr = JSON.stringify(newTags);
        setLead((p) => ({ ...p, tags: jsonStr }));
        patchLeadApi(lead.id, { tags: jsonStr } as any).catch((err) => {
          console.error("Error persisting lead tags:", err);
          toast.error("Erro ao salvar etiquetas.");
          setSelectedTags(prev); // rollback
        });
        return newTags;
      });
    },
    [lead.id]
  );

  // ── Field History: seed initial stage value on mount ──
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      // Seed the initial stage value as the baseline for "Tempo no estágio"
      // In production this would come from the DB; here we simulate the lead
      // entering the current stage 5 days ago for demo purposes
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      seedInitialValue({
        entity_type: "lead",
        entity_id: lead.id,
        field_name: "stage",
        current_value: lead.stage,
        created_at: fiveDaysAgo.toISOString(),
        changed_by: lead.createdBy,
      });
      setFieldHistoryEntries(
        getEntityHistory({ entity_type: "lead", entity_id: lead.id })
      );
    }
  }, [lead.id, lead.stage, lead.createdBy]);

  // ── Stage change handler with field history recording ──
  const handleStageChange = useCallback(
    (newStage: LeadStage) => {
      if (newStage === stage) return;
      recordChange({
        entity_type: "lead",
        entity_id: lead.id,
        field_name: "stage",
        old_value: stage,
        new_value: newStage,
        changed_by: "Nome Sobrenome", // current user
        change_source: "ui",
      });
      setStage(newStage);
      // Refresh history entries
      setFieldHistoryEntries(
        getEntityHistory({ entity_type: "lead", entity_id: lead.id })
      );
      // Persist to DB
      patchLeadApi(lead.id, { stage: newStage }).catch((err) =>
        console.error("Error persisting lead stage change:", err)
      );
    },
    [stage, lead.id]
  );

  // ── Generic field update: local state + DB persist ──
  const FIELD_TO_DB: Record<string, string> = {
    owner: "owner", name: "name", lastName: "lastname", role: "role", phone: "phone", email: "email",
    company: "company", type: "type", origin: "origin", address: "address",
    segment: "segment", website: "website", preferredContact: "preferred_contact",
    annualRevenue: "annual_revenue", employeeCount: "employee_count",
    isActive: "is_active", tags: "tags", notes: "notes",
    mktCampanha: "mkt_campanha", mktGrupoAnuncios: "mkt_grupo_anuncios",
    mktAnuncio: "mkt_anuncio", mktUltimaConversao: "mkt_ultima_conversao",
    mktCanal: "mkt_canal",
  };

  const updateLeadField = useCallback(
    (fieldKey: string, value: string) => {
      setLead((prev) => ({ ...prev, [fieldKey]: value }));
      const dbKey = FIELD_TO_DB[fieldKey];
      if (!dbKey) return;
      let dbValue: unknown = value;
      if (dbKey === "annual_revenue" || dbKey === "employee_count") {
        dbValue = parseFloat(value) || 0;
      } else if (dbKey === "is_active") {
        dbValue = value === "true";
      }
      patchLeadApi(lead.id, { [dbKey]: dbValue } as any).catch((err) =>
        console.error(`Error persisting lead ${dbKey}:`, err)
      );
    },
    [lead.id]
  );

  // ── Resolve stageLastChangedAt from field history ──
  const stageLastChangedAt =
    getLastChangeDate({
      entity_type: "lead",
      entity_id: lead.id,
      field_name: "stage",
    }) ?? lead.lastActivityDate; // fallback to lastActivityDate if no history

  // ── Formula context: all lead field values for the formula engine ──
  const formulaCtx: FormulaContext = {
    annualRevenue: parseFloat(lead.annualRevenue) || 0,
    employeeCount: parseFloat(lead.employeeCount) || 0,
    score: lead.score,
    qualificationProgress: lead.qualificationProgress,
    isActive: lead.isActive === "true",
    stage: stage,
    name: lead.name,
    company: lead.company,
    lastActivityDate: lead.lastActivityDate,
    stageLastChangedAt,
  };

  /* ─── Field Registry: layout label → ReactNode ─── */
  const fieldMap = useMemo((): Record<string, React.ReactNode> => {
    const m: Record<string, React.ReactNode> = {};

    // Dados Principais
    if (v("lead_name"))
      m["Nome"] = <EditableField key="name" label={fl("lead_name")} required={rq("lead_name")} value={lead.name} onChange={(val) => updateLeadField("name", val)} />;
    if (v("lead_lastname"))
      m["Sobrenome"] = <EditableField key="lastName" label={fl("lead_lastname")} required={rq("lead_lastname")} value={lead.lastName} fieldType="text" onChange={(val) => updateLeadField("lastName", val)} />;
    if (v("lead_email"))
      m["E-mail"] = <EditableField key="email" label={fl("lead_email")} required={rq("lead_email")} value={lead.email} fieldType="email" onChange={(val) => updateLeadField("email", val)} />;
    if (v("lead_phone"))
      m["Telefone"] = <EditableField key="phone" label={fl("lead_phone")} required={rq("lead_phone")} value={lead.phone} fieldType="phone" onChange={(val) => updateLeadField("phone", val)} />;
    if (v("lead_company"))
      m["Empresa"] = <EditableField key="company" label={fl("lead_company")} required={rq("lead_company")} value={lead.company} onChange={(val) => updateLeadField("company", val)} />;
    if (v("lead_role"))
      m["Cargo"] = <EditableField key="role" label={fl("lead_role")} required={rq("lead_role")} value={lead.role} onChange={(val) => updateLeadField("role", val)} />;

    // Informações Adicionais
    if (v("lead_origin"))
      m["Origem"] = <EditableField key="origin" label={fl("lead_origin")} required={rq("lead_origin")} value={lead.origin} onChange={(val) => updateLeadField("origin", val)} />;
    if (v("lead_segment"))
      m["Segmento"] = <EditableField key="segment" label={fl("lead_segment")} required={rq("lead_segment")} value={lead.segment} onChange={(val) => updateLeadField("segment", val)} />;
    if (v("lead_website"))
      m["Website"] = <EditableField key="website" label={fl("lead_website")} required={rq("lead_website")} value={lead.website} fieldType="link" onChange={(val) => updateLeadField("website", val)} />;
    if (v("lead_annual_revenue"))
      m["Receita Anual"] = <EditableField key="annualRevenue" label={fl("lead_annual_revenue")} required={rq("lead_annual_revenue")} value={lead.annualRevenue} fieldType="currency" onChange={(val) => updateLeadField("annualRevenue", val)} />;
    if (v("lead_employee_count"))
      m["Num. Funcionarios"] = <EditableField key="employeeCount" label={fl("lead_employee_count")} required={rq("lead_employee_count")} value={lead.employeeCount} fieldType="number" onChange={(val) => updateLeadField("employeeCount", val)} />;

    // Qualificação
    m["Score"] = <EditableField key="score" label={fl("lead_score") ?? "SCORE"} value={String(lead.score)} fieldType="number" editable={false} />;
    m["Progresso de Qualificacao"] = <EditableField key="qualProgress" label={fl("lead_qual_progress")} value={String(lead.qualificationProgress)} fieldType="percentage" editable={false} />;
    if (v("lead_preferred_contact"))
      m["Contato Preferencial"] = <EditableField key="preferredContact" label={fl("lead_preferred_contact")} required={rq("lead_preferred_contact")} value={lead.preferredContact} fieldType={getFieldType("lead", "lead_preferred_contact", "combobox")} onChange={(val) => updateLeadField("preferredContact", val)} options={getFieldOptions("lead", "lead_preferred_contact")} />;
    if (v("lead_conversion_rate"))
      m["Taxa de Conversao"] = <EditableField key="conversionRate" label={fl("lead_conversion_rate")} value={lead.conversionRate} fieldType="calculated" formula="leads_convertidos / total_leads * 100" />;

    // Marketing
    if (v("lead_mkt_campanha"))
      m["Campanha"] = <EditableField key="mktCampanha" label={fl("lead_mkt_campanha")} required={rq("lead_mkt_campanha")} value={lead.mktCampanha} onChange={(val) => updateLeadField("mktCampanha", val)} />;
    if (v("lead_mkt_grupo"))
      m["Grupo de Anuncios"] = <EditableField key="mktGrupoAnuncios" label={fl("lead_mkt_grupo")} required={rq("lead_mkt_grupo")} value={lead.mktGrupoAnuncios} onChange={(val) => updateLeadField("mktGrupoAnuncios", val)} />;
    if (v("lead_mkt_anuncio"))
      m["Anuncio"] = <EditableField key="mktAnuncio" label={fl("lead_mkt_anuncio")} required={rq("lead_mkt_anuncio")} value={lead.mktAnuncio} onChange={(val) => updateLeadField("mktAnuncio", val)} />;
    if (v("lead_mkt_canal"))
      m["Canal"] = <EditableField key="mktCanal" label={fl("lead_mkt_canal")} required={rq("lead_mkt_canal")} value={lead.mktCanal} fieldType={getFieldType("lead", "lead_mkt_canal", "type")} onChange={(val) => updateLeadField("mktCanal", val)} options={getFieldOptions("lead", "lead_mkt_canal")} />;
    if (v("lead_mkt_conversao"))
      m["Ultima Conversao"] = <EditableField key="mktUltimaConversao" label={fl("lead_mkt_conversao")} required={rq("lead_mkt_conversao")} value={lead.mktUltimaConversao} fieldType="datetime" onChange={(val) => updateLeadField("mktUltimaConversao", val)} />;

    // Sistema / Info
    if (v("lead_owner"))
      m["Proprietario"] = <EditableField key="owner" label={fl("lead_owner")} required={rq("lead_owner")} value={lead.owner} fieldType="user" avatar={imgAvatar} onChange={(val) => updateLeadField("owner", val)} />;
    m["Data de Criacao"] = <EditableField key="createdAt" label={fl("lead_created_at")} value={lead.createdAt} editable={false} />;
    m["Ultima Atualizacao"] = <EditableField key="updatedAt" label={fl("lead_updated_at")} value={lead.updatedAt} editable={false} />;
    m["Criado Por"] = <EditableField key="createdBy" label={fl("lead_created_by")} value={lead.createdBy} fieldType="user" avatar={imgAvatar} editable={false} />;

    // Extra fields
    if (v("lead_address"))
      m["Endereco"] = <EditableField key="address" label={fl("lead_address")} required={rq("lead_address")} value={lead.address} fieldType="address" onChange={(val) => updateLeadField("address", val)} />;
    if (v("lead_notes"))
      m["Notas"] = <EditableField key="notes" label={fl("lead_notes")} required={rq("lead_notes")} value={lead.notes} fieldType="textarea" onChange={(val) => updateLeadField("notes", val)} />;
    if (v("lead_type"))
      m["Tipo"] = <EditableField key="type" label={fl("lead_type")} required={rq("lead_type")} value={lead.type} fieldType={getFieldType("lead", "lead_type", "type")} onChange={(val) => updateLeadField("type", val)} options={getFieldOptions("lead", "lead_type")} />;
    if (v("lead_is_active"))
      m["Status"] = <EditableField key="isActive" label={fl("lead_is_active")} required={rq("lead_is_active")} value={lead.isActive} fieldType="boolean" onChange={(val) => updateLeadField("isActive", val)} />;

    return m;
  }, [lead, fl, rq, v, updateLeadField, formulaCtx]);

  /* ─── Effective layout: from config or default ─── */
  const DEFAULT_DETAIL_LAYOUT = useMemo(() => [
    { title: "Detalhes do Lead", fields: ["Nome", "Sobrenome", "E-mail", "Telefone", "Empresa", "Cargo", "Tipo", "Proprietario", "Website", "Segmento", "Origem", "Contato Preferencial", "Receita Anual", "Taxa de Conversao", "Num. Funcionarios", "Status", "Endereco", "Notas"] },
    { title: "Dados de Marketing", fields: ["Campanha", "Grupo de Anuncios", "Anuncio", "Ultima Conversao", "Canal"] },
    { title: "Informacoes do Lead", fields: ["Ultima Atualizacao", "Data de Criacao", "Criado Por"] },
  ], []);

  const effectiveLayout = layoutConfig ?? DEFAULT_DETAIL_LAYOUT;

  /* ─── Section open/close state ─── */
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const toggleSection = useCallback((idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }));
  }, []);

  // Group activities by group
  const groupedActivities: { group: string; items: Activity[] }[] = [];
  mockActivities.forEach((a) => {
    const existing = groupedActivities.find((g) => g.group === a.group);
    if (existing) existing.items.push(a);
    else groupedActivities.push({ group: a.group, items: [a] });
  });

  if (leadLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircleNotch size={32} weight="bold" className="text-[#07abde] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-auto">
      {/* ═══════ TOP HEADER BAR ═══════ */}
      <div className="bg-white rounded-[16px] p-[20px] pb-0 mb-[12px] shrink-0">
        {/* Row 1: Lead name + labels + actions */}
        <div className="flex items-center justify-between gap-4 mb-[12px]">
          {/* Left: icon + name */}
          <div
            className="flex items-center gap-[10px] cursor-pointer group/header rounded-[100px] hover:bg-[#f6f7f9] transition-colors px-[4px] py-[2px] -mx-[4px] -my-[2px]"
            onClick={() => navigate("/crm/leads/configuracoes")}
          >
            <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#feedca] shrink-0">
              <Heart size={18} weight="duotone" className="text-[#eac23d]" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-[#64676c] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
              >
                LEAD
              </span>
              <div className="flex items-center gap-[2px]">
                <span
                  className="text-[#28415c]"
                  style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...fontFeature }}
                >
                  {`${lead.name} ${lead.lastName}`.trim()}
                </span>
                <CaretDown size={14} weight="bold" className="text-[#28415c] opacity-60 group-hover/header:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Right: labels + divider + actions + close */}
          <div className="flex items-center gap-[16px]">
            {/* Labels */}
            

            <VerticalDivider />

            {/* Tags / Etiquetas */}
            <div className="relative hidden lg:block" ref={tagMenuRef}>
              <div className="flex items-center gap-[6px]">
                {selectedTags.map((tagId) => {
                  const tag = leadTagOptions.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-1.5 px-[10px] h-[32px] rounded-[8px] text-label-sm ${tag.bg} ${tag.text}`}
                      style={fontFeature}
                    >
                      <span className={`size-[6px] rounded-full ${tag.dot}`} />
                      {tag.label}
                      <button
                        onClick={() => toggleTag(tag.id)}
                        className="ml-[2px] hover:opacity-70 transition-opacity cursor-pointer"
                      >
                        <X size={12} weight="bold" />
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Tag dropdown menu */}
              {showTagMenu && (
                <div
                  className="fixed z-[9999] min-w-[220px] backdrop-blur-[50px] bg-white flex flex-col gap-[8px] p-[12px] rounded-[34px]"
                  style={{
                    top: tagMenuRef.current
                      ? tagMenuRef.current.getBoundingClientRect().bottom + 6 + "px"
                      : "0px",
                    right: tagMenuRef.current
                      ? window.innerWidth - tagMenuRef.current.getBoundingClientRect().right + "px"
                      : "0px",
                  }}
                >
                  {/* Border overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[34px] border-[1.4px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                  {leadTagOptions.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex items-center gap-[4px] pr-[28px] py-[10px] rounded-[100px] transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#f6f7f9] text-[#28415c]"
                            : "text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c]"
                        }`}
                      >
                        <div className="flex items-center justify-center shrink-0 w-[44px]">
                          <span className={`size-[8px] rounded-full ${tag.dot}`} />
                        </div>
                        <span className="text-body flex-1 text-left leading-[24px]">{tag.label}</span>
                        {isSelected && <CheckCircle size={16} weight="bold" className="text-[#3CCEA7] shrink-0 ml-[8px]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider between tags and action pill */}
            {selectedTags.length > 0 && (
              <div className="hidden lg:block w-[1.5px] h-[20px] bg-[#DDE3EC] rounded-full" />
            )}

            {/* Action buttons pill */}
            <div className="hidden lg:flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
              <button
                ref={tagBtnRef}
                onClick={() => setShowTagMenu((v) => !v)}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c] cursor-pointer"
                title="Etiquetas"
              >
                <Tag size={18} weight="bold" />
              </button>
              <ActionButton><ClockCounterClockwise size={18} weight="bold" /></ActionButton>
              <ActionButton><Trash size={18} weight="bold" /></ActionButton>
              <ActionButton><LinkIcon size={18} weight="bold" /></ActionButton>
              <ActionButton><CopySimple size={18} weight="bold" /></ActionButton>
              <ActionButton onClick={() => {
                minimize({
                  id: lead.id,
                  title: `${lead.name} ${lead.lastName}`.trim(),
                  subtitle: lead.id,
                  path: `/crm/leads/${lead.id}`,
                  statusColor: "#eac23d",
                });
                navigate("/crm/leads");
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
        <div className="flex items-end gap-[12px] pb-[16px]">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[12px] flex-1">
            <EditableField label={fl("lead_role")} value={lead.role} editable={false} />
            <EditableField label={fl("lead_company")} value={lead.company} editable={false} />
            <EditableField label={fl("lead_phone")} value={lead.phone} fieldType="phone" editable={false} />
            <EditableField label={fl("lead_last_activity")} value={lead.lastActivity} ai editable={false} />
            <EditableField label={fl("lead_response_time")} value={lead.responseTime} ai editable={false} />
          </div>
          {stage !== "qualificado" && (
            <div className="flex items-center gap-[8px] shrink-0 pb-[2px]">
              <button
                onClick={() => setConvertModalOpen(true)}
                className="flex items-center justify-center h-[34px] px-[16px] rounded-[500px] bg-[#07ABDE] text-white cursor-pointer hover:bg-[#0483AB] transition-colors whitespace-nowrap"
                style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}
              >
                Converter Lead
              </button>

            </div>
          )}
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex gap-[12px] flex-1 min-h-0 overflow-hidden">
        {/* ─── LEFT + CENTER COLUMNS ─── */}
        <div className="flex-1 bg-white rounded-[16px] overflow-auto min-w-0">
          <div className="p-[18px]">
            {/* Pipeline Control */}
            <div className="mb-[24px]">
              <PipelineControl stage={stage} onStageChange={handleStageChange} />
            </div>

            {stage === "qualificado" && (
              <div className="mb-[16px] flex items-center gap-[8px] bg-[#D9F8EF] rounded-[10px] px-[16px] py-[10px]">
                <CheckCircle size={18} weight="fill" className="text-[#3CCEA7] shrink-0" />
                <span
                  className="text-[#135543]"
                  style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}
                >
                  Lead convertido com sucesso
                </span>
              </div>
            )}

            <FieldDndProvider>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">

              {/* ═══ COL 1–2 : Dynamic layout sections ═══ */}
              <div className="lg:col-span-2 flex flex-col gap-[16px]">
                {/* Stage complement – always first */}
                {effectiveLayout.slice(0, 1).map((section, sIdx) => {
                  const sectionFields = section.fields
                    .map((label) => fieldMap[label])
                    .filter(Boolean);
                  if (sectionFields.length === 0) return null;
                  return (
                    <SectionToggle
                      key={section.title}
                      title={section.title}
                      expanded={openSections[sIdx] ?? true}
                      onToggle={() => toggleSection(sIdx)}
                    >
                      <div className="mt-[12px] pl-[39px]">
                        {/* Stage complement at top of first section */}
                        {sIdx === 0 && v("lead_stage_complement") && (
                          <div className="mb-[12px]">
                            <DraggableFieldGrid storageKey={`lead-stagecomp-${lead.id}`} columns={2}>
                              <EditableField
                                key="stage_complement"
                                label={fl("lead_stage_complement")}
                                required={rq("lead_stage_complement")}
                                value={stageComplement}
                                onChange={(val) => {
                                  setStageComplement(val);
                                  patchLeadApi(lead.id, { stage_complement: val } as any).catch((err) =>
                                    console.error("Error persisting lead stage_complement:", err)
                                  );
                                }}
                                fieldType="contextual"
                                contextualValue={stage}
                                contextualOptions={{
                                  novo: [
                                    { value: "sem_contato", label: "Sem contato" },
                                    { value: "tentativa_contato", label: "Tentativa de contato" },
                                    { value: "caixa_postal", label: "Caixa postal" },
                                    { value: "nao_responde", label: "Não responde" },
                                  ],
                                  em_contato: [
                                    { value: "mensagem_enviada", label: "Mensagem enviada" },
                                    { value: "email_enviado", label: "Email enviado" },
                                    { value: "ligacao_realizada", label: "Ligação realizada" },
                                  ],
                                  qualificacao: [
                                    { value: "sondagem", label: "Sondagem de qualificação" },
                                    { value: "aguardando_retorno", label: "Aguardando retorno" },
                                  ],
                                  descartado: [
                                    { value: "sem_interesse", label: "Não tem interesse" },
                                    { value: "nao_solicitou", label: "Não solicitou contato" },
                                    { value: "lista_bloqueio", label: "Lista de bloqueio" },
                                    { value: "contatos_incorretos", label: "Contatos incorretos" },
                                    { value: "fora_perfil", label: "Fora do perfil" },
                                    { value: "achou_caro", label: "Achou caro" },
                                    { value: "fechou_concorrencia", label: "Fechou com a concorrência" },
                                  ],
                                  qualificado: [
                                    { value: "reuniao_agendada", label: "Reunião agendada" },
                                    { value: "proposta_enviada", label: "Proposta enviada" },
                                    { value: "convertido", label: "Convertido em oportunidade" },
                                  ],
                                }}
                              />
                            </DraggableFieldGrid>
                          </div>
                        )}
                        <DraggableFieldGrid storageKey={`lead-layout-${lead.id}-s${sIdx}`} columns={2}>
                          {sectionFields}
                        </DraggableFieldGrid>
                      </div>
                    </SectionToggle>
                  );
                })}

                {/* Remaining layout sections (index >= 1) for left column */}
                {effectiveLayout.slice(1).map((section, rawIdx) => {
                  const sIdx = rawIdx + 1;
                  const sectionFields = section.fields
                    .map((label) => fieldMap[label])
                    .filter(Boolean);
                  if (sectionFields.length === 0) return null;
                  return (
                    <SectionToggle
                      key={section.title}
                      title={section.title}
                      expanded={openSections[sIdx] ?? (sIdx < 2)}
                      onToggle={() => toggleSection(sIdx)}
                    >
                      <div className="mt-[12px] pl-[39px]">
                        <DraggableFieldGrid storageKey={`lead-layout-${lead.id}-s${sIdx}`} columns={2}>
                          {sectionFields}
                        </DraggableFieldGrid>
                      </div>
                    </SectionToggle>
                  );
                })}

                {/* Formula fields – always shown */}
                <SectionToggle title="Campos Calculados" expanded={detailsOpen} onToggle={() => setDetailsOpen((x) => !x)}>
                  <div className="mt-[12px] pl-[39px]">
                    <DraggableFieldGrid storageKey={`lead-formula-${lead.id}`} columns={2}>
                      {v("lead_days_no_contact") && <EditableField
                        key="daysSinceContact"
                        label={fl("lead_days_no_contact")}
                        value=""
                        fieldType="calculated"
                        formula="DAYS_SINCE([lastActivityDate])"
                        formulaExpression="DAYS_SINCE([lastActivityDate])"
                        formulaReturnType="number"
                        formulaContext={formulaCtx}
                      />}
                      {v("lead_rev_per_employee") && <EditableField
                        key="revenuePerEmployee"
                        label={fl("lead_rev_per_employee")}
                        value=""
                        fieldType="calculated"
                        formula="[annualRevenue] / [employeeCount]"
                        formulaExpression="[annualRevenue] / [employeeCount]"
                        formulaReturnType="currency"
                        formulaContext={formulaCtx}
                      />}
                      {v("lead_inactivity_alert") && <EditableField
                        key="inactivityAlert"
                        label={fl("lead_inactivity_alert")}
                        value=""
                        fieldType="calculated"
                        formula='IF(DAYS_SINCE([lastActivityDate]) > 30, "Crítico", IF(DAYS_SINCE([lastActivityDate]) > 14, "Atenção", "OK"))'
                        formulaExpression='IF(DAYS_SINCE([lastActivityDate]) > 30, "Crítico", IF(DAYS_SINCE([lastActivityDate]) > 14, "Atenção", "OK"))'
                        formulaReturnType="text"
                        formulaContext={formulaCtx}
                      />}
                      {v("lead_classification") && <EditableField
                        key="leadClassification"
                        label={fl("lead_classification")}
                        value=""
                        fieldType="calculated"
                        formula='IF([score] >= 80, "Lead quente", IF([score] >= 50, "Lead em nutrição", "Lead frio"))'
                        formulaExpression='IF([score] >= 80, "Lead quente", IF([score] >= 50, "Lead em nutrição", "Lead frio"))'
                        formulaReturnType="text"
                        formulaContext={formulaCtx}
                      />}
                      {v("lead_commission") && <EditableField
                        key="sellerCommission"
                        label={fl("lead_commission")}
                        value=""
                        fieldType="calculated"
                        formula="[annualRevenue] * 0.05"
                        formulaExpression="[annualRevenue] * 0.05"
                        formulaReturnType="currency"
                        formulaContext={formulaCtx}
                      />}
                      {v("lead_score_normalized") && <EditableField
                        key="normalizedScore"
                        label={fl("lead_score_normalized")}
                        value=""
                        fieldType="calculated"
                        formula="[score]"
                        formulaExpression="[score]"
                        formulaReturnType="percentage"
                        formulaContext={formulaCtx}
                      />}
                    </DraggableFieldGrid>
                  </div>
                </SectionToggle>
              </div>

              {/* ═══ COL 3 : Qualificação ═══ */}
              <div className="lg:col-span-1 flex flex-col gap-[16px]">
                {/* ── Qualificação do Lead ── */}
                <SectionToggle
                  title="Qualificação do Lead"
                  expanded={qualificationOpen}
                  onToggle={() => setQualificationOpen((x) => !x)}
                >
                  <div className="mt-[12px] pl-[39px]">
                    <div className="flex flex-col gap-[16px]">
                      {/* Powered by badge */}
                      <div className="flex items-center gap-[6px]">
                        <Sparkle size={14} weight="duotone" className="text-[#98989d]" />
                        <span
                          className="text-[#98989d] uppercase"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                        >
                          POWERED BY HTZ-AI
                        </span>
                      </div>

                      {/* Lead Score Card */}
                      <LeadScoreCard score={lead.score} label={lead.scoreLabel} />

                      {/* Progress */}
                      <EditableField label={fl("lead_qual_progress")} value={String(lead.qualificationProgress)} fieldType="percentage" ai editable={false} />

                      {/* Qualification Questions */}
                      {lead.qualificationQuestions.map((q, i) => (
                        <EditableField key={i} label={q.question} value={q.answer} onChange={(val) => {
                          setLead((prev) => {
                            const qs = [...prev.qualificationQuestions];
                            qs[i] = { ...qs[i], answer: val };
                            return { ...prev, qualificationQuestions: qs };
                          });
                        }} />
                      ))}
                    </div>
                  </div>
                </SectionToggle>
              </div>

              {/* ═══ FULL WIDTH : Informações do Sistema ═══ */}
              <div className="lg:col-span-3 flex flex-col gap-[16px]">
                <SectionToggle title="Informações do Sistema" expanded={systemOpen} onToggle={() => setSystemOpen((x) => !x)}>
                  <div className="mt-[12px] pl-[39px]">
                    <DraggableFieldGrid storageKey={`lead-sys-${lead.id}`} columns={3}>
                      <EditableField key="recordId" label={fl("lead_id")} value={lead.id} fieldType="id" />
                      <EditableField key="lastRef" label={fl("lead_last_ref")} value={lead.lastReferencedDate} editable={false} />
                      <EditableField key="isDeleted" label={fl("lead_is_deleted")} value={lead.isDeleted} fieldType="boolean" editable={false} />
                      <EditableField key="sysModstamp" label={fl("lead_system_modstamp")} value={lead.systemModstamp} editable={false} />
                      <EditableField key="lastViewed" label={fl("lead_last_viewed")} value={lead.lastViewedDate} editable={false} />
                      <EditableField
                        key="stageTime"
                        label={fl("lead_time_in_stage")}
                        value=""
                        fieldType="calculated"
                        formula='CONCAT(TEXT(DAYS_SINCE([stageLastChangedAt])), " dias")'
                        formulaExpression='CONCAT(TEXT(DAYS_SINCE([stageLastChangedAt])), " dias")'
                        formulaReturnType="text"
                        formulaContext={formulaCtx}
                        editable={false}
                      />
                    </DraggableFieldGrid>

                    {/* ── Histórico de Alterações de Campo ── */}
                    {fieldHistoryEntries.length > 0 && (
                      <div className="mt-[16px]">
                        <span
                          className="text-[#98989d] uppercase"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                        >
                          HISTÓRICO DE ALTERAÇÕES
                        </span>
                        <div className="flex flex-col gap-[4px] mt-[8px]">
                          {fieldHistoryEntries.slice(0, 10).map((entry) => {
                            const stageLabel = (key: string | null) =>
                              STAGES.find((s) => s.key === key)?.label ?? key ?? "—";
                            const date = new Date(entry.changed_at);
                            const formattedDate = date.toLocaleDateString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                            });
                            const formattedTime = date.toLocaleTimeString("pt-BR", {
                              hour: "2-digit", minute: "2-digit",
                            });
                            const isStage = entry.field_name === "stage";
                            return (
                              <div
                                key={entry.id}
                                className="flex items-center gap-[8px] px-[8px] py-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors"
                              >
                                <div
                                  className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                                  style={{ backgroundColor: "#E8E8FD" }}
                                >
                                  <ClockCounterClockwise size={14} weight="duotone" style={{ color: "#8C8CD4" }} />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span
                                    className="text-[#4e6987] truncate"
                                    style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
                                  >
                                    {entry.changed_by} alterou{" "}
                                    <span className="font-bold">
                                      {isStage ? "Estágio" : entry.field_name}
                                    </span>
                                  </span>
                                  <span
                                    className="text-[#98989d]"
                                    style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}
                                  >
                                    {isStage
                                      ? `${stageLabel(entry.old_value)} → ${stageLabel(entry.new_value)}`
                                      : `${entry.old_value ?? "—"} → ${entry.new_value ?? "—"}`}
                                  </span>
                                </div>
                                <span
                                  className="text-[#98989d] shrink-0 text-right"
                                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
                                >
                                  {formattedDate} {formattedTime}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionToggle>
              </div>

              {/* ═══ FULL WIDTH : Campos Customizados ═══ */}
              {customFields.length > 0 && (
                <div className="lg:col-span-3 flex flex-col gap-[16px]">
                  <SectionToggle title="Campos Customizados" expanded={true} onToggle={() => {}}>
                    <div className="mt-[12px] pl-[39px]">
                      <DraggableFieldGrid storageKey={`lead-custom-${lead.id}`} columns={2}>
                        {customFields.map((cf) => (
                          <EditableField
                            key={cf.key}
                            label={cf.label.toUpperCase()}
                            value={customValues[cf.key] ?? ""}
                            fieldType={cf.fieldType as any}
                            onChange={(val) => updateCustomValue(cf.key, val)}
                            options={cf.options?.map((o) => ({ value: o.value, label: o.label, color: o.color })) ?? undefined}
                          />
                        ))}
                      </DraggableFieldGrid>
                    </div>
                  </SectionToggle>
                </div>
              )}

            </div>
            </FieldDndProvider>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Activities ─── */}
        <div className="hidden xl:flex flex-col w-[306px] shrink-0 bg-white rounded-[16px] overflow-hidden">
          {/* Activity Tabs */}
          <div className="p-[12px] pb-0">
            <div
              className="flex gap-[4px] h-[44px] items-center justify-center overflow-hidden p-[4px] rounded-[100px] bg-[#f6f7f9]"
              style={{
                boxShadow:
                  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
              }}
            >
              {(["feed", "engajamento"] as const).map((tab) => {
                const isActive = activityTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActivityTab(tab)}
                    className={`flex-1 h-[36px] flex items-center justify-center gap-[3px] rounded-[20px] cursor-pointer transition-all relative ${
                      isActive ? "bg-[#28415c] backdrop-blur-[50px]" : "hover:bg-white/20"
                    }`}
                    style={isActive ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" } : undefined}
                  >
                    {isActive && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-[20px] pointer-events-none"
                        style={{ border: "0.5px solid rgba(200,207,219,0.6)" }}
                      />
                    )}
                    {tab === "feed" && (
                      <ListBullets size={15} weight={isActive ? "fill" : "duotone"} className={isActive ? "text-[#f6f7f9]" : "text-[#98989d]"} />
                    )}
                    {tab === "engajamento" && (
                      <FunnelSimple size={15} weight={isActive ? "fill" : "duotone"} className={isActive ? "text-[#f6f7f9]" : "text-[#98989d]"} />
                    )}
                    <span
                      className={`uppercase ${isActive ? "text-[#f6f7f9]" : "text-[#98989d]"}`}
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                    >
                      {tab}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Header */}
          <div className="flex items-center gap-[6px] px-[20px] py-[12px]">
            <div className="flex items-center gap-[6px] flex-1 min-w-0 cursor-pointer">
              <div className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#dde3ec] shrink-0">
                <ListBullets size={17} weight="duotone" className="text-[#4e6987]" />
              </div>
              <span
                className="text-[#4e6987]"
                style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
              >
                Atividades
              </span>
              <CaretDown size={14} weight="bold" className="text-[#4e6987] shrink-0" />
            </div>
            <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
              <FunnelSimple size={17} weight="duotone" />
            </button>
            <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
              <GearSix size={17} weight="duotone" />
            </button>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-auto px-[4px]">
            <div className="flex flex-col gap-[4px] items-center">
              {groupedActivities.map((group) => (
                <div key={group.group} className="w-full flex flex-col gap-[4px] items-center">
                  <span
                    className="text-[#64676c] uppercase text-center"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                  >
                    {group.group}
                  </span>
                  {group.items.map((a) => (
                    <ActivityItem key={a.id} activity={a} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Add Activity Button */}
          <div className="p-[16px] flex justify-center">
            <button
              className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors"
            >
              <Plus size={16} weight="bold" />
              <span
                style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
              >
                Adicionar atividade
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ CONVERT LEAD MODAL ═══════ */}
      <ConvertLeadModal
        open={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        onConverted={(result) => {
          setConvertModalOpen(false);
          setStage("qualificado");

          // Record stage change in field history
          recordChange({
            entity_type: "lead",
            entity_id: lead.id,
            field_name: "stage",
            old_value: stage,
            new_value: "qualificado",
            changed_by: lead.owner,
            change_source: "conversion",
          });
          setFieldHistoryEntries(
            getEntityHistory({ entity_type: "lead", entity_id: lead.id })
          );

          // Show success toast with links
          const parts: string[] = [];
          if (result.accountId) parts.push(`Conta ${result.accountId}`);
          if (result.contactId) parts.push(`Contato ${result.contactId}`);
          if (result.opportunityId) parts.push(`Oportunidade ${result.opportunityId}`);
          toast.success(`Lead convertido com sucesso! Criados: ${parts.join(", ")}`);
        }}
        lead={{
          id: lead.id,
          name: lead.name,
          lastName: lead.lastName,
          company: lead.company,
          email: lead.email,
          owner: lead.owner,
          phone: lead.phone,
          role: lead.role,
        }}
      />

    </div>
  );
}