import { Outlet, useLocation, useNavigate } from "react-router";
import { CrmSidebar } from "./crm-sidebar";
import {
  Bell,
  List,
  ArrowSquareUpLeft,
  X,
  Phone,
  CalendarBlank,
  CheckCircle,
  NoteBlank,
  ChatCircle,
  Envelope,
  Lightning,
  Checks,
  Trash,
  Clock,
  BellRinging,
  Swatches,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect, Suspense } from "react";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { MultitaskProvider, useMultitask } from "../multitask-context";
import { CrmSearchProvider } from "./crm-search-context";
import { CrmGlobalSearch } from "./crm-global-search";
import { CreateLeadProvider, useCreateLead } from "./create-lead-context";
import { CreateLeadModal } from "./create-lead-modal";
import { CreateActivityProvider, useCreateActivity } from "./create-activity-context";
import { CreateActivityModal } from "./create-activity-modal";
import { PermissionProvider } from "./permission-context";
import {
  NotificationProvider,
  useNotifications,
  TYPE_COLORS,
  type CrmNotification,
} from "./notification-context";

const fontFeature = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ------------------------------------------------------------------ */
/*  Activity type icon mapper                                          */
/* ------------------------------------------------------------------ */

const ACTIVITY_ICON: Record<string, React.ComponentType<any>> = {
  compromisso: CalendarBlank,
  tarefa: CheckCircle,
  ligacao: Phone,
  nota: NoteBlank,
  mensagem: ChatCircle,
  email: Envelope,
};

