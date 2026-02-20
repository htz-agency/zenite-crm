import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./sidebar";
import { MagnifyingGlass, Bell, Gear, List, Command } from "@phosphor-icons/react";
import { useState, Suspense } from "react";
import { Toaster } from "sonner";
import { SearchProvider, useSearch } from "./search-context";

function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { query, setQuery } = useSearch();
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <header className="flex items-center justify-between h-[56px] pr-4 md:pr-6 bg-[#f6f7f9]">
      <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-[400px]">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors lg:hidden shrink-0"
        >
          <List size={20} className="text-[#4E6987]" />
        </button>
        {/* Search Bar — Figma style — hidden on dashboard */}
        {!isDashboard && (
          <div className="relative hidden sm:flex items-center justify-between w-full h-[40px] px-[10px] bg-[#DDE3EC] rounded-full">
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
            <button className="flex items-center justify-center shrink-0 size-[28px] rounded-full hover:bg-[#c8cfdb]/30 transition-colors">
              <Command size={16} weight="bold" className="text-[#4E6987]" />
            </button>
            {/* Inner shadow overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{ boxShadow: "inset 0px -0.5px 1px 0px rgba(255,255,255,0.3), inset 0px -0.5px 1px 0px rgba(255,255,255,0.25), inset 0px 1.5px 4px 0px rgba(0,0,0,0.08), inset 0px 1.5px 4px 0px rgba(0,0,0,0.1)" }}
            />
          </div>
        )}
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

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
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
        <main className="flex-1 overflow-y-auto p-[20px] bg-[#ffffff] rounded-t-[16px] rounded-b-[0px]">
          <Suspense fallback={<div className="flex items-center justify-center h-32 text-[#98989d]">Carregando...</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
    </SearchProvider>
  );
}