/**
 * CRM Settings — Objeto: Leads
 *
 * Full configuration page for the Lead object.
 * Header with animated segmented control: Configuracao | Layout | Pipeline
 * All changes persist to backend via obj-config API.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  GearFine,
  Layout,
  FunnelSimple,
  Info,
  Eye,
  PencilSimple,
  CaretDown,
  Plus,
  Trash,
  UserCircle,
  DotsSixVertical,
  TreeStructure,
  Shapes,
  SketchLogo,
  Building,
  FloppyDisk,
  SpinnerGap,
  Check,
  X,
  MagnifyingGlass,
  TextT,
} from "@phosphor-icons/react";
import { ZeniteToggle } from "../zenite-toggle";
import {
  getObjectConfig,
  patchObjectConfig,
  type ObjectConfig,
} from "./crm-api";
import { toast } from "sonner";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

/* ================================================================== */
/*  Shared tokens                                                      */
/* ================================================================== */

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* Mustard palette for Leads */
const LEAD_COLOR = "#eac23d";
const LEAD_BG = "#feedca";

/* ================================================================== */
/*  Default config (fallback when backend returns null)                */
/* ================================================================== */

const DEFAULT_STAGES = [
  { key: "novo", label: "Novo", color: "#4e6987" },
  { key: "em_contato", label: "Em Contato", color: "#8c8cd4" },
  { key: "qualificacao", label: "Qualificacao", color: "#eac23d" },
  { key: "qualificado", label: "Qualificado", color: "#3ccea7" },
  { key: "descartado", label: "Descartado", color: "#ff8c76" },
];

const DEFAULT_CONFIG: ObjectConfig = {
  autoQualify: false,
  duplicateCheck: true,
  requireEmail: true,
  autoAssign: false,
  defaultOwner: "round_robin",
  inactivityDays: 30,
  stages: DEFAULT_STAGES,
  conversionCreateContact: true,
  conversionCreateAccount: true,
  conversionCreateOpportunity: false,
};

/* ================================================================== */
/*  Segmented types                                                    */
/* ================================================================== */

type SegmentTab = "configuracao" | "layout" | "pipeline";

const SEGMENT_TABS: { key: SegmentTab; label: string; icon: React.ComponentType<any> }[] = [
  { key: "configuracao", label: "Configuracao", icon: GearFine },
  { key: "layout", label: "Layout", icon: Layout },
  { key: "pipeline", label: "Pipeline", icon: FunnelSimple },
];

/* ================================================================== */
/*  Horizontal divider                                                 */
/* ================================================================== */

