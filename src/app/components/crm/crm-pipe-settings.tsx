/**
 * CrmPipeSettings - Page for configuring pipe settings.
 *
 * Renders as a full page inside the CRM layout Outlet.
 * Faithfully follows Figma designs (Lead-99-1403, 1607, 1843, 1910):
 *   - Left sidebar with 3 groups (Config sub-pages, Notificacoes, Detalhes)
 *   - Right content area changes per active tab
 *   - Pill-style nav items, ZeniteToggle toggles, radio selectors
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Heart,
  CaretDown,
  GearFine,
  Bell,
  Info,
  MagnifyingGlass,
  Plus,
  X,
  ArrowSquareDownRight,
  UsersThree,
  Buildings,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { ZeniteToggle } from "../zenite-toggle";
import { PillButton } from "../pill-button";
import imgAvatar from "figma:asset/d5fb6bc139a3da5bc43ab0601942a4cf33722fa1.png";

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

type SettingsPage =
  | "privacidade"
  | "participantes"
  | "regras"
  | "visualizacoes"
  | "notificacoes"
  | "detalhes";

type ConfigSubPage = "privacidade" | "participantes" | "regras" | "visualizacoes";

const CONFIG_TABS: { key: ConfigSubPage; label: string }[] = [
  { key: "privacidade", label: "Privacidade" },
  { key: "participantes", label: "Participantes" },
  { key: "regras", label: "Regras de Qualifica\u00e7\u00e3o" },
  { key: "visualizacoes", label: "Editar Visualiza\u00e7\u00f5es" },
];

type PermissionLevel = "todos" | "proprietario" | "pessoas";

interface PermissionRow {
  label: string;
  value: PermissionLevel;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
}

/* ------------------------------------------------------------------ */
/*  HorizontalDivider                                                  */
/* ------------------------------------------------------------------ */

function HorizontalDivider() {
  return (
    <div className="w-full h-0 shrink-0">
      <svg className="block w-full h-[1.5px]" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 1.5">
        <line stroke="#DDE3EC" strokeWidth="1.5" x2="1000" y1="0.75" y2="0.75" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Radio Selector                                                     */
/* ------------------------------------------------------------------ */

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
    <button
      onClick={onSelect}
      className="flex items-center gap-[10px] cursor-pointer group/radio"
    >
      <div
        className={`relative rounded-full size-[16px] shrink-0 backdrop-blur-[20px] ${
          selected ? "bg-[#3ccea7]" : ""
        }`}
      >
        {selected ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: "1.5px solid #28415c" }}
          />
        )}
      </div>
      <span
        className="text-[#4e6987] whitespace-nowrap"
        style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
      >
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Page: Privacidade                                                  */
/* ------------------------------------------------------------------ */

