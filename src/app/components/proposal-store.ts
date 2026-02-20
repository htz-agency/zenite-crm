import type { SelectedService } from "./pricing-data";

export interface SavedProposal {
  id: string;
  clientName: string;
  notes: string;
  selectedServices: SelectedService[];
  globalDiscount: number;
  // Computed at save time
  totalMonthly: number;
  totalSetup: number;
  totalHours: number;
  comboDiscountPercent: number;
  comboLabel: string;
  grandTotal: number;
  serviceNames: string[];
  createdAt: string;
  updatedAt: string;
  status: "rascunho" | "enviada" | "aprovada" | "recusada";
  expiresAt: string;
}

const STORAGE_KEY = "zenite-price-proposals";

function generateId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "PR-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getAllProposals(): SavedProposal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getProposalById(id: string): SavedProposal | null {
  const all = getAllProposals();
  return all.find((p) => p.id === id) || null;
}

function saveAll(proposals: SavedProposal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
}

export function saveProposal(
  data: Omit<SavedProposal, "id" | "createdAt" | "updatedAt" | "expiresAt">,
  existingId?: string
): SavedProposal {
  const all = getAllProposals();
  const now = new Date();

  if (existingId) {
    const index = all.findIndex((p) => p.id === existingId);
    if (index >= 0) {
      const updated: SavedProposal = {
        ...all[index],
        ...data,
        updatedAt: formatDate(now),
      };
      all[index] = updated;
      saveAll(all);
      return updated;
    }
  }

  // Ensure unique ID
  let id = generateId();
  while (all.some((p) => p.id === id)) {
    id = generateId();
  }

  const proposal: SavedProposal = {
    ...data,
    id,
    createdAt: formatDate(now),
    updatedAt: formatDate(now),
    expiresAt: formatDate(addDays(now, 30)),
  };

  all.unshift(proposal);
  saveAll(all);
  return proposal;
}

export function deleteProposal(id: string): void {
  const all = getAllProposals().filter((p) => p.id !== id);
  saveAll(all);
}

export function duplicateProposal(id: string): SavedProposal | null {
  const original = getProposalById(id);
  if (!original) return null;
  const { id: _id, createdAt: _c, updatedAt: _u, expiresAt: _e, ...rest } = original;
  return saveProposal({
    ...rest,
    clientName: `${rest.clientName} (cópia)`,
    status: "rascunho",
  });
}

export function updateProposalStatus(id: string, status: SavedProposal["status"]): void {
  const all = getAllProposals();
  const index = all.findIndex((p) => p.id === id);
  if (index >= 0) {
    all[index].status = status;
    all[index].updatedAt = formatDate(new Date());
    saveAll(all);
  }
}
