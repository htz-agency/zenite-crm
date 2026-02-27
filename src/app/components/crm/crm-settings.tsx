import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { PillButton } from "../pill-button";
import {
  Gear,
  Function as FnIcon,
  Plus,
  PencilSimple,
  Trash,
  CaretRight,
  Lightning,
  Hash,
  TextT,
  Calendar,
  Percent,
  CurrencyDollar,
  ToggleLeft,
  Eye,
  X,
  ArrowLeft,
  CheckCircle,
  Copy,
  BracketsSquare,
  MathOperations,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { FormulaBuilder } from "./formula-builder";
import {
  evaluateFormula,
  validateFormula,
  extractFieldRefs,
  type FormulaReturnType,
} from "./formula-engine";
import {
  FORMULA_AVAILABLE_FIELDS,
  FORMULA_DEMO_CONTEXT,
} from "./formula-fields";

/* ================================================================== */
/*  Style tokens                                                       */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  lineHeight: "20px",
  textTransform: "uppercase" as const,
  ...fontFeature,
} as const;

const valueStyle = {
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: -0.5,
  lineHeight: "22px",
  ...fontFeature,
} as const;

/* ================================================================== */
/*  Return type config                                                 */
/* ================================================================== */

const RETURN_TYPES: Record<
  FormulaReturnType,
  { label: string; icon: React.ComponentType<any>; color: string; bg: string }
> = {
  number: { label: "Número", icon: Hash, color: "#07abde", bg: "#dcf0ff" },
  text: { label: "Texto", icon: TextT, color: "#8c8cd4", bg: "#e8e8fd" },
  currency: { label: "Moeda", icon: CurrencyDollar, color: "#3ccea7", bg: "#d9f8ef" },
  percentage: { label: "Porcentagem", icon: Percent, color: "#eac23d", bg: "#feedca" },
  date: { label: "Data", icon: Calendar, color: "#ff8c76", bg: "#ffedeb" },
  boolean: { label: "Booleano", icon: ToggleLeft, color: "#4e6987", bg: "#dde3ec" },
};

/* ================================================================== */
/*  Stored formula definition                                          */
/* ================================================================== */

interface StoredFormula {
  id: string;
  label: string;
  expression: string;
  returnType: FormulaReturnType;
  createdAt: string;
}

/* ================================================================== */
/*  Seed formulas                                                      */
/* ================================================================== */

const SEED_FORMULAS: StoredFormula[] = [
  {
    id: "f1",
    label: "Dias sem Contato",
    expression: "DAYS_SINCE([lead_mkt_conversao])",
    returnType: "number",
    createdAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "f2",
    label: "Alerta de Inatividade",
    expression:
      'IF(DAYS_SINCE([lead_mkt_conversao]) > 30, "Crítico", IF(DAYS_SINCE([lead_mkt_conversao]) > 14, "Atenção", "OK"))',
    returnType: "text",
    createdAt: "2026-01-15T11:00:00Z",
  },
  {
    id: "f3",
    label: "Comissão do Vendedor",
    expression: "[lead_annual_revenue] * 0.05",
    returnType: "currency",
    createdAt: "2026-01-20T09:00:00Z",
  },
  {
    id: "f4",
    label: "Receita por Funcionário",
    expression: "[lead_annual_revenue] / [lead_employee_count]",
    returnType: "currency",
    createdAt: "2026-01-20T09:15:00Z",
  },
  {
    id: "f5",
    label: "Classificação do Lead",
    expression:
      'IF([lead_qual_progress] >= 80, "Lead quente", IF([lead_qual_progress] >= 50, "Lead em nutrição", "Lead frio"))',
    returnType: "text",
    createdAt: "2026-02-01T14:00:00Z",
  },
  {
    id: "f6",
    label: "Score Normalizado",
    expression: "[lead_qual_progress]",
    returnType: "percentage",
    createdAt: "2026-02-01T14:10:00Z",
  },
];

/* ================================================================== */
/*  Small components                                                   */
/* ================================================================== */

function ReturnTypeBadge({ type }: { type: FormulaReturnType }) {
  const config = RETURN_TYPES[type];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-[6px] h-[26px] px-[10px] rounded-[6px]" style={{ backgroundColor: config.bg }}>
      <Icon size={12} weight="bold" style={{ color: config.color }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.2, color: config.color, ...fontFeature }}>
        {config.label}
      </span>
    </div>
  );
}

