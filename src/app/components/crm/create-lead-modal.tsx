import { useState, useRef, useEffect } from "react";
import {
  X,
  Heart,
  User,
  Envelope,
  Phone,
  Briefcase,
  Building,
  MapPin,
  CircleNotch,
  CaretDown,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { createLead, generateCrmId } from "./crm-api";
import { toast } from "sonner";
import { useCreateLead } from "./create-lead-context";

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const ff = { fontFeatureSettings: "'ss01', 'ss04', 'ss05', 'ss07'" };

/* ------------------------------------------------------------------ */
/*  Origin options                                                     */
/* ------------------------------------------------------------------ */

const ORIGIN_OPTIONS = [
  "Email",
  "LinkedIn",
  "Telefone",
  "Site",
  "Indicação",
  "Evento",
  "Google Ads",
  "Meta Ads",
  "Orgânico",
  "Outro",
];

/* ------------------------------------------------------------------ */
/*  Input Field                                                        */
/* ------------------------------------------------------------------ */

function FormInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: "duotone" | "regular"; className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label
        className="text-[#28415c] uppercase"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}
      >
        {label}
        {required && <span className="text-[#ED5200] ml-[2px]">*</span>}
      </label>
      <div className="flex items-center gap-[8px] h-[38px] px-[12px] rounded-[10px] border-[1.5px] border-[#DDE3EC] bg-[#f6f7f9] focus-within:border-[#07abde] focus-within:bg-white transition-colors">
        <Icon size={15} weight="duotone" className="text-[#98989d] shrink-0" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[#122232] placeholder:text-[#C8CFDB]"
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Select Dropdown                                                    */
/* ------------------------------------------------------------------ */

function FormSelect({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  options,
  required,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: "duotone" | "regular"; className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="flex flex-col gap-[6px]">
      <label
        className="text-[#28415c] uppercase"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, ...ff }}
      >
        {label}
        {required && <span className="text-[#ED5200] ml-[2px]">*</span>}
      </label>
      <div className="relative" ref={ref}>
        <div
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-[8px] h-[38px] px-[12px] rounded-[10px] border-[1.5px] cursor-pointer transition-colors ${
            open ? "border-[#07abde] bg-white" : "border-[#DDE3EC] bg-[#f6f7f9] hover:border-[#C8CFDB]"
          }`}
        >
          <Icon size={15} weight="duotone" className="text-[#98989d] shrink-0" />
          <span
            className={`flex-1 truncate ${value ? "text-[#122232]" : "text-[#C8CFDB]"}`}
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.3, ...ff }}
          >
            {value || placeholder}
          </span>
          <CaretDown
            size={10}
            weight="bold"
            className={`text-[#4E6987] transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-[42px] left-0 right-0 z-50 bg-white rounded-[10px] overflow-hidden max-h-[180px] overflow-y-auto"
              style={{ border: "1.4px solid rgba(200,207,219,0.6)", boxShadow: "0px 4px 12px rgba(18,34,50,0.15)" }}
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`flex items-center w-full px-[12px] py-[8px] hover:bg-[#f6f7f9] transition-colors text-left cursor-pointer ${
                    value === opt ? "bg-[#DCF0FF]" : ""
                  }`}
                >
                  <span
                    className="text-[#122232] truncate"
                    style={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.3, ...ff }}
                  >
                    {opt}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

