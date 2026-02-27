/**
 * CRM Messages — Dedicated listing page for "Mensagem" activity type.
 *
 * Follows the same visual patterns as crm-calls.tsx but scoped
 * exclusively to messages, with message-specific statuses, columns,
 * detail panel and metrics.  Theme: Blue (#DCF0FF / #07ABDE).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ChatCircle,
  ChatCircleDots,
  PaperPlaneRight,
  Checks,
  Eye,
  WarningCircle,
  WhatsappLogo,
  DeviceMobileCamera,
  ChatTeardropDots,
  TelegramLogo,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  Trash,
  GearSix,
  PushPin,
  Bell,
  Info,
  X,
  FunnelSimple,
  ArrowUp,
  ArrowDown,
  Clock,
  UserCircle,
  Lightning,
  CalendarBlank,
  Check,
  LinkSimple,
  User,
  NotePencil,
  CheckCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  listActivities,
  patchActivity,
  type DbActivity,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";
import { useCreateActivity } from "./create-activity-context";
import { OwnerCell } from "./owner-cell";
import {
  fontFeature,
  type Priority,
  PRIORITY_CONFIG,
  RELATED_TYPE_LABELS,
} from "./activity-config";

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                  */
/* ------------------------------------------------------------------ */

type MessageStatus = "rascunho" | "enviada" | "entregue" | "lida" | "falha";
type MessageChannel = "whatsapp" | "sms" | "chat_interno" | "telegram";

interface Message {
  id: string;
  subject: string;
  body: string;
  status: MessageStatus;
  channel: MessageChannel;
  priority: Priority;
  recipient: string;
  recipientPhone: string;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  owner: string;
  sentAt: string;
  readAt: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Status, Channel & Priority Config                                  */
/* ------------------------------------------------------------------ */

const STATUS_KEYS: MessageStatus[] = ["rascunho", "enviada", "entregue", "lida", "falha"];

const statusConfig: Record<MessageStatus, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  rascunho: { label: "Rascunho",  color: "#4E6987", bg: "#DDE3EC",  icon: NotePencil },
  enviada:  { label: "Enviada",   color: "#07ABDE", bg: "#DCF0FF",  icon: PaperPlaneRight },
  entregue: { label: "Entregue",  color: "#135543", bg: "#D9F8EF",  icon: Checks },
  lida:     { label: "Lida",      color: "#917822", bg: "#FEEDCA",  icon: Eye },
  falha:    { label: "Falha",     color: "#B13B00", bg: "#FFEDEB",  icon: WarningCircle },
};

const channelConfig: Record<MessageChannel, { label: string; color: string; icon: React.ComponentType<any> }> = {
  whatsapp:     { label: "WhatsApp",      color: "#25D366", icon: WhatsappLogo },
  sms:          { label: "SMS",           color: "#4E6987", icon: DeviceMobileCamera },
  chat_interno: { label: "Chat Interno",  color: "#07ABDE", icon: ChatTeardropDots },
  telegram:     { label: "Telegram",      color: "#0088CC", icon: TelegramLogo },
};

const priorityConfig: Record<Priority, { label: string; color: string; icon: React.ComponentType<any> }> = {
  baixa:  { ...PRIORITY_CONFIG.baixa,  icon: ArrowDown },
  normal: { ...PRIORITY_CONFIG.normal, icon: Clock },
  alta:   { ...PRIORITY_CONFIG.alta,   icon: ArrowUp },
};

const relatedTypeLabels = RELATED_TYPE_LABELS;

/* ------------------------------------------------------------------ */
/*  Filter Panel Types & Config                                        */
/* ------------------------------------------------------------------ */

type MsgFilterField = "priority" | "channel" | "relatedToType" | "owner";

interface MsgFilterCondition {
  field: MsgFilterField;
  values: string[];
}

const MSG_FILTER_FIELDS: { key: MsgFilterField; label: string; icon: React.ComponentType<any> }[] = [
  { key: "priority", label: "PRIORIDADE", icon: ArrowUp },
  { key: "channel", label: "CANAL", icon: ChatCircle },
  { key: "relatedToType", label: "RELACIONADO A", icon: Lightning },
  { key: "owner", label: "PROPRIETARIO", icon: UserCircle },
];

function getMsgFilterOptions(field: MsgFilterField, messages: Message[]): { value: string; label: string }[] {
  switch (field) {
    case "priority":
      return (Object.keys(priorityConfig) as Priority[]).map((k) => ({ value: k, label: priorityConfig[k].label }));
    case "channel":
      return (Object.keys(channelConfig) as MessageChannel[]).map((k) => ({ value: k, label: channelConfig[k].label }));
    case "relatedToType":
      return Object.entries(relatedTypeLabels).map(([k, v]) => ({ value: k, label: v }));
    case "owner": {
      const unique = Array.from(new Set(messages.map((m) => m.owner).filter(Boolean)));
      return unique.sort().map((o) => ({ value: o, label: o }));
    }
    default:
      return [];
  }
}

function applyMsgFilters(messages: Message[], filters: MsgFilterCondition[]): Message[] {
  if (filters.length === 0) return messages;
  return messages.filter((m) => {
    for (const fc of filters) {
      if (fc.values.length === 0) continue;
      switch (fc.field) {
        case "priority":
          if (!fc.values.includes(m.priority)) return false;
          break;
        case "channel":
          if (!fc.values.includes(m.channel)) return false;
          break;
        case "relatedToType":
          if (!fc.values.includes(m.relatedToType)) return false;
          break;
        case "owner":
          if (!fc.values.includes(m.owner)) return false;
          break;
      }
    }
    return true;
  });
}

