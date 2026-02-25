/**
 * Permission Context — Provides role-based permission checking across the CRM.
 *
 * Loads the current user's role and permissions matrix on mount.
 * Exposes a `can(objectKey, action, recordOwnerId?)` helper for UI-level checks.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "../auth-context";
import {
  getUserRole,
  getPermissions,
  setAuthToken,
  type PermissionsMatrix,
  type PermissionLevel,
  type ObjectPermissions,
} from "./crm-api";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type PermAction = "exibir" | "criar" | "editar" | "excluir";

interface PermissionContextValue {
  /** Current user's role (admin, gerente, membro, viewer) */
  role: string;
  /** Full permissions matrix (role → object → action → level) */
  matrix: PermissionsMatrix | null;
  /** Check if the current user can perform an action */
  can: (objectKey: string, action: PermAction, recordOwnerId?: string | null) => boolean;
  /** Current user's ID */
  userId: string | null;
  /** Whether permissions have loaded */
  loaded: boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  role: "membro",
  matrix: null,
  can: () => true,
  userId: null,
  loaded: false,
});

/* ================================================================== */
/*  Default permissions (mirrors server-side defaults)                 */
/* ================================================================== */

const DEFAULT_PERMS: Record<string, ObjectPermissions> = {
  admin: { exibir: "todos", criar: true, editar: "todos", excluir: "todos" },
  gerente: { exibir: "todos", criar: true, editar: "todos", excluir: "proprios" },
  membro: { exibir: "todos", criar: true, editar: "proprios", excluir: "nenhum" },
  viewer: { exibir: "todos", criar: false, editar: "nenhum", excluir: "nenhum" },
};

/* ================================================================== */
/*  Provider                                                           */
/* ================================================================== */

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [role, setRole] = useState("membro");
  const [matrix, setMatrix] = useState<PermissionsMatrix | null>(null);
  const [loaded, setLoaded] = useState(false);

  const userId = user?.id ?? null;

  // Sync auth token with API client
  useEffect(() => {
    setAuthToken(accessToken);
  }, [accessToken]);

  // Load role + permissions
  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [userRole, perms] = await Promise.all([
          getUserRole(userId),
          getPermissions(),
        ]);
        if (cancelled) return;
        setRole(userRole || "membro");
        setMatrix(perms);
      } catch (err) {
        console.error("[PermissionContext] Error loading permissions:", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Permission check function
  const can = useCallback(
    (objectKey: string, action: PermAction, recordOwnerId?: string | null): boolean => {
      // Admin always allowed
      if (role === "admin") return true;

      // Get permissions for this role + object
      const rolePerms = matrix?.[role]?.[objectKey];

      // Fallback to defaults if no matrix saved
      if (!rolePerms) {
        const defaults = DEFAULT_PERMS[role];
        if (!defaults) return true;

        if (action === "criar") return !!defaults.criar;

        const level = defaults[action] as PermissionLevel;
        if (level === "todos") return true;
        if (level === "nenhum") return false;
        if (level === "proprios") {
          if (!userId || !recordOwnerId) return false;
          return recordOwnerId === userId;
        }
        return true;
      }

      // Check from matrix
      if (action === "criar") return !!rolePerms.criar;

      const level = rolePerms[action] as PermissionLevel;
      if (!level || level === "todos") return true;
      if (level === "nenhum") return false;
      if (level === "proprios") {
        if (!userId || !recordOwnerId) return false;
        return recordOwnerId === userId;
      }
      return true;
    },
    [role, matrix, userId],
  );

  return (
    <PermissionContext.Provider value={{ role, matrix, can, userId, loaded }}>
      {children}
    </PermissionContext.Provider>
  );
}

/* ================================================================== */
/*  Hook                                                               */
/* ================================================================== */

export function usePermissions() {
  return useContext(PermissionContext);
}
