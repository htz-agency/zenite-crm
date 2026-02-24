import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { SelectedService } from "./pricing-data";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b0da2601`;

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
});

// ─── Types matching DB schema ───

export interface DbProposalService {
  id?: string;
  proposal_id?: string;
  service_id: string;
  complexity: string;
  recurrence: string;
  seniority: string;
  allocation: string;
  include_impl: boolean;
  quantity: number;
  computed_monthly: number;
  computed_impl: number;
  computed_hours: number;
}

export interface DbProposal {
  id: string;
  client_name: string;
  status: "rascunho" | "enviada" | "aprovada" | "recusada";
  notes: string;
  global_discount: number;
  combo_discount_percent: number;
  combo_label: string;
  total_monthly: number;
  total_impl: number;
  total_hours: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
  tag: string | null;
  price_proposal_services?: DbProposalService[];
}

export interface DashboardStats {
  total: number;
  enviadas: number;
  aprovadas: number;
  pendentes: number;
  receitaEstimada: number;
}

// ─── API functions ───

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { ...headers(), ...options?.headers },
      });

      // Retry on server errors (5xx) which may be cold-start / transient
      if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
        const delay = 1000 * (attempt + 1);
        console.warn(`Price API retry ${attempt + 1}/${MAX_RETRIES} for [${path}] (HTTP ${res.status}) in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      const json = await res.json();

      if (!res.ok) {
        const errMsg = json?.error || `HTTP ${res.status}`;
        console.error(`API error [${path}]:`, errMsg);
        throw new Error(errMsg);
      }

      return json.data;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isNetworkError =
        err instanceof TypeError ||
        err?.name === "AbortError" ||
        (err?.message && /failed to fetch|network|aborted|timeout|load failed/i.test(err.message));
      if (isNetworkError && attempt < MAX_RETRIES - 1) {
        const delay = 1000 * (attempt + 1);
        console.warn(`Price API retry ${attempt + 1}/${MAX_RETRIES} for [${path}] in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError!;
}

// Proposals
export async function listProposals(): Promise<DbProposal[]> {
  return apiFetch<DbProposal[]>("/proposals");
}

export async function getProposal(id: string): Promise<DbProposal> {
  return apiFetch<DbProposal>(`/proposals/${id}`);
}

export async function createProposal(payload: {
  id: string;
  client_name: string;
  status: string;
  notes: string;
  global_discount: number;
  combo_discount_percent: number;
  combo_label: string;
  total_monthly: number;
  total_impl: number;
  total_hours: number;
  grand_total: number;
  services: DbProposalService[];
}): Promise<DbProposal> {
  return apiFetch<DbProposal>("/proposals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProposal(
  id: string,
  payload: {
    client_name?: string;
    status?: string;
    notes?: string;
    global_discount?: number;
    combo_discount_percent?: number;
    combo_label?: string;
    total_monthly?: number;
    total_impl?: number;
    total_hours?: number;
    grand_total?: number;
    services?: DbProposalService[];
  }
): Promise<DbProposal> {
  return apiFetch<DbProposal>(`/proposals/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateProposalStatus(
  id: string,
  status: string
): Promise<void> {
  await apiFetch(`/proposals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateProposalTag(
  id: string,
  tags: string[]
): Promise<void> {
  await apiFetch(`/proposals/${id}/tag`, {
    method: "PATCH",
    body: JSON.stringify({ tag: JSON.stringify(tags) }),
  });
}

export async function deleteProposalApi(id: string): Promise<void> {
  await apiFetch(`/proposals/${id}`, {
    method: "DELETE",
  });
}

export async function duplicateProposalApi(
  id: string
): Promise<DbProposal> {
  return apiFetch<DbProposal>(`/proposals/${id}/duplicate`, {
    method: "POST",
  });
}

// Proposal CRM Links
export interface ProposalCrmLinks {
  accountId?: string | null;
  accountName?: string;
  contactId?: string | null;
  contactName?: string;
  opportunityId?: string | null;
  opportunityName?: string;
}

export async function getProposalCrmLinks(proposalId: string): Promise<ProposalCrmLinks> {
  return apiFetch<ProposalCrmLinks>(`/proposals/${proposalId}/crm-links`);
}

export async function saveProposalCrmLinks(proposalId: string, links: ProposalCrmLinks): Promise<ProposalCrmLinks> {
  return apiFetch<ProposalCrmLinks>(`/proposals/${proposalId}/crm-links`, {
    method: "PUT",
    body: JSON.stringify(links),
  });
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}

// Services
export async function seedServices(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/seed-services", { method: "POST" });
}

export async function listDbServices(): Promise<any[]> {
  return apiFetch<any[]>("/services");
}

// Create a new service in the DB
export interface CreateServicePayload {
  id: string;
  name: string;
  service_group: string;
  description: string;
  base_price: number;
  impl_price: number;
  hours_estimate: number;
  is_ads: boolean;
  complexity_basico: number;
  complexity_intermediario: number;
  complexity_avancado: number;
}

export async function createService(payload: CreateServicePayload): Promise<any> {
  return apiFetch<any>("/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function debugServiceColumns(): Promise<any> {
  const res = await fetch(`${BASE}/debug/price-services-columns`, {
    headers: headers(),
  });
  return res.json();
}

export async function debugProposalsTables(): Promise<any> {
  const res = await fetch(`${BASE}/debug/proposals-tables`, {
    headers: headers(),
  });
  return res.json();
}
// ─── Helpers: convert between frontend SelectedService and DB format ───

export function selectedToDb(
  selected: SelectedService,
  computed: { monthly: number; impl: number; hours: number }
): DbProposalService {
  return {
    service_id: selected.serviceId,
    complexity: selected.complexity,
    recurrence: selected.recurrence,
    seniority: selected.seniority,
    allocation: selected.allocation,
    include_impl: selected.includeImpl,
    quantity: selected.quantity,
    computed_monthly: computed.monthly,
    computed_impl: computed.impl,
    computed_hours: computed.hours,
  };
}

export function dbToSelected(dbSvc: DbProposalService): SelectedService {
  return {
    serviceId: dbSvc.service_id,
    complexity: dbSvc.complexity as SelectedService["complexity"],
    recurrence: dbSvc.recurrence as SelectedService["recurrence"],
    includeImpl: dbSvc.include_impl,
    quantity: dbSvc.quantity,
    seniority: dbSvc.seniority as SelectedService["seniority"],
    allocation: dbSvc.allocation as SelectedService["allocation"],
  };
}

// Generate unique proposal ID
export function generateProposalId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "PR-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Public Proposal Sharing ───

/** Base URL for public-facing links — uses current domain automatically */
function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://zenite.htz.agency"; // fallback for SSR/tests
}

/**
 * Build the public proposal URL.
 * Uses the current domain so links work on any environment:
 *   - Figma Make preview → preview domain
 *   - Production Vercel  → zenite.htz.agency
 */
export function buildPublicUrl(token: string): string {
  return `${getBaseUrl()}/p/${token}`;
}

export interface ShareInfo {
  token: string;
  proposalId: string;
}

export async function createShareLink(proposalId: string): Promise<ShareInfo> {
  return apiFetch<ShareInfo>(`/proposals/${proposalId}/share`, {
    method: "POST",
  });
}

export async function getShareLink(proposalId: string): Promise<ShareInfo | null> {
  return apiFetch<ShareInfo | null>(`/proposals/${proposalId}/share`);
}

export async function revokeShareLink(proposalId: string): Promise<void> {
  await apiFetch(`/proposals/${proposalId}/share`, { method: "DELETE" });
}

export async function getPublicProposal(token: string): Promise<DbProposal> {
  return apiFetch<DbProposal>(`/public/proposal/${token}`);
}

export async function respondToProposal(token: string, response: "aprovada" | "recusada"): Promise<void> {
  await apiFetch(`/public/proposal/${token}/respond`, {
    method: "PATCH",
    body: JSON.stringify({ response }),
  });
}