function FieldRefChip({ fieldKey }: { fieldKey: string }) {
  const field = FORMULA_AVAILABLE_FIELDS.find((f) => f.key === fieldKey);
  return (
    <span
      className="inline-flex items-center gap-[3px] h-[20px] px-[6px] rounded-[4px] bg-[#dcf0ff]"
      style={{ fontSize: 10, fontWeight: 600, color: "#07abde", ...fontFeature }}
    >
      <BracketsSquare size={10} weight="bold" />
      {field?.label ?? fieldKey}
    </span>
  );
}

/* ================================================================== */
/*  HorizontalDivider SVG (consistent with the rest of the app)        */
/* ================================================================== */

function HorizontalDivider() {
  return (
    <svg className="w-full h-[1.5px] shrink-0" fill="none" preserveAspectRatio="none" viewBox="0 0 100 1.5">
      <line stroke="#DDE3EC" strokeLinecap="round" strokeWidth="1.5" x1="0" y1="0.75" x2="100" y2="0.75" />
    </svg>
  );
}

/* ================================================================== */
/*  Settings Sections                                                  */
/* ================================================================== */

function SectionHeader({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <div
        className="flex items-center justify-center size-[36px] rounded-[8px] shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[#28415c] block" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, lineHeight: "22px", ...fontFeature }}>
          {title}
        </span>
        {subtitle && (
          <span className="text-[#98989d] block" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}>
            {subtitle}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

/* ================================================================== */
/*  Formula Row                                                        */
/* ================================================================== */

function FormulaRow({
  formula,
  onEdit,
  onDelete,
  onPreview,
}: {
  formula: StoredFormula;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const refs = [...new Set(extractFieldRefs(formula.expression))];
  const preview = evaluateFormula(formula.expression, FORMULA_DEMO_CONTEXT, formula.returnType);
  const isValid = validateFormula(formula.expression).valid;

  return (
    <div className="group flex items-start gap-[12px] px-[16px] py-[14px] hover:bg-[#f6f7f9] transition-colors rounded-[10px]">
      {/* Icon */}
      <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#e8e8fd] shrink-0 mt-[2px]">
        <FnIcon size={16} weight="duotone" className="text-[#8c8cd4]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: name + return type */}
        <div className="flex items-center gap-[8px] mb-[4px]">
          <span className="text-[#28415c] truncate" style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3, lineHeight: "20px", ...fontFeature }}>
            {formula.label}
          </span>
          <ReturnTypeBadge type={formula.returnType} />
          {!isValid && (
            <span className="text-[#f56233] shrink-0" style={{ fontSize: 10, fontWeight: 700, ...fontFeature }}>
              ERRO
            </span>
          )}
        </div>

        {/* Row 2: expression (monospace) */}
        <div className="flex items-center gap-[6px] mb-[6px]">
          <MathOperations size={12} weight="duotone" className="text-[#98989d] shrink-0" />
          <code
            className="text-[#4e6987] truncate block"
            style={{ fontSize: 12, fontWeight: 500, lineHeight: "18px", fontFamily: "'DM Mono', monospace" }}
          >
            {formula.expression}
          </code>
        </div>

        {/* Row 3: field refs + preview */}
        <div className="flex items-center gap-[8px] flex-wrap">
          {refs.slice(0, 4).map((ref) => (
            <FieldRefChip key={ref} fieldKey={ref} />
          ))}
          {refs.length > 4 && (
            <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}>
              +{refs.length - 4}
            </span>
          )}

          <span className="text-[#c8cfdb] mx-[2px]">·</span>

          <span className="text-[#98989d]" style={labelStyle}>
            PREVIEW
          </span>
          <span
            className={`${preview === "#ERRO" ? "text-[#f56233]" : "text-[#28415c]"}`}
            style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}
          >
            {preview}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-[2px]">
        <button
          onClick={onPreview}
          title="Visualizar"
          className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#dde3ec] text-[#4e6987] cursor-pointer transition-colors"
        >
          <Eye size={14} weight="bold" />
        </button>
        <button
          onClick={onEdit}
          title="Editar"
          className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#dcf0ff] text-[#07abde] cursor-pointer transition-colors"
        >
          <PencilSimple size={14} weight="bold" />
        </button>
        <button
          onClick={onDelete}
          title="Excluir"
          className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#ffedeb] text-[#f56233] cursor-pointer transition-colors"
        >
          <Trash size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Detail / Preview Panel                                             */
