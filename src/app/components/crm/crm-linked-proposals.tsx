/**
 * CRM Linked Proposals — Shows proposals from the Price module
 * linked to a CRM entity (account, opportunity, or contact).
 */

import { useState, useEffect } from "react";
import {
  Invoice,
  ArrowSquareOut,
  CircleNotch,
} from "@phosphor-icons/react";
import { getProposalsByCrm, type DbProposal } from "../api";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fontFeature: React.CSSProperties = { fontFeatureSettings: "'tnum'" };

function formatCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  rascunho: { label: "Rascunho", bg: "#F6F7F9", color: "#98989d" },
  criada: { label: "Criada", bg: "#DCF0FF", color: "#07ABDE" },
  enviada: { label: "Enviada", bg: "#FEEDCA", color: "#917822" },
  aprovada: { label: "Aprovada", bg: "#D9F8EF", color: "#3CCEA7" },
  recusada: { label: "Recusada", bg: "#FFEDEB", color: "#ED5200" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CrmLinkedProposalsProps {
  accountId?: string;
  opportunityId?: string;
  contactId?: string;
}

export function CrmLinkedProposals({ accountId, opportunityId, contactId }: CrmLinkedProposalsProps) {
  const [proposals, setProposals] = useState<DbProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId && !opportunityId && !contactId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await getProposalsByCrm({ accountId, opportunityId, contactId });
        if (!cancelled) setProposals(data);
      } catch (err) {
        console.error("Error loading linked proposals:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accountId, opportunityId, contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-[#98989d]">
        <CircleNotch size={20} className="animate-spin" />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Invoice size={28} weight="duotone" className="text-[#C8CFDB]" />
        <p className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3 }}>
          Nenhuma proposta vinculada
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[6px]">
      {/* Header */}
      <div className="flex items-center justify-between px-[4px] pb-[4px]">
        <span
          className="text-[#98989d] uppercase"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "16px" }}
        >
          MÓDULO PRICE · {proposals.length} {proposals.length === 1 ? "proposta" : "propostas"}
        </span>
      </div>

      {/* Proposal cards */}
      {proposals.map((p) => {
        const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.rascunho;
        const svcCount = p.price_proposal_services?.length ?? 0;

        return (
          <button
            key={p.id}
            onClick={() => window.open(`https://price.htz.agency/price/propostas/${p.id}`, "_blank")}
            className="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors group text-left w-full"
          >
            {/* Icon */}
            <div className="flex items-center justify-center size-[36px] rounded-[10px] bg-[#DCF0FF] shrink-0">
              <Invoice size={18} weight="duotone" className="text-[#07ABDE]" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[8px]">
                <span
                  className="text-[#28415C] font-semibold truncate"
                  style={{ fontSize: 14, letterSpacing: -0.3, lineHeight: "20px", ...fontFeature }}
                >
                  {p.id}
                </span>
                <span
                  className="shrink-0 rounded-full px-[8px] py-[1px]"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    lineHeight: "16px",
                    backgroundColor: status.bg,
                    color: status.color,
                    textTransform: "uppercase",
                  }}
                >
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-[8px]">
                <span
                  className="text-[#4E6987] truncate"
                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, lineHeight: "18px" }}
                >
                  {p.client_name}
                </span>
                {svcCount > 0 && (
                  <span className="text-[#98989d]" style={{ fontSize: 11, ...fontFeature }}>
                    · {svcCount} {svcCount === 1 ? "serviço" : "serviços"}
                  </span>
                )}
              </div>
            </div>

            {/* Value + arrow */}
            <div className="flex items-center gap-[8px] shrink-0">
              <span
                className="text-[#28415C]"
                style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
              >
                {formatCurrency(p.total_monthly)}/mês
              </span>
              <ArrowSquareOut
                size={14}
                weight="bold"
                className="text-[#C8CFDB] group-hover:text-[#07ABDE] transition-colors"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}