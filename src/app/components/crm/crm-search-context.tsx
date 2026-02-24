import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

/* ── Recent record type ── */
export interface RecentRecord {
  id: string;
  label: string;         // display name
  subtitle: string;      // e.g. role · company
  objectType: "lead" | "account" | "contact" | "opportunity";
  visitedAt: number;     // Date.now()
}

const STORAGE_KEY = "crm_recent_records";
const MAX_RECENTS = 12;

function loadRecents(): RecentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentRecord[];
    return parsed.slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

function saveRecents(recents: RecentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
  } catch { /* noop */ }
}

/* ── Context value ── */
interface CrmSearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  recents: RecentRecord[];
  trackRecent: (record: RecentRecord) => void;
}

const CrmSearchContext = createContext<CrmSearchContextValue>({
  query: "",
  setQuery: () => {},
  recents: [],
  trackRecent: () => {},
});

export function CrmSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<RecentRecord[]>(loadRecents);

  const trackRecent = useCallback((record: RecentRecord) => {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.id !== record.id);
      const next = [{ ...record, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  }, []);

  return (
    <CrmSearchContext.Provider value={{ query, setQuery, recents, trackRecent }}>
      {children}
    </CrmSearchContext.Provider>
  );
}

export function useCrmSearch() {
  return useContext(CrmSearchContext);
}