/* ================================================================== */

function FormulaDetailPanel({
  formula,
  onClose,
  onEdit,
}: {
  formula: StoredFormula;
  onClose: () => void;
  onEdit: () => void;
}) {
  const refs = [...new Set(extractFieldRefs(formula.expression))];
  const preview = evaluateFormula(formula.expression, FORMULA_DEMO_CONTEXT, formula.returnType);
  const validation = validateFormula(formula.expression);
  const config = RETURN_TYPES[formula.returnType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="w-full lg:w-[360px] shrink-0 bg-white rounded-[16px] border border-[#ebedf0] overflow-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-[10px] px-[20px] py-[16px] border-b border-[#ebedf0]">
        <div className="flex items-center justify-center size-[32px] rounded-[8px] bg-[#e8e8fd] shrink-0">
          <FnIcon size={18} weight="duotone" className="text-[#8c8cd4]" />
        </div>
        <span className="text-[#28415c] flex-1 truncate" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}>
          {formula.label}
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center size-[28px] rounded-full hover:bg-[#f6f7f9] text-[#4e6987] cursor-pointer transition-colors"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Body */}
      <div className="p-[20px] flex flex-col gap-[20px]">
        {/* Return type */}
        <div>
          <span className="text-[#98989d] block mb-[6px]" style={labelStyle}>TIPO DE RETORNO</span>
          <div className="flex items-center gap-[8px]">
            <div className="flex items-center justify-center size-[24px] rounded-[6px]" style={{ backgroundColor: config.bg }}>
              <Icon size={14} weight="bold" style={{ color: config.color }} />
            </div>
            <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, ...fontFeature }}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Expression */}
        <div>
          <span className="text-[#98989d] block mb-[6px]" style={labelStyle}>EXPRESSÃO</span>
          <div className="bg-[#f6f7f9] rounded-[8px] p-[12px]">
            <code
              className="text-[#28415c] break-all"
              style={{ fontSize: 13, fontWeight: 500, lineHeight: "20px", fontFamily: "'DM Mono', monospace" }}
            >
              {formula.expression}
            </code>
          </div>
        </div>

        {/* Validation */}
        <div>
          <span className="text-[#98989d] block mb-[6px]" style={labelStyle}>VALIDAÇÃO</span>
          {validation.valid ? (
            <div className="flex items-center gap-[6px]">
              <CheckCircle size={14} weight="fill" className="text-[#3ccea7]" />
              <span className="text-[#3ccea7]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                Sintaxe válida
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-[6px]">
              <X size={14} weight="bold" className="text-[#f56233]" />
              <span className="text-[#f56233]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                {validation.error}
              </span>
            </div>
          )}
        </div>

        {/* Field references */}
        <div>
          <span className="text-[#98989d] block mb-[6px]" style={labelStyle}>
            CAMPOS REFERENCIADOS ({refs.length})
          </span>
          <div className="flex flex-wrap gap-[6px]">
            {refs.map((ref) => (
              <FieldRefChip key={ref} fieldKey={ref} />
            ))}
            {refs.length === 0 && (
              <span className="text-[#c8cfdb]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
                Nenhum campo referenciado
              </span>
            )}
          </div>
        </div>

        <HorizontalDivider />

        {/* Live preview */}
        <div>
          <span className="text-[#98989d] block mb-[6px]" style={labelStyle}>PREVIEW (DADOS DE EXEMPLO)</span>
          <div
            className="flex items-center justify-center h-[56px] rounded-[10px] bg-[#f6f7f9]"
            style={{ border: "1px solid rgba(200,207,219,0.6)" }}
          >
            <span
              className={`${preview === "#ERRO" ? "text-[#f56233]" : "text-[#28415c]"}`}
              style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, ...fontFeature }}
            >
              {preview}
            </span>
          </div>
          <p className="text-[#98989d] mt-[6px]" style={{ fontSize: 11, fontWeight: 500, lineHeight: "16px", ...fontFeature }}>
            Resultado calculado com dados do lead de exemplo (XPTO Company).
          </p>
        </div>

        {/* Metadata */}
        <div className="flex gap-[16px]">
          <div>
            <span className="text-[#98989d] block mb-[2px]" style={labelStyle}>CRIADO EM</span>
            <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 500, ...fontFeature }}>
              {new Date(formula.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div>
            <span className="text-[#98989d] block mb-[2px]" style={labelStyle}>ID</span>
            <span className="text-[#07abde] font-mono" style={{ fontSize: 12, fontWeight: 500 }}>
              {formula.id}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[20px] py-[14px] border-t border-[#ebedf0] flex gap-[8px]">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-[6px] h-[40px] rounded-full bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] cursor-pointer transition-colors"
        >
          <PencilSimple size={14} weight="bold" />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
            Editar Fórmula
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Delete Confirmation Modal                                          */
/* ================================================================== */

function DeleteConfirmModal({
  formula,
  onConfirm,
  onCancel,
}: {
  formula: StoredFormula;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-[24px]"
    >
      <div className="absolute inset-0 bg-[#28415c]/30 backdrop-blur-[4px]" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 bg-white rounded-[16px] p-[24px] max-w-[400px] w-full shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-center gap-[10px] mb-[16px]">
          <div className="flex items-center justify-center size-[36px] rounded-[8px] bg-[#ffedeb] shrink-0">
            <Trash size={18} weight="duotone" className="text-[#f56233]" />
          </div>
          <span className="text-[#28415c]" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}>
            Excluir campo calculado
          </span>
        </div>
        <p className="text-[#4e6987] mb-[6px]" style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", ...fontFeature }}>
          Tem certeza que deseja excluir o campo <strong>"{formula.label}"</strong>?
        </p>
        <p className="text-[#98989d] mb-[20px]" style={{ fontSize: 13, fontWeight: 500, lineHeight: "18px", ...fontFeature }}>
          Essa ação não pode ser desfeita. O campo será removido de todos os registros.
        </p>
        <div className="flex gap-[8px] justify-end">
          <button
            onClick={onCancel}
            className="h-[40px] px-[20px] rounded-[500px] text-[#4e6987] hover:bg-[#f6f7f9] cursor-pointer transition-colors"
            style={{ fontSize: 13, fontWeight: 600, ...fontFeature }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-[6px] h-[40px] px-[20px] rounded-[500px] bg-[#f56233] text-white hover:bg-[#d94e25] cursor-pointer transition-colors"
          >
            <Trash size={14} weight="bold" />
            <span style={{ fontSize: 13, fontWeight: 600, ...fontFeature }}>Excluir</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Main Settings Component                                            */
/* ================================================================== */

export function CrmSettings() {
  const navigate = useNavigate();

  // ── State ──
  const [formulas, setFormulas] = useState<StoredFormula[]>(SEED_FORMULAS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<StoredFormula | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredFormula | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Derived ──
  const selectedFormula = formulas.find((f) => f.id === selectedId) ?? null;

  const filteredFormulas = useMemo(() => {
    if (!searchQuery.trim()) return formulas;
    const q = searchQuery.toLowerCase();
    return formulas.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.expression.toLowerCase().includes(q) ||
        f.returnType.toLowerCase().includes(q),
    );
  }, [formulas, searchQuery]);

  // ── Handlers ──
  const handleCreate = useCallback(() => {
    setEditingFormula(null);
    setBuilderOpen(true);
  }, []);

  const handleEdit = useCallback(
    (formula: StoredFormula) => {
      setEditingFormula(formula);
      setBuilderOpen(true);
    },
    [],
  );

  const handleSave = useCallback(
    (expression: string, returnType: FormulaReturnType) => {
      if (editingFormula) {
        // Update existing
        setFormulas((prev) =>
          prev.map((f) =>
            f.id === editingFormula.id ? { ...f, expression, returnType } : f,
          ),
        );
      } else {
        // Create new
        const label = `Campo Calculado ${formulas.length + 1}`;
        const newFormula: StoredFormula = {
          id: `f${Date.now()}`,
          label,
          expression,
          returnType,
          createdAt: new Date().toISOString(),
        };
        setFormulas((prev) => [...prev, newFormula]);
        setSelectedId(newFormula.id);
      }
      setBuilderOpen(false);
      setEditingFormula(null);
    },
    [editingFormula, formulas.length],
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setFormulas((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
  }, [deleteTarget, selectedId]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex gap-[12px] flex-1 min-h-0 overflow-hidden">
        {/* ─── Left: Formula list ─── */}
        <div className="flex-1 bg-white rounded-[16px] overflow-auto min-w-0">
          <div className="p-[20px]">
            {/* Section header */}
            <SectionHeader
              icon={<FnIcon size={20} weight="duotone" />}
              iconBg="#DDE3EC"
              iconColor="#4E6987"
              title="Campos Calculados"
              subtitle="Crie campos derivados com fórmulas — somente leitura, valor computado automaticamente."
              action={
                <PillButton
                  onClick={handleCreate}
                  icon={<Plus size={16} weight="bold" />}
                >
                  Nova Fórmula
                </PillButton>
              }
            />

            {/* Search */}
            <div className="mt-[16px] mb-[12px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar campo calculado..."
                className="w-full h-[40px] px-[14px] rounded-[10px] bg-[#f6f7f9] border border-transparent focus:border-[#07abde] focus:bg-white outline-none text-[#28415c] placeholder:text-[#c8cfdb] transition-colors"
                style={{ fontSize: 14, fontWeight: 500, ...fontFeature }}
              />
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-[16px] mb-[8px] px-[4px]">
              <span className="text-[#98989d]" style={labelStyle}>
                {filteredFormulas.length} {filteredFormulas.length === 1 ? "CAMPO" : "CAMPOS"}
              </span>
              <span className="text-[#c8cfdb]">·</span>
              <span className="text-[#98989d]" style={labelStyle}>
                {filteredFormulas.filter((f) => validateFormula(f.expression).valid).length} VÁLIDOS
              </span>
            </div>

            <HorizontalDivider />

            {/* Formula rows */}
            <div className="flex flex-col gap-[2px] mt-[4px]">
              {filteredFormulas.map((formula) => (
                <div
                  key={formula.id}
                  onClick={() => setSelectedId(formula.id)}
                  className={`cursor-pointer rounded-[10px] transition-all ${
                    selectedId === formula.id
                      ? "ring-2 ring-[#07abde] ring-offset-1"
                      : ""
                  }`}
                >
                  <FormulaRow
                    formula={formula}
                    onEdit={() => handleEdit(formula)}
                    onDelete={() => setDeleteTarget(formula)}
                    onPreview={() => setSelectedId(formula.id)}
                  />
                </div>
              ))}

              {filteredFormulas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-[40px]">
                  <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#f6f7f9] mb-[12px]">
                    <FnIcon size={24} weight="duotone" className="text-[#c8cfdb]" />
                  </div>
                  <span className="text-[#98989d]" style={{ fontSize: 15, fontWeight: 500, ...fontFeature }}>
                    {searchQuery ? "Nenhum resultado encontrado" : "Nenhum campo calculado criado"}
                  </span>
                  {!searchQuery && (
                    <button
                      onClick={handleCreate}
                      className="mt-[12px] flex items-center gap-[6px] h-[36px] px-[16px] rounded-[500px] border border-[#ebedf0] hover:border-[#c8cfdb] text-[#4e6987] cursor-pointer transition-colors"
                    >
                      <Plus size={14} weight="bold" />
                      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                        Criar primeiro campo
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right: Detail panel ─── */}
        <AnimatePresence mode="wait">
          {selectedFormula && (
            <FormulaDetailPanel
              key={selectedFormula.id}
              formula={selectedFormula}
              onClose={() => setSelectedId(null)}
              onEdit={() => handleEdit(selectedFormula)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ═══════ FORMULA BUILDER MODAL ═══════ */}
      <AnimatePresence>
        {builderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-[24px]"
          >
            <div
              className="absolute inset-0 bg-[#28415c]/30 backdrop-blur-[4px]"
              onClick={() => {
                setBuilderOpen(false);
                setEditingFormula(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 w-full max-w-[680px]"
            >
              <FormulaBuilder
                initialExpression={editingFormula?.expression ?? ""}
                initialReturnType={editingFormula?.returnType ?? "number"}
                availableFields={FORMULA_AVAILABLE_FIELDS}
                previewContext={FORMULA_DEMO_CONTEXT}
                onCancel={() => {
                  setBuilderOpen(false);
                  setEditingFormula(null);
                }}
                onSave={handleSave}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ DELETE CONFIRMATION ═══════ */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            formula={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}