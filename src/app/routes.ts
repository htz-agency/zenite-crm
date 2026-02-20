import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { Dashboard } from "./components/dashboard";
import { ServiceList } from "./components/service-list";
import { NewProposal } from "./components/new-proposal";
import { Proposals } from "./components/proposals";
import { ProposalDetail } from "./components/proposal-detail";
import { PriceTable } from "./components/price-table";
import { NewService } from "./components/new-service";
import { Settings } from "./components/settings";
import { Shortcuts } from "./components/shortcuts";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "servicos/:group", Component: ServiceList },
      { path: "novo-servico", Component: NewService },
      { path: "nova-proposta", Component: NewProposal },
      { path: "editar-proposta/:id", Component: NewProposal },
      { path: "propostas", Component: Proposals },
      { path: "propostas/:id", Component: ProposalDetail },
      { path: "tabela-precos", Component: PriceTable },
      { path: "ajustes", Component: Settings },
      { path: "atalho", Component: Shortcuts },
      { path: "*", Component: Dashboard },
    ],
  },
]);