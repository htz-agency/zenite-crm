import { useState, useEffect, useRef } from "react";
import {
  Tag,
  Speedometer,
  RocketLaunch,
  CompassTool,
  MagnifyingGlass,
  Export,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import {
  services,
  groupLabels,
  groupColors,
  formatCurrency,
  type ServiceGroup,
} from "./pricing-data";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const groupIcons: Record<string, React.ReactNode> = {
  performance: <Speedometer size={14} weight="duotone" />,
  sales_ops: <RocketLaunch size={14} weight="duotone" />,
  brand_co: <CompassTool size={14} weight="duotone" />,
};

const ROWS_PER_PAGE = 16;

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const COL_HEADERS = [
  "SERVIÇO",
  "GRUPO",
  "MENSALIDADE",
  "IMPLEMENTAÇÃO",
  "HORAS/MÊS",
  "BÁSICO",
  "INTERMEDIÁRIO",
  "AVANÇADO",
];

const SORT_MAP: Record<string, "name" | "basePrice" | "implPrice" | "hours" | null> = {
  "SERVIÇO": "name",
  "GRUPO": null,
  "MENSALIDADE": "basePrice",
  "IMPLEMENTAÇÃO": "implPrice",
  "HORAS/MÊS": "hours",
  "BÁSICO": null,
  "INTERMEDIÁRIO": null,
  "AVANÇADO": null,
};

const FIXED_LEFT = "28px"; // row number
const INITIAL_COL_WIDTHS = [200, 120, 110, 110, 80, 100, 110, 100]; // px
const MIN_COL_WIDTH = 50;

function buildGridTemplate(widths: number[]): string {
  return `${FIXED_LEFT} ${widths.map((w) => `${w}px`).join(" ")}`;
}

/* ------------------------------------------------------------------ */
/*  Horizontal Divider (same as proposals.tsx)                         */
/* ------------------------------------------------------------------ */

function HorizontalDivider() {
  return (
    <div className="h-0 relative w-full">
      <div className="absolute inset-[-0.75px_0_0_0]">
        <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1096 1.5">
          <line stroke="#DDE3EC" strokeWidth="1.5" x2="1096" y1="0.75" y2="0.75" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page range helper                                                  */
/* ------------------------------------------------------------------ */

function getPageRange(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: number[] = [];
  const start = Math.max(1, current - 3);
  const end = Math.min(total, start + 6);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function PriceTable() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<ServiceGroup | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "basePrice" | "implPrice" | "hours">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [colWidths, setColWidths] = useState<number[]>([...INITIAL_COL_WIDTHS]);
  const resizingRef = useRef<{ colIdx: number; startX: number; startW: number } | null>(null);

  const gridTemplate = buildGridTemplate(colWidths);

  /* ---- Column resize ---- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colIdx, startX, startW } = resizingRef.current;
      const diff = e.clientX - startX;
      setColWidths((prev) => {
        const next = [...prev];
        next[colIdx] = Math.max(MIN_COL_WIDTH, startW + diff);
        return next;
      });
    };
    const onUp = () => { resizingRef.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startResize = (colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = { colIdx, startX: e.clientX, startW: colWidths[colIdx] };
  };

  /* ---- Sort ---- */
  const toggleSort = (col: "name" | "basePrice" | "implPrice" | "hours") => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  /* ---- Filter + sort data ---- */
  const filtered = services
    .filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchGroup = groupFilter === "all" || s.group === groupFilter;
      return matchSearch && matchGroup;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name": comparison = a.name.localeCompare(b.name); break;
        case "basePrice": comparison = a.basePrice - b.basePrice; break;
        case "implPrice": comparison = a.implPrice - b.implPrice; break;
        case "hours": comparison = a.hoursEstimate - b.hoursEstimate; break;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const pageRange = getPageRange(safePage, totalPages);

  /* ---- Cell renderers ---- */
  const cellValue = (service: (typeof services)[0], colIdx: number) => {
    const colors = groupColors[service.group];
    switch (colIdx) {
      case 0: // Serviço
        return (
          <div className="truncate text-[#07ABDE]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            {service.name}
          </div>
        );
      case 1: // Grupo
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}
            style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}
          >
            {groupIcons[service.group]}
            {groupLabels[service.group]}
          </span>
        );
      case 2: // Mensalidade
        return (
          <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            {service.basePrice > 0 ? formatCurrency(service.basePrice) : "—"}
          </div>
        );
      case 3: // Implementação
        return (
          <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            {formatCurrency(service.implPrice)}
          </div>
        );
      case 4: // Horas
        return (
          <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            {service.hoursEstimate}h
          </div>
        );
      case 5: // Básico
        return (
          <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            {service.basePrice > 0
              ? formatCurrency(service.basePrice * service.complexityMultipliers.basico)
              : formatCurrency(service.implPrice * service.complexityMultipliers.basico)}
          </div>
        );
      case 6: // Intermediário
        return (
          <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            {service.basePrice > 0
              ? formatCurrency(service.basePrice * service.complexityMultipliers.intermediario)
              : formatCurrency(service.implPrice * service.complexityMultipliers.intermediario)}
          </div>
        );
      case 7: // Avançado
        return (
          <div className="truncate text-[#28415C]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, ...fontFeature }}>
            {service.basePrice > 0
              ? formatCurrency(service.basePrice * service.complexityMultipliers.avancado)
              : formatCurrency(service.implPrice * service.complexityMultipliers.avancado)}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto overflow-y-auto h-full p-[10px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEEDCA] flex items-center justify-center shrink-0">
            <Tag size={20} className="text-[#917822]" weight="duotone" />
          </div>
          <div>
            <h1 className="text-[#122232]" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              Tabela de Preços
            </h1>
            <p className="text-[#4E6987] mt-0.5" style={{ fontSize: 14 }}>
              Referência completa de preços base dos serviços
            </p>
          </div>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#DDE3EC] text-[#4E6987] rounded-lg hover:bg-[#F6F7F9] transition-colors w-full sm:w-auto"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          <Export size={16} />
          Exportar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        

        {/* Segmented Control — Figma style (same as proposals.tsx) */}
        <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#f6f7f9] rounded-[100px] overflow-clip">
          {/* Todos */}
          <button
            onClick={() => setGroupFilter("all")}
            className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
              groupFilter === "all"
                ? "text-[#f6f7f9]"
                : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
            }`}
          >
            {groupFilter === "all" && (
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
              style={{ fontSize: 10, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
            >
              Todos
            </span>
          </button>

          {/* Group buttons */}
          {(["performance", "sales_ops", "brand_co"] as ServiceGroup[]).map((g) => {
            const isActive = groupFilter === g;
            return (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                  isActive
                    ? "text-[#f6f7f9]"
                    : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
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
                <span className="relative z-[1]">{groupIcons[g]}</span>
                <span
                  className="relative z-[1] font-bold uppercase tracking-[0.5px]"
                  style={{ fontSize: 10, fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" }}
                >
                  {groupLabels[g]}
                </span>
              </button>
            );
          })}

          {/* Inner shadow overlay (after buttons, same as proposals.tsx) */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
          />
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden flex flex-col gap-3">
        {paginated.map((service) => {
          const colors = groupColors[service.group];
          return (
            <div key={service.id} className="bg-white rounded-xl border border-[#DDE3EC] p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700 }}>
                  {service.name}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded shrink-0 ${colors.bg} ${colors.text}`}
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {groupIcons[service.group]}
                  {groupLabels[service.group]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-[#4E6987]" style={{ fontSize: 11 }}>Mensal</p>
                  <p className="text-[#122232]" style={{ fontSize: 13, fontWeight: 700 }}>
                    {service.basePrice > 0 ? formatCurrency(service.basePrice) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[#4E6987]" style={{ fontSize: 11 }}>Implementação</p>
                  <p className="text-[#122232]" style={{ fontSize: 13, fontWeight: 700 }}>
                    {formatCurrency(service.implPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[#4E6987]" style={{ fontSize: 11 }}>Horas/mês</p>
                  <p className="text-[#122232]" style={{ fontSize: 13, fontWeight: 700 }}>
                    {service.hoursEstimate}h
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-[#DDE3EC]">
                {(["basico", "intermediario", "avancado"] as const).map((c) => {
                  const val = service.basePrice > 0
                    ? service.basePrice * service.complexityMultipliers[c]
                    : service.implPrice * service.complexityMultipliers[c];
                  const label = c === "basico" ? "Básico" : c === "intermediario" ? "Interm." : "Avançado";
                  return (
                    <div key={c} className="flex-1 text-center">
                      <p className="text-[#4E6987]" style={{ fontSize: 10, fontWeight: 600 }}>{label}</p>
                      <p className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700 }}>
                        {formatCurrency(val)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════ DESKTOP TABLE (same grid pattern as proposals.tsx) ═══════ */}
      <div className="hidden md:flex flex-col bg-white rounded-t-xl overflow-hidden">
        <div className="overflow-x-auto flex-1 flex flex-col min-w-0">
          <div className="w-fit min-w-full">

            {/* ── Column Headers ── */}
            <div
              className="grid items-center px-5 pt-2 pb-0"
              style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
            >
              {/* # placeholder */}
              <div />
              {/* Header cells with resize handles + dividers */}
              {COL_HEADERS.map((col, idx) => {
                const sortKey = SORT_MAP[col];
                return (
                  <div
                    key={col}
                    className={`flex items-center h-[32px] relative ${sortKey ? "cursor-pointer" : ""} group/hdr`}
                    onClick={() => sortKey && toggleSort(sortKey)}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#28415c] whitespace-nowrap leading-[20px]"
                      style={fontFeature}
                    >
                      {col}
                    </span>
                    {/* Resize handle + visual divider */}
                    {idx < COL_HEADERS.length && (
                      <div
                        className="absolute right-[-5px] top-0 bottom-0 w-[10px] z-10 flex items-center justify-center cursor-col-resize group/resize"
                        onMouseDown={(e) => { e.stopPropagation(); startResize(idx, e); }}
                      >
                        <div className="w-[1.5px] h-[20px] rounded-full bg-[#DDE3EC] transition-colors group-hover/resize:bg-[#0483AB] group-hover/resize:h-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Table rows ── */}
            <div className="flex flex-col mt-1">
              {paginated.map((service, idx) => {
                const rowNum = (safePage - 1) * ROWS_PER_PAGE + idx + 1;
                return (
                  <div key={service.id}>
                    <HorizontalDivider />
                    <div
                      className="grid items-center h-[34px] px-3 mx-2 rounded-[100px] transition-colors hover:bg-[#f6f7f9] cursor-default"
                      style={{ gridTemplateColumns: gridTemplate, gap: "0 8px" }}
                    >
                      {/* Row number */}
                      <div
                        className="text-right text-[#28415c]"
                        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                      >
                        {rowNum}
                      </div>
                      {/* Data cells */}
                      {COL_HEADERS.map((_, colIdx) => (
                        <div key={colIdx} className="min-w-0">
                          {cellValue(service, colIdx)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Bottom divider */}
              <HorizontalDivider />
            </div>

          </div>
        </div>
      </div>

      {/* ═══════ PAGINATION (same as proposals.tsx) ═══════ */}
      {filtered.length > 0 && (
        <div className="hidden md:flex items-center gap-2 py-4 bg-white rounded-b-xl px-5 border-t-0">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex items-center justify-center w-[28px] h-[28px] rounded-full hover:bg-[#F6F7F9] transition-colors disabled:opacity-30 text-[#28415C]"
          >
            <CaretRight size={14} weight="bold" />
          </button>

          <div className="flex items-center gap-0.5 ml-2">
            {pageRange.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors ${
                  page === safePage
                    ? "bg-[#28415C] text-white"
                    : "text-[#28415C] hover:bg-[#F6F7F9]"
                }`}
                style={{ fontSize: 12, fontWeight: page === safePage ? 700 : 500, ...fontFeature }}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pagination (mobile) */}
      {totalPages > 1 && (
        <div className="md:hidden flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={safePage === 1}
            className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] border border-[#DDE3EC] transition-colors disabled:opacity-30"
          >
            <CaretLeft size={14} weight="bold" className="text-[#28415c]" />
          </button>
          <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600 }}>
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={safePage === totalPages}
            className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] border border-[#DDE3EC] transition-colors disabled:opacity-30"
          >
            <CaretRight size={14} weight="bold" className="text-[#28415c]" />
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6">
        <p className="text-[#4E6987]" style={{ fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>Nota:</span> Os valores acima são base (Básico x1.0). 
          Intermediário e Avançado possuem multiplicadores conforme complexidade do projeto.
        </p>
      </div>
    </div>
  );
}