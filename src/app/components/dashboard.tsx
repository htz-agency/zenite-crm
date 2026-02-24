import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  CurrencyDollar,
  FileText,
  TrendUp,
  Speedometer,
  RocketLaunch,
  CompassTool,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  PaperPlaneTilt,
  SpinnerGap,
  Database,
  Plus,
  ClipboardText,
} from "@phosphor-icons/react";
import { formatCurrency } from "./pricing-data";
import { PillButton } from "./pill-button";
import { getDashboardStats, listProposals, seedServices, listDbServices, debugServiceColumns, type DbProposal, type DashboardStats } from "./api";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  rascunho: { label: "Rascunho", bg: "bg-[#F6F7F9]", text: "text-[#4E6987]" },
  criada: { label: "Criada", bg: "bg-[#E8E8FD]", text: "text-[#6868B1]" },
  enviada: { label: "Enviada", bg: "bg-[#DCF0FF]", text: "text-[#025E7B]" },
  aprovada: { label: "Aprovada", bg: "bg-[#D9F8EF]", text: "text-[#135543]" },
  recusada: { label: "Recusada", bg: "bg-[#FFEDEB]", text: "text-[#B13B00]" },
};

const serviceGroups = [
  {
    title: "Performance",
    description: "Google Ads, Meta Ads, SEO e mais",
    icon: <Speedometer size={24} weight="duotone" />,
    color: "text-[#0483AB]",
    bg: "bg-[#DCF0FF]",
    count: 6,
    link: "/price/servicos/performance",
  },
  {
    title: "Sales OPS",
    description: "CRM, Automação, Pipeline e mais",
    icon: <RocketLaunch size={24} weight="duotone" />,
    color: "text-[#3CCEA7]",
    bg: "bg-[#D9F8EF]",
    count: 6,
    link: "/price/servicos/sales-ops",
  },
  {
    title: "Brand & Co",
    description: "Branding, Social Media, Conteúdo e mais",
    icon: <CompassTool size={24} weight="duotone" />,
    color: "text-[#ED5200]",
    bg: "bg-[#FFEDEB]",
    count: 6,
    link: "/price/servicos/brand-co",
  },
];

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

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProposals, setRecentProposals] = useState<DbProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<"idle" | "ok" | "error">("idle");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedStatus("idle");
    setDebugInfo(null);
    try {
      await seedServices();
      setSeedStatus("ok");
    } catch (err) {
      console.error("Error seeding services:", err);
      setSeedStatus("error");
      // Run diagnostics
      try {
        const diag = await debugServiceColumns();
        setDebugInfo(diag);
        console.log("Debug info:", diag);
      } catch (diagErr) {
        console.error("Debug also failed:", diagErr);
      }
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // Auto-seed services if table is empty — non-blocking
        (async () => {
          try {
            const dbServices = await listDbServices();
            if (!dbServices || dbServices.length === 0) {
              console.log("price_services table is empty, auto-seeding...");
              try {
                await seedServices();
                setSeedStatus("ok");
              } catch (seedErr) {
                console.error("Error seeding services:", seedErr);
                setSeedStatus("error");
              }
            } else {
              setSeedStatus("ok");
            }
          } catch (listErr) {
            console.error("Error listing services:", listErr);
            setSeedStatus("error");
          }
        })();

        // Load dashboard data — each call independent so one failure doesn't block the other
        const [statsResult, proposalsResult] = await Promise.allSettled([
          getDashboardStats(),
          listProposals(),
        ]);

        if (statsResult.status === "fulfilled") {
          setStats(statsResult.value);
        } else {
          console.error("Error loading dashboard stats:", statsResult.reason);
          // Use default empty stats so the UI still renders
          setStats({ total: 0, enviadas: 0, aprovadas: 0, pendentes: 0, receitaEstimada: 0 });
        }

        if (proposalsResult.status === "fulfilled") {
          setRecentProposals(proposalsResult.value.slice(0, 5));
        } else {
          console.error("Error loading proposals:", proposalsResult.reason);
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
        // Ensure stats is non-null so the UI renders
        setStats({ total: 0, enviadas: 0, aprovadas: 0, pendentes: 0, receitaEstimada: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = [
    {
      label: "Total Propostas",
      value: String(stats?.total ?? 0),
      icon: <ClipboardText size={22} weight="duotone" />,
      color: "bg-[#DCF0FF] text-[#0483AB]",
    },
    {
      label: "Aprovadas",
      value: String(stats?.aprovadas ?? 0),
      icon: <CheckCircle size={22} weight="duotone" />,
      color: "bg-[#D9F8EF] text-[#3CCEA7]",
    },
    {
      label: "Pendentes",
      value: String(stats?.pendentes ?? 0),
      icon: <Clock size={22} weight="duotone" />,
      color: "bg-[#FEEDCA] text-[#917822]",
    },
    {
      label: "Receita Estimada",
      value: formatCurrency(stats?.receitaEstimada ?? 0),
      icon: <TrendUp size={22} weight="duotone" />,
      color: "bg-[#E8E8FD] text-[#6868B1]",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[#122232]" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
            Dashboard
          </h1>
          <p className="text-[#4E6987] mt-1" style={{ fontSize: 14 }}>
            Visão geral de precificação e propostas
          </p>
        </div>
        <PillButton
          onClick={() => navigate("/price/nova-proposta")}
          icon={<Plus size={16} weight="bold" />}
          className="w-full sm:w-auto justify-center"
        >
          Nova Proposta
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
              {loading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        {/* Service Groups */}
        {serviceGroups.map((group) => (
          <button
            key={group.title}
            onClick={() => navigate(group.link)}
            className="bg-white rounded-xl p-5 border border-[#DDE3EC] text-left hover:border-[#0483AB] transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${group.bg} ${group.color}`}>
                {group.icon}
              </div>
              <ArrowRight
                size={16}
                className="text-[#C8CFDB] group-hover:text-[#0483AB] transition-colors"
              />
            </div>
            <p className="text-[#122232]" style={{ fontSize: 15, fontWeight: 700 }}>
              {group.title}
            </p>
            <p className="text-[#4E6987] mt-0.5" style={{ fontSize: 13 }}>
              {group.description}
            </p>
            <p className="text-[#C8CFDB] mt-2" style={{ fontSize: 12 }}>
              {group.count} serviços disponíveis
            </p>
          </button>
        ))}
      </div>

      {/* Seed Services Status */}
      {seedStatus === "error" && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-[#FFEDEB] border border-[#FFCCC4] rounded-xl">
          <Database size={20} className="text-[#ED5200] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[#B13B00]" style={{ fontSize: 13, fontWeight: 600 }}>
              Erro ao sincronizar catálogo de serviços
            </p>
            <p className="text-[#B13B00] mt-0.5" style={{ fontSize: 12 }}>
              Verifique se a tabela <code className="bg-[#FFCCC4] px-1 rounded">price_services</code> existe no Supabase com as colunas corretas.
            </p>
            {debugInfo && (
              <div className="mt-2">
                <p className="text-[#B13B00] font-bold">Informações de Depuração:</p>
                <pre className="text-[#B13B00] bg-[#FFCCC4] px-2 py-1 rounded">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="shrink-0 px-4 py-2 bg-[#ED5200] text-white rounded-lg hover:bg-[#B13B00] transition-colors disabled:opacity-50"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            {seeding ? "Sincronizando..." : "Tentar novamente"}
          </button>
        </div>
      )}

      {/* Recent Proposals */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#0483AB]" weight="duotone" />
            <span
              className="text-[#28415c]"
              style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
            >
              Propostas Recentes
            </span>
          </div>
          <button
            onClick={() => navigate("/price/propostas")}
            className="flex items-center gap-[3px] h-[34px] px-[14px] rounded-full bg-[#f6f7f9] text-[#28415c] hover:bg-[#dde3ec] transition-colors cursor-pointer"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
          >
            Ver todas
            <ArrowRight size={12} weight="bold" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <SpinnerGap size={24} className="text-[#0483AB] animate-spin" />
          </div>
        ) : recentProposals.length === 0 ? (
          <div className="py-10 text-center">
            <FileText size={36} className="text-[#C8CFDB] mx-auto mb-2" />
            <p className="text-[#4E6987]" style={{ fontSize: 14 }}>Nenhuma proposta ainda.</p>
            <PillButton
              onClick={() => navigate("/price/nova-proposta")}
              icon={<Plus size={16} weight="bold" />}
              className="mt-3 mx-auto"
            >
              Criar primeira proposta
            </PillButton>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden">
              {recentProposals.map((proposal, idx) => {
                const config = statusConfig[proposal.status] ?? statusConfig.rascunho;
                return (
                  <div key={proposal.id}>
                    {/* HorizontalDivider */}
                    <div className="h-0 relative w-full">
                      <div className="absolute inset-[-0.75px_0_0_0]">
                        <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
                          <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
                        </svg>
                      </div>
                    </div>
                    <div
                      onClick={() => navigate(`/price/propostas/${proposal.id}`)}
                      className="px-3 mx-2 py-2.5 flex items-center justify-between gap-3 cursor-pointer rounded-[100px] hover:bg-[#F6F7F9] transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <span
                          className="text-[#28415c] shrink-0"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'", width: 20, textAlign: "right" }}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-[#07ABDE] truncate"
                            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                          >
                            {proposal.client_name}
                          </p>
                          <p
                            className="text-[#4E6987]"
                            style={{ fontSize: 10, letterSpacing: -0.3, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                          >
                            {proposal.id} · {formatDate(proposal.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className="text-[#28415C]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {formatCurrency(proposal.grand_total ?? 0)}
                        </span>
                        <span
                          className={config.text}
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {config.label}
                        </span>
                      </div>
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

            {/* Desktop: CSS Grid table (matches proposals.tsx pattern) */}
            <div className="hidden md:block overflow-x-auto">
              {/* Column headers */}
              <div
                className="grid items-center px-5 pt-1 pb-0"
                style={{ gridTemplateColumns: "28px 90px 1fr 120px 100px 110px", gap: "0 8px" }}
              >
                {/* # */}
                <div />
                {["ID", "CLIENTE", "MENSALIDADE", "STATUS", "DATA"].map((col) => (
                  <div key={col} className="flex items-center h-[32px]">
                    <span
                      className="text-[#28415c] whitespace-nowrap"
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                    >
                      {col}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="flex flex-col mt-1">
                {recentProposals.map((proposal, idx) => {
                  const config = statusConfig[proposal.status] ?? statusConfig.rascunho;
                  return (
                    <div key={proposal.id}>
                      {/* HorizontalDivider */}
                      <div className="h-0 relative w-full">
                        <div className="absolute inset-[-0.75px_0_0_0]">
                          <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
                            <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
                          </svg>
                        </div>
                      </div>
                      <div
                        onClick={() => navigate(`/price/propostas/${proposal.id}`)}
                        className="grid items-center h-[34px] px-3 mx-2 cursor-pointer rounded-[100px] hover:bg-[#f6f7f9] transition-colors"
                        style={{ gridTemplateColumns: "28px 90px 1fr 120px 100px 110px", gap: "0 8px" }}
                      >
                        {/* Row number */}
                        <div
                          className="text-right text-[#28415c]"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {idx + 1}
                        </div>

                        {/* ID */}
                        <div
                          className="truncate text-[#07ABDE]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {proposal.id}
                        </div>

                        {/* Cliente */}
                        <div
                          className="truncate text-[#07ABDE]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {proposal.client_name}
                        </div>

                        {/* Mensalidade */}
                        <div
                          className="truncate text-[#28415C]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {formatCurrency(proposal.grand_total ?? 0)}
                        </div>

                        {/* Status */}
                        <div
                          className={`truncate ${config.text}`}
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {config.label}
                        </div>

                        {/* Data */}
                        <div
                          className="truncate text-[#28415C]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                        >
                          {formatDate(proposal.created_at)}
                        </div>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}