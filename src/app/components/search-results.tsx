/**
 * SearchResults — Global search results page for Price module.
 * Searches across proposals and services.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { MagnifyingGlass, FileText, Package, X, SpinnerGap, ArrowRight, ClipboardText } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSearch, type ProposalFilters } from "./search-context";
import { services as allServicesCatalog, groupLabels, groupColors, formatCurrency, type ServiceGroup, type Service } from "./pricing-data";
import { listProposals, deleteProposalApi, duplicateProposalApi, type DbProposal } from "./api";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

function getServiceNames(proposal: DbProposal): string[] {
  const svcs = proposal.price_proposal_services ?? [];
  return svcs.map((s) => { const c = allServicesCatalog.find((cs) => cs.id === s.service_id); return c?.name ?? s.service_id; });
}

function matchProposal(p: DbProposal, query: string, filters: ProposalFilters): boolean {
  const q = query.toLowerCase();
  const matchesSearch = !query || p.client_name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || getServiceNames(p).some((n) => n.toLowerCase().includes(q));
  const matchesAdvStatus = filters.statuses.length === 0 || filters.statuses.includes(p.status);
  const monthly = p.total_monthly ?? 0;
  const matchesMonthly = (!filters.monthlyMin || monthly >= Number(filters.monthlyMin)) && (!filters.monthlyMax || monthly <= Number(filters.monthlyMax));
  const total = p.grand_total ?? 0;
  const matchesTotal = (!filters.totalMin || total >= Number(filters.totalMin)) && (!filters.totalMax || total <= Number(filters.totalMax));
  const impl = p.total_impl ?? 0;
  const matchesImpl = (!filters.implMin || impl >= Number(filters.implMin)) && (!filters.implMax || impl <= Number(filters.implMax));
  const hours = p.total_hours ?? 0;
  const matchesHours = (!filters.hoursMin || hours >= Number(filters.hoursMin)) && (!filters.hoursMax || hours <= Number(filters.hoursMax));
  const svcIds = (p.price_proposal_services ?? []).map((s) => s.service_id);
  const matchesServices = filters.serviceIds.length === 0 || filters.serviceIds.some((id) => svcIds.includes(id));
  return matchesSearch && matchesAdvStatus && matchesMonthly && matchesTotal && matchesImpl && matchesHours && matchesServices;
}

function matchService(s: Service, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
}

export function SearchResults() {
  const navigate = useNavigate();
  const { query, setQuery, filters, clearFilters } = useSearch();
  const [proposals, setProposals] = useState<DbProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    try { const data = await listProposals(); setProposals(data); } catch (err) { console.error("Error fetching proposals for search:", err); toast.error("Erro ao carregar propostas."); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const filteredProposals = proposals.filter((p) => matchProposal(p, query, filters));
  const matchedServices = query ? allServicesCatalog.filter((s) => matchService(s, query)) : [];
  const totalResults = filteredProposals.length + matchedServices.length;

  const handleClearAll = () => { setQuery(""); clearFilters(); navigate("/price"); };

  if (loading) return <div className="flex-1 flex items-center justify-center py-20"><SpinnerGap size={32} className="text-[#6868B1] animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-[10px] p-[12px]">
          <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#E8E8FD]"><MagnifyingGlass size={22} weight="duotone" className="text-[#6868B1]" /></div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]" style={fontFeature}>Pesquisa</span>
            <span className="text-[#28415c] text-[19px] font-bold tracking-[-0.5px] leading-[24px]" style={fontFeature}>Resultados da busca</span>
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{totalResults} resultado{totalResults !== 1 ? "s" : ""}</span>
          <button onClick={handleClearAll} className="flex items-center gap-[4px] h-[34px] px-[14px] rounded-[500px] bg-[#E8E8FD] text-[#4A3B8C] hover:bg-[#DDD6FE] transition-colors cursor-pointer"><X size={12} weight="bold" /><span className="uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>Limpar busca</span></button>
        </div>
      </div>

      {totalResults === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="flex items-center justify-center w-[64px] h-[64px] rounded-[16px] bg-[#F5F3FF] mb-4"><MagnifyingGlass size={28} className="text-[#DDD6FE]" /></div>
          <p className="text-[#28415c] mb-1" style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>Nenhum resultado encontrado</p>
          <p className="text-[#4E6987] mb-5" style={{ fontSize: 13, letterSpacing: -0.3, ...fontFeature }}>Tente ajustar os termos de pesquisa ou os filtros aplicados.</p>
          <button onClick={handleClearAll} className="flex items-center gap-[4px] h-[36px] px-[18px] rounded-[500px] bg-[#E8E8FD] text-[#4A3B8C] hover:bg-[#DDD6FE] transition-colors cursor-pointer"><X size={12} weight="bold" /><span className="uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>Limpar e voltar</span></button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-4">
          {matchedServices.length > 0 && (
            <div>
              <div className="flex items-center gap-[10px] mb-[10px]"><div className="flex items-center justify-center shrink-0 w-[32px] h-[32px] rounded-[8px] bg-[#E8E8FD]"><Package size={16} weight="duotone" className="text-[#6868B1]" /></div><span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, color: "#4A3B8C", ...fontFeature }}>Servi\u00e7os</span><span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#E8E8FD] text-[#4A3B8C]" style={{ fontSize: 10, fontWeight: 700, ...fontFeature }}>{matchedServices.length}</span></div>
              <div className="bg-white rounded-[12px]">
                {matchedServices.map((svc) => {
                  const colors = groupColors[svc.group];
                  const groupRoute = svc.group === "sales_ops" ? "sales-ops" : svc.group === "brand_co" ? "brand-co" : "performance";
                  return (
                    <div key={svc.id} onClick={() => navigate(`/price/servicos/${groupRoute}`)} className="flex items-center gap-[12px] p-[12px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
                      <div className={`flex items-center justify-center shrink-0 w-[40px] h-[40px] rounded-[8px] ${colors.bg}`}><Package size={20} weight="duotone" className={colors.icon} /></div>
                      <div className="flex-1 min-w-0"><p className="text-[#28415c] truncate" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>{svc.name}</p><p className="text-[#4E6987] truncate" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>{groupLabels[svc.group as ServiceGroup]} \u00b7 {svc.description}</p></div>
                      <div className="flex items-center gap-3 shrink-0"><div className="flex flex-col items-end"><span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{svc.basePrice > 0 ? formatCurrency(svc.basePrice) : "\u2014"}</span><span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>mensal</span></div><ArrowRight size={14} className="text-[#C8CFDB]" /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {filteredProposals.length > 0 && (
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-[10px] mb-[10px]"><div className="flex items-center justify-center shrink-0 w-[32px] h-[32px] rounded-[8px] bg-[#E8E8FD]"><ClipboardText size={16} weight="duotone" className="text-[#6868B1]" /></div><span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, color: "#4A3B8C", ...fontFeature }}>Propostas</span><span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#E8E8FD] text-[#4A3B8C]" style={{ fontSize: 10, fontWeight: 700, ...fontFeature }}>{filteredProposals.length}</span></div>
              <div className="bg-white rounded-[12px] flex-1">
                {filteredProposals.slice(0, 15).map((proposal) => (
                  <div key={proposal.id} onClick={() => navigate(`/price/propostas/${proposal.id}`)} className="flex items-center gap-[12px] p-[12px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
                    <div className="flex items-center justify-center shrink-0 w-[40px] h-[40px] rounded-[8px] bg-[#DCF0FF]"><FileText size={20} weight="duotone" className="text-[#0483AB]" /></div>
                    <div className="flex-1 min-w-0"><p className="text-[#07ABDE] truncate" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>{proposal.client_name}</p><p className="text-[#4E6987] truncate" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>{proposal.id} \u00b7 {formatCurrency(proposal.grand_total ?? 0)}</p></div>
                    <ArrowRight size={14} className="text-[#C8CFDB] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
