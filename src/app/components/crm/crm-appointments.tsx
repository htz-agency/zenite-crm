/**
 * CRM Appointments (Compromissos) — Dedicated listing page.
 *
 * Two view modes: Calendario (weekly calendar, default) and Tabela (table).
 * Segmented control follows the same pattern as crm-opportunities.tsx.
 * Calendar view inspired by Google Calendar / reference images.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  CalendarBlank,
  CalendarCheck,
  CalendarDots,
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
  Warning,
  UserCircle,
  Lightning,
  Table,
  MapPin,
  Check,
  Spinner,
  Hourglass,
  VideoCamera,
  Users,
  IdentificationCard,
  LinkSimpleHorizontal,
  NotePencil,
  PencilSimple,
  User,
  ArrowRight,
  GlobeHemisphereWest,
  ArrowsClockwise,
  Copy,
  Plus,
  MagnifyingGlass,
  Building,
  SketchLogo,
  FloppyDisk,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

import {
  listActivities,
  patchActivity,
  createActivity,
  deleteActivity,
  generateCrmId,
  listAccounts,
  listOpportunities,
  listContacts,
  type DbActivity,
} from "./crm-api";
import { useCrmSearch } from "./crm-search-context";
import { useCreateActivity } from "./create-activity-context";
import { SectionToggle, ActionPill, ActionButton } from "./crm-detail-shared";
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

type AppointmentStatus = "agendado" | "confirmado" | "em_andamento" | "concluido" | "cancelado";
type ViewMode = "calendario" | "tabela";

interface Appointment {
  id: string;
  subject: string;
  description: string;
  status: AppointmentStatus;
  priority: Priority;
  startDate: string; // ISO datetime
  endDate: string;   // ISO datetime
  allDay: boolean;
  location: string;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  contactName: string;
  owner: string;
  meetLink: string;
  googleEventId: string;
  createdAt: string;
  updatedAt: string;
  // new fields matching Google Calendar sidebar
  timezone: string;
  recurrence: string;
  attendees: { name: string; email: string; organizer?: boolean; rsvp?: "sim" | "nao" | "talvez" | "pendente" }[];
  reminder: string;
  busyStatus: string;
  visibility: string;
  calendarName: string;
}

/* ------------------------------------------------------------------ */
/*  Status & Priority Config                                           */
/* ------------------------------------------------------------------ */

const STATUS_KEYS: AppointmentStatus[] = ["agendado", "confirmado", "em_andamento", "concluido", "cancelado"];

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  agendado:     { label: "Agendado",     color: "#07ABDE", bg: "#DCF0FF", icon: CalendarBlank },
  confirmado:   { label: "Confirmado",   color: "#135543", bg: "#D9F8EF", icon: CalendarCheck },
  em_andamento: { label: "Em andamento", color: "#8C5BD4", bg: "#E8E8FD", icon: Clock },
  concluido:    { label: "Concluido",    color: "#3CCEA7", bg: "#D9F8EF", icon: Check },
  cancelado:    { label: "Cancelado",    color: "#B13B00", bg: "#FFEDEB", icon: X },
};

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  baixa:  { ...PRIORITY_CONFIG.baixa,  icon: ArrowDown },
  normal: { ...PRIORITY_CONFIG.normal, icon: Clock },
  alta:   { ...PRIORITY_CONFIG.alta,   icon: ArrowUp },
};

const relatedTypeLabels = RELATED_TYPE_LABELS;

/* ------------------------------------------------------------------ */
/*  Contacts Pool (for attendee picker)                                */
/* ------------------------------------------------------------------ */

const CONTACTS_POOL: { name: string; email: string }[] = [
  { name: "Joao Silva", email: "joao@htz.agency" },
  { name: "Maria Oliveira", email: "maria@htz.agency" },
  { name: "Carlos Pereira", email: "carlos@htz.agency" },
  { name: "Lucas Souza", email: "lucas@htz.agency" },
  { name: "Pedro Costa", email: "pedro@htz.agency" },
  { name: "Rafaela Costa", email: "rafaela@htz.agency" },
  { name: "Juliana Ferreira", email: "juliana@htz.agency" },
  { name: "Fernanda Santos", email: "fernanda@htz.agency" },
  { name: "Ana Paula", email: "ana.paula@htz.agency" },
  { name: "Hends", email: "hends@htz.agency" },
  { name: "Ana Carolina", email: "ana@empresa.com" },
  { name: "Bruno Mendes", email: "bruno@alpha.com" },
  { name: "Kleber Oliveira", email: "kleber@zeta.com" },
  { name: "Helena Rocha", email: "helena@delta.com" },
  { name: "Daniela Souza", email: "daniela@alpha.com" },
  { name: "Larissa Campos", email: "larissa@epsilon.com" },
  { name: "Carlos Eduardo", email: "carlos.edu@email.com" },
];

/* ------------------------------------------------------------------ */
/*  Accounts & Opportunities Pool (for linking picker)                 */
/* ------------------------------------------------------------------ */

const ACCOUNTS_POOL: { id: string; name: string }[] = [
  { id: "AC-0EA1", name: "Empresa Alpha" },
  { id: "AC-J9K1", name: "Epsilon Ltda" },
  { id: "AC-L2M3", name: "Zeta Inc" },
  { id: "AC-N4O5", name: "Beta Corp" },
  { id: "AC-P6Q7", name: "Gamma Solutions" },
  { id: "AC-R8S9", name: "Delta Servicos" },
  { id: "AC-T1U2", name: "Omega Tech" },
];

const OPPORTUNITIES_POOL: { id: string; name: string; accountId?: string }[] = [
  { id: "OP-A1B2", name: "Projeto Alpha", accountId: "AC-0EA1" },
  { id: "OP-C3D4", name: "Expansao Beta", accountId: "AC-N4O5" },
  { id: "OP-E5F6", name: "Migracao Epsilon", accountId: "AC-J9K1" },
  { id: "OP-G7H8", name: "Renovacao Delta", accountId: "AC-R8S9" },
  { id: "OP-I9J1", name: "Implementacao Gamma", accountId: "AC-P6Q7" },
  { id: "OP-K2L3", name: "Consultoria Zeta", accountId: "AC-L2M3" },
  { id: "OP-M4N5", name: "Setup Omega", accountId: "AC-T1U2" },
];

/* ------------------------------------------------------------------ */
/*  Calendar Color Palette                                             */
/* ------------------------------------------------------------------ */

const CALENDAR_COLORS = [
  { bg: "#DCF0FF", border: "#013B4F", text: "#013B4F" },   // Blue Berry: bg / 500
  { bg: "#D9F8EF", border: "#083226", text: "#083226" },   // Green Mint: bg / 500
  { bg: "#E8E8FD", border: "#31315C", text: "#31315C" },   // Purple Pie: bg / 500
  { bg: "#FEEDCA", border: "#42350A", text: "#42350A" },   // Yellow Mustard: bg / 500
  { bg: "#FFEDEB", border: "#782500", text: "#782500" },   // Red Cherry: bg / 500
];

