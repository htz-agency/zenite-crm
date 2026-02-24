import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ProposalFilters {
  statuses: string[];
  monthlyMin: string;
  monthlyMax: string;
  totalMin: string;
  totalMax: string;
  implMin: string;
  implMax: string;
  hoursMin: string;
  hoursMax: string;
  serviceIds: string[];
}

export const emptyFilters: ProposalFilters = {
  statuses: [],
  monthlyMin: "",
  monthlyMax: "",
  totalMin: "",
  totalMax: "",
  implMin: "",
  implMax: "",
  hoursMin: "",
  hoursMax: "",
  serviceIds: [],
};

interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  filters: ProposalFilters;
  setFilters: (f: ProposalFilters) => void;
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  activeFilterCount: number;
  clearFilters: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  query: "",
  setQuery: () => {},
  filters: emptyFilters,
  setFilters: () => {},
  filterOpen: false,
  setFilterOpen: () => {},
  activeFilterCount: 0,
  clearFilters: () => {},
});

function countActiveFilters(f: ProposalFilters): number {
  let count = 0;
  if (f.statuses.length > 0) count++;
  if (f.monthlyMin || f.monthlyMax) count++;
  if (f.totalMin || f.totalMax) count++;
  if (f.implMin || f.implMax) count++;
  if (f.hoursMin || f.hoursMax) count++;
  if (f.serviceIds.length > 0) count++;
  return count;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ProposalFilters>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveFilters(filters);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters);
  }, []);

  return (
    <SearchContext.Provider value={{ query, setQuery, filters, setFilters, filterOpen, setFilterOpen, activeFilterCount, clearFilters }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
