/**
 * Proposal Template Editor — Customize the public proposal page
 * Split layout: editor panel on the left, live preview on the right.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  PaintBrush,
  FloppyDisk,
  Eye,
  ArrowCounterClockwise,
  TextT,
  Palette,
  Image as ImageIcon,
  ToggleRight,
  CheckCircle,
  XCircle,
  SpinnerGap,
  CaretDown,
  CaretRight,
  CurrencyDollar,
  Clock,
  Package,
  Percent,
  FileText,
  CalendarBlank,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  getProposalTemplate,
  saveProposalTemplate,
  DEFAULT_TEMPLATE,
  type ProposalTemplateConfig,
} from "./api";
import { formatCurrency, groupLabels, type ServiceGroup, adsComplexityLabels } from "./pricing-data";
import { ZeniteToggle } from "./zenite-toggle";
import svgPaths360 from "../../imports/svg-1z8u746bdq";
import svgPathsList1 from "../../imports/svg-27usn8kt6p";
import svgPathsList2 from "../../imports/svg-4tydo46hes";

const ff: React.CSSProperties = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ── Mock data for preview ── */
const mockProposal = {
  id: "PR-A7X2",
  client_name: "Acme Corp",
  status: "enviada" as const,
  notes: "Proposta de serviços de marketing digital para o trimestre Q2 2026.",
  total_monthly: 27600,
  total_impl: 11700,
  total_hours: 144,
  grand_total: 39300,
  global_discount: 0,
  combo_discount_percent: 10,
  combo_label: "Combo Performance",
  created_at: new Date().toISOString(),
  services: [
    { name: "Gestão de Google Ads", group: "performance", monthly: 4500, impl: 1500, hours: 20, complexity: "intermediario", recurrence: "mensal", allocation: "dedicado", isAds: true },
    { name: "Gestão de Meta Ads", group: "performance", monthly: 3800, impl: 1200, hours: 18, complexity: "intermediario", recurrence: "mensal", allocation: "dedicado", isAds: true },
    { name: "SEO & Conteúdo Orgânico", group: "performance", monthly: 4200, impl: 1800, hours: 30, complexity: "basico", recurrence: "mensal", allocation: "compartilhado", isAds: false },
    { name: "Automação de Funil de Vendas", group: "sales_ops", monthly: 3200, impl: 2000, hours: 16, complexity: "avancado", recurrence: "mensal", allocation: "compartilhado", isAds: false },
    { name: "CRM & Nutrição de Leads", group: "sales_ops", monthly: 2800, impl: 900, hours: 14, complexity: "intermediario", recurrence: "mensal", allocation: "compartilhado", isAds: false },
    { name: "Branding & Identidade Visual", group: "brand_co", monthly: 5500, impl: 3500, hours: 24, complexity: "avancado", recurrence: "mensal", allocation: "compartilhado", isAds: false },
    { name: "Gestão de Redes Sociais", group: "brand_co", monthly: 3600, impl: 800, hours: 22, complexity: "intermediario", recurrence: "mensal", allocation: "compartilhado", isAds: false },
    { name: "Website & Landing Pages", group: "brand_co", monthly: 0, impl: 4800, hours: 40, complexity: "basico", recurrence: "mensal", allocation: "compartilhado", isAds: false },
  ],
};

const groupColorMap: Record<string, { bg: string; accent: string; text: string }> = {
  performance: { bg: "bg-[#DCF0FF]", accent: "bg-[#0483AB]", text: "text-[#025E7B]" },
  sales_ops: { bg: "bg-[#D9F8EF]", accent: "bg-[#3CCEA7]", text: "text-[#135543]" },
  brand_co: { bg: "bg-[#FFEDEB]", accent: "bg-[#ED5200]", text: "text-[#B13B00]" },
};

const complexityLabels: Record<string, string> = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" };
const recurrenceLabels: Record<string, string> = { mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return iso; }
}

