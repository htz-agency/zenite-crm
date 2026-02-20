export type ServiceGroup = "performance" | "sales_ops" | "brand_co";
export type Seniority = "pleno" | "senior";
export type Allocation = "compartilhado" | "dedicado";

export interface Service {
  id: string;
  name: string;
  group: ServiceGroup;
  description: string;
  basePrice: number; // Monthly base price (Básico)
  implPrice: number; // One-time implementation fee
  hoursEstimate: number; // Monthly hours estimate (Básico)
  isAds: boolean; // Whether this is an Ads service (uses media investment tiers)
  complexityMultipliers: {
    basico: number;
    intermediario: number;
    avancado: number;
  };
}

export interface SelectedService {
  serviceId: string;
  complexity: "basico" | "intermediario" | "avancado";
  recurrence: "mensal" | "trimestral" | "semestral" | "anual";
  includeImpl: boolean;
  quantity: number;
  seniority: Seniority;
  allocation: Allocation;
}

export interface Proposal {
  id: string;
  clientName: string;
  createdAt: string;
  services: SelectedService[];
  discount: number;
  notes: string;
  status: "rascunho" | "criada" | "enviada" | "aprovada" | "recusada";
}

export const groupLabels: Record<ServiceGroup, string> = {
  performance: "Performance",
  sales_ops: "Sales OPS",
  brand_co: "Brand & Co",
};

export const groupColors: Record<ServiceGroup, { bg: string; text: string; accent: string; icon: string }> = {
  performance: {
    bg: "bg-[#DCF0FF]",
    text: "text-[#025E7B]",
    accent: "bg-[#0483AB]",
    icon: "text-[#0483AB]",
  },
  sales_ops: {
    bg: "bg-[#D9F8EF]",
    text: "text-[#135543]",
    accent: "bg-[#3CCEA7]",
    icon: "text-[#3CCEA7]",
  },
  brand_co: {
    bg: "bg-[#FFEDEB]",
    text: "text-[#B13B00]",
    accent: "bg-[#ED5200]",
    icon: "text-[#ED5200]",
  },
};

export const complexityLabels: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

// For Ads services: complexity = media investment tier
export const adsComplexityLabels: Record<string, string> = {
  basico: "Até R$10 mil",
  intermediario: "R$10k – R$50k",
  avancado: "Acima de R$100k",
};

export const seniorityLabels: Record<Seniority, string> = {
  pleno: "Pleno",
  senior: "Sênior",
};

export const seniorityMultipliers: Record<Seniority, number> = {
  pleno: 1.0,
  senior: 1.10, // +10%
};

export const allocationLabels: Record<Allocation, string> = {
  compartilhado: "Compartilhado",
  dedicado: "Dedicado",
};

export const allocationMultipliers: Record<Allocation, number> = {
  compartilhado: 1.0,
  dedicado: 1.20, // +20%
};

export const recurrenceLabels: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export const recurrenceDiscounts: Record<string, number> = {
  mensal: 0,
  trimestral: 0.05,
  semestral: 0.10,
  anual: 0.15,
};

