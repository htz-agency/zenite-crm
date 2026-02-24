import { NavLink, useLocation, useNavigate } from "react-router";
import {
  Layout,
  ClipboardText,
  Speedometer,
  RocketLaunch,
  CompassTool,
  FilePlus,
  Tag,
  CurrencyDollar,
  CaretDown,
  CaretUp,
  X,
  ListBullets,
  Plus,
  Package,
  DotsNine,
  DotsThree,
  Gear,
  SelectionPlus,
  Sidebar as SidebarIcon,
  UsersThree,
  Megaphone,
  ArrowsClockwise,
  ChartBar,
  TreeStructure,
  ProjectorScreenChart,
  CheckFat,
  Buildings,
  SignOut,
} from "@phosphor-icons/react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import LogoZenitePrice from "../../imports/LogoZenitePrice1";
import { PillButton } from "./pill-button";
import { useAuth } from "./auth-context";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RailItem {
  id: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  label: string;
  /** If set, clicking navigates directly instead of expanding panel */
  directTo?: string;
  /** Sub-sections shown in expanded panel */
  sections?: PanelSection[];
  /** Optional action button shown at top of panel */
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
/*  Navigation definition                                             */
/* ------------------------------------------------------------------ */

const railItems: RailItem[] = [
  {
    id: "home",
    icon: <Layout size={20} weight="duotone" />,
    activeIcon: <Layout size={20} weight="fill" />,
    label: "Dash",
    directTo: "/price",
  },
  {
    id: "gestao",
    icon: <ClipboardText size={20} weight="duotone" />,
    activeIcon: <ClipboardText size={20} weight="fill" />,
    label: "Propostas",
    actionButton: { to: "/price/nova-proposta", label: "Nova Proposta" },
    sections: [
      {
        title: "Propostas",
        items: [
          { to: "/price/propostas", icon: <ListBullets size={18} weight="duotone" />, activeIcon: <ListBullets size={18} weight="fill" />, label: "Todas Propostas" },
        ],
      },
      {
        title: "Preços",
        items: [
          { to: "/price/tabela-precos", icon: <Tag size={18} weight="duotone" />, activeIcon: <Tag size={18} weight="fill" />, label: "Lista de Preços" },
        ],
      },
    ],
  },
  {
    id: "servicos",
    icon: <Package size={20} weight="duotone" />,
    activeIcon: <Package size={20} weight="fill" />,
    label: "Serviços",
    actionButton: { to: "/price/novo-servico", label: "Adicionar Serviço" },
    sections: [
      {
        title: "Categorias",
        items: [
          { to: "/price/servicos/performance", icon: <Speedometer size={18} weight="duotone" />, activeIcon: <Speedometer size={18} weight="fill" />, label: "Performance" },
          { to: "/price/servicos/sales-ops", icon: <RocketLaunch size={18} weight="duotone" />, activeIcon: <RocketLaunch size={18} weight="fill" />, label: "Sales OPS" },
          { to: "/price/servicos/brand-co", icon: <CompassTool size={18} weight="duotone" />, activeIcon: <CompassTool size={18} weight="fill" />, label: "Brand & Co" },
        ],
      },
    ],
  },
  {
    id: "configuracoes",
    icon: <Gear size={20} weight="duotone" />,
    activeIcon: <Gear size={20} weight="fill" />,
    label: "Ajustes",
    directTo: "/price/ajustes",
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: get first navigable route from a rail item                */
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

/* ------------------------------------------------------------------ */
/*  Helper: check if a rail item "owns" the current path              */
/* ------------------------------------------------------------------ */

function railOwnsPath(item: RailItem, pathname: string): boolean {
  if (item.directTo !== undefined) {
    return item.directTo === "/price" ? pathname === "/price" : pathname.startsWith(item.directTo);
  }
  // Check action button route
  if (item.actionButton) {
    const ab = item.actionButton.to;
    if (pathname === ab || pathname.startsWith(ab + "/")) return true;
  }
  if (item.sections) {
    return item.sections.some((s) =>
      s.items.some((i) => {
        if (i.to === "/") return pathname === "/";
        return pathname === i.to || pathname.startsWith(i.to + "/");
      })
    );
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Zenite App Modules                                                 */
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
  { id: "prc", name: "Price", abbr: "PRC", icon: CurrencyDollar, bg: "#DCF0FF", color: "#07ABDE", route: "/price" },
  { id: "crm", name: "CRM", abbr: "CRM", icon: UsersThree, bg: "#DCF0FF", color: "#0483AB", route: "/crm" },
  { id: "mkt", name: "Marketing", abbr: "MKT", icon: Megaphone, bg: "#FEEDCA", color: "#917822" },
  { id: "syc", name: "Sync", abbr: "SYC", icon: ArrowsClockwise, bg: "#D9F8EF", color: "#3CCEA7" },
  { id: "dsh", name: "Dashboard", abbr: "DSH", icon: ChartBar, bg: "#EBF1FA", color: "#4E6987" },
  { id: "flw", name: "Flow", abbr: "FLW", icon: TreeStructure, bg: "#FFEDEB", color: "#ED5200" },
  { id: "pjt", name: "Projects", abbr: "PJT", icon: ProjectorScreenChart, bg: "#E8E8FD", color: "#6868B1" },
  { id: "tsk", name: "Tasks", abbr: "TSK", icon: CheckFat, bg: "#F0EBFF", color: "#8B5CF6" },
  { id: "htz", name: "HTZ", abbr: "HTZ", icon: Buildings, bg: "#DBEAFE", color: "#3B82F6" },
];

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const appDrawerRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // App drawer state
  const [showAppDrawer, setShowAppDrawer] = useState(false);

  // Which rail item is expanded (showing panel)
  const [expandedRail, setExpandedRail] = useState<string | null>(() => {
    // Auto-expand based on current path
    for (const item of railItems) {
      if (!item.directTo && railOwnsPath(item, location.pathname)) {
        return item.id;
      }
    }
    return null;
  });

  // Collapsed section groups within the panel
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Update expanded rail on route change
  useEffect(() => {
    for (const item of railItems) {
      if (!item.directTo && railOwnsPath(item, location.pathname)) {
        setExpandedRail(item.id);
        return;
      }
    }
  }, [location.pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onClose) onClose();
    setShowAppDrawer(false);
  }, [location.pathname]);

  // Close app drawer on click outside or Escape
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
      // Always expand panel
      setExpandedRail(item.id);
      // If not already on a page within this section, navigate to first sub-item
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

  const expandedItem = railItems.find((r) => r.id === expandedRail);
  const showPanel = !!expandedItem?.sections;

  /* ---- Rail ---- */
  const rail = (
    <div className="flex flex-col items-center w-[72px] min-w-[72px] h-screen bg-[#EBF1FA] py-3 gap-1 z-20">
      {/* Sidebar toggle */}
      <button
        onClick={() => {
          if (location.pathname === "/price") return;
          setExpandedRail(expandedRail ? null : (railItems.find(r => r.sections) || railItems[0]).id);
        }}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors mb-4 mt-1 shrink-0 ${
          location.pathname === "/price"
            ? "text-[#98989d] cursor-default"
            : "text-[#4E6987] hover:bg-[#28415C]/10 hover:text-[#28415C] cursor-pointer"
        }`}
        disabled={location.pathname === "/price"}
      >
        <SidebarIcon size={20} weight="duotone" />
      </button>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-4 flex-1">
        {railItems.map((item) => {
          const ownsPath = railOwnsPath(item, location.pathname);
          // Avoid multiple rail items highlighting for the same path (e.g. /nova-proposta):
          // only the first matching rail item gets the active state.
          const firstOwner = railItems.find((ri) => railOwnsPath(ri, location.pathname));
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
                    ? {
                        boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                      }
                    : undefined
                }
              >
                <span className="flex items-center justify-center">
                  {highlighted ? item.activeIcon : item.icon}
                </span>
                {highlighted && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      border: "0.7px solid rgba(200,207,219,0.6)",
                    }}
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
          {/* Divider */}
          <svg width="23" height="2" viewBox="0 0 23 2" fill="none" className="shrink-0">
            <path d="M1 1H22" stroke="#98989D" strokeLinecap="round" strokeWidth="2" />
          </svg>

          {/* Atalho button */}
          <button
            onClick={() => navigate("/price/atalho")}
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

      {/* Avatar bottom */}
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
                className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#07ABDE] text-white"
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
                    const isActive = app.route ? location.pathname.startsWith(app.route) : false;
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
                          <span
                            style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.3, lineHeight: "14px", color: "#122232" }}
                          >
                            {app.abbr}
                          </span>
                          <span
                            style={{ fontSize: 9, fontWeight: 500, letterSpacing: -0.2, lineHeight: "13px", color: "#98989d" }}
                          >
                            {app.name}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-[4px] h-[4px] rounded-full bg-[#07ABDE] -mt-0.5" />
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
        <div className="relative w-[75px] h-[37px]">
          <LogoZenitePrice />
        </div>
      </div>

      {/* Action button (e.g. Nova Proposta) */}
      {expandedItem.actionButton && (
        <div className="px-4 pt-4 pb-1">
          <PillButton
            onClick={() => navigate(expandedItem.actionButton!.to)}
            icon={<Plus size={16} weight="bold" />}
          >
            {expandedItem.actionButton.label}
          </PillButton>
        </div>
      )}

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
                          {/* Selected-state border + shadow overlay */}
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
                          {/* Icon container */}
                          <span className={`flex items-center justify-center size-[28px] rounded-[6px] shrink-0 ${
                            isActive ? "text-[#f6f7f9]" : "text-[#4e6987]"
                          }`}>
                            {isActive ? subItem.activeIcon : subItem.icon}
                          </span>
                          {/* Label */}
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
                          {/* Hover-only three dots */}
                          {!isActive && (
                            <span className="flex items-center justify-center size-[20px] shrink-0 text-[#4e6987] opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <DotsThree size={16} weight="bold" />
                            </span>
                          )}
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
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        {sidebarContent}
      </div>

      {/* Mobile: close button */}
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