/**
 * Activity Config — Single Source of Truth
 *
 * ALL activity-related configs live here so that the create modal,
 * task listing, task detail, side panels, and settings pages
 * consume the same definitions. Never duplicate these elsewhere.
 *
 * Import pattern:
 *   import { TASK_STATUS_CONFIG, PRIORITY_CONFIG, ... } from "./activity-config";
 */

import type { ComponentType } from "react";

/* ================================================================== */
/*  Shared style tokens                                                */
/* ================================================================== */

export const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" } as const;

export const dsLabelStyle = { fontSize: 10, fontWeight: 700 as const, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature };
export const dsValueStyle = { fontSize: 15, fontWeight: 500 as const, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature };

/** Modal/form input classes (DS pattern) */
export const modalInputCls =
  "w-full h-[38px] px-[12px] rounded-[8px] border border-transparent bg-[#F6F7F9] text-[#28415c] outline-none focus:border-[#07ABDE] transition-colors";
export const modalInputStyle: React.CSSProperties = { fontSize: 12, fontWeight: 400, letterSpacing: -0.3, ...fontFeature };
export const modalLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 0.3, ...fontFeature };

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type ActivityType = "compromisso" | "tarefa" | "ligacao" | "nota" | "mensagem" | "email";
export type TaskStatus = "nao_iniciada" | "em_andamento" | "concluida" | "aguardando" | "cancelada";
export type Priority = "baixa" | "normal" | "alta";

/* ================================================================== */
/*  Activity Types (colors, labels)                                    */
/* ================================================================== */

export interface ActivityTypeMeta {
  key: ActivityType;
  label: string;
  color: string;
  bg: string;
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; color: string; bg: string }> = {
  compromisso: { label: "Compromisso", color: "#FF8C76", bg: "#FFEDEB" },
  tarefa:      { label: "Tarefa",      color: "#8C8CD4", bg: "#E8E8FD" },
  ligacao:     { label: "Ligacao",     color: "#3CCEA7", bg: "#D9F8EF" },
  nota:        { label: "Nota",        color: "#EAC23D", bg: "#FEEDCA" },
  mensagem:    { label: "Mensagem",    color: "#07ABDE", bg: "#DCF0FF" },
  email:       { label: "Email",       color: "#4E6987", bg: "#DDE3EC" },
};

/** Ordered list for segmented controls & modals */
export const ACTIVITY_TYPE_KEYS: ActivityType[] = [
  "compromisso", "tarefa", "ligacao", "nota", "mensagem", "email",
];

/* ================================================================== */
/*  Status — per activity type                                         */
/* ================================================================== */

export interface StatusOption {
  key: string;
  label: string;
  color: string;
  bg: string;
}

/**
 * Canonical status options per activity type.
 * Used by: create modal pill selects, detail pages, side panels, table pills.
 */
export const STATUS_BY_TYPE: Record<ActivityType, StatusOption[]> = {
  compromisso: [
    { key: "agendado",     label: "Agendado",     color: "#07abde", bg: "#dcf0ff" },
    { key: "confirmado",   label: "Confirmado",   color: "#3ccea7", bg: "#d9f8ef" },
    { key: "em_andamento", label: "Em Andamento", color: "#eac23d", bg: "#feedca" },
    { key: "concluido",    label: "Concluido",    color: "#3eb370", bg: "#d9f8ef" },
    { key: "cancelado",    label: "Cancelado",    color: "#ff8c76", bg: "#ffedeb" },
  ],
  tarefa: [
    { key: "nao_iniciada", label: "Nao Iniciada", color: "#4E6987", bg: "#DDE3EC" },
    { key: "em_andamento", label: "Em Andamento", color: "#07ABDE", bg: "#DCF0FF" },
    { key: "aguardando",   label: "Aguardando",   color: "#C4990D", bg: "#FEEDCA" },
    { key: "concluida",    label: "Concluida",    color: "#135543", bg: "#D9F8EF" },
    { key: "cancelada",    label: "Cancelada",    color: "#B13B00", bg: "#FFEDEB" },
  ],
  ligacao: [
    { key: "agendado",      label: "Agendado",      color: "#07abde", bg: "#dcf0ff" },
    { key: "em_andamento",  label: "Em Andamento",  color: "#eac23d", bg: "#feedca" },
    { key: "concluido",     label: "Concluido",     color: "#3eb370", bg: "#d9f8ef" },
    { key: "nao_atendida",  label: "Nao Atendida",  color: "#f56233", bg: "#ffedeb" },
    { key: "cancelado",     label: "Cancelado",     color: "#ff8c76", bg: "#ffedeb" },
  ],
  nota: [
    { key: "rascunho",  label: "Rascunho",  color: "#98989d", bg: "#f0f2f5" },
    { key: "publicada", label: "Publicada", color: "#3ccea7", bg: "#d9f8ef" },
  ],
  mensagem: [
    { key: "rascunho", label: "Rascunho", color: "#98989d", bg: "#f0f2f5" },
    { key: "enviada",  label: "Enviada",  color: "#07abde", bg: "#dcf0ff" },
    { key: "entregue", label: "Entregue", color: "#3eb370", bg: "#d9f8ef" },
    { key: "lida",     label: "Lida",     color: "#8c8cd4", bg: "#e8e8fd" },
    { key: "falha",    label: "Falha",    color: "#f56233", bg: "#ffedeb" },
  ],
  email: [
    { key: "rascunho", label: "Rascunho", color: "#98989d", bg: "#f0f2f5" },
    { key: "enviada",  label: "Enviada",  color: "#07abde", bg: "#dcf0ff" },
    { key: "entregue", label: "Entregue", color: "#3eb370", bg: "#d9f8ef" },
    { key: "lida",     label: "Lida",     color: "#8c8cd4", bg: "#e8e8fd" },
    { key: "falha",    label: "Falha",    color: "#f56233", bg: "#ffedeb" },
  ],
};

