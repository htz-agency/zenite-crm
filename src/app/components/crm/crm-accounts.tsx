import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building,
  CaretDown,
  CaretLeft,
  CaretRight,
  Crosshair,
  GearSix,
  ListChecks,
  Globe,
  CheckCircle,
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
  CalendarBlank,
  ChatCircleDots,
  Phone,
  Plus,
  Link as LinkIcon,
  ArrowSquareDownRight,
  Columns,
  Table,
  Kanban,
  PushPin,
  Bell,
  Info,
  MapPin,
  IdentificationBadge,
  CurrencyCircleDollar,
  Users,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";
import {
  listAccounts,
  patchAccount,
  seedCrmData,
  dbAccountToFrontend,
  generateCrmId,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";
import { OwnerCell } from "./owner-cell";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AccountStage = "prospeccao" | "implementacao" | "onboarding" | "vigente" | "finalizado";

interface Account {
  id: string;
  name: string;
  segment: string;
  cnpj: string;
  address: string;
  revenue: number;
  stage: AccountStage;
  lastActivityDate: string;
  comments: number;
  calls: number;
  owner: string;
  contacts: number;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const TOUCH_BACKEND_OPTIONS = { enableMouseEvents: true };
const ACCOUNT_CARD_TYPE = "ACCOUNT_CARD";
const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

interface StageConfig {
  label: string;
  bg: string;
  color: string;
  icon: React.ComponentType<{ size?: number; weight?: "fill" | "duotone" | "bold" }>;
}

const stageConfig: Record<AccountStage, StageConfig> = {
  prospeccao:     { label: "PROSPECÇÃO",     bg: "#dde3ec", color: "#28415c", icon: Crosshair },
  implementacao:  { label: "IMPLEMENTAÇÃO",  bg: "#dde3ec", color: "#28415c", icon: GearSix },
  onboarding:     { label: "ONBOARDING",     bg: "#dde3ec", color: "#28415c", icon: ListChecks },
  vigente:        { label: "VIGENTE",         bg: "#dde3ec", color: "#28415c", icon: Globe },
  finalizado:     { label: "FINALIZADO",      bg: "#d9f8ef", color: "#135543", icon: CheckCircle },
};

const STAGES: AccountStage[] = ["prospeccao", "implementacao", "onboarding", "vigente", "finalizado"];

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const mockAccounts: Account[] = [
  { id: "AC-A1B2", name: "XPTO Company", segment: "Tecnologia", cnpj: "12.345.678/0001-90", address: "Av. Paulista, 1000 - SP", revenue: 240000, stage: "prospeccao", lastActivityDate: "2026-02-15", comments: 3, calls: 2, owner: "João Silva", contacts: 4 },
  { id: "AC-C3D4", name: "Beta Solutions", segment: "Consultoria", cnpj: "23.456.789/0001-01", address: "Rua do Comércio, 250 - RJ", revenue: 180000, stage: "prospeccao", lastActivityDate: "2026-02-10", comments: 1, calls: 0, owner: "Maria Oliveira", contacts: 2 },
  { id: "AC-E5F6", name: "Gamma Corp", segment: "Indústria", cnpj: "34.567.890/0001-12", address: "Rua Augusta, 2000 - SP", revenue: 520000, stage: "implementacao", lastActivityDate: "2026-01-28", comments: 5, calls: 3, owner: "Pedro Costa", contacts: 6 },
  { id: "AC-G7H8", name: "Delta Tech", segment: "SaaS", cnpj: "45.678.901/0001-23", address: "Rua Espírito Santo, 100 - BH", revenue: 95000, stage: "implementacao", lastActivityDate: "2026-02-01", comments: 2, calls: 1, owner: "Ana Paula", contacts: 3 },
  { id: "AC-J9K1", name: "Epsilon Ltda", segment: "Varejo", cnpj: "56.789.012/0001-34", address: "Av. Sete de Setembro, 300 - CWB", revenue: 310000, stage: "onboarding", lastActivityDate: "2026-01-20", comments: 4, calls: 2, owner: "Carlos Pereira", contacts: 5 },
  { id: "AC-L2M3", name: "Zeta Inc", segment: "Financeiro", cnpj: "67.890.123/0001-45", address: "Av. Rio Branco, 50 - RJ", revenue: 780000, stage: "onboarding", lastActivityDate: "2026-02-12", comments: 3, calls: 1, owner: "Fernanda Santos", contacts: 8 },
  { id: "AC-N4P5", name: "Theta SA", segment: "Logística", cnpj: "78.901.234/0001-56", address: "Av. Ipiranga, 1200 - POA", revenue: 420000, stage: "vigente", lastActivityDate: "2026-02-18", comments: 6, calls: 4, owner: "Rafael Alves", contacts: 7 },
  { id: "AC-Q6R7", name: "Iota Group", segment: "Educação", cnpj: "89.012.345/0001-67", address: "Rua Consolação, 800 - SP", revenue: 150000, stage: "vigente", lastActivityDate: "2026-02-05", comments: 1, calls: 0, owner: "Juliana Ferreira", contacts: 2 },
  { id: "AC-S8T9", name: "Kappa Digital", segment: "Marketing", cnpj: "90.123.456/0001-78", address: "Rua Oscar Freire, 300 - SP", revenue: 65000, stage: "finalizado", lastActivityDate: "2026-01-09", comments: 2, calls: 1, owner: "Lucas Souza", contacts: 1 },
  { id: "AC-U1V2", name: "Lambda Media", segment: "Mídia", cnpj: "01.234.567/0001-89", address: "Rua Visconde de Pirajá, 400 - RJ", revenue: 290000, stage: "prospeccao", lastActivityDate: "2026-02-19", comments: 0, calls: 1, owner: "Camila Ribeiro", contacts: 3 },
  { id: "AC-W3X4", name: "Mu Design", segment: "Design", cnpj: "11.222.333/0001-44", address: "Rua da Bahia, 600 - BH", revenue: 115000, stage: "vigente", lastActivityDate: "2026-01-22", comments: 2, calls: 1, owner: "Rafaela Costa", contacts: 4 },
  { id: "AC-Y5Z6", name: "Nu Corp", segment: "Fintech", cnpj: "22.333.444/0001-55", address: "Av. Brigadeiro, 900 - SP", revenue: 980000, stage: "finalizado", lastActivityDate: "2026-02-08", comments: 3, calls: 2, owner: "João Pedro", contacts: 9 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
const INITIAL_COL_WIDTHS = [160, 120, 120, 120, 136, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "CONTA",
  "SEGMENTO",
  "ESTÁGIO",
  "RECEITA",
  "PROPRIETÁRIO",
  "ÚLTIMA ATIVIDADE",
];

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

const stageTableLabel: Record<AccountStage, string> = {
  prospeccao: "Prospecção",
  implementacao: "Implementação",
  onboarding: "Onboarding",
  vigente: "Vigente",
  finalizado: "Finalizado",
};

/* ------------------------------------------------------------------ */
/*  Account Card Content                                               */
/* ------------------------------------------------------------------ */

function AccountCardContent({
  account,
  activeMenu,
  setActiveMenu,
  menuRef,
  navigate,
  isSelected,
  onToggleSelect,
}: {
  account: Account;
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
          {account.name}
        </p>
        <div className="flex items-center gap-[2px]">
          {/* Selection checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(account.id); }}
            className={`p-0.5 rounded-full hover:bg-[#DDE3EC] transition-colors cursor-pointer ${
              isSelected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
            }`}
          >
            <div className={`size-[14px] rounded-full border-[1.5px] transition-colors flex items-center justify-center ${
              isSelected ? "border-[#07ABDE] bg-[#07ABDE]" : "border-[#c8cfdb] bg-transparent"
            }`}>
              {isSelected && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3.25 5.75L6.5 2.25" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
          {/* Dots menu */}
          <div className="relative" ref={activeMenu === account.id ? menuRef : undefined}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === account.id ? null : account.id);
              }}
              className="p-0.5 rounded-full hover:bg-[#DDE3EC] transition-colors opacity-0 group-hover/card:opacity-100"
            >
              <DotsThree size={14} className="text-[#4E6987]" weight="bold" />
            </button>
            {activeMenu === account.id && (
              <div className="absolute right-0 top-6 z-30 backdrop-blur-[50px] bg-white flex flex-col gap-[2px] items-start p-[8px] rounded-[20px] min-w-[160px]">
                <div
                  aria-hidden="true"
                  className="absolute border-[1.4px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]"
                  style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(null); navigate(`/crm/contas/${account.id}`); }}
                  className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[28px]"><Eye size={12} /></div>
                  <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Visualizar</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(null); toast("Editar conta (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[28px]"><PencilSimple size={12} /></div>
                  <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Editar</span>
                </button>
                <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(null); toast("Excluir conta (em breve)"); }}
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

      {/* Segment */}
      <div className="flex items-center gap-[6px] mb-[2px]">
        <IdentificationBadge size={13} weight="duotone" className="text-[#98989d] shrink-0" />
        <span
          className="text-[#4e6987] truncate"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
        >
          {account.segment}
        </span>
      </div>

      {/* Revenue */}
      <div className="flex items-center gap-[6px] mb-[2px]">
        <CurrencyCircleDollar size={13} weight="duotone" className="text-[#98989d] shrink-0" />
        <span
          className="text-[#4e6987] truncate"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
        >
          {formatCurrency(account.revenue)}
        </span>
      </div>

      {/* Contacts count */}
      <div className="flex items-center gap-[6px] mb-[12px]">
        <Users size={13} weight="duotone" className="text-[#98989d] shrink-0" />
        <span
          className="text-[#4e6987] truncate"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
        >
          {account.contacts} contato{account.contacts !== 1 ? "s" : ""}
        </span>
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
          <div className="flex items-center gap-0">
            <CalendarBlank size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {formatShortDate(account.lastActivityDate)}
            </span>
          </div>
          <div className="flex items-center gap-[2px]">
            <ChatCircleDots size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {account.comments}
            </span>
          </div>
          <div className="flex items-center gap-[2px]">
            <Phone size={13} weight="duotone" className="text-[#98989d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              {account.calls}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  DnD: Draggable Account Card                                        */
/* ------------------------------------------------------------------ */

interface DragItem {
  id: string;
  fromStage: AccountStage;
  account: Account;
}

function DraggableAccountCard({
  account,
  navigate,
  activeMenu,
  setActiveMenu,
  menuRef,
  isSelected,
  onToggleSelect,
}: {
  account: Account;
  navigate: ReturnType<typeof useNavigate>;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ACCOUNT_CARD_TYPE,
    item: { id: account.id, fromStage: account.stage, account },
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
          <AccountCardContent account={account} activeMenu={null} setActiveMenu={() => {}} menuRef={menuRef} navigate={navigate} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(node) => { dragRef(node); }}
      onClick={() => navigate(`/crm/contas/${account.id}`)}
      className={`bg-white p-[12px] cursor-grab hover:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] transition-all active:bg-[#F6F7F9] group/card rounded-[16px] active:cursor-grabbing ${
        isSelected ? "ring-2 ring-[#07ABDE] ring-inset" : ""
      }`}
    >
      <AccountCardContent account={account} activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuRef={menuRef} navigate={navigate} isSelected={isSelected} onToggleSelect={onToggleSelect} />
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
  stage: AccountStage;
  children: React.ReactNode;
  onDrop: (item: DragItem, newStage: AccountStage) => void;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: ACCOUNT_CARD_TYPE,
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
          <p className="text-[#122232] truncate" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.5, ...fontFeature }}>{item.account.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <IdentificationBadge size={11} weight="duotone" className="text-[#98989d]" />
            <span className="text-[#4e6987]" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>{item.account.segment}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <CurrencyCircleDollar size={11} weight="duotone" className="text-[#98989d]" />
            <span className="text-[#4e6987]" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>{formatCurrency(item.account.revenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stage Column Header Pill                                           */
/* ------------------------------------------------------------------ */

function StageHeaderPill({ stage }: { stage: AccountStage }) {
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

export function CrmAccounts() {
  const navigate = useNavigate();
  const { query: globalSearch } = useCrmSearch();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "tabela">("kanban");
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* ── Load from Supabase ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbRows = await listAccounts();
        if (cancelled) return;
        if (dbRows.length === 0) {
          /* DB empty — use mock data, seed in background */
          setAccounts(mockAccounts);
          setLoading(false);
          const seedRows = mockAccounts.map((a) => ({
            id: a.id, name: a.name, segment: a.segment, cnpj: a.cnpj,
            billing_street: a.address, revenue: a.revenue, stage: a.stage,
            last_activity_date: a.lastActivityDate || null,
            comments: a.comments, calls: a.calls, owner: a.owner, contacts: a.contacts,
            type: "empresa" as const,
          }));
          seedCrmData({ crm_accounts: seedRows })
            .catch((err) => console.warn("Background seed error:", err));
          return;
        }
        setAccounts(dbRows.map(dbAccountToFrontend));
      } catch (err) {
        console.warn("Could not load accounts from server, using local data:", err);
        setAccounts(mockAccounts);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Table state ── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  /* ── Global search filter ── */
  const filteredAccounts = globalSearch
    ? accounts.filter((a) => {
        const q = globalSearch.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.segment.toLowerCase().includes(q) ||
          a.cnpj.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.owner.toLowerCase().includes(q) ||
          a.address.toLowerCase().includes(q)
        );
      })
    : accounts;

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / ROWS_PER_PAGE));
  const paginated = filteredAccounts.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

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
      setSelectedIds(new Set(paginated.map((a) => a.id)));
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

  const handleDrop = (item: DragItem, newStage: AccountStage) => {
    if (item.fromStage === newStage) return;
    setAccounts((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, stage: newStage } : a))
    );
    toast.success(`${item.account.name} movido para ${stageConfig[newStage].label}`);
    patchAccount(item.id, { stage: newStage }).catch((err) =>
      console.error("Error persisting account stage change:", err)
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#07abde] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando contas...</span>
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
              {/* Icon container — green palette */}
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#d9f8ef] group-hover/title:bg-[#dde3ec] transition-colors">
                <Building size={22} weight="duotone" className="text-[#3ccea7] group-hover/title:text-[#28415c] transition-colors" />
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
                    Contas
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
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Contas</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="hidden lg:flex items-center gap-[15px]">
            <div className="flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer">
                <LinkIcon size={18} />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer">
                <ArrowSquareDownRight size={18} />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer">
                <Columns size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ TABS ═══════ */}
        <div className="flex items-center gap-1">
          {/* Segmented Control */}
          <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip">
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
                CARDS
              </span>
            </button>

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
            onClick={() => toast("Nova conta (em breve)")}
            className="relative flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      {viewMode === "kanban" ? (
        <DndProvider backend={TouchBackend} options={TOUCH_BACKEND_OPTIONS}>
          <CustomDragLayer />
          <div className="flex-1 flex gap-[9px] overflow-x-auto pb-2 min-h-0">
            {STAGES.map((stage, idx) => {
              const colAccounts = filteredAccounts.filter((a) => a.stage === stage);
              return (
                <DroppableColumn key={stage} stage={stage} onDrop={handleDrop}>
                  {/* Column header pill */}
                  <div className="flex items-center gap-[9px] mb-[16px]">
                    <StageHeaderPill stage={stage} />
                    {idx < STAGES.length - 1 && <VerticalDivider />}
                  </div>

                  {/* Card list */}
                  <div className="flex-1 overflow-y-auto space-y-[10px] min-h-[200px] pr-1">
                    {colAccounts.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[#C8CFDB]" style={{ fontSize: 11 }}>Nenhuma conta</p>
                      </div>
                    ) : (
                      colAccounts.map((account) => (
                        <DraggableAccountCard
                          key={account.id}
                          account={account}
                          navigate={navigate}
                          activeMenu={activeMenu}
                          setActiveMenu={setActiveMenu}
                          menuRef={menuRef}
                          isSelected={selectedIds.has(account.id)}
                          onToggleSelect={toggleSelect}
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
        /* ═══════ TABLE VIEW ═══════ */
        <>
          <div className="flex-1 flex flex-col bg-white rounded-t-xl overflow-hidden">
            <div className="overflow-x-auto flex-1 flex flex-col min-w-0">
              <div className="w-fit min-w-full">
                {/* ── Column Headers ── */}
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

                {/* ── Table rows ── */}
                <div className="flex flex-col mt-1">
                  {paginated.map((account, idx) => {
                    const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                    const isSelected = selectedIds.has(account.id);
                    const sc = stageConfig[account.stage];

                    return (
                      <div key={account.id}>
                        <HorizontalDivider />
                        <div
                          onClick={() => navigate(`/crm/contas/${account.id}`)}
                          className={`grid items-center h-[34px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                            isSelected
                              ? "bg-[#f6f7f9]"
                              : "hover:bg-[#f6f7f9]"
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
                              onChange={() => toggleSelect(account.id)}
                            />
                          </div>
                          {/* Conta */}
                          <div className="flex items-center gap-[6px] truncate">
                            <div className="flex items-center justify-center shrink-0 w-[18px] h-[18px] rounded-[4px] bg-[#d9f8ef]">
                              <Building size={10} weight="fill" className="text-[#3ccea7]" />
                            </div>
                            <span
                              className="truncate text-[#0483AB]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {account.name}
                            </span>
                          </div>
                          {/* Segmento */}
                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {account.segment}
                          </div>
                          {/* Estágio */}
                          <div
                            className="truncate"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: sc.color, ...fontFeature }}
                          >
                            {stageTableLabel[account.stage]}
                          </div>
                          {/* Receita */}
                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {formatCurrency(account.revenue)}
                          </div>
                          {/* Proprietário */}
                          <OwnerCell ownerId={account.owner} />
                          {/* Última Atividade */}
                          <div
                            className="truncate text-[#28415c]"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                          >
                            {formatRelativeDate(account.lastActivityDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {paginated.length === 0 && (
                    <>
                      <HorizontalDivider />
                      <div className="flex flex-col items-center justify-center py-[48px] gap-[12px]">
                        <Building size={32} weight="duotone" className="text-[#c8cfdb]" />
                        <span className="text-[#98989d]" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                          Nenhuma conta encontrada
                        </span>
                      </div>
                    </>
                  )}
                  <HorizontalDivider />
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {accounts.length > ROWS_PER_PAGE && (
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