export const services: Service[] = [
  // Performance
  {
    id: "perf-google-ads",
    name: "Gestão de Google Ads",
    group: "performance",
    description: "Criação, gestão e otimização de campanhas no Google Ads (Search, Display, Shopping, YouTube).",
    basePrice: 2500,
    implPrice: 1500,
    hoursEstimate: 20,
    isAds: true,
    complexityMultipliers: { basico: 1, intermediario: 1.6, avancado: 2.4 },
  },
  {
    id: "perf-meta-ads",
    name: "Gestão de Meta Ads",
    group: "performance",
    description: "Campanhas de performance em Facebook e Instagram Ads com estratégia de funil completo.",
    basePrice: 2200,
    implPrice: 1200,
    hoursEstimate: 18,
    isAds: true,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.2 },
  },
  {
    id: "perf-linkedin-ads",
    name: "Gestão de LinkedIn Ads",
    group: "performance",
    description: "Campanhas B2B no LinkedIn com segmentação avançada por cargo, empresa e setor.",
    basePrice: 3000,
    implPrice: 1800,
    hoursEstimate: 16,
    isAds: true,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.0 },
  },
  {
    id: "perf-tiktok-ads",
    name: "Gestão de TikTok Ads",
    group: "performance",
    description: "Campanhas de awareness e conversão no TikTok com criação de criativos nativos.",
    basePrice: 2000,
    implPrice: 1000,
    hoursEstimate: 15,
    isAds: true,
    complexityMultipliers: { basico: 1, intermediario: 1.4, avancado: 2.0 },
  },
  {
    id: "perf-seo",
    name: "SEO & Conteúdo Orgânico",
    group: "performance",
    description: "Otimização técnica, on-page e off-page para mecanismos de busca.",
    basePrice: 3500,
    implPrice: 2500,
    hoursEstimate: 30,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.7, avancado: 2.5 },
  },
  {
    id: "perf-analytics",
    name: "Analytics & Dashboards",
    group: "performance",
    description: "Configuração de GA4, GTM, dashboards de BI e relatórios de performance.",
    basePrice: 1800,
    implPrice: 3000,
    hoursEstimate: 12,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.0 },
  },

  // Sales OPS
  {
    id: "sales-crm",
    name: "Implementação de CRM",
    group: "sales_ops",
    description: "Setup completo de CRM (HubSpot, Pipedrive, RD Station) com customização de pipelines.",
    basePrice: 2800,
    implPrice: 5000,
    hoursEstimate: 24,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.8, avancado: 2.8 },
  },
  {
    id: "sales-automation",
    name: "Automação de Marketing",
    group: "sales_ops",
    description: "Fluxos de nutrição, lead scoring e automações de email marketing.",
    basePrice: 2200,
    implPrice: 3500,
    hoursEstimate: 18,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.6, avancado: 2.4 },
  },
  {
    id: "sales-lead-scoring",
    name: "Lead Scoring & Qualificação",
    group: "sales_ops",
    description: "Definição de critérios de qualificação, MQL/SQL e integração com vendas.",
    basePrice: 1500,
    implPrice: 2000,
    hoursEstimate: 10,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.0 },
  },
  {
    id: "sales-pipeline",
    name: "Pipeline de Vendas",
    group: "sales_ops",
    description: "Estruturação do pipeline comercial com etapas, gatilhos e métricas de conversão.",
    basePrice: 1800,
    implPrice: 2500,
    hoursEstimate: 14,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.2 },
  },
  {
    id: "sales-integration",
    name: "Integração de Ferramentas",
    group: "sales_ops",
    description: "Integração entre CRM, ferramentas de marketing, ERP e plataformas de vendas.",
    basePrice: 1200,
    implPrice: 3000,
    hoursEstimate: 10,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.8, avancado: 2.5 },
  },
  {
    id: "sales-onboarding",
    name: "Onboarding de Clientes",
    group: "sales_ops",
    description: "Treinamento da equipe comercial e implementação de processos de vendas.",
    basePrice: 1500,
    implPrice: 2000,
    hoursEstimate: 12,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.4, avancado: 1.8 },
  },

  // Brand & Co
  {
    id: "brand-identity",
    name: "Branding & Identidade Visual",
    group: "brand_co",
    description: "Desenvolvimento de marca, logo, manual de identidade visual e brand guidelines.",
    basePrice: 0,
    implPrice: 12000,
    hoursEstimate: 60,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.5 },
  },
  {
    id: "brand-social",
    name: "Social Media Management",
    group: "brand_co",
    description: "Gestão de redes sociais com planejamento editorial, criação de conteúdo e community management.",
    basePrice: 3500,
    implPrice: 1500,
    hoursEstimate: 30,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.2 },
  },
  {
    id: "brand-content",
    name: "Produção de Conteúdo",
    group: "brand_co",
    description: "Blog posts, e-books, whitepapers, infográficos e materiais ricos.",
    basePrice: 2800,
    implPrice: 1000,
    hoursEstimate: 24,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.6, avancado: 2.3 },
  },
  {
    id: "brand-design",
    name: "Design Gráfico",
    group: "brand_co",
    description: "Criação de peças gráficas, apresentações, materiais impressos e digitais.",
    basePrice: 2000,
    implPrice: 800,
    hoursEstimate: 16,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.4, avancado: 2.0 },
  },
  {
    id: "brand-video",
    name: "Vídeo & Motion Design",
    group: "brand_co",
    description: "Produção de vídeos institucionais, motion graphics, reels e conteúdo audiovisual.",
    basePrice: 3000,
    implPrice: 2000,
    hoursEstimate: 20,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.6, avancado: 2.5 },
  },
  {
    id: "brand-web",
    name: "Website & Landing Pages",
    group: "brand_co",
    description: "Design e desenvolvimento de websites, landing pages e páginas de conversão.",
    basePrice: 0,
    implPrice: 8000,
    hoursEstimate: 40,
    isAds: false,
    complexityMultipliers: { basico: 1, intermediario: 1.5, avancado: 2.5 },
  },
];

