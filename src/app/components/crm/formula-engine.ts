/**
 * Zenite Formula Engine
 *
 * A safe expression evaluator for CRM calculated fields,
 * modelled after Salesforce formula fields (compute-on-read).
 *
 * Supports:
 *   - Field references:   [field_name]
 *   - Math operators:      + - * / ^ %
 *   - Comparison:          == != < > <= >=
 *   - Logical:             && || !
 *   - Strings:             "hello"
 *   - Numbers:             123  45.67
 *   - Constants:           NULL TRUE FALSE
 *   - Grouping:            ( )
 *   - Functions:           IF  ABS  ROUND  MAX  MIN  CONCAT  LEN
 *                          UPPER  LOWER  LEFT  RIGHT  TODAY
 *                          ISNULL  ISBLANK  TEXT  VALUE
 *   - Text truncation:     3 900 chars max (Salesforce spec)
 */

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

/** The data type a formula is declared to return */
export type FormulaReturnType =
  | "number"
  | "text"
  | "date"
  | "currency"
  | "percentage"
  | "boolean";

/** Definition of a single formula field */
export interface FormulaDefinition {
  /** Human-readable label, e.g. "Comissão do Vendedor" */
  label: string;
  /** The formula expression string */
  expression: string;
  /** Expected return type */
  returnType: FormulaReturnType;
  /** Currency symbol when returnType is "currency" */
  currencySymbol?: string;
  /** Number of decimal places (default 2) */
  decimalPlaces?: number;
}

/** Contextual field values supplied at evaluation time */
export type FormulaContext = Record<string, string | number | boolean | null>;

/** Schema for a field available in the Formula Builder */
export interface FieldSchema {
  key: string;       // field key used in formulas [key]
  label: string;     // human label shown in builder
  type: "text" | "number" | "currency" | "percentage" | "date" | "boolean";
  /** CRM object this field belongs to (for grouped display) */
  objectGroup?: "lead" | "oportunidade" | "contato" | "conta";
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  /** Character position of the error */
  position?: number;
}

/* ================================================================== */
/*  Tokenizer                                                          */
/* ================================================================== */

type TokenType =
  | "NUMBER"
  | "STRING"
  | "FIELD_REF"
  | "IDENT"
  | "OPERATOR"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const OPERATORS = new Set([
  "+", "-", "*", "/", "^", "%",
  "==", "!=", "<>", "<", ">", "<=", ">=",
  "&&", "||", "!",
]);

const TWO_CHAR_OPS = new Set(["==", "!=", "<>", "<=", ">=", "&&", "||"]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Field reference  [field_name]
    if (ch === "[") {
      const start = i;
      i++; // skip [
      let name = "";
      while (i < input.length && input[i] !== "]") {
        name += input[i];
        i++;
      }
      if (i >= input.length) throw new SyntaxError(`Campo sem fechar ']' na posição ${start}`);
      i++; // skip ]
      tokens.push({ type: "FIELD_REF", value: name.trim(), pos: start });
      continue;
    }

    // String literal
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      i++;
      let str = "";
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) { str += input[i + 1]; i += 2; }
        else { str += input[i]; i++; }
      }
      if (i >= input.length) throw new SyntaxError(`String sem fechar na posição ${start}`);
      i++; // skip closing quote
      tokens.push({ type: "STRING", value: str, pos: start });
      continue;
    }

    // Number
    if (/\d/.test(ch) || (ch === "." && i + 1 < input.length && /\d/.test(input[i + 1]))) {
      const start = i;
      let num = "";
      while (i < input.length && /[\d.]/.test(input[i])) { num += input[i]; i++; }
      tokens.push({ type: "NUMBER", value: num, pos: start });
      continue;
    }

    // Two-char operators
    if (i + 1 < input.length && TWO_CHAR_OPS.has(input[i] + input[i + 1])) {
      tokens.push({ type: "OPERATOR", value: input[i] + input[i + 1], pos: i });
      i += 2;
      continue;
    }

    // Single-char operators
    if (OPERATORS.has(ch)) {
      tokens.push({ type: "OPERATOR", value: ch, pos: i });
      i++;
      continue;
    }

    // Parens
    if (ch === "(") { tokens.push({ type: "LPAREN", value: "(", pos: i }); i++; continue; }
    if (ch === ")") { tokens.push({ type: "RPAREN", value: ")", pos: i }); i++; continue; }

    // Comma
    if (ch === ",") { tokens.push({ type: "COMMA", value: ",", pos: i }); i++; continue; }

    // Identifier (function name or constant)
    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      let ident = "";
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) { ident += input[i]; i++; }
      tokens.push({ type: "IDENT", value: ident, pos: start });
      continue;
    }

    throw new SyntaxError(`Caractere inesperado '${ch}' na posição ${i}`);
  }

  tokens.push({ type: "EOF", value: "", pos: i });
  return tokens;
}

