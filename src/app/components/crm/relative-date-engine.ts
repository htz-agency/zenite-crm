/**
 * Zenite CRM — Relative Date Engine
 *
 * Parses human-readable relative-date literals (pt-BR, case-insensitive)
 * and resolves them to concrete `{ start, end }` Date ranges.
 *
 * Reference: Salesforce "Relative Date Filter" model,
 *            adapted to pt-BR with Zenite naming.
 *
 * 30 literals supported (+ parametric n variants).
 * Week starts on Sunday (index 0) by default — configurable.
 */

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

export interface DateRange {
  start: Date;
  end: Date;
}

export type RelativeDateUnit = "day" | "week" | "month" | "quarter" | "year";

export interface RelativeDateToken {
  /** The canonical pt-BR literal, e.g. "ÚLTIMOS 7 DIAS" */
  literal: string;
  /** Resolved range — computed lazily via resolve() */
  unit: RelativeDateUnit;
  /** Category for UI grouping */
  category: RelativeDateCategory;
  /** Whether it takes a numeric parameter n */
  parametric: boolean;
  /** Short human description */
  description: string;
}

export type RelativeDateCategory =
  | "dia"
  | "semana"
  | "mês"
  | "trimestre"
  | "ano";

/* ================================================================== */
/*  Internal helpers                                                   */
/* ================================================================== */

/** Clone a date at midnight local time */
function midnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** End of day (23:59:59.999) */
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** First day of the week containing `d` (weekStartsOn: 0=Sun, 1=Mon) */
function startOfWeek(d: Date, weekStartsOn = 0): Date {
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  const result = new Date(d);
  result.setDate(d.getDate() - diff);
  return midnight(result);
}

/** First day of the month containing `d` */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Last day of the month containing `d` */
function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/** Quarter index (0..3) for a date */
function quarterOf(d: Date): number {
  return Math.floor(d.getMonth() / 3);
}

/** First day of quarter q (0..3) in year y */
function startOfQuarter(y: number, q: number): Date {
  return new Date(y, q * 3, 1);
}

/** Last day of quarter q (0..3) in year y */
function endOfQuarter(y: number, q: number): Date {
  return endOfDay(new Date(y, q * 3 + 3, 0));
}

/* ================================================================== */
/*  Resolve — the core function                                       */
/* ================================================================== */

export interface ResolveOptions {
  /** Override "today" for testing. Default: new Date() */
  now?: Date;
  /** 0 = Sunday, 1 = Monday. Default: 0 */
  weekStartsOn?: 0 | 1;
  /** For "PRÓXIMOS n DIAS" in custom field context (starts tomorrow, not today). Default: false */
  customFieldMode?: boolean;
}

/**
 * Resolve a relative date literal to a concrete DateRange.
 *
 * @param literal  e.g. "HOJE", "ÚLTIMOS 30 DIAS", "este trimestre"
 * @param options  optional config
 * @returns DateRange or null if literal is unrecognised
 */
