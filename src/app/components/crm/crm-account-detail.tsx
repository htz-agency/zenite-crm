import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Building,
  CaretDown,
  CaretRight,
  X,
  Tag,
  ClockCounterClockwise,
  PencilSimple,
  Trash,
  Link as LinkIcon,
  CopySimple,
  Phone,
  Envelope,
  ChatCircle,
  CalendarBlank,
  CheckCircle,
  NoteBlank,
  Plus,
  FunnelSimple,
  GearSix,
  ListBullets,
  ArrowSquareDownRight,
  MagnifyingGlass,
  Files,
  FediverseLogo,
  Crosshair,
  ListChecks,
  Globe,
  IdentificationCard,
  SketchLogo,
  CircleNotch,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";
import { EditableField } from "./editable-field";
import { useMultitask } from "../multitask-context";
import { useCrmSearch } from "./crm-search-context";
import type { FormulaContext } from "./formula-engine";
import {
  recordChange,
  getLastChangeDate,
  seedInitialValue,
  getEntityHistory,
  type FieldHistoryEntry,
} from "./field-history";
import { getAccount, patchAccount as patchAccApi, generateCrmId, listOpportunities, dbOpToFrontend, listContacts } from "./crm-api";
import { toast } from "sonner";
import { DraggableFieldGrid, FieldDndProvider } from "./draggable-field-grid";
import { getFieldOptions, getFieldType } from "./crm-field-config";
import { useCustomFields } from "./use-custom-fields";
import { useFieldVisibility } from "./use-field-visibility";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

type AccountStage = "prospeccao" | "implementacao" | "onboarding" | "vigente" | "finalizado";
type AccountType = "empresa" | "pessoal";
type AccountTab = "detalhes" | "contatos" | "oportunidades" | "contrato" | "relacionado";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

interface AccountData {
  id: string;
  name: string;
  type: AccountType;
  stage: AccountStage;
  owner: string;
  lastActivity: string;
  labels: { text: string; bg: string; color: string }[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // Empresa fields
  accountNumber: string;
  sector: string;
  website: string;
  phone: string;
  fax: string;
  cnpj: string;
  description: string;
  annualRevenue: number;
  employees: number;
  ownership: string;
  parentAccount: string;
  partnerAccount: string;
  origin: string;
  rating: string;
  accountSite: string;
  currency: string;
  sicCode: string;
  ticker: string;
  accountType: string;
  // Billing address
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingZip: string;
  // Shipping address
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  shippingZip: string;
  // Pessoal fields
  firstName: string;
  lastName: string;
  email: string;
  personalPhone: string;
  birthDate: string;
  cpf: string;
  personalStreet: string;
  personalCity: string;
  personalState: string;
  personalCountry: string;
  personalZip: string;
  // ── Extended fields (matching Lead/Op pattern) ──
  tags: string;
  notes: string;
  preferredContact: string;
  doNotContact: string;
  lastActivityDate: string;
  // ── Marketing fields ──
  mktCampanha: string;
  mktGrupoAnuncios: string;
  mktAnuncio: string;
  mktUltimaConversao: string;
  mktCanal: string;
  // ── System fields ──
  isDeleted: string;
  lastViewedDate: string;
  lastReferencedDate: string;
  systemModstamp: string;
}

interface Activity {
  id: string;
  type: "compromisso" | "tarefa" | "ligacao" | "nota" | "mensagem" | "email";
  label: string;
  date: string;
  group: string;
}

interface CallRecord {
  id: string;
  phone: string;
  date: string;
  avatarUrl: string;
}

const STAGES: { key: AccountStage; label: string; icon: React.ComponentType<any> }[] = [
  { key: "prospeccao", label: "PROSPECÇÃO", icon: Crosshair },
  { key: "implementacao", label: "IMPLEMENTAÇÃO", icon: GearSix },
  { key: "onboarding", label: "ONBOARDING", icon: ListChecks },
  { key: "vigente", label: "VIGENTE", icon: Globe },
  { key: "finalizado", label: "FINALIZADO", icon: CheckCircle },
];

const TABS: { key: AccountTab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "detalhes", label: "Detalhes", icon: ListBullets },
  { key: "contatos", label: "Contatos", icon: IdentificationCard },
  { key: "oportunidades", label: "Oportunidades", icon: SketchLogo },
  { key: "contrato", label: "Contrato", icon: Files },
  { key: "relacionado", label: "Vínculos", icon: LinkIcon },
];

const activityConfig: Record<Activity["type"], { icon: React.ComponentType<any>; bg: string; color: string }> = {
  compromisso: { icon: CalendarBlank, bg: "#FFEDEB", color: "#FF8C76" },
  tarefa: { icon: CheckCircle, bg: "#E8E8FD", color: "#8C8CD4" },
  ligacao: { icon: Phone, bg: "#D9F8EF", color: "#3CCEA7" },
  nota: { icon: NoteBlank, bg: "#FEEDCA", color: "#EAC23D" },
  mensagem: { icon: ChatCircle, bg: "#DCF0FF", color: "#07ABDE" },
  email: { icon: Envelope, bg: "#DDE3EC", color: "#4E6987" },
};

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

/** Empty account – used as initial state before DB fetch. No fake data. */
const emptyAccount: AccountData = {
  id: "",
  name: "",
  type: "empresa",
  stage: "prospeccao",
  owner: "",
  lastActivity: "",
  labels: [],
  createdAt: "",
  updatedAt: "",
  createdBy: "",
  updatedBy: "",
  accountNumber: "",
  sector: "",
  website: "",
  phone: "",
  fax: "",
  cnpj: "",
  description: "",
  annualRevenue: 0,
  employees: 0,
  ownership: "",
  parentAccount: "",
  partnerAccount: "",
  origin: "",
  rating: "",
  accountSite: "",
  currency: "BRL",
  sicCode: "",
  ticker: "",
  accountType: "",
  billingStreet: "",
  billingCity: "",
  billingState: "",
  billingCountry: "",
  billingZip: "",
  shippingStreet: "",
  shippingCity: "",
  shippingState: "",
  shippingCountry: "",
  shippingZip: "",
  firstName: "",
  lastName: "",
  email: "",
  personalPhone: "",
  birthDate: "",
  cpf: "",
  personalStreet: "",
  personalCity: "",
  personalState: "",
  personalCountry: "",
  personalZip: "",
  tags: "",
  notes: "",
  preferredContact: "",
  doNotContact: "false",
  lastActivityDate: "",
  mktCampanha: "",
  mktGrupoAnuncios: "",
  mktAnuncio: "",
  mktUltimaConversao: "",
  mktCanal: "",
  isDeleted: "false",
  lastViewedDate: "",
  lastReferencedDate: "",
  systemModstamp: "",
};

const mockActivities: Activity[] = [
  { id: "a1", type: "compromisso", label: "Reunião de acompanhamento", date: "04/02/2026 14:00", group: "FEVEREIRO" },
  { id: "a2", type: "tarefa", label: "Enviar relatório mensal", date: "01/02/2026 09:30", group: "FEVEREIRO" },
  { id: "a3", type: "ligacao", label: "Ligação de follow-up", date: "28/01/2026 11:00", group: "JANEIRO" },
  { id: "a4", type: "nota", label: "Nota sobre expansão", date: "20/01/2026 16:00", group: "JANEIRO" },
  { id: "a5", type: "email", label: "Proposta enviada", date: "15/01/2026 10:00", group: "JANEIRO" },
  { id: "a6", type: "mensagem", label: "Mensagem de boas-vindas", date: "10/01/2026 09:00", group: "JANEIRO" },
];

const mockCalls: CallRecord[] = [
  { id: "c1", phone: "+55 11 3456-7890", date: "04/02/2026 14:30", avatarUrl: "" },
  { id: "c2", phone: "+55 11 3456-7890", date: "28/01/2026 11:00", avatarUrl: "" },
  { id: "c3", phone: "+55 11 3456-7890", date: "15/01/2026 16:00", avatarUrl: "" },
  { id: "c4", phone: "+55 11 98765-4321", date: "10/01/2026 09:00", avatarUrl: "" },
];

