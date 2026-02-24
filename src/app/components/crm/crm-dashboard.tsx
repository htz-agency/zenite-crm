import {
  UsersThree,
  Lightning,
  Handshake,
  TrendUp,
  ArrowRight,
  UserPlus,
  Funnel,
  Target,
  ChatCircleDots,
  Plus,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { PillButton } from "../pill-button";
import { useCreateLead } from "./create-lead-context";

/* ------------------------------------------------------------------ */
/*  Placeholder data                                                   */
/* ------------------------------------------------------------------ */

const statCards = [
  {
    label: "Total Leads",
    value: "247",
    icon: <UsersThree size={22} weight="duotone" />,
    color: "bg-[#DCF0FF] text-[#0483AB]",
  },
  {
    label: "Leads Ativos",
    value: "89",
    icon: <Lightning size={22} weight="duotone" />,
    color: "bg-[#D9F8EF] text-[#3CCEA7]",
  },
  {
    label: "Em Negociação",
    value: "34",
    icon: <Handshake size={22} weight="duotone" />,
    color: "bg-[#FEEDCA] text-[#917822]",
  },
  {
    label: "Taxa de Conversão",
    value: "23%",
    icon: <TrendUp size={22} weight="duotone" />,
    color: "bg-[#E8E8FD] text-[#6868B1]",
  },
];

const pipelineStages = [
  {
    title: "Prospecção",
    description: "Identificação e contato inicial",
    icon: <Target size={24} weight="duotone" />,
    color: "text-[#0483AB]",
    bg: "bg-[#DCF0FF]",
    count: 45,
    link: "/crm/pipeline",
  },
  {
    title: "Qualificação",
    description: "Análise de fit e orçamento",
    icon: <Funnel size={24} weight="duotone" />,
    color: "text-[#3CCEA7]",
    bg: "bg-[#D9F8EF]",
    count: 28,
    link: "/crm/pipeline",
  },
  {
    title: "Proposta",
    description: "Apresentação de propostas",
    icon: <ChatCircleDots size={24} weight="duotone" />,
    color: "text-[#917822]",
    bg: "bg-[#FEEDCA]",
    count: 18,
    link: "/crm/pipeline",
  },
  {
    title: "Negociação",
    description: "Ajustes finais e termos",
    icon: <Handshake size={24} weight="duotone" />,
    color: "text-[#ED5200]",
    bg: "bg-[#FFEDEB]",
    count: 12,
    link: "/crm/pipeline",
  },
];

const recentLeads = [
  { id: 1, name: "Ana Oliveira", company: "TechBrasil", stage: "Qualificação", lastActivity: "Há 2 dias", source: "Inbound" },
  { id: 2, name: "Carlos Mendes", company: "XPTO Corp", stage: "Proposta", lastActivity: "Há 3 dias", source: "Prospecção" },
  { id: 3, name: "Maria Santos", company: "Digital Co.", stage: "Negociação", lastActivity: "Há 5 dias", source: "Indicação" },
  { id: 4, name: "João Ferreira", company: "StartupX", stage: "Prospecção", lastActivity: "Há 7 dias", source: "Inbound" },
  { id: 5, name: "Luciana Reis", company: "AgriTech SA", stage: "Qualificação", lastActivity: "Há 10 dias", source: "Evento" },
];

const stageColors: Record<string, { text: string }> = {
  Prospecção: { text: "text-[#0483AB]" },
  Qualificação: { text: "text-[#3CCEA7]" },
  Proposta: { text: "text-[#917822]" },
  Negociação: { text: "text-[#ED5200]" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CrmDashboard() {
  const navigate = useNavigate();
  const { openModal: openCreateLeadModal } = useCreateLead();

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[#122232]" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
            Início
          </h1>
          <p className="text-[#4E6987] mt-1" style={{ fontSize: 14 }}>
            Visão geral do CRM e pipeline de vendas
          </p>
        </div>
        <PillButton
          onClick={() => openCreateLeadModal()}
          icon={<Plus size={16} weight="bold" />}
          className="w-full sm:w-auto justify-center"
        >
          Novo Lead
        </PillButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-[#DDE3EC]">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500 }}>
              {stat.label}
            </p>
            <p className="text-[#122232] mt-1" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {pipelineStages.map((stage) => (
          <button
            key={stage.title}
            onClick={() => navigate(stage.link)}
            className="bg-white rounded-xl p-5 border border-[#DDE3EC] text-left hover:border-[#0483AB] transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stage.bg} ${stage.color}`}>
                {stage.icon}
              </div>
              <ArrowRight
                size={16}
                className="text-[#C8CFDB] group-hover:text-[#0483AB] transition-colors"
              />
            </div>
            <p className="text-[#122232]" style={{ fontSize: 15, fontWeight: 700 }}>
              {stage.title}
            </p>
            <p className="text-[#4E6987] mt-0.5" style={{ fontSize: 13 }}>
              {stage.description}
            </p>
            <p className="text-[#C8CFDB] mt-2" style={{ fontSize: 12 }}>
              {stage.count} leads nesta etapa
            </p>
          </button>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-[#0483AB]" weight="duotone" />
            <span
              className="text-[#28415c]"
              style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
            >
              Leads Recentes
            </span>
          </div>
          <button
            onClick={() => navigate("/crm/leads")}
            className="flex items-center gap-[3px] h-[34px] px-[14px] rounded-full bg-[#f6f7f9] text-[#28415c] hover:bg-[#dde3ec] transition-colors cursor-pointer"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
          >
            Ver todos
            <ArrowRight size={12} weight="bold" />
          </button>
        </div>

        {/* Table */}
        <div className="hidden md:block">
          {/* Column header */}
          <div
            className="grid items-center px-5 h-[34px]"
            style={{ gridTemplateColumns: "32px 1fr 1fr 120px 120px 100px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#28415c", fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
          >
            <span className="text-right pr-3">#</span>
            <span>Nome</span>
            <span>Empresa</span>
            <span>Estágio</span>
            <span>Última Atividade</span>
            <span>Origem</span>
          </div>

          {recentLeads.map((lead, idx) => {
            const stageColor = stageColors[lead.stage] ?? { text: "text-[#4E6987]" };
            return (
              <div key={lead.id}>
                {/* HorizontalDivider */}
                <div className="h-0 relative w-full">
                  <div className="absolute inset-[-0.75px_0_0_0]">
                    <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
                      <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
                    </svg>
                  </div>
                </div>
                <div
                  onClick={() => navigate("/crm/leads")}
                  className="grid items-center px-5 h-[34px] rounded-[100px] hover:bg-[#f6f7f9] transition-colors cursor-pointer mx-2"
                  style={{ gridTemplateColumns: "32px 1fr 1fr 120px 120px 100px", fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                >
                  <span
                    className="text-[#28415c] text-right pr-3"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-[#07ABDE] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5 }}>
                    {lead.name}
                  </span>
                  <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5 }}>
                    {lead.company}
                  </span>
                  <span className={stageColor.text} style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5 }}>
                    {lead.stage}
                  </span>
                  <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5 }}>
                    {lead.lastActivity}
                  </span>
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5 }}>
                    {lead.source}
                  </span>
                </div>
              </div>
            );
          })}
          {/* Bottom divider */}
          <div className="h-0 relative w-full">
            <div className="absolute inset-[-0.75px_0_0_0]">
              <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
                <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
              </svg>
            </div>
          </div>
        </div>

        {/* Mobile: card list */}
        <div className="md:hidden">
          {recentLeads.map((lead, idx) => {
            const stageColor = stageColors[lead.stage] ?? { text: "text-[#4E6987]" };
            return (
              <div key={lead.id}>
                <div className="h-0 relative w-full">
                  <div className="absolute inset-[-0.75px_0_0_0]">
                    <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
                      <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
                    </svg>
                  </div>
                </div>
                <div
                  onClick={() => navigate("/crm/leads")}
                  className="px-3 mx-2 py-2.5 flex items-center justify-between gap-3 cursor-pointer rounded-[100px] hover:bg-[#F6F7F9] transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span
                      className="text-[#28415c] shrink-0"
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, width: 20, textAlign: "right" }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[#07ABDE] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5 }}>
                        {lead.name}
                      </p>
                      <p className="text-[#4E6987]" style={{ fontSize: 10, letterSpacing: -0.3 }}>
                        {lead.company} · {lead.lastActivity}
                      </p>
                    </div>
                  </div>
                  <span className={`${stageColor.text} shrink-0`} style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5 }}>
                    {lead.stage}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}