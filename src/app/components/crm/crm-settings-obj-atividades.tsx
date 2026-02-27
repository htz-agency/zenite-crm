/**
 * CRM Settings — Objeto: Atividades
 *
 * Full configuration page for the Activity object.
 * Header with animated segmented control: Configuracao | Tipos | Layout
 * All changes persist to backend via obj-config API.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarBlank,
  GearFine,
  Layout,
  Shapes,
  Info,
  CaretDown,
  Plus,
  Trash,
  DotsSixVertical,
  FloppyDisk,
  SpinnerGap,
  Check,
  X,
  MagnifyingGlass,
  TextT,
  PencilSimple,
  CheckCircle,
  Phone,
  NoteBlank,
  ChatCircle,
  Envelope,
  GoogleLogo,
  VideoCamera,
  Bell,
  PhoneCall,
} from "@phosphor-icons/react";
import { ZeniteToggle } from "../zenite-toggle";
import {
  getObjectConfig,
  patchObjectConfig,
  type ObjectConfig,
  type ActivityTypeRule,
} from "./crm-api";
import { toast } from "sonner";
import { ACTIVITY_FIELDS } from "./crm-settings-native-fields";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useNotifications } from "./notification-context";
import {
  fontFeature as ff,
  ACTIVITY_TYPE_CONFIG,
  ACTIVITY_TYPE_KEYS,
  STATUS_BY_TYPE,
} from "./activity-config";

/* Coral palette for Activities (from SSOT) */
const ACT_COLOR = ACTIVITY_TYPE_CONFIG.compromisso.color;
const ACT_BG = ACTIVITY_TYPE_CONFIG.compromisso.bg;

/* ================================================================== */
/*  Activity type metadata                                             */
/* ================================================================== */

interface ActivityTypeMeta {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
  defaultStatuses: { key: string; label: string; color: string }[];
  specificFields: { key: string; label: string }[];
}

/** Derive defaultStatuses from the single source of truth (STATUS_BY_TYPE) */
function deriveStatuses(typeKey: string): { key: string; label: string; color: string }[] {
  const statuses = STATUS_BY_TYPE[typeKey as keyof typeof STATUS_BY_TYPE];
  if (!statuses) return [];
  return statuses.map((s) => ({ key: s.key, label: s.label, color: s.color }));
}

/** Icon mapping for activity types (UI-specific) */
const actTypeIconMap: Record<string, React.ComponentType<any>> = {
  compromisso: CalendarBlank,
  tarefa: CheckCircle,
  ligacao: Phone,
  nota: NoteBlank,
  mensagem: ChatCircle,
  email: Envelope,
};

/** Description & specific fields per type (settings-page-specific metadata) */
const actTypeDescriptions: Record<string, string> = {
  compromisso: "Reunioes, calls e eventos agendados no calendario",
  tarefa: "Tarefas e to-dos com prazo e prioridade",
  ligacao: "Chamadas telefonicas registradas ou automaticas",
  nota: "Anotacoes internas vinculadas a registros",
  mensagem: "Mensagens via WhatsApp, SMS, chat interno ou Telegram",
  email: "E-mails enviados ou recebidos vinculados a registros",
};

const actTypeSpecificFields: Record<string, { key: string; label: string }[]> = {
  compromisso: [
    { key: "meet_link", label: "Link Google Meet" },
    { key: "google_event_id", label: "ID Evento Calendar" },
    { key: "timezone", label: "Fuso Horario" },
    { key: "attendees", label: "Participantes" },
    { key: "reminder", label: "Lembrete" },
    { key: "busy_status", label: "Disponibilidade" },
    { key: "visibility", label: "Visibilidade" },
    { key: "calendar_name", label: "Calendario" },
    { key: "recurrence", label: "Recorrencia" },
    { key: "is_recurring", label: "E Recorrente" },
  ],
  tarefa: [
    { key: "due_date", label: "Data de Vencimento" },
    { key: "priority", label: "Prioridade" },
    { key: "completed_at", label: "Concluido Em" },
  ],
  ligacao: [
    { key: "phone", label: "Telefone" },
    { key: "call_type", label: "Tipo de Ligacao" },
    { key: "call_direction", label: "Direcao" },
    { key: "call_duration", label: "Duracao" },
    { key: "call_result", label: "Resultado" },
  ],
  nota: [
    { key: "note_visibility", label: "Visibilidade" },
    { key: "shared_with", label: "Compartilhado Com" },
    { key: "version", label: "Versao" },
  ],
  mensagem: [
    { key: "channel", label: "Canal" },
    { key: "recipient", label: "Destinatario" },
    { key: "recipient_phone", label: "Telefone Destinatario" },
    { key: "sent_at", label: "Enviado Em" },
    { key: "read_at", label: "Lido Em" },
  ],
  email: [
    { key: "channel", label: "Canal" },
    { key: "recipient", label: "Destinatario" },
    { key: "sent_at", label: "Enviado Em" },
    { key: "read_at", label: "Lido Em" },
  ],
};

/** Composed ACTIVITY_TYPES array — colors & statuses from SSOT, descriptions & fields local */
const ACTIVITY_TYPES: ActivityTypeMeta[] = ACTIVITY_TYPE_KEYS.map((key) => {
  const cfg = ACTIVITY_TYPE_CONFIG[key];
  return {
    key,
    label: cfg.label,
    description: actTypeDescriptions[key] || "",
    icon: actTypeIconMap[key] || CalendarBlank,
    color: cfg.color,
    bg: cfg.bg,
    defaultStatuses: deriveStatuses(key),
    specificFields: actTypeSpecificFields[key] || [],
  };
});

/* ================================================================== */
/*  Default config                                                     */
/* ================================================================== */

