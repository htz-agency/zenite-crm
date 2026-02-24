/**
 * CRM Global Search Box — dropdown autocomplete com recentes,
 * match parcial/não‑adjacente, agrupamento por objeto, teclado.
 *
 * Configurável:
 *   MAX_AUTOCOMPLETE  — total de resultados no dropdown (padrão 10)
 *   MAX_PER_OBJECT    — limite por tipo de objeto (padrão 3)
 *   SEARCHABLE_OBJECTS — quais objetos aparecem
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { createPortal } from "react-dom";
import {
  MagnifyingGlass,
  X,
  Heart,
  Building,
  IdentificationCard,
  SketchLogo,
  ClockCounterClockwise,
  ArrowRight,
  MagnifyingGlassPlus,
  ArrowElbowDownLeft,
} from "@phosphor-icons/react";
import { useCrmSearch, type RecentRecord } from "./crm-search-context";
import {
  listLeads,
  listAccounts,
  listContacts,
  listOpportunities,
  dbLeadToFrontend,
  dbAccountToFrontend,
  dbContactToFrontend,
  dbOpToFrontend,
} from "./crm-api";

/* ── Config ── */
const MAX_AUTOCOMPLETE = 10;
const MAX_PER_OBJECT = 3;

type CrmObjectType = "lead" | "account" | "contact" | "opportunity";

const SEARCHABLE_OBJECTS: CrmObjectType[] = ["lead", "account", "contact", "opportunity"];

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const OBJ_CONFIG: Record<CrmObjectType, {
  label: string;
  pluralLabel: string;
  icon: React.ComponentType<any>;
  iconBg: string;
  iconColor: string;
  routePrefix: string;
}> = {
  lead: {
    label: "Lead",
    pluralLabel: "Leads",
    icon: Heart,
    iconBg: "#feedca",
    iconColor: "#eac23d",
    routePrefix: "/crm/leads",
  },
  account: {
    label: "Conta",
    pluralLabel: "Contas",
    icon: Building,
    iconBg: "#d9f8ef",
    iconColor: "#3ccea7",
    routePrefix: "/crm/contas",
  },
  contact: {
    label: "Contato",
    pluralLabel: "Contatos",
    icon: IdentificationCard,
    iconBg: "#ffedeb",
    iconColor: "#ff8c76",
    routePrefix: "/crm/contatos",
  },
  opportunity: {
    label: "Oportunidade",
    pluralLabel: "Oportunidades",
    icon: SketchLogo,
    iconBg: "#dcf0ff",
    iconColor: "#07abde",
    routePrefix: "/crm/oportunidades",
  },
};

/* ── Unified search item ── */
interface SearchItem {
  id: string;
  label: string;
  subtitle: string;
  objectType: CrmObjectType;
  score: number; // for ranking
}

/* ── Fuzzy / non-adjacent matching ── */
function fuzzyMatch(text: string, queryTokens: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) {
      // Exact substring match
      score += 10;
      // Bonus if starts with the token
      if (lower.startsWith(token)) score += 5;
    } else {
      // Non‑adjacent: check if all chars appear in order
      let ti = 0;
      for (let i = 0; i < lower.length && ti < token.length; i++) {
        if (lower[i] === token[ti]) ti++;
      }
      if (ti === token.length) {
        score += 3; // weaker match
      } else {
        return 0; // this token doesn't match at all → whole query fails
      }
    }
  }
  return score;
}

function matchItem(item: SearchItem, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const labelScore = fuzzyMatch(item.label, queryTokens) * 2;
  const subtitleScore = fuzzyMatch(item.subtitle, queryTokens);
  const idScore = fuzzyMatch(item.id, queryTokens) * 1.5;
  return labelScore + subtitleScore + idScore;
}