/**
 * Quick-access task status config (record by key).
 * Used by table cells, side panel pills, detail page headers.
 */
export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusOption> = {
  nao_iniciada: { key: "nao_iniciada", label: "Nao Iniciada", color: "#4E6987", bg: "#DDE3EC" },
  em_andamento: { key: "em_andamento", label: "Em Andamento", color: "#07ABDE", bg: "#DCF0FF" },
  aguardando:   { key: "aguardando",   label: "Aguardando",   color: "#C4990D", bg: "#FEEDCA" },
  concluida:    { key: "concluida",    label: "Concluida",    color: "#135543", bg: "#D9F8EF" },
  cancelada:    { key: "cancelada",    label: "Cancelada",    color: "#B13B00", bg: "#FFEDEB" },
};

/** Ordered keys for segmented filter pills */
export const TASK_STATUS_KEYS: TaskStatus[] = [
  "nao_iniciada", "em_andamento", "aguardando", "concluida", "cancelada",
];

/* ================================================================== */
/*  Priority                                                           */
/* ================================================================== */

export interface PriorityOption {
  key: Priority;
  label: string;
  color: string;
  bg: string;
}

/**
 * Canonical priority config.
 * Colors match across modal pill-selects, detail fields, table cells.
 */
export const PRIORITY_CONFIG: Record<Priority, PriorityOption> = {
  baixa:  { key: "baixa",  label: "Baixa",  color: "#3CCEA7", bg: "#D9F8EF" },
  normal: { key: "normal", label: "Normal", color: "#4E6987", bg: "#DDE3EC" },
  alta:   { key: "alta",   label: "Alta",   color: "#ED5200", bg: "#FFEDEB" },
};

export const PRIORITY_KEYS: Priority[] = ["baixa", "normal", "alta"];

/**
 * Priority options for modals (pill-style select).
 * Same data as PRIORITY_CONFIG but as an ordered array.
 */
export const PRIORITY_OPTIONS: PriorityOption[] = PRIORITY_KEYS.map((k) => PRIORITY_CONFIG[k]);

/* ================================================================== */
/*  Tags                                                               */
/* ================================================================== */

export const TAG_OPTIONS = [
  { value: "importante", label: "Importante", color: "#ff8c76" },
  { value: "follow-up",  label: "Follow-up",  color: "#07abde" },
  { value: "urgente",    label: "Urgente",    color: "#f56233" },
  { value: "interno",    label: "Interno",    color: "#8c8cd4" },
] as const;

/* ================================================================== */
/*  Association / Related Entity configs                                */
/* ================================================================== */

export const ASSOC_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  conta:        { label: "Conta",        color: "#3CCEA7", bg: "#D9F8EF" },
  oportunidade: { label: "Oportunidade", color: "#8C8CD4", bg: "#E8E8FD" },
  contato:      { label: "Contato",      color: "#07ABDE", bg: "#DCF0FF" },
  lead:         { label: "Lead",         color: "#ED5200", bg: "#FFEDEB" },
};

/** Badge config for entity type pills in modals */
export const ENTITY_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  conta:        { label: "CONTA",   bg: "#D9F8EF", color: "#3CCEA7" },
  oportunidade: { label: "OPORT.",  bg: "#DCF0FF", color: "#07ABDE" },
  contato:      { label: "CONTATO", bg: "#FFEDEB", color: "#FF8C76" },
  lead:         { label: "LEAD",    bg: "#FEEDCA", color: "#EAC23D" },
};

