/**
 * CRM Search Results — /crm/resultados
 *
 * Shows results grouped by entity (Leads, Contas, Contatos, Oportunidades).
 * Uses the same design pattern as /price/resultados.
 * CRM palette: teal/blue.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  MagnifyingGlass,
  X,
  Heart,
  Building,
  IdentificationCard,
  SketchLogo,
  ArrowRight,
  SpinnerGap,
  CaretLeft,
  CaretRight,
  ListBullets,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useCrmSearch } from "./crm-search-context";
import {
  listLeads,
  listAccounts,
  listContacts,
  listOpportunities,
  dbLeadToFrontend,
  dbAccountToFrontend,
  dbContactToFrontend,
  dbOpToFrontend,
} from "./crm-api";

/* ── CRM palette for search results ── */
const CP = {
  accent: "#07abde",
  dark: "#0483AB",
  mid: "#065c7a",
  light: "#dcf0ff",
  hover: "#cce7fb",
  pale: "#eef8ff",
};

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const ROWS_PER_PAGE = 8;

/* ── Entity config ── */
const entityConfig = {
  leads: {
    label: "Leads",
    icon: Heart,
    iconBg: "#feedca",
    iconColor: "#eac23d",
    route: "/crm/leads",
  },
  accounts: {
    label: "Contas",
    icon: Building,
    iconBg: "#d9f8ef",
    iconColor: "#3ccea7",
    route: "/crm/contas",
  },
  contacts: {
    label: "Contatos",
    icon: IdentificationCard,
    iconBg: "#ffedeb",
    iconColor: "#ff8c76",
    route: "/crm/contatos",
  },
  opportunities: {
    label: "Oportunidades",
    icon: SketchLogo,
    iconBg: "#dcf0ff",
    iconColor: "#07abde",
    route: "/crm/oportunidades",
  },
};

/* ── Stage labels ── */
const leadStageLabels: Record<string, string> = {
  novo: "Novo",
  em_contato: "Em Contato",
  qualificacao: "Qualificação",
  qualificado: "Qualificado",
  descartado: "Descartado",
};

const accountStageLabels: Record<string, string> = {
  prospeccao: "Prospecção",
  implementacao: "Implementação",
  onboarding: "Onboarding",
  vigente: "Vigente",
  finalizado: "Finalizado",
};

const opStageLabels: Record<string, string> = {
  apresentacao: "Apresentação",
  dimensionamento: "Dimensionamento",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
  op_futura: "Op. Futura",
};

const opTipoLabels: Record<string, string> = {
  novo_negocio: "Novo Negócio",
  upsell: "Upsell",
  cross_sell: "Cross-sell",
  renovacao: "Renovação",
};

/* ── Simple types for search results ── */
interface CrmLead {
  id: string;
  name: string;
  lastName: string;
  company: string;
  role: string;
  stage: string;
  owner: string;
  origin: string;
}

interface CrmAccount {
  id: string;
  name: string;
  segment: string;
  stage: string;
  owner: string;
  revenue: number;
}

interface CrmContact {
  id: string;
  name: string;
  lastName: string;
  company: string;
  role: string;
  email: string;
  owner: string;
}

interface CrmOp {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  tipo: string;
  owner: string;
}

