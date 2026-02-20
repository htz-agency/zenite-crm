import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import {
  FileText,
  PaperPlaneTilt,
  PencilSimple,
  Copy,
  Trash,
  FilePdf,
  CurrencyDollar,
  Clock,
  CalendarBlank,
  CheckCircle,
  XCircle,
  HourglassMedium,
  EnvelopeSimple,
  SpinnerGap,
  X,
  ChartLineUp,
  Percent,
  NoteBlank,
  CaretRight,
  Tag,
  Plus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { formatCurrency, services as allServicesCatalog, calculateServicePrice } from "./pricing-data";
import {
  getProposal,
  deleteProposalApi,
  duplicateProposalApi,
  updateProposalStatus,
  updateProposalTag,
  dbToSelected,
  type DbProposal,
} from "./api";

/* ─── Helpers ─── */

function formatDate(iso: string): string {
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

/* ─── Status config ─── */

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  rascunho: { label: "Rascunho", bg: "bg-[#F6F7F9]", text: "text-[#4E6987]", icon: <HourglassMedium size={16} weight="duotone" /> },
  criada: { label: "Criada", bg: "bg-[#E8E8FD]", text: "text-[#6868B1]", icon: <FileText size={16} weight="duotone" /> },
  enviada: { label: "Enviada", bg: "bg-[#DCF0FF]", text: "text-[#025E7B]", icon: <EnvelopeSimple size={16} weight="duotone" /> },
  aprovada: { label: "Aprovada", bg: "bg-[#D9F8EF]", text: "text-[#135543]", icon: <CheckCircle size={16} weight="duotone" /> },
  recusada: { label: "Recusada", bg: "bg-[#FFEDEB]", text: "text-[#B13B00]", icon: <XCircle size={16} weight="duotone" /> },
};

const allStatuses = ["rascunho", "criada", "enviada", "aprovada", "recusada"] as const;

/* ─── Tag / Etiqueta config ─── */

interface TagOption {
  id: string;
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const tagOptions: TagOption[] = [
  { id: "urgente", label: "Urgente", bg: "bg-[#FFEDEB]", text: "text-[#B13B00]", dot: "bg-[#B13B00]" },
  { id: "prioritaria", label: "Prioritária", bg: "bg-[#FFF4E0]", text: "text-[#8B6914]", dot: "bg-[#EAC23D]" },
  { id: "vip", label: "VIP", bg: "bg-[#E8E8FD]", text: "text-[#6868B1]", dot: "bg-[#6868B1]" },
  { id: "revisao", label: "Revisão", bg: "bg-[#FFF4E0]", text: "text-[#8B6914]", dot: "bg-[#D4A017]" },
  { id: "novo-cliente", label: "Novo Cliente", bg: "bg-[#DCF0FF]", text: "text-[#025E7B]", dot: "bg-[#0483AB]" },
  { id: "renovacao", label: "Renovação", bg: "bg-[#D9F8EF]", text: "text-[#135543]", dot: "bg-[#3CCEA7]" },
  { id: "em-analise", label: "Em Análise", bg: "bg-[#F6F7F9]", text: "text-[#4E6987]", dot: "bg-[#4E6987]" },
];

/* ─── Highlight Field ─── */

function HighlightField({
  label,
  value,
  color = "#4E6987",
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-center p-[6px] rounded-[8px] w-[198px] shrink-0">
      <p className="text-label-sm text-[#98989d]">{label}</p>
      <div className="flex items-center gap-[6px]">
        {icon}
        <p className="text-body" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Section Header (collapsible) ─── */

function SectionHeader({
  title,
  icon,
  expanded,
  onToggle,
}: {
  title: string;
  icon?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} className="flex items-center gap-[15px] w-full py-[8px] group">
      <CaretRight
        size={18}
        weight="bold"
        className={`text-[#28415C] transition-transform ${expanded ? "rotate-90" : ""}`}
      />
      {icon}
      <h4 className="text-headline text-[#28415C]">{title}</h4>
    </button>
  );
}

/* ─── Detail Field (for body sections) ─── */

function DetailField({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="flex flex-col items-start justify-center p-[6px] rounded-[8px] w-[198px]">
      <p className="text-label-sm text-[#98989d]">{label}</p>
      <p className={`text-body ${link ? "text-[#07ABDE]" : "text-[#4E6987]"}`}>{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<DbProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [financialExpanded, setFinancialExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showSidebarTagMenu, setShowSidebarTagMenu] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const sidebarTagMenuRef = useRef<HTMLDivElement>(null);

  /* ── Close tag menus on outside click ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setShowTagMenu(false);
      }
      if (sidebarTagMenuRef.current && !sidebarTagMenuRef.current.contains(e.target as Node)) {
        setShowSidebarTagMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getProposal(id);
        setProposal(data);
        // Initialize tags from DB
        if (data.tag) {
          try {
            const parsed = JSON.parse(data.tag);
            if (Array.isArray(parsed)) setSelectedTags(parsed);
          } catch {
            // If not JSON, treat as single tag
            if (data.tag) setSelectedTags([data.tag]);
          }
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap size={32} className="text-[#0483AB] animate-spin" />
      </div>
    );
  }

  /* ── Not Found ── */
  if (notFound || !proposal) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/propostas")} className="p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors">
            <X size={18} className="text-[#4E6987]" />
          </button>
          <h1 className="text-title2 text-[#122232]">Proposta não encontrada</h1>
        </div>
        <div className="bg-white rounded-[15px] border border-[#DDE3EC] p-8 text-center">
          <FileText size={48} className="text-[#C8CFDB] mx-auto mb-3" />
          <p className="text-body text-[#4E6987]">
            A proposta <span className="font-bold">{id}</span> não foi encontrada.
          </p>
          <button onClick={() => navigate("/propostas")} className="mt-4 px-5 py-2.5 bg-[#0483AB] text-white rounded-lg hover:bg-[#025E7B] transition-colors text-body font-semibold">
            Voltar para Propostas
          </button>
        </div>
      </div>
    );
  }

  /* ── Compute service details ── */
  const dbServices = proposal.price_proposal_services ?? [];
  const serviceDetails = dbServices.map((dbSvc) => {
    const catalogSvc = allServicesCatalog.find((s) => s.id === dbSvc.service_id);
    if (catalogSvc) {
      const selected = dbToSelected(dbSvc);
      const calc = calculateServicePrice(catalogSvc, selected);
      return { name: catalogSvc.name, monthly: calc.monthly, impl: calc.impl, hours: calc.hours, group: catalogSvc.group };
    }
    return {
      name: dbSvc.service_id,
      monthly: dbSvc.computed_monthly ?? 0,
      impl: dbSvc.computed_impl ?? 0,
      hours: dbSvc.computed_hours ?? 0,
      group: "performance" as const,
    };
  });

  const config = statusConfig[proposal.status] ?? statusConfig.rascunho;
  const totalServicesHours = serviceDetails.reduce((sum, s) => sum + s.hours, 0);

  /* ── Actions ── */
  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const dup = await duplicateProposalApi(id);
      toast.success(`Proposta duplicada: ${dup.id}`);
      navigate(`/propostas/${dup.id}`);
    } catch (err) {
      console.error("Error duplicating:", err);
      toast.error("Erro ao duplicar proposta.");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProposalApi(id);
      toast.success("Proposta excluída.");
      navigate("/propostas");
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error("Erro ao excluir proposta.");
    }
  };

  const handleSend = async () => {
    if (!id) return;
    try {
      await updateProposalStatus(id, "enviada");
      setProposal((prev) => prev ? { ...prev, status: "enviada" } : prev);
      toast.success("Proposta marcada como enviada!");
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || newStatus === proposal.status) return;
    try {
      await updateProposalStatus(id, newStatus);
      setProposal((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Status alterado para "${statusConfig[newStatus]?.label ?? newStatus}".`);
    } catch (err) {
      console.error("Error changing status:", err);
      toast.error("Erro ao alterar status.");
    }
  };

  const handleTagChange = async (tags: string[]) => {
    if (!id) return;
    try {
      await updateProposalTag(id, tags);
      setProposal((prev) => prev ? { ...prev, tags } : prev);
      toast.success("Etiquetas atualizadas.");
    } catch (err) {
      console.error("Error changing tags:", err);
      toast.error("Erro ao atualizar etiquetas.");
    }
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    // Persist to DB (fire-and-forget with error handling)
    if (id) {
      updateProposalTag(id, newTags).catch((err) => {
        console.error("Error persisting tags:", err);
        toast.error("Erro ao salvar etiquetas.");
        // Rollback on error
        setSelectedTags(selectedTags);
      });
    }
  };

  /* ════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                         */
  /* ════════════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col gap-[12px]">
      {/* ═══════ HEADER CARD ═══════ */}
      <div className="bg-white rounded-[15px] overflow-hidden">
        {/* Row 1: Icon + Title + Labels + Actions + Close */}
        <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[8px]">
          {/* Left: icon + title */}
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#DCF0FF] shrink-0">
              <FileText size={18} weight="duotone" className="text-[#0483AB]" />
            </div>
            <div className="flex flex-col gap-[2px]">
              <p className="text-label-sm text-[#64676c]">PROPOSTA {proposal.id}</p>
              <h3 className="text-title3 text-[#28415C]">{proposal.client_name}</h3>
            </div>
          </div>

          {/* Right: status badge + actions + close */}
          <div className="flex items-center gap-[16px]">
            {/* Tags / Etiquetas */}
            <div className="relative" ref={tagMenuRef}>
              <div className="flex items-center gap-[6px]">
                {selectedTags.map((tagId) => {
                  const tag = tagOptions.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-1.5 px-[10px] h-[32px] rounded-[8px] text-label-sm ${tag.bg} ${tag.text}`}
                    >
                      <span className={`size-[6px] rounded-full ${tag.dot}`} />
                      {tag.label}
                      <button
                        onClick={() => toggleTag(tag.id)}
                        className="ml-[2px] hover:opacity-70 transition-opacity"
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
                    left: tagMenuRef.current
                      ? tagMenuRef.current.getBoundingClientRect().right - 220 + "px"
                      : "0px",
                  }}
                >
                  {/* Border overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[34px] border-[1.4px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                  {tagOptions.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex items-center gap-[4px] pr-[28px] py-[10px] rounded-[100px] transition-colors ${
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

            {/* Divider */}
            {selectedTags.length > 0 && (
              <div className="w-[1.5px] h-[20px] bg-[#DDE3EC] rounded-full" />
            )}

            {/* Action buttons bar */}
            <div className="flex items-center gap-[10px] h-[44px] bg-[#f6f7f9] rounded-[100px] px-[5px] py-[0px]">
              <button
                onClick={() => setShowTagMenu((v) => !v)}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-[#f6f7f9] transition-colors"
                title="Etiquetas"
              >
                <Tag size={16} weight="bold" className="text-[#28415C]" />
              </button>
              <button
                onClick={() => navigate(`/editar-proposta/${proposal.id}`)}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-[#f6f7f9] transition-colors"
                title="Editar"
              >
                <PencilSimple size={16} weight="bold" className="text-[#28415C]" />
              </button>
              <button
                onClick={handleDuplicate}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-[#f6f7f9] transition-colors"
                title="Duplicar"
              >
                <Copy size={16} weight="bold" className="text-[#28415C]" />
              </button>
              <button
                onClick={() => toast.info("Funcionalidade de impressão em breve")}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-[#f6f7f9] transition-colors"
                title="Imprimir"
              >
                <FilePdf size={16} weight="bold" className="text-[#28415C]" />
              </button>
              
              <button
                onClick={handleDelete}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-[#f6f7f9] transition-colors"
                title="Excluir"
              >
                <Trash size={16} weight="bold" className="text-[#28415C]" />
              </button>
              <button
                onClick={() => navigate("/propostas")}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-[#f6f7f9] transition-colors"
                title="Fechar"
              >
                <X size={16} weight="bold" className="text-[#28415C]" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Highlight bar */}
        <div className="flex items-center gap-[20px] px-[20px] pb-[16px] overflow-x-auto">
          <HighlightField label="CRIADA EM" value={formatDate(proposal.created_at)} color="#4E6987" icon={<CalendarBlank size={14} weight="bold" className="text-[#4E6987]" />} />
          <HighlightField
            label="MENSAL"
            value={formatCurrency(proposal.total_monthly ?? 0)}
            color="#135543"
            icon={<CurrencyDollar size={14} weight="bold" className="text-[#3CCEA7]" />}
          />
          <HighlightField
            label="IMPLEMENTAÇÃO"
            value={formatCurrency(proposal.total_impl ?? 0)}
            color="#4E6987"
            icon={<ChartLineUp size={14} weight="bold" className="text-[#4E6987]" />}
          />
          <HighlightField
            label="HORAS/MÊS"
            value={`${proposal.total_hours ?? totalServicesHours}h`}
            color="#4E6987"
            icon={<Clock size={14} weight="bold" className="text-[#4E6987]" />}
          />
        </div>
      </div>

      {/* ═══════ STATUS PIPELINE (Segmented Control) ═══════ */}
      <div
        className="flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip relative"
      >
        {/* Check mark for approved / completed statuses */}
        {allStatuses.map((s) => {
          const isActive = proposal.status === s;
          const sc = statusConfig[s];
          const activeIdx = allStatuses.indexOf(proposal.status as typeof allStatuses[number]);
          const thisIdx = allStatuses.indexOf(s);
          const isPast = thisIdx < activeIdx;
          return (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`group flex-1 h-[36px] rounded-[20px] flex items-center justify-center transition-all relative cursor-pointer ${
                isActive
                  ? "bg-[#28415C]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
              disabled={isActive}
            >
              {isPast ? (
                <>
                  <CheckCircle size={16} weight="bold" className="text-[#3CCEA7] group-hover:hidden" />
                  <span className="text-label-sm hidden group-hover:inline">
                    {sc.label}
                  </span>
                </>
              ) : (
                <span
                  className={`text-label-sm ${
                    isActive ? "text-[#f6f7f9]" : ""
                  }`}
                >
                  {sc.label}
                </span>
              )}
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none rounded-[20px]"
                  style={{
                    border: "0.5px solid rgba(200,207,219,0.6)",
                    boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                  }}
                />
              )}
            </button>
          );
        })}
        {/* Inner shadow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        />
      </div>

      {/* ═══════ BODY: 2-column layout ═══════ */}
      <div className="flex flex-col gap-[12px]">
        {/* ─── LEFT COLUMN ─── */}
        <div className="bg-white rounded-[15px] p-[20px] flex flex-col gap-[16px]">
          {/* Section: Serviços Inclusos */}
          <div>
            <SectionHeader
              title={`Serviços Inclusos (${serviceDetails.length})`}
              icon={<FileText size={20} weight="duotone" className="text-[#0483AB]" />}
              expanded={servicesExpanded}
              onToggle={() => setServicesExpanded(!servicesExpanded)}
            />
            {servicesExpanded && (
              <div className="mt-[12px]">
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[#DDE3EC]">
                  {serviceDetails.map((service) => (
                    <div key={service.name} className="py-[10px]">
                      <p className="text-body font-semibold text-[#122232] mb-1">{service.name}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-label-sm text-[#98989d]">Mensal</p>
                          <p className="text-callout-bold text-[#122232]">
                            {service.monthly > 0 ? formatCurrency(service.monthly) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-label-sm text-[#98989d]">Implementação</p>
                          <p className="text-callout-bold text-[#122232]">
                            {service.impl > 0 ? formatCurrency(service.impl) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-label-sm text-[#98989d]">Horas/mês</p>
                          <p className="text-callout-bold text-[#122232]">
                            {service.hours > 0 ? `${service.hours}h` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F6F7F9]">
                        <th className="text-left px-[16px] py-[10px] text-label-sm text-[#98989d] rounded-l-[8px]">Serviço</th>
                        <th className="text-right px-[16px] py-[10px] text-label-sm text-[#98989d]">Mensal</th>
                        <th className="text-right px-[16px] py-[10px] text-label-sm text-[#98989d]">Implementação</th>
                        <th className="text-right px-[16px] py-[10px] text-label-sm text-[#98989d] rounded-r-[8px]">Horas/mês</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceDetails.map((service) => (
                        <tr key={service.name} className="border-b border-[#F6F7F9] last:border-b-0">
                          <td className="px-[16px] py-[12px] text-body font-semibold text-[#122232]">{service.name}</td>
                          <td className="px-[16px] py-[12px] text-right text-body text-[#122232]">
                            {service.monthly > 0 ? formatCurrency(service.monthly) : "—"}
                          </td>
                          <td className="px-[16px] py-[12px] text-right text-body text-[#122232]">
                            {service.impl > 0 ? formatCurrency(service.impl) : "—"}
                          </td>
                          <td className="px-[16px] py-[12px] text-right text-body text-[#4E6987]">
                            {service.hours > 0 ? `${service.hours}h` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#F6F7F9]">
                        <td className="px-[16px] py-[12px] text-body font-bold text-[#122232] rounded-l-[8px]">Total</td>
                        <td className="px-[16px] py-[12px] text-right text-body font-bold text-[#122232]">{formatCurrency(proposal.total_monthly ?? 0)}</td>
                        <td className="px-[16px] py-[12px] text-right text-body font-bold text-[#122232]">{formatCurrency(proposal.total_impl ?? 0)}</td>
                        <td className="px-[16px] py-[12px] text-right text-body font-bold text-[#4E6987] rounded-r-[8px]">{totalServicesHours}h</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Combo Discount */}
          {(proposal.combo_discount_percent ?? 0) > 0 && (
            <div className="flex items-center justify-between p-[16px] rounded-[10px] bg-gradient-to-r from-[#D9F8EF] to-[#DCF0FF] border border-[#3CCEA7]/30">
              <div className="flex items-center gap-[12px]">
                <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#3CCEA7]">
                  <Percent size={16} weight="bold" className="text-white" />
                </div>
                <div>
                  <p className="text-body font-bold text-[#135543]">{proposal.combo_label}</p>
                  <p className="text-callout text-[#135543]/70">Desconto combo aplicado na mensalidade</p>
                </div>
              </div>
              <span className="text-body font-bold text-[#135543] px-[12px] py-[4px] rounded-full bg-[#3CCEA7]/20">
                -{proposal.combo_discount_percent}%
              </span>
            </div>
          )}

          {/* Section: Resumo Financeiro */}
          <div>
            <SectionHeader
              title="Resumo Financeiro"
              icon={<CurrencyDollar size={20} weight="duotone" className="text-[#3CCEA7]" />}
              expanded={financialExpanded}
              onToggle={() => setFinancialExpanded(!financialExpanded)}
            />
            {financialExpanded && (
              <div className="mt-[12px] grid grid-cols-2 gap-x-[24px] gap-y-[16px]">
                <DetailField label="MENSALIDADE" value={formatCurrency(proposal.total_monthly ?? 0)} />
                <DetailField label="IMPLEMENTAÇÃO (ÚNICO)" value={formatCurrency(proposal.total_impl ?? 0)} />
                <DetailField label="HORAS ESTIMADAS" value={`${proposal.total_hours ?? totalServicesHours}h/mês`} />
                {(proposal.combo_discount_percent ?? 0) > 0 && (
                  <DetailField label="COMBO DESCONTO" value={`-${proposal.combo_discount_percent}%`} />
                )}
                <div className="col-span-2 flex items-center justify-between pt-[12px] border-t-2 border-[#DDE3EC]">
                  <span className="text-body font-bold text-[#122232]">Total Geral</span>
                  <span className="text-title2 text-[#0483AB]">{formatCurrency(proposal.grand_total ?? 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {proposal.notes && (
            <div>
              <SectionHeader
                title="Observações"
                icon={<NoteBlank size={20} weight="duotone" className="text-[#EAC23D]" />}
                expanded={true}
                onToggle={() => {}}
              />
              <p className="mt-[8px] text-body text-[#4E6987] leading-[22px] pl-[33px]">{proposal.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}