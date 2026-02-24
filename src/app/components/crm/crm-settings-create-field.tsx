/**
 * CRM Settings — Criar Novo Campo
 *
 * Full-page field builder with dynamic type-specific configuration.
 * Object selector, field metadata, backend column name, and rich
 * per-type editors (options for picklist/multi, formats for number, etc.).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  LEAD_FIELDS,
  OPPORTUNITY_FIELDS,
  CONTACT_FIELDS,
  ACCOUNT_FIELDS,
  type NativeField,
} from "./crm-settings-native-fields";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plus,
  Trash,
  DotsSixVertical,
  TextT,
  Hash,
  Phone,
  EnvelopeSimple,
  Calendar,
  Link as LinkIcon,
  UserCircle,
  ToggleLeft,
  MapPin,
  Tag,
  ListBullets,
  Timer,
  CurrencyDollar,
  Percent,
  TextAlignLeft,
  TreeStructure,
  CaretCircleUpDown,
  Fingerprint,
  Check,
  FloppyDisk,
  Info,
  Eye,
  Asterisk,
  Database,
  CaretDown,
  Shapes,
  Function as FunctionIcon,
  Lightning,
  Warning,
  Code,
  ArrowRight,
} from "@phosphor-icons/react";
import { ZeniteToggle } from "../zenite-toggle";
import { FormulaBuilder } from "./formula-builder";
import { saveCustomField, patchFieldConfig, getFieldConfig, listCustomFields, type CustomFieldDef } from "./crm-api";
import { toast } from "sonner";
import {
  type FormulaReturnType,
} from "./formula-engine";
import {
  FORMULA_AVAILABLE_FIELDS,
  FORMULA_DEMO_CONTEXT,
} from "./formula-fields";

/* ================================================================== */
/*  Shared styles                                                      */
/* ================================================================== */

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

function HorizontalDivider() {
  return (
    <svg className="w-full h-[1.5px] shrink-0" fill="none" preserveAspectRatio="none" viewBox="0 0 100 1.5">
      <line x1="0" y1="0.75" x2="100" y2="0.75" stroke="#C8CFDB" strokeOpacity="0.6" strokeWidth="1" />
    </svg>
  );
}

/* ================================================================== */
/*  Field type definitions                                             */
/* ================================================================== */

type FieldType =
  | "text" | "textarea" | "phone" | "email" | "link" | "user"
  | "boolean" | "date" | "time" | "datetime" | "number" | "percentage"
  | "currency" | "duration" | "association" | "address" | "type" | "multipicklist" | "combobox"
  | "contextual" | "calculated" | "id";

type ObjectType = "lead" | "oportunidade" | "contato" | "conta";

const FIELD_TYPE_META: Record<FieldType, { label: string; color: string; bg: string; icon: React.ComponentType<any>; desc: string }> = {
  text:          { label: "Texto",          color: "#4e6987", bg: "#f0f2f5", icon: TextT,          desc: "Campo de texto simples com limite de caracteres" },
  textarea:      { label: "Texto Longo",    color: "#4e6987", bg: "#f0f2f5", icon: TextAlignLeft,  desc: "Texto com múltiplas linhas e rich text opcional" },
  phone:         { label: "Telefone",       color: "#3ccea7", bg: "#d9f8ef", icon: Phone,          desc: "Formatação automática de telefone brasileiro" },
  email:         { label: "Email",          color: "#07abde", bg: "#dcf0ff", icon: EnvelopeSimple, desc: "Validação automática de email" },
  link:          { label: "Link",           color: "#07abde", bg: "#dcf0ff", icon: LinkIcon,       desc: "URL com validação e preview" },
  user:          { label: "Usuário",        color: "#07abde", bg: "#dcf0ff", icon: UserCircle,     desc: "Referência a um usuário do sistema" },
  boolean:       { label: "Booleano",       color: "#3ccea7", bg: "#d9f8ef", icon: ToggleLeft,     desc: "Toggle sim/não com rótulos personalizáveis" },
  date:          { label: "Data",           color: "#eac23d", bg: "#feedca", icon: Calendar,       desc: "Seletor de data com formato configurável" },
  time:          { label: "Hora",           color: "#eac23d", bg: "#feedca", icon: Timer,          desc: "Campo de hora (12h ou 24h)" },
  datetime:      { label: "Data e Hora",    color: "#eac23d", bg: "#feedca", icon: Calendar,       desc: "Data e hora combinados" },
  number:        { label: "Número",         color: "#8c8cd4", bg: "#e8e8fd", icon: Hash,           desc: "Número com casas decimais, mín/máx" },
  percentage:    { label: "Porcentagem",    color: "#8c8cd4", bg: "#e8e8fd", icon: Percent,        desc: "Porcentagem com precisão configurável" },
  currency:      { label: "Moeda",          color: "#3ccea7", bg: "#d9f8ef", icon: CurrencyDollar, desc: "Valor monetário com símbolo e formato" },
  duration:      { label: "Duração",        color: "#eac23d", bg: "#feedca", icon: Timer,          desc: "Tempo em minutos, horas ou dias" },
  address:       { label: "Endereço",       color: "#4e6987", bg: "#f0f2f5", icon: MapPin,         desc: "Endereço completo com sub-campos" },
  type:          { label: "Etiqueta",       color: "#ff8c76", bg: "#ffedeb", icon: Tag,            desc: "Lista de opções com seleção única" },
  multipicklist: { label: "Multi-seleção",  color: "#ff8c76", bg: "#ffedeb", icon: ListBullets,    desc: "Lista de opções com seleção múltipla" },
  combobox:      { label: "Combobox",       color: "#ff8c76", bg: "#ffedeb", icon: CaretCircleUpDown, desc: "Dropdown com busca e texto livre opcional" },
  association:   { label: "Associação",     color: "#07abde", bg: "#dcf0ff", icon: TreeStructure,  desc: "Referência a outro objeto do CRM" },
  contextual:    { label: "Contextual",     color: "#8C8CD4", bg: "#e8e8fd", icon: Shapes,        desc: "Opções dinâmicas baseadas no contexto lógico do registro" },
  calculated:    { label: "Calculado",      color: "#8C8CD4", bg: "#e8e8fd", icon: FunctionIcon, desc: "Valor gerado automaticamente por fórmula sobre outros campos" },
  id:            { label: "ID",             color: "#98989d", bg: "#f0f2f5", icon: Fingerprint,   desc: "Identificador único do registro gerado pelo sistema" },
};

