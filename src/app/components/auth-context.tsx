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
  /** OAuth URL for manual fallback link (when auto-redirect fails) */
  oauthUrl: string | null;
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
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);

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
    /**
     * Detect OAuth callback params in the URL.
     * Supabase PKCE flow returns ?code=..., implicit flow returns #access_token=...
     * We must wait for the client to exchange these before setting loading=false,
     * otherwise RequireAuth will redirect to /login and strip the params.
     */
    const url = new URL(window.location.href);
    const hasOAuthCallback =
      url.searchParams.has("code") ||
      url.hash.includes("access_token");

    if (hasOAuthCallback) {
      console.log("[Zenite Auth] OAuth callback detected, waiting for session exchange...");
    }

    // Listen for auth state changes FIRST (to catch the exchange result)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("[Zenite Auth] onAuthStateChange:", event);
      validateAndSetSession(s).then(() => setLoading(false));
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log("[Zenite Auth] getSession result:", s ? "session found" : "no session");
      // If we have an OAuth callback but no session yet, DON'T set loading=false.
      // Wait for onAuthStateChange to fire after the code exchange.
      if (!s && hasOAuthCallback) {
        console.log("[Zenite Auth] Waiting for code exchange to complete...");
        // Safety timeout — if exchange takes too long, stop loading
        const timeout = setTimeout(() => {
          console.warn("[Zenite Auth] Code exchange timeout, setting loading=false");
          setLoading(false);
        }, 10_000);
        // Clean up on unmount
        return () => clearTimeout(timeout);
      }
      validateAndSetSession(s).then(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [validateAndSetSession]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setOauthUrl(null);

    console.log("[Zenite Auth] Starting Google OAuth...");

    try {
      if (!IS_PREVIEW) {
        // Production: let Supabase SDK handle the redirect natively.
        // We also get the URL for a manual fallback link.
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          console.error("[Zenite Auth] OAuth error:", error.message, error);
          setAuthError(`Erro no login Google: ${error.message}`);
          return;
        }

        if (!data?.url) {
          console.error("[Zenite Auth] No OAuth URL returned!", data);
          setAuthError("Erro: nenhuma URL de autenticação retornada.");
          return;
        }

        console.log("[Zenite Auth] Got OAuth URL:", data.url);
        // Save URL for manual fallback
        setOauthUrl(data.url);

        // Navigate using an anchor click (most reliable across browsers)
        const a = document.createElement("a");
        a.href = data.url;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Iframe/preview: popup approach
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true,
          },
        });
        if (error) {
          console.error("[Zenite Auth] OAuth error:", error.message);
          return;
        }
        if (data?.url) {
          const popup = window.open(
            data.url,
            "google-oauth",
            "width=500,height=650,popup=yes,left=200,top=100"
          );
          const pollInterval = setInterval(async () => {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                clearInterval(pollInterval);
                await validateAndSetSession(sessionData.session);
                if (popup && !popup.closed) popup.close();
              }
            } catch {
              // ignore
            }
          }, 1000);
          setTimeout(() => clearInterval(pollInterval), 120_000);
        }
      }
    } catch (err) {
      console.error("[Zenite Auth] Unexpected error:", err);
      setAuthError(`Erro inesperado no login: ${String(err)}`);
    }
  }, [validateAndSetSession]);

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
    oauthUrl,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ================================================================== */
/*  Hook                                                               */
/* ================================================================== */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Return safe fallback instead of throwing.
    // This happens in:
    //   - Figma Make preview (components rendered in isolation)
    //   - HMR / React Refresh (provider not yet mounted)
    //   - Catch-all routes outside RootLayout
    console.warn("[Zenite Auth] useAuth called outside AuthProvider — returning fallback");
    return {
      session: null,
      user: null,
      loading: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
      accessToken: null,
      authError: null,
      oauthUrl: null,
    } as AuthContextValue;
  }
  return ctx;
}