/* ── Data loading ── */
function useAllCrmItems(): { items: SearchItem[]; loaded: boolean } {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const allItems: SearchItem[] = [];

      const [dbLeads, dbAccounts, dbContacts, dbOps] = await Promise.allSettled([
        listLeads(),
        listAccounts(),
        listContacts(),
        listOpportunities(),
      ]);

      if (dbLeads.status === "fulfilled") {
        for (const r of dbLeads.value) {
          if (r.stage_complement === "convertido") continue; // hide converted leads
          const f = dbLeadToFrontend(r);
          allItems.push({
            id: f.id,
            label: `${f.name} ${f.lastName}`.trim(),
            subtitle: `${f.role} · ${f.company}`,
            objectType: "lead",
            score: 0,
          });
        }
      }
      if (dbAccounts.status === "fulfilled") {
        for (const r of dbAccounts.value) {
          const f = dbAccountToFrontend(r);
          allItems.push({
            id: f.id,
            label: f.name,
            subtitle: f.segment,
            objectType: "account",
            score: 0,
          });
        }
      }
      if (dbContacts.status === "fulfilled") {
        for (const r of dbContacts.value) {
          const f = dbContactToFrontend(r);
          allItems.push({
            id: f.id,
            label: `${f.name} ${f.lastName}`,
            subtitle: `${f.role} · ${f.company}`,
            objectType: "contact",
            score: 0,
          });
        }
      }
      if (dbOps.status === "fulfilled") {
        for (const r of dbOps.value) {
          const f = dbOpToFrontend(r);
          allItems.push({
            id: f.id,
            label: f.name,
            subtitle: f.company,
            objectType: "opportunity",
            score: 0,
          });
        }
      }

      // If DB returned nothing, add mock data so the dropdown isn't empty
      if (allItems.length === 0) {
        allItems.push(
          { id: "LD-A1B2", label: "Ana Carolina", subtitle: "Diretora de Marketing · Empresa Alpha", objectType: "lead", score: 0 },
          { id: "LD-C3D4", label: "Bruno Mendes", subtitle: "CEO · Beta Solutions", objectType: "lead", score: 0 },
          { id: "LD-E5F6", label: "Carlos Eduardo", subtitle: "Gerente de compras · Gamma Corp", objectType: "lead", score: 0 },
          { id: "AC-A1B2", label: "XPTO Company", subtitle: "Tecnologia", objectType: "account", score: 0 },
          { id: "AC-C3D4", label: "Beta Solutions", subtitle: "Consultoria", objectType: "account", score: 0 },
          { id: "AC-E5F6", label: "Gamma Corp", subtitle: "Indústria", objectType: "account", score: 0 },
          { id: "CT-A1B2", label: "Ana Carolina", subtitle: "Diretora de Marketing · Empresa Alpha", objectType: "contact", score: 0 },
          { id: "CT-C3D4", label: "Bruno Mendes", subtitle: "CEO · Beta Solutions", objectType: "contact", score: 0 },
          { id: "OP-A1B2", label: "Projeto Alpha", subtitle: "XPTO Company", objectType: "opportunity", score: 0 },
          { id: "OP-C3D4", label: "Expansão Beta", subtitle: "Beta Solutions", objectType: "opportunity", score: 0 },
          { id: "OP-E5F6", label: "Migração Gamma", subtitle: "Gamma Corp", objectType: "opportunity", score: 0 },
        );
      }

      if (!cancelled) {
        setItems(allItems);
        setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { items, loaded };
}

/* ── Grouped results for display ── */
interface GroupedResults {
  objectType: CrmObjectType;
  items: SearchItem[];
  total: number; // total matches (before MAX_PER_OBJECT)
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function CrmGlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { query, setQuery, recents, trackRecent } = useCrmSearch();
  const { items: allItems, loaded } = useAllCrmItems();

  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const isOnResults = location.pathname === "/crm/resultados";

  /* ── Compute dropdown position via portal ── */
  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 420),
    });
  }, []);

  useEffect(() => {
    if (open) {
      updatePos();
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
      return () => {
        window.removeEventListener("scroll", updatePos, true);
        window.removeEventListener("resize", updatePos);
      };
    }
  }, [open, updatePos]);

  /* ── Build autocomplete results ── */
  const queryTokens = useMemo(() => {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }, [query]);

  const hasQuery = queryTokens.length > 0;

  const grouped: GroupedResults[] = useMemo(() => {
    if (!hasQuery) return [];

    // Score all items
    const scored = allItems
      .filter((it) => SEARCHABLE_OBJECTS.includes(it.objectType))
      .map((it) => ({ ...it, score: matchItem(it, queryTokens) }))
      .filter((it) => it.score > 0)
      .sort((a, b) => b.score - a.score);

    // Group by object type, respect MAX_PER_OBJECT
    const groups: GroupedResults[] = [];
    let totalShown = 0;

    for (const objType of SEARCHABLE_OBJECTS) {
      if (totalShown >= MAX_AUTOCOMPLETE) break;
      const matches = scored.filter((it) => it.objectType === objType);
      if (matches.length === 0) continue;
      const remaining = MAX_AUTOCOMPLETE - totalShown;
      const limit = Math.min(MAX_PER_OBJECT, remaining);
      groups.push({
        objectType: objType,
        items: matches.slice(0, limit),
        total: matches.length,
      });
      totalShown += Math.min(matches.length, limit);
    }

    return groups;
  }, [allItems, queryTokens, hasQuery]);

  const totalMatchCount = grouped.reduce((s, g) => s + g.total, 0);

  /* ── Flat list for keyboard nav ── */
  const flatItems: Array<{ type: "item"; item: SearchItem } | { type: "action"; key: string }> = useMemo(() => {
    const list: Array<{ type: "item"; item: SearchItem } | { type: "action"; key: string }> = [];

    if (hasQuery) {
      for (const g of grouped) {
        for (const item of g.items) {
          list.push({ type: "item", item });
        }
      }
      // "Ver todos" action at the bottom
      if (totalMatchCount > 0) {
        list.push({ type: "action", key: "see_all" });
      }
    } else {
      // Recents
      for (const r of recents.slice(0, 6)) {
        list.push({ type: "item", item: { id: r.id, label: r.label, subtitle: r.subtitle, objectType: r.objectType, score: 0 } });
      }
    }

    return list;
  }, [hasQuery, grouped, recents, totalMatchCount]);

  /* ── Keyboard ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < flatItems.length) {
        const entry = flatItems[highlightIdx];
        if (entry.type === "item") {
          selectItem(entry.item);
        } else {
          goToResults();
        }
      } else if (hasQuery) {
        goToResults();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIdx(-1);
  }, [query]);

  /* ── Actions ── */
  const selectItem = (item: SearchItem) => {
    trackRecent({
      id: item.id,
      label: item.label,
      subtitle: item.subtitle,
      objectType: item.objectType,
      visitedAt: Date.now(),
    });
    setOpen(false);
    const cfg = OBJ_CONFIG[item.objectType];
    // Contacts open in the side panel on the list page (no dedicated :id route)
    if (item.objectType === "contact") {
      navigate(`${cfg.routePrefix}`);
    } else {
      navigate(`${cfg.routePrefix}/${item.id}`);
    }
  };

  const goToResults = () => {
    setOpen(false);
    navigate("/crm/resultados");
  };

  /* ── Click outside ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Clear ── */
  const handleClear = () => {
    setQuery("");
    setOpen(false);
    if (isOnResults) navigate("/crm");
  };

  /* ── Render dropdown items ── */
  const showRecents = !hasQuery && recents.length > 0;
  const showResults = hasQuery && grouped.length > 0;
  const showEmpty = hasQuery && grouped.length === 0 && loaded;
  const showDropdown = open && (showRecents || showResults || showEmpty);

  let flatIdx = 0; // tracks position in flatItems for highlight

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        {/* Search bar pill */}
        <div className="relative flex items-center justify-between w-full h-[40px] px-[10px] bg-[#DDE3EC] rounded-full">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center shrink-0 size-[28px]">
              <MagnifyingGlass size={16} weight="bold" className="text-[#4E6987]" />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Pesquisar..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-body text-[#122232] placeholder-[#4E6987] w-full"
              style={fontFeature}
            />
          </div>
          {query && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center shrink-0 size-[28px] rounded-full hover:bg-[#C8CFDB] transition-colors"
            >
              <X size={12} weight="bold" className="text-[#4E6987]" />
            </button>
          )}
          {/* Inner shadow overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
          />
        </div>
      </div>

      {/* ── Dropdown via Portal ── */}
      {showDropdown && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999]"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
          }}
        >
          <div
            className="bg-white backdrop-blur-[50px] rounded-[16px] overflow-hidden flex flex-col max-h-[420px]"
            style={{
              boxShadow: "0px 8px 24px 0px rgba(18,34,50,0.16), 0px 0px 0px 0.5px rgba(200,207,219,0.5)",
            }}
          >
            {/* ── Recents (no query) ── */}
            {showRecents && (
              <div className="flex flex-col py-[6px]">
                <div className="flex items-center gap-[6px] px-[16px] pt-[8px] pb-[4px]">
                  <ClockCounterClockwise size={12} weight="bold" className="text-[#98989d]" />
                  <span
                    className="text-[#98989d] uppercase"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                  >
                    Recentes
                  </span>
                </div>
                {recents.slice(0, 6).map((r) => {
                  const cfg = OBJ_CONFIG[r.objectType];
                  const Icon = cfg.icon;
                  const idx = flatIdx++;
                  const isHighlighted = idx === highlightIdx;
                  return (
                    <button
                      key={r.id}
                      onClick={() => selectItem({ id: r.id, label: r.label, subtitle: r.subtitle, objectType: r.objectType, score: 0 })}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`flex items-center gap-[10px] px-[12px] py-[7px] mx-[6px] rounded-[10px] text-left cursor-pointer transition-colors ${
                        isHighlighted ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"
                      }`}
                    >
                      <div
                        className="flex items-center justify-center shrink-0 size-[28px] rounded-[6px]"
                        style={{ backgroundColor: cfg.iconBg }}
                      >
                        <Icon size={14} weight="duotone" style={{ color: cfg.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[#28415c] truncate"
                          style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                        >
                          {r.label}
                        </p>
                        <p
                          className="text-[#98989d] truncate"
                          style={{ fontSize: 10, letterSpacing: -0.2, ...fontFeature }}
                        >
                          {cfg.label} · {r.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Search results ── */}
            {showResults && (
              <div className="flex flex-col py-[6px] overflow-y-auto">
                {grouped.map((group) => {
                  const cfg = OBJ_CONFIG[group.objectType];
                  const Icon = cfg.icon;
                  return (
                    <div key={group.objectType}>
                      {/* Group header */}
                      <div className="flex items-center gap-[6px] px-[16px] pt-[8px] pb-[4px]">
                        <Icon size={12} weight="bold" style={{ color: cfg.iconColor }} />
                        <span
                          className="uppercase"
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: cfg.iconColor, ...fontFeature }}
                        >
                          {cfg.pluralLabel}
                        </span>
                        {group.total > group.items.length && (
                          <span
                            className="text-[#98989d]"
                            style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.3, ...fontFeature }}
                          >
                            ({group.total})
                          </span>
                        )}
                      </div>
                      {/* Items */}
                      {group.items.map((item) => {
                        const idx = flatIdx++;
                        const isHighlighted = idx === highlightIdx;
                        return (
                          <button
                            key={item.id}
                            onClick={() => selectItem(item)}
                            onMouseEnter={() => setHighlightIdx(idx)}
                            className={`flex items-center gap-[10px] px-[12px] py-[7px] mx-[6px] rounded-[10px] text-left cursor-pointer transition-colors w-[calc(100%-12px)] ${
                              isHighlighted ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"
                            }`}
                          >
                            <div
                              className="flex items-center justify-center shrink-0 size-[28px] rounded-[6px]"
                              style={{ backgroundColor: cfg.iconBg }}
                            >
                              <Icon size={14} weight="duotone" style={{ color: cfg.iconColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[#28415c] truncate leading-[16px]"
                                style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                              >
                                <HighlightText text={item.label} tokens={queryTokens} />
                              </p>
                              <p
                                className="text-[#98989d] truncate leading-[13px]"
                                style={{ fontSize: 10, letterSpacing: -0.2, ...fontFeature }}
                              >
                                {item.subtitle}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {/* "Ver todos os resultados" footer */}
                {totalMatchCount > 0 && (() => {
                  const idx = flatIdx++;
                  const isHighlighted = idx === highlightIdx;
                  return (
                    <button
                      onClick={goToResults}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`flex items-center gap-[8px] px-[16px] py-[10px] mt-[2px] border-t border-[#eef0f4] text-left cursor-pointer transition-colors ${
                        isHighlighted ? "bg-[#f6f7f9]" : "hover:bg-[#f6f7f9]"
                      }`}
                    >
                      <MagnifyingGlassPlus size={14} weight="bold" className="text-[#07abde]" />
                      <span
                        className="text-[#07abde]"
                        style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
                      >
                        Ver todos os {totalMatchCount} resultados
                      </span>
                      <span className="flex-1" />
                      <span
                        className="flex items-center gap-[3px] text-[#C8CFDB]"
                        style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}
                      >
                        Enter <ArrowElbowDownLeft size={10} weight="bold" />
                      </span>
                    </button>
                  );
                })()}
              </div>
            )}

            {/* ── Empty state ── */}
            {showEmpty && (
              <div className="flex flex-col items-center py-[24px] px-[16px]">
                <MagnifyingGlass size={24} weight="duotone" className="text-[#C8CFDB] mb-2" />
                <p
                  className="text-[#4E6987] text-center"
                  style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                >
                  Nenhum resultado para "<span className="text-[#28415c] font-semibold">{query}</span>"
                </p>
                <p
                  className="text-[#98989d] text-center mt-1"
                  style={{ fontSize: 11, letterSpacing: -0.2, ...fontFeature }}
                >
                  Tente termos diferentes ou pressione Enter para busca completa
                </p>
              </div>
            )}

            {/* ── Focus empty (no recents, no query) ── */}
            {!hasQuery && recents.length === 0 && (
              <div className="flex flex-col items-center py-[20px] px-[16px]">
                <MagnifyingGlass size={20} weight="duotone" className="text-[#C8CFDB] mb-2" />
                <p
                  className="text-[#98989d] text-center"
                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                >
                  Pesquise leads, contas, contatos ou oportunidades
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ── Text highlight ── */
function HighlightText({ text, tokens }: { text: string; tokens: string[] }) {
  if (tokens.length === 0) return <>{text}</>;

  // Build regex for all tokens
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = tokens.some((t) => part.toLowerCase() === t);
        return isMatch ? (
          <span key={i} className="text-[#07abde] font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}