const OBJECT_INFO: Record<ObjectType, { label: string; color: string; bg: string }> = {
  lead:          { label: "Lead",          color: "#eac23d", bg: "#feedca" },
  oportunidade:  { label: "Oportunidade",  color: "#07abde", bg: "#dcf0ff" },
  contato:       { label: "Contato",       color: "#8c8cd4", bg: "#e8e8fd" },
  conta:         { label: "Conta",         color: "#3eb370", bg: "#d4f5e2" },
};

const ORDERED_TYPES: FieldType[] = [
  "text", "textarea", "number", "currency", "percentage",
  "phone", "email", "link",
  "date", "time", "datetime", "duration",
  "type", "multipicklist", "combobox",
  "boolean", "user", "address",
  "contextual", "calculated",
];

/* ================================================================== */
/*  Picklist option item type                                          */
/* ================================================================== */

interface PickOption {
  id: string;
  label: string;
  color: string;
}

const OPTION_COLORS = [
  "#07abde", "#3ccea7", "#eac23d", "#ff8c76", "#8c8cd4",
  "#3eb370", "#e85d75", "#4e6987", "#f5a623", "#6c5ce7",
];

/* ================================================================== */
/*  HTZ Palette for color picker                                       */
/* ================================================================== */

const HTZ_PALETTE: { group: string; colors: string[] }[] = [
  { group: "Blue",    colors: ["#DCF0FF", "#73D0FF", "#07ABDE", "#0483AB", "#025E7B", "#013B4F"] },
  { group: "Green",   colors: ["#D9F8EF", "#4BFACB", "#23E6B2", "#3CCEA7", "#135543", "#083226"] },
  { group: "Red",     colors: ["#FFEDEB", "#FFC6BE", "#FF8C76", "#ED5200", "#B13B00", "#782500"] },
  { group: "Yellow",  colors: ["#FEEDCA", "#F5DA82", "#EAC23D", "#917822", "#685516", "#42350A"] },
  { group: "Purple",  colors: ["#E8E8FD", "#B0B0D6", "#8C8CD4", "#6868B1", "#4E4E91", "#31315C"] },
  { group: "Neutral", colors: ["#FFFFFF", "#F6F7F9", "#C8CFDB", "#4E6987", "#28415C", "#122232"] },
];

/* ------------------------------------------------------------------ */
/*  PaletteColorPicker                                                 */
/* ------------------------------------------------------------------ */

function PaletteColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const PANEL_H = 250;

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < PANEL_H + 10
      ? rect.top - PANEL_H - 6
      : rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.left - 90, window.innerWidth - 230));
    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="absolute inset-0 cursor-pointer w-[18px] h-[18px] z-10"
        aria-label="Escolher cor"
      />
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] rounded-[12px] bg-white p-[12px] flex flex-col gap-[6px]"
            style={{
              top: pos.top,
              left: pos.left,
              boxShadow: "0 8px 30px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid rgba(200,207,219,0.5)",
              width: 222,
              maxHeight: "calc(100vh - 20px)",
              overflowY: "auto",
            }}
          >
            
            {HTZ_PALETTE.map((group) => (
              <div key={group.group} className="flex gap-[4px]">
                {group.colors.map((c) => {
                  const isActive = value.toUpperCase() === c.toUpperCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { onChange(c); setOpen(false); }}
                      className="relative size-[28px] rounded-[6px] shrink-0 cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                      style={{
                        backgroundColor: c,
                        border: c === "#FFFFFF" ? "1px solid rgba(200,207,219,0.6)" : "2px solid transparent",
                        ...(isActive ? { border: "2px solid #07abde", boxShadow: "0 0 0 1px #07abde" } : {}),
                      }}
                      title={c}
                    >
                      {isActive && (
                        <Check
                          size={14}
                          weight="bold"
                          className={
                            ["#FFFFFF", "#F6F7F9", "#DCF0FF", "#D9F8EF", "#FFEDEB", "#FEEDCA", "#E8E8FD", "#C8CFDB", "#73D0FF", "#4BFACB", "#FFC6BE", "#F5DA82", "#B0B0D6"].includes(c)
                              ? "text-[#28415c]"
                              : "text-white"
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

/* ================================================================== */
/*  Label → snake_case helper                                          */
/* ================================================================== */

function labelToSnake(label: string): string {
  return label
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/* ================================================================== */
/*  Reusable input                                                     */
/* ================================================================== */

function FieldInput({
  label, required, value, onChange, placeholder, mono, icon, disabled, type = "text",
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; icon?: React.ReactNode; disabled?: boolean; type?: string;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        className="text-[#4e6987]"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
      >
        {label} {required && <span className="text-[#ff8c76]">*</span>}
      </label>
      <div className="relative flex items-center">
        {icon && <div className="absolute left-[12px] text-[#98989d]">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-[40px] px-[14px] rounded-[10px] bg-[#f6f7f9] text-[#28415c] placeholder:text-[#c8cfdb] outline-none transition-all focus:ring-2 focus:ring-[#07abde]/30 disabled:opacity-50 disabled:cursor-not-allowed ${
            icon ? "pl-[36px]" : ""
          } ${mono ? "font-mono" : ""}`}
          style={{
            fontSize: mono ? 13 : 14,
            fontWeight: 500,
            letterSpacing: mono ? 0 : -0.3,
            border: "1px solid rgba(200,207,219,0.6)",
            fontFamily: mono ? "'DM Mono', monospace" : undefined,
            ...ff,
          }}
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Reusable number input                                              */
/* ================================================================== */

function NumberInput({
  label, value, onChange, min, max, step, placeholder,
}: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void;
  min?: number; max?: number; step?: number; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        className="text-[#4e6987]"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
      >
        {label}
      </label>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="w-full h-[40px] px-[14px] rounded-[10px] bg-[#f6f7f9] text-[#28415c] placeholder:text-[#c8cfdb] outline-none transition-all focus:ring-2 focus:ring-[#07abde]/30"
        style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, border: "1px solid rgba(200,207,219,0.6)", ...ff }}
      />
    </div>
  );
}

/* ================================================================== */
/*  Reusable select                                                    */
/* ================================================================== */

function FieldSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        className="text-[#4e6987]"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[40px] px-[14px] pr-[36px] rounded-[10px] bg-[#f6f7f9] text-[#28415c] outline-none appearance-none cursor-pointer transition-all focus:ring-2 focus:ring-[#07abde]/30"
          style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, border: "1px solid rgba(200,207,219,0.6)", ...ff }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#98989d] pointer-events-none" />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Options editor (for type / multipicklist / combobox)                */
/* ================================================================== */

function OptionsEditor({
  options, onChange, allowColors = true,
}: {
  options: PickOption[]; onChange: (opts: PickOption[]) => void; allowColors?: boolean;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addOption = () => {
    onChange([...options, {
      id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: "",
      color: OPTION_COLORS[options.length % OPTION_COLORS.length],
    }]);
  };

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  const updateLabel = (idx: number, label: string) => {
    onChange(options.map((o, i) => i === idx ? { ...o, label } : o));
  };

  const updateColor = (idx: number, color: string) => {
    onChange(options.map((o, i) => i === idx ? { ...o, color } : o));
  };

  const moveOption = (from: number, to: number) => {
    if (to < 0 || to >= options.length) return;
    const arr = [...options];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <label
        className="text-[#4e6987]"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
      >
        Opções
      </label>

      {options.length === 0 && (
        <div
          className="flex items-center justify-center h-[60px] rounded-[10px] border-2 border-dashed border-[#c8cfdb]/50"
        >
          <span className="text-[#98989d]" style={{ fontSize: 13, fontWeight: 500, ...ff }}>
            Nenhuma opção adicionada
          </span>
        </div>
      )}

      <div className="flex flex-col gap-[4px]">
        {options.map((opt, idx) => (
          <div
            key={opt.id}
            className="group/opt flex items-center gap-[8px] h-[40px] px-[8px] rounded-[8px] bg-[#f6f7f9] hover:bg-[#eef0f4] transition-colors"
          >
            {/* Drag handle */}
            <button
              className="shrink-0 text-[#c8cfdb] hover:text-[#4e6987] cursor-grab active:cursor-grabbing transition-colors"
              onMouseDown={() => setDragIdx(idx)}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(idx)); setDragIdx(idx); }}
              onDragEnd={() => setDragIdx(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData("text/plain"));
                moveOption(from, idx);
                setDragIdx(null);
              }}
            >
              <DotsSixVertical size={14} weight="bold" />
            </button>

            {/* Order number */}
            <span
              className="text-[#98989d] shrink-0 w-[20px] text-center"
              style={{ fontSize: 11, fontWeight: 700, ...ff }}
            >
              {idx + 1}
            </span>

            {/* Color dot */}
            {allowColors && (
              <div className="relative shrink-0">
                <PaletteColorPicker
                  value={opt.color}
                  onChange={(c) => updateColor(idx, c)}
                />
                <div
                  className="size-[18px] rounded-full border-2 border-white shrink-0 cursor-pointer"
                  style={{ backgroundColor: opt.color, boxShadow: "0px 1px 2px rgba(0,0,0,0.15)" }}
                />
              </div>
            )}

            {/* Label input */}
            <input
              type="text"
              value={opt.label}
              onChange={(e) => updateLabel(idx, e.target.value)}
              placeholder={`Opção ${idx + 1}`}
              className="flex-1 min-w-0 bg-transparent text-[#28415c] placeholder:text-[#c8cfdb] outline-none"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
            />

            {/* Remove */}
            <button
              onClick={() => removeOption(idx)}
              className="shrink-0 text-[#c8cfdb] hover:text-[#e85d75] opacity-0 group-hover/opt:opacity-100 transition-all cursor-pointer"
            >
              <Trash size={14} weight="bold" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addOption}
        className="flex items-center gap-[8px] h-[36px] px-[12px] rounded-[8px] text-[#07abde] hover:bg-[#dcf0ff]/50 transition-colors cursor-pointer w-fit"
      >
        <Plus size={14} weight="bold" />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>Adicionar opção</span>
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Type-specific config panels                                        */
/* ================================================================== */

interface TypeConfig {
  // Text / Textarea
  maxLength?: number;
  placeholder?: string;
  rows?: number;
  // Number / Percentage / Currency
  decimals?: number;
  min?: number;
  max?: number;
  currencySymbol?: string;
  // Boolean
  trueLabel?: string;
  falseLabel?: string;
  defaultBool?: boolean;
  // Date / Time / DateTime
  dateFormat?: string;
  timeFormat?: string;
  // Duration
  durationUnit?: string;
  // Phone
  phoneFormat?: string;
  // Link
  openNewTab?: boolean;
  // Combobox
  allowFreeText?: boolean;
  // Type / Multi-picklist / Combobox options
  options?: PickOption[];
  // Multi-picklist
  maxSelections?: number;
  // Address sub-fields
  addressSubFields?: string[];
  // Contextual
  contextSourceObject?: string;
  contextSourceField?: string;
  contextConditionField?: string;
  contextConditionOperator?: string;
  contextConditionValue?: string;
  contextDisplayField?: string;
  // Calculated
  formula?: string;
  formulaOutputType?: string;
  formulaDecimalPlaces?: number;
}

const ALL_ADDRESS_SUBFIELDS = [
  { key: "street", label: "Rua / Logradouro" },
  { key: "number", label: "Número" },
  { key: "complement", label: "Complemento" },
  { key: "neighborhood", label: "Bairro" },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado / UF" },
  { key: "zip", label: "CEP" },
  { key: "country", label: "País" },
];

function TypeConfigPanel({
  fieldType, config, onChange,
}: {
  fieldType: FieldType; config: TypeConfig; onChange: (c: TypeConfig) => void;
}) {
  const update = (partial: Partial<TypeConfig>) => onChange({ ...config, ...partial });

  switch (fieldType) {
    /* ─── Text ─── */
    case "text":
      return (
        <div className="flex flex-col gap-[16px]">
          <NumberInput label="Limite de caracteres" value={config.maxLength} onChange={(v) => update({ maxLength: v })} min={1} max={10000} placeholder="255" />
          <FieldInput label="Placeholder" value={config.placeholder ?? ""} onChange={(v) => update({ placeholder: v })} placeholder="Texto de exemplo..." />
        </div>
      );

    /* ─── Textarea ─── */
    case "textarea":
      return (
        <div className="flex flex-col gap-[16px]">
          <NumberInput label="Limite de caracteres" value={config.maxLength} onChange={(v) => update({ maxLength: v })} min={1} max={50000} placeholder="5000" />
          <NumberInput label="Linhas visíveis" value={config.rows} onChange={(v) => update({ rows: v })} min={2} max={20} placeholder="4" />
        </div>
      );

    /* ─── Phone ─── */
    case "phone":
      return (
        <div className="flex flex-col gap-[16px]">
          <FieldSelect
            label="Formato"
            value={config.phoneFormat ?? "br"}
            onChange={(v) => update({ phoneFormat: v })}
            options={[
              { value: "br", label: "Brasil (+55) — (XX) XXXXX-XXXX" },
              { value: "international", label: "Internacional — +XX XXXX XXXX" },
              { value: "free", label: "Livre (sem formatação)" },
            ]}
          />
        </div>
      );

    /* ─── Email ─── */
    case "email":
      return (
        <div className="flex items-center gap-[12px] py-[8px]">
          <Info size={16} weight="duotone" className="text-[#07abde] shrink-0" />
          <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
            Validação de email automática. Nenhuma configuração adicional necessária.
          </span>
        </div>
      );

    /* ─── Link ─── */
    case "link":
      return (
        <div className="flex flex-col gap-[16px]">
          <FieldInput label="Placeholder" value={config.placeholder ?? ""} onChange={(v) => update({ placeholder: v })} placeholder="https://exemplo.com" />
          <div className="flex items-center gap-[10px]">
            <ZeniteToggle active={config.openNewTab ?? true} onChange={() => update({ openNewTab: !(config.openNewTab ?? true) })} />
            <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
              Abrir em nova aba por padrão
            </span>
          </div>
        </div>
      );

    /* ─── User ─── */
    case "user":
      return (
        <div className="flex items-center gap-[12px] py-[8px]">
          <Info size={16} weight="duotone" className="text-[#07abde] shrink-0" />
          <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
            Seleciona de usuários ativos do sistema. Sem configuração adicional.
          </span>
        </div>
      );

    /* ─── Boolean ─── */
    case "boolean":
      return (
        <div className="flex flex-col gap-[16px]">
          <div className="grid grid-cols-2 gap-[12px]">
            <FieldInput label='Rótulo "Sim"' value={config.trueLabel ?? ""} onChange={(v) => update({ trueLabel: v })} placeholder="Sim" />
            <FieldInput label='Rótulo "Não"' value={config.falseLabel ?? ""} onChange={(v) => update({ falseLabel: v })} placeholder="Não" />
          </div>
          <div className="flex items-center gap-[10px]">
            <ZeniteToggle active={config.defaultBool ?? false} onChange={() => update({ defaultBool: !(config.defaultBool ?? false) })} />
            <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
              Valor padrão: {(config.defaultBool ?? false) ? (config.trueLabel || "Sim") : (config.falseLabel || "Não")}
            </span>
          </div>
        </div>
      );

    /* ─── Date ─── */
    case "date":
      return (
        <FieldSelect
          label="Formato de data"
          value={config.dateFormat ?? "dd/mm/yyyy"}
          onChange={(v) => update({ dateFormat: v })}
          options={[
            { value: "dd/mm/yyyy", label: "DD/MM/AAAA (Brasil)" },
            { value: "mm/dd/yyyy", label: "MM/DD/AAAA (EUA)" },
            { value: "yyyy-mm-dd", label: "AAAA-MM-DD (ISO)" },
          ]}
        />
      );

    /* ─── Time ─── */
    case "time":
      return (
        <FieldSelect
          label="Formato de hora"
          value={config.timeFormat ?? "24h"}
          onChange={(v) => update({ timeFormat: v })}
          options={[
            { value: "24h", label: "24 horas — 14:30" },
            { value: "12h", label: "12 horas — 2:30 PM" },
          ]}
        />
      );

    /* ─── DateTime ─── */
    case "datetime":
      return (
        <div className="flex flex-col gap-[16px]">
          <FieldSelect
            label="Formato de data"
            value={config.dateFormat ?? "dd/mm/yyyy"}
            onChange={(v) => update({ dateFormat: v })}
            options={[
              { value: "dd/mm/yyyy", label: "DD/MM/AAAA (Brasil)" },
              { value: "mm/dd/yyyy", label: "MM/DD/AAAA (EUA)" },
              { value: "yyyy-mm-dd", label: "AAAA-MM-DD (ISO)" },
            ]}
          />
          <FieldSelect
            label="Formato de hora"
            value={config.timeFormat ?? "24h"}
            onChange={(v) => update({ timeFormat: v })}
            options={[
              { value: "24h", label: "24 horas" },
              { value: "12h", label: "12 horas" },
            ]}
          />
        </div>
      );

    /* ─── Number ─── */
    case "number":
      return (
        <div className="flex flex-col gap-[16px]">
          <div className="grid grid-cols-3 gap-[12px]">
            <NumberInput label="Casas decimais" value={config.decimals} onChange={(v) => update({ decimals: v })} min={0} max={10} placeholder="0" />
            <NumberInput label="Mínimo" value={config.min} onChange={(v) => update({ min: v })} placeholder="—" />
            <NumberInput label="Máximo" value={config.max} onChange={(v) => update({ max: v })} placeholder="—" />
          </div>
        </div>
      );

    /* ─── Percentage ─── */
    case "percentage":
      return (
        <div className="flex flex-col gap-[16px]">
          <div className="grid grid-cols-3 gap-[12px]">
            <NumberInput label="Casas decimais" value={config.decimals} onChange={(v) => update({ decimals: v })} min={0} max={4} placeholder="2" />
            <NumberInput label="Mínimo (%)" value={config.min} onChange={(v) => update({ min: v })} min={0} placeholder="0" />
            <NumberInput label="Máximo (%)" value={config.max} onChange={(v) => update({ max: v })} max={100} placeholder="100" />
          </div>
        </div>
      );

    /* ─── Currency ─── */
    case "currency":
      return (
        <div className="flex flex-col gap-[16px]">
          <div className="grid grid-cols-2 gap-[12px]">
            <FieldSelect
              label="Moeda"
              value={config.currencySymbol ?? "BRL"}
              onChange={(v) => update({ currencySymbol: v })}
              options={[
                { value: "BRL", label: "R$ — Real Brasileiro" },
                { value: "USD", label: "US$ — Dólar Americano" },
                { value: "EUR", label: "€ — Euro" },
                { value: "GBP", label: "£ — Libra Esterlina" },
              ]}
            />
            <NumberInput label="Casas decimais" value={config.decimals} onChange={(v) => update({ decimals: v })} min={0} max={4} placeholder="2" />
          </div>
        </div>
      );

    /* ─── Duration ─── */
    case "duration":
      return (
        <FieldSelect
          label="Unidade"
          value={config.durationUnit ?? "minutes"}
          onChange={(v) => update({ durationUnit: v })}
          options={[
            { value: "minutes", label: "Minutos" },
            { value: "hours", label: "Horas" },
            { value: "days", label: "Dias" },
            { value: "hhmm", label: "HH:MM" },
          ]}
        />
      );

    /* ─── Address ─── */
    case "address": {
      const selected = config.addressSubFields ?? ALL_ADDRESS_SUBFIELDS.map((s) => s.key);
      const toggle = (key: string) => {
        const set = new Set(selected);
        set.has(key) ? set.delete(key) : set.add(key);
        update({ addressSubFields: Array.from(set) });
      };
      return (
        <div className="flex flex-col gap-[8px]">
          <label
            className="text-[#4e6987]"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
          >
            Sub-campos do endereço
          </label>
          <div className="flex flex-col gap-[4px]">
            {ALL_ADDRESS_SUBFIELDS.map((sf) => (
              <button
                key={sf.key}
                onClick={() => toggle(sf.key)}
                className="flex items-center gap-[10px] h-[36px] px-[12px] rounded-[8px] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
              >
                <div
                  className={`size-[18px] rounded-[4px] flex items-center justify-center transition-colors ${
                    selected.includes(sf.key) ? "bg-[#07abde]" : "bg-[#e4e7ec]"
                  }`}
                >
                  {selected.includes(sf.key) && <Check size={11} weight="bold" className="text-white" />}
                </div>
                <span
                  className="text-[#28415c]"
                  style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                >
                  {sf.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    /* ─── Type (Seleção) ─── */
    case "type":
      return (
        <OptionsEditor
          options={config.options ?? []}
          onChange={(opts) => update({ options: opts })}
        />
      );

    /* ─── Multi-picklist ─── */
    case "multipicklist":
      return (
        <div className="flex flex-col gap-[16px]">
          <OptionsEditor
            options={config.options ?? []}
            onChange={(opts) => update({ options: opts })}
          />
          <NumberInput
            label="Máximo de seleções"
            value={config.maxSelections}
            onChange={(v) => update({ maxSelections: v })}
            min={1}
            max={50}
            placeholder="Ilimitado"
          />
        </div>
      );

    /* ─── Combobox ─── */
    case "combobox":
      return (
        <div className="flex flex-col gap-[16px]">
          <OptionsEditor
            options={config.options ?? []}
            onChange={(opts) => update({ options: opts })}
            allowColors={false}
          />
          <div className="flex items-center gap-[10px]">
            <ZeniteToggle active={config.allowFreeText ?? false} onChange={() => update({ allowFreeText: !(config.allowFreeText ?? false) })} />
            <span className="text-[#4e6987]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
              Permitir texto livre (além das opções)
            </span>
          </div>
        </div>
      );

    /* ─── Contextual ─── */
    case "contextual": {
      const sourceObjects = [
        { value: "", label: "Selecione o objeto fonte..." },
        { value: "lead", label: "Lead" },
        { value: "oportunidade", label: "Oportunidade" },
        { value: "contato", label: "Contato" },
        { value: "conta", label: "Conta" },
      ];
      const conditionOperators = [
        { value: "equals", label: "Igual a" },
        { value: "not_equals", label: "Diferente de" },
        { value: "contains", label: "Contém" },
        { value: "not_empty", label: "Não está vazio" },
        { value: "is_empty", label: "Está vazio" },
        { value: "greater_than", label: "Maior que" },
        { value: "less_than", label: "Menor que" },
      ];
      return (
        <div className="flex flex-col gap-[20px]">
          {/* Explanation */}
          <div className="flex items-start gap-[12px] px-[14px] py-[12px] rounded-[10px] bg-[#e8e8fd]/60" style={{ border: "1px solid rgba(140,140,212,0.2)" }}>
            <Lightning size={16} weight="duotone" className="text-[#8C8CD4] shrink-0 mt-[2px]" />
            <div className="flex flex-col gap-[4px]">
              <span className="text-[#28415c]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                Como funciona
              </span>
              <span className="text-[#4e6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, lineHeight: "18px", ...ff }}>
                O campo contextual busca opções de outro objeto do CRM com base em uma condição. Por exemplo: exibir apenas contatos cuja conta seja a mesma do registro atual.
              </span>
            </div>
          </div>

          {/* Source Object */}
          <FieldSelect
            label="Objeto Fonte"
            value={config.contextSourceObject ?? ""}
            onChange={(v) => update({ contextSourceObject: v })}
            options={sourceObjects}
          />

          {/* Source display field */}
          <FieldInput
            label="Campo a Exibir"
            value={config.contextDisplayField ?? ""}
            onChange={(v) => update({ contextDisplayField: v })}
            placeholder="Ex: nome, email, razao_social"
          />

          <HorizontalDivider />

          {/* Condition */}
          <div className="flex flex-col gap-[6px]">
            <label
              className="text-[#4e6987] flex items-center gap-[6px]"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
            >
              <Shapes size={12} weight="bold" className="text-[#8C8CD4]" />
              Condição de Filtro
            </label>
            <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, ...ff }}>
              Apenas registros que atenderem esta condição aparecerão como opções
            </span>
          </div>

          <FieldInput
            label="Campo de Referência (fonte)"
            value={config.contextConditionField ?? ""}
            onChange={(v) => update({ contextConditionField: v })}
            placeholder="Ex: account_id, stage"
          />

          <div className="grid grid-cols-2 gap-[12px]">
            <FieldSelect
              label="Operador"
              value={config.contextConditionOperator ?? "equals"}
              onChange={(v) => update({ contextConditionOperator: v })}
              options={conditionOperators}
            />
            <FieldInput
              label="Valor / Campo Local"
              value={config.contextConditionValue ?? ""}
              onChange={(v) => update({ contextConditionValue: v })}
              placeholder={"Ex: {{account_id}} ou texto fixo"}
            />
          </div>

          {/* Visual flow diagram */}
          <div
            className="flex items-center gap-[10px] px-[16px] py-[14px] rounded-[10px] bg-[#f6f7f9]"
            style={{ border: "1px solid rgba(200,207,219,0.4)" }}
          >
            <div className="flex items-center gap-[8px]">
              <div className="flex items-center justify-center size-[28px] rounded-[6px] bg-[#e8e8fd]">
                <Database size={13} weight="bold" className="text-[#8C8CD4]" />
              </div>
              <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                {config.contextSourceObject ? OBJECT_INFO[config.contextSourceObject as ObjectType]?.label || config.contextSourceObject : "Fonte"}
              </span>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#c8cfdb]" />
            <div className="flex items-center gap-[6px] px-[10px] py-[4px] rounded-[500px] bg-[#e8e8fd]/60" style={{ border: "1px solid rgba(140,140,212,0.3)" }}>
              <Shapes size={11} weight="bold" className="text-[#8C8CD4]" />
              <span className="text-[#8C8CD4]" style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.2, ...ff }}>
                {config.contextConditionOperator ? conditionOperators.find(o => o.value === config.contextConditionOperator)?.label : "Filtro"}
              </span>
            </div>
            <ArrowRight size={14} weight="bold" className="text-[#c8cfdb]" />
            <div className="flex items-center gap-[6px]">
              <Code size={13} weight="bold" className="text-[#8c8cd4]" />
              <span className="text-[#8c8cd4]" style={{ fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace", ...ff }}>
                {config.contextDisplayField || "campo"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    /* ─── Calculated ─── */
    case "calculated": {
      return (
        <FormulaBuilder
          initialExpression={config.formula ?? ""}
          initialReturnType={(config.formulaOutputType as FormulaReturnType) ?? "number"}
          availableFields={FORMULA_AVAILABLE_FIELDS}
          previewContext={FORMULA_DEMO_CONTEXT}
          onSave={(expression, returnType) => {
            onChange({ ...config, formula: expression, formulaOutputType: returnType });
          }}
        />
      );
    }

    default:
      return null;
  }
}

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

/* ─── Lookup helper for edit mode ─── */
const ALL_NATIVE_FIELDS: Record<string, NativeField[]> = {
  lead: LEAD_FIELDS,
  oportunidade: OPPORTUNITY_FIELDS,
  contato: CONTACT_FIELDS,
  conta: ACCOUNT_FIELDS,
};

function findNativeField(fieldKey: string, objectHint?: string): { field: NativeField; objectType: ObjectType } | null {
  if (objectHint && ALL_NATIVE_FIELDS[objectHint]) {
    const found = ALL_NATIVE_FIELDS[objectHint].find((f) => f.key === fieldKey);
    if (found) return { field: found, objectType: objectHint as ObjectType };
  }
  for (const [obj, fields] of Object.entries(ALL_NATIVE_FIELDS)) {
    const found = fields.find((f) => f.key === fieldKey);
    if (found) return { field: found, objectType: obj as ObjectType };
  }
  return null;
}

export function CrmSettingsCreateField() {
  const navigate = useNavigate();
  const { fieldKey } = useParams<{ fieldKey?: string }>();
  const [searchParams] = useSearchParams();
  const objectHint = searchParams.get("object") ?? undefined;

  /* ─── Edit mode detection ─── */
  const nativeEditData = fieldKey ? findNativeField(fieldKey, objectHint) : null;
  const isNativeEdit = !!nativeEditData;

  // Track whether we're editing a custom field (loaded async)
  const [customEditData, setCustomEditData] = useState<CustomFieldDef | null>(null);
  const isEditMode = isNativeEdit || !!customEditData;

  /* ─── Core state ─── */
  const [objectType, setObjectType] = useState<ObjectType>(() =>
    nativeEditData?.objectType ?? (objectHint as ObjectType) ?? "lead"
  );
  const [fieldName, setFieldName] = useState(() => nativeEditData?.field.label ?? "");
  const [backendName, setBackendName] = useState(() => nativeEditData ? nativeEditData.field.key : (fieldKey ?? ""));
  const [backendEdited, setBackendEdited] = useState(() => isNativeEdit || !!fieldKey);
  const [description, setDescription] = useState(() => nativeEditData?.field.description ?? "");
  const [visible, setVisible] = useState(() => nativeEditData?.field.visible ?? true);
  const [required, setRequired] = useState(() => nativeEditData?.field.required ?? false);
  const [selectedType, setSelectedType] = useState<FieldType>(() =>
    (nativeEditData?.field.fieldType as FieldType) ?? "text"
  );

  /* ─── Build initial typeConfig from native field options (edit mode) ─── */
  const [typeConfig, setTypeConfig] = useState<TypeConfig>(() => {
    if (!nativeEditData?.field.options?.length) return {};
    return {
      options: nativeEditData.field.options.map((o, i) => ({
        id: `opt_init_${i}`,
        label: o.label,
        color: o.color,
      })),
    };
  });

  /* ─── Load overrides from backend for NATIVE fields ─── */
  useEffect(() => {
    if (!isNativeEdit || !nativeEditData || !fieldKey) return;
    let cancelled = false;
    getFieldConfig(nativeEditData.objectType).then((cfg) => {
      if (cancelled || !cfg) return;
      const ov = cfg[fieldKey];
      if (ov?.label) setFieldName(ov.label);
      if (ov?.visible !== undefined) setVisible(ov.visible);
      if (ov?.required !== undefined) setRequired(ov.required);
      if (ov?.fieldType) setSelectedType(ov.fieldType as FieldType);
      if (ov?.description) setDescription(ov.description);
      if (ov?.options?.length) {
        setTypeConfig({
          options: ov.options.map((o, i) => ({ id: `cfg_${i}`, label: o.label, color: o.color })),
        });
      }
    }).catch((err) => console.error("Error loading field config overrides for edit page:", err));
    return () => { cancelled = true; };
  }, [isNativeEdit, nativeEditData, fieldKey]);

  /* ─── Load CUSTOM field data when native not found ─── */
  useEffect(() => {
    if (isNativeEdit || !fieldKey) return;
    let cancelled = false;
    listCustomFields().then((allCf) => {
      if (cancelled) return;
      const cf = allCf.find((c) => c.key === fieldKey);
      if (!cf) return;
      setCustomEditData(cf);
      setFieldName(cf.label);
      setBackendName(cf.key);
      setBackendEdited(true);
      setDescription(cf.description ?? "");
      setVisible(cf.visible);
      setRequired(cf.required);
      setSelectedType(cf.fieldType as FieldType);
      if (cf.objectType) setObjectType(cf.objectType as ObjectType);
      if (cf.options?.length) {
        setTypeConfig({
          options: cf.options.map((o, i) => ({ id: `cf_${i}`, label: o.label, color: o.color })),
        });
      }
    }).catch((err) => console.error("Error loading custom field for edit:", err));
    return () => { cancelled = true; };
  }, [isNativeEdit, fieldKey]);

  /* ─── Auto-generate backend name from label ─── */
  useEffect(() => {
    if (!backendEdited && fieldName) {
      setBackendName(labelToSnake(fieldName));
    }
  }, [fieldName, backendEdited]);

  /* ─── Reset type config when type changes (skip initial mount and async edit loads) ─── */
  const skipTypeResetRef = useRef(isNativeEdit || !!fieldKey);
  useEffect(() => {
    if (skipTypeResetRef.current) {
      skipTypeResetRef.current = false;
      return;
    }
    setTypeConfig({});
  }, [selectedType]);

  /* ─── Object pill animation ─── */
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<ObjectType, HTMLButtonElement | null>>({ lead: null, oportunidade: null, contato: null, conta: null });
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[objectType];
    const container = pillContainerRef.current;
    if (el && container) {
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      setPillStyle({ left: eRect.left - cRect.left, width: eRect.width });
    }
  }, [objectType]);

  /* ─── Validation ─── */
  const canSave = fieldName.trim().length > 0 && backendName.trim().length > 0;

  /* ─── Save handler ─── */
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (isNativeEdit && nativeEditData) {
        // Native field — persist ALL overrides via patchFieldConfig
        const trimmedName = fieldName.trim();
        const overrides: Record<string, any> = {};
        overrides[nativeEditData.field.key] = {
          label: trimmedName,
          visible,
          required,
          fieldType: selectedType,
          description: description.trim() || undefined,
          options: typeConfig.options?.map((o) => ({
            value: o.label,
            label: o.label,
            color: o.color || "#4e6987",
          })),
        };
        await patchFieldConfig(objectType, overrides);
      } else {
        // Custom field — create or update via saveCustomField (upserts by key)
        await saveCustomField({
          key: backendName.trim(),
          label: fieldName.trim(),
          fieldType: selectedType,
          objectType,
          section: "Campos Customizados",
          editable: true,
          required,
          visible,
          description: description.trim() || undefined,
          options: typeConfig.options?.map((o) => ({
            value: o.label,
            label: o.label,
            color: o.color || "#4e6987",
          })),
          formula: typeConfig.formula,
          formulaReturnType: typeConfig.formulaOutputType,
        });
      }
      toast.success(`Campo "${fieldName}" ${isEditMode ? "atualizado" : "criado"} com sucesso!`);
      navigate("/crm/ajustes/campos");
    } catch (err) {
      console.error("Error saving custom field:", err);
      toast.error(`Erro ao salvar campo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeMeta = FIELD_TYPE_META[selectedType];
  const SelectedTypeIcon = selectedTypeMeta.icon;

  const objectTabs: { key: ObjectType; label: string }[] = [
    { key: "lead", label: "Lead" },
    { key: "oportunidade", label: "Oportunidade" },
    { key: "contato", label: "Contato" },
    { key: "conta", label: "Conta" },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 bg-white rounded-[16px] overflow-hidden min-w-0 flex flex-col">

        {/* ═══════ HEADER ═══════ */}
        <div className="flex items-center gap-[12px] px-[24px] pt-[20px] pb-[16px] shrink-0">
          {/* Back */}
          <button
            onClick={() => navigate("/crm/ajustes/campos")}
            className="flex items-center justify-center size-[36px] rounded-[10px] hover:bg-[#f0f2f5] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} weight="bold" className="text-[#4e6987]" />
          </button>

          <div className="flex-1 min-w-0">
            <span
              className="text-[#28415c] block"
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...ff }}
            >
              {isEditMode ? "Editar Campo" : "Criar Novo Campo"}
            </span>
            <span
              className="text-[#98989d] block"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
            >
              {isEditMode ? "Visualize e edite as propriedades do campo" : "Configure o tipo, metadados e comportamento do campo"}
            </span>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex items-center gap-[8px] h-[40px] px-[20px] rounded-[500px] text-white transition-all ${
              canSave
                ? "bg-[#07abde] hover:bg-[#0696c7] shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] cursor-pointer"
                : "bg-[#c8cfdb] cursor-not-allowed"
            }`}
            style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...ff }}
          >
            <FloppyDisk size={16} weight="bold" />
            {isEditMode ? "Salvar Alterações" : "Salvar Campo"}
          </button>
        </div>

        <HorizontalDivider />

        {/* ═══════ BODY — Two columns ═══════ */}
        <div className="flex-1 min-h-0 flex gap-[24px] p-[24px]">

            {/* ─── LEFT: General Info ─── */}
            <div className="w-[380px] shrink-0 flex flex-col gap-[20px] overflow-y-auto">

              {/* Object Selector */}
              <div className="flex flex-col gap-[8px]">
                <label
                  className="text-[#4e6987]"
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
                >
                  Objeto <span className="text-[#ff8c76]">*</span>
                </label>
                <div
                  ref={pillContainerRef}
                  className="relative flex items-center h-[36px] bg-[#f0f2f5] rounded-[500px] p-[3px] overflow-hidden w-full"
                >
                  <motion.div
                    className="absolute h-[30px] rounded-[500px]"
                    style={{ backgroundColor: "#28415c", boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                    animate={{ left: pillStyle.left, width: pillStyle.width }}
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                  />
                  {objectTabs.map((tab) => (
                    <button
                      key={tab.key}
                      ref={(el) => { tabRefs.current[tab.key] = el; }}
                      onClick={() => !isEditMode && setObjectType(tab.key)}
                      className={`relative z-[1] flex-1 flex items-center justify-center gap-[6px] h-[30px] px-[14px] rounded-[500px] transition-colors ${
                        isEditMode ? "cursor-default opacity-70" : "cursor-pointer"
                      } ${
                        objectType === tab.key ? "" : (!isEditMode ? "hover:bg-[#e4e7ec]" : "")
                      }`}
                    >
                      <span
                        className={objectType === tab.key ? "text-white" : "text-[#98989d]"}
                        style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, textTransform: "uppercase", ...ff }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  ))}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
                  />
                </div>
              </div>

              <HorizontalDivider />

              {/* Field Name */}
              <FieldInput
                label="Nome do Campo"
                required
                value={fieldName}
                onChange={setFieldName}
                placeholder="Ex: Receita Mensal Estimada"
              />

              {/* Backend column name */}
              <div className="flex flex-col gap-[6px]">
                <label
                  className="text-[#4e6987] flex items-center gap-[6px]"
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
                >
                  <Database size={12} weight="bold" className="text-[#8c8cd4]" />
                  Nome no Backend <span className="text-[#ff8c76]">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={backendName}
                    onChange={(e) => {
                      setBackendName(e.target.value);
                      setBackendEdited(true);
                    }}
                    placeholder="nome_do_campo"
                    className="w-full h-[40px] px-[14px] rounded-[10px] bg-[#f6f7f9] text-[#8c8cd4] placeholder:text-[#c8cfdb] outline-none transition-all focus:ring-2 focus:ring-[#8c8cd4]/30"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: 0,
                      border: "1px solid rgba(200,207,219,0.6)",
                      fontFamily: "'DM Mono', monospace",
                      ...ff,
                    }}
                  />
                  {!backendEdited && fieldName && (
                    <span
                      className="absolute right-[12px] text-[#c8cfdb]"
                      style={{ fontSize: 10, fontWeight: 500, ...ff }}
                    >
                      auto
                    </span>
                  )}
                </div>
                <span
                  className="text-[#8c8cd4]"
                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0, fontFamily: "'DM Mono', monospace", ...ff }}
                >
                  Tabela: {OBJECT_TABLE_MAP[objectType]}
                </span>
              </div>

              <HorizontalDivider />

              {/* Description */}
              <div className="flex flex-col gap-[6px]">
                <label
                  className="text-[#4e6987]"
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
                >
                  Descrição <span className="text-[#98989d] normal-case font-medium">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva para que serve este campo..."
                  rows={3}
                  className="w-full px-[14px] py-[10px] rounded-[10px] bg-[#f6f7f9] text-[#28415c] placeholder:text-[#c8cfdb] outline-none resize-none transition-all focus:ring-2 focus:ring-[#07abde]/30"
                  style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, border: "1px solid rgba(200,207,219,0.6)", ...ff }}
                />
              </div>

              <HorizontalDivider />

              {/* Toggles */}
              <div className="flex flex-col gap-[14px]">
                <div className="flex items-center gap-[12px]">
                  <ZeniteToggle active={visible} onChange={() => setVisible((v) => !v)} />
                  <div className="flex flex-col">
                    <span className="text-[#28415c] flex items-center gap-[6px]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                      <Eye size={14} weight="bold" className="text-[#4e6987]" /> Visível
                    </span>
                    <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...ff }}>
                      Exibir nas páginas de detalhe e listas
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-[12px]">
                  <ZeniteToggle active={required} onChange={() => setRequired((v) => !v)} />
                  <div className="flex flex-col">
                    <span className="text-[#28415c] flex items-center gap-[6px]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                      <Asterisk size={14} weight="bold" className="text-[#ff8c76]" /> Obrigatório
                    </span>
                    <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, ...ff }}>
                      Impedir salvamento sem valor preenchido
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT: Type + Config ─── */}
            <div className="flex-1 min-w-0 flex flex-col gap-[20px] overflow-y-auto">

              {/* Type Selector Header */}
              <div className="flex flex-col gap-[8px]">
                <label
                  className="text-[#4e6987]"
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
                >
                  Tipo do Campo <span className="text-[#ff8c76]">*</span>
                </label>

                {/* Type Grid */}
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-[6px]">
                  {ORDERED_TYPES.map((ft) => {
                    const meta = FIELD_TYPE_META[ft];
                    const Icon = meta.icon;
                    const isSelected = ft === selectedType;
                    return (
                      <motion.button
                        key={ft}
                        onClick={() => setSelectedType(ft)}
                        className="flex items-center gap-[8px] h-[42px] px-[12px] cursor-pointer border-2 border-transparent"
                        animate={{
                          borderRadius: isSelected ? 500 : 10,
                          backgroundColor: isSelected ? "#28415c" : "#f6f7f9",
                        }}
                        whileHover={!isSelected ? { backgroundColor: "#eef0f4" } : {}}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <div
                          className="flex items-center justify-center size-[24px] rounded-[6px] shrink-0"
                          style={{ backgroundColor: meta.bg }}
                        >
                          <Icon size={13} weight="bold" style={{ color: meta.color }} />
                        </div>
                        <span
                          className={isSelected ? "text-[#f6f7f9]" : "text-[#28415c]"}
                          style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...ff }}
                        >
                          {meta.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Selected type info bar */}
              <div
                className="flex items-center gap-[12px] px-[16px] py-[12px] rounded-[12px]"
                style={{ backgroundColor: selectedTypeMeta.bg + "40" }}
              >
                <div
                  className="flex items-center justify-center size-[32px] rounded-[8px] shrink-0"
                  style={{ backgroundColor: selectedTypeMeta.bg }}
                >
                  <SelectedTypeIcon size={16} weight="bold" style={{ color: selectedTypeMeta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className="block"
                    style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, color: selectedTypeMeta.color, ...ff }}
                  >
                    {selectedTypeMeta.label}
                  </span>
                  <span
                    className="text-[#4e6987] block"
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.2, ...ff }}
                  >
                    {selectedTypeMeta.desc}
                  </span>
                </div>
              </div>

              <HorizontalDivider />

              {/* Type-specific config */}
              <div className="flex flex-col gap-[8px]">
                <label
                  className="text-[#4e6987]"
                  style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...ff }}
                >
                  Configurações do tipo
                </label>
                <div
                  className={selectedType === "calculated" ? "" : "rounded-[12px] bg-[#fafbfc] p-[20px]"}
                  style={selectedType === "calculated" ? undefined : { border: "1px solid rgba(200,207,219,0.4)" }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedType}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <TypeConfigPanel
                        fieldType={selectedType}
                        config={typeConfig}
                        onChange={setTypeConfig}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

            </div>
        </div>

      </div>
    </div>
  );
}

/* ================================================================== */
/*  Table name map (for backend column display)                        */
/* ================================================================== */

const OBJECT_TABLE_MAP: Record<ObjectType, string> = {
  lead: "crm_leads",
  oportunidade: "crm_opportunities",
  contato: "crm_contacts",
  conta: "crm_accounts",
};