function PagePrivacidade() {
  const [pessoal, setPessoal] = useState(false);
  const [publico, setPublico] = useState(true);

  const [permissions, setPermissions] = useState<PermissionRow[]>([
    { label: "Modificar Configura\u00e7\u00f5es do Pipe", value: "pessoas" },
    { label: "Modificar Visualiza\u00e7\u00f5es", value: "pessoas" },
    { label: "Adicionar Visualiza\u00e7\u00f5es", value: "todos" },
    { label: "Exportar Pipe para Google Sheets", value: "todos" },
    { label: "Modificar est\u00e1gios do Pipe", value: "proprietario" },
    { label: "Adicionar Participantes", value: "proprietario" },
    { label: "Editar Regras de Qualifica\u00e7\u00e3o", value: "pessoas" },
    { label: "Excluir o Pipe", value: "pessoas" },
  ]);

  const updatePermission = useCallback((idx: number, val: PermissionLevel) => {
    setPermissions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], value: val };
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Acesso */}
      <div>
        <h2
          className="text-[#28415c] mb-[8px]"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          Acesso
        </h2>
        <p
          className="text-[#28415c] mb-[12px]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          Quem pode ver esse Pipe
        </p>
        <div className="flex items-center gap-[24px]">
          <div className="flex items-center gap-[8px]">
            <span
              className="text-[#4e6987]"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
            >
              Pessoal
            </span>
            <ZeniteToggle active={pessoal} onChange={() => { setPessoal(!pessoal); if (!pessoal) setPublico(false); }} />
          </div>
          <div className="flex items-center gap-[8px]">
            <span
              className="text-[#4e6987]"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
            >
              P{"\u00fa"}blico
            </span>
            <ZeniteToggle active={publico} onChange={() => { setPublico(!publico); if (!publico) setPessoal(false); }} />
          </div>
        </div>
      </div>

      {/* Permissoes */}
      <div>
        <h2
          className="text-[#28415c] mb-[8px]"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          Permiss{"\u00f5"}es
        </h2>
        <p
          className="text-[#28415c] mb-[16px]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          Quem pode
        </p>
        <div className="flex flex-col gap-[4px]">
          {permissions.map((perm, idx) => (
            <div key={idx}>
              <HorizontalDivider />
              <div className="flex items-center gap-[16px] py-[10px]">
                <span
                  className="text-[#4e6987] w-[220px] shrink-0"
                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                >
                  {perm.label}
                </span>
                <div className="flex items-center gap-[20px] flex-1 flex-wrap">
                  <RadioOption
                    label={"Todos da Organiza\u00e7\u00e3o"}
                    selected={perm.value === "todos"}
                    onSelect={() => updatePermission(idx, "todos")}
                  />
                  <RadioOption
                    label={"Somente o Propriet\u00e1rio do Pipe"}
                    selected={perm.value === "proprietario"}
                    onSelect={() => updatePermission(idx, "proprietario")}
                  />
                  <RadioOption
                    label={"Pessoas espec\u00edficas"}
                    selected={perm.value === "pessoas"}
                    onSelect={() => updatePermission(idx, "pessoas")}
                  />
                </div>
              </div>
            </div>
          ))}
          <HorizontalDivider />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page: Participantes                                                */
/* ------------------------------------------------------------------ */

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "1", name: "Nome Sobrenome", email: "email@email.com", role: "PROPRIET\u00c1RIO" },
  { id: "2", name: "Nome Sobrenome", email: "email@email.com", role: "GERENTE" },
  { id: "3", name: "Nome Sobrenome", email: "email@email.com", role: "VENDEDOR" },
  { id: "4", name: "Nome Sobrenome", email: "email@email.com", role: "VENDEDOR" },
  { id: "5", name: "Nome Sobrenome", email: "email@email.com", role: "VENDEDOR" },
  { id: "6", name: "Nome Sobrenome", email: "email@email.com", role: "ANALISTA DE DADOS" },
];

function PageParticipantes() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_PARTICIPANTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Title */}
      <div>
        <h2
          className="text-[#28415c]"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          Participantes
        </h2>
        <span
          className="text-[#4e6987] uppercase"
          style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
        >
          {filtered.length} PARTICIPANTES
        </span>
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-[12px]">
        <div
          className="relative flex items-center gap-[10px] h-[40px] px-[10px] rounded-[100px] bg-[#dde3ec] flex-1"
          style={{ border: "1px solid rgba(200,207,219,0.6)" }}
        >
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
          />
          <MagnifyingGlass size={16} weight="duotone" className="text-[#4e6987] shrink-0 relative z-[1]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisa Participantes"
            className="flex-1 bg-transparent outline-none text-[#4e6987] placeholder-[#4e6987] relative z-[1]"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          />
        </div>
        <PillButton icon={<Plus size={16} weight="bold" />}>
          Adicionar Participantes
        </PillButton>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-[16px] px-[4px]">
        <span className="text-[#28415c]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
          Nome
        </span>
        <span className="text-[#28415c]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
          Email
        </span>
        <span className="text-[#28415c]" style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}>
          Tipo de acesso
        </span>
      </div>

      {/* Table rows */}
      <div className="flex flex-col">
        {filtered.map((p) => (
          <div key={p.id}>
            <HorizontalDivider />
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-[16px] py-[10px] px-[4px] items-center">
              <div className="flex items-center gap-[6px]">
                <img src={imgAvatar} alt="" className="size-[16px] rounded-full object-cover shrink-0" />
                <span
                  className="text-[#4e6987]"
                  style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
                >
                  {p.name}
                </span>
              </div>
              <span
                className="text-[#4e6987]"
                style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
              >
                {p.email}
              </span>
              <span
                className="text-[#4e6987] uppercase"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
              >
                {p.role}
              </span>
            </div>
          </div>
        ))}
        <HorizontalDivider />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page: Regras de Qualificacao                                       */
