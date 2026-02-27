import { useState, useRef, useCallback, useMemo } from "react";
import {
  Function as FnIcon,
  CheckCircle,
  XCircle,
  CaretDown,
  CaretRight,
  Plus,
  BracketsSquare,
  MathOperations,
  TextT,
  Calendar,
  Hash,
  Percent,
  CurrencyDollar,
  ToggleLeft,
  Lightning,
  Info,
  X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import {
  validateFormula,
  evaluateFormula,
  getBuiltinFunctions,
  type FormulaReturnType,
  type FieldSchema,
  type FormulaContext,
} from "./formula-engine";

/* ================================================================== */
/*  Style tokens                                                       */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  lineHeight: "20px",
  ...fontFeature,
} as const;

/* ================================================================== */
/*  Return type config                                                 */
/* ================================================================== */

const RETURN_TYPES: { value: FormulaReturnType; label: string; icon: React.ComponentType<any>; color: string; bg: string }[] = [
  { value: "number", label: "Número", icon: Hash, color: "#07abde", bg: "#dcf0ff" },
  { value: "text", label: "Texto", icon: TextT, color: "#8c8cd4", bg: "#e8e8fd" },
  { value: "currency", label: "Moeda", icon: CurrencyDollar, color: "#3ccea7", bg: "#d9f8ef" },
  { value: "percentage", label: "Porcentagem", icon: Percent, color: "#eac23d", bg: "#feedca" },
  { value: "date", label: "Data", icon: Calendar, color: "#ff8c76", bg: "#ffedeb" },
  { value: "boolean", label: "Booleano", icon: ToggleLeft, color: "#4e6987", bg: "#dde3ec" },
];

/* ================================================================== */
/*  Operator buttons                                                   */
/* ================================================================== */

const OPERATOR_GROUPS = [
  {
    label: "Matemáticos",
    ops: [
      { symbol: "+", label: "Adição" },
      { symbol: "-", label: "Subtração" },
      { symbol: "*", label: "Multiplicação" },
      { symbol: "/", label: "Divisão" },
      { symbol: "^", label: "Exponenciação" },
      { symbol: "%", label: "Módulo" },
    ],
  },
  {
    label: "Comparação",
    ops: [
      { symbol: "==", label: "Igual" },
      { symbol: "!=", label: "Diferente" },
      { symbol: "<", label: "Menor" },
      { symbol: ">", label: "Maior" },
      { symbol: "<=", label: "Menor ou igual" },
      { symbol: ">=", label: "Maior ou igual" },
    ],
  },
  {
    label: "Lógicos",
    ops: [
      { symbol: "&&", label: "E (AND)" },
      { symbol: "||", label: "OU (OR)" },
      { symbol: "!", label: "NÃO (NOT)" },
    ],
  },
];

/* ================================================================== */
/*  Field type icons                                                   */
/* ================================================================== */

function FieldTypeIcon({ type, size = 12 }: { type: string; size?: number }) {
  const cls = "text-[#98989d]";
  switch (type) {
    case "number": return <Hash size={size} weight="bold" className={cls} />;
    case "text": return <TextT size={size} weight="bold" className={cls} />;
    case "currency": return <CurrencyDollar size={size} weight="bold" className={cls} />;
    case "percentage": return <Percent size={size} weight="bold" className={cls} />;
    case "date": return <Calendar size={size} weight="bold" className={cls} />;
    case "boolean": return <ToggleLeft size={size} weight="bold" className={cls} />;
    default: return <BracketsSquare size={size} weight="bold" className={cls} />;
  }
}

/* ================================================================== */
/*  Object group config (for collapsible sections)                     */
/* ================================================================== */

type ObjectGroup = "lead" | "oportunidade" | "contato" | "conta";

const OBJECT_GROUP_META: Record<ObjectGroup, { label: string; color: string; bg: string }> = {
  lead:          { label: "Leads",          color: "#eac23d", bg: "#feedca" },
  oportunidade:  { label: "Oportunidades", color: "#07abde", bg: "#dcf0ff" },
  contato:       { label: "Contatos",       color: "#FF8C76", bg: "#ffedeb" },
  conta:         { label: "Contas",         color: "#23E6B2", bg: "#d4f5e2" },
};

const OBJECT_GROUP_ORDER: ObjectGroup[] = ["lead", "oportunidade", "contato", "conta"];

/* ================================================================== */
/*  Props                                                              */
/* ================================================================== */

