import { useLocation } from "react-router";
import {
  Gear,
  SlidersHorizontal,
  Bell,
  UsersThree,
  ShieldCheck,
  ListDashes,
  Shapes,
  Heart,
  SketchLogo,
  IdentificationCard,
  Building,
} from "@phosphor-icons/react";

/* ================================================================== */
/*  Page config lookup                                                 */
/* ================================================================== */

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

interface PageConfig {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  iconBg: string;
  iconColor: string;
}

const PAGE_CONFIG: Record<string, PageConfig> = {
  geral: {
    title: "Geral",
    subtitle: "Preferências gerais do CRM — idioma, fuso horário e formato de dados.",
    icon: SlidersHorizontal,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  notificacoes: {
    title: "Notificações",
    subtitle: "Gerencie como e quando você recebe alertas do CRM.",
    icon: Bell,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  padroes: {
    title: "Padrões da conta",
    subtitle: "Valores padrão para novos registros, moeda e formato numérico.",
    icon: Gear,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  usuarios: {
    title: "Usuários e equipes",
    subtitle: "Gerencie membros, funções e permissões da equipe.",
    icon: UsersThree,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  seguranca: {
    title: "Segurança",
    subtitle: "Autenticação, sessões e políticas de acesso.",
    icon: ShieldCheck,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  "campos-nativos": {
    title: "Todos Campos",
    subtitle: "Gerencie todos os campos — visualize, configure visibilidade e grupos.",
    icon: ListDashes,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  "logica-condicional": {
    title: "Lógica Condicional",
    subtitle: "Regras de exibição e comportamento dinâmico de campos baseado em condições.",
    icon: Shapes,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  "obj-leads": {
    title: "Objeto: Leads",
    subtitle: "Configurações, campos e layouts do objeto Lead.",
    icon: Heart,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  "obj-oportunidades": {
    title: "Objeto: Oportunidades",
    subtitle: "Configurações, campos e layouts do objeto Oportunidade.",
    icon: SketchLogo,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  "obj-contatos": {
    title: "Objeto: Contatos",
    subtitle: "Configurações, campos e layouts do objeto Contato.",
    icon: IdentificationCard,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
  "obj-contas": {
    title: "Objeto: Contas",
    subtitle: "Configurações, campos e layouts do objeto Conta.",
    icon: Building,
    iconBg: "#DDE3EC",
    iconColor: "#4E6987",
  },
};

const FALLBACK: PageConfig = {
  title: "Ajustes do CRM",
  subtitle: "Configurações e campos personalizados.",
  icon: Gear,
  iconBg: "#DDE3EC",
  iconColor: "#4E6987",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function CrmSettingsPlaceholder() {
  const location = useLocation();

  // Derive which page we're on from the last path segment
  const segment = location.pathname.split("/").pop() ?? "";
  const config = PAGE_CONFIG[segment] ?? FALLBACK;
  const Icon = config.icon;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* ═══════ TOP HEADER ═══════ */}
      <div className="bg-white rounded-[16px] p-[20px] mb-[12px] shrink-0">
        <div className="flex items-center gap-[12px]">
          <div
            className="flex items-center justify-center size-[36px] rounded-[8px] shrink-0"
            style={{ backgroundColor: config.iconBg }}
          >
            <Icon size={20} weight="duotone" style={{ color: config.iconColor }} />
          </div>
          <div className="flex-1">
            <span
              className="text-[#28415c] block"
              style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: "24px", ...fontFeature }}
            >
              {config.title}
            </span>
            <span
              className="text-[#98989d] block"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
            >
              {config.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ PLACEHOLDER CONTENT ═══════ */}
      <div className="flex-1 bg-white rounded-[16px] overflow-auto min-w-0">
        <div className="flex flex-col items-center justify-center h-full gap-[16px] p-[40px]">
          <div
            className="flex items-center justify-center size-[64px] rounded-[16px]"
            style={{ backgroundColor: config.iconBg }}
          >
            <Icon size={32} weight="duotone" style={{ color: config.iconColor }} />
          </div>
          <span
            className="text-[#28415c] text-center"
            style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, lineHeight: "24px", ...fontFeature }}
          >
            {config.title}
          </span>
          <span
            className="text-[#98989d] text-center max-w-[400px]"
            style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.5, lineHeight: "22px", ...fontFeature }}
          >
            Esta página ainda está em construção. Em breve você poderá configurar {config.title.toLowerCase()} diretamente por aqui.
          </span>
          <div
            className="flex items-center gap-[8px] h-[32px] px-[14px] rounded-[8px] bg-[#f6f7f9]"
            style={{ border: "1px solid rgba(200,207,219,0.6)" }}
          >
            <div className="w-[6px] h-[6px] rounded-full bg-[#eac23d]" />
            <span
              className="text-[#98989d] uppercase"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...fontFeature }}
            >
              EM BREVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}