/* ------------------------------------------------------------------ */

type ClientType = "pf" | "pj" | "gov";

interface IcpField {
  label: string;
  type: "text" | "radio";
  placeholder?: string;
  options?: { label: string; selected: boolean }[];
}

const ICP_FIELDS: Record<ClientType, IcpField[]> = {
  pj: [
    { label: "Decisor", type: "text", placeholder: "Descreva brevemente as caracter\u00edsticas dos decisores. Como cargos, idade, etc." },
    { label: "Setor da empresa", type: "text", placeholder: "Cite os setores da empresa, CNAE, etc" },
    { label: "Empresas Ideais", type: "text", placeholder: "Exemplifique citando empresas entre v\u00edrgulas" },
    { label: "Localiza\u00e7\u00e3o", type: "text", placeholder: "Cite pa\u00edses, estados e cidades que a empresa dever\u00e1 estar localizada" },
    { label: "Tempo de abertura", type: "radio", options: [
      { label: "Empresa nova", selected: true },
      { label: "Empresa jovem", selected: false },
      { label: "Empresa madura", selected: false },
    ]},
    { label: "Tamanho da empresa", type: "radio", options: [
      { label: "Pequena", selected: false },
      { label: "M\u00e9dia", selected: true },
      { label: "Grande", selected: false },
    ]},
    { label: "Atua\u00e7\u00e3o", type: "radio", options: [
      { label: "Nacional", selected: false },
      { label: "Internacional", selected: true },
    ]},
  ],
  pf: [
    { label: "Perfil do cliente", type: "text", placeholder: "Descreva as caracter\u00edsticas do seu cliente ideal. Idade, g\u00eanero, interesses, etc." },
    { label: "Profiss\u00e3o", type: "text", placeholder: "Cite as profiss\u00f5es mais comuns do seu p\u00fablico-alvo" },
    { label: "Localiza\u00e7\u00e3o", type: "text", placeholder: "Cite pa\u00edses, estados e cidades onde seu cliente dever\u00e1 estar localizado" },
    { label: "Canais de aquisi\u00e7\u00e3o", type: "text", placeholder: "Descreva os canais onde seu cliente \u00e9 encontrado. Redes sociais, indicação, etc." },
    { label: "Sexo", type: "radio", options: [
      { label: "Masculino", selected: false },
      { label: "Feminino", selected: false },
      { label: "Ambos", selected: true },
    ]},
    { label: "Faixa et\u00e1ria", type: "radio", options: [
      { label: "18\u201325", selected: false },
      { label: "26\u201335", selected: true },
      { label: "36\u201350", selected: false },
      { label: "50+", selected: false },
    ]},
    { label: "Faixa de renda", type: "radio", options: [
      { label: "Baixa", selected: false },
      { label: "M\u00e9dia", selected: true },
      { label: "Alta", selected: false },
    ]},
    { label: "Estilo de vida", type: "radio", options: [
      { label: "Conservador", selected: false },
      { label: "Moderado", selected: true },
      { label: "Inovador", selected: false },
    ]},
  ],
  gov: [
    { label: "\u00d3rg\u00e3o p\u00fablico", type: "text", placeholder: "Descreva os tipos de \u00f3rg\u00e3os p\u00fablicos ideais. Secretarias, autarquias, funda\u00e7\u00f5es, etc." },
    { label: "\u00c1rea de atua\u00e7\u00e3o", type: "text", placeholder: "Cite as \u00e1reas de atua\u00e7\u00e3o dos \u00f3rg\u00e3os. Sa\u00fade, educa\u00e7\u00e3o, infraestrutura, etc." },
    { label: "Localiza\u00e7\u00e3o", type: "text", placeholder: "Cite pa\u00edses, estados e cidades onde o \u00f3rg\u00e3o dever\u00e1 estar localizado" },
    { label: "Contato-chave", type: "text", placeholder: "Descreva os cargos dos contatos-chave. Secret\u00e1rio, diretor, coordenador, etc." },
    { label: "Esfera governamental", type: "radio", options: [
      { label: "Municipal", selected: false },
      { label: "Estadual", selected: true },
      { label: "Federal", selected: false },
    ]},
    { label: "Tipo de contrata\u00e7\u00e3o", type: "radio", options: [
      { label: "Licita\u00e7\u00e3o", selected: true },
      { label: "Dispensa", selected: false },
      { label: "Preg\u00e3o", selected: false },
    ]},
    { label: "Porte do \u00f3rg\u00e3o", type: "radio", options: [
      { label: "Pequeno", selected: false },
      { label: "M\u00e9dio", selected: true },
      { label: "Grande", selected: false },
    ]},
  ],
};

