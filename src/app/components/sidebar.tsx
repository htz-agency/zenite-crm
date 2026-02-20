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
  Gear,
  SelectionPlus,
  Sidebar as SidebarIcon,
} from "@phosphor-icons/react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import LogoZenitePrice from "../../imports/LogoZenitePrice1";

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
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Navigation definition                                             */
/* ------------------------------------------------------------------ */

const railItems: RailItem[] = [
  {
    id: "home",
    icon: <Layout size={20} weight="regular" />,
    activeIcon: <Layout size={20} weight="fill" />,
    label: "Dash",
    directTo: "/",
  },
  {
    id: "gestao",
    icon: <ClipboardText size={20} weight="regular" />,
    activeIcon: <ClipboardText size={20} weight="fill" />,
    label: "Propostas",
    actionButton: { to: "/nova-proposta", label: "Nova Proposta" },
    sections: [
      {
        title: "Propostas",
        items: [
          { to: "/propostas", icon: <ListBullets size={18} weight="duotone" />, label: "Lista de Propostas" },
        ],
      },
      {
        title: "Preços",
        items: [
          { to: "/tabela-precos", icon: <Tag size={18} weight="duotone" />, label: "Tabela de Preços" },
        ],
      },
    ],
  },
  {
    id: "servicos",
    icon: <Package size={20} weight="regular" />,
    activeIcon: <Package size={20} weight="fill" />,
    label: "Serviços",
    actionButton: { to: "/novo-servico", label: "Adicionar Serviço" },
    sections: [
      {
        title: "Categorias",
        items: [
          { to: "/servicos/performance", icon: <Speedometer size={18} weight="duotone" />, label: "Performance" },
          { to: "/servicos/sales-ops", icon: <RocketLaunch size={18} weight="duotone" />, label: "Sales OPS" },
          { to: "/servicos/brand-co", icon: <CompassTool size={18} weight="duotone" />, label: "Brand & Co" },
        ],
      },
    ],
  },
  {
    id: "configuracoes",
    icon: <Gear size={20} weight="regular" />,
    activeIcon: <Gear size={20} weight="fill" />,
    label: "Ajustes",
    directTo: "/ajustes",
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
    return item.directTo === "/" ? pathname === "/" : pathname.startsWith(item.directTo);
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
  }, [location.pathname]);

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
          if (location.pathname === "/") return;
          setExpandedRail(expandedRail ? null : (railItems.find(r => r.sections) || railItems[0]).id);
        }}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors mb-4 mt-1 shrink-0 ${
          location.pathname === "/"
            ? "text-[#98989d] cursor-default"
            : "text-[#4E6987] hover:bg-[#28415C]/10 hover:text-[#28415C] cursor-pointer"
        }`}
        disabled={location.pathname === "/"}
      >
        <SidebarIcon size={20} weight="regular" />
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
            onClick={() => navigate("/atalho")}
            className="flex flex-col items-center gap-0.5 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-center h-[32px] w-[32px] rounded-full text-[#4E6987] group-hover:w-[42px] group-hover:bg-[#28415C]/10 group-hover:text-[#28415C] transition-all">
              <SelectionPlus size={20} weight="regular" />
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
        <div className="flex items-center justify-center w-10 h-10 rounded-xl text-[#4E6987] hover:bg-[#28415C]/10 hover:text-[#28415C] cursor-pointer transition-colors">
          <DotsNine size={20} weight="bold" />
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
          <button
            onClick={() => navigate(expandedItem.actionButton!.to)}
            className="flex items-center gap-[3px] h-[40px] pl-[16px] pr-[20px] rounded-full bg-[#DCF0FF] text-[#28415C] hover:bg-[#cce7fb] transition-colors cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span
              className="font-normal"
              style={{
                fontSize: 15,
                letterSpacing: -0.5,
                lineHeight: "22px",
              }}
            >
              {expandedItem.actionButton.label}
            </span>
          </button>
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
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {section.items.map((subItem) => (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      end={subItem.to === "/"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 mx-3 px-3 h-[32px] rounded-full transition-all ${
                          isActive
                            ? "bg-[#28415C] text-white"
                            : "text-[#4E6987] hover:bg-[#28415C]/10 hover:text-[#28415C]"
                        }`
                      }
                      style={({ isActive }) =>
                        isActive
                          ? {
                              boxShadow: "0px 2px 4px 0px rgba(18,34,50,0.3)",
                              border: "0.7px solid rgba(200,207,219,0.6)",
                            }
                          : undefined
                      }
                    >
                      <span className="flex items-center justify-center w-5 h-5 shrink-0">{subItem.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{subItem.label}</span>
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