function HorizontalDivider() {
  return (
    <div className="w-full h-0 shrink-0">
      <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 1.5">
        <line stroke="#DDE3EC" strokeWidth="1.5" x2="1000" y1="0.75" y2="0.75" />
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  Tab: Configuracao                                                  */
/* ================================================================== */

function TabConfiguracao({
  config,
  onPatch,
}: {
  config: ObjectConfig;
  onPatch: (partial: Partial<ObjectConfig>) => void;
}) {
  return (
    <div className="flex flex-col gap-[20px] p-[24px]">
      {/* Section: Regras gerais */}
      <SectionTitle
        title="Regras Gerais"
        subtitle="Comportamento padrao do objeto Lead no CRM"
      />

      <div className="flex flex-col gap-[12px]">
        <ToggleRow
          label="Qualificacao automatica"
          description="Qualificar leads automaticamente quando atingirem 80% de progresso"
          value={!!config.autoQualify}
          onChange={(v) => onPatch({ autoQualify: v })}
        />
        <HorizontalDivider />
        <ToggleRow
          label="Verificacao de duplicatas"
          description="Alertar ao criar lead com e-mail ja existente no sistema"
          value={!!config.duplicateCheck}
          onChange={(v) => onPatch({ duplicateCheck: v })}
        />
        <HorizontalDivider />
        <ToggleRow
          label="E-mail obrigatorio"
          description="Exigir campo de e-mail ao criar novos leads"
          value={!!config.requireEmail}
          onChange={(v) => onPatch({ requireEmail: v })}
        />
        <HorizontalDivider />
        <ToggleRow
          label="Distribuicao automatica"
          description="Atribuir novos leads automaticamente entre os membros da equipe"
          value={!!config.autoAssign}
          onChange={(v) => onPatch({ autoAssign: v })}
        />
      </div>

      <HorizontalDivider />

      {/* Section: Proprietario padrao */}
      <SectionTitle
        title="Proprietario Padrao"
        subtitle="Como novos leads sao atribuidos quando criados manualmente ou via integracao"
      />

      <div className="flex flex-col gap-[8px]">
        <RadioOption
          label="Round Robin (distribuir igualmente)"
          selected={config.defaultOwner === "round_robin"}
          onSelect={() => onPatch({ defaultOwner: "round_robin" })}
        />
        <RadioOption
          label="Criador do registro"
          selected={config.defaultOwner === "creator"}
          onSelect={() => onPatch({ defaultOwner: "creator" })}
        />
        <RadioOption
          label="Gerente da equipe"
          selected={config.defaultOwner === "manager"}
          onSelect={() => onPatch({ defaultOwner: "manager" })}
        />
      </div>

      <HorizontalDivider />

      {/* Section: Prazo de inatividade */}
      <SectionTitle
        title="Prazo de Inatividade"
        subtitle="Leads sem atividade apos esse prazo serao marcados com badge 'Inativo' na lista e no detalhe"
      />

      <div className="flex items-center gap-[12px]">
        <span className="text-[#4e6987] shrink-0" style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
          Marcar como inativo apos:
        </span>
        <input
          type="number"
          value={config.inactivityDays ?? 30}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v > 0) onPatch({ inactivityDays: v });
          }}
          className="w-[72px] h-[36px] rounded-[8px] border border-[#dde3ec] px-[10px] text-center text-[#28415c] bg-white outline-none focus:border-[#07ABDE] transition-colors"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
          min={1}
          max={365}
        />
        <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>dias</span>
      </div>

      <div className="flex items-start gap-[10px] p-[12px] bg-[#feedca40] rounded-[10px]">
        <Info size={14} weight="fill" className="shrink-0 mt-[2px]" style={{ color: LEAD_COLOR }} />
        <span className="text-[#4e6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}>
          Leads inativos recebem um badge visual na listagem e no cabecalho do detalhe. Nenhum e-mail ou notificacao push e enviado — o alerta e puramente visual dentro do CRM.
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tab: Layout — Full DnD editor                                      */
/* ================================================================== */

const ALL_AVAILABLE_FIELDS = [
  "Nome", "Sobrenome", "E-mail", "Telefone", "Empresa", "Cargo",
  "Origem", "Segmento", "Website", "Receita Anual", "Num. Funcionarios",
  "Score", "Progresso de Qualificacao", "Contato Preferencial", "Taxa de Conversao",
  "Campanha", "Grupo de Anuncios", "Anuncio", "Canal", "Ultima Conversao",
  "Proprietario", "Data de Criacao", "Ultima Atualizacao", "Criado Por",
  "Endereco", "CPF/CNPJ", "Notas", "Tags", "Tipo", "Status",
  "LinkedIn", "Celular", "Departamento", "Data de Nascimento",
];

const DEFAULT_LAYOUT: LayoutSectionData[] = [
  {
    title: "Dados Principais",
    fields: ["Nome", "Sobrenome", "E-mail", "Telefone", "Empresa", "Cargo"],
  },
  {
    title: "Informacoes Adicionais",
    fields: ["Origem", "Segmento", "Website", "Receita Anual", "Num. Funcionarios"],
  },
  {
    title: "Qualificacao",
    fields: ["Score", "Progresso de Qualificacao", "Contato Preferencial", "Taxa de Conversao"],
  },
  {
    title: "Marketing",
    fields: ["Campanha", "Grupo de Anuncios", "Anuncio", "Canal", "Ultima Conversao"],
  },
  {
    title: "Campos do Sistema",
    fields: ["Proprietario", "Data de Criacao", "Ultima Atualizacao", "Criado Por"],
  },
];

const DND_FIELD = "LAYOUT_FIELD";
const DND_SECTION = "LAYOUT_SECTION";

interface LayoutSectionData {
  title: string;
  fields: string[];
}

/* ── Draggable Field Row ── */
function DraggableFieldRow({
  field,
  sectionIdx,
  fieldIdx,
  onMoveField,
  onRemoveField,
}: {
  field: string;
  sectionIdx: number;
  fieldIdx: number;
  onMoveField: (
    from: { section: number; field: number },
    to: { section: number; field: number },
  ) => void;
  onRemoveField: (sectionIdx: number, fieldIdx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DND_FIELD,
    item: () => ({ sectionIdx, fieldIdx, field }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: DND_FIELD,
    hover: (
      item: { sectionIdx: number; fieldIdx: number; field: string },
      monitor,
    ) => {
      if (!ref.current) return;
      const dragSection = item.sectionIdx;
      const dragField = item.fieldIdx;
      const hoverSection = sectionIdx;
      const hoverField = fieldIdx;

      if (dragSection === hoverSection && dragField === hoverField) return;

      const hoverRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverRect.top;

      if (dragSection === hoverSection) {
        if (dragField < hoverField && hoverClientY < hoverMiddleY) return;
        if (dragField > hoverField && hoverClientY > hoverMiddleY) return;
      }

      onMoveField(
        { section: dragSection, field: dragField },
        { section: hoverSection, field: hoverField },
      );
      item.sectionIdx = hoverSection;
      item.fieldIdx = hoverField;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  // Compose refs
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-[8px] h-[36px] px-[10px] rounded-[8px] transition-all group ${
        isDragging
          ? "opacity-30 bg-[#e8f4fd] scale-[0.98]"
          : isOver
          ? "bg-[#e8f4fd] shadow-[inset_0_0_0_1.5px_#07ABDE]"
          : "bg-white hover:bg-[#fafbfc]"
      }`}
      style={{ cursor: "grab" }}
    >
      <DotsSixVertical
        size={14}
        weight="bold"
        className="text-[#cdd1da] group-hover:text-[#98989d] shrink-0"
      />
      <TextT size={13} weight="duotone" className="text-[#b0b7c3] shrink-0" />
      <span
        className="text-[#4e6987] flex-1"
        style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
      >
        {field}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveField(sectionIdx, fieldIdx);
        }}
        className="flex items-center justify-center size-[24px] rounded-[6px] opacity-0 group-hover:opacity-100 hover:bg-[#ffedeb] transition-all cursor-pointer shrink-0"
        title="Remover campo"
      >
        <X size={12} weight="bold" className="text-[#ff8c76]" />
      </button>
    </div>
  );
}

/* ── Add Field Popover ── */
function AddFieldPopover({
  allUsedFields,
  onAdd,
  onClose,
}: {
  allUsedFields: Set<string>;
  onAdd: (field: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const available = useMemo(() => {
    return ALL_AVAILABLE_FIELDS.filter(
      (f) =>
        !allUsedFields.has(f) &&
        f.toLowerCase().includes(search.toLowerCase()),
    );
  }, [allUsedFields, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
        onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 top-full mt-[4px] bg-white rounded-[12px] border border-[#dde3ec] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-20 overflow-hidden"
      style={{ maxHeight: 260 }}
    >
      {/* Search */}
      <div className="flex items-center gap-[8px] px-[12px] h-[40px] border-b border-[#eef0f4]">
        <MagnifyingGlass size={14} weight="bold" className="text-[#98989d] shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar campo..."
          className="flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c0c5cf]"
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="cursor-pointer">
            <X size={12} weight="bold" className="text-[#98989d]" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-auto" style={{ maxHeight: 216 }}>
        {available.length === 0 ? (
          <div className="flex items-center justify-center h-[48px]">
            <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
              {search ? "Nenhum campo encontrado" : "Todos os campos ja estao no layout"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col py-[4px]">
            {available.map((field) => (
              <button
                key={field}
                onClick={() => {
                  onAdd(field);
                  onClose();
                }}
                className="flex items-center gap-[8px] h-[34px] px-[14px] hover:bg-[#f6f7f9] transition-colors cursor-pointer text-left"
              >
                <Plus size={12} weight="bold" className="text-[#07ABDE] shrink-0" />
                <span
                  className="text-[#4e6987]"
                  style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                >
                  {field}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Draggable Section ── */
function DraggableLayoutSection({
  section,
  sectionIdx,
  allUsedFields,
  onMoveField,
  onRemoveField,
  onAddField,
  onRemoveSection,
  onRenameSection,
  onMoveSection,
}: {
  section: LayoutSectionData;
  sectionIdx: number;
  allUsedFields: Set<string>;
  onMoveField: (
    from: { section: number; field: number },
    to: { section: number; field: number },
  ) => void;
  onRemoveField: (sectionIdx: number, fieldIdx: number) => void;
  onAddField: (sectionIdx: number, field: string) => void;
  onRemoveSection: (sectionIdx: number) => void;
  onRenameSection: (sectionIdx: number, title: string) => void;
  onMoveSection: (fromIdx: number, toIdx: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const sectionRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DND_SECTION,
    item: () => ({ sectionIdx }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver: isSectionOver }, sectionDrop] = useDrop({
    accept: DND_SECTION,
    hover: (item: { sectionIdx: number }, monitor) => {
      if (!sectionRef.current) return;
      const dragIdx = item.sectionIdx;
      const hoverIdx = sectionIdx;
      if (dragIdx === hoverIdx) return;

      const hoverRect = sectionRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverRect.top;

      if (dragIdx < hoverIdx && hoverClientY < hoverMiddleY) return;
      if (dragIdx > hoverIdx && hoverClientY > hoverMiddleY) return;

      onMoveSection(dragIdx, hoverIdx);
      item.sectionIdx = hoverIdx;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  // Accept field drops into empty sections
  const [{ isOver: isFieldOver }, fieldDrop] = useDrop({
    accept: DND_FIELD,
    drop: (item: { sectionIdx: number; fieldIdx: number }) => {
      if (section.fields.length === 0) {
        onMoveField(
          { section: item.sectionIdx, field: item.fieldIdx },
          { section: sectionIdx, field: 0 },
        );
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  // Compose section ref with section drop
  sectionDrop(sectionRef);

  return (
    <div
      ref={sectionRef}
      className={`rounded-[12px] overflow-visible transition-all bg-[#f6f7f9] ${
        isDragging
          ? "opacity-30 scale-[0.98]"
          : isSectionOver
          ? "ring-2 ring-[#07ABDE] ring-offset-2"
          : ""
      }`}
    >
      {/* Section header */}
      <div className="flex items-center gap-[6px] w-full px-[12px] py-[10px] hover:bg-[#eef0f4] transition-colors group/section rounded-t-[12px]">
        <div ref={drag as any} className="cursor-grab shrink-0 p-[2px]">
          <DotsSixVertical
            size={16}
            weight="bold"
            className="text-[#cdd1da] group-hover/section:text-[#98989d]"
          />
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 cursor-pointer"
        >
          <motion.div
            animate={{ rotate: expanded ? 0 : -90 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <CaretDown size={13} weight="bold" className="text-[#98989d]" />
          </motion.div>
        </button>

        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              if (editTitle.trim()) onRenameSection(sectionIdx, editTitle.trim());
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (editTitle.trim()) onRenameSection(sectionIdx, editTitle.trim());
                setIsEditing(false);
              }
              if (e.key === "Escape") {
                setEditTitle(section.title);
                setIsEditing(false);
              }
            }}
            className="flex-1 bg-white rounded-[6px] px-[8px] h-[28px] outline-none border border-[#07ABDE] text-[#28415c]"
            style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...ff }}
          />
        ) : (
          <span
            onDoubleClick={() => {
              setEditTitle(section.title);
              setIsEditing(true);
            }}
            className="text-[#28415c] flex-1 cursor-default select-none"
            style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...ff }}
          >
            {section.title}
          </span>
        )}

        <span
          className="text-[#98989d] shrink-0"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...ff }}
        >
          {section.fields.length} {section.fields.length === 1 ? "campo" : "campos"}
        </span>

        {/* Section actions */}
        <div className="flex items-center gap-[2px] opacity-0 group-hover/section:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => {
              setEditTitle(section.title);
              setIsEditing(true);
            }}
            className="flex items-center justify-center size-[26px] rounded-[6px] hover:bg-[#e4e7ec] transition-colors cursor-pointer"
            title="Renomear secao"
          >
            <PencilSimple size={13} weight="bold" className="text-[#98989d]" />
          </button>
          <button
            onClick={() => onRemoveSection(sectionIdx)}
            className="flex items-center justify-center size-[26px] rounded-[6px] hover:bg-[#ffedeb] transition-colors cursor-pointer"
            title="Remover secao"
          >
            <Trash size={13} weight="bold" className="text-[#ff8c76]" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div ref={fieldDrop as any} className="flex flex-col gap-[2px] px-[8px] pb-[8px]">
              {section.fields.length === 0 ? (
                <div
                  className={`flex items-center justify-center h-[48px] rounded-[8px] border-2 border-dashed transition-colors ${
                    isFieldOver ? "border-[#07ABDE] bg-[#e8f4fd]" : "border-[#dde3ec]"
                  }`}
                >
                  <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, ...ff }}>
                    Arraste campos aqui ou clique em Adicionar
                  </span>
                </div>
              ) : (
                section.fields.map((field, fieldIdx) => (
                  <DraggableFieldRow
                    key={`${sectionIdx}-${fieldIdx}-${field}`}
                    field={field}
                    sectionIdx={sectionIdx}
                    fieldIdx={fieldIdx}
                    onMoveField={onMoveField}
                    onRemoveField={onRemoveField}
                  />
                ))
              )}

              {/* Add field button */}
              <div className="relative mt-[2px]">
                <button
                  onClick={() => setShowAddPopover((v) => !v)}
                  className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] border border-dashed border-[#dde3ec] text-[#98989d] hover:border-[#07ABDE] hover:text-[#07ABDE] hover:bg-[#f8fcff] transition-all cursor-pointer"
                >
                  <Plus size={12} weight="bold" />
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                    Adicionar Campo
                  </span>
                </button>

                <AnimatePresence>
                  {showAddPopover && (
                    <AddFieldPopover
                      allUsedFields={allUsedFields}
                      onAdd={(field) => onAddField(sectionIdx, field)}
                      onClose={() => setShowAddPopover(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Tab Layout component ── */
function TabLayout({
  config,
  onPatch,
}: {
  config: ObjectConfig;
  onPatch: (partial: Partial<ObjectConfig>) => void;
}) {
  const [sections, setSections] = useState<LayoutSectionData[]>(() =>
    config.layout && config.layout.length > 0
      ? config.layout.map((s) => ({ ...s, fields: [...s.fields] }))
      : DEFAULT_LAYOUT.map((s) => ({ ...s, fields: [...s.fields] })),
  );

  // Persist to backend
  const commitLayout = useCallback(
    (next: LayoutSectionData[]) => {
      setSections(next);
      onPatch({ layout: next });
    },
    [onPatch],
  );

  const handleMoveField = useCallback(
    (
      from: { section: number; field: number },
      to: { section: number; field: number },
    ) => {
      setSections((prev) => {
        const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
        const [removed] = next[from.section].fields.splice(from.field, 1);
        next[to.section].fields.splice(to.field, 0, removed);
        return next;
      });
    },
    [],
  );

  // Commit layout after drag ends
  useEffect(() => {
    function onDragEnd() {
      setSections((current) => {
        onPatch({ layout: current });
        return current;
      });
    }
    document.addEventListener("dragend", onDragEnd);
    return () => document.removeEventListener("dragend", onDragEnd);
  }, [onPatch]);

  const handleRemoveField = useCallback(
    (sectionIdx: number, fieldIdx: number) => {
      setSections((prev) => {
        const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
        next[sectionIdx].fields.splice(fieldIdx, 1);
        onPatch({ layout: next });
        return next;
      });
    },
    [onPatch],
  );

  const handleAddField = useCallback(
    (sectionIdx: number, field: string) => {
      setSections((prev) => {
        const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));
        next[sectionIdx].fields.push(field);
        onPatch({ layout: next });
        return next;
      });
    },
    [onPatch],
  );

  const handleRemoveSection = useCallback(
    (sectionIdx: number) => {
      setSections((prev) => {
        const next = prev.filter((_, i) => i !== sectionIdx);
        onPatch({ layout: next });
        return next;
      });
    },
    [onPatch],
  );

  const handleRenameSection = useCallback(
    (sectionIdx: number, title: string) => {
      setSections((prev) => {
        const next = prev.map((s, i) =>
          i === sectionIdx ? { ...s, title } : s,
        );
        onPatch({ layout: next });
        return next;
      });
    },
    [onPatch],
  );

  const handleMoveSection = useCallback(
    (fromIdx: number, toIdx: number) => {
      setSections((prev) => {
        const next = [...prev];
        const [removed] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, removed);
        return next;
      });
    },
    [],
  );

  const handleAddSection = useCallback(() => {
    setSections((prev) => {
      const next = [...prev, { title: "Nova Secao", fields: [] as string[] }];
      onPatch({ layout: next });
      return next;
    });
  }, [onPatch]);

  // Track all used fields across all sections
  const allUsedFields = useMemo(
    () => new Set(sections.flatMap((s) => s.fields)),
    [sections],
  );

  const unusedCount = ALL_AVAILABLE_FIELDS.filter((f) => !allUsedFields.has(f)).length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-[16px] p-[24px]">
        {/* Layout info */}
        <div className="flex items-start gap-[10px] p-[12px] bg-[#f0f8ff] rounded-[10px]">
          <Info size={16} weight="fill" className="text-[#07ABDE] shrink-0 mt-[2px]" />
          <span
            className="text-[#4e6987]"
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: -0.3,
              lineHeight: "18px",
              ...ff,
            }}
          >
            Arraste as secoes e campos para reorganizar o layout da pagina de detalhes do Lead.
            Use o botao <strong>Adicionar Campo</strong> em cada secao para incluir novos campos, ou
            remova campos com o botao <strong>x</strong>. Duplo-clique no titulo para renomear.
          </span>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-[12px]">
          <span
            className="text-[#98989d]"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
          >
            {sections.length} {sections.length === 1 ? "secao" : "secoes"} · {allUsedFields.size} campos no layout
          </span>
          {unusedCount > 0 && (
            <span
              className="text-[#07ABDE] bg-[#e8f4fd] px-[8px] py-[2px] rounded-full"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}
            >
              {unusedCount} disponiveis
            </span>
          )}
        </div>

        {/* Sections */}
        {sections.map((section, idx) => (
          <DraggableLayoutSection
            key={`section-${idx}`}
            section={section}
            sectionIdx={idx}
            allUsedFields={allUsedFields}
            onMoveField={handleMoveField}
            onRemoveField={handleRemoveField}
            onAddField={handleAddField}
            onRemoveSection={handleRemoveSection}
            onRenameSection={handleRenameSection}
            onMoveSection={handleMoveSection}
          />
        ))}

        {/* Add section */}
        <button
          onClick={handleAddSection}
          className="flex items-center gap-[8px] h-[44px] px-[16px] rounded-[12px] border-2 border-dashed border-[#dde3ec] text-[#98989d] hover:border-[#07ABDE] hover:text-[#07ABDE] hover:bg-[#f8fcff] transition-all cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
            Adicionar Secao
          </span>
        </button>
      </div>
    </DndProvider>
  );
}

/* ================================================================== */
/*  Tab: Pipeline                                                      */
/* ================================================================== */

function TabPipeline({
  config,
  onPatch,
}: {
  config: ObjectConfig;
  onPatch: (partial: Partial<ObjectConfig>) => void;
}) {
  const stages = config.stages ?? DEFAULT_STAGES;

  return (
    <div className="flex flex-col gap-[20px] p-[24px]">
      <SectionTitle
        title="Estagios do Pipeline"
        subtitle="Configure os estagios pelos quais um lead transita no funil de vendas"
      />

      {/* Stages list */}
      <div className="flex flex-col gap-[4px]">
        {stages.map((stage, idx) => (
          <div key={stage.key}>
            <div className="flex items-center gap-[10px] h-[48px] px-[12px] rounded-[10px] hover:bg-[#f6f7f9] transition-colors group">
              <DotsSixVertical size={16} weight="bold" className="text-[#cdd1da] group-hover:text-[#98989d] cursor-grab shrink-0" />
              <div
                className="size-[10px] rounded-full shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-[#28415c] flex-1" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                {stage.label}
              </span>
              <span className="text-[#98989d] hidden group-hover:block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, fontFamily: "monospace" }}>
                {stage.key}
              </span>
              <div className="flex items-center gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center justify-center size-[28px] rounded-[6px] hover:bg-[#e4e7ec] transition-colors cursor-pointer">
                  <PencilSimple size={14} weight="bold" className="text-[#98989d]" />
                </button>
                <button
                  onClick={() => {
                    const next = stages.filter((s) => s.key !== stage.key);
                    onPatch({ stages: next });
                  }}
                  className="flex items-center justify-center size-[28px] rounded-[6px] hover:bg-[#ffedeb] transition-colors cursor-pointer"
                >
                  <Trash size={14} weight="bold" className="text-[#ff8c76]" />
                </button>
              </div>
            </div>
            {idx < stages.length - 1 && (
              <div className="flex items-center justify-center h-[20px]">
                <div className="w-[1.5px] h-full bg-[#dde3ec]" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add stage */}
      <button
        onClick={() => {
          const key = `stage_${Date.now()}`;
          const next = [...stages, { key, label: "Novo Estagio", color: "#4e6987" }];
          onPatch({ stages: next });
        }}
        className="flex items-center gap-[8px] h-[40px] px-[14px] rounded-[10px] border-2 border-dashed border-[#dde3ec] text-[#98989d] hover:border-[#07ABDE] hover:text-[#07ABDE] transition-colors cursor-pointer"
      >
        <Plus size={16} weight="bold" />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
          Adicionar Estagio
        </span>
      </button>

      <HorizontalDivider />

      {/* Conversion rules */}
      <SectionTitle
        title="Regras de Conversao"
        subtitle="O que acontece quando um Lead e convertido"
      />

      <div className="flex flex-col gap-[6px]">
        <ConversionRule
          icon={<UserCircle size={16} weight="duotone" />}
          label="Criar Contato"
          description="Gerar automaticamente um registro de contato"
          enabled={!!config.conversionCreateContact}
          onChange={(v) => onPatch({ conversionCreateContact: v })}
        />
        <ConversionRule
          icon={<Building size={16} weight="duotone" />}
          label="Criar Conta"
          description="Gerar automaticamente um registro de conta"
          enabled={!!config.conversionCreateAccount}
          onChange={(v) => onPatch({ conversionCreateAccount: v })}
        />
        <ConversionRule
          icon={<SketchLogo size={16} weight="duotone" />}
          label="Criar Oportunidade"
          description="Abrir oportunidade vinculada a conta criada"
          enabled={!!config.conversionCreateOpportunity}
          onChange={(v) => onPatch({ conversionCreateOpportunity: v })}
        />
      </div>
    </div>
  );
}

function ConversionRule({
  icon,
  label,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-[12px] h-[52px] px-[14px] rounded-[10px] bg-[#f6f7f9]">
      <div className="text-[#4e6987] shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-[#28415c] block" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
          {label}
        </span>
        <span className="text-[#98989d] block truncate" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
          {description}
        </span>
      </div>
      <ZeniteToggle active={enabled} onChange={() => onChange(!enabled)} />
    </div>
  );
}

/* ================================================================== */
/*  Shared small components                                            */
/* ================================================================== */

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[#28415c]" style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3, ...ff }}>
        {title}
      </span>
      <span className="text-[#98989d]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}>
        {subtitle}
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-[12px] py-[4px]">
      <div className="flex-1 min-w-0">
        <span className="text-[#28415c] block" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
          {label}
        </span>
        <span className="text-[#98989d] block" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...ff }}>
          {description}
        </span>
      </div>
      <ZeniteToggle active={value} onChange={() => onChange(!value)} />
    </div>
  );
}

function RadioOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button onClick={onSelect} className="flex items-center gap-[10px] cursor-pointer group/radio">
      <div className={`relative rounded-full size-[16px] shrink-0 ${selected ? "bg-[#3ccea7]" : ""}`}>
        {selected ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ border: "1.5px solid #28415c" }} />
        )}
      </div>
      <span className="text-[#4e6987] whitespace-nowrap" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...ff }}>
        {label}
      </span>
    </button>
  );
}

/* ================================================================== */
/*  Main page                                                          */
/* ================================================================== */

export function CrmSettingsObjLeads() {
  const [activeTab, setActiveTab] = useState<SegmentTab>("configuracao");
  const [config, setConfig] = useState<ObjectConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* --- Load config from backend --- */
  useEffect(() => {
    let cancelled = false;
    getObjectConfig("lead")
      .then((data) => {
        if (cancelled) return;
        if (data) setConfig({ ...DEFAULT_CONFIG, ...data });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading lead object config:", err);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /* --- Patch + auto-save with debounce --- */
  const handlePatch = useCallback((partial: Partial<ObjectConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    setDirty(true);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      setSaving(true);
      patchObjectConfig("lead", partial)
        .then(() => {
          setDirty(false);
        })
        .catch((err) => {
          console.error("Error saving lead object config:", err);
          toast.error("Erro ao salvar configuracoes do Lead");
        })
        .finally(() => setSaving(false));
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* --- Segmented pill animation --- */
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<SegmentTab, HTMLButtonElement | null>>({
    configuracao: null,
    layout: null,
    pipeline: null,
  });
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  const measurePill = useCallback(() => {
    const el = tabRefs.current[activeTab];
    const container = containerRef.current;
    if (el && container) {
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      setPillStyle({ left: eRect.left - cRect.left, width: eRect.width });
    }
  }, [activeTab]);

  useEffect(() => { measurePill(); }, [measurePill]);

  useEffect(() => {
    window.addEventListener("resize", measurePill);
    return () => window.removeEventListener("resize", measurePill);
  }, [measurePill]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* HEADER */}
      <div className="bg-white rounded-[16px] shrink-0 overflow-hidden">
        <div className="flex items-center gap-[14px] px-[20px] pt-[20px] pb-[16px]">
          <div
            className="flex items-center justify-center size-[40px] rounded-[10px] shrink-0"
            style={{ backgroundColor: LEAD_BG }}
          >
            <Heart size={22} weight="duotone" style={{ color: LEAD_COLOR }} />
          </div>
          <div className="flex-1 min-w-0">
            <span
              className="text-[#28415c] block"
              style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...ff }}
            >
              Leads
            </span>
            <span
              className="text-[#98989d] block"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...ff }}
            >
              Configure comportamento, layout e pipeline do objeto Lead
            </span>
          </div>

          {/* Save status indicator */}
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-[6px] h-[30px] px-[12px] rounded-[8px] bg-[#f0f2f5]"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <SpinnerGap size={14} weight="bold" className="text-[#98989d]" />
                </motion.div>
                <span className="text-[#98989d]" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                  Salvando...
                </span>
              </motion.div>
            ) : dirty ? (
              <motion.div
                key="dirty"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-[6px] h-[30px] px-[12px] rounded-[8px]"
                style={{ backgroundColor: LEAD_BG }}
              >
                <FloppyDisk size={14} weight="bold" style={{ color: LEAD_COLOR }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, color: LEAD_COLOR, ...ff }}>
                  Alteracoes pendentes
                </span>
              </motion.div>
            ) : !loading ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-[6px] h-[30px] px-[12px] rounded-[8px] bg-[#d9f8ef]"
              >
                <Check size={14} weight="bold" className="text-[#3ccea7]" />
                <span className="text-[#3ccea7]" style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3, ...ff }}>
                  Salvo
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Segmented control */}
        <div className="px-[20px] pb-[16px]">
          <div
            ref={containerRef}
            className="relative flex items-center h-[40px] bg-[#f0f2f5] rounded-[500px] p-[3px] overflow-hidden"
            style={{ maxWidth: 420 }}
          >
            <motion.div
              className="absolute h-[34px] rounded-[500px]"
              style={{
                backgroundColor: "#28415c",
                boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
              }}
              animate={{ left: pillStyle.left, width: pillStyle.width }}
              transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
            />

            {SEGMENT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  ref={(el) => { tabRefs.current[tab.key] = el; }}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative z-[1] flex-1 flex items-center justify-center gap-[6px] h-[34px] px-[16px] rounded-[500px] cursor-pointer transition-colors"
                >
                  <Icon
                    size={15}
                    weight={isActive ? "fill" : "bold"}
                    className={isActive ? "text-white" : "text-[#98989d]"}
                  />
                  <span
                    className={isActive ? "text-white" : "text-[#98989d]"}
                    style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

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

      {/* CONTENT */}
      <div className="flex-1 bg-white rounded-[16px] mt-[12px] overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <SpinnerGap size={24} weight="bold" className="text-[#98989d]" />
            </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === "configuracao" && <TabConfiguracao config={config} onPatch={handlePatch} />}
              {activeTab === "layout" && <TabLayout config={config} onPatch={handlePatch} />}
              {activeTab === "pipeline" && <TabPipeline config={config} onPatch={handlePatch} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
