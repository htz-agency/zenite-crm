import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  MagnifyingGlass,
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
  Copy,
  SpinnerGap,
  Plus,
  CaretDown,
  CaretLeft,
  CaretRight,
  Table,
  Kanban,
  SlidersHorizontal,
  PencilSimpleLine,
  Robot,
  Envelope,
  Link as LinkIcon,
  CheckSquare,
  ArrowSquareDownRight,
  Columns,
  GearSix,
  PushPin,
  Bell,
  Info,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { formatCurrency, services as allServicesCatalog } from "./pricing-data";
import {
  listProposals,
  deleteProposalApi,
  duplicateProposalApi,
  updateProposalStatus,
  type DbProposal,
} from "./api";
import { DndProvider, useDrag, useDrop, useDragLayer } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { useSearch } from "./search-context";
import { PillButton } from "./pill-button";

const TOUCH_BACKEND_OPTIONS = { enableMouseEvents: true };

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "#4E6987", bg: "#F6F7F9" },
  criada:   { label: "Criada",   color: "#6868B1", bg: "#F0EEFA" },
  enviada:  { label: "Enviada",  color: "#0483AB", bg: "#E6F6FC" },
  aprovada: { label: "Aprovada", color: "#135543", bg: "#E4F5EF" },
  recusada: { label: "Recusada", color: "#B13B00", bg: "#FFF0EB" },
};

const KANBAN_STATUSES = ["rascunho", "criada", "enviada", "aprovada", "recusada"] as const;

const ROWS_PER_PAGE = 15;

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const KANBAN_CARD_TYPE = "KANBAN_CARD";

interface KanbanDragItem {
  id: string;
  fromStatus: string;
  proposal: DbProposal;
}

/* ---- Resizable columns config ---- */
const FIXED_LEFT = "28px 24px"; // # + checkbox
const INITIAL_COL_WIDTHS = [90, 150, 250, 120, 100, 120, 120]; // px
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "ID",
  "CLIENTE",
  "SERVIÇOS",
  "MENSALIDADE",
  "STATUS",
  "ATUALIZAÇÃO",
  "IMPLEMENTAÇÃO",
];

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

