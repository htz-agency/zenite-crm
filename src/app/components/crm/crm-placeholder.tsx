import { useLocation } from "react-router";
import { HardDrives } from "@phosphor-icons/react";

const pageTitles: Record<string, string> = {
  "/crm/leads": "Todos os Leads",
  "/crm/pipeline": "Pipeline de Vendas",
  "/crm/dash": "Dash",
  "/crm/ajustes": "Ajustes",
  "/crm/novo-lead": "Novo Lead",
  "/crm/atalho": "Atalho",
};

export function CrmPlaceholder() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "Página";

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[#122232]" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
          {title}
        </h1>
        <p className="text-[#4E6987] mt-1" style={{ fontSize: 14 }}>
          Módulo CRM
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#DDE3EC] rounded-[16px]">
        <div className="w-14 h-14 rounded-2xl bg-[#DCF0FF] flex items-center justify-center mb-4">
          <HardDrives size={28} weight="duotone" className="text-[#0483AB]" />
        </div>
        <p className="text-[#28415C]" style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
          Em desenvolvimento
        </p>
        <p className="text-[#4E6987] mt-1 text-center max-w-[320px]" style={{ fontSize: 14 }}>
          Esta seção do CRM está sendo construída. Em breve estará disponível.
        </p>
      </div>
    </div>
  );
}