const mockContacts = [
  { id: "CT-A1B2", name: "Ana Carolina", role: "Diretora de Marketing", email: "ana@xpto.com.br", phone: "+55 11 99999-0001" },
  { id: "CT-C3D4", name: "Bruno Mendes", role: "CEO", email: "bruno@xpto.com.br", phone: "+55 11 99999-0002" },
  { id: "CT-E5F6", name: "Daniela Souza", role: "Head de Vendas", email: "daniela@xpto.com.br", phone: "+55 11 99999-0003" },
  { id: "CT-G7H8", name: "Eduardo Lima", role: "CTO", email: "eduardo@xpto.com.br", phone: "+55 11 99999-0004" },
];

const mockOpportunities = [
  { id: "OP-A1B2", name: "Projeto Alpha", value: 120000, stage: "negociacao" as const, owner: "João Silva" },
  { id: "OP-C3D4", name: "Rebrand Institucional", value: 85000, stage: "proposta" as const, owner: "Maria Oliveira" },
  { id: "OP-E5F6", name: "Performance Q1", value: 34000, stage: "ganho" as const, owner: "Pedro Costa" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ------------------------------------------------------------------ */
/*  Small reusable components                                          */
/* ------------------------------------------------------------------ */

function VerticalDivider() {
  return (
    <div className="flex h-[20px] items-center justify-center shrink-0 w-[1.5px]">
      <svg className="block w-[1.5px] h-[20px]" fill="none" viewBox="0 0 1.5 20">
        <line stroke="#DDE3EC" strokeLinecap="round" strokeWidth="1.5" x1="0.75" y1="0.75" x2="0.75" y2="19.25" />
      </svg>
    </div>
  );
}

function HorizontalDivider() {
  return (
    <div className="h-0 relative w-full">
      <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 725 1.5">
        <line stroke="#DDE3EC" strokeWidth="1.5" x2="725" y1="0.75" y2="0.75" />
      </svg>
    </div>
  );
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#DCF0FF] active:bg-[#07abde] active:text-[#f6f7f9] transition-colors text-[#28415c] cursor-pointer"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline Control                                                   */
/* ------------------------------------------------------------------ */

function PipelineControl({ stage, onStageChange }: { stage: AccountStage; onStageChange: (s: AccountStage) => void }) {
  const activeIdx = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip relative">
      {STAGES.map((s, idx) => {
        const isActive = s.key === stage;
        const isPast = idx < activeIdx;
        return (
          <button
            key={s.key}
            onClick={() => onStageChange(s.key)}
            className={`group/stage flex-1 h-[36px] rounded-[20px] flex items-center justify-center transition-all duration-200 relative cursor-pointer z-[1] ${
              isActive
                ? "cursor-default"
                : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="account-pipeline-active"
                className="absolute inset-0 bg-[#28415C] rounded-[20px]"
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                style={{
                  border: "0.5px solid rgba(200,207,219,0.6)",
                  boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                }}
              />
            )}
            {isPast ? (
              <div className="relative z-[1] flex items-center justify-center">
                <CheckCircle
                  size={16}
                  weight="bold"
                  className="text-[#3CCEA7] transition-opacity duration-200 opacity-100 group-hover/stage:opacity-0 absolute"
                />
                <span
                  className="opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200 uppercase whitespace-nowrap"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {s.label}
                </span>
              </div>
            ) : (
              <span
                className={`relative z-[1] uppercase whitespace-nowrap ${isActive ? "text-[#f6f7f9]" : ""}`}
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
              >
                {s.label}
              </span>
            )}
          </button>
        );
      })}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] z-[2]"
        style={{
          boxShadow:
            "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Item                                                      */
/* ------------------------------------------------------------------ */

function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;
  return (
    <div className="flex gap-[4px] items-center px-[12px] py-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors w-full">
      <button className="flex items-center justify-center size-[28px] shrink-0 text-[#4e6987] cursor-pointer rounded-full hover:bg-[#dde3ec] transition-colors">
        <CaretRight size={14} weight="bold" />
      </button>
      <div
        className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={17} weight="duotone" style={{ color: config.color }} />
      </div>
      <span
        className="text-[#4e6987] flex-1"
        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {activity.label}
      </span>
      <span
        className="text-[#4e6987] text-right shrink-0"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
      >
        {activity.date}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Toggle                                                     */
/* ------------------------------------------------------------------ */

function SectionToggle({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-[15px] cursor-pointer py-[4px] group/section"
      >
        <div className="flex items-center justify-center size-[24px] text-[#28415c]">
          {expanded ? <CaretDown size={18} weight="bold" /> : <CaretRight size={18} weight="bold" />}
        </div>
        <span
          className="text-[#28415c]"
          style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {title}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Call Log Panel                                                     */
/* ------------------------------------------------------------------ */

function CallLogPanel({ calls }: { calls: CallRecord[] }) {
  const [callTab, setCallTab] = useState<"feitas" | "recebidas" | "perdidas">("feitas");

  return (
    <div className="flex flex-col h-full">
      <div className="p-[12px] pb-0">
        <div
          className="flex gap-[4px] h-[44px] items-center justify-center overflow-hidden p-[4px] rounded-[100px] bg-[#f6f7f9] relative"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          {(["feitas", "recebidas", "perdidas"] as const).map((tab) => {
            const isActive = callTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setCallTab(tab)}
                className={`flex-1 h-[36px] flex items-center justify-center rounded-[20px] cursor-pointer transition-colors duration-200 relative z-[1] ${
                  isActive ? "" : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="acct-call-tab"
                    className="absolute inset-0 bg-[#28415C] rounded-[20px]"
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                    style={{
                      border: "0.5px solid rgba(200,207,219,0.6)",
                      boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                    }}
                  />
                )}
                <span
                  className={`relative z-[1] uppercase ${isActive ? "text-[#f6f7f9]" : ""}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-[6px] px-[20px] py-[12px]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#d9f8ef] shrink-0">
            <Phone size={17} weight="duotone" className="text-[#3ccea7]" />
          </div>
          <span
            className="text-[#4e6987]"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            Ligações
          </span>
          <CaretDown size={14} weight="bold" className="text-[#4e6987] shrink-0" />
        </div>
        <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
          <MagnifyingGlass size={17} weight="duotone" />
        </button>
        <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
          <FunnelSimple size={17} weight="duotone" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-[4px]">
        <div className="flex flex-col">
          {calls.map((call) => (
            <div key={call.id} className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
              <button className="flex items-center justify-center size-[28px] shrink-0 text-[#4e6987] cursor-pointer rounded-full hover:bg-[#dde3ec] transition-colors">
                <CaretRight size={14} weight="bold" />
              </button>
              <div className="relative shrink-0 size-[35px]">
                <img alt="" className="block size-full rounded-full object-cover" src={imgAvatar} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span
                  className="text-[#4e6987] truncate"
                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                >
                  {call.phone}
                </span>
                <span
                  className="text-[#4e6987] uppercase"
                  style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {call.date}
                </span>
              </div>
              <button className="flex items-center justify-center size-[28px] shrink-0 text-[#28415c] cursor-pointer rounded-full hover:bg-[#dde3ec] transition-colors">
                <Phone size={17} weight="duotone" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-[16px] flex justify-center">
        <button className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors">
          <Phone size={16} weight="bold" />
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
            Fazer uma ligação
          </span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Panel                                                     */
/* ------------------------------------------------------------------ */

function ActivityPanel({ activities }: { activities: Activity[] }) {
  const [activityTab, setActivityTab] = useState<"feed" | "engajamento">("feed");

  const grouped: { group: string; items: Activity[] }[] = [];
  activities.forEach((a) => {
    const existing = grouped.find((g) => g.group === a.group);
    if (existing) existing.items.push(a);
    else grouped.push({ group: a.group, items: [a] });
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-[12px] pb-0">
        <div
          className="flex gap-[4px] h-[44px] items-center justify-center overflow-hidden p-[4px] rounded-[100px] bg-[#f6f7f9] relative"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          {(["feed", "engajamento"] as const).map((tab) => {
            const isActive = activityTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActivityTab(tab)}
                className={`flex-1 h-[36px] flex items-center justify-center gap-[3px] rounded-[20px] cursor-pointer transition-colors duration-200 relative z-[1] ${
                  isActive ? "" : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="acct-activity-tab"
                    className="absolute inset-0 bg-[#28415C] rounded-[20px]"
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                    style={{
                      border: "0.5px solid rgba(200,207,219,0.6)",
                      boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                    }}
                  />
                )}
                {tab === "feed" && (
                  <ListBullets size={15} weight={isActive ? "fill" : "duotone"} className={`relative z-[1] ${isActive ? "text-[#f6f7f9]" : ""}`} />
                )}
                {tab === "engajamento" && (
                  <FunnelSimple size={15} weight={isActive ? "fill" : "duotone"} className={`relative z-[1] ${isActive ? "text-[#f6f7f9]" : ""}`} />
                )}
                <span
                  className={`relative z-[1] uppercase ${isActive ? "text-[#f6f7f9]" : ""}`}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-[6px] px-[20px] py-[12px]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center justify-center size-[28px] rounded-[8px] bg-[#dde3ec] shrink-0">
            <ListBullets size={17} weight="duotone" className="text-[#4e6987]" />
          </div>
          <span
            className="text-[#4e6987]"
            style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            Atividades
          </span>
          <CaretDown size={14} weight="bold" className="text-[#4e6987] shrink-0" />
        </div>
        <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
          <FunnelSimple size={17} weight="duotone" />
        </button>
        <button className="flex items-center justify-center size-[28px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer">
          <GearSix size={17} weight="duotone" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-[4px]">
        <div className="flex flex-col gap-[4px] items-center">
          {grouped.map((group) => (
            <div key={group.group} className="w-full flex flex-col gap-[4px] items-center">
              <span
                className="text-[#64676c] uppercase text-center"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
              >
                {group.group}
              </span>
              {group.items.map((a) => (
                <ActivityItem key={a.id} activity={a} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="p-[16px] flex justify-center">
        <button className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors">
          <Plus size={16} weight="bold" />
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
            Adicionar atividade
          </span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Detalhes (unificado — Empresa / Pessoal)                      */
/* ------------------------------------------------------------------ */

function TabDetalhes({
  account,
  stage,
  fieldHistoryEntries,
  accountType,
  onAccountTypeChange,
  onFieldChange,
  customFields,
  customValues,
  onCustomFieldChange,
  isVisible,
}: {
  account: AccountData;
  stage: AccountStage;
  fieldHistoryEntries: FieldHistoryEntry[];
  accountType: AccountType;
  onAccountTypeChange: (t: AccountType) => void;
  onFieldChange?: (fieldKey: string, value: string) => void;
  customFields?: { key: string; label: string; fieldType: string; options?: { value: string; label: string; color: string }[] }[];
  customValues?: Record<string, string>;
  onCustomFieldChange?: (key: string, value: string) => void;
  isVisible?: (key: string) => boolean;
  getLabel?: (key: string) => string;
  isRequired?: (key: string) => boolean;
}) {
  const fv = isVisible ?? (() => true);
  const fl = getLabel ?? ((k: string) => k.toUpperCase());
  const rq = isRequired ?? (() => false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [addressBillingOpen, setAddressBillingOpen] = useState(true);
  const [addressShippingOpen, setAddressShippingOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(true);
  const [relationOpen, setRelationOpen] = useState(true);
  const [complementarOpen, setComplementarOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);

  const formulaCtx: FormulaContext = {
    lastActivityDate: account.lastActivityDate,
    annualRevenue: String(account.annualRevenue),
    employeeCount: String(account.employees),
    stageLastChangedAt: account.updatedAt,
    stage,
  };

  const handleTypeChange = (val: string) => {
    if (val === "Empresa" || val === "Pessoal") {
      onAccountTypeChange(val === "Empresa" ? "empresa" : "pessoal");
    }
  };

  const typeLabel = accountType === "empresa" ? "Empresa" : "Pessoal";

  return (
    <FieldDndProvider>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
      {/* COL 1-2: Dados da Conta / Dados Pessoais */}
      <div className="lg:col-span-2 flex flex-col gap-[16px]">
        <SectionToggle title={accountType === "empresa" ? "Dados da Conta" : "Dados Pessoais"} expanded={detailsOpen} onToggle={() => setDetailsOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <div className="grid grid-cols-2 gap-[12px] mb-[12px]">
              <EditableField
                label="TIPO DE CONTA"
                value={typeLabel}
                onChange={handleTypeChange}
                fieldType={getFieldType("conta", "ac_type_conta", "type")}
                highlighted
                options={getFieldOptions("conta", "ac_type_conta")}
              />
            </div>

              {accountType === "empresa" ? (
                <DraggableFieldGrid storageKey={`acc-emp-${account.id}`} columns={2}>
                  {fv("ac_name") && <EditableField key="accName" label={fl("ac_name")} required={rq("ac_name")} value={account.name} onChange={(val) => onFieldChange?.("name", val)} />}
                  {fv("ac_account_number") && <EditableField key="accNumber" label={fl("ac_account_number")} required={rq("ac_account_number")} value={account.accountNumber} onChange={(val) => onFieldChange?.("accountNumber", val)} />}
                  {fv("ac_owner") && <EditableField key="accOwner" label={fl("ac_owner")} required={rq("ac_owner")} value={account.owner} fieldType="user" avatar={imgAvatar} onChange={(val) => onFieldChange?.("owner", val)} />}
                  {fv("ac_type") && <EditableField
                    key="accType"
                    label={fl("ac_type")}
                    required={rq("ac_type")}
                    value={account.accountType}
                    fieldType={getFieldType("conta", "ac_type", "type")}
                    highlighted
                    onChange={(val) => onFieldChange?.("accountType", val)}
                    options={getFieldOptions("conta", "ac_type")}
                  />}
                  {fv("ac_sector") && <EditableField key="accSector" label={fl("ac_sector")} required={rq("ac_sector")} value={account.sector} fieldType={getFieldType("conta", "ac_sector", "type")} onChange={(val) => onFieldChange?.("sector", val)} options={getFieldOptions("conta", "ac_sector")} />}
                  {fv("ac_website") && <EditableField key="accWebsite" label={fl("ac_website")} required={rq("ac_website")} value={account.website} fieldType="link" onChange={(val) => onFieldChange?.("website", val)} />}
                  {fv("ac_phone") && <EditableField key="accPhone" label={fl("ac_phone")} required={rq("ac_phone")} value={account.phone} fieldType="phone" onChange={(val) => onFieldChange?.("phone", val)} />}
                  {fv("ac_fax") && <EditableField key="accFax" label={fl("ac_fax")} required={rq("ac_fax")} value={account.fax} onChange={(val) => onFieldChange?.("fax", val)} />}
                  {fv("ac_cnpj") && <EditableField key="accCnpj" label={fl("ac_cnpj")} required={rq("ac_cnpj")} value={account.cnpj} onChange={(val) => onFieldChange?.("cnpj", val)} />}
                  {fv("ac_site") && <EditableField key="accSite" label={fl("ac_site")} required={rq("ac_site")} value={account.accountSite} fieldType={getFieldType("conta", "ac_site", "type")} onChange={(val) => onFieldChange?.("accountSite", val)} options={getFieldOptions("conta", "ac_site")} />}
                  {fv("ac_origin") && <EditableField
                    key="accOrigin"
                    label={fl("ac_origin")}
                    required={rq("ac_origin")}
                    value={account.origin}
                    fieldType={getFieldType("conta", "ac_origin", "type")}
                    onChange={(val) => onFieldChange?.("origin", val)}
                    options={getFieldOptions("conta", "ac_origin")}
                  />}
                  {fv("ac_preferred_contact") && <EditableField
                    key="accPrefContact"
                    label={fl("ac_preferred_contact")}
                    required={rq("ac_preferred_contact")}
                    value={account.preferredContact}
                    fieldType={getFieldType("conta", "ac_preferred_contact", "combobox")}
                    onChange={(val) => onFieldChange?.("preferredContact", val)}
                    options={getFieldOptions("conta", "ac_preferred_contact")}
                  />}
                  {fv("ac_do_not_contact") && <EditableField key="accDnc" label={fl("ac_do_not_contact")} required={rq("ac_do_not_contact")} value={account.doNotContact} fieldType="boolean" onChange={(val) => onFieldChange?.("doNotContact", val)} />}
                </DraggableFieldGrid>
              ) : (
                <DraggableFieldGrid storageKey={`acc-pes-${account.id}`} columns={2}>
                  {fv("ac_first_name") && <EditableField key="pFirstName" label={fl("ac_first_name")} required={rq("ac_first_name")} value={account.firstName} onChange={(val) => onFieldChange?.("firstName", val)} />}
                  {fv("ac_last_name") && <EditableField key="pLastName" label={fl("ac_last_name")} required={rq("ac_last_name")} value={account.lastName} onChange={(val) => onFieldChange?.("lastName", val)} />}
                  {fv("ac_email") && <EditableField key="pEmail" label={fl("ac_email")} required={rq("ac_email")} value={account.email} fieldType="email" onChange={(val) => onFieldChange?.("email", val)} />}
                  {fv("ac_personal_phone") && <EditableField key="pPhone" label={fl("ac_personal_phone")} required={rq("ac_personal_phone")} value={account.personalPhone} fieldType="phone" onChange={(val) => onFieldChange?.("personalPhone", val)} />}
                  {fv("ac_birth_date") && <EditableField key="pBirthDate" label={fl("ac_birth_date")} required={rq("ac_birth_date")} value={account.birthDate} fieldType="date" onChange={(val) => onFieldChange?.("birthDate", val)} />}
                  {fv("ac_cpf") && <EditableField key="pCpf" label={fl("ac_cpf")} required={rq("ac_cpf")} value={account.cpf} onChange={(val) => onFieldChange?.("cpf", val)} />}
                  {fv("ac_owner") && <EditableField key="pOwner" label={fl("ac_owner")} required={rq("ac_owner")} value={account.owner} fieldType="user" avatar={imgAvatar} onChange={(val) => onFieldChange?.("owner", val)} />}
                  {fv("ac_rating") && <EditableField
                    key="pRating"
                    label={fl("ac_rating")}
                    required={rq("ac_rating")}
                    value={account.rating}
                    fieldType={getFieldType("conta", "ac_rating", "type")}
                    highlighted
                    onChange={(val) => onFieldChange?.("rating", val)}
                    options={getFieldOptions("conta", "ac_rating")}
                  />}
                  {fv("ac_origin") && <EditableField
                    key="pOrigin"
                    label={fl("ac_origin")}
                    required={rq("ac_origin")}
                    value={account.origin}
                    fieldType={getFieldType("conta", "ac_origin", "type")}
                    onChange={(val) => onFieldChange?.("origin", val)}
                    options={getFieldOptions("conta", "ac_origin")}
                  />}
                  {fv("ac_preferred_contact") && <EditableField
                    key="pPrefContact"
                    label={fl("ac_preferred_contact")}
                    required={rq("ac_preferred_contact")}
                    value={account.preferredContact}
                    fieldType={getFieldType("conta", "ac_preferred_contact", "combobox")}
                    onChange={(val) => onFieldChange?.("preferredContact", val)}
                    options={getFieldOptions("conta", "ac_preferred_contact")}
                  />}
                  {fv("ac_do_not_contact") && <EditableField key="pDnc" label={fl("ac_do_not_contact")} required={rq("ac_do_not_contact")} value={account.doNotContact} fieldType="boolean" onChange={(val) => onFieldChange?.("doNotContact", val)} />}
                </DraggableFieldGrid>
              )}
          </div>
        </SectionToggle>
      </div>

      {/* COL 3: Financeiro (empresa only) */}
      <div className="lg:col-span-1 flex flex-col gap-[16px]">
        {accountType === "empresa" && (
          <SectionToggle title="Financeiro" expanded={financialOpen} onToggle={() => setFinancialOpen((v) => !v)}>
            <div className="mt-[12px] pl-[39px]">
              <DraggableFieldGrid storageKey={`acc-fin-${account.id}`} columns={1}>
                {fv("ac_annual_revenue") && <EditableField key="finRevenue" label={fl("ac_annual_revenue")} required={rq("ac_annual_revenue")} value={String(account.annualRevenue)} fieldType="currency" onChange={(val) => onFieldChange?.("annualRevenue", val)} />}
                {fv("ac_employees") && <EditableField key="finEmployees" label={fl("ac_employees")} required={rq("ac_employees")} value={String(account.employees)} fieldType="number" onChange={(val) => onFieldChange?.("employees", val)} />}
                {fv("ac_currency") && <EditableField key="finCurrency" label={fl("ac_currency")} required={rq("ac_currency")} value={account.currency} onChange={(val) => onFieldChange?.("currency", val)} />}
                {fv("ac_ownership") && <EditableField key="finOwnership" label={fl("ac_ownership")} required={rq("ac_ownership")} value={account.ownership} fieldType={getFieldType("conta", "ac_ownership", "type")} onChange={(val) => onFieldChange?.("ownership", val)} options={getFieldOptions("conta", "ac_ownership")} />}
                {fv("ac_rating") && <EditableField key="finRating" label={fl("ac_rating")} required={rq("ac_rating")} value={account.rating} fieldType={getFieldType("conta", "ac_rating", "type")} highlighted onChange={(val) => onFieldChange?.("rating", val)} options={getFieldOptions("conta", "ac_rating")} />}
              </DraggableFieldGrid>
            </div>
          </SectionToggle>
        )}
      </div>

      {/* FULL WIDTH: Endereço de Cobrança (empresa) / Endereço (pessoal) */}
      <div className="lg:col-span-3">
        <SectionToggle
          title={accountType === "empresa" ? "Endereço de Cobrança" : "Endereço"}
          expanded={addressBillingOpen}
          onToggle={() => setAddressBillingOpen((v) => !v)}
        >
          <div className="mt-[12px] pl-[39px]">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-[12px]">
              {fv("ac_billing_street") && <div className="lg:col-span-3">
                <EditableField
                  label={fl("ac_billing_street")}
                  value={accountType === "empresa" ? account.billingStreet : account.personalStreet}
                  onChange={(val) => onFieldChange?.(accountType === "empresa" ? "billingStreet" : "personalStreet", val)}
                />
              </div>}
              {fv("ac_billing_city") && <EditableField
                label={fl("ac_billing_city")}
                value={accountType === "empresa" ? account.billingCity : account.personalCity}
                onChange={(val) => onFieldChange?.(accountType === "empresa" ? "billingCity" : "personalCity", val)}
              />}
              {fv("ac_billing_state") && <EditableField
                label={fl("ac_billing_state")}
                value={accountType === "empresa" ? account.billingState : account.personalState}
                onChange={(val) => onFieldChange?.(accountType === "empresa" ? "billingState" : "personalState", val)}
              />}
              {fv("ac_billing_zip") && <EditableField
                label={fl("ac_billing_zip")}
                value={accountType === "empresa" ? account.billingZip : account.personalZip}
                onChange={(val) => onFieldChange?.(accountType === "empresa" ? "billingZip" : "personalZip", val)}
              />}
              {fv("ac_billing_country") && <EditableField
                label={fl("ac_billing_country")}
                value={accountType === "empresa" ? account.billingCountry : account.personalCountry}
                onChange={(val) => onFieldChange?.(accountType === "empresa" ? "billingCountry" : "personalCountry", val)}
              />}
            </div>
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Endereço de Entrega (empresa only) */}
      {accountType === "empresa" && (
        <div className="lg:col-span-3">
          <SectionToggle title="Endereço de Entrega" expanded={addressShippingOpen} onToggle={() => setAddressShippingOpen((v) => !v)}>
            <div className="mt-[12px] pl-[39px]">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-[12px]">
                {fv("ac_shipping_street") && <div className="lg:col-span-3">
                  <EditableField label={fl("ac_shipping_street")} value={account.shippingStreet} onChange={(val) => onFieldChange?.("shippingStreet", val)} />
                </div>}
                {fv("ac_shipping_city") && <EditableField label={fl("ac_shipping_city")} value={account.shippingCity} onChange={(val) => onFieldChange?.("shippingCity", val)} />}
                {fv("ac_shipping_state") && <EditableField label={fl("ac_shipping_state")} value={account.shippingState} onChange={(val) => onFieldChange?.("shippingState", val)} />}
                {fv("ac_shipping_zip") && <EditableField label={fl("ac_shipping_zip")} value={account.shippingZip} onChange={(val) => onFieldChange?.("shippingZip", val)} />}
                {fv("ac_shipping_country") && <EditableField label={fl("ac_shipping_country")} value={account.shippingCountry} onChange={(val) => onFieldChange?.("shippingCountry", val)} />}
              </div>
            </div>
          </SectionToggle>
        </div>
      )}

      {/* FULL WIDTH: Relacionamento (empresa only) */}
      {accountType === "empresa" && (
        <div className="lg:col-span-3">
          <SectionToggle title="Relacionamento" expanded={relationOpen} onToggle={() => setRelationOpen((v) => !v)}>
            <div className="mt-[12px] pl-[39px]">
              <DraggableFieldGrid storageKey={`acc-rel-${account.id}`} columns={3}>
                {fv("ac_parent_account") && <EditableField key="relParent" label={fl("ac_parent_account")} value={account.parentAccount || "—"} fieldType="association" associationLabel="Conta" onChange={(val) => onFieldChange?.("parentAccount", val)} />}
                {fv("ac_partner_account") && <EditableField key="relPartner" label={fl("ac_partner_account")} value={account.partnerAccount || "—"} fieldType="boolean" onChange={(val) => onFieldChange?.("partnerAccount", val)} />}
                {fv("ac_sic_code") && <EditableField key="relSic" label={fl("ac_sic_code")} value={account.sicCode} onChange={(val) => onFieldChange?.("sicCode", val)} />}
                {fv("ac_ticker") && <EditableField key="relTicker" label={fl("ac_ticker")} value={account.ticker || "—"} onChange={(val) => onFieldChange?.("ticker", val)} />}
              </DraggableFieldGrid>
            </div>
          </SectionToggle>
        </div>
      )}

      {/* FULL WIDTH: Descrição (empresa only) */}
      {accountType === "empresa" && (
        <div className="lg:col-span-3">
          <SectionToggle title="Descrição" expanded={descriptionOpen} onToggle={() => setDescriptionOpen((v) => !v)}>
            <div className="mt-[12px] pl-[39px]">
              {fv("ac_description") && <EditableField label={fl("ac_description")} value={account.description} fieldType="textarea" onChange={(val) => onFieldChange?.("description", val)} />}
            </div>
          </SectionToggle>
        </div>
      )}

      {/* FULL WIDTH: Dados Complementares */}
      <div className="lg:col-span-3">
        <SectionToggle title="Dados Complementares" expanded={complementarOpen} onToggle={() => setComplementarOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-[12px]">
              <div className="lg:col-span-3">
                {fv("ac_tags") && <EditableField
                  label={fl("ac_tags")}
                  value={account.tags}
                  fieldType={getFieldType("conta", "ac_tags", "multipicklist")}
                  onChange={(val) => onFieldChange?.("tags", val)}
                  options={getFieldOptions("conta", "ac_tags")}
                />}
              </div>
              <div className="lg:col-span-3">
                {fv("ac_notes") && <EditableField label={fl("ac_notes")} value={account.notes} fieldType="textarea" onChange={(val) => onFieldChange?.("notes", val)} />}
              </div>
            </div>
            {/* Formula fields */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-[12px] mt-[12px]">
              <EditableField
                label={fl("ac_days_no_contact")}
                value=""
                fieldType="calculated"
                formula="DAYS_SINCE([lastActivityDate])"
                formulaExpression="DAYS_SINCE([lastActivityDate])"
                formulaReturnType="number"
                formulaContext={formulaCtx}
                editable={false}
              />
              {accountType === "empresa" && (
                <EditableField
                  label={fl("ac_rev_per_employee")}
                  value=""
                  fieldType="calculated"
                  formula="[annualRevenue] / [employeeCount]"
                  formulaExpression="[annualRevenue] / [employeeCount]"
                  formulaReturnType="currency"
                  formulaContext={formulaCtx}
                  editable={false}
                />
              )}
              <EditableField
                label={fl("ac_inactivity_alert")}
                value=""
                fieldType="calculated"
                formula='IF(DAYS_SINCE([lastActivityDate]) > 30, "Crítico", IF(DAYS_SINCE([lastActivityDate]) > 14, "Atenção", "OK"))'
                formulaExpression='IF(DAYS_SINCE([lastActivityDate]) > 30, "Crítico", IF(DAYS_SINCE([lastActivityDate]) > 14, "Atenção", "OK"))'
                formulaReturnType="text"
                formulaContext={formulaCtx}
                editable={false}
              />
            </div>
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Dados de Marketing */}
      <div className="lg:col-span-3">
        <SectionToggle title="Dados de Marketing" expanded={marketingOpen} onToggle={() => setMarketingOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`acc-mkt-${account.id}`} columns={3}>
              {fv("ac_mkt_campanha") && <EditableField key="mktCamp" label={fl("ac_mkt_campanha")} value={account.mktCampanha} onChange={(val) => onFieldChange?.("mktCampanha", val)} />}
              {fv("ac_mkt_grupo") && <EditableField key="mktGrupo" label={fl("ac_mkt_grupo")} value={account.mktGrupoAnuncios} onChange={(val) => onFieldChange?.("mktGrupoAnuncios", val)} />}
              {fv("ac_mkt_anuncio") && <EditableField key="mktAnuncio" label={fl("ac_mkt_anuncio")} value={account.mktAnuncio} onChange={(val) => onFieldChange?.("mktAnuncio", val)} />}
              {fv("ac_mkt_conversao") && <EditableField key="mktConv" label={fl("ac_mkt_conversao")} value={account.mktUltimaConversao} fieldType="datetime" onChange={(val) => onFieldChange?.("mktUltimaConversao", val)} />}
              {fv("ac_mkt_canal") && <EditableField
                key="mktCanal"
                label={fl("ac_mkt_canal")}
                value={account.mktCanal}
                fieldType={getFieldType("conta", "ac_mkt_canal", "type")}
                onChange={(val) => onFieldChange?.("mktCanal", val)}
                options={getFieldOptions("conta", "ac_mkt_canal")}
              />}
            </DraggableFieldGrid>
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Informações da Conta */}
      <div className="lg:col-span-3">
        <SectionToggle title="Informações da Conta" expanded={infoOpen} onToggle={() => setInfoOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`acc-info-${account.id}`} columns={3}>
              <EditableField key="infoUpdatedAt" label={fl("ac_updated_at")} value={account.updatedAt} editable={false} />
              <EditableField key="infoCreatedAt" label={fl("ac_created_at")} value={account.createdAt} editable={false} />
              <EditableField key="infoUpdatedBy" label={fl("ac_updated_by")} value={account.updatedBy} fieldType="user" avatar={imgAvatar} editable={false} />
              <EditableField key="infoCreatedBy" label={fl("ac_created_by")} value={account.createdBy} fieldType="user" avatar={imgAvatar} editable={false} />
            </DraggableFieldGrid>
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Sistema */}
      <div className="lg:col-span-3">
        <SectionToggle title="Informações do Sistema" expanded={systemOpen} onToggle={() => setSystemOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`acc-sys-${account.id}`} columns={3}>
              <EditableField key="sysId" label={fl("ac_id")} value={account.id} fieldType="id" />
              <EditableField
                key="sysStageTime"
                label={fl("ac_time_in_stage")}
                value=""
                fieldType="calculated"
                formula='CONCAT(TEXT(DAYS_SINCE([stageLastChangedAt])), " dias")'
                formulaExpression='CONCAT(TEXT(DAYS_SINCE([stageLastChangedAt])), " dias")'
                formulaReturnType="text"
                formulaContext={formulaCtx}
                editable={false}
              />
              <EditableField key="sysLastView" label="ÚLTIMA VISUALIZAÇÃO" value={account.lastViewedDate} editable={false} />
              <EditableField key="sysLastRef" label="ÚLTIMA REFERÊNCIA" value={account.lastReferencedDate} editable={false} />
              <EditableField key="sysDeleted" label={fl("ac_is_deleted")} value={account.isDeleted} fieldType="boolean" editable={false} />
              <EditableField key="sysModstamp" label={fl("ac_system_modstamp")} value={account.systemModstamp} editable={false} />
            </DraggableFieldGrid>

            {fieldHistoryEntries.length > 0 && (
              <div className="mt-[16px]">
                <span
                  className="text-[#98989d] uppercase"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  HISTÓRICO DE ALTERAÇÕES
                </span>
                <div className="flex flex-col gap-[4px] mt-[8px]">
                  {fieldHistoryEntries.slice(0, 10).map((entry) => {
                    const stageLabel = (key: string | null) =>
                      STAGES.find((s) => s.key === key)?.label ?? key ?? "—";
                    const date = new Date(entry.changed_at);
                    const formattedDate = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
                    const formattedTime = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    const isStage = entry.field_name === "stage";
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-[8px] px-[8px] py-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors"
                      >
                        <div
                          className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                          style={{ backgroundColor: "#E8E8FD" }}
                        >
                          <ClockCounterClockwise size={14} weight="duotone" style={{ color: "#8C8CD4" }} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span
                            className="text-[#4e6987] truncate"
                            style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
                          >
                            {entry.changed_by} alterou{" "}
                            <span className="font-bold">
                              {isStage ? "Estágio" : entry.field_name}
                            </span>
                          </span>
                          <span
                            className="text-[#98989d]"
                            style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}
                          >
                            {isStage
                              ? `${stageLabel(entry.old_value)} → ${stageLabel(entry.new_value)}`
                              : `${entry.old_value ?? "—"} → ${entry.new_value ?? "—"}`}
                          </span>
                        </div>
                        <span
                          className="text-[#98989d] shrink-0 text-right"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
                        >
                          {formattedDate} {formattedTime}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </SectionToggle>
      </div>
      {/* ═══ FULL WIDTH : Campos Customizados ═══ */}
      {customFields && customFields.length > 0 && (
        <div className="lg:col-span-3 flex flex-col gap-[16px]">
          <SectionToggle title="Campos Customizados" expanded={true} onToggle={() => {}}>
            <div className="mt-[12px] pl-[39px]">
              <DraggableFieldGrid storageKey={`acc-custom-${account.id}`} columns={2}>
                {customFields.map((cf) => (
                  <EditableField
                    key={cf.key}
                    label={cf.label.toUpperCase()}
                    value={customValues?.[cf.key] ?? ""}
                    fieldType={cf.fieldType as any}
                    onChange={(v) => onCustomFieldChange?.(cf.key, v)}
                    options={cf.options?.map((o) => ({ value: o.value, label: o.label, color: o.color }))}
                  />
                ))}
              </DraggableFieldGrid>
            </div>
          </SectionToggle>
        </div>
      )}

    </div>
    </FieldDndProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Contatos (linked contacts)                                    */
/* ------------------------------------------------------------------ */

function TabContatos({ accountId }: { accountId: string }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<
    { id: string; name: string; role: string; email: string; phone: string }[]
  >([]);
  const [ctLoading, setCtLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    (async () => {
      try {
        const allContacts = await listContacts();
        if (cancelled) return;
        const linked = allContacts
          .filter((c) => c.account === accountId || c.company === accountId)
          .map((c) => ({
            id: c.id,
            name: [c.name, c.last_name].filter(Boolean).join(" "),
            role: c.role ?? "",
            email: c.email ?? "",
            phone: c.phone ?? "",
          }));
        setContacts(linked);
      } catch (err) {
        console.warn("Could not load account contacts:", err);
      } finally {
        if (!cancelled) setCtLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accountId]);

  if (ctLoading) {
    return (
      <div className="flex items-center justify-center py-[60px] gap-[8px]">
        <CircleNotch size={18} weight="bold" className="text-[#07abde] animate-spin" />
        <span className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
          Carregando contatos…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[12px] flex-wrap">
        <EditableField label="CONTATOS VINCULADOS" value={String(contacts.length)} editable={false} />
        <div className="flex-1" />
        <button
          className="h-[40px] px-[16px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors flex items-center gap-[6px]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
        >
          <Plus size={14} weight="bold" />
          Vincular contato
        </button>
      </div>

      {contacts.length > 0 ? (
        <div className="flex flex-col">
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-[8px] px-[4px]">
            {["Nome", "Cargo", "E-mail", "Telefone"].map((h) => (
              <span
                key={h}
                className="text-[#98989d]"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
              >
                {h}
              </span>
            ))}
          </div>
          {contacts.map((contact) => (
            <div key={contact.id}>
              <HorizontalDivider />
              <div
                className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-[8px] items-center py-[10px] px-[4px] rounded-[8px] hover:bg-[#f6f7f9] cursor-pointer transition-colors"
                onClick={() => navigate(`/crm/contatos`)}
              >
                <div className="flex items-center gap-[8px] min-w-0">
                  <img alt="" className="shrink-0 size-[28px] rounded-full object-cover" src={imgAvatar} />
                  <span
                    className="text-[#07abde] truncate"
                    style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                  >
                    {contact.name}
                  </span>
                </div>
                <span
                  className="text-[#4e6987] truncate"
                  style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                >
                  {contact.role}
                </span>
                <span
                  className="text-[#4e6987] truncate"
                  style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                >
                  {contact.email}
                </span>
                <span
                  className="text-[#4e6987] truncate"
                  style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                >
                  {contact.phone}
                </span>
              </div>
            </div>
          ))}
          <HorizontalDivider />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-[60px] gap-[12px]">
          <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#f6f7f9]">
            <IdentificationCard size={24} weight="duotone" className="text-[#98989d]" />
          </div>
          <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            Nenhum contato vinculado a esta conta.
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Oportunidades                                                 */
/* ------------------------------------------------------------------ */

const OP_STAGE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  apresentacao: { label: "Apresentação", bg: "#DDE3EC", color: "#28415c" },
  dimensionamento: { label: "Dimensionamento", bg: "#DDE3EC", color: "#28415c" },
  proposta: { label: "Proposta", bg: "#DDE3EC", color: "#28415c" },
  negociacao: { label: "Negociação", bg: "#FEEDCA", color: "#B8860B" },
  ganho: { label: "Ganho", bg: "#D9F8EF", color: "#135543" },
};

function TabOportunidades({ accountId }: { accountId: string }) {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<
    { id: string; name: string; value: number; stage: string; owner: string }[]
  >([]);
  const [opsLoading, setOpsLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    (async () => {
      try {
        const allOps = await listOpportunities();
        if (cancelled) return;
        // Filter opportunities where company FK matches this account ID
        const linked = allOps
          .filter((op) => op.company === accountId)
          .map((op) => ({
            id: op.id,
            name: op.name,
            value: op.value ?? 0,
            stage: op.stage ?? "apresentacao",
            owner: op.owner ?? "",
          }));
        setOpportunities(linked);
      } catch (err) {
        console.warn("Could not load account opportunities:", err);
      } finally {
        if (!cancelled) setOpsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accountId]);

  const totalValue = opportunities.reduce((s, o) => s + o.value, 0);

  if (opsLoading) {
    return (
      <div className="flex items-center justify-center py-[60px] gap-[8px]">
        <CircleNotch size={18} weight="bold" className="text-[#07abde] animate-spin" />
        <span className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
          Carregando oportunidades…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[12px] flex-wrap">
        <EditableField label="OPORTUNIDADES" value={String(opportunities.length)} editable={false} />
        <EditableField label="VALOR TOTAL" value={formatCurrency(totalValue)} editable={false} />
        <div className="flex-1" />
        <button
          className="h-[40px] px-[16px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors flex items-center gap-[6px]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
        >
          <Plus size={14} weight="bold" />
          Nova oportunidade
        </button>
      </div>

      {opportunities.length > 0 ? (
        <div className="flex flex-col">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-[8px] px-[4px]">
            {["Oportunidade", "Estágio", "Valor", "Proprietário"].map((h) => (
              <span
                key={h}
                className="text-[#98989d]"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
              >
                {h}
              </span>
            ))}
          </div>
          {opportunities.map((op) => {
            const stg = OP_STAGE_LABELS[op.stage] || OP_STAGE_LABELS.apresentacao;
            return (
              <div key={op.id}>
                <HorizontalDivider />
                <div
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-[8px] items-center py-[10px] px-[4px] rounded-[8px] hover:bg-[#f6f7f9] cursor-pointer transition-colors"
                  onClick={() => navigate(`/crm/oportunidades/${op.id}`)}
                >
                  <div className="flex items-center gap-[8px] min-w-0">
                    <div className="flex items-center justify-center size-[24px] rounded-[6px] bg-[#dcf0ff] shrink-0">
                      <SketchLogo size={14} weight="duotone" className="text-[#07abde]" />
                    </div>
                    <span
                      className="text-[#07abde] truncate"
                      style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                    >
                      {op.name}
                    </span>
                  </div>
                  <div>
                    <div
                      className="inline-flex items-center justify-center h-[22px] px-[8px] rounded-[6px]"
                      style={{ backgroundColor: stg.bg }}
                    >
                      <span
                        className="uppercase"
                        style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: stg.color, ...fontFeature }}
                      >
                        {stg.label}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-[#4e6987]"
                    style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                  >
                    {formatCurrency(op.value)}
                  </span>
                  <div className="flex items-center gap-[6px]">
                    <img alt="" className="shrink-0 size-[18px] rounded-full object-cover" src={imgAvatar} />
                    <span
                      className="text-[#4e6987] truncate"
                      style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                    >
                      {op.owner}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <HorizontalDivider />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-[60px] gap-[12px]">
          <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#f6f7f9]">
            <SketchLogo size={24} weight="duotone" className="text-[#98989d]" />
          </div>
          <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            Nenhuma oportunidade vinculada a esta conta.
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Contrato + Relacionado (placeholders)                         */
/* ------------------------------------------------------------------ */

function TabContrato() {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
        Nenhum contrato vinculado a esta conta.
      </span>
    </div>
  );
}

function TabRelacionado() {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
        Nenhum registro relacionado a esta conta.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmAccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { minimize } = useMultitask();
  const { trackRecent } = useCrmSearch();
  const [account, setAccount] = useState<AccountData>(emptyAccount);
  const [accLoading, setAccLoading] = useState(true);
  const { customFields, customValues, updateCustomValue } = useCustomFields("conta", id);
  const { isVisible: v, isRequired: rq, getLabel: fl } = useFieldVisibility("conta");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const dbRow = await getAccount(id);
        if (cancelled) return;
        const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleString("pt-BR") : "";
        const relativeTime = (iso: string | null): string => {
          if (!iso) return "";
          const diff = Date.now() - new Date(iso).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 1) return "Agora mesmo";
          if (mins < 60) return `Há ${mins}min`;
          const hrs = Math.floor(diff / 3600000);
          if (hrs < 24) return `Há ${hrs}h`;
          const days = Math.floor(diff / 86400000);
          if (days === 1) return "Há 1 dia";
          return `Há ${days} dias`;
        };
        let parsedLabels: { text: string; bg: string; color: string }[] = [];
        if (dbRow.labels) {
          try { parsedLabels = typeof dbRow.labels === "string" ? JSON.parse(dbRow.labels) : dbRow.labels; } catch { /* ignore */ }
        }
        setAccount({
          ...emptyAccount,
          id: dbRow.id,
          name: dbRow.name ?? "",
          type: (dbRow.type as AccountType) ?? "empresa",
          stage: (dbRow.stage as AccountStage) ?? "prospeccao",
          owner: dbRow.owner ?? "",
          lastActivity: relativeTime(dbRow.last_activity_date ?? dbRow.updated_at),
          lastActivityDate: dbRow.last_activity_date ?? dbRow.updated_at ?? "",
          labels: parsedLabels,
          createdAt: fmtDate(dbRow.created_at),
          updatedAt: fmtDate(dbRow.updated_at),
          createdBy: dbRow.created_by ?? "",
          updatedBy: dbRow.updated_by ?? "",
          accountNumber: dbRow.account_number ?? "",
          sector: dbRow.sector ?? "",
          website: dbRow.website ?? "",
          phone: dbRow.phone ?? "",
          fax: dbRow.fax ?? "",
          cnpj: dbRow.cnpj ?? "",
          description: dbRow.description ?? "",
          annualRevenue: dbRow.annual_revenue ?? 0,
          employees: dbRow.employees ?? 0,
          ownership: dbRow.ownership ?? "",
          parentAccount: dbRow.parent_account ?? "",
          partnerAccount: dbRow.partner_account ?? "",
          origin: dbRow.origin ?? "",
          rating: dbRow.rating ?? "",
          accountSite: dbRow.account_site ?? "",
          currency: dbRow.currency ?? "BRL",
          sicCode: dbRow.sic_code ?? "",
          ticker: dbRow.ticker ?? "",
          accountType: dbRow.account_type ?? "",
          billingStreet: dbRow.billing_street ?? "",
          billingCity: dbRow.billing_city ?? "",
          billingState: dbRow.billing_state ?? "",
          billingCountry: dbRow.billing_country ?? "",
          billingZip: dbRow.billing_zip ?? "",
          shippingStreet: dbRow.shipping_street ?? "",
          shippingCity: dbRow.shipping_city ?? "",
          shippingState: dbRow.shipping_state ?? "",
          shippingCountry: dbRow.shipping_country ?? "",
          shippingZip: dbRow.shipping_zip ?? "",
          firstName: dbRow.first_name ?? "",
          lastName: dbRow.last_name ?? "",
          email: dbRow.email ?? "",
          personalPhone: dbRow.personal_phone ?? "",
          birthDate: dbRow.birth_date ?? "",
          cpf: dbRow.cpf ?? "",
          personalStreet: dbRow.personal_street ?? "",
          personalCity: dbRow.personal_city ?? "",
          personalState: dbRow.personal_state ?? "",
          personalCountry: dbRow.personal_country ?? "",
          personalZip: dbRow.personal_zip ?? "",
          tags: dbRow.tags ?? "",
          notes: dbRow.notes ?? "",
          preferredContact: dbRow.preferred_contact ?? "",
          doNotContact: dbRow.do_not_contact != null ? String(dbRow.do_not_contact) : "false",
          mktCampanha: dbRow.mkt_campanha ?? "",
          mktGrupoAnuncios: dbRow.mkt_grupo_anuncios ?? "",
          mktAnuncio: dbRow.mkt_anuncio ?? "",
          mktUltimaConversao: dbRow.mkt_ultima_conversao ?? "",
          mktCanal: dbRow.mkt_canal ?? "",
          isDeleted: dbRow.is_deleted != null ? String(dbRow.is_deleted) : "false",
          lastViewedDate: fmtDate(dbRow.last_viewed_date),
          lastReferencedDate: fmtDate(dbRow.last_referenced_date),
          systemModstamp: fmtDate(dbRow.system_modstamp),
        });
        setStage((dbRow.stage as AccountStage) ?? "prospeccao");
        setAccountType((dbRow.type as AccountType) ?? "empresa");
        trackRecent({ id: dbRow.id, label: dbRow.name, subtitle: (dbRow.type ?? "empresa"), objectType: "account", visitedAt: Date.now() });
      } catch (err) {
        console.error("Error loading account detail:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("not found")) {
            toast.error("Conta não encontrada no banco de dados.");
            navigate("/crm/contas");
            return;
          }
        }
      } finally {
        if (!cancelled) setAccLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const [stage, setStage] = useState<AccountStage>(account.stage);
  const [accountType, setAccountType] = useState<AccountType>(account.type);
  const [activeTab, setActiveTab] = useState<AccountTab>("detalhes");
  const [fieldHistoryEntries, setFieldHistoryEntries] = useState<FieldHistoryEntry[]>([]);

  // Seed initial stage value
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      seedInitialValue({
        entity_type: "conta",
        entity_id: account.id,
        field_name: "stage",
        current_value: account.stage,
        created_at: threeDaysAgo.toISOString(),
        changed_by: account.createdBy,
      });
      setFieldHistoryEntries(
        getEntityHistory({ entity_type: "conta", entity_id: account.id })
      );
    }
  }, [account.id, account.stage, account.createdBy]);

  const handleStageChange = useCallback(
    (newStage: AccountStage) => {
      if (newStage === stage) return;
      recordChange({
        entity_type: "conta",
        entity_id: account.id,
        field_name: "stage",
        old_value: stage,
        new_value: newStage,
        changed_by: "João Silva",
        change_source: "ui",
      });
      setStage(newStage);
      setFieldHistoryEntries(
        getEntityHistory({ entity_type: "conta", entity_id: account.id })
      );
      // Persist to DB
      patchAccApi(account.id, { stage: newStage }).catch((err) =>
        console.error("Error persisting account stage change:", err)
      );
    },
    [stage, account.id]
  );

  // ── Generic field update: local state + DB persist ──
  const ACC_FIELD_TO_DB: Record<string, string> = {
    name: "name", owner: "owner", accountNumber: "account_number",
    sector: "sector", website: "website", phone: "phone", fax: "fax",
    cnpj: "cnpj", description: "description", annualRevenue: "annual_revenue",
    employees: "employees", ownership: "ownership", parentAccount: "parent_account",
    partnerAccount: "partner_account", origin: "origin", rating: "rating",
    accountSite: "account_site", currency: "currency", sicCode: "sic_code",
    ticker: "ticker", accountType: "account_type",
    billingStreet: "billing_street", billingCity: "billing_city",
    billingState: "billing_state", billingCountry: "billing_country",
    billingZip: "billing_zip", shippingStreet: "shipping_street",
    shippingCity: "shipping_city", shippingState: "shipping_state",
    shippingCountry: "shipping_country", shippingZip: "shipping_zip",
    firstName: "first_name", lastName: "last_name", email: "email",
    personalPhone: "personal_phone", birthDate: "birth_date", cpf: "cpf",
    tags: "tags", notes: "notes", preferredContact: "preferred_contact",
    doNotContact: "do_not_contact",
    mktCampanha: "mkt_campanha", mktGrupoAnuncios: "mkt_grupo_anuncios",
    mktAnuncio: "mkt_anuncio", mktUltimaConversao: "mkt_ultima_conversao",
    mktCanal: "mkt_canal",
  };

  const updateAccountField = useCallback(
    (fieldKey: string, value: string) => {
      setAccount((prev) => ({ ...prev, [fieldKey]: value }));
      const dbKey = ACC_FIELD_TO_DB[fieldKey];
      if (!dbKey) return;
      let dbValue: unknown = value;
      if (dbKey === "annual_revenue" || dbKey === "employees") {
        dbValue = parseFloat(value) || 0;
      } else if (dbKey === "do_not_contact") {
        dbValue = value === "true";
      }
      patchAccApi(account.id, { [dbKey]: dbValue } as any).catch((err) =>
        console.error(`Error persisting account ${dbKey}:`, err)
      );
    },
    [account.id]
  );

  const rightPanel: "calls" | "activities" | "none" =
    activeTab === "detalhes" ? "calls" : activeTab === "contatos" || activeTab === "oportunidades" ? "activities" : "none";

  if (accLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircleNotch size={32} weight="bold" className="text-[#07abde] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-auto">
      {/* ═══════ TOP HEADER BAR ═══════ */}
      <div className="bg-white rounded-[16px] p-[20px] pb-[16px] shrink-0">
        {/* Row 1: Account name + labels + actions */}
        <div className="flex items-center justify-between gap-4 mb-[12px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#d9f8ef] shrink-0">
              <Building size={18} weight="duotone" className="text-[#3ccea7]" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-[#64676c] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
              >
                CONTA
              </span>
              <span
                className="text-[#28415c]"
                style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...fontFeature }}
              >
                {account.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-[16px]">
            {/* Labels */}
            <div className="hidden md:flex items-center gap-[8px]">
              {account.labels.map((lbl, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center h-[32px] px-[12px] rounded-[8px]"
                  style={{ backgroundColor: lbl.bg }}
                >
                  <span
                    className="uppercase"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", color: lbl.color, ...fontFeature }}
                  >
                    {lbl.text}
                  </span>
                </div>
              ))}
            </div>

            <VerticalDivider />

            {/* Action buttons pill */}
            <div className="hidden lg:flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
              <ActionButton><Tag size={18} weight="bold" /></ActionButton>
              <ActionButton><ClockCounterClockwise size={18} weight="bold" /></ActionButton>
              <ActionButton><PencilSimple size={18} weight="bold" /></ActionButton>
              <ActionButton><Trash size={18} weight="bold" /></ActionButton>
              <ActionButton><LinkIcon size={18} weight="bold" /></ActionButton>
              <ActionButton><CopySimple size={18} weight="bold" /></ActionButton>
              <ActionButton onClick={() => {
                minimize({
                  id: account.id,
                  title: account.name,
                  subtitle: account.id,
                  path: `/crm/contas/${account.id}`,
                  statusColor: "#3ccea7",
                });
                navigate("/crm/contas");
              }}>
                <ArrowSquareDownRight size={18} weight="bold" />
              </ActionButton>
              <ActionButton onClick={() => navigate(-1)}>
                <X size={18} weight="bold" />
              </ActionButton>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="lg:hidden flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] text-[#28415c] cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Row 2: Summary bar */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[12px]">
          <EditableField label={fl("ac_id")} value={account.id} editable={false} />
          <EditableField label={fl("ac_type")} value={accountType === "empresa" ? "Empresa" : "Pessoal"} editable={false} />
          {accountType === "empresa" && (
            <>
              <EditableField label={fl("ac_sector")} value={account.sector} editable={false} />
              <EditableField label={fl("ac_annual_revenue")} value={formatCurrency(account.annualRevenue)} editable={false} />
            </>
          )}
          {accountType === "pessoal" && (
            <EditableField label={fl("ac_email")} value={account.email} editable={false} />
          )}
          <EditableField label={fl("ac_last_activity")} value={account.lastActivity} ai editable={false} />
        </div>
      </div>

      {/* ═══════ BELOW HEADER: Tabs+Content + Right Panel ═══════ */}
      <div className="flex gap-[12px] flex-1 min-h-0 pt-[12px]">
        {/* LEFT: Tabs + Content */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* TABS */}
          <div className="flex items-end gap-px shrink-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-[4px] h-[32px] px-[12px] rounded-tl-[12px] rounded-tr-[12px] cursor-pointer transition-colors ${
                    isActive ? "bg-white text-[#28415c]" : "text-[#98989d] hover:text-[#4E6987]"
                  }`}
                >
                  <Icon size={15} weight={isActive ? "fill" : "duotone"} />
                  <span
                    className="uppercase"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CONTENT */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className={`bg-white rounded-[16px] ${activeTab === "detalhes" ? "rounded-tl-none" : ""} overflow-auto h-full min-w-0`}>
              <div className="p-[18px]">
                {/* Pipeline Control (only in detail tab) */}
                {activeTab === "detalhes" && (
                  <div className="mb-[24px]">
                    <PipelineControl stage={stage} onStageChange={handleStageChange} />
                  </div>
                )}

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === "detalhes" && (
                      <TabDetalhes
                        account={account}
                        stage={stage}
                        fieldHistoryEntries={fieldHistoryEntries}
                        accountType={accountType}
                        onAccountTypeChange={setAccountType}
                        onFieldChange={updateAccountField}
                        customFields={customFields}
                        customValues={customValues}
                        onCustomFieldChange={updateCustomValue}
                        isVisible={v}
                        getLabel={fl}
                        isRequired={rq}
                      />
                    )}
                    {activeTab === "contatos" && <TabContatos accountId={account.id} />}
                    {activeTab === "oportunidades" && <TabOportunidades accountId={account.id} />}
                    {activeTab === "contrato" && <TabContrato />}
                    {activeTab === "relacionado" && <TabRelacionado />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        {rightPanel !== "none" && (
          <div className="hidden xl:flex flex-col w-[306px] shrink-0 bg-white rounded-[16px] overflow-hidden">
            {rightPanel === "calls" && <CallLogPanel calls={mockCalls} />}
            {rightPanel === "activities" && <ActivityPanel activities={mockActivities} />}
          </div>
        )}
      </div>
    </div>
  );
}
