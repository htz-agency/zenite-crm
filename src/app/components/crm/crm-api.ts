/**
 * CRM Frontend API Client
 *
 * Communicates with /crm/* server routes.
 * Handles camelCase ↔ snake_case mapping between frontend and DB.
 */

import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b0da2601/crm`;

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
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
        console.warn(`CRM API retry ${attempt + 1}/${MAX_RETRIES} for [${path}] in ${delay}ms`);
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
  type: string;
  label: string | null;
  date: string | null;
  group: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
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

export async function listActivities(): Promise<DbActivity[]> {
  return apiFetch<DbActivity[]>("/activities");
}

export async function listActivitiesByEntity(entityType: string, entityId: string): Promise<DbActivity[]> {
  return apiFetch<DbActivity[]>(`/activities/entity/${entityType}/${entityId}`);
}

export async function createActivity(data: Partial<DbActivity>): Promise<DbActivity> {
  return apiFetch<DbActivity>("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
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
  // Metadata
  updated_at?: string;
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