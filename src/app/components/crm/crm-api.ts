/**
 * CRM Frontend API Client
 *
 * Communicates with /crm/* server routes.
 * Handles camelCase ↔ snake_case mapping between frontend and DB.
 */

import { projectId, publicAnonKey } from "../../../../utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b0da2601/crm`;
const BASE_ROOT = `https://${projectId}.supabase.co/functions/v1/make-server-b0da2601`;

/* ================================================================== */
/*  Auth token management                                              */
/* ================================================================== */

let _authToken: string | null = null;

/** Set the user's access token for authenticated API requests */
export function setAuthToken(token: string | null) {
  _authToken = token;
}

/** Get current auth token (for debugging) */
export function getAuthToken(): string | null {
  return _authToken;
}

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${_authToken || publicAnonKey}`,
});

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { ...headers(), ...options?.headers },
      });
      const json = await res.json();
      if (!res.ok) {
        const errMsg = json?.error || `HTTP ${res.status}`;
        console.error(`CRM API error [${path}]:`, errMsg);
        throw new Error(errMsg);
      }
      return json.data;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Retry only on network-level errors (Failed to fetch, AbortError, etc.)
      const isNetworkError =
        err instanceof TypeError ||
        err?.name === "AbortError" ||
        (err?.message && /failed to fetch|network|aborted|timeout/i.test(err.message));
      if (isNetworkError && attempt < MAX_RETRIES - 1) {
        const delay = 800 * (attempt + 1); // 800ms, 1600ms
        // Silent retry — no console.warn to avoid noisy logs during cold starts
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError!;
}

/* ================================================================== */
/*  Snake ↔ Camel helpers                                              */
/* ================================================================== */

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function mapKeys(obj: Record<string, any>, fn: (k: string) => string): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[fn(k)] = v;
  }
  return out;
}

function dbToFrontend<T>(row: Record<string, any>): T {
  return mapKeys(row, snakeToCamel) as T;
}

function frontendToDb(row: Record<string, any>): Record<string, any> {
  return mapKeys(row, camelToSnake);
}

/* ================================================================== */
/*  ID Generator — XX-XXXX (4 uppercase alphanumeric chars)            */
/* ================================================================== */

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"; // no I/O to avoid confusion

/** Generate a CRM-style ID: `{prefix}-XXXX` */
export function generateCrmId(prefix: "OP" | "LD" | "CT" | "AC" | "PR" | "AT" | "FH" | "CR"): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `${prefix}-${code}`;
}

/* ================================================================== */
/*  Opportunity types (matching frontend interface)                     */
/* ================================================================== */

export interface DbOpportunity {
  id: string;
  name: string;
  company: string | null;
  stage: string;
  stage_complement: string | null;
  tipo: string | null;
  type: string | null;
  owner: string;
  decisor: string | null;
  account: string | null;
  origin: string | null;
  close_date: string | null;
  last_activity: string | null;
  last_activity_date: string | null;
  value: number | null;
  score: number | null;
  score_label: string | null;
  comments: number;
  calls: number;
  labels: any | null;
  most_recent: boolean;
  needs_objective: string | null;
  needs_current_situation: string | null;
  needs_challenges: string | null;
  needs_budget: string | null;
  needs_timeline: string | null;
  needs_notes: string | null;
  mkt_campanha: string | null;
  mkt_grupo_anuncios: string | null;
  mkt_anuncio: string | null;
  mkt_ultima_conversao: string | null;
  mkt_canal: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DbLead {
  id: string;
  name: string;
  lastname: string | null;
  role: string | null;
  company: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  type: string | null;
  origin: string | null;
  segment: string | null;
  stage: string;
  stage_complement: string | null;
  owner: string;
  score: number;
  score_label: string | null;
  qualification_progress: number | null;
  last_activity: string | null;
  last_activity_date: string | null;
  response_time: string | null;
  website: string | null;
  preferred_contact: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  conversion_rate: number | null;
  is_active: boolean;
  tags: string | null;
  notes: string | null;
  labels: any | null;
  qualification_questions: any | null;
  mkt_campanha: string | null;
  mkt_grupo_anuncios: string | null;
  mkt_anuncio: string | null;
  mkt_ultima_conversao: string | null;
  mkt_canal: string | null;
  is_deleted: boolean;
  last_viewed_date: string | null;
  last_referenced_date: string | null;
  system_modstamp: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DbAccount {
  id: string;
  name: string;
  type: string;
  stage: string;
  owner: string;
  account_number: string | null;
  sector: string | null;
  website: string | null;
  phone: string | null;
  cnpj: string | null;
  description: string | null;
  annual_revenue: number | null;
  employees: number | null;
  revenue: number | null;
  segment: string | null;
  contacts: number | null;
  comments: number | null;
  calls: number | null;
  last_activity_date: string | null;
  labels: any | null;
  tags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface DbContact {
  id: string;
  name: string;
  last_name: string;
  role: string | null;
  department: string | null;
  company: string | null;
  account: string | null;
  phone: string | null;
  mobile: string | null;
  email: string;
  linkedin: string | null;
  website: string | null;
  address: string | null;
  stage: string | null;
  owner: string;
  origin: string | null;
  birth_date: string | null;
  cpf: string | null;
  preferred_contact: string | null;
  do_not_contact: boolean;
  tags: string | null;
  notes: string | null;
  last_activity_date: string | null;
  last_activity_date_iso: string | null;
  comments: number;
  calls: number;
  avatar: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  [key: string]: any;
}

export interface DbActivity {
  id: string;
  type: string; // compromisso | tarefa | ligacao | nota | mensagem | email
  subject: string | null;
  description: string | null;
  status: string | null; // nao_iniciada | em_andamento | concluida | aguardando | adiada
  priority: string | null; // baixa | normal | alta
  due_date: string | null;
  start_date: string | null;
  end_date: string | null;
  completed_at: string | null;
  assigned_to: string | null; // user id
  related_to_type: string | null; // lead | oportunidade | conta | contato
  related_to_id: string | null;
  related_to_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  location: string | null;
  all_day: boolean;
  is_private: boolean;
  is_recurring: boolean;
  recurrence_interval: number | null;
  recurrence: string | null;
  call_duration: number | null;
  call_type: string | null; // entrada | saida | interna
  call_result: string | null;
  call_direction: string | null; // saida | entrada
  phone: string | null;
  body: string | null; // for notes, messages, email
  tags: string | null;
  owner: string | null;
  /* ── Compromisso fields ── */
  meet_link: string | null;
  google_event_id: string | null;
  timezone: string | null;
  attendees: any[] | null; // [{name, email, organizer?, rsvp?}]
  reminder: string | null;
  busy_status: string | null; // ocupado | livre | provisório
  visibility: string | null; // padrao | privado | publico
  calendar_name: string | null;
  /* ── Mensagem fields ── */
  channel: string | null; // whatsapp | sms | chat_interno | telegram
  recipient: string | null;
  recipient_phone: string | null;
  sent_at: string | null;
  read_at: string | null;
  /* ── Nota fields ── */
  note_visibility: string | null; // publica | privada
  shared_with: any[] | null; // array de user IDs
  version: number | null;
  /* ── Metadata ── */
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  /* legacy compat */
  label: string | null;
  date: string | null;
  group: string | null;
  entity_type: string | null;
  entity_id: string | null;
  [key: string]: any;
}

export interface DbFieldHistory {
  id: string;
  entity_type: string;
  entity_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
  change_source: string;
}

/* ================================================================== */
/*  Opportunities                                                      */
/* ================================================================== */

export async function listOpportunities(): Promise<DbOpportunity[]> {
  return apiFetch<DbOpportunity[]>("/opportunities");
}

export async function getOpportunity(id: string): Promise<DbOpportunity> {
  return apiFetch<DbOpportunity>(`/opportunities/${id}`);
}

export async function createOpportunity(data: Partial<DbOpportunity>): Promise<DbOpportunity> {
  return apiFetch<DbOpportunity>("/opportunities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOpportunity(id: string, data: Partial<DbOpportunity>): Promise<DbOpportunity> {
  return apiFetch<DbOpportunity>(`/opportunities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchOpportunity(id: string, data: Partial<DbOpportunity>): Promise<DbOpportunity> {
  return apiFetch<DbOpportunity>(`/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteOpportunity(id: string): Promise<void> {
  await apiFetch(`/opportunities/${id}`, { method: "DELETE" });
}

/* ================================================================== */
/*  Leads                                                              */
/* ================================================================== */

export async function listLeads(): Promise<DbLead[]> {
  return apiFetch<DbLead[]>("/leads");
}

export async function getLead(id: string): Promise<DbLead> {
  return apiFetch<DbLead>(`/leads/${id}`);
}

export async function createLead(data: Partial<DbLead>): Promise<DbLead> {
  return apiFetch<DbLead>("/leads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLead(id: string, data: Partial<DbLead>): Promise<DbLead> {
  return apiFetch<DbLead>(`/leads/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchLead(id: string, data: Partial<DbLead>): Promise<DbLead> {
  return apiFetch<DbLead>(`/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteLead(id: string): Promise<void> {
  await apiFetch(`/leads/${id}`, { method: "DELETE" });
}

/* ================================================================== */
/*  Lead Conversion                                                    */
/* ================================================================== */

export interface ConvertLeadPayload {
  account: { mode: "create" | "existing"; id?: string; name?: string };
  contact: { mode: "create" | "existing"; id?: string; name?: string; lastName?: string };
  opportunity: { mode: "create" | "skip"; name?: string };
  owner: string;
}

export interface ConvertLeadResult {
  leadId: string;
  accountId: string;
  contactId: string;
  opportunityId?: string;
  accountCreated?: any;
  contactCreated?: any;
  opportunityCreated?: any;
  converted: boolean;
}

export async function convertLead(leadId: string, payload: ConvertLeadPayload): Promise<ConvertLeadResult> {
  return apiFetch<ConvertLeadResult>(`/leads/${leadId}/convert`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ================================================================== */
/*  Accounts                                                           */
/* ================================================================== */

export async function listAccounts(): Promise<DbAccount[]> {
  return apiFetch<DbAccount[]>("/accounts");
}

export async function getAccount(id: string): Promise<DbAccount> {
  return apiFetch<DbAccount>(`/accounts/${id}`);
}

export async function createAccount(data: Partial<DbAccount>): Promise<DbAccount> {
  return apiFetch<DbAccount>("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccount(id: string, data: Partial<DbAccount>): Promise<DbAccount> {
  return apiFetch<DbAccount>(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchAccount(id: string, data: Partial<DbAccount>): Promise<DbAccount> {
  return apiFetch<DbAccount>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await apiFetch(`/accounts/${id}`, { method: "DELETE" });
}

/* ================================================================== */
/*  Contacts                                                           */
/* ================================================================== */

export async function listContacts(): Promise<DbContact[]> {
  return apiFetch<DbContact[]>("/contacts");
}

export async function getContact(id: string): Promise<DbContact> {
  return apiFetch<DbContact>(`/contacts/${id}`);
}

export async function createContact(data: Partial<DbContact>): Promise<DbContact> {
  return apiFetch<DbContact>("/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContact(id: string, data: Partial<DbContact>): Promise<DbContact> {
  return apiFetch<DbContact>(`/contacts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchContact(id: string, data: Partial<DbContact>): Promise<DbContact> {
  return apiFetch<DbContact>(`/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id: string): Promise<void> {
  await apiFetch(`/contacts/${id}`, { method: "DELETE" });
}

/* ================================================================== */
/*  Activities                                                         */
/* ================================================================== */

/**
 * The real `crm_activities` table only has 8 columns:
 *   id, type, label, date, group, entity_type, entity_id, created_at
 *
 * We store all extra rich fields (subject, description, status, priority,
 * start_date, end_date, location, attendees, …) as a JSON blob inside the
 * `group` column.  pack / unpack happen transparently in the API helpers
 * below so the rest of the frontend can keep using the full DbActivity shape.
 */

/** Flatten a rich DbActivity into the 8 real DB columns. */
function packActivityForDb(data: Partial<DbActivity>): Record<string, any> {
  const row: Record<string, any> = {};
  const extras: Record<string, any> = {};

  // Map convenience fields → real columns
  row.id = data.id;
  row.type = data.type;
  row.label = data.subject || data.label || "";
  row.date = data.start_date || data.date || "";
  row.entity_type = data.entity_type || data.related_to_type || "";
  row.entity_id = data.entity_id || data.related_to_id || "";

  // Gather everything else into `extras`
  const skip = new Set(["id", "type", "label", "date", "group", "entity_type", "entity_id", "created_at"]);
  for (const [k, v] of Object.entries(data)) {
    if (!skip.has(k) && v !== undefined) {
      extras[k] = v;
    }
  }

  row.group = Object.keys(extras).length > 0 ? JSON.stringify(extras) : "";

  // Remove undefined values
  for (const k of Object.keys(row)) {
    if (row[k] === undefined) delete row[k];
  }

  return row;
}

/** Expand a DB row back into the full DbActivity shape. */
function unpackActivityFromDb(row: Record<string, any>): DbActivity {
  let extras: Record<string, any> = {};
  if (row.group) {
    try {
      extras = JSON.parse(row.group);
    } catch {
      // group is a plain string (legacy) — keep as-is
    }
  }

  return {
    ...extras,
    id: row.id,
    type: row.type,
    label: row.label,
    date: row.date,
    group: row.group,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    created_at: row.created_at,
    // Re-map for convenience
    subject: extras.subject || row.label || "",
    start_date: extras.start_date || row.date || "",
    related_to_type: extras.related_to_type || row.entity_type || "",
    related_to_id: extras.related_to_id || row.entity_id || "",
  } as DbActivity;
}

export async function listActivities(): Promise<DbActivity[]> {
  const raw = await apiFetch<any[]>("/activities");
  return (raw || []).map(unpackActivityFromDb);
}

export async function listActivitiesByEntity(entityType: string, entityId: string): Promise<DbActivity[]> {
  const raw = await apiFetch<any[]>(`/activities/entity/${entityType}/${entityId}`);
  return (raw || []).map(unpackActivityFromDb);
}

export async function createActivity(data: Partial<DbActivity>): Promise<DbActivity> {
  const packed = packActivityForDb(data);
  const raw = await apiFetch<any>("/activities", {
    method: "POST",
    body: JSON.stringify(packed),
  });
  return unpackActivityFromDb(raw);
}

export async function patchActivity(id: string, data: Partial<DbActivity>): Promise<DbActivity> {
  // For PATCH we must merge with existing data because extra fields live in
  // the `group` JSON column.  A blind pack would overwrite everything.
  // 1. Fetch current record
  // 2. Merge patch into it
  // 3. Re-pack the full merged record
  // 4. Send only the columns that actually changed
  try {
    const currentRaw = await apiFetch<any>(`/activities/${id}`);
    const current = unpackActivityFromDb(currentRaw);

    // Merge: current values + patch values
    const merged: Record<string, any> = { ...current, ...data, id };

    // Re-pack full merged record
    const packed = packActivityForDb(merged as Partial<DbActivity>);
    delete packed.id;
    delete packed.created_at;

    const raw = await apiFetch<any>(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(packed),
    });
    return unpackActivityFromDb(raw);
  } catch (err) {
    // Fallback: try direct pack (may lose group data but won't crash)
    console.error("patchActivity merge failed, falling back:", err);
    const packed = packActivityForDb({ ...data, id });
    delete packed.id;
    const raw = await apiFetch<any>(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(packed),
    });
    return unpackActivityFromDb(raw);
  }
}

export async function deleteActivity(id: string): Promise<void> {
  await apiFetch(`/activities/${id}`, { method: "DELETE" });
}

export async function getActivity(id: string): Promise<DbActivity> {
  const raw = await apiFetch<any>(`/activities/${id}`);
  return unpackActivityFromDb(raw);
}

/* ================================================================== */
/*  Field History                                                      */
/* ================================================================== */

export async function listFieldHistory(): Promise<DbFieldHistory[]> {
  return apiFetch<DbFieldHistory[]>("/field-history");
}

export async function listFieldHistoryByEntity(entityType: string, entityId: string): Promise<DbFieldHistory[]> {
  return apiFetch<DbFieldHistory[]>(`/field-history/entity/${entityType}/${entityId}`);
}

export async function createFieldHistory(data: Partial<DbFieldHistory>): Promise<DbFieldHistory> {
  return apiFetch<DbFieldHistory>("/field-history", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ================================================================== */
/*  Opportunity Services                                               */
/* ================================================================== */

export async function listOpportunityServices(oppId: string) {
  return apiFetch<any[]>(`/opportunity-services/${oppId}`);
}

export async function replaceOpportunityServices(oppId: string, services: any[]) {
  return apiFetch<any[]>(`/opportunity-services/${oppId}`, {
    method: "PUT",
    body: JSON.stringify({ services }),
  });
}

/* ================================================================== */
/*  Opportunity Proposals                                              */
/* ================================================================== */

export async function listOpportunityProposals(oppId: string) {
  return apiFetch<any[]>(`/opportunity-proposals/opp/${oppId}`);
}

export async function createOpportunityProposal(data: any) {
  return apiFetch<any>("/opportunity-proposals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function patchOpportunityProposal(id: string, data: any) {
  return apiFetch<any>(`/opportunity-proposals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteOpportunityProposal(id: string) {
  await apiFetch(`/opportunity-proposals/${id}`, { method: "DELETE" });
}

/* ================================================================== */
/*  Seed — bulk upsert all mock data                                   */
/* ================================================================== */

export async function seedCrmData(payload: Record<string, any[]>): Promise<Record<string, { count: number; error?: string }>> {
  return apiFetch<Record<string, { count: number; error?: string }>>("/seed", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ================================================================== */
/*  Google Sheets Integration                                          */
/* ================================================================== */

export interface SheetTab {
  title: string;
  index: number;
  rowCount: number;
  colCount: number;
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  tabs: SheetTab[];
}

export interface SheetPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  spreadsheetId: string;
}

export interface SheetCrmField {
  key: string;
  label: string;
  required?: boolean;
}

export interface SheetImportResult {
  imported: number;
  total: number;
  skipped: number;
  errors: string[];
}

export interface SheetExportResult {
  exported: number;
  totalFields: number;
  message?: string;
}

/** Check if Sheets integration is working */
export async function sheetsHealthCheck(): Promise<{ status: string; hasToken: boolean }> {
  return apiFetch<{ status: string; hasToken: boolean }>("/sheets/health");
}

/** Get spreadsheet metadata (tabs list) */
export async function sheetsGetMetadata(url: string): Promise<SheetMetadata> {
  return apiFetch<SheetMetadata>("/sheets/metadata", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

/** Preview first N rows of a sheet tab */
export async function sheetsPreview(url: string, sheetName: string, maxRows = 10): Promise<SheetPreview> {
  return apiFetch<SheetPreview>("/sheets/preview", {
    method: "POST",
    body: JSON.stringify({ url, sheetName, maxRows }),
  });
}

/** Get available CRM fields for an object type */
export async function sheetsGetFields(objectType: string): Promise<SheetCrmField[]> {
  return apiFetch<SheetCrmField[]>(`/sheets/fields/${objectType}`);
}

/** Import data from a Google Sheet into CRM */
export async function sheetsImport(
  url: string,
  sheetName: string,
  objectType: string,
  columnMapping: Record<string, string>,
): Promise<SheetImportResult> {
  return apiFetch<SheetImportResult>("/sheets/import", {
    method: "POST",
    body: JSON.stringify({ url, sheetName, objectType, columnMapping }),
  });
}

/** Export CRM data to a Google Sheet */
export async function sheetsExport(
  url: string,
  sheetName: string,
  objectType: string,
  fields: string[],
): Promise<SheetExportResult> {
  return apiFetch<SheetExportResult>("/sheets/export", {
    method: "POST",
    body: JSON.stringify({ url, sheetName, objectType, fields }),
  });
}

/** Save Google Service Account key to KV store (bypasses env var limit) */
export async function sheetsConfigureKey(key: string | object): Promise<{
  status: string;
  client_email: string;
  project_id: string;
}> {
  return apiFetch<{ status: string; client_email: string; project_id: string }>(
    "/sheets/configure-key",
    {
      method: "POST",
      body: JSON.stringify({ key }),
    },
  );
}

/** Check if Google Service Account key is configured */
export async function sheetsKeyStatus(): Promise<{
  configured: boolean;
  source?: string;
  client_email?: string;
  project_id?: string;
  hint?: string;
}> {
  return apiFetch<{
    configured: boolean;
    source?: string;
    client_email?: string;
    project_id?: string;
    hint?: string;
  }>("/sheets/key-status");
}

/* ================================================================== */
/*  Mapper helpers for components                                      */
/* ================================================================== */

/** Maps a DB opportunity row (snake_case) → frontend Opportunity (camelCase) */
export function dbOpToFrontend(row: DbOpportunity) {
  return {
    id: row.id,
    name: row.name,
    company: row.company ?? "",
    value: row.value ?? 0,
    stage: row.stage as any,
    lastActivityDate: row.last_activity_date ?? "",
    comments: row.comments ?? 0,
    calls: row.calls ?? 0,
    owner: row.owner,
    closeDate: row.close_date ?? "",
    tipo: (row.tipo ?? "novo_negocio") as any,
    stageComplement: row.stage_complement ?? "",
    createdDate: row.created_at ? row.created_at.slice(0, 10) : "",
  };
}

/** Maps frontend Opportunity → DB row (snake_case) for writes */
export function frontendOpToDb(op: {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  lastActivityDate: string;
  comments: number;
  calls: number;
  owner: string;
  closeDate: string;
  tipo: string;
  stageComplement: string;
  createdDate: string;
}): Partial<DbOpportunity> {
  return {
    id: op.id,
    name: op.name,
    company: op.company,
    value: op.value,
    stage: op.stage,
    last_activity_date: op.lastActivityDate || null,
    comments: op.comments,
    calls: op.calls,
    owner: op.owner,
    close_date: op.closeDate || null,
    tipo: op.tipo,
    stage_complement: op.stageComplement || null,
  };
}

/** Maps a DB lead row → frontend Lead */
export function dbLeadToFrontend(row: DbLead) {
  return {
    id: row.id,
    name: row.name,
    lastName: row.lastname ?? "",
    role: row.role ?? "",
    company: row.company ?? "",
    stage: row.stage as any,
    stageComplement: row.stage_complement ?? "",
    qualificationProgress: row.qualification_progress ?? 0,
    lastActivityDate: row.last_activity_date ?? "",
    comments: row.comments ?? 0,
    calls: row.calls ?? 0,
    owner: row.owner,
    origin: row.origin ?? "",
  };
}

/** Maps a DB account row → frontend Account */
export function dbAccountToFrontend(row: DbAccount) {
  return {
    id: row.id,
    name: row.name,
    segment: row.segment ?? "",
    cnpj: row.cnpj ?? "",
    address: row.billing_street ? `${row.billing_street}, ${row.billing_city ?? ""}` : "",
    revenue: row.revenue ?? row.annual_revenue ?? 0,
    stage: row.stage as any,
    lastActivityDate: row.last_activity_date ?? "",
    comments: row.comments ?? 0,
    calls: row.calls ?? 0,
    owner: row.owner,
    contacts: row.contacts ?? 0,
  };
}

/** Maps a DB contact row → frontend Contact */
export function dbContactToFrontend(row: DbContact) {
  return {
    id: row.id,
    name: row.name,
    lastName: row.last_name ?? "",
    role: row.role ?? "",
    department: row.department ?? "",
    company: row.company ?? "",
    phone: row.phone ?? "",
    mobile: row.mobile ?? "",
    email: row.email,
    linkedin: row.linkedin ?? "",
    website: row.website ?? "",
    address: row.address ?? "",
    stage: (row.stage ?? "prospeccao") as any,
    owner: row.owner,
    origin: row.origin ?? "",
    birthDate: row.birth_date ?? "",
    cpf: row.cpf ?? "",
    preferredContact: row.preferred_contact ?? "",
    doNotContact: row.do_not_contact ? "Sim" : "Nao",
    tags: row.tags ?? "",
    notes: row.notes ?? "",
    account: row.account ?? "",
    lastActivityDate: row.last_activity_date ?? "",
    lastActivityDateISO: row.last_activity_date_iso ?? "",
    comments: row.comments ?? 0,
    calls: row.calls ?? 0,
    createdAt: row.created_at ? row.created_at.slice(0, 10) : "",
    updatedAt: row.updated_at ? row.updated_at.slice(0, 10) : "",
    createdBy: row.created_by ?? "",
    updatedBy: row.updated_by ?? "",
    lastViewedDate: row.last_viewed_date ?? "",
    lastReferencedDate: row.last_referenced_date ?? "",
    systemModstamp: row.system_modstamp ?? "",
    isDeleted: row.is_deleted ? "Sim" : "Nao",
    avatar: row.avatar ?? undefined,
  };
}

/* ================================================================== */
/*  Custom Fields — Definitions                                        */
/* ================================================================== */

export interface CustomFieldDef {
  key: string;
  label: string;
  fieldType: string;
  objectType: string;        // "lead" | "oportunidade" | "contato" | "conta"
  section: string;
  editable: boolean;
  required: boolean;
  visible: boolean;
  description?: string;
  options?: { value: string; label: string; color: string }[];
  formula?: string;
  formulaReturnType?: string;
  created_at?: string;
  updated_at?: string;
}

export async function listCustomFields(): Promise<CustomFieldDef[]> {
  return apiFetch<CustomFieldDef[]>("/custom-fields");
}

export async function saveCustomField(field: CustomFieldDef): Promise<CustomFieldDef> {
  return apiFetch<CustomFieldDef>("/custom-fields", {
    method: "POST",
    body: JSON.stringify(field),
  });
}

export async function deleteCustomField(key: string): Promise<void> {
  await apiFetch(`/custom-fields/${key}`, { method: "DELETE" });
}

/* ================================================================== */
/*  Custom Fields — Values per entity                                  */
/* ================================================================== */

export async function getCustomFieldValues(entityType: string, entityId: string): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>(`/custom-field-values/${entityType}/${entityId}`);
}

export async function saveCustomFieldValues(
  entityType: string,
  entityId: string,
  values: Record<string, string>,
): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>(`/custom-field-values/${entityType}/${entityId}`, {
    method: "PUT",
    body: JSON.stringify(values),
  });
}

/* ================================================================== */
/*  Native Field Config — Visibility / Required overrides              */
/* ================================================================== */

export interface FieldConfigOverride {
  visible?: boolean;
  required?: boolean;
  label?: string;
  fieldType?: string;
  description?: string;
  options?: { value: string; label: string; color: string }[];
}

export async function getFieldConfig(objectType: string): Promise<Record<string, FieldConfigOverride>> {
  return apiFetch<Record<string, FieldConfigOverride>>(`/field-config/${objectType}`);
}

export async function patchFieldConfig(
  objectType: string,
  overrides: Record<string, FieldConfigOverride>,
): Promise<Record<string, FieldConfigOverride>> {
  return apiFetch<Record<string, FieldConfigOverride>>(`/field-config/${objectType}`, {
    method: "PATCH",
    body: JSON.stringify(overrides),
  });
}

/* ================================================================== */
/*  Object Config — Per-object settings (rules, stages, etc.)          */
/* ================================================================== */

export interface ObjectConfig {
  // Rules
  autoQualify?: boolean;
  duplicateCheck?: boolean;
  requireEmail?: boolean;
  autoAssign?: boolean;
  defaultOwner?: string;
  inactivityDays?: number;
  // Pipeline stages
  stages?: { key: string; label: string; color: string }[];
  // Layout sections
  layout?: { title: string; fields: string[] }[];
  // Conversion rules
  conversionCreateContact?: boolean;
  conversionCreateAccount?: boolean;
  conversionCreateOpportunity?: boolean;
  // ── Activity-specific settings ──
  activitySyncGoogleCalendar?: boolean;
  activityAutoMeetLink?: boolean;
  activityNotifyOnAssign?: boolean;
  activityAutoLogCalls?: boolean;
  activityDefaultTimezone?: string;
  activityDefaultReminder?: string;
  activityTaskInactivityDays?: number;
  /** Per-type overrides keyed by activity type */
  activityTypeRules?: Record<string, ActivityTypeRule>;
  // Metadata
  updated_at?: string;
}

export interface ActivityTypeRule {
  enabled?: boolean;
  defaultStatus?: string;
  defaultPriority?: string;
  requiredFields?: string[];
  availableStatuses?: { key: string; label: string; color: string }[];
  /** compromisso */
  autoMeetLink?: boolean;
  defaultReminder?: string;
  defaultBusyStatus?: string;
  /** tarefa */
  defaultDueDaysOffset?: number;
  autoAssignCreator?: boolean;
  /** ligacao */
  requirePhone?: boolean;
  requireResult?: boolean;
  /** nota */
  defaultVisibility?: string;
  autoShareWithTeam?: boolean;
  /** mensagem */
  defaultChannel?: string;
  requireRecipient?: boolean;
}

export async function getObjectConfig(objectType: string): Promise<ObjectConfig | null> {
  return apiFetch<ObjectConfig | null>(`/obj-config/${objectType}`);
}

export async function patchObjectConfig(
  objectType: string,
  partial: Partial<ObjectConfig>,
): Promise<ObjectConfig> {
  return apiFetch<ObjectConfig>(`/obj-config/${objectType}`, {
    method: "PATCH",
    body: JSON.stringify(partial),
  });
}

/* ================================================================== */
/*  Team Members — from Supabase auth.users                            */
/* ================================================================== */

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  phone: string | null;
}

async function rootApiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_ROOT}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${_authToken || publicAnonKey}`, ...options?.headers },
  });
  const json = await res.json();
  if (!res.ok) {
    const errMsg = json?.error || `HTTP ${res.status}`;
    console.error(`Team API error [${path}]:`, errMsg);
    throw new Error(errMsg);
  }
  return json.data;
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const raw = await rootApiFetch<any[]>("/team/members");
  return (raw ?? []).map((m: any) => ({
    id: m.id,
    email: m.email,
    name: m.name,
    avatarUrl: m.avatar_url,
    createdAt: m.created_at,
    lastSignInAt: m.last_sign_in_at,
    emailConfirmedAt: m.email_confirmed_at,
    phone: m.phone,
  }));
}

export async function getUserRole(userId: string): Promise<string> {
  const data = await rootApiFetch<{ userId: string; role: string }>(`/team/members/${userId}/role`);
  return data.role;
}

export async function setUserRole(userId: string, role: string): Promise<void> {
  await rootApiFetch<any>(`/team/members/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

/** Upload avatar image for a user. Returns the new avatar URL. */
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_ROOT}/team/members/${userId}/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${_authToken || publicAnonKey}`,
    },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    const errMsg = json?.error || `HTTP ${res.status}`;
    console.error(`Avatar upload error [${userId}]:`, errMsg);
    throw new Error(errMsg);
  }
  return json.data.avatarUrl;
}

/* ── Permissions matrix ── */

export type PermissionLevel = "todos" | "proprios" | "nenhum";

export interface ObjectPermissions {
  exibir: PermissionLevel;
  criar: boolean;
  editar: PermissionLevel;
  excluir: PermissionLevel;
}

export type PermissionsMatrix = Record<string, Record<string, ObjectPermissions>>;

export async function getPermissions(): Promise<PermissionsMatrix | null> {
  return rootApiFetch<PermissionsMatrix | null>("/permissions");
}

export async function savePermissions(matrix: PermissionsMatrix): Promise<void> {
  await rootApiFetch<any>("/permissions", {
    method: "PUT",
    body: JSON.stringify(matrix),
  });
}

/* ================================================================== */
/*  Google Tasks — create task via Service Account impersonation        */
/* ================================================================== */

export async function createGoogleTask(params: {
  title: string;
  notes?: string;
  dueDate?: string;
  userEmail: string;
}): Promise<{ taskId: string; title: string; status: string; selfLink: string }> {
  return rootApiFetch<{ taskId: string; title: string; status: string; selfLink: string }>("/google-tasks/create", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/* ================================================================== */
/*  Teams — CRUD via kv_store                                          */
/* ================================================================== */

export interface CrmTeam {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string; // Phosphor icon name, defaults to "UsersThree"
  members: string[]; // user UUIDs
  leaderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listTeams(): Promise<CrmTeam[]> {
  const data = await rootApiFetch<CrmTeam[]>("/teams");
  return Array.isArray(data) ? data : [];
}

export async function getTeam(id: string): Promise<CrmTeam> {
  return rootApiFetch<CrmTeam>(`/teams/${id}`);
}

export async function createTeam(payload: { name: string; description?: string; color?: string; icon?: string; members?: string[]; leaderId?: string | null }): Promise<CrmTeam> {
  return rootApiFetch<CrmTeam>("/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTeam(id: string, payload: Partial<Omit<CrmTeam, "id" | "createdAt">>): Promise<CrmTeam> {
  return rootApiFetch<CrmTeam>(`/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTeam(id: string): Promise<void> {
  await rootApiFetch<any>(`/teams/${id}`, { method: "DELETE" });
}