const DEFAULT_TYPE_RULES: Record<string, ActivityTypeRule> = {
  compromisso: {
    enabled: true,
    defaultStatus: "agendado",
    defaultPriority: "normal",
    requiredFields: ["subject", "start_date"],
    autoMeetLink: true,
    defaultReminder: "15 minutos antes",
    defaultBusyStatus: "ocupado",
  },
  tarefa: {
    enabled: true,
    defaultStatus: "nao_iniciada",
    defaultPriority: "normal",
    requiredFields: ["subject"],
    defaultDueDaysOffset: 3,
    autoAssignCreator: true,
  },
  ligacao: {
    enabled: true,
    defaultStatus: "agendado",
    defaultPriority: "normal",
    requiredFields: ["subject", "phone"],
    requirePhone: true,
    requireResult: false,
  },
  nota: {
    enabled: true,
    defaultStatus: "publicada",
    defaultPriority: "normal",
    requiredFields: ["body"],
    defaultVisibility: "publica",
    autoShareWithTeam: false,
  },
  mensagem: {
    enabled: true,
    defaultStatus: "rascunho",
    defaultPriority: "normal",
    requiredFields: ["body", "recipient"],
    defaultChannel: "whatsapp",
    requireRecipient: true,
  },
  email: {
    enabled: true,
    defaultStatus: "rascunho",
    defaultPriority: "normal",
    requiredFields: ["subject", "body", "recipient"],
    defaultChannel: "email",
    requireRecipient: true,
  },
};

const DEFAULT_CONFIG: ObjectConfig = {
  activitySyncGoogleCalendar: true,
  activityAutoMeetLink: true,
  activityNotifyOnAssign: true,
  activityAutoLogCalls: false,
  activityDefaultTimezone: "America/Sao_Paulo",
  activityDefaultReminder: "15 minutos antes",
  activityTaskInactivityDays: 7,
  activityTypeRules: DEFAULT_TYPE_RULES,
};

/* ================================================================== */
/*  Segmented types                                                    */
/* ================================================================== */

type SegmentTab = "configuracao" | "tipos" | "layout";

const SEGMENT_TABS: { key: SegmentTab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "configuracao", label: "Configuracao", icon: GearFine },
  { key: "tipos", label: "Tipos", icon: Shapes },
  { key: "layout", label: "Layout", icon: Layout },
];

/* ================================================================== */
/*  Horizontal divider                                                 */
/* ================================================================== */