export const RELATED_TYPE_LABELS: Record<string, string> = {
  lead: "Lead",
  oportunidade: "Oportunidade",
  conta: "Conta",
  contato: "Contato",
};

/* ================================================================== */
/*  Call / Message / Note specific options                              */
/* ================================================================== */

export const CALL_TYPE_OPTIONS = [
  { key: "entrada", label: "Entrada", color: "#3ccea7", bg: "#d9f8ef" },
  { key: "saida",   label: "Saida",   color: "#07abde", bg: "#dcf0ff" },
  { key: "interna", label: "Interna", color: "#8c8cd4", bg: "#e8e8fd" },
] as const;

export const CHANNEL_OPTIONS = [
  { key: "whatsapp",     label: "WhatsApp",     color: "#3eb370", bg: "#d9f8ef" },
  { key: "sms",          label: "SMS",          color: "#07abde", bg: "#dcf0ff" },
  { key: "chat_interno", label: "Chat Interno", color: "#8c8cd4", bg: "#e8e8fd" },
  { key: "telegram",     label: "Telegram",     color: "#07abde", bg: "#dcf0ff" },
] as const;

export const NOTE_VISIBILITY_OPTIONS = [
  { key: "publica", label: "Publica", color: "#3ccea7", bg: "#d9f8ef" },
  { key: "privada", label: "Privada", color: "#8c8cd4", bg: "#e8e8fd" },
] as const;

export const REMINDER_OPTIONS = [
  { key: "5 minutos antes",  label: "5 min" },
  { key: "15 minutos antes", label: "15 min" },
  { key: "30 minutos antes", label: "30 min" },
  { key: "1 hora antes",     label: "1 hora" },
  { key: "1 dia antes",      label: "1 dia" },
] as const;

/* ================================================================== */
/*  Unified Task interface                                             */
/* ================================================================== */

/**
 * The canonical Task shape used by listing, detail, and side panel.
 * Maps 1:1 from DbActivity via dbActivityToTask().
 */
export interface Task {
  id: string;
  subject: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  completedAt: string;
  assignedTo: string;
  relatedToType: string;
  relatedToId: string;
  relatedToName: string;
  contactName: string;
  owner: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export const EMPTY_TASK: Task = {
  id: "",
  subject: "",
  description: "",
  status: "nao_iniciada",
  priority: "normal",
  dueDate: "",
  completedAt: "",
  assignedTo: "",
  relatedToType: "",
  relatedToId: "",
  relatedToName: "",
  contactName: "",
  owner: "",
  tags: [],
  createdAt: "",
  updatedAt: "",
  createdBy: "",
};

/* ================================================================== */
/*  DbActivity → Task mapper                                           */
/* ================================================================== */

import type { DbActivity } from "./crm-api";

/** Convert a DbActivity row (snake_case) to the unified Task shape. Returns null if not type "tarefa". */
export function dbActivityToTask(row: DbActivity): Task | null {
  if ((row.type || "") !== "tarefa") return null;
  return {
    id: row.id,
    subject: row.subject || row.label || "",
    description: row.description || "",
    status: (row.status || "nao_iniciada") as TaskStatus,
    priority: (row.priority || "normal") as Priority,
    dueDate: row.due_date || "",
    completedAt: row.completed_at || "",
    assignedTo: row.assigned_to || row.owner || "",
    relatedToType: row.related_to_type || "",
    relatedToId: row.related_to_id || "",
    relatedToName: row.related_to_name || "",
    contactName: row.contact_name || "",
    owner: row.owner || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at ? row.created_at.slice(0, 10) : "",
    updatedAt: row.updated_at ? row.updated_at.slice(0, 10) : "",
    createdBy: row.created_by || "",
  };
}

/* ================================================================== */
/*  Shared helpers                                                     */
/* ================================================================== */

/** Is a task overdue? (not completed & past due date) */
export function isTaskOverdue(task: { status: string; completedAt?: string; dueDate?: string }): boolean {
  if (task.status === "concluida" || task.completedAt) return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

/** Format an ISO date string to a human-readable relative date */
export function formatRelativeDate(iso: string): string {
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

/** Format a date for display in detail pages (pt-BR locale) */
export function formatDatePtBr(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** Get the default status key for an activity type */
export function getDefaultStatus(type: ActivityType): string {
  return STATUS_BY_TYPE[type]?.[0]?.key || "";
}

/** Resolve a status option for a given type + status key */
export function resolveStatus(type: ActivityType, statusKey: string): StatusOption | undefined {
  return STATUS_BY_TYPE[type]?.find((s) => s.key === statusKey);
}
