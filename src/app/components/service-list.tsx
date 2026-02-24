import { useParams, useNavigate } from "react-router";
import {
  Speedometer,
  RocketLaunch,
  CompassTool,
  Clock,
  CurrencyDollar,
  ArrowRight,
  Plus,
} from "@phosphor-icons/react";
import {
  services,
  groupColors,
  groupLabels,
  formatCurrency,
  type ServiceGroup,
} from "./pricing-data";

const groupIcons: Record<string, React.ReactNode> = {
  performance: <Speedometer size={24} weight="duotone" />,
  sales_ops: <RocketLaunch size={24} weight="duotone" />,
  brand_co: <CompassTool size={24} weight="duotone" />,
};

const routeToGroup: Record<string, ServiceGroup> = {
  performance: "performance",
  "sales-ops": "sales_ops",
  "brand-co": "brand_co",
};

export function ServiceList() {
  const { group } = useParams<{ group: string }>();
  const navigate = useNavigate();
  const groupKey = routeToGroup[group || "performance"] || "performance";
  const groupServices = services.filter((s) => s.group === groupKey);
  const colors = groupColors[groupKey];
  const icon = groupIcons[groupKey];

  return (
    <div className="max-w-[1200px] mx-auto overflow-y-auto h-full p-[10px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.icon}`}>
            {icon}
          </div>
          <div>
            <h1 className="text-[#122232]" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              {groupLabels[groupKey]}
            </h1>
            <p className="text-[#4E6987] mt-0.5" style={{ fontSize: 14 }}>
              {groupServices.length} serviços disponíveis nesta categoria
            </p>
          </div>
        </div>
        
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {groupServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl border border-[#DDE3EC] p-4 md:p-5 hover:border-[#0483AB] transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-[#122232]" style={{ fontSize: 16, fontWeight: 700 }}>
                  {service.name}
                </h3>
                <p className="text-[#4E6987] mt-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {service.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-[#DDE3EC]">
              {service.basePrice > 0 && (
                <div className="flex items-center gap-1.5">
                  <CurrencyDollar size={16} className="text-[#4E6987]" />
                  <div>
                    <p className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500 }}>
                      Mensalidade
                    </p>
                    <p className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700 }}>
                      {formatCurrency(service.basePrice)}
                    </p>
                  </div>
                </div>
              )}

              {service.implPrice > 0 && (
                <div className="flex items-center gap-1.5">
                  <CurrencyDollar size={16} className="text-[#4E6987]" />
                  <div>
                    <p className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500 }}>
                      Implementação
                    </p>
                    <p className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700 }}>
                      {formatCurrency(service.implPrice)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-[#4E6987]" />
                <div>
                  <p className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 500 }}>
                    Horas/mês
                  </p>
                  <p className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700 }}>
                    {service.hoursEstimate}h
                  </p>
                </div>
              </div>

              <div className="ml-auto">
                <div className="flex gap-1 flex-wrap">
                  {(["basico", "intermediario", "avancado"] as const).map((c) => (
                    <span
                      key={c}
                      className={`px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}
                      style={{ fontSize: 10, fontWeight: 600 }}
                    >
                      x{service.complexityMultipliers[c]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}