export function resolveRelativeDate(
  literal: string,
  options: ResolveOptions = {},
): DateRange | null {
  const now = options.now ?? new Date();
  const ws = options.weekStartsOn ?? 0;
  const customField = options.customFieldMode ?? false;

  const today = midnight(now);
  const norm = literal.trim().toUpperCase().replace(/\s+/g, " ");

  // Extract numeric param (e.g. "ÚLTIMOS 30 DIAS" → 30)
  const nMatch = norm.match(/(\d+)/);
  const n = nMatch ? parseInt(nMatch[1], 10) : 0;

  /* ── Day literals ── */

  if (norm === "ONTEM") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return { start: midnight(d), end: endOfDay(d) };
  }

  if (norm === "HOJE") {
    return { start: midnight(today), end: endOfDay(today) };
  }

  if (norm === "AMANHÃ" || norm === "AMANHA") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { start: midnight(d), end: endOfDay(d) };
  }

  if (/^ÚLTIMOS \d+ DIAS$/.test(norm) || /^ULTIMOS \d+ DIAS$/.test(norm)) {
    // Starts n days ago 00:00, ends now (includes today)
    const start = new Date(today);
    start.setDate(start.getDate() - n);
    return { start: midnight(start), end: endOfDay(today) };
  }

  if (/^PRÓXIMOS \d+ DIAS$/.test(norm) || /^PROXIMOS \d+ DIAS$/.test(norm)) {
    if (customField) {
      // Custom field: starts tomorrow, n days forward
      const start = new Date(today);
      start.setDate(start.getDate() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + n - 1);
      return { start: midnight(start), end: endOfDay(end) };
    }
    // Standard: starts today, n days forward (includes today)
    const end = new Date(today);
    end.setDate(end.getDate() + n - 1);
    return { start: midnight(today), end: endOfDay(end) };
  }

  if (/^HÁ \d+ DIAS$/.test(norm) || /^HA \d+ DIAS$/.test(norm)) {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return { start: midnight(d), end: endOfDay(d) };
  }

  /* ── Week literals ── */

  if (norm === "SEMANA PASSADA") {
    const thisWeekStart = startOfWeek(today, ws);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
    return { start: midnight(lastWeekStart), end: endOfDay(lastWeekEnd) };
  }

  if (norm === "ESTA SEMANA") {
    const s = startOfWeek(today, ws);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    return { start: midnight(s), end: endOfDay(e) };
  }

  if (norm === "PRÓXIMA SEMANA" || norm === "PROXIMA SEMANA") {
    const thisWeekStart = startOfWeek(today, ws);
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    return { start: midnight(nextWeekStart), end: endOfDay(nextWeekEnd) };
  }

  if (/^ÚLTIMAS \d+ SEMANAS$/.test(norm) || /^ULTIMAS \d+ SEMANAS$/.test(norm)) {
    const thisWeekStart = startOfWeek(today, ws);
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - n * 7);
    const end = new Date(thisWeekStart);
    end.setDate(end.getDate() - 1); // last day of previous week
    return { start: midnight(start), end: endOfDay(end) };
  }

  if (/^PRÓXIMAS \d+ SEMANAS$/.test(norm) || /^PROXIMAS \d+ SEMANAS$/.test(norm)) {
    const thisWeekStart = startOfWeek(today, ws);
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const end = new Date(nextWeekStart);
    end.setDate(end.getDate() + n * 7 - 1);
    return { start: midnight(nextWeekStart), end: endOfDay(end) };
  }

  if (/^HÁ \d+ SEMANAS$/.test(norm) || /^HA \d+ SEMANAS$/.test(norm)) {
    const thisWeekStart = startOfWeek(today, ws);
    const targetWeekStart = new Date(thisWeekStart);
    targetWeekStart.setDate(targetWeekStart.getDate() - n * 7);
    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekEnd.getDate() + 6);
    return { start: midnight(targetWeekStart), end: endOfDay(targetWeekEnd) };
  }

  /* ── Month literals ── */

  if (norm === "MÊS PASSADO" || norm === "MES PASSADO") {
    const y = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const m = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
    return { start: new Date(y, m, 1), end: endOfMonth(new Date(y, m, 1)) };
  }

  if (norm === "ESTE MÊS" || norm === "ESTE MES") {
    return { start: startOfMonth(today), end: endOfMonth(today) };
  }

  if (norm === "PRÓXIMO MÊS" || norm === "PROXIMO MES" || norm === "PRÓXIMO MES" || norm === "PROXIMO MÊS") {
    const y = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    const m = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
    return { start: new Date(y, m, 1), end: endOfMonth(new Date(y, m, 1)) };
  }

  if (/^ÚLTIMOS \d+ MESES$/.test(norm) || /^ULTIMOS \d+ MESES$/.test(norm)) {
    const startMonth = new Date(today.getFullYear(), today.getMonth() - n, 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth(), 0); // last day of prev month
    return { start: startMonth, end: endOfDay(endMonth) };
  }

  if (/^PRÓXIMOS \d+ MESES$/.test(norm) || /^PROXIMOS \d+ MESES$/.test(norm)) {
    const startMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endMonth = endOfMonth(new Date(today.getFullYear(), today.getMonth() + n, 1));
    return { start: startMonth, end: endMonth };
  }

  if (/^HÁ \d+ MESES$/.test(norm) || /^HA \d+ MESES$/.test(norm)) {
    const target = new Date(today.getFullYear(), today.getMonth() - n, 1);
    return { start: target, end: endOfMonth(target) };
  }

  /* ── Quarter literals ── */

  if (norm === "TRIMESTRE PASSADO") {
    const q = quarterOf(today);
    const y = today.getFullYear();
    const pq = q === 0 ? 3 : q - 1;
    const py = q === 0 ? y - 1 : y;
    return { start: startOfQuarter(py, pq), end: endOfQuarter(py, pq) };
  }

  if (norm === "ESTE TRIMESTRE") {
    const q = quarterOf(today);
    return { start: startOfQuarter(today.getFullYear(), q), end: endOfQuarter(today.getFullYear(), q) };
  }

  if (norm === "PRÓXIMO TRIMESTRE" || norm === "PROXIMO TRIMESTRE") {
    const q = quarterOf(today);
    const y = today.getFullYear();
    const nq = q === 3 ? 0 : q + 1;
    const ny = q === 3 ? y + 1 : y;
    return { start: startOfQuarter(ny, nq), end: endOfQuarter(ny, nq) };
  }

  if (/^ÚLTIMOS \d+ TRIMESTRES$/.test(norm) || /^ULTIMOS \d+ TRIMESTRES$/.test(norm)) {
    const q = quarterOf(today);
    const y = today.getFullYear();
    // n quarters back from (not including) current
    let sq = q - n;
    let sy = y;
    while (sq < 0) { sq += 4; sy--; }
    let eq = q - 1;
    let ey = y;
    if (eq < 0) { eq = 3; ey--; }
    return { start: startOfQuarter(sy, sq), end: endOfQuarter(ey, eq) };
  }

  if (/^PRÓXIMOS \d+ TRIMESTRES$/.test(norm) || /^PROXIMOS \d+ TRIMESTRES$/.test(norm)) {
    const q = quarterOf(today);
    const y = today.getFullYear();
    let sq = q + 1;
    let sy = y;
    if (sq > 3) { sq = 0; sy++; }
    let eq = q + n;
    let ey = y;
    while (eq > 3) { eq -= 4; ey++; }
    return { start: startOfQuarter(sy, sq), end: endOfQuarter(ey, eq) };
  }

  if (/^HÁ \d+ TRIMESTRES$/.test(norm) || /^HA \d+ TRIMESTRES$/.test(norm)) {
    const q = quarterOf(today);
    const y = today.getFullYear();
    let tq = q - n;
    let ty = y;
    while (tq < 0) { tq += 4; ty--; }
    return { start: startOfQuarter(ty, tq), end: endOfQuarter(ty, tq) };
  }

  /* ── Year literals ── */

  if (norm === "ANO PASSADO") {
    const y = today.getFullYear() - 1;
    return { start: new Date(y, 0, 1), end: endOfDay(new Date(y, 11, 31)) };
  }

  if (norm === "ESTE ANO") {
    const y = today.getFullYear();
    return { start: new Date(y, 0, 1), end: endOfDay(new Date(y, 11, 31)) };
  }

  if (norm === "PRÓXIMO ANO" || norm === "PROXIMO ANO") {
    const y = today.getFullYear() + 1;
    return { start: new Date(y, 0, 1), end: endOfDay(new Date(y, 11, 31)) };
  }

  if (/^HÁ \d+ ANOS$/.test(norm) || /^HA \d+ ANOS$/.test(norm)) {
    const y = today.getFullYear() - n;
    return { start: new Date(y, 0, 1), end: endOfDay(new Date(y, 11, 31)) };
  }

  if (/^ÚLTIMOS \d+ ANOS$/.test(norm) || /^ULTIMOS \d+ ANOS$/.test(norm)) {
    const startY = today.getFullYear() - n;
    const endY = today.getFullYear() - 1;
    return { start: new Date(startY, 0, 1), end: endOfDay(new Date(endY, 11, 31)) };
  }

  if (/^PRÓXIMOS \d+ ANOS$/.test(norm) || /^PROXIMOS \d+ ANOS$/.test(norm)) {
    const startY = today.getFullYear() + 1;
    const endY = today.getFullYear() + n;
    return { start: new Date(startY, 0, 1), end: endOfDay(new Date(endY, 11, 31)) };
  }

  return null; // unrecognised
}