export interface FormulaBuilderProps {
  /** Initial formula expression */
  initialExpression?: string;
  /** Initial return type */
  initialReturnType?: FormulaReturnType;
  /** Available fields the formula can reference */
  availableFields: FieldSchema[];
  /** Context values for live preview */
  previewContext?: FormulaContext;
  /** Called when the user saves */
  onSave?: (expression: string, returnType: FormulaReturnType) => void;
  /** Called when the user cancels */
  onCancel?: () => void;
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export function FormulaBuilder({
  initialExpression = "",
  initialReturnType = "number",
  availableFields,
  previewContext = {},
  onSave,
  onCancel,
}: FormulaBuilderProps) {
  const [expression, setExpression] = useState(initialExpression);
  const [returnType, setReturnType] = useState<FormulaReturnType>(initialReturnType);
  const [tab, setTab] = useState<"simples" | "avancada">("simples");
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [functionsOpen, setFunctionsOpen] = useState(false);
  const [returnTypeOpen, setReturnTypeOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [collapsedObjects, setCollapsedObjects] = useState<Set<ObjectGroup>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Toggle an object group open/closed */
  const toggleObjectGroup = useCallback((group: ObjectGroup) => {
    setCollapsedObjects((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  /** Fields grouped by CRM object — falls back to flat list if no objectGroup */
  const fieldsByObject = useMemo(() => {
    const map = new Map<ObjectGroup, FieldSchema[]>();
    for (const f of availableFields) {
      // Try explicit objectGroup first, then detect from key prefix
      let grp: ObjectGroup | null = f.objectGroup ?? null;
      if (!grp) {
        if (f.key.startsWith("lead_")) grp = "lead";
        else if (f.key.startsWith("op_")) grp = "oportunidade";
        else if (f.key.startsWith("ct_")) grp = "contato";
        else if (f.key.startsWith("ac_")) grp = "conta";
      }
      if (!grp) continue; // ungroupable → skip (won't appear in grouped view)
      if (!map.has(grp)) map.set(grp, []);
      map.get(grp)!.push(f);
    }
    // If we found at least one group, use grouped mode
    if (map.size > 0) return map;
    return null; // flat mode fallback
  }, [availableFields]);

  // Live validation
  const validation = useMemo(() => {
    if (!expression.trim()) return null;
    return validateFormula(expression);
  }, [expression]);

  // Live preview
  const preview = useMemo(() => {
    if (!expression.trim()) return "—";
    try {
      return evaluateFormula(expression, previewContext, returnType);
    } catch {
      return "#ERRO";
    }
  }, [expression, previewContext, returnType]);

  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setExpression((prev) => prev + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = expression.slice(0, start);
    const after = expression.slice(end);
    const newExpr = before + text + after;
    setExpression(newExpr);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + text.length;
    });
  }, [expression]);

  // Insert field reference
  const insertField = useCallback((key: string) => {
    insertAtCursor(`[${key}]`);
  }, [insertAtCursor]);

  // Insert function template
  const insertFunction = useCallback((name: string) => {
    insertAtCursor(`${name}()`);
    // Move cursor inside parens
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.selectionStart = ta.selectionEnd = ta.selectionStart - 1;
      }
    });
  }, [insertAtCursor]);

  // Insert operator
  const insertOperator = useCallback((op: string) => {
    insertAtCursor(` ${op} `);
  }, [insertAtCursor]);

  // Check syntax
  const handleCheckSyntax = useCallback(() => {
    const result = validateFormula(expression);
    setValidationResult(result);
    setTimeout(() => setValidationResult(null), 4000);
  }, [expression]);

  // Save
  const handleSave = useCallback(() => {
    const result = validateFormula(expression);
    if (!result.valid) {
      setValidationResult(result);
      return;
    }
    onSave?.(expression, returnType);
  }, [expression, returnType, onSave]);

  // Group functions by category
  const functionsByCategory = useMemo(() => {
    const fns = getBuiltinFunctions();
    const map = new Map<string, typeof fns>();
    for (const fn of fns) {
      if (!map.has(fn.category)) map.set(fn.category, []);
      map.get(fn.category)!.push(fn);
    }
    return map;
  }, []);

  const selectedReturnConfig = RETURN_TYPES.find((r) => r.value === returnType)!;