function HorizontalDivider() {
  return (
    <div className="w-full h-0 shrink-0">
      <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 1.5">
        <line stroke="#DDE3EC" strokeWidth="1.5" x2="1000" y1="0.75" y2="0.75" />
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  Shared small components                                            */
/* ================================================================== */

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[#28415c]" style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3, ...ff }}>
        {title}
      </span>
      <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
        {subtitle}
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[12px] py-[4px]">
      {icon && <div className="text-[#4e6987] shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <span className="text-[#28415c] block" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
          {label}
        </span>
        <span className="text-[#98989d] block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}>
          {description}
        </span>
      </div>
      <ZeniteToggle active={value} onChange={() => onChange(!value)} />
    </div>
  );
}

function SelectRow({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-[12px] py-[4px]">
      <div className="flex-1 min-w-0">
        <span className="text-[#28415c] block" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
          {label}
        </span>
        <span className="text-[#98989d] block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}>
          {description}
        </span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] rounded-[8px] border border-[#dde3ec] px-[10px] text-[#28415c] bg-white outline-none focus:border-[#07ABDE] transition-colors cursor-pointer"
        style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...ff, minWidth: 180 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ================================================================== */
/*  Notification Toggle with browser permission                        */
/* ================================================================== */

function NotificationToggleRow({
  config,
  onPatch,
}: {
  config: ObjectConfig;
  onPatch: (partial: Partial<ObjectConfig>) => void;
}) {
  const { permission, requestPermission } = useNotifications();
  const isEnabled = !!config.activityNotifyOnAssign;

  const permLabel =
    permission === "granted"
      ? "Permissão concedida"
      : permission === "denied"
      ? "Bloqueado pelo navegador"
      : permission === "unsupported"
      ? "Navegador não suporta"
      : "Permissão pendente";

  const permColor =
    permission === "granted"
      ? "#3ccea7"
      : permission === "denied"
      ? "#ff8c76"
      : "#eac23d";

  const handleToggle = async (v: boolean) => {
    if (v) {
      // Request browser permission first
      if (permission === "unsupported") {
        toast.error("Seu navegador não suporta notificações nativas.");
        return;
      }
      if (permission === "denied") {
        toast.error(
          "Notificações foram bloqueadas. Vá em Configurações do navegador > Site > Notificações e permita este site.",
          { duration: 6000 },
        );
        return;
      }
      if (permission !== "granted") {
        const result = await requestPermission();
        if (result === "denied") {
          toast.error(
            "Você negou a permissão de notificações. Para ativar depois, vá em Configurações do navegador > Site > Notificações.",
            { duration: 6000 },
          );
          return;
        }
        if (result !== "granted") {
          toast("Permissão de notificação não foi concedida.", { duration: 4000 });
          return;
        }
      }
      toast.success("Notificações no navegador ativadas!");
    }
    onPatch({ activityNotifyOnAssign: v });
  };

  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center gap-[12px] py-[4px]">
        <div className="text-[#4e6987] shrink-0">
          <Bell size={16} weight="duotone" className="text-[#eac23d]" />
        </div>
        <div className="flex-1 min-w-0">
          <span
            className="text-[#28415c] block"
            style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
          >
            Notificar ao atribuir atividade
          </span>
          <span
            className="text-[#98989d] block"
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}
          >
            Enviar notificação no navegador quando uma atividade for atribuída a um membro
          </span>
        </div>
        <ZeniteToggle active={isEnabled} onChange={() => handleToggle(!isEnabled)} />
      </div>
      {/* Permission status badge */}
      {isEnabled && (
        <div className="flex items-center gap-[6px] ml-[28px]">
          <span
            className="inline-block w-[6px] h-[6px] rounded-full shrink-0"
            style={{ backgroundColor: permColor }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: -0.3,
              color: permColor,
              ...ff,
            }}
          >
            {permLabel}
          </span>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Tab: Configuracao                                                  */
/* ================================================================== */

function TabConfiguracao({
  config,
  onPatch,
}: {
  config: ObjectConfig;
  onPatch: (partial: Partial<ObjectConfig>) => void;
}) {
  return (
    <div className="flex flex-col gap-[20px] p-[24px]">
      {/* Section: Google Calendar & Meet */}
      <SectionTitle
        title="Google Calendar e Meet"
        subtitle="Integração com o Google Workspace para compromissos e videoconferências"
      />

      <div className="flex flex-col gap-[12px]">
        <ToggleRow
          icon={<GoogleLogo size={16} weight="duotone" className="text-[#07abde]" />}
          label="Sincronizar com Google Calendar"
          description="Criar e atualizar eventos no Google Calendar automaticamente ao salvar compromissos"
          value={!!config.activitySyncGoogleCalendar}
          onChange={(v) => onPatch({ activitySyncGoogleCalendar: v })}
        />
        <HorizontalDivider />
        <ToggleRow
          icon={<VideoCamera size={16} weight="duotone" className="text-[#8c8cd4]" />}
          label="Gerar link do Google Meet automaticamente"
          description="Ao criar compromisso, gerar link do Meet e incluir no convite"
          value={!!config.activityAutoMeetLink}
          onChange={(v) => onPatch({ activityAutoMeetLink: v })}
        />
      </div>

      <HorizontalDivider />

      {/* Section: Notificacoes */}
      <SectionTitle
        title="Notificações e Atribuição"
        subtitle="Como o sistema notifica e atribui atividades"
      />

      <div className="flex flex-col gap-[12px]">
        <NotificationToggleRow
          config={config}
          onPatch={onPatch}
        />
        <HorizontalDivider />
        <ToggleRow
          icon={<PhoneCall size={16} weight="duotone" className="text-[#3ccea7]" />}
          label="Registrar ligações automaticamente"
          description="Criar registro de ligação automaticamente ao detectar chamadas do sistema"
          value={!!config.activityAutoLogCalls}
          onChange={(v) => onPatch({ activityAutoLogCalls: v })}
        />
      </div>

      <HorizontalDivider />

      {/* Section: Padroes */}
      <SectionTitle
        title="Configurações Padrão"
        subtitle="Valores padrão aplicados ao criar novas atividades"
      />

      <div className="flex flex-col gap-[12px]">
        <SelectRow
          label="Fuso Horário Padrão"
          description="Fuso usado ao criar compromissos sem timezone específico"
          value={config.activityDefaultTimezone ?? "America/Sao_Paulo"}
          options={[
            { value: "America/Sao_Paulo", label: "America/Sao_Paulo (BRT)" },
            { value: "America/Manaus", label: "America/Manaus (AMT)" },
            { value: "America/Belem", label: "America/Belem (BRT)" },
            { value: "America/Fortaleza", label: "America/Fortaleza (BRT)" },
            { value: "America/Recife", label: "America/Recife (BRT)" },
            { value: "America/Cuiaba", label: "America/Cuiaba (AMT)" },
            { value: "America/Porto_Velho", label: "America/Porto_Velho (AMT)" },
            { value: "America/Rio_Branco", label: "America/Rio_Branco (ACT)" },
            { value: "America/New_York", label: "America/New_York (EST)" },
            { value: "Europe/London", label: "Europe/London (GMT)" },
            { value: "Europe/Lisbon", label: "Europe/Lisbon (WET)" },
          ]}
          onChange={(v) => onPatch({ activityDefaultTimezone: v })}
        />

        <HorizontalDivider />

        <SelectRow
          label="Lembrete Padrão"
          description="Lembrete padrão ao criar compromissos"
          value={config.activityDefaultReminder ?? "15 minutos antes"}
          options={[
            { value: "nenhum", label: "Sem lembrete" },
            { value: "5 minutos antes", label: "5 minutos antes" },
            { value: "15 minutos antes", label: "15 minutos antes" },
            { value: "30 minutos antes", label: "30 minutos antes" },
            { value: "1 hora antes", label: "1 hora antes" },
            { value: "1 dia antes", label: "1 dia antes" },
          ]}
          onChange={(v) => onPatch({ activityDefaultReminder: v })}
        />
      </div>

      <HorizontalDivider />

      {/* Section: Prazo de Inatividade de Tarefa */}
      <SectionTitle
        title="Prazo de Inatividade (Tarefas)"
        subtitle="Tarefas sem atualização após esse prazo serão destacadas como 'Em atraso'"
      />

      <div className="flex items-center gap-[12px]">
        <span className="text-[#4e6987] shrink-0" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
          Destacar como em atraso após:
        </span>
        <input
          type="number"
          value={config.activityTaskInactivityDays ?? 7}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v > 0) onPatch({ activityTaskInactivityDays: v });
          }}
          className="w-[72px] h-[36px] rounded-[8px] border border-[#dde3ec] px-[10px] text-center text-[#28415c] bg-white outline-none focus:border-[#07ABDE] transition-colors"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
          min={1}
          max={365}
        />
        <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>dias</span>
      </div>

      <div className="flex items-start gap-[10px] p-[12px] bg-[#ffedeb40] rounded-[10px]">
        <Info size={14} weight="fill" className="shrink-0 mt-[2px]" style={{ color: ACT_COLOR }} />
        <span className="text-[#4e6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}>
          Tarefas em atraso recebem badge visual na listagem e no cabeçalho. Os compromissos do Google Calendar obedecem ao fuso horário do evento.
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab: Tipos — Per-type rules                                        */
/* ================================================================== */

function ActivityTypeCard({
  meta,
  rule,
  onPatchRule,
}: {
  meta: ActivityTypeMeta;
  rule: ActivityTypeRule;
  onPatchRule: (partial: Partial<ActivityTypeRule>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = meta.icon;

  const statuses = rule.availableStatuses ?? meta.defaultStatuses;
  const requiredFields = rule.requiredFields ?? [];

  // All available fields for required check
  const sharedFields = [
    { key: "subject", label: "Assunto" },
    { key: "description", label: "Descricao" },
    { key: "body", label: "Corpo/Conteudo" },
    { key: "start_date", label: "Data Inicio" },
    { key: "end_date", label: "Data Termino" },
    { key: "due_date", label: "Data Vencimento" },
    { key: "assigned_to", label: "Atribuido a" },
    { key: "related_to_id", label: "Entidade Vinculada" },
    { key: "contact_id", label: "Contato" },
    { key: "location", label: "Localizacao" },
    { key: "phone", label: "Telefone" },
    { key: "recipient", label: "Destinatario" },
  ];

  const toggleRequired = (fieldKey: string) => {
    const next = requiredFields.includes(fieldKey)
      ? requiredFields.filter((f) => f !== fieldKey)
      : [...requiredFields, fieldKey];
    onPatchRule({ requiredFields: next });
  };

  return (
    <div
      className="rounded-[14px] overflow-hidden transition-all"
      style={{ backgroundColor: expanded ? `${meta.bg}40` : "#f6f7f9" }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
        className="flex items-center gap-[12px] w-full px-[16px] py-[14px] hover:bg-[#f0f2f5] transition-colors cursor-pointer group"
      >
        <div
          className="flex items-center justify-center size-[36px] rounded-[10px] shrink-0"
          style={{ backgroundColor: meta.bg }}
        >
          <Icon size={18} weight="duotone" style={{ color: meta.color }} />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <span className="text-[#28415c] block" style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, ...ff }}>
            {meta.label}
          </span>
          <span className="text-[#98989d] block truncate" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
            {meta.description}
          </span>
        </div>

        {/* Enabled toggle */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <ZeniteToggle
            active={rule.enabled !== false}
            onChange={() => onPatchRule({ enabled: !(rule.enabled !== false) })}
          />
        </div>

        {/* Status pills preview */}
        <div className="hidden lg:flex items-center gap-[4px] shrink-0">
          {statuses.slice(0, 3).map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-[3px] h-[20px] px-[7px] rounded-[5px]"
              style={{ backgroundColor: s.color + "18", fontSize: 10, fontWeight: 600, letterSpacing: -0.2, color: s.color, ...ff }}
            >
              <span className="size-[5px] rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
          {statuses.length > 3 && (
            <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 600, ...ff }}>
              +{statuses.length - 3}
            </span>
          )}
        </div>

        {/* Fields count */}
        <span
          className="text-[#98989d] bg-[#f0f2f5] px-[8px] py-[2px] rounded-[6px] shrink-0 hidden md:block"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...ff }}
        >
          {meta.specificFields.length} campos
        </span>

        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <CaretDown size={14} weight="bold" className="text-[#98989d]" />
        </motion.div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-[16px] pb-[16px] flex flex-col gap-[16px]">
              <HorizontalDivider />

              {/* Default status & priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                <div className="flex flex-col gap-[4px]">
                  <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                    Status Padrao
                  </span>
                  <select
                    value={rule.defaultStatus ?? statuses[0]?.key ?? ""}
                    onChange={(e) => onPatchRule({ defaultStatus: e.target.value })}
                    className="h-[34px] rounded-[8px] border border-[#dde3ec] px-[10px] text-[#28415c] bg-white outline-none focus:border-[#07ABDE] transition-colors cursor-pointer"
                    style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...ff }}
                  >
                    {statuses.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-[4px]">
                  <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                    Prioridade Padrao
                  </span>
                  <select
                    value={rule.defaultPriority ?? "normal"}
                    onChange={(e) => onPatchRule({ defaultPriority: e.target.value })}
                    className="h-[34px] rounded-[8px] border border-[#dde3ec] px-[10px] text-[#28415c] bg-white outline-none focus:border-[#07ABDE] transition-colors cursor-pointer"
                    style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...ff }}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              {/* Status list */}
              <div className="flex flex-col gap-[4px]">
                <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                  Status Disponiveis
                </span>
                <div className="flex flex-wrap gap-[6px]">
                  {statuses.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center gap-[6px] h-[30px] px-[10px] rounded-[8px] group/status"
                      style={{ backgroundColor: s.color + "14", border: `1px solid ${s.color}30` }}
                    >
                      <span className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, color: s.color, ...ff }}>
                        {s.label}
                      </span>
                      <button
                        onClick={() => {
                          const next = statuses.filter((st) => st.key !== s.key);
                          onPatchRule({ availableStatuses: next });
                        }}
                        className="flex items-center justify-center size-[16px] rounded-full opacity-0 group-hover/status:opacity-100 hover:bg-[#ffedeb] transition-all cursor-pointer shrink-0"
                      >
                        <X size={8} weight="bold" className="text-[#ff8c76]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required fields */}
              <div className="flex flex-col gap-[6px]">
                <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                  Campos Obrigatorios
                </span>
                <div className="flex flex-wrap gap-[6px]">
                  {sharedFields.map((f) => {
                    const isReq = requiredFields.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleRequired(f.key)}
                        className="flex items-center gap-[5px] h-[28px] px-[10px] rounded-[7px] transition-all cursor-pointer"
                        style={{
                          backgroundColor: isReq ? meta.color + "18" : "#f0f2f5",
                          border: `1px solid ${isReq ? meta.color + "40" : "#dde3ec"}`,
                        }}
                      >
                        {isReq && <Check size={10} weight="bold" style={{ color: meta.color }} />}
                        <span
                          style={{
                            fontSize: 11, fontWeight: 600, letterSpacing: -0.3,
                            color: isReq ? meta.color : "#4e6987",
                            ...ff,
                          }}
                        >
                          {f.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type-specific settings */}
              <HorizontalDivider />
              <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                Regras Especificas — {meta.label}
              </span>

              <div className="flex flex-col gap-[8px]">
                {meta.key === "compromisso" && (
                  <>
                    <ToggleRow
                      label="Gerar link Meet automaticamente"
                      description="Criar Google Meet ao salvar compromisso"
                      value={rule.autoMeetLink !== false}
                      onChange={(v) => onPatchRule({ autoMeetLink: v })}
                    />
                    <SelectRow
                      label="Lembrete Padrao"
                      description="Tempo antes do compromisso"
                      value={rule.defaultReminder ?? "15 minutos antes"}
                      options={[
                        { value: "nenhum", label: "Sem lembrete" },
                        { value: "5 minutos antes", label: "5 min antes" },
                        { value: "15 minutos antes", label: "15 min antes" },
                        { value: "30 minutos antes", label: "30 min antes" },
                        { value: "1 hora antes", label: "1 hora antes" },
                        { value: "1 dia antes", label: "1 dia antes" },
                      ]}
                      onChange={(v) => onPatchRule({ defaultReminder: v })}
                    />
                    <SelectRow
                      label="Disponibilidade Padrao"
                      description="Mostrar como ocupado, livre ou provisorio"
                      value={rule.defaultBusyStatus ?? "ocupado"}
                      options={[
                        { value: "ocupado", label: "Ocupado" },
                        { value: "livre", label: "Livre" },
                        { value: "provisorio", label: "Provisorio" },
                      ]}
                      onChange={(v) => onPatchRule({ defaultBusyStatus: v })}
                    />
                  </>
                )}

                {meta.key === "tarefa" && (
                  <>
                    <ToggleRow
                      label="Atribuir ao criador automaticamente"
                      description="O criador da tarefa e definido como responsavel automaticamente"
                      value={rule.autoAssignCreator !== false}
                      onChange={(v) => onPatchRule({ autoAssignCreator: v })}
                    />
                    <div className="flex items-center gap-[12px] py-[4px]">
                      <div className="flex-1 min-w-0">
                        <span className="text-[#28415c] block" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                          Prazo padrao (dias)
                        </span>
                        <span className="text-[#98989d] block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}>
                          Dias adicionados a data de criacao como vencimento padrao
                        </span>
                      </div>
                      <input
                        type="number"
                        value={rule.defaultDueDaysOffset ?? 3}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v > 0) onPatchRule({ defaultDueDaysOffset: v });
                        }}
                        className="w-[60px] h-[34px] rounded-[8px] border border-[#dde3ec] px-[8px] text-center text-[#28415c] bg-white outline-none focus:border-[#07ABDE] transition-colors"
                        style={{ fontSize: 12, fontWeight: 600, ...ff }}
                        min={1}
                        max={365}
                      />
                    </div>
                  </>
                )}

                {meta.key === "ligacao" && (
                  <>
                    <ToggleRow
                      label="Telefone obrigatorio"
                      description="Exigir numero de telefone ao registrar ligacao"
                      value={rule.requirePhone !== false}
                      onChange={(v) => onPatchRule({ requirePhone: v })}
                    />
                    <ToggleRow
                      label="Resultado obrigatorio"
                      description="Exigir campo resultado ao concluir ligacao"
                      value={!!rule.requireResult}
                      onChange={(v) => onPatchRule({ requireResult: v })}
                    />
                  </>
                )}

                {meta.key === "nota" && (
                  <>
                    <SelectRow
                      label="Visibilidade Padrao"
                      description="Notas sao publicas ou privadas por padrao"
                      value={rule.defaultVisibility ?? "publica"}
                      options={[
                        { value: "publica", label: "Publica" },
                        { value: "privada", label: "Privada" },
                      ]}
                      onChange={(v) => onPatchRule({ defaultVisibility: v })}
                    />
                    <ToggleRow
                      label="Compartilhar com equipe automaticamente"
                      description="Novas notas sao compartilhadas com os membros da equipe do proprietario"
                      value={!!rule.autoShareWithTeam}
                      onChange={(v) => onPatchRule({ autoShareWithTeam: v })}
                    />
                  </>
                )}

                {(meta.key === "mensagem" || meta.key === "email") && (
                  <>
                    <SelectRow
                      label="Canal Padrao"
                      description="Canal padrao ao criar nova mensagem"
                      value={rule.defaultChannel ?? (meta.key === "email" ? "email" : "whatsapp")}
                      options={
                        meta.key === "email"
                          ? [{ value: "email", label: "Email" }]
                          : [
                              { value: "whatsapp", label: "WhatsApp" },
                              { value: "sms", label: "SMS" },
                              { value: "chat_interno", label: "Chat Interno" },
                              { value: "telegram", label: "Telegram" },
                            ]
                      }
                      onChange={(v) => onPatchRule({ defaultChannel: v })}
                    />
                    <ToggleRow
                      label="Destinatario obrigatorio"
                      description="Exigir campo destinatario ao criar mensagem"
                      value={rule.requireRecipient !== false}
                      onChange={(v) => onPatchRule({ requireRecipient: v })}
                    />
                  </>
                )}
              </div>

              {/* Specific fields list */}
              <div className="flex flex-col gap-[4px]">
                <span className="text-[#98989d] uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}>
                  Campos do Tipo
                </span>
                <div className="flex flex-wrap gap-[4px]">
                  {meta.specificFields.map((sf) => (
                    <span
                      key={sf.key}
                      className="inline-flex items-center h-[24px] px-[8px] rounded-[6px]"
                      style={{
                        backgroundColor: meta.bg,
                        fontSize: 11, fontWeight: 600, letterSpacing: -0.2,
                        color: meta.color,
                        fontFamily: "'DM Mono', monospace",
                        ...ff,
                      }}
                    >
                      {sf.key}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabTipos({
  config,
  onPatch,
}: {
  config: ObjectConfig;
  onPatch: (partial: Partial<ObjectConfig>) => void;
}) {
  const typeRules = config.activityTypeRules ?? DEFAULT_TYPE_RULES;

  const patchTypeRule = (typeKey: string, partial: Partial<ActivityTypeRule>) => {
    const current = typeRules[typeKey] ?? {};
    const next = { ...typeRules, [typeKey]: { ...current, ...partial } };
    onPatch({ activityTypeRules: next });
  };

  return (
    <div className="flex flex-col gap-[12px] p-[24px]">
      {/* Info banner */}
      <div className="flex items-start gap-[10px] p-[12px] bg-[#f0f8ff] rounded-[10px]">
        <Info size={16} weight="fill" className="text-[#07ABDE] shrink-0 mt-[2px]" />
        <span
          className="text-[#4e6987]"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...ff }}
        >
          Configure regras especificas para cada tipo de atividade. Defina status padrao,
          campos obrigatorios, e comportamentos automaticos. Desative tipos que nao serao usados.
        </span>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-[12px]">
        <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
          {ACTIVITY_TYPES.length} tipos de atividade
        </span>
        <span
          className="text-[#3ccea7] bg-[#d9f8ef] px-[8px] py-[2px] rounded-full"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}
        >
          {ACTIVITY_TYPES.filter((t) => (typeRules[t.key]?.enabled ?? true)).length} ativos
        </span>
      </div>

      {/* Type cards */}
      {ACTIVITY_TYPES.map((meta) => (
        <ActivityTypeCard
          key={meta.key}
          meta={meta}
          rule={typeRules[meta.key] ?? {}}
          onPatchRule={(partial) => patchTypeRule(meta.key, partial)}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Tab: Layout — DnD editor (simplified)                              */
/* ================================================================== */

const ALL_ACTIVITY_FIELD_LABELS = ACTIVITY_FIELDS
  .filter((f) => f.visible && f.fieldType !== "id" && f.fieldType !== "calculated")
  .map((f) => f.label);

interface LayoutSectionData {
  title: string;
  fields: string[];
}

const DEFAULT_LAYOUT: LayoutSectionData[] = [
  {
    title: "Dados Principais",
    fields: ["Tipo de Atividade", "Assunto", "Descricao", "Status", "Prioridade", "Proprietario", "Atribuido a"],
  },
  {
    title: "Datas",
    fields: ["Data/Hora de Inicio", "Data/Hora de Termino", "Data de Vencimento", "Dia Inteiro"],
  },
  {
    title: "Vinculo",
    fields: ["Tipo de Entidade Vinculada", "Nome do Contato", "Localizacao"],
  },
  {
    title: "Compromisso",
    fields: ["Link do Google Meet", "Fuso Horario", "Participantes", "Lembrete", "Disponibilidade"],
  },
  {
    title: "Ligacao",
    fields: ["Telefone", "Tipo de Ligacao", "Direcao", "Duracao (segundos)", "Resultado da Ligacao"],
  },
  {
    title: "Mensagem / Email",
    fields: ["Canal", "Destinatario", "Telefone do Destinatario"],
  },
  {
    title: "Nota",
    fields: ["Corpo / Conteudo", "Visibilidade da Nota", "Compartilhado Com", "Tags"],
  },
  {
    title: "Sistema",
    fields: ["Criado Em", "Ultima Atualizacao", "Criado Por", "Ultima Atualizacao Por"],
  },
];

const DND_FIELD = "ACT_LAYOUT_FIELD";

/* ── Draggable Field ── */
function DraggableFieldRow({
  field,
  sectionIdx,
  fieldIdx,
  onMoveField,
  onRemoveField,
}: {
  field: string;
  sectionIdx: number;
  fieldIdx: number;
  onMoveField: (from: { section: number; field: number }, to: { section: number; field: number }) => void;
  onRemoveField: (sectionIdx: number, fieldIdx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DND_FIELD,
    item: () => ({ sectionIdx, fieldIdx, field }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: DND_FIELD,
    hover: (item: { sectionIdx: number; fieldIdx: number; field: string }, monitor) => {
      if (!ref.current) return;
      const dragSection = item.sectionIdx;
      const dragField = item.fieldIdx;
      const hoverSection = sectionIdx;
      const hoverField = fieldIdx;
      if (dragSection === hoverSection && dragField === hoverField) return;

      const hoverRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverRect.top;

      if (dragSection === hoverSection) {
        if (dragField < hoverField && hoverClientY < hoverMiddleY) return;
        if (dragField > hoverField && hoverClientY > hoverMiddleY) return;
      }

      onMoveField({ section: dragSection, field: dragField }, { section: hoverSection, field: hoverField });
      item.sectionIdx = hoverSection;
      item.fieldIdx = hoverField;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-[8px] h-[36px] px-[10px] rounded-[8px] transition-all group ${
        isDragging ? "opacity-30 bg-[#ffedeb] scale-[0.98]" : isOver ? "bg-[#ffedeb] shadow-[inset_0_0_0_1.5px_#ff8c76]" : "bg-white hover:bg-[#fafbfc]"
      }`}
      style={{ cursor: "grab" }}
    >
      <DotsSixVertical size={14} weight="bold" className="text-[#cdd1da] group-hover:text-[#98989d] shrink-0" />
      <TextT size={13} weight="duotone" className="text-[#b0b7c3] shrink-0" />
      <span className="text-[#4e6987] flex-1" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
        {field}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemoveField(sectionIdx, fieldIdx); }}
        className="flex items-center justify-center size-[24px] rounded-[6px] opacity-0 group-hover:opacity-100 hover:bg-[#ffedeb] transition-all cursor-pointer shrink-0"
      >
        <X size={12} weight="bold" className="text-[#ff8c76]" />
      </button>
    </div>
  );
}

/* ── Add Field Popover ── */
function AddFieldPopover({
  allUsedFields,
  onAdd,
  onClose,
}: {
  allUsedFields: Set<string>;
  onAdd: (field: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const available = useMemo(() => {
    return ALL_ACTIVITY_FIELD_LABELS.filter(
      (f) => !allUsedFields.has(f) && f.toLowerCase().includes(search.toLowerCase()),
    );
  }, [allUsedFields, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 top-full mt-[4px] bg-white rounded-[12px] border border-[#dde3ec] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-20 overflow-hidden"
      style={{ maxHeight: 260 }}
    >
      <div className="flex items-center gap-[8px] px-[12px] h-[40px] border-b border-[#eef0f4]">
        <MagnifyingGlass size={14} weight="bold" className="text-[#98989d] shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar campo..."
          className="flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c0c5cf]"
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="cursor-pointer">
            <X size={12} weight="bold" className="text-[#98989d]" />
          </button>
        )}
      </div>
      <div className="overflow-auto" style={{ maxHeight: 216 }}>
        {available.length === 0 ? (
          <div className="flex items-center justify-center h-[48px]">
            <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
              {search ? "Nenhum campo encontrado" : "Todos os campos ja estao no layout"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col py-[4px]">
            {available.map((field) => (
              <button
                key={field}
                onClick={() => { onAdd(field); onClose(); }}
                className="flex items-center gap-[8px] h-[34px] px-[14px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
              >
                <Plus size={12} weight="bold" className="text-[#ff8c76] shrink-0" />
                <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
                  {field}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Layout Section ── */
function LayoutSection({
  section,
  sectionIdx,
  allUsedFields,
  onMoveField,
  onRemoveField,
  onAddField,
  onRemoveSection,
  onRenameSection,
}: {
  section: LayoutSectionData;
  sectionIdx: number;
  allUsedFields: Set<string>;
  onMoveField: (from: { section: number; field: number }, to: { section: number; field: number }) => void;
  onRemoveField: (sectionIdx: number, fieldIdx: number) => void;
  onAddField: (sectionIdx: number, field: string) => void;
  onRemoveSection: (sectionIdx: number) => void;
  onRenameSection: (sectionIdx: number, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);

  const [{ isOver: isFieldOver }, fieldDrop] = useDrop({
    accept: DND_FIELD,
    drop: (item: { sectionIdx: number; fieldIdx: number }) => {
      if (section.fields.length === 0) {
        onMoveField({ section: item.sectionIdx, field: item.fieldIdx }, { section: sectionIdx, field: 0 });
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div className="rounded-[12px] overflow-visible transition-all bg-[#f6f7f9]">
      <div className="flex items-center gap-[6px] w-full px-[12px] py-[10px] hover:bg-[#eef0f4] transition-colors group/section rounded-t-[12px]">
        <button onClick={() => setExpanded((v) => !v)} className="shrink-0 cursor-pointer">
          <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
            <CaretDown size={13} weight="bold" className="text-[#98989d]" />
          </motion.div>
        </button>

        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => { if (editTitle.trim()) onRenameSection(sectionIdx, editTitle.trim()); setIsEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { if (editTitle.trim()) onRenameSection(sectionIdx, editTitle.trim()); setIsEditing(false); }
              if (e.key === "Escape") { setEditTitle(section.title); setIsEditing(false); }
            }}
            className="flex-1 bg-white rounded-[6px] px-[8px] h-[28px] outline-none border border-[#ff8c76] text-[#28415c]"
            style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...ff }}
          />
        ) : (
          <span
            onDoubleClick={() => { setEditTitle(section.title); setIsEditing(true); }}
            className="text-[#28415c] flex-1 cursor-default select-none"
            style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...ff }}
          >
            {section.title}
          </span>
        )}

        <span className="text-[#98989d] shrink-0" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
          {section.fields.length} {section.fields.length === 1 ? "campo" : "campos"}
        </span>

        <div className="flex items-center gap-[2px] opacity-0 group-hover/section:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => { setEditTitle(section.title); setIsEditing(true); }}
            className="flex items-center justify-center size-[26px] rounded-[6px] hover:bg-[#e4e7ec] transition-colors cursor-pointer"
          >
            <PencilSimple size={13} weight="bold" className="text-[#98989d]" />
          </button>
          <button
            onClick={() => onRemoveSection(sectionIdx)}
            className="flex items-center justify-center size-[26px] rounded-[6px] hover:bg-[#ffedeb] transition-colors cursor-pointer"
          >
            <Trash size={13} weight="bold" className="text-[#ff8c76]" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div ref={fieldDrop as any} className="flex flex-col gap-[2px] px-[8px] pb-[8px]">
              {section.fields.length === 0 ? (
                <div className={`flex items-center justify-center h-[48px] rounded-[8px] border-2 border-dashed transition-colors ${isFieldOver ? "border-[#ff8c76] bg-[#ffedeb]" : "border-[#dde3ec]"}`}>
                  <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
                    Arraste campos aqui ou clique em Adicionar
                  </span>
                </div>
              ) : (
                section.fields.map((field, fieldIdx) => (
                  <DraggableFieldRow
                    key={`${sectionIdx}-${fieldIdx}-${field}`}
                    field={field}
                    sectionIdx={sectionIdx}
                    fieldIdx={fieldIdx}
                    onMoveField={onMoveField}
                    onRemoveField={onRemoveField}
                  />
                ))
              )}

              <div className="relative mt-[2px]">
                <button
                  onClick={() => setShowAddPopover((v) => !v)}
                  className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] border border-dashed border-[#dde3ec] text-[#98989d] hover:border-[#ff8c76] hover:text-[#ff8c76] hover:bg-[#fff8f7] transition-all cursor-pointer"
                >
                  <Plus size={12} weight="bold" />
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...ff }}>Adicionar Campo</span>
                </button>
                <AnimatePresence>
                  {showAddPopover && (
                    <AddFieldPopover allUsedFields={allUsedFields} onAdd={(field) => onAddField(sectionIdx, field)} onClose={() => setShowAddPopover(false)} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabLayout({
  config,
  onPatch,
}: {
  config: ObjectConfig;
  onPatch: (partial: Partial<ObjectConfig>) => void;
}) {
  const [sections, setSections] = useState<LayoutSectionData[]>(() =>
    config.layout && config.layout.length > 0
      ? config.layout.map((s) => ({ ...s, fields: [...s.fields] }))
      : DEFAULT_LAYOUT.map((s) => ({ ...s, fields: [...s.fields] })),
  );

  const commitLayout = useCallback(
    (next: LayoutSectionData[]) => { setSections(next); onPatch({ layout: next }); },
    [onPatch],
  );

  const handleMoveField = useCallback(
    (from: { section: number; field: number }, to: { section: number; field: number }) => {
      setSections((prev) => {
        const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
        const [removed] = next[from.section].fields.splice(from.field, 1);
        next[to.section].fields.splice(to.field, 0, removed);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    function onDragEnd() {
      setSections((current) => { onPatch({ layout: current }); return current; });
    }
    document.addEventListener("dragend", onDragEnd);
    return () => document.removeEventListener("dragend", onDragEnd);
  }, [onPatch]);

  const handleRemoveField = useCallback((sectionIdx: number, fieldIdx: number) => {
    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
      next[sectionIdx].fields.splice(fieldIdx, 1);
      onPatch({ layout: next });
      return next;
    });
  }, [onPatch]);

  const handleAddField = useCallback((sectionIdx: number, field: string) => {
    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
      next[sectionIdx].fields.push(field);
      onPatch({ layout: next });
      return next;
    });
  }, [onPatch]);

  const handleRemoveSection = useCallback((sectionIdx: number) => {
    setSections((prev) => {
      const next = prev.filter((_, i) => i !== sectionIdx);
      onPatch({ layout: next });
      return next;
    });
  }, [onPatch]);

  const handleRenameSection = useCallback((sectionIdx: number, title: string) => {
    setSections((prev) => {
      const next = prev.map((s, i) => (i === sectionIdx ? { ...s, title } : s));
      onPatch({ layout: next });
      return next;
    });
  }, [onPatch]);

  const handleAddSection = useCallback(() => {
    setSections((prev) => {
      const next = [...prev, { title: "Nova Secao", fields: [] as string[] }];
      onPatch({ layout: next });
      return next;
    });
  }, [onPatch]);

  const allUsedFields = useMemo(() => new Set(sections.flatMap((s) => s.fields)), [sections]);
  const unusedCount = ALL_ACTIVITY_FIELD_LABELS.filter((f) => !allUsedFields.has(f)).length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-[16px] p-[24px]">
        <div className="flex items-start gap-[10px] p-[12px] bg-[#ffedeb40] rounded-[10px]">
          <Info size={16} weight="fill" className="shrink-0 mt-[2px]" style={{ color: ACT_COLOR }} />
          <span className="text-[#4e6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...ff }}>
            Arraste as secoes e campos para reorganizar o layout da pagina de detalhes da Atividade.
            Cada tipo de atividade compartilha o mesmo layout — campos especificos so aparecem quando o tipo corresponde.
          </span>
        </div>

        <div className="flex items-center gap-[12px]">
          <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
            {sections.length} {sections.length === 1 ? "secao" : "secoes"} · {allUsedFields.size} campos no layout
          </span>
          {unusedCount > 0 && (
            <span className="text-[#ff8c76] bg-[#ffedeb] px-[8px] py-[2px] rounded-full" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
              {unusedCount} disponiveis
            </span>
          )}
        </div>

        {sections.map((section, idx) => (
          <LayoutSection
            key={`section-${idx}`}
            section={section}
            sectionIdx={idx}
            allUsedFields={allUsedFields}
            onMoveField={handleMoveField}
            onRemoveField={handleRemoveField}
            onAddField={handleAddField}
            onRemoveSection={handleRemoveSection}
            onRenameSection={handleRenameSection}
          />
        ))}

        <button
          onClick={handleAddSection}
          className="flex items-center gap-[8px] h-[44px] px-[16px] rounded-[12px] border-2 border-dashed border-[#dde3ec] text-[#98989d] hover:border-[#ff8c76] hover:text-[#ff8c76] hover:bg-[#fff8f7] transition-all cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>Adicionar Secao</span>
        </button>
      </div>
    </DndProvider>
  );
}

/* ================================================================== */
/*  Main page                                                          */
/* ================================================================== */

export function CrmSettingsObjAtividades() {
  const [activeTab, setActiveTab] = useState<SegmentTab>("configuracao");
  const [config, setConfig] = useState<ObjectConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- Load config from backend --- */
  useEffect(() => {
    let cancelled = false;
    getObjectConfig("atividade")
      .then((data) => {
        if (cancelled) return;
        if (data) setConfig({ ...DEFAULT_CONFIG, ...data });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading activity object config:", err);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /* --- Patch + auto-save with debounce --- */
  const handlePatch = useCallback((partial: Partial<ObjectConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    setDirty(true);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      setSaving(true);
      patchObjectConfig("atividade", partial)
        .then(() => { setDirty(false); })
        .catch((err) => {
          console.error("Error saving activity object config:", err);
          toast.error("Erro ao salvar configuracoes de Atividade");
        })
        .finally(() => setSaving(false));
    }, 800);
  }, []);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  /* --- Segmented pill animation --- */
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<SegmentTab, HTMLButtonElement | null>>({
    configuracao: null,
    tipos: null,
    layout: null,
  });
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  const measurePill = useCallback(() => {
    const el = tabRefs.current[activeTab];
    const container = containerRef.current;
    if (el && container) {
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      setPillStyle({ left: eRect.left - cRect.left, width: eRect.width });
    }
  }, [activeTab]);

  useEffect(() => { measurePill(); }, [measurePill]);

  useEffect(() => {
    window.addEventListener("resize", measurePill);
    return () => window.removeEventListener("resize", measurePill);
  }, [measurePill]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* HEADER */}
      <div className="bg-white rounded-[16px] shrink-0 overflow-hidden">
        <div className="flex items-center gap-[14px] px-[20px] pt-[20px] pb-[16px]">
          <div
            className="flex items-center justify-center size-[40px] rounded-[10px] shrink-0"
            style={{ backgroundColor: ACT_BG }}
          >
            <CalendarBlank size={22} weight="duotone" style={{ color: ACT_COLOR }} />
          </div>
          <div className="flex-1 min-w-0">
            <span
              className="text-[#28415c] block"
              style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...ff }}
            >
              Atividades
            </span>
            <span
              className="text-[#98989d] block"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...ff }}
            >
              Configure comportamento, tipos e layout do objeto Atividade
            </span>
          </div>

          {/* Save status indicator */}
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-[6px] h-[30px] px-[12px] rounded-[8px] bg-[#f0f2f5]"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <SpinnerGap size={14} weight="bold" className="text-[#98989d]" />
                </motion.div>
                <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                  Salvando...
                </span>
              </motion.div>
            ) : dirty ? (
              <motion.div
                key="dirty"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-[6px] h-[30px] px-[12px] rounded-[8px]"
                style={{ backgroundColor: ACT_BG }}
              >
                <FloppyDisk size={14} weight="bold" style={{ color: ACT_COLOR }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, color: ACT_COLOR, ...ff }}>
                  Alteracoes pendentes
                </span>
              </motion.div>
            ) : !loading ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-[6px] h-[30px] px-[12px] rounded-[8px] bg-[#d9f8ef]"
              >
                <Check size={14} weight="bold" className="text-[#3ccea7]" />
                <span className="text-[#3ccea7]" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                  Salvo
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Segmented control */}
        <div className="px-[20px] pb-[16px]">
          <div
            ref={containerRef}
            className="relative flex items-center h-[40px] bg-[#f0f2f5] rounded-[500px] p-[3px] overflow-hidden"
            style={{ maxWidth: 420 }}
          >
            <motion.div
              className="absolute h-[34px] rounded-[500px]"
              style={{ backgroundColor: "#28415c", boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
              animate={{ left: pillStyle.left, width: pillStyle.width }}
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
            />

            {SEGMENT_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  ref={(el) => { tabRefs.current[tab.key] = el; }}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative z-[1] flex-1 flex items-center justify-center gap-[6px] h-[34px] px-[16px] rounded-[500px] cursor-pointer transition-colors"
                >
                  <TabIcon
                    size={15}
                    weight={isActive ? "fill" : "bold"}
                    className={isActive ? "text-white" : "text-[#98989d]"}
                  />
                  <span
                    className={isActive ? "text-white" : "text-[#98989d]"}
                    style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                boxShadow:
                  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 bg-white rounded-[16px] mt-[12px] overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <SpinnerGap size={24} weight="bold" className="text-[#98989d]" />
            </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === "configuracao" && <TabConfiguracao config={config} onPatch={handlePatch} />}
              {activeTab === "tipos" && <TabTipos config={config} onPatch={handlePatch} />}
              {activeTab === "layout" && <TabLayout config={config} onPatch={handlePatch} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
