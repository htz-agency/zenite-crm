import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  SketchLogo,
  CaretDown,
  CaretRight,
  X,
  Tag,
  ClockCounterClockwise,
  PencilSimple,
  Trash,
  Link as LinkIcon,
  CopySimple,
  Sparkle,
  Trophy,
  Plus,
  FunnelSimple,
  GearSix,
  ListBullets,
  ArrowSquareDownRight,
  MagnifyingGlass,
  Package,
  FileText,
  ClipboardText,
  Files,
  FediverseLogo,
  CircleNotch,
  Speedometer,
  RocketLaunch,
  CompassTool,
  ArrowSquareOut,
  LinkBreak,
  Buildings,
  IdentificationCard,
  CheckCircle,
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
import { listDbServices, listProposals, getProposalsByCrm, type DbProposal } from "../api";
import { groupLabels, type ServiceGroup } from "../pricing-data";
import { ZeniteToggle } from "../zenite-toggle";
import { getOpportunity, patchOpportunity as patchOpApi, generateCrmId, getAccount, getContact, type DbAccount } from "./crm-api";
import { toast } from "sonner";
import { AccountSearchField } from "./account-search-field";
import { ContactSearchField } from "./contact-search-field";
import { DraggableFieldGrid, FieldDndProvider } from "./draggable-field-grid";
import { getFieldOptions, getFieldType } from "./crm-field-config";
import { useCustomFields } from "./use-custom-fields";
import { useFieldVisibility } from "./use-field-visibility";
import {
  fontFeature,
  type Activity,
  type CallRecord,
  activityConfig,
  VerticalDivider,
  HorizontalDivider,
  ActionButton,
  ActivityItem,
  SectionToggle,
  StageBar,
  ScoreCard,
  CallLogPanel,
} from "./crm-detail-shared";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

type OpStage = "apresentacao" | "dimensionamento" | "proposta" | "negociacao" | "fechado";

type OpTab = "detalhes" | "servicos" | "propostas" | "contrato" | "relacionado";

interface OpData {
  id: string;
  name: string;
  company: string;
  /* value is now computed — see computeOpValue() */
  stage: OpStage;
  closeDate: string;
  lastActivity: string;
  owner: string;
  type: string;
  tipo: string;
  decisor: string;
  account: string;
  origin: string;
  score: number;
  scoreLabel: string;
  labels: { text: string; bg: string; color: string }[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  // marketing
  mktCampanha: string;
  mktGrupoAnuncios: string;
  mktAnuncio: string;
  mktUltimaConversao: string;
  mktCanal: string;
  // levantamento de necessidades
  needsObjective: string;
  needsCurrentSituation: string;
  needsChallenges: string;
  needsBudget: string;
  needsTimeline: string;
  needsNotes: string;
  stageComplement: string;
  mostRecent: string;
}

/* ── Linked Proposal (from Price module) ── */
interface LinkedProposalEntry {
  id: string;
  clientName: string;
  totalMonthly: number;
  totalImpl: number;
  /** When true this proposal's value reflects in the OP header */
  active: boolean;
  /** Full DB record for display */
  fullData: DbProposal;
}

/** Compute OP value: (mensal × 12) + implantação.
 *  Priority: active proposal > services. */
function computeOpValue(
  linkedServices: LinkedService[],
  linkedProposals: LinkedProposalEntry[]
): { value: number; monthly: number; impl: number; source: "proposta" | "servicos" | "nenhum"; activeProposalId?: string } {
  const active = linkedProposals.find((p) => p.active);
  if (active) {
    const monthly = active.totalMonthly;
    const impl = active.totalImpl;
    return { value: monthly * 12 + impl, monthly, impl, source: "proposta", activeProposalId: active.id };
  }
  if (linkedServices.length > 0) {
    const monthly = linkedServices.reduce((s, svc) => s + svc.basePrice * svc.quantity, 0);
    const impl = linkedServices.reduce((s, svc) => s + svc.implPrice * svc.quantity, 0);
    return { value: monthly * 12 + impl, monthly, impl, source: "servicos" };
  }
  return { value: 0, monthly: 0, impl: 0, source: "nenhum" };
}

const STAGES: { key: OpStage; label: string }[] = [
  { key: "apresentacao", label: "APRESENTAÇÃO" },
  { key: "dimensionamento", label: "DIMENSIONAMENTO" },
  { key: "proposta", label: "PROPOSTA" },
  { key: "negociacao", label: "NEGOCIAÇÃO" },
  { key: "fechado", label: "FECHADO" },
];

const TABS: { key: OpTab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "detalhes", label: "Detalhes", icon: ListBullets },
  { key: "servicos", label: "Serviços", icon: Package },
  { key: "propostas", label: "Propostas", icon: ClipboardText },
  { key: "contrato", label: "Contrato", icon: Files },
  { key: "relacionado", label: "Vínculos", icon: LinkIcon },
];

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

/** Empty opportunity – used as initial state before DB fetch. No fake data. */
const emptyOp: OpData = {
  id: "",
  name: "",
  company: "",
  stage: "apresentacao",
  closeDate: "",
  lastActivity: "",
  owner: "",
  type: "",
  tipo: "",
  decisor: "",
  account: "",
  origin: "",
  score: 0,
  scoreLabel: "",
  labels: [],
  createdAt: "",
  updatedAt: "",
  createdBy: "",
  updatedBy: "",
  mktCampanha: "",
  mktGrupoAnuncios: "",
  mktAnuncio: "",
  mktUltimaConversao: "",
  mktCanal: "",
  needsObjective: "",
  needsCurrentSituation: "",
  needsChallenges: "",
  needsBudget: "",
  needsTimeline: "",
  needsNotes: "",
  stageComplement: "",
  mostRecent: "false",
};

/* mockProducts removed — TabServices now fetches from Price catalog API */