/* ── Mock data ── */
const mockLeads: CrmLead[] = [
  { id: "LD-A1B2", name: "Ana", lastName: "Carolina", company: "Empresa Alpha", role: "Diretora de Marketing", stage: "novo", owner: "João Silva", origin: "Email" },
  { id: "LD-C3D4", name: "Bruno", lastName: "Mendes", company: "Beta Solutions", role: "CEO", stage: "novo", owner: "Maria Oliveira", origin: "LinkedIn" },
  { id: "LD-E5F6", name: "Carlos", lastName: "Eduardo", company: "Gamma Corp", role: "Gerente de compras", stage: "em_contato", owner: "Pedro Costa", origin: "Telefone" },
  { id: "LD-G7H8", name: "Daniela", lastName: "Souza", company: "Delta Tech", role: "Head de Vendas", stage: "em_contato", owner: "Ana Paula", origin: "Email" },
  { id: "LD-J9K1", name: "Eduardo", lastName: "Lima", company: "XPTO Company", role: "Cargo do Lead", stage: "qualificacao", owner: "Carlos Pereira", origin: "Site" },
  { id: "LD-L2M3", name: "Fernanda", lastName: "Costa", company: "Epsilon Ltda", role: "COO", stage: "qualificacao", owner: "Fernanda Santos", origin: "Email" },
  { id: "LD-N4P5", name: "Gabriel", lastName: "Santos", company: "XPTO Company", role: "Cargo do Lead", stage: "qualificado", owner: "Rafael Alves", origin: "LinkedIn" },
  { id: "LD-Q6R7", name: "Helena", lastName: "Rocha", company: "Zeta Inc", role: "Gerente de Projetos", stage: "qualificado", owner: "Juliana Ferreira", origin: "Email" },
  { id: "LD-S8T9", name: "Igor", lastName: "Nascimento", company: "XPTO Company", role: "Cargo do Lead", stage: "descartado", owner: "Lucas Souza", origin: "Telefone" },
  { id: "LD-U1V2", name: "Julia", lastName: "Martins", company: "Theta SA", role: "Coordenadora", stage: "novo", owner: "Camila Ribeiro", origin: "Email" },
];

const mockAccounts: CrmAccount[] = [
  { id: "AC-A1B2", name: "XPTO Company", segment: "Tecnologia", stage: "prospeccao", owner: "João Silva", revenue: 240000 },
  { id: "AC-C3D4", name: "Beta Solutions", segment: "Consultoria", stage: "prospeccao", owner: "Maria Oliveira", revenue: 180000 },
  { id: "AC-E5F6", name: "Gamma Corp", segment: "Indústria", stage: "implementacao", owner: "Pedro Costa", revenue: 520000 },
  { id: "AC-G7H8", name: "Delta Tech", segment: "SaaS", stage: "implementacao", owner: "Ana Paula", revenue: 95000 },
  { id: "AC-J9K1", name: "Epsilon Ltda", segment: "Varejo", stage: "onboarding", owner: "Carlos Pereira", revenue: 310000 },
  { id: "AC-L2M3", name: "Zeta Inc", segment: "Financeiro", stage: "onboarding", owner: "Fernanda Santos", revenue: 780000 },
  { id: "AC-N4P5", name: "Theta SA", segment: "Logística", stage: "vigente", owner: "Rafael Alves", revenue: 420000 },
  { id: "AC-Q6R7", name: "Iota Group", segment: "Educação", stage: "vigente", owner: "Juliana Ferreira", revenue: 150000 },
];

const mockContacts: CrmContact[] = [
  { id: "CT-A1B2", name: "Ana", lastName: "Carolina", company: "Empresa Alpha", role: "Diretora de Marketing", email: "ana@alpha.com", owner: "João Silva" },
  { id: "CT-C3D4", name: "Bruno", lastName: "Mendes", company: "Beta Solutions", role: "CEO", email: "bruno@beta.com", owner: "Maria Oliveira" },
  { id: "CT-E5F6", name: "Carlos", lastName: "Eduardo", company: "Gamma Corp", role: "Gerente de Compras", email: "carlos@gamma.com", owner: "Pedro Costa" },
  { id: "CT-G7H8", name: "Daniela", lastName: "Souza", company: "Delta Tech", role: "Head de Vendas", email: "daniela@delta.com", owner: "Ana Paula" },
  { id: "CT-J9K1", name: "Eduardo", lastName: "Lima", company: "XPTO Company", role: "Diretor", email: "eduardo@xpto.com", owner: "Carlos Pereira" },
];

const mockOps: CrmOp[] = [
  { id: "OP-A1B2", name: "Projeto Alpha", company: "XPTO Company", value: 120000, stage: "apresentacao", tipo: "novo_negocio", owner: "João Silva" },
  { id: "OP-C3D4", name: "Expansão Beta", company: "Beta Solutions", value: 85000, stage: "dimensionamento", tipo: "upsell", owner: "Maria Oliveira" },
  { id: "OP-E5F6", name: "Migração Gamma", company: "Gamma Corp", value: 250000, stage: "proposta", tipo: "cross_sell", owner: "Pedro Costa" },
  { id: "OP-G7H8", name: "Renovação Delta", company: "Delta Tech", value: 45000, stage: "negociacao", tipo: "renovacao", owner: "Ana Paula" },
  { id: "OP-J9K1", name: "Onboarding Epsilon", company: "Epsilon Ltda", value: 180000, stage: "ganho", tipo: "novo_negocio", owner: "Carlos Pereira" },
];

