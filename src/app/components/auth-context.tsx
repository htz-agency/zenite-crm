/**
 * Auth Context — Supabase Auth (Google OAuth only)
 *
 * Provides session state, user info, login (Google) and logout
 * across the entire Zenite app. Uses a singleton Supabase client.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/* ================================================================== */
/*  Supabase singleton                                                 */
/* ================================================================== */

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

/* ================================================================== */
/*  Preview / iframe detection                                         */
/* ================================================================== */

/**
 * Returns true when the app is running inside an iframe (Figma Make preview).
 * In that scenario Google OAuth popups can't complete, so we skip auth.
 */
function isPreviewEnvironment(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // cross-origin iframe → definitely a preview
    return true;
  }
}

export const IS_PREVIEW = isPreviewEnvironment();

/* ================================================================== */
/*  Context types                                                      */
/* ================================================================== */

interface AuthContextValue {
  /** Current session (null if not authenticated) */
  session: Session | null;
  /** Current user (null if not authenticated) */
  user: User | null;
  /** Whether the initial session check is still loading */
  loading: boolean;
  /** Sign in with Google OAuth */
  signInWithGoogle: () => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Access token for Authorization header */
  accessToken: string | null;
  /** Error message when domain is not allowed */
  authError: string | null;
}

const ALLOWED_DOMAIN = "htz.agency";

/** Check if email belongs to the allowed domain */
function isAllowedEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ================================================================== */
/*  Provider                                                           */
/* ================================================================== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  /** Validate session domain — sign out if not allowed */
  const validateAndSetSession = useCallback(async (s: Session | null) => {
    if (s && !isAllowedEmail(s.user?.email)) {
      console.log(
        `Domain not allowed: ${s.user?.email}. Only @${ALLOWED_DOMAIN} accounts can access Zenite.`
      );
      setAuthError(
        `Apenas contas @${ALLOWED_DOMAIN} podem acessar o Zenite. O email ${s.user?.email} não é autorizado.`
      );
      await supabase.auth.signOut();
      setSession(null);
      return;
    }
    setAuthError(null);
    setSession(s);
  }, []);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      validateAndSetSession(s).then(() => setLoading(false));
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      validateAndSetSession(s).then(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [validateAndSetSession]);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      console.log("Error signing in with Google:", error.message);
      return;
    }
    if (data?.url) {
      // Open in a popup window to avoid iframe restrictions
      const popup = window.open(
        data.url,
        "google-oauth",
        "width=500,height=650,popup=yes,left=200,top=100"
      );

      // Poll for session in case storage events don't work in iframe
      const pollInterval = setInterval(async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            clearInterval(pollInterval);
            await validateAndSetSession(sessionData.session);
            if (popup && !popup.closed) {
              popup.close();
            }
          }
        } catch {
          // ignore polling errors
        }
      }, 1000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120_000);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("Error signing out:", error.message);
    }
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    signInWithGoogle,
    signOut,
    accessToken: session?.access_token ?? null,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ================================================================== */
/*  Hook                                                               */
/* ================================================================== */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}