/**
 * Design System — Zenite CRM (HTZ Agency)
 *
 * Referência visual canônica de todos os padrões de UI do sistema.
 * Qualquer componente novo DEVE seguir estes padrões exatamente.
 */

import { useState } from "react";
import { InteractiveFieldExamples } from "./ds-interactive-fields";
import {
  Heart,
  Building,
  IdentificationCard,
  SketchLogo,
  Lightning,
  CalendarBlank,
  CheckCircle,
  Phone,
  NoteBlank,
  ChatCircle,
  Envelope,
  FunnelSimple,
  X,
  Check,
  NotePencil,
  Trash,
  ArrowSquareOut,
  LinkSimpleHorizontal,
  LinkBreak,
  Columns,
  ArrowsOutSimple,
  Copy,
  CaretDown,
  MagnifyingGlass,
  Spinner,
  Bell,
  GearSix,
  Plus,
  Kanban,
  Table,
  ArrowUp,
  ArrowDown,
  Clock,
  Warning,
  Crosshair,
  Trophy,
  Sparkle,
  Handshake,
  XCircle,
  DotsThree,
  PencilSimple,
  FloppyDisk,
  User,
  TextT,
  TextAlignLeft,
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
  Hash,
  Percent,
  TreeStructure,
  CaretCircleUpDown,
  Shapes,
  Function as FunctionIcon,
  Fingerprint,
} from "@phosphor-icons/react";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ================================================================== */
/*  Section title helpers                                              */
/* ================================================================== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[#122232] mb-[4px]"
      style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: "28px", ...fontFeature }}
    >
      {children}
    </h2>
  );
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[#4E6987] mb-[20px]"
      style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}
    >
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[15px] p-[24px] ${className}`}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[#98989d] uppercase block mb-[8px]"
      style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return <div className="h-[1px] bg-[#DDE3EC] my-[16px]" />;
}

/* ================================================================== */
/*  Main export                                                        */
/* ================================================================== */

