import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { CaretDown, X, CheckSquare, Square, Funnel } from "@phosphor-icons/react";
import { useSearch, emptyFilters, type ProposalFilters } from "./search-context";
import { services as allServices, groupLabels, type ServiceGroup } from "./pricing-data";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const STATUS_OPTIONS = [
  { value: "rascunho", label: "Rascunho", color: "#4E6987", bg: "#F6F7F9" },
  { value: "criada", label: "Criada", color: "#6868B1", bg: "#F0EEFA" },
  { value: "enviada", label: "Enviada", color: "#0483AB", bg: "#E6F6FC" },
  { value: "aprovada", label: "Aprovada", color: "#135543", bg: "#E4F5EF" },
  { value: "recusada", label: "Recusada", color: "#B13B00", bg: "#FFF0EB" },
];

/* ------------------------------------------------------------------ */
/*  Dropdown pill button                                               */
/* ------------------------------------------------------------------ */

function FilterDropdownPill({
  label,
  active,
  onClick,
  open,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  open: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-[4px] h-[32px] px-[14px] rounded-[100px] transition-colors cursor-pointer ${
        active
          ? "bg-[#dcf0ff] text-[#0483AB]"
          : open
          ? "bg-[#28415c] text-[#f6f7f9]"
          : "bg-[#f6f7f9] text-[#28415c] hover:bg-[#DDE3EC]"
      }`}
    >
      <span
        className="uppercase whitespace-nowrap"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
      >
        {label}
      </span>
      <CaretDown
        size={10}
        weight="bold"
        className={`transition-transform ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Range inputs (for currency / hours)                                */
/* ------------------------------------------------------------------ */

function RangeFilter({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  prefix,
  placeholder,
}: {
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  prefix?: string;
  placeholder?: [string, string];
}) {
  return (
    <div className="flex items-center gap-2 p-2">
      <div className="flex items-center gap-1 flex-1">
        {prefix && (
          <span className="text-[#98989d] shrink-0" style={{ fontSize: 11, fontWeight: 600 }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder={placeholder?.[0] ?? "Mín"}
          className="w-full h-[30px] px-[10px] bg-[#f6f7f9] rounded-[8px] border-none outline-none text-[#122232]"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
        />
      </div>
      <span className="text-[#98989d] shrink-0" style={{ fontSize: 10, fontWeight: 600 }}>
        até
      </span>
      <div className="flex items-center gap-1 flex-1">
        {prefix && (
          <span className="text-[#98989d] shrink-0" style={{ fontSize: 11, fontWeight: 600 }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder={placeholder?.[1] ?? "Máx"}
          className="w-full h-[30px] px-[10px] bg-[#f6f7f9] rounded-[8px] border-none outline-none text-[#122232]"
          style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Multi-select checkbox list                                         */
/* ------------------------------------------------------------------ */

function CheckboxList({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string; color?: string; bg?: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-col gap-[2px] p-2 max-h-[200px] overflow-y-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className="flex items-center gap-[8px] px-[8px] py-[6px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
        >
          {selected.includes(opt.value) ? (
            <CheckSquare size={14} weight="fill" className="text-[#07ABDE] shrink-0" />
          ) : (
            <Square size={14} weight="bold" className="text-[#4E6987] shrink-0" />
          )}
          {opt.bg && (
            <span
              className="px-[6px] py-[2px] rounded-[4px]"
              style={{ backgroundColor: opt.bg, color: opt.color, fontSize: 10, fontWeight: 600, ...fontFeature }}
            >
              {opt.label}
            </span>
          )}
          {!opt.bg && (
            <span
              className="text-[#28415c] truncate"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
            >
              {opt.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main FilterPanel                                                   */
/* ------------------------------------------------------------------ */

type ActiveDropdown = "status" | "monthly" | "total" | "impl" | "hours" | "services" | null;

export function FilterPanel() {
  const { filters, setFilters, filterOpen, setFilterOpen, clearFilters, activeFilterCount } = useSearch();
  const [draft, setDraft] = useState<ProposalFilters>(filters);
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync draft when filters change externally
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  // Close panel on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen, setFilterOpen]);

  if (!filterOpen) return null;

  const updateDraft = (patch: Partial<ProposalFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleApply = () => {
    setFilters(draft);
    setFilterOpen(false);
    setActiveDropdown(null);
    // Navigate to results page if not already there
    if (location.pathname !== "/price/resultados") {
      navigate("/price/resultados");
    }
  };

  const handleClear = () => {
    setDraft(emptyFilters);
    clearFilters();
    setActiveDropdown(null);
  };

  const toggleDropdown = (key: ActiveDropdown) => {
    setActiveDropdown((prev) => (prev === key ? null : key));
  };

  // Build service options grouped
  const serviceOptions = (Object.keys(groupLabels) as ServiceGroup[]).flatMap((group) =>
    allServices
      .filter((s) => s.group === group)
      .map((s) => ({ value: s.id, label: s.name }))
  );

  const statusActive = draft.statuses.length > 0;
  const monthlyActive = !!(draft.monthlyMin || draft.monthlyMax);
  const totalActive = !!(draft.totalMin || draft.totalMax);
  const implActive = !!(draft.implMin || draft.implMax);
  const hoursActive = !!(draft.hoursMin || draft.hoursMax);
  const servicesActive = draft.serviceIds.length > 0;

  return (
    <div
      ref={panelRef}
      className="absolute top-[48px] left-0 right-0 z-50 mx-auto max-w-[520px]"
    >
      <div className="bg-white rounded-[16px] overflow-hidden" style={{ boxShadow: "0px 8px 32px rgba(18,34,50,0.12), 0px 2px 8px rgba(18,34,50,0.08)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] py-[12px]">
          <div className="flex items-center gap-[8px]">
            <Funnel size={14} weight="bold" className="text-[#4E6987]" />
            <span
              className="text-[#28415c]"
              style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}
            >
              Filtros avançados
            </span>
            {activeFilterCount > 0 && (
              <span
                className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#07ABDE] text-white"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={() => { setFilterOpen(false); setActiveDropdown(null); }}
            className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#f6f7f9] transition-colors"
          >
            <X size={14} weight="bold" className="text-[#4E6987]" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-[6px] px-[16px] pb-[12px]">
          <FilterDropdownPill
            label={`Status${draft.statuses.length > 0 ? ` (${draft.statuses.length})` : ""}`}
            active={statusActive}
            open={activeDropdown === "status"}
            onClick={() => toggleDropdown("status")}
          />
          <FilterDropdownPill
            label="Mensalidade"
            active={monthlyActive}
            open={activeDropdown === "monthly"}
            onClick={() => toggleDropdown("monthly")}
          />
          <FilterDropdownPill
            label="Valor total"
            active={totalActive}
            open={activeDropdown === "total"}
            onClick={() => toggleDropdown("total")}
          />
          <FilterDropdownPill
            label="Implementação"
            active={implActive}
            open={activeDropdown === "impl"}
            onClick={() => toggleDropdown("impl")}
          />
          <FilterDropdownPill
            label="Horas"
            active={hoursActive}
            open={activeDropdown === "hours"}
            onClick={() => toggleDropdown("hours")}
          />
          <FilterDropdownPill
            label={`Serviços${draft.serviceIds.length > 0 ? ` (${draft.serviceIds.length})` : ""}`}
            active={servicesActive}
            open={activeDropdown === "services"}
            onClick={() => toggleDropdown("services")}
          />
        </div>

        {/* Active dropdown content */}
        {activeDropdown && (
          <div ref={dropdownRef} className="border-t border-[#EBF1FA] mx-[12px]">
            {activeDropdown === "status" && (
              <CheckboxList
                options={STATUS_OPTIONS}
                selected={draft.statuses}
                onChange={(v) => updateDraft({ statuses: v })}
              />
            )}
            {activeDropdown === "monthly" && (
              <RangeFilter
                minValue={draft.monthlyMin}
                maxValue={draft.monthlyMax}
                onMinChange={(v) => updateDraft({ monthlyMin: v })}
                onMaxChange={(v) => updateDraft({ monthlyMax: v })}
                prefix="R$"
                placeholder={["Mín", "Máx"]}
              />
            )}
            {activeDropdown === "total" && (
              <RangeFilter
                minValue={draft.totalMin}
                maxValue={draft.totalMax}
                onMinChange={(v) => updateDraft({ totalMin: v })}
                onMaxChange={(v) => updateDraft({ totalMax: v })}
                prefix="R$"
                placeholder={["Mín", "Máx"]}
              />
            )}
            {activeDropdown === "impl" && (
              <RangeFilter
                minValue={draft.implMin}
                maxValue={draft.implMax}
                onMinChange={(v) => updateDraft({ implMin: v })}
                onMaxChange={(v) => updateDraft({ implMax: v })}
                prefix="R$"
                placeholder={["Mín", "Máx"]}
              />
            )}
            {activeDropdown === "hours" && (
              <RangeFilter
                minValue={draft.hoursMin}
                maxValue={draft.hoursMax}
                onMinChange={(v) => updateDraft({ hoursMin: v })}
                onMaxChange={(v) => updateDraft({ hoursMax: v })}
                placeholder={["Mín horas", "Máx horas"]}
              />
            )}
            {activeDropdown === "services" && (
              <CheckboxList
                options={serviceOptions}
                selected={draft.serviceIds}
                onChange={(v) => updateDraft({ serviceIds: v })}
              />
            )}
          </div>
        )}

        {/* Footer: Limpar + Aplicar */}
        <div className="flex items-center justify-between px-[16px] py-[10px] border-t border-[#EBF1FA]">
          <button
            onClick={handleClear}
            className="flex items-center gap-[4px] h-[32px] px-[14px] rounded-[100px] bg-[#f6f7f9] text-[#4E6987] hover:bg-[#DDE3EC] transition-colors cursor-pointer"
          >
            <X size={10} weight="bold" />
            <span
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              Limpar
            </span>
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-[4px] h-[32px] px-[14px] rounded-[500px] bg-[#dcf0ff] text-[#28415c] hover:bg-[#c2e5fc] active:bg-[#07ABDE] active:text-[#f6f7f9] transition-colors cursor-pointer"
          >
            <span
              className="uppercase"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
            >
              Aplicar
            </span>
            <CaretDown size={10} weight="bold" className="rotate-[-90deg]" />
          </button>
        </div>
      </div>
    </div>
  );
}