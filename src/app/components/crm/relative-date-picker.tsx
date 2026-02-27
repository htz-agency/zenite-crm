/**
 * Zenite CRM — Relative Date Picker
 *
 * A visual picker for relative date literals.
 * Follows Zenite design system: DM Sans, pill buttons, rounded containers,
 * HTZ colour palette, Phosphor icons (weight="fill" for selected state).
 */

import { useState, useRef, useEffect, useMemo } from "react";
import {
  CalendarBlank,
  CalendarDots,
  Calendar,
  CalendarCheck,
  CalendarStar,
  Clock,
  ClockCounterClockwise,
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  X,
  Check,
  ArrowsClockwise,
  Lightning,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  RELATIVE_DATE_CATALOGUE,
  CATEGORIES,
  QUICK_PICKS,
  buildLiteral,
  resolveRelativeDate,
  formatDateRange,
  type RelativeDateOption,
  type RelativeDateCategory,
  type ResolveOptions,
  type DateRange,
} from "./relative-date-engine";
import { FilterPillButton } from "./filter-pill-button";

/* ================================================================== */
/*  Style tokens                                                       */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const CATEGORY_ICONS: Record<RelativeDateCategory, React.ComponentType<{ size?: number; weight?: string; className?: string }>> = {
  dia: CalendarBlank as any,
  semana: CalendarDots as any,
  "mês": Calendar as any,
  trimestre: CalendarCheck as any,
  ano: CalendarStar as any,
};

