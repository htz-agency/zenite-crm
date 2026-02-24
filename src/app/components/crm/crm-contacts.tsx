/**
 * CRM Contacts — Listagem + painel lateral de detalhes
 *
 * Contatos abrem no painel lateral (não em página dedicada).
 * Paleta red cherry: #ffedeb, #ffc6be, #ff8c76, #431100
 */

import { useState, useEffect, useRef } from "react";
import {
  IdentificationCard,
  CaretDown,
  CaretLeft,
  CaretRight,
  Plus,
  Link as LinkIcon,
  ArrowSquareDownRight,
  Columns,
  Funnel,
  GearSix,
  PushPin,
  Info,
  Building,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";
import { EditableField } from "./editable-field";
import { DraggableFieldGrid, FieldDndProvider } from "./draggable-field-grid";
import {
  listContacts,
  seedCrmData,
  dbContactToFrontend,
  generateCrmId,
  listAccounts,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ContactStage = "prospeccao" | "ativo" | "inativo" | "parceiro";

interface Contact {
  id: string;
  name: string;
  lastName: string;
  role: string;
  department: string;
  company: string;
  phone: string;
  mobile: string;
  email: string;
  linkedin: string;
  website: string;
  address: string;
  stage: ContactStage;
  owner: string;
  origin: string;
  birthDate: string;
  cpf: string;
  preferredContact: string;
  doNotContact: string;
  tags: string;
  notes: string;
  account: string;
  lastActivityDate: string;
  lastActivityDateISO: string;
  comments: number;
  calls: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  lastViewedDate: string;
  lastReferencedDate: string;
  systemModstamp: string;
  isDeleted: string;
  avatar?: string;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

interface StageConfig {
  label: string;
  bg: string;
  color: string;
}

const stageConfig: Record<ContactStage, StageConfig> = {
  prospeccao: { label: "PROSPECAO", bg: "#ffc6be", color: "#431100" },
  ativo:      { label: "ATIVO",      bg: "#d9f8ef", color: "#135543" },
  inativo:    { label: "INATIVO",    bg: "#f0f2f5", color: "#64676c" },
  parceiro:   { label: "PARCEIRO",   bg: "#dde3ec", color: "#28415c" },
};

/* ------------------------------------------------------------------ */
/*  Avatars                                                            */
/* ------------------------------------------------------------------ */

const AVATARS = [
  "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNjAyNzcwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1723537742563-15c3d351dbf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90JTIwYnVzaW5lc3N8ZW58MXx8fHwxNzcxNzEwNTM3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1765648763932-43a3e2f8f35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXQlMjBzbWlsZXxlbnwxfHx8fDE3NzE3MTA1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
];

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const mockContacts: Contact[] = [
  { id: "CT-A1B2", name: "Ana", lastName: "Silva", role: "Diretora de Marketing", department: "Marketing", company: "Empresa Alpha", phone: "(11) 98765-4321", mobile: "(11) 98765-4321", email: "ana@alpha.com.br", linkedin: "linkedin.com/in/anacarolina", website: "alpha.com.br", address: "Av. Paulista, 1000 - SP", stage: "ativo", owner: "Joao Silva", origin: "Email", birthDate: "1985-05-15", cpf: "123.456.789-00", preferredContact: "Email", doNotContact: "Nao", tags: "Cliente VIP", notes: "Cliente importante para a empresa.", account: "Alpha", lastActivityDate: "2026-02-15", lastActivityDateISO: "2026-02-15T10:00:00Z", comments: 3, calls: 2, createdAt: "2025-08-10", updatedAt: "2026-02-15", createdBy: "Joao Silva", updatedBy: "Joao Silva", lastViewedDate: "2026-02-15", lastReferencedDate: "2026-02-15", systemModstamp: "2026-02-15T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[0] },
  { id: "CT-C3D4", name: "Bruno", lastName: "Mendes", role: "CEO", department: "Executivo", company: "Beta Solutions", phone: "(21) 91234-5678", mobile: "(21) 91234-5678", email: "bruno@beta.io", linkedin: "linkedin.com/in/brunomendes", website: "beta.io", address: "Rua do Comercio, 250 - RJ", stage: "prospeccao", owner: "Maria Oliveira", origin: "Rede Social", birthDate: "1978-03-20", cpf: "987.654.321-00", preferredContact: "LinkedIn", doNotContact: "Nao", tags: "Potencial Cliente", notes: "Interessado em nossos produtos.", account: "Beta", lastActivityDate: "2026-02-10", lastActivityDateISO: "2026-02-10T10:00:00Z", comments: 1, calls: 0, createdAt: "2025-11-02", updatedAt: "2026-02-10", createdBy: "Maria Oliveira", updatedBy: "Maria Oliveira", lastViewedDate: "2026-02-10", lastReferencedDate: "2026-02-10", systemModstamp: "2026-02-10T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[1] },
  { id: "CT-E5F6", name: "Carla", lastName: "Ferreira", role: "Gerente de Compras", department: "Compras", company: "XPTO Company", phone: "(11) 97654-3210", mobile: "(11) 97654-3210", email: "carla@xpto.com", linkedin: "linkedin.com/in/carlaferreira", website: "xpto.com", address: "Al. Santos, 500 - SP", stage: "ativo", owner: "Pedro Costa", origin: "Email", birthDate: "1990-07-10", cpf: "456.789.123-00", preferredContact: "Email", doNotContact: "Nao", tags: "Cliente VIP", notes: "Cliente importante para a empresa.", account: "XPTO", lastActivityDate: "2026-01-28", lastActivityDateISO: "2026-01-28T10:00:00Z", comments: 5, calls: 3, createdAt: "2025-06-15", updatedAt: "2026-01-28", createdBy: "Pedro Costa", updatedBy: "Pedro Costa", lastViewedDate: "2026-01-28", lastReferencedDate: "2026-01-28", systemModstamp: "2026-01-28T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[2] },
  { id: "CT-G7H8", name: "Daniel", lastName: "Souza", role: "Head de Vendas", department: "Vendas", company: "Delta Tech", phone: "(31) 98888-7777", mobile: "(31) 98888-7777", email: "daniel@deltatech.com", linkedin: "linkedin.com/in/danielsouza", website: "deltatech.com", address: "Rua Espirito Santo, 100 - BH", stage: "prospeccao", owner: "Ana Paula", origin: "Rede Social", birthDate: "1982-11-05", cpf: "789.123.456-00", preferredContact: "LinkedIn", doNotContact: "Nao", tags: "Potencial Cliente", notes: "Interessado em nossos produtos.", account: "Delta", lastActivityDate: "2026-02-18", lastActivityDateISO: "2026-02-18T10:00:00Z", comments: 2, calls: 1, createdAt: "2025-12-01", updatedAt: "2026-02-18", createdBy: "Ana Paula", updatedBy: "Ana Paula", lastViewedDate: "2026-02-18", lastReferencedDate: "2026-02-18", systemModstamp: "2026-02-18T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[1] },
  { id: "CT-J9K1", name: "Elena", lastName: "Rodrigues", role: "COO", department: "Operacoes", company: "Epsilon Ltda", phone: "(41) 96543-2109", mobile: "(41) 96543-2109", email: "elena@epsilon.com", linkedin: "linkedin.com/in/elenarodrigues", website: "epsilon.com", address: "Av. Sete de Setembro, 300 - CWB", stage: "inativo", owner: "Carlos Pereira", origin: "Email", birthDate: "1975-09-12", cpf: "123.789.456-00", preferredContact: "Email", doNotContact: "Nao", tags: "Cliente VIP", notes: "Cliente importante para a empresa.", account: "Epsilon", lastActivityDate: "2025-11-20", lastActivityDateISO: "2025-11-20T10:00:00Z", comments: 0, calls: 1, createdAt: "2025-05-20", updatedAt: "2025-11-20", createdBy: "Carlos Pereira", updatedBy: "Carlos Pereira", lastViewedDate: "2025-11-20", lastReferencedDate: "2025-11-20", systemModstamp: "2025-11-20T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[0] },
  { id: "CT-L2M3", name: "Fabio", lastName: "Lima", role: "CTO", department: "Tecnologia", company: "Gamma Corp", phone: "(11) 94321-8765", mobile: "(11) 94321-8765", email: "fabio@gamma.dev", linkedin: "linkedin.com/in/fabiolima", website: "gamma.dev", address: "Rua Augusta, 2000 - SP", stage: "ativo", owner: "Fernanda Santos", origin: "Email", birthDate: "1988-06-25", cpf: "456.123.789-00", preferredContact: "Email", doNotContact: "Nao", tags: "Cliente VIP", notes: "Cliente importante para a empresa.", account: "Gamma", lastActivityDate: "2026-02-12", lastActivityDateISO: "2026-02-12T10:00:00Z", comments: 4, calls: 2, createdAt: "2025-09-08", updatedAt: "2026-02-12", createdBy: "Fernanda Santos", updatedBy: "Fernanda Santos", lastViewedDate: "2026-02-12", lastReferencedDate: "2026-02-12", systemModstamp: "2026-02-12T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[1] },
  { id: "CT-N4P5", name: "Gabriela", lastName: "Nunes", role: "Diretora Financeira", department: "Financeiro", company: "Zeta Inc", phone: "(21) 93456-7890", mobile: "(21) 93456-7890", email: "gabi@zeta.com.br", linkedin: "linkedin.com/in/gabrielanunes", website: "zeta.com.br", address: "Av. Rio Branco, 50 - RJ", stage: "parceiro", owner: "Rafael Alves", origin: "Rede Social", birthDate: "1992-04-18", cpf: "789.456.123-00", preferredContact: "LinkedIn", doNotContact: "Nao", tags: "Potencial Cliente", notes: "Interessado em nossos produtos.", account: "Zeta", lastActivityDate: "2026-01-15", lastActivityDateISO: "2026-01-15T10:00:00Z", comments: 2, calls: 1, createdAt: "2025-07-22", updatedAt: "2026-01-15", createdBy: "Rafael Alves", updatedBy: "Rafael Alves", lastViewedDate: "2026-01-15", lastReferencedDate: "2026-01-15", systemModstamp: "2026-01-15T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[2] },
  { id: "CT-Q6R7", name: "Henrique", lastName: "Almeida", role: "Gerente de Projetos", department: "Projetos", company: "Theta SA", phone: "(51) 92222-3333", mobile: "(51) 92222-3333", email: "henrique@theta.com", linkedin: "linkedin.com/in/henriquealmeida", website: "theta.com", address: "Av. Ipiranga, 1200 - POA", stage: "ativo", owner: "Juliana Ferreira", origin: "Email", birthDate: "1980-08-30", cpf: "123.456.789-00", preferredContact: "Email", doNotContact: "Nao", tags: "Cliente VIP", notes: "Cliente importante para a empresa.", account: "Theta", lastActivityDate: "2026-02-20", lastActivityDateISO: "2026-02-20T10:00:00Z", comments: 6, calls: 4, createdAt: "2025-10-15", updatedAt: "2026-02-20", createdBy: "Juliana Ferreira", updatedBy: "Juliana Ferreira", lastViewedDate: "2026-02-20", lastReferencedDate: "2026-02-20", systemModstamp: "2026-02-20T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[1] },
  { id: "CT-S8T9", name: "Isabela", lastName: "Costa", role: "Analista Sr.", department: "Analise", company: "Iota Group", phone: "(11) 95555-4444", mobile: "(11) 95555-4444", email: "isabela@iota.com", linkedin: "linkedin.com/in/isabelacosta", website: "iota.com", address: "Rua Consolacao, 800 - SP", stage: "prospeccao", owner: "Lucas Souza", origin: "Rede Social", birthDate: "1987-01-15", cpf: "456.789.123-00", preferredContact: "LinkedIn", doNotContact: "Nao", tags: "Potencial Cliente", notes: "Interessado em nossos produtos.", account: "Iota", lastActivityDate: "2026-02-05", lastActivityDateISO: "2026-02-05T10:00:00Z", comments: 1, calls: 0, createdAt: "2026-01-10", updatedAt: "2026-02-05", createdBy: "Lucas Souza", updatedBy: "Lucas Souza", lastViewedDate: "2026-02-05", lastReferencedDate: "2026-02-05", systemModstamp: "2026-02-05T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[2] },
  { id: "CT-U1V2", name: "Joao", lastName: "Pedro Martins", role: "Coordenador", department: "Coordenacao", company: "Kappa Digital", phone: "(11) 96789-0123", mobile: "(11) 96789-0123", email: "jp@kappa.digital", linkedin: "linkedin.com/in/jpmartins", website: "kappa.digital", address: "Rua Oscar Freire, 300 - SP", stage: "inativo", owner: "Camila Ribeiro", origin: "Email", birthDate: "1995-06-20", cpf: "789.123.456-00", preferredContact: "Email", doNotContact: "Nao", tags: "Cliente VIP", notes: "Cliente importante para a empresa.", account: "Kappa", lastActivityDate: "2025-12-10", lastActivityDateISO: "2025-12-10T10:00:00Z", comments: 0, calls: 0, createdAt: "2025-04-01", updatedAt: "2025-12-10", createdBy: "Camila Ribeiro", updatedBy: "Camila Ribeiro", lastViewedDate: "2025-12-10", lastReferencedDate: "2025-12-10", systemModstamp: "2025-12-10T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[1] },
  { id: "CT-W3X4", name: "Larissa", lastName: "Campos", role: "Diretora Comercial", department: "Comercial", company: "Lambda Media", phone: "(21) 97777-8888", mobile: "(21) 97777-8888", email: "larissa@lambda.com", linkedin: "linkedin.com/in/larissacampos", website: "lambda.com", address: "Rua Visconde de Piraja, 400 - RJ", stage: "ativo", owner: "Rafaela Costa", origin: "Email", birthDate: "1989-03-10", cpf: "123.456.789-00", preferredContact: "Email", doNotContact: "Nao", tags: "Cliente VIP", notes: "Cliente importante para a empresa.", account: "Lambda", lastActivityDate: "2026-02-19", lastActivityDateISO: "2026-02-19T10:00:00Z", comments: 3, calls: 2, createdAt: "2025-08-30", updatedAt: "2026-02-19", createdBy: "Rafaela Costa", updatedBy: "Rafaela Costa", lastViewedDate: "2026-02-19", lastReferencedDate: "2026-02-19", systemModstamp: "2026-02-19T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[0] },
  { id: "CT-Y5Z6", name: "Marcos", lastName: "Vieira", role: "Diretor de Operacoes", department: "Operacoes", company: "Mu Design", phone: "(31) 91111-2222", mobile: "(31) 91111-2222", email: "marcos@mu.design", linkedin: "linkedin.com/in/marcosvieira", website: "mu.design", address: "Rua da Bahia, 600 - BH", stage: "parceiro", owner: "Joao Pedro", origin: "Rede Social", birthDate: "1977-09-25", cpf: "456.789.123-00", preferredContact: "LinkedIn", doNotContact: "Nao", tags: "Potencial Cliente", notes: "Interessado em nossos produtos.", account: "Mu", lastActivityDate: "2026-01-22", lastActivityDateISO: "2026-01-22T10:00:00Z", comments: 2, calls: 1, createdAt: "2025-07-05", updatedAt: "2026-01-22", createdBy: "Joao Pedro", updatedBy: "Joao Pedro", lastViewedDate: "2026-01-22", lastReferencedDate: "2026-01-22", systemModstamp: "2026-01-22T10:00:00Z", isDeleted: "Nao", avatar: AVATARS[1] },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 30) return `Ha ${diffDays} dias`;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return iso; }
}

/* ------------------------------------------------------------------ */
/*  Shared components                                                  */
/* ------------------------------------------------------------------ */

function VerticalDivider() {
  return (
    <div className="flex h-[20px] items-center justify-center shrink-0 w-[1.5px]">
      <div className="-rotate-90 flex-none">
        <div className="h-[1.5px] relative w-[20px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.9651 1.5">
            <path d="M0.75 0.75H20.2151" stroke="#DDE3EC" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

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

function CircleCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative shrink-0 size-[16px] cursor-pointer"
    >
      <div
        className={`absolute inset-0 rounded-full border-[1.5px] border-solid transition-colors ${
          checked ? "border-[#3ccea7] bg-[#3ccea7]" : "border-[#28415c] bg-transparent backdrop-blur-[20px]"
        }`}
      />
      {checked && (
        <svg className="absolute inset-0 size-full" viewBox="0 0 16 16" fill="none">
          <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Config                                                      */
/* ------------------------------------------------------------------ */

type FilterField = "stage" | "company" | "owner" | "role";

interface ActiveFilter {
  field: FilterField;
  value: string;
}

interface FilterOption {
  field: FilterField;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { field: "stage", label: "Estagio" },
  { field: "company", label: "Empresa" },
  { field: "owner", label: "Proprietario" },
  { field: "role", label: "Cargo" },
];

function getUniqueValues(contacts: Contact[], field: FilterField): string[] {
  const values = contacts.map((c) => c[field]);
  return [...new Set(values)].sort();
}

function getFilterLabel(field: FilterField): string {
  return FILTER_OPTIONS.find((o) => o.field === field)?.label ?? field;
}

function getFilterDisplayValue(field: FilterField, value: string): string {
  if (field === "stage") {
    const sc = stageConfig[value as ContactStage];
    return sc ? sc.label : value;
  }
  return value;
}

/* ------------------------------------------------------------------ */
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [150, 136, 137, 107, 136, 154];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "NOME",
  "CARGO",
  "EMPRESA",
  "ESTAGIO",
  "PROPRIETARIO",
  "ULTIMA ATIVIDADE",
];

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

/* ------------------------------------------------------------------ */
/*  Contact Detail Panel                                               */
/* ------------------------------------------------------------------ */

function ContactDetailPanel({
  contact,
  onClose,
  onUpdateContact,
}: {
  contact: Contact;
  onClose: () => void;
  onUpdateContact: (id: string, field: string, value: string) => void;
}) {
  const sc = stageConfig[contact.stage];
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    detalhes: true,
    contato: true,
    complementar: false,
    info: false,
    sistema: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fullName = `${contact.name} ${contact.lastName}`.trim();

  return (
    <div className="h-full flex flex-col bg-white rounded-[15px] overflow-hidden">
      {/* ─── Cherry Header ─── */}
      <div className="relative shrink-0">
        <div className="bg-[#ffedeb] px-[20px] pt-[16px] pb-[48px]">
          <div className="flex justify-end mb-[4px]">
            <button
              onClick={onClose}
              className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#ffc6be] transition-colors text-[#431100] cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <div className="flex items-center gap-[14px]">
            <img alt="" className="shrink-0 size-[48px] rounded-full object-cover ring-2 ring-white" src={contact.avatar || imgAvatar} />
            <div className="flex-1 min-w-0">
              <p className="text-[#431100] truncate" style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>{fullName}</p>
              <p className="text-[#431100] uppercase truncate" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>{contact.role}</p>
            </div>
          </div>
        </div>
        <div className="absolute left-[20px] bottom-[12px] flex items-center gap-[8px]">
          <div className="flex items-center gap-[4px] h-[24px] px-[12px] rounded-[500px] bg-[#ffc6be] text-[#431100]">
            <Building size={12} weight="fill" />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>{contact.company}</span>
          </div>
          <div className="flex items-center gap-[4px] h-[24px] px-[12px] rounded-[100px]" style={{ backgroundColor: sc.bg, color: sc.color }}>
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>{sc.label}</span>
            <CaretDown size={10} weight="bold" />
          </div>
        </div>
      </div>

      {/* ─── Fields ─── */}
      <FieldDndProvider>
      <div className="flex-1 overflow-auto px-[20px] pt-[16px] pb-[20px]">
        {/* ── Detalhes do Contato ── */}
        <SectionHeader title="Detalhes do Contato" expanded={expandedSections.detalhes} onToggle={() => toggleSection("detalhes")} />
        <AnimatePresence initial={false}>
          {expandedSections.detalhes && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
              <DraggableFieldGrid storageKey={`ct-det-${contact.id}`} columns={1} gap={2} className="py-[4px]">
                <EditableField key="ctOwner" label="PROPRIETÁRIO" value={contact.owner} fieldType="user" avatar={imgAvatar} />
                <EditableField key="ctName" label="NOME" value={contact.name} fieldType="text" onChange={(v) => onUpdateContact(contact.id, "name", v)} />
                <EditableField key="ctLastName" label="SOBRENOME" value={contact.lastName} fieldType="text" onChange={(v) => onUpdateContact(contact.id, "lastName", v)} />
                <EditableField key="ctAccount" label="CONTA" value={contact.account} fieldType="association" associationLabel="Conta" />
                <EditableField key="ctRole" label="CARGO" value={contact.role} fieldType="text" onChange={(v) => onUpdateContact(contact.id, "role", v)} />
                <EditableField key="ctDept" label="DEPARTAMENTO" value={contact.department} fieldType="text" onChange={(v) => onUpdateContact(contact.id, "department", v)} />
                <EditableField key="ctOrigin" label="ORIGEM" value={contact.origin} fieldType="type" options={[
                  { value: "Prospecção", label: "Prospecção", color: "#07abde" },
                  { value: "Indicação", label: "Indicação", color: "#3ccea7" },
                  { value: "Email", label: "Email", color: "#8c8cd4" },
                  { value: "Rede Social", label: "Rede Social", color: "#eac23d" },
                  { value: "Evento", label: "Evento", color: "#ff8c76" },
                  { value: "Site", label: "Site", color: "#4e6987" },
                ]} />
                <EditableField key="ctBirthDate" label="DATA DE NASCIMENTO" value={contact.birthDate} fieldType="date" onChange={(v) => onUpdateContact(contact.id, "birthDate", v)} />
                <EditableField key="ctCpf" label="CPF" value={contact.cpf} onChange={(v) => onUpdateContact(contact.id, "cpf", v)} />
              </DraggableFieldGrid>
              <div className="my-[12px]"><div className="bg-[#dde3ec] h-[1.5px] rounded-[11px] w-full" /></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Informações de Contato ── */}
        <SectionHeader title="Informações de Contato" expanded={expandedSections.contato} onToggle={() => toggleSection("contato")} />
        <AnimatePresence initial={false}>
          {expandedSections.contato && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
              <DraggableFieldGrid storageKey={`ct-info-${contact.id}`} columns={1} gap={2} className="py-[4px]">
                <EditableField key="ctPhone" label="TELEFONE" value={contact.phone} fieldType="phone" onChange={(v) => onUpdateContact(contact.id, "phone", v)} />
                <EditableField key="ctMobile" label="CELULAR" value={contact.mobile} fieldType="phone" onChange={(v) => onUpdateContact(contact.id, "mobile", v)} />
                <EditableField key="ctEmail" label="EMAIL" value={contact.email} fieldType="email" onChange={(v) => onUpdateContact(contact.id, "email", v)} />
                <EditableField key="ctLinkedin" label="LINKEDIN" value={contact.linkedin} fieldType="link" onChange={(v) => onUpdateContact(contact.id, "linkedin", v)} />
                <EditableField key="ctWebsite" label="WEBSITE" value={contact.website} fieldType="link" onChange={(v) => onUpdateContact(contact.id, "website", v)} />
                <EditableField key="ctAddress" label="ENDEREÇO" value={contact.address} fieldType="address" onChange={(v) => onUpdateContact(contact.id, "address", v)} />
                <EditableField key="ctPrefContact" label="CONTATO PREFERENCIAL" value={contact.preferredContact} fieldType="combobox" options={[
                  { value: "Email", label: "Email" },
                  { value: "Telefone", label: "Telefone" },
                  { value: "WhatsApp", label: "WhatsApp" },
                  { value: "LinkedIn", label: "LinkedIn" },
                  { value: "Presencial", label: "Presencial" },
                ]} />
                <EditableField key="ctDnc" label="NÃO PERTURBE" value={contact.doNotContact} fieldType="boolean" />
              </DraggableFieldGrid>
              <div className="my-[12px]"><div className="bg-[#dde3ec] h-[1.5px] rounded-[11px] w-full" /></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Dados Complementares ── */}
        <SectionHeader title="Dados Complementares" expanded={expandedSections.complementar} onToggle={() => toggleSection("complementar")} />
        <AnimatePresence initial={false}>
          {expandedSections.complementar && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
              <DraggableFieldGrid storageKey={`ct-comp-${contact.id}`} columns={1} gap={2} className="py-[4px]">
                <EditableField key="ctTags" label="TAGS" value={contact.tags} fieldType="multipicklist" options={[
                  { value: "Cliente VIP", label: "Cliente VIP", color: "#3ccea7" },
                  { value: "Potencial Cliente", label: "Potencial Cliente", color: "#eac23d" },
                  { value: "Decisor", label: "Decisor", color: "#07abde" },
                  { value: "Influenciador", label: "Influenciador", color: "#8c8cd4" },
                  { value: "Técnico", label: "Técnico", color: "#4e6987" },
                  { value: "Financeiro", label: "Financeiro", color: "#ff8c76" },
                ]} />
                <EditableField key="ctNotes" label="OBSERVAÇÕES" value={contact.notes} fieldType="textarea" onChange={(v) => onUpdateContact(contact.id, "notes", v)} />
              </DraggableFieldGrid>
              <div className="my-[12px]"><div className="bg-[#dde3ec] h-[1.5px] rounded-[11px] w-full" /></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Informações do Contato ── */}
        <SectionHeader title="Informações do Contato" expanded={expandedSections.info} onToggle={() => toggleSection("info")} />
        <AnimatePresence initial={false}>
          {expandedSections.info && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
              <DraggableFieldGrid storageKey={`ct-audit-${contact.id}`} columns={1} gap={2} className="py-[4px]">
                <EditableField key="ctUpdAt" label="ÚLTIMA ATUALIZAÇÃO" value={contact.updatedAt} editable={false} />
                <EditableField key="ctCrAt" label="CRIADO EM" value={contact.createdAt} editable={false} />
                <EditableField key="ctUpdBy" label="ÚLTIMA ATUALIZAÇÃO POR" value={contact.updatedBy} fieldType="user" avatar={imgAvatar} editable={false} />
                <EditableField key="ctCrBy" label="CRIADO POR" value={contact.createdBy} fieldType="user" avatar={imgAvatar} editable={false} />
              </DraggableFieldGrid>
              <div className="my-[12px]"><div className="bg-[#dde3ec] h-[1.5px] rounded-[11px] w-full" /></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Informações do Sistema ── */}
        <SectionHeader title="Informações do Sistema" expanded={expandedSections.sistema} onToggle={() => toggleSection("sistema")} />
        <AnimatePresence initial={false}>
          {expandedSections.sistema && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
              <DraggableFieldGrid storageKey={`ct-sys-${contact.id}`} columns={1} gap={2} className="py-[4px]">
                <EditableField key="ctSysId" label="ID DO REGISTRO" value={contact.id} fieldType="id" />
                <EditableField key="ctSysLastView" label="ÚLTIMA VISUALIZAÇÃO" value={contact.lastViewedDate} editable={false} />
                <EditableField key="ctSysLastRef" label="ÚLTIMA REFERÊNCIA" value={contact.lastReferencedDate} editable={false} />
                <EditableField key="ctSysDeleted" label="NA LIXEIRA" value={contact.isDeleted} fieldType="boolean" editable={false} />
                <EditableField key="ctSysModstamp" label="SYSTEM MODSTAMP" value={contact.systemModstamp} editable={false} />
              </DraggableFieldGrid>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </FieldDndProvider>
    </div>
  );
}

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-[15px] w-full py-[8px] cursor-pointer group hover:opacity-80 transition-opacity"
    >
      <motion.div
        animate={{ rotate: expanded ? 0 : -90 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <CaretDown size={18} weight="bold" className="text-[#28415c]" />
      </motion.div>
      <p
        className="text-[#28415c]"
        style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {title}
      </p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmContacts() {
  const { query: globalSearch } = useCrmSearch();
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [loading, setLoading] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* ── Load from Supabase ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        /* Fetch contacts + accounts in parallel */
        const [dbRows, acctRows] = await Promise.all([
          listContacts(),
          listAccounts(),
        ]);
        if (cancelled) return;

        const acctMap = Object.fromEntries(
          acctRows.map((a: any) => [a.id, a.name]),
        );

        if (dbRows.length === 0) {
          /* DB empty — keep mock data, seed in background */
          const companyToAccountId: Record<string, string> = {
            "Empresa Alpha": "AC-0EA1",
            "Beta Solutions": "AC-C3D4",
            "XPTO Company": "AC-A1B2",
            "Delta Tech": "AC-G7H8",
            "Epsilon Ltda": "AC-J9K1",
            "Gamma Corp": "AC-E5F6",
            "Zeta Inc": "AC-L2M3",
            "Theta SA": "AC-N4P5",
            "Iota Group": "AC-Q6R7",
            "Kappa Digital": "AC-S8T9",
            "Lambda Media": "AC-LM01",
            "Mu Design": "AC-MD02",
          };

          const accountSeedRows = Object.entries(companyToAccountId).map(
            ([name, acId]) => ({
              id: acId,
              name,
              type: "empresa",
              stage: "prospeccao",
              owner: "Joao Silva",
            }),
          );

          const seedRows = mockContacts.map((c) => ({
            id: c.id, name: c.name, last_name: c.lastName, role: c.role,
            department: c.department,
            company: companyToAccountId[c.company] ?? null,
            phone: c.phone,
            mobile: c.mobile, email: c.email, linkedin: c.linkedin,
            website: c.website, address: c.address,
            stage: c.stage, owner: c.owner, origin: c.origin,
            birth_date: c.birthDate || null, cpf: c.cpf,
            preferred_contact: c.preferredContact,
            do_not_contact: c.doNotContact === "Sim",
            tags: c.tags, notes: c.notes,
            account: companyToAccountId[c.company] ?? null,
            last_activity_date: c.lastActivityDate || null,
            comments: c.comments, calls: c.calls,
            avatar: c.avatar || null,
            created_by: c.createdBy, updated_by: c.updatedBy,
          }));

          /* Seed in background — UI already shows mock data */
          seedCrmData({
            crm_accounts: accountSeedRows,
            crm_contacts: seedRows,
          }).catch((err) => console.warn("Background seed error:", err));

          return;
        }

        /* Data exists — map account IDs → names */
        setContacts(dbRows.map((r) => {
          const mapped = dbContactToFrontend(r);
          mapped.company = acctMap[r.company] ?? mapped.company;
          return mapped;
        }));
      } catch (err) {
        console.warn("Could not load contacts from server, using local data:", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Filter state ── */
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterSubField, setFilterSubField] = useState<FilterField | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  /* ── Table state ── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);

  /* ── Filter + search ── */
  const afterFilters = activeFilters.length > 0
    ? contacts.filter((c) => activeFilters.every((f) => c[f.field] === f.value))
    : contacts;

  const combinedSearch = globalSearch || search;
  const filteredContacts = combinedSearch
    ? afterFilters.filter(
        (c) => {
          const q = combinedSearch.toLowerCase();
          return (
            `${c.name} ${c.lastName}`.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q)
          );
        }
      )
    : afterFilters;

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / ROWS_PER_PAGE));
  const paginated = filteredContacts.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const selectedContact = selectedContactId ? contacts.find((c) => c.id === selectedContactId) : null;

  /* ── Filter helpers ── */
  const addFilter = (field: FilterField, value: string) => {
    const exists = activeFilters.some((f) => f.field === field && f.value === value);
    if (!exists) {
      setActiveFilters((prev) => [...prev, { field, value }]);
      setCurrentPage(1);
    }
    setFilterSubField(null);
    setFilterMenuOpen(false);
  };

  const removeFilter = (idx: number) => {
    setActiveFilters((prev) => prev.filter((_, i) => i !== idx));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setCurrentPage(1);
  };

  const isFilterActive = (field: FilterField, value: string) =>
    activeFilters.some((f) => f.field === field && f.value === value);

  /* ── Column resize handlers ── */
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const delta = e.clientX - r.startX;
      const newW = Math.max(MIN_COL_WIDTH, r.startW + delta);
      setColWidths((prev) => {
        const next = [...prev];
        next[r.colIdx] = newW;
        return next;
      });
    };
    const onMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startResize = (colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { colIdx, startX: e.clientX, startW: colWidths[colIdx] };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((c) => c.id)));
    }
  };

  /* ── Close menus on click outside ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
        setFilterSubField(null);
      }
      if (titleMenuRef.current && !titleMenuRef.current.contains(e.target as Node)) setTitleMenuOpen(false);
    };
    if (filterMenuOpen || titleMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterMenuOpen, titleMenuOpen]);

  const handleUpdateContact = (id: string, field: string, value: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#07abde] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando contatos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-[12px] min-h-0 overflow-hidden">
      {/* ═══════ LEFT: MAIN LIST AREA ═══════ */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden min-w-0 transition-all ${selectedContact ? "xl:flex hidden" : "flex"} xl:flex`}>
        {/* ─── Header + Tabs ─── */}
        <div className="bg-[#ffffff] rounded-[16px] p-[16px] pb-[12px] mb-[12px] shrink-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
            {/* Left: title */}
            <div className="relative" ref={titleMenuRef}>
              <div
                onClick={() => setTitleMenuOpen((v) => !v)}
                className={`flex items-center gap-[10px] p-[12px] rounded-[100px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/title ${titleMenuOpen ? "bg-[#f6f7f9]" : ""}`}
              >
                <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#ffedeb] group-hover/title:bg-[#dde3ec] transition-colors">
                  <IdentificationCard size={22} weight="duotone" className="text-[#ff8c76] group-hover/title:text-[#28415c] transition-colors" />
                </div>
                <div className="flex flex-col items-start justify-center">
                  <span
                    className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]"
                    style={fontFeature}
                  >
                    Objeto
                  </span>
                  <div className="flex items-center">
                    <span
                      className="text-[#28415c] text-[19px] font-bold tracking-[-0.5px] leading-[24px]"
                      style={fontFeature}
                    >
                      Contatos
                    </span>
                    <div className={`flex items-center justify-center size-[24px] rounded-full transition-transform ${titleMenuOpen ? "rotate-180" : ""}`}>
                      <CaretDown size={14} weight="bold" className="text-[#28415c]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title dropdown */}
              {titleMenuOpen && (
                <div className="absolute left-0 top-[calc(100%+5px)] z-50 backdrop-blur-[50px] bg-white flex flex-col gap-[6px] items-start p-[12px] rounded-[34px]">
                  <div
                    aria-hidden="true"
                    className="absolute border border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[34px]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                  <button
                    onClick={() => setTitleMenuOpen(false)}
                    className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                  >
                    <div className="flex items-center justify-center shrink-0 w-[44px]"><GearSix size={19} /></div>
                    <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Configuracoes</span>
                  </button>
                  <button
                    onClick={() => setTitleMenuOpen(false)}
                    className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                  >
                    <div className="flex items-center justify-center shrink-0 w-[44px]"><PushPin size={19} /></div>
                    <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Fixar nos Atalhos</span>
                  </button>
                  <button
                    onClick={() => setTitleMenuOpen(false)}
                    className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                  >
                    <div className="flex items-center justify-center shrink-0 w-[44px]"><Info size={19} /></div>
                    <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Contatos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: action buttons */}
            <div className="hidden lg:flex items-center gap-[15px]">
              <div className="flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px]">
                <button className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <LinkIcon size={18} />
                </button>
                <button className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <ArrowSquareDownRight size={18} />
                </button>
                <button className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c]">
                  <Columns size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* + Add Filter button */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => { setFilterMenuOpen((v) => !v); setFilterSubField(null); }}
                className={`relative flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors cursor-pointer ${
                  filterMenuOpen ? "bg-[#28415c] text-white" : "bg-[#dcf0ff] text-[#28415c] hover:bg-[#cce7fb]"
                }`}
              >
                <Plus size={16} weight="bold" />
              </button>

              {/* Filter dropdown */}
              {filterMenuOpen && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-50 backdrop-blur-[50px] bg-white flex flex-col gap-[2px] items-start p-[8px] rounded-[20px] min-w-[200px]">
                  <div
                    aria-hidden="true"
                    className="absolute border-[1.4px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />

                  {!filterSubField ? (
                    <>
                      <div className="px-[12px] pt-[6px] pb-[4px]">
                        <span
                          className="text-[#98989d] uppercase"
                          style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                        >
                          Adicionar Filtro
                        </span>
                      </div>
                      {FILTER_OPTIONS.map((opt) => (
                        <button
                          key={opt.field}
                          onClick={() => setFilterSubField(opt.field)}
                          className="relative flex gap-[4px] items-center justify-between pr-[12px] py-[6px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c] transition-colors w-full cursor-pointer"
                        >
                          <div className="flex items-center gap-[4px]">
                            <div className="flex items-center justify-center shrink-0 w-[28px]">
                              <Funnel size={12} />
                            </div>
                            <span
                              className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap"
                              style={{ fontWeight: 500, ...fontFeature }}
                            >
                              {opt.label}
                            </span>
                          </div>
                          <CaretRight size={10} weight="bold" className="text-[#98989d]" />
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setFilterSubField(null)}
                        className="relative flex gap-[4px] items-center py-[6px] rounded-[100px] text-[#28415c] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                      >
                        <div className="flex items-center justify-center shrink-0 w-[28px]">
                          <CaretLeft size={12} weight="bold" />
                        </div>
                        <span
                          className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap font-bold"
                          style={fontFeature}
                        >
                          {getFilterLabel(filterSubField)}
                        </span>
                      </button>
                      <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full my-[2px]" />
                      {getUniqueValues(contacts, filterSubField).map((val) => {
                        const active = isFilterActive(filterSubField, val);
                        const displayVal = getFilterDisplayValue(filterSubField, val);
                        return (
                          <button
                            key={val}
                            onClick={() => {
                              if (active) {
                                const idx = activeFilters.findIndex((f) => f.field === filterSubField && f.value === val);
                                if (idx >= 0) removeFilter(idx);
                              } else {
                                addFilter(filterSubField, val);
                              }
                            }}
                            className={`relative flex gap-[4px] items-center pr-[12px] py-[6px] rounded-[100px] transition-colors w-full cursor-pointer ${
                              active
                                ? "bg-[#dcf0ff] text-[#28415c]"
                                : "text-[#4e6987] hover:bg-[#f6f7f9] hover:text-[#28415c]"
                            }`}
                          >
                            <div className="flex items-center justify-center shrink-0 w-[28px]">
                              <div className="relative shrink-0 size-[16px]">
                                <div
                                  className={`absolute inset-0 rounded-full border-[1.5px] border-solid transition-colors ${
                                    active ? "border-[#3ccea7] bg-[#3ccea7]" : "border-[#28415c] bg-transparent"
                                  }`}
                                />
                                {active && (
                                  <svg className="absolute inset-0 size-full" viewBox="0 0 16 16" fill="none">
                                    <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span
                              className="text-[11px] tracking-[-0.3px] leading-[16px] whitespace-nowrap"
                              style={{ fontWeight: active ? 700 : 500, ...fontFeature }}
                            >
                              {displayVal}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Active filter pills */}
            {activeFilters.length > 0 && (
              <>
                <VerticalDivider />
                <div className="flex items-center gap-[6px] flex-wrap">
                  {activeFilters.map((f, idx) => {
                    const displayVal = getFilterDisplayValue(f.field, f.value);
                    return (
                      <div
                        key={`${f.field}-${f.value}-${idx}`}
                        className="flex items-center gap-[6px] h-[28px] pl-[12px] pr-[6px] bg-[#dcf0ff] rounded-[500px]"
                      >
                        <span
                          className="text-[#28415c] uppercase whitespace-nowrap"
                          style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                        >
                          {getFilterLabel(f.field)}
                        </span>
                        <span
                          className="text-[#0483AB] whitespace-nowrap"
                          style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                        >
                          {displayVal}
                        </span>
                        <button
                          onClick={() => removeFilter(idx)}
                          className="flex items-center justify-center size-[18px] rounded-full hover:bg-[#28415c] hover:text-white text-[#4e6987] transition-colors cursor-pointer"
                        >
                          <X size={10} weight="bold" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-[4px] h-[28px] px-[12px] rounded-[500px] text-[#98989d] hover:text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
                  >
                    <X size={10} weight="bold" />
                    <span
                      className="uppercase whitespace-nowrap"
                      style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                    >
                      Limpar
                    </span>
                  </button>
                </div>
              </>
            )}

            <VerticalDivider />

            {/* Search */}
            <div className="flex items-center gap-[8px] h-[36px] bg-[#f6f7f9] rounded-[500px] px-[14px] flex-1 min-w-[140px] max-w-[280px]" style={{ border: "1px solid rgba(200,207,219,0.6)" }}>
              <MagnifyingGlass size={16} weight="bold" className="text-[#98989d] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar contato..."
                className="flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb]"
                style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-[#98989d] hover:text-[#28415c]">
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            {(search || activeFilters.length > 0) && (
              <span
                className="flex items-center justify-center h-[22px] min-w-[22px] px-[6px] bg-[#ff8c76] text-white rounded-full"
                style={{ fontSize: 10, fontWeight: 700, ...fontFeature }}
              >
                {filteredContacts.length}
              </span>
            )}
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 flex flex-col bg-white rounded-t-xl overflow-hidden">
              <div className="overflow-x-auto flex-1 flex flex-col min-w-0">
                <div className="w-fit min-w-full">
                  {/* Column Headers */}
                  <div
                    className="grid items-center px-5 pt-2 pb-0"
                    style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
                  >
                    <div />
                    <div className="flex items-center justify-center">
                      <CircleCheckbox
                        checked={paginated.length > 0 && selectedIds.size === paginated.length}
                        onChange={toggleSelectAll}
                      />
                    </div>
                    {COL_HEADERS.map((col, idx) => (
                      <div key={col} className="flex items-center h-[32px] relative cursor-pointer group/hdr">
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c] whitespace-nowrap leading-[20px]"
                          style={fontFeature}
                        >
                          {col}
                        </span>
                        {idx < COL_HEADERS.length && (
                          <div
                            className="absolute right-[-5px] top-0 bottom-0 w-[10px] z-10 flex items-center justify-center cursor-col-resize group/resize"
                            onMouseDown={(e) => startResize(idx, e)}
                          >
                            <div className="w-[1.5px] h-[20px] rounded-full bg-[#DDE3EC] transition-colors group-hover/resize:bg-[#0483AB] group-hover/resize:h-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Table rows */}
                  <div className="flex flex-col mt-1">
                    {paginated.map((contact, idx) => {
                      const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                      const isSelected = selectedIds.has(contact.id);
                      const sc = stageConfig[contact.stage];

                      return (
                        <div key={contact.id}>
                          <HorizontalDivider />
                          <div
                            onClick={() => setSelectedContactId(contact.id)}
                            className={`grid items-center h-[34px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                              selectedContactId === contact.id
                                ? "bg-[#f6f7f9]"
                                : isSelected
                                ? "bg-[#f6f7f9]"
                                : "hover:bg-[#f6f7f9]"
                            }`}
                            style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
                          >
                            <div
                              className="text-right text-[#28415c]"
                              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                            >
                              {rowNum}
                            </div>
                            <div className="flex items-center justify-center">
                              <CircleCheckbox
                                checked={isSelected}
                                onChange={() => toggleSelect(contact.id)}
                              />
                            </div>
                            {/* Nome */}
                            <div className="flex items-center gap-[6px] truncate">
                              <img
                                alt=""
                                className="shrink-0 size-[18px] rounded-full object-cover"
                                src={contact.avatar || imgAvatar}
                              />
                              <span
                                className="truncate text-[#07abde]"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                              >
                                {`${contact.name} ${contact.lastName}`.trim()}
                              </span>
                            </div>
                            {/* Cargo */}
                            <div
                              className="truncate text-[#28415c]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {contact.role}
                            </div>
                            {/* Empresa */}
                            <div
                              className="truncate text-[#28415c]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {contact.company}
                            </div>
                            {/* Estagio */}
                            <div
                              className="truncate"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, color: sc.color, ...fontFeature }}
                            >
                              {sc.label}
                            </div>
                            {/* Proprietario */}
                            <div className="flex items-center gap-[8px] truncate">
                              <img
                                alt=""
                                className="shrink-0 size-[18px] rounded-full object-cover"
                                src={imgAvatar}
                              />
                              <span
                                className="truncate text-[#07abde]"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                              >
                                {contact.owner}
                              </span>
                            </div>
                            {/* Ultima Atividade */}
                            <div
                              className="truncate text-[#28415c]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {formatRelativeDate(contact.lastActivityDate)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                {paginated.length === 0 && (
                  <>
                    <HorizontalDivider />
                    <div className="flex flex-col items-center justify-center py-[48px] gap-[12px]">
                      <Funnel size={32} weight="duotone" className="text-[#c8cfdb]" />
                      <span className="text-[#98989d]" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                        Nenhum contato encontrado
                      </span>
                    </div>
                  </>
                )}
                    <HorizontalDivider />
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {filteredContacts.length > ROWS_PER_PAGE && (
              <div className="flex items-center gap-2 py-4 bg-white rounded-b-xl px-5 border-t-0">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
                <div className="flex items-center gap-0.5 ml-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors ${
                        page === currentPage
                          ? "bg-[#28415C] text-white"
                          : "text-[#28415C] hover:bg-[#F6F7F9]"
                      }`}
                      style={{ fontSize: 12, fontWeight: page === currentPage ? 700 : 500, ...fontFeature }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
      </div>

      {/* ═══════ RIGHT: DETAIL SIDE PANEL ═══════ */}
      <AnimatePresence mode="wait">
        {selectedContact && (
          <motion.div
            key={selectedContact.id}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[320px] h-full">
              <ContactDetailPanel
                contact={selectedContact}
                onClose={() => setSelectedContactId(null)}
                onUpdateContact={handleUpdateContact}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}