/* ── Editor Section ── */
function EditorSection({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#ebedf0] rounded-[12px] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-[8px] w-full px-[16px] py-[12px] hover:bg-[#f6f7f9] transition-colors text-left"
      >
        <span className="text-[#4E6987]">{icon}</span>
        <span className="flex-1 text-[#28415C]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>{title}</span>
        {open ? <CaretDown size={14} className="text-[#98989d]" /> : <CaretRight size={14} className="text-[#98989d]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-[16px] pb-[16px] flex flex-col gap-[12px]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "16px", ...ff }}>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-[36px] px-[12px] rounded-[8px] border border-[#DDE3EC] text-[#28415C] placeholder-[#C8CFDB] focus:border-[#07ABDE] focus:ring-1 focus:ring-[#07ABDE]/20 outline-none transition-colors"
      style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.2, ...ff }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-[12px] py-[8px] rounded-[8px] border border-[#DDE3EC] text-[#28415C] placeholder-[#C8CFDB] focus:border-[#07ABDE] focus:ring-1 focus:ring-[#07ABDE]/20 outline-none transition-colors resize-none"
      style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.2, lineHeight: "20px", ...ff }}
    />
  );
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-[8px]">
        <div className="relative size-[36px] rounded-[8px] border border-[#DDE3EC] overflow-hidden shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
          <div className="absolute inset-0 rounded-[8px]" style={{ backgroundColor: value }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-[36px] px-[12px] rounded-[8px] border border-[#DDE3EC] text-[#28415C] font-mono focus:border-[#07ABDE] focus:ring-1 focus:ring-[#07ABDE]/20 outline-none transition-colors"
          style={{ fontSize: 12 }}
        />
      </div>
    </div>
  );
}