const mockActivities: Activity[] = [
  { id: "a1", type: "compromisso", label: "Compromisso", date: "04/01/2024 09:30", group: "FUTURO" },
  { id: "a2", type: "tarefa", label: "Tarefa", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a3", type: "ligacao", label: "Ligação", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a4", type: "nota", label: "Nota", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a5", type: "mensagem", label: "Mensagem", date: "04/01/2024 09:30", group: "JUNHO" },
  { id: "a6", type: "email", label: "Email", date: "04/01/2024 09:30", group: "2022" },
];

const mockCalls: CallRecord[] = [
  { id: "c1", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
  { id: "c2", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
  { id: "c3", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
  { id: "c4", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
  { id: "c5", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
      {/* Tab bar */}
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
                    layoutId="activity-tab-active"
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

      {/* Activity header */}
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

      {/* Activity list */}
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

      {/* Add Activity Button */}
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
/*  Tab: Detalhes                                                      */
/* ------------------------------------------------------------------ */

function TabDetalhes({
  op,
  stage,
  formulaCtx,
  fieldHistoryEntries,
  accountId,
  onAccountChange,
  decisorId,
  onDecisionMakerChange,
  onFieldChange,
  customFields,
  customValues,
  onCustomFieldChange,
  isVisible,
  getLabel,
  isRequired,
}: {
  op: OpData;
  stage: OpStage;
  formulaCtx: FormulaContext;
  fieldHistoryEntries: FieldHistoryEntry[];
  accountId: string | null;
  onAccountChange?: (newAccountId: string | null, newAccountName: string) => void;
  decisorId: string | null;
  onDecisionMakerChange?: (newContactId: string | null, newContactName: string) => void;
  onFieldChange?: (fieldKey: string, value: string) => void;
  customFields?: { key: string; label: string; fieldType: string; options?: { value: string; label: string; color: string }[] }[];
  customValues?: Record<string, string>;
  onCustomFieldChange?: (key: string, value: string) => void;
  isVisible?: (key: string) => boolean;
  getLabel?: (key: string) => string;
  isRequired?: (key: string) => boolean;
}) {
  const navigate = useNavigate();
  const fv = isVisible ?? (() => true);
  const fl = getLabel ?? ((k: string) => k.toUpperCase());
  const rq = isRequired ?? (() => false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [probabilityOpen, setProbabilityOpen] = useState(true);
  const [needsOpen, setNeedsOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);
  const [stageComplement, setStageComplement] = useState(op.stageComplement || "sem_briefing");

  // Sync stageComplement when op loads from DB
  useEffect(() => {
    if (op.stageComplement) setStageComplement(op.stageComplement);
  }, [op.stageComplement]);

  return (
    <FieldDndProvider>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
      {/* COL 1-2: Detalhes da Oportunidade */}
      <div className="lg:col-span-2 flex flex-col gap-[16px]">
        <SectionToggle title="Detalhes da Oportunidade" expanded={detailsOpen} onToggle={() => setDetailsOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`op-base-${op.id}`} columns={2}>
              {fv("op_owner") && <EditableField key="opOwner" label={fl("op_owner")} required={rq("op_owner")} value={op.owner} fieldType="user" avatar={imgAvatar} onChange={(val) => onFieldChange?.("owner", val)} />}
              {fv("op_type_op") && <EditableField
                key="opType"
                label={fl("op_type_op")}
                required={rq("op_type_op")}
                value={op.type}
                fieldType={getFieldType("oportunidade", "op_type_op", "type")}
                highlighted
                onChange={(val) => onFieldChange?.("type", val)}
                options={getFieldOptions("oportunidade", "op_type_op")}
              />}
              {fv("op_decisor") && <ContactSearchField
                key="opDecisor"
                value={op.decisor}
                contactId={decisorId}
                onSelect={(id, name) => onDecisionMakerChange?.(id, name)}
                onUnlink={() => onDecisionMakerChange?.(null, "")}
                onNavigate={(id) => navigate(`/crm/contatos/${id}`)}
              />}
              {fv("op_account") && <AccountSearchField
                key="opAccount"
                value={op.account}
                accountId={accountId}
                onSelect={(id, name) => onAccountChange?.(id, name)}
                onUnlink={() => onAccountChange?.(null, "")}
                onNavigate={(id) => navigate(`/crm/contas/${id}`)}
              />}
              <EditableField
                key="opStageComp"
                label={fl("op_stage_complement")}
                value={stageComplement}
                onChange={(v) => { setStageComplement(v); onFieldChange?.("stageComplement", v); }}
                fieldType="contextual"
                contextualValue={stage}
                contextualLabel="Estágio"
                highlighted
                contextualOptions={{
                  apresentacao: [
                    { value: "sem_briefing", label: "Sem briefing", color: "#98989d" },
                    { value: "briefing_agendado", label: "Briefing agendado", color: "#07abde" },
                    { value: "briefing_realizado", label: "Briefing realizado", color: "#3ccea7" },
                    { value: "aguardando_info", label: "Aguardando informações", color: "#eac23d" },
                  ],
                  dimensionamento: [
                    { value: "levantamento", label: "Levantamento de escopo", color: "#07abde" },
                    { value: "analise_tecnica", label: "Análise técnica", color: "#8c8cd4" },
                    { value: "escopo_definido", label: "Escopo definido", color: "#3ccea7" },
                    { value: "aguardando_validacao", label: "Aguardando validação", color: "#eac23d" },
                  ],
                  proposta: [
                    { value: "elaborando", label: "Elaborando proposta", color: "#07abde" },
                    { value: "proposta_enviada", label: "Proposta enviada", color: "#8c8cd4" },
                    { value: "em_revisao", label: "Em revisão pelo cliente", color: "#eac23d" },
                    { value: "ajuste_solicitado", label: "Ajuste solicitado", color: "#ff8c76" },
                  ],
                  negociacao: [
                    { value: "negociando_valor", label: "Negociando valor", color: "#eac23d" },
                    { value: "negociando_escopo", label: "Negociando escopo", color: "#07abde" },
                    { value: "aprovacao_interna", label: "Aprovação interna", color: "#8c8cd4" },
                    { value: "contrato_enviado", label: "Contrato enviado", color: "#3ccea7" },
                  ],
                  fechado: [
                    { value: "ganho", label: "Ganho", color: "#3ccea7" },
                    { value: "perdido_preco", label: "Perdido — preço", color: "#f56233" },
                    { value: "perdido_concorrencia", label: "Perdido — concorrência", color: "#ff8c76" },
                    { value: "perdido_timing", label: "Perdido — timing", color: "#98989d" },
                    { value: "perdido_sem_retorno", label: "Perdido — sem retorno", color: "#98989d" },
                  ],
                }}
              />
              {fv("op_type") && <EditableField
                key="opNegType"
                label={fl("op_type")}
                required={rq("op_type")}
                value={op.tipo}
                fieldType={getFieldType("oportunidade", "op_type", "type")}
                onChange={(val) => onFieldChange?.("tipo", val)}
                options={getFieldOptions("oportunidade", "op_type")}
              />}
            </DraggableFieldGrid>
          </div>
        </SectionToggle>
      </div>

      {/* COL 3: Probabilidade de compra */}
      <div className="lg:col-span-1">
        <SectionToggle title="Probabilidade de compra" expanded={probabilityOpen} onToggle={() => setProbabilityOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px] flex flex-col gap-[16px]">
            <div className="flex items-center gap-[6px]">
              <Sparkle size={14} weight="duotone" className="text-[#98989d]" />
              <span
                className="text-[#98989d] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
              >
                POWERED BY HTZ-AI
              </span>
            </div>
            <ScoreCard score={op.score} label={"OP\nScore"} icon={SketchLogo} iconColor="#07abde" fillColor="#DCF0FF" textColor="#0766a0" gradientId="opScoreGrad" />
            {fv("op_most_recent") && <EditableField key="opMostRecent" label={fl("op_most_recent")} value={op.mostRecent} fieldType="boolean" onChange={(val) => onFieldChange?.("mostRecent", val)} />}
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Levantamento de necessidades */}
      <div className="lg:col-span-3">
        <SectionToggle title="Levantamento de necessidades" expanded={needsOpen} onToggle={() => setNeedsOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`op-needs-${op.id}`} columns={3}>
              {fv("op_needs_objective") && <EditableField key="needsObj" label={fl("op_needs_objective")} required={rq("op_needs_objective")} value={op.needsObjective} fieldType="textarea" onChange={(val) => onFieldChange?.("needsObjective", val)} />}
              {fv("op_needs_situation") && <EditableField key="needsSit" label={fl("op_needs_situation")} required={rq("op_needs_situation")} value={op.needsCurrentSituation} fieldType="textarea" onChange={(val) => onFieldChange?.("needsCurrentSituation", val)} />}
              {fv("op_needs_challenges") && <EditableField key="needsChal" label={fl("op_needs_challenges")} required={rq("op_needs_challenges")} value={op.needsChallenges} fieldType="textarea" onChange={(val) => onFieldChange?.("needsChallenges", val)} />}
              {fv("op_needs_budget") && <EditableField key="needsBudget" label={fl("op_needs_budget")} required={rq("op_needs_budget")} value={op.needsBudget} onChange={(val) => onFieldChange?.("needsBudget", val)} />}
              {fv("op_needs_timeline") && <EditableField key="needsTimeline" label={fl("op_needs_timeline")} required={rq("op_needs_timeline")} value={op.needsTimeline} onChange={(val) => onFieldChange?.("needsTimeline", val)} />}
              {fv("op_needs_notes") && <EditableField key="needsNotes" label={fl("op_needs_notes")} required={rq("op_needs_notes")} value={op.needsNotes} fieldType="textarea" onChange={(val) => onFieldChange?.("needsNotes", val)} />}
            </DraggableFieldGrid>
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Marketing */}
      <div className="lg:col-span-3">
        <SectionToggle title="Dados de Marketing" expanded={marketingOpen} onToggle={() => setMarketingOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`op-mkt-${op.id}`} columns={3}>
              {fv("op_origin") && <EditableField key="mktOrigin" label={fl("op_origin")} required={rq("op_origin")} value={op.origin} onChange={(val) => onFieldChange?.("origin", val)} />}
              {fv("op_mkt_campanha") && <EditableField key="mktCamp" label={fl("op_mkt_campanha")} value={op.mktCampanha} onChange={(val) => onFieldChange?.("mktCampanha", val)} />}
              {fv("op_mkt_grupo") && <EditableField key="mktGrupo" label={fl("op_mkt_grupo")} value={op.mktGrupoAnuncios} onChange={(val) => onFieldChange?.("mktGrupoAnuncios", val)} />}
              {fv("op_mkt_anuncio") && <EditableField key="mktAnuncio" label={fl("op_mkt_anuncio")} value={op.mktAnuncio} onChange={(val) => onFieldChange?.("mktAnuncio", val)} />}
              {fv("op_mkt_conversao") && <EditableField key="mktConv" label={fl("op_mkt_conversao")} value={op.mktUltimaConversao} fieldType="datetime" onChange={(val) => onFieldChange?.("mktUltimaConversao", val)} />}
              {fv("op_mkt_canal") && <EditableField
                key="mktCanal"
                label={fl("op_mkt_canal")}
                value={op.mktCanal}
                fieldType={getFieldType("oportunidade", "op_mkt_canal", "type")}
                onChange={(val) => onFieldChange?.("mktCanal", val)}
                options={getFieldOptions("oportunidade", "op_mkt_canal")}
              />}
            </DraggableFieldGrid>
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Informações da Oportunidade */}
      <div className="lg:col-span-3">
        <SectionToggle title="Informações da Oportunidade" expanded={infoOpen} onToggle={() => setInfoOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`op-info-${op.id}`} columns={3}>
              <EditableField key="infoUpdAt" label={fl("op_updated_at")} value={op.updatedAt} editable={false} />
              <EditableField key="infoCrAt" label={fl("op_created_at")} value={op.createdAt} editable={false} />
              <EditableField key="infoUpdBy" label={fl("op_updated_by")} value={op.updatedBy} fieldType="user" avatar={imgAvatar} editable={false} />
              <EditableField key="infoCrBy" label={fl("op_created_by")} value={op.createdBy} fieldType="user" avatar={imgAvatar} editable={false} />
            </DraggableFieldGrid>
          </div>
        </SectionToggle>
      </div>

      {/* FULL WIDTH: Informações do Sistema */}
      <div className="lg:col-span-3">
        <SectionToggle title="Informações do Sistema" expanded={systemOpen} onToggle={() => setSystemOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`op-sys-${op.id}`} columns={3}>
              <EditableField key="sysId" label={fl("op_id")} value={op.id} fieldType="id" />
              <EditableField key="sysClose" label={fl("op_close_date")} value={op.closeDate} editable={false} />
              <EditableField
                key="sysStageTime"
                label={fl("op_time_in_stage")}
                value=""
                fieldType="calculated"
                formula='CONCAT(TEXT(DAYS_SINCE([stageLastChangedAt])), " dias")'
                formulaExpression='CONCAT(TEXT(DAYS_SINCE([stageLastChangedAt])), " dias")'
                formulaReturnType="text"
                formulaContext={formulaCtx}
                editable={false}
              />
            </DraggableFieldGrid>

            {/* ── Histórico de Alterações de Campo ── */}
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
                    const formattedDate = date.toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    });
                    const formattedTime = date.toLocaleTimeString("pt-BR", {
                      hour: "2-digit", minute: "2-digit",
                    });
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
              <DraggableFieldGrid storageKey={`op-custom-${op.id}`} columns={2}>
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
/*  Tab: Serviços (catálogo Price)                                     */
/* ------------------------------------------------------------------ */

/* ── DB service shape ── */
interface PriceService {
  id: string;
  name: string;
  service_group: ServiceGroup;
  description: string;
  base_price: number;
  impl_price: number;
  hours_estimate: number;
  is_ads: boolean;
}

/* ── Linked service (added to this opportunity) ── */
interface LinkedService {
  serviceId: string;
  name: string;
  group: ServiceGroup;
  quantity: number;
  basePrice: number;
  implPrice: number;
  hours: number;
}

const GROUP_ICONS: Record<ServiceGroup, React.ComponentType<any>> = {
  performance: Speedometer,
  sales_ops: RocketLaunch,
  brand_co: CompassTool,
};

const GROUP_COLORS: Record<ServiceGroup, { bg: string; text: string }> = {
  performance: { bg: "#DCF0FF", text: "#0483AB" },
  sales_ops: { bg: "#D9F8EF", text: "#3CCEA7" },
  brand_co: { bg: "#FFEDEB", text: "#FF8C76" },
};

/* ── Catalog Picker (drawer/overlay) ── */
function CatalogPicker({
  open,
  onClose,
  catalog,
  loading,
  alreadyLinked,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  catalog: PriceService[];
  loading: boolean;
  alreadyLinked: Set<string>;
  onAdd: (svc: PriceService) => void;
}) {
  const [q, setQ] = useState("");
  const lc = q.toLowerCase();
  const filtered = q
    ? catalog.filter(
        (s) =>
          s.name.toLowerCase().includes(lc) ||
          s.id.toLowerCase().includes(lc) ||
          (groupLabels[s.service_group] || "").toLowerCase().includes(lc)
      )
    : catalog;

  const grouped: { group: ServiceGroup; items: PriceService[] }[] = [];
  filtered.forEach((s) => {
    const existing = grouped.find((g) => g.group === s.service_group);
    if (existing) existing.items.push(s);
    else grouped.push({ group: s.service_group, items: [s] });
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 z-[90]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="fixed top-0 right-0 bottom-0 w-[440px] max-w-[90vw] bg-white z-[91] flex flex-col shadow-2xl rounded-l-[16px]"
          >
            <div className="flex items-center gap-[10px] px-[20px] pt-[20px] pb-[12px] shrink-0">
              <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#dcf0ff] shrink-0">
                <Package size={18} weight="duotone" className="text-[#07abde]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span
                  className="text-[#28415c]"
                  style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                >
                  Catálogo de Serviços
                </span>
                <span
                  className="text-[#98989d] uppercase"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "16px", ...fontFeature }}
                >
                  MÓDULO PRICE · {catalog.length} serviços
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] text-[#28415c] cursor-pointer transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="px-[20px] pb-[12px] shrink-0">
              <div
                className="flex items-center gap-[10px] h-[40px] px-[14px] rounded-[100px] bg-[#f6f7f9]"
                style={{ border: "1px solid rgba(200,207,219,0.6)" }}
              >
                <MagnifyingGlass size={16} weight="bold" className="text-[#4e6987] shrink-0" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar serviço..."
                  className="flex-1 bg-transparent outline-none text-[#4e6987] placeholder-[#98989d]"
                  style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-[12px] pb-[20px]">
              {loading ? (
                <div className="flex items-center justify-center py-[60px]">
                  <CircleNotch size={24} weight="bold" className="text-[#07abde] animate-spin" />
                </div>
              ) : grouped.length === 0 ? (
                <div className="flex items-center justify-center py-[60px]">
                  <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, ...fontFeature }}>
                    Nenhum serviço encontrado.
                  </span>
                </div>
              ) : (
                grouped.map((g) => {
                  const GIcon = GROUP_ICONS[g.group];
                  const colors = GROUP_COLORS[g.group];
                  return (
                    <div key={g.group} className="mb-[16px]">
                      <div className="flex items-center gap-[8px] px-[8px] py-[6px]">
                        <div
                          className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <GIcon size={14} weight="duotone" style={{ color: colors.text }} />
                        </div>
                        <span
                          className="text-[#28415c] uppercase"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                        >
                          {groupLabels[g.group]}
                        </span>
                        <span
                          className="text-[#98989d]"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                        >
                          ({g.items.length})
                        </span>
                      </div>
                      {g.items.map((svc) => {
                        const isLinked = alreadyLinked.has(svc.id);
                        return (
                          <div
                            key={svc.id}
                            className={`flex items-center gap-[10px] px-[12px] py-[10px] rounded-[10px] transition-colors ${
                              isLinked ? "opacity-50 cursor-default" : "hover:bg-[#f6f7f9] cursor-pointer"
                            }`}
                            onClick={() => !isLinked && onAdd(svc)}
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <span
                                className="text-[#28415c] truncate"
                                style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                              >
                                {svc.name}
                              </span>
                              <span
                                className="text-[#98989d] truncate"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}
                              >
                                {svc.description}
                              </span>
                            </div>
                            <div className="flex flex-col items-end shrink-0 gap-[2px]">
                              <span className="text-[#4e6987]" style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                                {svc.base_price > 0 ? formatCurrency(svc.base_price) + "/mês" : "Projeto"}
                              </span>
                              {svc.impl_price > 0 && (
                                <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                                  IMPL. {formatCurrency(svc.impl_price)}
                                </span>
                              )}
                            </div>
                            {isLinked ? (
                              <div className="flex items-center justify-center size-[28px] shrink-0">
                                <CheckCircle size={18} weight="fill" className="text-[#3ccea7]" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center size-[28px] shrink-0 rounded-full bg-[#dcf0ff]">
                                <Plus size={14} weight="bold" className="text-[#07abde]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Main TabServices Component ── */
function TabServices({
  linked,
  onLinkedChange,
}: {
  linked: LinkedService[];
  onLinkedChange: (next: LinkedService[]) => void;
}) {
  const [catalog, setCatalog] = useState<PriceService[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchCatalog = useCallback(async () => {
    if (catalogLoaded) return;
    setCatalogLoading(true);
    try {
      const data = await listDbServices();
      setCatalog(data as PriceService[]);
      setCatalogLoaded(true);
    } catch (err) {
      console.error("Error fetching Price catalog:", err);
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogLoaded]);

  const openPicker = () => {
    setPickerOpen(true);
    fetchCatalog();
  };

  const addService = (svc: PriceService) => {
    onLinkedChange([
      ...linked,
      {
        serviceId: svc.id,
        name: svc.name,
        group: svc.service_group,
        quantity: 1,
        basePrice: svc.base_price,
        implPrice: svc.impl_price,
        hours: svc.hours_estimate,
      },
    ]);
  };

  const removeService = (id: string) => {
    onLinkedChange(linked.filter((s) => s.serviceId !== id));
  };

  const updateQty = (id: string, delta: number) => {
    onLinkedChange(
      linked.map((s) => (s.serviceId === id ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s))
    );
  };

  const alreadyLinked = new Set(linked.map((l) => l.serviceId));
  const totalMonthly = linked.reduce((sum, s) => sum + s.basePrice * s.quantity, 0);
  const totalImpl = linked.reduce((sum, s) => sum + s.implPrice * s.quantity, 0);
  const totalQty = linked.length;

  const filtered = search
    ? linked.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.serviceId.toLowerCase().includes(search.toLowerCase()) ||
          (groupLabels[s.group] || "").toLowerCase().includes(search.toLowerCase())
      )
    : linked;

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Summary */}
      <div className="flex items-center gap-[24px] flex-wrap">
        <EditableField key="svcMonthly" label="MENSAL ESTIMADO" value={formatCurrency(totalMonthly)} editable={false} />
        <EditableField key="svcImpl" label="IMPLANTAÇÃO" value={formatCurrency(totalImpl)} editable={false} />
        <EditableField key="svcQty" label="SERVIÇOS" value={String(totalQty)} editable={false} />
        <div className="flex-1" />
        <button
          className="h-[40px] px-[20px] rounded-[500px] text-[#28415c] cursor-pointer hover:bg-[#f6f7f9] transition-colors"
          style={{ border: "1.5px solid #C8CFDB", fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
        >
          Salvar alterações
        </button>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-[12px] flex-wrap">
        <div
          className="flex items-center gap-[10px] h-[40px] flex-1 min-w-[200px] px-[14px] rounded-[100px] bg-[#dde3ec]"
          style={{ border: "1px solid rgba(200,207,219,0.6)" }}
        >
          <MagnifyingGlass size={16} weight="bold" className="text-[#4e6987] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar serviços vinculados..."
            className="flex-1 bg-transparent outline-none text-[#4e6987] placeholder-[#4e6987]"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
          />
        </div>
        <button
          onClick={openPicker}
          className="h-[40px] px-[16px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors flex items-center gap-[6px]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
        >
          <Plus size={14} weight="bold" />
          Adicionar do Catálogo Price
        </button>
      </div>

      {/* Table */}
      {linked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[60px] gap-[12px]">
          <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#f6f7f9]">
            <Package size={24} weight="duotone" className="text-[#98989d]" />
          </div>
          <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            Nenhum serviço vinculado a esta oportunidade.
          </span>
          <button
            onClick={openPicker}
            className="h-[36px] px-[16px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors flex items-center gap-[6px]"
            style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
          >
            <Plus size={14} weight="bold" />
            Buscar no catálogo
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr_40px] gap-[8px] px-[4px]">
            {["Nome", "Grupo", "Horas", "Qnt.", "Valor/mês", ""].map((h, i) => (
              <span
                key={h || `col-${i}`}
                className="text-[#98989d]"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", textTransform: "uppercase", ...fontFeature }}
              >
                {h}
              </span>
            ))}
          </div>
          <div className="flex flex-col">
            {filtered.map((svc) => {
              const GIcon = GROUP_ICONS[svc.group];
              const colors = GROUP_COLORS[svc.group];
              return (
                <div key={svc.serviceId}>
                  <HorizontalDivider />
                  <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr_40px] gap-[8px] items-center py-[10px] px-[4px]">
                    <div className="flex items-center gap-[8px] min-w-0">
                      <div
                        className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <GIcon size={14} weight="duotone" style={{ color: colors.text }} />
                      </div>
                      <span
                        className="text-[#4e6987] truncate"
                        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                      >
                        {svc.name}
                      </span>
                    </div>
                    <span
                      className="text-[#4e6987] uppercase"
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                    >
                      {groupLabels[svc.group]}
                    </span>
                    <span
                      className="text-[#4e6987]"
                      style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                    >
                      {svc.hours * svc.quantity}h
                    </span>
                    <div className="flex items-center gap-[4px]">
                      <button
                        onClick={() => updateQty(svc.serviceId, -1)}
                        className="flex items-center justify-center size-[20px] rounded-full bg-[#f6f7f9] hover:bg-[#dde3ec] text-[#4e6987] cursor-pointer transition-colors text-xs font-bold"
                      >
                        −
                      </button>
                      <span
                        className="text-[#4e6987] min-w-[20px] text-center"
                        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                      >
                        {svc.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(svc.serviceId, 1)}
                        className="flex items-center justify-center size-[20px] rounded-full bg-[#f6f7f9] hover:bg-[#dde3ec] text-[#4e6987] cursor-pointer transition-colors text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span
                      className="text-[#4e6987]"
                      style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                    >
                      {formatCurrency(svc.basePrice * svc.quantity)}
                    </span>
                    <button
                      onClick={() => removeService(svc.serviceId)}
                      className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#FFEDEB] text-[#98989d] hover:text-[#FF8C76] cursor-pointer transition-colors"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })}
            <HorizontalDivider />
          </div>
        </>
      )}

      {/* Catalog Picker Drawer */}
      <CatalogPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        catalog={catalog}
        loading={catalogLoading}
        alreadyLinked={alreadyLinked}
        onAdd={addService}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Propostas (linked to Price module)                            */
/* ------------------------------------------------------------------ */

const PROPOSAL_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  rascunho: { label: "Rascunho", bg: "#F6F7F9", color: "#98989d" },
  criada: { label: "Criada", bg: "#DCF0FF", color: "#07abde" },
  enviada: { label: "Enviada", bg: "#FEEDCA", color: "#B8860B" },
  aprovada: { label: "Aprovada", bg: "#D9F8EF", color: "#135543" },
  recusada: { label: "Recusada", bg: "#FFEDEB", color: "#B13B00" },
};

function ProposalStatusBadge({ status }: { status: string }) {
  const s = PROPOSAL_STATUS[status] || PROPOSAL_STATUS.rascunho;
  return (
    <div
      className="inline-flex items-center justify-center h-[18px] px-[6px] rounded-[5px]"
      style={{ backgroundColor: s.bg }}
    >
      <span
        className="uppercase"
        style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "18px", color: s.color, ...fontFeature }}
      >
        {s.label}
      </span>
    </div>
  );
}

/* ── Proposal Picker Drawer ── */
function ProposalPicker({
  open,
  onClose,
  proposals,
  loading,
  alreadyLinkedIds,
  onLink,
}: {
  open: boolean;
  onClose: () => void;
  proposals: DbProposal[];
  loading: boolean;
  alreadyLinkedIds: Set<string>;
  onLink: (p: DbProposal) => void;
}) {
  const [q, setQ] = useState("");
  const lc = q.toLowerCase();
  const filtered = q
    ? proposals.filter(
        (p) =>
          p.id.toLowerCase().includes(lc) ||
          p.client_name.toLowerCase().includes(lc) ||
          p.status.toLowerCase().includes(lc)
      )
    : proposals;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 z-[90]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="fixed top-0 right-0 bottom-0 w-[480px] max-w-[90vw] bg-white z-[91] flex flex-col shadow-2xl rounded-l-[16px]"
          >
            {/* Header */}
            <div className="flex items-center gap-[10px] px-[20px] pt-[20px] pb-[12px] shrink-0">
              <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#dcf0ff] shrink-0">
                <ClipboardText size={18} weight="duotone" className="text-[#07abde]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span
                  className="text-[#28415c]"
                  style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                >
                  Propostas do Price
                </span>
                <span
                  className="text-[#98989d] uppercase"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "16px", ...fontFeature }}
                >
                  MÓDULO PRICE · {proposals.length} propostas
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] text-[#28415c] cursor-pointer transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Search */}
            <div className="px-[20px] pb-[12px] shrink-0">
              <div
                className="flex items-center gap-[10px] h-[40px] px-[14px] rounded-[100px] bg-[#f6f7f9]"
                style={{ border: "1px solid rgba(200,207,219,0.6)" }}
              >
                <MagnifyingGlass size={16} weight="bold" className="text-[#4e6987] shrink-0" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por ID, cliente ou status..."
                  className="flex-1 bg-transparent outline-none text-[#4e6987] placeholder-[#98989d]"
                  style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto px-[12px] pb-[20px]">
              {loading ? (
                <div className="flex items-center justify-center py-[60px]">
                  <CircleNotch size={24} weight="bold" className="text-[#07abde] animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center py-[60px]">
                  <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, ...fontFeature }}>
                    {q ? "Nenhuma proposta encontrada." : "Nenhuma proposta criada no módulo Price."}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-[4px]">
                  {filtered.map((p) => {
                    const isLinked = alreadyLinkedIds.has(p.id);
                    const svcCount = p.price_proposal_services?.length ?? 0;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-[12px] px-[14px] py-[12px] rounded-[10px] transition-colors ${
                          isLinked
                            ? "bg-[#DCF0FF]/40 cursor-default"
                            : "hover:bg-[#f6f7f9] cursor-pointer"
                        }`}
                        onClick={() => !isLinked && onLink(p)}
                      >
                        <div className="flex flex-col flex-1 min-w-0 gap-[4px]">
                          <div className="flex items-center gap-[8px]">
                            <span
                              className="text-[#28415c] font-mono"
                              style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                            >
                              {p.id}
                            </span>
                            <ProposalStatusBadge status={p.status} />
                          </div>
                          <span
                            className="text-[#4e6987] truncate"
                            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                          >
                            {p.client_name}
                          </span>
                          <div className="flex items-center gap-[12px]">
                            <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}>
                              {svcCount} serviço{svcCount !== 1 ? "s" : ""}
                            </span>
                            <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}>
                              Mensal {formatCurrency(p.total_monthly)}
                            </span>
                            <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}>
                              Impl. {formatCurrency(p.total_impl)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-[2px]">
                          <span
                            className="text-[#28415c]"
                            style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}
                          >
                            {formatCurrency(p.total_monthly * 12 + p.total_impl)}
                          </span>
                          <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                            VALOR ANUAL
                          </span>
                        </div>
                        {isLinked ? (
                          <div className="flex items-center justify-center size-[28px] shrink-0">
                            <CheckCircle size={18} weight="fill" className="text-[#3ccea7]" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center size-[28px] shrink-0 rounded-full bg-[#dcf0ff]">
                            <LinkIcon size={14} weight="bold" className="text-[#07abde]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ValueToggle is now the global ZeniteToggle from "../zenite-toggle" */

/* ── Main TabPropostas Component ── */
function TabPropostas({
  linkedProposals,
  onLinkedProposalsChange,
}: {
  linkedProposals: LinkedProposalEntry[];
  onLinkedProposalsChange: (next: LinkedProposalEntry[]) => void;
}) {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<DbProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchProposals = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const data = await listProposals();
      setCatalog(data);
      setLoaded(true);
    } catch (err) {
      console.error("Error fetching proposals from Price:", err);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const openPicker = () => {
    setPickerOpen(true);
    fetchProposals();
  };

  const addProposal = (p: DbProposal) => {
    // If it's the first proposal added, make it active by default
    const isFirst = linkedProposals.length === 0;
    onLinkedProposalsChange([
      ...linkedProposals,
      {
        id: p.id,
        clientName: p.client_name,
        totalMonthly: p.total_monthly,
        totalImpl: p.total_impl,
        active: isFirst,
        fullData: p,
      },
    ]);
    setPickerOpen(false);
  };

  const removeProposal = (id: string) => {
    const remaining = linkedProposals.filter((lp) => lp.id !== id);
    // If the removed one was active and others remain, activate the first
    const hadActive = linkedProposals.find((lp) => lp.id === id)?.active;
    if (hadActive && remaining.length > 0 && !remaining.some((r) => r.active)) {
      remaining[0].active = true;
    }
    onLinkedProposalsChange([...remaining]);
  };

  const toggleActive = (id: string) => {
    onLinkedProposalsChange(
      linkedProposals.map((lp) => ({
        ...lp,
        // Radio behavior: only one can be active. Clicking the active one turns it OFF.
        active: lp.id === id ? !lp.active : false,
      }))
    );
  };

  const alreadyLinkedIds = new Set(linkedProposals.map((lp) => lp.id));
  const activeEntry = linkedProposals.find((lp) => lp.active);

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Summary */}
      {linkedProposals.length > 0 && (
        <div className="flex items-center gap-[24px] flex-wrap">
          <EditableField
            label="PROPOSTAS VINCULADAS"
            value={String(linkedProposals.length)}
            editable={false}
          />
          {activeEntry && (
            <>
              <EditableField
                label="REFLETINDO VALOR DE"
                value={activeEntry.id}
                editable={false}
              />
              <EditableField
                label="VALOR ANUAL (12M)"
                value={formatCurrency(activeEntry.totalMonthly * 12 + activeEntry.totalImpl)}
                editable={false}
                fieldType="calculated"
                formula={`(${formatCurrency(activeEntry.totalMonthly)}/mês × 12) + ${formatCurrency(activeEntry.totalImpl)}`}
              />
            </>
          )}
          <div className="flex-1" />
          <button
            onClick={openPicker}
            className="h-[40px] px-[20px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors flex items-center gap-[6px]"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
          >
            <Plus size={14} weight="bold" />
            Adicionar proposta
          </button>
        </div>
      )}

      {/* Linked proposals list */}
      {linkedProposals.length > 0 ? (
        <div className="flex flex-col gap-[8px]">
          {linkedProposals.map((lp) => {
            const fd = lp.fullData;
            const annualValue = lp.totalMonthly * 12 + lp.totalImpl;
            const svcCount = fd.price_proposal_services?.length ?? 0;
            return (
              <motion.div
                key={lp.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="rounded-[12px] p-[16px] flex flex-col gap-[14px] transition-all"
                style={{
                  border: lp.active ? "1.5px solid #28415C" : "1.5px solid #ebedf0",
                  background: lp.active ? "#28415C" : "#f6f7f9",
                }}
              >
                {/* Top row: toggle + ID + status + actions */}
                <div className="flex items-center gap-[10px]">
                  {/* Toggle */}
                  <ZeniteToggle
                    active={lp.active}
                    onChange={() => toggleActive(lp.id)}
                    title={lp.active ? "Refletindo valor na OP" : "Clique para refletir valor na OP"}
                  />

                  <div className={`flex items-center justify-center size-[28px] rounded-[7px] shrink-0 ${lp.active ? "bg-[#3a5a7a]" : "bg-[#dcf0ff]"}`}>
                    <ClipboardText size={15} weight="duotone" className={lp.active ? "text-[#73D0FF]" : "text-[#07abde]"} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-[8px]">
                      <span
                        className={`${lp.active ? "text-[#F6F7F9]" : "text-[#28415c]"} font-mono`}
                        style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                      >
                        {fd.id}
                      </span>
                      <ProposalStatusBadge status={fd.status} />
                      {lp.active && (
                        <div className="h-[20px] px-[8px] rounded-[5px] bg-[#F6F7F9]/15 flex items-center">
                          <span
                            className="text-[#73D0FF] uppercase"
                            style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                          >
                            VALOR ATIVO
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`${lp.active ? "text-[#C8CFDB]" : "text-[#4e6987]"} truncate`}
                      style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}
                    >
                      {fd.client_name}
                    </span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => navigate(`/price/propostas/${fd.id}`)}
                    className={`h-[32px] px-[12px] rounded-[500px] cursor-pointer transition-colors flex items-center gap-[5px] ${
                      lp.active
                        ? "bg-[#F6F7F9]/15 text-[#F6F7F9] hover:bg-[#F6F7F9]/25"
                        : "bg-[#f6f7f9] text-[#4e6987] hover:bg-[#dde3ec]"
                    }`}
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                  >
                    <ArrowSquareOut size={13} weight="bold" />
                    Price
                  </button>
                  <button
                    onClick={() => removeProposal(lp.id)}
                    className={`flex items-center justify-center size-[32px] rounded-full cursor-pointer transition-colors ${
                      lp.active
                        ? "text-[#C8CFDB] hover:bg-[#F6F7F9]/15 hover:text-[#FF8C76]"
                        : "text-[#98989d] hover:bg-[#FFEDEB] hover:text-[#FF8C76]"
                    }`}
                  >
                    <LinkBreak size={15} weight="bold" />
                  </button>
                </div>

                {/* Values row (compact) */}
                <div className="flex items-center gap-[20px] flex-wrap pl-[46px]">
                  <div className="flex flex-col">
                    <span className={`${lp.active ? "text-[#C8CFDB]" : "text-[#98989d]"} uppercase`} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                      MENSAL
                    </span>
                    <span className={lp.active ? "text-[#F6F7F9]" : "text-[#4e6987]"} style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                      {formatCurrency(fd.total_monthly)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`${lp.active ? "text-[#C8CFDB]" : "text-[#98989d]"} uppercase`} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                      IMPLANTAÇÃO
                    </span>
                    <span className={lp.active ? "text-[#F6F7F9]" : "text-[#4e6987]"} style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                      {formatCurrency(fd.total_impl)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`${lp.active ? "text-[#C8CFDB]" : "text-[#98989d]"} uppercase`} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                      HORAS
                    </span>
                    <span className={lp.active ? "text-[#F6F7F9]" : "text-[#4e6987]"} style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                      {fd.total_hours}h
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`${lp.active ? "text-[#C8CFDB]" : "text-[#98989d]"} uppercase`} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                      SERVIÇOS
                    </span>
                    <span className={lp.active ? "text-[#F6F7F9]" : "text-[#4e6987]"} style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
                      {svcCount}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`${lp.active ? "text-[#C8CFDB]" : "text-[#98989d]"} uppercase`} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                      VALOR ANUAL
                    </span>
                    <span
                      className={lp.active ? "text-[#73D0FF]" : "text-[#4e6987]"}
                      style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.5, ...fontFeature }}
                    >
                      {formatCurrency(annualValue)}
                    </span>
                  </div>

                  {/* Discount badges */}
                  {fd.combo_label && fd.combo_discount_percent > 0 && (
                    <div className="h-[22px] px-[8px] rounded-[5px] bg-[#D9F8EF] flex items-center">
                      <span className="text-[#135543]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                        {fd.combo_label} −{fd.combo_discount_percent}%
                      </span>
                    </div>
                  )}
                  {fd.global_discount > 0 && (
                    <div className="h-[22px] px-[8px] rounded-[5px] bg-[#FEEDCA] flex items-center">
                      <span className="text-[#B8860B]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                        DESC. −{fd.global_discount}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-[60px] gap-[12px]">
          <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#f6f7f9]">
            <ClipboardText size={24} weight="duotone" className="text-[#98989d]" />
          </div>
          <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            Nenhuma proposta vinculada a esta oportunidade.
          </span>
          <span className="text-[#98989d] text-center max-w-[320px]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>
            Vincule propostas do módulo Price. Ative o toggle para refletir o valor de uma delas na oportunidade.
          </span>
          <button
            onClick={openPicker}
            className="h-[40px] px-[16px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer hover:bg-[#c4e4fa] transition-colors flex items-center gap-[6px]"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
          >
            <LinkIcon size={14} weight="bold" />
            Vincular Proposta
          </button>
        </div>
      )}

      {/* Proposal Picker Drawer */}
      <ProposalPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        proposals={catalog}
        loading={loading}
        alreadyLinkedIds={alreadyLinkedIds}
        onLink={addProposal}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Contrato (placeholder)                                        */
/* ------------------------------------------------------------------ */

function TabContrato() {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
        Nenhum contrato vinculado a esta oportunidade.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Relacionado                                                    */
/* ------------------------------------------------------------------ */

interface RelatedRecord {
  id: string;
  name: string;
  subtitle: string;
  type: "account" | "contact";
  route: string;
}

function TabRelacionado({ accountId, decisorId, opId }: { accountId: string | null; decisorId: string | null; opId: string }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RelatedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const related: RelatedRecord[] = [];
      try {
        // 1. Fetch the linked account
        if (accountId) {
          try {
            const acct = await getAccount(accountId);
            if (acct && !cancelled) {
              related.push({
                id: acct.id,
                name: acct.name,
                subtitle: [acct.type, acct.sector].filter(Boolean).join(" · ") || "Conta",
                type: "account",
                route: `/crm/contas/${acct.id}`,
              });
            }
          } catch (e) {
            console.warn("Could not fetch related account:", e);
          }
        }

        // 2. Fetch the decisor contact (direct relationship of the opportunity)
        if (decisorId) {
          try {
            const ct = await getContact(decisorId);
            if (ct && !cancelled) {
              related.push({
                id: ct.id,
                name: [ct.name, ct.last_name].filter(Boolean).join(" "),
                subtitle: [ct.role, ct.email].filter(Boolean).join(" · ") || "Contato (Decisor)",
                type: "contact",
                route: `/crm/contatos/${ct.id}`,
              });
            }
          } catch (e) {
            console.warn("Could not fetch decisor contact:", e);
          }
        }
      } finally {
        if (!cancelled) {
          setRecords(related);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [accountId, decisorId, opId]);

  const typeConfig = {
    account: { icon: Buildings, color: "#3CCEA7", bg: "#D9F8EF", label: "CONTA" },
    contact: { icon: IdentificationCard, color: "#E8455A", bg: "#FFEDEB", label: "CONTATO" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <CircleNotch size={24} className="animate-spin text-[#c2c2c7]" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
          Nenhum registro relacionado a esta oportunidade.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[8px] py-[8px]">
      {records.map((rec) => {
        const cfg = typeConfig[rec.type];
        const Icon = cfg.icon;
        return (
          <div
            key={rec.id}
            className="group/rel flex items-center gap-[12px] rounded-[10px] bg-[#F6F7F9] px-[14px] py-[12px] cursor-pointer transition-all hover:ring-1 hover:ring-[#07abde]/40"
            onClick={() => navigate(rec.route)}
          >
            {/* Icon badge */}
            <div
              className="flex items-center justify-center w-[34px] h-[34px] rounded-[8px] shrink-0"
              style={{ background: cfg.bg }}
            >
              <Icon size={18} weight="duotone" style={{ color: cfg.color }} />
            </div>

            {/* Text */}
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="text-[#1a1a1a] truncate"
                style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
              >
                {rec.name}
              </span>
              <span
                className="text-[#98989d] truncate"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
              >
                {rec.subtitle}
              </span>
            </div>

            {/* Type badge */}
            <span
              className="shrink-0 rounded-[500px] px-[8px] py-[2px]"
              style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
            >
              {cfg.label}
            </span>

            {/* Arrow */}
            <ArrowSquareOut size={16} className="text-[#c2c2c7] group-hover/rel:text-[#07abde] transition-colors shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmOpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { minimize } = useMultitask();
  const { trackRecent } = useCrmSearch();
  const [op, setOp] = useState<OpData>(emptyOp);
  const [opLoading, setOpLoading] = useState(true);
  const { customFields, customValues, updateCustomValue } = useCustomFields("oportunidade", id);
  const { isVisible: v, isRequired: rq, getLabel: fl } = useFieldVisibility("oportunidade");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [decisorId, setDecisionMakerId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const dbRow = await getOpportunity(id);
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
        // Resolve company FK (account ID) → account name
        let companyName = dbRow.company ?? "";
        if (dbRow.company && dbRow.company.startsWith("AC-")) {
          try {
            const acct = await getAccount(dbRow.company);
            if (acct?.name) companyName = acct.name;
          } catch { /* keep the ID as fallback */ }
        }
        // Resolve decisor FK (contact ID) → contact name
        let decisorName = dbRow.decisor ?? "";
        const rawDecisionMakerId = dbRow.decisor ?? null;
        if (rawDecisionMakerId && rawDecisionMakerId.startsWith("CT-")) {
          try {
            const ct = await getContact(rawDecisionMakerId);
            if (ct) {
              decisorName = [ct.name, ct.last_name].filter(Boolean).join(" ") || rawDecisionMakerId;
            }
          } catch (e) {
            console.warn("Could not resolve decisor name for", rawDecisionMakerId, e);
          }
        }
        if (cancelled) return;
        // Parse labels from DB (JSON array or null)
        let parsedLabels: { text: string; bg: string; color: string }[] = [];
        if (dbRow.labels) {
          try { parsedLabels = typeof dbRow.labels === "string" ? JSON.parse(dbRow.labels) : dbRow.labels; } catch { /* ignore */ }
        }
        // Store raw IDs for linking
        const rawAccountId = dbRow.account ?? dbRow.company ?? null;
        if (rawAccountId && rawAccountId.startsWith("AC-")) setAccountId(rawAccountId);
        if (rawDecisionMakerId && rawDecisionMakerId.startsWith("CT-")) setDecisionMakerId(rawDecisionMakerId);
        setOp({
          ...emptyOp,
          id: dbRow.id,
          name: dbRow.name ?? "",
          company: companyName,
          account: companyName,
          stage: (dbRow.stage as OpStage) ?? "apresentacao",
          closeDate: dbRow.close_date ?? "",
          lastActivity: relativeTime(dbRow.last_activity_date ?? dbRow.updated_at),
          owner: dbRow.owner ?? "",
          type: dbRow.type ?? "",
          tipo: dbRow.tipo ?? "",
          decisor: decisorName,
          origin: dbRow.origin ?? "",
          score: dbRow.score ?? 0,
          scoreLabel: dbRow.score_label ?? "",
          labels: parsedLabels,
          createdAt: fmtDate(dbRow.created_at),
          updatedAt: fmtDate(dbRow.updated_at),
          createdBy: dbRow.created_by ?? "",
          updatedBy: dbRow.updated_by ?? "",
          needsObjective: dbRow.needs_objective ?? "",
          needsCurrentSituation: dbRow.needs_current_situation ?? "",
          needsChallenges: dbRow.needs_challenges ?? "",
          needsBudget: dbRow.needs_budget ?? "",
          needsTimeline: dbRow.needs_timeline ?? "",
          needsNotes: dbRow.needs_notes ?? "",
          mktCampanha: dbRow.mkt_campanha ?? "",
          mktGrupoAnuncios: dbRow.mkt_grupo_anuncios ?? "",
          mktAnuncio: dbRow.mkt_anuncio ?? "",
          mktUltimaConversao: dbRow.mkt_ultima_conversao ?? "",
          mktCanal: dbRow.mkt_canal ?? "",
          stageComplement: dbRow.stage_complement ?? "",
          mostRecent: dbRow.most_recent != null ? String(dbRow.most_recent) : "false",
        });
        setStage((dbRow.stage as OpStage) ?? "apresentacao");
        trackRecent({ id: dbRow.id, label: dbRow.name, subtitle: companyName, objectType: "opportunity", visitedAt: Date.now() });
      } catch (err) {
        console.error("Error loading opportunity detail:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("not found")) {
            toast.error("Oportunidade não encontrada no banco de dados.");
            navigate("/crm/oportunidades");
            return;
          }
        }
      } finally {
        if (!cancelled) setOpLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const [stage, setStage] = useState<OpStage>(op.stage);
  const [activeTab, setActiveTab] = useState<OpTab>("detalhes");
  const [fieldHistoryEntries, setFieldHistoryEntries] = useState<FieldHistoryEntry[]>([]);

  /* ── Lifted state for computed OP value ── */
  const [linkedServices, setLinkedServices] = useState<LinkedService[]>([]);
  const [linkedProposals, setLinkedProposals] = useState<LinkedProposalEntry[]>([]);

  // Auto-load proposals linked to this opportunity from DB
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getProposalsByCrm({ opportunityId: id });
        if (cancelled || data.length === 0) return;
        const entries: LinkedProposalEntry[] = data.map((p, i) => ({
          id: p.id,
          clientName: p.client_name,
          totalMonthly: p.total_monthly,
          totalImpl: p.total_impl,
          active: i === 0,
          fullData: p,
        }));
        setLinkedProposals((prev) => {
          // Merge: keep manually added, add DB ones not already present
          const existingIds = new Set(prev.map((lp) => lp.id));
          const newOnes = entries.filter((e) => !existingIds.has(e.id));
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
        });
      } catch (err) {
        console.error("Error auto-loading linked proposals for opportunity:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const opCalc = computeOpValue(linkedServices, linkedProposals);

  // ── Field History: seed initial stage value on mount ──
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      seedInitialValue({
        entity_type: "oportunidade",
        entity_id: op.id,
        field_name: "stage",
        current_value: op.stage,
        created_at: threeDaysAgo.toISOString(),
        changed_by: op.createdBy,
      });
      setFieldHistoryEntries(
        getEntityHistory({ entity_type: "oportunidade", entity_id: op.id })
      );
    }
  }, [op.id, op.stage, op.createdBy]);

  // ── Stage change handler with field history recording ──
  const handleStageChange = useCallback(
    (newStage: OpStage) => {
      if (newStage === stage) return;
      recordChange({
        entity_type: "oportunidade",
        entity_id: op.id,
        field_name: "stage",
        old_value: stage,
        new_value: newStage,
        changed_by: "Nome Sobrenome",
        change_source: "ui",
      });
      setStage(newStage);
      setFieldHistoryEntries(
        getEntityHistory({ entity_type: "oportunidade", entity_id: op.id })
      );
      // Persist to DB
      patchOpApi(op.id, { stage: newStage }).catch((err) =>
        console.error("Error persisting op stage change:", err)
      );
    },
    [stage, op.id]
  );

  // ── Account change handler ──
  const handleAccountChange = useCallback(
    (newAccountId: string | null, newAccountName: string) => {
      setAccountId(newAccountId);
      setOp((prev) => ({ ...prev, account: newAccountName, company: newAccountName }));
      // Persist to DB
      if (op.id) {
        patchOpApi(op.id, { account: newAccountId ?? "", company: newAccountId ?? "" }).catch((err) =>
          console.error("Error persisting account change:", err)
        );
      }
    },
    [op.id],
  );

  // ── Decision maker change handler ──
  const handleDecisionMakerChange = useCallback(
    (newContactId: string | null, newContactName: string) => {
      setDecisionMakerId(newContactId);
      setOp((prev) => ({ ...prev, decisor: newContactName || "Nome Sobrenome" }));
      // Persist to DB
      if (op.id) {
        patchOpApi(op.id, { decisor: newContactId ?? "" }).catch((err) =>
          console.error("Error persisting decision maker change:", err)
        );
      }
    },
    [op.id],
  );

  // ── Generic field update: local state + DB persist ──
  const OP_FIELD_TO_DB: Record<string, string> = {
    name: "name", owner: "owner", type: "type", tipo: "tipo", origin: "origin",
    mostRecent: "most_recent", stageComplement: "stage_complement",
    closeDate: "close_date",
    needsObjective: "needs_objective", needsCurrentSituation: "needs_current_situation",
    needsChallenges: "needs_challenges", needsBudget: "needs_budget",
    needsTimeline: "needs_timeline", needsNotes: "needs_notes",
    mktCampanha: "mkt_campanha", mktGrupoAnuncios: "mkt_grupo_anuncios",
    mktAnuncio: "mkt_anuncio", mktUltimaConversao: "mkt_ultima_conversao",
    mktCanal: "mkt_canal",
  };

  const updateOpField = useCallback(
    (fieldKey: string, value: string) => {
      setOp((prev) => ({ ...prev, [fieldKey]: value }));
      const dbKey = OP_FIELD_TO_DB[fieldKey];
      if (!dbKey) return;
      patchOpApi(op.id, { [dbKey]: value } as any).catch((err) =>
        console.error(`Error persisting op ${dbKey}:`, err)
      );
    },
    [op.id]
  );

  // ── Resolve stageLastChangedAt from field history ──
  const stageLastChangedAt =
    getLastChangeDate({
      entity_type: "oportunidade",
      entity_id: op.id,
      field_name: "stage",
    }) ?? op.updatedAt;

  // ── Formula context for calculated fields ──
  const formulaCtx: FormulaContext = {
    stage,
    stageLastChangedAt,
    score: op.score,
    closeDate: op.closeDate,
  };

  // Right panel type depends on active tab
  const rightPanel: "calls" | "activities" | "none" =
    activeTab === "detalhes" ? "calls" : activeTab === "propostas" || activeTab === "servicos" || activeTab === "relacionado" || activeTab === "contrato" ? "activities" : "none";

  if (opLoading) {
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
        {/* Row 1: OP name + labels + actions */}
        <div className="flex items-center justify-between gap-4 mb-[12px]">
          {/* Left: icon + name */}
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#dcf0ff] shrink-0">
              <SketchLogo size={18} weight="duotone" className="text-[#07abde]" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-[#64676c] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
              >
                OPORTUNIDADE
              </span>
              <span
                className="text-[#28415c]"
                style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...fontFeature }}
              >
                {op.name}
              </span>
            </div>
          </div>

          {/* Right: labels + divider + actions + close */}
          <div className="flex items-center gap-[16px]">
            <div className="hidden md:flex items-center gap-[8px]">
              {op.labels.map((lbl, i) => (
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
                  id: op.id,
                  title: op.name,
                  subtitle: op.id,
                  path: `/crm/oportunidades/${op.id}`,
                  statusColor: "#07abde",
                });
                navigate("/crm/oportunidades");
              }}>
                <ArrowSquareDownRight size={18} weight="bold" />
              </ActionButton>
              <ActionButton onClick={() => navigate(-1)}>
                <X size={18} weight="bold" />
              </ActionButton>
            </div>

            {/* Mobile close */}
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
          <EditableField key="sumId" label={fl("op_id")} value={op.id} editable={false} />
          <EditableField key="sumAccount" label={fl("op_account")} value={op.company} editable={false} />
          <EditableField key="sumClose" label={fl("op_close_date")} value={op.closeDate} editable={false} />
          <EditableField
            key="sumValue"
            label={
              opCalc.source === "proposta"
                ? "VALOR (PROPOSTA)"
                : opCalc.source === "servicos"
                ? "VALOR (SERVIÇOS)"
                : "VALOR"
            }
            value={opCalc.value > 0 ? formatCurrency(opCalc.value) : "—"}
            editable={false}
            fieldType={opCalc.source !== "nenhum" ? "calculated" : undefined}
            formula={
              opCalc.source !== "nenhum"
                ? `(${formatCurrency(opCalc.monthly)}/mês × 12) + ${formatCurrency(opCalc.impl)} impl.`
                : undefined
            }
          />
          <EditableField key="sumLastActivity" label="ÚLTIMA ATIVIDADE" value={op.lastActivity} ai editable={false} />
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
                    <StageBar stages={STAGES} current={stage} onChange={handleStageChange} layoutId="op-pipeline-active" />
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
                        op={op}
                        stage={stage}
                        formulaCtx={formulaCtx}
                        fieldHistoryEntries={fieldHistoryEntries}
                        accountId={accountId}
                        onAccountChange={handleAccountChange}
                        decisorId={decisorId}
                        onDecisionMakerChange={handleDecisionMakerChange}
                        onFieldChange={updateOpField}
                        customFields={customFields}
                        customValues={customValues}
                        onCustomFieldChange={updateCustomValue}
                        isVisible={v}
                        getLabel={fl}
                        isRequired={rq}
                      />
                    )}
                    {activeTab === "servicos" && (
                      <TabServices linked={linkedServices} onLinkedChange={setLinkedServices} />
                    )}
                    {activeTab === "propostas" && (
                      <TabPropostas
                        linkedProposals={linkedProposals}
                        onLinkedProposalsChange={setLinkedProposals}
                      />
                    )}
                    {activeTab === "contrato" && <TabContrato />}
                    {activeTab === "relacionado" && <TabRelacionado accountId={accountId} decisorId={decisorId} opId={op.id} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (independent, below header) */}
        {rightPanel !== "none" && (
          <div className="hidden xl:flex flex-col w-[306px] shrink-0 bg-white rounded-[16px] overflow-hidden">
            {rightPanel === "calls" && <CallLogPanel calls={mockCalls} layoutId="op-call-tab" />}
            {rightPanel === "activities" && <ActivityPanel activities={mockActivities} />}
          </div>
        )}
      </div>
    </div>
  );
}