const CATEGORY_COLORS: Record<RelativeDateCategory, { bg: string; text: string; activeBg: string }> = {
  dia:       { bg: "#f6f7f9", text: "#4e6987", activeBg: "#28415c" },
  semana:    { bg: "#f6f7f9", text: "#4e6987", activeBg: "#28415c" },
  "mês":     { bg: "#f6f7f9", text: "#4e6987", activeBg: "#28415c" },
  trimestre: { bg: "#f6f7f9", text: "#4e6987", activeBg: "#28415c" },
  ano:       { bg: "#f6f7f9", text: "#4e6987", activeBg: "#28415c" },
};

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface RelativeDatePickerProps {
  /** Currently selected literal, e.g. "ÚLTIMOS 30 DIAS" */
  value?: string;
  /** Called when the user selects a relative date */
  onSelect: (literal: string, range: DateRange) => void;
  /** Called when cleared */
  onClear?: () => void;
  /** Resolve options (weekStartsOn, customFieldMode) */
  resolveOptions?: ResolveOptions;
  /** Placeholder text */
  placeholder?: string;
  /** Compact mode — smaller trigger */
  compact?: boolean;
  /** Filter-bar mode — 34px height, matches FilterDropdownPill */
  filterBar?: boolean;
  /** Exact date range — from */
  exactDateFrom?: string;
  /** Exact date range — to */
  exactDateTo?: string;
  /** Called when user selects an exact date range */
  onExactRangeChange?: (dateFrom: string | undefined, dateTo: string | undefined) => void;
  /** Custom trigger icon component (defaults to ClockCounterClockwise) */
  triggerIcon?: React.ComponentType<{ size?: number; weight?: string; className?: string }>;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function RelativeDatePicker({
  value,
  onSelect,
  onClear,
  resolveOptions = {},
  placeholder = "Selecionar data relativa...",
  compact = false,
  filterBar = false,
  exactDateFrom,
  exactDateTo,
  onExactRangeChange,
  triggerIcon = ClockCounterClockwise,
}: RelativeDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<RelativeDateCategory>("dia");
  const [search, setSearch] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dateMode, setDateMode] = useState<"relative" | "exact">(
    (!value && (exactDateFrom || exactDateTo)) ? "exact" : "relative"
  );
  const hasExactRange = !!(exactDateFrom || exactDateTo);
  const hasAnyValue = !!value || hasExactRange;
  const TriggerIcon = triggerIcon;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Auto-focus search when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Resolved preview for current value
  const resolvedPreview = useMemo(() => {
    if (!value) return null;
    const range = resolveRelativeDate(value, resolveOptions);
    return range ? formatDateRange(range) : null;
  }, [value, resolveOptions]);

  // Filter catalogue by search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) {
      return RELATIVE_DATE_CATALOGUE.filter((o) => o.category === activeCategory);
    }
    const q = search.trim().toLowerCase();
    return RELATIVE_DATE_CATALOGUE.filter(
      (o) =>
        o.literal.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.id.includes(q),
    );
  }, [search, activeCategory]);

  const handleSelect = (option: RelativeDateOption) => {
    const n = paramValues[option.id] ?? option.defaultN;
    const literal = buildLiteral(option, n);
    const range = resolveRelativeDate(literal, resolveOptions);
    if (range) {
      onSelect(literal, range);
      setOpen(false);
      setSearch("");
    }
  };

  const handleParamChange = (optionId: string, val: number) => {
    setParamValues((prev) => ({ ...prev, [optionId]: Math.max(1, val) }));
  };

  const quickPickOptions = QUICK_PICKS.map((id) =>
    RELATIVE_DATE_CATALOGUE.find((o) => o.id === id),
  ).filter(Boolean) as RelativeDateOption[];

  /* Compute trigger label */
  const triggerLabel = useMemo(() => {
    if (value) return value;
    if (hasExactRange) {
      const fmtDate = (d: string) => {
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
      };
      if (exactDateFrom && exactDateTo) return `${fmtDate(exactDateFrom)} → ${fmtDate(exactDateTo)}`;
      if (exactDateFrom) return `A partir de ${fmtDate(exactDateFrom)}`;
      if (exactDateTo) return `Até ${fmtDate(exactDateTo)}`;
    }
    return placeholder;
  }, [value, hasExactRange, exactDateFrom, exactDateTo, placeholder]);

  /* Sync dateMode when external state changes */
  const effectiveMode = useMemo(() => {
    if (!value && hasExactRange) return "exact" as const;
    return dateMode;
  }, [value, hasExactRange, dateMode]);

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ── */}
      <FilterPillButton
        icon={
          <TriggerIcon
            size={filterBar ? 13 : 18}
            weight={hasAnyValue ? "fill" : "regular"}
            className={hasAnyValue ? "text-[#DCF0FF]" : "text-[#0483AB]"}
          />
        }
        label={triggerLabel}
        open={open}
        onClick={() => setOpen((v) => !v)}
        onClear={onClear}
        hasValue={hasAnyValue}
        compact={compact}
        filterBar={filterBar}
      />

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className="absolute left-0 top-full mt-[6px] z-50 w-[404px] bg-white rounded-[20px] border border-[rgba(200,207,219,0.6)] overflow-hidden"
          style={{ boxShadow: "0px 4px 24px rgba(18,34,50,0.15)" }}
        >
          {/* ── Mode tabs: RELATIVA / INTERVALO EXATO ── */}
          {onExactRangeChange && (
            <div className="px-[12px] pt-[12px] pb-[4px]">
              <div className="relative flex items-center gap-[3px] h-[36px] p-[3px] bg-[#f6f7f9] rounded-[100px] overflow-hidden">
                {(["relative", "exact"] as const).map((mode) => {
                  const isActive = effectiveMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setDateMode(mode)}
                      className={`relative flex items-center justify-center flex-1 h-[30px] rounded-[100px] transition-all cursor-pointer ${
                        isActive
                          ? "text-[#f6f7f9]"
                          : "text-[#98989d] hover:text-[#4e6987] hover:bg-[#e8eaee]"
                      }`}
                    >
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                          <div
                            aria-hidden="true"
                            className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                            style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                          />
                        </>
                      )}
                      <span
                        className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                        style={{ fontSize: 10, ...fontFeature }}
                      >
                        {mode === "relative" ? "RELATIVA" : "INTERVALO EXATO"}
                      </span>
                    </button>
                  );
                })}

                {/* Inner shadow overlay */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-[inherit]"
                  style={{
                    boxShadow:
                      "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            </div>
          )}

          {/* ── RELATIVE MODE CONTENT ── */}
          {effectiveMode === "relative" && (
            <>
              {/* Search */}
              <div className="p-[12px] pb-[8px]">
                <div className="relative flex items-center gap-[8px] h-[36px] px-[12px] bg-[#f6f7f9] rounded-[10px]">
                  <MagnifyingGlass size={14} className="text-[#98989d] shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar data relativa..."
                    className="flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb]"
                    style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="flex items-center justify-center size-[18px] rounded-full hover:bg-[#dde3ec] cursor-pointer transition-colors"
                    >
                      <X size={10} weight="bold" className="text-[#98989d]" />
                    </button>
                  )}
                  {/* Inner shadow overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{
                      boxShadow:
                        "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
                    }}
                  />
                </div>
              </div>

              {/* Quick picks (only when no search) */}
              {!search.trim() && (
                <div className="px-[12px] pb-[8px]">
                  <div className="flex items-center gap-[4px] mb-[6px]">
                    <Lightning size={10} weight="fill" className="text-[#eac23d]" />
                    <span
                      className="text-[#eac23d] uppercase"
                      style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
                    >
                      Acesso rápido
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-[4px]">
                    {quickPickOptions.map((opt) => {
                      const isActive = value?.toUpperCase() === opt.literal.toUpperCase();
                      return (
                        <QuickPickButton
                          key={opt.id}
                          isActive={isActive}
                          onClick={() => handleSelect(opt)}
                          label={opt.literal}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-[1.5px] bg-[#ebedf0] mx-[12px]" />

              {/* Category tabs (only when no search) */}
              {!search.trim() && (
                <div className="relative flex items-center gap-[3px] mx-[12px] mt-[10px] mb-[6px] h-[36px] p-[3px] bg-[#f6f7f9] rounded-[100px]">
                  {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.key;
                    const LABELS: Record<string, string> = { dia: "DIA", semana: "SEMANA", "mês": "MÊS", trimestre: "TRIMESTRE", ano: "ANO" };
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`relative flex items-center justify-center flex-1 h-[30px] rounded-[100px] transition-all cursor-pointer ${
                          isActive
                            ? "text-[#f6f7f9]"
                            : "text-[#98989d] hover:text-[#4e6987] hover:bg-[#e8eaee]"
                        }`}
                      >
                        {isActive && (
                          <>
                            <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                              style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                            />
                          </>
                        )}
                        <span
                          className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                          style={{ fontSize: 10, ...fontFeature }}
                        >
                          {LABELS[cat.key] || cat.label.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}

                  {/* Inner shadow overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{
                      boxShadow:
                        "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
                    }}
                  />
                </div>
              )}

              {/* Search results indicator */}
              {search.trim() && (
                <div className="px-[12px] pt-[8px] pb-[4px] flex items-center gap-[6px]">
                  <MagnifyingGlass size={11} className="text-[#98989d]" />
                  <span
                    className="text-[#98989d]"
                    style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
                  >
                    {filteredOptions.length} resultado{filteredOptions.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Options list */}
              <div className="px-[8px] pb-[8px] pt-[4px] max-h-[280px] overflow-y-auto">
                {filteredOptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-[24px] text-center">
                    <CalendarBlank size={28} weight="duotone" className="text-[#dde3ec] mb-[8px]" />
                    <span
                      className="text-[#98989d]"
                      style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}
                    >
                      Nenhum resultado encontrado
                    </span>
                  </div>
                )}
                {filteredOptions.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    isSelected={
                      value?.toUpperCase() ===
                      buildLiteral(opt, paramValues[opt.id] ?? opt.defaultN).toUpperCase()
                    }
                    paramValue={paramValues[opt.id] ?? opt.defaultN ?? 1}
                    onParamChange={(val) => handleParamChange(opt.id, val)}
                    onSelect={() => handleSelect(opt)}
                    resolveOptions={resolveOptions}
                  />
                ))}
              </div>

              {/* Footer — current resolved value */}
              {value && (
                <>
                  <div className="h-[1.5px] bg-[#ebedf0] mx-[12px]" />
                  <div className="flex items-center justify-between px-[16px] py-[10px]">
                    <div className="flex items-center gap-[6px]">
                      <ArrowsClockwise size={12} weight="bold" className="text-[#98989d]" />
                      <span
                        className="text-[#98989d]"
                        style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
                      >
                        Ativo:
                      </span>
                      <span
                        className="text-[#28415c] font-mono"
                        style={{ fontSize: 11, fontWeight: 600, ...fontFeature }}
                      >
                        {value}
                      </span>
                    </div>
                    {resolvedPreview && (
                      <span
                        className="text-[#4e6987]"
                        style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}
                      >
                        {resolvedPreview}
                      </span>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── EXACT MODE CONTENT ── */}
          {effectiveMode === "exact" && (
            <div className="px-[12px] pt-[8px] pb-[14px]">
              {/* Section label */}
              <div className="flex items-center gap-[6px] mb-[10px] px-[4px]">
                <CalendarBlank size={11} weight="fill" className="text-[#98989d]" />
                <span
                  className="text-[#98989d] uppercase"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "14px", ...fontFeature }}
                >
                  Selecionar intervalo
                </span>
              </div>

              {/* Date inputs row */}
              <div className="flex items-center gap-[8px]">
                {/* From */}
                <div className="flex-1 flex flex-col gap-[4px]">
                  <span
                    className="text-[#98989d] uppercase px-[4px]"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                  >
                    De
                  </span>
                  <div className="relative flex items-center gap-[8px] h-[38px] px-[12px] bg-[#f6f7f9] rounded-[12px] overflow-hidden">
                    <Calendar size={14} weight="duotone" className="text-[#4e6987] shrink-0 relative z-[1]" />
                    <input
                      type="date"
                      value={exactDateFrom ?? ""}
                      onChange={(e) => onExactRangeChange?.(e.target.value || undefined, exactDateTo)}
                      className="relative z-[1] flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none rounded-[inherit]"
                      style={{
                        boxShadow:
                          "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                </div>

                {/* Arrow divider */}
                <div className="flex items-end pb-[10px]">
                  <ArrowRight size={14} weight="bold" className="text-[#c8cfdb]" />
                </div>

                {/* To */}
                <div className="flex-1 flex flex-col gap-[4px]">
                  <span
                    className="text-[#98989d] uppercase px-[4px]"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                  >
                    Até
                  </span>
                  <div className="relative flex items-center gap-[8px] h-[38px] px-[12px] bg-[#f6f7f9] rounded-[12px] overflow-hidden">
                    <Calendar size={14} weight="duotone" className="text-[#4e6987] shrink-0 relative z-[1]" />
                    <input
                      type="date"
                      value={exactDateTo ?? ""}
                      onChange={(e) => onExactRangeChange?.(exactDateFrom, e.target.value || undefined)}
                      className="relative z-[1] flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none rounded-[inherit]"
                      style={{
                        boxShadow:
                          "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer preview for exact range */}
              {hasExactRange && (
                <>
                  <div className="h-[1.5px] bg-[#ebedf0] mt-[12px] mb-[8px]" />
                  <div className="flex items-center justify-between px-[4px]">
                    <div className="flex items-center gap-[6px]">
                      <Check size={12} weight="bold" className="text-[#3ccea7]" />
                      <span
                        className="text-[#28415c]"
                        style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
                      >
                        {(() => {
                          const fmtDate = (d: string) => {
                            const [y, m, day] = d.split("-");
                            return `${day}/${m}/${y}`;
                          };
                          if (exactDateFrom && exactDateTo) return `${fmtDate(exactDateFrom)} → ${fmtDate(exactDateTo)}`;
                          if (exactDateFrom) return `A partir de ${fmtDate(exactDateFrom)}`;
                          if (exactDateTo) return `Até ${fmtDate(exactDateTo)}`;
                          return "";
                        })()}
                      </span>
                    </div>
                    {onClear && (
                      <button
                        onClick={() => {
                          onExactRangeChange?.(undefined, undefined);
                          onClear?.();
                        }}
                        className="flex items-center gap-[4px] h-[26px] px-[10px] rounded-[500px] bg-[#f6f7f9] hover:bg-[#dcf0ff] transition-colors cursor-pointer"
                      >
                        <X size={10} weight="bold" className="text-[#98989d]" />
                        <span
                          className="text-[#98989d]"
                          style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}
                        >
                          Limpar
                        </span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  OptionRow — single row in the options list                        */
/* ================================================================== */

function OptionRow({
  option,
  isSelected,
  paramValue,
  onParamChange,
  onSelect,
  resolveOptions,
}: {
  option: RelativeDateOption;
  isSelected: boolean;
  paramValue: number;
  onParamChange: (val: number) => void;
  onSelect: () => void;
  resolveOptions: ResolveOptions;
}) {
  const colors = CATEGORY_COLORS[option.category];
  const literal = buildLiteral(option, paramValue);
  const resolvedRange = useMemo(
    () => resolveRelativeDate(literal, resolveOptions),
    [literal, resolveOptions],
  );
  const preview = resolvedRange ? formatDateRange(resolvedRange) : "—";

  return (
    <div
      className={`flex items-center gap-[8px] px-[8px] py-[7px] rounded-[12px] transition-all cursor-pointer group/row ${
        isSelected
          ? "bg-[#f6f7f9]"
          : "hover:bg-[#f6f7f9]"
      }`}
      onClick={(e) => {
        // Don't fire select if clicking on the n-input
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        onSelect();
      }}
    >
      {/* Check / category dot */}
      <div
        className="flex items-center justify-center size-[24px] rounded-[8px] shrink-0"
        style={{ backgroundColor: isSelected ? "#3ccea7" : colors.bg }}
      >
        {isSelected ? (
          <Check size={12} weight="bold" className="text-white" />
        ) : (
          <CalendarBlank size={12} weight="duotone" style={{ color: colors.text }} />
        )}
      </div>

      {/* Label + description + preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[6px]">
          {/* Literal (with inline n-input for parametric) */}
          {option.parametric ? (
            <ParametricLabel option={option} paramValue={paramValue} onParamChange={onParamChange} isSelected={isSelected} />
          ) : (
            <span
              className="text-[#28415c]"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, lineHeight: "18px", color: "#28415c", ...fontFeature }}
            >
              {option.literal}
            </span>
          )}
          <span
            className="text-[#98989d] truncate"
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}
          >
            {preview}
          </span>
        </div>
      </div>

      {/* Description tooltip on hover */}
      <span
        className="hidden group-hover/row:inline-block text-[#98989d] shrink-0"
        style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}
        title={option.description}
      >
        ?
      </span>
    </div>
  );
}

/* ================================================================== */
/*  ParametricLabel — label with inline number input                   */
/* ================================================================== */

function ParametricLabel({
  option,
  paramValue,
  onParamChange,
  isSelected,
}: {
  option: RelativeDateOption;
  paramValue: number;
  onParamChange: (val: number) => void;
  isSelected: boolean;
}) {
  if (!option.template) return null;

  // Split template around {n}
  const parts = option.template.split("{n}");
  const before = parts[0] || "";
  const after = parts[1] || "";

  return (
    <span
      className="flex items-center gap-[2px] flex-wrap"
      style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, lineHeight: "18px", color: "#28415c", ...fontFeature }}
    >
      {before && <span>{before}</span>}
      <input
        type="number"
        min={1}
        max={999}
        value={paramValue}
        onChange={(e) => onParamChange(parseInt(e.target.value, 10) || 1)}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center w-[36px] h-[22px] text-center bg-white border border-[#dde3ec] rounded-[6px] text-[#07abde] outline-none focus:border-[#07abde] focus:shadow-[0_0_0_2px_rgba(7,171,222,0.12)] transition-all font-mono"
        style={{ fontSize: 12, fontWeight: 600, ...fontFeature }}
      />
      {after && <span>{after}</span>}
    </span>
  );
}

/* ================================================================== */
/*  QuickPickButton — button for quick picks                           */
/* ================================================================== */

function QuickPickButton({
  isActive,
  onClick,
  label,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-[4px] h-[26px] px-[10px] rounded-[500px] transition-all cursor-pointer ${
        isActive
          ? "bg-[#07ABDE] text-[#DCF0FF]"
          : "bg-[#f6f7f9] text-[#0483AB] hover:bg-[#dcf0ff] hover:text-[#0483AB]"
      }`}
    >
      {isActive && <Check size={10} weight="bold" />}
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}>
        {label}
      </span>
    </button>
  );
}

/* ================================================================== */
/*  Inline variant — for table filter bars                            */
/* ================================================================== */

export interface InlineRelativeDateProps {
  /** Currently selected literal */
  value?: string;
  /** Called on select */
  onSelect: (literal: string, range: DateRange) => void;
  /** Called on clear */
  onClear?: () => void;
  resolveOptions?: ResolveOptions;
}

export function InlineRelativeDateChip({
  value,
  onSelect,
  onClear,
  resolveOptions = {},
}: InlineRelativeDateProps) {
  return (
    <RelativeDatePicker
      value={value}
      onSelect={onSelect}
      onClear={onClear}
      resolveOptions={resolveOptions}
      compact
      placeholder="Data..."
    />
  );
}