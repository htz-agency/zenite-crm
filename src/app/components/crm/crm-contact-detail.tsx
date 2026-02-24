/**
 * CRM Contact Detail — Full-page detail view
 *
 * Red cherry palette: #ffedeb, #ffc6be, #ff8c76, #431100
 * Loads from Supabase via getContact(), persists via patchContact().
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  IdentificationCard,
  CaretDown,
  CaretRight,
  X,
  Tag,
  ClockCounterClockwise,
  PencilSimple,
  Trash,
  Link as LinkIcon,
  CopySimple,
  Plus,
  GearSix,
  ListBullets,
  ArrowSquareDownRight,
  FunnelSimple,
  Buildings,
  SketchLogo,
  CircleNotch,
  Sparkle,
  Invoice,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";
import { EditableField } from "./editable-field";
import { useMultitask } from "../multitask-context";
import { useCrmSearch } from "./crm-search-context";
import {
  getContact,
  patchContact as patchCtApi,
  getAccount,
  type DbContact,
} from "./crm-api";
import { toast } from "sonner";
import { DraggableFieldGrid, FieldDndProvider } from "./draggable-field-grid";
import { getFieldOptions, getFieldType } from "./crm-field-config";
import { useCustomFields } from "./use-custom-fields";
import { useFieldVisibility } from "./use-field-visibility";
import { AccountSearchField } from "./account-search-field";
import { CrmLinkedProposals } from "./crm-linked-proposals";
import {
  fontFeature,
  type Activity,
  type CallRecord,
  activityConfig,
  VerticalDivider,
  ActionButton,
  ActivityItem,
  SectionToggle,
  StageBar,
  CallLogPanel,
} from "./crm-detail-shared";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

type ContactStage = "prospeccao" | "ativo" | "inativo" | "parceiro";
type ContactTab = "detalhes" | "oportunidades" | "propostas" | "contrato";

interface ContactData {
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

/** Empty contact — used as initial state before DB fetch */
const emptyContact: ContactData = {
  id: "",
  name: "",
  lastName: "",
  role: "",
  department: "",
  company: "",
  phone: "",
  mobile: "",
  email: "",
  linkedin: "",
  website: "",
  address: "",
  stage: "prospeccao",
  owner: "",
  origin: "",
  birthDate: "",
  cpf: "",
  preferredContact: "",
  doNotContact: "Nao",
  tags: "",
  notes: "",
  account: "",
  createdAt: "",
  updatedAt: "",
  createdBy: "",
  updatedBy: "",
  lastViewedDate: "",
  lastReferencedDate: "",
  systemModstamp: "",
  isDeleted: "Nao",
};

interface StageConfig {
  label: string;
  bg: string;
  color: string;
}

const stageConfig: Record<ContactStage, StageConfig> = {
  prospeccao: { label: "PROSPECÇÃO", bg: "#ffc6be", color: "#431100" },
  ativo: { label: "ATIVO", bg: "#d9f8ef", color: "#135543" },
  inativo: { label: "INATIVO", bg: "#f0f2f5", color: "#64676c" },
  parceiro: { label: "PARCEIRO", bg: "#dde3ec", color: "#28415c" },
};

const STAGES: { key: ContactStage; label: string }[] = [
  { key: "prospeccao", label: "PROSPECÇÃO" },
  { key: "ativo", label: "ATIVO" },
  { key: "inativo", label: "INATIVO" },
  { key: "parceiro", label: "PARCEIRO" },
];

const TABS: { key: ContactTab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "detalhes", label: "Detalhes", icon: ListBullets },
  { key: "oportunidades", label: "Oportunidades", icon: SketchLogo },
  { key: "propostas", label: "Propostas", icon: Invoice },
  { key: "contrato", label: "Contrato", icon: LinkIcon },
];

/* ------------------------------------------------------------------ */
/*  Mock data (activities & calls)                                     */
/* ------------------------------------------------------------------ */

