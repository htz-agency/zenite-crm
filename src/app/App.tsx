import { useMemo } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { PublicProposalContent } from "./components/public-proposal";

/**
 * Detects if the current URL is a public proposal link.
 * Runs BEFORE the router to avoid auth/SPA-fallback issues.
 *
 * Supports 3 URL patterns:
 *   1. /p/TOKEN          — clean URL (needs SPA fallback on hosting)
 *   2. /#/p/TOKEN        — hash fallback (always works)
 *   3. ?token=TOKEN      — query param fallback (always works)
 */
function getPublicToken(): string | null {
  try {
    const { pathname, hash, search } = window.location;
    console.log("[Zenite] URL detection:", { pathname, hash, search, href: window.location.href });

    // 1. Pathname: /p/ABC123
    const pathMatch = pathname.match(/\/p\/([^/?#]+)/);
    if (pathMatch) {
      console.log("[Zenite] ✅ Token found in pathname:", pathMatch[1]);
      return pathMatch[1];
    }

    // 2. Hash: #/p/ABC123
    const hashMatch = hash.match(/#\/p\/([^/?#]+)/);
    if (hashMatch) {
      console.log("[Zenite] ✅ Token found in hash:", hashMatch[1]);
      return hashMatch[1];
    }

    // 3. Query param: ?token=ABC123
    const params = new URLSearchParams(search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      console.log("[Zenite] ✅ Token found in query param:", tokenParam);
      return tokenParam;
    }

    console.log("[Zenite] ❌ No public token detected — loading normal app");
  } catch (e) {
    console.error("[Zenite] Error detecting token:", e);
  }
  return null;
}

export default function App() {
  const publicToken = useMemo(() => getPublicToken(), []);

  // Public proposal — rendered OUTSIDE the router, no auth context
  if (publicToken) {
    return <PublicProposalContent token={publicToken} />;
  }

  return <RouterProvider router={router} />;
}