function msgFilterConditionLabel(fc: MsgFilterCondition): string {
  const fieldDef = MSG_FILTER_FIELDS.find((f) => f.key === fc.field);
  const prefix = fieldDef?.label ?? fc.field;
  if (fc.values.length === 0) return prefix;
  if (fc.values.length === 1) {
    if (fc.field === "priority") return `${prefix}: ${priorityConfig[fc.values[0] as Priority]?.label ?? fc.values[0]}`;
    if (fc.field === "channel") return `${prefix}: ${channelConfig[fc.values[0] as MessageChannel]?.label ?? fc.values[0]}`;
    if (fc.field === "relatedToType") return `${prefix}: ${relatedTypeLabels[fc.values[0]] ?? fc.values[0]}`;
    return `${prefix}: ${fc.values[0]}`;
  }
  return `${prefix}: ${fc.values.length} selecionados`;
}

/* ------------------------------------------------------------------ */
/*  MsgFilterDropdownPill                                              */
/* ------------------------------------------------------------------ */

function MsgFilterDropdownPill({
  fieldDef,
  condition,
  onChange,
  messages,
}: {
  fieldDef: { key: MsgFilterField; label: string; icon: React.ComponentType<any> };
  condition: MsgFilterCondition | undefined;
  onChange: (fc: MsgFilterCondition) => void;
  messages: Message[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const f = fieldDef.key;
  const hasValue = condition?.values && condition.values.length > 0;
  const Icon = fieldDef.icon;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleValue = (val: string) => {
    const current = condition?.values ?? [];
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    onChange({ field: f, values: next });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] transition-colors cursor-pointer whitespace-nowrap ${
          hasValue
            ? "bg-[#07ABDE] text-[#DCF0FF]"
            : "bg-[#f6f7f9] text-[#0483AB] hover:bg-[#dcf0ff] hover:text-[#0483AB]"
        }`}
      >
        <Icon size={13} weight={hasValue ? "fill" : "bold"} />
        <span
          className="font-bold uppercase tracking-[0.5px]"
          style={{ fontSize: 10, ...fontFeature }}
        >
          {fieldDef.label}
        </span>
        {open ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />}
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 bg-white backdrop-blur-[50px] rounded-[20px] p-[10px] min-w-[220px]"
          style={{ boxShadow: "0px 2px 8px 0px rgba(18,34,50,0.25)" }}
        >
          <div
            aria-hidden="true"
            className="absolute border-[1.2px] border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[20px]"
          />
          <div className="flex flex-col gap-[2px] max-h-[240px] overflow-y-auto">
            {getMsgFilterOptions(f, messages).map((opt) => {
              const checked = condition?.values?.includes(opt.value) ?? false;
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleValue(opt.value)}
                  className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left w-full"
                >
                  <div className={`size-[14px] rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "border-[#07ABDE] bg-[#07ABDE]" : "border-[#98989d] bg-transparent"
                  }`}>
                    {checked && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.25 5.75L6.5 2.25" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-[#28415c]"
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock Data (messages only)                                          */
/* ------------------------------------------------------------------ */

const mockMessages: Message[] = [
  { id: "MS-A1B2", subject: "Confirmacao de horario da reuniao", body: "Oi Daniela, confirmando nossa reuniao amanha as 14h. Pode ser na sala 3?", status: "lida", channel: "whatsapp", priority: "normal", recipient: "Daniela Souza", recipientPhone: "(11) 98765-4321", relatedToType: "lead", relatedToId: "LD-G7H8", relatedToName: "Daniela Souza", owner: "Ana Paula", sentAt: "2026-02-24", readAt: "2026-02-24", createdAt: "2026-02-24", updatedAt: "2026-02-24" },
  { id: "MS-C3D4", subject: "Proposta comercial enviada", body: "Larissa, segue em anexo a proposta atualizada conforme conversamos. Aguardo seu retorno.", status: "entregue", channel: "whatsapp", priority: "alta", recipient: "Larissa Campos", recipientPhone: "(21) 97654-3210", relatedToType: "lead", relatedToId: "LD-Y5Z6", relatedToName: "Larissa Campos", owner: "Joao Pedro", sentAt: "2026-02-23", readAt: "", createdAt: "2026-02-23", updatedAt: "2026-02-23" },
  { id: "MS-E5F6", subject: "Follow-up pos-demo", body: "Ana Carolina, foi um prazer apresentar nossa solucao. Gostaria de saber suas impressoes.", status: "lida", channel: "whatsapp", priority: "alta", recipient: "Ana Carolina", recipientPhone: "(11) 91234-5678", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", owner: "Joao Silva", sentAt: "2026-02-22", readAt: "2026-02-23", createdAt: "2026-02-22", updatedAt: "2026-02-23" },
  { id: "MS-G7H8", subject: "Lembrete de pagamento", body: "Informamos que a fatura #4521 vence em 3 dias. Por favor, regularize o pagamento.", status: "enviada", channel: "sms", priority: "alta", recipient: "Marcos Tavares", recipientPhone: "(31) 96543-2100", relatedToType: "conta", relatedToId: "AC-E5F6", relatedToName: "Gamma Corp", owner: "Fernanda Santos", sentAt: "2026-02-25", readAt: "", createdAt: "2026-02-25", updatedAt: "2026-02-25" },
  { id: "MS-J9K1", subject: "Boas-vindas ao onboarding", body: "Bem-vindo ao Zenite! Seu onboarding comeca na proxima segunda. Segue o cronograma.", status: "lida", channel: "chat_interno", priority: "normal", recipient: "Roberto Nunes", recipientPhone: "(11) 93456-7890", relatedToType: "conta", relatedToId: "AC-L2M3", relatedToName: "Zeta Inc", owner: "Pedro Costa", sentAt: "2026-02-21", readAt: "2026-02-21", createdAt: "2026-02-21", updatedAt: "2026-02-21" },
  { id: "MS-L2M3", subject: "Agendamento de visita tecnica", body: "Bruno, podemos agendar a visita tecnica para quarta-feira? Preciso de 2h no local.", status: "entregue", channel: "whatsapp", priority: "normal", recipient: "Bruno Mendes", recipientPhone: "(21) 94567-8901", relatedToType: "oportunidade", relatedToId: "OP-C3D4", relatedToName: "Expansao Beta", owner: "Maria Oliveira", sentAt: "2026-02-23", readAt: "", createdAt: "2026-02-23", updatedAt: "2026-02-23" },
  { id: "MS-N4P5", subject: "Desconto especial - valido ate sexta", body: "Helena, conseguimos aprovacao para 12% de desconto. Oferta valida ate sexta-feira.", status: "lida", channel: "whatsapp", priority: "alta", recipient: "Helena Rocha", recipientPhone: "(41) 95678-9012", relatedToType: "oportunidade", relatedToId: "OP-E5F6", relatedToName: "Contrato Gamma", owner: "Carlos Pereira", sentAt: "2026-02-20", readAt: "2026-02-20", createdAt: "2026-02-20", updatedAt: "2026-02-20" },
  { id: "MS-Q6R7", subject: "Pesquisa de satisfacao", body: "Gabriel, gostaríamos de saber como foi sua experiencia com nosso atendimento.", status: "falha", channel: "sms", priority: "baixa", recipient: "Gabriel Santos", recipientPhone: "(11) 96789-0123", relatedToType: "contato", relatedToId: "CT-W3X4", relatedToName: "Gabriel Santos", owner: "Lucas Souza", sentAt: "", readAt: "", createdAt: "2026-02-19", updatedAt: "2026-02-19" },
  { id: "MS-S8T9", subject: "Atualizacao do status do projeto", body: "Kleber, informamos que a fase 2 do projeto esta 80% concluida. Previsao de entrega: 05/03.", status: "enviada", channel: "telegram", priority: "normal", recipient: "Kleber Oliveira", recipientPhone: "(51) 97890-1234", relatedToType: "conta", relatedToId: "AC-N4P5", relatedToName: "Theta SA", owner: "Rafaela Costa", sentAt: "2026-02-25", readAt: "", createdAt: "2026-02-25", updatedAt: "2026-02-25" },
  { id: "MS-U1V2", subject: "Rascunho - convite para evento", body: "Prezado(a), temos o prazer de convida-lo(a) para nosso evento anual de inovacao...", status: "rascunho", channel: "whatsapp", priority: "baixa", recipient: "Patricia Lima", recipientPhone: "(11) 98901-2345", relatedToType: "lead", relatedToId: "LD-U1V2", relatedToName: "Patricia Lima", owner: "Camila Ribeiro", sentAt: "", readAt: "", createdAt: "2026-02-22", updatedAt: "2026-02-22" },
  { id: "MS-W3X4", subject: "Aviso de manutencao programada", body: "Informamos que havera manutencao no sistema entre 22h e 02h. Servicos indisponiveis.", status: "lida", channel: "chat_interno", priority: "normal", recipient: "Fernanda Costa", recipientPhone: "(51) 92345-6789", relatedToType: "conta", relatedToId: "AC-Q6R7", relatedToName: "Iota Group", owner: "Rafael Alves", sentAt: "2026-02-23", readAt: "2026-02-24", createdAt: "2026-02-23", updatedAt: "2026-02-24" },
  { id: "MS-Y5Z6", subject: "Cobranca pendente - 2a via", body: "Marcelo, estamos reenviando o boleto atualizado. Qualquer duvida, estamos a disposicao.", status: "falha", channel: "sms", priority: "alta", recipient: "Marcelo Dias", recipientPhone: "(11) 93456-7891", relatedToType: "conta", relatedToId: "AC-Q6R7", relatedToName: "Iota Group", owner: "Juliana Ferreira", sentAt: "", readAt: "", createdAt: "2026-02-24", updatedAt: "2026-02-24" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dbActivityToMessage(row: DbActivity): Message | null {
  if ((row.type || "") !== "mensagem") return null;
  return {
    id: row.id,
    subject: row.subject || row.label || "",
    body: row.description || "",
    status: (row.status || "rascunho") as MessageStatus,
    channel: ((row as any).channel || "whatsapp") as MessageChannel,
    priority: (row.priority || "normal") as Priority,
    recipient: row.contact_name || "",
    recipientPhone: (row as any).phone_number || "",
    relatedToType: row.related_to_type || "",
    relatedToId: row.related_to_id || "",
    relatedToName: row.related_to_name || "",
    owner: row.owner || "",
    sentAt: (row as any).sent_at || "",
    readAt: (row as any).read_at || "",
    createdAt: row.created_at ? row.created_at.slice(0, 10) : "",
    updatedAt: row.updated_at ? row.updated_at.slice(0, 10) : "",
  };
}

function formatRelativeDate(iso: string): string {
  if (!iso) return "\u2014";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays === -1) return "Amanha";
    if (diffDays < 0) return `Em ${Math.abs(diffDays)} dias`;
    if (diffDays < 30) return `Ha ${diffDays} dias`;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string): string {
  if (!iso) return "\u2014";
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

/* ------------------------------------------------------------------ */
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [220, 110, 90, 140, 160, 140, 120, 120];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "ASSUNTO",
  "STATUS",
  "CANAL",
  "DESTINATARIO",
  "RELACIONADO A",
  "PROPRIETARIO",
  "ENVIADA EM",
  "CRIADO EM",
];

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

/* ------------------------------------------------------------------ */
/*  Shared UI: Dividers & Checkbox                                     */
/* ------------------------------------------------------------------ */

function HorizontalDivider() {
  return (
    <div className="h-0 relative w-full">
      <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
        <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
      </svg>
    </div>
  );
}

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

function CircleCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative shrink-0 size-[16px] cursor-pointer"
    >
      <div
        className={`absolute inset-0 rounded-full border-[1.5px] border-solid transition-colors ${
          checked ? "border-[#07ABDE] bg-[#07ABDE]" : "border-[#28415c] bg-transparent"
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
/*  Message Detail Panel                                               */
/* ------------------------------------------------------------------ */

function MessageDetailPanel({
  message,
  onClose,
  onStatusChange,
}: {
  message: Message;
  onClose: () => void;
  onStatusChange: (msgId: string, newStatus: MessageStatus) => void;
}) {
  const statusConf = statusConfig[message.status] || statusConfig.rascunho;
  const channelConf = channelConfig[message.channel] || channelConfig.whatsapp;
  const priorityConf = priorityConfig[message.priority] || priorityConfig.normal;
  const PriorityIcon = priorityConf.icon;
  const StatusIcon = statusConf.icon;
  const ChannelIcon = channelConf.icon;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const DetailRow = ({ icon: Icon, label, children }: { icon: React.ComponentType<any>; label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-[10px] py-[10px]">
      <div className="flex items-center justify-center w-[28px] h-[28px] rounded-[8px] bg-[#f6f7f9] shrink-0 mt-[1px]">
        <Icon size={14} weight="duotone" className="text-[#4E6987]" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="text-[#98989d] uppercase mb-[2px]"
          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
        >
          {label}
        </span>
        <div>{children}</div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-[15px] overflow-hidden">
      {/* Blue Header */}
      <div className="relative shrink-0">
        <div className="bg-[#DCF0FF] px-[20px] pt-[16px] pb-[48px]">
          <div className="flex justify-end mb-[4px]">
            <button
              onClick={onClose}
              className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#b3dffa] transition-colors text-[#0a3d5c] cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="flex items-center justify-center w-[44px] h-[44px] rounded-[12px] bg-[#b3dffa] shrink-0">
              <ChatCircle size={22} weight="duotone" className="text-[#07ABDE]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#0a3d5c] truncate" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}>{message.subject}</p>
              <p className="text-[#0a3d5c] uppercase truncate" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "18px", ...fontFeature }}>{message.id}</p>
            </div>
          </div>
        </div>
        {/* Pills overlapping header bottom */}
        <div className="absolute left-[20px] right-[20px] bottom-[12px] flex items-center gap-[6px] flex-wrap">
          <div className="flex items-center gap-[4px] h-[24px] px-[10px] rounded-[500px]" style={{ backgroundColor: statusConf.bg }}>
            <StatusIcon size={10} weight="fill" style={{ color: statusConf.color }} />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: statusConf.color, ...fontFeature }}>{statusConf.label}</span>
          </div>
          <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-white/70">
            <ChannelIcon size={10} weight="bold" style={{ color: channelConf.color }} />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: channelConf.color, ...fontFeature }}>
              {channelConf.label}
            </span>
          </div>
          <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-white/70">
            <PriorityIcon size={10} weight="bold" style={{ color: priorityConf.color }} />
            <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: priorityConf.color, ...fontFeature }}>{priorityConf.label}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[20px] pt-[16px] pb-[20px]">
        {/* Body */}
        {message.body ? (
          <p className="text-[#4E6987] mb-[14px]" style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>{message.body}</p>
        ) : (
          <p className="text-[#C8CFDB] italic mb-[14px]" style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>Sem conteudo</p>
        )}

        <div className="h-[1px] bg-[#f0f2f5] mb-[2px]" />

        <DetailRow icon={User} label="DESTINATARIO">
          <div className="flex flex-col gap-[2px]">
            <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{message.recipient || "\u2014"}</span>
            {message.recipientPhone && (
              <span className="text-[#0483AB]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{message.recipientPhone}</span>
            )}
          </div>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={UserCircle} label="PROPRIETARIO">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{message.owner || "\u2014"}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={LinkSimple} label="RELACIONADO A">
          {message.relatedToName ? (
            <div className="flex items-center gap-[6px]">
              <span className="text-[#98989d] uppercase" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>{relatedTypeLabels[message.relatedToType] || message.relatedToType}</span>
              <span className="text-[#0483AB]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{message.relatedToName}</span>
            </div>
          ) : (
            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
          )}
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        {message.sentAt && (
          <>
            <DetailRow icon={PaperPlaneRight} label="ENVIADA EM">
              <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(message.sentAt)}</span>
            </DetailRow>
            <div className="h-[1px] bg-[#f0f2f5]" />
          </>
        )}

        {message.readAt && (
          <>
            <DetailRow icon={Eye} label="LIDA EM">
              <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(message.readAt)}</span>
            </DetailRow>
            <div className="h-[1px] bg-[#f0f2f5]" />
          </>
        )}

        <DetailRow icon={CalendarBlank} label="CRIADO EM">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(message.createdAt)}</span>
        </DetailRow>
        <div className="h-[1px] bg-[#f0f2f5]" />

        <DetailRow icon={Clock} label="ATUALIZADO EM">
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(message.updatedAt)}</span>
        </DetailRow>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 px-[20px] py-[12px]">
        <div className="h-[1px] bg-[#DDE3EC] mb-[12px]" />
        <div className="flex items-center gap-[6px] flex-wrap">
          {message.status === "rascunho" && (
            <button
              onClick={() => onStatusChange(message.id, "enviada")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer"
            >
              <PaperPlaneRight size={13} weight="fill" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Enviar</span>
            </button>
          )}
          {message.status === "falha" && (
            <button
              onClick={() => onStatusChange(message.id, "enviada")}
              className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#07ABDE] text-white hover:bg-[#0590bd] transition-colors cursor-pointer"
            >
              <PaperPlaneRight size={13} weight="fill" />
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Reenviar</span>
            </button>
          )}
          <button
            onClick={() => toast("Editar mensagem (em breve)")}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-full bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer ml-auto"
          >
            <NotePencil size={13} weight="duotone" />
            <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Filter Pill (segmented)                                     */
/* ------------------------------------------------------------------ */

function StatusFilterPill({
  status,
  active,
  onClick,
}: {
  status: MessageStatus | "all";
  active: boolean;
  onClick: () => void;
}) {
  if (status === "all") {
    return (
      <button
        onClick={onClick}
        className={`relative flex items-center gap-[5px] h-[34px] px-[14px] rounded-[500px] transition-all cursor-pointer ${
          active
            ? "text-[#f6f7f9]"
            : "text-[#98989d] hover:text-[#4e6987] hover:bg-[#e8eaee]"
        }`}
      >
        {active && (
          <>
            <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
              style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
            />
          </>
        )}
        <span className="relative z-[1] font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
          Todas
        </span>
      </button>
    );
  }

  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-[5px] h-[34px] px-[12px] rounded-[500px] transition-all cursor-pointer ${
        active
          ? "text-[#f6f7f9]"
          : "text-[#98989d] hover:text-[#4e6987] hover:bg-[#e8eaee]"
      }`}
    >
      {active && (
        <>
          <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
            style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
          />
        </>
      )}
      <Icon size={14} weight={active ? "fill" : "regular"} className="relative z-[1]" />
      <span className="relative z-[1] font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
        {config.label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmMessages() {
  const { query: globalSearch } = useCrmSearch();
  const { refreshKey } = useCreateActivity();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* -- Filter state -- */
  const [statusFilter, setStatusFilter] = useState<MessageStatus | "all">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<MsgFilterCondition[]>([]);
  const [draftFilters, setDraftFilters] = useState<MsgFilterCondition[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  /* -- Detail panel state -- */
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);

  const handleStatusChange = useCallback((msgId: string, newStatus: MessageStatus) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              status: newStatus,
              sentAt: newStatus === "enviada" && !m.sentAt ? new Date().toISOString().slice(0, 10) : m.sentAt,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : m
      )
    );
    patchActivity(msgId, { status: newStatus }).catch(console.error);
    const labels: Record<MessageStatus, string> = {
      rascunho: "movida para rascunho",
      enviada: "enviada",
      entregue: "marcada como entregue",
      lida: "marcada como lida",
      falha: "marcada como falha",
    };
    toast.success(`Mensagem ${labels[newStatus]}!`);
  }, []);

  /* -- Load from Supabase (real data only) -- */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) { setMessages([]); setLoading(false); } }, 8000);

    (async () => {
      try {
        const dbRows = await listActivities();
        if (cancelled) return;
        const converted = (dbRows || []).map(dbActivityToMessage).filter(Boolean) as Message[];
        setMessages(converted);
      } catch (err) {
        console.error("[CRM Messages] Error loading activities:", err);
        if (!cancelled) setMessages([]);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  /* -- Filtered messages -- */
  const filteredMessages = useMemo(() => {
    let result = messages;

    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    result = applyMsgFilters(result, activeFilters);

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter((m) =>
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.recipient.toLowerCase().includes(q) ||
        m.relatedToName.toLowerCase().includes(q) ||
        m.owner.toLowerCase().includes(q)
      );
    }

    return result;
  }, [messages, statusFilter, activeFilters, globalSearch]);

  /* -- Table state -- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMetrics, setShowMetrics] = useState(true);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / ROWS_PER_PAGE));
  const paginated = filteredMessages.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const selectedMsg = selectedMsgId ? messages.find((m) => m.id === selectedMsgId) : null;

  /* -- Column resize handlers -- */
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
      setSelectedIds(new Set(paginated.map((m) => m.id)));
    }
  };

  /* -- Filter panel handlers -- */
  const updateDraftFilter = (fc: MsgFilterCondition) => {
    setDraftFilters((prev) => {
      const existing = prev.findIndex((c) => c.field === fc.field);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = fc;
        return next;
      }
      return [...prev, fc];
    });
  };

  const handleApplyFilters = () => {
    const meaningful = draftFilters.filter((fc) => fc.values.length > 0);
    setActiveFilters(meaningful);
    setIsFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    setDraftFilters([]);
    setIsFilterPanelOpen(false);
  };

  // Close menus on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
      if (titleMenuRef.current && !titleMenuRef.current.contains(e.target as Node)) {
        setTitleMenuOpen(false);
      }
    };
    if (activeMenu || titleMenuOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [activeMenu, titleMenuOpen]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, activeFilters, globalSearch]);

  /* -- Loading state -- */
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#07ABDE] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-[12px] min-h-0 overflow-hidden">
      {/* LEFT: MAIN LIST AREA */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden min-w-0 transition-all ${selectedMsg ? "xl:flex hidden" : "flex"} xl:flex`}>
      {/* HEADER + TABS WRAPPER */}
      <div className="bg-[#ffffff] rounded-[16px] p-[16px] pb-[12px] mb-[12px] shrink-0">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
          {/* Left: title */}
          <div className="relative" ref={titleMenuRef}>
            <div
              onClick={() => setTitleMenuOpen((v) => !v)}
              className={`flex items-center gap-[10px] p-[12px] rounded-[100px] hover:bg-[#f6f7f9] transition-colors cursor-pointer group/title ${titleMenuOpen ? "bg-[#f6f7f9]" : ""}`}
            >
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#DCF0FF] group-hover/title:bg-[#b3dffa] transition-colors">
                <ChatCircle size={22} weight="duotone" className="text-[#07ABDE] group-hover/title:text-[#0590bd] transition-colors" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span
                  className="text-[#64676c] text-[10px] font-bold uppercase tracking-[0.5px] leading-[14px]"
                  style={fontFeature}
                >ATIVIDADES</span>
                <div className="flex items-center">
                  <span
                    className="text-[#28415c] text-[19px] font-bold tracking-[-0.5px] leading-[24px]"
                    style={fontFeature}
                  >Mensagens</span>
                  <div className={`flex items-center justify-center size-[24px] rounded-full transition-transform ${titleMenuOpen ? "rotate-180" : ""}`}>
                    <CaretDown size={14} weight="bold" className="text-[#28415c]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title dropdown menu */}
            {titleMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+5px)] z-50 backdrop-blur-[50px] bg-white flex flex-col gap-[6px] items-start p-[12px] rounded-[34px]">
                <div
                  aria-hidden="true"
                  className="absolute border border-[rgba(200,207,219,0.6)] border-solid inset-0 pointer-events-none rounded-[34px]"
                  style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                />
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Configuracoes de mensagens (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><GearSix size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Configuracoes</span>
                </button>
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Fixado nos atalhos!"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><PushPin size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Fixar nos Atalhos</span>
                </button>
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Notificacoes (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Bell size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Notificacoes</span>
                </button>
                <div className="bg-[#dde3ec] h-[1.5px] shrink-0 w-full" />
                <button
                  onClick={() => { setTitleMenuOpen(false); toast("Detalhes (em breve)"); }}
                  className="relative flex gap-[4px] items-center pr-[28px] py-[10px] rounded-[100px] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors w-full cursor-pointer"
                >
                  <div className="flex items-center justify-center shrink-0 w-[44px]"><Info size={19} /></div>
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Mensagens</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TABS ROW */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Status filter pills */}
          <div className="relative flex items-center gap-[2px] p-[4px] bg-[#f6f7f9] rounded-[100px]">
            <StatusFilterPill status="all" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
            {STATUS_KEYS.map((s) => (
              <StatusFilterPill key={s} status={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                boxShadow:
                  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          <VerticalDivider />

          {/* Filter button */}
          <button
            onClick={() => {
              setIsFilterPanelOpen((v) => !v);
              if (!isFilterPanelOpen) {
                setDraftFilters(activeFilters.length > 0 ? [...activeFilters] : []);
              }
            }}
            className={`relative flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors cursor-pointer ${
              isFilterPanelOpen || activeFilters.length > 0
                ? "bg-[#07ABDE] text-[#DCF0FF]"
                : "bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB]"
            }`}
          >
            {isFilterPanelOpen ? <X size={14} weight="bold" /> : <FunnelSimple size={16} weight={activeFilters.length > 0 ? "fill" : "bold"} />}
          </button>

          {/* Active filter count badge */}
          {activeFilters.length > 0 && !isFilterPanelOpen && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-[4px] h-[28px] px-[10px] rounded-[500px] bg-[#dcf0ff] text-[#28415c] hover:bg-[#cce7fb] transition-colors cursor-pointer"
            >
              <span
                className="font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 9, ...fontFeature }}
              >
                {activeFilters.length} filtro{activeFilters.length > 1 ? "s" : ""}
              </span>
              <X size={10} weight="bold" />
            </button>
          )}

          <VerticalDivider />

          {/* Metrics toggle */}
          <button
            onClick={() => setShowMetrics((v) => !v)}
            className={`relative flex items-center gap-[5px] h-[34px] px-[14px] rounded-[500px] transition-all cursor-pointer ${
              showMetrics
                ? "bg-[#07ABDE] text-[#DCF0FF]"
                : "bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB]"
            }`}
          >
            <span
              className="font-bold uppercase tracking-[0.5px]"
              style={{ fontSize: 10, ...fontFeature }}
            >
              Metricas
            </span>
          </button>

        </div>

        {/* FILTER PANEL */}
        {isFilterPanelOpen && (
          <div ref={filterPanelRef} className="mt-[8px] pt-[10px] border-t border-[#f0f2f5]">
            {/* Filter dropdown pills row */}
            <div className="flex items-center gap-[6px] flex-wrap">
              {MSG_FILTER_FIELDS.map((fd) => (
                <MsgFilterDropdownPill
                  key={fd.key}
                  fieldDef={fd}
                  condition={draftFilters.find((c) => c.field === fd.key)}
                  onChange={updateDraftFilter}
                  messages={messages}
                />
              ))}
            </div>

            {/* Active filter pills preview */}
            {draftFilters.filter((fc) => fc.values.length > 0).length > 0 && (
              <>
                <div className="mt-[14px] mb-[10px] border-t border-[#ebedf0]" />
                <span
                  className="text-[#98989d] font-bold uppercase tracking-[0.5px] mb-[8px] block"
                  style={{ fontSize: 10, letterSpacing: 0.5, ...fontFeature }}
                >
                  RESUMO DO FILTRO
                </span>
                <div className="flex items-center gap-[4px] flex-wrap">
                  {draftFilters
                    .filter((fc) => fc.values.length > 0)
                    .map((fc) => (
                      <div
                        key={fc.field}
                        className="flex items-center gap-[6px] h-[26px] pl-[10px] pr-[6px] rounded-[500px] bg-[#dde3ec] text-[#28415c]"
                      >
                        <span
                          className="whitespace-nowrap"
                          style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}
                        >
                          {msgFilterConditionLabel(fc)}
                        </span>
                        <button
                          onClick={() =>
                            setDraftFilters((prev) => prev.filter((c) => c.field !== fc.field))
                          }
                          className="flex items-center justify-center size-[16px] rounded-full hover:bg-[#07ABDE] hover:text-[#DCF0FF] transition-colors cursor-pointer"
                        >
                          <X size={8} weight="bold" />
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* APLICAR button row */}
            <div className="flex items-center gap-[6px] mt-[14px]">
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer"
              >
                <span
                  className="font-bold uppercase tracking-[0.5px]"
                  style={{ fontSize: 10, ...fontFeature }}
                >
                  APLICAR
                </span>
              </button>
              {(activeFilters.length > 0 || draftFilters.some((fc) => fc.values.length > 0)) && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] bg-[#f6f7f9] text-[#F56233] hover:bg-[#ffedeb] hover:text-[#F56233] transition-colors cursor-pointer"
                >
                  <Trash size={13} weight="bold" />
                  <span
                    className="font-bold uppercase tracking-[0.5px]"
                    style={{ fontSize: 10, ...fontFeature }}
                  >
                    LIMPAR
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Metrics strip */}
        {showMetrics && (() => {
          const total = messages.length;
          const sent = messages.filter((m) => m.status === "enviada").length;
          const delivered = messages.filter((m) => m.status === "entregue").length;
          const read = messages.filter((m) => m.status === "lida").length;
          const failed = messages.filter((m) => m.status === "falha").length;
          const readRate = (sent + delivered + read) > 0 ? Math.round((read / (sent + delivered + read)) * 100) : 0;

          const metrics = [
            { label: "TOTAL", value: String(total), sub: "mensagens", icon: ChatCircle, color: "#07ABDE", bg: "#DCF0FF" },
            { label: "ENVIADAS", value: String(sent), sub: `${Math.round((sent / Math.max(1, total)) * 100)}% do total`, icon: PaperPlaneRight, color: "#07ABDE", bg: "#DCF0FF" },
            { label: "ENTREGUES", value: String(delivered), sub: `${Math.round((delivered / Math.max(1, total)) * 100)}% do total`, icon: Checks, color: "#135543", bg: "#D9F8EF" },
            { label: "LIDAS", value: String(read), sub: `taxa de leitura: ${readRate}%`, icon: Eye, color: "#917822", bg: "#FEEDCA" },
            { label: "FALHAS", value: String(failed), sub: `${Math.round((failed / Math.max(1, total)) * 100)}% do total`, icon: WarningCircle, color: "#B13B00", bg: "#FFEDEB" },
          ];

          return (
            <div className="mt-[4px] pt-[8px] border-t border-[#f0f2f5] overflow-x-auto">
              <div className="flex gap-[2px] min-w-max">
                {metrics.map((m) => {
                  const MIcon = m.icon;
                  return (
                    <div
                      key={m.label}
                      className="flex-1 min-w-[120px] flex items-center gap-[10px] px-[12px] py-[8px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors"
                    >
                      <div
                        className="flex items-center justify-center w-[48px] h-[48px] rounded-[10px] shrink-0"
                        style={{ backgroundColor: m.bg }}
                      >
                        <MIcon size={22} weight="duotone" style={{ color: m.color }} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="text-[#98989d] uppercase whitespace-nowrap"
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
                        >
                          {m.label}
                        </span>
                        <span
                          className="text-[#28415c] whitespace-nowrap"
                          style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, lineHeight: "20px", ...fontFeature }}
                        >
                          {m.value}
                        </span>
                        <span
                          className="text-[#98989d] whitespace-nowrap"
                          style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.2, lineHeight: "14px", ...fontFeature }}
                        >
                          {m.sub}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* TABLE */}
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
              {paginated.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <ChatCircle size={32} weight="duotone" className="text-[#C8CFDB]" />
                    <p className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                      Nenhuma mensagem encontrada
                    </p>
                  </div>
                </div>
              ) : (
                paginated.map((msg, idx) => {
                  const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                  const isSelected = selectedIds.has(msg.id);
                  const statusConf = statusConfig[msg.status] || statusConfig.rascunho;
                  const chConf = channelConfig[msg.channel] || channelConfig.whatsapp;
                  const ChIcon = chConf.icon;

                  return (
                    <div key={msg.id}>
                      <HorizontalDivider />
                      <div
                        onClick={() => setSelectedMsgId(msg.id)}
                        className={`grid items-center h-[38px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                          selectedMsgId === msg.id
                            ? "bg-[#F6F7F9]"
                            : isSelected
                            ? "bg-[#f6f7f9]"
                            : "hover:bg-[#f6f7f9]"
                        }`}
                        style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
                      >
                        {/* Row number */}
                        <div
                          className="text-right text-[#28415c]"
                          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                        >
                          {rowNum}
                        </div>

                        {/* Checkbox */}
                        <div className="flex items-center justify-center">
                          <CircleCheckbox
                            checked={isSelected}
                            onChange={() => toggleSelect(msg.id)}
                          />
                        </div>

                        {/* Subject */}
                        <div
                          className="truncate text-[#122232]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {msg.subject}
                        </div>

                        {/* Status pill */}
                        <div className="flex items-center">
                          <div
                            className="flex items-center gap-[4px] h-[22px] px-[8px] rounded-[500px]"
                            style={{ backgroundColor: statusConf.bg }}
                          >
                            <span
                              className="whitespace-nowrap"
                              style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.2, color: statusConf.color, ...fontFeature }}
                            >
                              {statusConf.label}
                            </span>
                          </div>
                        </div>

                        {/* Channel */}
                        <div className="flex items-center gap-[4px]">
                          <ChIcon size={14} weight="duotone" style={{ color: chConf.color }} />
                          <span
                            className="truncate"
                            style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, color: chConf.color, ...fontFeature }}
                          >
                            {chConf.label}
                          </span>
                        </div>

                        {/* Recipient */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {msg.recipient || "\u2014"}
                        </div>

                        {/* Related to */}
                        <div className="flex items-center gap-[4px] truncate">
                          {msg.relatedToName ? (
                            <>
                              <span
                                className="text-[#98989d] shrink-0"
                                style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
                              >
                                {relatedTypeLabels[msg.relatedToType] || ""}
                              </span>
                              <span
                                className="truncate text-[#0483AB]"
                                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                              >
                                {msg.relatedToName}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
                          )}
                        </div>

                        {/* Owner */}
                        <OwnerCell ownerId={msg.owner} />

                        {/* Sent at */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatRelativeDate(msg.sentAt)}
                        </div>

                        {/* Created at */}
                        <div
                          className="truncate text-[#28415c]"
                          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                        >
                          {formatRelativeDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <HorizontalDivider />
            </div>
          </div>
        </div>
      </div>

      {/* PAGINATION */}
      {filteredMessages.length > ROWS_PER_PAGE && (
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

      {/* FLOATING SELECTION BAR */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-[12px] h-[48px] px-[20px] rounded-[500px] bg-[#28415c] text-white"
          style={{ boxShadow: "0px 4px 16px 0px rgba(18,34,50,0.35)" }}
        >
          <span
            className="font-bold uppercase tracking-[0.5px]"
            style={{ fontSize: 11, ...fontFeature }}
          >
            {selectedIds.size} {selectedIds.size === 1 ? "selecionada" : "selecionadas"}
          </span>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => {
              toast.success(`${selectedIds.size} mensagem(ns) reenviada(s)`);
              setMessages((prev) =>
                prev.map((m) =>
                  selectedIds.has(m.id) && (m.status === "rascunho" || m.status === "falha")
                    ? { ...m, status: "enviada" as MessageStatus, sentAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) }
                    : m
                )
              );
              selectedIds.forEach((id) => {
                patchActivity(id, { status: "enviada" }).catch(console.error);
              });
              setSelectedIds(new Set());
            }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-[#07ABDE] transition-colors cursor-pointer"
          >
            <PaperPlaneRight size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>ENVIAR</span>
          </button>
          <button
            onClick={() => {
              toast(`Excluir ${selectedIds.size} mensagem(ns) (em breve)`);
            }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-[#ED5200] transition-colors cursor-pointer"
          >
            <Trash size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>EXCLUIR</span>
          </button>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="flex items-center justify-center size-[28px] rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}
      </div>

      {/* RIGHT: DETAIL SIDE PANEL */}
      <AnimatePresence mode="wait">
        {selectedMsg && (
          <motion.div
            key={selectedMsg.id}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[320px] h-full">
              <MessageDetailPanel
                message={selectedMsg}
                onClose={() => setSelectedMsgId(null)}
                onStatusChange={handleStatusChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