function formatDate(iso: string): string {
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

function getServiceNames(proposal: DbProposal): string[] {
  const svcs = proposal.price_proposal_services ?? [];
  return svcs.map((s) => {
    const catalogSvc = allServicesCatalog.find((c) => c.id === s.service_id);
    return catalogSvc?.name ?? s.service_id;
  });
}

/* ------------------------------------------------------------------ */
/*  Vertical Divider (from Figma)                                     */
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
/*  Horizontal Divider (from Figma)                                   */
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
/*  Circular Checkbox (from Figma)                                    */
/* ------------------------------------------------------------------ */

function CircleCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="relative shrink-0 size-[16px] cursor-pointer"
    >
      <div
        className={`absolute inset-0 rounded-full border-[1.5px] border-solid transition-colors ${
          checked
            ? "border-[#3ccea7] bg-[#3ccea7]"
            : "border-[#c8cfdb] bg-transparent backdrop-blur-[20px]"
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
/*  Kanban DnD Components                                              */
/* ------------------------------------------------------------------ */

function KanbanCardContent({
  proposal,
  navigate,
  activeMenu,
  setActiveMenu,
  menuRef,
  handleDuplicate,
  handleDelete,
}: {
  proposal: DbProposal;
  navigate: ReturnType<typeof useNavigate>;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  handleDuplicate: (id: string) => void;
  handleDelete: (id: string) => void;
}) {
  const serviceNames = getServiceNames(proposal);
  return (
    <>
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="min-w-0 flex-1">
          <p className="text-[#07ABDE] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>{proposal.client_name}</p>
          <p className="text-[#4E6987]" style={{ fontSize: 10, letterSpacing: -0.3, ...fontFeature }}>{proposal.id}</p>
        </div>
        <div className="relative" ref={activeMenu === proposal.id ? menuRef : undefined}>
          <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === proposal.id ? null : proposal.id); }} className="p-0.5 rounded-full hover:bg-[#DDE3EC] transition-colors opacity-0 group-hover/card:opacity-100">
            <DotsThree size={14} className="text-[#4E6987]" weight="bold" />
          </button>
          {activeMenu === proposal.id && (
            <div className="absolute right-0 top-6 z-30 backdrop-blur-[50px] bg-white flex flex-col gap-[2px] items-start p-[8px] rounded-[20px]">
              <div aria-hidden="true" className="absolute border-[1.4px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]" style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }} />
              <button onClick={(e) => { e.stopPropagation(); setActiveMenu(null); navigate(`/price/propostas/${proposal.id}`); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer">
                <div className="flex items-center justify-center shrink-0 w-[28px]"><Eye size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Visualizar</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setActiveMenu(null); navigate(`/price/editar-proposta/${proposal.id}`); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer">
                <div className="flex items-center justify-center shrink-0 w-[28px]"><PencilSimple size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Editar</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setActiveMenu(null); handleDuplicate(proposal.id); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer">
                <div className="flex items-center justify-center shrink-0 w-[28px]"><Copy size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Duplicar</span>
              </button>
              <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
              <button onClick={(e) => { e.stopPropagation(); setActiveMenu(null); handleDelete(proposal.id); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#ED5200] hover:bg-[#FFEDEB] transition-colors w-full cursor-pointer">
                <div className="flex items-center justify-center shrink-0 w-[28px]"><Trash size={12} /></div>
                <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {serviceNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {serviceNames.slice(0, 2).map((s) => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-[#F6F7F9] text-[#28415C]" style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{s}</span>
          ))}
          {serviceNames.length > 2 && (
            <span className="px-1.5 py-0.5 rounded bg-[#DCF0FF] text-[#025E7B]" style={{ fontSize: 10, fontWeight: 600 }}>+{serviceNames.length - 2}</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-[#EBF1FA]">
        <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.5, ...fontFeature }}>{formatCurrency(proposal.total_monthly ?? 0)}</span>
        <span className="text-[#4E6987]" style={{ fontSize: 10, letterSpacing: -0.3, ...fontFeature }}>{formatDate(proposal.updated_at || proposal.created_at)}</span>
      </div>
    </>
  );
}

function DraggableKanbanCard({
  proposal, navigate, activeMenu, setActiveMenu, menuRef, handleDuplicate, handleDelete,
}: {
  proposal: DbProposal; navigate: ReturnType<typeof useNavigate>; activeMenu: string | null; setActiveMenu: (id: string | null) => void; menuRef: React.RefObject<HTMLDivElement | null>; handleDuplicate: (id: string) => void; handleDelete: (id: string) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag<KanbanDragItem, void, { isDragging: boolean }>({
    type: KANBAN_CARD_TYPE,
    item: { id: proposal.id, fromStatus: proposal.status, proposal },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // Force grabbing cursor on body while dragging
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
      <div className="rounded-[16px] border-[1.5px] border-dashed border-[#98989d] bg-[#dde3ec]" style={{ minHeight: 80, padding: 12, opacity: 0.6 }}>
        <div style={{ visibility: "hidden" }}>
          <KanbanCardContent proposal={proposal} navigate={navigate} activeMenu={null} setActiveMenu={() => {}} menuRef={menuRef} handleDuplicate={handleDuplicate} handleDelete={handleDelete} />
        </div>
      </div>
    );
  }

  return (
    <div ref={(node) => { dragRef(node); }} onClick={() => navigate(`/price/propostas/${proposal.id}`)} className="bg-white p-3 cursor-grab hover:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] transition-all active:bg-[#F6F7F9] group/card rounded-[16px] active:cursor-grabbing">
      <KanbanCardContent proposal={proposal} navigate={navigate} activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuRef={menuRef} handleDuplicate={handleDuplicate} handleDelete={handleDelete} />
    </div>
  );
}

function DroppableKanbanColumn({ status, children, onDrop }: { status: string; children: React.ReactNode; onDrop: (item: KanbanDragItem, newStatus: string) => void; }) {
  const [{ isOver, canDrop }, dropRef] = useDrop<KanbanDragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: KANBAN_CARD_TYPE,
    canDrop: (item) => item.fromStatus !== status,
    drop: (item) => { onDrop(item, status); },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  const config = statusConfig[status];

  return (
    <div ref={(node) => { dropRef(node); }} className={`flex flex-col min-w-[240px] w-[240px] shrink-0 rounded-xl overflow-hidden transition-all ${isOver && canDrop ? "ring-2 ring-[#07abde] ring-inset" : ""}`} style={{ backgroundColor: config.bg }}>
      {children}
    </div>
  );
}

function CustomDragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem() as KanbanDragItem | null,
    currentOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !item || !currentOffset) return null;
  const serviceNames = getServiceNames(item.proposal);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ left: 0, top: 0 }}>
      <div style={{ position: "absolute", left: currentOffset.x - 110, top: currentOffset.y - 40, width: 220, transform: "rotate(2.53deg)" }}>
        <div className="bg-white p-3 rounded-[16px]" style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}>
          <div className="mb-1">
            <p className="text-[#07ABDE] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>{item.proposal.client_name}</p>
            <p className="text-[#4E6987]" style={{ fontSize: 10, letterSpacing: -0.3, ...fontFeature }}>{item.proposal.id}</p>
          </div>
          {serviceNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {serviceNames.slice(0, 2).map((s) => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-[#F6F7F9] text-[#28415C]" style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{s}</span>
              ))}
              {serviceNames.length > 2 && (
                <span className="px-1.5 py-0.5 rounded bg-[#DCF0FF] text-[#025E7B]" style={{ fontSize: 10, fontWeight: 600 }}>+{serviceNames.length - 2}</span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-[#EBF1FA]">
            <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.5, ...fontFeature }}>{formatCurrency(item.proposal.total_monthly ?? 0)}</span>
            <span className="text-[#4E6987]" style={{ fontSize: 10, letterSpacing: -0.3, ...fontFeature }}>{formatDate(item.proposal.updated_at || item.proposal.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function Proposals() {
  const navigate = useNavigate();
  const { query: search, filters } = useSearch();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [proposals, setProposals] = useState<DbProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* ── Resizable column widths ── */
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);

  // Column resize handlers (document-level so drag works even outside the table)
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

  // Close menu on click outside
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

  const fetchProposals = useCallback(async () => {
    try {
      const data = await listProposals();
      setProposals(data);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      toast.error("Erro ao carregar propostas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.client_name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    // Advanced filters from context
    const matchesAdvStatus = filters.statuses.length === 0 || filters.statuses.includes(p.status);

    const monthly = p.total_monthly ?? 0;
    const matchesMonthlyMin = !filters.monthlyMin || monthly >= Number(filters.monthlyMin);
    const matchesMonthlyMax = !filters.monthlyMax || monthly <= Number(filters.monthlyMax);

    const total = p.grand_total ?? 0;
    const matchesTotalMin = !filters.totalMin || total >= Number(filters.totalMin);
    const matchesTotalMax = !filters.totalMax || total <= Number(filters.totalMax);

    const impl = p.total_impl ?? 0;
    const matchesImplMin = !filters.implMin || impl >= Number(filters.implMin);
    const matchesImplMax = !filters.implMax || impl <= Number(filters.implMax);

    const hours = p.total_hours ?? 0;
    const matchesHoursMin = !filters.hoursMin || hours >= Number(filters.hoursMin);
    const matchesHoursMax = !filters.hoursMax || hours <= Number(filters.hoursMax);

    const svcIds = (p.price_proposal_services ?? []).map((s) => s.service_id);
    const matchesServices = filters.serviceIds.length === 0 || filters.serviceIds.some((id) => svcIds.includes(id));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAdvStatus &&
      matchesMonthlyMin &&
      matchesMonthlyMax &&
      matchesTotalMin &&
      matchesTotalMax &&
      matchesImplMin &&
      matchesImplMax &&
      matchesHoursMin &&
      matchesHoursMax &&
      matchesServices
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, filters]);

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
      setSelectedIds(new Set(paginated.map((p) => p.id)));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await duplicateProposalApi(id);
      toast.success(`Proposta duplicada: ${dup.id}`);
      fetchProposals();
    } catch (err) {
      console.error("Error duplicating:", err);
      toast.error("Erro ao duplicar proposta.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProposalApi(id);
      toast.success("Proposta excluída.");
      fetchProposals();
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error("Erro ao excluir proposta.");
    }
  };

  /* ── Action bar handlers (operate on selectedIds) ── */
  const handleActionView = () => {
    if (selectedIds.size === 0) { toast("Selecione ao menos uma proposta."); return; }
    if (selectedIds.size > 1) { toast("Selecione apenas uma proposta para visualizar."); return; }
    const id = [...selectedIds][0];
    navigate(`/price/propostas/${id}`);
  };

  const handleActionEdit = () => {
    if (selectedIds.size === 0) { toast("Selecione ao menos uma proposta."); return; }
    if (selectedIds.size > 1) { toast("Selecione apenas uma proposta para editar."); return; }
    const id = [...selectedIds][0];
    navigate(`/price/editar-proposta/${id}`);
  };

  const handleActionDuplicate = async () => {
    if (selectedIds.size === 0) { toast("Selecione ao menos uma proposta."); return; }
    for (const id of selectedIds) {
      await handleDuplicate(id);
    }
    setSelectedIds(new Set());
  };

  const handleActionDelete = async () => {
    if (selectedIds.size === 0) { toast("Selecione ao menos uma proposta."); return; }
    for (const id of selectedIds) {
      await handleDelete(id);
    }
    setSelectedIds(new Set());
  };

  /* ── Kanban drag-and-drop status change ── */
  const handleKanbanDrop = useCallback(async (item: KanbanDragItem, newStatus: string) => {
    if (item.fromStatus === newStatus) return;
    // Optimistic update
    setProposals((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: newStatus as DbProposal["status"] } : p))
    );
    try {
      await updateProposalStatus(item.id, newStatus);
      const statusLabel = statusConfig[newStatus]?.label ?? newStatus;
      toast.success(`Proposta ${item.id} movida para ${statusLabel}`);
    } catch (err) {
      console.error("Error updating proposal status:", err);
      toast.error("Erro ao atualizar status da proposta.");
      // Revert on error
      setProposals((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: item.fromStatus as DbProposal["status"] } : p))
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap size={32} className="text-[#0483AB] animate-spin" />
      </div>
    );
  }

  /* ---- Pagination range ---- */
  const pageRange: number[] = [];
  const maxVisible = 6;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pageRange.push(i);

  return (
    <div className="h-full flex flex-col">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        {/* Left: title */}
        <div className="relative" ref={titleMenuRef}>
          <div
            onClick={() => setTitleMenuOpen((v) => !v)}
            className={`flex items-center gap-[10px] p-[12px] rounded-[100px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/title ${titleMenuOpen ? "bg-[#f6f7f9]" : ""}`}
          >
            <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#DCF0FF] group-hover/title:bg-[#dde3ec] transition-colors">
              <FileText size={22} weight="duotone" className="text-[#0483AB] group-hover/title:text-[#28415c] transition-colors" />
            </div>
            <div className="flex flex-col items-start justify-center">
              <span
                className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]"
                style={fontFeature}
              >
                Propostas
              </span>
              <div className="flex items-center">
                <span
                  className="text-[#28415c] text-[19px] font-bold tracking-[-0.5px] leading-[24px]"
                  style={fontFeature}
                >Lista de Propostas</span>
                <div className={`flex items-center justify-center size-[24px] rounded-full transition-transform ${titleMenuOpen ? "rotate-180" : ""}`}>
                  <CaretDown size={14} weight="bold" className="text-[#28415c]" />
                </div>
              </div>
            </div>
          </div>

          {/* Title dropdown menu (Figma style) */}
          {titleMenuOpen && (
            <div className="absolute left-0 top-[calc(100%+5px)] z-50 backdrop-blur-[50px] bg-white flex flex-col gap-[6px] items-start p-[12px] rounded-[34px]">
              <div
                aria-hidden="true"
                className="absolute border border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[34px]"
                style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
              />
              {/* Configurações */}
              <button
                onClick={() => { setTitleMenuOpen(false); toast("Configurações de Propostas (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[44px]">
                  <GearSix size={19} />
                </div>
                <span
                  className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap"
                  style={{ fontWeight: 500, ...fontFeature }}
                >
                  Configurações
                </span>
              </button>
              {/* Fixar nos Atalhos */}
              <button
                onClick={() => { setTitleMenuOpen(false); toast("Fixado nos atalhos!"); }}
                className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[44px]">
                  <PushPin size={19} />
                </div>
                <span
                  className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap"
                  style={{ fontWeight: 500, ...fontFeature }}
                >
                  Fixar nos Atalhos
                </span>
              </button>
              {/* Notificações */}
              <button
                onClick={() => { setTitleMenuOpen(false); toast("Notificações (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[44px]">
                  <Bell size={19} />
                </div>
                <span
                  className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap"
                  style={{ fontWeight: 500, ...fontFeature }}
                >
                  Notificações
                </span>
              </button>
              {/* Excluir */}
              <button
                onClick={() => { setTitleMenuOpen(false); toast("Excluir (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[44px]">
                  <Trash size={19} />
                </div>
                <span
                  className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap"
                  style={{ fontWeight: 500, ...fontFeature }}
                >
                  Excluir
                </span>
              </button>
              {/* Divider */}
              <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
              {/* Detalhes */}
              <button
                onClick={() => { setTitleMenuOpen(false); toast("Detalhes de Propostas (em breve)"); }}
                className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
              >
                <div className="flex items-center justify-center shrink-0 w-[44px]">
                  <Info size={19} />
                </div>
                <span
                  className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap"
                  style={{ fontWeight: 500, ...fontFeature }}
                >
                  Detalhes de Propostas
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="hidden lg:flex items-center gap-[15px]">
          {/* Left pill group */}
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

          {/* Vertical Divider + Right pill group — only visible when ≥1 selected */}
          {selectedIds.size >= 1 && (
            <>
              <VerticalDivider />

              {/* Right pill group */}
              <div className="flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
                {selectedIds.size >= 2 && (
                  <button
                    className="flex items-center justify-center h-[32px] px-[12px] rounded-[8px] hover:bg-[#DCF0FF] active:bg-[#07abde] transition-colors"
                  >
                    <span
                      className="text-[#28415c] text-[10px] font-bold uppercase tracking-[0.5px] whitespace-nowrap active:text-[#f6f7f9]"
                      style={{ fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                    >
                      Edição em massa
                    </span>
                  </button>
                )}
                <button onClick={handleActionView} title="Visualizar" className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <Eye size={18} />
                </button>
                <button onClick={handleActionEdit} title="Editar" className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <PencilSimpleLine size={18} />
                </button>
                <button onClick={handleActionDuplicate} title="Duplicar" className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <Copy size={18} />
                </button>
                <button onClick={handleActionDelete} title="Excluir" className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <Trash size={18} />
                </button>
                <button title="Aprovar" className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <CheckSquare size={18} />
                </button>
                
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════ TABS + FILTERS ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1">
          {/* Segmented Control */}
          <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip">
            {/* KANBAN button */}
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
                style={{ fontSize: 10, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
              >KANBAN</span>
            </button>

            {/* TABELA button */}
            <button
              onClick={() => setViewMode("table")}
              className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                viewMode === "table"
                  ? "text-[#f6f7f9]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
            >
              {viewMode === "table" && (
                <>
                  <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                </>
              )}
              <Table size={14} weight={viewMode === "table" ? "fill" : "regular"} className="relative z-[1]" />
              <span
                className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 10, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
              >
                TABELA
              </span>
            </button>

            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
            />
          </div>

          {/* Vertical Divider */}
          <VerticalDivider />

          {/* New Proposal + button */}
          <button
            onClick={() => navigate("/price/nova-proposta")}
            className="relative flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#dcf0ff] text-[#28415c] hover:bg-[#cce7fb] transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>

        {/* Status filter pills + search */}
        <div className="flex items-center gap-2">
          
          {viewMode === "table" && (
            <div className="hidden sm:flex gap-1">
              {["all", "rascunho", "criada", "enviada", "aprovada", "recusada"].map((s) => (
                null
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ CONTENT ═══════ */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <FileText size={48} className="text-[#C8CFDB] mb-3" />
          <p className="text-[#4E6987] mb-4" style={{ fontSize: 15 }}>
            Nenhuma proposta encontrada.
          </p>
          <PillButton
            onClick={() => navigate("/price/nova-proposta")}
            icon={<Plus size={16} weight="bold" />}
          >
            Nova Proposta
          </PillButton>
        </div>
      ) : viewMode === "kanban" ? (
        /* ═══════ KANBAN VIEW (Drag & Drop) ═══════ */
        <DndProvider backend={TouchBackend} options={TOUCH_BACKEND_OPTIONS}>
          <CustomDragLayer />
          <div className="flex-1 flex gap-3 overflow-x-auto pb-2 min-h-0">
            {KANBAN_STATUSES.map((status) => {
              const config = statusConfig[status];
              const colProposals = proposals.filter((p) => {
                const matchesSearch =
                  p.client_name.toLowerCase().includes(search.toLowerCase()) ||
                  p.id.toLowerCase().includes(search.toLowerCase());
                return matchesSearch && p.status === status;
              });
              const colTotal = colProposals.reduce((sum, p) => sum + (p.total_monthly ?? 0), 0);

              return (
                <DroppableKanbanColumn key={status} status={status} onDrop={handleKanbanDrop}>
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-[8px] h-[8px] rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span
                        className="text-[#122232] uppercase tracking-[0.5px]"
                        style={{ fontSize: 10, fontWeight: 700, ...fontFeature }}
                      >
                        {config.label}
                      </span>
                      <span
                        className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white"
                        style={{ fontSize: 9, fontWeight: 700, backgroundColor: config.color }}
                      >
                        {colProposals.length}
                      </span>
                    </div>
                    <span
                      className="text-[#4E6987]"
                      style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
                    >
                      {formatCurrency(colTotal)}
                    </span>
                  </div>

                  {/* Scrollable card list */}
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-0">
                    {colProposals.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[#C8CFDB]" style={{ fontSize: 11 }}>Nenhuma</p>
                      </div>
                    ) : (
                      colProposals.map((proposal) => (
                        <DraggableKanbanCard
                          key={proposal.id}
                          proposal={proposal}
                          navigate={navigate}
                          activeMenu={activeMenu}
                          setActiveMenu={setActiveMenu}
                          menuRef={menuRef}
                          handleDuplicate={handleDuplicate}
                          handleDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>
                </DroppableKanbanColumn>
              );
            })}
          </div>
        </DndProvider>
      ) : (
        /* ═══════ TABLE VIEW (Figma style) ═══════ */
        <div className="flex-1 flex flex-col bg-white rounded-t-xl overflow-hidden">
          <div className="overflow-x-auto flex-1 flex flex-col min-w-0">
            {/* Shared grid: #  checkbox  ID  Cliente  Serviços  Mensalidade  Status  Atualização  Impl  Actions */}
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
              {/* Header cells — each with inline label + resize handle + divider */}
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
                      {/* Visual divider line — highlight on hover */}
                      <div className="w-[1.5px] h-[20px] rounded-full bg-[#DDE3EC] transition-colors group-hover/resize:bg-[#0483AB] group-hover/resize:h-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Table rows ── */}
            <div className="flex flex-col mt-1">
              {paginated.map((proposal, idx) => {
                const config = statusConfig[proposal.status] ?? statusConfig.rascunho;
                const serviceNames = getServiceNames(proposal);
                const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                const isSelected = selectedIds.has(proposal.id);

                return (
                  <div key={proposal.id}>
                    <HorizontalDivider />
                    <div
                      onClick={() => navigate(`/price/propostas/${proposal.id}`)}
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
                          onChange={() => toggleSelect(proposal.id)}
                        />
                      </div>

                      {/* ID */}
                      <div
                        className="truncate text-[#07ABDE]"
                        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                      >
                        {proposal.id}
                      </div>

                      {/* Cliente */}
                      <div
                        className="truncate text-[#07ABDE]"
                        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                      >
                        {proposal.client_name}
                      </div>

                      {/* Serviços */}
                      <div
                        className="truncate text-[#28415C]"
                        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                      >
                        {serviceNames.length > 0 ? serviceNames.join(", ") : "—"}
                      </div>

                      {/* Mensalidade */}
                      <div
                        className="truncate text-[#28415C]"
                        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                      >
                        {formatCurrency(proposal.total_monthly ?? 0)}
                      </div>

                      {/* Status */}
                      <div
                        className="truncate"
                        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: config.color, ...fontFeature }}
                      >
                        {config.label}
                      </div>

                      {/* Atualização */}
                      <div
                        className="truncate text-[#28415C]"
                        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                      >
                        {formatDate(proposal.updated_at || proposal.created_at)}
                      </div>

                      {/* Implementação */}
                      <div
                        className="truncate text-[#28415C]"
                        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                      >
                        {formatCurrency(proposal.total_impl ?? 0)}
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
      )}

      {/* ═══════ PAGINATION (Figma style) ═══════ */}
      {filtered.length > 0 && viewMode === "table" && (
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
            {pageRange.map((page) => (
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

    </div>
  );
}