/* ================================================================== */
/*  AST nodes                                                          */
/* ================================================================== */

type ASTNode =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "null" }
  | { kind: "field"; name: string }
  | { kind: "unary"; op: string; operand: ASTNode }
  | { kind: "binary"; op: string; left: ASTNode; right: ASTNode }
  | { kind: "call"; name: string; args: ASTNode[] };

/* ================================================================== */
/*  Parser  (recursive descent, operator precedence)                   */
/* ================================================================== */

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) { this.tokens = tokens; }

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  private expect(type: TokenType, value?: string): Token {
    const t = this.advance();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new SyntaxError(`Esperado ${type}${value ? ` '${value}'` : ""}, encontrado ${t.type} '${t.value}' na posição ${t.pos}`);
    }
    return t;
  }

  parse(): ASTNode {
    const node = this.parseOr();
    if (this.peek().type !== "EOF") {
      throw new SyntaxError(`Token inesperado '${this.peek().value}' na posição ${this.peek().pos}`);
    }
    return node;
  }

  // Precedence levels (low → high):
  //   || → && → comparison → add/sub → mul/div/mod → pow → unary → primary

  private parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.peek().value === "||") {
      const op = this.advance().value;
      left = { kind: "binary", op, left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseComparison();
    while (this.peek().value === "&&") {
      const op = this.advance().value;
      left = { kind: "binary", op, left, right: this.parseComparison() };
    }
    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAddSub();
    const cmpOps = new Set(["==", "!=", "<>", "<", ">", "<=", ">="]);
    while (cmpOps.has(this.peek().value)) {
      const op = this.advance().value;
      left = { kind: "binary", op: op === "<>" ? "!=" : op, left, right: this.parseAddSub() };
    }
    return left;
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();
    while (this.peek().value === "+" || this.peek().value === "-") {
      const op = this.advance().value;
      left = { kind: "binary", op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  private parseMulDiv(): ASTNode {
    let left = this.parsePow();
    while (this.peek().value === "*" || this.peek().value === "/" || this.peek().value === "%") {
      const op = this.advance().value;
      left = { kind: "binary", op, left, right: this.parsePow() };
    }
    return left;
  }

  private parsePow(): ASTNode {
    let left = this.parseUnary();
    while (this.peek().value === "^") {
      this.advance();
      left = { kind: "binary", op: "^", left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek().value === "-") {
      this.advance();
      return { kind: "unary", op: "-", operand: this.parseUnary() };
    }
    if (this.peek().value === "!") {
      this.advance();
      return { kind: "unary", op: "!", operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const t = this.peek();

    // Number literal
    if (t.type === "NUMBER") {
      this.advance();
      return { kind: "number", value: parseFloat(t.value) };
    }

    // String literal
    if (t.type === "STRING") {
      this.advance();
      return { kind: "string", value: t.value };
    }

    // Field reference
    if (t.type === "FIELD_REF") {
      this.advance();
      return { kind: "field", name: t.value };
    }

    // Parenthesised expression
    if (t.type === "LPAREN") {
      this.advance();
      const inner = this.parseOr();
      this.expect("RPAREN", ")");
      return inner;
    }

    // Identifier → constant or function call
    if (t.type === "IDENT") {
      this.advance();
      const upper = t.value.toUpperCase();

      // Constants
      if (upper === "NULL") return { kind: "null" };
      if (upper === "TRUE") return { kind: "boolean", value: true };
      if (upper === "FALSE") return { kind: "boolean", value: false };

      // Function call
      if (this.peek().type === "LPAREN") {
        this.advance(); // skip (
        const args: ASTNode[] = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.parseOr());
          while (this.peek().type === "COMMA") {
            this.advance();
            args.push(this.parseOr());
          }
        }
        this.expect("RPAREN", ")");
        return { kind: "call", name: upper, args };
      }

      // Bare identifier → treat as field reference without brackets
      return { kind: "field", name: t.value };
    }

    throw new SyntaxError(`Expressão inesperada '${t.value}' na posição ${t.pos}`);
  }
}

/* ================================================================== */
/*  Evaluator                                                          */
/* ================================================================== */

const MAX_TEXT_LENGTH = 3900; // Salesforce spec

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v.toLowerCase() === "true" || v === "1";
  return false;
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Check if a value looks like an ISO date (YYYY-MM-DD or YYYY-MM-DDTHH:mm...) */
function isDateLike(v: unknown): boolean {
  if (typeof v !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}/.test(v);
}

/** Parse a value to a Date object. Returns null if not a valid date. */
function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof v === "number") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/** Difference in whole days between two dates (d1 - d2) */
function daysDiff(d1: Date, d2: Date): number {
  const msPerDay = 86_400_000;
  // Normalize to midnight UTC to avoid timezone issues
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc1 - utc2) / msPerDay);
}

function evaluate(node: ASTNode, ctx: FormulaContext): unknown {
  switch (node.kind) {
    case "number": return node.value;
    case "string": return node.value;
    case "boolean": return node.value;
    case "null": return null;

    case "field": {
      const val = ctx[node.name];
      if (val === undefined) return null;
      return val;
    }

    case "unary": {
      const operand = evaluate(node.operand, ctx);
      if (node.op === "-") return -toNumber(operand);
      if (node.op === "!") return !toBool(operand);
      return operand;
    }

    case "binary": {
      const l = evaluate(node.left, ctx);
      const r = evaluate(node.right, ctx);

      switch (node.op) {
        // Math
        case "+": {
          // String concatenation if either side is string
          if (typeof l === "string" || typeof r === "string") return toStr(l) + toStr(r);
          return toNumber(l) + toNumber(r);
        }
        case "-": {
          // Smart date subtraction: if both sides look like dates, return difference in days
          const ld = toDate(l);
          const rd = toDate(r);
          if (ld && rd && isDateLike(l)) return daysDiff(ld, rd);
          return toNumber(l) - toNumber(r);
        }
        case "*": return toNumber(l) * toNumber(r);
        case "/": {
          const divisor = toNumber(r);
          if (divisor === 0) return null; // Division by zero → null
          return toNumber(l) / divisor;
        }
        case "^": return Math.pow(toNumber(l), toNumber(r));
        case "%": return toNumber(l) % toNumber(r);

        // Comparison
        case "==": return l === r || toStr(l) === toStr(r);
        case "!=": return l !== r && toStr(l) !== toStr(r);
        case "<": return toNumber(l) < toNumber(r);
        case ">": return toNumber(l) > toNumber(r);
        case "<=": return toNumber(l) <= toNumber(r);
        case ">=": return toNumber(l) >= toNumber(r);

        // Logical
        case "&&": return toBool(l) && toBool(r);
        case "||": return toBool(l) || toBool(r);
      }
      return null;
    }

    case "call": {
      const args = node.args.map((a) => evaluate(a, ctx));

      switch (node.name) {
        // ── Logic ──
        case "IF": {
          if (args.length < 2) throw new Error("IF requer ao menos 2 argumentos: IF(condição, valor_verdadeiro [, valor_falso])");
          return toBool(args[0]) ? args[1] : (args[2] ?? null);
        }

        // ── Math ──
        case "ABS": return Math.abs(toNumber(args[0]));
        case "CEIL": case "CEILING": return Math.ceil(toNumber(args[0]));
        case "FLOOR": return Math.floor(toNumber(args[0]));
        case "ROUND": {
          const val = toNumber(args[0]);
          const places = args.length > 1 ? toNumber(args[1]) : 0;
          const factor = Math.pow(10, places);
          return Math.round(val * factor) / factor;
        }
        case "MAX": return Math.max(...args.map(toNumber));
        case "MIN": return Math.min(...args.map(toNumber));
        case "MOD": return toNumber(args[0]) % toNumber(args[1]);
        case "SQRT": return Math.sqrt(toNumber(args[0]));
        case "LOG": return Math.log10(toNumber(args[0]));
        case "LN": return Math.log(toNumber(args[0]));
        case "EXP": return Math.exp(toNumber(args[0]));

        // ── Text ──
        case "CONCAT": return args.map(toStr).join("");
        case "LEN": return toStr(args[0]).length;
        case "UPPER": return toStr(args[0]).toUpperCase();
        case "LOWER": return toStr(args[0]).toLowerCase();
        case "TRIM": return toStr(args[0]).trim();
        case "LEFT": return toStr(args[0]).slice(0, toNumber(args[1]));
        case "RIGHT": return toStr(args[0]).slice(-toNumber(args[1]));
        case "MID": case "SUBSTR": return toStr(args[0]).slice(toNumber(args[1]), toNumber(args[1]) + toNumber(args[2]));
        case "SUBSTITUTE": case "REPLACE": return toStr(args[0]).split(toStr(args[1])).join(toStr(args[2]));
        case "CONTAINS": return toStr(args[0]).includes(toStr(args[1]));
        case "BEGINS": return toStr(args[0]).startsWith(toStr(args[1]));
        case "TEXT": return toStr(args[0]);

        // ── Type conversion ──
        case "VALUE": return toNumber(args[0]);

        // ── Null checks ──
        case "ISNULL": case "ISBLANK": return args[0] === null || args[0] === undefined || toStr(args[0]).trim() === "";
        case "BLANKVALUE": case "NULLVALUE": {
          const val = args[0];
          const isBlank = val === null || val === undefined || toStr(val).trim() === "";
          return isBlank ? args[1] : val;
        }

        // ── Date ──
        case "TODAY": return new Date().toISOString().slice(0, 10); // yyyy-mm-dd
        case "NOW": return new Date().toISOString();
        case "YEAR": return new Date(toStr(args[0])).getFullYear();
        case "MONTH": return new Date(toStr(args[0])).getMonth() + 1;
        case "DAY": return new Date(toStr(args[0])).getDate();
        case "DATEVALUE": return new Date(toStr(args[0])).toISOString().slice(0, 10);

        // ── Date arithmetic ──
        case "DATEDIFF": {
          // DATEDIFF(date1, date2) → number of days (date1 - date2)
          const d1 = toDate(args[0]);
          const d2 = toDate(args[1]);
          if (!d1 || !d2) return null;
          return daysDiff(d1, d2);
        }
        case "DAYS_SINCE": {
          // DAYS_SINCE(date) → number of days since that date until today
          const d = toDate(args[0]);
          if (!d) return null;
          return daysDiff(new Date(), d);
        }
        case "DATEADD": {
          // DATEADD(date, days) → new date string
          const d = toDate(args[0]);
          if (!d) return null;
          const nDays = toNumber(args[1]);
          const result = new Date(d);
          result.setDate(result.getDate() + nDays);
          return result.toISOString().slice(0, 10);
        }
        case "WEEKDAY": {
          // WEEKDAY(date) → 0 (Sunday) – 6 (Saturday)
          const d = toDate(args[0]);
          if (!d) return null;
          return d.getDay();
        }

        default:
          throw new Error(`Função desconhecida: ${node.name}()`);
      }
    }
  }
}

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

/**
 * Validate a formula expression without evaluating it.
 * Returns { valid: true } or { valid: false, error, position }.
 */
export function validateFormula(expression: string): ValidationResult {
  if (!expression.trim()) return { valid: false, error: "Fórmula vazia" };

  try {
    const tokens = tokenize(expression);
    new Parser(tokens).parse();
    return { valid: true };
  } catch (e: any) {
    const posMatch = e.message?.match(/posição (\d+)/);
    return {
      valid: false,
      error: e.message || "Erro de sintaxe",
      position: posMatch ? parseInt(posMatch[1], 10) : undefined,
    };
  }
}

/**
 * Evaluate a formula expression against a context of field values.
 * Returns the computed result as a string.
 *
 * Uses **compute-on-read** strategy: no value is persisted,
 * the formula is evaluated fresh every render cycle.
 */
export function evaluateFormula(
  expression: string,
  ctx: FormulaContext,
  returnType: FormulaReturnType = "number",
  options?: { currencySymbol?: string; decimalPlaces?: number },
): string {
  try {
    const tokens = tokenize(expression);
    const ast = new Parser(tokens).parse();
    const raw = evaluate(ast, ctx);

    return formatResult(raw, returnType, options);
  } catch {
    return "#ERRO";
  }
}

/**
 * Evaluate a FormulaDefinition against a context.
 */
export function evaluateDefinition(
  def: FormulaDefinition,
  ctx: FormulaContext,
): string {
  return evaluateFormula(def.expression, ctx, def.returnType, {
    currencySymbol: def.currencySymbol,
    decimalPlaces: def.decimalPlaces,
  });
}

/**
 * Extract all field references from a formula expression.
 * Useful for building a dependency graph.
 */
export function extractFieldRefs(expression: string): string[] {
  try {
    const tokens = tokenize(expression);
    return tokens
      .filter((t) => t.type === "FIELD_REF")
      .map((t) => t.value);
  } catch {
    return [];
  }
}

/**
 * Get all available built-in functions with descriptions.
 */
export function getBuiltinFunctions(): { name: string; description: string; syntax: string; category: string }[] {
  return [
    // Logic
    { name: "IF", description: "Retorna um valor se a condição é verdadeira, outro se falsa", syntax: "IF(condição, valor_verdadeiro, valor_falso)", category: "Lógica" },
    { name: "ISNULL", description: "Verifica se o campo é nulo ou vazio", syntax: "ISNULL(campo)", category: "Lógica" },
    { name: "ISBLANK", description: "Verifica se o campo é vazio", syntax: "ISBLANK(campo)", category: "Lógica" },
    { name: "BLANKVALUE", description: "Retorna valor substituto se campo for vazio", syntax: "BLANKVALUE(campo, valor_substituto)", category: "Lógica" },
    { name: "NULLVALUE", description: "Retorna valor substituto se campo for nulo", syntax: "NULLVALUE(campo, valor_substituto)", category: "Lógica" },

    // Math
    { name: "ABS", description: "Valor absoluto", syntax: "ABS(número)", category: "Matemática" },
    { name: "ROUND", description: "Arredonda para N casas decimais", syntax: "ROUND(número, casas)", category: "Matemática" },
    { name: "CEIL", description: "Arredonda para cima", syntax: "CEIL(número)", category: "Matemática" },
    { name: "FLOOR", description: "Arredonda para baixo", syntax: "FLOOR(número)", category: "Matemática" },
    { name: "MAX", description: "Maior valor entre os argumentos", syntax: "MAX(a, b, ...)", category: "Matemática" },
    { name: "MIN", description: "Menor valor entre os argumentos", syntax: "MIN(a, b, ...)", category: "Matemática" },
    { name: "MOD", description: "Resto da divisão", syntax: "MOD(dividendo, divisor)", category: "Matemática" },
    { name: "SQRT", description: "Raiz quadrada", syntax: "SQRT(número)", category: "Matemática" },

    // Text
    { name: "CONCAT", description: "Concatena textos", syntax: "CONCAT(texto1, texto2, ...)", category: "Texto" },
    { name: "LEN", description: "Comprimento do texto", syntax: "LEN(texto)", category: "Texto" },
    { name: "UPPER", description: "Converte para maiúsculas", syntax: "UPPER(texto)", category: "Texto" },
    { name: "LOWER", description: "Converte para minúsculas", syntax: "LOWER(texto)", category: "Texto" },
    { name: "TRIM", description: "Remove espaços das extremidades", syntax: "TRIM(texto)", category: "Texto" },
    { name: "LEFT", description: "Primeiros N caracteres", syntax: "LEFT(texto, N)", category: "Texto" },
    { name: "RIGHT", description: "Últimos N caracteres", syntax: "RIGHT(texto, N)", category: "Texto" },
    { name: "CONTAINS", description: "Verifica se o texto contém o trecho", syntax: "CONTAINS(texto, trecho)", category: "Texto" },
    { name: "TEXT", description: "Converte qualquer valor para texto", syntax: "TEXT(valor)", category: "Texto" },

    // Type conversion
    { name: "VALUE", description: "Converte texto para número", syntax: "VALUE(texto)", category: "Conversão" },

    // Date
    { name: "TODAY", description: "Data de hoje (YYYY-MM-DD)", syntax: "TODAY()", category: "Data" },
    { name: "NOW", description: "Data e hora atuais (ISO)", syntax: "NOW()", category: "Data" },
    { name: "YEAR", description: "Ano de uma data", syntax: "YEAR(data)", category: "Data" },
    { name: "MONTH", description: "Mês de uma data", syntax: "MONTH(data)", category: "Data" },
    { name: "DAY", description: "Dia de uma data", syntax: "DAY(data)", category: "Data" },
    { name: "DATEDIFF", description: "Diferença em dias entre duas datas", syntax: "DATEDIFF(data1, data2)", category: "Data" },
    { name: "DAYS_SINCE", description: "Dias desde uma data até hoje", syntax: "DAYS_SINCE(data)", category: "Data" },
    { name: "DATEADD", description: "Adiciona N dias a uma data", syntax: "DATEADD(data, dias)", category: "Data" },
    { name: "WEEKDAY", description: "Dia da semana (0=Dom, 6=Sáb)", syntax: "WEEKDAY(data)", category: "Data" },
  ];
}

/* ================================================================== */
/*  Internal helpers                                                   */
/* ================================================================== */

function formatResult(
  raw: unknown,
  returnType: FormulaReturnType,
  options?: { currencySymbol?: string; decimalPlaces?: number },
): string {
  if (raw === null || raw === undefined) return "—";

  const decimals = options?.decimalPlaces ?? 2;
  const curr = options?.currencySymbol ?? "R$";

  switch (returnType) {
    case "number": {
      const n = toNumber(raw);
      return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
    }
    case "currency": {
      const n = toNumber(raw);
      return `${curr} ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    case "percentage": {
      const n = toNumber(raw);
      return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: decimals })}%`;
    }
    case "boolean":
      return toBool(raw) ? "Sim" : "Não";
    case "date":
      return toStr(raw);
    case "text": {
      const s = toStr(raw);
      return s.length > MAX_TEXT_LENGTH ? s.slice(0, MAX_TEXT_LENGTH) : s;
    }
    default:
      return toStr(raw);
  }
}