function ActivityTypeIcon({ type, size = 14 }: { type?: string; size?: number }) {
  const Icon = (type && ACTIVITY_ICON[type]) || Lightning;
  const color = (type && TYPE_COLORS[type]) || "#4E6987";
  return <Icon size={size} weight="fill" style={{ color }} />;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/* ------------------------------------------------------------------ */
/*  Notification Dropdown                                              */
/* ------------------------------------------------------------------ */

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-[calc(100%+6px)] w-[360px] max-h-[460px] bg-white rounded-[14px] z-50 flex flex-col overflow-hidden"
      style={{
        boxShadow:
          "0px 12px 32px rgba(18,34,50,0.14), 0px 2px 8px rgba(18,34,50,0.06)",
        border: "0.7px solid rgba(200,207,219,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#eef1f6]">
        <div className="flex items-center gap-[8px]">
          <BellRinging size={16} weight="fill" className="text-[#0483AB]" />
          <span
            className="text-[#122232]"
            style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, ...fontFeature }}
          >
            Notificacoes
          </span>
          {unreadCount > 0 && (
            <span
              className="flex items-center justify-center h-[18px] min-w-[18px] px-[5px] rounded-full bg-[#ED5200] text-white"
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-[4px]">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-[4px] px-[8px] py-[4px] rounded-[6px] text-[#0483AB] hover:bg-[#DCF0FF] transition-colors cursor-pointer"
              title="Marcar todas como lidas"
            >
              <Checks size={14} weight="bold" />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: -0.3 }}>
                Ler todas
              </span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-[#98989d] hover:bg-[#FFEDEB] hover:text-[#ED5200] transition-colors cursor-pointer"
              title="Limpar todas"
            >
              <Trash size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[40px] gap-[8px]">
            <Bell size={32} weight="duotone" className="text-[#dde3ec]" />
            <span
              className="text-[#98989d]"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...fontFeature }}
            >
              Nenhuma notificacao
            </span>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={() => markAsRead(n.id)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
}: {
  notification: CrmNotification;
  onRead: () => void;
}) {
  const iconBg =
    n.type === "reminder"
      ? "#FFF3D6"
      : n.type === "activity_assigned"
      ? "#DCF0FF"
      : "#F6F7F9";

  return (
    <button
      onClick={onRead}
      className={`flex items-start gap-[10px] w-full px-[16px] py-[10px] text-left transition-colors cursor-pointer ${
        n.read
          ? "bg-white hover:bg-[#f6f7f9]"
          : "bg-[#f0f7ff] hover:bg-[#e6f0fb]"
      }`}
      style={{ borderBottom: "0.5px solid #eef1f6" }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] shrink-0 mt-[2px]"
        style={{ backgroundColor: iconBg }}
      >
        {n.type === "reminder" ? (
          <Clock size={15} weight="fill" className="text-[#eac23d]" />
        ) : (
          <ActivityTypeIcon type={n.activityType} size={15} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span
          className="block text-[#122232] truncate"
          style={{
            fontSize: 12,
            fontWeight: n.read ? 500 : 700,
            letterSpacing: -0.3,
            ...fontFeature,
          }}
        >
          {n.title}
        </span>
        <span
          className="block text-[#4E6987] truncate"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: -0.3, lineHeight: "16px", ...fontFeature }}
        >
          {n.body}
        </span>
      </div>

      {/* Time + unread dot */}
      <div className="flex flex-col items-end gap-[4px] shrink-0 pt-[2px]">
        <span
          className="text-[#98989d]"
          style={{ fontSize: 10, fontWeight: 500, letterSpacing: -0.2, ...fontFeature }}
        >
          {timeAgo(n.timestamp)}
        </span>
        {!n.read && (
          <span className="w-[7px] h-[7px] rounded-full bg-[#0483AB]" />
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Top Bar                                                            */
/* ------------------------------------------------------------------ */

function CrmTopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === "/crm";
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const isOnDS = location.pathname === "/crm/design-system";

  return (
    <header className="flex items-center justify-between h-[56px] pr-4 md:pr-6 bg-[#f6f7f9]">
      <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-[400px]">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-[#F6F7F9] transition-colors lg:hidden shrink-0"
        >
          <List size={20} className="text-[#4E6987]" />
        </button>
        {/* Global Search Box — hidden on dashboard */}
        <div className={`w-full ${isDashboard ? "hidden" : "hidden sm:block"}`}>
          <CrmGlobalSearch />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              showNotifications ? "bg-[#DCF0FF]" : "hover:bg-[#F6F7F9]"
            }`}
          >
            {showNotifications ? (
              <BellRinging size={20} weight="fill" className="text-[#0483AB]" />
            ) : (
              <Bell size={20} className="text-[#4E6987]" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-[3px] rounded-full bg-[#ED5200] text-white" style={{ fontSize: 9, fontWeight: 700 }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </AnimatePresence>
        </div>
        {/* Design System shortcut */}
        <button
          onClick={() => navigate("/crm/design-system")}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isOnDS ? "bg-[#DCF0FF]" : "hover:bg-[#F6F7F9]"
          }`}
          title="Design System"
        >
          <Swatches size={20} weight={isOnDS ? "fill" : "regular"} className={isOnDS ? "text-[#0483AB]" : "text-[#4E6987]"} />
        </button>
        <div
          className="w-8 h-8 rounded-full bg-[#0483AB] flex items-center justify-center text-white"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          HZ
        </div>
      </div>
    </header>
  );
}

function MinimizedTaskbar() {
  const { minimized, restore, close, setDialerOpen } = useMultitask();
  const navigate = useNavigate();

  if (minimized.length === 0) return null;

  const handleRestore = (win: typeof minimized[number]) => {
    const w = restore(win.id);
    if (!w) return;
    if (w.type === "dialer") {
      setDialerOpen(true);
    } else {
      navigate(w.path);
    }
  };

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
            onClick={() => handleRestore(win)}
          >
            {/* Restore button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRestore(win);
              }}
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors"
              title="Maximizar"
            >
              <ArrowSquareUpLeft size={14} weight="bold" />
            </button>

            {/* Status dot or dialer icon */}
            {win.type === "dialer" ? (
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ backgroundColor: "#3CCEA7" }}
              />
            ) : win.statusColor ? (
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ backgroundColor: win.statusColor }}
              />
            ) : null}

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
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#0483AB] hover:bg-[#DCF0FF] hover:text-[#0483AB] transition-colors"
              title="Fechar"
            >
              <X size={12} weight="bold" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ConnectedCreateActivityModal() {
  const { open, closeModal, defaultType, bumpRefresh } = useCreateActivity();
  return (
    <AnimatePresence>
      {open && (
        <CreateActivityModal
          open={open}
          onClose={closeModal}
          defaultType={defaultType}
          onCreated={() => bumpRefresh()}
        />
      )}
    </AnimatePresence>
  );
}

export function CrmLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <PermissionProvider>
    <NotificationProvider>
    <MultitaskProvider>
    <CrmSearchProvider>
    <CreateLeadProvider>
    <CreateActivityProvider>
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
      <CrmSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <CrmTopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 flex flex-col items-stretch justify-start overflow-hidden pr-[10px] pb-[10px] pt-[10px] pl-0"
            >
              <Suspense fallback={<div className="flex items-center justify-center h-32 text-[#98989d]">Carregando...</div>}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <MinimizedTaskbar />
        <CreateLeadModal />
        <ConnectedCreateActivityModal />
      </div>
    </div>
    </CreateActivityProvider>
    </CreateLeadProvider>
    </CrmSearchProvider>
    </MultitaskProvider>
    </NotificationProvider>
    </PermissionProvider>
  );
}