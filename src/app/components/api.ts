import { projectId, publicAnonKey } from "../../../utils/supabase/info";

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

// ─── API fetch utility with retry ───

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { ...headers(), ...options?.headers },
      });

      if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
        const delay = 1000 * (attempt + 1);
        console.warn(`API retry ${attempt + 1}/${MAX_RETRIES} for [${path}] (HTTP ${res.status}) in ${delay}ms`);
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
        console.warn(`API retry ${attempt + 1}/${MAX_RETRIES} for [${path}] in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError!;
}

// ─── Read-only API functions consumed by CRM ───
// Full CRUD lives in Zenite Price (price.htz.agency)

/** List all proposals (used by CRM ProposalPicker) */
export async function listProposals(): Promise<DbProposal[]> {
  return apiFetch<DbProposal[]>("/proposals");
}

/** Get proposals linked to a specific CRM entity */
export async function getProposalsByCrm(params: { accountId?: string; opportunityId?: string; contactId?: string }): Promise<DbProposal[]> {
  const searchParams = new URLSearchParams();
  if (params.accountId) searchParams.set("accountId", params.accountId);
  if (params.opportunityId) searchParams.set("opportunityId", params.opportunityId);
  if (params.contactId) searchParams.set("contactId", params.contactId);
  return apiFetch<DbProposal[]>(`/proposals/by-crm?${searchParams.toString()}`);
}

/** List service catalog (used by CRM TabServices) */
export async function listDbServices(): Promise<any[]> {
  return apiFetch<any[]>("/services");
}