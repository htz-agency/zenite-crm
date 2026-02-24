/**
 * Public Proposal View — Client-facing page (no auth required).
 * Accessed via /p/:token
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  FileText,
  CheckCircle,
  XCircle,
  CurrencyDollar,
  Clock,
  Percent,
  SpinnerGap,
  ArrowRight,
  Package,
  CalendarBlank,
} from "@phosphor-icons/react";
import { getPublicProposal, respondToProposal, dbToSelected, type DbProposal } from "./api";
import { formatCurrency, services as allServicesCatalog, calculateServicePrice, groupLabels, type ServiceGroup, adsComplexityLabels, allocationLabels } from "./pricing-data";

import { getProposalTemplate, DEFAULT_TEMPLATE, type ProposalTemplateConfig } from "./api";
import svgPaths360 from "../../imports/svg-1z8u746bdq";
import svgPathsList1 from "../../imports/svg-27usn8kt6p";
import svgPathsList2 from "../../imports/svg-4tydo46hes";

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

const groupColorMap: Record<string, { bg: string; accent: string; text: string }> = {
  performance: { bg: "bg-[#DCF0FF]", accent: "bg-[#0483AB]", text: "text-[#025E7B]" },
  sales_ops: { bg: "bg-[#D9F8EF]", accent: "bg-[#3CCEA7]", text: "text-[#135543]" },
  brand_co: { bg: "bg-[#FFEDEB]", accent: "bg-[#ED5200]", text: "text-[#B13B00]" },
};

/**
 * Router-aware wrapper — used inside React Router route tree.
 * Reads :token from URL params.
 */
export function PublicProposal() {
  const { token } = useParams<{ token: string }>();
  return <PublicProposalContent token={token || ""} />;
}

/**
 * Standalone component — can be rendered OUTSIDE the router.
 * Receives token as prop directly.
 */
