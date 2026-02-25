import { CrmAccountDetail } from "./components/crm/crm-account-detail";
import { CrmSearchResults } from "./components/crm/crm-search-results";
import { useEffect } from "react";
import { createBrowserRouter, useNavigate } from "react-router";
import { CrmLayout } from "./components/crm/crm-layout";
import { CrmDashboard } from "./components/crm/crm-dashboard";
import { CrmPlaceholder } from "./components/crm/crm-placeholder";
import { CrmLeads } from "./components/crm/crm-leads";
import { CrmLeadDetail } from "./components/crm/crm-lead-detail";
import { CrmSettings } from "./components/crm/crm-settings";
import { CrmSettingsRedirect } from "./components/crm/crm-settings-redirect";
import { CrmSettingsPlaceholder } from "./components/crm/crm-settings-placeholder";
import { CrmSettingsNativeFields } from "./components/crm/crm-settings-native-fields";
import { CrmSettingsCreateField } from "./components/crm/crm-settings-create-field";
import { CrmSheets } from "./components/crm/crm-sheets";
import { CrmUsers } from "./components/crm/crm-users";
import { CrmHierarchy } from "./components/crm/crm-hierarchy";
import { CrmOpportunities } from "./components/crm/crm-opportunities";
import { CrmOpportunityDetail } from "./components/crm/crm-opportunity-detail";
import { CrmPipeSettings } from "./components/crm/crm-pipe-settings";
import { CrmSettingsObjLeads } from "./components/crm/crm-settings-obj-leads";
import { CrmContacts } from "./components/crm/crm-contacts";
import { CrmContactDetail } from "./components/crm/crm-contact-detail";
import { CrmAccounts } from "./components/crm/crm-accounts";
import { LoginPage } from "./components/login-page";
import { RequireAuth } from "./components/require-auth";
import { RootLayout } from "./components/root-layout";

/** Catch-all component that redirects any unmatched route to /crm */
function RedirectToCrm() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/crm", { replace: true });
  }, [navigate]);
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        path: "login",
        Component: LoginPage,
      },
      {
        Component: RequireAuth,
        children: [
          { index: true, Component: RedirectToCrm },
          {
            path: "crm",
            Component: CrmLayout,
            children: [
              { index: true, Component: CrmDashboard },
              {
                path: "leads",
                children: [
                  { index: true, Component: CrmLeads },
                  { path: "configuracoes", Component: CrmPipeSettings },
                  { path: ":id", Component: CrmLeadDetail },
                ],
              },
              { path: "pipeline", Component: CrmPlaceholder },
              {
                path: "oportunidades",
                children: [
                  { index: true, Component: CrmOpportunities },
                  { path: ":id", Component: CrmOpportunityDetail },
                ],
              },
              {
                path: "contatos",
                children: [
                  { index: true, Component: CrmContacts },
                  { path: ":id", Component: CrmContactDetail },
                ],
              },
              {
                path: "contas",
                children: [
                  { index: true, Component: CrmAccounts },
                  { path: ":id", Component: CrmAccountDetail },
                ],
              },
              { path: "fluxos", Component: CrmPlaceholder },
              { path: "relatorios", Component: CrmPlaceholder },
              { path: "campanhas", Component: CrmPlaceholder },
              { path: "config-pipes", Component: CrmPlaceholder },
              { path: "dash", Component: CrmPlaceholder },
              { path: "ajustes", Component: CrmSettingsRedirect },
              { path: "ajustes/geral", Component: CrmSettingsPlaceholder },
              { path: "ajustes/notificacoes", Component: CrmSettingsPlaceholder },
              { path: "ajustes/padroes", Component: CrmSettingsPlaceholder },
              { path: "ajustes/usuarios", Component: CrmUsers },
              { path: "ajustes/equipes", Component: CrmSettingsPlaceholder },
              { path: "ajustes/hierarquia", Component: CrmHierarchy },
              { path: "ajustes/seguranca", Component: CrmSettingsPlaceholder },
              { path: "ajustes/campos", Component: CrmSettingsNativeFields },
              { path: "ajustes/campos/novo", Component: CrmSettingsCreateField },
              { path: "ajustes/campos/editar/:fieldKey", Component: CrmSettingsCreateField },
              { path: "ajustes/calculados", Component: CrmSettings },
              { path: "ajustes/logica-condicional", Component: CrmSettingsPlaceholder },
              { path: "ajustes/obj-leads", Component: CrmSettingsObjLeads },
              { path: "ajustes/obj-oportunidades", Component: CrmSettingsPlaceholder },
              { path: "ajustes/obj-contatos", Component: CrmSettingsPlaceholder },
              { path: "ajustes/obj-contas", Component: CrmSettingsPlaceholder },
              { path: "ajustes/sheets", Component: CrmSheets },
              { path: "novo-lead", Component: CrmPlaceholder },
              { path: "resultados", Component: CrmSearchResults },
              { path: "atalho", Component: CrmPlaceholder },
              { path: "*", Component: CrmDashboard },
            ],
          },
        ],
      },
      {
        path: "*",
        Component: RedirectToCrm,
      },
    ],
  },
]);