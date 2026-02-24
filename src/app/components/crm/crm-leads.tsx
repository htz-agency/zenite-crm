import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Heart,
  CaretDown,
  CaretLeft,
  CaretRight,
  Sparkle,
  ChatCircle,
  Trophy,
  CheckCircle,
  XCircle,
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
  Briefcase,
  Building,
  CalendarBlank,
  ChatCircleDots,
  Phone,
  GearSix,
  PushPin,
  Bell,
  Info,
  Link as LinkIcon,
  ArrowSquareDownRight,
  Columns,
  Kanban,
  Table,
  Plus,
} from "@phosphor-icons/react";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { toast } from "sonner";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";
import { RelativeDatePicker } from "./relative-date-picker";
import { matchesRelativeDate, type DateRange } from "./relative-date-engine";
import {
  listLeads,
  patchLead,
  seedCrmData,
  dbLeadToFrontend,
  generateCrmId,
  listAccounts,
  getObjectConfig,
  type ObjectConfig,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";
import { useCreateLead } from "./create-lead-context";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LeadStage = "novo" | "em_contato" | "qualificacao" | "qualificado" | "descartado";

interface Lead {
  id: string;
  name: string;
  lastName: string;
  role: string;
  company: string;
  stage: LeadStage;
  stageComplement?: string;
  qualificationProgress: number; // 0-100
  lastActivityDate: string;
  comments: number;
  calls: number;
  owner: string;
  origin: string;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const TOUCH_BACKEND_OPTIONS = { enableMouseEvents: true };
const LEAD_CARD_TYPE = "LEAD_CARD";
const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

interface StageConfig {
  label: string;
  bg: string;
  color: string;
  icon: React.ComponentType<{ size?: number; weight?: "fill" | "duotone" | "bold" }>;
}

const stageConfig: Record<LeadStage, StageConfig> = {
  novo:          { label: "NOVO",          bg: "#dde3ec", color: "#28415c", icon: Sparkle },
  em_contato:    { label: "EM CONTATO",    bg: "#dde3ec", color: "#28415c", icon: ChatCircle },
  qualificacao:  { label: "QUALIFICAÇÃO",  bg: "#dde3ec", color: "#28415c", icon: Trophy },
  qualificado:   { label: "QUALIFICADO",   bg: "#d9f8ef", color: "#135543", icon: CheckCircle },
  descartado:    { label: "DESCARTADO",    bg: "#ffedeb", color: "#b13b00", icon: XCircle },
};

const STAGES: LeadStage[] = ["novo", "em_contato", "qualificacao", "qualificado", "descartado"];

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const mockLeads: Lead[] = [
  { id: "LD-A1B2", name: "Ana", lastName: "Carolina", role: "Diretora de Marketing", company: "Empresa Alpha", stage: "novo", qualificationProgress: 5, lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "João Silva", origin: "Email" },
  { id: "LD-C3D4", name: "Bruno", lastName: "Mendes", role: "CEO", company: "Beta Solutions", stage: "novo", qualificationProgress: 12, lastActivityDate: "2026-01-15", comments: 1, calls: 0, owner: "Maria Oliveira", origin: "LinkedIn" },
  { id: "LD-E5F6", name: "Carlos", lastName: "Eduardo", role: "Gerente de compras", company: "Gamma Corp", stage: "em_contato", qualificationProgress: 30, lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Pedro Costa", origin: "Telefone" },
  { id: "LD-G7H8", name: "Daniela", lastName: "Souza", role: "Head de Vendas", company: "Delta Tech", stage: "em_contato", qualificationProgress: 45, lastActivityDate: "2026-02-01", comments: 3, calls: 2, owner: "Ana Paula", origin: "Email" },
  { id: "LD-J9K1", name: "Eduardo", lastName: "Lima", role: "Cargo do Lead", company: "XPTO Company", stage: "qualificacao", qualificationProgress: 75, lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Carlos Pereira", origin: "Site" },
  { id: "LD-L2M3", name: "Fernanda", lastName: "Costa", role: "COO", company: "Epsilon Ltda", stage: "qualificacao", qualificationProgress: 60, lastActivityDate: "2026-01-20", comments: 4, calls: 1, owner: "Fernanda Santos", origin: "Email" },
  { id: "LD-N4P5", name: "Gabriel", lastName: "Santos", role: "Cargo do Lead", company: "XPTO Company", stage: "qualificado", qualificationProgress: 90, lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Rafael Alves", origin: "LinkedIn" },
  { id: "LD-Q6R7", name: "Helena", lastName: "Rocha", role: "Gerente de Projetos", company: "Zeta Inc", stage: "qualificado", qualificationProgress: 85, lastActivityDate: "2026-02-10", comments: 5, calls: 3, owner: "Juliana Ferreira", origin: "Email" },
  { id: "LD-S8T9", name: "Igor", lastName: "Nascimento", role: "Cargo do Lead", company: "XPTO Company", stage: "descartado", qualificationProgress: 20, lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Lucas Souza", origin: "Telefone" },
  { id: "LD-U1V2", name: "Julia", lastName: "Martins", role: "Coordenadora", company: "Theta SA", stage: "novo", qualificationProgress: 8, lastActivityDate: "2026-02-15", comments: 0, calls: 1, owner: "Camila Ribeiro", origin: "Email" },
  { id: "LD-W3X4", name: "Kleber", lastName: "Oliveira", role: "Diretor Comercial", company: "Iota Group", stage: "em_contato", qualificationProgress: 50, lastActivityDate: "2026-01-28", comments: 2, calls: 1, owner: "Rafaela Costa", origin: "LinkedIn" },
  { id: "LD-Y5Z6", name: "Larissa", lastName: "Campos", role: "Analista Sr.", company: "Kappa Digital", stage: "qualificacao", qualificationProgress: 65, lastActivityDate: "2026-02-05", comments: 1, calls: 2, owner: "João Pedro", origin: "Email" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Vertical Divider                                                   */
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

/* ------------------------------------------------------------------ */
/*  Horizontal Divider (from Figma)                                    */
/* ------------------------------------------------------------------ */

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
/*  Circular Checkbox (from Figma)                                     */
/* ------------------------------------------------------------------ */

function CircleCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative shrink-0 size-[16px] cursor-pointer"
    >
      <div
        className={`absolute inset-0 rounded-full border-[1.5px] border-solid transition-colors ${
          checked ? "border-[#3ccea7] bg-[#3ccea7]" : "border-[#28415c] bg-transparent backdrop-blur-[20px]"
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
const INITIAL_COL_WIDTHS = [120, 136, 137, 107, 136, 154, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "NOME DO LEAD",
  "CARGO",
  "EMPRESA",
  "ESTÁGIO",
  "PROPRIETÁRIO",
  "ÚLTIMA ATIVIDADE",
  "ORIGEM",
];

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

const stageTableLabel: Record<LeadStage, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  qualificacao: "Qualificação",
  qualificado: "Qualificado",
  descartado: "Descartado",
};

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
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function QualificationProgress({ percent }: { percent: number }) {
  return (
    <div className="w-full">
      <span
        className="text-[#98989d] uppercase block mb-[5px]"
        style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
      >
        Progresso de Qualificação
      </span>
      <div
        className="relative h-[9px] bg-[#f6f7f9] rounded-[100px] overflow-hidden"
        style={{
          boxShadow:
            "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[9px] rounded-[100px] bg-[#3ccea7] backdrop-blur-[50px]"
          style={{
            width: `${Math.max(5, Math.min(100, percent))}%`,
            boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lead Card Content                                                  */
/* ------------------------------------------------------------------ */

function LeadCardContent({
  lead,
  activeMenu,
  setActiveMenu,
  menuRef,
  navigate,
}: {
  lead: Lead;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <>
      {/* Name + menu */}
      <div className="flex items-start justify-between gap-1 mb-[6px]">
        <p
          className="text-[#122232] truncate flex-1"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {`${lead.name} ${lead.lastName}`.trim()}
        </p>
        <div className="relative" ref={activeMenu === lead.id ? menuRef : undefined}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === lead.id ? null : lead.id);
            }}
            className="p-0.5 rounded-full hover:bg-[#DDE3EC] transition-colors opacity-0 group-hover/card:opacity-100"
          >
            <DotsThree size={14} className="text-[#4E6987]" weight="bold" />
          </button>
          {activeMenu === lead.id && (
            <div className="absolute right-0 top-6 z-30 backdrop-blur-[50px] bg-white flex flex-col gap-[2px] items-start p-[8px] rounded-[20px] min-w-[160px]">
              <div className="absolute border-[1.4px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]" style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }} />
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); navigate(`/crm/leads/${lead.id}`); }}
                className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[28px]"><Eye size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Visualizar</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); toast("Editar lead (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[28px]"><PencilSimple size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Editar</span>
              </button>
              <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); toast("Excluir lead (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#ED5200] hover:bg-[#FFEDEB] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[28px]"><Trash size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role */}
      <div className="flex items-center gap-[6px] mb-[2px]">
        <Briefcase size={13} weight="duotone" className="text-[#98989d] shrink-0" />
        <span
          className="text-[#4e6987] truncate"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
        >
          {lead.role}
        </span>
      </div>

      {/* Company */}
      <div className="flex items-center gap-[6px] mb-[12px]">
        <Building size={13} weight="duotone" className="text-[#98989d] shrink-0" />
        <span
          className="text-[#4e6987] truncate"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
        >
          {lead.company}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-[10px]">
        <QualificationProgress percent={lead.qualificationProgress} />
      </div>

      {/* Activity footer */}
      <div className="flex items-center justify-between">
        <span
          className="text-[#98989d] uppercase"
          style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
        >
          Atividades
        </span>
        <div className="flex items-center gap-[5px]">
          {/* Date */}
          <div className="flex items-center gap-0">
            <CalendarBlank size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {formatShortDate(lead.lastActivityDate)}
            </span>
          </div>
          {/* Comments */}
          <div className="flex items-center gap-[2px]">
            <ChatCircleDots size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {lead.comments}
            </span>
          </div>
          {/* Calls */}
          <div className="flex items-center gap-[2px]">
            <Phone size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {lead.calls}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  DnD: Draggable Lead Card                                           */
/* ------------------------------------------------------------------ */

interface DragItem {
  id: string;
  fromStage: LeadStage;
  lead: Lead;
}

function DraggableLeadCard({
  lead,
  navigate,
  activeMenu,
  setActiveMenu,
  menuRef,
}: {
  lead: Lead;
  navigate: ReturnType<typeof useNavigate>;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: LEAD_CARD_TYPE,
    item: { id: lead.id, fromStage: lead.stage, lead },
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
        style={{ minHeight: 140, padding: 12, opacity: 0.5 }}
      >
        <div style={{ visibility: "hidden" }}>
          <LeadCardContent lead={lead} activeMenu={null} setActiveMenu={() => {}} menuRef={menuRef} navigate={navigate} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(node) => { dragRef(node); }}
      onClick={() => navigate(`/crm/leads/${lead.id}`)}
      className="bg-white p-[12px] cursor-pointer hover:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] transition-all active:bg-[#F6F7F9] group/card rounded-[16px]"
    >
      <LeadCardContent lead={lead} activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuRef={menuRef} navigate={navigate} />
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
}: {
  stage: LeadStage;
  children: React.ReactNode;
  onDrop: (item: DragItem, newStage: LeadStage) => void;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: LEAD_CARD_TYPE,
    canDrop: (item) => item.fromStage !== stage,
    drop: (item) => { onDrop(item, stage); },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  return (
    <div
      ref={(node) => { dropRef(node); }}
      className={`flex flex-col min-w-[220px] flex-1 shrink-0 overflow-hidden transition-all ${
        isOver && canDrop ? "ring-2 ring-[#07abde] ring-inset rounded-xl" : ""
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
          <p className="text-[#122232] truncate" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.5, ...fontFeature }}>{`${item.lead.name} ${item.lead.lastName}`.trim()}</p>
          <div className="flex items-center gap-1 mt-1">
            <Building size={11} weight="duotone" className="text-[#98989d]" />
            <span className="text-[#4e6987]" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>{item.lead.company}</span>
          </div>
          <div className="mt-2">
            <QualificationProgress percent={item.lead.qualificationProgress} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stage Column Header Pill                                           */
/* ------------------------------------------------------------------ */

function StageHeaderPill({ stage }: { stage: LeadStage }) {
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

export function CrmLeads() {
  const navigate = useNavigate();
  const { query: globalSearch } = useCrmSearch();
  const { openModal: openCreateLeadModal, registerOnCreated } = useCreateLead();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "tabela">("kanban");
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* Register callback so the shared modal can add leads to this page's state */
  useEffect(() => {
    registerOnCreated((newLead: any) => {
      setLeads((prev) => [newLead, ...prev]);
    });
  }, [registerOnCreated]);

  /* ── Load from Supabase ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        /* Fetch leads + accounts in parallel */
        const [dbRows, acctRows] = await Promise.all([
          listLeads(),
          listAccounts(),
        ]);
        if (cancelled) return;

        const acctMap = Object.fromEntries(
          acctRows.map((a: any) => [a.id, a.name]),
        );

        if (dbRows.length === 0) {
          /* DB is empty — keep mock data, seed in background */
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

          const seedRows = mockLeads.map((l) => ({
            id: l.id, name: l.name, lastname: l.lastName, role: l.role,
            company: companyToAccountId[l.company] ?? null,
            stage: l.stage, qualification_progress: l.qualificationProgress,
            last_activity_date: l.lastActivityDate || null,
            owner: l.owner, origin: l.origin,
            email: `${l.name.toLowerCase().replace(/ /g, ".")}@example.com`,
          }));

          /* Seed in background — UI already shows mock data */
          seedCrmData({
            crm_accounts: accountSeedRows,
            crm_leads: seedRows,
          }).catch((err) => console.warn("Background seed error:", err));

          return;
        }

        /* Data exists — map account IDs → names */
        setLeads(dbRows.map((r) => {
          const mapped = dbLeadToFrontend(r);
          mapped.company = acctMap[r.company] ?? mapped.company;
          return mapped;
        }));
      } catch (err) {
        console.warn("Could not load leads from server, using local data:", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Relative date filter ── */
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);

  /* Exclude converted leads from all views */
  const activeLeads = leads.filter((l) => l.stageComplement !== "convertido");

  const afterDateFilter = dateFilter
    ? activeLeads.filter((l) => matchesRelativeDate(l.lastActivityDate, dateFilter))
    : activeLeads;

  const filteredLeads = globalSearch
    ? afterDateFilter.filter((l) => {
        const q = globalSearch.toLowerCase();
        return (
          `${l.name} ${l.lastName}`.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.role.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.owner.toLowerCase().includes(q) ||
          l.origin.toLowerCase().includes(q)
        );
      })
    : afterDateFilter;

  /* ── Table state ── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ROWS_PER_PAGE));
  const paginated = filteredLeads.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

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
      setSelectedIds(new Set(paginated.map((l) => l.id)));
    }
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

  const handleDrop = (item: DragItem, newStage: LeadStage) => {
    if (item.fromStage === newStage) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === item.id ? { ...l, stage: newStage } : l))
    );
    toast.success(`${`${item.lead.name} ${item.lead.lastName}`.trim()} movido para ${stageConfig[newStage].label}`);
    patchLead(item.id, { stage: newStage }).catch((err) =>
      console.error("Error persisting lead stage change:", err)
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#07abde] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando leads...</span>
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
              {/* Icon container */}
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#feedca] group-hover/title:bg-[#dde3ec] transition-colors">
                <Heart size={22} weight="duotone" className="text-[#eac23d] group-hover/title:text-[#28415c] transition-colors" />
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
                    Leads
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
                  onClick={() => { setTitleMenuOpen(false); navigate("/crm/leads/configuracoes"); }}
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
                  onClick={() => { setTitleMenuOpen(false); navigate("/crm/leads/configuracoes"); }}
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
                  onClick={() => { setTitleMenuOpen(false); navigate("/crm/leads/configuracoes"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Info size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Leads</span>
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
        <div className="flex items-center gap-1">
          {/* Segmented Control */}
          <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip">
            {/* CARDS button */}
            <button
              onClick={() => setViewMode("kanban")}
              className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "text-[#f6f7f9]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
            >
              {viewMode === "kanban" && (
                <>
                  <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                </>
              )}
              <Kanban size={14} weight={viewMode === "kanban" ? "fill" : "regular"} className="relative z-[1]" />
              <span
                className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 10, ...fontFeature }}
              >
                KANBAN
              </span>
            </button>

            {/* TABELA button */}
            <button
              onClick={() => setViewMode("tabela")}
              className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                viewMode === "tabela"
                  ? "text-[#f6f7f9]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
            >
              {viewMode === "tabela" && (
                <>
                  <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                </>
              )}
              <Table size={14} weight={viewMode === "tabela" ? "fill" : "regular"} className="relative z-[1]" />
              <span
                className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 10, ...fontFeature }}
              >
                TABELA
              </span>
            </button>

            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                boxShadow:
                  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          {/* Vertical Divider */}
          <VerticalDivider />

          {/* + button */}
          <button
            onClick={() => openCreateLeadModal()}
            className="relative flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#dcf0ff] text-[#28415c] hover:bg-[#cce7fb] transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
          </button>

          {/* Vertical Divider */}
          <VerticalDivider />

          {/* Relative Date Filter */}
          <RelativeDatePicker
            value={dateFilter}
            onSelect={(literal: string, _range: DateRange) => {
              setDateFilter(literal);
              setCurrentPage(1);
            }}
            onClear={() => {
              setDateFilter(undefined);
              setCurrentPage(1);
            }}
            compact
            placeholder="Última atividade"
          />

          {/* Active filter count */}
          {dateFilter && (
            <span
              className="flex items-center justify-center h-[22px] min-w-[22px] px-[6px] bg-[#07abde] text-white rounded-full"
              style={{ fontSize: 10, fontWeight: 700, ...fontFeature }}
            >
              {filteredLeads.length}
            </span>
          )}
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      {viewMode === "kanban" ? (
        <DndProvider backend={TouchBackend} options={TOUCH_BACKEND_OPTIONS}>
          <CustomDragLayer />
          <div className="flex-1 flex gap-[9px] overflow-x-auto pb-2 min-h-0">
            {STAGES.map((stage, idx) => {
              const colLeads = filteredLeads.filter((l) => l.stage === stage);
              return (
                <DroppableColumn key={stage} stage={stage} onDrop={handleDrop}>
                  {/* Column header pill */}
                  <div className="flex items-center gap-[9px] mb-[16px]">
                    <StageHeaderPill stage={stage} />
                    {idx < STAGES.length - 1 && <VerticalDivider />}
                  </div>

                  {/* Card list */}
                  <div className="flex-1 overflow-y-auto space-y-[10px] min-h-[200px] pr-1">
                    {colLeads.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[#C8CFDB]" style={{ fontSize: 11 }}>Nenhum lead</p>
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <DraggableLeadCard
                          key={lead.id}
                          lead={lead}
                          navigate={navigate}
                          activeMenu={activeMenu}
                          setActiveMenu={setActiveMenu}
                          menuRef={menuRef}
                        />
                      ))
                    )}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>
        </DndProvider>
      ) : (
        /* ═══════ TABLE VIEW (Figma style) ═══════ */
        <>
          <div className="flex-1 flex flex-col bg-white rounded-t-xl overflow-hidden">
            <div className="overflow-x-auto flex-1 flex flex-col min-w-0">
              <div className="w-fit min-w-full">
                {/* ── Column Headers ── */}
                <div
                  className="grid items-center px-5 pt-2 pb-0"
                  style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
                >
                  {/* # placeholder */}
                  <div />
                  {/* Select-all checkbox */}
                  <div className="flex items-center justify-center">
                    <CircleCheckbox
                      checked={paginated.length > 0 && selectedIds.size === paginated.length}
                      onChange={toggleSelectAll}
                    />
                  </div>
                  {/* Header cells */}
                  {COL_HEADERS.map((col, idx) => (
                    <div key={col} className="flex items-center h-[32px] relative cursor-pointer group/hdr">
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c] whitespace-nowrap leading-[20px]"
                        style={fontFeature}
                      >
                        {col}
                      </span>
                      {/* Resize handle + visual divider */}
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

                {/* ── Table rows ── */}
                <div className="flex flex-col mt-1">
                  {paginated.map((lead, idx) => {
                    const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                    const isSelected = selectedIds.has(lead.id);

                    return (
                      <div key={lead.id}>
                        <HorizontalDivider />
                        <div
                          onClick={() => navigate(`/crm/leads/${lead.id}`)}
                          className={`grid items-center h-[34px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
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
                              onChange={() => toggleSelect(lead.id)}
                            />
                          </div>

                          {/* Nome do Lead */}
                          <div
                            className="truncate text-[#07abde]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {`${lead.name} ${lead.lastName}`.trim()}
                          </div>

                          {/* Cargo */}
                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {lead.role}
                          </div>

                          {/* Empresa */}
                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {lead.company}
                          </div>

                          {/* Estágio */}
                          <div
                            className="truncate"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: stageConfig[lead.stage].color, ...fontFeature }}
                          >
                            {stageTableLabel[lead.stage]}
                          </div>

                          {/* Proprietário */}
                          <div className="flex items-center gap-[8px] truncate">
                            <img
                              alt=""
                              className="shrink-0 size-[18px] rounded-full object-cover"
                              src={imgAvatar}
                            />
                            <span
                              className="truncate text-[#07abde]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {lead.owner}
                            </span>
                          </div>

                          {/* Última Atividade */}
                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {formatRelativeDate(lead.lastActivityDate)}
                          </div>

                          {/* Origem */}
                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {lead.origin}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Bottom divider */}
                  <HorizontalDivider />
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ PAGINATION (Figma style) ═══════ */}
          {filteredLeads.length > ROWS_PER_PAGE && (
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
    </div>
  );
}