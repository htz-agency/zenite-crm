/**
 * CRM Notification Context
 *
 * Manages browser notifications + in-app notification list.
 * - Requests browser permission when user enables notifications
 * - Polls for new activities every 30s
 * - Shows browser notifications for activities assigned to current user
 * - Maintains an in-app notification list with unread count
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { listActivities, getObjectConfig, type DbActivity } from "./crm-api";
import { useAuth } from "../auth-context";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export interface CrmNotification {
  id: string;
  title: string;
  body: string;
  type: "activity_assigned" | "activity_due" | "activity_created" | "reminder";
  activityType?: string;
  activityId?: string;
  timestamp: number;
  read: boolean;
}

interface NotificationContextValue {
  /** Current browser permission state */
  permission: NotificationPermission | "unsupported";
  /** Request browser notification permission */
  requestPermission: () => Promise<NotificationPermission>;
  /** Whether polling is active */
  isPolling: boolean;
  /** In-app notifications list */
  notifications: CrmNotification[];
  /** Number of unread notifications */
  unreadCount: number;
  /** Mark a single notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Manually push a notification (e.g. from activity creation) */
  pushNotification: (n: Omit<CrmNotification, "id" | "timestamp" | "read">) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/* ================================================================== */
/*  Activity type labels & colors                                      */
/* ================================================================== */

const TYPE_LABELS: Record<string, string> = {
  compromisso: "Compromisso",
  tarefa: "Tarefa",
  ligacao: "Ligacao",
  nota: "Nota",
  mensagem: "Mensagem",
  email: "Email",
};

const TYPE_COLORS: Record<string, string> = {
  compromisso: "#FF8C76",
  tarefa: "#8C8CD4",
  ligacao: "#3CCEA7",
  nota: "#EAC23D",
  mensagem: "#07ABDE",
  email: "#4E6987",
};

/* ================================================================== */
/*  Storage helpers                                                     */
/* ================================================================== */

const STORAGE_KEY = "crm_notifications";
const SEEN_IDS_KEY = "crm_notif_seen_ids";

function loadNotifications(): CrmNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(list: CrmNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // noop
  }
}

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    // Keep only last 500 IDs to prevent unbounded growth
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(arr));
  } catch {
    // noop
  }
}

/* ================================================================== */
/*  Provider                                                            */
/* ================================================================== */

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const [notifications, setNotifications] = useState<CrmNotification[]>(loadNotifications);
  const [isPolling, setIsPolling] = useState(false);
  const seenIdsRef = useRef<Set<string>>(loadSeenIds());
  const configRef = useRef<{ activityNotifyOnAssign?: boolean }>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist notifications when they change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return "denied";
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      setPermission("denied");
      return "denied";
    }
  }, []);

  // Push a notification
  const pushNotification = useCallback(
    (n: Omit<CrmNotification, "id" | "timestamp" | "read">) => {
      const notif: CrmNotification = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 100));

      // Show browser notification if permission granted
      if (permission === "granted") {
        try {
          const browserNotif = new Notification(notif.title, {
            body: notif.body,
            icon: "/favicon.ico",
            tag: notif.id,
            silent: false,
          });
          // Auto-close after 6s
          setTimeout(() => browserNotif.close(), 6000);
        } catch {
          // Fallback — some browsers don't support Notification constructor
        }
      }
    },
    [permission],
  );

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load config on mount & periodically
  const loadConfig = useCallback(async () => {
    try {
      const cfg = await getObjectConfig("atividades");
      configRef.current = cfg || {};
    } catch {
      // non-fatal
    }
  }, []);

  // Poll for new activities
  const pollActivities = useCallback(async () => {
    if (!user) return;
    if (!configRef.current.activityNotifyOnAssign) return;

    try {
      const activities = await listActivities();
      const seen = seenIdsRef.current;
      const newActivities: DbActivity[] = [];

      for (const act of activities) {
        if (!seen.has(act.id)) {
          seen.add(act.id);
          newActivities.push(act);
        }
      }

      // On first poll, just mark all as seen (don't flood with notifications)
      if (seen.size === newActivities.length && newActivities.length === activities.length) {
        saveSeenIds(seen);
        return;
      }

      // Generate notifications for genuinely new activities
      for (const act of newActivities) {
        const assignedTo = act.assigned_to || act.owner;
        const isAssignedToMe =
          assignedTo &&
          user &&
          (assignedTo === user.id ||
            assignedTo === user.email ||
            assignedTo === user.user_metadata?.name);

        const typeLabel = TYPE_LABELS[act.type] || act.type;
        const subject = act.subject || act.label || "Sem assunto";

        if (isAssignedToMe) {
          pushNotification({
            title: `${typeLabel} atribuida a voce`,
            body: subject,
            type: "activity_assigned",
            activityType: act.type,
            activityId: act.id,
          });
        } else {
          pushNotification({
            title: `Nova ${typeLabel.toLowerCase()}`,
            body: subject,
            type: "activity_created",
            activityType: act.type,
            activityId: act.id,
          });
        }
      }

      saveSeenIds(seen);
    } catch (err) {
      console.log("Notification poll error:", err);
    }
  }, [user, pushNotification]);

  // Start/stop polling
  useEffect(() => {
    loadConfig();

    // Initial poll after short delay
    const initialTimeout = setTimeout(() => {
      pollActivities();
      setIsPolling(true);
    }, 3000);

    intervalRef.current = setInterval(() => {
      loadConfig();
      pollActivities();
    }, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPolling(false);
    };
  }, [loadConfig, pollActivities]);

  // Check for upcoming activities (due in next 15 min) — reminder notifications
  useEffect(() => {
    if (!configRef.current.activityNotifyOnAssign) return;
    if (permission !== "granted") return;

    const checkReminders = async () => {
      try {
        const activities = await listActivities();
        const now = Date.now();
        const fifteenMin = 15 * 60 * 1000;

        for (const act of activities) {
          const dueDate = act.due_date || act.start_date || act.date;
          if (!dueDate) continue;

          const dueTime = new Date(dueDate).getTime();
          const diff = dueTime - now;

          // If due in next 15 minutes
          if (diff > 0 && diff <= fifteenMin) {
            const reminderKey = `reminder-${act.id}`;
            if (!seenIdsRef.current.has(reminderKey)) {
              seenIdsRef.current.add(reminderKey);
              const typeLabel = TYPE_LABELS[act.type] || act.type;
              const minutes = Math.ceil(diff / 60000);
              pushNotification({
                title: `Lembrete: ${typeLabel}`,
                body: `"${act.subject || act.label || "Sem assunto"}" comeca em ${minutes} min`,
                type: "reminder",
                activityType: act.type,
                activityId: act.id,
              });
              saveSeenIds(seenIdsRef.current);
            }
          }
        }
      } catch {
        // non-fatal
      }
    };

    const reminderInterval = setInterval(checkReminders, 60_000); // every minute
    return () => clearInterval(reminderInterval);
  }, [permission, pushNotification]);

  return (
    <NotificationContext.Provider
      value={{
        permission,
        requestPermission,
        isPolling,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        pushNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Return safe fallback instead of throwing — prevents crashes during HMR
    // and when component renders before provider mounts
    return {
      permission: "default" as NotificationPermission,
      requestPermission: async () => "default" as NotificationPermission,
      isPolling: false,
      notifications: [] as CrmNotification[],
      unreadCount: 0,
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearAll: () => {},
      pushNotification: () => {},
    } as NotificationContextValue;
  }
  return ctx;
}

export { TYPE_COLORS, TYPE_LABELS };