const mockActivities: Activity[] = [
  { id: "a1", type: "compromisso", label: "Compromisso", date: "04/01/2024 09:30", group: "FUTURO" },
  { id: "a2", type: "tarefa", label: "Tarefa", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a3", type: "ligacao", label: "Ligação", date: "04/01/2024 09:30", group: "JULHO" },
  { id: "a4", type: "nota", label: "Nota", date: "04/01/2024 09:30", group: "JUNHO" },
];

const mockCalls: CallRecord[] = [
  { id: "c1", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
  { id: "c2", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
  { id: "c3", phone: "+55 98899-8899", date: "04/07/2023 09:30", avatarUrl: "" },
];





/* ------------------------------------------------------------------ */
/*  Activity Panel                                                     */
/* ------------------------------------------------------------------ */

function ActivityPanel({ activities }: { activities: Activity[] }) {
  const grouped: { group: string; items: Activity[] }[] = [];
  activities.forEach((a) => {
    const existing = grouped.find((g) => g.group === a.group);
    if (existing) existing.items.push(a);
    else grouped.push({ group: a.group, items: [a] });
  });

  return (
    <div className="flex flex-col h-full">
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
        <button className="flex items-center justify-center gap-[4px] h-[40px] px-[20px] rounded-[500px] bg-[#FFEDEB] text-[#431100] cursor-pointer hover:bg-[#ffc6be] transition-colors">
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
  contact,
  accountId,
  onAccountChange,
  onFieldChange,
  customFields,
  customValues,
  onCustomFieldChange,
  isVisible,
  getLabel,
  isRequired,
}: {
  contact: ContactData;
  accountId: string | null;
  onAccountChange?: (newAccountId: string | null, newAccountName: string) => void;
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
  const [contactInfoOpen, setContactInfoOpen] = useState(true);
  const [complementOpen, setComplementOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);

  return (
    <FieldDndProvider>
      <div className="flex flex-col gap-[4px]">
        {/* ── Detalhes do Contato ── */}
        <SectionToggle title="Detalhes do Contato" expanded={detailsOpen} onToggle={() => setDetailsOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`ct-base-${contact.id}`} columns={2}>
              {fv("ct_owner") && <EditableField key="ctOwner" label={fl("ct_owner")} required={rq("ct_owner")} value={contact.owner} fieldType="user" avatar={imgAvatar} onChange={(val) => onFieldChange?.("owner", val)} />}
              {fv("ct_name") && <EditableField key="ctName" label={fl("ct_name")} required={rq("ct_name")} value={contact.name} fieldType="text" onChange={(val) => onFieldChange?.("name", val)} />}
              {fv("ct_last_name") && <EditableField key="ctLastName" label={fl("ct_last_name")} required={rq("ct_last_name")} value={contact.lastName} fieldType="text" onChange={(val) => onFieldChange?.("lastName", val)} />}
              {fv("ct_account") && <AccountSearchField
                key="ctAccount"
                value={contact.account}
                accountId={accountId}
                onSelect={(id, name) => onAccountChange?.(id, name)}
                onUnlink={() => onAccountChange?.(null, "")}
                onNavigate={(id) => navigate(`/crm/contas/${id}`)}
              />}
              {fv("ct_role") && <EditableField key="ctRole" label={fl("ct_role")} required={rq("ct_role")} value={contact.role} fieldType="text" onChange={(val) => onFieldChange?.("role", val)} />}
              {fv("ct_department") && <EditableField key="ctDept" label={fl("ct_department")} required={rq("ct_department")} value={contact.department} fieldType="text" onChange={(val) => onFieldChange?.("department", val)} />}
              {fv("ct_origin") && <EditableField
                key="ctOrigin"
                label={fl("ct_origin")}
                required={rq("ct_origin")}
                value={contact.origin}
                fieldType={getFieldType("contato", "ct_origin", "type")}
                onChange={(val) => onFieldChange?.("origin", val)}
                options={getFieldOptions("contato", "ct_origin")}
              />}
              {fv("ct_birth_date") && <EditableField key="ctBirthDate" label={fl("ct_birth_date")} required={rq("ct_birth_date")} value={contact.birthDate} fieldType="date" onChange={(val) => onFieldChange?.("birthDate", val)} />}
              {fv("ct_cpf") && <EditableField key="ctCpf" label={fl("ct_cpf")} required={rq("ct_cpf")} value={contact.cpf} onChange={(val) => onFieldChange?.("cpf", val)} />}
            </DraggableFieldGrid>
          </div>
        </SectionToggle>

        {/* ── Informacoes de Contato ── */}
        <SectionToggle title="Informacoes de Contato" expanded={contactInfoOpen} onToggle={() => setContactInfoOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`ct-info-${contact.id}`} columns={2}>
              {fv("ct_phone") && <EditableField key="ctPhone" label={fl("ct_phone")} required={rq("ct_phone")} value={contact.phone} fieldType="phone" onChange={(val) => onFieldChange?.("phone", val)} />}
              {fv("ct_mobile") && <EditableField key="ctMobile" label={fl("ct_mobile")} required={rq("ct_mobile")} value={contact.mobile} fieldType="phone" onChange={(val) => onFieldChange?.("mobile", val)} />}
              {fv("ct_email") && <EditableField key="ctEmail" label={fl("ct_email")} required={rq("ct_email")} value={contact.email} fieldType="email" onChange={(val) => onFieldChange?.("email", val)} />}
              {fv("ct_linkedin") && <EditableField key="ctLinkedin" label={fl("ct_linkedin")} required={rq("ct_linkedin")} value={contact.linkedin} fieldType="link" onChange={(val) => onFieldChange?.("linkedin", val)} />}
              {fv("ct_website") && <EditableField key="ctWebsite" label={fl("ct_website")} required={rq("ct_website")} value={contact.website} fieldType="link" onChange={(val) => onFieldChange?.("website", val)} />}
              {fv("ct_address") && <EditableField key="ctAddress" label={fl("ct_address")} required={rq("ct_address")} value={contact.address} fieldType="address" onChange={(val) => onFieldChange?.("address", val)} />}
              {fv("ct_preferred_contact") && <EditableField
                key="ctPrefContact"
                label={fl("ct_preferred_contact")}
                required={rq("ct_preferred_contact")}
                value={contact.preferredContact}
                fieldType={getFieldType("contato", "ct_preferred_contact", "combobox")}
                onChange={(val) => onFieldChange?.("preferredContact", val)}
                options={getFieldOptions("contato", "ct_preferred_contact")}
              />}
              {fv("ct_do_not_contact") && <EditableField key="ctDnc" label={fl("ct_do_not_contact")} required={rq("ct_do_not_contact")} value={contact.doNotContact} fieldType="boolean" onChange={(val) => onFieldChange?.("doNotContact", val)} />}
            </DraggableFieldGrid>
          </div>
        </SectionToggle>

        {/* ── Dados Complementares ── */}
        <SectionToggle title="Dados Complementares" expanded={complementOpen} onToggle={() => setComplementOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`ct-comp-${contact.id}`} columns={2}>
              {fv("ct_tags") && <EditableField
                key="ctTags"
                label={fl("ct_tags")}
                value={contact.tags}
                fieldType={getFieldType("contato", "ct_tags", "multipicklist")}
                onChange={(val) => onFieldChange?.("tags", val)}
                options={getFieldOptions("contato", "ct_tags")}
              />}
              {fv("ct_notes") && <EditableField key="ctNotes" label={fl("ct_notes")} value={contact.notes} fieldType="textarea" onChange={(val) => onFieldChange?.("notes", val)} />}
            </DraggableFieldGrid>
          </div>
        </SectionToggle>

        {/* ── Informacoes ── */}
        <SectionToggle title="Informacoes do Contato" expanded={infoOpen} onToggle={() => setInfoOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`ct-audit-${contact.id}`} columns={3}>
              <EditableField key="ctUpdAt" label={fl("ct_updated_at")} value={contact.updatedAt} editable={false} />
              <EditableField key="ctCrAt" label={fl("ct_created_at")} value={contact.createdAt} editable={false} />
              <EditableField key="ctUpdBy" label={fl("ct_updated_by")} value={contact.updatedBy} fieldType="user" avatar={imgAvatar} editable={false} />
              <EditableField key="ctCrBy" label={fl("ct_created_by")} value={contact.createdBy} fieldType="user" avatar={imgAvatar} editable={false} />
            </DraggableFieldGrid>
          </div>
        </SectionToggle>

        {/* ── Sistema ── */}
        <SectionToggle title="Informacoes do Sistema" expanded={systemOpen} onToggle={() => setSystemOpen((v) => !v)}>
          <div className="mt-[12px] pl-[39px]">
            <DraggableFieldGrid storageKey={`ct-sys-${contact.id}`} columns={3}>
              <EditableField key="ctSysId" label={fl("ct_id")} value={contact.id} fieldType="id" />
              <EditableField key="ctSysLastView" label={fl("ct_last_viewed")} value={contact.lastViewedDate} editable={false} />
              <EditableField key="ctSysLastRef" label={fl("ct_last_ref")} value={contact.lastReferencedDate} editable={false} />
              <EditableField key="ctSysDeleted" label={fl("ct_is_deleted")} value={contact.isDeleted} fieldType="boolean" editable={false} />
              <EditableField key="ctSysModstamp" label={fl("ct_system_modstamp")} value={contact.systemModstamp} editable={false} />
            </DraggableFieldGrid>
          </div>
        </SectionToggle>

        {/* ── Campos Customizados ── */}
        {customFields && customFields.length > 0 && (
          <SectionToggle title="Campos Customizados" expanded={true} onToggle={() => {}}>
            <div className="mt-[12px] pl-[39px]">
              <DraggableFieldGrid storageKey={`ct-custom-${contact.id}`} columns={2}>
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
        )}
      </div>
    </FieldDndProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Oportunidades (placeholder)                                   */
/* ------------------------------------------------------------------ */

function TabOportunidades() {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
        Nenhuma oportunidade vinculada a este contato.
      </span>
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
        Nenhum contrato vinculado a este contato.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { minimize } = useMultitask();
  const { trackRecent } = useCrmSearch();
  const [contact, setContact] = useState<ContactData>(emptyContact);
  const [loading, setLoading] = useState(true);
  const { customFields, customValues, updateCustomValue } = useCustomFields("contato", id);
  const { isVisible: v, isRequired: rq, getLabel: fl } = useFieldVisibility("contato");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [stage, setStage] = useState<ContactStage>("prospeccao");
  const [activeTab, setActiveTab] = useState<ContactTab>("detalhes");

  /* ── Load contact from Supabase ── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const dbRow = await getContact(id);
        if (cancelled) return;
        const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR") : "");

        // Resolve account FK
        let companyName = dbRow.company ?? "";
        const rawAccountId = dbRow.account ?? dbRow.company ?? null;
        if (rawAccountId && rawAccountId.startsWith("AC-")) {
          try {
            const acct = await getAccount(rawAccountId);
            if (acct?.name) companyName = acct.name;
          } catch { /* keep ID as fallback */ }
        }
        if (cancelled) return;
        if (rawAccountId && rawAccountId.startsWith("AC-")) setAccountId(rawAccountId);

        setContact({
          ...emptyContact,
          id: dbRow.id,
          name: dbRow.name ?? "",
          lastName: dbRow.last_name ?? "",
          role: dbRow.role ?? "",
          department: dbRow.department ?? "",
          company: companyName,
          account: companyName,
          phone: dbRow.phone ?? "",
          mobile: dbRow.mobile ?? "",
          email: dbRow.email ?? "",
          linkedin: dbRow.linkedin ?? "",
          website: dbRow.website ?? "",
          address: dbRow.address ?? "",
          stage: (dbRow.stage as ContactStage) ?? "prospeccao",
          owner: dbRow.owner ?? "",
          origin: dbRow.origin ?? "",
          birthDate: dbRow.birth_date ?? "",
          cpf: dbRow.cpf ?? "",
          preferredContact: dbRow.preferred_contact ?? "",
          doNotContact: dbRow.do_not_contact ? "Sim" : "Nao",
          tags: dbRow.tags ?? "",
          notes: dbRow.notes ?? "",
          createdAt: fmtDate(dbRow.created_at),
          updatedAt: fmtDate(dbRow.updated_at),
          createdBy: dbRow.created_by ?? "",
          updatedBy: dbRow.updated_by ?? "",
          lastViewedDate: dbRow.last_viewed_date ?? "",
          lastReferencedDate: dbRow.last_referenced_date ?? "",
          systemModstamp: dbRow.system_modstamp ?? "",
          isDeleted: dbRow.is_deleted ? "Sim" : "Nao",
          avatar: dbRow.avatar ?? undefined,
        });
        setStage((dbRow.stage as ContactStage) ?? "prospeccao");
        trackRecent({
          id: dbRow.id,
          label: [dbRow.name, dbRow.last_name].filter(Boolean).join(" "),
          subtitle: companyName,
          objectType: "contact",
          visitedAt: Date.now(),
        });
      } catch (err) {
        console.error("Error loading contact detail:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("not found")) {
            toast.error("Contato nao encontrado no banco de dados.");
            navigate("/crm/contatos");
            return;
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ── Stage change handler ── */
  const handleStageChange = useCallback(
    (newStage: ContactStage) => {
      if (newStage === stage) return;
      setStage(newStage);
      setContact((prev) => ({ ...prev, stage: newStage }));
      patchCtApi(contact.id, { stage: newStage }).catch((err) =>
        console.error("Error persisting contact stage change:", err)
      );
    },
    [stage, contact.id]
  );

  /* ── Account change handler ── */
  const handleAccountChange = useCallback(
    (newAccountId: string | null, newAccountName: string) => {
      setAccountId(newAccountId);
      setContact((prev) => ({ ...prev, account: newAccountName, company: newAccountName }));
      if (contact.id) {
        patchCtApi(contact.id, { account: newAccountId ?? "", company: newAccountId ?? "" } as any).catch((err) =>
          console.error("Error persisting contact account change:", err)
        );
      }
    },
    [contact.id]
  );

  /* ── Generic field update: local state + DB persist ── */
  const CT_FIELD_TO_DB: Record<string, string> = {
    name: "name",
    lastName: "last_name",
    role: "role",
    department: "department",
    phone: "phone",
    mobile: "mobile",
    email: "email",
    linkedin: "linkedin",
    website: "website",
    address: "address",
    owner: "owner",
    origin: "origin",
    birthDate: "birth_date",
    cpf: "cpf",
    preferredContact: "preferred_contact",
    doNotContact: "do_not_contact",
    tags: "tags",
    notes: "notes",
  };

  const updateContactField = useCallback(
    (fieldKey: string, value: string) => {
      setContact((prev) => ({ ...prev, [fieldKey]: value }));
      const dbKey = CT_FIELD_TO_DB[fieldKey];
      if (!dbKey) return;
      let dbValue: unknown = value;
      if (dbKey === "do_not_contact") dbValue = value === "Sim";
      patchCtApi(contact.id, { [dbKey]: dbValue } as any).catch((err) =>
        console.error(`Error persisting contact ${dbKey}:`, err)
      );
    },
    [contact.id]
  );

  const fullName = `${contact.name} ${contact.lastName}`.trim();
  const sc = stageConfig[stage];

  const rightPanel: "calls" | "activities" =
    activeTab === "detalhes" ? "calls" : "activities";

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircleNotch size={32} weight="bold" className="text-[#ff8c76] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-auto">
      {/* ═══════ TOP HEADER BAR ═══════ */}
      <div className="bg-white rounded-[16px] p-[20px] pb-[16px] shrink-0">
        {/* Row 1: Name + actions */}
        <div className="flex items-center justify-between gap-4 mb-[12px]">
          {/* Left: icon + name */}
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#ffedeb] shrink-0">
              <IdentificationCard size={18} weight="duotone" className="text-[#ff8c76]" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-[#64676c] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
              >
                CONTATO
              </span>
              <span
                className="text-[#28415c]"
                style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...fontFeature }}
              >
                {fullName || "Sem nome"}
              </span>
            </div>
          </div>

          {/* Right: stage badge + divider + actions + close */}
          <div className="flex items-center gap-[16px]">
            {/* Stage badge */}
            <div
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px]"
              style={{ backgroundColor: sc.bg, color: sc.color }}
            >
              <span
                className="uppercase whitespace-nowrap"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
              >
                {sc.label}
              </span>
            </div>

            {/* Company badge */}
            {contact.company && (
              <div className="hidden md:flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-[#ffc6be] text-[#431100]">
                <Buildings size={14} weight="fill" />
                <span
                  className="uppercase whitespace-nowrap"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {contact.company}
                </span>
              </div>
            )}

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
                  id: contact.id,
                  title: fullName,
                  subtitle: contact.id,
                  path: `/crm/contatos/${contact.id}`,
                  statusColor: "#ff8c76",
                });
                navigate("/crm/contatos");
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
          <EditableField label={fl("ct_id")} value={contact.id} editable={false} />
          <EditableField label={fl("ct_role")} value={contact.role} editable={false} />
          <EditableField label={fl("ct_account")} value={contact.company} editable={false} />
          <EditableField label={fl("ct_email")} value={contact.email} fieldType="email" editable={false} />
          <EditableField label={fl("ct_phone")} value={contact.phone} fieldType="phone" editable={false} />
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
                {/* Stage Control (only in detail tab) */}
                {activeTab === "detalhes" && (
                  <div className="mb-[24px]">
                    <StageBar stages={STAGES} current={stage} onChange={handleStageChange} layoutId="ct-stage-active" activeColor="#431100" />
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
                        contact={contact}
                        accountId={accountId}
                        onAccountChange={handleAccountChange}
                        onFieldChange={updateContactField}
                        customFields={customFields}
                        customValues={customValues}
                        onCustomFieldChange={updateCustomValue}
                        isVisible={v}
                        getLabel={fl}
                        isRequired={rq}
                      />
                    )}
                    {activeTab === "oportunidades" && <TabOportunidades />}
                    {activeTab === "propostas" && <CrmLinkedProposals contactId={id} />}
                    {activeTab === "contrato" && <TabContrato />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="hidden xl:flex flex-col w-[306px] shrink-0 bg-white rounded-[16px] overflow-hidden">
          {rightPanel === "calls" && <CallLogPanel calls={mockCalls} layoutId="ct-call-tab" activeColor="#431100" ctaBg="#FFEDEB" ctaText="#431100" ctaHover="#ffc6be" />}
          {rightPanel === "activities" && <ActivityPanel activities={mockActivities} />}
        </div>
      </div>
    </div>
  );
}