export function CrmDesignSystem() {
  const [segmentedActive, setSegmentedActive] = useState<"cards" | "tabela">("cards");
  const [filterActive, setFilterActive] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F6F7F9]">
      {/* ─── Header ─── */}
      <div className="px-[32px] pt-[28px] pb-[16px]">
        <p
          className="text-[#98989d] uppercase"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
        >
          Referência Interna
        </p>
        <h1
          className="text-[#122232]"
          style={{ fontSize: 29, fontWeight: 700, letterSpacing: -0.5, lineHeight: "38px", ...fontFeature }}
        >
          Design System
        </h1>
        <p
          className="text-[#4E6987] mt-[4px]"
          style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
        >
          Padrões canônicos do Zenite CRM — todos os componentes devem seguir esta referência.
        </p>
      </div>

      <div className="px-[32px] pb-[40px] flex flex-col gap-[24px]">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  1. PALETA DE CORES                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Paleta de Cores</SectionTitle>
          <SectionSubtitle>Seis famílias cromáticas com background, 6 tonalidades cada, e neutrals.</SectionSubtitle>

          {/* Blue Berry */}
          <Label>Blue Berry — Brand / Info / Utilitário</Label>
          <div className="flex gap-[6px] mb-[16px]">
            {[
              { hex: "#DCF0FF", label: "bg", dark: false },
              { hex: "#73D0FF", label: "100", dark: false },
              { hex: "#07ABDE", label: "200", dark: false },
              { hex: "#0483AB", label: "300", dark: true },
              { hex: "#025E7B", label: "400", dark: true },
              { hex: "#013B4F", label: "500", dark: true },
              { hex: "#001B26", label: "600", dark: true },
            ].map((c) => (
              <div key={c.hex} className="flex flex-col items-center gap-[4px]">
                <div
                  className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center"
                  style={{ backgroundColor: c.hex }}
                >
                  <span style={{ fontSize: 8, fontWeight: 700, color: c.dark ? "#fff" : "#0483AB", ...fontFeature }}>
                    {c.label}
                  </span>
                </div>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 9 }}>{c.hex}</span>
              </div>
            ))}
          </div>

          {/* Green Mint */}
          <Label>Green Mint — Success / Primário de Confirmação</Label>
          <div className="flex gap-[6px] mb-[16px]">
            {[
              { hex: "#D9F8EF", label: "bg", dark: false },
              { hex: "#4BFACB", label: "100", dark: false },
              { hex: "#23E6B2", label: "200", dark: false },
              { hex: "#3CCEA7", label: "300", dark: false },
              { hex: "#135543", label: "400", dark: true },
              { hex: "#083226", label: "500", dark: true },
              { hex: "#02140E", label: "600", dark: true },
            ].map((c) => (
              <div key={c.hex} className="flex flex-col items-center gap-[4px]">
                <div
                  className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center"
                  style={{ backgroundColor: c.hex }}
                >
                  <span style={{ fontSize: 8, fontWeight: 700, color: c.dark ? "#fff" : "#135543", ...fontFeature }}>
                    {c.label}
                  </span>
                </div>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 9 }}>{c.hex}</span>
              </div>
            ))}
          </div>

          {/* Red Cherry */}
          <Label>Red Cherry — Danger / Destrutivo / Compromisso</Label>
          <div className="flex gap-[6px] mb-[16px]">
            {[
              { hex: "#FFEDEB", label: "bg", dark: false },
              { hex: "#FFC6BE", label: "100", dark: false },
              { hex: "#FF8C76", label: "200", dark: false },
              { hex: "#ED5200", label: "300", dark: true },
              { hex: "#B13B00", label: "400", dark: true },
              { hex: "#782500", label: "500", dark: true },
              { hex: "#431100", label: "600", dark: true },
            ].map((c) => (
              <div key={c.hex} className="flex flex-col items-center gap-[4px]">
                <div
                  className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center"
                  style={{ backgroundColor: c.hex }}
                >
                  <span style={{ fontSize: 8, fontWeight: 700, color: c.dark ? "#fff" : "#B13B00", ...fontFeature }}>
                    {c.label}
                  </span>
                </div>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 9 }}>{c.hex}</span>
              </div>
            ))}
          </div>

          {/* Yellow Mustard */}
          <Label>Yellow Mustard — Warning / Nota</Label>
          <div className="flex gap-[6px] mb-[16px]">
            {[
              { hex: "#FEEDCA", label: "bg", dark: false },
              { hex: "#F5DA82", label: "100", dark: false },
              { hex: "#EAC23D", label: "200", dark: false },
              { hex: "#C4990D", label: "300", dark: true },
              { hex: "#685516", label: "400", dark: true },
              { hex: "#42350A", label: "500", dark: true },
              { hex: "#1F1803", label: "600", dark: true },
            ].map((c) => (
              <div key={c.hex} className="flex flex-col items-center gap-[4px]">
                <div
                  className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center"
                  style={{ backgroundColor: c.hex }}
                >
                  <span style={{ fontSize: 8, fontWeight: 700, color: c.dark ? "#fff" : "#685516", ...fontFeature }}>
                    {c.label}
                  </span>
                </div>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 9 }}>{c.hex}</span>
              </div>
            ))}
          </div>

          {/* Purple Pie */}
          <Label>Purple Pie — Accent / Tarefa</Label>
          <div className="flex gap-[6px] mb-[16px]">
            {[
              { hex: "#E8E8FD", label: "bg", dark: false },
              { hex: "#B0B0D6", label: "100", dark: false },
              { hex: "#8C8CD4", label: "200", dark: false },
              { hex: "#6868B1", label: "300", dark: true },
              { hex: "#4E4E91", label: "400", dark: true },
              { hex: "#31315C", label: "500", dark: true },
              { hex: "#14142C", label: "600", dark: true },
            ].map((c) => (
              <div key={c.hex} className="flex flex-col items-center gap-[4px]">
                <div
                  className="w-[48px] h-[48px] rounded-[10px] flex items-center justify-center"
                  style={{ backgroundColor: c.hex }}
                >
                  <span style={{ fontSize: 8, fontWeight: 700, color: c.dark ? "#fff" : "#4E4E91", ...fontFeature }}>
                    {c.label}
                  </span>
                </div>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 9 }}>{c.hex}</span>
              </div>
            ))}
          </div>

          {/* Neutrals */}
          <Label>Cloud & Navy — Neutrals</Label>
          <div className="flex gap-[6px]">
            {[
              { hex: "#FFFFFF", label: "white", dark: false, border: true },
              { hex: "#F6F7F9", label: "bg", dark: false },
              { hex: "#DDE3EC", label: "border", dark: false },
              { hex: "#C8CFDB", label: "100", dark: false },
              { hex: "#D9D9D9", label: "200", dark: false },
              { hex: "#98989d", label: "muted", dark: true },
              { hex: "#4E6987", label: "300", dark: true },
              { hex: "#28415C", label: "400", dark: true },
              { hex: "#122232", label: "500", dark: true },
            ].map((c) => (
              <div key={c.hex} className="flex flex-col items-center gap-[4px]">
                <div
                  className={`w-[48px] h-[48px] rounded-[10px] flex items-center justify-center ${"border" in c && c.border ? "border border-[#DDE3EC]" : ""}`}
                  style={{ backgroundColor: c.hex }}
                >
                  <span style={{ fontSize: 8, fontWeight: 700, color: c.dark ? "#fff" : "#4E6987", ...fontFeature }}>
                    {c.label}
                  </span>
                </div>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 9 }}>{c.hex}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  2. TIPOGRAFIA                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Tipografia</SectionTitle>
          <SectionSubtitle>Font: DM Sans · Feature settings: ss01, ss04, ss05, ss07 · Mono: DM Mono</SectionSubtitle>

          <div className="flex flex-col gap-[12px]">
            {[
              { cls: "text-xltitle1", label: "XL Title 1", spec: "48px / 700 / -0.5" },
              { cls: "text-xltitle2", label: "XL Title 2", spec: "38px / 700 / -0.5" },
              { cls: "text-largetitle", label: "Large Title", spec: "29px / 700 / -0.5" },
              { cls: "text-title1", label: "Title 1", spec: "24px / 700 / -0.5" },
              { cls: "text-title2", label: "Title 2", spec: "22px / 700 / -0.5" },
              { cls: "text-title3", label: "Title 3", spec: "19px / 700 / -0.5" },
              { cls: "text-headline", label: "Headline", spec: "18px / 500 / -0.5" },
              { cls: "text-body", label: "Body", spec: "15px / 500 / -0.5" },
              { cls: "text-callout", label: "Callout", spec: "12px / 500 / -0.5" },
              { cls: "text-callout-bold", label: "Callout Bold", spec: "12px / 700 / -0.5" },
              { cls: "text-subheadline", label: "Subheadline", spec: "15px / 400 / -0.5" },
              { cls: "text-label-lg", label: "LABEL LG", spec: "13px / 700 / 1px uppercase" },
              { cls: "text-label-sm", label: "LABEL SM", spec: "10px / 700 / 0.5px uppercase" },
            ].map((t) => (
              <div key={t.cls} className="flex items-baseline gap-[16px]">
                <span className={`${t.cls} text-[#122232] min-w-[200px]`}>{t.label}</span>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
                  .{t.cls} — {t.spec}
                </span>
              </div>
            ))}
          </div>

          <Divider />

          <Label>Labels de Componentes (inline style)</Label>
          <div className="flex flex-col gap-[8px]">
            <div className="flex flex-col gap-[4px]">
              <span
                className="text-[#98989d] uppercase"
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
              >
                Micro Label 9px
              </span>
              <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
                9px / 700 / 0.5px uppercase — usado em badges, status pills
              </span>
            </div>
            <div className="flex flex-col gap-[4px]">
              <span
                className="text-[#4E6987] uppercase"
                style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
              >
                Micro Label 8px
              </span>
              <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
                8px / 700 / 0.5px uppercase — usado em status pills pequenos
              </span>
            </div>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  3. BOTÕES                                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Botões</SectionTitle>
          <SectionSubtitle>
            Todos os botões usam rounded-[500px] (full pill), uppercase, font-bold, tracking-[0.5px], fontSize 10.
          </SectionSubtitle>

          {/* Primário Criação de Registro */}
          <Label>Primário Criação de Registro — PillButton (Novo Lead, Nova Conta, Novo Contato…)</Label>
          <div className="flex items-center gap-[10px] mb-[12px]">
            <button className="group/pill relative flex items-center gap-[3px] h-[40px] pl-[16px] pr-[20px] rounded-[100px] bg-[#dcf0ff] text-[#28415c] hover:bg-[#bcdaf1] hover:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] transition-all duration-150 cursor-pointer">
              <Plus size={16} weight="bold" />
              <span className="font-semibold" style={{ fontSize: 15, letterSpacing: -0.5, lineHeight: "22px" }}>
                Novo Lead
              </span>
            </button>
            <button className="group/pill relative flex items-center gap-[3px] h-[40px] pl-[16px] pr-[20px] rounded-[100px] bg-[#dcf0ff] text-[#28415c] hover:bg-[#bcdaf1] hover:shadow-[0px_2px_4px_0px_rgba(18,34,50,0.3)] transition-all duration-150 cursor-pointer">
              <Plus size={16} weight="bold" />
              <span className="font-semibold" style={{ fontSize: 15, letterSpacing: -0.5, lineHeight: "22px" }}>Adicionar Tarefa</span>
            </button>
          </div>
          <span className="text-[#98989d] font-mono block mb-[20px]" style={{ fontSize: 10 }}>
            bg-[#dcf0ff] text-[#28415c] · h-[40px] rounded-[100px] · font-semibold fontSize 15 · hover: bg-[#bcdaf1] + shadow · active: radial-gradient overlay
          </span>

          {/* Primário Ação */}
          <Label>Primário Ação — Aplicar, Salvar, Confirmar</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[10px]">
              <button className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Aplicar
                </span>
              </button>
              <button className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Salvar
                </span>
              </button>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              bg-[#3CCEA7] text-white — Salvar, Aplicar, Confirmar (sempre green)
            </span>
          </div>
          <span className="text-[#98989d] font-mono block mb-[20px]" style={{ fontSize: 10 }}>
            ⚠ Não existe CTA contextual com cor da atividade/entidade.
          </span>

          {/* Primário Ação — Check icon */}
          <Label>Primário Ação — Icon-only (Confirmar view)</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <button className="flex items-center justify-center size-[34px] rounded-full bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer">
              <Check size={16} weight="bold" />
            </button>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              size-[34px] rounded-full bg-[#3CCEA7] — confirmar view/ação
            </span>
          </div>

          {/* Utilitário Azul */}
          <Label>Utilitário Azul — Ações secundárias (Salvar, Gerar link, Entrar)</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[10px]">
              <button className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors cursor-pointer">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Salvar
                </span>
              </button>
              <button className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#DCF0FF] text-[#0483AB] hover:bg-[#c5e5f7] transition-colors cursor-pointer">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Entrar no Google Meet
                </span>
              </button>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              bg-[#F6F7F9] / bg-[#DCF0FF] text-[#0483AB]
            </span>
          </div>

          {/* Neutro / Descartar */}
          <Label>Neutro — Cancelar, Descartar, Voltar</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[10px]">
              <button className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#F6F7F9] text-[#4E6987] hover:bg-[#ebedf0] transition-colors cursor-pointer">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Descartar
                </span>
              </button>
              <button className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#F6F7F9] text-[#4E6987] hover:bg-[#ebedf0] transition-colors cursor-pointer">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Cancelar
                </span>
              </button>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              bg-[#F6F7F9] text-[#4E6987] hover:bg-[#ebedf0]
            </span>
          </div>

          {/* Destrutivo */}
          <Label>Destrutivo — Cancelar view, Excluir, Remover</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[10px]">
              <button className="flex items-center justify-center size-[34px] rounded-full bg-[#F6F7F9] text-[#F56233] hover:bg-[#FFEDEB] transition-colors cursor-pointer">
                <X size={16} weight="bold" />
              </button>
              <button className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#F6F7F9] text-[#F56233] hover:bg-[#FFEDEB] transition-colors cursor-pointer">
                <Trash size={14} weight="bold" />
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Excluir
                </span>
              </button>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              bg-[#F6F7F9] text-[#F56233] · hover: bg-[#FFEDEB]
            </span>
          </div>

          {/* Filtro */}
          <Label>Botão Filtro — Toggle com estado ativo</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[10px]">
            <button
              onClick={() => setFilterActive(!filterActive)}
              className={`relative flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors cursor-pointer ${
                filterActive
                  ? "bg-[#07ABDE] text-[#DCF0FF]"
                  : "bg-[#F6F7F9] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB]"
              }`}
            >
              {filterActive ? <X size={14} weight="bold" /> : <FunnelSimple size={16} weight="bold" />}
            </button>
            {filterActive && (
              <div className="flex items-center gap-[4px] h-[28px] px-[10px] rounded-[500px] bg-[#DCF0FF] text-[#28415c]">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>
                  2 filtros
                </span>
                <X size={10} weight="bold" />
              </div>
            )}
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              Inativo: bg-[#F6F7F9] text-[#0483AB] · Ativo: bg-[#07ABDE] text-[#DCF0FF]
            </span>
          </div>

          <Divider />

          {/* Footer pair pattern */}
          <Label>Par de Botões Footer — Painel lateral (Descartar + Salvar)</Label>
          <div className="flex items-center gap-[6px] max-w-[300px] mb-[12px]">
            <button className="flex items-center justify-center gap-[6px] h-[34px] px-[14px] rounded-[500px] bg-[#F6F7F9] text-[#4E6987] hover:bg-[#ebedf0] transition-colors cursor-pointer flex-1">
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                Descartar
              </span>
            </button>
            <button className="flex items-center justify-center gap-[6px] h-[34px] px-[14px] rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer flex-1">
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                Salvar
              </span>
            </button>
          </div>
          <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
            flex-1 cada · h-[34px] · Salvar sempre Primário Green · Sem ícone (exceto Spinner quando saving)
          </span>

          <Divider />

          {/* Disabled */}
          <Label>Desativado — Disabled state (cloud 200, cursor-not-allowed)</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[10px]">
              <button disabled className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#D9D9D9] text-white cursor-not-allowed opacity-100">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Salvar
                </span>
              </button>
              <button disabled className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#D9D9D9] text-white cursor-not-allowed opacity-100">
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Aplicar
                </span>
              </button>
              <button disabled className="flex items-center gap-[6px] h-[34px] px-[16px] rounded-[500px] bg-[#D9D9D9] text-white cursor-not-allowed opacity-100">
                <Trash size={14} weight="bold" />
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                  Excluir
                </span>
              </button>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              bg-[#D9D9D9] text-white · cursor-not-allowed · sem hover · cloud 200
            </span>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  4. ACTION PILL & ICON BUTTONS                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Action Pill & Icon Buttons</SectionTitle>
          <SectionSubtitle>Agrupamento de ações em pill container arredondado. Ícones Phosphor, weight="bold" dentro da pill.</SectionSubtitle>

          <Label>Action Pill — Container</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[10px] bg-[#F6F7F9] rounded-[100px] h-[44px] px-[5px] w-fit">
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <LinkSimpleHorizontal size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <ArrowsOutSimple size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <Columns size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <NotePencil size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <X size={18} weight="bold" />
              </button>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              bg-[#F6F7F9] h-[44px] px-[5px] rounded-[100px] · ActionButton: size-[32px] text-[#0483AB] hover:bg-[#DCF0FF]
            </span>
          </div>

          <Label>Action Pill — Painel de detalhe (Editar + Fechar)</Label>
          <div className="flex items-center gap-[16px] mb-[20px]">
            <div className="flex items-center gap-[10px] bg-[#F6F7F9] rounded-[100px] h-[44px] px-[5px]">
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <NotePencil size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          <Label>Action Pill — Botão único</Label>
          <div className="flex items-center gap-[16px] mb-[20px]">
            <div className="flex items-center bg-[#F6F7F9] rounded-[100px] h-[44px] px-[5px]">
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          <Label>Double Action Pill — Duas pills separadas com divider entre elas</Label>
          <div className="flex flex-col gap-[8px] mb-[8px]">
            <div className="flex items-center gap-[16px]">
            {/* Pill esquerda — 3 botões */}
            <div className="flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <LinkSimpleHorizontal size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <ArrowsOutSimple size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <Columns size={18} weight="bold" />
              </button>
            </div>

            {/* Divider entre pills */}
            <div className="w-[1.5px] h-[20px] bg-[#DDE3EC] rounded-full" />

            {/* Pill direita — 5 botões */}
            <div className="flex items-center gap-[10px] bg-[#f6f7f9] rounded-[100px] h-[44px] px-[5px] py-[0px]">
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <NotePencil size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <Trash size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <Copy size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <DotsThree size={18} weight="bold" />
              </button>
              <button className="flex items-center justify-center size-[32px] rounded-full bg-transparent text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                <X size={18} weight="bold" />
              </button>
            </div>
            </div>

            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              gap-[16px] entre elementos · Divider: w-[1.5px] h-[20px] bg-[#DDE3EC] rounded-full
            </span>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  5. SEGMENTED CONTROL                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Segmented Control</SectionTitle>
          <SectionSubtitle>Toggle de view (Cards/Tabela, Mês/Semana/Dia, etc). Efeito dark glossy no item selecionado.</SectionSubtitle>

          <Label>Segmented Control — Dark Glossy</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#F6F7F9] rounded-[100px] w-fit">
              {(["cards", "tabela"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSegmentedActive(mode)}
                  className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] transition-all cursor-pointer ${
                    segmentedActive === mode
                      ? "text-[#F6F7F9]"
                      : "text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee]"
                  }`}
                >
                  {segmentedActive === mode && (
                    <>
                      <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                        style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
                      />
                    </>
                  )}
                  {mode === "cards" ? (
                    <Kanban size={14} weight={segmentedActive === mode ? "fill" : "regular"} className="relative z-[1]" />
                  ) : (
                    <Table size={14} weight={segmentedActive === mode ? "fill" : "regular"} className="relative z-[1]" />
                  )}
                  <span className="relative z-[1] font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                    {mode === "cards" ? "Cards" : "Tabela"}
                  </span>
                </button>
              ))}
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              Ativo: bg-[#28415c] text-[#F6F7F9] + shadow glossy · Inativo: text-[#98989d] · Ícone ativo: weight="fill" · Ícone inativo: weight="regular"
            </span>
          </div>

          <Label>Segmented Control — Exemplo Métricas/Perdidos</Label>
          <div className="relative flex items-center gap-[4px] h-[44px] p-[4px] bg-[#F6F7F9] rounded-[100px] overflow-clip w-fit">
            <button className="relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] text-[#F6F7F9] cursor-pointer">
              <div className="absolute inset-0 bg-[#28415c] rounded-[20px] backdrop-blur-[50px]" />
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none rounded-[20px] border-[0.5px] border-solid border-[rgba(200,207,219,0.6)]"
                style={{ boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }}
              />
              <span className="relative z-[1] font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                Métricas
              </span>
            </button>
            <button className="relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[100px] text-[#98989d] hover:text-[#4E6987] hover:bg-[#e8eaee] cursor-pointer">
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>
                Perdidos
              </span>
            </button>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  6. STATUS PILLS & BADGES                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Status Pills & Badges</SectionTitle>
          <SectionSubtitle>Indicadores de estado com ícone + label uppercase. h-[24px], rounded-[500px], fontSize 8.</SectionSubtitle>

          <Label>Status — Compromissos</Label>
          <div className="flex items-center gap-[8px] flex-wrap mb-[16px]">
            {[
              { label: "Agendado", color: "#07ABDE", bg: "#DCF0FF", icon: CalendarBlank },
              { label: "Confirmado", color: "#135543", bg: "#D9F8EF", icon: Check },
              { label: "Em andamento", color: "#8C5BD4", bg: "#E8E8FD", icon: Clock },
              { label: "Concluído", color: "#3CCEA7", bg: "#D9F8EF", icon: Check },
              { label: "Cancelado", color: "#B13B00", bg: "#FFEDEB", icon: X },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-[4px] h-[24px] px-[10px] rounded-[500px]" style={{ backgroundColor: s.bg }}>
                <s.icon size={10} weight="fill" style={{ color: s.color }} />
                <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: s.color, ...fontFeature }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <Label>Status — Tarefas</Label>
          <div className="flex items-center gap-[8px] flex-wrap mb-[16px]">
            {[
              { label: "Não iniciada", color: "#4E6987", bg: "#DDE3EC" },
              { label: "Em progresso", color: "#07ABDE", bg: "#DCF0FF" },
              { label: "Concluída", color: "#135543", bg: "#D9F8EF" },
              { label: "Adiada", color: "#917822", bg: "#FEEDCA" },
              { label: "Cancelada", color: "#B13B00", bg: "#FFEDEB" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-[4px] h-[24px] px-[10px] rounded-[500px]" style={{ backgroundColor: s.bg }}>
                <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: s.color, ...fontFeature }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <Label>Status — Leads (Estágios)</Label>
          <div className="flex items-center gap-[8px] flex-wrap mb-[16px]">
            {[
              { label: "Novo", color: "#28415c", bg: "#DDE3EC", icon: Sparkle },
              { label: "Em contato", color: "#28415c", bg: "#DDE3EC", icon: ChatCircle },
              { label: "Qualificação", color: "#28415c", bg: "#DDE3EC", icon: Trophy },
              { label: "Qualificado", color: "#135543", bg: "#D9F8EF", icon: CheckCircle },
              { label: "Perdido", color: "#B13B00", bg: "#FFEDEB", icon: XCircle },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-[4px] h-[24px] px-[10px] rounded-[500px]" style={{ backgroundColor: s.bg }}>
                <s.icon size={10} weight="fill" style={{ color: s.color }} />
                <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: s.color, ...fontFeature }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <Label>Prioridade</Label>
          <div className="flex items-center gap-[8px] flex-wrap mb-[16px]">
            {[
              { label: "Baixa", color: "#3CCEA7", icon: ArrowDown },
              { label: "Normal", color: "#4E6987", icon: Clock },
              { label: "Alta", color: "#ED5200", icon: ArrowUp },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-[#F6F7F9]">
                <p.icon size={10} weight="bold" style={{ color: p.color }} />
                <span className="uppercase whitespace-nowrap" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: p.color, ...fontFeature }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            ⚠ Regra: sobre fundo Cloud bg (#F6F7F9), texto sempre usa escala 300+ para legibilidade.
          </span>

          <Label>Badge Filtro Ativo</Label>
          <div className="flex flex-col gap-[8px] mb-[8px]">
            <div className="flex items-center gap-[4px] h-[28px] px-[10px] rounded-[500px] bg-[#DCF0FF] text-[#28415c] cursor-pointer w-fit">
              <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 9, ...fontFeature }}>
                2 filtros
              </span>
              <X size={10} weight="bold" />
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              h-[28px] bg-[#DCF0FF] text-[#28415c] rounded-[500px]
            </span>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  7. ÍCONES DE ENTIDADES & ATIVIDADES                           */}
        {/* ═══════════════════════════════════════════════════════���═══════ */}
        <Card>
          <SectionTitle>Ícones de Entidades & Atividades</SectionTitle>
          <SectionSubtitle>Phosphor Icons, weight="duotone" para padrão, "fill" para ativo/selecionado, "bold" dentro de ActionButtons.</SectionSubtitle>

          <Label>Entidades do CRM</Label>
          <div className="flex items-center gap-[20px] mb-[20px]">
            {[
              { icon: Heart, label: "Lead", color: "#EAC23D", bg: "#FEEDCA" },
              { icon: Building, label: "Conta", color: "#3CCEA7", bg: "#D9F8EF" },
              { icon: IdentificationCard, label: "Contato", color: "#FF8C76", bg: "#FFEDEB" },
              { icon: SketchLogo, label: "Oportunidade", color: "#07ABDE", bg: "#DCF0FF" },
              { icon: Lightning, label: "Atividade", color: "#4E6987", bg: "#DDE3EC" },
            ].map((e) => (
              <div key={e.label} className="flex flex-col items-center gap-[6px]">
                <div
                  className="flex items-center justify-center size-[40px] rounded-[10px]"
                  style={{ backgroundColor: e.bg }}
                >
                  <e.icon size={20} weight="duotone" style={{ color: e.color }} />
                </div>
                <span className="text-[#4E6987]" style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}>
                  {e.label}
                </span>
              </div>
            ))}
          </div>

          <Label>Tipos de Atividade (6 cores canônicas)</Label>
          <div className="flex items-center gap-[20px] mb-[8px]">
            {[
              { icon: CalendarBlank, label: "Compromisso", color: "#FF8C76", bg: "#FFEDEB" },
              { icon: CheckCircle, label: "Tarefa", color: "#8C8CD4", bg: "#E8E8FD" },
              { icon: Phone, label: "Ligação", color: "#3CCEA7", bg: "#D9F8EF" },
              { icon: NoteBlank, label: "Nota", color: "#EAC23D", bg: "#FEEDCA" },
              { icon: ChatCircle, label: "Mensagem", color: "#07ABDE", bg: "#DCF0FF" },
              { icon: Envelope, label: "Email", color: "#4E6987", bg: "#DDE3EC" },
            ].map((a) => (
              <div key={a.label} className="flex flex-col items-center gap-[6px]">
                <div
                  className="flex items-center justify-center size-[40px] rounded-[10px]"
                  style={{ backgroundColor: a.bg }}
                >
                  <a.icon size={20} weight="duotone" style={{ color: a.color }} />
                </div>
                <span className="text-[#4E6987]" style={{ fontSize: 10, fontWeight: 600, ...fontFeature }}>
                  {a.label}
                </span>
                <span className="text-[#98989d] font-mono" style={{ fontSize: 8 }}>{a.color}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  8. INPUTS & FORMS                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Inputs & Forms</SectionTitle>
          <SectionSubtitle>Campos de formulário padrão — modais e painéis de edição.</SectionSubtitle>

          <Label>Input Padrão (Modal)</Label>
          <div className="flex flex-col gap-[6px] max-w-[320px] mb-[16px]">
            <label className="text-[#4E6987] uppercase" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, ...fontFeature }}>
              Assunto
            </label>
            <input
              type="text"
              placeholder="Ex: Reunião com cliente Alpha"
              defaultValue="Reunião de alinhamento"
              className="w-full h-[38px] px-[12px] rounded-[10px] border border-[#DDE3EC] bg-white text-[#28415c] outline-none focus:border-[#07ABDE] transition-colors"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
            />
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            h-[38px] rounded-[10px] border-[#DDE3EC] focus:border-[#07ABDE] · Label: 11px/700 uppercase
          </span>

          <Label>Input Inline (Painel lateral — edição)</Label>
          <div className="max-w-[280px] mb-[16px]">
            <input
              type="text"
              defaultValue="Reunião semanal"
              className="w-full bg-transparent border-b border-[#07ABDE] outline-none text-[#28415c]"
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
            />
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            bg-transparent border-b border-[#07ABDE] — para edição inline de títulos
          </span>

          <Label>Textarea</Label>
          <div className="max-w-[320px] mb-[16px]">
            <textarea
              rows={2}
              defaultValue="Descrição do compromisso"
              className="w-full text-[#4E6987] bg-[#F6F7F9] rounded-[8px] px-[10px] py-[6px] outline-none border border-transparent focus:border-[#07ABDE] resize-none"
              style={{ fontSize: 12, fontWeight: 400, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}
            />
          </div>

          <Label>Select / Dropdown (inline pill)</Label>
          <div className="flex flex-col gap-[8px] mb-[8px]">
            <select
              defaultValue="agendado"
              className="h-[28px] px-[10px] pr-[24px] rounded-[500px] border-none outline-none cursor-pointer uppercase bg-[#DCF0FF] w-fit appearance-none"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "#07ABDE", ...fontFeature, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 256 256'%3E%3Cpath d='M128,188a12,12,0,0,1-8.49-3.51l-80-80a12,12,0,0,1,17-17L128,159,199.51,87.51a12,12,0,0,1,17,17l-80,80A12,12,0,0,1,128,188Z' fill='%2307ABDE'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
            </select>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              h-[24px] rounded-[500px] — herda bg/color do status config
            </span>
          </div>

          <Divider />

          <Label>Search Input (com ícone)</Label>
          <div className="max-w-[320px] mb-[16px]">
            <div
              className="relative flex items-center gap-[10px] h-[40px] px-[14px] rounded-full bg-[#DDE3EC] flex-1 min-w-[140px] max-w-[280px]"
              style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
            >
              <MagnifyingGlass size={16} weight="bold" className="text-[#98989d] shrink-0" />
              <input
                type="text"
                placeholder="Buscar..."
                className="flex-1 bg-transparent outline-none text-[#28415c] placeholder:text-[#c8cfdb]"
                style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
              />
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            rounded-full bg-[#DDE3EC] h-[40px] · inner shadow inset · ícone weight=&quot;bold&quot;
          </span>

          <Divider />

          {/* ── EditableField — Campos de Detalhe de Registro ── */}
          <Label>Campos de Detalhe de Registro (EditableField)</Label>
          <p className="text-[#4E6987] mb-[16px]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>
            Componente <code className="bg-[#f6f7f9] px-[4px] rounded-[4px] text-[#0483AB]">EditableField</code> — usado em todas as telas de detalhe (Lead, Conta, Contato, Oportunidade). Possui 5 estados visuais distintos com paleta de cores por estado.
          </p>

          {/* ── Estado: Inativo (Idle) ── */}
          <Label>Estado: Inativo (idle)</Label>
          <div className="flex items-start gap-[16px] mb-[6px]">
            {/* Text field */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Nome do Lead
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Alpha Tecnologia
                </span>
              </div>
              {/* Pencil button appears on hover */}
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* User field */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[160px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Proprietário
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="size-[16px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]" style={{ fontSize: 8, fontWeight: 700 }}>
                  M
                </span>
                <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Marcelo Silva
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Link field */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[160px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Website
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  alpha.com.br
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            label: text-[#98989d] 10px/700 uppercase · value: text-[#4e6987] 15px/500 · link types: text-[#0483AB] · border-transparent · hover:bg-[#f6f7f9] · pencil: size-[16px] bg-[#dde3ec] text-[#4e6987]
          </span>

          {/* ── Estado: Hover ── */}
          <Label>Estado: Hover</Label>
          <div className="flex items-start gap-[16px] mb-[6px]">
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent bg-[#f6f7f9] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Nome do Lead
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Alpha Tecnologia
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Empty field */}
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent bg-[#f6f7f9] cursor-pointer transition-all min-w-[160px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Telefone
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#c8cfdb]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  —
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            bg-[#f6f7f9] · pencil aparece · valor vazio: text-[#c8cfdb] &quot;—&quot;
          </span>

          {/* ── Estado: Editando ── */}
          <Label>Estado: Editando (editing)</Label>
          <div className="flex items-start gap-[16px] mb-[6px]">
            {/* Text editing */}
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[5px] border border-[#07abde] cursor-text transition-all min-w-[180px]">
              <div className="flex items-center">
                <span className="text-[#07abde] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Nome do Lead
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <input
                  type="text"
                  defaultValue="Alpha Tecnologia"
                  className="flex-1 bg-transparent outline-none text-[#4e6987] min-w-0"
                  style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                />
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer">
                  <X size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Type/picklist editing — dropdown indicator */}
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[5px] border border-[#07abde] cursor-pointer transition-all min-w-[160px]">
              <div className="flex items-center">
                <span className="text-[#07abde] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Setor
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: "#07ABDE" }} />
                <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Tecnologia
                </span>
                <CaretDown size={12} weight="bold" className="text-[#07abde] ml-auto" />
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer">
                  <X size={9} weight="bold" />
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            label: text-[#07abde] · border-[#07abde] · p-[5px] (compensa borda) · botão único: bg-[#dcf0ff] text-[#07abde] · Editing → X (cancelar)
          </span>

          {/* ── Estado: Não salvo (unsaved) ── */}
          <Label>Estado: Não salvo (unsaved)</Label>
          <div className="flex items-start gap-[16px] mb-[6px]">
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[5px] border border-[#C4990D] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center">
                <span className="text-[#C4990D] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Nome do Lead
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#C4990D]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Alpha Tech LTDA
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#feedca] text-[#C4990D] cursor-pointer" title="Salvar">
                  <Check size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* User field unsaved */}
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[5px] border border-[#C4990D] cursor-pointer transition-all min-w-[160px]">
              <div className="flex items-center">
                <span className="text-[#C4990D] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Proprietário
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="size-[16px] rounded-full bg-[#dde3ec] flex items-center justify-center shrink-0 text-[#4e6987]" style={{ fontSize: 8, fontWeight: 700 }}>
                  A
                </span>
                <span className="text-[#C4990D]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Ana Costa
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#feedca] text-[#C4990D] cursor-pointer">
                  <Check size={9} weight="bold" />
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            label + value: text-[#C4990D] · border-[#C4990D] · botão único: bg-[#feedca] text-[#C4990D] · Unsaved → Check (salvar)
          </span>

          {/* ── Estado: Erro ── */}
          <Label>Estado: Erro (error)</Label>
          <div className="flex items-start gap-[16px] mb-[6px]">
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[5px] border border-[#f56233] transition-all min-w-[180px]">
              <div className="flex items-center gap-[2px]">
                <span className="text-[#f56233] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Email<span className="text-[#f56233] ml-[2px]">*</span>
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#f56233]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  email-invalido
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#ffedeb] text-[#ff8c76] cursor-pointer">
                  <X size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Required empty error */}
            <div className="relative flex flex-col gap-0 rounded-[8px] p-[5px] border border-[#f56233] transition-all min-w-[160px]">
              <div className="flex items-center">
                <span className="text-[#f56233] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Telefone<span className="text-[#f56233] ml-[2px]">*</span>
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#f56233]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Campo obrigatório
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px]">
                <span className="flex items-center justify-center size-[16px] rounded-full bg-[#ffedeb] text-[#ff8c76] cursor-pointer">
                  <X size={9} weight="bold" />
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            label + value: text-[#f56233] · border-[#f56233] · botões: bg-[#ffedeb] text-[#ff8c76] · required: asterisco vermelho
          </span>

          <Divider />

          {/* ── Variações especiais ── */}
          <Label>Variações especiais</Label>
          <div className="flex items-start gap-[16px] flex-wrap mb-[6px]">
            {/* AI field */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[150px]">
              <div className="flex items-center gap-[2px]">
                <Sparkle size={10} weight="duotone" className="text-[#98989d]" />
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Score IA
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  87
                </span>
              </div>
            </div>

            {/* Highlighted field */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent bg-[#f6f7f9] cursor-pointer transition-all min-w-[150px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Receita Anual
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  R$ 1.500.000,00
                </span>
              </div>
            </div>

            {/* Boolean field */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[120px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Opt-in Email
                </span>
              </div>
              <div className="flex items-center gap-[8px] min-h-[22px]">
                <span className="relative w-[36px] h-[20px] rounded-full" style={{ backgroundColor: "#07ABDE" }}>
                  <span className="absolute top-[2px] left-[18px] w-[16px] h-[16px] rounded-full bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                </span>
                <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Sim
                </span>
              </div>
            </div>

            {/* Type field with color dot */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[140px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Setor
                </span>
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: "#07ABDE" }} />
                <span className="text-[#4e6987]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Tecnologia
                </span>
              </div>
            </div>

            {/* Multipicklist */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Tags
                </span>
              </div>
              <div className="flex flex-wrap gap-[4px] min-h-[22px] items-center">
                {[{ l: "VIP", c: "#3CCEA7" }, { l: "Enterprise", c: "#07ABDE" }, { l: "Prioridade", c: "#EAC23D" }].map((t) => (
                  <span key={t.l} className="inline-flex items-center h-[22px] px-[8px] rounded-[6px]" style={{ backgroundColor: `${t.c}20`, color: t.c, fontSize: 12, fontWeight: 600, letterSpacing: 0.2, ...fontFeature }}>
                    {t.l}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[4px]" style={{ fontSize: 10 }}>
            ai: Sparkle icon · highlighted: bg-[#f6f7f9] permanente · boolean: ZeniteToggle · type: color dot 8px · multipicklist: pills com cor 20% opacity
          </span>

          <Divider />

          {/* ── Campos de Vínculo (Relacionamento com Entidades) ── */}
          <Label>Campos de Vínculo (Relacionamento com Entidades)</Label>
          <p className="text-[#4E6987] mb-[16px]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>
            Campos que vinculam um registro a outra entidade (Conta, Contato, Oportunidade). Usam o ícone <code className="bg-[#f6f7f9] px-[4px] rounded-[4px] text-[#0483AB]">LinkSimpleHorizontal</code> como indicador de vínculo, com as cores da entidade-alvo no ícone e valor clicável.
          </p>

          <div className="flex items-start gap-[16px] flex-wrap mb-[6px]">
            {/* Vinculado a — Conta */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Conta
                </span>
                <LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <Building size={14} weight="duotone" className="text-[#3CCEA7] shrink-0" />
                <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Alpha Tecnologia
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Vinculado a — Lead */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Lead
                </span>
                <LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <Heart size={14} weight="duotone" className="text-[#EAC23D] shrink-0" />
                <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Expansão Enterprise
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Vinculado a — Contato */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Contato
                </span>
                <LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <IdentificationCard size={14} weight="duotone" className="text-[#FF8C76] shrink-0" />
                <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  João Mendes
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Vinculado a — Oportunidade */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[180px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Oportunidade
                </span>
                <LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <SketchLogo size={14} weight="duotone" className="text-[#07ABDE] shrink-0" />
                <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Projeto ERP 2026
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>

            {/* Vinculado a — Vazio */}
            <div className="group relative flex flex-col gap-0 rounded-[8px] p-[6px] border border-transparent hover:bg-[#f6f7f9] cursor-pointer transition-all min-w-[160px]">
              <div className="flex items-center gap-[4px]">
                <span className="text-[#98989d] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                  Vinculado a
                </span>
                <LinkSimpleHorizontal size={10} weight="bold" className="text-[#98989d]" />
              </div>
              <div className="flex items-center gap-[6px] min-h-[22px]">
                <span className="text-[#c8cfdb]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  —
                </span>
              </div>
              <div className="absolute right-[5px] top-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="hidden group-hover:flex items-center justify-center size-[16px] rounded-full bg-[#dde3ec] text-[#4e6987]">
                  <PencilSimple size={9} weight="bold" />
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[16px]" style={{ fontSize: 10 }}>
            ícone label: LinkSimpleHorizontal size=10 bold · ícone entidade: size=14 duotone com cor da entidade (Conta=#3CCEA7, Contato=#FF8C76, Oportunidade=#07ABDE) · valor: text-[#0483AB] clicável · vazio: text-[#c8cfdb] &quot;—&quot;
          </span>

          {/* ── Estado: Editando vínculo existente ── */}
          <Label>Estado: Editando vínculo existente</Label>
          <p className="text-[#4E6987] mb-[16px]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "17px", ...fontFeature }}>
            Ao clicar para editar um campo de vínculo que já possui um registro associado, um popover exibe o registro atual com ações contextuais e um campo de busca para trocar o vínculo.
          </p>

          <div className="flex items-start gap-[24px] flex-wrap mb-[6px]">
            {/* Campo ativo + popover */}
            <div className="relative min-w-[260px]">
              {/* Campo em estado editing */}
              <div className="relative flex flex-col gap-0 rounded-[8px] p-[5px] border border-[#07abde] cursor-pointer transition-all">
                <div className="flex items-center gap-[4px]">
                  <span className="text-[#07abde] uppercase block" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}>
                    Conta
                  </span>
                  <LinkSimpleHorizontal size={10} weight="bold" className="text-[#07abde]" />
                </div>
                <div className="flex items-center gap-[6px] min-h-[22px]">
                  <Building size={14} weight="duotone" className="text-[#3CCEA7] shrink-0" />
                  <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                    Alpha Tecnologia
                  </span>
                </div>
                <div className="absolute right-[5px] top-[10px]">
                  <span className="flex items-center justify-center size-[16px] rounded-full bg-[#dcf0ff] text-[#07abde] cursor-pointer">
                    <X size={9} weight="bold" />
                  </span>
                </div>
              </div>

              {/* Popover dropdown */}
              <div
                className="mt-[4px] w-[280px] bg-white rounded-[12px] z-10 overflow-hidden"
                style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}
              >
                {/* Registro atual */}
                <div className="px-[12px] pt-[10px] pb-[6px]">
                  <span className="text-[#98989d] uppercase block mb-[6px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                    Registro vinculado
                  </span>
                  <div className="flex items-center gap-[8px] p-[8px] rounded-[8px] bg-[#f6f7f9]">
                    <div className="flex items-center justify-center size-[28px] rounded-[8px] shrink-0" style={{ backgroundColor: "#D9F8EF" }}>
                      <Building size={14} weight="duotone" className="text-[#3CCEA7]" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[#28415c] truncate" style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...fontFeature }}>
                        Alpha Tecnologia
                      </span>
                      <span className="text-[#98989d]" style={{ fontSize: 10, fontWeight: 500, ...fontFeature }}>
                        Tecnologia · São Paulo, SP
                      </span>
                    </div>
                    <button className="flex items-center justify-center size-[24px] rounded-full hover:bg-[#DCF0FF] text-[#0483AB] transition-colors shrink-0 cursor-pointer" title="Abrir registro">
                      <ArrowSquareOut size={13} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Separador */}
                <div className="h-[1px] bg-[#eceef1] mx-[12px]" />

                {/* Trocar vínculo — search */}
                <div className="px-[12px] py-[6px]">
                  <div
                    className="flex items-center gap-[8px] h-[34px] px-[10px] rounded-[8px] bg-[#DDE3EC]"
                    style={{ boxShadow: "inset 0px 1px 3px 0px rgba(0,0,0,0.1), inset 0px 1px 2px 0px rgba(0,0,0,0.06)" }}
                  >
                    <MagnifyingGlass size={13} weight="bold" className="text-[#98989d] shrink-0" />
                    <span className="text-[#c8cfdb]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}>
                      Buscar outra conta...
                    </span>
                  </div>
                </div>

                {/* Remover vínculo */}
                <div className="px-[12px] pb-[10px] pt-[2px]">
                  <button className="flex items-center gap-[6px] w-full h-[32px] px-[10px] rounded-[8px] bg-[#F6F7F9] hover:bg-[#FFEDEB] text-[#F56233] transition-colors cursor-pointer">
                    <LinkBreak size={13} weight="bold" />
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, ...fontFeature }}>
                      Remover vínculo
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Anotação visual do padrão */}
            <div className="flex flex-col gap-[8px] max-w-[260px] pt-[4px]">
              <div className="flex items-start gap-[6px]">
                <span className="size-[6px] rounded-full bg-[#07ABDE] mt-[5px] shrink-0" />
                <span className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}>
                  Campo entra em estado <strong>editing</strong> (borda e label azul)
                </span>
              </div>
              <div className="flex items-start gap-[6px]">
                <span className="size-[6px] rounded-full bg-[#3CCEA7] mt-[5px] shrink-0" />
                <span className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}>
                  Registro atual exibido com ícone da entidade, nome e meta-info
                </span>
              </div>
              <div className="flex items-start gap-[6px]">
                <span className="size-[6px] rounded-full bg-[#0483AB] mt-[5px] shrink-0" />
                <span className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}>
                  <strong>ArrowSquareOut</strong> — abre o registro vinculado
                </span>
              </div>
              <div className="flex items-start gap-[6px]">
                <span className="size-[6px] rounded-full bg-[#DDE3EC] mt-[5px] shrink-0" />
                <span className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}>
                  Search input padrão do DS para trocar vínculo
                </span>
              </div>
              <div className="flex items-start gap-[6px]">
                <span className="size-[6px] rounded-full bg-[#F56233] mt-[5px] shrink-0" />
                <span className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.2, lineHeight: "16px", ...fontFeature }}>
                  <strong>Remover vínculo</strong> — ação destrutiva (vermelho)
                </span>
              </div>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mb-[4px]" style={{ fontSize: 10 }}>
            popover: bg-white rounded-[12px] shadow · registro: bg-[#f6f7f9] rounded-[8px] com ícone entidade 28px · abrir: ArrowSquareOut hover:bg-[#DCF0FF] · busca: padrão DS bg-[#DDE3EC] inner shadow · remover: text-[#F56233] hover:bg-[#FFEDEB]
          </span>

        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  TIPOS DE CAMPOS (FIELD TYPES)                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Tipos de Campos</SectionTitle>
          <SectionSubtitle>Catálogo completo dos tipos de campo disponíveis no editor de campos do CRM. Cada tipo possui ícone, cor e fundo próprios — agrupados por categoria funcional.</SectionSubtitle>

          {/* Texto & Comunicação */}
          <span className="text-[#98989d] uppercase block mb-[8px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, ...fontFeature }}>
            Texto & Comunicação
          </span>
          <div className="flex flex-wrap gap-[8px] mb-[16px]">
            {([
              { icon: TextT, label: "Texto", color: "#4e6987", bg: "#f0f2f5", desc: "Campo de texto simples" },
              { icon: TextAlignLeft, label: "Texto Longo", color: "#4e6987", bg: "#f0f2f5", desc: "Múltiplas linhas / rich text" },
              { icon: Phone, label: "Telefone", color: "#3ccea7", bg: "#d9f8ef", desc: "Formatação automática BR" },
              { icon: EnvelopeSimple, label: "Email", color: "#07abde", bg: "#dcf0ff", desc: "Validação de e-mail" },
              { icon: LinkSimpleHorizontal, label: "Link", color: "#07abde", bg: "#dcf0ff", desc: "URL com validação" },
            ] as const).map((f) => (
              <div key={f.label} className="flex items-center gap-[8px] p-[6px] pr-[10px] rounded-[10px] border border-[#eceef1] min-w-[160px]">
                <div className="flex items-center justify-center size-[26px] rounded-[7px] shrink-0" style={{ backgroundColor: f.bg }}>
                  <f.icon size={14} weight="duotone" style={{ color: f.color }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, lineHeight: "15px", ...fontFeature }}>{f.label}</span>
                  <span className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 500, lineHeight: "12px", ...fontFeature }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Data & Tempo */}
          <span className="text-[#98989d] uppercase block mb-[8px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, ...fontFeature }}>
            Data & Tempo
          </span>
          <div className="flex flex-wrap gap-[8px] mb-[16px]">
            {([
              { icon: Calendar, label: "Data", color: "#eac23d", bg: "#feedca", desc: "Seletor de data" },
              { icon: Timer, label: "Hora", color: "#eac23d", bg: "#feedca", desc: "Campo de hora (12h/24h)" },
              { icon: Calendar, label: "Data e Hora", color: "#eac23d", bg: "#feedca", desc: "Data e hora combinados" },
              { icon: Timer, label: "Duração", color: "#eac23d", bg: "#feedca", desc: "Tempo em min/h/dias" },
            ] as const).map((f) => (
              <div key={f.label} className="flex items-center gap-[8px] p-[6px] pr-[10px] rounded-[10px] border border-[#eceef1] min-w-[160px]">
                <div className="flex items-center justify-center size-[26px] rounded-[7px] shrink-0" style={{ backgroundColor: f.bg }}>
                  <f.icon size={14} weight="duotone" style={{ color: f.color }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, lineHeight: "15px", ...fontFeature }}>{f.label}</span>
                  <span className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 500, lineHeight: "12px", ...fontFeature }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Numérico & Monetário */}
          <span className="text-[#98989d] uppercase block mb-[8px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, ...fontFeature }}>
            Numérico & Monetário
          </span>
          <div className="flex flex-wrap gap-[8px] mb-[16px]">
            {([
              { icon: Hash, label: "Número", color: "#8c8cd4", bg: "#e8e8fd", desc: "Casas decimais, mín/máx" },
              { icon: Percent, label: "Porcentagem", color: "#8c8cd4", bg: "#e8e8fd", desc: "Precisão configurável" },
              { icon: CurrencyDollar, label: "Moeda", color: "#3ccea7", bg: "#d9f8ef", desc: "Valor monetário com símbolo" },
            ] as const).map((f) => (
              <div key={f.label} className="flex items-center gap-[8px] p-[6px] pr-[10px] rounded-[10px] border border-[#eceef1] min-w-[160px]">
                <div className="flex items-center justify-center size-[26px] rounded-[7px] shrink-0" style={{ backgroundColor: f.bg }}>
                  <f.icon size={14} weight="duotone" style={{ color: f.color }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, lineHeight: "15px", ...fontFeature }}>{f.label}</span>
                  <span className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 500, lineHeight: "12px", ...fontFeature }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Seleção & Listas */}
          <span className="text-[#98989d] uppercase block mb-[8px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, ...fontFeature }}>
            Seleção & Listas
          </span>
          <div className="flex flex-wrap gap-[8px] mb-[16px]">
            {([
              { icon: ListBullets, label: "Lista", color: "#ff8c76", bg: "#ffedeb", desc: "Seleção única (picklist)" },
              { icon: Tag, label: "Multi-seleção", color: "#ff8c76", bg: "#ffedeb", desc: "Seleção múltipla" },
              { icon: CaretCircleUpDown, label: "Combobox", color: "#ff8c76", bg: "#ffedeb", desc: "Dropdown com busca" },
            ] as const).map((f) => (
              <div key={f.label} className="flex items-center gap-[8px] p-[6px] pr-[10px] rounded-[10px] border border-[#eceef1] min-w-[160px]">
                <div className="flex items-center justify-center size-[26px] rounded-[7px] shrink-0" style={{ backgroundColor: f.bg }}>
                  <f.icon size={14} weight="duotone" style={{ color: f.color }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, lineHeight: "15px", ...fontFeature }}>{f.label}</span>
                  <span className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 500, lineHeight: "12px", ...fontFeature }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Referência & Estrutura */}
          <span className="text-[#98989d] uppercase block mb-[8px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, ...fontFeature }}>
            Referência & Estrutura
          </span>
          <div className="flex flex-wrap gap-[8px] mb-[16px]">
            {([
              { icon: UserCircle, label: "Usuário", color: "#07abde", bg: "#dcf0ff", desc: "Referência a usuário do sistema" },
              { icon: ToggleLeft, label: "Booleano", color: "#3ccea7", bg: "#d9f8ef", desc: "Toggle sim/não" },
              { icon: MapPin, label: "Endereço", color: "#4e6987", bg: "#f0f2f5", desc: "Endereço completo com sub-campos" },
              { icon: LinkSimpleHorizontal, label: "Associação", color: "#07abde", bg: "#dcf0ff", desc: "Referência a outro objeto CRM" },
            ] as const).map((f) => (
              <div key={f.label} className="flex items-center gap-[8px] p-[6px] pr-[10px] rounded-[10px] border border-[#eceef1] min-w-[160px]">
                <div className="flex items-center justify-center size-[26px] rounded-[7px] shrink-0" style={{ backgroundColor: f.bg }}>
                  <f.icon size={14} weight="duotone" style={{ color: f.color }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, lineHeight: "15px", ...fontFeature }}>{f.label}</span>
                  <span className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 500, lineHeight: "12px", ...fontFeature }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sistema & Automação */}
          <span className="text-[#98989d] uppercase block mb-[8px]" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, ...fontFeature }}>
            Sistema & Automação
          </span>
          <div className="flex flex-wrap gap-[8px] mb-[16px]">
            {([
              { icon: Shapes, label: "Contextual", color: "#8C8CD4", bg: "#e8e8fd", desc: "Opções dinâmicas por contexto" },
              { icon: FunctionIcon, label: "Calculado", color: "#8C8CD4", bg: "#e8e8fd", desc: "Valor gerado por fórmula" },
              { icon: Fingerprint, label: "ID", color: "#98989d", bg: "#f0f2f5", desc: "Identificador único do registro" },
            ] as const).map((f) => (
              <div key={f.label} className="flex items-center gap-[8px] p-[6px] pr-[10px] rounded-[10px] border border-[#eceef1] min-w-[160px]">
                <div className="flex items-center justify-center size-[26px] rounded-[7px] shrink-0" style={{ backgroundColor: f.bg }}>
                  <f.icon size={14} weight="duotone" style={{ color: f.color }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#28415c]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.2, lineHeight: "15px", ...fontFeature }}>{f.label}</span>
                  <span className="text-[#98989d]" style={{ fontSize: 9, fontWeight: 500, lineHeight: "12px", ...fontFeature }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <span className="text-[#98989d] font-mono block mb-[4px]" style={{ fontSize: 10 }}>
            card: h-[38px] rounded-[10px] border-[#eceef1] · ícone: size-[26px] rounded-[7px] bg=tipo.bg · icon: size=14 duotone color=tipo.color · label: 12px/600 · desc: 9px/500
          </span>

        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  EXEMPLOS DE CAMPOS POR TIPO                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Exemplos de Campos por Tipo</SectionTitle>
          <SectionSubtitle>Cada tipo de campo renderizado como EditableField interativo — clique para editar, selecionar, alternar. Estado local (mockup).</SectionSubtitle>

          <InteractiveFieldExamples />
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  9. TOGGLE / SWITCH                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Toggle / Switch</SectionTitle>
          <SectionSubtitle>Toggle binário para configurações. Cores: ativo #07ABDE, inativo #C8CFDB.</SectionSubtitle>

          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center gap-[16px]">
              <button
                onClick={() => setToggleOn(!toggleOn)}
                className="relative w-[40px] h-[22px] rounded-full transition-colors cursor-pointer"
                style={{ backgroundColor: toggleOn ? "#07ABDE" : "#C8CFDB" }}
              >
                <div
                  className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all"
                  style={{ left: toggleOn ? 20 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
                />
              </button>
              <span className="text-[#28415c]" style={{ fontSize: 13, fontWeight: 600, ...fontFeature }}>
                {toggleOn ? "Ativado" : "Desativado"}
              </span>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              Ativo: bg-[#07ABDE] · Inativo: bg-[#C8CFDB]
            </span>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  10. CARDS & PAINÉIS                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Cards & Painéis</SectionTitle>
          <SectionSubtitle>Containers visuais para organização de conteúdo.</SectionSubtitle>

          <Label>Card Padrão</Label>
          <div className="flex flex-col gap-[8px] mb-[20px]">
            <div className="flex items-center gap-[16px]">
              <div className="bg-white rounded-[15px] p-[16px] border border-[#DDE3EC] w-[200px]">
                <span className="text-[#28415c]" style={{ fontSize: 13, fontWeight: 600, ...fontFeature }}>
                  Card com borda
                </span>
              </div>
              <div className="bg-white rounded-[15px] p-[16px] w-[200px]" style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}>
                <span className="text-[#28415c]" style={{ fontSize: 13, fontWeight: 600, ...fontFeature }}>
                  Card com shadow
                </span>
              </div>
            </div>
            <span className="text-[#98989d] font-mono" style={{ fontSize: 10 }}>
              rounded-[15px] · border: #DDE3EC · ou shadow sutil
            </span>
          </div>

          <Label>Painel Lateral de Detalhe</Label>
          <div className="flex flex-col gap-[8px]">
            <div className="bg-white rounded-[15px] w-[280px] overflow-hidden" style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" }}>
              <div className="px-[20px] pt-[14px] pb-[10px]">
                <div className="flex justify-end mb-[4px]">
                  <div className="flex items-center gap-[10px] bg-[#F6F7F9] rounded-[100px] h-[44px] px-[5px]">
                    <button className="flex items-center justify-center size-[32px] rounded-full text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                      <NotePencil size={18} weight="bold" />
                    </button>
                    <button className="flex items-center justify-center size-[32px] rounded-full text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer">
                      <X size={18} weight="bold" />
                    </button>
                  </div>
                </div>
                <p className="text-[#98989d] uppercase" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}>
                  Evento
                </p>
                <p className="text-[#28415c] mt-[2px]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
                  Reunião semanal
                </p>
                <div className="flex items-center gap-[6px] mt-[10px]">
                  <div className="flex items-center gap-[4px] h-[24px] px-[10px] rounded-[500px] bg-[#DCF0FF]">
                    <CalendarBlank size={10} weight="fill" style={{ color: "#07ABDE" }} />
                    <span className="uppercase" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#07ABDE", ...fontFeature }}>
                      Agendado
                    </span>
                  </div>
                  <div className="flex items-center gap-[3px] h-[24px] px-[10px] rounded-[500px] bg-[#F6F7F9]">
                    <Clock size={10} weight="bold" style={{ color: "#4E6987" }} />
                    <span className="uppercase" style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: "#4E6987", ...fontFeature }}>
                      Normal
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-[20px] py-[8px]">
                <div className="h-[1px] bg-[#F0F2F5]" />
              </div>
              <div className="px-[20px] pb-[12px]">
                <div className="h-[1px] bg-[#DDE3EC] mb-[12px]" />
                <div className="flex items-center gap-[6px]">
                  <button className="flex items-center justify-center gap-[6px] h-[34px] px-[14px] rounded-[500px] bg-[#F6F7F9] text-[#4E6987] hover:bg-[#ebedf0] transition-colors cursor-pointer flex-1">
                    <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>Descartar</span>
                  </button>
                  <button className="flex items-center justify-center gap-[6px] h-[34px] px-[14px] rounded-[500px] bg-[#3CCEA7] text-white hover:bg-[#30B893] transition-colors cursor-pointer flex-1">
                    <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>Salvar</span>
                  </button>
                </div>
              </div>
            </div>
            <span className="text-[#98989d] font-mono block" style={{ fontSize: 10 }}>
              w-[320px] · rounded-[15px] · Header: ActionPill no topo direito, label 9px, título 18px/700
            </span>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  11. FLOATING SELECTION BAR                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Floating Selection Bar</SectionTitle>
          <SectionSubtitle>Barra flutuante que aparece ao selecionar itens na tabela.</SectionSubtitle>

          <div className="relative h-[80px] flex items-center justify-center">
            <div
              className="flex items-center gap-[12px] h-[48px] px-[20px] rounded-[500px] bg-[#28415c] text-white"
              style={{ boxShadow: "0px 4px 16px 0px rgba(18,34,50,0.35)" }}
            >
              <span className="font-bold" style={{ fontSize: 13, ...fontFeature }}>
                3 selecionados
              </span>
              <div className="w-[1px] h-[20px] bg-white/20" />
              <button className="flex items-center gap-[6px] h-[32px] px-[12px] rounded-[500px] bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                <Trash size={14} weight="bold" />
                <span className="font-bold uppercase tracking-[0.5px]" style={{ fontSize: 10, ...fontFeature }}>Excluir</span>
              </button>
            </div>
          </div>
          <span className="text-[#98989d] font-mono block mt-[8px]" style={{ fontSize: 10 }}>
            fixed bottom-6 · bg-[#28415c] · rounded-[500px] · shadow: rgba(18,34,50,0.35)
          </span>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  12. PAGINAÇÃO                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Paginação</SectionTitle>
          <SectionSubtitle>Indicadores de página da tabela.</SectionSubtitle>

          <div className="flex items-center gap-[4px]">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors ${
                  page === 2
                    ? "bg-[#28415C] text-white"
                    : "text-[#28415C] hover:bg-[#F6F7F9]"
                }`}
                style={{ fontSize: 12, fontWeight: page === 2 ? 700 : 500, ...fontFeature }}
              >
                {page}
              </button>
            ))}
          </div>
          <span className="text-[#98989d] font-mono block mt-[8px]" style={{ fontSize: 10 }}>
            size w-[28px] h-[28px] rounded-full · Ativo: bg-[#28415C] text-white · Inativo: text-[#28415C]
          </span>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/*  13. REGRAS GERAIS                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>Regras Gerais</SectionTitle>
          <SectionSubtitle>Convenções que devem ser seguidas em todo componente novo.</SectionSubtitle>

          <div className="flex flex-col gap-[12px]">
            {[
              { title: "Font", desc: "DM Sans com fontFeatureSettings: 'ss01', 'ss04', 'ss05', 'ss07'" },
              { title: "Mono", desc: "DM Mono — para IDs, códigos, valores técnicos" },
              { title: "Border radius", desc: "Cards: rounded-[15px] · Botões/pills: rounded-[500px] · Inputs: rounded-[10px] · Dropdowns: rounded-[10px]" },
              { title: "Alturas padrão", desc: "Botão primário: h-[34px] · Segmented: h-[44px] container, h-[36px] item · Input modal: h-[38px] · Badge: h-[24px] ou h-[28px]" },
              { title: "Ícones Phosphor", desc: "Sidebar/integrações: weight=\"duotone\" · ActionPill/botões: weight=\"bold\" · Status pills: weight=\"fill\" · Ativo: weight=\"fill\"" },
              { title: "Cores de texto", desc: "Títulos: #122232 ou #28415c · Corpo: #4E6987 · Muted: #98989d · Placeholder: #C8CFDB · Links: #07ABDE" },
              { title: "Acentuação", desc: "Sempre em português correto — Concluído, Não, Ligação, Descrição, Próximo" },
              { title: "Labels", desc: "Sempre UPPERCASE com letterSpacing 0.3–0.5px · fontSize 8–11px dependendo do contexto" },
              { title: "Transições", desc: "transition-colors em todos os elementos interativos · transition-all para mudanças de layout" },
              { title: "Cursor", desc: "cursor-pointer em todos os botões e links · disabled:opacity-50 disabled:cursor-not-allowed" },
              { title: "Dividers", desc: "bg-[#F0F2F5] para separadores leves internos · bg-[#DDE3EC] para separadores de seção fortes" },
              { title: "Botão sem ícone", desc: "Salvar, Descartar, Cancelar — texto only. Ícone apenas em: loading (Spinner), ação específica (Plus, Trash)" },
            ].map((rule) => (
              <div key={rule.title} className="flex items-start gap-[12px]">
                <div className="flex items-center justify-center h-[22px] px-[8px] rounded-[500px] bg-[#F6F7F9] shrink-0">
                  <span className="text-[#0483AB] font-bold uppercase" style={{ fontSize: 9, letterSpacing: 0.3, ...fontFeature }}>
                    {rule.title}
                  </span>
                </div>
                <span className="text-[#4E6987]" style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, lineHeight: "18px", ...fontFeature }}>
                  {rule.desc}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
