/**
 * OpportunitySearchField — search & link CRM opportunities.
 * Follows the same interaction pattern as AccountSearchField / ContactSearchField.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  SketchLogo,
  PencilSimple,
  MagnifyingGlass,
  X,
  ArrowSquareOut,
  LinkBreak,
  CircleNotch,
  Check,
} from "@phosphor-icons/react";
import { listOpportunities, type DbOpportunity } from "./crm-api";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface OpportunitySearchFieldProps {
  /** Label shown above the value */
  label?: string;
  /** Display name of the currently linked opportunity */
  value: string;
  /** Raw opportunity ID (OP-XXXX) — used for navigation link */
  opportunityId: string | null;
  /** Called when the user selects a different opportunity */
  onSelect?: (opportunityId: string, opportunityName: string) => void;
  /** Called when the user unlinks the opportunity */
  onUnlink?: () => void;
  /** Navigate to opportunity detail */
  onNavigate?: (opportunityId: string) => void;
  className?: string;
}

/* ================================================================== */
/*  Styles (matching EditableField palette)                            */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  lineHeight: "14px",
  fontWeight: 500,
  letterSpacing: 0.8,
  ...fontFeature,
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: "20px",
  fontWeight: 500,
  ...fontFeature,
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function OpportunitySearchField({
  label = "OPORTUNIDADE",
  value,
  opportunityId,
  onSelect,
  onUnlink,
  onNavigate,
  className = "",
}: OpportunitySearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [opportunities, setOpportunities] = useState<DbOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Portal dropdown position ── */
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateDropdownPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 2,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  /* ── Fetch opportunities once when dropdown opens ── */
  const fetchOpportunities = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const data = await listOpportunities();
      setOpportunities(data);
      setFetched(true);
    } catch (err) {
      console.error("OpportunitySearchField: error fetching opportunities:", err);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  const openDropdown = useCallback(() => {
    setOpen(true);
    setQuery("");
    updateDropdownPos();
    fetchOpportunities();
  }, [fetchOpportunities, updateDropdownPos]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  /* ── Click outside ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeDropdown]);

  /* ── Reposition on scroll / resize while open ── */
  useEffect(() => {
    if (!open) return;
    const reposition = () => updateDropdownPos();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, updateDropdownPos]);

  /* ── Auto-focus search input ── */
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  /* ── Filtered results ── */
  const q = query.toLowerCase().trim();
  const filtered = q
    ? opportunities.filter((o) => {
        return (
          o.name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.company ?? "").toLowerCase().includes(q) ||
          (o.stage ?? "").toLowerCase().includes(q)
        );
      })
    : opportunities;

  const handleSelect = (opp: DbOpportunity) => {
    onSelect?.(opp.id, opp.name);
    closeDropdown();
  };

  const handleUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnlink?.();
    closeDropdown();
  };

  /* ── Stage colour ── */
  const stageColor = (stage: string) => {
    const s = stage.toLowerCase();
    if (s.includes("ganha") || s.includes("won")) return "text-[#3ccea7]";
    if (s.includes("perdida") || s.includes("lost")) return "text-[#f56233]";
    return "text-[#98989d]";
  };

  /* ── Derived styles ── */
  const isIdle = !open;
  const border = open ? "border-[#07abde]" : "border-transparent";
  const pad = open ? "p-[5px]" : "p-[6px]";
  const hoverBg = isIdle ? "hover:bg-[#f6f7f9]" : "";
  const labelColor = open ? "text-[#07abde]" : "text-[#98989d]";
  const valueColor = "text-[#4e6987]";

  return (
    <div
      ref={containerRef}
      onClick={() => { if (isIdle) openDropdown(); }}
      className={`group/field relative flex flex-col gap-0 rounded-[8px] transition-all duration-150 border ${border} ${pad} ${hoverBg} ${isIdle ? "cursor-pointer" : ""} ${className}`}
    >
      {/* ── Label ── */}
      <div className="flex items-center gap-[2px]">
        <span className={`${labelColor} uppercase block`} style={labelStyle}>
          {label}
        </span>
      </div>

      {/* ── Value row ── */}
      <div className="flex items-center gap-[6px] min-w-0 overflow-hidden min-h-[22px]">
        <SketchLogo size={14} weight="duotone" className={isIdle ? "text-[#98989d]" : "text-[#4e6987]"} />

        {open ? (
          /* Search input */
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={value || "Buscar oportunidade…"}
            className="text-[#4e6987] bg-transparent outline-none flex-1 min-w-0"
            style={valueStyle}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeDropdown();
            }}
          />
        ) : (
          /* Display value */
          <span className={`${valueColor} truncate text-[#07abde]`} style={valueStyle}>
            {value || "—"}
          </span>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && dropdownPos && (
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white rounded-[8px] border border-[#dde3ec] shadow-lg max-h-[220px] overflow-y-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            {/* Search hint */}
            <div className="flex items-center gap-[6px] px-[10px] py-[6px] border-b border-[#f0f2f5]">
              <MagnifyingGlass size={12} weight="bold" className="text-[#98989d] shrink-0" />
              <span className="text-[#98989d] text-[11px]" style={fontFeature}>
                {loading ? "Carregando oportunidades…" : `${filtered.length} oportunidade${filtered.length !== 1 ? "s" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`}
              </span>
              {loading && <CircleNotch size={12} weight="bold" className="text-[#07abde] animate-spin" />}
            </div>

            {/* Unlink option */}
            {opportunityId && (
              <button
                onClick={handleUnlink}
                className="w-full flex items-center gap-[8px] px-[10px] py-[7px] hover:bg-[#fff5f5] transition-colors cursor-pointer text-left"
              >
                <LinkBreak size={14} weight="duotone" className="text-[#f56233] shrink-0" />
                <span className="text-[#f56233] text-[12px] font-medium" style={fontFeature}>
                  Remover vínculo
                </span>
              </button>
            )}

            {/* Opportunity list */}
            {!loading && filtered.length === 0 && (
              <div className="px-[10px] py-[12px] text-center">
                <span className="text-[#98989d] text-[12px]" style={fontFeature}>
                  Nenhuma oportunidade encontrada
                </span>
              </div>
            )}

            {filtered.map((opp) => {
              const isCurrent = opp.id === opportunityId;
              return (
                <button
                  key={opp.id}
                  onClick={() => handleSelect(opp)}
                  className={`w-full flex items-center gap-[8px] px-[10px] py-[7px] transition-colors cursor-pointer text-left ${
                    isCurrent ? "bg-[#d9f8ef]" : "hover:bg-[#f6f7f9]"
                  }`}
                >
                  <SketchLogo size={14} weight="duotone" className={isCurrent ? "text-[#3ccea7] shrink-0" : "text-[#98989d] shrink-0"} />
                  <span className={`text-[10px] shrink-0 ${isCurrent ? "text-[#083226]" : "text-[#98989d]"}`} style={{ ...fontFeature, fontFamily: "'DM Mono', monospace" }}>
                    {opp.id}
                  </span>
                  <span className={`text-[12px] font-medium truncate ${isCurrent ? "text-[#083226]" : "text-[#4e6987]"}`} style={fontFeature}>
                    {opp.name}
                  </span>
                  {opp.stage && (
                    <span
                      className={`text-[10px] truncate ml-auto shrink-0 ${isCurrent ? "text-[#083226]/60" : stageColor(opp.stage)}`}
                      style={fontFeature}
                    >
                      {opp.stage}
                    </span>
                  )}
                  {isCurrent && (
                    <Check size={14} weight="bold" className="text-[#3ccea7] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      )}

      {/* ── Action buttons (right) ── */}
      <div className="absolute right-[5px] top-[10px] flex items-center gap-[2px]">
        {/* Open — navigate to linked opportunity */}
        {isIdle && opportunityId && onNavigate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(opportunityId);
            }}
            className="hidden group-hover/field:flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] hover:bg-[#c4e4fa] cursor-pointer transition-colors"
            title="Abrir oportunidade"
          >
            <ArrowSquareOut size={9} weight="bold" />
          </button>
        )}

        {/* Idle → pencil on hover */}
        {isIdle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDropdown();
            }}
            className="hidden group-hover/field:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987] hover:bg-[#c8cfdb] cursor-pointer transition-colors"
            title="Alterar oportunidade"
          >
            <PencilSimple size={9} weight="bold" />
          </button>
        )}

        {/* Open → X (close) */}
        {open && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeDropdown();
            }}
            className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] hover:bg-[#c4e4fa] cursor-pointer transition-colors"
          >
            <X size={9} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