function getEventColor(idx: number) {
  return CALENDAR_COLORS[idx % CALENDAR_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Filter Panel Types & Config                                        */
/* ------------------------------------------------------------------ */

type ApptFilterField = "priority" | "relatedToType" | "owner";

interface ApptFilterCondition {
  field: ApptFilterField;
  values: string[];
}

const APPT_FILTER_FIELDS: { key: ApptFilterField; label: string; icon: React.ComponentType<any> }[] = [
  { key: "priority", label: "PRIORIDADE", icon: ArrowUp },
  { key: "relatedToType", label: "RELACIONADO A", icon: Lightning },
  { key: "owner", label: "PROPRIETARIO", icon: UserCircle },
];

function getApptFilterOptions(field: ApptFilterField, items: Appointment[]): { value: string; label: string }[] {
  switch (field) {
    case "priority":
      return (Object.keys(priorityConfig) as Priority[]).map((k) => ({ value: k, label: priorityConfig[k].label }));
    case "relatedToType":
      return Object.entries(relatedTypeLabels).map(([k, v]) => ({ value: k, label: v }));
    case "owner": {
      const unique = Array.from(new Set(items.map((t) => t.owner).filter(Boolean)));
      return unique.sort().map((o) => ({ value: o, label: o }));
    }
    default:
      return [];
  }
}

function applyApptFilters(items: Appointment[], filters: ApptFilterCondition[]): Appointment[] {
  if (filters.length === 0) return items;
  return items.filter((a) => {
    for (const fc of filters) {
      if (fc.values.length === 0) continue;
      switch (fc.field) {
        case "priority":
          if (!fc.values.includes(a.priority)) return false;
          break;
        case "relatedToType":
          if (!fc.values.includes(a.relatedToType)) return false;
          break;
        case "owner":
          if (!fc.values.includes(a.owner)) return false;
          break;
      }
    }
    return true;
  });
}

function apptFilterConditionLabel(fc: ApptFilterCondition): string {
  const fieldDef = APPT_FILTER_FIELDS.find((f) => f.key === fc.field);
  const prefix = fieldDef?.label ?? fc.field;
  if (fc.values.length === 0) return prefix;
  if (fc.values.length === 1) {
    if (fc.field === "priority") return `${prefix}: ${priorityConfig[fc.values[0] as Priority]?.label ?? fc.values[0]}`;
    if (fc.field === "relatedToType") return `${prefix}: ${relatedTypeLabels[fc.values[0]] ?? fc.values[0]}`;
    return `${prefix}: ${fc.values[0]}`;
  }
  return `${prefix}: ${fc.values.length} selecionados`;
}

/* ------------------------------------------------------------------ */
/*  ApptFilterDropdownPill                                             */
/* ------------------------------------------------------------------ */

function ApptFilterDropdownPill({
  fieldDef,
  condition,
  onChange,
  items,
}: {
  fieldDef: { key: ApptFilterField; label: string; icon: React.ComponentType<any> };
  condition: ApptFilterCondition | undefined;
  onChange: (fc: ApptFilterCondition) => void;
  items: Appointment[];
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
            {getApptFilterOptions(f, items).map((opt) => {
              const checked = condition?.values?.includes(opt.value) ?? false;
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleValue(opt.value)}
                  className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[12px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left w-full"
                >
                  <div className={`size-[14px] rounded-[4px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "border-[#23E6B2] bg-[#23E6B2]" : "border-[#98989d] bg-transparent"
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
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_DEFAULTS = { timezone: "GMT-3 Sao Paulo", recurrence: "", reminder: "10 minutos antes", busyStatus: "Ocupado", visibility: "Visibilidade padrao", calendarName: "Atividades" };

function generateMockAppointments(): Appointment[] {
  const d = MOCK_DEFAULTS;
  return [
    { id: "AP-A1B2", subject: "Daily Standup", description: "Reuniao diaria da equipe", status: "agendado", priority: "normal", startDate: "2026-02-25T08:00:00", endDate: "2026-02-25T08:30:00", allDay: false, location: "Google Meet", relatedToType: "conta", relatedToId: "AC-0EA1", relatedToName: "Empresa Alpha", contactName: "Ana Carolina", owner: "Joao Silva", meetLink: "https://meet.google.com/abc-defg-hij", googleEventId: "evt_abc123", createdAt: "2026-02-20", updatedAt: "2026-02-20", timezone: d.timezone, recurrence: "Todos os dias da semana", attendees: [{ name: "Joao Silva", email: "joao@htz.agency", organizer: true, rsvp: "sim" }, { name: "Ana Carolina", email: "ana@empresa.com", rsvp: "sim" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-C3D4", subject: "Apresentacao Projeto Alpha", description: "Demo do produto para o cliente", status: "confirmado", priority: "alta", startDate: "2026-02-25T10:00:00", endDate: "2026-02-25T11:00:00", allDay: false, location: "Sala de Reunioes 1", relatedToType: "oportunidade", relatedToId: "OP-A1B2", relatedToName: "Projeto Alpha", contactName: "Bruno Mendes", owner: "Maria Oliveira", meetLink: "", googleEventId: "", createdAt: "2026-02-18", updatedAt: "2026-02-22", timezone: d.timezone, recurrence: "", attendees: [{ name: "Maria Oliveira", email: "maria@htz.agency", organizer: true, rsvp: "sim" }, { name: "Bruno Mendes", email: "bruno@alpha.com", rsvp: "talvez" }, { name: "Carlos Pereira", email: "carlos@htz.agency", rsvp: "pendente" }], reminder: "30 minutos antes", busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-E5F6", subject: "Alinhamento semanal", description: "Checkpoint semanal com diretoria", status: "agendado", priority: "normal", startDate: "2026-02-25T14:00:00", endDate: "2026-02-25T15:00:00", allDay: false, location: "Zoom", relatedToType: "conta", relatedToId: "AC-J9K1", relatedToName: "Epsilon Ltda", contactName: "", owner: "Lucas Souza", meetLink: "", googleEventId: "", createdAt: "2026-02-15", updatedAt: "2026-02-20", timezone: d.timezone, recurrence: "Toda semana na quarta", attendees: [{ name: "Lucas Souza", email: "lucas@htz.agency", organizer: true, rsvp: "sim" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-G7H8", subject: "Call com fornecedor", description: "", status: "concluido", priority: "baixa", startDate: "2026-02-24T09:00:00", endDate: "2026-02-24T09:30:00", allDay: false, location: "Telefone", relatedToType: "conta", relatedToId: "AC-L2M3", relatedToName: "Zeta Inc", contactName: "Kleber Oliveira", owner: "Pedro Costa", meetLink: "", googleEventId: "", createdAt: "2026-02-10", updatedAt: "2026-02-24", timezone: d.timezone, recurrence: "", attendees: [{ name: "Pedro Costa", email: "pedro@htz.agency", organizer: true, rsvp: "sim" }, { name: "Kleber Oliveira", email: "kleber@zeta.com", rsvp: "sim" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-J1K2", subject: "Revisao de contrato", description: "Revisar clausulas do contrato Delta", status: "agendado", priority: "alta", startDate: "2026-02-26T10:00:00", endDate: "2026-02-26T11:30:00", allDay: false, location: "Escritorio", relatedToType: "oportunidade", relatedToId: "OP-G7H8", relatedToName: "Renovacao Delta", contactName: "Helena Rocha", owner: "Rafaela Costa", meetLink: "", googleEventId: "", createdAt: "2026-02-19", updatedAt: "2026-02-23", timezone: d.timezone, recurrence: "", attendees: [{ name: "Rafaela Costa", email: "rafaela@htz.agency", organizer: true, rsvp: "sim" }, { name: "Helena Rocha", email: "helena@delta.com", rsvp: "nao" }], reminder: "1 hora antes", busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-L3M4", subject: "Workshop de produto", description: "Sessao de treinamento para novos features", status: "confirmado", priority: "normal", startDate: "2026-02-26T14:00:00", endDate: "2026-02-26T16:00:00", allDay: false, location: "Sala de Treinamento", relatedToType: "conta", relatedToId: "AC-0EA1", relatedToName: "Empresa Alpha", contactName: "Daniela Souza", owner: "Juliana Ferreira", meetLink: "", googleEventId: "", createdAt: "2026-02-21", updatedAt: "2026-02-21", timezone: d.timezone, recurrence: "", attendees: [{ name: "Juliana Ferreira", email: "juliana@htz.agency", organizer: true, rsvp: "sim" }, { name: "Daniela Souza", email: "daniela@alpha.com", rsvp: "sim" }, { name: "Lucas Souza", email: "lucas@htz.agency", rsvp: "talvez" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-N5O6", subject: "Retro Sprint 14", description: "Retrospectiva da sprint", status: "agendado", priority: "normal", startDate: "2026-02-27T16:00:00", endDate: "2026-02-27T17:00:00", allDay: false, location: "Google Meet", relatedToType: "conta", relatedToId: "AC-0EA1", relatedToName: "Empresa Alpha", contactName: "", owner: "Fernanda Santos", meetLink: "https://meet.google.com/klm-nopq-rst", googleEventId: "evt_klm456", createdAt: "2026-02-17", updatedAt: "2026-02-24", timezone: d.timezone, recurrence: "A cada 2 semanas na sexta", attendees: [{ name: "Fernanda Santos", email: "fernanda@htz.agency", organizer: true, rsvp: "sim" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-P7Q8", subject: "Onboarding novo cliente", description: "Primeiro contato pos-venda", status: "agendado", priority: "alta", startDate: "2026-02-27T09:00:00", endDate: "2026-02-27T10:00:00", allDay: false, location: "Zoom", relatedToType: "contato", relatedToId: "CT-Q6R7", relatedToName: "Helena Rocha", contactName: "Helena Rocha", owner: "Carlos Pereira", meetLink: "", googleEventId: "", createdAt: "2026-02-23", updatedAt: "2026-02-23", timezone: d.timezone, recurrence: "", attendees: [{ name: "Carlos Pereira", email: "carlos@htz.agency", organizer: true, rsvp: "sim" }, { name: "Helena Rocha", email: "helena@delta.com", rsvp: "pendente" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-R9S1", subject: "Planejamento mensal", description: "Definir metas de marco", status: "agendado", priority: "normal", startDate: "2026-02-28T10:00:00", endDate: "2026-02-28T11:30:00", allDay: false, location: "Sala de Reunioes 2", relatedToType: "conta", relatedToId: "AC-J9K1", relatedToName: "Epsilon Ltda", contactName: "Larissa Campos", owner: "Joao Silva", meetLink: "", googleEventId: "", createdAt: "2026-02-14", updatedAt: "2026-02-25", timezone: d.timezone, recurrence: "Todo mes no ultimo dia util", attendees: [{ name: "Joao Silva", email: "joao@htz.agency", organizer: true, rsvp: "sim" }, { name: "Larissa Campos", email: "larissa@epsilon.com", rsvp: "sim" }, { name: "Maria Oliveira", email: "maria@htz.agency", rsvp: "sim" }], reminder: "1 dia antes", busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-T2U3", subject: "Demo para lead", description: "Demonstracao do produto", status: "cancelado", priority: "normal", startDate: "2026-02-24T15:00:00", endDate: "2026-02-24T16:00:00", allDay: false, location: "Google Meet", relatedToType: "lead", relatedToId: "LD-E5F6", relatedToName: "Carlos Eduardo", contactName: "Carlos Eduardo", owner: "Ana Paula", meetLink: "", googleEventId: "", createdAt: "2026-02-12", updatedAt: "2026-02-23", timezone: d.timezone, recurrence: "", attendees: [{ name: "Ana Paula", email: "ana.paula@htz.agency", organizer: true, rsvp: "sim" }, { name: "Carlos Eduardo", email: "carlos.edu@email.com", rsvp: "pendente" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-V4W5", subject: "Happy Hour equipe", description: "Confraternizacao mensal", status: "confirmado", priority: "baixa", startDate: "2026-02-28T18:00:00", endDate: "2026-02-28T20:00:00", allDay: false, location: "Bar do Joao", relatedToType: "conta", relatedToId: "AC-0EA1", relatedToName: "Empresa Alpha", contactName: "", owner: "Lucas Souza", meetLink: "", googleEventId: "", createdAt: "2026-02-20", updatedAt: "2026-02-25", timezone: d.timezone, recurrence: "", attendees: [{ name: "Lucas Souza", email: "lucas@htz.agency", organizer: true, rsvp: "sim" }, { name: "Joao Silva", email: "joao@htz.agency", rsvp: "sim" }, { name: "Maria Oliveira", email: "maria@htz.agency", rsvp: "talvez" }, { name: "Pedro Costa", email: "pedro@htz.agency", rsvp: "sim" }], reminder: d.reminder, busyStatus: "Livre", visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-X6Y7", subject: "Entrevista candidato dev", description: "Entrevista tecnica", status: "agendado", priority: "alta", startDate: "2026-02-25T15:30:00", endDate: "2026-02-25T16:30:00", allDay: false, location: "Zoom", relatedToType: "conta", relatedToId: "AC-0EA1", relatedToName: "Empresa Alpha", contactName: "", owner: "Maria Oliveira", meetLink: "", googleEventId: "", createdAt: "2026-02-22", updatedAt: "2026-02-24", timezone: d.timezone, recurrence: "", attendees: [{ name: "Maria Oliveira", email: "maria@htz.agency", organizer: true, rsvp: "sim" }], reminder: "15 minutos antes", busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
    { id: "AP-Z8A9", subject: "Sync marketing + vendas", description: "Alinhamento campanhas Q1", status: "agendado", priority: "normal", startDate: "2026-02-26T08:30:00", endDate: "2026-02-26T09:30:00", allDay: false, location: "Sala de Reunioes 1", relatedToType: "conta", relatedToId: "AC-L2M3", relatedToName: "Zeta Inc", contactName: "", owner: "Joao Silva", meetLink: "", googleEventId: "", createdAt: "2026-02-21", updatedAt: "2026-02-25", timezone: d.timezone, recurrence: "", attendees: [{ name: "Joao Silva", email: "joao@htz.agency", organizer: true, rsvp: "sim" }, { name: "Ana Paula", email: "ana.paula@htz.agency", rsvp: "pendente" }], reminder: d.reminder, busyStatus: d.busyStatus, visibility: d.visibility, calendarName: d.calendarName },
  ];
}

const mockAppointments = generateMockAppointments();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dbActivityToAppointment(row: DbActivity): Appointment | null {
  if ((row.type || "") !== "compromisso") return null;
  return {
    id: row.id,
    subject: row.subject || row.label || "",
    description: row.description || "",
    status: (row.status || "agendado") as AppointmentStatus,
    priority: (row.priority || "normal") as Priority,
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    allDay: row.all_day || false,
    location: row.location || "",
    relatedToType: row.related_to_type || "",
    relatedToId: row.related_to_id || "",
    relatedToName: row.related_to_name || "",
    contactName: row.contact_name || "",
    owner: row.owner || "",
    meetLink: (row as any).meet_link || "",
    googleEventId: (row as any).google_event_id || "",
    createdAt: row.created_at ? row.created_at.slice(0, 10) : "",
    updatedAt: row.updated_at ? row.updated_at.slice(0, 10) : "",
    timezone: (row as any).timezone || "GMT-3 Sao Paulo",
    recurrence: (row as any).recurrence || "",
    attendees: (row as any).attendees || [],
    reminder: (row as any).reminder || "10 minutos antes",
    busyStatus: (row as any).busy_status || "Ocupado",
    visibility: (row as any).visibility || "Visibilidade padrao",
    calendarName: (row as any).calendar_name || "Atividades",
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

function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function formatDateRange(start: string, end: string): string {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s} - ${e}`;
  if (s) return s;
  return "";
}

function formatDuration(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const diffMin = Math.round((e.getTime() - s.getTime()) / 60000);
    if (diffMin < 60) return `${diffMin}min`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `${h}h${m}min` : `${h}hora${h > 1 ? "s" : ""}`;
  } catch { return ""; }
}

const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatShortDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
  } catch { return ""; }
}

function formatTimeShort(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    if (m === 0) return `${h} AM`.replace(/^(\d+) AM$/, (_, hh) => Number(hh) >= 12 ? `${Number(hh) === 12 ? 12 : Number(hh) - 12} PM` : `${hh} AM`);
    return `${h}:${String(m).padStart(2, "0")}`;
  } catch { return ""; }
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const RSVP_COLORS: Record<string, { bg: string; text: string }> = {
  sim: { bg: "#D9F8EF", text: "#135543" },
  nao: { bg: "#FFEDEB", text: "#782500" },
  talvez: { bg: "#FEEDCA", text: "#42350A" },
  pendente: { bg: "#F6F7F9", text: "#98989d" },
};

/* ------------------------------------------------------------------ */
/*  Calendar Helpers                                                   */
/* ------------------------------------------------------------------ */

const DAYS_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const MONTHS_PT = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 to 20:00

/* ------------------------------------------------------------------ */
/*  Table Config                                                       */
/* ------------------------------------------------------------------ */

const ROWS_PER_PAGE = 16;
const FIXED_LEFT = "28px 24px";
const INITIAL_COL_WIDTHS = [240, 120, 120, 100, 140, 140, 130];
const MIN_COL_WIDTH = 50;

const COL_HEADERS: string[] = [
  "ASSUNTO",
  "STATUS",
  "DATA/HORA",
  "PRIORIDADE",
  "LOCAL",
  "PROPRIETARIO",
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
          checked ? "border-[#3ccea7] bg-[#3ccea7]" : "border-[#28415c] bg-transparent"
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
/*  Appointment Detail Panel                                           */
/* ------------------------------------------------------------------ */

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

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b0da2601`;

function AppointmentDetailPanel({
  appt,
  onClose,
  onStatusChange,
  onMeetLinkUpdate,
  onUpdate,
}: {
  appt: Appointment;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: AppointmentStatus) => void;
  onMeetLinkUpdate?: (id: string, meetLink: string, googleEventId: string) => void;
  onUpdate?: (id: string, patch: Partial<Appointment>) => void;
}) {
  const [meetLoading, setMeetLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localMeetLink, setLocalMeetLink] = useState(appt.meetLink || "");
  const [systemOpen, setSystemOpen] = useState(false);

  /* ── Editable local state ── */
  const [eSubject, setESubject] = useState(appt.subject);
  const [eDescription, setEDescription] = useState(appt.description || "");
  const [eStartDate, setEStartDate] = useState(appt.startDate);
  const [eEndDate, setEEndDate] = useState(appt.endDate);
  const [eLocation, setELocation] = useState(appt.location || "");
  const [ePriority, setEPriority] = useState<Priority>(appt.priority);
  const [eAllDay, setEAllDay] = useState(appt.allDay);
  const [eStatus, setEStatus] = useState<AppointmentStatus>(appt.status);

  // Re-sync editable state when switching appointments
  useEffect(() => {
    setESubject(appt.subject);
    setEDescription(appt.description || "");
    setEStartDate(appt.startDate);
    setEEndDate(appt.endDate);
    setELocation(appt.location || "");
    setEPriority(appt.priority);
    setEAllDay(appt.allDay);
    setEStatus(appt.status);
    setIsEditing(false);
  }, [appt.id]);

  // Derived configs — use local values when editing
  const activePriority = isEditing ? ePriority : appt.priority;
  const activeStatus = isEditing ? eStatus : appt.status;
  const statusConf = statusConfig[activeStatus] || statusConfig.agendado;
  const priorityConf = priorityConfig[activePriority] || priorityConfig.normal;
  const PriorityIcon = priorityConf.icon;
  const StatusIcon = statusConf.icon;

  // Load real data for pickers (contacts, accounts, opportunities)
  const [contactsPool, setContactsPool] = useState(CONTACTS_POOL);
  const [accountsPool, setAccountsPool] = useState(ACCOUNTS_POOL);
  const [opportunitiesPool, setOpportunitiesPool] = useState(OPPORTUNITIES_POOL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dbContacts, dbAccounts, dbOpportunities] = await Promise.all([
          listContacts().catch(() => []),
          listAccounts().catch(() => []),
          listOpportunities().catch(() => []),
        ]);
        if (cancelled) return;
        if (dbContacts.length > 0) {
          setContactsPool(dbContacts.map((c: any) => ({
            name: [c.name, c.last_name].filter(Boolean).join(" ") || c.email || "",
            email: c.email || "",
          })));
        }
        if (dbAccounts.length > 0) {
          setAccountsPool(dbAccounts.map((a: any) => ({
            id: a.id,
            name: a.name || "",
          })));
        }
        if (dbOpportunities.length > 0) {
          setOpportunitiesPool(dbOpportunities.map((o: any) => ({
            id: o.id,
            name: o.name || "",
            accountId: o.account || undefined,
          })));
        }
      } catch { /* keep fallback pools */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Attendee picker state
  const [localAttendees, setLocalAttendees] = useState(appt.attendees || []);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeDropdownOpen, setAttendeeDropdownOpen] = useState(false);
  const attendeeInputRef = useRef<HTMLInputElement>(null);
  const attendeeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalAttendees(appt.attendees || []);
  }, [appt.id]);

  /* ── RSVP cycle helper ── */
  const RSVP_CYCLE: Array<"pendente" | "sim" | "talvez" | "nao"> = ["pendente", "sim", "talvez", "nao"];
  const cycleRsvp = useCallback((email: string) => {
    setLocalAttendees((prev) =>
      prev.map((a) => {
        if (a.email !== email || a.organizer) return a;
        const idx = RSVP_CYCLE.indexOf((a.rsvp as any) || "pendente");
        return { ...a, rsvp: RSVP_CYCLE[(idx + 1) % RSVP_CYCLE.length] };
      })
    );
  }, []);

  /* ── Cancel editing: revert all local state ── */
  const cancelEditing = useCallback(() => {
    setESubject(appt.subject);
    setEDescription(appt.description || "");
    setEStartDate(appt.startDate);
    setEEndDate(appt.endDate);
    setELocation(appt.location || "");
    setEPriority(appt.priority);
    setEAllDay(appt.allDay);
    setEStatus(appt.status);
    setLocalAttendees(appt.attendees || []);
    setIsEditing(false);
  }, [appt]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attendeeDropdownRef.current && !attendeeDropdownRef.current.contains(e.target as Node)) {
        setAttendeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredContacts = useMemo(() => {
    const existing = new Set(localAttendees.map((a) => a.email.toLowerCase()));
    const q = attendeeSearch.toLowerCase().trim();
    return contactsPool.filter(
      (c) => !existing.has(c.email.toLowerCase()) && (q === "" || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    );
  }, [attendeeSearch, localAttendees, contactsPool]);

  const addAttendee = useCallback((contact: { name: string; email: string }) => {
    setLocalAttendees((prev) => [...prev, { name: contact.name, email: contact.email, rsvp: "pendente" as const }]);
    setAttendeeSearch("");
    setAttendeeDropdownOpen(false);
    attendeeInputRef.current?.focus();
  }, []);

  const removeAttendee = useCallback((email: string) => {
    setLocalAttendees((prev) => prev.filter((a) => a.email !== email));
  }, []);

  // Linked account & opportunity state
  const [linkedAccount, setLinkedAccount] = useState<{ id: string; name: string } | null>(
    appt.relatedToType === "conta" ? { id: appt.relatedToId, name: appt.relatedToName } : null
  );
  const [linkedOpportunity, setLinkedOpportunity] = useState<{ id: string; name: string } | null>(
    appt.relatedToType === "oportunidade" ? { id: appt.relatedToId, name: appt.relatedToName } : null
  );
  const [acctDropdownOpen, setAcctDropdownOpen] = useState(false);
  const [opptyDropdownOpen, setOpptyDropdownOpen] = useState(false);
  const [acctSearch, setAcctSearch] = useState("");
  const [opptySearch, setOpptySearch] = useState("");
  const acctDropdownRef = useRef<HTMLDivElement>(null);
  const opptyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (appt.relatedToType === "conta") {
      setLinkedAccount({ id: appt.relatedToId, name: appt.relatedToName });
    }
    if (appt.relatedToType === "oportunidade") {
      setLinkedOpportunity({ id: appt.relatedToId, name: appt.relatedToName });
    }
  }, [appt.id]);

  // Close account/opportunity dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acctDropdownRef.current && !acctDropdownRef.current.contains(e.target as Node)) setAcctDropdownOpen(false);
      if (opptyDropdownRef.current && !opptyDropdownRef.current.contains(e.target as Node)) setOpptyDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredAccounts = useMemo(() => {
    const q = acctSearch.toLowerCase().trim();
    return accountsPool.filter((a) => q === "" || a.name.toLowerCase().includes(q));
  }, [acctSearch, accountsPool]);

  const filteredOpportunities = useMemo(() => {
    const q = opptySearch.toLowerCase().trim();
    return opportunitiesPool.filter((o) => {
      const matchesSearch = q === "" || o.name.toLowerCase().includes(q);
      // If an account is linked, only show opportunities for that account
      const matchesAccount = !linkedAccount || !o.accountId || o.accountId === linkedAccount.id;
      return matchesSearch && matchesAccount;
    });
  }, [opptySearch, opportunitiesPool, linkedAccount]);

  useEffect(() => {
    setLocalMeetLink(appt.meetLink || "");
  }, [appt.id, appt.meetLink]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleGenerateMeet = useCallback(async () => {
    if (meetLoading) return;
    setMeetLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE}/google-calendar/create-meet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          subject: appt.subject,
          description: appt.description,
          startDate: appt.startDate,
          endDate: appt.endDate,
          allDay: appt.allDay,
          attendees: localAttendees.map((a) => a.email).filter(Boolean),
          userEmail: localAttendees.find((a) => a.email?.endsWith("@htz.agency"))?.email || "hends@htz.agency",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        console.log("Error generating Meet link:", json);
        toast.error(json.error || "Erro ao gerar link do Meet");
        return;
      }

      const link = json.data?.meetLink || "";
      const eventId = json.data?.eventId || "";
      setLocalMeetLink(link);
      onMeetLinkUpdate?.(appt.id, link, eventId);
      toast.success("Link do Google Meet gerado!");
    } catch (err) {
      console.log("Unexpected error generating Meet link:", err);
      toast.error("Erro inesperado ao gerar link do Meet");
    } finally {
      setMeetLoading(false);
    }
  }, [appt, meetLoading, onMeetLinkUpdate, localAttendees]);

  /* ─── small inline row (icon + content, no label — Google Calendar style) ─── */
  const InlineRow = ({ icon: Icon, children, className: cx }: { icon: React.ComponentType<any>; children: React.ReactNode; className?: string }) => (
    <div className={`flex items-start gap-[10px] py-[8px] ${cx || ""}`}>
      <div className="flex items-center justify-center w-[22px] h-[22px] shrink-0 mt-[1px] text-[#4E6987]">
        <Icon size={16} weight="duotone" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

  const meetCode = localMeetLink ? localMeetLink.replace(/^https?:\/\/meet\.google\.com\//, "") : "";

  return (
    <div className="h-full flex flex-col bg-white rounded-[15px] overflow-hidden">
      {/* ─── Header ─── */}
      <div className="shrink-0 px-[20px] pt-[14px] pb-[10px]">
        <div className="flex justify-end mb-[4px]">
          <ActionPill>
            <ActionButton onClick={() => setIsEditing(true)}>
              <PencilSimple size={18} weight="bold" />
            </ActionButton>
            <ActionButton onClick={onClose}>
              <X size={18} weight="bold" />
            </ActionButton>
          </ActionPill>
        </div>
        {/* Event type + name */}
        <p className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}>Evento</p>
        {isEditing ? (
          <input
            value={eSubject}
            onChange={(e) => setESubject(e.target.value)}
            className="w-full text-[#28415c] mt-[2px] bg-transparent border-b border-[#07ABDE] outline-none"
            style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
            placeholder="Assunto do compromisso"
          />
        ) : (
          <p className="text-[#28415c] mt-[2px]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>{appt.subject}</p>
        )}
        {isEditing ? (
          <textarea
            value={eDescription}
            onChange={(e) => setEDescription(e.target.value)}
            rows={2}
            className="w-full text-[#4E6987] mt-[4px] bg-[#f6f7f9] rounded-[8px] px-[10px] py-[6px] outline-none border border-transparent focus:border-[#07ABDE] resize-none"
            style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}
            placeholder="Descricao (opcional)"
          />
        ) : appt.description ? (
          <p className="text-[#4E6987] mt-[4px]" style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>{appt.description}</p>
        ) : null}
        {/* Status / Priority pills */}
        <div className="flex items-center gap-[6px] mt-[10px]">
          {isEditing ? (
            <select
              value={eStatus}
              onChange={(e) => setEStatus(e.target.value as AppointmentStatus)}
              className="h-[24px] px-[8px] rounded-[500px] border-none outline-none cursor-pointer uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: statusConf.color, backgroundColor: statusConf.bg, ...fontFeature }}
            >
              {STATUS_KEYS.map((s) => (
                <option key={s} value={s}>{statusConfig[s].label}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-[4px] h-[24px] px-[10px] rounded-[500px]" style={{ backgroundColor: statusConf.bg }}>
              <StatusIcon size={10} weight="fill" style={{ color: statusConf.color }} />
              <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: statusConf.color, ...fontFeature }}>{statusConf.label}</span>
            </div>
          )}
          {isEditing ? (
            <select
              value={ePriority}
              onChange={(e) => setEPriority(e.target.value as Priority)}
              className="h-[24px] px-[8px] rounded-[500px] bg-[#f6f7f9] border-none outline-none cursor-pointer uppercase"
              style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: priorityConf.color, ...fontFeature }}
            >
              {(Object.keys(priorityConfig) as Priority[]).map((k) => (
                <option key={k} value={k}>{priorityConfig[k].label}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-[#f6f7f9]">
              <PriorityIcon size={10} weight="bold" style={{ color: priorityConf.color }} />
              <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: priorityConf.color, ...fontFeature }}>{priorityConf.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Scrollable content ─── */}
      <div className="flex-1 overflow-y-auto">
        {/* ─── SECTION: Time ─── */}
        <div className="px-[20px]">
          <div className="h-[1px] bg-[#f0f2f5]" />
          {isEditing ? (
            <div className="py-[8px] flex flex-col gap-[6px]">
              <div className="flex items-center gap-[6px]">
                <Clock size={16} weight="duotone" className="text-[#4E6987] shrink-0" />
                <label className="flex items-center gap-[6px] cursor-pointer select-none">
                  <input type="checkbox" checked={eAllDay} onChange={(e) => setEAllDay(e.target.checked)} className="accent-[#07ABDE]" />
                  <span className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 600, ...fontFeature }}>Dia inteiro</span>
                </label>
              </div>
              <div className="flex items-center gap-[6px] pl-[22px]">
                <input
                  type={eAllDay ? "date" : "datetime-local"}
                  value={eStartDate ? (eAllDay ? eStartDate.slice(0, 10) : eStartDate.slice(0, 16)) : ""}
                  onChange={(e) => setEStartDate(e.target.value)}
                  className="flex-1 min-w-0 h-[32px] px-[8px] rounded-[8px] bg-[#f6f7f9] border border-transparent focus:border-[#07ABDE] outline-none text-[#28415c]"
                  style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}
                />
                {!eAllDay && (
                  <>
                    <ArrowRight size={12} weight="bold" className="text-[#98989d] shrink-0" />
                    <input
                      type="datetime-local"
                      value={eEndDate ? eEndDate.slice(0, 16) : ""}
                      onChange={(e) => setEEndDate(e.target.value)}
                      className="flex-1 min-w-0 h-[32px] px-[8px] rounded-[8px] bg-[#f6f7f9] border border-transparent focus:border-[#07ABDE] outline-none text-[#28415c]"
                      style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <InlineRow icon={Clock}>
              <div className="flex flex-col gap-[2px]">
                {!appt.allDay ? (
                  <>
                    <div className="flex items-center gap-[8px]">
                      <span className="text-[#28415c]" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{formatTime(appt.startDate)}</span>
                      <ArrowRight size={12} weight="bold" className="text-[#98989d]" />
                      <span className="text-[#28415c]" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{formatTime(appt.endDate)}</span>
                      <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>{formatDuration(appt.startDate, appt.endDate)}</span>
                    </div>
                    <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatShortDate(appt.startDate)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#28415c]" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>Dia inteiro</span>
                    <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatShortDate(appt.startDate)}</span>
                  </>
                )}
              </div>
            </InlineRow>
          )}
        </div>

        {/* ─── SECTION: Timezone ─── */}
        {appt.timezone && (
          <div className="px-[20px]">
            <div className="h-[1px] bg-[#f0f2f5]" />
            <InlineRow icon={GlobeHemisphereWest}>
              <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{appt.timezone}</span>
            </InlineRow>
          </div>
        )}

        {/* ─── SECTION: Recurrence ─── */}
        {appt.recurrence && (
          <div className="px-[20px]">
            <div className="h-[1px] bg-[#f0f2f5]" />
            <InlineRow icon={ArrowsClockwise}>
              <span className="text-[#4E6987] truncate" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{appt.recurrence}</span>
            </InlineRow>
          </div>
        )}

        {/* ─── SECTION: Location ─── */}
        {(appt.location || isEditing) && (
          <div className="px-[20px]">
            <div className="h-[1px] bg-[#f0f2f5]" />
            {isEditing ? (
              <div className="flex items-center gap-[10px] py-[8px]">
                <MapPin size={16} weight="duotone" className="text-[#4E6987] shrink-0" />
                <input
                  value={eLocation}
                  onChange={(e) => setELocation(e.target.value)}
                  placeholder="Local do evento"
                  className="flex-1 h-[32px] px-[8px] rounded-[8px] bg-[#f6f7f9] border border-transparent focus:border-[#07ABDE] outline-none text-[#28415c] placeholder-[#C8CFDB]"
                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                />
              </div>
            ) : (
              <InlineRow icon={MapPin}>
                <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{appt.location}</span>
              </InlineRow>
            )}
          </div>
        )}

        {/* ─── SECTION: Participants (interactive contact field) ─── */}
        <div className="px-[20px]">
          <div className="h-[1px] bg-[#f0f2f5]" />
          <div className="py-[10px]">
            {/* Attendee list */}
            {localAttendees.length > 0 && (
              <div className="flex flex-col gap-[6px] mb-[8px]">
                {localAttendees.map((att, i) => (
                  <div key={att.email + i} className="flex items-center gap-[10px] group/att">
                    {/* avatar */}
                    <div
                      className="flex items-center justify-center size-[28px] rounded-full shrink-0"
                      style={{ backgroundColor: att.organizer ? "#DCF0FF" : "#f6f7f9" }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: att.organizer ? "#07ABDE" : "#4E6987", ...fontFeature }}>{getInitials(att.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[#28415c] block truncate" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{att.name}</span>
                      <span className="text-[#98989d] block truncate" style={{ fontSize: 10, letterSpacing: -0.2, ...fontFeature }}>{att.email}</span>
                      {att.organizer && (
                        <span className="text-[#3CCEA7]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>Organizador</span>
                      )}
                    </div>
                    {/* RSVP indicator — clickable to cycle */}
                    {!att.organizer && (
                      <button
                        onClick={() => cycleRsvp(att.email)}
                        title="Clique para alterar RSVP"
                        className="flex items-center h-[20px] px-[8px] rounded-full cursor-pointer hover:ring-1 hover:ring-[#07ABDE]/30 transition-all shrink-0"
                        style={{ backgroundColor: RSVP_COLORS[att.rsvp || "pendente"]?.bg || "#f6f7f9" }}
                      >
                        <span className="uppercase select-none" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, color: RSVP_COLORS[att.rsvp || "pendente"]?.text || "#98989d", ...fontFeature }}>
                          {att.rsvp === "sim" ? "Sim" : att.rsvp === "nao" ? "Nao" : att.rsvp === "talvez" ? "Talvez" : "Pendente"}
                        </span>
                      </button>
                    )}
                    {/* Remove button (not for organizer) */}
                    {!att.organizer && (
                      <button
                        onClick={() => removeAttendee(att.email)}
                        className="opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center size-[20px] rounded-full hover:bg-[#FFEDEB]"
                      >
                        <X size={10} weight="bold" color="#B13B00" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Contact search input */}
            <div className="relative" ref={attendeeDropdownRef}>
              <div
                className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] border border-transparent hover:border-[#e0e3e8] focus-within:border-[#07ABDE] transition-colors cursor-text"
                style={{ backgroundColor: "#f6f7f9" }}
                onClick={() => attendeeInputRef.current?.focus()}
              >
                <MagnifyingGlass size={14} color="#98989d" />
                <input
                  ref={attendeeInputRef}
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => {
                    setAttendeeSearch(e.target.value);
                    setAttendeeDropdownOpen(true);
                  }}
                  onFocus={() => setAttendeeDropdownOpen(true)}
                  placeholder="Adicionar participante..."
                  className="flex-1 bg-transparent outline-none text-[#28415c] placeholder-[#C8CFDB]"
                  style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                />
                <Plus size={14} color="#07ABDE" weight="bold" />
              </div>

              {/* Dropdown suggestions */}
              <AnimatePresence>
                {attendeeDropdownOpen && filteredContacts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-[38px] z-50 bg-white rounded-[10px] border border-[#e0e3e8] shadow-lg max-h-[180px] overflow-y-auto"
                  >
                    {filteredContacts.map((c, idx) => (
                      <button
                        key={`${c.email}-${idx}`}
                        onClick={() => addAttendee(c)}
                        className="flex items-center gap-[10px] w-full px-[10px] py-[7px] hover:bg-[#F6F7F9] transition-colors text-left"
                      >
                        <div className="flex items-center justify-center size-[24px] rounded-full shrink-0 bg-[#f6f7f9]">
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#4E6987", ...fontFeature }}>{getInitials(c.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[#28415c] block truncate" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{c.name}</span>
                          <span className="text-[#98989d] block truncate" style={{ fontSize: 9, letterSpacing: -0.2, ...fontFeature }}>{c.email}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ─── SECTION: Google Meet (prominent) ─── */}
        <div className="px-[20px]">
          <div className="h-[1px] bg-[#f0f2f5]" />
          <div className="py-[10px]">
            {localMeetLink ? (
              <div className="flex flex-col gap-[8px]">
                {/* Big "Entrar no Google Meet" button */}
                <a
                  href={localMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-[6px] w-full h-[34px] rounded-[500px] bg-[#DCF0FF] text-[#0483AB] hover:bg-[#c5e5f7] transition-colors"
                >
                  <VideoCamera size={14} weight="duotone" />
                  <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>Entrar no Google Meet</span>
                </a>
                {/* Code row */}
                <div className="flex items-center gap-[8px]">
                  <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, ...fontFeature }}>Codigo</span>
                  <span className="text-[#28415c] font-mono" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>{meetCode}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(localMeetLink); toast.success("Link copiado!"); }}
                    className="shrink-0 flex items-center justify-center size-[22px] rounded-[6px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-[#4E6987] ml-auto"
                    title="Copiar link"
                  >
                    <Copy size={12} weight="bold" />
                  </button>
                </div>
                <div className="h-[1px] bg-[#f0f2f5]" />
                <div className="flex items-center gap-[8px]">
                  <VideoCamera size={14} weight="duotone" className="text-[#4E6987]" />
                  <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>Google Meet</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateMeet}
                disabled={meetLoading}
                className="flex items-center justify-center gap-[6px] w-full h-[40px] rounded-[500px] bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {meetLoading ? (
                  <Spinner size={14} weight="bold" className="animate-spin" />
                ) : (
                  <VideoCamera size={16} weight="duotone" />
                )}
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  {meetLoading ? "Gerando link..." : "Gerar link do Google Meet"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ─── SECTION: Related / Contact ─── */}
        <div className="px-[20px]">
          <div className="h-[1px] bg-[#f0f2f5]" />

          {/* ── Account Linking ── */}
          <div className="py-[6px]">
            <div className="flex items-center gap-[10px] min-h-[32px]" ref={acctDropdownRef}>
              <div className="flex items-center justify-center size-[20px] shrink-0">
                <Building size={16} weight="duotone" color="#98989d" />
              </div>
              <div className="flex-1 min-w-0 relative">
                {linkedAccount ? (
                  <div className="flex items-center gap-[6px] group/acct">
                    <span className="text-[#98989d] uppercase shrink-0" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>Conta</span>
                    <span className="text-[#07abde] truncate cursor-pointer hover:underline" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{linkedAccount.name}</span>
                    <button
                      onClick={() => { setLinkedAccount(null); setAcctSearch(""); }}
                      className="opacity-0 group-hover/acct:opacity-100 transition-opacity flex items-center justify-center size-[16px] rounded-full hover:bg-[#FFEDEB] shrink-0"
                    >
                      <X size={8} weight="bold" color="#B13B00" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={acctSearch}
                      onChange={(e) => { setAcctSearch(e.target.value); setAcctDropdownOpen(true); }}
                      onFocus={() => setAcctDropdownOpen(true)}
                      placeholder="Vincular conta..."
                      className="w-full bg-transparent outline-none text-[#28415c] placeholder-[#C8CFDB]"
                      style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                    />
                    <AnimatePresence>
                      {acctDropdownOpen && filteredAccounts.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-[28px] z-50 bg-white rounded-[10px] border border-[#e0e3e8] shadow-lg max-h-[160px] overflow-y-auto"
                        >
                          {filteredAccounts.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => { setLinkedAccount(a); setAcctDropdownOpen(false); setAcctSearch(""); }}
                              className="flex items-center gap-[8px] w-full px-[10px] py-[7px] hover:bg-[#F6F7F9] transition-colors text-left"
                            >
                              <Building size={14} weight="duotone" color="#4E6987" />
                              <span className="text-[#28415c] truncate" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{a.name}</span>
                              <span className="text-[#98989d] ml-auto shrink-0" style={{ fontSize: 9, ...fontFeature }}>{a.id}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-[#f0f2f5]" />

          {/* ── Opportunity Linking ── */}
          <div className="py-[6px]">
            <div className="flex items-center gap-[10px] min-h-[32px]" ref={opptyDropdownRef}>
              <div className="flex items-center justify-center size-[20px] shrink-0">
                <SketchLogo size={16} weight="duotone" color="#98989d" />
              </div>
              <div className="flex-1 min-w-0 relative">
                {linkedOpportunity ? (
                  <div className="flex items-center gap-[6px] group/oppty">
                    <span className="text-[#98989d] uppercase shrink-0" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>Oportunidade</span>
                    <span className="text-[#07abde] truncate cursor-pointer hover:underline" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{linkedOpportunity.name}</span>
                    <button
                      onClick={() => { setLinkedOpportunity(null); setOpptySearch(""); }}
                      className="opacity-0 group-hover/oppty:opacity-100 transition-opacity flex items-center justify-center size-[16px] rounded-full hover:bg-[#FFEDEB] shrink-0"
                    >
                      <X size={8} weight="bold" color="#B13B00" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={opptySearch}
                      onChange={(e) => { setOpptySearch(e.target.value); setOpptyDropdownOpen(true); }}
                      onFocus={() => setOpptyDropdownOpen(true)}
                      placeholder="Vincular oportunidade..."
                      className="w-full bg-transparent outline-none text-[#28415c] placeholder-[#C8CFDB]"
                      style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                    />
                    <AnimatePresence>
                      {opptyDropdownOpen && filteredOpportunities.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-[28px] z-50 bg-white rounded-[10px] border border-[#e0e3e8] shadow-lg max-h-[160px] overflow-y-auto"
                        >
                          {filteredOpportunities.map((o) => (
                            <button
                              key={o.id}
                              onClick={() => { setLinkedOpportunity(o); setOpptyDropdownOpen(false); setOpptySearch(""); }}
                              className="flex items-center gap-[8px] w-full px-[10px] py-[7px] hover:bg-[#F6F7F9] transition-colors text-left"
                            >
                              <SketchLogo size={14} weight="duotone" color="#4E6987" />
                              <span className="text-[#28415c] truncate" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{o.name}</span>
                              <span className="text-[#98989d] ml-auto shrink-0" style={{ fontSize: 9, ...fontFeature }}>{o.id}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          </div>

          {appt.contactName && (
            <>
              <div className="h-[1px] bg-[#f0f2f5]" />
              <InlineRow icon={User}>
                <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{appt.contactName}</span>
              </InlineRow>
            </>
          )}
        </div>

        {/* ─── SECTION: Calendar / Status / Visibility ─── */}
        <div className="px-[20px]">
          <div className="h-[1px] bg-[#f0f2f5]" />
          <InlineRow icon={CalendarDots}>
            <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
              <span className="inline-block size-[8px] rounded-full bg-[#3CCEA7] mr-[6px] align-middle" />
              {appt.calendarName || "Atividades"}
            </span>
          </InlineRow>
          <div className="flex items-center gap-[24px] pl-[32px] pb-[8px]">
            <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{appt.busyStatus || "Ocupado"}</span>
            <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{appt.visibility || "Visibilidade padrao"}</span>
          </div>
        </div>

        {/* ─── SECTION: Reminders ─── */}
        {appt.reminder && (
          <div className="px-[20px]">
            <div className="h-[1px] bg-[#f0f2f5]" />
            <InlineRow icon={Bell}>
              <div className="flex flex-col">
                <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, ...fontFeature }}>Lembretes</span>
                <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{appt.reminder}</span>
              </div>
            </InlineRow>
          </div>
        )}

        {/* ─── Collapsible: Campos do Sistema ─── */}
        <div className="px-[20px] pt-[8px] pb-[12px]">
          <div className="h-[1px] bg-[#f0f2f5] mb-[8px]" />
          <SectionToggle title="Campos do Sistema" expanded={systemOpen} onToggle={() => setSystemOpen((x) => !x)}>
            <div className="pl-[39px] pt-[6px] flex flex-col">
              <InlineRow icon={UserCircle}>
                <div className="flex flex-col">
                  <span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>Proprietario</span>
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{appt.owner || "\u2014"}</span>
                </div>
              </InlineRow>
              <div className="h-[1px] bg-[#f0f2f5]" />
              <InlineRow icon={Info}>
                <div className="flex flex-col">
                  <span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>ID do Registro</span>
                  <span className="text-[#98989d] font-mono" style={{ fontSize: 11, ...fontFeature }}>{appt.id}</span>
                </div>
              </InlineRow>
              <div className="h-[1px] bg-[#f0f2f5]" />
              <InlineRow icon={CalendarBlank}>
                <div className="flex flex-col">
                  <span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>Criado em</span>
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(appt.createdAt)}</span>
                </div>
              </InlineRow>
              <div className="h-[1px] bg-[#f0f2f5]" />
              <InlineRow icon={Clock}>
                <div className="flex flex-col">
                  <span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>Atualizado em</span>
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>{formatFullDate(appt.updatedAt)}</span>
                </div>
              </InlineRow>
              {appt.googleEventId && (
                <>
                  <div className="h-[1px] bg-[#f0f2f5]" />
                  <InlineRow icon={CalendarDots}>
                    <div className="flex flex-col">
                      <span className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>Google Event ID</span>
                      <span className="text-[#98989d] font-mono" style={{ fontSize: 11, ...fontFeature }}>{appt.googleEventId}</span>
                    </div>
                  </InlineRow>
                </>
              )}
            </div>
          </SectionToggle>
        </div>
      </div>

      {/* ─── Footer actions ─── */}
      <div className="shrink-0 px-[20px] py-[12px]">
        <div className="h-[1px] bg-[#DDE3EC] mb-[12px]" />
        <div className="flex items-center gap-[6px] flex-wrap">
          {isEditing ? (
            <>
              <button
                onClick={cancelEditing}
                className="flex items-center justify-center gap-[6px] h-[34px] px-[14px] rounded-[500px] bg-[#f6f7f9] text-[#4e6987] hover:bg-[#ebedf0] transition-colors cursor-pointer flex-1"
              >
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>Descartar</span>
              </button>
              <button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  const relType = linkedAccount ? "conta" : linkedOpportunity ? "oportunidade" : appt.relatedToType;
                  const relId = linkedAccount?.id || linkedOpportunity?.id || appt.relatedToId;
                  const relName = linkedAccount?.name || linkedOpportunity?.name || appt.relatedToName;
                  try {
                    await patchActivity(appt.id, {
                      subject: eSubject,
                      label: eSubject,
                      description: eDescription || undefined,
                      start_date: eStartDate,
                      end_date: eEndDate,
                      location: eLocation || undefined,
                      priority: ePriority,
                      status: eStatus,
                      all_day: eAllDay,
                      attendees: localAttendees,
                      entity_type: relType,
                      entity_id: relId,
                      related_to_type: relType,
                      related_to_id: relId,
                      related_to_name: relName,
                      meet_link: localMeetLink || undefined,
                    } as any);
                    // Propagate local edits to parent state
                    onUpdate?.(appt.id, {
                      subject: eSubject,
                      description: eDescription,
                      startDate: eStartDate,
                      endDate: eEndDate,
                      location: eLocation,
                      priority: ePriority,
                      status: eStatus,
                      allDay: eAllDay,
                      attendees: localAttendees,
                      relatedToType: relType,
                      relatedToId: relId,
                      relatedToName: relName,
                      meetLink: localMeetLink,
                    });
                    if (eStatus !== appt.status) {
                      onStatusChange(appt.id, eStatus);
                    }
                    toast.success("Compromisso salvo!");
                  } catch (err) {
                    console.error("Error saving appointment:", err);
                    toast.error("Erro ao salvar compromisso");
                  } finally {
                    setSaving(false);
                  }
                  setIsEditing(false);
                }}
                className="flex items-center justify-center gap-[6px] h-[34px] px-[14px] rounded-[500px] bg-[#FF8C76] text-white hover:bg-[#e5715b] transition-colors cursor-pointer disabled:opacity-50 flex-1"
              >
                {saving && <Spinner size={13} weight="bold" className="animate-spin" />}
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>{saving ? "Salvando..." : "Salvar"}</span>
              </button>
            </>
          ) : null}
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
  status: AppointmentStatus | "all";
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
          Todos
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
/*  Weekly Calendar View                                               */
/* ------------------------------------------------------------------ */

function WeeklyCalendar({
  appointments,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSelectAppt,
  selectedApptId,
}: {
  appointments: Appointment[];
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onSelectAppt: (id: string) => void;
  selectedApptId: string | null;
}) {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Group appointments by day
  const eventsByDay = useMemo(() => {
    const map = new Map<number, { appt: Appointment; colorIdx: number }[]>();
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      map.set(dayIdx, []);
    }

    let colorCounter = 0;
    appointments.forEach((appt) => {
      if (!appt.startDate) return;
      const start = new Date(appt.startDate);
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        if (isSameDay(start, weekDays[dayIdx])) {
          map.get(dayIdx)!.push({ appt, colorIdx: colorCounter });
          break;
        }
      }
      colorCounter++;
    });

    return map;
  }, [appointments, weekStart]);

  const HOUR_HEIGHT = 60; // px per hour
  const TIME_COL_WIDTH = 56;

  const getEventPosition = (appt: Appointment) => {
    const start = new Date(appt.startDate);
    const end = new Date(appt.endDate);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = Math.max(endMinutes - startMinutes, 30);
    const top = ((startMinutes - 7 * 60) / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    return { top, height: Math.max(height, 24) };
  };

  // Current time line position
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMinutes - 7 * 60) / 60) * HOUR_HEIGHT;
  const showNowLine = nowMinutes >= 7 * 60 && nowMinutes <= 20 * 60;
  const nowDayIdx = weekDays.findIndex((d) => isSameDay(d, now));

  // Month label
  const monthNames = new Set(weekDays.map((d) => MONTHS_PT[d.getMonth()]));
  const yearSet = new Set(weekDays.map((d) => d.getFullYear()));
  const monthLabel = Array.from(monthNames).join(" / ") + " de " + Array.from(yearSet).join("/");

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll to ~8am on mount
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 1 * HOUR_HEIGHT;
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-[16px] overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f2f5]">
        <div className="flex items-center gap-3">
          <button
            onClick={onToday}
            className="flex items-center h-[34px] px-[16px] rounded-[100px] bg-[#f6f7f9] text-[#0483AB] hover:bg-[#dcf0ff] hover:text-[#0483AB] transition-colors cursor-pointer"
          >
            <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
              Hoje
            </span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevWeek}
              className="flex items-center justify-center size-[30px] rounded-full hover:bg-[#f6f7f9] transition-colors cursor-pointer text-[#28415c]"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <button
              onClick={onNextWeek}
              className="flex items-center justify-center size-[30px] rounded-full hover:bg-[#f6f7f9] transition-colors cursor-pointer text-[#28415c]"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
          <span
            className="text-[#28415c] text-[16px] font-bold tracking-[-0.3px]"
            style={fontFeature}
          >
            {monthLabel}
          </span>
        </div>
      </div>

      {/* Day headers */}
      <div
        className="grid border-b border-[#f0f2f5] shrink-0"
        style={{ gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)` }}
      >
        <div /> {/* Spacer for time col */}
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={idx}
              className="flex flex-col items-center py-[10px] border-l border-[#f0f2f5]"
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.5px] ${isToday ? "text-[#28415C]" : "text-[#98989d]"}`}
                style={fontFeature}
              >
                {DAYS_PT[idx]}
              </span>
              <div
                className={`relative flex items-center justify-center size-[32px] rounded-full mt-[2px] ${
                  isToday
                    ? "bg-[#28415C] text-white"
                    : "text-[#28415c]"
                }`}
                style={isToday ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" } : undefined}
              >
                <span
                  className="font-bold"
                  style={{ fontSize: 15, letterSpacing: -0.3, ...fontFeature }}
                >
                  {day.getDate()}
                </span>
                {isToday && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: "0.7px solid rgba(200,207,219,0.6)" }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)`,
            height: HOURS.length * HOUR_HEIGHT,
          }}
        >
          {/* Time labels column */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-[8px] text-[#98989d]"
                style={{
                  top: (hour - 7) * HOUR_HEIGHT - 6,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  ...fontFeature,
                }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents = eventsByDay.get(dayIdx) || [];
            const isToday = isSameDay(day, today);

            return (
              <div
                key={dayIdx}
                className={`relative border-l border-[#f0f2f5] ${isToday ? "bg-[#F6F7F9]" : ""}`}
              >
                {/* Hour gridlines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-[#f0f2f5] z-0"
                    style={{ top: (hour - 7) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Half-hour gridlines */}
                {HOURS.map((hour) => (
                  <div
                    key={`half-${hour}`}
                    className="absolute left-0 right-0 border-t border-dashed border-[#f0f2f5] z-0"
                    style={{ top: (hour - 7) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Events */}
                {dayEvents.map(({ appt, colorIdx }) => {
                  const pos = getEventPosition(appt);
                  return (
                    <div
                      key={appt.id}
                      onClick={() => onSelectAppt(appt.id)}
                      className={`absolute left-[2px] right-[4px] rounded-[8px] px-[6px] py-[3px] overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-[1px] hover:shadow-[0px_4px_8px_0px_rgba(18,34,50,0.15)] group/event border-0 z-[1]`}
                      style={{
                        top: pos.top,
                        height: pos.height,
                        backgroundColor: selectedApptId === appt.id ? "#28415c" : "#FFEDEB",
                        ...(selectedApptId === appt.id ? { boxShadow: "0px 2px 4px 0px rgba(18, 34, 50, 0.3)" } : {}),
                      }}
                    >
                      {/* Glossy overlay for selected state */}
                      {selectedApptId === appt.id && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 pointer-events-none rounded-[8px]"
                          style={{ border: "0.7px solid rgba(200, 207, 219, 0.6)" }}
                        />
                      )}
                      <div
                        className="truncate font-semibold leading-[16px] relative z-[1]"
                        style={{ fontSize: 11, color: selectedApptId === appt.id ? "#f6f7f9" : "#B13B00", letterSpacing: -0.2, ...fontFeature }}
                      >
                        {appt.subject}
                      </div>
                      {pos.height >= 36 && (
                        <div
                          className="truncate leading-[14px] mt-[1px] relative z-[1]"
                          style={{ fontSize: 10, color: selectedApptId === appt.id ? "rgba(246,247,249,0.75)" : "#B13B00", opacity: selectedApptId === appt.id ? 1 : 0.75, ...fontFeature }}
                        >
                          {formatDateRange(appt.startDate, appt.endDate)}
                        </div>
                      )}
                      {pos.height >= 52 && appt.location && (
                        <div
                          className="truncate leading-[14px] mt-[1px] flex items-center gap-[2px] relative z-[1]"
                          style={{ fontSize: 9, color: selectedApptId === appt.id ? "rgba(246,247,249,0.6)" : "#B13B00", opacity: selectedApptId === appt.id ? 1 : 0.6, ...fontFeature }}
                        >
                          <MapPin size={9} weight="fill" />
                          {appt.location}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isToday && showNowLine && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <div className="relative flex items-center">
                      <div className="absolute left-[-5px] size-[10px] rounded-full bg-[#ED5200]" />
                      <div className="w-full h-[2px] bg-[#ED5200]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Horizontal hour lines for time column */}
          {HOURS.map((hour) => (
            <div
              key={`line-${hour}`}
              className="absolute left-0 right-0 border-t border-[#f0f2f5] pointer-events-none"
              style={{
                top: (hour - 7) * HOUR_HEIGHT,
                left: TIME_COL_WIDTH,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Appointment Modal                                           */
/* ------------------------------------------------------------------ */

interface CreateApptForm {
  subject: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  priority: Priority;
  status: AppointmentStatus;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  owner: string;
  reminder: string;
  attendees: { name: string; email: string; organizer?: boolean; rsvp?: "sim" | "nao" | "talvez" | "pendente" }[];
}

function getDefaultForm(): CreateApptForm {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const toTimeStr = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes() < 30 ? 30 : 0).padStart(2, "0")}`;
  return {
    subject: "",
    description: "",
    startDate: toDateStr(now),
    startTime: toTimeStr(now),
    endDate: toDateStr(later),
    endTime: toTimeStr(later),
    allDay: false,
    location: "",
    priority: "normal",
    status: "agendado",
    relatedToType: "",
    relatedToId: "",
    relatedToName: "",
    owner: "",
    reminder: "15 minutos antes",
    attendees: [],
  };
}

function CreateAppointmentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (appt: Appointment) => void;
}) {
  const [form, setForm] = useState<CreateApptForm>(getDefaultForm);
  const [saving, setSaving] = useState(false);
  const [entitySearch, setEntitySearch] = useState("");
  const [entityOptions, setEntityOptions] = useState<{ type: string; id: string; name: string }[]>([]);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const entityRef = useRef<HTMLDivElement>(null);

  // Attendee picker state
  const [modalContactsPool, setModalContactsPool] = useState(CONTACTS_POOL);
  const [modalAttendeeSearch, setModalAttendeeSearch] = useState("");
  const [modalAttendeeDropdown, setModalAttendeeDropdown] = useState(false);
  const modalAttendeeRef = useRef<HTMLDivElement>(null);
  const modalAttendeeInputRef = useRef<HTMLInputElement>(null);

  // Load entities + contacts for linking & attendees
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [accounts, opps, contacts] = await Promise.all([
          listAccounts().catch(() => []),
          listOpportunities().catch(() => []),
          listContacts().catch(() => []),
        ]);
        const opts: { type: string; id: string; name: string }[] = [];
        (accounts || []).forEach((a: any) => opts.push({ type: "conta", id: a.id, name: a.name }));
        (opps || []).forEach((o: any) => opts.push({ type: "oportunidade", id: o.id, name: o.name }));
        (contacts || []).forEach((c: any) => opts.push({ type: "contato", id: c.id, name: `${c.name} ${c.last_name || ""}`.trim() }));
        setEntityOptions(opts);
        // Build contacts pool for attendee picker
        if ((contacts || []).length > 0) {
          setModalContactsPool((contacts || []).map((c: any) => ({
            name: [c.name, c.last_name].filter(Boolean).join(" ") || c.email || "",
            email: c.email || "",
          })));
        }
      } catch { /* ignore */ }
    })();
  }, [open]);

  // Reset form when opening
  useEffect(() => {
    if (open) setForm(getDefaultForm());
  }, [open]);

  // Close dropdowns on click outside
  useEffect(() => {
    if (!showEntityDropdown && !modalAttendeeDropdown) return;
    const handler = (e: MouseEvent) => {
      if (showEntityDropdown && entityRef.current && !entityRef.current.contains(e.target as Node)) setShowEntityDropdown(false);
      if (modalAttendeeDropdown && modalAttendeeRef.current && !modalAttendeeRef.current.contains(e.target as Node)) setModalAttendeeDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEntityDropdown, modalAttendeeDropdown]);

  const patch = (p: Partial<CreateApptForm>) => setForm((f) => ({ ...f, ...p }));

  const modalFilteredContacts = useMemo(() => {
    const existing = new Set(form.attendees.map((a) => a.email.toLowerCase()));
    const q = modalAttendeeSearch.toLowerCase().trim();
    return modalContactsPool.filter(
      (c) => !existing.has(c.email.toLowerCase()) && (q === "" || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [modalAttendeeSearch, form.attendees, modalContactsPool]);

  const addModalAttendee = useCallback((contact: { name: string; email: string }) => {
    setForm((f) => ({ ...f, attendees: [...f.attendees, { name: contact.name, email: contact.email, rsvp: "pendente" as const }] }));
    setModalAttendeeSearch("");
    setModalAttendeeDropdown(false);
    modalAttendeeInputRef.current?.focus();
  }, []);

  const removeModalAttendee = useCallback((email: string) => {
    setForm((f) => ({ ...f, attendees: f.attendees.filter((a) => a.email !== email) }));
  }, []);

  const filteredEntities = useMemo(() => {
    if (!entitySearch) return entityOptions.slice(0, 8);
    const q = entitySearch.toLowerCase();
    return entityOptions.filter((e) => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)).slice(0, 8);
  }, [entitySearch, entityOptions]);

  const handleSave = async () => {
    if (!form.subject.trim()) {
      toast.error("Informe o assunto do compromisso.");
      return;
    }
    setSaving(true);
    try {
      const startIso = form.allDay
        ? `${form.startDate}T00:00:00`
        : `${form.startDate}T${form.startTime}:00`;
      const endIso = form.allDay
        ? `${form.endDate || form.startDate}T23:59:59`
        : `${form.endDate || form.startDate}T${form.endTime}:00`;

      const dbData: Partial<DbActivity> = {
        id: generateCrmId("AT"),
        type: "compromisso",
        subject: form.subject.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        start_date: startIso,
        end_date: endIso,
        all_day: form.allDay,
        location: form.location.trim(),
        related_to_type: form.relatedToType,
        related_to_id: form.relatedToId,
        related_to_name: form.relatedToName,
        entity_type: form.relatedToType,
        entity_id: form.relatedToId,
        owner: form.owner || "Sistema",
        reminder: form.reminder,
        timezone: "America/Sao_Paulo",
        attendees: form.attendees,
        busy_status: "Ocupado",
        visibility: "Visibilidade padrão",
        calendar_name: "Atividades",
        meet_link: "",
        google_event_id: "",
        recurrence: "",
      };

      const created = await createActivity(dbData);

      // Create Google Calendar event with attendees
      let meetLink = "";
      let googleEventId = "";
      try {
        const attendeeEmails = form.attendees.map((a) => a.email).filter(Boolean);
        const htzAttendee = form.attendees.find((a) => a.email?.endsWith("@htz.agency"))?.email;
        const userEmail = htzAttendee || (form.owner?.includes("@htz.agency") ? form.owner : "hends@htz.agency");
        const gcalRes = await fetch(`${SERVER_BASE}/google-calendar/create-meet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            subject: form.subject.trim(),
            description: form.description.trim(),
            startDate: startIso,
            endDate: endIso,
            allDay: form.allDay,
            attendees: attendeeEmails,
            userEmail: typeof userEmail === "string" && userEmail.endsWith("@htz.agency") ? userEmail : "hends@htz.agency",
          }),
        });
        const gcalJson = await gcalRes.json();
        if (gcalRes.ok && gcalJson.data) {
          meetLink = gcalJson.data.meetLink || "";
          googleEventId = gcalJson.data.eventId || "";
          // Persist meet link and event ID back to the activity
          await patchActivity(created.id, { meet_link: meetLink, google_event_id: googleEventId } as any);
        } else {
          console.log("Google Calendar creation warning:", gcalJson);
        }
      } catch (gcalErr) {
        console.log("Google Calendar event creation failed (non-blocking):", gcalErr);
      }

      const appt: Appointment = {
        id: created.id,
        subject: created.subject || form.subject,
        description: created.description || form.description,
        status: (created.status || "agendado") as AppointmentStatus,
        priority: (created.priority || "normal") as Priority,
        startDate: created.start_date || startIso,
        endDate: created.end_date || endIso,
        allDay: created.all_day || false,
        location: created.location || form.location,
        relatedToType: created.related_to_type || form.relatedToType,
        relatedToId: created.related_to_id || form.relatedToId,
        relatedToName: created.related_to_name || form.relatedToName,
        contactName: created.contact_name || "",
        owner: created.owner || form.owner,
        meetLink: meetLink || created.meet_link || "",
        googleEventId: googleEventId || created.google_event_id || "",
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        timezone: created.timezone || "America/Sao_Paulo",
        recurrence: created.recurrence || "",
        attendees: created.attendees || form.attendees || [],
        reminder: created.reminder || form.reminder,
        busyStatus: created.busy_status || "Ocupado",
        visibility: created.visibility || "Visibilidade padrão",
        calendarName: created.calendar_name || "Atividades",
      };

      onCreated(appt);
      toast.success("Compromisso criado com sucesso!");
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar compromisso:", err);
      toast.error(`Erro ao criar compromisso: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls = "w-full h-[38px] px-[12px] rounded-[8px] border border-transparent bg-[#F6F7F9] text-[#28415c] outline-none focus:border-[#07ABDE] transition-colors";
  const inputStyle = { fontSize: 12, fontWeight: 400, letterSpacing: -0.3, ...fontFeature } as React.CSSProperties;
  const labelStyle = { fontSize: 11, fontWeight: 700, letterSpacing: 0.3, ...fontFeature } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="relative w-full max-w-[520px] max-h-[90vh] bg-white rounded-[20px] overflow-hidden flex flex-col"
        style={{ boxShadow: "0px 8px 32px rgba(18,34,50,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#f0f2f5]">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center size-[36px] rounded-[10px] bg-[#FFEDEB]">
              <CalendarBlank size={18} weight="duotone" className="text-[#FF8C76]" />
            </div>
            <span className="text-[#28415c]" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, ...fontFeature }}>
              Novo Compromisso
            </span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] transition-colors cursor-pointer">
            <X size={16} weight="bold" className="text-[#98989d]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[24px] py-[20px] flex flex-col gap-[16px]">
          {/* Assunto */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Assunto *</label>
            <input
              type="text"
              placeholder="Ex: Reunião com cliente Alpha"
              value={form.subject}
              onChange={(e) => patch({ subject: e.target.value })}
              className={inputCls}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Data e horário */}
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center justify-between">
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Data e Horário</label>
              <button
                onClick={() => patch({ allDay: !form.allDay })}
                className={`flex items-center gap-[4px] h-[24px] px-[8px] rounded-[500px] transition-colors cursor-pointer ${form.allDay ? "bg-[#DCF0FF] text-[#07ABDE]" : "bg-[#f6f7f9] text-[#98989d] hover:bg-[#ebedf0]"}`}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>DIA INTEIRO</span>
              </button>
            </div>
            <div className="flex items-center gap-[8px]">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => patch({ startDate: e.target.value, endDate: e.target.value })}
                className={`${inputCls} flex-1`}
                style={inputStyle}
              />
              {!form.allDay && (
                <>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => patch({ startTime: e.target.value })}
                    className={`${inputCls} w-[110px]`}
                    style={inputStyle}
                  />
                  <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 600, ...fontFeature }}>até</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => patch({ endTime: e.target.value })}
                    className={`${inputCls} w-[110px]`}
                    style={inputStyle}
                  />
                </>
              )}
            </div>
          </div>

          {/* Local */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Local</label>
            <div className="relative">
              <MapPin size={14} weight="duotone" className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#98989d]" />
              <input
                type="text"
                placeholder="Ex: Google Meet, Sala de Reuniões 1"
                value={form.location}
                onChange={(e) => patch({ location: e.target.value })}
                className={`${inputCls} pl-[32px]`}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Status + Prioridade */}
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Status</label>
              <select
                value={form.status}
                onChange={(e) => patch({ status: e.target.value as AppointmentStatus })}
                className="h-[28px] px-[10px] pr-[24px] rounded-[500px] border-none outline-none cursor-pointer uppercase appearance-none w-fit"
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  color: statusConfig[form.status]?.color ?? "#07ABDE",
                  backgroundColor: statusConfig[form.status]?.bg ?? "#DCF0FF",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256'%3E%3Cpath d='M128,188a12,12,0,0,1-8.49-3.51l-80-80a12,12,0,0,1,17-17L128,159,199.51,87.51a12,12,0,0,1,17,17l-80,80A12,12,0,0,1,128,188Z' fill='${encodeURIComponent(statusConfig[form.status]?.color ?? "#07ABDE")}'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  ...fontFeature,
                }}
              >
                {STATUS_KEYS.map((s) => (
                  <option key={s} value={s}>{statusConfig[s].label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[#4e6987] uppercase" style={labelStyle}>Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) => patch({ priority: e.target.value as Priority })}
                className="h-[28px] px-[10px] pr-[24px] rounded-[500px] border-none outline-none cursor-pointer uppercase appearance-none w-fit"
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  color: priorityConfig[form.priority]?.color ?? "#4E6987",
                  backgroundColor: priorityConfig[form.priority]?.bg ?? "#F6F7F9",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256'%3E%3Cpath d='M128,188a12,12,0,0,1-8.49-3.51l-80-80a12,12,0,0,1,17-17L128,159,199.51,87.51a12,12,0,0,1,17,17l-80,80A12,12,0,0,1,128,188Z' fill='${encodeURIComponent(priorityConfig[form.priority]?.color ?? "#4E6987")}'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  ...fontFeature,
                }}
              >
                {(["baixa", "normal", "alta"] as Priority[]).map((p) => (
                  <option key={p} value={p}>{priorityConfig[p].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Relacionado a */}
          <div className="flex flex-col gap-[6px]" ref={entityRef}>
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Vinculado a</label>
            <div className="relative">
              <LinkSimpleHorizontal size={14} weight="duotone" className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#98989d]" />
              <input
                type="text"
                placeholder="Buscar conta, oportunidade ou contato..."
                value={form.relatedToName || entitySearch}
                onChange={(e) => {
                  setEntitySearch(e.target.value);
                  if (form.relatedToId) patch({ relatedToType: "", relatedToId: "", relatedToName: "" });
                  setShowEntityDropdown(true);
                }}
                onFocus={() => setShowEntityDropdown(true)}
                className={`${inputCls} pl-[32px]`}
                style={inputStyle}
              />
              {form.relatedToId && (
                <button
                  onClick={() => { patch({ relatedToType: "", relatedToId: "", relatedToName: "" }); setEntitySearch(""); }}
                  className="absolute right-[8px] top-1/2 -translate-y-1/2 flex items-center justify-center size-[20px] rounded-full hover:bg-[#f6f7f9] cursor-pointer"
                >
                  <X size={10} weight="bold" className="text-[#98989d]" />
                </button>
              )}
            </div>
            {showEntityDropdown && filteredEntities.length > 0 && !form.relatedToId && (
              <div className="relative z-20 mt-[-4px] bg-white border border-[#dde3ec] rounded-[12px] overflow-hidden" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                {filteredEntities.map((e) => (
                  <button
                    key={`${e.type}-${e.id}`}
                    onClick={() => {
                      patch({ relatedToType: e.type, relatedToId: e.id, relatedToName: e.name });
                      setEntitySearch("");
                      setShowEntityDropdown(false);
                    }}
                    className="flex items-center gap-[8px] w-full px-[12px] py-[8px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
                  >
                    <span
                      className="inline-flex items-center h-[18px] px-[6px] rounded-[4px] shrink-0"
                      style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 0.3, ...fontFeature,
                        backgroundColor: e.type === "conta" ? "#DCF0FF" : e.type === "oportunidade" ? "#E8E8FD" : "#D9F8EF",
                        color: e.type === "conta" ? "#07ABDE" : e.type === "oportunidade" ? "#8C8CD4" : "#3CCEA7",
                      }}
                    >
                      {e.type === "conta" ? "CONTA" : e.type === "oportunidade" ? "OPORT." : "CONTATO"}
                    </span>
                    <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
                      {e.name}
                    </span>
                    <span className="text-[#C8CFDB] ml-auto shrink-0" style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}>
                      {e.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Proprietário */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Proprietário</label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              value={form.owner}
              onChange={(e) => patch({ owner: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Lembrete */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Lembrete</label>
            <select
              value={form.reminder}
              onChange={(e) => patch({ reminder: e.target.value })}
              className="h-[28px] px-[10px] pr-[24px] rounded-[500px] border-none outline-none cursor-pointer appearance-none w-fit bg-[#DDE3EC] text-[#4E6987]"
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256'%3E%3Cpath d='M128,188a12,12,0,0,1-8.49-3.51l-80-80a12,12,0,0,1,17-17L128,159,199.51,87.51a12,12,0,0,1,17,17l-80,80A12,12,0,0,1,128,188Z' fill='%234E6987'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                ...fontFeature,
              }}
            >
              <option value="nenhum">Sem lembrete</option>
              <option value="5 minutos antes">5 minutos antes</option>
              <option value="10 minutos antes">10 minutos antes</option>
              <option value="15 minutos antes">15 minutos antes</option>
              <option value="30 minutos antes">30 minutos antes</option>
              <option value="1 hora antes">1 hora antes</option>
              <option value="1 dia antes">1 dia antes</option>
            </select>
          </div>

          {/* Participantes */}
          <div className="flex flex-col gap-[6px]" ref={modalAttendeeRef}>
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Participantes</label>
            {form.attendees.length > 0 && (
              <div className="flex flex-col gap-[4px] mb-[4px]">
                {form.attendees.map((att, i) => (
                  <div key={`${att.email}-${i}`} className="flex items-center gap-[8px] group/att">
                    <div
                      className="flex items-center justify-center size-[26px] rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${att.name.charCodeAt(0) * 7 % 360}, 50%, 85%)` }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: `hsl(${att.name.charCodeAt(0) * 7 % 360}, 40%, 35%)` }}>
                        {att.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>{att.name}</span>
                      <span className="text-[#98989d] truncate" style={{ fontSize: 10, ...fontFeature }}>{att.email}</span>
                    </div>
                    <button
                      onClick={() => removeModalAttendee(att.email)}
                      className="opacity-0 group-hover/att:opacity-100 flex items-center justify-center size-[20px] rounded-full hover:bg-[#FFEDEB] transition-all cursor-pointer"
                    >
                      <X size={10} weight="bold" className="text-[#F56233]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <IdentificationCard size={14} weight="duotone" className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#98989d]" />
              <input
                ref={modalAttendeeInputRef}
                type="text"
                placeholder="Buscar contato para adicionar..."
                value={modalAttendeeSearch}
                onChange={(e) => {
                  setModalAttendeeSearch(e.target.value);
                  setModalAttendeeDropdown(true);
                }}
                onFocus={() => setModalAttendeeDropdown(true)}
                className={`${inputCls} pl-[32px]`}
                style={inputStyle}
              />
            </div>
            {modalAttendeeDropdown && modalFilteredContacts.length > 0 && (
              <div className="relative z-20 mt-[-4px] bg-white border border-[#dde3ec] rounded-[12px] overflow-hidden max-h-[180px] overflow-y-auto" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                {modalFilteredContacts.map((c, idx) => (
                  <button
                    key={`${c.email}-${idx}`}
                    onClick={() => addModalAttendee(c)}
                    className="flex items-center gap-[8px] w-full px-[12px] py-[7px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
                  >
                    <div
                      className="flex items-center justify-center size-[24px] rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${c.name.charCodeAt(0) * 7 % 360}, 50%, 85%)` }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 700, color: `hsl(${c.name.charCodeAt(0) * 7 % 360}, 40%, 35%)` }}>
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[#28415c] truncate" style={{ fontSize: 12, fontWeight: 600, ...fontFeature }}>{c.name}</span>
                      <span className="text-[#98989d] truncate" style={{ fontSize: 10, ...fontFeature }}>{c.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#4e6987] uppercase" style={labelStyle}>Descrição</label>
            <textarea
              placeholder="Detalhes do compromisso..."
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="w-full bg-[#F6F7F9] rounded-[8px] px-[10px] py-[6px] outline-none border border-transparent focus:border-[#07ABDE] transition-colors resize-none text-[#4E6987]"
              style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[8px] px-[24px] py-[14px] border-t border-[#f0f2f5]">
          <button
            onClick={onClose}
            className="flex items-center h-[34px] px-[18px] rounded-[500px] bg-[#f6f7f9] text-[#4e6987] hover:bg-[#ebedf0] transition-colors cursor-pointer uppercase"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-[6px] h-[34px] px-[18px] rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#32b592] transition-colors cursor-pointer disabled:opacity-50 uppercase"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}
          >
            {saving && <Spinner size={14} className="animate-spin" />}
            SALVAR
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmAppointments() {
  const { query: globalSearch } = useCrmSearch();
  const { openModal: openCreateActivityModal, refreshKey } = useCreateActivity();
  const [appointments, setAppointments] = useState<Appointment[]>([]); /* unified modal */
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("calendario");
  const [titleMenuOpen, setTitleMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleMenuRef = useRef<HTMLDivElement>(null);

  /* -- Filter state -- */
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ApptFilterCondition[]>([]);
  const [draftFilters, setDraftFilters] = useState<ApptFilterCondition[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  /* -- Detail panel state -- */
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  const handleStatusChange = useCallback((apptId: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apptId ? { ...a, status: newStatus } : a
      )
    );
    patchActivity(apptId, { status: newStatus }).catch(console.error);
    toast.success(`Compromisso ${newStatus === "concluido" ? "concluido" : "cancelado"}!`);
  }, []);

  /* -- Calendar state -- */
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  /* -- Load from Supabase -- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const dbRows = await listActivities();
        if (cancelled) return;
        const converted = (dbRows || []).map(dbActivityToAppointment).filter(Boolean) as Appointment[];
        setAppointments(converted);
      } catch (err) {
        console.error("Erro ao carregar compromissos:", err);
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  /* -- Filtered appointments -- */
  const filteredAppointments = useMemo(() => {
    let result = appointments;

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    result = applyApptFilters(result, activeFilters);

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      result = result.filter((a) =>
        a.subject.toLowerCase().includes(q) ||
        a.relatedToName.toLowerCase().includes(q) ||
        a.contactName.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q)
      );
    }

    return result;
  }, [appointments, statusFilter, activeFilters, globalSearch]);

  /* -- Table state -- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const [currentPage, setCurrentPage] = useState(1);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / ROWS_PER_PAGE));
  const paginated = filteredAppointments.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const selectedAppt = selectedApptId ? appointments.find((a) => a.id === selectedApptId) : null;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: appointments.length };
    for (const s of STATUS_KEYS) {
      counts[s] = appointments.filter((a) => a.status === s).length;
    }
    return counts;
  }, [appointments]);

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
      setSelectedIds(new Set(paginated.map((a) => a.id)));
    }
  };

  /* -- Filter panel handlers -- */
  const updateDraftFilter = (fc: ApptFilterCondition) => {
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

  /* -- Calendar navigation -- */
  const handlePrevWeek = useCallback(() => setWeekStart((w) => addDays(w, -7)), []);
  const handleNextWeek = useCallback(() => setWeekStart((w) => addDays(w, 7)), []);
  const handleToday = useCallback(() => setWeekStart(getWeekStart(new Date())), []);

  /* -- Loading state -- */
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-[3px] border-[#dde3ec] border-t-[#07ABDE] rounded-full animate-spin" />
          <span className="text-[#98989d] text-[13px] font-medium" style={fontFeature}>Carregando compromissos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-[12px] min-h-0 overflow-hidden">
      {/* ═══════ LEFT: MAIN LIST AREA ═══════ */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden min-w-0 transition-all ${selectedAppt ? "xl:flex hidden" : "flex"} xl:flex`}>
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
              <div className="flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[10px] bg-[#FFEDEB] group-hover/title:bg-[#ffddd8] transition-colors">
                <CalendarBlank size={22} weight="duotone" className="text-[#FF8C76] group-hover/title:text-[#e5715b] transition-colors" />
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
                  >Compromissos</span>
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
                  onClick={() => { setTitleMenuOpen(false); toast("Configuracoes de compromissos (em breve)"); }}
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
                  <span className="text-[15px] tracking-[-0.5px] leading-[22px] whitespace-nowrap" style={{ fontWeight: 500, ...fontFeature }}>Detalhes de Compromissos</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: + Novo Compromisso button */}
          {/* Novo Compromisso — ação movida para o botão contextual do sidebar */}
        </div>

        {/* TABS ROW */}
        <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
          {/* Segmented Control: Calendario / Tabela */}
          <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px]">
            <button
              onClick={() => setViewMode("calendario")}
              className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                viewMode === "calendario"
                  ? "text-[#f6f7f9]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
            >
              {viewMode === "calendario" && (
                <>
                  <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                </>
              )}
              <CalendarDots size={14} weight={viewMode === "calendario" ? "fill" : "regular"} className="relative z-[1]" />
              <span
                className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 10, ...fontFeature }}
              >
                CALENDARIO
              </span>
            </button>

            <button
              onClick={() => setViewMode("tabela")}
              className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                viewMode === "tabela"
                  ? "text-[#f6f7f9]"
                  : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
              }`}
            >
              {viewMode === "tabela" && (
                <>
                  <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                    style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                  />
                </>
              )}
              <Table size={14} weight={viewMode === "tabela" ? "fill" : "regular"} className="relative z-[1]" />
              <span
                className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                style={{ fontSize: 10, ...fontFeature }}
              >
                TABELA
              </span>
            </button>

            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                boxShadow:
                  "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          {/* Status filter pills — animated in/out when detail panel toggles */}
          <AnimatePresence initial={false}>
            {!selectedAppt && (
              <motion.div
                key="status-pills"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
                className="flex items-center gap-1 overflow-hidden shrink-0"
              >
                <VerticalDivider />

                <div className="relative flex items-center gap-[2px] p-[4px] bg-[#f6f7f9] rounded-[100px] shrink-0">
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
              </motion.div>
            )}
          </AnimatePresence>

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

        </div>

        {/* ═══════ FILTER PANEL ═══════ */}
        {isFilterPanelOpen && (
          <div ref={filterPanelRef} className="mt-[8px] pt-[10px] border-t border-[#f0f2f5]">
            {/* Filter dropdown pills row */}
            <div className="flex items-center gap-[6px] flex-wrap">
              {APPT_FILTER_FIELDS.map((fd) => (
                <ApptFilterDropdownPill
                  key={fd.key}
                  fieldDef={fd}
                  condition={draftFilters.find((c) => c.field === fd.key)}
                  onChange={updateDraftFilter}
                  items={appointments}
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
                          {apptFilterConditionLabel(fc)}
                        </span>
                        <button
                          onClick={() =>
                            setDraftFilters((prev) => prev.filter((c) => c.field !== fc.field))
                          }
                          className="flex items-center justify-center size-[16px] rounded-full hover:bg-[#07abde] hover:text-white transition-colors cursor-pointer"
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
                className="flex items-center gap-[4px] h-[34px] px-[16px] rounded-[100px] bg-[#3CCEA7] text-white hover:bg-[#30b893] transition-colors cursor-pointer"
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


      </div>

      {/* ═══════ CONTENT AREA ═══════ */}
      {viewMode === "calendario" ? (
        <WeeklyCalendar
          appointments={filteredAppointments}
          weekStart={weekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
          onSelectAppt={setSelectedApptId}
          selectedApptId={selectedApptId}
        />
      ) : (
        <>
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
                        <CalendarBlank size={32} weight="duotone" className="text-[#C8CFDB]" />
                        <p className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                          Nenhum compromisso encontrado
                        </p>
                      </div>
                    </div>
                  ) : (
                    paginated.map((appt, idx) => {
                      const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                      const isSelected = selectedIds.has(appt.id);
                      const statusConf = statusConfig[appt.status] || statusConfig.agendado;
                      const priorityConf = priorityConfig[appt.priority] || priorityConfig.normal;
                      const PriorityIcon = priorityConf.icon;

                      return (
                        <div key={appt.id}>
                          <HorizontalDivider />
                          <div
                            onClick={() => setSelectedApptId(appt.id)}
                            className={`grid items-center h-[38px] px-3 mx-2 cursor-pointer rounded-[100px] transition-colors ${
                              selectedApptId === appt.id
                                ? "bg-[#FFEDEB]"
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
                                onChange={() => toggleSelect(appt.id)}
                              />
                            </div>

                            {/* Subject */}
                            <div
                              className="truncate text-[#122232]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {appt.subject}
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

                            {/* Date/Time */}
                            <div
                              className="truncate text-[#28415c]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {formatDateRange(appt.startDate, appt.endDate)}
                            </div>

                            {/* Priority */}
                            <div className="flex items-center gap-[4px]">
                              <PriorityIcon size={13} weight="bold" style={{ color: priorityConf.color }} />
                              <span
                                className="whitespace-nowrap"
                                style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, color: priorityConf.color, ...fontFeature }}
                              >
                                {priorityConf.label}
                              </span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-[4px] truncate">
                              {appt.location ? (
                                <>
                                  <MapPin size={12} weight="fill" className="text-[#98989d] shrink-0" />
                                  <span
                                    className="truncate text-[#28415c]"
                                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                                  >
                                    {appt.location}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[#C8CFDB]" style={{ fontSize: 12, ...fontFeature }}>{"\u2014"}</span>
                              )}
                            </div>

                            {/* Owner */}
                            <OwnerCell ownerId={appt.owner} />

                            {/* Created at */}
                            <div
                              className="truncate text-[#28415c]"
                              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
                            >
                              {formatRelativeDate(appt.createdAt)}
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
          {filteredAppointments.length > ROWS_PER_PAGE && (
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
        </>
      )}

      {/* FLOATING SELECTION BAR (table view only) */}
      {viewMode === "tabela" && selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-[12px] h-[48px] px-[20px] rounded-[500px] bg-[#28415c] text-white"
          style={{ boxShadow: "0px 4px 16px 0px rgba(18,34,50,0.35)" }}
        >
          <span
            className="font-bold uppercase tracking-[0.5px]"
            style={{ fontSize: 11, ...fontFeature }}
          >
            {selectedIds.size} {selectedIds.size === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="w-[1.5px] h-[20px] rounded-full bg-white/30" />
          <button
            onClick={() => {
              toast.success(`${selectedIds.size} compromisso(s) concluido(s)`);
              setAppointments((prev) =>
                prev.map((a) =>
                  selectedIds.has(a.id)
                    ? { ...a, status: "concluido" as AppointmentStatus }
                    : a
                )
              );
              selectedIds.forEach((id) => {
                patchActivity(id, { status: "concluido" }).catch(console.error);
              });
              setSelectedIds(new Set());
            }}
            className="flex items-center gap-[4px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-[#3CCEA7] transition-colors cursor-pointer"
          >
            <Check size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>CONCLUIR</span>
          </button>
          <button
            onClick={() => {
              const count = selectedIds.size;
              setAppointments((prev) => prev.filter((a) => !selectedIds.has(a.id)));
              selectedIds.forEach((id) => {
                deleteActivity(id).catch(console.error);
              });
              setSelectedIds(new Set());
              toast.success(`${count} compromisso(s) excluído(s)`);
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

      {/* ═══════ RIGHT: DETAIL SIDE PANEL ═══════ */}
      <AnimatePresence>
        {selectedAppt && (
          <motion.div
            key="appt-detail-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[320px] h-full">
              <AppointmentDetailPanel
                appt={selectedAppt}
                onClose={() => setSelectedApptId(null)}
                onStatusChange={handleStatusChange}
                onMeetLinkUpdate={(id, meetLink, googleEventId) => {
                  setAppointments((prev) =>
                    prev.map((a) =>
                      a.id === id ? { ...a, meetLink, googleEventId } : a
                    )
                  );
                  // Persist meet link to DB
                  patchActivity(id, { meet_link: meetLink, google_event_id: googleEventId } as any).catch((err: any) =>
                    console.error("Error persisting Meet link:", err)
                  );
                }}
                onUpdate={(id, patch) => {
                  setAppointments((prev) =>
                    prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
                  );
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal is now handled globally via CreateActivityModal in CrmLayout */}
    </div>
  );
}
