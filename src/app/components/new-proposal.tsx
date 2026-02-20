import { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  Trash,
  Check,
  Speedometer,
  RocketLaunch,
  CompassTool,
  CurrencyDollar,
  Clock,
  FileText,
  Info,
  FloppyDisk,
  PaperPlaneTilt,
  ArrowLeft,
  SpinnerGap,
  Clipboard,
} from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useEffect } from "react";
import {
  services,
  groupLabels,
  groupColors,
  complexityLabels,
  adsComplexityLabels,
  seniorityLabels,
  seniorityMultipliers,
  allocationLabels,
  allocationMultipliers,
  recurrenceLabels,
  recurrenceDiscounts,
  calculateServicePrice,
  calculateComboDiscount,
  comboTiers,
  formatCurrency,
  type SelectedService,
  type ServiceGroup,
  type Seniority,
  type Allocation,
} from "./pricing-data";
import { createProposal, updateProposal, getProposal, generateProposalId, selectedToDb, dbToSelected } from "./api";

const groupIcons: Record<string, React.ReactNode> = {
  performance: <Speedometer size={16} weight="duotone" />,
  sales_ops: <RocketLaunch size={16} weight="duotone" />,
  brand_co: <CompassTool size={16} weight="duotone" />,
};

export function NewProposal() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditing = !!editId;

  const [clientName, setClientName] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [activeGroup, setActiveGroup] = useState<ServiceGroup | "all">("all");
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);

  // Load proposal data when editing
  useEffect(() => {
    if (!editId) return;
    setLoadingEdit(true);
    setEditLoadError(null);
    (async () => {
      try {
        const proposal = await getProposal(editId);
        setClientName(proposal.client_name ?? "");
        setNotes(proposal.notes ?? "");
        setGlobalDiscount(proposal.global_discount ?? 0);

        // Convert DB services back to SelectedService format
        const dbServices = proposal.price_proposal_services ?? [];
        const selected: SelectedService[] = dbServices.map((dbSvc: any) => dbToSelected(dbSvc));
        setSelectedServices(selected);
      } catch (err) {
        console.error("Error loading proposal for edit:", err);
        setEditLoadError(err instanceof Error ? err.message : "Erro ao carregar proposta");
        toast.error("Erro ao carregar proposta para edição.");
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [editId]);

  const filteredServices = useMemo(() => {
    if (activeGroup === "all") return services;
    return services.filter((s) => s.group === activeGroup);
  }, [activeGroup]);

  const isServiceSelected = (serviceId: string) =>
    selectedServices.some((s) => s.serviceId === serviceId);

  const addService = (serviceId: string) => {
    if (isServiceSelected(serviceId)) return;
    setSelectedServices((prev) => [
      ...prev,
      {
        serviceId,
        complexity: "basico",
        recurrence: "mensal",
        includeImpl: true,
        quantity: 1,
        seniority: "pleno",
        allocation: "compartilhado",
      },
    ]);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  const updateService = (serviceId: string, updates: Partial<SelectedService>) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, ...updates } : s))
    );
  };

  // Calculate combo discount
  const combo = useMemo(
    () => calculateComboDiscount(selectedServices, services),
    [selectedServices]
  );

  const totals = useMemo(() => {
    let totalImpl = 0;
    let totalHours = 0;

    selectedServices.forEach((selected) => {
      const service = services.find((s) => s.id === selected.serviceId);
      if (!service) return;
      const calc = calculateServicePrice(service, selected);
      totalImpl += calc.impl;
      totalHours += calc.hours;
    });

    // Extra manual discount (on top of combo, applied to the already-discounted monthly)
    const monthlyAfterCombo = combo.monthlyAfterDiscount;
    const extraDiscountAmount = monthlyAfterCombo * (globalDiscount / 100);
    const finalMonthly = monthlyAfterCombo - extraDiscountAmount;
    const grandTotal = finalMonthly + totalImpl;

    return {
      monthlyBeforeCombo: combo.monthlyBeforeDiscount,
      comboDiscount: combo.discountAmount,
      monthlyAfterCombo,
      totalImpl,
      totalHours,
      extraDiscountPercent: globalDiscount,
      extraDiscountAmount,
      finalMonthly,
      grandTotal,
    };
  }, [selectedServices, globalDiscount, combo]);

  const handleSave = async (status: "rascunho" | "criada" | "enviada") => {
    if (!clientName.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Adicione pelo menos um serviço.");
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      const proposalId = editId || generateProposalId();

      // Build DB service rows with computed values
      const dbServices = selectedServices.map((sel) => {
        const svc = services.find((s) => s.id === sel.serviceId)!;
        const calc = calculateServicePrice(svc, sel);
        return selectedToDb(sel, { monthly: calc.monthly, impl: calc.impl, hours: calc.hours });
      });

      const saved = isEditing
        ? await updateProposal(proposalId, {
            client_name: clientName.trim(),
            status,
            notes,
            global_discount: globalDiscount,
            combo_discount_percent: combo.totalPercent,
            combo_label: combo.comboLabel,
            total_monthly: totals.finalMonthly,
            total_impl: totals.totalImpl,
            total_hours: totals.totalHours,
            grand_total: totals.grandTotal,
            services: dbServices,
          })
        : await createProposal({
            id: proposalId,
            client_name: clientName.trim(),
            status,
            notes,
            global_discount: globalDiscount,
            combo_discount_percent: combo.totalPercent,
            combo_label: combo.comboLabel,
            total_monthly: totals.finalMonthly,
            total_impl: totals.totalImpl,
            total_hours: totals.totalHours,
            grand_total: totals.grandTotal,
            services: dbServices,
          });

      if (status === "rascunho") {
        toast.success(`Rascunho "${saved.id ?? proposalId}" salvo com sucesso!`);
        if (isEditing) {
          navigate(`/propostas/${proposalId}`);
        }
      } else {
        toast.success(`Proposta "${saved.id ?? proposalId}" ${isEditing ? "atualizada" : "criada"} com sucesso!`);
        navigate(`/propostas/${saved.id ?? proposalId}`);
      }
    } catch (err) {
      console.error("Error saving proposal:", err);
      toast.error(`Erro ao salvar proposta: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-m-[20px] min-h-full bg-[#f6f7f9] rounded-t-[16px] p-[20px]">
    <div className="max-w-[1200px] mx-auto">
      {/* Header — white card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-[20px] bg-white rounded-[16px] px-[20px] pt-[20px] pb-[16px]">
        <div className="flex items-center gap-[10px]">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center shrink-0 size-[44px] bg-[#dcf0ff] rounded-[8px] hover:bg-[#c8e4f8] transition-colors"
          >
            <FileText size={22} weight="bold" className="text-[#07abde]" />
          </button>
          <div className="flex flex-col gap-[2px]">
            <p className="text-[#64676c] font-bold leading-[20px]" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {isEditing ? `Editar Proposta ${editId}` : "Nova Proposta"}
            </p>
            <h1 className="text-[#28415c] font-bold leading-[24px]" style={{ fontSize: 19, letterSpacing: -0.5 }}>
              Precificação de Serviços
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-[10px] bg-[#f6f7f9] h-[44px] rounded-[100px] px-[5px] py-[0px]">
          <button
            className="flex items-center gap-[4px] justify-center h-[32px] px-[12px] rounded-[500px] text-[#28415c] hover:bg-[#DCF0FF] hover:text-[#07ABDE] active:bg-[#07ABDE] active:text-[#f6f7f9] transition-colors disabled:opacity-50"
            onClick={() => handleSave("rascunho")}
            title="Salvar Rascunho"
          >
            <FloppyDisk size={15} weight="bold" />
            <span className="font-bold text-[10px] tracking-[0.5px] uppercase leading-[20px]">Salvar Rascunho</span>
          </button>
          <button
            className="flex items-center gap-[4px] justify-center h-[32px] px-[12px] rounded-[500px] text-[#28415c] hover:bg-[#DCF0FF] hover:text-[#07ABDE] active:bg-[#07ABDE] active:text-[#f6f7f9] transition-colors disabled:opacity-50"
            onClick={() => handleSave("criada")}
            disabled={saving || loadingEdit}
            title={isEditing ? "Salvar Alterações" : "Criar Proposta"}
          >
            {saving ? <SpinnerGap size={15} className="animate-spin" /> : <Clipboard size={15} weight="bold" />}
            <span className="font-bold text-[10px] tracking-[0.5px] uppercase leading-[20px]">{isEditing ? "Salvar Alterações" : "Criar Proposta"}</span>
          </button>
        </div>
      </div>

      {loadingEdit ? (
        <div className="flex items-center justify-center py-20">
          <SpinnerGap size={32} className="text-[#0483AB] animate-spin" />
        </div>
      ) : editLoadError ? (
        <div className="bg-white rounded-xl border border-[#FFEDEB] p-8 text-center">
          <p className="text-[#B13B00]" style={{ fontSize: 15, fontWeight: 600 }}>{editLoadError}</p>
          <button onClick={() => navigate("/propostas")} className="mt-4 px-5 py-2.5 bg-[#0483AB] text-white rounded-lg hover:bg-[#025E7B] transition-colors" style={{ fontSize: 14, fontWeight: 600 }}>
            Voltar para Propostas
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[22px]">
        {/* Left Column */}
        <div className="flex flex-col gap-[22px]">
          {/* Client Info */}
          <div className="bg-white rounded-[16px] p-4 md:p-5">
            <h3 className="text-[#122232] mb-4" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.5px' }}>
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                <label className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors" style={{ fontSize: 10, lineHeight: '20px' }}>Empresa</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Tech Solutions Ltda"
                  className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                  style={{ fontSize: 15, lineHeight: '22px', letterSpacing: '-0.5px' }}
                />
              </div>
              <div className="relative rounded-[8px] p-[6px] group focus-within:ring-1 focus-within:ring-[#07abde] transition-all">
                <label className="block font-bold uppercase tracking-[0.5px] text-[#98989d] group-focus-within:text-[#07abde] transition-colors" style={{ fontSize: 10, lineHeight: '20px' }}>Observações</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações da proposta..."
                  className="w-full bg-transparent text-[#4e6987] placeholder-[#C8CFDB] focus:outline-none font-medium"
                  style={{ fontSize: 15, lineHeight: '22px', letterSpacing: '-0.5px' }}
                />
              </div>
            </div>
          </div>

          {/* Service Picker */}
          <div className="bg-white rounded-[16px] p-4 md:p-5">
            <div className="flex flex-col gap-3 mb-4">
              <h3 className="text-[#122232]" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.5px' }}>
                Adicionar Serviços
              </h3>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setActiveGroup("all")}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    activeGroup === "all"
                      ? "bg-[#0483AB] text-white"
                      : "bg-[#F6F7F9] text-[#4E6987] hover:bg-[#DDE3EC]"
                  }`}
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  Todos
                </button>
                {(["performance", "sales_ops", "brand_co"] as ServiceGroup[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                      activeGroup === g
                        ? `${groupColors[g].accent} text-white`
                        : "bg-[#F6F7F9] text-[#4E6987] hover:bg-[#DDE3EC]"
                    }`}
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {groupIcons[g]}
                    {groupLabels[g]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredServices.map((service) => {
                const selected = isServiceSelected(service.id);
                const colors = groupColors[service.group];
                return (
                  <button
                    key={service.id}
                    onClick={() => (selected ? removeService(service.id) : addService(service.id))}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                      selected
                        ? `${colors.bg}`
                        : "hover:bg-[#f6f7f9] bg-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? `${colors.accent} text-white` : `${colors.bg} ${colors.icon}`
                      }`}
                    >
                      {selected ? (
                        <Check size={16} weight="bold" />
                      ) : (
                        <Plus size={14} weight="bold" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate ${selected ? colors.text : "text-[#122232]"}`}
                        style={{ fontSize: 13, fontWeight: 600 }}
                      >
                        {service.name}
                      </p>
                      <p className="text-[#4E6987] truncate" style={{ fontSize: 11 }}>
                        {service.basePrice > 0
                          ? `A partir de ${formatCurrency(service.basePrice)}/mês`
                          : `Impl. ${formatCurrency(service.implPrice)}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Services Configuration */}
          {selectedServices.length > 0 && (
            <div className="bg-white rounded-[16px] p-4 md:p-5">
              <h3 className="text-[#122232] mb-4" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.5px' }}>
                Configurar Serviços Selecionados ({selectedServices.length})
              </h3>

              <div className="flex flex-col gap-3">
                {selectedServices.map((selected) => {
                  const service = services.find((s) => s.id === selected.serviceId);
                  if (!service) return null;
                  const calc = calculateServicePrice(service, selected);
                  const colors = groupColors[service.group];

                  return (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl bg-[#FAFBFC]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${colors.bg} ${colors.icon}`}>
                            {groupIcons[service.group]}
                          </div>
                          <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700 }}>
                            {service.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${colors.bg} ${colors.text} sm:ml-0 -mt-1 sm:mt-0`} style={{ fontSize: 10, fontWeight: 600 }}>
                            {groupLabels[service.group]}
                          </span>
                        </div>
                        <button
                          onClick={() => removeService(service.id)}
                          className="p-1.5 rounded-lg text-[#C8CFDB] hover:text-[#ED5200] hover:bg-[#FFEDEB] transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {/* Complexity / Investimento */}
                        <div>
                          <label className="text-[#4E6987] block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                            {service.isAds ? "Investimento em Mídia" : "Complexidade"}
                          </label>
                          <select
                            value={selected.complexity}
                            onChange={(e) =>
                              updateService(service.id, {
                                complexity: e.target.value as SelectedService["complexity"],
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-[#DDE3EC] rounded-lg text-[#122232] focus:border-[#0483AB] focus:outline-none"
                            style={{ fontSize: 13 }}
                          >
                            {Object.entries(service.isAds ? adsComplexityLabels : complexityLabels).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label} (x{service.complexityMultipliers[key as keyof typeof service.complexityMultipliers]})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Recurrence */}
                        <div>
                          <label className="text-[#4E6987] block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                            Recorrência
                          </label>
                          <select
                            value={selected.recurrence}
                            onChange={(e) =>
                              updateService(service.id, {
                                recurrence: e.target.value as SelectedService["recurrence"],
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-[#DDE3EC] rounded-lg text-[#122232] focus:border-[#0483AB] focus:outline-none"
                            style={{ fontSize: 13 }}
                          >
                            {Object.entries(recurrenceLabels).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                                {recurrenceDiscounts[key] > 0
                                  ? ` (-${recurrenceDiscounts[key] * 100}%)`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Implementação Toggle */}
                        <div>
                          <label className="text-[#4E6987] block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                            Implementação
                          </label>
                          <button
                            onClick={() =>
                              updateService(service.id, { includeImpl: !selected.includeImpl })
                            }
                            className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                              selected.includeImpl
                                ? "bg-[#D9F8EF] border-[#3CCEA7] text-[#135543]"
                                : "bg-white border-[#DDE3EC] text-[#C8CFDB]"
                            }`}
                            style={{ fontSize: 13, fontWeight: 600 }}
                          >
                            {selected.includeImpl
                              ? `${formatCurrency(calc.impl)}`
                              : "Sem impl."}
                          </button>
                        </div>
                      </div>

                      {/* Team Allocation Row */}
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {/* Seniority */}
                        <div>
                          <label className="text-[#4E6987] block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                            Nível
                          </label>
                          <select
                            value={selected.seniority}
                            onChange={(e) =>
                              updateService(service.id, {
                                seniority: e.target.value as Seniority,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-[#DDE3EC] rounded-lg text-[#122232] focus:border-[#0483AB] focus:outline-none"
                            style={{ fontSize: 13 }}
                          >
                            {Object.entries(seniorityLabels).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                                {seniorityMultipliers[key as Seniority] > 1
                                  ? ` (+${Math.round((seniorityMultipliers[key as Seniority] - 1) * 100)}%)`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Allocation */}
                        <div>
                          <label className="text-[#4E6987] block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                            Alocação
                          </label>
                          <select
                            value={selected.allocation}
                            onChange={(e) =>
                              updateService(service.id, {
                                allocation: e.target.value as Allocation,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-[#DDE3EC] rounded-lg text-[#122232] focus:border-[#0483AB] focus:outline-none"
                            style={{ fontSize: 13 }}
                          >
                            {Object.entries(allocationLabels).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                                {allocationMultipliers[key as Allocation] > 1
                                  ? ` (+${Math.round((allocationMultipliers[key as Allocation] - 1) * 100)}%)`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="text-[#4E6987] block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                            Quantidade
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateService(service.id, {
                                  quantity: Math.max(1, selected.quantity - 1),
                                })
                              }
                              className="p-2 rounded-lg border border-[#DDE3EC] hover:bg-[#F6F7F9] transition-colors"
                            >
                              <Minus size={12} className="text-[#4E6987]" />
                            </button>
                            <span
                              className="flex-1 text-center text-[#122232] py-2 bg-white border border-[#DDE3EC] rounded-lg"
                              style={{ fontSize: 13, fontWeight: 600 }}
                            >
                              {selected.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateService(service.id, { quantity: selected.quantity + 1 })
                              }
                              className="p-2 rounded-lg border border-[#DDE3EC] hover:bg-[#F6F7F9] transition-colors"
                            >
                              <Plus size={12} className="text-[#4E6987]" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Service Price Summary */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 pt-3 border-t border-[#DDE3EC]">
                        <div className="flex items-center gap-1.5">
                          <CurrencyDollar size={14} className="text-[#4E6987]" />
                          <span className="text-[#4E6987]" style={{ fontSize: 12 }}>
                            Mensal:
                          </span>
                          <span className="text-[#122232]" style={{ fontSize: 13, fontWeight: 700 }}>
                            {formatCurrency(calc.monthly)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-[#4E6987]" />
                          <span className="text-[#4E6987]" style={{ fontSize: 12 }}>
                            Horas:
                          </span>
                          <span className="text-[#122232]" style={{ fontSize: 13, fontWeight: 700 }}>
                            {calc.hours}h/mês
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="text-[#4E6987]" style={{ fontSize: 12 }}>
                            Total:
                          </span>
                          <span className="text-[#0483AB]" style={{ fontSize: 15, fontWeight: 700 }}>
                            {formatCurrency(calc.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="flex flex-col gap-[22px]">
          <div className="bg-white rounded-[16px] p-4 md:p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-[#0483AB]" weight="duotone" />
              <h3 className="text-[#122232]" style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.5px' }}>
                Resumo da Proposta
              </h3>
            </div>

            {clientName && (
              <div className="mb-4 pb-4 border-b border-[#DDE3EC]">
                <p className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Cliente
                </p>
                <p className="text-[#122232] mt-0.5" style={{ fontSize: 15, fontWeight: 700 }}>
                  {clientName}
                </p>
              </div>
            )}

            {selectedServices.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#F6F7F9] flex items-center justify-center mx-auto mb-3">
                  <Plus size={20} className="text-[#C8CFDB]" />
                </div>
                <p className="text-[#4E6987]" style={{ fontSize: 13 }}>
                  Selecione serviços para começar
                </p>
              </div>
            ) : (
              <>
                {/* Services List */}
                <div className="flex flex-col gap-2 mb-4">
                  {selectedServices.map((selected) => {
                    const service = services.find((s) => s.id === selected.serviceId);
                    if (!service) return null;
                    const calc = calculateServicePrice(service, selected);
                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between py-2 border-b border-[#F6F7F9] last:border-b-0"
                      >
                        <div className="min-w-0 mr-3">
                          <p className="text-[#122232] truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                            {service.name}
                          </p>
                          <p className="text-[#4E6987]" style={{ fontSize: 11 }}>
                            {(() => {
                              const svc = services.find((s) => s.id === selected.serviceId);
                              const labels = svc?.isAds ? adsComplexityLabels : complexityLabels;
                              return labels[selected.complexity];
                            })()} · {recurrenceLabels[selected.recurrence]}
                            {selected.seniority !== "pleno" ? " · Sr" : ""}
                            {selected.allocation !== "compartilhado" ? " · Ded." : ""}
                            {selected.quantity > 1 ? ` · x${selected.quantity}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[#122232]" style={{ fontSize: 13, fontWeight: 700 }}>
                            {formatCurrency(calc.monthly)}<span className="text-[#4E6987] font-normal">/mês</span>
                          </p>
                          {calc.impl > 0 && (
                            <p className="text-[#4E6987]" style={{ fontSize: 11 }}>
                              + {formatCurrency(calc.impl)} impl.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Combo Discount Badge */}
                {combo.totalPercent > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-[#D9F8EF] to-[#DCF0FF] border border-[#3CCEA7]/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#3CCEA7] flex items-center justify-center">
                          <span className="text-white" style={{ fontSize: 10, fontWeight: 800 }}>%</span>
                        </div>
                        <span className="text-[#135543]" style={{ fontSize: 13, fontWeight: 700 }}>
                          {combo.comboLabel}
                        </span>
                      </div>
                      <span className="text-[#135543] px-2 py-0.5 rounded-full bg-[#3CCEA7]/20" style={{ fontSize: 12, fontWeight: 700 }}>
                        -{combo.totalPercent}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#135543]/70" style={{ fontSize: 11 }}>
                          Qtd. serviços ({combo.serviceCount})
                        </span>
                        <span className="text-[#135543]" style={{ fontSize: 11, fontWeight: 600 }}>
                          -{combo.comboPercent}%
                        </span>
                      </div>
                      {combo.valueBonusPercent > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#135543]/70" style={{ fontSize: 11 }}>
                            Valor agregado ({combo.valueBonusLabel})
                          </span>
                          <span className="text-[#135543]" style={{ fontSize: 11, fontWeight: 600 }}>
                            -{combo.valueBonusPercent}%
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-[#3CCEA7]/20">
                        <span className="text-[#135543]" style={{ fontSize: 12, fontWeight: 600 }}>
                          Economia na mensalidade
                        </span>
                        <span className="text-[#135543]" style={{ fontSize: 13, fontWeight: 700 }}>
                          -{formatCurrency(combo.discountAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Combo Progress - show next tier hint */}
                {combo.totalPercent < 20 && selectedServices.length >= 1 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[#4E6987]" style={{ fontSize: 11, fontWeight: 600 }}>
                        Progresso do combo
                      </span>
                      <span className="text-[#4E6987]" style={{ fontSize: 11 }}>
                        {(() => {
                          const nextTier = comboTiers.find((t) => t.min > combo.serviceCount);
                          return nextTier
                            ? `+${nextTier.min - combo.serviceCount} serviço${nextTier.min - combo.serviceCount > 1 ? "s" : ""} → ${nextTier.label} (-${nextTier.discount}%)`
                            : "Máximo atingido";
                        })()}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F6F7F9] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3CCEA7] to-[#0483AB] transition-all duration-500"
                        style={{ width: `${Math.min(100, (combo.serviceCount / 7) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Extra Manual Discount */}
                <div className="mb-4 pb-4 border-b border-[#DDE3EC]">
                  <label className="text-[#4E6987] block mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
                    Desconto adicional (%)
                  </label>
                  <input
                    type="number"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 bg-[#F6F7F9] border border-[#DDE3EC] rounded-lg text-[#122232] focus:border-[#0483AB] focus:outline-none"
                    style={{ fontSize: 14 }}
                    placeholder="0"
                  />
                  <p className="text-[#4E6987] mt-1" style={{ fontSize: 10 }}>
                    Aplicado sobre a mensalidade já com desconto combo.
                  </p>
                </div>

                {/* Totals */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4E6987]" style={{ fontSize: 13 }}>
                      Mensalidade (s/ desconto)
                    </span>
                    <span className="text-[#4E6987] line-through" style={{ fontSize: 13 }}>
                      {combo.totalPercent > 0 ? formatCurrency(totals.monthlyBeforeCombo) : ""}
                    </span>
                  </div>
                  {combo.totalPercent > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#135543]" style={{ fontSize: 13 }}>
                        Combo -{combo.totalPercent}%
                      </span>
                      <span className="text-[#135543]" style={{ fontSize: 14, fontWeight: 600 }}>
                        -{formatCurrency(totals.comboDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[#4E6987]" style={{ fontSize: 13 }}>
                      Mensalidade final
                    </span>
                    <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 700 }}>
                      {formatCurrency(totals.finalMonthly)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#4E6987]" style={{ fontSize: 13 }}>
                      Implementação (único)
                    </span>
                    <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 600 }}>
                      {formatCurrency(totals.totalImpl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#4E6987]" style={{ fontSize: 13 }}>
                      Horas estimadas
                    </span>
                    <span className="text-[#122232]" style={{ fontSize: 14, fontWeight: 600 }}>
                      {totals.totalHours}h/mês
                    </span>
                  </div>
                  {globalDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#ED5200]" style={{ fontSize: 13 }}>
                        Desc. adicional ({globalDiscount}%)
                      </span>
                      <span className="text-[#ED5200]" style={{ fontSize: 14, fontWeight: 600 }}>
                        -{formatCurrency(totals.extraDiscountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-[#DDE3EC]">
                    <span className="text-[#122232]" style={{ fontSize: 15, fontWeight: 700 }}>
                      Total Geral
                    </span>
                    <span className="text-[#0483AB]" style={{ fontSize: 22, fontWeight: 700 }}>
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="p-3 rounded-lg bg-[#D9F8EF] flex items-start gap-2">
                    <Info size={16} className="text-[#3CCEA7] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#135543]" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
                        Desconto Combo Progressivo
                      </p>
                      <p className="text-[#135543]/80" style={{ fontSize: 11, lineHeight: 1.5 }}>
                        2 serviços: -5% · 3: -8% · 4: -12% · 5: -15% · 6: -18% · 7+: -20%.
                        Bônus de valor: +2% (≥R$5k), +3% (≥R$10k), +5% (≥R$20k). Máx: -30%.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#DCF0FF] flex items-start gap-2">
                    <Info size={16} className="text-[#0483AB] shrink-0 mt-0.5" />
                    <p className="text-[#025E7B]" style={{ fontSize: 11, lineHeight: 1.5 }}>
                      Recorrência: Trimestral -5%, Semestral -10%, Anual -15%.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
    </div>
  );
}