export function PublicProposalContent({ token }: { token: string }) {
  const [proposal, setProposal] = useState<DbProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState(false);
  const [tpl, setTpl] = useState<ProposalTemplateConfig>({ ...DEFAULT_TEMPLATE });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [data, templateData] = await Promise.all([
          getPublicProposal(token),
          getProposalTemplate().catch(() => null),
        ]);
        setProposal(data);
        if (templateData) setTpl({ ...DEFAULT_TEMPLATE, ...templateData });
      } catch (err: any) {
        setError(err?.message || "Link inválido ou expirado.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleRespond = async (response: "aprovada" | "recusada") => {
    if (!token) return;
    setResponding(true);
    try {
      await respondToProposal(token, response);
      setProposal((prev) => prev ? { ...prev, status: response } : prev);
      setResponded(true);
    } catch (err: any) {
      console.error("Error responding to proposal:", err);
    } finally {
      setResponding(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <SpinnerGap size={36} weight="bold" className="text-[#0483AB] animate-spin" />
          <p className="text-[#4E6987]" style={{ fontSize: 14, ...ff }}>Carregando proposta...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-[20px] p-10 max-w-[480px] w-full text-center" style={{ boxShadow: "0 4px 24px rgba(18,34,50,0.08)" }}>
          <div className="flex items-center justify-center size-[56px] rounded-[16px] bg-[#FFEDEB] mx-auto mb-4">
            <XCircle size={28} weight="duotone" className="text-[#B13B00]" />
          </div>
          <h2 className="text-[#122232] mb-2" style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
            Link inválido
          </h2>
          <p className="text-[#4E6987]" style={{ fontSize: 14, ...ff }}>
            {error || "Esta proposta não foi encontrada ou o link expirou."}
          </p>
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
      return {
        name: catalogSvc.name,
        monthly: calc.monthly,
        impl: calc.impl,
        hours: calc.hours,
        group: catalogSvc.group,
        complexity: dbSvc.complexity,
        recurrence: dbSvc.recurrence,
        allocation: dbSvc.allocation,
        isAds: catalogSvc.isAds,
        includeImpl: dbSvc.include_impl,
      };
    }
    return {
      name: dbSvc.service_id,
      monthly: dbSvc.computed_monthly ?? 0,
      impl: dbSvc.computed_impl ?? 0,
      hours: dbSvc.computed_hours ?? 0,
      group: "performance" as ServiceGroup,
      complexity: dbSvc.complexity,
      recurrence: dbSvc.recurrence,
      allocation: dbSvc.allocation ?? "compartilhado",
      isAds: false,
      includeImpl: dbSvc.include_impl,
    };
  });

  // Group services by group
  const groupedServices: Record<string, typeof serviceDetails> = {};
  serviceDetails.forEach((svc) => {
    if (!groupedServices[svc.group]) groupedServices[svc.group] = [];
    groupedServices[svc.group].push(svc);
  });

  const isResolved = proposal.status === "aprovada" || proposal.status === "recusada";
  const isApproved = proposal.status === "aprovada";
  const hasDiscount = (proposal.global_discount ?? 0) > 0 || (proposal.combo_discount_percent ?? 0) > 0;

  const complexityLabels: Record<string, string> = {
    basico: "Básico",
    intermediario: "Intermediário",
    avancado: "Avançado",
  };

  const recurrenceLabels: Record<string, string> = {
    mensal: "Mensal",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header bar */}
      <div className="px-6 py-4" style={{ backgroundColor: tpl.headerBgColor }}>
        <div className="max-w-[860px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tpl.logoUrl ? (
              <img src={tpl.logoUrl} alt="Logo" className="h-[32px] w-auto object-contain" />
            ) : (
              <div className="flex items-center justify-center size-[32px] rounded-[10px]" style={{ backgroundColor: tpl.accentColor + "22" }}>
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                  <path d="M4 8L14 4L24 8V20L14 24L4 20V8Z" stroke={tpl.accentColor} strokeWidth="2" strokeLinejoin="round" fill="none" />
                  <path d="M14 4V24" stroke={tpl.accentColor} strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4 8L14 14L24 8" stroke={tpl.accentColor} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <span className="text-[#C8CFDB]" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
              {tpl.companyName}
            </span>
          </div>
          <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
            Proposta {proposal.id}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[860px] mx-auto px-4 py-8 md:py-12">
        {/* Hero card */}
        <div
          className="bg-white rounded-[20px] p-8 md:p-10 mb-6"
          style={{ boxShadow: "0 4px 24px rgba(18,34,50,0.06)" }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center size-[40px] rounded-[12px] shrink-0" style={{ backgroundColor: tpl.accentColor + "20" }}>
                  <FileText size={22} weight="duotone" style={{ color: tpl.accentColor }} />
                </div>
                <div>
                  <p className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                    {tpl.heroTitle}
                  </p>
                  <p className="text-[#4E6987]" style={{ fontSize: 12, ...ff }}>
                    {proposal.id} · Criada em {formatDate(proposal.created_at)}
                  </p>
                </div>
              </div>
              <h1 className="text-[#122232] mt-4" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.2, ...ff }}>
                {proposal.client_name}
              </h1>
              {tpl.heroSubtitle && (
                <p className="text-[#4E6987] mt-2" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, ...ff }}>{tpl.heroSubtitle}</p>
              )}
              {tpl.introText ? (
                <p className="text-[#4E6987] mt-3" style={{ fontSize: 14, lineHeight: 1.6, ...ff }}>{tpl.introText}</p>
              ) : proposal.notes ? (
                <p className="text-[#4E6987] mt-3" style={{ fontSize: 14, lineHeight: 1.6, ...ff }}>{proposal.notes}</p>
              ) : null}
            </div>

            {/* Financial summary */}
            {tpl.showFinancialSummary && (
            <div className="shrink-0 bg-[#f6f7f9] rounded-[16px] p-6 min-w-[240px]">
              <p className="text-[#98989d] mb-4" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                Resumo Financeiro
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrencyDollar size={16} weight="duotone" style={{ color: tpl.accentColor }} />
                    <span className="text-[#4E6987]" style={{ fontSize: 13, ...ff }}>Mensalidade</span>
                  </div>
                  <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, ...ff }}>
                    {formatCurrency(proposal.total_monthly)}
                  </span>
                </div>
                {proposal.total_impl > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={16} weight="duotone" className="text-[#6868B1]" />
                      <span className="text-[#4E6987]" style={{ fontSize: 13, ...ff }}>Implantação</span>
                    </div>
                    <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, ...ff }}>
                      {formatCurrency(proposal.total_impl)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} weight="duotone" className="text-[#3CCEA7]" />
                    <span className="text-[#4E6987]" style={{ fontSize: 13, ...ff }}>Horas/mês</span>
                  </div>
                  <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, ...ff }}>
                    {proposal.total_hours}h
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent size={16} weight="duotone" className="text-[#ED5200]" />
                      <span className="text-[#4E6987]" style={{ fontSize: 13, ...ff }}>Desconto</span>
                    </div>
                    <span className="text-[#ED5200]" style={{ fontSize: 14, fontWeight: 700, ...ff }}>
                      {proposal.combo_discount_percent > 0 ? `${proposal.combo_discount_percent}%` : formatCurrency(proposal.global_discount)}
                    </span>
                  </div>
                )}
                <div className="h-[1px] bg-[#DDE3EC] my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, ...ff }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: tpl.accentColor, ...ff }}>
                    {formatCurrency(proposal.grand_total)}
                  </span>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Services */}
        {tpl.showServices && (
        <div
          className="bg-white rounded-[20px] p-8 md:p-10 mb-6"
          style={{ boxShadow: "0 4px 24px rgba(18,34,50,0.06)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Package size={20} weight="duotone" style={{ color: tpl.accentColor }} />
            <h2 className="text-[#122232]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
              Serviços Incluídos
            </h2>
            <span className="ml-auto text-[#98989d]" style={{ fontSize: 12, ...ff }}>
              {serviceDetails.length} {serviceDetails.length === 1 ? "serviço" : "serviços"}
            </span>
          </div>

          {Object.entries(groupedServices).map(([group, services]) => {
            const colors = groupColorMap[group] ?? groupColorMap.performance;
            return (
              <div key={group} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`size-[8px] rounded-full ${colors.accent}`} />
                  <span className={`${colors.text}`} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                    {groupLabels[group as ServiceGroup] ?? group}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {services.map((svc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 px-4 py-3 rounded-[12px] bg-[#f6f7f9] hover:bg-[#eef0f3] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[#122232] truncate" style={{ fontSize: 14, fontWeight: 600, ...ff }}>
                          {svc.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>
                            {svc.isAds
                              ? (adsComplexityLabels[svc.complexity] ?? svc.complexity)
                              : (complexityLabels[svc.complexity] ?? svc.complexity)}
                          </span>
                          <span className="text-[#C8CFDB]">·</span>
                          <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>
                            {recurrenceLabels[svc.recurrence] ?? svc.recurrence}
                          </span>
                          {svc.allocation && (
                            <>
                              <span className="text-[#C8CFDB]">·</span>
                              <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>
                                {svc.allocation === "dedicado" ? "Ded." : "Comp."}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, ...ff }}>
                            {formatCurrency(svc.monthly)}
                          </span>
                          <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>/mês</span>
                        </div>
                        {svc.impl > 0 && (
                          <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>
                            + {formatCurrency(svc.impl)} impl.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Metodologia 360º — branding padrão, sempre visível */}
        <div
          className="bg-white rounded-[20px] p-8 md:p-10 mb-6"
          style={{ boxShadow: "0 4px 24px rgba(18,34,50,0.06)" }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: branding */}
            <div className="flex flex-col items-center text-center shrink-0 md:w-[180px]">
              <div className="overflow-hidden size-[120px] mb-4">
                <svg className="block size-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 183.042 178.642">
                  <path clipRule="evenodd" d={svgPaths360.p29d91900} fill="#8C8CD4" fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths360.p737b5f0} fill="#07ABDE" fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths360.p17aa0c40} fill="#3CCEA7" fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths360.p20005730} fill="#EAC23D" fillRule="evenodd" />
                  <path clipRule="evenodd" d={svgPaths360.p3dbbf580} fill="#FF8C76" fillRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-[#28415c]" style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.5, ...ff }}>
                agencyOS
              </h2>
              <h3 className="text-[#4e6987]" style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                Metodologia 360º
              </h3>
              <p className="text-[#4e6987] mt-2" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 15, lineHeight: 1.5 }}>
                Transforme sua presença no mercado com uma abordagem estratégica completa.
              </p>
            </div>

            {/* Right: pillars grid */}
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estratégia Competitiva */}
              <div className="rounded-[16px] bg-[#dcf0ff] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 size-[28px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 32 32">
                      <path d={svgPathsList1.pee08a80} fill="#0483AB" />
                    </svg>
                  </div>
                  <h4 className="text-[#0483ab]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                    Estratégia Competitiva
                  </h4>
                </div>
                <p className="text-[#001b26]" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, ...ff }}>
                  Mapeamos o território antes de traçar o caminho. Definimos objetivos claros, analisamos o mercado em profundidade, segmentamos audiências com precisão e identificamos gaps competitivos que se transformam em oportunidades de crescimento.
                </p>
              </div>

              {/* Propaganda & Mídia */}
              <div className="rounded-[16px] bg-[#ffedeb] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 size-[28px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 32 32">
                      <path d={svgPathsList2.pe840800} fill="#F56233" />
                    </svg>
                  </div>
                  <h4 className="text-[#f56233]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                    Propaganda & Mídia
                  </h4>
                </div>
                <p className="text-[#431100]" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, ...ff }}>
                  Visibilidade estratégica é tudo. Posicionamos sua marca nos canais certos, no momento certo, com a mensagem certa. Cada campanha é desenhada para maximizar alcance, engajamento e ROI.
                </p>
              </div>

              {/* Planejamento de Marketing */}
              <div className="rounded-[16px] bg-[#d9f8ef] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 size-[28px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 32 32">
                      <path d={svgPathsList1.p15d50400} fill="#20B48D" />
                    </svg>
                  </div>
                  <h4 className="text-[#20b48d]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                    Planejamento de Marketing
                  </h4>
                </div>
                <p className="text-[#02140e]" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, ...ff }}>
                  Estratégia sem execução é apenas teoria. Desenvolvemos planos de ação baseados em dados, selecionamos os canais mais eficientes para seu público, construímos mensagens que convertem e criamos campanhas que geram impacto real.
                </p>
              </div>

              {/* Análise & Otimização */}
              <div className="rounded-[16px] bg-[#e8e8fd] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 size-[28px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 32 32">
                      <path d={svgPathsList2.p3dddc7d0} fill="#6868B1" />
                    </svg>
                  </div>
                  <h4 className="text-[#6868b1]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                    Análise & Otimização
                  </h4>
                </div>
                <p className="text-[#14142c]" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, ...ff }}>
                  Medimos tudo que importa. Através de análises aprofundadas e relatórios inteligentes, identificamos o que funciona, otimizamos o que pode melhorar e garantimos evolução constante. Seus investimentos em marketing se tornam cada vez mais eficientes.
                </p>
              </div>

              {/* Design & Identidade */}
              <div className="rounded-[16px] bg-[#feedca] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 size-[28px]">
                    <svg className="block size-full" fill="none" viewBox="0 0 32 32">
                      <path d={svgPathsList1.p350ae4e0} fill="#917822" />
                    </svg>
                  </div>
                  <h4 className="text-[#917822]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                    Design & Identidade
                  </h4>
                </div>
                <p className="text-[#1f1803]" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, ...ff }}>
                  Sua marca merece se destacar. Criamos identidades visuais memoráveis, experiências digitais envolventes e materiais de comunicação que não apenas chamam atenção, mas eles constroem conexões emocionais duradouras com seu público-alvo.
                </p>
              </div>

              {/* Closing statement */}
              <div className="flex items-center p-4">
                <p className="text-[#4e6987]" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 15, lineHeight: 1.6 }}>
                  A Metodologia 360º da HTZ é mais do que um framework, é um sistema integrado que conecta todos os pontos de contato entre sua marca e o mercado. Diferente de soluções fragmentadas, nossa abordagem garante coerência estratégica, execução impecável e resultados mensuráveis em cada etapa da jornada do seu cliente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Response section */}
        {tpl.showResponseButtons && (
        <div
          className="bg-white rounded-[20px] p-8 md:p-10"
          style={{ boxShadow: "0 4px 24px rgba(18,34,50,0.06)" }}
        >
          {isResolved || responded ? (
            <div className="text-center py-4">
              <div className={`flex items-center justify-center size-[56px] rounded-[16px] mx-auto mb-4 ${isApproved ? "bg-[#D9F8EF]" : "bg-[#FFEDEB]"}`}>
                {isApproved ? (
                  <CheckCircle size={28} weight="duotone" className="text-[#3CCEA7]" />
                ) : (
                  <XCircle size={28} weight="duotone" className="text-[#B13B00]" />
                )}
              </div>
              <h3 className="text-[#122232] mb-2" style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                {isApproved ? "Proposta Aprovada!" : "Proposta Recusada"}
              </h3>
              <p className="text-[#4E6987]" style={{ fontSize: 14, ...ff }}>
                {isApproved
                  ? "Obrigado! Nossa equipe entrará em contato para os próximos passos."
                  : "Agradecemos seu feedback. Se tiver alguma dúvida, entre em contato."}
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-[#122232] text-center mb-2" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                O que achou da proposta?
              </h3>
              <p className="text-[#4E6987] text-center mb-6" style={{ fontSize: 14, ...ff }}>
                Clique abaixo para aprovar ou recusar esta proposta.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => handleRespond("aprovada")}
                  disabled={responding}
                  className="flex items-center justify-center gap-2 h-[48px] px-8 rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#2BAF8A] transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  style={{ fontSize: 14, fontWeight: 700, ...ff }}
                >
                  <CheckCircle size={20} weight="bold" />
                  {tpl.ctaApproveText}
                </button>
                <button
                  onClick={() => handleRespond("recusada")}
                  disabled={responding}
                  className="flex items-center justify-center gap-2 h-[48px] px-8 rounded-[500px] bg-[#f6f7f9] text-[#4E6987] hover:bg-[#DDE3EC] transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  style={{ fontSize: 14, fontWeight: 700, ...ff }}
                >
                  <XCircle size={20} weight="bold" />
                  {tpl.ctaRejectText}
                </button>
              </div>
            </>
          )}
        </div>
        )}

        {/* Footer */}
        {tpl.footerText && (
        <div className="text-center mt-8 mb-4">
          <p className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, ...ff }}>
            {tpl.footerText}
          </p>
        </div>
        )}
      </div>
    </div>
  );
}