import { Outlet, useLocation, useNavigate } from "react-router";
import { Sidebar } from "./sidebar";
import { MagnifyingGlass, Bell, List, Funnel, ArrowSquareUpLeft, X, FileText } from "@phosphor-icons/react";
import { useState, useEffect, useRef, Suspense } from "react";
import { Toaster } from "sonner";
import { SearchProvider, useSearch } from "./search-context";
import { FilterPanel } from "./filter-panel";
import { motion, AnimatePresence } from "motion/react";
import { MultitaskProvider, useMultitask } from "./multitask-context";

function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { query, setQuery, filterOpen, setFilterOpen, activeFilterCount, filters } = useSearch();
  const location = useLocation();
  const navigate = useNavigate();
  const prevPathRef = useRef(location.pathname);
  const isOnResults = location.pathname === "/price/resultados";
  const isDashboard = location.pathname === "/price";

  // Track the path the user was on before searching
  useEffect(() => {
    if (location.pathname !== "/price/resultados") {
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Navigate to /price/resultados when typing in search bar (debounced)
  useEffect(() => {
    if (!query) return;
    if (isOnResults) return;
    const timer = setTimeout(() => {
      navigate("/price/resultados");
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isOnResults, navigate]);

  return (
    <header className="flex items-center justify-between h-[56px] pr-4 md:pr-6 bg-[#f6f7f9]">
      <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-[400px]">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors lg:hidden shrink-0"
        >
          <List size={20} className="text-[#4E6987]" />
        </button>
        {/* Search Bar — hidden on dashboard */}
        <div className={`relative items-center justify-between w-full h-[40px] px-[10px] bg-[#DDE3EC] rounded-full ${isDashboard ? "hidden" : "hidden sm:flex"}`}>
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center shrink-0 size-[28px]">
              <MagnifyingGlass size={16} weight="bold" className="text-[#4E6987]" />
            </div>
            <input
              type="text"
              placeholder="Pesquisa"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-body text-[#122232] placeholder-[#4E6987] w-full"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`relative flex items-center justify-center shrink-0 size-[28px] rounded-full transition-all duration-150 hover:scale-110 active:scale-95 group ${
              filterOpen || activeFilterCount > 0
                ? "bg-[#07ABDE]"
                : "hover:bg-[#DCF0FF] active:bg-[#07ABDE]"
            }`}
          >
            <Funnel
              size={16}
              weight={filterOpen || activeFilterCount > 0 ? "fill" : "bold"}
              className={`transition-colors duration-150 ${
                filterOpen || activeFilterCount > 0
                  ? "text-white"
                  : "text-[#4E6987] group-hover:text-[#07ABDE] group-active:text-[#f6f7f9]"
              }`}
            />
          </button>
          {/* Inner shadow overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
          />
          {/* Filter Panel */}
          <FilterPanel />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="relative p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors">
          <Bell size={20} className="text-[#4E6987]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ED5200] rounded-full" />
        </button>
        
        <div className="w-8 h-8 rounded-full bg-[#0483AB] flex items-center justify-center text-white" style={{ fontSize: 12, fontWeight: 700 }}>
          HZ
        </div>
      </div>
    </header>
  );
}

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ------------------------------------------------------------------ */
/*  Minimized Taskbar                                                  */
/* ------------------------------------------------------------------ */

function MinimizedTaskbar() {
  const { minimized, restore, close } = useMultitask();
  const navigate = useNavigate();

  if (minimized.length === 0) return null;

  return (
    <div className="shrink-0 flex items-center justify-end gap-[6px] px-[12px] py-[6px] bg-[#f6f7f9]">
      <AnimatePresence mode="popLayout">
        {minimized.map((win) => (
          <motion.div
            key={win.id}
            layout
            initial={{ scale: 0.85, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.85, opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="relative flex items-center gap-[4px] h-[34px] pl-[4px] pr-[4px] rounded-[10px] bg-white cursor-pointer hover:bg-[#f6f7f9] transition-colors"
            style={{
              boxShadow: "0px 1px 3px 0px rgba(18,34,50,0.12), 0px 0px 0px 0.5px rgba(200,207,219,0.5)",
            }}
            onClick={() => {
              const w = restore(win.id);
              if (w) navigate(w.path);
            }}
          >
            {/* Restore button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const w = restore(win.id);
                if (w) navigate(w.path);
              }}
              className="flex items-center justify-center size-[26px] rounded-[6px] hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-white transition-colors"
              title="Maximizar"
            >
              <ArrowSquareUpLeft size={14} weight="bold" className="text-[#28415C]" />
            </button>

            {/* Title */}
            <span
              className="text-[#28415c] whitespace-nowrap max-w-[160px] truncate"
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.5, ...fontFeature }}
            >
              {win.title}
            </span>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                close(win.id);
              }}
              className="flex items-center justify-center size-[26px] rounded-[6px] hover:bg-[#DCF0FF] active:bg-[#07ABDE] [&:active>svg]:text-white transition-colors"
              title="Fechar"
            >
              <X size={12} weight="bold" className="text-[#28415C]" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <MultitaskProvider>
    <SearchProvider>
    <div className="flex h-screen overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          },
        }}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 flex flex-col items-stretch justify-start overflow-hidden rounded-[16px] pr-[10px] pb-[10px] pt-0 pl-0"
            >
              <Suspense fallback={<div className="flex items-center justify-center h-32 text-[#98989d]">Carregando...</div>}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <MinimizedTaskbar />
      </div>
    </div>
    </SearchProvider>
    </MultitaskProvider>
  );
}