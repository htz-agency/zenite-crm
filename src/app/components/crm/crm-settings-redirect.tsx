import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Index route for /crm/ajustes — redirects to /crm/ajustes/geral.
 */
export function CrmSettingsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/crm/ajustes/geral", { replace: true });
  }, [navigate]);
  return null;
}
