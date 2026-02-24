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
import { formatCurrency, services as allServicesCatalog, calculateServicePrice, groupLabels, type ServiceGroup } from "./pricing-data";

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

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await getPublicProposal(token);
        setProposal(data);
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
      <div className="bg-[#122232] px-6 py-4">
        <div className="max-w-[860px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-[32px] rounded-[10px] bg-[#28415c]">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path d="M4 8L14 4L24 8V20L14 24L4 20V8Z" stroke="#07ABDE" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M14 4V24" stroke="#07ABDE" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M4 8L14 14L24 8" stroke="#07ABDE" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[#C8CFDB]" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
              Zenite · HTZ Agency
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
                <div className="flex items-center justify-center size-[40px] rounded-[12px] bg-[#DCF0FF] shrink-0">
                  <FileText size={22} weight="duotone" className="text-[#0483AB]" />
                </div>
                <div>
                  <p className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                    Proposta Comercial
                  </p>
                  <p className="text-[#4E6987]" style={{ fontSize: 12, ...ff }}>
                    {proposal.id} · Criada em {formatDate(proposal.created_at)}
                  </p>
                </div>
              </div>
              <h1 className="text-[#122232] mt-4" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.2, ...ff }}>
                {proposal.client_name}
              </h1>
              {proposal.notes && (
                <p className="text-[#4E6987] mt-3" style={{ fontSize: 14, lineHeight: 1.6, ...ff }}>
                  {proposal.notes}
                </p>
              )}
            </div>

            {/* Financial summary */}
            <div className="shrink-0 bg-[#f6f7f9] rounded-[16px] p-6 min-w-[240px]">
              <p className="text-[#98989d] mb-4" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                Resumo Financeiro
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CurrencyDollar size={16} weight="duotone" className="text-[#0483AB]" />
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
                  <span className="text-[#0483AB]" style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
                    {formatCurrency(proposal.grand_total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div
          className="bg-white rounded-[20px] p-8 md:p-10 mb-6"
          style={{ boxShadow: "0 4px 24px rgba(18,34,50,0.06)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Package size={20} weight="duotone" className="text-[#0483AB]" />
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
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>
                            {complexityLabels[svc.complexity] ?? svc.complexity}
                          </span>
                          <span className="text-[#C8CFDB]">·</span>
                          <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>
                            {recurrenceLabels[svc.recurrence] ?? svc.recurrence}
                          </span>
                          <span className="text-[#C8CFDB]">·</span>
                          <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>
                            {svc.hours}h/mês
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, ...ff }}>
                          {formatCurrency(svc.monthly)}
                        </span>
                        <span className="text-[#98989d]" style={{ fontSize: 11, ...ff }}>/mês</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Response section */}
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
                  Aprovar Proposta
                </button>
                <button
                  onClick={() => handleRespond("recusada")}
                  disabled={responding}
                  className="flex items-center justify-center gap-2 h-[48px] px-8 rounded-[500px] bg-[#f6f7f9] text-[#4E6987] hover:bg-[#DDE3EC] transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  style={{ fontSize: 14, fontWeight: 700, ...ff }}
                >
                  <XCircle size={20} weight="bold" />
                  Recusar
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 mb-4">
          <p className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, ...ff }}>
            Proposta gerada por Zenite · HTZ Agency
          </p>
        </div>
      </div>
    </div>
  );
}