import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  MagnifyingGlass,
  FileText,
  Package,
  X,
  Eye,
  PencilSimple,
  Copy,
  Trash,
  ArrowRight,
  SpinnerGap,
  CaretLeft,
  CaretRight,
  DotsThree,
  ClipboardText,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSearch, type ProposalFilters } from "./search-context";
import {
  services as allServicesCatalog,
  groupLabels,
  groupColors,
  formatCurrency,
  type ServiceGroup,
  type Service,
} from "./pricing-data";
import {
  listProposals,
  deleteProposalApi,
  duplicateProposalApi,
  type DbProposal,
} from "./api";

/* ── Purple Pie palette for search results ── */
const PP = {
  accent: "#6868B1",     // muted purple (icons, links)
  dark:   "#4A3B8C",     // dark purple for pill tags
  mid:    "#5C5299",     // mid purple for section titles
  light:  "#EDE8FD",     // light purple bg (primary surface)
  hover:  "#DDD6FE",     // hover state
  pale:   "#F5F3FF",     // very light tint
};

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const ROWS_PER_PAGE = 10;

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  rascunho: { label: "Rascunho", color: "#4E6987", bg: "#F6F7F9" },
  criada:   { label: "Criada",   color: "#6868B1", bg: "#F0EEFA" },
  enviada:  { label: "Enviada",  color: "#0483AB", bg: "#E6F6FC" },
  aprovada: { label: "Aprovada", color: "#135543", bg: "#E4F5EF" },
  recusada: { label: "Recusada", color: "#B13B00", bg: "#FFF0EB" },
};

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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function matchProposal(p: DbProposal, query: string, filters: ProposalFilters): boolean {
  const q = query.toLowerCase();

  const matchesSearch =
    !query ||
    p.client_name.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    getServiceNames(p).some((n) => n.toLowerCase().includes(q));

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
}

function matchService(s: Service, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q)
  );
}

