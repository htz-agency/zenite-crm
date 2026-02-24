/**
 * RootLayout — Wraps the entire route tree with providers.
 *
 * This lives INSIDE the router so that AuthProvider context
 * is available to all route components (including /login).
 */

import { Outlet } from "react-router";
import { AuthProvider } from "./auth-context";

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
