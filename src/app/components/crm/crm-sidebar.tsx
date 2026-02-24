import { NavLink, useLocation, useNavigate } from "react-router";
import {
  House,
  Funnel,
  ChartBar,
  Gear,
  AddressBook,
  FunnelSimple,
  CaretDown,
  CaretUp,
  X,
  Plus,
  DotsNine,
  DotsThree,
  SelectionPlus,
  Sidebar as SidebarIcon,
  Invoice,
  UsersThree,
  Megaphone,
  ArrowsClockwise,
  TreeStructure,
  Briefcase,
  Lightning,
  Building,
  GitBranch,
  ChartLineUp,
  SlidersHorizontal,
  Heart,
  SketchLogo,
  Bell,
  ShieldCheck,
  ListDashes,
  Textbox,
  Function as FnIcon,
  Network,
  UserCircle,
  Shapes,
  IdentificationCard,
  SignOut,
  Table,
  Strategy,
} from "@phosphor-icons/react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PillButton } from "../pill-button";
import { useAuth } from "../auth-context";
import { useCreateLead } from "./create-lead-context";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RailItem {
  id: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  label: string;
  directTo?: string;
  sections?: PanelSection[];
  actionButton?: { to: string; label: string };
}

interface PanelSection {
  title?: string;
  items: PanelItem[];
}

