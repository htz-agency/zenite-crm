import { useState } from "react";
import {
  ArrowLeft,
  FloppyDisk,
  SpinnerGap,
  Speedometer,
  RocketLaunch,
  CompassTool,
  CurrencyDollar,
  Clock,
  Lightning,
  Check,
  Package,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  groupLabels,
  groupColors,
  formatCurrency,
  type ServiceGroup,
} from "./pricing-data";
import { createService } from "./api";

const groupIcons: Record<string, React.ReactNode> = {
  performance: <Speedometer size={16} weight="duotone" />,
  sales_ops: <RocketLaunch size={16} weight="duotone" />,
  brand_co: <CompassTool size={16} weight="duotone" />,
};

export function NewService() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [group, setGroup] = useState<ServiceGroup>("performance");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [implPrice, setImplPrice] = useState<number>(0);
  const [hoursEstimate, setHoursEstimate] = useState<number>(0);
  const [isAds, setIsAds] = useState(false);
  const [complexityBasico, setComplexityBasico] = useState<number>(1);
  const [complexityIntermediario, setComplexityIntermediario] = useState<number>(1.5);
  const [complexityAvancado, setComplexityAvancado] = useState<number>(2.0);

  const colors = groupColors[group];

  // Generate slug ID from name
  const generateId = (n: string, g: ServiceGroup) => {
    const prefix = g === "performance" ? "perf" : g === "sales_ops" ? "sales" : "brand";
    const slug = n
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${prefix}-${slug || "novo"}`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do serviço.");
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      const id = generateId(name, group);

      await createService({
        id,
        name: name.trim(),
        service_group: group,
        description: description.trim(),
        base_price: basePrice,
        impl_price: implPrice,
        hours_estimate: hoursEstimate,
        is_ads: isAds,
        complexity_basico: complexityBasico,
        complexity_intermediario: complexityIntermediario,
        complexity_avancado: complexityAvancado,
      });

      toast.success(`Serviço "${name}" criado com sucesso!`);
      // Navigate to the group page
      const groupRoute = group === "sales_ops" ? "sales-ops" : group === "brand_co" ? "brand-co" : "performance";
      navigate(`/price/servicos/${groupRoute}`);
    } catch (err) {
      console.error("Error creating service:", err);
      toast.error(`Erro ao criar serviço: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  };

  // Preview monthly price at each complexity tier
  const previewBasico = basePrice * complexityBasico;
  const previewIntermediario = basePrice * complexityIntermediario;
  const previewAvancado = basePrice * complexityAvancado;

  return (
    <div className="-m-[20px] min-h-full bg-[#f6f7f9] rounded-t-[16px] p-[20px]">
      <div className="max-w-[1200px] mx-auto">
        {/* Header — white card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-[20px] bg-white rounded-[16px] px-[20px] pt-[20px] pb-[16px]">
          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center shrink-0 size-[44px] bg-[#dcf0ff] rounded-[8px] hover:bg-[#c8e4f8] transition-colors"
            >
              <Package size={22} weight="bold" className="text-[#07abde]" />
            </button>
            <div className="flex flex-col gap-[2px]">
              <p
                className="text-[#64676c] font-bold leading-[20px]"
                style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}
              >
                Catálogo de Serviços
              </p>
              <h1
                className="text-[#28415c] font-bold leading-[24px]"
                style={{ fontSize: 19, letterSpacing: -0.5 }}
              >
                Adicionar Serviço
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-[10px] bg-[#f6f7f9] h-[44px] rounded-[100px] px-[5px] py-[0px]">
            <button
              className="flex items-center gap-[4px] justify-center h-[32px] px-[12px] rounded-[500px] text-[#28415c] hover:bg-[#DCF0FF] hover:text-[#07ABDE] active:bg-[#07ABDE] active:text-[#f6f7f9] transition-colors disabled:opacity-50"
              onClick={() => navigate(-1)}
              title="Voltar"
            >
              <ArrowLeft size={15} weight="bold" />
              <span className="font-bold text-[10px] tracking-[0.5px] uppercase leading-[20px]">
                Voltar
              </span>
            </button>
            <button
              className="flex items-center gap-[4px] justify-center h-[32px] px-[12px] rounded-[500px] text-[#28415c] hover:bg-[#DCF0FF] hover:text-[#07ABDE] active:bg-[#07ABDE] active:text-[#f6f7f9] transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
              title="Salvar Serviço"
            >
              {saving ? (
                <SpinnerGap size={15} className="animate-spin" />
              ) : (
                <FloppyDisk size={15} weight="bold" />
              )}
              <span className="font-bold text-[10px] tracking-[0.5px] uppercase leading-[20px]">
                Salvar Serviço
              </span>
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[22px]">
          {/* Left column */}
          <div className="flex flex-col gap-[22px]">
            {/* Basic Info */}
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3
                className="text-[#122232] mb-4"
                style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.5px" }}
              >
                Informações do Serviço
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    Nome do Serviço
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Gestão de Google Ads"
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do serviço..."
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
              </div>
            </div>

            {/* Group Selector */}
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3
                className="text-[#122232] mb-4"
                style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.5px" }}
              >
                Categoria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(["performance", "sales_ops", "brand_co"] as ServiceGroup[]).map((g) => {
                  const gc = groupColors[g];
                  const selected = group === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGroup(g)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                        selected ? `${gc.bg}` : "hover:bg-[#f6f7f9] bg-white"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          selected ? `${gc.accent} text-white` : `${gc.bg} ${gc.icon}`
                        }`}
                      >
                        {selected ? (
                          <Check size={16} weight="bold" />
                        ) : (
                          groupIcons[g]
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`truncate ${selected ? gc.text : "text-[#122232]"}`}
                          style={{ fontSize: 13, fontWeight: 600 }}
                        >
                          {groupLabels[g]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3
                className="text-[#122232] mb-4"
                style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.5px" }}
              >
                Precificação
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    Preço Base Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={basePrice || ""}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    Preço Implementação (R$)
                  </label>
                  <input
                    type="number"
                    value={implPrice || ""}
                    onChange={(e) => setImplPrice(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    Horas Estimadas / Mês
                  </label>
                  <input
                    type="number"
                    value={hoursEstimate || ""}
                    onChange={(e) => setHoursEstimate(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
              </div>

              {/* Is Ads toggle */}
              <div className="mt-4">
                <button
                  onClick={() => setIsAds(!isAds)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                    isAds
                      ? "bg-[#D9F8EF] border-[#3CCEA7] text-[#135543]"
                      : "bg-white border-[#DDE3EC] text-[#4E6987]"
                  }`}
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  <Lightning size={16} weight={isAds ? "fill" : "regular"} />
                  {isAds ? "Serviço de Ads (usa faixas de investimento em mídia)" : "Serviço padrão (complexidade básica)"}
                </button>
              </div>
            </div>

            {/* Complexity Multipliers */}
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3
                className="text-[#122232] mb-4"
                style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.5px" }}
              >
                Multiplicadores de Complexidade
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    {isAds ? "Até R$10 mil" : "Básico"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={complexityBasico}
                    onChange={(e) => setComplexityBasico(Number(e.target.value))}
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    {isAds ? "R$10k - R$50k" : "Intermediário"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={complexityIntermediario}
                    onChange={(e) => setComplexityIntermediario(Number(e.target.value))}
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
                <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                  <label
                    className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors"
                    style={{ fontSize: 10, lineHeight: "20px" }}
                  >
                    {isAds ? "Acima de R$100k" : "Avançado"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={complexityAvancado}
                    onChange={(e) => setComplexityAvancado(Number(e.target.value))}
                    className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                    style={{ fontSize: 15, lineHeight: "22px", letterSpacing: "-0.5px" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Preview */}
          <div className="flex flex-col gap-[22px]">
            {/* Service Preview Card */}
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3
                className="text-[#122232] mb-4"
                style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.5px" }}
              >
                Preview do Serviço
              </h3>

              {/* Service card preview */}
              <div className={`p-4 rounded-xl ${colors.bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.accent} text-white`}>
                    {groupIcons[group]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`${colors.text} truncate`} style={{ fontSize: 14, fontWeight: 700 }}>
                      {name || "Nome do Serviço"}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 mt-0.5 rounded ${colors.bg} ${colors.text}`}
                      style={{ fontSize: 10, fontWeight: 600 }}
                    >
                      {groupLabels[group]}
                    </span>
                  </div>
                </div>
                <p className="text-[#4E6987] mb-3" style={{ fontSize: 12, lineHeight: "18px" }}>
                  {description || "Descrição do serviço..."}
                </p>
                <div className="flex items-center gap-4 pt-3 border-t border-black/5">
                  <div className="flex items-center gap-1.5">
                    <CurrencyDollar size={14} className={colors.icon.replace("text-", "text-")} />
                    <span className="text-[#4E6987]" style={{ fontSize: 11 }}>Base:</span>
                    <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700 }}>
                      {basePrice > 0 ? formatCurrency(basePrice) + "/mês" : "Sob demanda"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[#4E6987]" />
                    <span className="text-[#4E6987]" style={{ fontSize: 11 }}>Horas:</span>
                    <span className="text-[#122232]" style={{ fontSize: 12, fontWeight: 700 }}>
                      {hoursEstimate}h/mês
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Tiers Preview */}
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3
                className="text-[#122232] mb-4"
                style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.5px" }}
              >
                Faixas de Preço
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: isAds ? "Até R$10 mil" : "Básico", mult: complexityBasico, value: previewBasico },
                  { label: isAds ? "R$10k - R$50k" : "Intermediário", mult: complexityIntermediario, value: previewIntermediario },
                  { label: isAds ? "Acima de R$100k" : "Avançado", mult: complexityAvancado, value: previewAvancado },
                ].map((tier) => (
                  <div key={tier.label} className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBFC]">
                    <div>
                      <p className="text-[#122232]" style={{ fontSize: 13, fontWeight: 600 }}>
                        {tier.label}
                      </p>
                      <p className="text-[#4E6987]" style={{ fontSize: 11 }}>
                        Multiplicador: x{tier.mult}
                      </p>
                    </div>
                    <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 700 }}>
                      {tier.value > 0 ? formatCurrency(tier.value) : "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Implementation */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#DDE3EC]">
                <div>
                  <p className="text-[#122232]" style={{ fontSize: 13, fontWeight: 600 }}>
                    Implementação
                  </p>
                  <p className="text-[#4E6987]" style={{ fontSize: 11 }}>
                    Taxa única
                  </p>
                </div>
                <span className="text-[#122232]" style={{ fontSize: 15, fontWeight: 700 }}>
                  {implPrice > 0 ? formatCurrency(implPrice) : "—"}
                </span>
              </div>
            </div>

            {/* ID Preview */}
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3
                className="text-[#122232] mb-3"
                style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.5px" }}
              >
                Identificador
              </h3>
              <div className="p-3 rounded-xl bg-[#FAFBFC]">
                <p
                  className="font-bold uppercase tracking-[0.5px] text-[#98989d] mb-1"
                  style={{ fontSize: 10, lineHeight: "20px" }}
                >
                  ID do Serviço
                </p>
                <p className="text-[#4e6987] font-mono" style={{ fontSize: 14, fontWeight: 500 }}>
                  {generateId(name, group)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}