/* ── Helpers ── */

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function matchLead(l: CrmLead, q: string): boolean {
  return (
    l.name.toLowerCase().includes(q) ||
    l.lastName.toLowerCase().includes(q) ||
    l.company.toLowerCase().includes(q) ||
    l.role.toLowerCase().includes(q) ||
    l.id.toLowerCase().includes(q) ||
    l.owner.toLowerCase().includes(q) ||
    l.origin.toLowerCase().includes(q)
  );
}

function matchAccount(a: CrmAccount, q: string): boolean {
  return (
    a.name.toLowerCase().includes(q) ||
    a.segment.toLowerCase().includes(q) ||
    a.id.toLowerCase().includes(q) ||
    a.owner.toLowerCase().includes(q)
  );
}

function matchContact(c: CrmContact, q: string): boolean {
  return (
    `${c.name} ${c.lastName}`.toLowerCase().includes(q) ||
    c.company.toLowerCase().includes(q) ||
    c.role.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q)
  );
}

function matchOp(o: CrmOp, q: string): boolean {
  return (
    o.name.toLowerCase().includes(q) ||
    o.company.toLowerCase().includes(q) ||
    o.id.toLowerCase().includes(q) ||
    o.owner.toLowerCase().includes(q) ||
    (opTipoLabels[o.tipo] || "").toLowerCase().includes(q)
  );
}

/* ── Components ── */

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
    <div className="flex flex-col gap-[2px] mb-[10px]">
      {/* icon removed */}
      <span
        style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, color: "#28415c", ...fontFeature }}
      >
        {title}
      </span>
      <span
        style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, color: "#4E6987", ...fontFeature }}
      >
        {count} resultado{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

/* ── Result Row Components ── */

function LeadRow({ lead, onClick }: { lead: CrmLead; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-[12px] p-[12px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/row"
    >
      <div className="flex items-center justify-center shrink-0 w-[36px] h-[36px] rounded-[8px]" style={{ backgroundColor: "#feedca" }}>
        <Heart size={16} weight="duotone" className="text-[#eac23d]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#28415c] truncate" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
          {lead.name} {lead.lastName}
        </p>
        <p className="text-[#4E6987] truncate" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>
          {lead.role} · {lead.company}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="h-[22px] px-[8px] rounded-[100px] flex items-center uppercase"
          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, backgroundColor: "#dde3ec", color: "#28415c", ...fontFeature }}
        >
          {leadStageLabels[lead.stage] || lead.stage}
        </span>
        <ArrowRight size={14} className="text-[#C8CFDB] group-hover/row:text-[#eac23d] transition-colors" />
      </div>
    </div>
  );
}