/* ── Live Preview ── */
function LivePreview({ config }: { config: ProposalTemplateConfig }) {
  const p = mockProposal;
  const hasDiscount = p.combo_discount_percent > 0 || p.global_discount > 0;

  // Group services
  const grouped: Record<string, typeof p.services> = {};
  p.services.forEach((s) => {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  });

  return (
    <div className="bg-[#f0f2f5] rounded-[12px] overflow-hidden h-full">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4" style={{ backgroundColor: config.headerBgColor }}>
          <div className="max-w-[540px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="h-[32px] w-auto object-contain" />
              ) : (
                <div className="flex items-center justify-center size-[32px] rounded-[10px]" style={{ backgroundColor: config.accentColor + "22" }}>
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                    <path d="M4 8L14 4L24 8V20L14 24L4 20V8Z" stroke={config.accentColor} strokeWidth="2" strokeLinejoin="round" fill="none" />
                    <path d="M14 4V24" stroke={config.accentColor} strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M4 8L14 14L24 8" stroke={config.accentColor} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <span className="text-[#C8CFDB]" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                {config.companyName}
              </span>
            </div>
            <span className="text-[#4E6987]" style={{ fontSize: 10, fontWeight: 500, ...ff }}>
              Proposta {p.id}
            </span>
          </div>
        </div>

        <div className="max-w-[540px] mx-auto px-3 py-6">
          {/* Hero */}
          <div className="bg-white rounded-[16px] p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(18,34,50,0.06)" }}>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center size-[28px] rounded-[8px]" style={{ backgroundColor: config.accentColor + "20" }}>
                    <FileText size={16} weight="duotone" style={{ color: config.accentColor }} />
                  </div>
                  <div>
                    <p className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                      {config.heroTitle}
                    </p>
                    <p className="text-[#4E6987]" style={{ fontSize: 10, ...ff }}>
                      {p.id} · Criada em {formatDate(p.created_at)}
                    </p>
                  </div>
                </div>
                <h1 className="text-[#122232] mt-2" style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, ...ff }}>
                  {p.client_name}
                </h1>
                {config.heroSubtitle && (
                  <p className="text-[#4E6987] mt-1" style={{ fontSize: 12, lineHeight: 1.5, ...ff }}>{config.heroSubtitle}</p>
                )}
                {config.introText && (
                  <p className="text-[#4E6987] mt-2" style={{ fontSize: 11, lineHeight: 1.6, ...ff }}>{config.introText}</p>
                )}
                {p.notes && (
                  <p className="text-[#4E6987] mt-2" style={{ fontSize: 11, lineHeight: 1.6, ...ff }}>{p.notes}</p>
                )}
              </div>

              {config.showFinancialSummary && (
                <div className="bg-[#f6f7f9] rounded-[12px] p-4">
                  <p className="text-[#98989d] mb-3" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                    Resumo Financeiro
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CurrencyDollar size={12} weight="duotone" style={{ color: config.accentColor }} />
                        <span className="text-[#4E6987]" style={{ fontSize: 11, ...ff }}>Mensalidade</span>
                      </div>
                      <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700, ...ff }}>{formatCurrency(p.total_monthly)}</span>
                    </div>
                    {p.total_impl > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Package size={12} weight="duotone" className="text-[#6868B1]" />
                          <span className="text-[#4E6987]" style={{ fontSize: 11, ...ff }}>Implantação</span>
                        </div>
                        <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700, ...ff }}>{formatCurrency(p.total_impl)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} weight="duotone" className="text-[#3CCEA7]" />
                        <span className="text-[#4E6987]" style={{ fontSize: 11, ...ff }}>Horas/mês</span>
                      </div>
                      <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700, ...ff }}>{p.total_hours}h</span>
                    </div>
                    {hasDiscount && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Percent size={12} weight="duotone" className="text-[#ED5200]" />
                          <span className="text-[#4E6987]" style={{ fontSize: 11, ...ff }}>Desconto</span>
                        </div>
                        <span className="text-[#ED5200]" style={{ fontSize: 12, fontWeight: 700, ...ff }}>{p.combo_discount_percent}%</span>
                      </div>
                    )}
                    <div className="h-[1px] bg-[#DDE3EC] my-0.5" />
                    <div className="flex items-center justify-between">
                      <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700, ...ff }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: config.accentColor, ...ff }}>{formatCurrency(p.grand_total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          {config.showServices && (
            <div className="bg-white rounded-[16px] p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(18,34,50,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Package size={16} weight="duotone" style={{ color: config.accentColor }} />
                <h2 className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, ...ff }}>Serviços Incluídos</h2>
                <span className="ml-auto text-[#98989d]" style={{ fontSize: 10, ...ff }}>{p.services.length} serviços</span>
              </div>
              {Object.entries(grouped).map(([group, svcs]) => {
                const colors = groupColorMap[group] ?? groupColorMap.performance;
                return (
                  <div key={group} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`size-[6px] rounded-full ${colors.accent}`} />
                      <span className={colors.text} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, ...ff }}>
                        {groupLabels[group as ServiceGroup] ?? group}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {svcs.map((svc, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-[8px] bg-[#f6f7f9]">
                          <div className="flex-1 min-w-0">
                            <p className="text-[#122232] truncate" style={{ fontSize: 12, fontWeight: 600, ...ff }}>{svc.name}</p>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className="text-[#98989d]" style={{ fontSize: 9, ...ff }}>
                                {svc.isAds ? (adsComplexityLabels[svc.complexity] ?? svc.complexity) : (complexityLabels[svc.complexity] ?? svc.complexity)}
                              </span>
                              <span className="text-[#C8CFDB]">·</span>
                              <span className="text-[#98989d]" style={{ fontSize: 9, ...ff }}>
                                {recurrenceLabels[svc.recurrence] ?? svc.recurrence}
                              </span>
                              <span className="text-[#C8CFDB]">·</span>
                              <span className="text-[#98989d]" style={{ fontSize: 9, ...ff }}>
                                {svc.allocation === "dedicado" ? "Ded." : "Comp."}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700, ...ff }}>
                                {formatCurrency(svc.monthly)}
                              </span>
                              <span className="text-[#98989d]" style={{ fontSize: 8, ...ff }}>/mês</span>
                            </div>
                            {svc.impl > 0 && (
                              <span className="text-[#98989d]" style={{ fontSize: 8, ...ff }}>
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
            <div className="bg-white rounded-[16px] p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(18,34,50,0.06)" }}>
              <div className="flex gap-5">
                {/* Left: branding */}
                <div className="flex flex-col items-center text-center shrink-0" style={{ width: 100 }}>
                  <div className="overflow-hidden size-[56px] mb-2">
                    <svg className="block size-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 183.042 178.642">
                      <path clipRule="evenodd" d={svgPaths360.p29d91900} fill="#8C8CD4" fillRule="evenodd" />
                      <path clipRule="evenodd" d={svgPaths360.p737b5f0} fill="#07ABDE" fillRule="evenodd" />
                      <path clipRule="evenodd" d={svgPaths360.p17aa0c40} fill="#3CCEA7" fillRule="evenodd" />
                      <path clipRule="evenodd" d={svgPaths360.p20005730} fill="#EAC23D" fillRule="evenodd" />
                      <path clipRule="evenodd" d={svgPaths360.p3dbbf580} fill="#FF8C76" fillRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-[#28415c]" style={{ fontSize: 14, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2, ...ff }}>agencyOS</h2>
                  <h3 className="text-[#4e6987]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.3, ...ff }}>Metodologia 360º</h3>
                  <p className="text-[#4e6987] mt-1" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 7.5, lineHeight: 1.4 }}>
                    Transforme sua presença no mercado com uma abordagem estratégica completa.
                  </p>
                </div>

                {/* Right: pillars grid */}
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                  {[
                    { label: "Estratégia Competitiva", desc: "Mapeamos o território antes de traçar o caminho. Definimos objetivos claros, analisamos o mercado em profundidade, segmentamos audiências com precisão e identificamos gaps competitivos que se transformam em oportunidades de crescimento.", bg: "#dcf0ff", color: "#0483AB", textColor: "#001b26", icon: svgPathsList1.pee08a80 },
                    { label: "Propaganda & Mídia", desc: "Visibilidade estratégica é tudo. Posicionamos sua marca nos canais certos, no momento certo, com a mensagem certa. Cada campanha é desenhada para maximizar alcance, engajamento e ROI.", bg: "#ffedeb", color: "#F56233", textColor: "#431100", icon: svgPathsList2.pe840800 },
                    { label: "Planejamento de Marketing", desc: "Estratégia sem execução é apenas teoria. Desenvolvemos planos de ação baseados em dados, selecionamos os canais mais eficientes para seu público, construímos mensagens que convertem e criamos campanhas que geram impacto real.", bg: "#d9f8ef", color: "#20B48D", textColor: "#02140e", icon: svgPathsList1.p15d50400 },
                    { label: "Análise & Otimização", desc: "Medimos tudo que importa. Através de análises aprofundadas e relatórios inteligentes, identificamos o que funciona, otimizamos o que pode melhorar e garantimos evolução constante. Seus investimentos em marketing se tornam cada vez mais eficientes.", bg: "#e8e8fd", color: "#6868B1", textColor: "#14142c", icon: svgPathsList2.p3dddc7d0 },
                    { label: "Design & Identidade", desc: "Sua marca merece se destacar. Criamos identidades visuais memoráveis, experiências digitais envolventes e materiais de comunicação que não apenas chamam atenção, mas eles constroem conexões emocionais duradouras com seu público-alvo.", bg: "#feedca", color: "#917822", textColor: "#1f1803", icon: svgPathsList1.p350ae4e0 },
                  ].map((p) => (
                    <div key={p.label} className="rounded-[8px] px-3 py-2.5" style={{ backgroundColor: p.bg }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <svg className="shrink-0" width="10" height="10" viewBox="0 0 32 32" fill="none">
                          <path d={p.icon} fill={p.color} />
                        </svg>
                        <span className="block" style={{ fontSize: 8, fontWeight: 700, color: p.color, letterSpacing: -0.2, ...ff }}>{p.label}</span>
                      </div>
                      <p style={{ fontSize: 6.5, fontWeight: 500, lineHeight: 1.5, color: p.textColor, ...ff }}>{p.desc}</p>
                    </div>
                  ))}
                  {/* Closing text */}
                  <div className="rounded-[8px] px-3 py-2.5 flex items-center">
                    <p className="text-[#4e6987]" style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 6.5, lineHeight: 1.5 }}>
                      A Metodologia 360º da HTZ é mais do que um framework, é um sistema integrado que conecta todos os pontos de contato entre sua marca e o mercado. Diferente de soluções fragmentadas, nossa abordagem garante coerência estratégica, execução impecável e resultados mensuráveis em cada etapa da jornada do seu cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          {/* Response */}
          {config.showResponseButtons && (
            <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: "0 2px 12px rgba(18,34,50,0.06)" }}>
              <h3 className="text-[#122232] text-center mb-1" style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, ...ff }}>
                O que achou da proposta?
              </h3>
              <p className="text-[#4E6987] text-center mb-4" style={{ fontSize: 11, ...ff }}>
                Clique abaixo para aprovar ou recusar esta proposta.
              </p>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="flex items-center justify-center gap-1.5 h-[36px] px-5 rounded-full bg-[#f6f7f9] text-[#4E6987]"
                  style={{ fontSize: 12, fontWeight: 700, ...ff }}
                >
                  <XCircle size={16} weight="bold" />
                  {config.ctaRejectText}
                </div>
                <div
                  className="flex items-center justify-center gap-1.5 h-[36px] px-5 rounded-full text-white"
                  style={{ fontSize: 12, fontWeight: 700, backgroundColor: "#3CCEA7", ...ff }}
                >
                  <CheckCircle size={16} weight="bold" />
                  {config.ctaApproveText}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {config.footerText && (
            <div className="text-center mt-5">
              <p className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 500, ...ff }}>{config.footerText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function ProposalTemplateEditor() {
  const [config, setConfig] = useState<ProposalTemplateConfig>({ ...DEFAULT_TEMPLATE });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const initialRef = useRef<ProposalTemplateConfig | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProposalTemplate();
        if (data) {
          const merged = { ...DEFAULT_TEMPLATE, ...data };
          setConfig(merged);
          initialRef.current = merged;
        } else {
          initialRef.current = { ...DEFAULT_TEMPLATE };
        }
      } catch (err) {
        console.error("Error loading template config:", err);
        initialRef.current = { ...DEFAULT_TEMPLATE };
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = useCallback(<K extends keyof ProposalTemplateConfig>(key: K, value: ProposalTemplateConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProposalTemplate(config);
      initialRef.current = { ...config };
      setDirty(false);
      toast.success("Template salvo com sucesso!");
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error("Erro ao salvar template.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_TEMPLATE });
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <SpinnerGap size={32} weight="bold" className="text-[#07abde] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-[24px] py-[12px] border-b border-[#ebedf0] shrink-0">
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center justify-center size-[36px] rounded-[10px] bg-[#DCF0FF]">
            <PaintBrush size={18} weight="duotone" className="text-[#07ABDE]" />
          </div>
          <div>
            <h1 className="text-[#122232]" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, ...ff }}>
              Template da Proposta
            </h1>
            <p className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...ff }}>
              Personalize a página pública da proposta
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            onClick={handleReset}
            className="flex items-center gap-[6px] h-[36px] px-[14px] rounded-[500px] border border-[#DDE3EC] text-[#4E6987] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            Resetar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-[6px] h-[36px] px-[16px] rounded-[500px] bg-[#07ABDE] text-white hover:bg-[#0483AB] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
            style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
          >
            {saving ? <SpinnerGap size={14} weight="bold" className="animate-spin" /> : <FloppyDisk size={14} weight="bold" />}
            Salvar
          </button>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Editor panel */}
        <div className="w-[360px] h-full shrink-0 border-r border-[#ebedf0] overflow-y-auto">
          <div className="p-[16px] flex flex-col gap-[12px]">
          {/* Branding */}
          <EditorSection title="Marca & Identidade" icon={<Palette size={16} weight="duotone" />}>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>NOME DA EMPRESA</FieldLabel>
              <TextInput value={config.companyName} onChange={(v) => update("companyName", v)} placeholder="Ex: Minha Agência" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>URL DO LOGO</FieldLabel>
              <TextInput value={config.logoUrl} onChange={(v) => update("logoUrl", v)} placeholder="https://..." />
              <p className="text-[#98989d]" style={{ fontSize: 10, ...ff }}>Deixe vazio para usar o ícone Zenite padrão.</p>
            </div>
            <ColorInput label="COR DO HEADER" value={config.headerBgColor} onChange={(v) => update("headerBgColor", v)} />
            <ColorInput label="COR DE DESTAQUE" value={config.accentColor} onChange={(v) => update("accentColor", v)} />
          </EditorSection>

          {/* Textos */}
          <EditorSection title="Textos" icon={<TextT size={16} weight="duotone" />}>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>TÍTULO HERO</FieldLabel>
              <TextInput value={config.heroTitle} onChange={(v) => update("heroTitle", v)} placeholder="Proposta Comercial" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>SUBTÍTULO HERO</FieldLabel>
              <TextInput value={config.heroSubtitle} onChange={(v) => update("heroSubtitle", v)} placeholder="Opcional" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>TEXTO INTRODUTÓRIO</FieldLabel>
              <TextArea
                value={config.introText}
                onChange={(v) => update("introText", v)}
                placeholder="Substitui as notas da proposta na página pública..."
                rows={3}
              />
              <p className="text-[#98989d]" style={{ fontSize: 10, ...ff }}>Se preenchido, substitui as notas individuais da proposta.</p>
            </div>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>RODAPÉ</FieldLabel>
              <TextInput value={config.footerText} onChange={(v) => update("footerText", v)} placeholder="Ex: Proposta gerada por..." />
            </div>
          </EditorSection>

          {/* CTAs */}
          <EditorSection title="Botões de Resposta" icon={<CheckCircle size={16} weight="duotone" />}>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>TEXTO DO BOTÃO APROVAR</FieldLabel>
              <TextInput value={config.ctaApproveText} onChange={(v) => update("ctaApproveText", v)} placeholder="Aprovar Proposta" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <FieldLabel>TEXTO DO BOTÃO RECUSAR</FieldLabel>
              <TextInput value={config.ctaRejectText} onChange={(v) => update("ctaRejectText", v)} placeholder="Recusar" />
            </div>
          </EditorSection>

          {/* Visibility */}
          <EditorSection title="Seções Visíveis" icon={<ToggleRight size={16} weight="duotone" />}>
            <div className="flex items-center justify-between">
              <span className="text-[#28415C]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>Resumo Financeiro</span>
              <ZeniteToggle active={config.showFinancialSummary} onChange={() => update("showFinancialSummary", !config.showFinancialSummary)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#28415C]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>Serviços Incluídos</span>
              <ZeniteToggle active={config.showServices} onChange={() => update("showServices", !config.showServices)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#28415C]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>Botões de Resposta</span>
              <ZeniteToggle active={config.showResponseButtons} onChange={() => update("showResponseButtons", !config.showResponseButtons)} />
            </div>
          </EditorSection>
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#e8eaee]">
          <div className="flex items-center gap-[8px] px-[20px] py-[10px] border-b border-[#dde3ec]">
            <Eye size={14} weight="duotone" className="text-[#98989d]" />
            <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
              PRÉ-VISUALIZAÇÃO
            </span>
          </div>
          <div className="flex-1 min-h-0 p-[20px]">
            <LivePreview config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}