/* ------------------------------------------------------------------ */
/*  Active filter tag                                                  */
/* ------------------------------------------------------------------ */

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-[4px] h-[26px] pl-[10px] pr-[6px] rounded-[100px]" style={{ backgroundColor: PP.light, color: PP.accent }}>
      <span
        className="uppercase whitespace-nowrap"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
      >
        {label}
      </span>
      <button
        onClick={onRemove}
        className="flex items-center justify-center size-[16px] rounded-full transition-colors"
        style={{ color: PP.accent }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PP.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <X size={8} weight="bold" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Service result card                                                */
/* ------------------------------------------------------------------ */

function ServiceResultCard({ service }: { service: Service }) {
  const navigate = useNavigate();
  const colors = groupColors[service.group];
  const groupRoute = service.group === "sales_ops" ? "sales-ops" : service.group === "brand_co" ? "brand-co" : "performance";

  return (
    <div
      onClick={() => navigate(`/price/servicos/${groupRoute}`)}
      className="flex items-center gap-[12px] p-[12px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/svc"
    >
      <div className={`flex items-center justify-center shrink-0 w-[40px] h-[40px] rounded-[8px] ${colors.bg}`}>
        <Package size={20} weight="duotone" className={colors.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[#28415c] truncate"
          style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
        >
          {service.name}
        </p>
        <p
          className="text-[#4E6987] truncate"
          style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}
        >
          {groupLabels[service.group as ServiceGroup]} · {service.description}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
            {service.basePrice > 0 ? formatCurrency(service.basePrice) : "—"}
          </span>
          <span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
            mensal
          </span>
        </div>
        <ArrowRight size={14} className="text-[#C8CFDB] group-hover/svc:text-[#6868B1] transition-colors" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Proposal action menu                                               */
/* ------------------------------------------------------------------ */

function ProposalActions({
  proposal,
  onDuplicate,
  onDelete,
}: {
  proposal: DbProposal;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#DDE3EC] transition-colors opacity-0 group-hover/row:opacity-100"
      >
        <DotsThree size={16} weight="bold" className="text-[#4E6987]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-50 backdrop-blur-[50px] bg-white flex flex-col gap-[2px] items-start p-[8px] rounded-[20px]">
            <div aria-hidden="true" className="absolute border-[1.4px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]" style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }} />
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); navigate(`/price/propostas/${proposal.id}`); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer">
              <div className="flex items-center justify-center shrink-0 w-[28px]"><Eye size={12} /></div>
              <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Visualizar</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); navigate(`/price/editar-proposta/${proposal.id}`); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer">
              <div className="flex items-center justify-center shrink-0 w-[28px]"><PencilSimple size={12} /></div>
              <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Editar</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDuplicate(proposal.id); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer">
              <div className="flex items-center justify-center shrink-0 w-[28px]"><Copy size={12} /></div>
              <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Duplicar</span>
            </button>
            <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(proposal.id); }} className="relative flex gap-[4px] items-center pr-[16px] py-[6px] rounded-[100px] text-[#ED5200] hover:bg-[#FFEDEB] transition-colors w-full cursor-pointer">
              <div className="flex items-center justify-center shrink-0 w-[28px]"><Trash size={12} /></div>
              <span className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Excluir</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon,
  title,
  count,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-[10px] mb-[10px]">
      <div className={`flex items-center justify-center shrink-0 w-[32px] h-[32px] rounded-[8px]`} style={{ backgroundColor: PP.light }}>
        <span style={{ color: PP.accent }}>{icon}</span>
      </div>
      <span
        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, color: PP.dark, ...fontFeature }}
      >
        {title}
      </span>
      <span
        className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full"
        style={{ fontSize: 10, fontWeight: 700, backgroundColor: PP.light, color: PP.dark, ...fontFeature }}
      >
        {count}
      </span>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export function SearchResults() {
  const navigate = useNavigate();
  const { query, setQuery, filters, setFilters, activeFilterCount, clearFilters } = useSearch();

  const [proposals, setProposals] = useState<DbProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalPage, setProposalPage] = useState(1);

  const fetchProposals = useCallback(async () => {
    try {
      const data = await listProposals();
      setProposals(data);
    } catch (err) {
      console.error("Error fetching proposals for search:", err);
      toast.error("Erro ao carregar propostas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Reset pages when query/filters change
  useEffect(() => {
    setProposalPage(1);
  }, [query, filters]);

  // Filtered results
  const filteredProposals = proposals.filter((p) => matchProposal(p, query, filters));
  const matchedServices = query ? allServicesCatalog.filter((s) => matchService(s, query)) : [];

  // Pagination for proposals
  const totalProposalPages = Math.max(1, Math.ceil(filteredProposals.length / ROWS_PER_PAGE));
  const paginatedProposals = filteredProposals.slice(
    (proposalPage - 1) * ROWS_PER_PAGE,
    proposalPage * ROWS_PER_PAGE
  );

  const totalResults = filteredProposals.length + matchedServices.length;

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await duplicateProposalApi(id);
      toast.success(`Proposta duplicada: ${dup.id}`);
      fetchProposals();
    } catch {
      toast.error("Erro ao duplicar proposta.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProposalApi(id);
      toast.success("Proposta excluída.");
      fetchProposals();
    } catch {
      toast.error("Erro ao excluir proposta.");
    }
  };

  const handleClearAll = () => {
    setQuery("");
    clearFilters();
    navigate("/price");
  };

  // Build active filter tag labels
  const filterTags: { label: string; clear: () => void }[] = [];

  if (filters.statuses.length > 0) {
    const labels = filters.statuses.map((s) => statusConfig[s]?.label ?? s).join(", ");
    filterTags.push({
      label: `Status: ${labels}`,
      clear: () => setFilters({ ...filters, statuses: [] }),
    });
  }
  if (filters.monthlyMin || filters.monthlyMax) {
    const parts = [];
    if (filters.monthlyMin) parts.push(`mín R$${filters.monthlyMin}`);
    if (filters.monthlyMax) parts.push(`máx R$${filters.monthlyMax}`);
    filterTags.push({
      label: `Mensalidade: ${parts.join(" – ")}`,
      clear: () => setFilters({ ...filters, monthlyMin: "", monthlyMax: "" }),
    });
  }
  if (filters.totalMin || filters.totalMax) {
    const parts = [];
    if (filters.totalMin) parts.push(`mín R$${filters.totalMin}`);
    if (filters.totalMax) parts.push(`máx R$${filters.totalMax}`);
    filterTags.push({
      label: `Total: ${parts.join(" – ")}`,
      clear: () => setFilters({ ...filters, totalMin: "", totalMax: "" }),
    });
  }
  if (filters.implMin || filters.implMax) {
    const parts = [];
    if (filters.implMin) parts.push(`mín R$${filters.implMin}`);
    if (filters.implMax) parts.push(`máx R$${filters.implMax}`);
    filterTags.push({
      label: `Impl: ${parts.join(" – ")}`,
      clear: () => setFilters({ ...filters, implMin: "", implMax: "" }),
    });
  }
  if (filters.hoursMin || filters.hoursMax) {
    const parts = [];
    if (filters.hoursMin) parts.push(`mín ${filters.hoursMin}h`);
    if (filters.hoursMax) parts.push(`máx ${filters.hoursMax}h`);
    filterTags.push({
      label: `Horas: ${parts.join(" – ")}`,
      clear: () => setFilters({ ...filters, hoursMin: "", hoursMax: "" }),
    });
  }
  if (filters.serviceIds.length > 0) {
    const names = filters.serviceIds.map((id) => {
      const svc = allServicesCatalog.find((s) => s.id === id);
      return svc?.name ?? id;
    });
    const label = names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
    filterTags.push({
      label: `Serviços: ${label}`,
      clear: () => setFilters({ ...filters, serviceIds: [] }),
    });
  }

  /* ---- Pagination range ---- */
  const pageRange: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, proposalPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalProposalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pageRange.push(i);

  return (
    <div className="h-full flex flex-col p-[10px]">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        {/* Left */}
        <div className="flex items-center gap-[10px] p-[12px]">
          <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px]" style={{ backgroundColor: PP.light }}>
            <MagnifyingGlass size={22} weight="duotone" style={{ color: PP.accent }} />
          </div>
          <div className="flex flex-col items-start justify-center">
            <span
              className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]"
              style={fontFeature}
            >
              Pesquisa
            </span>
            <span
              className="text-[#28415c] text-[19px] font-bold tracking-[-0.5px] leading-[24px]"
              style={fontFeature}
            >
              Resultados da busca
            </span>
          </div>
        </div>

        {/* Right: summary + clear */}
        <div className="flex items-center gap-[10px]">
          <span
            className="text-[#4E6987]"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
          >
            {loading ? "Buscando..." : `${totalResults} resultado${totalResults !== 1 ? "s" : ""}`}
          </span>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-[4px] h-[34px] px-[14px] rounded-[500px] transition-colors cursor-pointer"
            style={{ backgroundColor: PP.light, color: PP.dark }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PP.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PP.light)}
          >
            <X size={12} weight="bold" />
            <span
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              Limpar busca
            </span>
          </button>
        </div>
      </div>

      {/* ═══════ ACTIVE SEARCH / FILTER TAGS ═══════ */}
      {(query || filterTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-[6px] mb-4">
          {query && (
            <div className="flex items-center gap-[4px] h-[26px] pl-[10px] pr-[6px] rounded-[100px] text-[#f6f7f9]" style={{ backgroundColor: PP.dark }}>
              <MagnifyingGlass size={10} weight="bold" />
              <span
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
              >
                "{query}"
              </span>
              <button
                onClick={() => setQuery("")}
                className="flex items-center justify-center size-[16px] rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={8} weight="bold" />
              </button>
            </div>
          )}
          {filterTags.map((tag) => (
            <FilterTag key={tag.label} label={tag.label} onRemove={tag.clear} />
          ))}
          {(activeFilterCount > 0 || query) && (
            <button
              onClick={handleClearAll}
              className="text-[#98989d] hover:text-[#4E6987] transition-colors ml-1"
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, ...fontFeature }}
            >
              Limpar tudo
            </button>
          )}
        </div>
      )}

      {/* ═══════ LOADING ═══════ */}
      {loading && (
        <div className="flex-1 flex items-center justify-center py-20">
          <SpinnerGap size={32} className="animate-spin" style={{ color: PP.accent }} />
        </div>
      )}

      {/* ═══════ EMPTY STATE ═══════ */}
      {!loading && totalResults === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="flex items-center justify-center w-[64px] h-[64px] rounded-[16px] mb-4" style={{ backgroundColor: PP.pale }}>
            <MagnifyingGlass size={28} style={{ color: PP.hover }} />
          </div>
          <p
            className="text-[#28415c] mb-1"
            style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
          >
            Nenhum resultado encontrado
          </p>
          <p
            className="text-[#4E6987] mb-5"
            style={{ fontSize: 13, letterSpacing: -0.3, ...fontFeature }}
          >
            Tente ajustar os termos de pesquisa ou os filtros aplicados.
          </p>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-[4px] h-[36px] px-[18px] rounded-[500px] transition-colors cursor-pointer"
            style={{ backgroundColor: PP.light, color: PP.dark }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PP.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PP.light)}
          >
            <X size={12} weight="bold" />
            <span
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
            >
              Limpar e voltar
            </span>
          </button>
        </div>
      )}

      {/* ═══════ RESULTS ═══════ */}
      {!loading && totalResults > 0 && (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-4">
          {/* ── Services section ── */}
          {matchedServices.length > 0 && (
            <div>
              <SectionHeader
                icon={<Package size={16} weight="duotone" />}
                title="Serviços"
                count={matchedServices.length}
                iconBg="bg-[#D9F8EF]"
                iconColor="text-[#3CCEA7]"
              />
              <div className="bg-white rounded-[12px]">
                {matchedServices.map((svc, idx) => (
                  <div key={svc.id}>
                    {idx > 0 && <HorizontalDivider />}
                    <ServiceResultCard service={svc} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Proposals section ── */}
          {filteredProposals.length > 0 && (
            <div className="flex flex-col flex-1">
              <SectionHeader
                icon={<ClipboardText size={16} weight="duotone" />}
                title="Propostas"
                count={filteredProposals.length}
                iconBg="bg-[#DCF0FF]"
                iconColor="text-[#0483AB]"
              />

              {/* Proposal table */}
              <div className="bg-white rounded-[12px] flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <div className="w-fit min-w-full">
                    {/* Header */}
                    <div
                      className="grid items-center px-5 pt-2 pb-0"
                      style={{
                        gridTemplateColumns: "28px 90px 150px minmax(180px, 1fr) 110px 90px 100px 100px 36px",
                        gap: "0 8px",
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>#</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>ID</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>CLIENTE</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>SERVIÇOS</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>MENSALIDADE</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>STATUS</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>ATUALIZAÇÃO</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c]" style={fontFeature}>IMPL.</span>
                      <div />
                    </div>

                    {/* Rows */}
                    <div className="flex flex-col mt-1">
                      {paginatedProposals.map((proposal, idx) => {
                        const config = statusConfig[proposal.status] ?? statusConfig.rascunho;
                        const serviceNames = getServiceNames(proposal);
                        const rowNum = (proposalPage - 1) * ROWS_PER_PAGE + idx + 1;

                        return (
                          <div key={proposal.id}>
                            <HorizontalDivider />
                            <div
                              onClick={() => navigate(`/price/propostas/${proposal.id}`)}
                              className="grid items-center h-[34px] px-3 mx-2 cursor-pointer rounded-[100px] hover:bg-[#f6f7f9] transition-colors group/row"
                              style={{
                                gridTemplateColumns: "28px 90px 150px minmax(180px, 1fr) 110px 90px 100px 100px 36px",
                                gap: "0 8px",
                              }}
                            >
                              {/* # */}
                              <div className="text-right text-[#28415c]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                                {rowNum}
                              </div>
                              {/* ID */}
                              <div className="truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: PP.accent, ...fontFeature }}>
                                {proposal.id}
                              </div>
                              {/* Cliente */}
                              <div className="truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: PP.accent, ...fontFeature }}>
                                {proposal.client_name}
                              </div>
                              {/* Serviços */}
                              <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                                {serviceNames.length > 0 ? serviceNames.join(", ") : "—"}
                              </div>
                              {/* Mensalidade */}
                              <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                                {formatCurrency(proposal.total_monthly ?? 0)}
                              </div>
                              {/* Status */}
                              <div className="truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: config.color, ...fontFeature }}>
                                {config.label}
                              </div>
                              {/* Atualização */}
                              <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                                {formatDate(proposal.updated_at || proposal.created_at)}
                              </div>
                              {/* Implementação */}
                              <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                                {formatCurrency(proposal.total_impl ?? 0)}
                              </div>
                              {/* Actions */}
                              <ProposalActions
                                proposal={proposal}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <HorizontalDivider />
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalProposalPages > 1 && (
                  <div className="flex items-center gap-2 py-3 px-5 border-t-0">
                    <button
                      onClick={() => setProposalPage((p) => Math.max(1, p - 1))}
                      disabled={proposalPage === 1}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
                    >
                      <CaretLeft size={14} weight="bold" />
                    </button>
                    <button
                      onClick={() => setProposalPage((p) => Math.min(totalProposalPages, p + 1))}
                      disabled={proposalPage === totalProposalPages}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                    <div className="flex items-center gap-0.5 ml-2">
                      {pageRange.map((page) => (
                        <button
                          key={page}
                          onClick={() => setProposalPage(page)}
                          className={`flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors ${
                            page === proposalPage
                              ? "text-white"
                              : "hover:bg-[#F6F7F9]"
                          }`}
                          style={{
                            fontSize: 12,
                            fontWeight: page === proposalPage ? 700 : 500,
                            backgroundColor: page === proposalPage ? PP.accent : undefined,
                            color: page !== proposalPage ? PP.dark : undefined,
                            ...fontFeature,
                          }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}