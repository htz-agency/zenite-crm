/**
 * Auth Context — Supabase Auth (Google OAuth only)
 *
 * Provides session state, user info, login (Google) and logout
 * across the entire Zenite app. Uses a singleton Supabase client.
 *
 * KEY FIX: We explicitly call `exchangeCodeForSession()` when ?code=
 * is detected in the URL, instead of relying on the Supabase client's
 * auto-detection (which can silently fail in some environments).
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
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

/* ================================================================== */
/*  Supabase singleton                                                 */
/* ================================================================== */

const supabaseUrl = `https://${projectId}.supabase.co`;

function isPreviewEnv(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

// In iframe/preview environments, Navigator LockManager is unavailable.
// Polyfill it before Supabase client is created so GoTrueClient's
// constructor can find it (the `lock` config option is read too late).
if (isPreviewEnv() && typeof globalThis.navigator !== "undefined") {
  if (!navigator.locks) {
    (navigator as any).locks = {
      request: async (_name: string, _opts: any, fn?: () => Promise<any>) => {
        // If called with 2 args (name, fn) — older signature
        const callback = fn ?? _opts;
        return callback();
      },
    };
  }
}

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    flowType: "pkce",
    // We handle the code exchange ourselves — disable auto-detection
    // to avoid race conditions with our explicit exchange.
    detectSessionInUrl: false,
    // In preview/iframe environments, disable session persistence.
    ...(isPreviewEnv() ? { persistSession: false } : {}),
  },
});

/* ================================================================== */
/*  Preview / iframe detection                                         */
/* ================================================================== */

export const IS_PREVIEW = isPreviewEnv();

/* ================================================================== */
/*  Context types                                                      */
/* ================================================================== */

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  accessToken: string | null;
  authError: string | null;
  oauthUrl: string | null;
}

const ALLOWED_DOMAIN = "htz.agency";

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

  const validateAndSetSession = useCallback(async (s: Session | null) => {
    if (s && !isAllowedEmail(s.user?.email)) {
      console.log(
        `[Zenite Auth] Domain not allowed: ${s.user?.email}. Only @${ALLOWED_DOMAIN}.`
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
    // ── 1. Check for OAuth callback code in URL ──────────────────────
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hashToken = url.hash.includes("access_token");

    const hasCallback = !!code || hashToken;

    if (hasCallback) {
      console.log("[Zenite Auth] OAuth callback detected:", {
        hasCode: !!code,
        hasHashToken: hashToken,
        url: window.location.href,
      });
    }

    // ── 2. Listen for auth state changes ─────────────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      console.log(
        "[Zenite Auth] onAuthStateChange:",
        event,
        s ? `session for ${s.user?.email}` : "no session"
      );

      // During OAuth callback, skip INITIAL_SESSION with no session —
      // we'll get the session from our explicit code exchange below.
      if (event === "INITIAL_SESSION" && !s && hasCallback) {
        console.log("[Zenite Auth] Skipping INITIAL_SESSION during callback");
        return;
      }

      // Clean up URL after successful session from callback
      if (s && hasCallback) {
        console.log("[Zenite Auth] Session established — cleaning URL");
        window.history.replaceState({}, "", window.location.pathname);
      }

      validateAndSetSession(s).then(() => setLoading(false));
    });

    // ── 3. Handle OAuth code exchange explicitly ─────────────────────
    if (code) {
      console.log("[Zenite Auth] Exchanging code for session...");

      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error) {
            console.error(
              "[Zenite Auth] Code exchange FAILED:",
              error.message,
              error
            );
            setAuthError(`Erro na troca do código OAuth: ${error.message}`);
            // Clean up the ?code= from URL so user can retry
            window.history.replaceState({}, "", window.location.pathname);
            setLoading(false);
            return;
          }

          console.log(
            "[Zenite Auth] Code exchange SUCCESS:",
            data.session?.user?.email
          );
          // onAuthStateChange should fire with SIGNED_IN,
          // but set session here too for safety
          if (data.session) {
            window.history.replaceState({}, "", window.location.pathname);
            validateAndSetSession(data.session).then(() => setLoading(false));
          }
        })
        .catch((err) => {
          console.error("[Zenite Auth] Code exchange EXCEPTION:", err);
          setAuthError(`Erro inesperado na autenticação: ${String(err)}`);
          window.history.replaceState({}, "", window.location.pathname);
          setLoading(false);
        });
    } else {
      // ── 4. No callback — check for existing session ────────────────
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        console.log(
          "[Zenite Auth] getSession:",
          s ? `session for ${s.user?.email}` : "no session"
        );
        validateAndSetSession(s).then(() => setLoading(false));
      }).catch((err) => {
        // Handle Navigator LockManager timeout gracefully
        console.warn("[Zenite Auth] getSession failed (likely lock timeout in iframe):", err?.message || err);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, [validateAndSetSession]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setOauthUrl(null);

    console.log("[Zenite Auth] Starting Google OAuth...");

    try {
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
      setOauthUrl(data.url);

      if (!IS_PREVIEW) {
        // Navigate using anchor click
        const a = document.createElement("a");
        a.href = data.url;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Iframe: popup
        const popup = window.open(
          data.url,
          "google-oauth",
          "width=500,height=650,popup=yes,left=200,top=100"
        );
        const pollInterval = setInterval(async () => {
          try {
            const { data: sd } = await supabase.auth.getSession();
            if (sd?.session) {
              clearInterval(pollInterval);
              await validateAndSetSession(sd.session);
              if (popup && !popup.closed) popup.close();
            }
          } catch {
            /* ignore */
          }
        }, 1000);
        setTimeout(() => clearInterval(pollInterval), 120_000);
      }
    } catch (err) {
      console.error("[Zenite Auth] Unexpected error:", err);
      setAuthError(`Erro inesperado no login: ${String(err)}`);
    }
  }, [validateAndSetSession]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("[Zenite Auth] Error signing out:", error.message);
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
    if (!IS_PREVIEW) {
      console.warn(
        "[Zenite Auth] useAuth called outside AuthProvider — returning fallback"
      );
    }
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