interface PanelItem {
  to: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  CRM Navigation definition                                         */
/* ------------------------------------------------------------------ */

const crmRailItems: RailItem[] = [
  {
    id: "inicio",
    icon: <House size={20} weight="duotone" />,
    activeIcon: <House size={20} weight="fill" />,
    label: "Início",
    directTo: "/crm",
  },
  {
    id: "pipes",
    icon: <Funnel size={20} weight="duotone" />,
    activeIcon: <Funnel size={20} weight="fill" />,
    label: "Pipes",
    actionButton: { to: "/crm/novo-lead", label: "Novo Lead" },
    sections: [
      {
        title: "Fixados",
        items: [
          { to: "/crm/pipeline", icon: <Heart size={18} weight="duotone" />, activeIcon: <Heart size={18} weight="fill" />, label: "Meus Leads" },
        ],
      },
      {
        title: "Pipelines",
        items: [
          { to: "/crm/leads", icon: <Heart size={18} weight="duotone" />, activeIcon: <Heart size={18} weight="fill" />, label: "Leads" },
          { to: "/crm/oportunidades", icon: <SketchLogo size={18} weight="duotone" />, activeIcon: <SketchLogo size={18} weight="fill" />, label: "Oportunidades" },
          { to: "/crm/contatos", icon: <IdentificationCard size={18} weight="duotone" />, activeIcon: <IdentificationCard size={18} weight="fill" />, label: "Contatos" },
          { to: "/crm/contas", icon: <Building size={18} weight="duotone" />, activeIcon: <Building size={18} weight="fill" />, label: "Contas" },
        ],
      },
      {
        title: "Ações",
        items: [
          { to: "/crm/fluxos", icon: <GitBranch size={18} weight="duotone" />, activeIcon: <GitBranch size={18} weight="fill" />, label: "Fluxos" },
          { to: "/crm/relatorios", icon: <ChartLineUp size={18} weight="duotone" />, activeIcon: <ChartLineUp size={18} weight="fill" />, label: "Relatórios" },
          { to: "/crm/campanhas", icon: <Megaphone size={18} weight="duotone" />, activeIcon: <Megaphone size={18} weight="fill" />, label: "Campanhas" },
          { to: "/crm/config-pipes", icon: <SlidersHorizontal size={18} weight="duotone" />, activeIcon: <SlidersHorizontal size={18} weight="fill" />, label: "Configurar Pipes" },
        ],
      },
    ],
  },
  {
    id: "dash",
    icon: <ChartBar size={20} weight="duotone" />,
    activeIcon: <ChartBar size={20} weight="fill" />,
    label: "Dash",
    directTo: "/crm/dash",
  },
  {
    id: "ajustes",
    icon: <Gear size={20} weight="duotone" />,
    activeIcon: <Gear size={20} weight="fill" />,
    label: "Ajustes",
    sections: [
      {
        title: "Suas Preferências",
        items: [
          { to: "/crm/ajustes/geral", icon: <SlidersHorizontal size={18} weight="duotone" />, activeIcon: <SlidersHorizontal size={18} weight="fill" />, label: "Geral" },
          { to: "/crm/ajustes/notificacoes", icon: <Bell size={18} weight="duotone" />, activeIcon: <Bell size={18} weight="fill" />, label: "Notificações" },
        ],
      },
      {
        title: "Gerenciar Conta",
        items: [
          { to: "/crm/ajustes/padroes", icon: <Gear size={18} weight="duotone" />, activeIcon: <Gear size={18} weight="fill" />, label: "Padrões da conta" },
          { to: "/crm/ajustes/usuarios", icon: <UserCircle size={18} weight="duotone" />, activeIcon: <UserCircle size={18} weight="fill" />, label: "Usuários" },
          { to: "/crm/ajustes/equipes", icon: <UsersThree size={18} weight="duotone" />, activeIcon: <UsersThree size={18} weight="fill" />, label: "Equipes" },
          { to: "/crm/ajustes/hierarquia", icon: <Network size={18} weight="duotone" />, activeIcon: <Network size={18} weight="fill" />, label: "Hierarquia" },
          { to: "/crm/ajustes/seguranca", icon: <ShieldCheck size={18} weight="duotone" />, activeIcon: <ShieldCheck size={18} weight="fill" />, label: "Segurança" },
        ],
      },
      {
        title: "Campos",
        items: [
          { to: "/crm/ajustes/campos", icon: <Textbox size={18} weight="duotone" />, activeIcon: <Textbox size={18} weight="fill" />, label: "Todos Campos" },
          { to: "/crm/ajustes/calculados", icon: <FnIcon size={18} weight="duotone" />, activeIcon: <FnIcon size={18} weight="fill" />, label: "Calculados" },
          { to: "/crm/ajustes/logica-condicional", icon: <Strategy size={18} weight="duotone" />, activeIcon: <Strategy size={18} weight="fill" />, label: "Lógica Condicional" },
        ],
      },
      {
        title: "Objetos",
        items: [
          { to: "/crm/ajustes/obj-leads", icon: <Heart size={18} weight="duotone" />, activeIcon: <Heart size={18} weight="fill" />, label: "Leads" },
          { to: "/crm/ajustes/obj-oportunidades", icon: <SketchLogo size={18} weight="duotone" />, activeIcon: <SketchLogo size={18} weight="fill" />, label: "Oportunidades" },
          { to: "/crm/ajustes/obj-contatos", icon: <IdentificationCard size={18} weight="duotone" />, activeIcon: <IdentificationCard size={18} weight="fill" />, label: "Contatos" },
          { to: "/crm/ajustes/obj-contas", icon: <Building size={18} weight="duotone" />, activeIcon: <Building size={18} weight="fill" />, label: "Contas" },
        ],
      },
      {
        title: "Integrações",
        items: [
          { to: "/crm/ajustes/sheets", icon: <Table size={18} weight="duotone" />, activeIcon: <Table size={18} weight="fill" />, label: "Google Sheets" },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Zenite App Modules (shared with Price)                             */
/* ------------------------------------------------------------------ */

interface ZeniteModule {
  id: string;
  name: string;
  abbr: string;
  icon: React.ComponentType<{ size?: number; weight?: string; style?: React.CSSProperties }>;
  bg: string;
  color: string;
  route?: string;
}

const zeniteModules: ZeniteModule[] = [
  { id: "prc", name: "Price", abbr: "PRC", icon: Invoice, bg: "#DCF0FF", color: "#07ABDE", route: "/price" },
  { id: "crm", name: "CRM", abbr: "CRM", icon: UsersThree, bg: "#DCF0FF", color: "#0483AB", route: "/crm" },
  { id: "mkt", name: "Marketing", abbr: "MKT", icon: Megaphone, bg: "#FEEDCA", color: "#917822" },
  { id: "syc", name: "Sync", abbr: "SYC", icon: ArrowsClockwise, bg: "#D9F8EF", color: "#3CCEA7" },
  { id: "dsh", name: "Dashboard", abbr: "DSH", icon: ChartBar, bg: "#EBF1FA", color: "#4E6987" },
  { id: "flw", name: "Flow", abbr: "FLW", icon: TreeStructure, bg: "#FFEDEB", color: "#ED5200" },
  { id: "pjt", name: "Projects", abbr: "PJT", icon: Briefcase, bg: "#E8E8FD", color: "#6868B1" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getFirstRoute(item: RailItem): string | null {
  if (item.directTo) return item.directTo;
  if (item.sections) {
    for (const section of item.sections) {
      if (section.items.length > 0) return section.items[0].to;
    }
  }
  return null;
}

function railOwnsPath(item: RailItem, pathname: string): boolean {
  if (item.directTo !== undefined) {
    return item.directTo === "/crm" ? pathname === "/crm" : pathname.startsWith(item.directTo);
  }
  if (item.actionButton) {
    const ab = item.actionButton.to;
    if (pathname === ab || pathname.startsWith(ab + "/")) return true;
  }
  if (item.sections) {
    return item.sections.some((s) =>
      s.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/"))
    );
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Dynamic action button for Pipes rail based on active pipeline      */
/* ------------------------------------------------------------------ */

const PIPE_ACTION_MAP: { prefix: string; label: string; to: string }[] = [
  { prefix: "/crm/oportunidades", label: "Nova Oportunidade", to: "/crm/nova-oportunidade" },
  { prefix: "/crm/contatos",      label: "Novo Contato",      to: "/crm/novo-contato" },
  { prefix: "/crm/contas",        label: "Nova Conta",        to: "/crm/nova-conta" },
  { prefix: "/crm/leads",         label: "Novo Lead",         to: "/crm/novo-lead" },
];

const DEFAULT_PIPE_ACTION = { label: "Novo Lead", to: "/crm/novo-lead" };

function getPipeActionButton(pathname: string): { label: string; to: string } {
  for (const entry of PIPE_ACTION_MAP) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + "/")) {
      return { label: entry.label, to: entry.to };
    }
  }
  return DEFAULT_PIPE_ACTION;
}

/* ------------------------------------------------------------------ */
/*  Logo Zenite CRM                                                    */
/* ------------------------------------------------------------------ */

function LogoZeniteCrm() {
  return (
    <div className="flex flex-col gap-[1px]">
      <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5, color: "#28415C", lineHeight: "18px" }}>
        Zenite
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "#0483AB", textTransform: "uppercase", lineHeight: "14px" }}>
        CRM
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CRM Sidebar component                                              */
/* ------------------------------------------------------------------ */

interface CrmSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CrmSidebar({ isOpen, onClose }: CrmSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal: openCreateLeadModal } = useCreateLead();
  const panelRef = useRef<HTMLDivElement>(null);
  const appDrawerRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  const [showAppDrawer, setShowAppDrawer] = useState(false);

  const [expandedRail, setExpandedRail] = useState<string | null>(() => {
    for (const item of crmRailItems) {
      if (!item.directTo && railOwnsPath(item, location.pathname)) {
        return item.id;
      }
    }
    return null;
  });

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    for (const item of crmRailItems) {
      if (!item.directTo && railOwnsPath(item, location.pathname)) {
        setExpandedRail(item.id);
        return;
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (onClose) onClose();
    setShowAppDrawer(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showAppDrawer) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (appDrawerRef.current && !appDrawerRef.current.contains(e.target as Node)) {
        setShowAppDrawer(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAppDrawer(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAppDrawer]);

  const handleRailClick = (item: RailItem) => {
    if (item.directTo) {
      navigate(item.directTo);
      setExpandedRail(null);
    } else {
      setExpandedRail(item.id);
      if (!railOwnsPath(item, location.pathname)) {
        const firstRoute = getFirstRoute(item);
        if (firstRoute) navigate(firstRoute);
      }
    }
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandedItem = crmRailItems.find((r) => r.id === expandedRail);
  const showPanel = !!expandedItem?.sections;

  /* ---- Rail ---- */
  const rail = (
    <div className="flex flex-col items-center w-[72px] min-w-[72px] h-screen bg-[#EBF1FA] py-3 gap-1 z-20">
      {/* Sidebar toggle */}
      <button
        onClick={() => {
          if (location.pathname === "/crm") return;
          setExpandedRail(expandedRail ? null : (crmRailItems.find(r => r.sections) || crmRailItems[0]).id);
        }}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors mb-4 mt-1 shrink-0 ${
          location.pathname === "/crm"
            ? "text-[#98989d] cursor-default"
            : "text-[#4E6987] hover:bg-[#28415C]/10 hover:text-[#28415C] cursor-pointer"
        }`}
        disabled={location.pathname === "/crm"}
      >
        <SidebarIcon size={20} weight="duotone" />
      </button>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-4 flex-1">
        {crmRailItems.map((item) => {
          const ownsPath = railOwnsPath(item, location.pathname);
          const firstOwner = crmRailItems.find((ri) => railOwnsPath(ri, location.pathname));
          const isActive = ownsPath && firstOwner?.id === item.id;
          const isExpanded = expandedRail === item.id;
          const highlighted = isActive || isExpanded;

          return (
            <button
              key={item.id}
              onClick={() => handleRailClick(item)}
              className="flex flex-col items-center gap-0.5 transition-all group cursor-pointer"
            >
              {/* Icon pill */}
              <div
                className={`relative flex items-center justify-center h-[32px] rounded-full transition-all ${
                  highlighted
                    ? "w-[42px] bg-[#28415C] text-[#F6F7F9] backdrop-blur-[50px]"
                    : "w-[32px] text-[#4E6987] group-hover:w-[42px] group-hover:bg-[#28415C]/10 group-hover:text-[#28415C]"
                }`}
                style={
                  highlighted
                    ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" }
                    : undefined
                }
              >
                <span className="flex items-center justify-center">
                  {highlighted ? item.activeIcon : item.icon}
                </span>
                {highlighted && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: "0.7px solid rgba(200,207,219,0.6)" }}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className={`transition-colors ${highlighted ? "text-[#28415C]" : "text-[#4E6987] group-hover:text-[#28415C]"}`}
                style={{
                  fontSize: 11,
                  fontWeight: highlighted ? 700 : 500,
                  letterSpacing: -0.5,
                  lineHeight: "22px",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Divider + Atalho */}
        <div className="flex flex-col items-center gap-4 pt-1">
          <svg width="23" height="2" viewBox="0 0 23 2" fill="none" className="shrink-0">
            <path d="M1 1H22" stroke="#98989D" strokeLinecap="round" strokeWidth="2" />
          </svg>

          <button
            onClick={() => navigate("/crm/atalho")}
            className="flex flex-col items-center gap-0.5 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-center h-[32px] w-[32px] rounded-full text-[#4E6987] group-hover:w-[42px] group-hover:bg-[#28415C]/10 group-hover:text-[#28415C] transition-all">
              <SelectionPlus size={20} weight="duotone" />
            </div>
            <span
              className="text-[#4E6987] group-hover:text-[#28415C] transition-colors"
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: -0.5,
                lineHeight: "22px",
              }}
            >
              Atalho
            </span>
          </button>
        </div>
      </div>

      {/* App Drawer bottom */}
      <div className="mt-auto pt-3">
        {/* User avatar with sign out */}
        {user && (
          <div className="flex flex-col items-center gap-2 mb-2">
            <button
              onClick={signOut}
              title="Sair"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-[#4E6987] hover:bg-[#FFEDEB] hover:text-[#f56233] cursor-pointer transition-all"
            >
              <SignOut size={18} weight="duotone" />
            </button>
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-[32px] h-[32px] rounded-full object-cover ring-2 ring-[#DDE3EC]"
              />
            ) : (
              <div
                className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#0483AB] text-white"
                style={{ fontSize: 12, fontWeight: 700 }}
                title={user.email ?? ""}
              >
                {(user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        <div className="relative" ref={appDrawerRef}>
          <div
            onClick={() => setShowAppDrawer(v => !v)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all ${
              showAppDrawer
                ? "bg-[#28415C] text-[#F6F7F9]"
                : "text-[#4E6987] hover:bg-[#28415C]/10 hover:text-[#28415C]"
            }`}
            style={showAppDrawer ? { boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)" } : undefined}
          >
            <DotsNine size={20} weight={showAppDrawer ? "fill" : "duotone"} />
            {showAppDrawer && (
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ border: "0.7px solid rgba(200,207,219,0.6)" }}
              />
            )}
          </div>

          <AnimatePresence>
            {showAppDrawer && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute bottom-0 left-[calc(100%+12px)] w-[264px] bg-white rounded-[16px] p-4 z-50"
                style={{
                  boxShadow: "0px 12px 32px rgba(18,34,50,0.12), 0px 2px 8px rgba(18,34,50,0.06)",
                  border: "0.7px solid rgba(200,207,219,0.4)",
                }}
              >
                <p
                  className="text-[#98989d] px-1 mb-3"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: "20px" }}
                >
                  Aplicativos
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {zeniteModules.map(app => {
                    const Icon = app.icon;
                    const isActive = app.id === "crm";
                    return (
                      <motion.button
                        key={app.id}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-[12px] cursor-pointer transition-colors ${
                          isActive
                            ? "bg-[#F6F7F9] hover:bg-[#DDE3EC]"
                            : "hover:bg-[#F6F7F9]"
                        }`}
                        onClick={() => {
                          if (app.route) {
                            navigate(app.route);
                            setShowAppDrawer(false);
                          }
                        }}
                      >
                        <div
                          className="flex items-center justify-center w-[40px] h-[40px] rounded-[10px]"
                          style={{ backgroundColor: app.bg }}
                        >
                          <Icon size={22} weight="duotone" style={{ color: app.color }} />
                        </div>
                        <div className="flex flex-col items-center">
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.3, lineHeight: "14px", color: "#122232" }}>
                            {app.abbr}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: -0.2, lineHeight: "13px", color: "#98989d" }}>
                            {app.name}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-[4px] h-[4px] rounded-full bg-[#0483AB] -mt-0.5" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  /* ---- Expanded panel ---- */
  const panel = showPanel && expandedItem ? (
    <div
      ref={panelRef}
      className="flex flex-col w-[224px] min-w-[224px] h-screen bg-[#F6F7F9] z-10"
    >
      {/* Panel header with logo */}
      <div className="px-5 py-5">
        <LogoZeniteCrm />
      </div>

      {/* Action button */}
      {expandedItem.actionButton && (() => {
        const dynAction = expandedItem.id === "pipes"
          ? getPipeActionButton(location.pathname)
          : expandedItem.actionButton!;
        return (
          <div className="px-4 pt-4 pb-1">
            <PillButton
              onClick={() => {
                if (dynAction.to === "/crm/novo-lead") {
                  openCreateLeadModal();
                } else {
                  navigate(dynAction.to);
                }
              }}
              icon={<Plus size={16} weight="bold" />}
            >
              {dynAction.label}
            </PillButton>
          </div>
        );
      })()}

      {/* Panel sections */}
      <div className="flex-1 overflow-y-auto py-3">
        {expandedItem.sections!.map((section, si) => {
          const sectionKey = `${expandedItem.id}-${si}`;
          const isCollapsed = collapsedSections.has(sectionKey);

          return (
            <div key={sectionKey} className="mb-2">
              {section.title && (
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="flex items-center justify-between w-full px-5 py-2 text-[#122232] hover:bg-[#F6F7F9] transition-colors"
                >
                  <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: -0.5 }}>{section.title}</span>
                  {isCollapsed ? <CaretDown size={14} className="text-[#4E6987]" /> : <CaretUp size={14} className="text-[#4E6987]" />}
                </button>
              )}
              {!isCollapsed && (
                <div className="flex flex-col gap-[2px] mt-0.5 px-3">
                  {section.items.map((subItem) => (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      end={subItem.to === "/"}
                      className={({ isActive }) =>
                        `group/item relative flex items-center gap-[10px] pl-[6px] py-[6px] transition-all cursor-pointer ${
                          isActive
                            ? "rounded-[100px] bg-[#28415c] backdrop-blur-[50px] pr-[22px]"
                            : "rounded-[8px] hover:rounded-[100px] hover:bg-[#dde3ec] pr-[22px]"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 rounded-[100px] pointer-events-none"
                              style={{
                                border: "0.7px solid rgba(200,207,219,0.6)",
                                boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                              }}
                            />
                          )}
                          <span className={`flex items-center justify-center size-[28px] rounded-[6px] shrink-0 ${
                            isActive ? "text-[#f6f7f9]" : "text-[#4e6987]"
                          }`}>
                            {isActive ? subItem.activeIcon : subItem.icon}
                          </span>
                          <span
                            className={`flex-1 ${isActive ? "text-[#f6f7f9]" : "text-[#4e6987]"}`}
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              letterSpacing: -0.5,
                              lineHeight: "22px",
                            }}
                          >
                            {subItem.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  /* ---- Desktop / Mobile rendering ---- */
  const sidebarContent = (
    <div className="flex h-screen">
      {rail}
      {panel}
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex">
        {sidebarContent}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-10 h-full flex">
            {sidebarContent}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 text-[#4E6987] hover:text-[#122232] shadow-md z-20"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}