  return (
    <div className="flex flex-col bg-white rounded-[16px] border border-[#ebedf0] shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden max-w-[680px] w-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-[10px] px-[20px] py-[16px] border-b border-[#ebedf0]">
        <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#e8e8fd] shrink-0">
          <FnIcon size={18} weight="duotone" className="text-[#8c8cd4]" />
        </div>
        <div className="flex-1">
          <span
            className="text-[#28415c] block"
            style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, lineHeight: "20px", ...fontFeature }}
          >
            Editor de Fórmula
          </span>
          <span className="text-[#98989d] block" style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}>
            Campo calculado — somente leitura
          </span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#f6f7f9] text-[#4e6987] cursor-pointer transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* ── Return type selector ── */}
      <div className="px-[20px] pt-[16px] pb-[8px]">
        <span className="text-[#98989d] uppercase block mb-[6px]" style={labelStyle}>
          TIPO DE RETORNO
        </span>
        <div className="relative">
          <button
            onClick={() => setReturnTypeOpen((v) => !v)}
            className="flex items-center gap-[8px] h-[36px] px-[12px] rounded-[8px] border border-[#ebedf0] hover:border-[#c8cfdb] transition-colors cursor-pointer w-full"
          >
            <div
              className="flex items-center justify-center size-[20px] rounded-[4px]"
              style={{ backgroundColor: selectedReturnConfig.bg }}
            >
              <selectedReturnConfig.icon size={12} weight="bold" style={{ color: selectedReturnConfig.color }} />
            </div>
            <span className="text-[#4e6987] flex-1 text-left" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
              {selectedReturnConfig.label}
            </span>
            <CaretDown size={12} weight="bold" className="text-[#98989d]" />
          </button>

          <AnimatePresence>
            {returnTypeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-[4px] z-50 w-full bg-white rounded-[10px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-[#ebedf0] py-[4px] overflow-hidden"
              >
                {RETURN_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    onClick={() => {
                      setReturnType(rt.value);
                      setReturnTypeOpen(false);
                    }}
                    className={`flex items-center gap-[8px] w-full px-[12px] py-[8px] text-left cursor-pointer transition-colors hover:bg-[#f6f7f9] ${
                      rt.value === returnType ? "bg-[#f6f7f9]" : ""
                    }`}
                  >
                    <div
                      className="flex items-center justify-center size-[20px] rounded-[4px]"
                      style={{ backgroundColor: rt.bg }}
                    >
                      <rt.icon size={12} weight="bold" style={{ color: rt.color }} />
                    </div>
                    <span className="text-[#4e6987] flex-1" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                      {rt.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="px-[20px] pt-[8px]">
        <div
          className="flex gap-[2px] h-[36px] items-center p-[3px] rounded-[100px] bg-[#f6f7f9]"
          style={{
            boxShadow:
              "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08)",
          }}
        >
          {(["simples", "avancada"] as const).map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 h-[30px] rounded-[16px] flex items-center justify-center transition-all cursor-pointer ${
                  isActive ? "bg-[#28415c] text-[#f6f7f9]" : "text-[#98989d] hover:text-[#4e6987]"
                }`}
                style={isActive ? { boxShadow: "0px 2px 4px rgba(18,34,50,0.3)" } : undefined}
              >
                <span className="uppercase" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                  {t === "simples" ? "Simples" : "Avançada"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Left panel: Fields + Functions (simple mode) */}
        {tab === "simples" && (
          <div className="w-full md:w-[240px] border-r border-[#ebedf0] overflow-auto max-h-[420px]">
            {/* Fields */}
            <div className="border-b border-[#ebedf0]">
              <button
                onClick={() => setFieldsOpen((v) => !v)}
                className="flex items-center gap-[6px] w-full px-[16px] py-[10px] cursor-pointer hover:bg-[#f6f7f9] transition-colors"
              >
                {fieldsOpen ? (
                  <CaretDown size={12} weight="bold" className="text-[#4e6987]" />
                ) : (
                  <CaretRight size={12} weight="bold" className="text-[#4e6987]" />
                )}
                <BracketsSquare size={14} weight="bold" className="text-[#07abde]" />
                <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, ...fontFeature }}>
                  Campos
                </span>
                <span className="ml-auto text-[#98989d]" style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}>
                  {availableFields.length}
                </span>
              </button>

              <AnimatePresence>
                {fieldsOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="px-[8px] pb-[8px] flex flex-col gap-[2px]">
                      {fieldsByObject ? (
                        /* ─── Grouped by CRM object ─── */
                        OBJECT_GROUP_ORDER.filter((grp) => fieldsByObject.has(grp)).map((grp) => {
                          const meta = OBJECT_GROUP_META[grp];
                          const fields = fieldsByObject.get(grp)!;
                          const isOpen = !collapsedObjects.has(grp);
                          return (
                            <div key={grp}>
                              <button
                                onClick={() => toggleObjectGroup(grp)}
                                className="flex items-center gap-[6px] w-full px-[8px] py-[5px] rounded-[6px] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
                              >
                                {isOpen ? (
                                  <CaretDown size={10} weight="bold" className="text-[#98989d]" />
                                ) : (
                                  <CaretRight size={10} weight="bold" className="text-[#98989d]" />
                                )}
                                <div
                                  className="size-[8px] rounded-full shrink-0"
                                  style={{ backgroundColor: meta.color }}
                                />
                                <span
                                  className="text-[#28415c] flex-1 text-left"
                                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.2, ...fontFeature }}
                                >
                                  {meta.label}
                                </span>
                                <span
                                  className="text-[#98989d]"
                                  style={{ fontSize: 9, fontWeight: 600, ...fontFeature }}
                                >
                                  {fields.length}
                                </span>
                              </button>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="flex flex-col gap-[1px] pl-[10px] mb-[4px]">
                                      {fields.map((f) => (
                                        <button
                                          key={f.key}
                                          onClick={() => insertField(f.key)}
                                          className="flex items-center gap-[6px] px-[8px] py-[4px] rounded-[6px] hover:bg-[#dcf0ff] transition-colors cursor-pointer text-left group"
                                        >
                                          <FieldTypeIcon type={f.type} />
                                          <span
                                            className="text-[#4e6987] flex-1 group-hover:text-[#07abde] transition-colors truncate"
                                            style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}
                                          >
                                            {f.label}
                                          </span>
                                          <Plus size={10} weight="bold" className="text-[#c8cfdb] group-hover:text-[#07abde] transition-colors shrink-0" />
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      ) : (
                        /* ─── Flat list fallback ─── */
                        availableFields.map((f) => (
                          <button
                            key={f.key}
                            onClick={() => insertField(f.key)}
                            className="flex items-center gap-[6px] px-[8px] py-[5px] rounded-[6px] hover:bg-[#dcf0ff] transition-colors cursor-pointer text-left group"
                          >
                            <FieldTypeIcon type={f.type} />
                            <span
                              className="text-[#4e6987] flex-1 group-hover:text-[#07abde] transition-colors truncate"
                              style={{ fontSize: 12, fontWeight: 500, ...fontFeature }}
                            >
                              {f.label}
                            </span>
                            <Plus size={10} weight="bold" className="text-[#c8cfdb] group-hover:text-[#07abde] transition-colors shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Functions */}
            <div>
              <button
                onClick={() => setFunctionsOpen((v) => !v)}
                className="flex items-center gap-[6px] w-full px-[16px] py-[10px] cursor-pointer hover:bg-[#f6f7f9] transition-colors"
              >
                {functionsOpen ? (
                  <CaretDown size={12} weight="bold" className="text-[#4e6987]" />
                ) : (
                  <CaretRight size={12} weight="bold" className="text-[#4e6987]" />
                )}
                <FnIcon size={14} weight="bold" className="text-[#8c8cd4]" />
                <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, ...fontFeature }}>
                  Funções
                </span>
              </button>

              <AnimatePresence>
                {functionsOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="px-[8px] pb-[8px]">
                      {[...functionsByCategory.entries()].map(([category, fns]) => (
                        <div key={category} className="mb-[4px]">
                          <span
                            className="text-[#98989d] uppercase block px-[8px] py-[2px]"
                            style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
                          >
                            {category}
                          </span>
                          {fns.map((fn) => (
                            <button
                              key={fn.name}
                              onClick={() => insertFunction(fn.name)}
                              className="flex items-center gap-[6px] px-[8px] py-[4px] rounded-[6px] hover:bg-[#e8e8fd] transition-colors cursor-pointer text-left w-full group"
                              title={`${fn.syntax}\n${fn.description}`}
                            >
                              <FnIcon size={10} weight="bold" className="text-[#8c8cd4] shrink-0" />
                              <span
                                className="text-[#4e6987] flex-1 group-hover:text-[#8c8cd4] transition-colors truncate"
                                style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}
                              >
                                {fn.name}
                              </span>
                              <Info size={10} className="text-[#c8cfdb] shrink-0" />
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Right panel: Editor */}
        <div className="flex-1 flex flex-col">
          {/* Operator bar */}
          <div className="px-[16px] py-[8px] border-b border-[#ebedf0] flex items-center gap-[4px] flex-wrap">
            <MathOperations size={14} weight="duotone" className="text-[#98989d] mr-[4px]" />
            {OPERATOR_GROUPS.map((g) =>
              g.ops.map((op) => (
                <button
                  key={op.symbol}
                  onClick={() => insertOperator(op.symbol)}
                  title={op.label}
                  className="flex items-center justify-center h-[26px] min-w-[26px] px-[6px] rounded-[6px] bg-[#f6f7f9] hover:bg-[#dde3ec] active:bg-[#c8cfdb] text-[#4e6987] cursor-pointer transition-colors font-mono"
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  {op.symbol}
                </button>
              ))
            )}
            <button
              onClick={() => insertAtCursor("()")}
              title="Parênteses"
              className="flex items-center justify-center h-[26px] min-w-[26px] px-[6px] rounded-[6px] bg-[#f6f7f9] hover:bg-[#dde3ec] text-[#4e6987] cursor-pointer transition-colors font-mono"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              ( )
            </button>
            <button
              onClick={() => insertAtCursor("{}")}
              title="Chaves"
              className="flex items-center justify-center h-[26px] min-w-[26px] px-[6px] rounded-[6px] bg-[#f6f7f9] hover:bg-[#dde3ec] text-[#4e6987] cursor-pointer transition-colors font-mono"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              {"{ }"}
            </button>
            <button
              onClick={() => insertAtCursor("[]")}
              title="Colchetes"
              className="flex items-center justify-center h-[26px] min-w-[26px] px-[6px] rounded-[6px] bg-[#f6f7f9] hover:bg-[#dde3ec] text-[#4e6987] cursor-pointer transition-colors font-mono"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              [ ]
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 p-[16px] min-h-[140px]">
            <textarea
              ref={textareaRef}
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ex: [annualRevenue] * 0.05"
              className="w-full h-full min-h-[100px] resize-y bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb] font-mono"
              style={{ fontSize: 14, fontWeight: 500, lineHeight: "22px", fontFamily: "'DM Mono', monospace" }}
              spellCheck={false}
            />
          </div>

          {/* Live validation indicator */}
          {expression.trim() && (
            <div className="px-[16px] pb-[4px]">
              {validation?.valid ? (
                <div className="flex items-center gap-[4px]">
                  <CheckCircle size={12} weight="fill" className="text-[#3ccea7]" />
                  <span className="text-[#3ccea7]" style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}>
                    Sintaxe válida
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-[4px]">
                  <XCircle size={12} weight="fill" className="text-[#f56233]" />
                  <span className="text-[#f56233] truncate" style={{ fontSize: 11, fontWeight: 500, ...fontFeature }}>
                    {validation?.error}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="px-[16px] py-[12px] border-t border-[#ebedf0] bg-[#f6f7f9]">
            <div className="flex items-center justify-between">
              <span className="text-[#98989d] uppercase" style={labelStyle}>
                PREVIEW
              </span>
              <span
                className={`${preview === "#ERRO" ? "text-[#f56233]" : "text-[#28415c]"}`}
                style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
              >
                {preview}
              </span>
            </div>
          </div>

          {/* Validation banner */}
          <AnimatePresence>
            {validationResult && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className={`flex items-center gap-[8px] px-[16px] py-[10px] ${
                    validationResult.valid ? "bg-[#d9f8ef]" : "bg-[#ffedeb]"
                  }`}
                >
                  {validationResult.valid ? (
                    <>
                      <CheckCircle size={16} weight="fill" className="text-[#3ccea7]" />
                      <span className="text-[#3ccea7]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                        Fórmula válida! Pronta para salvar.
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} weight="fill" className="text-[#f56233]" />
                      <span className="text-[#f56233] flex-1" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                        {validationResult.error}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-[8px] px-[20px] py-[12px] border-t border-[#ebedf0]">
        <button
          onClick={handleCheckSyntax}
          className="flex items-center gap-[6px] h-[36px] px-[16px] rounded-full bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] cursor-pointer transition-colors"
        >
          <Lightning size={14} weight="bold" />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
            Checar Sintaxe
          </span>
        </button>

        <div className="flex items-center gap-[8px]">
          {onCancel && (
            <button
              onClick={onCancel}
              className="h-[36px] px-[16px] rounded-full bg-[#F6F7F9] text-[#F56233] hover:bg-[#FFEDEB] hover:text-[#F56233] cursor-pointer transition-colors"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!expression.trim() || !validation?.valid}
            className="flex items-center gap-[6px] h-[36px] px-[20px] rounded-full bg-[#3CCEA7] text-white hover:bg-[#30B893] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <CheckCircle size={14} weight="bold" />
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
              Salvar Fórmula
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}