export function CreateLeadModal() {
  const { open, closeModal, notifyCreated } = useCreateLead();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [origin, setOrigin] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setOrigin("");
      setCompany("");
      setRole("");
      setSaving(false);
    }
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, closeModal]);

  const isValid = name.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);

    const newId = generateCrmId("LD");
    const now = new Date().toISOString().slice(0, 10);

    const payload = {
      id: newId,
      name: name.trim(),
      lastname: lastName.trim() || null,
      email: email.trim(),
      phone: phone.trim() || null,
      origin: origin || null,
      company: company.trim() || null,
      role: role.trim() || null,
      stage: "novo",
      owner: "Eu",
      qualification_progress: 0,
      last_activity_date: now,
      score: 0,
      is_active: true,
      is_deleted: false,
    };

    try {
      await createLead(payload);

      /* Build frontend-shape lead for local state update */
      const frontendLead = {
        id: newId,
        name: name.trim(),
        lastName: lastName.trim(),
        role: role.trim(),
        company: company.trim(),
        stage: "novo" as const,
        qualificationProgress: 0,
        lastActivityDate: now,
        comments: 0,
        calls: 0,
        owner: "Eu",
        origin: origin || "",
      };

      toast.success(`Lead ${name.trim()} ${lastName.trim()} criado!`);
      notifyCreated(frontendLead);
      closeModal();
    } catch (err) {
      console.error("Error creating lead:", err);
      toast.error("Erro ao criar lead. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#122232]/40 backdrop-blur-[4px]" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-[460px] max-w-[94vw] max-h-[90vh] overflow-y-auto bg-white rounded-[24px]"
            style={{ boxShadow: "0px 8px 30px rgba(18,34,50,0.25)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-[24px] pt-[20px] pb-[12px]">
              <div className="flex items-center gap-[10px]">
                <div className="flex items-center justify-center w-[36px] h-[36px] rounded-[10px] bg-[#feedca]">
                  <Heart size={18} weight="duotone" className="text-[#eac23d]" />
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-[#64676c] uppercase"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, lineHeight: "12px", ...ff }}
                  >
                    Criar
                  </span>
                  <span
                    className="text-[#122232]"
                    style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5, lineHeight: "22px", ...ff }}
                  >
                    Novo Lead
                  </span>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="flex items-center justify-center size-[32px] rounded-full hover:bg-[#f6f7f9] transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" className="text-[#4e6987]" />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-[24px] h-[1.5px] bg-[#DDE3EC]" />

            {/* Form */}
            <div className="px-[24px] py-[18px] flex flex-col gap-[14px]">
              {/* Row: Nome + Sobrenome */}
              <div className="grid grid-cols-2 gap-[12px]">
                <FormInput
                  label="Nome"
                  icon={User}
                  value={name}
                  onChange={setName}
                  placeholder="Nome do lead"
                  required
                />
                <FormInput
                  label="Sobrenome"
                  icon={User}
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Sobrenome"
                />
              </div>

              {/* Row: Email + Telefone */}
              <div className="grid grid-cols-2 gap-[12px]">
                <FormInput
                  label="Email"
                  icon={Envelope}
                  value={email}
                  onChange={setEmail}
                  placeholder="email@exemplo.com"
                  type="email"
                  required
                />
                <FormInput
                  label="Telefone"
                  icon={Phone}
                  value={phone}
                  onChange={setPhone}
                  placeholder="(00) 00000-0000"
                  type="tel"
                />
              </div>

              {/* Row: Empresa + Cargo */}
              <div className="grid grid-cols-2 gap-[12px]">
                <FormInput
                  label="Empresa"
                  icon={Building}
                  value={company}
                  onChange={setCompany}
                  placeholder="Nome da empresa"
                />
                <FormInput
                  label="Cargo"
                  icon={Briefcase}
                  value={role}
                  onChange={setRole}
                  placeholder="Cargo do lead"
                />
              </div>

              {/* Origin */}
              <FormSelect
                label="Origem"
                icon={MapPin}
                value={origin}
                onChange={setOrigin}
                placeholder="Selecione a origem"
                options={ORIGIN_OPTIONS}
              />
            </div>

            {/* Divider */}
            <div className="mx-[24px] h-[1.5px] bg-[#DDE3EC]" />

            {/* Footer */}
            <div className="flex items-center justify-end gap-[10px] px-[24px] py-[16px]">
              <button
                onClick={closeModal}
                className="flex items-center justify-center h-[38px] px-[20px] rounded-[500px] border-[1.5px] border-[#DDE3EC] text-[#4e6987] hover:bg-[#f6f7f9] transition-colors cursor-pointer"
                style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.3, ...ff }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || saving}
                className={`flex items-center justify-center gap-[6px] h-[38px] px-[20px] rounded-[500px] text-white transition-colors cursor-pointer ${
                  isValid && !saving
                    ? "bg-[#07ABDE] hover:bg-[#0483AB]"
                    : "bg-[#C8CFDB] cursor-not-allowed"
                }`}
                style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, ...ff }}
              >
                {saving && <CircleNotch size={14} weight="bold" className="animate-spin" />}
                {saving ? "Criando..." : "Criar Lead"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}