export function calculateServicePrice(
  service: Service,
  selected: SelectedService
): { monthly: number; impl: number; total: number; hours: number } {
  const complexityMult = service.complexityMultipliers[selected.complexity];
  const seniorityMult = seniorityMultipliers[selected.seniority];
  const allocationMult = allocationMultipliers[selected.allocation];
  const teamMult = seniorityMult * allocationMult;

  const monthly = service.basePrice * complexityMult * teamMult * selected.quantity;
  const impl = selected.includeImpl ? service.implPrice * complexityMult * selected.quantity : 0;
  const recurrenceDiscount = recurrenceDiscounts[selected.recurrence];
  const discountedMonthly = monthly * (1 - recurrenceDiscount);
  const hours = service.hoursEstimate * complexityMult * selected.quantity;

  return {
    monthly: discountedMonthly,
    impl,
    total: discountedMonthly + impl,
    hours: Math.round(hours),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// --- Progressive Combo Discount ---

export const comboTiers = [
  { min: 1, discount: 0, label: "Sem combo" },
  { min: 2, discount: 5, label: "Combo Duo" },
  { min: 3, discount: 8, label: "Combo Trio" },
  { min: 4, discount: 12, label: "Combo Pack" },
  { min: 5, discount: 15, label: "Combo Plus" },
  { min: 6, discount: 18, label: "Combo Pro" },
  { min: 7, discount: 20, label: "Combo Max" },
];

export const valueTierBonuses = [
  { min: 0, bonus: 0, label: "—" },
  { min: 5000, bonus: 2, label: "Silver" },
  { min: 10000, bonus: 3, label: "Gold" },
  { min: 20000, bonus: 5, label: "Platinum" },
];

export interface ComboDiscountResult {
  serviceCount: number;
  comboPercent: number;
  comboLabel: string;
  valueBonusPercent: number;
  valueBonusLabel: string;
  totalPercent: number;
  discountAmount: number;
  monthlyBeforeDiscount: number;
  monthlyAfterDiscount: number;
}

export function calculateComboDiscount(
  selectedServices: SelectedService[],
  allServices: Service[]
): ComboDiscountResult {
  const count = selectedServices.length;

  let monthlyBeforeDiscount = 0;
  selectedServices.forEach((selected) => {
    const service = allServices.find((s) => s.id === selected.serviceId);
    if (!service) return;
    const calc = calculateServicePrice(service, selected);
    monthlyBeforeDiscount += calc.monthly;
  });

  let comboPercent = 0;
  let comboLabel = "Sem combo";
  for (let i = comboTiers.length - 1; i >= 0; i--) {
    if (count >= comboTiers[i].min) {
      comboPercent = comboTiers[i].discount;
      comboLabel = comboTiers[i].label;
      break;
    }
  }

  let valueBonusPercent = 0;
  let valueBonusLabel = "—";
  for (let i = valueTierBonuses.length - 1; i >= 0; i--) {
    if (monthlyBeforeDiscount >= valueTierBonuses[i].min) {
      valueBonusPercent = valueTierBonuses[i].bonus;
      valueBonusLabel = valueTierBonuses[i].label;
      break;
    }
  }

  const totalPercent = Math.min(30, comboPercent + valueBonusPercent);
  const discountAmount = monthlyBeforeDiscount * (totalPercent / 100);
  const monthlyAfterDiscount = monthlyBeforeDiscount - discountAmount;

  return {
    serviceCount: count,
    comboPercent,
    comboLabel,
    valueBonusPercent,
    valueBonusLabel,
    totalPercent,
    discountAmount,
    monthlyBeforeDiscount,
    monthlyAfterDiscount,
  };
}