/* ================================================================== */
/*  matchesRelativeDate — for filtering records                        */
/* ================================================================== */

/**
 * Check whether a date value (ISO string or Date) falls within
 * the range defined by a relative date literal.
 */
export function matchesRelativeDate(
  dateValue: string | Date,
  relativeLiteral: string,
  options: ResolveOptions = {},
): boolean {
  const range = resolveRelativeDate(relativeLiteral, options);
  if (!range) return false;
  const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return false;
  return d >= range.start && d <= range.end;
}

/* ================================================================== */
/*  formatDateRange — human-readable preview                           */
/* ================================================================== */

function pad2(n: number) { return String(n).padStart(2, "0"); }

export function formatDateBR(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateRange(range: DateRange): string {
  const s = formatDateBR(range.start);
  const e = formatDateBR(range.end);
  if (s === e) return s;
  return `${s} — ${e}`;
}

/* ================================================================== */
/*  Catalogue — all literals for the picker UI                        */
/* ================================================================== */

export interface RelativeDateOption {
  id: string;
  literal: string;
  category: RelativeDateCategory;
  unit: RelativeDateUnit;
  parametric: boolean;
  /** Template with {n} placeholder for parametric options */
  template?: string;
  description: string;
  /** Suggested default n for parametric options */
  defaultN?: number;
}

export const RELATIVE_DATE_CATALOGUE: RelativeDateOption[] = [
  // ── Dias ──
  { id: "ontem",              literal: "ONTEM",              category: "dia",       unit: "day",     parametric: false, description: "O dia anterior a hoje" },
  { id: "hoje",               literal: "HOJE",               category: "dia",       unit: "day",     parametric: false, description: "O dia atual" },
  { id: "amanha",             literal: "AMANHÃ",             category: "dia",       unit: "day",     parametric: false, description: "O dia seguinte a hoje" },
  { id: "ultimos_n_dias",     literal: "ÚLTIMOS {n} DIAS",   category: "dia",       unit: "day",     parametric: true,  template: "ÚLTIMOS {n} DIAS",   defaultN: 7,  description: "De n dias atrás até hoje" },
  { id: "proximos_n_dias",    literal: "PRÓXIMOS {n} DIAS",  category: "dia",       unit: "day",     parametric: true,  template: "PRÓXIMOS {n} DIAS",  defaultN: 7,  description: "De hoje em diante por n dias" },
  { id: "ha_n_dias",          literal: "HÁ {n} DIAS",        category: "dia",       unit: "day",     parametric: true,  template: "HÁ {n} DIAS",       defaultN: 3,  description: "Exatamente n dias atrás (24h)" },

  // ── Semanas ──
  { id: "semana_passada",     literal: "SEMANA PASSADA",        category: "semana",    unit: "week",    parametric: false, description: "A semana anterior à semana atual" },
  { id: "esta_semana",        literal: "ESTA SEMANA",           category: "semana",    unit: "week",    parametric: false, description: "A semana atual (dom–sáb)" },
  { id: "proxima_semana",     literal: "PRÓXIMA SEMANA",        category: "semana",    unit: "week",    parametric: false, description: "A semana seguinte à semana atual" },
  { id: "ultimas_n_semanas",  literal: "ÚLTIMAS {n} SEMANAS",   category: "semana",    unit: "week",    parametric: true,  template: "ÚLTIMAS {n} SEMANAS",   defaultN: 2, description: "De n semanas atrás até a semana passada" },
  { id: "proximas_n_semanas", literal: "PRÓXIMAS {n} SEMANAS",  category: "semana",    unit: "week",    parametric: true,  template: "PRÓXIMAS {n} SEMANAS",  defaultN: 2, description: "Da próxima semana em diante por n semanas" },
  { id: "ha_n_semanas",       literal: "HÁ {n} SEMANAS",        category: "semana",    unit: "week",    parametric: true,  template: "HÁ {n} SEMANAS",        defaultN: 2, description: "A semana que começou n semanas atrás" },

  // ── Meses ──
  { id: "mes_passado",        literal: "MÊS PASSADO",          category: "mês",       unit: "month",   parametric: false, description: "O mês anterior ao mês atual" },
  { id: "este_mes",           literal: "ESTE MÊS",             category: "mês",       unit: "month",   parametric: false, description: "O mês atual" },
  { id: "proximo_mes",        literal: "PRÓXIMO MÊS",          category: "mês",       unit: "month",   parametric: false, description: "O mês seguinte ao mês atual" },
  { id: "ultimos_n_meses",    literal: "ÚLTIMOS {n} MESES",    category: "mês",       unit: "month",   parametric: true,  template: "ÚLTIMOS {n} MESES",    defaultN: 3, description: "De n meses atrás até o mês passado" },
  { id: "proximos_n_meses",   literal: "PRÓXIMOS {n} MESES",   category: "mês",       unit: "month",   parametric: true,  template: "PRÓXIMOS {n} MESES",   defaultN: 3, description: "Do próximo mês em diante por n meses" },
  { id: "ha_n_meses",         literal: "HÁ {n} MESES",         category: "mês",       unit: "month",   parametric: true,  template: "HÁ {n} MESES",         defaultN: 6, description: "O mês que começou n meses atrás" },

  // ── Trimestres ──
  { id: "trimestre_passado",      literal: "TRIMESTRE PASSADO",         category: "trimestre", unit: "quarter", parametric: false, description: "O trimestre anterior ao trimestre atual" },
  { id: "este_trimestre",         literal: "ESTE TRIMESTRE",            category: "trimestre", unit: "quarter", parametric: false, description: "O trimestre atual" },
  { id: "proximo_trimestre",      literal: "PRÓXIMO TRIMESTRE",         category: "trimestre", unit: "quarter", parametric: false, description: "O trimestre seguinte ao trimestre atual" },
  { id: "ultimos_n_trimestres",   literal: "ÚLTIMOS {n} TRIMESTRES",   category: "trimestre", unit: "quarter", parametric: true,  template: "ÚLTIMOS {n} TRIMESTRES",   defaultN: 2, description: "De n trimestres atrás até o trimestre passado" },
  { id: "proximos_n_trimestres",  literal: "PRÓXIMOS {n} TRIMESTRES",  category: "trimestre", unit: "quarter", parametric: true,  template: "PRÓXIMOS {n} TRIMESTRES",  defaultN: 2, description: "Do próximo trimestre em diante por n trimestres" },
  { id: "ha_n_trimestres",        literal: "HÁ {n} TRIMESTRES",        category: "trimestre", unit: "quarter", parametric: true,  template: "HÁ {n} TRIMESTRES",        defaultN: 2, description: "O trimestre que começou n trimestres atrás" },

  // ── Anos ──
  { id: "ano_passado",        literal: "ANO PASSADO",          category: "ano",       unit: "year",    parametric: false, description: "O ano anterior ao ano atual" },
  { id: "este_ano",           literal: "ESTE ANO",             category: "ano",       unit: "year",    parametric: false, description: "O ano atual" },
  { id: "proximo_ano",        literal: "PRÓXIMO ANO",          category: "ano",       unit: "year",    parametric: false, description: "O ano seguinte ao ano atual" },
  { id: "ha_n_anos",          literal: "HÁ {n} ANOS",         category: "ano",       unit: "year",    parametric: true,  template: "HÁ {n} ANOS",         defaultN: 1, description: "O ano que foi n anos atrás" },
  { id: "ultimos_n_anos",     literal: "ÚLTIMOS {n} ANOS",     category: "ano",       unit: "year",    parametric: true,  template: "ÚLTIMOS {n} ANOS",     defaultN: 2, description: "De n anos atrás até o ano passado" },
  { id: "proximos_n_anos",    literal: "PRÓXIMOS {n} ANOS",    category: "ano",       unit: "year",    parametric: true,  template: "PRÓXIMOS {n} ANOS",    defaultN: 2, description: "Do próximo ano em diante por n anos" },
];

/** Categories in display order */
export const CATEGORIES: { key: RelativeDateCategory; label: string; icon: string }[] = [
  { key: "dia",       label: "Dias",       icon: "CalendarBlank" },
  { key: "semana",    label: "Semanas",    icon: "CalendarBlank" },
  { key: "mês",       label: "Meses",      icon: "CalendarBlank" },
  { key: "trimestre", label: "Trimestres", icon: "CalendarBlank" },
  { key: "ano",       label: "Anos",       icon: "CalendarBlank" },
];

/**
 * Build a resolved literal string from a catalogue option + n value.
 * E.g. ("ÚLTIMOS {n} DIAS", 30) → "ÚLTIMOS 30 DIAS"
 */
export function buildLiteral(option: RelativeDateOption, n?: number): string {
  if (!option.parametric || !option.template) return option.literal;
  return option.template.replace("{n}", String(n ?? option.defaultN ?? 1));
}

/**
 * Quick-pick: the most common relative dates for a filter dropdown.
 */
export const QUICK_PICKS: string[] = [
  "hoje",
  "ontem",
  "esta_semana",
  "semana_passada",
  "este_mes",
  "mes_passado",
  "este_trimestre",
  "este_ano",
];