function buildInitialFieldStates(fields: IcpField[]): Record<number, number> {
  return Object.fromEntries(
    fields.map((f, i) => [i, f.options?.findIndex((o) => o.selected) ?? -1])
  );
}

function PageRegras() {
  const [clientTypes, setClientTypes] = useState<Record<ClientType, boolean>>({
    pf: false,
    pj: true,
    gov: false,
  });
  const [activeTab, setActiveTab] = useState<ClientType>("pj");

  const activeFields = ICP_FIELDS[activeTab];

  const [fieldStatesByType, setFieldStatesByType] = useState<Record<ClientType, Record<number, number>>>({
    pf: buildInitialFieldStates(ICP_FIELDS.pf),
    pj: buildInitialFieldStates(ICP_FIELDS.pj),
    gov: buildInitialFieldStates(ICP_FIELDS.gov),
  });

  const [textStatesByType, setTextStatesByType] = useState<Record<ClientType, Record<number, string>>>({
    pf: {},
    pj: {},
    gov: {},
  });

  const fieldStates = fieldStatesByType[activeTab];
  const textStates = textStatesByType[activeTab];

  const setFieldState = (idx: number, val: number) => {
    setFieldStatesByType((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [idx]: val },
    }));
  };

  const setTextState = (idx: number, val: string) => {
    setTextStatesByType((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [idx]: val },
    }));
  };

  const tabLabels: { key: ClientType; label: string }[] = [
    { key: "pf", label: "PESSOA F\u00cdSICA" },
    { key: "pj", label: "PESSOA JUR\u00cdDICA" },
    { key: "gov", label: "GOVERNAMENTAL" },
  ];

  const TabIcon = ({ type }: { type: ClientType }) => {
    if (type === "pf") return <UsersThree size={15} weight={activeTab === type ? "fill" : "duotone"} />;
    return <Buildings size={15} weight={activeTab === type ? "fill" : "duotone"} />;
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Title */}
      <div>
        <h2
          className="text-[#28415c] mb-[4px]"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {"Detalhe as caracter\u00edsticas do seu ICP (Perfil Ideal de Cliente)"}
        </h2>
      </div>

      {/* Client type toggles */}
      <div>
        <p
          className="text-[#28415c] mb-[8px]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {"Seu cliente \u00e9"}
        </p>
        <div className="flex items-center gap-[24px]">
          {(["pf", "pj", "gov"] as ClientType[]).map((ct) => (
            <div key={ct} className="flex items-center gap-[8px]">
              <span
                className="text-[#4e6987]"
                style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
              >
                {ct === "pf" ? "Pessoa F\u00edsica" : ct === "pj" ? "Pessoa Jur\u00eddica" : "Governamental"}
              </span>
              <ZeniteToggle
                active={clientTypes[ct]}
                onChange={() => setClientTypes((prev) => ({ ...prev, [ct]: !prev[ct] }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ICP Preferences subtitle */}
      <div>
        <h2
          className="text-[#28415c] mb-[12px]"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {"Use as guias para configurar as prefer\u00eancias do seu ICP"}
        </h2>

        {/* Segmented Control for client types */}
        <div
          className="inline-flex items-center h-[44px] rounded-[100px] bg-[#f6f7f9] p-[4px]"
          style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 1px 1.5px 4px 0px rgba(0,0,0,0.08), inset 1px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
        >
          {tabLabels.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-[3px] h-[36px] px-[16px] rounded-[20px] cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#28415c] text-[#f6f7f9] backdrop-blur-[50px]"
                    : "text-[#98989d] hover:text-[#4e6987]"
                }`}
                style={isActive ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" } : undefined}
              >
                {isActive && (
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{ border: "0.5px solid rgba(200,207,219,0.6)" }}
                  />
                )}
                <TabIcon type={tab.key} />
                <span
                  className="uppercase"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fields */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="flex flex-col"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          {activeFields.map((field, idx) => (
            <div key={idx}>
              <HorizontalDivider />
              <div className="flex items-center gap-[16px] py-[10px]">
                <span
                  className="text-[#4e6987] w-[220px] shrink-0"
                  style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                >
                  {field.label}
                </span>
                {field.type === "text" ? (
                  <div
                    className="relative flex items-center gap-[10px] h-[40px] px-[10px] rounded-[100px] bg-[#dde3ec] flex-1"
                    style={{ border: "1px solid rgba(200,207,219,0.6)" }}
                  >
                    <div className="absolute inset-0 pointer-events-none rounded-[inherit]"
                      style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
                    />
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      className="flex-1 bg-transparent outline-none text-[#4e6987] placeholder-[#4e6987] relative z-[1]"
                      style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.5, lineHeight: "17px", ...fontFeature }}
                      value={textStates[idx] || ""}
                      onChange={(e) => setTextState(idx, e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-[25px] h-[40px]">
                    {field.options?.map((opt, oi) => (
                      <RadioOption
                        key={oi}
                        label={opt.label}
                        selected={fieldStates[idx] === oi}
                        onSelect={() => setFieldState(idx, oi)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <HorizontalDivider />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page: Editar Visualizacoes (placeholder)                           */
/* ------------------------------------------------------------------ */

function PageVisualizacoes() {
  return (
    <div className="flex flex-col items-center justify-center py-[60px] gap-[12px]">
      <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#f6f7f9]">
        <GearFine size={24} weight="duotone" className="text-[#4e6987]" />
      </div>
      <span
        className="text-[#4e6987]"
        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {"Editar Visualiza\u00e7\u00f5es"}
      </span>
      <span
        className="inline-flex items-center h-[24px] px-[10px] rounded-[6px] bg-[#f6f7f9] text-[#98989d] uppercase"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
      >
        EM BREVE
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page: Notificacoes (placeholder)                                   */
/* ------------------------------------------------------------------ */

function PageNotificacoes() {
  return (
    <div className="flex flex-col items-center justify-center py-[60px] gap-[12px]">
      <div className="flex items-center justify-center size-[48px] rounded-[12px] bg-[#f6f7f9]">
        <Bell size={24} weight="duotone" className="text-[#4e6987]" />
      </div>
      <span
        className="text-[#4e6987]"
        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {"Notifica\u00e7\u00f5es"}
      </span>
      <span
        className="inline-flex items-center h-[24px] px-[10px] rounded-[6px] bg-[#f6f7f9] text-[#98989d] uppercase"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: "20px", ...fontFeature }}
      >
        EM BREVE
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page: Detalhes do Pipe                                             */
/* ------------------------------------------------------------------ */

function PageDetalhes() {
  return (
    <div className="flex flex-col gap-[32px]">
      {/* Nome + Icone side by side */}
      <div className="flex gap-[48px]">
        <div className="flex flex-col gap-[8px]">
          <h3
            className="text-[#28415c]"
            style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            Nome do Pipe
          </h3>
          <span
            className="text-[#28415c]"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            {"Prospec\u00e7\u00e3o"}
          </span>
        </div>
        <div className="flex flex-col gap-[8px]">
          <h3
            className="text-[#28415c]"
            style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            {"\u00cdcone do Pipe"}
          </h3>
          <div
            className="flex items-center justify-center size-[31px] rounded-[8px] bg-[#dde3ec]"
          >
            <span style={{ fontSize: 16 }}>{"\ud83d\udc9b"}</span>
          </div>
        </div>
      </div>

      {/* Proprietario */}
      <div className="flex flex-col gap-[8px]">
        <h3
          className="text-[#28415c]"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {"Propriet\u00e1rio"}
        </h3>
        <span
          className="text-[#28415c]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {"Prospec\u00e7\u00e3o"}
        </span>
      </div>

      {/* Objeto do Pipe */}
      <div className="flex flex-col gap-[8px]">
        <h3
          className="text-[#28415c]"
          style={{ fontSize: 20, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          Objeto do Pipe
        </h3>
        <span
          className="text-[#28415c]"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
        >
          {"Prospec\u00e7\u00e3o"}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Nav Item                                                   */
/* ------------------------------------------------------------------ */

function SidebarNavItem({
  label,
  icon,
  active,
  onClick,
  indent,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-[4px] h-[36px] py-[10px] rounded-br-[100px] rounded-tr-[100px] cursor-pointer transition-colors w-full ${
        indent ? "pl-[14px] pr-[28px]" : "pr-[28px]"
      } ${
        active
          ? indent
            ? "bg-[#dde3ec] text-[#28415c]"
            : "bg-[#28415c] text-[#f6f7f9] backdrop-blur-[50px]"
          : "text-[#4e6987] hover:bg-[#f6f7f9]"
      }`}
      style={
        !indent && active
          ? {
              boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
            }
          : undefined
      }
    >
      {!indent && active && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-br-[100px] rounded-tr-[100px] pointer-events-none"
          style={{ border: "0.7px solid rgba(200,207,219,0.6)" }}
        />
      )}
      {icon && (
        <span className="flex items-center justify-center w-[44px] shrink-0">
          {icon}
        </span>
      )}
      <span
        className="overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
      >
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CrmPipeSettings() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<SettingsPage>("regras");

  const isConfigPage = (page: SettingsPage): page is ConfigSubPage =>
    ["privacidade", "participantes", "regras", "visualizacoes"].includes(page);

  const renderContent = () => {
    switch (activePage) {
      case "privacidade":
        return <PagePrivacidade />;
      case "participantes":
        return <PageParticipantes />;
      case "regras":
        return <PageRegras />;
      case "visualizacoes":
        return <PageVisualizacoes />;
      case "notificacoes":
        return <PageNotificacoes />;
      case "detalhes":
        return <PageDetalhes />;
      default:
        return null;
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* White card container */}
      <div className="bg-white rounded-[16px] flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Compact top bar with back button + title */}
        <div className="flex items-center justify-between px-[20px] py-[10px] shrink-0">
          <div className="flex items-center gap-[8px]">
            <button
              onClick={handleClose}
              className="flex items-center justify-center size-[32px] rounded-full text-[#28415c] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
            >
              <CaretDown size={15} weight="bold" className="rotate-90" />
            </button>
            <div className="flex items-center gap-[6px]">
              <div className="flex items-center justify-center size-[24px] rounded-[6px] bg-[#feedca] shrink-0">
                <GearFine size={13} weight="duotone" className="text-[#eac23d]" />
              </div>
              <span
                className="text-[#28415c]"
                style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
              >
                {"Configura\u00e7\u00f5es do Pipe"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <HorizontalDivider />

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-[246px] shrink-0 flex flex-col gap-[8px] py-[16px] overflow-y-auto">
            {/* Configuracoes do Pipe - main group button */}
            <SidebarNavItem
              label={"Configura\u00e7\u00f5es do Pipe"}
              icon={<GearFine size={19} weight={isConfigPage(activePage) ? "fill" : "duotone"} />}
              active={isConfigPage(activePage)}
              onClick={() => { if (!isConfigPage(activePage)) setActivePage("privacidade"); }}
            />

            {/* Sub-items (only shown when a config page is active) */}
            {isConfigPage(activePage) && (
              <div className="relative ml-[48px]">
                {/* Vertical connector line */}
                <div className="absolute left-[-19px] top-0 bottom-0 w-0">
                  <svg className="block w-[1.5px] h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.5 1000">
                    <line stroke="#DDE3EC" strokeWidth="1.5" strokeLinecap="square" x1="0.75" x2="0.75" y2="1000" />
                  </svg>
                </div>
                <div className="flex flex-col gap-[2px]">
                  {CONFIG_TABS.map((tab) => (
                    <SidebarNavItem
                      key={tab.key}
                      label={tab.label}
                      active={activePage === tab.key}
                      onClick={() => setActivePage(tab.key)}
                      indent
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Separator space */}
            <div className="h-[4px]" />

            {/* Notificacoes */}
            <SidebarNavItem
              label={"Notifica\u00e7\u00f5es"}
              icon={<Bell size={19} weight={activePage === "notificacoes" ? "fill" : "duotone"} />}
              active={activePage === "notificacoes"}
              onClick={() => setActivePage("notificacoes")}
            />

            {/* Detalhes do Pipe */}
            <SidebarNavItem
              label="Detalhes do Pipe"
              icon={<Info size={19} weight={activePage === "detalhes" ? "fill" : "duotone"} />}
              active={activePage === "detalhes"}
              onClick={() => setActivePage("detalhes")}
            />
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-[24px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}