function AccountRow({ account, onClick }: { account: CrmAccount; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-[12px] p-[12px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/row"
    >
      <div className="flex items-center justify-center shrink-0 w-[36px] h-[36px] rounded-[8px]" style={{ backgroundColor: "#d9f8ef" }}>
        <Building size={16} weight="duotone" className="text-[#3ccea7]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#28415c] truncate" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
          {account.name}
        </p>
        <p className="text-[#4E6987] truncate" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>
          {account.segment} · {accountStageLabels[account.stage] || account.stage}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
            {formatCurrency(account.revenue)}
          </span>
          <span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
            receita
          </span>
        </div>
        <ArrowRight size={14} className="text-[#C8CFDB] group-hover/row:text-[#3ccea7] transition-colors" />
      </div>
    </div>
  );
}

function ContactRow({ contact, onClick }: { contact: CrmContact; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-[12px] p-[12px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/row"
    >
      <div className="flex items-center justify-center shrink-0 w-[36px] h-[36px] rounded-[8px]" style={{ backgroundColor: "#ffedeb" }}>
        <IdentificationCard size={16} weight="duotone" className="text-[#ff8c76]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#28415c] truncate" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
          {contact.name} {contact.lastName}
        </p>
        <p className="text-[#4E6987] truncate" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>
          {contact.role} · {contact.company}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[#4E6987] truncate" style={{ fontSize: 12, letterSpacing: -0.3, ...fontFeature }}>
          {contact.email}
        </span>
        <ArrowRight size={14} className="text-[#C8CFDB] group-hover/row:text-[#ff8c76] transition-colors" />
      </div>
    </div>
  );
}

function OpRow({ op, onClick }: { op: CrmOp; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-[12px] p-[12px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/row"
    >
      <div className="flex items-center justify-center shrink-0 w-[36px] h-[36px] rounded-[8px]" style={{ backgroundColor: "#dcf0ff" }}>
        <SketchLogo size={16} weight="duotone" className="text-[#07abde]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#28415c] truncate" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
          {op.name}
        </p>
        <p className="text-[#4E6987] truncate" style={{ fontSize: 11, letterSpacing: -0.3, ...fontFeature }}>
          {op.company} · {opTipoLabels[op.tipo] || op.tipo}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
            {formatCurrency(op.value)}
          </span>
          <span
            className="uppercase"
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: "#07abde", ...fontFeature }}
          >
            {opStageLabels[op.stage] || op.stage}
          </span>
        </div>
        <ArrowRight size={14} className="text-[#C8CFDB] group-hover/row:text-[#07abde] transition-colors" />
      </div>
    </div>
  );
}

/* ── Pagination ── */
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  const range: number[] = [];
  for (let i = start; i <= end; i++) range.push(i);

  return (
    <div className="flex items-center gap-2 py-3 px-5">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
      >
        <CaretLeft size={14} weight="bold" />
      </button>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
      >
        <CaretRight size={14} weight="bold" />
      </button>
      <div className="flex items-center gap-0.5 ml-2">
        {range.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors ${
              p === page ? "text-white" : "hover:bg-[#F6F7F9]"
            }`}
            style={{
              fontSize: 12,
              fontWeight: p === page ? 700 : 500,
              backgroundColor: p === page ? CP.accent : undefined,
              color: p !== page ? CP.dark : undefined,
              ...fontFeature,
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export function CrmSearchResults() {
  const navigate = useNavigate();
  const { query, setQuery } = useCrmSearch();

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [ops, setOps] = useState<CrmOp[]>([]);
  const [loading, setLoading] = useState(true);

  const [leadsPage, setLeadsPage] = useState(1);
  const [accountsPage, setAccountsPage] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);
  const [opsPage, setOpsPage] = useState(1);

  /* Sidebar filter */
  type SidebarFilter = "all" | "leads" | "accounts" | "contacts" | "opportunities";
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>("all");

  /* Section refs for scroll-into-view */
  const leadsRef = useRef<HTMLDivElement>(null);
  const accountsRef = useRef<HTMLDivElement>(null);
  const contactsRef = useRef<HTMLDivElement>(null);
  const opsRef = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [dbLeads, dbAccounts, dbContacts, dbOps] = await Promise.allSettled([
        listLeads(),
        listAccounts(),
        listContacts(),
        listOpportunities(),
      ]);

      if (dbLeads.status === "fulfilled" && dbLeads.value.length > 0) {
        setLeads(
          dbLeads.value
            .filter((r) => r.stage_complement !== "convertido") // hide converted leads
            .map((r) => {
              const f = dbLeadToFrontend(r);
              return { id: f.id, name: f.name, lastName: f.lastName, company: f.company, role: f.role, stage: f.stage, owner: f.owner, origin: f.origin };
            })
        );
      }
      if (dbAccounts.status === "fulfilled" && dbAccounts.value.length > 0) {
        setAccounts(
          dbAccounts.value.map((r) => {
            const f = dbAccountToFrontend(r);
            return { id: f.id, name: f.name, segment: f.segment, stage: f.stage, owner: f.owner, revenue: f.revenue };
          })
        );
      }
      if (dbContacts.status === "fulfilled" && dbContacts.value.length > 0) {
        setContacts(
          dbContacts.value.map((r) => {
            const f = dbContactToFrontend(r);
            return { id: f.id, name: f.name, lastName: f.lastName, company: f.company, role: f.role, email: f.email, owner: f.owner };
          })
        );
      }
      if (dbOps.status === "fulfilled" && dbOps.value.length > 0) {
        setOps(
          dbOps.value.map((r) => {
            const f = dbOpToFrontend(r);
            return { id: f.id, name: f.name, company: f.company, value: f.value, stage: f.stage, tipo: f.tipo, owner: f.owner };
          })
        );
      }
    } catch (err) {
      console.warn("CRM search: could not load from server, using mock data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset pages when query changes
  useEffect(() => {
    setLeadsPage(1);
    setAccountsPage(1);
    setContactsPage(1);
    setOpsPage(1);
    setActiveFilter("all");
  }, [query]);

  // Filter
  const q = query.toLowerCase();
  const filteredLeads = q ? leads.filter((l) => matchLead(l, q)) : [];
  const filteredAccounts = q ? accounts.filter((a) => matchAccount(a, q)) : [];
  const filteredContacts = q ? contacts.filter((c) => matchContact(c, q)) : [];
  const filteredOps = q ? ops.filter((o) => matchOp(o, q)) : [];

  const totalResults = filteredLeads.length + filteredAccounts.length + filteredContacts.length + filteredOps.length;

  const paginatedLeads = filteredLeads.slice((leadsPage - 1) * ROWS_PER_PAGE, leadsPage * ROWS_PER_PAGE);
  const paginatedAccounts = filteredAccounts.slice((accountsPage - 1) * ROWS_PER_PAGE, accountsPage * ROWS_PER_PAGE);
  const paginatedContacts = filteredContacts.slice((contactsPage - 1) * ROWS_PER_PAGE, contactsPage * ROWS_PER_PAGE);
  const paginatedOps = filteredOps.slice((opsPage - 1) * ROWS_PER_PAGE, opsPage * ROWS_PER_PAGE);

  const handleClearAll = () => {
    setQuery("");
    navigate("/crm");
  };

  /* Sidebar filter handler */
  const handleFilterClick = (filter: SidebarFilter) => {
    setActiveFilter(filter);
    // Reset all pages when switching filter
    setLeadsPage(1);
    setAccountsPage(1);
    setContactsPage(1);
    setOpsPage(1);
    // If "all", scroll to top; otherwise scroll to section
    if (filter === "all") return;
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      leads: leadsRef,
      accounts: accountsRef,
      contacts: contactsRef,
      opportunities: opsRef,
    };
    setTimeout(() => {
      refMap[filter]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  /* Sidebar items config */
  const sidebarItems: { key: SidebarFilter; label: string; icon: typeof Heart; iconBg: string; iconColor: string; count: number }[] = [
    { key: "all", label: "Todos os Resultados", icon: ListBullets, iconBg: "#DDE3EC", iconColor: "#4E6987", count: totalResults },
    { key: "leads", label: "Leads", icon: Heart, iconBg: entityConfig.leads.iconBg, iconColor: entityConfig.leads.iconColor, count: filteredLeads.length },
    { key: "accounts", label: "Contas", icon: Building, iconBg: entityConfig.accounts.iconBg, iconColor: entityConfig.accounts.iconColor, count: filteredAccounts.length },
    { key: "contacts", label: "Contatos", icon: IdentificationCard, iconBg: entityConfig.contacts.iconBg, iconColor: entityConfig.contacts.iconColor, count: filteredContacts.length },
    { key: "opportunities", label: "Oportunidades", icon: SketchLogo, iconBg: entityConfig.opportunities.iconBg, iconColor: entityConfig.opportunities.iconColor, count: filteredOps.length },
  ];

  /* Which sections to show */
  const showLeads = (activeFilter === "all" || activeFilter === "leads") && filteredLeads.length > 0;
  const showAccounts = (activeFilter === "all" || activeFilter === "accounts") && filteredAccounts.length > 0;
  const showContacts = (activeFilter === "all" || activeFilter === "contacts") && filteredContacts.length > 0;
  const showOps = (activeFilter === "all" || activeFilter === "opportunities") && filteredOps.length > 0;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 shrink-0 bg-white rounded-[16px] p-[16px]">
        {/* Left */}
        <div className="flex items-center gap-[10px] p-[12px]">
          <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px]" style={{ backgroundColor: "#DDE3EC" }}>
            <MagnifyingGlass size={22} weight="duotone" style={{ color: "#4E6987" }} />
          </div>
          <div className="flex flex-col items-start justify-center">
            <span
              className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]"
              style={fontFeature}
            >
              Pesquisa CRM
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
            style={{ backgroundColor: CP.light, color: CP.dark }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = CP.hover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = CP.light)}
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

      {/* ═══════ ACTIVE SEARCH TAG ═══════ */}
      {query && (
        <div className="flex flex-wrap items-center gap-[6px] mb-4 shrink-0">
          <div className="flex items-center gap-[4px] h-[26px] pl-[10px] pr-[6px] rounded-[100px] text-[#f6f7f9]" style={{ backgroundColor: CP.dark }}>
            <MagnifyingGlass size={10} weight="bold" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>
              "{query}"
            </span>
            <button
              onClick={() => setQuery("")}
              className="flex items-center justify-center size-[16px] rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={8} weight="bold" />
            </button>
          </div>
          <button
            onClick={handleClearAll}
            className="text-[#98989d] hover:text-[#4E6987] transition-colors ml-1"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, ...fontFeature }}
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* ═══════ LOADING ═══════ */}
      {loading && (
        <div className="flex-1 flex items-center justify-center py-20">
          <SpinnerGap size={32} className="animate-spin" style={{ color: CP.accent }} />
        </div>
      )}

      {/* ═══════ EMPTY STATE ═══════ */}
      {!loading && totalResults === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="flex items-center justify-center w-[64px] h-[64px] rounded-[16px] mb-4" style={{ backgroundColor: CP.pale }}>
            <MagnifyingGlass size={28} style={{ color: CP.hover }} />
          </div>
          <p
            className="text-[#28415c] mb-1"
            style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
          >
            {query ? "Nenhum resultado encontrado" : "Digite para pesquisar"}
          </p>
          <p
            className="text-[#4E6987] mb-5"
            style={{ fontSize: 13, letterSpacing: -0.3, ...fontFeature }}
          >
            {query
              ? "Tente ajustar os termos de pesquisa."
              : "Pesquise por leads, contas, contatos ou oportunidades."}
          </p>
          {query && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-[4px] h-[36px] px-[18px] rounded-[500px] transition-colors cursor-pointer"
              style={{ backgroundColor: CP.light, color: CP.dark }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = CP.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = CP.light)}
            >
              <X size={12} weight="bold" />
              <span
                className="uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
              >
                Limpar e voltar
              </span>
            </button>
          )}
        </div>
      )}

      {/* ═══════ SIDEBAR + RESULTS ═══════ */}
      {!loading && totalResults > 0 && (
        <div className="flex-1 flex gap-0 overflow-hidden min-h-0">
          {/* ── Sidebar ── */}
          <aside className="shrink-0 w-[200px] flex flex-col pr-[16px] mr-[16px] border-r border-[#ebedf0] overflow-y-auto bg-[#ffffff] rounded-[16px] p-[16px]">
            {/* Sidebar header */}
            <span
              className="text-[#98989d] uppercase mb-[10px] px-[8px]"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, ...fontFeature }}
            >FILTRAR POR OBJETO</span>

            {/* Sidebar items */}
            <div className="flex flex-col gap-[2px]">
              {sidebarItems.map((item) => {
                const isActive = activeFilter === item.key;
                const hasResults = item.count > 0;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => hasResults && handleFilterClick(item.key)}
                    disabled={!hasResults && item.key !== "all"}
                    className={`flex items-center gap-[8px] w-full px-[8px] py-[8px] rounded-[8px] transition-all cursor-pointer text-left ${
                      isActive
                        ? ""
                        : hasResults
                        ? "hover:bg-[#f6f7f9]"
                        : "opacity-40 cursor-default"
                    }`}
                    style={{
                      backgroundColor: isActive ? "#28415c" : undefined,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-[6px]"
                      style={{
                        backgroundColor: isActive ? "rgba(255,255,255,0.15)" : item.iconBg,
                      }}
                    >
                      <Icon
                        size={14}
                        weight="duotone"
                        style={{ color: isActive ? "#ffffff" : item.iconColor }}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className="flex-1 truncate"
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 500,
                        letterSpacing: -0.3,
                        color: isActive ? "#ffffff" : "#4E6987",
                        ...fontFeature,
                      }}
                    >
                      {item.label}
                    </span>

                    {/* Count badge */}
                    {hasResults && (
                      <span
                        className="flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full shrink-0"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f0f2f5",
                          color: isActive ? "#ffffff" : "#98989d",
                          ...fontFeature,
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Results content ── */}
          <div className="flex-1 flex flex-col gap-[16px] overflow-y-auto pb-4 min-w-0">
            {/* ── Leads section ── */}
            {showLeads && (
              <div ref={leadsRef} className="bg-white rounded-[16px] p-[16px]">
                <SectionHeader
                  icon={<Heart size={16} weight="duotone" />}
                  title="Leads"
                  count={filteredLeads.length}
                  iconBg={entityConfig.leads.iconBg}
                  iconColor={entityConfig.leads.iconColor}
                />
                <div className="bg-white rounded-[12px]">
                  {paginatedLeads.map((lead, idx) => (
                    <div key={lead.id}>
                      {idx > 0 && <HorizontalDivider />}
                      <LeadRow lead={lead} onClick={() => navigate(`/crm/leads/${lead.id}`)} />
                    </div>
                  ))}
                </div>
                <Pagination
                  page={leadsPage}
                  totalPages={Math.ceil(filteredLeads.length / ROWS_PER_PAGE)}
                  onChange={setLeadsPage}
                />
              </div>
            )}

            {/* ── Accounts section ── */}
            {showAccounts && (
              <div ref={accountsRef} className="bg-white rounded-[16px] p-[16px]">
                <SectionHeader
                  icon={<Building size={16} weight="duotone" />}
                  title="Contas"
                  count={filteredAccounts.length}
                  iconBg={entityConfig.accounts.iconBg}
                  iconColor={entityConfig.accounts.iconColor}
                />
                <div className="bg-white rounded-[12px]">
                  {paginatedAccounts.map((account, idx) => (
                    <div key={account.id}>
                      {idx > 0 && <HorizontalDivider />}
                      <AccountRow account={account} onClick={() => navigate(`/crm/contas/${account.id}`)} />
                    </div>
                  ))}
                </div>
                <Pagination
                  page={accountsPage}
                  totalPages={Math.ceil(filteredAccounts.length / ROWS_PER_PAGE)}
                  onChange={setAccountsPage}
                />
              </div>
            )}

            {/* ── Contacts section ── */}
            {showContacts && (
              <div ref={contactsRef} className="bg-white rounded-[16px] p-[16px]">
                <SectionHeader
                  icon={<IdentificationCard size={16} weight="duotone" />}
                  title="Contatos"
                  count={filteredContacts.length}
                  iconBg={entityConfig.contacts.iconBg}
                  iconColor={entityConfig.contacts.iconColor}
                />
                <div className="bg-white rounded-[12px]">
                  {paginatedContacts.map((contact, idx) => (
                    <div key={contact.id}>
                      {idx > 0 && <HorizontalDivider />}
                      <ContactRow contact={contact} onClick={() => toast("Contatos abrem no painel lateral da listagem")} />
                    </div>
                  ))}
                </div>
                <Pagination
                  page={contactsPage}
                  totalPages={Math.ceil(filteredContacts.length / ROWS_PER_PAGE)}
                  onChange={setContactsPage}
                />
              </div>
            )}

            {/* ── Opportunities section ── */}
            {showOps && (
              <div ref={opsRef} className="bg-white rounded-[16px] p-[16px]">
                <SectionHeader
                  icon={<SketchLogo size={16} weight="duotone" />}
                  title="Oportunidades"
                  count={filteredOps.length}
                  iconBg={entityConfig.opportunities.iconBg}
                  iconColor={entityConfig.opportunities.iconColor}
                />
                <div className="bg-white rounded-[12px]">
                  {paginatedOps.map((op, idx) => (
                    <div key={op.id}>
                      {idx > 0 && <HorizontalDivider />}
                      <OpRow op={op} onClick={() => navigate(`/crm/oportunidades/${op.id}`)} />
                    </div>
                  ))}
                </div>
                <Pagination
                  page={opsPage}
                  totalPages={Math.ceil(filteredOps.length / ROWS_PER_PAGE)}
                  onChange={setOpsPage}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}